import { Request, Response } from "express";
import { AuthService } from "./auth.service";
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    googleCallback(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map