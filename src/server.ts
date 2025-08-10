import express from 'express';
import 'reflect-metadata';
import { AppDataSource } from './data-source';
import productRoutes from './product/product.routes';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON payloads
app.use(bodyParser.json());

// Disable the X-Powered-By response header
app.disable('x-powered-by');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware (optional)
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

// Routes
app.use('/api/products', productRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Default route
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
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', error);
    
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Initialize database and start server
AppDataSource.initialize()
    .then(() => {
        console.log('✅ Database connection established');
        
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📊 API Documentation available at http://localhost:${PORT}`);
            console.log(`🛡️ Health check: http://localhost:${PORT}/health`);
            console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
            console.log(`🔍 Filter API: http://localhost:${PORT}/api/products/query`);
        });
    })
    .catch((error) => {
        console.error('❌ Error during database initialization:', error);
        process.exit(1);
    });

export default app;
