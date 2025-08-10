import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export function validateDto(dtoClass: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Transform query parameters or body to DTO instance
            const dto = plainToClass(dtoClass, req.method === 'GET' ? req.query : req.body);
            
            // Validate the DTO
            const errors = await validate(dto as object);
            
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
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Internal validation error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
}

export function validateQueryParams(dtoClass: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Transform query parameters to DTO instance
            const dto = plainToClass(dtoClass, req.query);
            
            // Validate the DTO
            const errors = await validate(dto as object);
            
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
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Internal validation error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
}

// Extend Request interface to include validatedQuery
declare global {
    namespace Express {
        interface Request {
            validatedQuery?: any;
        }
    }
}
