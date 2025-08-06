import { NavigateFunction } from 'react-router';
import authStore from '../stores/AuthStore';

export const requireAuth = (navigate: NavigateFunction, currentPath: string) => {
    if (!authStore.user) {

        navigate('/login', { state: { from: currentPath } });
        return false;
    }
    return true;
}; 