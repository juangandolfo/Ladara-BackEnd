import {Router} from "express";
import {AppDataSource} from "../data-source";
import {DiscountController} from "./discount.controller";
import {DiscountService} from "./discount.service";
import {Discount} from "./discount.entity";
import {checkAdminMiddleware} from "../middlewares/check-admin.middleware";

const discountService = new DiscountService(AppDataSource.getRepository(Discount));
const discountController = new DiscountController(discountService);

const router = Router();

const adminOnly = [checkAdminMiddleware];

router.post("/", adminOnly, discountController.createDiscount);
router.get("/:id", adminOnly,discountController.getDiscount);
router.put("/:id", adminOnly,discountController.updateDiscount);
router.delete("/:id", adminOnly,discountController.deleteDiscount);
router.get("/", adminOnly,discountController.listDiscounts);

export default router;