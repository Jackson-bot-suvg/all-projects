import { Request, Response, NextFunction, RequestHandler } from 'express';
import { CustomRequest } from '../types/CustomRequest';

export const isAdmin: RequestHandler = (req: CustomRequest, res: Response, next: NextFunction): void => {
    try {
        // Check if user is authenticated and has an active session
        if (!req.session || !req.session.userId) {
            res.status(401).json({ message: 'Unauthorized: No session' });
            return;
        }

        // Check if user is an admin
        if (!req.session.isAdmin) {
            res.status(403).json({ message: 'Forbidden: Admin access required' });
            return;
        }

        next();
    } catch (err) {
        next(err);
    }
};

export const isAdminOrSelf: RequestHandler = (req: CustomRequest, res: Response, next: NextFunction): void => {
    try {
        // Check if user is authenticated
        if (!req.session && !req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Allow access if user is admin or if they're accessing their own data
        const userId = req.params.userId || req.body.userId;
        if (
            (req.session && req.session.isAdmin) || 
            (req.user && req.user.userId === userId)
        ) {
            next();
            return;
        }

        res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    } catch (err) {
        next(err);
    }
}; 