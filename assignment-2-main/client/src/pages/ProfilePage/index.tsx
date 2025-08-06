import React from 'react';
import { Outlet } from 'react-router';

/**
 * ProfilePage only renders its child route.
 * Sidebar handles which form/page to show.
 */
const ProfilePage: React.FC = () => {
    return <Outlet />;
};

export default ProfilePage;
