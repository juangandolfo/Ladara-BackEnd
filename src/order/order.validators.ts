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

export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({success: false, errors: errors.array()});
    }
    next();
}

