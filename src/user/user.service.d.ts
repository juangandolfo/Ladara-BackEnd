import { Repository } from "typeorm";
import { User } from "./user.entity";
export declare class UserService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    getEntityById(id: string): Promise<User>;
}
//# sourceMappingURL=user.service.d.ts.map