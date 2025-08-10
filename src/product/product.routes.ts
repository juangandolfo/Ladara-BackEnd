import { Router } from 'express';
import { ProductController } from './product.controller';
import { validateDto, validateQueryParams } from '../middleware/validation.middleware';
import { ProductFilterDto, CreateProductDto, UpdateProductDto } from './product.dto';

const router = Router();
const productController = new ProductController();

// Filter routes - These must come before the /:id routes to avoid conflicts
router.get('/query', validateQueryParams(ProductFilterDto), productController.filterProductsQuery);
router.post('/filter', validateDto(ProductFilterDto), productController.filterProductsBody);

// Soft delete management routes - These must come before the /:id routes
router.get('/deleted', productController.getDeletedProducts);
router.post('/:id/restore', productController.restoreProduct);
router.delete('/:id/permanent', productController.permanentlyDeleteProduct);

// CRUD routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', validateDto(CreateProductDto), productController.createProduct);
router.put('/:id', validateDto(UpdateProductDto), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

export default router;
