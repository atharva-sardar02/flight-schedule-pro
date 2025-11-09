"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = void 0;
exports.retryWithBackoff = retryWithBackoff;
exports.retryWithJitter = retryWithJitter;
const logger_1 = require("./logger");
const DEFAULT_OPTIONS = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
    retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH'],
    onRetry: () => { },
};
async function retryWithBackoff(fn, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError;
    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            const isRetryable = opts.retryableErrors.some((code) => error.code === code) ||
                error.message?.includes('timeout') ||
                error.message?.includes('ECONNRESET') ||
                error.response?.status >= 500;
            if (attempt === opts.maxRetries || !isRetryable) {
                throw error;
            }
            const delay = Math.min(opts.initialDelay * Math.pow(opts.backoffFactor, attempt), opts.maxDelay);
            (0, logger_1.logWarn)(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms`, {
                error: error.message,
                attempt: attempt + 1,
                delay,
            });
            opts.onRetry(error, attempt + 1);
            await sleep(delay);
        }
    }
    throw lastError;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function retryWithJitter(fn, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    return retryWithBackoff(fn, {
        ...opts,
        initialDelay: opts.initialDelay * (0.5 + Math.random() * 0.5),
    });
}
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (CircuitState = {}));
class CircuitBreaker {
    name;
    state = CircuitState.CLOSED;
    failureCount = 0;
    lastFailureTime = 0;
    successCount = 0;
    failureThreshold;
    resetTimeout;
    monitoringPeriod;
    constructor(name, options = {}) {
        this.name = name;
        this.failureThreshold = options.failureThreshold || 5;
        this.resetTimeout = options.resetTimeout || 60000;
        this.monitoringPeriod = options.monitoringPeriod || 10000;
    }
    async execute(fn) {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
                (0, logger_1.logWarn)(`Circuit breaker ${this.name} entering HALF_OPEN state`);
                this.state = CircuitState.HALF_OPEN;
                this.successCount = 0;
            }
            else {
                throw new Error(`Circuit breaker ${this.name} is OPEN - service temporarily unavailable`);
            }
        }
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failureCount = 0;
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= 2) {
                (0, logger_1.logWarn)(`Circuit breaker ${this.name} entering CLOSED state`);
                this.state = CircuitState.CLOSED;
            }
        }
    }
    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.state === CircuitState.HALF_OPEN) {
            (0, logger_1.logError)(`Circuit breaker ${this.name} entering OPEN state (test failed)`);
            this.state = CircuitState.OPEN;
        }
        else if (this.failureCount >= this.failureThreshold) {
            (0, logger_1.logError)(`Circuit breaker ${this.name} entering OPEN state (threshold exceeded)`, undefined, {
                failureCount: this.failureCount,
                threshold: this.failureThreshold,
            });
            this.state = CircuitState.OPEN;
        }
    }
    getState() {
        return this.state;
    }
    reset() {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        (0, logger_1.logWarn)(`Circuit breaker ${this.name} manually reset`);
    }
}
exports.CircuitBreaker = CircuitBreaker;
//# sourceMappingURL=retry.js.map