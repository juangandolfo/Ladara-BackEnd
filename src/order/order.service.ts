import {Repository} from "typeorm";
import {Order} from "./entities/order.entity";
import {OrderItem} from "./entities/order-item.entity";
import {Product} from "../product/product.entity";
import {User} from "../user/user.entity";

export class OrderService {
    private readonly orderRepo: Repository<Order>;
    private readonly itemRepo: Repository<OrderItem>;
    private readonly productRepo: Repository<Product>;
    private readonly userRepo: Repository<User>;

    constructor(orderRepo: Repository<Order>, itemRepo: Repository<OrderItem>, productRepo: Repository<Product>, userRepo: Repository<User>) {
        this.orderRepo = orderRepo;
        this.itemRepo = itemRepo;
        this.productRepo = productRepo;
        this.userRepo = userRepo;
    }

    async createOrder(userId: number): Promise<Order> {
        const user = await this.userRepo.findOneBy({ id: String(userId) });
        if (!user) throw new Error("User not found");
        const order = this.orderRepo.create({ user, status: "pending", total: 0, items: [] });
        return this.orderRepo.save(order);
    }

    async getOrder(orderId: number): Promise<Order | null> {
        return this.orderRepo.findOne({
            where: {id: orderId},
            relations: ["items", "items.product", "user"],
        });
    }

    async cancelOrder(orderId: number): Promise<Order | null> {
        const order = await this.orderRepo.findOneBy({id: orderId});
        if (!order) return null;
        order.status = "cancelled";
        return this.orderRepo.save(order);
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
        order.total += product.price * quantity;
        await this.orderRepo.save(order);
        return item;
    }

    async deleteItemFromOrder(itemId: number): Promise<boolean> {
        const item = await this.itemRepo.findOne({
            where: {id: itemId},
            relations: ["order", "product"],
        });
        if (!item) return false;
        item.order.total -= item.price * item.quantity;
        await this.orderRepo.save(item.order);
        await this.itemRepo.delete(itemId);
        return true;
    }

    async markOrderCompleted(orderId: number): Promise<Order | null> {
        const order = await this.orderRepo.findOneBy({id: orderId});
        if (!order) return null;
        order.status = "completed";
        return this.orderRepo.save(order);
    }
}