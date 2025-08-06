import { Request, Response, NextFunction, RequestHandler } from 'express';
import { loggingService } from '../services/loggingService';
import { CustomRequest } from '../types/CustomRequest';
import { Types } from 'mongoose';

export const getActivityLogs: RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { targetType, startDate, endDate } = req.query;
        
        const filters: any = {};
        if (targetType) filters.targetType = targetType;
        if (startDate) filters.startDate = new Date(startDate as string);
        if (endDate) filters.endDate = new Date(endDate as string);

        const logs = await loggingService.getActivityLogs(filters);
        res.json(logs);
    } catch (err) {
        next(err);
    }
};

export const getAdminActivityLogs: RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.session?.userId) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }

        const logs = await loggingService.getActivityLogs({
            adminId: new Types.ObjectId(req.session.userId)
        });
        res.json(logs);
    } catch (err) {
        next(err);
    }
}; 