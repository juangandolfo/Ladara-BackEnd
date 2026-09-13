import {body} from "express-validator";

export const updateShippingCostValidators = [
    body("shippingCost")
        .optional()
        .custom((value) => {
            if (value === undefined || value === null || value === "") return true;
            if (typeof value !== "string" && typeof value !== "number") return false;
            const parsed = Number(value);
            return Number.isFinite(parsed) && parsed >= 0 && parsed <= 9999.99 && /^\d+(\.\d{1,2})?$/.test(String(value));
        })
        .withMessage("Shipping cost must be a non-negative decimal with up to 2 decimal places"),
    body("value")
        .optional()
        .custom((value) => {
            if (value === undefined || value === null || value === "") return true;
            if (typeof value !== "string" && typeof value !== "number") return false;
            const parsed = Number(value);
            return Number.isFinite(parsed) && parsed >= 0 && parsed <= 9999.99 && /^\d+(\.\d{1,2})?$/.test(String(value));
        })
        .withMessage("Shipping cost must be a non-negative decimal with up to 2 decimal places"),
];

export const updateFreeShippingThresholdValidators = [
    body("freeShippingThreshold")
        .optional()
        .custom((value) => {
            if (value === undefined || value === null || value === "") return true;
            if (typeof value !== "string" && typeof value !== "number") return false;
            const parsed = Number(value);
            return Number.isFinite(parsed) && parsed >= 0 && parsed <= 99999999.99 && /^\d+(\.\d{1,2})?$/.test(String(value));
        })
        .withMessage("Free shipping threshold must be a non-negative decimal with up to 2 decimal places"),
    body("value")
        .optional()
        .custom((value) => {
            if (value === undefined || value === null || value === "") return true;
            if (typeof value !== "string" && typeof value !== "number") return false;
            const parsed = Number(value);
            return Number.isFinite(parsed) && parsed >= 0 && parsed <= 99999999.99 && /^\d+(\.\d{1,2})?$/.test(String(value));
        })
        .withMessage("Free shipping threshold must be a non-negative decimal with up to 2 decimal places"),
];
