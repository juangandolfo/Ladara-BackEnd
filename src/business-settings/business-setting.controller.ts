import {Request, Response} from "express";
import {BusinessSettingService} from "./business-setting.service";
import {AnalyticsEventService} from "../analytics/analytics-event.service";

export class BusinessSettingController {
    constructor(private readonly businessSettingService: BusinessSettingService, private readonly analyticsEventService?: AnalyticsEventService) {
    }

    getShippingCost = async (_req: Request, res: Response): Promise<void> => {
        try {
            const shippingCost = await this.businessSettingService.getShippingCost();
            res.status(200).json({
                success: true,
                message: "Shipping cost retrieved successfully",
                data: { key: "shippingCost", value: shippingCost },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };

    updateShippingCost = async (req: Request, res: Response): Promise<void> => {
        try {
            const value = req.body?.shippingCost ?? req.body?.value;
            const setting = await this.businessSettingService.setShippingCost(value);
            await this.recordActivity("Costo de envío actualizado", req);
            res.status(200).json({
                success: true,
                message: "Shipping cost updated successfully",
                data: { key: setting.key, value: Number(setting.value.toString()) },
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };

    getFreeShippingThreshold = async (_req: Request, res: Response): Promise<void> => {
        try {
            const value = await this.businessSettingService.getFreeShippingThreshold();
            res.status(200).json({ success: true, message: "Free shipping threshold retrieved successfully", data: { key: "freeShippingThreshold", value } });
        } catch (error) {
            res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unknown error" });
        }
    };

    updateFreeShippingThreshold = async (req: Request, res: Response): Promise<void> => {
        try {
            const value = req.body?.freeShippingThreshold ?? req.body?.value;
            const setting = await this.businessSettingService.setFreeShippingThreshold(value);
            await this.recordActivity("Umbral de envío gratis actualizado", req);
            res.status(200).json({ success: true, message: "Free shipping threshold updated successfully", data: { key: setting.key, value: Number(setting.value.toString()) } });
        } catch (error) {
            res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unknown error" });
        }
    };

    getMonthlySalesTarget = async (_req: Request, res: Response): Promise<void> => {
        try {
            const value = await this.businessSettingService.getMonthlySalesTarget();
            res.status(200).json({success: true, data: {key: "monthlySalesTarget", value}});
        } catch {
            res.status(500).json({success: false, message: "Unable to retrieve monthly sales target"});
        }
    };

    updateMonthlySalesTarget = async (req: Request, res: Response): Promise<void> => {
        try {
            const setting = await this.businessSettingService.setMonthlySalesTarget(req.body?.amount);
            await this.recordActivity("Meta mensual actualizada", req);
            res.status(200).json({success: true, data: {key: setting.key, value: Number(setting.value.toString())}});
        } catch (error) {
            res.status(400).json({success: false, message: error instanceof Error ? error.message : "Invalid monthly sales target"});
        }
    };

    getTimezone = async (_req: Request, res: Response): Promise<void> => {
        try {
            const value = await this.businessSettingService.getBusinessTimezone();
            res.status(200).json({success: true, data: {key: "timezone", value}});
        } catch {
            res.status(500).json({success: false, message: "Unable to retrieve business timezone"});
        }
    };

    updateTimezone = async (req: Request, res: Response): Promise<void> => {
        try {
            const setting = await this.businessSettingService.setBusinessTimezone(req.body?.timezone);
            await this.recordActivity("Zona horaria actualizada", req);
            res.status(200).json({success: true, data: {key: setting.key, value: setting.textValue}});
        } catch (error) {
            res.status(400).json({success: false, message: error instanceof Error ? error.message : "Invalid business timezone"});
        }
    };

    private async recordActivity(description: string, req: Request): Promise<void> {
        try {
            const actor = req.entity as any;
            await this.analyticsEventService?.record("business_setting.updated", description, actor?.isAdmin ? actor.name : null);
        } catch {
            // Dashboard activity must not affect settings updates.
        }
    }
}
