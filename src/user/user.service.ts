import {Repository} from "typeorm";
import {User} from "./user.entity";

export class UserService {
    constructor(private userRepository: Repository<User>) {
    }

    async getEntityById(id: string): Promise<User> {
        console.log(`Fetching user with id: ${id}`);
        const user = await this.userRepository.findOne({where: {id}});

        if (!user) {
            throw new Error(`User with id "${id}" not found`);
        }

        return user;
    }
}