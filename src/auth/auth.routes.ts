import {Request, Response, Router} from "express";
import passport from "passport";
import {Strategy as GoogleStrategy} from "passport-google-oauth20";
import {AuthController} from "./auth.controller";
import {AuthService} from "./auth.service";
import {Repository} from "typeorm";
import {User} from "../user/user.entity";
import dotenv from "dotenv";


dotenv.config();

export default async function AuthRoutes(userRepository: Repository<User>): Promise<Router> {
    const authService = new AuthService(userRepository);
    const authController = new AuthController(authService);
    const router = Router();

    passport.use(new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: process.env.CALLBACK_URL || "/auth/google/callback"
        },
        async (_accessToken, _refreshToken, profile, done) => {
            console.log("=== GoogleStrategy callback hit ===");
            try {
                if (!profile) throw new Error("No profile received from Google");
                console.log("Google profile received:");
                console.dir(profile, { depth: null });
                return done(null, profile);
            } catch (err) {
                console.error("Error in GoogleStrategy:", err);
                return done(err);
            }
        }
    ));

    router.get("/google", passport.authenticate("google", {scope: ["profile", "email"]}));

    router.get(
        "/google/callback",
        passport.authenticate("google", {session: false, failureRedirect: "/"}),
        (req: Request, res: Response) => authController.googleCallback(req, res)
    );

    //me
    router.get("/me", async (req: Request, res: Response) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: "No authorization header" });
            }
            const token = authHeader.split(" ")[1];
            if (!token) {
                return res.status(401).json({ error: "No token provided" });
            }
            const user = await authService.verifyToken(token);
            if (!user) {
                return res.status(401).json({ error: "Invalid token" });
            }
            res.status(200).json({ user });
        } catch (error: any) {
            const customMessage = `Failed to fetch user info: \n ${error.message}`;
            res.status(500).json({ error: customMessage });
        }
    });

    return router;
}