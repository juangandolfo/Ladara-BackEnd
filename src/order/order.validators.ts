import {body, param, validationResult} from "express-validator";
import {Request, Response, NextFunction} from "express";

export const orderIdParamValidator = [
    param("id")
        .isInt({min: 1}).withMessage("Order ID must be a positive integer"),
];

export const itemIdParamValidator = [
    param("itemId")
        .isInt({min: 1}).withMessage("Item ID must be a positive integer"),
];

export const addItemToOrderValidators = [
    body("productId")
        .isInt({min: 1}).withMessage("Product ID must be a positive integer")
        .notEmpty().withMessage("Product ID is required"),
    body("quantity")
        .isInt({min: 1}).withMessage("Quantity must be a positive integer")
        .notEmpty().withMessage("Quantity is required"),
];

export const updateItemQuantityValidators = [
    body("quantity")
        .isInt({min: 0}).withMessage("Quantity must be a non-negative integer")
        .notEmpty().withMessage("Quantity is required"),
];

export const checkoutOrderValidators = [
    body("billingAddress").isObject({ strict: true }).withMessage("Billing address is required"),
    body("billingAddress.fullName").isString().trim().notEmpty().withMessage("Billing full name is required"),
    body("billingAddress.addressLine1").isString().trim().notEmpty().withMessage("Billing address line 1 is required"),
    body("billingAddress.city").isString().trim().notEmpty().withMessage("Billing city is required"),
    body("billingAddress.postalCode").isString().trim().notEmpty().withMessage("Billing postal code is required"),
    body("billingAddress.country").isString().trim().notEmpty().withMessage("Billing country is required"),
    body("billingAddress.company").optional().isString().trim().isLength({max: 120}).withMessage("Billing company must be 120 characters or fewer"),
    body("billingAddress.addressLine2").optional().isString().trim(),
    body("billingAddress.state").optional().isString().trim(),
    body("billingAddress.phone").optional().isString().trim(),
    body("paymentMethod")
        .isString().trim().notEmpty().isLength({ max: 50 })
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage("Payment method must be a short identifier (do not send card details)"),
];

export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({success: false, errors: errors.array()});
    }
    next();
}

