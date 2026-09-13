import {Repository} from "typeorm";
import {Order} from "./entities/order.entity";
import {OrderItem} from "./entities/order-item.entity";
import {Product} from "../product/product.entity";
import {User} from "../user/user.entity";
import {DiscountService} from "../discount/discount.service";
import {OrderStatus} from "./types/order-status.type";
import {BusinessSettingService} from "../business-settings/business-setting.service";

export class OrderService {
    private readonly orderRepo: Repository<Order>;
    private readonly itemRepo: Repository<OrderItem>;
    private readonly productRepo: Repository<Product>;
    private readonly userRepo: Repository<User>;

    constructor(orderRepo: Repository<Order>, itemRepo: Repository<OrderItem>, productRepo: Repository<Product>, userRepo: Repository<User>, private discountService: DiscountService, private businessSettingService?: BusinessSettingService) {
        this.orderRepo = orderRepo;
        this.itemRepo = itemRepo;
        this.productRepo = productRepo;
        this.userRepo = userRepo;
    }

    static calculateCartTotal(subtotal: number, discountAmount: number, taxAmount: number, shippingCost: number): number {
        const normalizedSubtotal = Number(subtotal.toFixed(2));
        const normalizedDiscount = Number(discountAmount.toFixed(2));
        const normalizedTax = Number(taxAmount.toFixed(2));
        const normalizedShipping = Number(Math.max(0, shippingCost).toFixed(2));
        return Number((normalizedSubtotal - normalizedDiscount + normalizedTax + normalizedShipping).toFixed(2));
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
            relations: ["items", "items.product", "user"],
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

    async getOrdersByUser(userId: string): Promise<Order[]> {
        const orders = await this.orderRepo.find({
            where: {user: {id: userId}},
            relations: ["items", "items.product", "user"],
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
            relations: ["items", "items.product", "user"],
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
            relations: ["items", "items.product", "user"],
        });
        if (!order) return null;
        order.status = OrderStatus.COMPLETED;
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
            itemSubtotal += Number((originalPrice * item.quantity).toFixed(2));

            if (order.user && item.product) {
                const discountedPrice = await this.applyDiscountsToPrice(item.product.id, originalPrice, order.user);
                if (discountedPrice !== null) {
                    discountAmount += Number(((originalPrice - discountedPrice) * item.quantity).toFixed(2));
                }
            }
        }

        const taxAmount = Number((itemSubtotal * 0.08).toFixed(2));
        if (order.status === OrderStatus.CART) {
            order.shippingCost = await this.getCurrentShippingCost(itemSubtotal);
        }
        const shippingCost = Number((order.shippingCost ?? 0).toString());
        return OrderService.calculateCartTotal(itemSubtotal, discountAmount, taxAmount, shippingCost);
    }
}