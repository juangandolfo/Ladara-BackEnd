import {Request, Response} from 'express';
import {ProductService} from './product.service';
import {ProductFilterDto, CreateProductDto, UpdateProductDto} from "../dtos/product.dto";

export class ProductController {
    private productService: ProductService;

    constructor() {
        this.productService = new ProductService();
    }

    filterProductsQuery = async (req: Request, res: Response): Promise<void> => {
        try {
            const filters = req.query as ProductFilterDto;

            if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
                res.status(400).json({
                    success: false,
                    message: 'Minimum price cannot be greater than maximum price'
                });
                return;
            }

            if (filters.minStock !== undefined && filters.maxStock !== undefined && filters.minStock > filters.maxStock) {
                res.status(400).json({
                    success: false,
                    message: 'Minimum stock cannot be greater than maximum stock'
                });
                return;
            }

            const result = await this.productService.filterProducts(filters, '112105191225396162872');//TODO

            res.status(200).json({
                success: true,
                message: 'Products filtered successfully',
                data: result.products,
                meta: {
                    total: result.total,
                    count: result.count,
                    appliedFilters: result.appliedFilters
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error filtering products',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    filterProductsBody = async (req: Request, res: Response): Promise<void> => {
        try {
            const filters = req.body as ProductFilterDto;

            if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
                res.status(400).json({
                    success: false,
                    message: 'Minimum price cannot be greater than maximum price'
                });
                return;
            }

            if (filters.minStock !== undefined && filters.maxStock !== undefined && filters.minStock > filters.maxStock) {
                res.status(400).json({
                    success: false,
                    message: 'Minimum stock cannot be greater than maximum stock'
                });
                return;
            }

            const result = await this.productService.filterProducts(filters, '112105191225396162872');

            res.status(200).json({
                success: true,
                message: 'Products filtered successfully',
                data: result.products,
                meta: {
                    total: result.total,
                    count: result.count,
                    appliedFilters: result.appliedFilters
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error filtering products',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    getAllProducts = async (req: Request, res: Response): Promise<void> => {
        try {
            const products = await this.productService.getAllProducts();

            res.status(200).json({
                success: true,
                message: 'Products retrieved successfully',
                data: products,
                count: products.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving products',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    getProductById = async (req: Request, res: Response): Promise<void> => {
        try {
            const idParam = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

            if (!idParam) {
                res.status(400).json({
                    success: false,
                    message: 'Product ID is required'
                });
                return;
            }

            const id = parseInt(idParam);

            if (isNaN(id) || id <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid product ID'
                });
                return;
            }

            const product = await this.productService.getProductById(id);

            if (!product) {
                res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Product retrieved successfully',
                data: product
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving product',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    getDeletedProducts = async (req: Request, res: Response): Promise<void> => {
        try {
            const products = await this.productService.getDeletedProducts();

            res.status(200).json({
                success: true,
                message: 'Deleted products retrieved successfully',
                data: products,
                count: products.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving deleted products',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    getAllCategories = async (req: Request, res: Response): Promise<void> => {
        try {
            const categories = await this.productService.getAllCategories();

            res.status(200).json({
                success: true,
                message: 'Categories retrieved successfully',
                data: categories,
                count: categories.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving categories',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    createProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const productData = req.body as CreateProductDto;
            const product = await this.productService.createProduct(productData);

            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                data: product
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error creating product',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };


    updateProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const idParam = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

            if (!idParam) {
                res.status(400).json({
                    success: false,
                    message: 'Product ID is required'
                });
                return;
            }

            const id = parseInt(idParam);

            if (isNaN(id) || id <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid product ID'
                });
                return;
            }

            const productData = req.body as UpdateProductDto;
            const product = await this.productService.updateProduct(id, productData);

            if (!product) {
                res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Product updated successfully',
                data: product
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating product',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    deleteProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const idParam = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

            if (!idParam) {
                res.status(400).json({
                    success: false,
                    message: 'Product ID is required'
                });
                return;
            }

            const id = parseInt(idParam);

            if (isNaN(id) || id <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid product ID'
                });
                return;
            }

            const deleted = await this.productService.deleteProduct(id);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Product not found or already deleted'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Product soft deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error deleting product',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    restoreProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const idParam = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

            if (!idParam) {
                res.status(400).json({
                    success: false,
                    message: 'Product ID is required'
                });
                return;
            }

            const id = parseInt(idParam);

            if (isNaN(id) || id <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid product ID'
                });
                return;
            }

            const restored = await this.productService.restoreProduct(id);

            if (!restored) {
                res.status(404).json({
                    success: false,
                    message: 'Product not found in deleted state'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Product restored successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error restoring product',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    permanentlyDeleteProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const idParam = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

            if (!idParam) {
                res.status(400).json({
                    success: false,
                    message: 'Product ID is required'
                });
                return;
            }

            const id = parseInt(idParam);

            if (isNaN(id) || id <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid product ID'
                });
                return;
            }

            const deleted = await this.productService.permanentlyDeleteProduct(id);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Product permanently deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error permanently deleting product',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
}
