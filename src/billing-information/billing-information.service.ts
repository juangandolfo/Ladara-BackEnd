import {Repository} from "typeorm";
import {User} from "../user/user.entity";
import {Order} from "../order/entities/order.entity";
import {BillingInformation} from "./billing-information.entity";
import {BillingInformationInput} from "./billing-information.dto";

export class BillingInformationService {
    constructor(
        private readonly billingInformationRepo: Repository<BillingInformation>,
        private readonly userRepo: Repository<User>,
        private readonly orderRepo: Repository<Order>,
    ) {}

    async listForUser(userId: string): Promise<BillingInformation[]> {
        return this.billingInformationRepo.find({
            where: {user: {id: userId}},
            relations: ["user"],
            order: {createdAt: "DESC", id: "DESC"},
        });
    }

    async getForUser(id: number, userId: string): Promise<BillingInformation | null> {
        return this.billingInformationRepo.findOne({where: {id, user: {id: userId}}, relations: ["user"]});
    }

    async createForUser(userId: string, input: BillingInformationInput): Promise<BillingInformation> {
        const user = await this.userRepo.findOneBy({id: userId});
        if (!user) throw new Error("USER_NOT_FOUND");
        return this.billingInformationRepo.save(this.billingInformationRepo.create({
            ...this.normalize(input),
            user,
        }));
    }

    async updateForUser(id: number, userId: string, input: BillingInformationInput): Promise<BillingInformation | null> {
        const billingInformation = await this.getForUser(id, userId);
        if (!billingInformation) return null;
        Object.assign(billingInformation, this.normalize(input));
        return this.billingInformationRepo.save(billingInformation);
    }

    async deleteForUser(id: number, userId: string): Promise<boolean> {
        const billingInformation = await this.getForUser(id, userId);
        if (!billingInformation) return false;
        const orderCount = await this.orderRepo.count({where: {billingInformation: {id}}});
        if (orderCount > 0) throw new Error("BILLING_INFORMATION_IN_USE");
        await this.billingInformationRepo.remove(billingInformation);
        return true;
    }

    private normalize(input: BillingInformationInput): Omit<BillingInformation, "id" | "user" | "createdAt"> {
        return {
            fullName: input.fullName.trim(),
            company: input.company?.trim() || null,
            addressLine1: input.addressLine1.trim(),
            addressLine2: input.addressLine2?.trim() || null,
            city: input.city.trim(),
            state: input.state?.trim() || null,
            postalCode: input.postalCode.trim(),
            country: input.country.trim(),
            phone: input.phone?.trim() || null,
        };
    }
}