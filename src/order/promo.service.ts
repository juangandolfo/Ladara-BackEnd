import {sanitizePrice, sanitizeString} from "../common/normalize";

export interface PromoDefinition {
    code?: string;
    discountType?: string;
    value?: number;
    expiresAt?: string | Date;
    minimumSpend?: number;
    active?: boolean;
}

/**
 * Resolves a promo code against a cart subtotal, validating expiry, minimum
 * spend, and active status before computing the resulting discount amount.
 */
export class PromoService {
    static apply(
        promoCode: string,
        subtotal: number,
        promo: PromoDefinition = {},
    ): { discountAmount: number; description: string } {
        const normalizedCode = sanitizeString(promoCode);
        const definition = {...promo, code: promo.code ?? normalizedCode};
        const resolvedCode = sanitizeString(definition.code, {uppercase: true});

        if (!normalizedCode || !resolvedCode || normalizedCode.toUpperCase() !== resolvedCode) {
            throw new Error("The promotional code you entered is invalid or expired");
        }

        if (definition.active === false) {
            throw new Error("The promotional code you entered is invalid or expired");
        }

        const expiry = definition.expiresAt ? new Date(definition.expiresAt) : null;
        if (expiry && Number.isNaN(expiry.getTime())) {
            throw new Error("The promotional code you entered is invalid or expired");
        }
        if (expiry && expiry.getTime() < Date.now()) {
            throw new Error("The promotional code you entered is invalid or expired");
        }

        const minimumSpend = Number(definition.minimumSpend ?? 0);
        if (Number(subtotal) < minimumSpend) {
            throw new Error("The promotional code you entered is invalid or expired");
        }

        const discountType = sanitizeString(definition.discountType ?? "percent").toLowerCase();
        const discountValue = Number(definition.value ?? 0);

        if (!Number.isFinite(discountValue) || discountValue <= 0) {
            throw new Error("The promotional code you entered is invalid or expired");
        }

        let discountAmount = 0;
        if (discountType === "percent") {
            discountAmount = sanitizePrice((Number(subtotal) * discountValue) / 100);
        } else if (discountType === "fixed") {
            discountAmount = sanitizePrice(Math.min(Number(subtotal), discountValue));
        } else {
            throw new Error("The promotional code you entered is invalid or expired");
        }

        return {
            discountAmount,
            description: `${resolvedCode} - ${discountType === "percent" ? `${discountValue}% off` : `$${discountValue.toFixed(2)} off`}`,
        };
    }
}
