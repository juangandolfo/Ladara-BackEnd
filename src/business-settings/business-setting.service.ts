import {Repository} from "typeorm";
import {BusinessSetting} from "./business-setting.entity";

export class BusinessSettingService {
    private static readonly DEFAULT_SHIPPING_COST = 8;
    private static readonly SHIPPING_COST_KEY = "shippingCost";

    constructor(private readonly businessSettingRepository: Repository<BusinessSetting>) {
    }

    static normalizeShippingCost(value: string | number): number {
        if (value === null || value === undefined || value === "") {
            throw new Error("Shipping cost is required");
        }

        const parsed = typeof value === "string" ? Number(value) : Number(value);
        if (!Number.isFinite(parsed) || parsed < 0) {
            throw new Error("Shipping cost must be a non-negative decimal value");
        }

        const normalized = Number(parsed.toFixed(2));
        if (!Number.isFinite(normalized)) {
            throw new Error("Shipping cost is invalid");
        }

        return normalized;
    }

    async getSettings(): Promise<BusinessSetting[]> {
        return this.businessSettingRepository.find();
    }

    async getSetting(key: string): Promise<BusinessSetting | null> {
        return this.businessSettingRepository.findOneBy({ key });
    }

    async getShippingCost(): Promise<number> {
        const setting = await this.getSetting(BusinessSettingService.SHIPPING_COST_KEY);
        if (!setting) {
            return this.ensureDefaultShippingCost();
        }

        return Number(setting.value.toString());
    }

    async setShippingCost(value: string | number): Promise<BusinessSetting> {
        const normalized = BusinessSettingService.normalizeShippingCost(value);
        let setting = await this.getSetting(BusinessSettingService.SHIPPING_COST_KEY);

        if (!setting) {
            setting = this.businessSettingRepository.create({
                key: BusinessSettingService.SHIPPING_COST_KEY,
                value: normalized,
                description: "Delivery cost charged for active carts.",
            });
        } else {
            setting.value = normalized;
        }

        return this.businessSettingRepository.save(setting);
    }

    private async ensureDefaultShippingCost(): Promise<number> {
        const created = await this.businessSettingRepository.save(this.businessSettingRepository.create({
            key: BusinessSettingService.SHIPPING_COST_KEY,
            value: BusinessSettingService.DEFAULT_SHIPPING_COST,
            description: "Delivery cost charged for active carts.",
        }));

        return Number(created.value.toString());
    }
}
