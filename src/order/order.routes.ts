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
import {
    orderIdParamValidator,
    itemIdParamValidator,
    addItemToOrderValidators,
    updateItemQuantityValidators,
    handleValidationErrors
} from "./order.validators";

const discountService = new DiscountService(dataSource.getRepository(Discount));

const orderController = new OrderController(
    dataSource.getRepository(Order),
    dataSource.getRepository(OrderItem),
    dataSource.getRepository(Product),
    dataSource.getRepository(User),
    discountService
);

const checkoutController = new CheckoutController();

const authorize = createAuthorizeMiddleware(new UserService(dataSource.getRepository(User)));
const authorizeAndCheckOwner = [authorize, isOrderOwnerMiddleware];
const authorizeAndCheckAdmin = [authorize, checkAdminMiddleware];

const router = Router();

router.get("/checkout", checkoutController.getCheckoutPage);

router.get("/current", authorize, orderController.getCurrentOrder);

router.get("/", authorize, orderController.getOrdersByUser);

router.post("/:id/items", ...orderIdParamValidator, ...addItemToOrderValidators, handleValidationErrors, ...authorizeAndCheckOwner, orderController.addItemToOrder);

router.put("/items/:itemId", ...itemIdParamValidator, ...updateItemQuantityValidators, handleValidationErrors, authorize, orderController.updateItemQuantityInOrder);

router.delete("/items/:itemId", ...itemIdParamValidator, handleValidationErrors, authorize, orderController.deleteItemFromOrder);

router.post("/:id/complete", ...orderIdParamValidator, handleValidationErrors, ...authorizeAndCheckAdmin, orderController.markOrderCompleted);

export default router;