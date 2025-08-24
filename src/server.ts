import express from 'express';
import 'reflect-metadata';
import {AppDataSource} from './data-source';
import productRoutes from './product/product.routes';
import bodyParser from 'body-parser';
import cors from 'cors';
import AuthRoutes from './auth/auth.routes';
import {User} from './user/user.entity';
import {UserService} from './user/user.service';
import passport from 'passport';
import dotenv from 'dotenv';
import orderRoutes from "./order/order.routes";
import discountRoutes from "./discount/discount.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

(async () => {
    try {
        await AppDataSource.initialize();

        const userRepository = AppDataSource.getRepository(User);
        const authRouter = await AuthRoutes(userRepository);

        // Middleware
        app.use(cors());
        app.use(bodyParser.json());
        app.disable('x-powered-by');
        app.use(express.json());
        app.use(express.urlencoded({extended: true}));
        app.use(passport.initialize());

        // CORS middlewares
        app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });

        // Logging middlewares
        app.use((req, res, next) => {
            console.log("Incoming request:", req.method, req.url);
            next();
        });

        // Routes
        app.use('/auth', authRouter);
        app.use('/api/products', productRoutes);
        app.use('/api/orders', orderRoutes);
        app.use('/api/discounts', discountRoutes);

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error during initialization:', error);
        process.exit(1);
    }
})();

export default app;