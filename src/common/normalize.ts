/**
 * Rounds a monetary amount to 2 decimal places, mirroring the repeated
 * `Number(value.toFixed(2))` pattern used throughout order pricing logic.
 */
export function sanitizePrice(value: number): number {
    return Number(value.toFixed(2));
}

export interface SanitizeStringOptions {
    uppercase?: boolean;
}

/**
 * Coerces a value to a trimmed string, replacing the repeated
 * `String(value ?? "").trim()` (optionally `.toUpperCase()`) pattern.
 * Nullish values normalize to an empty string.
 */
export function sanitizeString(value: unknown, options: SanitizeStringOptions = {}): string {
    const trimmed = String(value ?? "").trim();
    return options.uppercase ? trimmed.toUpperCase() : trimmed;
}
