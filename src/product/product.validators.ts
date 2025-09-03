import {body, param, query, validationResult} from "express-validator";
import {Request, Response, NextFunction} from "express";

export const productIdParamValidator = [
    param("id")
        .isInt({min: 1}).withMessage("Product ID must be a positive integer"),
];

export const createProductValidators = [
    body("name")
        .isString().withMessage("Name must be a string")
        .notEmpty().withMessage("Name is required"),
    body("price")
        .isFloat({min: 0}).withMessage("Price must be a non-negative number")
        .notEmpty().withMessage("Price is required"),
    body("stock")
        .isInt({min: 0}).withMessage("Stock must be a non-negative integer")
        .notEmpty().withMessage("Stock is required"),
    body("category")
        .isString().withMessage("Category must be a string")
        .notEmpty().withMessage("Category is required"),
    body("description")
        .optional()
        .isString().withMessage("Description must be a string"),
    body("code")
        .optional()
        .isString().withMessage("Code must be a string"),
    body("image")
        .optional()
        .isString().withMessage("Image must be a string"),
];

export const updateProductValidators = [
    body("name")
        .optional()
        .isString().withMessage("Name must be a string"),
    body("price")
        .optional()
        .isFloat({min: 0}).withMessage("Price must be a non-negative number"),
    body("stock")
        .optional()
        .isInt({min: 0}).withMessage("Stock must be a non-negative integer"),
    body("category")
        .optional()
        .isString().withMessage("Category must be a string"),
    body("description")
        .optional()
        .isString().withMessage("Description must be a string"),
    body("code")
        .optional()
        .isString().withMessage("Code must be a string"),
    body("image")
        .optional()
        .isString().withMessage("Image must be a string"),
];

export const filterProductsValidators = [
    query("minPrice")
        .optional()
        .isFloat({min: 0}).withMessage("minPrice must be a non-negative number"),
    query("maxPrice")
        .optional()
        .isFloat({min: 0}).withMessage("maxPrice must be a non-negative number"),
    query("minStock")
        .optional()
        .isInt({min: 0}).withMessage("minStock must be a non-negative integer"),
    query("maxStock")
        .optional()
        .isInt({min: 0}).withMessage("maxStock must be a non-negative integer"),
    query("category")
        .optional()
        .isString().withMessage("Category must be a string"),
    query("name")
        .optional()
        .isString().withMessage("Name must be a string"),
    query("description")
        .optional()
        .isString().withMessage("Description must be a string"),
    query("code")
        .optional()
        .isString().withMessage("Code must be a string"),
    query("sortBy")
        .optional()
        .isIn(['id', 'name', 'price', 'description', 'code', 'stock']).withMessage("Invalid sortBy value"),
    query("sortOrder")
        .optional()
        .isIn(['ASC', 'DESC']).withMessage("Invalid sortOrder value"),
    query("limit")
        .optional()
        .isInt({min: 1}).withMessage("Limit must be a positive integer"),
    query("offset")
        .optional()
        .isInt({min: 0}).withMessage("Offset must be a non-negative integer"),
    query("includeDeleted")
        .optional()
        .isBoolean().withMessage("includeDeleted must be a boolean"),
];

export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({success: false, errors: errors.array()});
    }
    next();
}

