"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
class UserService {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async getEntityById(id) {
        console.log(`Fetching user with id: ${id}`);
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error(`User with id "${id}" not found`);
        }
        return user;
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map