import {NextFunction, Request, Response} from "express";
import jwt, {JwtPayload} from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET_KEY = process.env.SECRET_JWT_KEY || `some secret key`;

export const createAuthorizeMiddleware = (userService: any) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const header = req.headers["authorization"];
        const bearerToken = header?.split(" ");
        if (!bearerToken || bearerToken.length !== 2) {
            res.status(403).send("Forbidden: No token provided");
            return;
        }
        const token = bearerToken[1];
        if (!token) {
            res.status(403).send("Forbidden: No token provided");
            return;
        }

        try {
            const entity = jwt.verify(token, SECRET_KEY) as JwtPayload;
            if (!entity || !entity.name) {
                res.status(403).send("Forbidden: Invalid token payload");
                return;
            }

            req.entity = await userService.getEntityById(entity.id);

            if (!req.entity) {
                res.status(403).send("Forbidden: User not found");
                return;
            }
            next();
        } catch (err) {
            res.status(403).send("Forbidden: Invalid token");
        }
    };
};