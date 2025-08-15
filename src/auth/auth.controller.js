"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async googleCallback(req, res) {
        try {
            const { user, token } = await this.authService.handleGoogleUser(req.user);
            console.log("Google user handled successfully:", user);
            res.status(200).json({ user, token });
        }
        catch (error) {
            const customMessage = `Failed to handle Google user: \n ${error.message}`;
            res.status(500).json({ error: customMessage });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map