import {CartItemInput} from "./types/cart-item.type";
import {sanitizePrice, sanitizeString} from "../common/normalize";

/**
 * Validates and normalizes a raw cart item payload (product/seller ids,
 * quantity, unit price) into a consistent shape with both snake_case and
 * camelCase keys, as expected by guest and authenticated cart flows.
 */
export class CartValidationService {
    static validate(item: CartItemInput): CartItemInput {
        if (!item || typeof item !== "object") {
            throw new Error("Cart item payload is required");
        }

        const productId = item.product_id ?? item.productId;
        const sellerId = item.seller_id ?? item.sellerId;
        const quantity = Number(sanitizeString(item.quantity));
        const unitPrice = Number(sanitizeString(item.unit_price ?? item.price ?? 0));

        if (productId === undefined || productId === null || sanitizeString(productId) === "") {
            throw new Error("product_id is required");
        }
        if (sellerId === undefined || sellerId === null || sanitizeString(sellerId) === "") {
            throw new Error("seller_id is required");
        }
        if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 1) {
            throw new Error("quantity must be at least 1; quantity must be a whole number");
        }
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            throw new Error("unit_price must be a valid non-negative number");
        }

        const normalizedPrice = sanitizePrice(unitPrice);
        const normalized: CartItemInput = {
            ...item,
            product_id: Number(sanitizeString(productId)),
            productId: Number(sanitizeString(productId)),
            seller_id: sanitizeString(sellerId),
            sellerId: sanitizeString(sellerId),
            quantity: Number(quantity),
            unit_price: normalizedPrice,
            price: normalizedPrice,
            subtotal: sanitizePrice(Number(quantity) * normalizedPrice),
        };

        if (item.variant_id !== undefined || item.variantId !== undefined) {
            normalized.variant_id = item.variant_id ?? item.variantId;
            normalized.variantId = item.variant_id ?? item.variantId;
        }

        return normalized;
    }
}
