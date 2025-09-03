import {Request, Response} from "express";
import {AuthService} from "./auth.service";

export class AuthController {
    constructor(private authService: AuthService) {
    }

  async googleCallback(req: Request, res: Response) {
        try {
            const { user, token } = await this.authService.handleGoogleUser(req.user);
            const targetOrigin = req.query.origin || '*';
            res.send(`
                <script>
                    window.opener.postMessage(
                        ${JSON.stringify({ user, token })},
                        '${targetOrigin}'
                    );
                    window.close();
                </script>
            `);
        } catch (error: any) {
            const customMessage = `Failed to handle Google user: \n ${error.message}`;
            res.status(500).json({ error: customMessage });
        }
    }

}