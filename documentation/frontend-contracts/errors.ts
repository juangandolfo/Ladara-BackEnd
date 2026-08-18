/**
 * Ladara Frontend Contracts - Error Types & Codes
 * 
 * Centralized error handling and error codes
 */

// ============================================
// ERROR CODES
// ============================================

export enum ApiErrorCode {
  // Auth errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  NO_TOKEN = 'NO_TOKEN',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  MISSING_FIELD = 'MISSING_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE = 'DUPLICATE',
  CONFLICT = 'CONFLICT',
  
  // Business logic errors
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  INVALID_DISCOUNT = 'INVALID_DISCOUNT',
  ORDER_OWNER_MISMATCH = 'ORDER_OWNER_MISMATCH',
  ADMIN_REQUIRED = 'ADMIN_REQUIRED',
  
  // Server errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED'
}

// ============================================
// ERROR MESSAGES
// ============================================

export const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  // Auth errors
  [ApiErrorCode.UNAUTHORIZED]: 'You must be logged in to access this resource',
  [ApiErrorCode.FORBIDDEN]: 'You do not have permission to access this resource',
  [ApiErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please log in again',
  [ApiErrorCode.INVALID_TOKEN]: 'Invalid authentication token',
  [ApiErrorCode.NO_TOKEN]: 'No authentication token provided',
  
  // Validation errors
  [ApiErrorCode.VALIDATION_ERROR]: 'The request contains validation errors',
  [ApiErrorCode.INVALID_REQUEST]: 'The request is invalid',
  [ApiErrorCode.MISSING_FIELD]: 'Required field is missing',
  [ApiErrorCode.INVALID_FORMAT]: 'The provided data format is invalid',
  
  // Resource errors
  [ApiErrorCode.NOT_FOUND]: 'The requested resource was not found',
  [ApiErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found',
  [ApiErrorCode.DUPLICATE]: 'A resource with this value already exists',
  [ApiErrorCode.CONFLICT]: 'There is a conflict with the current resource state',
  
  // Business logic errors
  [ApiErrorCode.INSUFFICIENT_STOCK]: 'Insufficient stock available',
  [ApiErrorCode.INVALID_DISCOUNT]: 'The discount is invalid or has expired',
  [ApiErrorCode.ORDER_OWNER_MISMATCH]: 'You do not own this order',
  [ApiErrorCode.ADMIN_REQUIRED]: 'Admin privileges are required for this action',
  
  // Server errors
  [ApiErrorCode.INTERNAL_SERVER_ERROR]: 'An internal server error occurred',
  [ApiErrorCode.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable',
  [ApiErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred',
  
  // Network errors
  [ApiErrorCode.NETWORK_ERROR]: 'Network connection error',
  [ApiErrorCode.TIMEOUT]: 'Request timeout. Please try again',
  [ApiErrorCode.CONNECTION_REFUSED]: 'Failed to connect to the server'
};

// ============================================
// ERROR CLASSES
// ============================================

export class ApiError extends Error {
  code: ApiErrorCode;
  statusCode: number;
  details?: any;

  constructor(
    code: ApiErrorCode,
    message?: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message || ERROR_MESSAGES[code]);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  /**
   * Get human-readable error message
   */
  getDisplayMessage(): string {
    return ERROR_MESSAGES[this.code] || this.message;
  }

  /**
   * Check if error is auth-related
   */
  isAuthError(): boolean {
    return [
      ApiErrorCode.UNAUTHORIZED,
      ApiErrorCode.FORBIDDEN,
      ApiErrorCode.TOKEN_EXPIRED,
      ApiErrorCode.INVALID_TOKEN,
      ApiErrorCode.NO_TOKEN
    ].includes(this.code);
  }

  /**
   * Check if error is validation-related
   */
  isValidationError(): boolean {
    return [
      ApiErrorCode.VALIDATION_ERROR,
      ApiErrorCode.INVALID_REQUEST,
      ApiErrorCode.MISSING_FIELD,
      ApiErrorCode.INVALID_FORMAT
    ].includes(this.code);
  }

  /**
   * Check if error is retriable
   */
  isRetriable(): boolean {
    return [
      ApiErrorCode.TIMEOUT,
      ApiErrorCode.NETWORK_ERROR,
      ApiErrorCode.CONNECTION_REFUSED,
      ApiErrorCode.SERVICE_UNAVAILABLE
    ].includes(this.code);
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details
    };
  }
}

export class ValidationError extends ApiError {
  fields: Record<string, string[]>;

  constructor(message: string, fields?: Record<string, string[]>) {
    super(ApiErrorCode.VALIDATION_ERROR, message, 400);
    this.name = 'ValidationError';
    this.fields = fields || {};
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message?: string) {
    super(ApiErrorCode.UNAUTHORIZED, message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message?: string) {
    super(ApiErrorCode.FORBIDDEN, message, 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message?: string) {
    super(ApiErrorCode.NOT_FOUND, message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message?: string) {
    super(ApiErrorCode.CONFLICT, message, 409);
    this.name = 'ConflictError';
  }
}

// ============================================
// ERROR HANDLING UTILITIES
// ============================================

/**
 * Parse API error response
 */
export function parseApiError(error: any): ApiError {
  // Handle axios/fetch errors
  if (error.response) {
    const { status, data } = error.response;
    const message = data?.message || error.message;
    const code = mapStatusToErrorCode(status);
    
    return new ApiError(code, message, status, data?.details);
  }

  // Handle network errors
  if (error.code === 'ECONNABORTED') {
    return new ApiError(ApiErrorCode.TIMEOUT, 'Request timeout', 0);
  }

  if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
    return new ApiError(ApiErrorCode.NETWORK_ERROR, 'Network connection error', 0);
  }

  // Handle unknown errors
  return new ApiError(
    ApiErrorCode.UNKNOWN_ERROR,
    error.message || 'An unexpected error occurred',
    0
  );
}

/**
 * Map HTTP status code to error code
 */
export function mapStatusToErrorCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return ApiErrorCode.VALIDATION_ERROR;
    case 401:
      return ApiErrorCode.UNAUTHORIZED;
    case 403:
      return ApiErrorCode.FORBIDDEN;
    case 404:
      return ApiErrorCode.NOT_FOUND;
    case 409:
      return ApiErrorCode.CONFLICT;
    case 422:
      return ApiErrorCode.VALIDATION_ERROR;
    case 500:
      return ApiErrorCode.INTERNAL_SERVER_ERROR;
    case 503:
      return ApiErrorCode.SERVICE_UNAVAILABLE;
    default:
      return ApiErrorCode.UNKNOWN_ERROR;
  }
}

/**
 * Check if error should trigger logout
 */
export function shouldLogoutOnError(error: ApiError): boolean {
  return [
    ApiErrorCode.UNAUTHORIZED,
    ApiErrorCode.TOKEN_EXPIRED,
    ApiErrorCode.INVALID_TOKEN
  ].includes(error.code);
}

/**
 * Get retry delay in milliseconds
 */
export function getRetryDelay(attempt: number, baseDelay: number = 1000): number {
  // Exponential backoff: 1000ms, 2000ms, 4000ms, etc.
  return baseDelay * Math.pow(2, attempt);
}

/**
 * Should retry the request
 */
export function shouldRetry(error: ApiError, attemptCount: number, maxAttempts: number = 3): boolean {
  return error.isRetriable() && attemptCount < maxAttempts;
}
