import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/userModel';
import { CustomRequest } from '../types/CustomRequest';
import { emailService } from '../services/emailService';
import VerificationToken from '../models/verificationToken';
import crypto from 'crypto';
import { AuthErrorCode } from '../types/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { firstname, lastname, email, password } = req.body;

        if (!firstname || !lastname || !email || !password) {
            res.status(400).json({
                code: AuthErrorCode.MISSING_FIELDS,
                message: 'Please fill in all required fields'
            });
            return;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(409).json({
                code: AuthErrorCode.USER_EXISTS,
                message: 'This email is already registered. Please use a different email or try logging in.'
            });
            return;
        }

        const newUser = new User({
            firstname,
            lastname,
            email,
            password,
            registrationDate: new Date()
        });

        await newUser.save();

        // Generate verification token
        const token = crypto.randomBytes(32).toString('hex');
        const verificationToken = new VerificationToken({
            userId: newUser._id,
            token,
            type: 'email'
        });
        await verificationToken.save();

        // Send verification email
        await emailService.sendVerificationEmail(email, token);
        
        res.status(201).json({ 
            message: 'Registration successful. Please check your email to verify your account.'
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({
            code: AuthErrorCode.SERVER_ERROR,
            message: 'Server error occurred. Please try again later.'
        });
    }
};

export const login = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }) as IUser;
        if (!user) {
            res.status(401).json({
                code: AuthErrorCode.INVALID_CREDENTIALS,
                message: 'Invalid email or password. Please check your credentials and try again.'
            });
            return;
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({
                code: AuthErrorCode.INVALID_CREDENTIALS,
                message: 'Invalid email or password. Please check your credentials and try again.'
            });
            return;
        }

        if (user.disabled) {
            res.status(403).json({
                code: AuthErrorCode.ACCOUNT_DISABLED,
                message: 'Your account has been disabled. Please contact support for assistance.'
            });
            return;
        }

        if (!user.verified && !user.isAdmin) {
            res.status(403).json({
                code: AuthErrorCode.EMAIL_NOT_VERIFIED,
                message: 'Please verify your email before logging in. Check your inbox for the verification link.'
            });
            return;
        }

        user.lastLogin = new Date();
        await user.save();

        if (user.isAdmin) {
            // Set admin session
            if (!user._id) {
                res.status(500).json({
                    code: AuthErrorCode.SERVER_ERROR,
                    message: 'Server error occurred. Please try again later.'
                });
                return;
            }
            req.session.userId = user._id.toString();
            req.session.isAdmin = true;
            
            res.json({
                user: {
                    _id: user._id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email,
                    isAdmin: user.isAdmin
                }
            });
        } else {
            // Generate JWT token for regular users
            const token = jwt.sign(
                { userId: user._id, isAdmin: user.isAdmin },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.cookie('token', token, {
                httpOnly: true,
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.json({
                user: {
                    _id: user._id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email,
                    isAdmin: user.isAdmin
                }
            });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            code: AuthErrorCode.SERVER_ERROR,
            message: 'Server error occurred. Please try again later.'
        });
    }
};

export const logout = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (req.session.isAdmin) {
            // Destroy admin session
            req.session.destroy((err) => {
                if (err) {
                    next(err);
                    return;
                }
                res.clearCookie('connect.sid');
                res.json({ message: 'Logged out successfully' });
            });
        } else {
            // Clear JWT cookie for regular users
            res.clearCookie('token');
            res.json({ message: 'Logged out successfully' });
        }
    } catch (err) {
        next(err);
    }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token } = req.params;

        const verificationToken = await VerificationToken.findOne({ token });
        if (!verificationToken) {
            res.status(400).json({ 
                code: AuthErrorCode.INVALID_TOKEN,
                message: 'The verification link is invalid. Please request a new one.'
            });
            return;
        }

        const user = await User.findById(verificationToken.userId);
        if (!user) {
            res.status(404).json({ 
                code: AuthErrorCode.USER_NOT_FOUND,
                message: 'User account not found. Please check your email or register for a new account.'
            });
            return;
        }

        // If this is an email change verification, update the email
        if (verificationToken.email) {
            if (verificationToken.type === 'email') {
                user.email = verificationToken.email;
                user.verified = true;
                await user.save();
                
                // Send notification to new email
                await emailService.sendEmailChangeNotification(verificationToken.email);
            }
        } else {
            // Regular email verification
            user.verified = true;
            await user.save();
        }

        await verificationToken.deleteOne();

        res.json({ 
            success: true,
            message: 'Email verified successfully! You can now log in.',
            user: {
                _id: user._id,
                email: user.email,
                verified: user.verified
            }
        });
    } catch (err) {
        console.error('Email verification error:', err);
        res.status(500).json({ 
            code: AuthErrorCode.SERVER_ERROR,
            message: 'Server error occurred. Please try again later.'
        });
    }
};

export const getCurrentUser = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        let userId: string;

        if (req.session.isAdmin && req.session.userId) {
            userId = req.session.userId;
        } else if (req.user) {
            userId = req.user.userId;
        } else {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.json({ user });
    } catch (err) {
        next(err);
    }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({ message: 'No account found with this email' });
            return;
        }

        // Generate reset token
        const token = crypto.randomBytes(32).toString('hex');
        await VerificationToken.create({
            userId: user._id,
            token,
            type: 'reset'
        });

        // Send reset email
        await emailService.sendPasswordResetEmail(email, token);
        
        res.json({ message: 'Password reset instructions have been sent to your email' });
    } catch (err) {
        next(err);
    }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const verificationToken = await VerificationToken.findOne({ token, type: 'reset' });
        if (!verificationToken) {
            res.status(400).json({ message: 'Invalid or expired reset token' });
            return;
        }

        const user = await User.findById(verificationToken.userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Update password and handle core operations
        user.password = password;

        // Process save and token deletion in parallel
        await Promise.all([
            user.save(),
            verificationToken.deleteOne()
        ]);

        // Send response immediately
        res.json({ message: 'Password has been reset successfully' });

        // Send confirmation email asynchronously after response
        emailService.sendPasswordChangeConfirmation(user.email)
            .catch(err => console.error('Failed to send password change confirmation email:', err));

    } catch (err) {
        next(err);
    }
};
