import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomRequest } from '../types/CustomRequest';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const verifyToken = (req: CustomRequest, res: Response, next: NextFunction): void => {
    const token = req.cookies?.token as string | undefined
  
    if (!token) {
      res.status(401).json({ message: 'Unauthorized: No token in cookie' })
      return
    }
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; isAdmin: boolean }
      req.user = { userId: decoded.userId, isAdmin: decoded.isAdmin }
      next()
    } catch {
      res.status(401).json({ message: 'Unauthorized: Invalid or expired token' })
      return
    }
  }

export const requireAdmin = (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user?.isAdmin) {
        res.status(403).json({ message: 'Forbidden: Admin access required' });
        return;
    }
    next();
};
