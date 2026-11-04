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
        .isString().trim().isIn(["bank_transfer", "cash"])
        .withMessage("Payment method must be bank_transfer or cash"),
];

const fulfillmentUpdateFields = new Set([
    "paymentStatus",
    "paymentReference",
    "invoiceIssued",
    "invoiceIdentifier",
    "isDelivered",
    "deliveryDocumentIdentifier",
]);

export const updateOrderFulfillmentValidators = [
    body().custom((value) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
            throw new Error("A fulfillment update object is required");
        }
        const keys = Object.keys(value);
        if (keys.length === 0) {
            throw new Error("At least one fulfillment field must be provided");
        }
        if (keys.some((key) => !fulfillmentUpdateFields.has(key))) {
            throw new Error("Fulfillment update contains an unsupported field");
        }
        if (value.invoiceIssued === false && typeof value.invoiceIdentifier === "string" && value.invoiceIdentifier.trim()) {
            throw new Error("Cannot set an invoice identifier while marking the invoice as not issued");
        }
        return true;
    }),
    body("paymentStatus").optional().isIn(["unpaid", "paid"]).withMessage("Payment status must be unpaid or paid"),
    body("paymentReference").optional({ nullable: true }).isString().trim().notEmpty().isLength({ max: 255 })
        .withMessage("Payment reference must be a non-empty string of at most 255 characters or null"),
    body("invoiceIssued").optional().custom((value) => typeof value === "boolean")
        .withMessage("invoiceIssued must be a boolean"),
    body("invoiceIdentifier").optional({ nullable: true }).isString().trim().notEmpty().isLength({ max: 100 })
        .withMessage("Invoice identifier must be a non-empty string of at most 100 characters or null"),
    body("isDelivered").optional().custom((value) => typeof value === "boolean")
        .withMessage("isDelivered must be a boolean"),
    body("deliveryDocumentIdentifier").optional({ nullable: true }).isString().trim().notEmpty().isLength({ max: 255 })
        .withMessage("Delivery document identifier must be a non-empty string of at most 255 characters or null"),
];

export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({success: false, errors: errors.array()});
    }
    next();
}

