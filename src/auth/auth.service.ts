import jwt from "jsonwebtoken";
import { Repository } from "typeorm";
import { User } from "../user/user.entity";

const SECRET_KEY = process.env.SECRET_JWT_KEY || "your_default_secret";

export class AuthService {
    constructor(private userRepository: Repository<User>) {}

    async handleGoogleUser(profile: any): Promise<{ user: User, token: string }> {
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

        const token = jwt.sign(
            { id: user.id, name: user.name },
            SECRET_KEY,
            { expiresIn: "1h" }
        );

        return { user, token };
    }

    async verifyToken(token: string): Promise<{ user: User }> {
        try {
            const decoded = jwt.verify(token, SECRET_KEY) as { id: string; name: string };
            const user = await this.userRepository.findOne({ where: { id: decoded.id } });
            if (!user) {
                throw new Error("User not found");
            }
            return { user };
        } catch (error) {
            throw new Error("Invalid token");
        }
    }
}