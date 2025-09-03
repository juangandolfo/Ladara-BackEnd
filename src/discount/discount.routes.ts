import {Router} from "express";
import {AppDataSource} from "../data-source";
import {DiscountController} from "./discount.controller";
import {DiscountService} from "./discount.service";
import {Discount} from "./discount.entity";
import {checkAdminMiddleware} from "../middlewares/check-admin.middleware";
import {
    createDiscountValidators,
    idParamValidator,
    updateDiscountValidators,
    handleValidationErrors,
} from "./discount.validators";

const discountService = new DiscountService(AppDataSource.getRepository(Discount));
const discountController = new DiscountController(discountService);

const router = Router();

const adminOnly = [checkAdminMiddleware];

router.post("/", ...createDiscountValidators, handleValidationErrors, ...adminOnly, discountController.createDiscount);
router.get("/:id", ...idParamValidator, handleValidationErrors, ...adminOnly, discountController.getDiscount);
router.put("/:id", ...updateDiscountValidators, handleValidationErrors, ...adminOnly, discountController.updateDiscount);
router.delete("/:id", ...idParamValidator, handleValidationErrors, ...adminOnly, discountController.deleteDiscount);
router.get("/", ...adminOnly, discountController.listDiscounts);

export default router;