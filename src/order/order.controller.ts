import { Request, Response } from "express";
import { OrderService } from "./order.service";
import { Repository } from "typeorm";
import { Order } from "./entities/order.entity";
import { OrderItem } from "./entities/order-item.entity";
import { Product } from "../product/product.entity";
import { User } from "../user/user.entity";

export class OrderController {
    private orderService: OrderService;

    constructor(
        orderRepo: Repository<Order>,
        itemRepo: Repository<OrderItem>,
        productRepo: Repository<Product>,
        userRepo: Repository<User>
    ) {
        this.orderService = new OrderService(orderRepo, itemRepo, productRepo, userRepo);
    }

    // POST /orders
    createOrder = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = Number(req.body.userId);
            if (!userId) {
                res.status(400).json({ success: false, message: "User ID is required" });
                return;
            }
            const order = await this.orderService.createOrder(userId);
            res.status(201).json({ success: true, data: order });
        } catch (error) {
            res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unknown error" });
        }
    };

    // GET /orders/:id
    getOrder = async (req: Request, res: Response): Promise<void> => {
        try {
            const orderId = Number(req.params.id);
            if (!orderId) {
                res.status(400).json({ success: false, message: "Order ID is required" });
                return;
            }
            const order = await this.orderService.getOrder(orderId);
            if (!order) {
                res.status(404).json({ success: false, message: "Order not found" });
                return;
            }
            res.status(200).json({ success: true, data: order });
        } catch (error) {
            res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unknown error" });
        }
    };

    // POST /orders/:id/cancel
    cancelOrder = async (req: Request, res: Response): Promise<void> => {
        try {
            const orderId = Number(req.params.id);
            const order = await this.orderService.cancelOrder(orderId);
            if (!order) {
                res.status(404).json({ success: false, message: "Order not found" });
                return;
            }
            res.status(200).json({ success: true, data: order });
        } catch (error) {
            res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unknown error" });
        }
    };

    // POST /orders/:id/items
    addItemToOrder = async (req: Request, res: Response): Promise<void> => {
        try {
            const orderId = Number(req.params.id);
            const { productId, quantity } = req.body;
            if (!productId || !quantity) {
                res.status(400).json({ success: false, message: "Product ID and quantity are required" });
                return;
            }
            const item = await this.orderService.addItemToOrder(orderId, Number(productId), Number(quantity));
            if (!item) {
                res.status(404).json({ success: false, message: "Order or product not found" });
                return;
            }
            res.status(201).json({ success: true, data: item });
        } catch (error) {
            res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unknown error" });
        }
    };

    // DELETE /orders/items/:itemId
    deleteItemFromOrder = async (req: Request, res: Response): Promise<void> => {
        try {
            const itemId = Number(req.params.itemId);
            const deleted = await this.orderService.deleteItemFromOrder(itemId);
            if (!deleted) {
                res.status(404).json({ success: false, message: "Order item not found" });
                return;
            }
            res.status(200).json({ success: true, message: "Item deleted from order" });
        } catch (error) {
            res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unknown error" });
        }
    };

    // POST /orders/:id/complete
    markOrderCompleted = async (req: Request, res: Response): Promise<void> => {
        try {
            const orderId = Number(req.params.id);
            const order = await this.orderService.markOrderCompleted(orderId);
            if (!order) {
                res.status(404).json({ success: false, message: "Order not found" });
                return;
            }
            res.status(200).json({ success: true, data: order });
        } catch (error) {
            res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unknown error" });
        }
    };
}