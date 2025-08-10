import { Request, Response } from 'express';
import { ProductService } from './product.service';
import { ProductFilterDto, CreateProductDto, UpdateProductDto } from './product.dto';

export class ProductController {
    private productService: ProductService;

    constructor() {
        this.productService = new ProductService();
    }

    /**
     * GET /products/query - Filter products with query parameters
     */
    filterProductsQuery = async (req: Request, res: Response): Promise<void> => {
        try {
            const filters = req.validatedQuery as ProductFilterDto;
            
            // Additional validation for price ranges
            if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
                res.status(400).json({
                    success: false,
                    message: 'Minimum price cannot be greater than maximum price'
                });
                return;
            }

            // Additional validation for stock ranges
            if (filters.minStock !== undefined && filters.maxStock !== undefined && filters.minStock > filters.maxStock) {
                res.status(400).json({
                    success: false,
                    message: 'Minimum stock cannot be greater than maximum stock'
                });
                return;
            }

            const result = await this.productService.filterProducts(filters);
            
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

    /**
     * POST /products/filter - Filter products with request body
     */
    filterProductsBody = async (req: Request, res: Response): Promise<void> => {
        try {
            const filters = req.body as ProductFilterDto;
            
            // Additional validation for price ranges
            if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
                res.status(400).json({
                    success: false,
                    message: 'Minimum price cannot be greater than maximum price'
                });
                return;
            }

            // Additional validation for stock ranges
            if (filters.minStock !== undefined && filters.maxStock !== undefined && filters.minStock > filters.maxStock) {
                res.status(400).json({
                    success: false,
                    message: 'Minimum stock cannot be greater than maximum stock'
                });
                return;
            }

            const result = await this.productService.filterProducts(filters);
            
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

    /**
     * GET /products - Get all products
     */
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

    /**
     * GET /products/:id - Get product by ID
     */
    getProductById = async (req: Request, res: Response): Promise<void> => {
        try {
            const idParam = req.params.id;
            
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

    /**
     * POST /products - Create a new product
     */
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

    /**
     * PUT /products/:id - Update a product
     */
    updateProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const idParam = req.params.id;
            
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

    /**
     * DELETE /products/:id - Soft delete a product
     */
    deleteProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const idParam = req.params.id;
            
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

    /**
     * POST /products/:id/restore - Restore a soft-deleted product
     */
    restoreProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const idParam = req.params.id;
            
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

    /**
     * DELETE /products/:id/permanent - Permanently delete a product
     */
    permanentlyDeleteProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const idParam = req.params.id;
            
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

    /**
     * GET /products/deleted - Get all soft-deleted products
     */
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
}
