import {User} from "../user/user.entity";

declare global {
    namespace Express {
        interface Request {
            entity?: User
        }
    }
}