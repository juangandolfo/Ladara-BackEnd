import {Router} from "express";
import {AppDataSource as dataSource, AppDataSource} from "../data-source";
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
import {createAuthorizeMiddleware} from "../middlewares/auth.middleware";
import {UserService} from "../user/user.service";
import {User} from "../user/user.entity";

const discountService = new DiscountService(AppDataSource.getRepository(Discount));
const discountController = new DiscountController(discountService);

const router = Router();

const authorize = createAuthorizeMiddleware(new UserService(dataSource.getRepository(User)));
const adminOnly = [authorize, checkAdminMiddleware];

router.post("/", ...createDiscountValidators, handleValidationErrors, ...adminOnly, discountController.createDiscount);
router.put("/:id", ...updateDiscountValidators, handleValidationErrors, ...adminOnly, discountController.updateDiscount);
router.delete("/:id", ...idParamValidator, handleValidationErrors, ...adminOnly, discountController.deleteDiscount);
router.get("/", ...adminOnly, discountController.listDiscounts);
router.get("/deleted", ...adminOnly, discountController.listDeletedDiscounts);

export default router;