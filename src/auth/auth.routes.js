"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AuthRoutes;
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function AuthRoutes(userRepository) {
    const authService = new auth_service_1.AuthService(userRepository);
    const authController = new auth_controller_1.AuthController(authService);
    const router = (0, express_1.Router)();
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL || "/auth/google/callback"
    }, async (_accessToken, _refreshToken, profile, done) => {
        console.log("=== GoogleStrategy callback hit ===");
        try {
            if (!profile)
                throw new Error("No profile received from Google");
            console.log("Google profile received:");
            console.dir(profile, { depth: null });
            return done(null, profile);
        }
        catch (err) {
            console.error("Error in GoogleStrategy:", err);
            return done(err);
        }
    }));
    router.get("/google", passport_1.default.authenticate("google", { scope: ["profile", "email"] }));
    router.get("/google/callback", passport_1.default.authenticate("google", { session: false, failureRedirect: "/" }), (req, res) => authController.googleCallback(req, res));
    return router;
}
//# sourceMappingURL=auth.routes.js.map