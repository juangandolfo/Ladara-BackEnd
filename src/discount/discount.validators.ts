import {body, param, validationResult} from "express-validator";
import {Request, Response, NextFunction} from "express";

export const createDiscountValidators = [

];

export const idParamValidator = [
    param("id")
        .isInt({min: 1}).withMessage("ID must be a positive integer"),
];

export const updateDiscountValidators = [
    body("name").optional().isString().withMessage("Name must be a string"),
    body("percentage").optional().isFloat({min: 0, max: 100}).withMessage("Percentage must be between 0 and 100"),
    body("active").optional().isBoolean().withMessage("Active must be a boolean"),
    body("expiresAt").optional().isISO8601().withMessage("expiresAt must be a valid ISO8601 date"),
];

// Validation error handler middleware
export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({success: false, errors: errors.array()});
    }
    next();
}
