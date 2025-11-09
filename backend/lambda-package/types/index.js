"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = exports.BookingStatus = exports.TrainingLevel = void 0;
var TrainingLevel;
(function (TrainingLevel) {
    TrainingLevel["STUDENT_PILOT"] = "STUDENT_PILOT";
    TrainingLevel["PRIVATE_PILOT"] = "PRIVATE_PILOT";
    TrainingLevel["INSTRUMENT_RATED"] = "INSTRUMENT_RATED";
})(TrainingLevel || (exports.TrainingLevel = TrainingLevel = {}));
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["CONFIRMED"] = "CONFIRMED";
    BookingStatus["AT_RISK"] = "AT_RISK";
    BookingStatus["RESCHEDULING"] = "RESCHEDULING";
    BookingStatus["CANCELLED"] = "CANCELLED";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["WEATHER_ALERT"] = "WEATHER_ALERT";
    NotificationType["OPTIONS_AVAILABLE"] = "OPTIONS_AVAILABLE";
    NotificationType["DEADLINE_REMINDER"] = "DEADLINE_REMINDER";
    NotificationType["CONFIRMATION"] = "CONFIRMATION";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
//# sourceMappingURL=index.js.map