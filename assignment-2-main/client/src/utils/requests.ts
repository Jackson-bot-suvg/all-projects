import { AuthErrorCode, AuthErrorMessages } from '../types/errors';

const filterSensitiveData = (data: any) => {
    if (!data) return data;
    const sensitiveFields = ['password', 'oldPassword', 'newPassword', 'confirmPassword'];
    const filtered = { ...data };
    
    sensitiveFields.forEach(field => {
        if (field in filtered) {
            filtered[field] = '******';
        }
    });
    
    return filtered;
};

export const getRequest = async (url: string) => {
    try {
        const response = await fetch(url, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            try {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || `Response status: ${response.status}`);
            } catch (jsonError) {
                throw new Error(`Response status: ${response.status}`);
            }
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Network or parsing error:', error);
        throw error;
    }
}

export const postRequest = async (url: string, data: any) => {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            credentials: 'include'
        });

        const responseData = await response.json();

        if (!response.ok) {
            // If the server sends an error code, use it
            if (responseData.code && responseData.message) {
                throw {
                    code: responseData.code,
                    message: responseData.message
                };
            }

            // If no specific error code is provided, map HTTP status codes to appropriate error codes
            let errorCode: AuthErrorCode;
            switch (response.status) {
                case 401:
                    errorCode = AuthErrorCode.INVALID_CREDENTIALS;
                    break;
                case 403:
                    errorCode = responseData.message?.includes('verify') 
                        ? AuthErrorCode.EMAIL_NOT_VERIFIED 
                        : AuthErrorCode.ACCOUNT_DISABLED;
                    break;
                case 404:
                    errorCode = AuthErrorCode.USER_NOT_FOUND;
                    break;
                case 409:
                    errorCode = AuthErrorCode.USER_EXISTS;
                    break;
                case 400:
                    errorCode = AuthErrorCode.MISSING_FIELDS;
                    break;
                default:
                    errorCode = AuthErrorCode.SERVER_ERROR;
            }

            throw {
                code: errorCode,
                message: AuthErrorMessages[errorCode]
            };
        }

        return responseData;
    } catch (error: any) {
        // Handle network errors
        if (!error.code) {
            throw {
                code: AuthErrorCode.NETWORK_ERROR,
                message: AuthErrorMessages[AuthErrorCode.NETWORK_ERROR]
            };
        }
        throw error;
    }
};

export const putRequest = async (url: string, data: any) => {
    try {
        const response = await fetch(url, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            try {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || `Server responded with status: ${response.status}`);
            } catch (jsonError) {
                throw new Error(`Request failed with status: ${response.status}`);
            }
        }

        try {
            const jsonData = await response.json();
            return jsonData;
        } catch (jsonError) {
            return {};
        }
    } catch (error) {
        console.error('Network or parsing error:', error);
        throw error;
    }
};