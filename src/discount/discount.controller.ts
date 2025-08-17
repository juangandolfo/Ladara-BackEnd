import { Request, Response } from "express";
import { DiscountService } from "./discount.service";

export class DiscountController {
    constructor(private readonly discountService: DiscountService) {}

    createDiscount = async (req: Request, res: Response) => {
        try {
            const discount = await this.discountService.createDiscount(req.body);
            res.status(201).json({ success: true, data: discount });
        } catch {
            res.status(500).json({ success: false, message: "Error creating discount" });
        }
    };

    getDiscount = async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        const discount = await this.discountService.getDiscount(id);
        if (!discount) return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, data: discount });
    };

    updateDiscount = async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        const discount = await this.discountService.updateDiscount(id, req.body);
        if (!discount) return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, data: discount });
    };

    deleteDiscount = async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        const deleted = await this.discountService.deleteDiscount(id);
        if (!deleted) return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, message: "Deleted" });
    };

    listDiscounts = async (_: Request, res: Response) => {
        const discounts = await this.discountService.listDiscounts();
        res.json({ success: true, data: discounts });
    };

    useDiscount = async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        const used = await this.discountService.useDiscount(id);
        if (!used) return res.status(400).json({ success: false, message: "Discount not available" });
        res.json({ success: true, message: "Discount used" });
    };
}