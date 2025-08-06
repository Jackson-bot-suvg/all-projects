import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
    adminId: mongoose.Types.ObjectId;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'DISABLE' | 'ENABLE';
    targetType: 'USER' | 'LISTING' | 'REVIEW';
    targetId: mongoose.Types.ObjectId;
    details: {
        before: any;
        after: any;
    };
    timestamp: Date;
    status: 'SUCCESS' | 'FAILURE';
}

const activityLogSchema = new Schema<IActivityLog>({
    adminId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'DISABLE', 'ENABLE']
    },
    targetType: {
        type: String,
        required: true,
        enum: ['USER', 'LISTING', 'REVIEW']
    },
    targetId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    details: {
        before: Schema.Types.Mixed,
        after: Schema.Types.Mixed
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        required: true,
        enum: ['SUCCESS', 'FAILURE'],
        default: 'SUCCESS'
    }
});

export default mongoose.model<IActivityLog>('ActivityLog', activityLogSchema); 