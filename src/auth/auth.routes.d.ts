import { Router } from "express";
import { Repository } from "typeorm";
import { User } from "../user/user.entity";
export default function AuthRoutes(userRepository: Repository<User>): Promise<Router>;
//# sourceMappingURL=auth.routes.d.ts.map