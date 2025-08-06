import React from 'react';
import { Layout, Menu, type MenuProps } from 'antd';
import {
    HomeOutlined,
    ShoppingCartOutlined,
    TeamOutlined,
    UnorderedListOutlined,
    CommentOutlined,
    DollarOutlined,
    EditOutlined,
    FileTextOutlined,
    LockOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    HeartOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router';

const { Sider } = Layout;


interface SidebarProps {
    collapsed: boolean;
    toggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggle }) => {
    const navigate = useNavigate();
    const { pathname } = useLocation();


    // Define the items based on route
    let items: MenuProps['items'] = [];

    if (pathname.startsWith('/admin')) {
        items = [
            { key: '/admin/users', icon: <TeamOutlined />, label: 'User Management' },
            { key: '/admin/orders', icon: <DollarOutlined />, label: 'Order Management' },
            { key: '/admin/listings', icon: <UnorderedListOutlined />, label: 'Listing Management' },
            { key: '/admin/reviews', icon: <CommentOutlined />, label: 'Review Moderation' },
            { key: '/admin/activity-log', icon: <FileTextOutlined />, label: 'Activity Log' },
        ]as MenuProps['items'];
    } else if (pathname.startsWith('/profile')) {
        items = [
            { key: '/profile/edit', icon: <EditOutlined />, label: 'Edit Profile' },
            { key: '/profile/password', icon: <LockOutlined />, label: 'Change Password' },
            { key: '/profile/wishlist', icon: <HeartOutlined />, label: 'Wishlist' },
            { key: '/profile/listings', icon: <UnorderedListOutlined />, label: 'Manage Listings' },
            { key: '/profile/comments', icon: <CommentOutlined />, label: 'View Comments' },
        ]as MenuProps['items'];
    } else {
        items = [
            { key: '/', icon: <HomeOutlined />, label: 'Home' },
            { key: '/checkout', icon: <ShoppingCartOutlined />, label: 'Checkout' },
        ]as MenuProps['items'];
    }

    // Handle click to navigate
    const onClick: MenuProps['onClick'] = ({ key }) => {
        navigate(key);
    };

    // Find currently selected key
    const matchedItem = items.find((i: any) => {
        const k = String(i?.key);
        return pathname === k || pathname.startsWith(k + '/');
    });
    const selectedKey = matchedItem?.key?.toString() || '';


    return (
        <Sider
            collapsible
            collapsed={collapsed}
            trigger={null}
            width={200}
            style={{
                position: 'fixed',
                top: 64, // ensure not covered by TopBar
                left: 0,
                bottom: 0,
                overflowY: 'auto',
                zIndex: 100,
                background: '#fff',
            }}
        >
            {/* Sidebar Header with toggle button */}
            <div
                style={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-end',
                    padding: '0 16px',
                    borderBottom: '1px solid #f0f0f0',
                }}
            >
                {collapsed ? (
                    <MenuUnfoldOutlined onClick={toggle} style={{ fontSize: 18, cursor: 'pointer' }} />
                ) : (
                    <MenuFoldOutlined onClick={toggle} style={{ fontSize: 18, cursor: 'pointer' }} />
                )}
            </div>

            {/* Navigation */}
            <Menu
                mode="inline"
                selectedKeys={selectedKey ? [selectedKey] : []}
                onClick={onClick}
                items={items}
            />
        </Sider>
    );
};

export default Sidebar;
