"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDto = validateDto;
exports.validateQueryParams = validateQueryParams;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
function validateDto(dtoClass) {
    return async (req, res, next) => {
        try {
            // Transform query parameters or body to DTO instance
            const dto = (0, class_transformer_1.plainToClass)(dtoClass, req.method === 'GET' ? req.query : req.body);
            // Validate the DTO
            const errors = await (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                const errorMessages = errors.map(error => {
                    const constraints = error.constraints;
                    return constraints ? Object.values(constraints).join(', ') : 'Validation error';
                });
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errorMessages,
                    details: errors.map(error => ({
                        property: error.property,
                        value: error.value,
                        constraints: error.constraints
                    }))
                });
            }
            // Attach the validated DTO to the request
            req.body = dto;
            next();
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Internal validation error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
}
function validateQueryParams(dtoClass) {
    return async (req, res, next) => {
        try {
            // Transform query parameters to DTO instance
            const dto = (0, class_transformer_1.plainToClass)(dtoClass, req.query);
            // Validate the DTO
            const errors = await (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                const errorMessages = errors.map(error => {
                    const constraints = error.constraints;
                    return constraints ? Object.values(constraints).join(', ') : 'Validation error';
                });
                return res.status(400).json({
                    success: false,
                    message: 'Query parameter validation failed',
                    errors: errorMessages,
                    details: errors.map(error => ({
                        property: error.property,
                        value: error.value,
                        constraints: error.constraints
                    }))
                });
            }
            // Attach the validated DTO to the request
            req.validatedQuery = dto;
            next();
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Internal validation error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
}
//# sourceMappingURL=validation.middleware.js.map