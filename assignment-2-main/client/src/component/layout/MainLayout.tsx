import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router';
import TopBar from './TopBar';
import Sidebar from './SideBar';

const { Content } = Layout;

const MainLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const toggle = () => setCollapsed(prev => !prev);

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <TopBar collapsed={collapsed} />
            <Layout>
                <Sidebar collapsed={collapsed} toggle={toggle} />
                <Layout
                    style={{
                        marginTop: 64,
                        marginLeft: collapsed ? 80 : 200,
                        transition: 'all 0.2s',
                    }}
                >
                    <Content style={{ margin: '24px', padding: '24px', background: '#fff', minHeight: 280 }}>
                        <Outlet />
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
