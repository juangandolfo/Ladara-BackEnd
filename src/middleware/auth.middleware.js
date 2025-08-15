"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthorizeMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const SECRET_KEY = process.env.SECRET_JWT_KEY || `some secret key`;
const createAuthorizeMiddleware = (userService) => {
    return async (req, res, next) => {
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
            const entity = jsonwebtoken_1.default.verify(token, SECRET_KEY);
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
        }
        catch (err) {
            res.status(403).send("Forbidden: Invalid token");
        }
    };
};
exports.createAuthorizeMiddleware = createAuthorizeMiddleware;
//# sourceMappingURL=auth.middleware.js.map