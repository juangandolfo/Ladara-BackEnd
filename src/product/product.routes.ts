import {Router} from 'express';
import {ProductController} from './product.controller';
import {checkAdminMiddleware} from "../middlewares/check-admin.middleware";

const router = Router();
const productController = new ProductController();

const adminOnly = [checkAdminMiddleware];


router.get('/query', productController.filterProductsQuery);
router.get('/categories', productController.getAllCategories);
router.post('/filter', productController.filterProductsBody);

router.get('/deleted', adminOnly, productController.getDeletedProducts);
router.post('/:id/restore', adminOnly, productController.restoreProduct);
router.delete('/:id/permanent', adminOnly, productController.permanentlyDeleteProduct);

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', adminOnly, productController.createProduct);
router.put('/:id', adminOnly, productController.updateProduct);
router.delete('/:id', adminOnly, productController.deleteProduct);

export default router;
