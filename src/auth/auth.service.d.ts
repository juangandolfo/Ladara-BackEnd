import { Repository } from "typeorm";
import { User } from "../user/user.entity";
export declare class AuthService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    handleGoogleUser(profile: any): Promise<{
        user: User;
        token: string;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map