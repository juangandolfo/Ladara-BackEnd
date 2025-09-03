import type { User } from '../user/user.entity';

declare module 'express-serve-static-core' {
    interface Request {
        entity?: User;
    }
}