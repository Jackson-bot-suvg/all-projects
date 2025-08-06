import type React from "react";
import { Routes, Route } from "react-router";
import MainLayout from "../component/layout/MainLayout";
import PrivateRoute from "../component/PrivateRoute";

// Auth
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import VerifyEmailPage from "../pages/VerifyEmailPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";

// User
import { HomePage } from "../pages/HomePage";
import CheckoutPage from "../pages/CheckoutPage";
import SearchPage from "../pages/SearchPage/SearchPage";

// Profile
import ProfilePage from "../pages/ProfilePage";
import EditProfileForm from "../component/Profile/EditProfileForm";
import ChangePasswordForm from "../component/Profile/ChangePasswordForm";
import ManageListings from "../component/Profile/ManageListings";
import ViewComments from "../component/Profile/ViewComments";
import WishlistPage from "../component/Profile/WishlistPage";
import { PhoneDetailPage } from "../pages/PhoneDetailPage";

// Admin
import AdminPage from "../pages/AdminPage";
import UserTable from "../component/admin/UserTable";
import OrderTable from "../component/admin/OrderTable";
import ListingTable from "../component/admin/ListingTable";
import ReviewTable from "../component/admin/ReviewTable";
import { ActivityLogTable } from "../component/admin/ActivityLogTable";


const AppRoutes: React.FC = () => (
    <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/confirm-email-change/:token" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route
            path="/unauthorized"
            element={
                <div style={{ padding: 50, textAlign: "center" }}>
                    <h2>Unauthorized Access</h2>
                    <p>You don't have permission to access this page.</p>
                </div>
            }
        />

        {/* Main layout - available to all */}
        <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/phones/:id" element={<PhoneDetailPage />} />
            <Route path="/search" element={<SearchPage />} />

            {/* Protected routes - require authentication */}
            <Route element={<PrivateRoute />}>
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/profile" element={<ProfilePage />}>
                    <Route index element={<EditProfileForm />} />
                    <Route path="edit" element={<EditProfileForm />} />
                    <Route path="password" element={<ChangePasswordForm />} />
                    <Route path="wishlist" element={<WishlistPage />} />
                    <Route path="listings" element={<ManageListings />} />
                    <Route path="comments" element={<ViewComments />} />
                </Route>
            </Route>

            {/* Admin routes - require admin access */}
            <Route element={<PrivateRoute requireAdmin={true} />}>
                <Route path="/admin" element={<AdminPage />}>
                    <Route index element={<UserTable />} />
                    <Route path="users" element={<UserTable />} />
                    <Route path="orders" element={<OrderTable />} />
                    <Route path="listings" element={<ListingTable />} />
                    <Route path="reviews" element={<ReviewTable />} />
                    <Route path="activity-log" element={<ActivityLogTable />} />
                </Route>
            </Route>

            {/* fallback */}
            <Route path="*" element={<div>404 Not Found</div>} />
        </Route>
    </Routes>
);

export default AppRoutes;
