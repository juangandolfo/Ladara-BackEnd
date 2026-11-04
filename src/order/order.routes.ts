import {Router} from "express";
import {OrderController} from "./order.controller";
import {CheckoutController} from "./checkout.controller";
import {Order} from "./entities/order.entity";
import {OrderItem} from "./entities/order-item.entity";
import {Product} from "../product/product.entity";
import {User} from "../user/user.entity";
import {AppDataSource as dataSource} from "../data-source";
import {createAuthorizeMiddleware} from "../middlewares/auth.middleware";
import {UserService} from "../user/user.service";
import {isOrderOwnerMiddleware} from "../middlewares/is-order-owner.middleware";
import {checkAdminMiddleware} from "../middlewares/check-admin.middleware";
import {Discount} from "../discount/discount.entity";
import {DiscountService} from "../discount/discount.service";
import {BusinessSettingService} from "../business-settings/business-setting.service";
import {BusinessSetting} from "../business-settings/business-setting.entity";
import {EmailService} from "../email/email.service";
import {
    orderIdParamValidator,
    itemIdParamValidator,
    addItemToOrderValidators,
    updateItemQuantityValidators,
    checkoutOrderValidators,
    updateOrderFulfillmentValidators,
    handleValidationErrors
} from "./order.validators";

const discountService = new DiscountService(dataSource.getRepository(Discount));
const businessSettingService = new BusinessSettingService(dataSource.getRepository(BusinessSetting));
const emailService = new EmailService();

const orderController = new OrderController(
    dataSource.getRepository(Order),
    dataSource.getRepository(OrderItem),
    dataSource.getRepository(Product),
    dataSource.getRepository(User),
    discountService,
    businessSettingService,
    emailService
);

const checkoutController = new CheckoutController();

const userService = new UserService(dataSource.getRepository(User));
const authorize = createAuthorizeMiddleware(userService);
const authorizeCartClear = createAuthorizeMiddleware(userService, 401);
const authorizeAndCheckOwner = [authorize, isOrderOwnerMiddleware];
const authorizeAndCheckAdmin = [authorize, checkAdminMiddleware];

const router = Router();

router.get("/checkout", checkoutController.getCheckoutPage);
router.get("/recommendations", orderController.getRecommendations);

router.get("/current", authorize, orderController.getCurrentOrder);
router.delete("/current/items", authorizeCartClear, orderController.clearCurrentCart);

router.get("/admin/dashboard-summary", ...authorizeAndCheckAdmin, orderController.getAdminDashboardSummary);
router.get("/admin", ...authorizeAndCheckAdmin, orderController.getAllOrdersForAdmin);
router.patch("/:id/fulfillment", ...orderIdParamValidator, ...updateOrderFulfillmentValidators, handleValidationErrors, ...authorizeAndCheckAdmin, orderController.updateOrderFulfillment);
router.get("/", authorize, orderController.getOrdersByUser);
router.post("/coupons/validate", authorize, orderController.validateCoupon);
router.post("/:id/checkout", ...orderIdParamValidator, ...checkoutOrderValidators, handleValidationErrors, ...authorizeAndCheckOwner, orderController.initiateCheckout);
router.post("/:id/validate", ...orderIdParamValidator, handleValidationErrors, ...authorizeAndCheckOwner, orderController.validateOrder);
router.post("/:id/items", ...orderIdParamValidator, ...addItemToOrderValidators, handleValidationErrors, ...authorizeAndCheckOwner, orderController.addItemToOrder);

router.put("/items/:itemId", ...itemIdParamValidator, ...updateItemQuantityValidators, handleValidationErrors, authorize, orderController.updateItemQuantityInOrder);

router.delete("/items/:itemId", ...itemIdParamValidator, handleValidationErrors, authorize, orderController.deleteItemFromOrder);

router.post("/:id/complete", ...orderIdParamValidator, handleValidationErrors, ...authorizeAndCheckAdmin, orderController.markOrderCompleted);

export default router;