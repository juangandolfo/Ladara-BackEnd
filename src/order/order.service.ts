import {Repository} from "typeorm";
import {Order} from "./entities/order.entity";
import {OrderItem} from "./entities/order-item.entity";
import {Product} from "../product/product.entity";
import {User} from "../user/user.entity";
import {DiscountService} from "../discount/discount.service";
import {OrderStatus} from "./types/order-status.type";

export class OrderService {
    private readonly orderRepo: Repository<Order>;
    private readonly itemRepo: Repository<OrderItem>;
    private readonly productRepo: Repository<Product>;
    private readonly userRepo: Repository<User>;

    constructor(orderRepo: Repository<Order>, itemRepo: Repository<OrderItem>, productRepo: Repository<Product>, userRepo: Repository<User>, private discountService: DiscountService) {
        this.orderRepo = orderRepo;
        this.itemRepo = itemRepo;
        this.productRepo = productRepo;
        this.userRepo = userRepo;
    }

    async createOrder(userId: string): Promise<Order> {
        const user = await this.userRepo.findOneBy({id: userId});
        if (!user) throw new Error("User not found");

        const existingOrder = await this.orderRepo.findOne({
            where: {user: {id: userId}, status: OrderStatus.CART},
            relations: ["items", "items.product"],
        });
        if (existingOrder) return existingOrder;

        const order = this.orderRepo.create({user, status: OrderStatus.CART, total: 0, items: []});
        return this.orderRepo.save(order);
    }

    async getCurrentOrder(userId: string): Promise<Order[]> {
        const orders = await this.orderRepo.find({
            where: {user: {id: userId}, status: OrderStatus.CART},
            relations: ["items", "items.product", "user"],
        });

        for (const order of orders) {
            for (const item of order.items) {
                const originalPrice = parseFloat(item.price.toString());
                const discountedPrice = await this.applyDiscountsToPrice(
                    item.product.id,
                    originalPrice,
                    order.user
                );
                (item as any).discountedPrice = discountedPrice; // Will be null if no discount
            }
        }

        return orders;
    }

    async getOrder(orderId: number): Promise<Order | null> {
        const order = await this.orderRepo.findOne({
            where: {id: orderId},
            relations: ["items", "items.product", "user"],
        });

        if (!order) return null;

        for (const item of order.items) {
            const originalPrice = parseFloat(item.price.toString());
            const discountedPrice = await this.applyDiscountsToPrice(
                item.product.id,
                originalPrice,
                order.user
            );
            (item as any).discountedPrice = discountedPrice; // Will be null if no discount
        }

        return order;
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
                (item as any).discountedPrice = discountedPrice; // Will be null if no discount
            }
        }

        return orders;
    }

    async checkAndApplyDiscounts(order: Order): Promise<void> {
        // Ensure order has items and user loaded
        if (!order.items || !order.user) {
            const fullOrder = await this.orderRepo.findOne({
                where: {id: order.id},
                relations: ['items', 'items.product', 'user']
            });
            if (!fullOrder) return;
            order.items = fullOrder.items;
            order.user = fullOrder.user;
        }

        let newTotal = 0;

        // Apply discounts to each item
        for (const item of order.items) {
            const originalPrice = parseFloat(item.price.toString());
            const discountedPrice = await this.applyDiscountsToPrice(
                item.product.id,
                originalPrice,
                order.user
            );

            // Update item price if discount applied
            if (discountedPrice && discountedPrice < originalPrice) {
                item.price = parseFloat(discountedPrice.toFixed(2));
                await this.itemRepo.save(item);
            }

            if (discountedPrice) {
                newTotal += discountedPrice * item.quantity;
            } else {
                newTotal += originalPrice * item.quantity;
            }
        }

        // Update order total
        order.total = parseFloat(newTotal.toFixed(2));
        await this.orderRepo.save(order);
    }

    async applyDiscountsToPrice(productId: number, originalPrice: number, user: User): Promise<number | null> {
        const discounts = await this.discountService.listDiscountsByUser(user.id);

        // If no discounts available, return null
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

        // Return null if no discount was actually applied
        return discountApplied ? finalPrice : null;
    }

    async addItemToOrder(orderId: number, productId: number, quantity: number): Promise<OrderItem | null> {
        const order = await this.orderRepo.findOneBy({id: orderId});
        const product = await this.productRepo.findOneBy({id: productId});
        if (!order || !product) return null;

        const item = this.itemRepo.create({
            order,
            product,
            quantity,
            price: product.price,
        });
        await this.itemRepo.save(item);

        // Convert to numbers and use parseFloat for decimal arithmetic
        order.total = parseFloat(order.total.toString()) + (parseFloat(product.price.toString()) * quantity);
        await this.orderRepo.save(order);
        return item;
    }

    async updateItemQuantity(itemId: number, quantity: number): Promise<OrderItem | null> {
        const item = await this.itemRepo.findOne({
            where: {id: itemId},
            relations: ["order", "product"],
        });
        if (!item) return null;

        const order = item.order;
        // Convert to numbers for proper arithmetic
        order.total = parseFloat(order.total.toString()) - (parseFloat(item.price.toString()) * item.quantity);
        item.quantity = quantity;
        await this.itemRepo.save(item);
        order.total = parseFloat(order.total.toString()) + (parseFloat(item.price.toString()) * quantity);
        await this.orderRepo.save(order);
        return item;
    }

    async deleteItemFromOrder(itemId: number): Promise<boolean> {
        const item = await this.itemRepo.findOne({
            where: {id: itemId},
            relations: ["order", "product"],
        });
        if (!item) return false;

        item.order.total = parseFloat(item.order.total.toString()) - (parseFloat(item.price.toString()) * item.quantity);
        await this.orderRepo.save(item.order);
        await this.itemRepo.delete(itemId);
        return true;
    }

    async markOrderCompleted(orderId: number): Promise<Order | null> {
        const order = await this.orderRepo.findOneBy({id: orderId});
        if (!order) return null;
        order.status = OrderStatus.COMPLETED;
        return this.orderRepo.save(order);
    }

    async findItemInOrder(orderId: number, productId: number): Promise<OrderItem | null> {
        return this.itemRepo.findOne({
            where: {order: {id: orderId}, product: {id: productId}},
            relations: ["order", "product"],
        });
    }
}