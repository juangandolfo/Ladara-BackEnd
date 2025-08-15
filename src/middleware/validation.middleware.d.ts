import { Request, Response, NextFunction } from 'express';
export declare function validateDto(dtoClass: any): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare function validateQueryParams(dtoClass: any): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
declare global {
    namespace Express {
        interface Request {
            validatedQuery?: any;
        }
    }
}
//# sourceMappingURL=validation.middleware.d.ts.map