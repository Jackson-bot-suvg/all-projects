import ActivityLog, { IActivityLog } from '../models/activityLog';
import { Types } from 'mongoose';

interface LogData {
    adminId: Types.ObjectId;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'DISABLE' | 'ENABLE';
    targetType: 'USER' | 'LISTING' | 'REVIEW';
    targetId: Types.ObjectId;
    details: {
        before?: any;
        after?: any;
    };
}

class LoggingService {
    async logActivity(data: LogData): Promise<IActivityLog> {
        try {
            const log = await ActivityLog.create({
                ...data,
                timestamp: new Date(),
                status: 'SUCCESS'
            });
            return log;
        } catch (error) {
            console.error('Failed to create activity log:', error);
            throw error;
        }
    }

    async getActivityLogs(filters?: {
        adminId?: Types.ObjectId;
        targetType?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<IActivityLog[]> {
        try {
            let query: any = {};
            
            if (filters?.adminId) {
                query.adminId = filters.adminId;
            }
            
            if (filters?.targetType) {
                query.targetType = filters.targetType;
            }
            
            if (filters?.startDate || filters?.endDate) {
                query.timestamp = {};
                if (filters?.startDate) {
                    query.timestamp.$gte = filters.startDate;
                }
                if (filters?.endDate) {
                    query.timestamp.$lte = filters.endDate;
                }
            }

            return await ActivityLog.find(query)
                .sort({ timestamp: -1 })
                .populate('adminId', 'firstname lastname email');
        } catch (error) {
            console.error('Failed to fetch activity logs:', error);
            throw error;
        }
    }
}

export const loggingService = new LoggingService(); 