"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RescheduleEngine = void 0;
const langgraph_1 = require("@langchain/langgraph");
const openai_1 = require("@langchain/openai");
const date_fns_1 = require("date-fns");
const weatherValidator_1 = require("./weatherValidator");
const weatherService_1 = require("../../services/weatherService");
const availabilityService_1 = require("../../services/availabilityService");
const rescheduleOptionsService_1 = require("../../services/rescheduleOptionsService");
const logger_1 = require("../../utils/logger");
class RescheduleEngine {
    pool;
    weatherService;
    weatherValidator;
    availabilityService;
    rescheduleOptionsService;
    llm;
    constructor(pool) {
        this.pool = pool;
        this.weatherService = new weatherService_1.WeatherService();
        this.weatherValidator = new weatherValidator_1.WeatherValidator(this.weatherService);
        this.availabilityService = new availabilityService_1.AvailabilityService(pool);
        this.rescheduleOptionsService = new rescheduleOptionsService_1.RescheduleOptionsService(pool);
        this.llm = new openai_1.ChatOpenAI({
            modelName: 'gpt-4o-mini',
            temperature: 0.3,
            maxTokens: 2000,
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async generateRescheduleOptions(bookingId) {
        try {
            (0, logger_1.logInfo)('Starting AI rescheduling', { bookingId });
            const booking = await this.getBookingDetails(bookingId);
            if (!booking) {
                throw new Error('Booking not found');
            }
            const workflow = this.createWorkflow();
            const initialState = {
                bookingId,
                originalTime: booking.scheduled_time,
                studentId: booking.student_id,
                instructorId: booking.instructor_id,
                trainingLevel: booking.training_level,
                departureAirport: booking.departure_airport,
                arrivalAirport: booking.arrival_airport,
                candidateSlots: [],
                validatedSlots: [],
                finalOptions: [],
            };
            const result = await workflow.invoke(initialState);
            if (result.error) {
                throw new Error(String(result.error || 'Unknown error'));
            }
            await this.rescheduleOptionsService.deleteOptionsByBooking(bookingId);
            await this.rescheduleOptionsService.createOptions(result.finalOptions.map((opt) => ({
                bookingId,
                suggestedDatetime: opt.datetime,
                weatherForecast: opt.weatherForecast,
                aiConfidenceScore: opt.confidenceScore,
            })));
            (0, logger_1.logInfo)('AI rescheduling completed', {
                bookingId,
                optionsGenerated: result.finalOptions.length,
            });
            return result.finalOptions;
        }
        catch (error) {
            (0, logger_1.logError)('AI rescheduling failed', error, { bookingId });
            throw error;
        }
    }
    createWorkflow() {
        const workflow = new langgraph_1.StateGraph({
            channels: {
                bookingId: null,
                originalTime: null,
                studentId: null,
                instructorId: null,
                trainingLevel: null,
                departureAirport: null,
                arrivalAirport: null,
                candidateSlots: null,
                validatedSlots: null,
                finalOptions: null,
                error: null,
            },
        });
        workflow.addNode('findCandidates', this.findCandidateSlots.bind(this));
        workflow.addNode('checkWeather', this.checkWeatherForSlots.bind(this));
        workflow.addNode('checkAvailability', this.checkAvailabilityForSlots.bind(this));
        workflow.addNode('rankOptions', this.rankAndSelectTop3.bind(this));
        workflow.addEdge(langgraph_1.START, 'findCandidates');
        workflow.addEdge('findCandidates', 'checkWeather');
        workflow.addEdge('checkWeather', 'checkAvailability');
        workflow.addEdge('checkAvailability', 'rankOptions');
        workflow.addEdge('rankOptions', langgraph_1.END);
        return workflow.compile();
    }
    async findCandidateSlots(state) {
        try {
            (0, logger_1.logInfo)('Finding candidate slots', { bookingId: state.bookingId });
            const candidates = [];
            const startDate = new Date();
            const endDate = (0, date_fns_1.addDays)(startDate, 7);
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                for (let hour = 8; hour <= 18; hour += 2) {
                    const slotTime = new Date(currentDate);
                    slotTime.setHours(hour, 0, 0, 0);
                    if (slotTime < new Date()) {
                        continue;
                    }
                    const hoursDiff = Math.abs((slotTime.getTime() - state.originalTime.getTime()) / (1000 * 60 * 60));
                    const proximityScore = Math.max(0, 100 - hoursDiff);
                    candidates.push({
                        datetime: slotTime,
                        score: proximityScore,
                        reason: 'Generated slot',
                    });
                }
                currentDate = (0, date_fns_1.addDays)(currentDate, 1);
            }
            (0, logger_1.logInfo)('Candidate slots found', {
                bookingId: state.bookingId,
                count: candidates.length,
            });
            return { candidateSlots: candidates };
        }
        catch (error) {
            (0, logger_1.logError)('Failed to find candidate slots', error);
            return { error: error.message };
        }
    }
    async checkWeatherForSlots(state) {
        try {
            (0, logger_1.logInfo)('Checking weather for slots', { bookingId: state.bookingId });
            const validated = [];
            for (const candidate of state.candidateSlots) {
                const weatherValidation = await this.weatherValidator.validateFlightWeather(state.departureAirport, state.arrivalAirport, candidate.datetime, state.trainingLevel);
                validated.push({
                    datetime: candidate.datetime,
                    weatherValid: weatherValidation.isValid,
                    weatherConfidence: weatherValidation.confidence,
                    availabilityValid: false,
                    overallScore: candidate.score,
                    weatherData: weatherValidation.weatherData,
                });
            }
            const weatherValidSlots = validated.filter((s) => s.weatherValid);
            (0, logger_1.logInfo)('Weather check complete', {
                bookingId: state.bookingId,
                totalSlots: validated.length,
                weatherValidSlots: weatherValidSlots.length,
            });
            return { validatedSlots: weatherValidSlots };
        }
        catch (error) {
            (0, logger_1.logError)('Failed to check weather', error);
            return { error: error.message };
        }
    }
    async checkAvailabilityForSlots(state) {
        try {
            (0, logger_1.logInfo)('Checking availability for slots', { bookingId: state.bookingId });
            const validated = [];
            for (const slot of state.validatedSlots) {
                const studentAvailable = await this.checkUserAvailability(state.studentId, slot.datetime);
                const instructorAvailable = await this.checkUserAvailability(state.instructorId, slot.datetime);
                const availabilityValid = studentAvailable && instructorAvailable;
                validated.push({
                    ...slot,
                    availabilityValid,
                    overallScore: availabilityValid ? slot.overallScore : 0,
                });
            }
            const fullyValidSlots = validated.filter((s) => s.availabilityValid);
            (0, logger_1.logInfo)('Availability check complete', {
                bookingId: state.bookingId,
                weatherValidSlots: state.validatedSlots.length,
                fullyValidSlots: fullyValidSlots.length,
            });
            return { validatedSlots: fullyValidSlots };
        }
        catch (error) {
            (0, logger_1.logError)('Failed to check availability', error);
            return { error: error.message };
        }
    }
    async rankAndSelectTop3(state) {
        try {
            (0, logger_1.logInfo)('Ranking and selecting top 3 options', { bookingId: state.bookingId });
            if (state.validatedSlots.length === 0) {
                (0, logger_1.logWarn)('No valid slots found, unable to generate options', {
                    bookingId: state.bookingId,
                });
                return { finalOptions: [], error: 'No valid time slots available in 7-day window' };
            }
            const sorted = state.validatedSlots.sort((a, b) => {
                const scoreA = a.overallScore + a.weatherConfidence * 10;
                const scoreB = b.overallScore + b.weatherConfidence * 10;
                return scoreB - scoreA;
            });
            const top3 = sorted.slice(0, 3);
            const finalOptions = top3.map((slot, index) => ({
                datetime: slot.datetime,
                weatherForecast: slot.weatherData,
                confidenceScore: (slot.overallScore + slot.weatherConfidence * 10) / 110,
            }));
            (0, logger_1.logInfo)('Top 3 options selected', {
                bookingId: state.bookingId,
                options: finalOptions.map((opt) => ({
                    datetime: opt.datetime.toISOString(),
                    confidence: opt.confidenceScore.toFixed(2),
                })),
            });
            return { finalOptions };
        }
        catch (error) {
            (0, logger_1.logError)('Failed to rank options', error);
            return { error: error.message };
        }
    }
    async checkUserAvailability(userId, datetime) {
        try {
            const dateStr = (0, date_fns_1.format)(datetime, 'yyyy-MM-dd');
            const timeStr = (0, date_fns_1.format)(datetime, 'HH:mm');
            const availability = await this.availabilityService.getAvailability({
                userId,
                startDate: dateStr,
                endDate: dateStr,
            });
            return availability.slots.some((slot) => {
                const slotDate = (0, date_fns_1.format)(new Date(slot.date), 'yyyy-MM-dd');
                if (slotDate !== dateStr)
                    return false;
                if (!slot.isAvailable)
                    return false;
                const slotStart = slot.startTime;
                const slotEnd = slot.endTime;
                return timeStr >= slotStart && timeStr <= slotEnd;
            });
        }
        catch (error) {
            (0, logger_1.logError)('Failed to check user availability', error, { userId, datetime });
            return false;
        }
    }
    async getBookingDetails(bookingId) {
        const result = await this.pool.query(`SELECT b.*, u.training_level
       FROM bookings b
       JOIN users u ON b.student_id = u.id
       WHERE b.id = $1`, [bookingId]);
        return result.rows[0] || null;
    }
}
exports.RescheduleEngine = RescheduleEngine;
//# sourceMappingURL=rescheduleEngine.js.map