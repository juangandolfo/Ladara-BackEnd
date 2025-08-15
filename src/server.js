"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("reflect-metadata");
const data_source_1 = require("./data-source");
const product_routes_1 = __importDefault(require("./product/product.routes"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./auth/auth.routes"));
const user_entity_1 = require("./user/user.entity");
const passport_1 = __importDefault(require("passport"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
(async () => {
    try {
        await data_source_1.AppDataSource.initialize();
        console.log('✅ Database connection established');
        const authRepository = data_source_1.AppDataSource.getRepository(user_entity_1.User);
        const authRouter = await (0, auth_routes_1.default)(authRepository);
        // Middleware
        app.use((0, cors_1.default)());
        app.use(body_parser_1.default.json());
        app.disable('x-powered-by');
        app.use(express_1.default.json());
        app.use(express_1.default.urlencoded({ extended: true }));
        app.use(passport_1.default.initialize());
        app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            }
            else {
                next();
            }
        });
        app.use((req, res, next) => {
            console.log("Incoming request:", req.method, req.url);
            next();
        });
        // Routes
        app.use('/auth', authRouter);
        app.use('/api/products', product_routes_1.default);
        app.get('/health', (req, res) => {
            res.status(200).json({
                success: true,
                message: 'Server is running',
                timestamp: new Date().toISOString()
            });
        });
        app.get('/', (req, res) => {
            res.status(200).json({
                success: true,
                message: 'Ladara Backend API',
                version: '1.0.0',
                endpoints: {
                    products: '/api/products',
                    productQuery: '/api/products/query',
                    productFilter: '/api/products/filter',
                    health: '/health'
                }
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
        // Error handler
        app.use((error, req, res, next) => {
            console.error('Error:', error);
            res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Internal server error',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            });
        });
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('❌ Error during initialization:', error);
        process.exit(1);
    }
})();
exports.default = app;
//# sourceMappingURL=server.js.map