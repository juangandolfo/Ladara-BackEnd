import {Repository} from "typeorm";
import {BusinessSetting} from "./business-setting.entity";

export class BusinessSettingService {
    private static readonly DEFAULT_SHIPPING_COST = 8;
    private static readonly DEFAULT_FREE_SHIPPING_THRESHOLD = 0;
    private static readonly SHIPPING_COST_KEY = "shippingCost";
    private static readonly FREE_SHIPPING_THRESHOLD_KEY = "freeShippingThreshold";
    private static readonly MONTHLY_SALES_TARGET_KEY = "monthlySalesTarget";
    private static readonly TIMEZONE_KEY = "timezone";
    private static readonly DEFAULT_TIMEZONE = "America/Montevideo";

    constructor(private readonly businessSettingRepository: Repository<BusinessSetting>) {
    }

    static normalizeShippingCost(value: string | number): number {
        const rawValue = typeof value === "string" ? value.trim() : value;
        if (rawValue === null || rawValue === undefined || rawValue === "") {
            throw new Error("Shipping cost is required");
        }

        const parsed = Number(rawValue);
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
        const rawValue = typeof value === "string" ? value.trim() : value;
        if (rawValue === null || rawValue === undefined || rawValue === "") {
            throw new Error("Free shipping threshold is required");
        }

        const parsed = Number(rawValue);
        if (!Number.isFinite(parsed) || parsed < 0) {
            throw new Error("Free shipping threshold must be a non-negative decimal value");
        }

        return Number(parsed.toFixed(2));
    }

    static normalizeMonthlySalesTarget(value: string | number): number {
        const rawValue = typeof value === "string" ? value.trim() : value;
        if (rawValue === null || rawValue === undefined || rawValue === "") throw new Error("Monthly sales target is required");
        const parsed = Number(rawValue);
        if (!Number.isFinite(parsed) || parsed < 0 || parsed > 99999999.99 || !/^\d+(\.\d{1,2})?$/.test(String(rawValue))) {
            throw new Error("Monthly sales target must be a non-negative amount with up to 2 decimal places");
        }
        return Number(parsed.toFixed(2));
    }

    static normalizeBusinessTimezone(value: string): string {
        if (typeof value !== "string" || !value.trim()) throw new Error("Timezone is required");
        const timezone = value.trim();
        try {
            new Intl.DateTimeFormat("en-US", {timeZone: timezone});
        } catch {
            throw new Error("Timezone must be a valid IANA timezone");
        }
        return timezone;
    }

    async getMonthlySalesTarget(): Promise<number | null> {
        const setting = await this.getSetting(BusinessSettingService.MONTHLY_SALES_TARGET_KEY);
        return setting ? Number(setting.value.toString()) : null;
    }

    async setMonthlySalesTarget(value: string | number): Promise<BusinessSetting> {
        const normalized = BusinessSettingService.normalizeMonthlySalesTarget(value);
        let setting = await this.getSetting(BusinessSettingService.MONTHLY_SALES_TARGET_KEY);
        if (!setting) {
            setting = this.businessSettingRepository.create({
                key: BusinessSettingService.MONTHLY_SALES_TARGET_KEY,
                value: normalized,
                textValue: null,
                description: "Current monthly sales target in UYU.",
            });
        } else {
            setting.value = normalized;
        }
        return this.businessSettingRepository.save(setting);
    }

    async getBusinessTimezone(): Promise<string> {
        const setting = await this.getSetting(BusinessSettingService.TIMEZONE_KEY);
        if (setting?.textValue) return BusinessSettingService.normalizeBusinessTimezone(setting.textValue);
        const created = await this.businessSettingRepository.save(this.businessSettingRepository.create({
            key: BusinessSettingService.TIMEZONE_KEY,
            value: 0,
            textValue: BusinessSettingService.DEFAULT_TIMEZONE,
            description: "IANA timezone used to interpret business reporting dates.",
        }));
        return BusinessSettingService.normalizeBusinessTimezone(created.textValue ?? BusinessSettingService.DEFAULT_TIMEZONE);
    }

    async setBusinessTimezone(value: string): Promise<BusinessSetting> {
        const normalized = BusinessSettingService.normalizeBusinessTimezone(value);
        let setting = await this.getSetting(BusinessSettingService.TIMEZONE_KEY);
        if (!setting) {
            setting = this.businessSettingRepository.create({
                key: BusinessSettingService.TIMEZONE_KEY,
                value: 0,
                textValue: normalized,
                description: "IANA timezone used to interpret business reporting dates.",
            });
        } else {
            setting.textValue = normalized;
        }
        return this.businessSettingRepository.save(setting);
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
