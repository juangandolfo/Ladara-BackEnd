import {Router} from "express";
import {AppDataSource} from "../data-source";
import {createAuthorizeMiddleware} from "../middlewares/auth.middleware";
import {checkAdminMiddleware} from "../middlewares/check-admin.middleware";
import {User} from "../user/user.entity";
import {UserService} from "../user/user.service";
import {BusinessSetting} from "../business-settings/business-setting.entity";
import {BusinessSettingService} from "../business-settings/business-setting.service";
import {Order} from "../order/entities/order.entity";
import {AnalyticsEvent} from "./analytics-event.entity";
import {AnalyticsService} from "./analytics.service";
import {AnalyticsController} from "./analytics.controller";

const router = Router();
const settingsService = new BusinessSettingService(AppDataSource.getRepository(BusinessSetting));
const analyticsService = new AnalyticsService(
    AppDataSource.getRepository(Order),
    AppDataSource.getRepository(AnalyticsEvent),
    settingsService,
);
const controller = new AnalyticsController(analyticsService);
const authorize = createAuthorizeMiddleware(new UserService(AppDataSource.getRepository(User)), 401);

router.get("/admin/dashboard", authorize, checkAdminMiddleware, controller.getAdminDashboard);

export default router;
