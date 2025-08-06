import React, { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { profileStore } from '../../stores/ProfileStore';
import { observer } from 'mobx-react-lite';
import type { NamePath } from 'antd/es/form/interface';

const ChangePasswordForm: React.FC = observer(() => {
    const [form] = Form.useForm();
    const [success, setSuccess] = useState(false);

    const onFinish = async (values: any) => {
        setSuccess(false);
        const result = await profileStore.changePassword(values.oldPassword, values.newPassword);
        
        if (result) {
            setSuccess(true);
            form.resetFields();
        } else {
            setSuccess(false);
        }
    };

    return (
        <div>
            <h2>Change Password</h2>
            
            {!success && profileStore.error && (
                <Alert 
                    message="Error" 
                    description={profileStore.error} 
                    type="error" 
                    style={{ marginBottom: 16 }} 
                    showIcon
                />
            )}
            
            {success && (
                <Alert 
                    message="Success" 
                    description="Your password has been changed successfully. A confirmation email has been sent to your email address." 
                    type="success" 
                    style={{ marginBottom: 16 }} 
                    showIcon
                />
            )}
            
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item 
                    name="oldPassword" 
                    label="Current Password" 
                    rules={[{ required: true, message: 'Please enter your current password' }]}
                > 
                    <Input.Password /> 
                </Form.Item>
                
                <Form.Item
                    name="newPassword"
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
                    label="Confirm New Password"
                    dependencies={['newPassword'] as NamePath[]}
                    rules={[
                        { required: true, message: 'Please confirm your new password' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('newPassword') === value) {
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
                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={profileStore.loading}
                    >
                        Change Password
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
});

export default ChangePasswordForm;