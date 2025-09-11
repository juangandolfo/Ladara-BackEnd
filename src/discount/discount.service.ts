import {IsNull, Not, Repository} from "typeorm";
import {Discount} from "./discount.entity";

export class DiscountService {
    constructor(private readonly discountRepo: Repository<Discount>) {
    }

    async createDiscount(data: Partial<Discount>): Promise<Discount> {
        const discount = this.discountRepo.create(data);
        return this.discountRepo.save(discount);
    }

    async getDiscount(id: number): Promise<Discount | null> {
        return this.discountRepo.findOneBy({id});
    }

    async updateDiscount(id: number, data: Partial<Discount>): Promise<Discount | null> {
        const discount = await this.discountRepo.findOneBy({id});
        if (!discount) return null;
        Object.assign(discount, data);
        return this.discountRepo.save(discount);
    }

    async deleteDiscount(id: number): Promise<boolean> {
        const result = await this.discountRepo.delete(id);
        return result.affected === 1;
    }

    async listDiscounts(): Promise<Discount[]> {
        return this.discountRepo.find();
    }

    async listDeletedDiscounts(): Promise<Discount[]> {
        return this.discountRepo.find({withDeleted: true, where: {deletedAt: Not(IsNull())}});
    }

    async useDiscount(id: number): Promise<boolean> {
        const discount = await this.discountRepo.findOneBy({id});
        if (!discount) return false;
        if (discount.usesLeft === null || discount.usesLeft > 0) {
            if (discount.usesLeft !== null) {
                discount.usesLeft -= 1;
                await this.discountRepo.save(discount);
                if (discount.usesLeft === 0) {
                    await this.discountRepo.delete(id);
                }
            }
            return true;
        }
        return false;
    }

    async listDiscountsByUser(userId: string): Promise<Discount[]> {
        return this.discountRepo.find({
            where: {
                user: {id: userId}
            },
            relations: ["user"]
        });
    }
}