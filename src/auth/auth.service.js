"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET_KEY = process.env.SECRET_JWT_KEY || "your_default_secret";
class AuthService {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async handleGoogleUser(profile) {
        console.log("debug profile:", JSON.stringify(profile, null, 2));
        let user = await this.userRepository.findOne({ where: { id: profile.id } });
        if (!user) {
            const userCount = await this.userRepository.count();
            const isFirstUser = userCount === 0;
            user = this.userRepository.create({
                id: profile.id,
                name: profile.displayName,
                isAdmin: isFirstUser,
            });
            user = await this.userRepository.save(user);
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, name: user.name }, SECRET_KEY, { expiresIn: "1h" });
        return { user, token };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map