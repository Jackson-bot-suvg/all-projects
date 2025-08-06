export enum AuthErrorCode {
    INVALID_CREDENTIALS = 'AUTH001',
    EMAIL_NOT_VERIFIED = 'AUTH002',
    USER_EXISTS = 'AUTH003',
    ACCOUNT_DISABLED = 'AUTH004',
    INVALID_TOKEN = 'AUTH005',
    USER_NOT_FOUND = 'AUTH006',
    MISSING_FIELDS = 'AUTH007',
    SERVER_ERROR = 'AUTH008',
    NETWORK_ERROR = 'AUTH009',
    TOKEN_EXPIRED = 'AUTH010',
    INVALID_PASSWORD = 'AUTH011',
    EMAIL_IN_USE = 'AUTH012'
}

export interface ApiError {
    code: AuthErrorCode;
    message: string;
    details?: any;
}

export const AuthErrorMessages: Record<AuthErrorCode, string> = {
    [AuthErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password. Please check your credentials and try again.',
    [AuthErrorCode.EMAIL_NOT_VERIFIED]: 'Please verify your email before logging in. Check your inbox for the verification link.',
    [AuthErrorCode.USER_EXISTS]: 'This email is already registered. Please use a different email or try logging in.',
    [AuthErrorCode.ACCOUNT_DISABLED]: 'Your account has been disabled. Please contact support for assistance.',
    [AuthErrorCode.INVALID_TOKEN]: 'The verification link is invalid. Please request a new one.',
    [AuthErrorCode.USER_NOT_FOUND]: 'User account not found. Please check your email or register for a new account.',
    [AuthErrorCode.MISSING_FIELDS]: 'Please fill in all required fields.',
    [AuthErrorCode.SERVER_ERROR]: 'Server error occurred. Please try again later.',
    [AuthErrorCode.NETWORK_ERROR]: 'Network connection error. Please check your internet connection and try again.',
    [AuthErrorCode.TOKEN_EXPIRED]: 'The verification link has expired. Please request a new one.',
    [AuthErrorCode.INVALID_PASSWORD]: 'The current password is incorrect. Please try again.',
    [AuthErrorCode.EMAIL_IN_USE]: 'This email is already in use by another account.'
}; 