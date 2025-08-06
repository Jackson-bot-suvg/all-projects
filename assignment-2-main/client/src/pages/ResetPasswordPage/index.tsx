import React, { useState } from 'react';
import { Form, Input, Button, Alert, Typography } from 'antd';
import { useParams, useNavigate } from 'react-router';
import { postRequest } from '../../utils/requests';
import type { NamePath } from 'antd/es/form/interface';

const { Title } = Typography;

const ResetPasswordPage: React.FC = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const onFinish = async (values: { password: string }) => {
        try {
            await postRequest(
                `${import.meta.env.VITE_API_URL}/api/auth/reset-password/${token}`,
                { password: values.password }
            );
            setStatus('success');
            setMessage('Your password has been reset successfully. You will be redirected to login page.');
            form.resetFields();
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Failed to reset password');
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '40px auto', padding: '20px' }}>
            <Title level={2}>Reset Password</Title>

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
                    name="password"
                    label="New Password"
                    rules={[
                        { required: true, message: 'Please enter your new password' },
                        { min: 8, message: 'Password must be at least 8 characters' },
                        { pattern: /[A-Z]/, message: 'Password must include at least one uppercase letter' },
                        { pattern: /[0-9]/, message: 'Password must include at least one number' },
                    ]}
                >
                    <Input.Password />
                </Form.Item>

                <Form.Item
                    name="confirm"
                    label="Confirm Password"
                    dependencies={['password'] as NamePath[]}
                    rules={[
                        { required: true, message: 'Please confirm your password' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('The two passwords do not match'));
                            }
                        })
                    ]}
                >
                    <Input.Password />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        Reset Password
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default ResetPasswordPage; 