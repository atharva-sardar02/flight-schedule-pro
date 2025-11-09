"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const user_1 = require("../types/user");
const logger_1 = __importDefault(require("../utils/logger"));
let cognitoClient = null;
function getCognitoClient() {
    if (!cognitoClient) {
        cognitoClient = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({
            region: process.env.AWS_REGION || process.env.COGNITO_REGION || 'us-east-1',
        });
    }
    return cognitoClient;
}
function getUserPoolId() {
    const poolId = process.env.COGNITO_USER_POOL_ID;
    if (!poolId) {
        logger_1.default.error('COGNITO_USER_POOL_ID is not set in environment variables');
        throw new Error('COGNITO_USER_POOL_ID is not configured');
    }
    return poolId;
}
function getClientId() {
    const clientId = process.env.COGNITO_CLIENT_ID;
    if (!clientId) {
        logger_1.default.error('COGNITO_CLIENT_ID is not set in environment variables');
        throw new Error('COGNITO_CLIENT_ID is not configured');
    }
    return clientId;
}
class AuthService {
    static async login(credentials) {
        try {
            const command = new client_cognito_identity_provider_1.InitiateAuthCommand({
                AuthFlow: 'USER_PASSWORD_AUTH',
                ClientId: getClientId(),
                AuthParameters: {
                    USERNAME: credentials.email,
                    PASSWORD: credentials.password,
                },
            });
            const response = await getCognitoClient().send(command);
            if (!response.AuthenticationResult) {
                throw new Error('Authentication failed');
            }
            return {
                accessToken: response.AuthenticationResult.AccessToken,
                idToken: response.AuthenticationResult.IdToken,
                refreshToken: response.AuthenticationResult.RefreshToken,
                expiresIn: response.AuthenticationResult.ExpiresIn,
            };
        }
        catch (error) {
            logger_1.default.error('Login failed', { email: credentials.email, error });
            throw error;
        }
    }
    static async register(data) {
        try {
            const signUpCommand = new client_cognito_identity_provider_1.SignUpCommand({
                ClientId: getClientId(),
                Username: data.email,
                Password: data.password,
                UserAttributes: [
                    { Name: 'email', Value: data.email },
                    { Name: 'given_name', Value: data.firstName },
                    { Name: 'family_name', Value: data.lastName },
                    ...(data.phoneNumber ? [{ Name: 'phone_number', Value: data.phoneNumber }] : []),
                ],
            });
            const signUpResponse = await getCognitoClient().send(signUpCommand);
            if (!signUpResponse.UserSub) {
                throw new Error('User registration failed');
            }
            if (process.env.NODE_ENV === 'development' || process.env.AUTO_CONFIRM_USERS === 'true') {
                try {
                    const confirmCommand = new client_cognito_identity_provider_1.AdminConfirmSignUpCommand({
                        UserPoolId: getUserPoolId(),
                        Username: data.email,
                    });
                    await getCognitoClient().send(confirmCommand);
                    logger_1.default.info('User auto-confirmed (development mode)', { email: data.email });
                }
                catch (confirmError) {
                    logger_1.default.warn('Failed to auto-confirm user (may already be confirmed)', {
                        email: data.email,
                        error: confirmError,
                    });
                }
            }
            const groupName = this.getRoleGroupName(data.role);
            await this.addUserToGroup(data.email, groupName);
            logger_1.default.info('User registered successfully', {
                userId: signUpResponse.UserSub,
                email: data.email,
                role: data.role,
            });
            return {
                userId: signUpResponse.UserSub,
                email: data.email,
            };
        }
        catch (error) {
            logger_1.default.error('Registration failed', { email: data.email, error });
            throw error;
        }
    }
    static async verifyToken(accessToken) {
        try {
            const command = new client_cognito_identity_provider_1.GetUserCommand({
                AccessToken: accessToken,
            });
            const response = await getCognitoClient().send(command);
            if (!response.Username) {
                throw new Error('Invalid token');
            }
            const attributes = response.UserAttributes || [];
            const getAttr = (name) => attributes.find((attr) => attr.Name === name)?.Value;
            const user = {
                id: response.Username,
                email: getAttr('email') || '',
                firstName: getAttr('given_name') || '',
                lastName: getAttr('family_name') || '',
                phoneNumber: getAttr('phone_number'),
                role: this.extractRole(getAttr('custom:role')),
                trainingLevel: getAttr('custom:training_level'),
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            return user;
        }
        catch (error) {
            logger_1.default.error('Token verification failed', { error });
            throw new Error('Invalid or expired token');
        }
    }
    static async refreshToken(refreshToken) {
        try {
            const command = new client_cognito_identity_provider_1.InitiateAuthCommand({
                AuthFlow: 'REFRESH_TOKEN_AUTH',
                ClientId: getClientId(),
                AuthParameters: {
                    REFRESH_TOKEN: refreshToken,
                },
            });
            const response = await getCognitoClient().send(command);
            if (!response.AuthenticationResult) {
                throw new Error('Token refresh failed');
            }
            return {
                accessToken: response.AuthenticationResult.AccessToken,
                idToken: response.AuthenticationResult.IdToken,
                refreshToken: refreshToken,
                expiresIn: response.AuthenticationResult.ExpiresIn,
            };
        }
        catch (error) {
            logger_1.default.error('Token refresh failed', { error });
            throw error;
        }
    }
    static async addUserToGroup(username, groupName) {
        try {
            const command = new client_cognito_identity_provider_1.AdminAddUserToGroupCommand({
                UserPoolId: getUserPoolId(),
                Username: username,
                GroupName: groupName,
            });
            await getCognitoClient().send(command);
            logger_1.default.info('User added to group', { username, groupName });
        }
        catch (error) {
            logger_1.default.error('Failed to add user to group', { username, groupName, error });
            throw error;
        }
    }
    static getRoleGroupName(role) {
        switch (role) {
            case user_1.UserRole.STUDENT:
                return 'Students';
            case user_1.UserRole.INSTRUCTOR:
                return 'Instructors';
            case user_1.UserRole.ADMIN:
                return 'Admins';
            default:
                return 'Students';
        }
    }
    static extractRole(roleStr) {
        if (!roleStr)
            return user_1.UserRole.STUDENT;
        switch (roleStr.toLowerCase()) {
            case 'instructor':
                return user_1.UserRole.INSTRUCTOR;
            case 'admin':
                return user_1.UserRole.ADMIN;
            default:
                return user_1.UserRole.STUDENT;
        }
    }
    static decodeCognitoToken(token) {
        try {
            const payload = token.split('.')[1];
            const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
            return decoded;
        }
        catch (error) {
            logger_1.default.error('Token decode failed', { error });
            throw new Error('Invalid token format');
        }
    }
}
exports.AuthService = AuthService;
exports.default = AuthService;
//# sourceMappingURL=authService.js.map