"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("./utils/logger"));
const auth_1 = require("./functions/api/auth");
const bookings_1 = require("./functions/api/bookings");
const availability_1 = require("./functions/api/availability");
const reschedule_1 = require("./functions/api/reschedule");
const preferences_1 = require("./functions/api/preferences");
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const authService_1 = __importDefault(require("./services/authService"));
const db_1 = require("./utils/db");
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
console.log('='.repeat(80));
console.log('🔧 Environment Configuration Check');
console.log('='.repeat(80));
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('COGNITO_USER_POOL_ID:', process.env.COGNITO_USER_POOL_ID);
console.log('COGNITO_CLIENT_ID:', process.env.COGNITO_CLIENT_ID ? '✅ Set' : '❌ Not Set');
console.log('DATABASE_HOST:', process.env.DATABASE_HOST);
console.log('DATABASE_NAME:', process.env.DATABASE_NAME);
console.log('='.repeat(80));
console.log('');
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)({
    origin: process.env.VITE_API_BASE_URL?.replace(/:\d+$/, ':3000') || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'flight-schedule-pro-backend',
        timestamp: new Date().toISOString()
    });
});
if (process.env.NODE_ENV === 'development') {
    app.post('/dev/confirm-user', async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }
            const client = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({
                region: process.env.AWS_REGION || 'us-east-1',
            });
            const command = new client_cognito_identity_provider_1.AdminConfirmSignUpCommand({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: email,
            });
            await client.send(command);
            logger_1.default.info('User confirmed via dev endpoint', { email });
            res.json({ success: true, message: `User ${email} confirmed successfully` });
        }
        catch (error) {
            logger_1.default.error('Failed to confirm user', { error });
            res.status(500).json({ error: error.message || 'Failed to confirm user' });
        }
    });
    app.post('/dev/sync-user', async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: 'Authorization header required' });
            }
            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: 'Token required' });
            }
            const user = await authService_1.default.verifyToken(token);
            const pool = (0, db_1.getDbPool)();
            const existingUser = await pool.query('SELECT id FROM users WHERE cognito_user_id = $1', [user.id]);
            if (existingUser.rows.length > 0) {
                return res.json({
                    success: true,
                    message: 'User already exists in database',
                    userId: existingUser.rows[0].id,
                });
            }
            const result = await pool.query(`INSERT INTO users (cognito_user_id, email, first_name, last_name, phone_number, role, training_level, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           RETURNING id`, [
                user.id,
                user.email,
                user.firstName,
                user.lastName,
                user.phoneNumber || null,
                user.role,
                user.trainingLevel || null,
            ]);
            logger_1.default.info('User synced to database', { userId: result.rows[0].id, email: user.email });
            res.json({
                success: true,
                message: 'User synced to database successfully',
                userId: result.rows[0].id,
            });
        }
        catch (error) {
            logger_1.default.error('Failed to sync user', { error });
            res.status(500).json({ error: error.message || 'Failed to sync user' });
        }
    });
}
app.get('/api', (req, res) => {
    res.json({
        message: 'Flight Schedule Pro API',
        version: '0.1.0',
        endpoints: [
            'GET /health - Health check',
            'GET /api - API info',
            'POST /auth/register - User registration',
            'POST /auth/login - User login',
            'POST /auth/refresh - Refresh token',
            'GET /auth/me - Get current user',
            'GET /bookings - List bookings',
            'POST /bookings - Create booking',
            'GET /bookings/:id - Get booking',
            'PUT /bookings/:id - Update booking',
            'DELETE /bookings/:id - Delete booking',
            'POST /bookings/:id/cancel - Cancel booking',
            'GET /availability - Get availability',
            'GET /availability/recurring - List recurring patterns',
            'POST /availability/recurring - Create recurring pattern',
            'PUT /availability/recurring/:id - Update recurring pattern',
            'DELETE /availability/recurring/:id - Delete recurring pattern',
            'GET /availability/overrides - List overrides',
            'POST /availability/overrides - Create override',
            'PUT /availability/overrides/:id - Update override',
            'DELETE /availability/overrides/:id - Delete override',
            'POST /reschedule/generate/:bookingId - Generate AI options',
            'GET /reschedule/options/:bookingId - Get reschedule options',
            'POST /reschedule/preferences - Submit preferences',
            'GET /reschedule/preferences/:bookingId - Get preferences',
            'POST /reschedule/confirm/:bookingId - Confirm reschedule',
            'POST /preferences/submit - Submit preference ranking',
            'GET /preferences/booking/:bookingId - Get all preferences',
            'GET /preferences/my/:bookingId - Get my preference',
            'POST /preferences/escalate/:bookingId - Manual escalation (admin)'
        ]
    });
});
app.use('/auth', async (req, res) => {
    try {
        const event = {
            httpMethod: req.method,
            path: req.path,
            pathParameters: null,
            queryStringParameters: req.query,
            headers: req.headers,
            body: JSON.stringify(req.body),
            isBase64Encoded: false,
            requestContext: {},
            resource: '',
            stageVariables: null,
            multiValueHeaders: {},
            multiValueQueryStringParameters: null
        };
        const result = await (0, auth_1.handler)(event);
        res.status(result.statusCode);
        if (result.headers) {
            Object.entries(result.headers).forEach(([key, value]) => {
                res.setHeader(key, value);
            });
        }
        res.send(result.body);
    }
    catch (error) {
        logger_1.default.error('Auth route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.use('/bookings/:id?/:action?', async (req, res) => {
    try {
        const event = {
            httpMethod: req.method,
            path: `/bookings${req.params.id ? `/${req.params.id}` : ''}${req.params.action ? `/${req.params.action}` : ''}`,
            pathParameters: req.params.id ? { id: req.params.id } : null,
            queryStringParameters: req.query,
            headers: req.headers,
            body: req.body ? JSON.stringify(req.body) : null,
            isBase64Encoded: false,
            requestContext: {},
            resource: '',
            stageVariables: null,
            multiValueHeaders: {},
            multiValueQueryStringParameters: null
        };
        const result = await (0, bookings_1.handler)(event);
        res.status(result.statusCode);
        if (result.headers) {
            Object.entries(result.headers).forEach(([key, value]) => {
                res.setHeader(key, value);
            });
        }
        res.send(result.body);
    }
    catch (error) {
        logger_1.default.error('Bookings route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.use('/availability/:type?/:id?', async (req, res) => {
    try {
        let path = '/availability';
        if (req.params.type) {
            path += `/${req.params.type}`;
            if (req.params.id) {
                path += `/${req.params.id}`;
            }
        }
        const event = {
            httpMethod: req.method,
            path: path,
            pathParameters: req.params.id ? { id: req.params.id } : null,
            queryStringParameters: req.query,
            headers: req.headers,
            body: req.body ? JSON.stringify(req.body) : null,
            isBase64Encoded: false,
            requestContext: {},
            resource: '',
            stageVariables: null,
            multiValueHeaders: {},
            multiValueQueryStringParameters: null
        };
        const result = await (0, availability_1.availabilityHandler)(event);
        res.status(result.statusCode);
        if (result.headers) {
            Object.entries(result.headers).forEach(([key, value]) => {
                res.setHeader(key, value);
            });
        }
        res.send(result.body);
    }
    catch (error) {
        logger_1.default.error('Availability route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.use('/reschedule/:action?/:bookingId?', async (req, res) => {
    try {
        let path = '/reschedule';
        if (req.params.action) {
            path += `/${req.params.action}`;
            if (req.params.bookingId) {
                path += `/${req.params.bookingId}`;
            }
        }
        const event = {
            httpMethod: req.method,
            path: path,
            pathParameters: req.params.bookingId ? { bookingId: req.params.bookingId } : null,
            queryStringParameters: req.query,
            headers: req.headers,
            body: req.body ? JSON.stringify(req.body) : null,
            isBase64Encoded: false,
            requestContext: {},
            resource: '',
            stageVariables: null,
            multiValueHeaders: {},
            multiValueQueryStringParameters: null
        };
        const result = await (0, reschedule_1.rescheduleHandler)(event);
        res.status(result.statusCode);
        if (result.headers) {
            Object.entries(result.headers).forEach(([key, value]) => {
                res.setHeader(key, value);
            });
        }
        res.send(result.body);
    }
    catch (error) {
        logger_1.default.error('Reschedule route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.use('/preferences/:action?/:bookingId?', async (req, res) => {
    try {
        let path = '/preferences';
        if (req.params.action) {
            path += `/${req.params.action}`;
            if (req.params.bookingId) {
                path += `/${req.params.bookingId}`;
            }
        }
        const event = {
            httpMethod: req.method,
            path: path,
            pathParameters: req.params.bookingId ? { bookingId: req.params.bookingId } : null,
            queryStringParameters: req.query,
            headers: req.headers,
            body: req.body ? JSON.stringify(req.body) : null,
            isBase64Encoded: false,
            requestContext: {},
            resource: '',
            stageVariables: null,
            multiValueHeaders: {},
            multiValueQueryStringParameters: null
        };
        const result = await (0, preferences_1.preferencesHandler)(event);
        res.status(result.statusCode);
        if (result.headers) {
            Object.entries(result.headers).forEach(([key, value]) => {
                res.setHeader(key, value);
            });
        }
        res.send(result.body);
    }
    catch (error) {
        logger_1.default.error('Preferences route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.use((err, req, res, next) => {
    logger_1.default.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
app.listen(PORT, () => {
    logger_1.default.info(`Backend development server running on http://localhost:${PORT}`);
    logger_1.default.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger_1.default.info(`Health check: http://localhost:${PORT}/health`);
    logger_1.default.info(`API info: http://localhost:${PORT}/api`);
});
exports.default = app;
//# sourceMappingURL=dev-server.js.map