import { Router } from "express";
import { OrderController } from "./order.controller";
import { Order } from "./entities/order.entity";
import { OrderItem } from "./entities/order-item.entity";
import { Product } from "../product/product.entity";
import { User } from "../user/user.entity";
import { AppDataSource as dataSource } from "../data-source";

const orderController = new OrderController(
    dataSource.getRepository(Order),
    dataSource.getRepository(OrderItem),
    dataSource.getRepository(Product),
    dataSource.getRepository(User)
);

const router = Router();

// Create order
router.post("/orders", orderController.createOrder);

// Get order by ID (with items)
router.get("/orders/:id", orderController.getOrder);

// Cancel order
router.post("/orders/:id/cancel", orderController.cancelOrder);

// Add item to order
router.post("/orders/:id/items", orderController.addItemToOrder);

// Delete item from order
router.delete("/orders/items/:itemId", orderController.deleteItemFromOrder);

// Mark order as completed (paid)
router.post("/orders/:id/complete", orderController.markOrderCompleted);

export default router;