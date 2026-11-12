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
import {AnalyticsEvent} from "../analytics/analytics-event.entity";
import {AnalyticsEventService} from "../analytics/analytics-event.service";
import {updateMonthlySalesTargetValidators, updateTimezoneValidators} from "./dashboard-settings.validators";

const businessSettingService = new BusinessSettingService(AppDataSource.getRepository(BusinessSetting));
const businessSettingController = new BusinessSettingController(
	businessSettingService,
	new AnalyticsEventService(AppDataSource.getRepository(AnalyticsEvent)),
);

const router = Router();
const userService = new UserService(AppDataSource.getRepository(User));
const authorize = createAuthorizeMiddleware(userService);
const authorizeDashboardSetting = createAuthorizeMiddleware(userService, 401);
const adminOnly = [authorize, checkAdminMiddleware];
const dashboardSettingAdminOnly = [authorizeDashboardSetting, checkAdminMiddleware];

router.get("/shipping-cost", authorize, businessSettingController.getShippingCost);
router.put("/shipping-cost", ...updateShippingCostValidators, handleValidationErrors, ...adminOnly, businessSettingController.updateShippingCost);
router.get("/free-shipping-threshold", authorize, businessSettingController.getFreeShippingThreshold);
router.put("/free-shipping-threshold", ...updateFreeShippingThresholdValidators, handleValidationErrors, ...adminOnly, businessSettingController.updateFreeShippingThreshold);
router.get("/monthly-sales-target", authorizeDashboardSetting, businessSettingController.getMonthlySalesTarget);
router.put("/monthly-sales-target", ...updateMonthlySalesTargetValidators, handleValidationErrors, ...dashboardSettingAdminOnly, businessSettingController.updateMonthlySalesTarget);
router.get("/timezone", authorizeDashboardSetting, businessSettingController.getTimezone);
router.put("/timezone", ...updateTimezoneValidators, handleValidationErrors, ...dashboardSettingAdminOnly, businessSettingController.updateTimezone);

export default router;
