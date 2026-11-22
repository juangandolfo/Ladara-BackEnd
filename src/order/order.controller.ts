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
    CheckoutOrderDto,
    GetCurrentOrderResponse,
    OrderFulfillmentUpdateDto,
    OrderDto,
    OrderItemDto
} from "../dtos/order.dto";
import {DiscountService} from "../discount/discount.service";
import {BusinessSettingService} from "../business-settings/business-setting.service";
import {EmailService, BillingDetails} from "../email/email.service";
import {BillingInformation} from "../billing-information/billing-information.entity";
import {AnalyticsEventService} from "../analytics/analytics-event.service";
import {success, error} from "../common/api-response";

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
        private emailService: EmailService = new EmailService(),
        billingInformationRepo?: Repository<BillingInformation>,
        private readonly analyticsEventService?: AnalyticsEventService,
    ) {
        this.orderRepo = orderRepo;
        this.productRepo = productRepo;
        this.orderService = new OrderService(orderRepo, itemRepo, productRepo, userRepo, discountService, businessSettingService, billingInformationRepo);
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
            success(res, ordersDto, "Orders retrieved successfully");
        } catch (err) {
            error(res, err instanceof Error ? err.message : "Unknown error", 500);
        }
    };

    clearCurrentCart = async (req: Request, res: Response): Promise<void> => {
        const user = req.entity as User | undefined;
        if (!user) {
            error(res, "User not authenticated", 401);
            return;
        }

        try {
            await this.orderService.clearCurrentCart(user.id);
            success(res, undefined, "Cart emptied successfully");
        } catch {
            error(res, "Internal server error", 500);
        }
    };

    getOrdersByUser = async (req: Request, res: Response<GetCurrentOrderResponse>): Promise<void> => {
        try {
            const user = req.entity as User;
            const userId = user.id;

            const orders = await this.orderService.getOrdersByUser(userId);
            if (!orders || orders.length === 0) {
                error(res, "No orders found for this user", 404);
                return;
            }
            const ordersDto = orders.map(order => this.transformOrderToDto(order));
            success(res, ordersDto, "Orders retrieved successfully");
        } catch (err) {
            error(res, err instanceof Error ? err.message : "Unknown error", 500);
        }
    }

    getAllOrdersForAdmin = async (_req: Request, res: Response<GetCurrentOrderResponse>): Promise<void> => {
        try {
            const orders = await this.orderService.getAllOrdersForAdmin();
            const ordersDto = orders.map(order => this.transformOrderToDto(order));
            success(res, ordersDto, "All orders retrieved successfully");
        } catch (err) {
            error(res, err instanceof Error ? err.message : "Unknown error", 500);
        }
    };

    getAdminDashboardSummary = async (_req: Request, res: Response): Promise<void> => {
        try {
            const summary = await this.orderService.getAdminDashboardSummary();
            success(res, summary);
        } catch (err) {
            error(res, err instanceof Error ? err.message : "Unknown error", 500);
        }
    };

    updateItemQuantityInOrder = async (req: Request<{ itemId: string }>, res: Response): Promise<void> => {
        try {
            const itemId = Number(req.params.itemId);
            const quantity = Number(req.body.quantity);

            if (!Number.isInteger(quantity) || quantity < 0) {
                error(res, "Quantity must be a non-negative integer", 400);
                return;
            }

            const item = await this.orderService.updateItemQuantity(itemId, quantity);
            if (!item) {
                error(res, "Order item not found", 404);
                return;
            }

            const itemDto = this.transformOrderItemToDto(item);
            success(res, itemDto, "Item quantity updated successfully");
        } catch (err) {
            error(res, err instanceof Error ? err.message : "Unknown error", 500);
        }
    }

    deleteItemFromOrder = async (req: Request<{ itemId: string }>, res: Response): Promise<void> => {
        try {
            const itemId = Number(req.params.itemId);
            const deleted = await this.orderService.deleteItemFromOrder(itemId);
            if (!deleted) {
                error(res, "Order item not found", 404);
                return;
            }
            success(res, undefined, "Item deleted from order successfully");
        } catch (err) {
            error(res, err instanceof Error ? err.message : "Unknown error", 500);
        }
    }

    addItemToOrder = async (req: Request<{
        id: string
    }, AddItemResponse, AddItemToOrderDto>, res: Response<AddItemResponse>): Promise<void> => {
        try {
            const orderId = Number(req.params.id);
            const {productId, quantity} = req.body;
            if (!productId || !quantity) {
                error(res, "Product ID and quantity are required", 400);
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
                error(res, "Order or product not found", 404);
                return;
            }
            const itemDto = this.transformOrderItemToDto(item);
            success(res, itemDto, "Item added to order successfully", 201);
        } catch (err) {
            error(res, err instanceof Error ? err.message : "Unknown error", 500);
        }
    };

    markOrderCompleted = async (req: Request< { id: string }, unknown, { billing?: BillingDetails }>, res: Response): Promise<void> => {
        try {
            const orderId = Number(req.params.id);
            const order = await this.orderService.markOrderCompleted(orderId);
            if (!order) {
                error(res, "Order not found", 404);
                return;
            }
            await this.emailService.sendOrderConfirmation(order, req.body?.billing || {});
            await this.recordActivity("order.completed", "Pedido completado", (req.entity as User)?.name ?? null);
            const orderDto = this.transformOrderToDto(order);
            success(res, orderDto, "Order completed successfully");
        } catch (err) {
            if (err instanceof Error && err.message === "ORDER_COMPLETION_REQUIREMENTS_NOT_MET") {
                error(res, "Order cannot be completed until payment, invoice issuance, and delivery are all recorded", 409);
                return;
            }
            error(res, err instanceof Error ? err.message : "Unknown error", 500);
        }
    };

    updateOrderFulfillment = async (
        req: Request<{ id: string }, unknown, OrderFulfillmentUpdateDto>,
        res: Response,
    ): Promise<void> => {
        try {
            const previousOrder = req.body.paymentStatus === "paid"
                ? await this.orderRepo.findOne({where: {id: Number(req.params.id)}})
                : null;
            const order = await this.orderService.updateOrderFulfillment(Number(req.params.id), req.body);
            if (!order) {
                error(res, "Order not found", 404);
                return;
            }
            if (req.body.paymentStatus === "paid" && previousOrder?.paymentStatus !== "paid") {
                await this.recordActivity("order.payment_confirmed", "Pago confirmado", (req.entity as User)?.name ?? null);
            }
            const orderDto = this.transformOrderToDto(order);
            success(res, orderDto, "Order fulfillment updated successfully");
        } catch (err) {
            error(res, err instanceof Error ? err.message : "Unknown error", 500);
        }
    };

    initiateCheckout = async (
        req: Request<{ id: string }, unknown, CheckoutOrderDto>,
        res: Response,
    ): Promise<void> => {
        try {
            const user = req.entity as User;
            const order = await this.orderService.initiateCheckout(
                Number(req.params.id),
                user.id,
                req.body.billingInformationId,
                req.body.paymentMethod,
            );
            if (!order) {
                error(res, "Order not found", 404);
                return;
            }
            await this.recordActivity("order.placed", "Pedido realizado", null);
            const orderDto = this.transformOrderToDto(order);
            success(res, orderDto, "Checkout details saved; payment has not been processed", 201);
        } catch (err) {
            if (err instanceof Error && err.message === "ORDER_EMPTY") {
                error(res, "Cannot proceed to checkout with an empty order", 400);
                return;
            }
            if (err instanceof Error && err.message === "ORDER_NOT_IN_CART") {
                error(res, "Order has already left the cart state", 409);
                return;
            }
            if (err instanceof Error && err.message === "INVALID_PAYMENT_METHOD") {
                error(res, "Payment method must be bank_transfer or cash", 400);
                return;
            }
            if (err instanceof Error && err.message === "BILLING_INFORMATION_NOT_FOUND") {
                error(res, "Billing information not found for this user", 404);
                return;
            }
            error(res, err instanceof Error ? err.message : "Unknown error", 500);
        }
    };

    validateCoupon = async (req: Request, res: Response): Promise<void> => {
        try {
            const code = String(req.body?.code ?? "").trim().toUpperCase();
            if (!code) {
                error(res, "El cupón es obligatorio", 400);
                return;
            }

            const match = /^SAVE(\d{1,2})$/i.exec(code);
            if (!match) {
                error(res, "El cupón no es válido o ha expirado", 400);
                return;
            }

            const discountAmount = Number(match[1]);
            success(res, {valid: true, code, discountAmount});
        } catch (err) {
            error(res, err instanceof Error ? err.message : "Unknown error", 500);
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
                error(res, "Order not found", 404);
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

            // "success" mirrors cart validity here (can be false without being an error),
            // so it does not fit the standard success()/error() envelope and is left as-is.
            const valid = rejectedItems.length === 0;
            res.status(200).json({
                success: valid,
                data: { valid, rejectedItems },
            });
        } catch (err) {
            error(res, err instanceof Error ? err.message : "Unknown error", 500);
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

            success(res, recommendations, "Recommended products retrieved successfully");
        } catch (err) {
            error(res, err instanceof Error ? err.message : "Unknown error", 500);
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
            billingInformationId: order.billingInformation?.id ?? (order as any).billingInformationId ?? undefined,
            billingAddress: order.billingInformation ? {
                fullName: order.billingInformation.fullName,
                ...(order.billingInformation.company ? {company: order.billingInformation.company} : {}),
                addressLine1: order.billingInformation.addressLine1,
                ...(order.billingInformation.addressLine2 ? {addressLine2: order.billingInformation.addressLine2} : {}),
                city: order.billingInformation.city,
                ...(order.billingInformation.state ? {state: order.billingInformation.state} : {}),
                postalCode: order.billingInformation.postalCode,
                country: order.billingInformation.country,
                ...(order.billingInformation.phone ? {phone: order.billingInformation.phone} : {}),
            } : undefined,
            paymentMethod: order.paymentMethod ?? undefined,
            checkoutAt: order.checkoutAt?.toISOString(),
            paymentStatus: order.paymentStatus ?? "unpaid",
            paymentReference: order.paymentReference ?? null,
            paidAt: order.paidAt?.toISOString() ?? null,
            invoiceIdentifier: order.invoiceIdentifier ?? null,
            invoiceIssuedAt: order.invoiceIssuedAt?.toISOString() ?? null,
            isDelivered: Boolean(order.isDelivered),
            deliveredAt: order.deliveredAt?.toISOString() ?? null,
            deliveryDocumentIdentifier: order.deliveryDocumentIdentifier ?? null,
            completedAt: order.completedAt?.toISOString() ?? null,
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

    private async recordActivity(type: string, description: string, actorName: string | null): Promise<void> {
        try {
            await this.analyticsEventService?.record(type, description, actorName);
        } catch {
            // Dashboard activity must not affect core order operations.
        }
    }
}