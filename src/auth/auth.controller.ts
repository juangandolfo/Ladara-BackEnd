import {Request, Response} from "express";
import {AuthService} from "./auth.service";

export class AuthController {
    constructor(private authService: AuthService) {
    }

    async googleCallback(req: Request, res: Response) {
        try {
            const {user, token} = await this.authService.handleGoogleUser(req.user);
            console.log("Google user handled successfully:", user);
            res.status(200).json({user, token});
        } catch (error: any) {
            const customMessage = `Failed to handle Google user: \n ${error.message}`;
            res.status(500).json({error: customMessage});
        }
    }
}