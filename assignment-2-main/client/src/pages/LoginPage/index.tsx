import { useState } from 'react';
import { Button, Form, Input, Typography, Alert, Space } from 'antd';
import authStore from '../../stores/AuthStore';
import { observer } from 'mobx-react-lite';
import { useNavigate, Link, useLocation } from 'react-router';
import { AuthErrorCode } from '../../types/errors';

const { Title } = Typography;

const LoginPage = observer(() => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const location = useLocation();

    const onFinish = async (values: any) => {
        const success = await authStore.login(values.email, values.password);
        if (success) {
            // Get the redirect path from location state or default to home/admin
            const from = location.state?.from || (authStore.user?.isAdmin ? '/admin' : '/');
            navigate(from, { replace: true });
        }
    };

    const getAlertType = () => {
        if (!authStore.error) return 'info';
        switch (authStore.error.code) {
            case AuthErrorCode.EMAIL_NOT_VERIFIED:
            case AuthErrorCode.ACCOUNT_DISABLED:
                return 'warning';
            default:
                return 'error';
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '40px auto', padding: '20px' }}>
            <Title level={2}>Login</Title>
            
            {authStore.error && (
                <Alert 
                    message={authStore.error.message}
                    type={getAlertType()}
                    style={{ marginBottom: 16 }} 
                    showIcon
                />
            )}
            
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item 
                    name="email" 
                    label="Email" 
                    rules={[
                        { required: true, message: 'Please enter your email' }, 
                        { type: 'email', message: 'Please enter a valid email' }
                    ]}
                >
                    <Input />
                </Form.Item>
                
                <Form.Item 
                    name="password" 
                    label="Password" 
                    rules={[{ required: true, message: 'Please enter your password' }]}
                >
                    <Input.Password />
                </Form.Item>
                
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={authStore.loading} block>
                        Login
                    </Button>
                </Form.Item>

                <Space style={{ width: '100%', justifyContent: 'center' }}>
                    <Link to="/register">Register</Link>
                    <Link to="/forgot-password">Forgot Password?</Link>
                </Space>
            </Form>
        </div>
    );
});

export default LoginPage;
