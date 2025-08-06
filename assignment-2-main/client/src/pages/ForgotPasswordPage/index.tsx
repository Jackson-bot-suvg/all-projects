import React, { useState } from 'react';
import { Form, Input, Button, Alert, Typography } from 'antd';
import { Link } from 'react-router';
import { postRequest } from '../../utils/requests';

const { Title } = Typography;

const ForgotPasswordPage: React.FC = () => {
    const [form] = Form.useForm();
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const onFinish = async (values: { email: string }) => {
        try {
            await postRequest(
                `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
                { email: values.email }
            );
            setStatus('success');
            setMessage('Password reset instructions have been sent to your email.');
            form.resetFields();
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Failed to process request');
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '40px auto', padding: '20px' }}>
            <Title level={2}>Forgot Password</Title>

            {status !== 'idle' && (
                <Alert
                    message={status === 'success' ? 'Success!' : 'Error'}
                    description={message}
                    type={status === 'success' ? 'success' : 'error'}
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

                <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        Send Reset Instructions
                    </Button>
                </Form.Item>

                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Link to="/login">Back to Login</Link>
                </div>
            </Form>
        </div>
    );
};

export default ForgotPasswordPage; 