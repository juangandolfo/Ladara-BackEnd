import {body} from "express-validator";

export const updateMonthlySalesTargetValidators = [
    body("amount").exists().withMessage("Amount is required").custom(value => {
        if (typeof value !== "number" && typeof value !== "string") return false;
        return Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 99999999.99 && /^\d+(\.\d{1,2})?$/.test(String(value));
    }).withMessage("Amount must be non-negative with up to 2 decimal places"),
];

export const updateTimezoneValidators = [
    body("timezone").isString().trim().notEmpty().withMessage("Timezone is required"),
];
