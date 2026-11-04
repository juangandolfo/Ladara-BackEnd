import {Router} from "express";
import {AppDataSource} from "../data-source";
import {User} from "../user/user.entity";
import {Order} from "../order/entities/order.entity";
import {UserService} from "../user/user.service";
import {createAuthorizeMiddleware} from "../middlewares/auth.middleware";
import {BillingInformation} from "./billing-information.entity";
import {BillingInformationService} from "./billing-information.service";
import {BillingInformationController} from "./billing-information.controller";
import {handleValidationErrors} from "../order/order.validators";
import {billingInformationIdValidator, billingInformationInputValidators} from "./billing-information.validators";

const service = new BillingInformationService(
    AppDataSource.getRepository(BillingInformation),
    AppDataSource.getRepository(User),
    AppDataSource.getRepository(Order),
);
const controller = new BillingInformationController(service);
const authorize = createAuthorizeMiddleware(new UserService(AppDataSource.getRepository(User)));
const router = Router();

router.get("/", authorize, controller.list);
router.get("/:id", ...billingInformationIdValidator, handleValidationErrors, authorize, controller.get);
router.post("/", ...billingInformationInputValidators, handleValidationErrors, authorize, controller.create);
router.put("/:id", ...billingInformationIdValidator, ...billingInformationInputValidators, handleValidationErrors, authorize, controller.update);
router.delete("/:id", ...billingInformationIdValidator, handleValidationErrors, authorize, controller.delete);

export default router;