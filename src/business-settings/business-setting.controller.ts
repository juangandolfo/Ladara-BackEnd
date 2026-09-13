import {Request, Response} from "express";
import {BusinessSettingService} from "./business-setting.service";

export class BusinessSettingController {
    constructor(private readonly businessSettingService: BusinessSettingService) {
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
            res.status(200).json({ success: true, message: "Free shipping threshold updated successfully", data: { key: setting.key, value: Number(setting.value.toString()) } });
        } catch (error) {
            res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unknown error" });
        }
    };
}
