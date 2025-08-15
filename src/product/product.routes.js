"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("./product.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const product_dto_1 = require("./product.dto");
const router = (0, express_1.Router)();
const productController = new product_controller_1.ProductController();
// Filter routes - These must come before the /:id routes to avoid conflicts
router.get('/query', (0, validation_middleware_1.validateQueryParams)(product_dto_1.ProductFilterDto), productController.filterProductsQuery);
router.post('/filter', (0, validation_middleware_1.validateDto)(product_dto_1.ProductFilterDto), productController.filterProductsBody);
// Soft delete management routes - These must come before the /:id routes
router.get('/deleted', productController.getDeletedProducts);
router.post('/:id/restore', productController.restoreProduct);
router.delete('/:id/permanent', productController.permanentlyDeleteProduct);
// CRUD routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', (0, validation_middleware_1.validateDto)(product_dto_1.CreateProductDto), productController.createProduct);
router.put('/:id', (0, validation_middleware_1.validateDto)(product_dto_1.UpdateProductDto), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
exports.default = router;
//# sourceMappingURL=product.routes.js.map