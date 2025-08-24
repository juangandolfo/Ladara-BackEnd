import { Router } from "express";
import { OrderController } from "./order.controller";
import { Order } from "./entities/order.entity";
import { OrderItem } from "./entities/order-item.entity";
import { Product } from "../product/product.entity";
import { User } from "../user/user.entity";
import { AppDataSource as dataSource } from "../data-source";
import { createAuthorizeMiddleware } from "../middlewares/auth.middleware";
import { UserService } from "../user/user.service";
import { isOrderOwnerMiddleware } from "../middlewares/is-order-owner.middleware";
import { checkAdminMiddleware } from "../middlewares/check-admin.middleware";

const orderController = new OrderController(
    dataSource.getRepository(Order),
    dataSource.getRepository(OrderItem),
    dataSource.getRepository(Product),
    dataSource.getRepository(User)
);

// authorize middlewares
const authorize = createAuthorizeMiddleware(new UserService(dataSource.getRepository(User)));
const authorizeAndCheckOwner = [authorize, isOrderOwnerMiddleware];
const authorizeAndCheckAdmin = [authorize, checkAdminMiddleware];

const router = Router();

router.post("/", authorize, orderController.createOrder);

router.get("/current", authorizeAndCheckOwner, orderController.getCurrentOrder);

router.get("/:id", authorizeAndCheckOwner, orderController.getOrder);

router.post("/:id/cancel", authorizeAndCheckOwner, orderController.cancelOrder);

router.post("/:id/items", authorizeAndCheckOwner, orderController.addItemToOrder);

router.delete("/items/:itemId", authorizeAndCheckOwner, orderController.deleteItemFromOrder);

router.post("/:id/complete", authorizeAndCheckAdmin, orderController.markOrderCompleted);

export default router;