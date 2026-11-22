import {Between, Not, Repository} from "typeorm";
import {Order} from "./entities/order.entity";
import {OrderItem} from "./entities/order-item.entity";
import {Product} from "../product/product.entity";
import {User} from "../user/user.entity";
import {DiscountService} from "../discount/discount.service";
import {OrderStatus} from "./types/order-status.type";
import {BusinessSettingService} from "../business-settings/business-setting.service";
import {OrderFulfillmentUpdateDto} from "../dtos/order.dto";
import {BillingInformation} from "../billing-information/billing-information.entity";
import {sanitizePrice, sanitizeString} from "../common/normalize";

export type CartItemInput = {
    id?: number | string;
    cart_item_id?: number | string;
    product_id?: number | string;
    productId?: number | string;
    variant_id?: number | string;
    variantId?: number | string;
    seller_id?: number | string;
    sellerId?: number | string;
    quantity?: number | string;
    unit_price?: number | string;
    price?: number | string;
    subtotal?: number | string;
    [key: string]: any;
};

export class OrderService {
    private readonly orderRepo: Repository<Order>;
    private readonly itemRepo: Repository<OrderItem>;
    private readonly productRepo: Repository<Product>;
    private readonly userRepo: Repository<User>;

    constructor(orderRepo: Repository<Order>, itemRepo: Repository<OrderItem>, productRepo: Repository<Product>, userRepo: Repository<User>, private discountService: DiscountService, private businessSettingService?: BusinessSettingService, private billingInformationRepo?: Repository<BillingInformation>) {
        this.orderRepo = orderRepo;
        this.itemRepo = itemRepo;
        this.productRepo = productRepo;
        this.userRepo = userRepo;
    }

    static calculateCartTotal(subtotal: number, discountAmount: number, taxAmount: number, shippingCost: number): number {
        const normalizedSubtotal = sanitizePrice(subtotal);
        const normalizedDiscount = sanitizePrice(discountAmount);
        const normalizedTax = sanitizePrice(taxAmount);
        const normalizedShipping = sanitizePrice(Math.max(0, shippingCost));
        return sanitizePrice(normalizedSubtotal - normalizedDiscount + normalizedTax + normalizedShipping);
    }

    static getCartItemKey(item: CartItemInput): string {
        const productId = item.product_id ?? item.productId;
        const variantId = item.variant_id ?? item.variantId ?? "";
        const sellerId = item.seller_id ?? item.sellerId;

        if (productId === undefined || productId === null || productId === "") {
            throw new Error("product_id is required");
        }
        if (sellerId === undefined || sellerId === null || sellerId === "") {
            throw new Error("seller_id is required");
        }

        return `${productId}|${variantId}|${sellerId}`;
    }

    static validateCartItemPayload(item: CartItemInput): CartItemInput {
        if (!item || typeof item !== "object") {
            throw new Error("Cart item payload is required");
        }

        const productId = item.product_id ?? item.productId;
        const sellerId = item.seller_id ?? item.sellerId;
        const quantity = Number(sanitizeString(item.quantity));
        const unitPrice = Number(sanitizeString(item.unit_price ?? item.price ?? 0));

        if (productId === undefined || productId === null || sanitizeString(productId) === "") {
            throw new Error("product_id is required");
        }
        if (sellerId === undefined || sellerId === null || sanitizeString(sellerId) === "") {
            throw new Error("seller_id is required");
        }
        if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 1) {
            throw new Error("quantity must be at least 1; quantity must be a whole number");
        }
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            throw new Error("unit_price must be a valid non-negative number");
        }

        const normalizedPrice = sanitizePrice(unitPrice);
        const normalized: CartItemInput = {
            ...item,
            product_id: Number(sanitizeString(productId)),
            productId: Number(sanitizeString(productId)),
            seller_id: sanitizeString(sellerId),
            sellerId: sanitizeString(sellerId),
            quantity: Number(quantity),
            unit_price: normalizedPrice,
            price: normalizedPrice,
            subtotal: sanitizePrice(Number(quantity) * normalizedPrice),
        };

        if (item.variant_id !== undefined || item.variantId !== undefined) {
            normalized.variant_id = item.variant_id ?? item.variantId;
            normalized.variantId = item.variant_id ?? item.variantId;
        }

        return normalized;
    }

    static mergeCartItems(guestCartItems: CartItemInput[] = [], authenticatedCartItems: CartItemInput[] = []): CartItemInput[] {
        const merged = new Map<string, CartItemInput>();

        for (const cartItems of [authenticatedCartItems, guestCartItems]) {
            for (const item of cartItems) {
                const normalized = this.validateCartItemPayload(item);
                const key = this.getCartItemKey(normalized);
                const existing = merged.get(key);

                if (existing) {
                    existing.quantity = Number(existing.quantity) + Number(normalized.quantity);
                    existing.unit_price = existing.unit_price ?? normalized.unit_price;
                    existing.price = existing.price ?? normalized.unit_price;
                    existing.subtotal = sanitizePrice(Number(existing.quantity) * Number(existing.unit_price ?? 0));
                    continue;
                }

                merged.set(key, {
                    ...normalized,
                    subtotal: sanitizePrice(Number(normalized.quantity) * Number(normalized.unit_price ?? 0)),
                });
            }
        }

        return Array.from(merged.values());
    }

    static upsertCartItem(items: CartItemInput[] = [], incomingItem: CartItemInput): CartItemInput[] {
        const normalized = this.validateCartItemPayload(incomingItem);
        const nextItems = (items ?? []).map((item) => this.validateCartItemPayload(item));
        const key = this.getCartItemKey(normalized);

        const existingIndex = nextItems.findIndex((item) => this.getCartItemKey(item) === key);
        if (existingIndex >= 0) {
            const existingItem = nextItems[existingIndex];
            existingItem.quantity = Number(existingItem.quantity) + Number(normalized.quantity);
            existingItem.subtotal = sanitizePrice(Number(existingItem.quantity) * Number(existingItem.unit_price ?? 0));
            return nextItems;
        }

        const itemToAdd: CartItemInput = {
            ...normalized,
            subtotal: sanitizePrice(Number(normalized.quantity) * Number(normalized.unit_price ?? 0)),
        };
        nextItems.push(itemToAdd);
        return nextItems;
    }

    static buildCartSummary(items: CartItemInput[] = []): { uniqueItemCount: number; totalUnitCount: number; subtotal: number } {
        const normalized = (items ?? []).map((item) => this.validateCartItemPayload(item));
        const uniqueKeys = new Set(normalized.map((item) => this.getCartItemKey(item)));
        const totalUnitCount = normalized.reduce((sum, item) => sum + Number(item.quantity), 0);
        const subtotal = normalized.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price ?? item.price ?? 0), 0);

        return {
            uniqueItemCount: uniqueKeys.size,
            totalUnitCount,
            subtotal: sanitizePrice(subtotal),
        };
    }

    static updateCartItemQuantity(items: CartItemInput[] = [], cartItemId: number | string, newQuantity: number, availableStock?: number): { items: CartItemInput[]; warning?: string } {
        const parsedQuantity = Number(newQuantity);
        if (!Number.isFinite(parsedQuantity) || !Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
            throw new Error("quantity must be non-negative; quantity must be a whole number");
        }

        const nextItems = (items ?? []).map((item) => this.validateCartItemPayload(item));
        const targetIndex = nextItems.findIndex((item) => String(item.id ?? item.cart_item_id) === String(cartItemId));

        if (targetIndex < 0) {
            return { items: nextItems };
        }

        if (parsedQuantity === 0) {
            nextItems.splice(targetIndex, 1);
            return { items: nextItems };
        }

        let finalQuantity = parsedQuantity;
        let warning: string | undefined;
        if (typeof availableStock === "number" && Number.isFinite(availableStock) && finalQuantity > availableStock) {
            finalQuantity = Number(availableStock);
            warning = "Maximum available stock reached";
        }

        nextItems[targetIndex].quantity = finalQuantity;
        nextItems[targetIndex].subtotal = sanitizePrice(finalQuantity * Number(nextItems[targetIndex].unit_price ?? nextItems[targetIndex].price ?? 0));

        return { items: nextItems, warning };
    }

    static removeCartItem(items: CartItemInput[] = [], cartItemId: number | string): CartItemInput[] {
        return (items ?? []).filter((item) => String(item.id ?? item.cart_item_id) !== String(cartItemId));
    }

    static applyPromoToCart(
        promoCode: string,
        subtotal: number,
        promo: {
            code?: string;
            discountType?: string;
            value?: number;
            expiresAt?: string | Date;
            minimumSpend?: number;
            active?: boolean;
        } = {},
    ): { discountAmount: number; description: string } {
        const normalizedCode = sanitizeString(promoCode);
        const definition = { ...promo, code: promo.code ?? normalizedCode };
        const resolvedCode = sanitizeString(definition.code, {uppercase: true});

        if (!normalizedCode || !resolvedCode || normalizedCode.toUpperCase() !== resolvedCode) {
            throw new Error("The promotional code you entered is invalid or expired");
        }

        if (definition.active === false) {
            throw new Error("The promotional code you entered is invalid or expired");
        }

        const expiry = definition.expiresAt ? new Date(definition.expiresAt) : null;
        if (expiry && Number.isNaN(expiry.getTime())) {
            throw new Error("The promotional code you entered is invalid or expired");
        }
        if (expiry && expiry.getTime() < Date.now()) {
            throw new Error("The promotional code you entered is invalid or expired");
        }

        const minimumSpend = Number(definition.minimumSpend ?? 0);
        if (Number(subtotal) < minimumSpend) {
            throw new Error("The promotional code you entered is invalid or expired");
        }

        const discountType = sanitizeString(definition.discountType ?? "percent").toLowerCase();
        const discountValue = Number(definition.value ?? 0);

        if (!Number.isFinite(discountValue) || discountValue <= 0) {
            throw new Error("The promotional code you entered is invalid or expired");
        }

        let discountAmount = 0;
        if (discountType === "percent") {
            discountAmount = sanitizePrice((Number(subtotal) * discountValue) / 100);
        } else if (discountType === "fixed") {
            discountAmount = sanitizePrice(Math.min(Number(subtotal), discountValue));
        } else {
            throw new Error("The promotional code you entered is invalid or expired");
        }

        return {
            discountAmount,
            description: `${resolvedCode} - ${discountType === "percent" ? `${discountValue}% off` : `$${discountValue.toFixed(2)} off`}`,
        };
    }

    static validateCheckout(
        items: CartItemInput[] = [],
        catalog: Record<string | number, { price?: number; stock?: number; restricted?: boolean }> = {},
    ): { ok: boolean; conflicts: Array<{ cart_item_id: number | string; message: string }> } {
        const conflicts: Array<{ cart_item_id: number | string; message: string }> = [];

        for (const item of items) {
            const normalized = this.validateCartItemPayload(item);
            const productId = Number(normalized.product_id ?? normalized.productId);
            const catalogEntry = catalog[productId] ?? catalog[String(productId)];

            if (!catalogEntry) {
                conflicts.push({ cart_item_id: normalized.cart_item_id ?? normalized.id ?? productId, message: `Product ${productId} is unavailable` });
                continue;
            }

            const requestedQuantity = Number(normalized.quantity ?? 0);
            const stock = Number(catalogEntry.stock ?? 0);
            const price = Number(catalogEntry.price ?? 0);

            if (requestedQuantity > stock) {
                conflicts.push({ cart_item_id: normalized.cart_item_id ?? normalized.id ?? productId, message: `Product ${productId} exceeds available stock` });
            }
            if (price !== Number(normalized.unit_price ?? normalized.price ?? 0)) {
                conflicts.push({ cart_item_id: normalized.cart_item_id ?? normalized.id ?? productId, message: `Price mismatch for product ${productId}` });
            }
            if (catalogEntry.restricted) {
                conflicts.push({ cart_item_id: normalized.cart_item_id ?? normalized.id ?? productId, message: `Product ${productId} is restricted for checkout` });
            }
        }

        return {
            ok: conflicts.length === 0,
            conflicts,
        };
    }

    async createOrder(userId: string): Promise<Order> {
        const user = await this.userRepo.findOneBy({id: userId});
        if (!user) throw new Error("User not found");

        const existingOrder = await this.orderRepo.findOne({
            where: {user: {id: userId}, status: OrderStatus.CART},
            relations: ["items", "items.product"],
        });
        if (existingOrder) return existingOrder;

        const shippingCost = await this.getCurrentShippingCost();
        const order = this.orderRepo.create({user, status: OrderStatus.CART, total: shippingCost, shippingCost, items: []});
        return this.orderRepo.save(order);
    }

    async getCurrentOrder(userId: string): Promise<Order[]> {
        const orders = await this.orderRepo.find({
            where: {user: {id: userId}, status: OrderStatus.CART},
            relations: ["items", "items.product", "user", "billingInformation"],
        });

        for (const order of orders) {
            order.total = await this.calculateOrderTotal(order);
            await this.orderRepo.save(order);
            for (const item of order.items) {
                const originalPrice = parseFloat(item.price.toString());
                const discountedPrice = await this.applyDiscountsToPrice(
                    item.product.id,
                    originalPrice,
                    order.user
                );
                (item as any).discountedPrice = discountedPrice;
            }
        }

        return orders;
    }

    async clearCurrentCart(userId: string): Promise<void> {
        const order = await this.orderRepo.findOne({
            where: {user: {id: userId}, status: OrderStatus.CART},
            relations: ["items", "items.product", "user", "billingInformation"],
        });
        if (!order) return;

        await this.itemRepo.delete({orderId: order.id});
        order.items = [];
        order.total = await this.calculateOrderTotal(order);
        await this.orderRepo.save(order);
    }

    async getOrdersByUser(userId: string): Promise<Order[]> {
        const orders = await this.orderRepo.find({
            where: {user: {id: userId}, status: Not(OrderStatus.CART)},
            relations: ["items", "items.product", "user", "billingInformation"],
            order: {createdAt: "DESC"}
        });

        for (const order of orders) {
            for (const item of order.items) {
                const originalPrice = parseFloat(item.price.toString());
                const discountedPrice = await this.applyDiscountsToPrice(
                    item.product.id,
                    originalPrice,
                    order.user
                );
                (item as any).discountedPrice = discountedPrice;
            }
        }

        return orders;
    }

    async getAllOrdersForAdmin(): Promise<Order[]> {
        return this.orderRepo.find({
            relations: ["items", "items.product", "user", "billingInformation"],
            order: {createdAt: "DESC"},
        });
    }

    async getAdminDashboardSummary(): Promise<{
        cartCount: number;
        orderPlacedCount: number;
        completedLast30DaysCount: number;
    }> {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const [cartCount, orderPlacedCount, completedLast30DaysCount] = await Promise.all([
            this.orderRepo.count({where: {status: OrderStatus.CART}}),
            this.orderRepo.count({where: {status: OrderStatus.ORDER_PLACED}}),
            this.orderRepo.count({
                where: {
                    status: OrderStatus.COMPLETED,
                    completedAt: Between(thirtyDaysAgo, now),
                },
            }),
        ]);

        return {cartCount, orderPlacedCount, completedLast30DaysCount};
    }

    async applyDiscountsToPrice(productId: number, originalPrice: number, user: User): Promise<number | null> {
        const discounts = await this.discountService.listDiscountsByUser(user.id);

        if (!discounts || discounts.length === 0) {
            return null;
        }

        let finalPrice = originalPrice;
        let discountApplied = false;

        for await (const discount of discounts) {
            if (discount.type === 'percent') {
                const discountedPrice = originalPrice * (1 - (discount.value / 100));
                if (discountedPrice < finalPrice) {
                    finalPrice = discountedPrice;
                    discountApplied = true;
                }
            } else if (discount.type === 'fixed') {
                const discountedPrice = originalPrice - discount.value;
                if (discountedPrice < finalPrice) {
                    finalPrice = discountedPrice;
                    discountApplied = true;
                }
            }
        }

        return discountApplied ? finalPrice : null;
    }

    async addItemToOrder(orderId: number, productId: number, quantity: number): Promise<OrderItem | null> {
        const order = await this.orderRepo.findOne({
            where: {id: orderId},
            relations: ["items", "items.product", "user", "billingInformation"],
        });
        const product = await this.productRepo.findOneBy({id: productId});
        if (!order || !product) return null;

        const item = this.itemRepo.create({
            order,
            orderId: order.id,
            product,
            quantity,
            price: product.price,
        });
        await this.itemRepo.save(item);

        order.items = order.items ?? [];
        order.total = await this.calculateOrderTotal(order);
        await this.orderRepo.save(order);
        return item;
    }

    async updateItemQuantity(itemId: number, quantity: number): Promise<OrderItem | null> {
        const item = await this.itemRepo.findOne({
            where: {id: itemId},
            relations: ["order", "order.user", "order.items", "order.items.product", "product"],
        });
        if (!item) return null;

        const order = item.order;
        if (quantity <= 0) {
            await this.itemRepo.delete(itemId);
            order.items = order.items?.filter(existing => existing.id !== itemId) ?? [];
            order.total = await this.calculateOrderTotal(order);
            await this.orderRepo.save(order);
            return item;
        }

        item.quantity = quantity;
        await this.itemRepo.save(item);
        order.items = order.items ?? [];
        order.total = await this.calculateOrderTotal(order);
        await this.orderRepo.save(order);
        return item;
    }

    async deleteItemFromOrder(itemId: number): Promise<boolean> {
        const item = await this.itemRepo.findOne({
            where: {id: itemId},
            relations: ["order", "order.user", "order.items", "order.items.product", "product"],
        });
        if (!item) return false;

        const newQuantity = item.quantity - 1;

        if (newQuantity <= 0) {
            await this.itemRepo.delete(itemId);
            item.order.items = item.order.items?.filter(existing => existing.id !== itemId) ?? [];
            item.order.total = await this.calculateOrderTotal(item.order);
            await this.orderRepo.save(item.order);
            return true;
        }

        item.quantity = newQuantity;
        await this.itemRepo.save(item);
        item.order.items = item.order.items ?? [];
        item.order.total = await this.calculateOrderTotal(item.order);
        await this.orderRepo.save(item.order);
        return true;
    }

    async markOrderCompleted(orderId: number): Promise<Order | null> {
        const order = await this.orderRepo.findOne({
            where: {id: orderId},
            relations: ["items", "items.product", "user", "billingInformation"],
        });
        if (!order) return null;
        if (!this.hasCompletedFulfillment(order)) {
            throw new Error("ORDER_COMPLETION_REQUIREMENTS_NOT_MET");
        }
        this.synchronizeCompletionStatus(order);
        order.total = await this.calculateOrderTotal(order);
        return this.orderRepo.save(order);
    }

    async updateOrderFulfillment(orderId: number, update: OrderFulfillmentUpdateDto): Promise<Order | null> {
        const order = await this.orderRepo.findOne({
            where: {id: orderId},
            relations: ["items", "items.product", "user", "billingInformation"],
        });
        if (!order) return null;

        const updatedAt = new Date();
        if (update.paymentStatus !== undefined) {
            order.paymentStatus = update.paymentStatus;
            order.paidAt = update.paymentStatus === "paid" ? (order.paidAt ?? updatedAt) : null;
        }
        if (update.paymentReference !== undefined) {
            order.paymentReference = update.paymentReference === null ? null : sanitizeString(update.paymentReference);
        }

        if (update.invoiceIdentifier !== undefined) {
            order.invoiceIdentifier = update.invoiceIdentifier === null ? null : sanitizeString(update.invoiceIdentifier);
            if (order.invoiceIdentifier && !order.invoiceIssuedAt) {
                order.invoiceIssuedAt = updatedAt;
            }
        }
        if (update.invoiceIssued !== undefined) {
            order.invoiceIssuedAt = update.invoiceIssued ? (order.invoiceIssuedAt ?? updatedAt) : null;
            if (!update.invoiceIssued) {
                order.invoiceIdentifier = null;
            }
        }

        if (update.isDelivered !== undefined) {
            order.isDelivered = update.isDelivered;
            order.deliveredAt = update.isDelivered ? (order.deliveredAt ?? updatedAt) : null;
        }
        if (update.deliveryDocumentIdentifier !== undefined) {
            order.deliveryDocumentIdentifier = update.deliveryDocumentIdentifier === null
                ? null
                : sanitizeString(update.deliveryDocumentIdentifier);
        }

        this.synchronizeCompletionStatus(order);
        return this.orderRepo.save(order);
    }

    async initiateCheckout(orderId: number, userId: string, billingInformationId: number, paymentMethod: string): Promise<Order | null> {
        const normalizedPaymentMethod = typeof paymentMethod === "string" ? paymentMethod.trim() : "";
        if (normalizedPaymentMethod !== "bank_transfer" && normalizedPaymentMethod !== "cash") {
            throw new Error("INVALID_PAYMENT_METHOD");
        }
        if (!this.billingInformationRepo) throw new Error("BILLING_INFORMATION_SERVICE_UNAVAILABLE");
        const billingInformation = await this.billingInformationRepo.findOne({
            where: {id: billingInformationId, user: {id: userId}},
        });
        if (!billingInformation) throw new Error("BILLING_INFORMATION_NOT_FOUND");

        const order = await this.orderRepo.findOne({
            where: {id: orderId, user: {id: userId}},
            relations: ["items", "items.product", "user", "billingInformation"],
        });
        if (!order) return null;
        if (order.status !== OrderStatus.CART) {
            throw new Error("ORDER_NOT_IN_CART");
        }
        if (!order.items?.length) {
            throw new Error("ORDER_EMPTY");
        }

        order.billingInformation = billingInformation;
        order.billingCountrySnapshot = billingInformation.country;
        order.paymentMethod = normalizedPaymentMethod;
        order.checkoutAt = new Date();
        order.status = OrderStatus.ORDER_PLACED;
        for (const item of order.items ?? []) {
            item.categoryIdSnapshot = item.product?.categoryId ?? null;
            item.categoryNameSnapshot = item.product?.category ?? null;
        }
        order.total = await this.calculateOrderTotal(order);
        return this.orderRepo.save(order);
    }

    async findItemInOrder(orderId: number, productId: number): Promise<OrderItem | null> {
        return this.itemRepo.findOne({
            where: {order: {id: orderId}, product: {id: productId}},
            relations: ["order", "product"],
        });
    }

    private async getCurrentShippingCost(subtotal = 0): Promise<number> {
        if (!this.businessSettingService) {
            return 0;
        }
        return this.businessSettingService.getShippingCostForSubtotal(subtotal);
    }

    private async calculateOrderTotal(order: Order): Promise<number> {
        const items = order.items ?? [];
        let itemSubtotal = 0;
        let discountAmount = 0;

        for (const item of items) {
            const originalPrice = Number(item.price);
            itemSubtotal += sanitizePrice(originalPrice * item.quantity);

            if (order.user && item.product) {
                const discountedPrice = await this.applyDiscountsToPrice(item.product.id, originalPrice, order.user);
                if (discountedPrice !== null) {
                    discountAmount += sanitizePrice((originalPrice - discountedPrice) * item.quantity);
                }
            }
        }

        const taxAmount = sanitizePrice(itemSubtotal * 0.08);
        if (order.status === OrderStatus.CART) {
            order.shippingCost = await this.getCurrentShippingCost(itemSubtotal);
        }
        const shippingCost = Number((order.shippingCost ?? 0).toString());
        return OrderService.calculateCartTotal(itemSubtotal, discountAmount, taxAmount, shippingCost);
    }

    private hasCompletedFulfillment(order: Order): boolean {
        return order.paymentStatus === "paid" && Boolean(order.invoiceIssuedAt) && order.isDelivered === true;
    }

    private synchronizeCompletionStatus(order: Order): void {
        if (this.hasCompletedFulfillment(order)) {
            if (order.status !== OrderStatus.COMPLETED) {
                order.status = OrderStatus.COMPLETED;
                order.completedAt = order.completedAt ?? new Date();
            }
        } else if (order.status === OrderStatus.COMPLETED) {
            order.status = OrderStatus.ORDER_PLACED;
        }
    }
}