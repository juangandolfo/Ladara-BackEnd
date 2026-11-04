import {Request, Response} from "express";
import {OrderService} from "./order.service";
import {Repository} from "typeorm";
import {BillingAddress, Order} from "./entities/order.entity";
import {OrderItem} from "./entities/order-item.entity";
import {Product} from "../product/product.entity";
import {User} from "../user/user.entity";
import {
    AddItemResponse,
    AddItemToOrderDto,
    GetCurrentOrderResponse,
    OrderDto,
    OrderItemDto
} from "../dtos/order.dto";
import {DiscountService} from "../discount/discount.service";
import {BusinessSettingService} from "../business-settings/business-setting.service";
import {EmailService, BillingDetails} from "../email/email.service";

export class OrderController {
    private orderService: OrderService;
    private readonly orderRepo: Repository<Order>;
    private readonly productRepo: Repository<Product>;

    constructor(
        orderRepo: Repository<Order>,
        itemRepo: Repository<OrderItem>,
        productRepo: Repository<Product>,
        userRepo: Repository<User>,
        private discountService: DiscountService,
        businessSettingService?: BusinessSettingService,
        private emailService: EmailService = new EmailService()
    ) {
        this.orderRepo = orderRepo;
        this.productRepo = productRepo;
        this.orderService = new OrderService(orderRepo, itemRepo, productRepo, userRepo, discountService, businessSettingService);
    }

    getCurrentOrder = async (req: Request, res: Response<GetCurrentOrderResponse>): Promise<void> => {
        const user = req.entity as User;
        const userId = user.id;

        try {
            let orders = await this.orderService.getCurrentOrder(userId);

            if (!orders || orders.length === 0) {
                const newOrder = await this.orderService.createOrder(userId);
                orders = [newOrder];
            }

            const ordersDto = orders.map(order => this.transformOrderToDto(order));
            res.status(200).json({success: true, message: "Orders retrieved successfully", data: ordersDto});
        } catch (error) {
            res.status(500).json({success: false, message: error instanceof Error ? error.message : "Unknown error"});
        }
    };

    clearCurrentCart = async (req: Request, res: Response): Promise<void> => {
        const user = req.entity as User | undefined;
        if (!user) {
            res.status(401).json({success: false, message: "User not authenticated"});
            return;
        }

        try {
            await this.orderService.clearCurrentCart(user.id);
            res.status(200).json({success: true, message: "Cart emptied successfully"});
        } catch {
            res.status(500).json({success: false, message: "Internal server error"});
        }
    };

    getOrdersByUser = async (req: Request, res: Response<GetCurrentOrderResponse>): Promise<void> => {
        try {
            const user = req.entity as User;
            const userId = user.id;

            const orders = await this.orderService.getOrdersByUser(userId);
            if (!orders || orders.length === 0) {
                res.status(404).json({success: false, message: "No orders found for this user"});
                return;
            }
            const ordersDto = orders.map(order => this.transformOrderToDto(order));
            res.status(200).json({success: true, message: "Orders retrieved successfully", data: ordersDto});
        } catch (error) {
            res.status(500).json({success: false, message: error instanceof Error ? error.message : "Unknown error"});
        }
    }

    getAllOrdersForAdmin = async (_req: Request, res: Response<GetCurrentOrderResponse>): Promise<void> => {
        try {
            const orders = await this.orderService.getAllOrdersForAdmin();
            const ordersDto = orders.map(order => this.transformOrderToDto(order));
            res.status(200).json({success: true, message: "All orders retrieved successfully", data: ordersDto});
        } catch (error) {
            res.status(500).json({success: false, message: error instanceof Error ? error.message : "Unknown error"});
        }
    };

    getAdminDashboardSummary = async (_req: Request, res: Response): Promise<void> => {
        try {
            const summary = await this.orderService.getAdminDashboardSummary();
            res.status(200).json({success: true, data: summary});
        } catch (error) {
            res.status(500).json({success: false, message: error instanceof Error ? error.message : "Unknown error"});
        }
    };

    updateItemQuantityInOrder = async (req: Request<{ itemId: string }>, res: Response): Promise<void> => {
        try {
            const itemId = Number(req.params.itemId);
            const quantity = Number(req.body.quantity);

            if (!Number.isInteger(quantity) || quantity < 0) {
                res.status(400).json({success: false, message: "Quantity must be a non-negative integer"});
                return;
            }

            const item = await this.orderService.updateItemQuantity(itemId, quantity);
            if (!item) {
                res.status(404).json({success: false, message: "Order item not found"});
                return;
            }

            const itemDto = this.transformOrderItemToDto(item);
            res.status(200).json({success: true, message: "Item quantity updated successfully", data: itemDto});
        } catch (error) {
            res.status(500).json({success: false, message: error instanceof Error ? error.message : "Unknown error"});
        }
    }

    deleteItemFromOrder = async (req: Request<{ itemId: string }>, res: Response): Promise<void> => {
        try {
            const itemId = Number(req.params.itemId);
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

            const existingItem = await this.orderService.findItemInOrder(orderId, Number(productId));

            let item;
            if (existingItem) {
                const newQuantity = existingItem.quantity + Number(quantity);
                item = await this.orderService.updateItemQuantity(existingItem.id, newQuantity);
            } else {
                item = await this.orderService.addItemToOrder(orderId, Number(productId), Number(quantity));
            }

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

    markOrderCompleted = async (req: Request< { id: string }, unknown, { billing?: BillingDetails }>, res: Response): Promise<void> => {
        try {
            const orderId = Number(req.params.id);
            const order = await this.orderService.markOrderCompleted(orderId);
            if (!order) {
                res.status(404).json({success: false, message: "Order not found"});
                return;
            }
            await this.emailService.sendOrderConfirmation(order, req.body?.billing || {});
            const orderDto = this.transformOrderToDto(order);
            res.status(200).json({success: true, message: "Order completed successfully", data: orderDto});
        } catch (error) {
            res.status(500).json({success: false, message: error instanceof Error ? error.message : "Unknown error"});
        }
    };

    initiateCheckout = async (
        req: Request<{ id: string }, unknown, { billingAddress: BillingAddress; paymentMethod: string }>,
        res: Response,
    ): Promise<void> => {
        try {
            const user = req.entity as User;
            const order = await this.orderService.initiateCheckout(
                Number(req.params.id),
                user.id,
                req.body.billingAddress,
                req.body.paymentMethod,
            );
            if (!order) {
                res.status(404).json({success: false, message: "Order not found"});
                return;
            }
            const orderDto = this.transformOrderToDto(order);
            res.status(201).json({success: true, message: "Checkout details saved; payment has not been processed", data: orderDto});
        } catch (error) {
            if (error instanceof Error && error.message === "ORDER_EMPTY") {
                res.status(400).json({success: false, message: "Cannot proceed to checkout with an empty order"});
                return;
            }
            if (error instanceof Error && error.message === "ORDER_NOT_IN_CART") {
                res.status(409).json({success: false, message: "Order has already left the cart state"});
                return;
            }
            res.status(500).json({success: false, message: error instanceof Error ? error.message : "Unknown error"});
        }
    };

    validateCoupon = async (req: Request, res: Response): Promise<void> => {
        try {
            const code = String(req.body?.code ?? "").trim().toUpperCase();
            if (!code) {
                res.status(400).json({success: false, message: "El cupón es obligatorio"});
                return;
            }

            const match = /^SAVE(\d{1,2})$/i.exec(code);
            if (!match) {
                res.status(400).json({success: false, message: "El cupón no es válido o ha expirado"});
                return;
            }

            const discountAmount = Number(match[1]);
            res.status(200).json({
                success: true,
                data: {
                    valid: true,
                    code,
                    discountAmount,
                },
            });
        } catch (error) {
            res.status(500).json({success: false, message: error instanceof Error ? error.message : "Unknown error"});
        }
    };

    validateOrder = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        try {
            const orderId = Number(req.params.id);
            const order = await this.orderRepo.findOne({
                where: { id: orderId },
                relations: ["items", "items.product"],
            });

            if (!order) {
                res.status(404).json({success: false, message: "Order not found"});
                return;
            }

            const rejectedItems: Array<{ itemId: number | string; reason: string; message: string }> = [];
            for (const item of order.items ?? []) {
                if (!item.product) {
                    rejectedItems.push({ itemId: item.id, reason: "PRODUCT_NOT_FOUND", message: "Producto no encontrado" });
                    continue;
                }

                const availableStock = Number(item.product.stock ?? 0);
                if (Number(item.quantity) > availableStock) {
                    rejectedItems.push({ itemId: item.id, reason: "OUT_OF_STOCK", message: "Producto sin stock disponible" });
                }

                const currentPrice = Number(item.product.price ?? 0);
                if (Number(item.price) !== currentPrice) {
                    rejectedItems.push({ itemId: item.id, reason: "PRICE_CHANGED", message: "El precio del producto cambió" });
                }
            }

            const valid = rejectedItems.length === 0;
            res.status(200).json({
                success: valid,
                data: { valid, rejectedItems },
            });
        } catch (error) {
            res.status(500).json({success: false, message: error instanceof Error ? error.message : "Unknown error"});
        }
    };

    getRecommendations = async (req: Request, res: Response): Promise<void> => {
        try {
            const requestedLimit = Number(req.query.limit ?? 4);
            const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(Math.trunc(requestedLimit), 12) : 4;
            const products = await this.productRepo.find({
                take: limit,
                order: { id: "ASC" },
            });

            const recommendations = products.map((product) => ({
                id: product.id,
                name: product.name,
                price: Number(product.price),
                stock: Number(product.stock ?? 0),
                image: product.image,
                category: product.category,
                description: product.description,
            }));

            res.status(200).json({ success: true, message: "Recommended products retrieved successfully", data: recommendations });
        } catch (error) {
            res.status(500).json({success: false, message: error instanceof Error ? error.message : "Unknown error"});
        }
    };


    // Helper methods to transform entities to DTOs
    private transformOrderToDto(order: Order): OrderDto {
        const shippingCost = Number(order.shippingCost);
        if (!Number.isFinite(shippingCost) || shippingCost < 0) {
            throw new Error("Order shipping cost is invalid");
        }

        return {
            id: order.id,
            userId: order.user?.id || (order as any).userId,
            status: order.status,
            total: Number(order.total.toString()),
            shippingCost: Number(shippingCost.toFixed(2)),
            createdAt: order.createdAt.toISOString(),
            updatedAt: (order as any).updatedAt?.toISOString() || order.createdAt.toISOString(),
            billingAddress: order.billingAddress ?? undefined,
            paymentMethod: order.paymentMethod ?? undefined,
            checkoutAt: order.checkoutAt?.toISOString(),
            items: order.items?.map(item => this.transformOrderItemToDto(item))
        };
    }

    private transformOrderItemToDto(item: OrderItem): OrderItemDto {
        return {
            id: item.id,
            productId: item.product?.id || (item as any).productId,
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price,
            product: item.product ? {
                id: item.product.id,
                name: item.product.name,
                price: item.product.price,
                stock: Number(item.product.stock ?? 0),
                discountedPrice: (item as any).discountedPrice ?? item.product.price,
                image: item.product.image,
                category: item.product.category,
                description: item.product.description
            } : undefined
        };
    }
}