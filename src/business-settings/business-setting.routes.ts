import {Router} from "express";
import {BusinessSettingController} from "./business-setting.controller";
import {BusinessSettingService} from "./business-setting.service";
import {AppDataSource} from "../data-source";
import {BusinessSetting} from "./business-setting.entity";
import {createAuthorizeMiddleware} from "../middlewares/auth.middleware";
import {UserService} from "../user/user.service";
import {User} from "../user/user.entity";
import {checkAdminMiddleware} from "../middlewares/check-admin.middleware";
import {handleValidationErrors} from "../order/order.validators";
import {updateFreeShippingThresholdValidators, updateShippingCostValidators} from "./business-setting.validators";

const businessSettingService = new BusinessSettingService(AppDataSource.getRepository(BusinessSetting));
const businessSettingController = new BusinessSettingController(businessSettingService);

const router = Router();
const authorize = createAuthorizeMiddleware(new UserService(AppDataSource.getRepository(User)));
const adminOnly = [authorize, checkAdminMiddleware];

router.get("/shipping-cost", authorize, businessSettingController.getShippingCost);
router.put("/shipping-cost", ...updateShippingCostValidators, handleValidationErrors, ...adminOnly, businessSettingController.updateShippingCost);
router.get("/free-shipping-threshold", authorize, businessSettingController.getFreeShippingThreshold);
router.put("/free-shipping-threshold", ...updateFreeShippingThresholdValidators, handleValidationErrors, ...adminOnly, businessSettingController.updateFreeShippingThreshold);

export default router;
