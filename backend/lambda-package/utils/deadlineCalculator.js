"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDeadline = calculateDeadline;
exports.isDeadlinePassed = isDeadlinePassed;
exports.getTimeUntilDeadline = getTimeUntilDeadline;
exports.formatDeadline = formatDeadline;
exports.isDeadlineApproaching = isDeadlineApproaching;
const date_fns_1 = require("date-fns");
const logger_1 = require("../utils/logger");
function calculateDeadline(scheduledTime, notificationSentAt = new Date()) {
    const thirtyMinutesBeforeDeparture = (0, date_fns_1.subMinutes)(scheduledTime, 30);
    const twelveHoursAfterNotification = (0, date_fns_1.addHours)(notificationSentAt, 12);
    const deadline = (0, date_fns_1.min)([thirtyMinutesBeforeDeparture, twelveHoursAfterNotification]);
    (0, logger_1.logInfo)('Calculated preference deadline', {
        scheduledTime: scheduledTime.toISOString(),
        notificationSentAt: notificationSentAt.toISOString(),
        deadline: deadline.toISOString(),
        thirtyMinutesBeforeDeparture: thirtyMinutesBeforeDeparture.toISOString(),
        twelveHoursAfterNotification: twelveHoursAfterNotification.toISOString(),
    });
    return deadline;
}
function isDeadlinePassed(deadline) {
    return new Date() > deadline;
}
function getTimeUntilDeadline(deadline) {
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
}
function formatDeadline(deadline) {
    const minutesRemaining = getTimeUntilDeadline(deadline);
    if (minutesRemaining === 0) {
        return 'Deadline passed';
    }
    const hours = Math.floor(minutesRemaining / 60);
    const minutes = minutesRemaining % 60;
    if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''} remaining`;
    }
    if (hours > 0) {
        return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
}
function isDeadlineApproaching(deadline) {
    const minutesRemaining = getTimeUntilDeadline(deadline);
    return minutesRemaining > 0 && minutesRemaining <= 120;
}
//# sourceMappingURL=deadlineCalculator.js.map