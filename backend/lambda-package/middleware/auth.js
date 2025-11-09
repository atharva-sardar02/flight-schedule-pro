"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractToken = extractToken;
exports.requireAuth = requireAuth;
exports.hasRole = hasRole;
exports.requiresMFA = requiresMFA;
exports.verifyMFA = verifyMFA;
exports.requireRole = requireRole;
const authService_1 = __importDefault(require("../services/authService"));
const logger_1 = __importDefault(require("../utils/logger"));
const db_1 = require("../utils/db");
function extractToken(event) {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
        return null;
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1] || null;
}
async function requireAuth(event) {
    try {
        const token = extractToken(event);
        if (!token) {
            logger_1.default.warn('Missing authorization token', {
                path: event.path,
                method: event.httpMethod,
            });
            return {
                authorized: false,
                response: {
                    statusCode: 401,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify({
                        error: 'Unauthorized',
                        message: 'Missing authorization token',
                    }),
                },
            };
        }
        const cognitoUser = await authService_1.default.verifyToken(token);
        const pool = (0, db_1.getDbPool)();
        const dbUser = await pool.query('SELECT id, email, first_name, last_name, phone_number, role, training_level, created_at, updated_at FROM users WHERE cognito_user_id = $1', [cognitoUser.id]);
        let user;
        if (dbUser.rows.length === 0) {
            logger_1.default.warn('User found in Cognito but not in database', { cognitoUserId: cognitoUser.id, path: event.path });
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
        logger_1.default.info('User authenticated', {
            userId: user.id,
            email: user.email,
            role: user.role,
            path: event.path,
        });
        return {
            authorized: true,
            user,
        };
    }
    catch (error) {
        logger_1.default.error('Authentication failed', { error, path: event.path });
        return {
            authorized: false,
            response: {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: 'Unauthorized',
                    message: 'Invalid or expired token',
                }),
            },
        };
    }
}
function hasRole(user, allowedRoles) {
    return allowedRoles.includes(user.role);
}
function requiresMFA(user) {
    return user.role === 'ADMIN';
}
async function verifyMFA(user, mfaToken) {
    if (!requiresMFA(user)) {
        return true;
    }
    if (!mfaToken) {
        return false;
    }
    return mfaToken.length > 0;
}
function requireRole(user, allowedRoles) {
    if (!hasRole(user, allowedRoles)) {
        logger_1.default.warn('Insufficient permissions', {
            userId: user.id,
            userRole: user.role,
            requiredRoles: allowedRoles,
        });
        return {
            authorized: false,
            response: {
                statusCode: 403,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: 'Forbidden',
                    message: 'Insufficient permissions',
                }),
            },
        };
    }
    return { authorized: true };
}
//# sourceMappingURL=auth.js.map