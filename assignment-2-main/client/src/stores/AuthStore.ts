import { makeAutoObservable, action, runInAction } from 'mobx';
import { postRequest } from '../utils/requests';
import { profileStore } from './ProfileStore';
import { message } from 'antd';
import { AuthErrorCode, AuthErrorMessages, ApiError } from '../types/errors';

export class AuthStore {
    user: any = null;
    loading = false;
    error: ApiError | null = null;

    constructor() {
        makeAutoObservable(this, {
            setUser: action,
            setLoading: action,
            setError: action,
            login: action,
            register: action,
            logout: action,
            clearState: action
        });
        this.loadUserFromStorage();
    }

    private loadUserFromStorage() {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                this.setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Failed to parse stored user:', error);
                localStorage.removeItem('user');
            }
        }
    }

    private saveUserToStorage(user: any) {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
    }

    setUser = (user: any) => {
        this.user = user;
        this.saveUserToStorage(user);
    }

    setLoading = (loading: boolean) => {
        this.loading = loading;
    }

    setError = (error: ApiError | null) => {
        this.error = error;
        if (error) {
            message.error(error.message);
            console.error('Auth error:', error);
        }
    }

    clearState = () => {
        this.setUser(null);
        this.setError(null);
        this.setLoading(false);
        localStorage.removeItem('user');
        sessionStorage.clear();
        profileStore.reset();
    }

    async login(email: string, password: string): Promise<boolean> {
        this.setLoading(true);
        this.setError(null);
        try {
            const res = await postRequest(
                `${import.meta.env.VITE_API_URL}/api/auth/login`,
                { email, password }
            );
            if (res && res.user) {
                runInAction(() => {
                    this.setUser(res.user);
                });
                message.success('Login successful');
                console.log('User logged in successfully:', res.user);
                return true;
            }
            this.setError({
                code: AuthErrorCode.SERVER_ERROR,
                message: AuthErrorMessages[AuthErrorCode.SERVER_ERROR]
            });
            console.error('Login failed:', res);
            return false;
        } catch (err: any) {
            const errorCode = err.code || AuthErrorCode.SERVER_ERROR;
            const errorMessage = err.message || AuthErrorMessages[errorCode];
            this.setError({ code: errorCode, message: errorMessage });
            console.error('Login error:', err);
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    async register(data: {
        firstname: string;
        lastname: string;
        email: string;
        password: string;
    }): Promise<boolean> {
        this.setLoading(true);
        this.setError(null);
        try {
            const res = await postRequest(
                `${import.meta.env.VITE_API_URL}/api/auth/register`,
                data
            );
            if (res) {
                message.success('Registration successful. Please check your email to verify your account.');
                console.log('User registered successfully:', data.email);
                return true;
            }
            this.setError({
                code: AuthErrorCode.SERVER_ERROR,
                message: AuthErrorMessages[AuthErrorCode.SERVER_ERROR]
            });
            console.error('Registration failed:', res);
            return false;
        } catch (err: any) {
            const errorCode = err.code || AuthErrorCode.SERVER_ERROR;
            const errorMessage = err.message || AuthErrorMessages[errorCode];
            this.setError({ code: errorCode, message: errorMessage });
            console.error('Registration error:', err);
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    logout = async (): Promise<boolean> => {
        this.setLoading(true);
        try {
            await postRequest(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {});
            this.clearState();
            message.success('Logged out successfully');
            console.log('User logged out successfully');
            return true;
        } catch (error: any) {
            const errorCode = error.code || AuthErrorCode.SERVER_ERROR;
            const errorMessage = error.message || AuthErrorMessages[errorCode];
            this.setError({ code: errorCode, message: errorMessage });
            console.error('Logout error:', error);
            this.clearState();
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    get isAuthenticated() {
        return !!this.user;
    }

    get isAdmin() {
        return this.user?.isAdmin === true;
    }

    get userInitials() {
        if (!this.user) return '';
        return `${this.user.firstname?.[0] || ''}${this.user.lastname?.[0] || ''}`.toUpperCase();
    }

    get userFullName() {
        if (!this.user) return '';
        return `${this.user.firstname} ${this.user.lastname}`;
    }
}

const authStore = new AuthStore();
export default authStore;