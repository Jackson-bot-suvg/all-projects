import { Navigate, Outlet, useLocation } from 'react-router';
import authStore from '../../stores/AuthStore';
import { observer } from 'mobx-react-lite';

interface PrivateRouteProps {
    requireAdmin?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = observer(({ requireAdmin = false }) => {
    const location = useLocation();
    const isAuthenticated = !!authStore.user;
    const isAdmin = authStore.user?.isAdmin || false;

    if (!isAuthenticated) {
        // Redirect to login page with the current location
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // Check for admin requirement
    if (requireAdmin && !isAdmin) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Check for user-only routes (prevent admin access)
    if (!requireAdmin && isAdmin) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
});

export default PrivateRoute; 