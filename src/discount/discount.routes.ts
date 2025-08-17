import { Router } from "express";
import { AppDataSource } from "../data-source";
import { DiscountController } from "./discount.controller";
import { DiscountService } from "./discount.service";
import { Discount } from "./discount.entity";

const discountService = new DiscountService(AppDataSource.getRepository(Discount));
const discountController = new DiscountController(discountService);

const router = Router();

router.post("/discounts", discountController.createDiscount);
router.get("/discounts/:id", discountController.getDiscount);
router.put("/discounts/:id", discountController.updateDiscount);
router.delete("/discounts/:id", discountController.deleteDiscount);
router.get("/discounts", discountController.listDiscounts);
router.post("/discounts/:id/use", discountController.useDiscount);

export default router;