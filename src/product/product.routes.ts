import {Router} from 'express';
import {ProductController} from './product.controller';
import {checkAdminMiddleware} from "../middlewares/check-admin.middleware";
import {
    productIdParamValidator,
    createProductValidators,
    updateProductValidators,
    filterProductsValidators,
    handleValidationErrors
} from './product.validators';

const router = Router();
const productController = new ProductController();

const adminOnly = [checkAdminMiddleware];


router.get('/query', ...filterProductsValidators, handleValidationErrors, productController.filterProductsQuery);
router.get('/categories', productController.getAllCategories);
router.post('/filter', ...filterProductsValidators, handleValidationErrors, productController.filterProductsBody);

router.get('/', adminOnly, productController.getAllProducts);
router.get('/deleted', adminOnly, productController.getDeletedProducts);
router.post('/', adminOnly, ...createProductValidators, handleValidationErrors, productController.createProduct);
router.post('/:id/restore', adminOnly, ...productIdParamValidator, handleValidationErrors, productController.restoreProduct);
router.put('/:id', adminOnly, ...productIdParamValidator, ...updateProductValidators, handleValidationErrors, productController.updateProduct);
router.delete('/:id', adminOnly, ...productIdParamValidator, handleValidationErrors, productController.deleteProduct);
router.delete('/:id/permanent', adminOnly, ...productIdParamValidator, handleValidationErrors, productController.permanentlyDeleteProduct);

export default router;