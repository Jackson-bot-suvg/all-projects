import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Alert, Space, Modal, message } from 'antd';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router';
import authStore from '../../stores/AuthStore';
import { profileStore } from '../../stores/ProfileStore';
import { postRequest } from '../../utils/requests';

const EditProfileForm: React.FC = observer(() => {
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [editing, setEditing] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [formValues, setFormValues] = useState<any>(null);
    const [emailChanged, setEmailChanged] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Reset state when component mounts
        setEditing(false);
        setPasswordModalVisible(false);
        setEmailChanged(false);
        profileStore.setError(null);

        // Fetch user info only if not already loaded
        const fetchData = async () => {
            if (!authStore.isAuthenticated) {
                navigate('/login');
                return;
            }
            if (!profileStore.userInfo) {
                await profileStore.fetchUserInfo();
            }
            if (profileStore.userInfo) {
                form.setFieldsValue(profileStore.userInfo);
            }
        };
        fetchData();

        // Cleanup function
        return () => {
            profileStore.setError(null);
            profileStore.setLoading(false);
        };
    }, [form, navigate]);

    const handleCancel = () => {
        profileStore.setError(null);
        form.setFieldsValue(profileStore.userInfo!);
        setEditing(false);
        setEmailChanged(false);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setFormValues(values);
            
            // Check if any changes were made
            const isEmailChanged = values.email !== profileStore.userInfo?.email;
            const isNameChanged = 
                values.firstname !== profileStore.userInfo?.firstname ||
                values.lastname !== profileStore.userInfo?.lastname;
            
            // If nothing changed, just exit edit mode
            if (!isEmailChanged && !isNameChanged) {
                setEditing(false);
                return;
            }
            
            // Set email changed flag
            setEmailChanged(isEmailChanged);
            
            // Show password verification only if there are actual changes
            setPasswordModalVisible(true);
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const handlePasswordVerification = async () => {
        try {
            const { password } = await passwordForm.validateFields();
            const verified = await profileStore.verifyPassword(password);
            
            if (verified) {
                if (emailChanged) {
                    // Request email change with password verification
                    const response = await postRequest(
                        `${import.meta.env.VITE_API_URL}/api/users/request-email-change`,
                        {
                            newEmail: formValues.email,
                            password: password
                        }
                    );
                    
                    if (response.message) {
                        message.success(response.message);
                        setEditing(false);
                        setPasswordModalVisible(false);
                        passwordForm.resetFields();
                    }
                } else {
                    // Handle normal profile update without email change
                    const success = await profileStore.updateProfile(formValues);
                    if (success) {
                        setEditing(false);
                        setPasswordModalVisible(false);
                        passwordForm.resetFields();
                        message.success('Profile updated successfully');
                    }
                }
            } else {
                message.error('Password verification failed');
            }
        } catch (error) {
            console.error('Operation failed:', error);
            message.error('Operation failed. Please try again.');
        }
    };

    return (
        <div style={{ position: 'relative', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
            <h2 style={{ marginBottom: 24 }}>Edit Profile</h2>

            {/* Edit button at top right */}
            {!editing && (
                <Button
                    type="default"
                    style={{ position: 'absolute', top: 24, right: 24 }}
                    onClick={() => setEditing(true)}
                >
                    Update Profile
                </Button>
            )}

            {profileStore.error && (
                <Alert
                    message="Error"
                    description={profileStore.error}
                    type="error"
                    style={{ marginBottom: 16 }}
                    showIcon
                />
            )}

            <Form
                form={form}
                layout="vertical"
                disabled={!editing}
            >
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
                    extra={editing ? "Changing your email will require verification and re-login" : undefined}
                >
                    <Input />
                </Form.Item>

                {editing && (
                    <Space>
                        <Button type="primary" onClick={handleSave}>
                            Save
                        </Button>
                        <Button onClick={handleCancel}>Cancel</Button>
                    </Space>
                )}
            </Form>

            <Modal
                title="Verify Password"
                open={passwordModalVisible}
                onOk={handlePasswordVerification}
                onCancel={() => {
                    setPasswordModalVisible(false);
                    passwordForm.resetFields();
                }}
                okText="Verify & Save"
                cancelText="Cancel"
            >
                <Form form={passwordForm} layout="vertical">
                    <Form.Item
                        name="password"
                        label="Current Password"
                        rules={[{ required: true, message: 'Please enter your current password' }]}
                    >
                        <Input.Password />
                    </Form.Item>
                    {emailChanged && (
                        <Alert
                            message="Notice"
                            description="Changing your email address will require verification. A confirmation email will be sent to your current email address. Please follow the instructions in the email to complete the change."
                            type="info"
                            showIcon
                            style={{ marginTop: 16 }}
                        />
                    )}
                </Form>
            </Modal>
        </div>
    );
});

export default EditProfileForm;