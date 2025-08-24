import { Request, Response, NextFunction } from 'express';
import { User } from '../user/user.entity';

export const checkAdminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const user = req.entity as User;

        if (!user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!user.isAdmin) {
            res.status(403).json({ message: 'Access denied. Admin privileges required' });
            return;
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};