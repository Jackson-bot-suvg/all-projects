import React from 'react';
import { Layout, Avatar, Dropdown, type MenuProps, Space, Typography, Modal } from 'antd';
import {
    UserOutlined,
    LogoutOutlined,
    ShopOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import authStore from '../../stores/AuthStore.ts';
import { observer } from 'mobx-react-lite';

const { Header } = Layout;
const { Text } = Typography;

interface TopBarProps {
    collapsed: boolean;
}

const TopBar: React.FC<TopBarProps> = observer(() => {
    const navigate = useNavigate();
    const { user, logout } = authStore;
    const [logoutModalOpen, setLogoutModalOpen] = React.useState(false);
    const [logoutLoading, setLogoutLoading] = React.useState(false);

    const getMenuItems = () => {
        if (user?.isAdmin) {
            return [
                {
                    key: '/logout',
                    icon: <LogoutOutlined />,
                    label: 'Logout',
                },
            ] as MenuProps['items'];
        }

        return [
            {
                key: '/profile',
                icon: <UserOutlined />,
                label: 'Profile',
            },
            {
                type: 'divider' as const,
            },
            {
                key: '/logout',
                icon: <LogoutOutlined />,
                label: 'Logout',
            },
        ] as MenuProps['items'];
    };

    const onMenuClick: MenuProps['onClick'] = async ({ key }) => {
        if (key === '/logout') {
            setLogoutModalOpen(true);
        } else {
            navigate(key);
        }
    };

    const handleLogoutConfirm = async () => {
        setLogoutLoading(true);
        await logout();
        setLogoutLoading(false);
        setLogoutModalOpen(false);
        navigate('/');
    };

    const handleLogoutCancel = () => {
        setLogoutModalOpen(false);
    };

    const handleLogoClick = () => {
        if (user?.isAdmin) {
            navigate('/admin');
        } else {
            navigate('/');
        }
    };

    return (
        <>
            <Header
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 64,
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 24px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    zIndex: 1100,
                }}
            >
                <Space 
                    size="middle" 
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        cursor: 'pointer' 
                    }}
                    onClick={handleLogoClick}
                >
                    <ShopOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    <Text strong style={{ fontSize: 18 }}>Old_Phone_Deals</Text>
                </Space>

                <div style={{ flex: 1 }} />

                {user ? (
                    <Dropdown
                        menu={{ items: getMenuItems(), onClick: onMenuClick }}
                        placement="bottomRight"
                        trigger={['click']}
                    >
                        <Space style={{ cursor: 'pointer' }}>
                            <Avatar icon={<UserOutlined />} />
                            <span>{user.firstname}</span>
                        </Space>
                    </Dropdown>
                ) : (
                    <Space>
                        <Text 
                            style={{ cursor: 'pointer' }} 
                            onClick={() => navigate('/login')}
                        >
                            Login
                        </Text>
                        <Text 
                            style={{ cursor: 'pointer', fontWeight: 'bold' }} 
                            onClick={() => navigate('/register')}
                        >
                            Register
                        </Text>
                    </Space>
                )}
            </Header>
            <Modal
                title="Confirm Logout"
                open={logoutModalOpen}
                onOk={handleLogoutConfirm}
                onCancel={handleLogoutCancel}
                confirmLoading={logoutLoading}
                okText="Logout"
                cancelText="Cancel"
            >
                Are you sure you want to log out?
            </Modal>
        </>
    );
});

export default TopBar;