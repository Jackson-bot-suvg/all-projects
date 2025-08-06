import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface for the verification token document
 * @interface IVerificationToken
 * @extends {Document}
 */
export interface IVerificationToken extends Document {
    userId: mongoose.Types.ObjectId;
    token: string;
    email?: string;        // Current email for verification
    newEmail?: string;     // New email address for email change requests
    type: 'email' | 'reset';
    expires: Date;
    createdAt: Date;
}

/**
 * Schema for verification tokens
 * Used for email verification and password reset
 * Also handles email change verification process
 */
const verificationTokenSchema = new Schema<IVerificationToken>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false
    },
    newEmail: {
        type: String,
        required: false,
        // Validate email format
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    type: {
        type: String,
        enum: ['email', 'reset'],
        required: true,
        default: 'email'
    },
    expires: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
    }
}, { 
    timestamps: true,
    expires: 300 // Automatically delete documents after 5 minutes
});

// Create index for faster token lookups
verificationTokenSchema.index({ token: 1 });
// Create index for automatic document expiration
verificationTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

const VerificationToken = mongoose.model<IVerificationToken>('VerificationToken', verificationTokenSchema);
export default VerificationToken; 