import {Response} from "express";

/**
 * Centralizes the repeated `res.status().json({success, message, data, error})`
 * pattern used across controllers. Fields that are not provided (message, data,
 * extra) are omitted from the response body instead of being serialized as
 * `undefined`, preserving the exact shape callers relied on before.
 */
export function success<T = unknown>(
    res: Response,
    data?: T,
    message?: string,
    status: number = 200,
    extra?: Record<string, unknown>,
): void {
    const body: Record<string, unknown> = {success: true};
    if (message !== undefined) body.message = message;
    if (data !== undefined) body.data = data;
    if (extra) Object.assign(body, extra);
    res.status(status).json(body);
}

export function error(
    res: Response,
    message: string,
    status: number = 400,
    errorDetail?: string,
): void {
    const body: Record<string, unknown> = {success: false, message};
    if (errorDetail !== undefined) body.error = errorDetail;
    res.status(status).json(body);
}

export function validationError(res: Response, errors: unknown): void {
    res.status(400).json({success: false, errors});
}
