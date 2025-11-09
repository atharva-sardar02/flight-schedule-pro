"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const authService_1 = __importDefault(require("../../services/authService"));
const logger_1 = __importStar(require("../../utils/logger"));
const db_1 = require("../../utils/db");
const lambdaErrorHandler_1 = require("../../utils/lambdaErrorHandler");
const inputValidation_1 = require("../../utils/inputValidation");
async function handler(event) {
    const startTime = Date.now();
    (0, logger_1.logLambdaStart)('authAPI', event);
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    };
    try {
        if (event.httpMethod === 'OPTIONS') {
            (0, logger_1.logLambdaEnd)('authAPI', true, 200);
            return {
                statusCode: 200,
                headers,
                body: '',
            };
        }
        const path = event.path;
        const method = event.httpMethod;
        logger_1.default.info('Auth request received', { path, method });
        (0, logger_1.startPerformanceTimer)(`auth_${method}_${path}`);
        let result;
        if (path.endsWith('/login') && method === 'POST') {
            result = await handleLogin(event, headers);
        }
        else if (path.endsWith('/register') && method === 'POST') {
            result = await handleRegister(event, headers);
        }
        else if (path.endsWith('/refresh') && method === 'POST') {
            result = await handleRefreshToken(event, headers);
        }
        else if (path.endsWith('/me') && method === 'GET') {
            result = await handleGetCurrentUser(event, headers);
        }
        else {
            result = {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    error: 'Not Found',
                    message: `Route ${method} ${path} not found`,
                }),
            };
        }
        const duration = (0, logger_1.endPerformanceTimer)(`auth_${method}_${path}`);
        (0, logger_1.logLambdaEnd)('authAPI', true, result.statusCode);
        (0, logger_1.logAPICall)(path, method, result.statusCode, duration);
        return result;
    }
    catch (error) {
        return (0, lambdaErrorHandler_1.handleLambdaError)(error, {
            functionName: 'authAPI',
            event,
            defaultStatusCode: 500,
        });
    }
}
async function handleLogin(event, headers) {
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Bad Request',
                    message: 'Request body is required',
                }),
            };
        }
        const credentials = JSON.parse(event.body);
        const validation = (0, inputValidation_1.validateLoginRequest)(credentials);
        if (!validation.valid) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Validation Error',
                    message: 'Invalid input data',
                    errors: validation.errors,
                }),
            };
        }
        const tokens = await authService_1.default.login(credentials);
        const cognitoUser = await authService_1.default.verifyToken(tokens.accessToken);
        const pool = (0, db_1.getDbPool)();
        const dbUser = await pool.query('SELECT id, email, first_name, last_name, phone_number, role, training_level, created_at, updated_at FROM users WHERE cognito_user_id = $1', [cognitoUser.id]);
        let user;
        if (dbUser.rows.length === 0) {
            logger_1.default.warn('User found in Cognito but not in database', { cognitoUserId: cognitoUser.id });
            user = cognitoUser;
        }
        else {
            const userRow = dbUser.rows[0];
            user = {
                id: userRow.id,
                email: userRow.email,
                firstName: userRow.first_name,
                lastName: userRow.last_name,
                phoneNumber: userRow.phone_number,
                role: userRow.role,
                trainingLevel: userRow.training_level,
                createdAt: userRow.created_at,
                updatedAt: userRow.updated_at,
            };
        }
        logger_1.default.info('User logged in successfully', { userId: user.id, email: user.email });
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                user,
                tokens,
            }),
        };
    }
    catch (error) {
        logger_1.default.error('Login failed', { error, email: event.body ? JSON.parse(event.body).email : 'unknown' });
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({
                error: 'Authentication Failed',
                message: error.message || 'Invalid email or password',
            }),
        };
    }
}
async function handleRegister(event, headers) {
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Bad Request',
                    message: 'Request body is required',
                }),
            };
        }
        const data = JSON.parse(event.body);
        logger_1.default.info('Registration request received', {
            email: data.email,
            role: data.role,
            roleType: typeof data.role
        });
        const validation = (0, inputValidation_1.validateRegisterRequest)(data);
        if (!validation.valid) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Validation Error',
                    message: 'Invalid input data',
                    errors: validation.errors,
                }),
            };
        }
        const result = await authService_1.default.register(data);
        const pool = (0, db_1.getDbPool)();
        const client = await pool.connect();
        try {
            await client.query(`INSERT INTO users (cognito_user_id, email, first_name, last_name, phone_number, role, training_level, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`, [result.userId, data.email, data.firstName, data.lastName, data.phoneNumber || null, data.role, data.trainingLevel || null]);
            logger_1.default.info('User record created in database', { userId: result.userId });
        }
        finally {
            client.release();
        }
        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                message: 'User registered successfully',
                userId: result.userId,
                email: result.email,
            }),
        };
    }
    catch (error) {
        logger_1.default.error('Registration failed', { error });
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Registration Failed',
                message: error.message || 'Could not register user',
            }),
        };
    }
}
async function handleRefreshToken(event, headers) {
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Bad Request',
                    message: 'Request body is required',
                }),
            };
        }
        const data = JSON.parse(event.body);
        if (!data.refreshToken) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Bad Request',
                    message: 'Refresh token is required',
                }),
            };
        }
        const tokens = await authService_1.default.refreshToken(data.refreshToken);
        logger_1.default.info('Token refreshed successfully');
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ tokens }),
        };
    }
    catch (error) {
        logger_1.default.error('Token refresh failed', { error });
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({
                error: 'Token Refresh Failed',
                message: error.message || 'Invalid refresh token',
            }),
        };
    }
}
async function handleGetCurrentUser(event, headers) {
    try {
        const authHeader = event.headers.Authorization || event.headers.authorization;
        if (!authHeader) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    error: 'Unauthorized',
                    message: 'Missing authorization token',
                }),
            };
        }
        const token = authHeader.split(' ')[1];
        const cognitoUser = await authService_1.default.verifyToken(token);
        const pool = (0, db_1.getDbPool)();
        const dbUser = await pool.query('SELECT id, email, first_name, last_name, phone_number, role, training_level, created_at, updated_at FROM users WHERE cognito_user_id = $1', [cognitoUser.id]);
        if (dbUser.rows.length === 0) {
            logger_1.default.warn('User found in Cognito but not in database', { cognitoUserId: cognitoUser.id });
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ user: cognitoUser }),
            };
        }
        const userRow = dbUser.rows[0];
        const user = {
            id: userRow.id,
            email: userRow.email,
            firstName: userRow.first_name,
            lastName: userRow.last_name,
            phoneNumber: userRow.phone_number,
            role: userRow.role,
            trainingLevel: userRow.training_level,
            createdAt: userRow.created_at,
            updatedAt: userRow.updated_at,
        };
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ user }),
        };
    }
    catch (error) {
        logger_1.default.error('Get current user failed', { error });
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({
                error: 'Unauthorized',
                message: 'Invalid or expired token',
            }),
        };
    }
}
//# sourceMappingURL=auth.js.map