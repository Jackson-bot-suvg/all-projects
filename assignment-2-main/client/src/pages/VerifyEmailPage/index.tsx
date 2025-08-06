import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { Typography, Alert, Spin, Button, Space, Modal } from 'antd';
import { postRequest } from '../../utils/requests';

const { Title, Text } = Typography;

const VerifyEmailPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [status, setStatus] = useState<'loading' | 'pending' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [modalVisible, setModalVisible] = useState(false);

    const isEmailChange = location.pathname.includes('confirm-email-change');

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link.');
                return;
            }

            try {
                if (!isEmailChange) {
                    // Handle regular email verification
                    const response = await postRequest(
                        `${import.meta.env.VITE_API_URL}/api/auth/verify-email/${token}`,
                        {}
                    );

                    if (response && response.success) {
                        setStatus('success');
                        setMessage(response.message);
                        // Redirect to login page after 3 seconds
                        setTimeout(() => {
                            navigate('/login');
                        }, 3000);
                    } else {
                        throw new Error(response?.message || 'Failed to verify email');
                    }
                } else {
                    // For email change, validate the token first
                    const response = await postRequest(
                        `${import.meta.env.VITE_API_URL}/api/users/validate-email-token/${token}`,
                        {}
                    );

                    if (response && response.valid) {
                        setStatus('pending');
                        setNewEmail(response.newEmail);
                        setMessage('Please confirm your email change.');
                    } else {
                        throw new Error(response?.message || 'Invalid or expired token');
                    }
                }
            } catch (error: any) {
                console.error('Verification error:', error);
                setStatus('error');
                setMessage(error.message || 'Verification failed. Please try again.');
            }
        };

        verifyEmail();
    }, [token, navigate, isEmailChange]);

    const handleConfirmEmailChange = async () => {
        try {
            setStatus('loading');
            
            const response = await postRequest(
                `${import.meta.env.VITE_API_URL}/api/users/confirm-email-change/${token}`,
                {}
            );

            if (response && response.message) {
                setStatus('success');
                setMessage(response.message);
                // Redirect to login page after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                throw new Error(response?.message || 'Failed to confirm email change');
            }
        } catch (error: any) {
            console.error('Email change confirmation error:', error);
            setStatus('error');
            setMessage(error.message || 'Failed to confirm email change. Please try again.');
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '40px auto', padding: '20px', textAlign: 'center' }}>
            <Title level={2}>{isEmailChange ? 'Email Change Confirmation' : 'Email Verification'}</Title>
            
            {status === 'loading' && (
                <div style={{ marginTop: 24 }}>
                    <Spin size="large" />
                    <p style={{ marginTop: 16 }}>
                        {isEmailChange ? 'Validating your request...' : 'Verifying your email...'}
                    </p>
                </div>
            )}
            
            {status === 'pending' && (
                <div style={{ marginTop: 24 }}>
                    <Alert
                        message="Confirm Email Change"
                        description={
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Text>You are about to change your email to:</Text>
                                <Text strong>{newEmail}</Text>
                                <Text type="secondary">
                                    After confirmation, you will need to log in again with your new email address.
                                </Text>
                                <Button type="primary" onClick={handleConfirmEmailChange}>
                                    Confirm Email Change
                                </Button>
                            </Space>
                        }
                        type="info"
                        showIcon
                    />
                </div>
            )}
            
            {status === 'success' && (
                <Alert
                    message="Success!"
                    description={message}
                    type="success"
                    showIcon
                    style={{ marginTop: 24 }}
                />
            )}

            {status === 'error' && (
                <Alert
                    message="Error"
                    description={message}
                    type="error"
                    showIcon
                    style={{ marginTop: 24 }}
                />
            )}
        </div>
    );
};

export default VerifyEmailPage; 