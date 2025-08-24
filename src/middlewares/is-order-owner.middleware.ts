import { Request, Response, NextFunction } from 'express';
import { User } from '../user/user.entity';
import { Order} from "../order/entities/order.entity";
import { AppDataSource } from '../data-source';

export const isOrderOwnerMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = req.entity as User;
        const orderId = req.params.id;

        if (!user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!orderId) {
            res.status(400).json({ message: 'Order ID is required' });
            return;
        }

        const orderRepository = AppDataSource.getRepository(Order);
        const order = await orderRepository.findOne({
            where: { id: parseInt(orderId) },
            relations: ['user']
        });

        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }

        if (order.user.id !== user.id) {
            res.status(403).json({ message: 'Access denied. You can only access your own orders' });
            return;
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};