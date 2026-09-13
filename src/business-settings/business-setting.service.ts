import {Repository} from "typeorm";
import {BusinessSetting} from "./business-setting.entity";

export class BusinessSettingService {
    private static readonly DEFAULT_SHIPPING_COST = 8;
    private static readonly DEFAULT_FREE_SHIPPING_THRESHOLD = 0;
    private static readonly SHIPPING_COST_KEY = "shippingCost";
    private static readonly FREE_SHIPPING_THRESHOLD_KEY = "freeShippingThreshold";

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

    static normalizeFreeShippingThreshold(value: string | number): number {
        if (value === null || value === undefined || value === "") {
            throw new Error("Free shipping threshold is required");
        }

        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < 0) {
            throw new Error("Free shipping threshold must be a non-negative decimal value");
        }

        return Number(parsed.toFixed(2));
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

    async getFreeShippingThreshold(): Promise<number> {
        const setting = await this.getSetting(BusinessSettingService.FREE_SHIPPING_THRESHOLD_KEY);
        if (!setting) {
            return this.ensureDefaultFreeShippingThreshold();
        }

        return Number(setting.value.toString());
    }

    async getShippingCostForSubtotal(subtotal: number): Promise<number> {
        const shippingCost = await this.getShippingCost();
        const threshold = await this.getFreeShippingThreshold();
        return threshold > 0 && subtotal >= threshold ? 0 : shippingCost;
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

    async setFreeShippingThreshold(value: string | number): Promise<BusinessSetting> {
        const normalized = BusinessSettingService.normalizeFreeShippingThreshold(value);
        let setting = await this.getSetting(BusinessSettingService.FREE_SHIPPING_THRESHOLD_KEY);

        if (!setting) {
            setting = this.businessSettingRepository.create({
                key: BusinessSettingService.FREE_SHIPPING_THRESHOLD_KEY,
                value: normalized,
                description: "Subtotal at which delivery becomes free for active carts. Zero disables free shipping.",
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

    private async ensureDefaultFreeShippingThreshold(): Promise<number> {
        const created = await this.businessSettingRepository.save(this.businessSettingRepository.create({
            key: BusinessSettingService.FREE_SHIPPING_THRESHOLD_KEY,
            value: BusinessSettingService.DEFAULT_FREE_SHIPPING_THRESHOLD,
            description: "Subtotal at which delivery becomes free for active carts. Zero disables free shipping.",
        }));

        return Number(created.value.toString());
    }
}
