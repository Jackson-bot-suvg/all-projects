import { useState } from 'react';
import { Button, Form, Input, Typography, Alert } from 'antd';
import authStore from '../../stores/AuthStore';
import { observer } from 'mobx-react-lite';
import { Link, useNavigate } from 'react-router';
import { AuthErrorCode } from '../../types/errors';

const { Title, Text } = Typography;

const RegisterPage = observer(() => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const onFinish = async (values: any) => {
        const success = await authStore.register(values);
        if (success) {
            setSuccessMessage('Registration successful! Please check your email for verification instructions. You will be redirected to the login page in 5 seconds.');
            setTimeout(() => {
                navigate('/login');
            }, 5000);
        }
    };

    const getAlertType = () => {
        if (!authStore.error) return 'info';
        switch (authStore.error.code) {
            case AuthErrorCode.USER_EXISTS:
            case AuthErrorCode.EMAIL_IN_USE:
                return 'warning';
            default:
                return 'error';
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '40px auto', padding: '20px' }}>
            <Title level={2}>Register</Title>
            
            {successMessage && (
                <Alert 
                    message={successMessage}
                    type="success"
                    style={{ marginBottom: 16 }} 
                    showIcon
                />
            )}
            
            {!successMessage && authStore.error && (
                <Alert 
                    message={authStore.error.message}
                    type={getAlertType()}
                    style={{ marginBottom: 16 }} 
                    showIcon
                />
            )}
            
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item 
                    name="firstname" 
                    label="First Name" 
                    rules={[{ required: true, message: 'Please enter your first name' }]}
                >
                    <Input />
                </Form.Item>
                
                <Form.Item 
                    name="lastname" 
                    label="Last Name" 
                    rules={[{ required: true, message: 'Please enter your last name' }]}
                >
                    <Input />
                </Form.Item>
                
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
                    rules={[
                        { required: true, message: 'Please enter your password' },
                        { min: 8, message: 'Password must be at least 8 characters' },
                        { pattern: /[A-Z]/, message: 'Password must include at least one uppercase letter' },
                        { pattern: /[0-9]/, message: 'Password must include at least one number' }
                    ]}
                >
                    <Input.Password />
                </Form.Item>
                
                <Form.Item>
                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={authStore.loading}
                        block
                    >
                        Register
                    </Button>
                </Form.Item>
                
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <Text>Already have an account? </Text>
                    <Link to="/login">Login</Link>
                </div>
            </Form>
        </div>
    );
});

export default RegisterPage;
