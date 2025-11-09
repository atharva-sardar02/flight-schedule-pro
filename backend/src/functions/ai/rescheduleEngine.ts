/**
 * AI Rescheduling Engine
 * LangGraph workflow for intelligent flight rescheduling
 * Generates 3 optimal time slots considering weather, availability, and constraints
 */

import { Pool } from 'pg';
import { StateGraph, END, START } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { addDays, addHours, isWithinInterval, parse, format } from 'date-fns';
import { WeatherValidator } from './weatherValidator';
import { WeatherService } from '../../services/weatherService';
import { AvailabilityService } from '../../services/availabilityService';
import { RescheduleOptionsService } from '../../services/rescheduleOptionsService';
import { TrainingLevel } from '../../types/weather';
import { logInfo, logWarn, logError } from '../../utils/logger';

// State interface for LangGraph
interface RescheduleState {
  bookingId: string;
  originalTime: Date;
  studentId: string;
  instructorId: string;
  trainingLevel: TrainingLevel;
  departureAirport: string;
  arrivalAirport: string;
  candidateSlots: CandidateSlot[];
  validatedSlots: ValidatedSlot[];
  finalOptions: RescheduleOption[];
  error?: string;
}

interface CandidateSlot {
  datetime: Date;
  score: number;
  reason: string;
}

interface ValidatedSlot {
  datetime: Date;
  weatherValid: boolean;
  weatherConfidence: number;
  availabilityValid: boolean;
  overallScore: number;
  weatherData: any;
}

interface RescheduleOption {
  datetime: Date;
  weatherForecast: any;
  confidenceScore: number;
}

export class RescheduleEngine {
  private pool: Pool;
  private weatherService: WeatherService;
  private weatherValidator: WeatherValidator;
  private availabilityService: AvailabilityService;
  private rescheduleOptionsService: RescheduleOptionsService;
  private llm: ChatOpenAI;

  constructor(pool: Pool) {
    this.pool = pool;
    this.weatherService = new WeatherService();
    this.weatherValidator = new WeatherValidator(this.weatherService);
    this.availabilityService = new AvailabilityService(pool);
    this.rescheduleOptionsService = new RescheduleOptionsService(pool);
    
    // Initialize OpenAI ChatGPT
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini', // or 'gpt-4' for better performance
      temperature: 0.3,
      maxTokens: 2000,
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Main entry point: Generate 3 optimal rescheduling options
   */
  async generateRescheduleOptions(bookingId: string): Promise<RescheduleOption[]> {
    try {
      logInfo('Starting AI rescheduling', { bookingId });

      // Get booking details
      const booking = await this.getBookingDetails(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Create the LangGraph workflow
      const workflow = this.createWorkflow();

      // Initial state
      const initialState: RescheduleState = {
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

      // Execute workflow
      const result = await (workflow as any).invoke(initialState);

      if (result.error) {
        throw new Error(String(result.error || 'Unknown error'));
      }

      // Save options to database
      await this.rescheduleOptionsService.deleteOptionsByBooking(bookingId);
      await this.rescheduleOptionsService.createOptions(
        (result.finalOptions as any[]).map((opt: any) => ({
          bookingId,
          suggestedDatetime: opt.datetime,
          weatherForecast: opt.weatherForecast,
          aiConfidenceScore: opt.confidenceScore,
        }))
      );

      logInfo('AI rescheduling completed', {
        bookingId,
        optionsGenerated: (result.finalOptions as any[]).length,
      });

      return result.finalOptions as RescheduleOption[];
    } catch (error: any) {
      logError('AI rescheduling failed', error, { bookingId });
      throw error;
    }
  }

  /**
   * Create the LangGraph workflow
   */
  private createWorkflow() {
    const workflow = new StateGraph<RescheduleState>({
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

    // Define workflow nodes
    workflow.addNode('findCandidates', this.findCandidateSlots.bind(this));
    workflow.addNode('checkWeather', this.checkWeatherForSlots.bind(this));
    workflow.addNode('checkAvailability', this.checkAvailabilityForSlots.bind(this));
    workflow.addNode('rankOptions', this.rankAndSelectTop3.bind(this));

    // Define edges
    (workflow as any).addEdge(START, 'findCandidates');
    (workflow as any).addEdge('findCandidates', 'checkWeather');
    (workflow as any).addEdge('checkWeather', 'checkAvailability');
    (workflow as any).addEdge('checkAvailability', 'rankOptions');
    (workflow as any).addEdge('rankOptions', END);

    return workflow.compile();
  }

  /**
   * Step 1: Find candidate time slots within 7-day window
   */
  private async findCandidateSlots(state: RescheduleState): Promise<Partial<RescheduleState>> {
    try {
      logInfo('Finding candidate slots', { bookingId: state.bookingId });

      const candidates: CandidateSlot[] = [];
      const startDate = new Date();
      const endDate = addDays(startDate, 7);

      // Generate time slots (every 2 hours during typical flying hours: 8AM - 6PM)
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        for (let hour = 8; hour <= 18; hour += 2) {
          const slotTime = new Date(currentDate);
          slotTime.setHours(hour, 0, 0, 0);

          // Skip if in the past
          if (slotTime < new Date()) {
            continue;
          }

          // Calculate proximity score (closer to original time = better)
          const hoursDiff = Math.abs(
            (slotTime.getTime() - state.originalTime.getTime()) / (1000 * 60 * 60)
          );
          const proximityScore = Math.max(0, 100 - hoursDiff);

          candidates.push({
            datetime: slotTime,
            score: proximityScore,
            reason: 'Generated slot',
          });
        }
        currentDate = addDays(currentDate, 1);
      }

      logInfo('Candidate slots found', {
        bookingId: state.bookingId,
        count: candidates.length,
      });

      return { candidateSlots: candidates };
    } catch (error: any) {
      logError('Failed to find candidate slots', error);
      return { error: error.message };
    }
  }

  /**
   * Step 2: Check weather for all candidate slots
   */
  private async checkWeatherForSlots(state: RescheduleState): Promise<Partial<RescheduleState>> {
    try {
      logInfo('Checking weather for slots', { bookingId: state.bookingId });

      const validated: ValidatedSlot[] = [];

      for (const candidate of state.candidateSlots) {
        const weatherValidation = await this.weatherValidator.validateFlightWeather(
          state.departureAirport,
          state.arrivalAirport,
          candidate.datetime,
          state.trainingLevel
        );

        validated.push({
          datetime: candidate.datetime,
          weatherValid: weatherValidation.isValid,
          weatherConfidence: weatherValidation.confidence,
          availabilityValid: false, // Will check in next step
          overallScore: candidate.score,
          weatherData: weatherValidation.weatherData,
        });
      }

      // Filter to only weather-valid slots
      const weatherValidSlots = validated.filter((s) => s.weatherValid);

      logInfo('Weather check complete', {
        bookingId: state.bookingId,
        totalSlots: validated.length,
        weatherValidSlots: weatherValidSlots.length,
      });

      return { validatedSlots: weatherValidSlots };
    } catch (error: any) {
      logError('Failed to check weather', error);
      return { error: error.message };
    }
  }

  /**
   * Step 3: Check availability for weather-valid slots
   */
  private async checkAvailabilityForSlots(
    state: RescheduleState
  ): Promise<Partial<RescheduleState>> {
    try {
      logInfo('Checking availability for slots', { bookingId: state.bookingId });

      const validated: ValidatedSlot[] = [];

      for (const slot of state.validatedSlots) {
        // Check student availability
        const studentAvailable = await this.checkUserAvailability(
          state.studentId,
          slot.datetime
        );

        // Check instructor availability
        const instructorAvailable = await this.checkUserAvailability(
          state.instructorId,
          slot.datetime
        );

        const availabilityValid = studentAvailable && instructorAvailable;

        validated.push({
          ...slot,
          availabilityValid,
          overallScore: availabilityValid ? slot.overallScore : 0,
        });
      }

      // Filter to only fully valid slots
      const fullyValidSlots = validated.filter((s) => s.availabilityValid);

      logInfo('Availability check complete', {
        bookingId: state.bookingId,
        weatherValidSlots: state.validatedSlots.length,
        fullyValidSlots: fullyValidSlots.length,
      });

      return { validatedSlots: fullyValidSlots };
    } catch (error: any) {
      logError('Failed to check availability', error);
      return { error: error.message };
    }
  }

  /**
   * Step 4: Rank and select top 3 options
   */
  private async rankAndSelectTop3(state: RescheduleState): Promise<Partial<RescheduleState>> {
    try {
      logInfo('Ranking and selecting top 3 options', { bookingId: state.bookingId });

      if (state.validatedSlots.length === 0) {
        logWarn('No valid slots found, unable to generate options', {
          bookingId: state.bookingId,
        });
        return { finalOptions: [], error: 'No valid time slots available in 7-day window' };
      }

      // Sort by overall score (weather confidence + proximity)
      const sorted = state.validatedSlots.sort((a, b) => {
        const scoreA = a.overallScore + a.weatherConfidence * 10;
        const scoreB = b.overallScore + b.weatherConfidence * 10;
        return scoreB - scoreA;
      });

      // Take top 3
      const top3 = sorted.slice(0, 3);

      const finalOptions: RescheduleOption[] = top3.map((slot, index) => ({
        datetime: slot.datetime,
        weatherForecast: slot.weatherData,
        confidenceScore: (slot.overallScore + slot.weatherConfidence * 10) / 110, // Normalize to 0-1
      }));

      logInfo('Top 3 options selected', {
        bookingId: state.bookingId,
        options: finalOptions.map((opt) => ({
          datetime: opt.datetime.toISOString(),
          confidence: opt.confidenceScore.toFixed(2),
        })),
      });

      return { finalOptions };
    } catch (error: any) {
      logError('Failed to rank options', error);
      return { error: error.message };
    }
  }

  /**
   * Check if a user is available at a specific time
   */
  private async checkUserAvailability(userId: string, datetime: Date): Promise<boolean> {
    try {
      const dateStr = format(datetime, 'yyyy-MM-dd');
      const timeStr = format(datetime, 'HH:mm');

      // Get availability for that day
      const availability = await this.availabilityService.getAvailability({
        userId,
        startDate: dateStr,
        endDate: dateStr,
      });

      // Check if any slot covers the requested time
      return availability.slots.some((slot) => {
        const slotDate = format(new Date(slot.date), 'yyyy-MM-dd');
        if (slotDate !== dateStr) return false;
        if (!slot.isAvailable) return false;

        // Check if time falls within slot
        const slotStart = slot.startTime;
        const slotEnd = slot.endTime;

        return timeStr >= slotStart && timeStr <= slotEnd;
      });
    } catch (error: any) {
      logError('Failed to check user availability', error, { userId, datetime });
      return false;
    }
  }

  /**
   * Get booking details from database
   */
  private async getBookingDetails(bookingId: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT b.*, u.training_level
       FROM bookings b
       JOIN users u ON b.student_id = u.id
       WHERE b.id = $1`,
      [bookingId]
    );

    return result.rows[0] || null;
  }
}

