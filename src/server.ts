import express from 'express';
import 'reflect-metadata';
import {AppDataSource} from './data-source';
import productRoutes from './product/product.routes';
import bodyParser from 'body-parser';
import cors from 'cors';
import AuthRoutes from './auth/auth.routes';
import {User} from './user/user.entity';
import passport from 'passport';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

(async () => {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connection established');

        const authRepository = AppDataSource.getRepository(User);
        const authRouter = await AuthRoutes(authRepository);

        // Middleware
        app.use(cors());
        app.use(bodyParser.json());
        app.disable('x-powered-by');
        app.use(express.json());
        app.use(express.urlencoded({extended: true}));
        app.use(passport.initialize());

        // CORS middleware
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

        // Logging middleware
        app.use((req, res, next) => {
            console.log("Incoming request:", req.method, req.url);
            next();
        });

        // Routes
        app.use('/auth', authRouter);
        app.use('/api/products', productRoutes);

        app.get('/health', (req, res) => {
            res.status(200).json({
                success: true,
                message: 'Server is running',
                timestamp: new Date().toISOString()
            });
        });

        // 404 handler
        app.use((req, res) => {
            res.status(404).json({
                success: false,
                message: 'Endpoint not found',
                path: req.originalUrl
            });
        });

        // Error handler, this should be the last middleware
        app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            console.error('Error:', error);
            res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Internal server error',
                ...(process.env.NODE_ENV === 'development' && {stack: error.stack})
            });
        });

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error during initialization:', error);
        process.exit(1);
    }
})();

export default app;