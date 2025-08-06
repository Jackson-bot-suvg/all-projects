import nodemailer from 'nodemailer';
import { IUser } from '../models/userModel';

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Email templates
const getVerificationEmailTemplate = (verificationLink: string) => `
    <h1>Email Verification Required</h1>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="${verificationLink}">Verify Email</a>
    <p>This link will expire in 24 hours.</p>
    <p>If you did not request this change, please ignore this email.</p>
`;

const getEmailChangeNotificationTemplate = () => `
    <h1>Email Address Change Notification</h1>
    <p>This email is to notify you that a request has been made to change your email address.</p>
    <p>If you did not make this request, please contact support immediately.</p>
`;

const getPasswordChangeConfirmationTemplate = () => `
    <h1>Password Change Confirmation</h1>
    <p>Your password has been successfully changed.</p>
    <p>If you did not make this change, please contact our support team immediately.</p>
`;

const getPasswordResetTemplate = (resetLink: string) => `
    <h1>Password Reset Request</h1>
    <p>You have requested to reset your password. Click the link below to set a new password:</p>
    <a href="${resetLink}">Reset Password</a>
    <p>This link will expire in 24 hours.</p>
    <p>If you did not request this change, please ignore this email.</p>
`;

const getEmailChangeConfirmationTemplate = (confirmationLink: string, newEmail: string) => `
    <h1>Confirm Email Address Change</h1>
    <p>A request has been made to change your email address to: <strong>${newEmail}</strong></p>
    <p>To confirm this change, please click the link below:</p>
    <a href="${confirmationLink}">Confirm Email Change</a>
    <p>This link will expire in 5 minutes.</p>
    <p>If you did not request this change, please ignore this email and your email will remain unchanged.</p>
`;

class EmailService {
    async sendVerificationEmail(email: string, token: string) {
        const verificationLink = `${process.env.CLIENT_URL}/verify-email/${token}`;
        
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify your email address',
            html: getVerificationEmailTemplate(verificationLink)
        });
    }

    async sendEmailChangeNotification(email: string) {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your email address is being changed',
            html: getEmailChangeNotificationTemplate()
        });
    }

    async sendPasswordChangeConfirmation(email: string) {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Change Confirmation',
            html: getPasswordChangeConfirmationTemplate()
        });
    }

    async sendPasswordResetEmail(email: string, token: string) {
        const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;
        
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Reset Your Password',
            html: getPasswordResetTemplate(resetLink)
        });
    }

    async sendEmailChangeConfirmation(currentEmail: string, newEmail: string, token: string) {
        const confirmationLink = `${process.env.CLIENT_URL}/confirm-email-change/${token}`;
        
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: currentEmail,
            subject: 'Confirm Email Address Change',
            html: getEmailChangeConfirmationTemplate(confirmationLink, newEmail)
        });
    }
}

export const emailService = new EmailService(); 