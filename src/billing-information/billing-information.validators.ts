import {body, param} from "express-validator";

export const billingInformationIdValidator = [
    param("id").isInt({min: 1}).withMessage("Billing information ID must be a positive integer"),
];

export const billingInformationInputValidators = [
    body("fullName").isString().trim().notEmpty().isLength({max: 120}).withMessage("Full name is required and must be 120 characters or fewer"),
    body("addressLine1").isString().trim().notEmpty().isLength({max: 255}).withMessage("Address line 1 is required and must be 255 characters or fewer"),
    body("city").isString().trim().notEmpty().isLength({max: 120}).withMessage("City is required and must be 120 characters or fewer"),
    body("postalCode").isString().trim().notEmpty().isLength({max: 32}).withMessage("Postal code is required and must be 32 characters or fewer"),
    body("country").isString().trim().notEmpty().isLength({max: 100}).withMessage("Country is required and must be 100 characters or fewer"),
    body("company").optional({nullable: true}).isString().trim().isLength({max: 120}).withMessage("Company must be 120 characters or fewer"),
    body("addressLine2").optional({nullable: true}).isString().trim().isLength({max: 255}).withMessage("Address line 2 must be 255 characters or fewer"),
    body("state").optional({nullable: true}).isString().trim().isLength({max: 120}).withMessage("State must be 120 characters or fewer"),
    body("phone").optional({nullable: true}).isString().trim().isLength({max: 50}).withMessage("Phone must be 50 characters or fewer"),
];