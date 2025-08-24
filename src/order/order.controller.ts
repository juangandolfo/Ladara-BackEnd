import {Request, Response} from "express";
import {OrderService} from "./order.service";
import {Repository} from "typeorm";
import {Order} from "./entities/order.entity";
import {OrderItem} from "./entities/order-item.entity";
import {Product} from "../product/product.entity";
import {User} from "../user/user.entity";
import {
    AddItemResponse,
    AddItemToOrderDto,
    CancelOrderResponse,
    CreateOrderResponse,
    GetCurrentOrderResponse,
    GetOrderResponse,
    OrderDto,
    OrderItemDto
} from "../dtos/order.dto";

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

    createOrder = async (req: Request, res: Response<CreateOrderResponse>): Promise<void> => {
        try {
            const user = req.entity;
            if (!user) {
                res.status(401).json({success: false, message: "Unauthorized"});
                return;
            }

            const userId = user.id;
            if (!userId) {
                res.status(400).json({success: false, message: "User ID is required"});
                return;
            }
            const order = await this.orderService.createOrder(userId);
            const orderDto = this.transformOrderToDto(order);
            res.status(201).json({success: true, message: "Order created successfully", data: orderDto});
        } catch (error) {
            res.status(500).json({success: false, message: error instanceof Error ? error.message : "Unknown error"});
        }
    };

    getCurrentOrder = async (req: Request, res: Response<GetCurrentOrderResponse>): Promise<void> => {
        const user = req.entity as User;
        const userId = user.id;
        if (!userId) {
            res.status(400).json({success: false, message: "User ID is required"});
            return;
        }
        try {
            const orders = await this.orderService.getCurrentOrder(userId);
            const ordersDto = orders.map(order => this.transformOrderToDto(order));
            res.status(200).json({success: true, message: "Orders retrieved successfully", data: ordersDto});
        } catch (error) {
            res.status(500).json({success: false, message: error instanceof Error ? error.message : "Unknown error"});
        }
    };

    getOrder = async (req: Request, res: Response<GetOrderResponse>): Promise<void> => {
        try {
            const orderId = Number(req.params.id);
            if (!orderId) {
                res.status(400).json({success: false, message: "Order ID is required"});
                return;
            }
            const order = await this.orderService.getOrder(orderId);
            if (!order) {
                res.status(404).json({success: false, message: "Order not found"});
                return;
            }
            const orderDto = this.transformOrderToDto(order);
            res.status(200).json({success: true, message: "Order retrieved successfully", data: orderDto});
        } catch (error) {
            res.status(500).json({success: false, message: error instanceof Error ? error.message : "Unknown error"});
        }
    };

    cancelOrder = async (req: Request, res: Response<CancelOrderResponse>): Promise<void> => {
        try {
            const orderId = Number(req.params.id);
            const order = await this.orderService.cancelOrder(orderId);
            if (!order) {
                res.status(404).json({success: false, message: "Order not found"});
                return;
            }
            const orderDto = this.transformOrderToDto(order);
            res.status(200).json({success: true, message: "Order cancelled successfully", data: orderDto});
        } catch (error) {
            res.status(500).json({success: false, message: error instanceof Error ? error.message : "Unknown error"});
        }
    };

    deleteItemFromOrder = async (req: Request<{ itemId: string }>, res: Response): Promise<void> => {
        try {
            const itemId = Number(req.params.itemId);
            if (!itemId) {
                res.status(400).json({success: false, message: "Item ID is required"});
                return;
            }
            const success = await this.orderService.deleteItemFromOrder(itemId);
            if (!success) {
                res.status(404).json({success: false, message: "Order item not found"});
                return;
            }
            res.status(200).json({success: true, message: "Item deleted from order successfully"});
        } catch (error) {
            res.status(500).json({success: false, message: error instanceof Error ? error.message : "Unknown error"});
        }
    }

    addItemToOrder = async (req: Request<{
        id: string
    }, AddItemResponse, AddItemToOrderDto>, res: Response<AddItemResponse>): Promise<void> => {
        try {
            const orderId = Number(req.params.id);
            const {productId, quantity} = req.body;
            if (!productId || !quantity) {
                res.status(400).json({success: false, message: "Product ID and quantity are required"});
                return;
            }
            const item = await this.orderService.addItemToOrder(orderId, Number(productId), Number(quantity));
            if (!item) {
                res.status(404).json({success: false, message: "Order or product not found"});
                return;
            }
            const itemDto = this.transformOrderItemToDto(item);
            res.status(201).json({success: true, message: "Item added to order successfully", data: itemDto});
        } catch (error) {
            res.status(500).json({success: false, message: error instanceof Error ? error.message : "Unknown error"});
        }
    };

    markOrderCompleted = async (req: Request, res: Response): Promise<void> => {
        try {
            const orderId = Number(req.params.id);
            const order = await this.orderService.markOrderCompleted(orderId);
            if (!order) {
                res.status(404).json({success: false, message: "Order not found"});
                return;
            }
            const orderDto = this.transformOrderToDto(order);
            res.status(200).json({success: true, message: "Order completed successfully", data: orderDto});
        } catch (error) {
            res.status(500).json({success: false, message: error instanceof Error ? error.message : "Unknown error"});
        }
    };


    // Helper methods to transform entities to DTOs
    private transformOrderToDto(order: Order): OrderDto {
        return {
            id: order.id,
            userId: order.user?.id || (order as any).userId, // Adjust based on your entity structure
            status: order.status,
            total: order.total,
            createdAt: order.createdAt.toISOString(),
            updatedAt: (order as any).updatedAt?.toISOString() || order.createdAt.toISOString(), // Fallback to createdAt if updatedAt doesn't exist
            items: order.items?.map(item => this.transformOrderItemToDto(item))
        };
    }

    private transformOrderItemToDto(item: OrderItem): OrderItemDto {
        return {
            id: item.id,
            productId: item.product?.id || (item as any).productId, // Adjust based on your entity structure
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price,
            product: item.product ? {
                id: item.product.id,
                name: item.product.name,
                price: item.product.price
            } : undefined
        };
    }
}