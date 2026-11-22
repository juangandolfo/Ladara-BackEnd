import {Request, Response} from 'express';
import {ProductService} from './product.service';
import {ProductFilterDto, CreateProductDto, UpdateProductDto} from "../dtos/product.dto";
import {AnalyticsEventService} from "../analytics/analytics-event.service";
import {User} from "../user/user.entity";
import {success, error} from "../common/api-response";

export class ProductController {
    private productService: ProductService;

    constructor(private readonly analyticsEventService?: AnalyticsEventService) {
        this.productService = new ProductService();
    }

    private filterProducts = async (filters: ProductFilterDto, req: Request, res: Response): Promise<void> => {
        try {
            if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
                error(res, 'Minimum price cannot be greater than maximum price', 400);
                return;
            }

            if (filters.minStock !== undefined && filters.maxStock !== undefined && filters.minStock > filters.maxStock) {
                error(res, 'Minimum stock cannot be greater than maximum stock', 400);
                return;
            }

            const userId = (req.entity as User | undefined)?.id;
            const result = await this.productService.filterProducts(filters, userId);

            success(res, result.products, 'Products filtered successfully', 200, {
                meta: {
                    total: result.total,
                    count: result.count,
                    appliedFilters: result.appliedFilters
                }
            });
        } catch (err) {
            error(res, 'Error filtering products', 500, err instanceof Error ? err.message : 'Unknown error');
        }
    };

    filterProductsQuery = async (req: Request, res: Response): Promise<void> => {
        await this.filterProducts(req.query as ProductFilterDto, req, res);
    };

    filterProductsBody = async (req: Request, res: Response): Promise<void> => {
        await this.filterProducts(req.body as ProductFilterDto, req, res);
    };

    getAllProducts = async (req: Request, res: Response): Promise<void> => {
        try {
            const products = await this.productService.getAllProducts();

            success(res, products, 'Products retrieved successfully', 200, {count: products.length});
        } catch (err) {
            error(res, 'Error retrieving products', 500, err instanceof Error ? err.message : 'Unknown error');
        }
    };

    getProductById = async (req: Request, res: Response): Promise<void> => {
        try {
            const idParam = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

            if (!idParam) {
                error(res, 'Product ID is required', 400);
                return;
            }

            const id = parseInt(idParam);

            if (isNaN(id) || id <= 0) {
                error(res, 'Invalid product ID', 400);
                return;
            }

            const product = await this.productService.getProductById(id);

            if (!product) {
                error(res, 'Product not found', 404);
                return;
            }

            success(res, product, 'Product retrieved successfully');
        } catch (err) {
            error(res, 'Error retrieving product', 500, err instanceof Error ? err.message : 'Unknown error');
        }
    };

    getDeletedProducts = async (req: Request, res: Response): Promise<void> => {
        try {
            const products = await this.productService.getDeletedProducts();

            success(res, products, 'Deleted products retrieved successfully', 200, {count: products.length});
        } catch (err) {
            error(res, 'Error retrieving deleted products', 500, err instanceof Error ? err.message : 'Unknown error');
        }
    };

    getAllCategories = async (req: Request, res: Response): Promise<void> => {
        try {
            const categories = await this.productService.getAllCategories();

            success(res, categories, 'Categories retrieved successfully', 200, {count: categories.length});
        } catch (err) {
            error(res, 'Error retrieving categories', 500, err instanceof Error ? err.message : 'Unknown error');
        }
    }

    createProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const productData = req.body as CreateProductDto;
            const product = await this.productService.createProduct(productData);
            await this.recordActivity("product.created", "Producto creado", req.entity as User | undefined);

            success(res, product, 'Product created successfully', 201);
        } catch (err) {
            error(res, 'Error creating product', 500, err instanceof Error ? err.message : 'Unknown error');
        }
    };


    updateProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const idParam = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

            if (!idParam) {
                error(res, 'Product ID is required', 400);
                return;
            }

            const id = parseInt(idParam);

            if (isNaN(id) || id <= 0) {
                error(res, 'Invalid product ID', 400);
                return;
            }

            const productData = req.body as UpdateProductDto;
            const product = await this.productService.updateProduct(id, productData);

            if (!product) {
                error(res, 'Product not found', 404);
                return;
            }
            await this.recordActivity("product.updated", "Producto actualizado", req.entity as User | undefined);

            success(res, product, 'Product updated successfully');
        } catch (err) {
            error(res, 'Error updating product', 500, err instanceof Error ? err.message : 'Unknown error');
        }
    };

    deleteProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const idParam = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

            if (!idParam) {
                error(res, 'Product ID is required', 400);
                return;
            }

            const id = parseInt(idParam);

            if (isNaN(id) || id <= 0) {
                error(res, 'Invalid product ID', 400);
                return;
            }

            const deleted = await this.productService.deleteProduct(id);

            if (!deleted) {
                error(res, 'Product not found or already deleted', 404);
                return;
            }
            await this.recordActivity("product.deleted", "Producto eliminado", req.entity as User | undefined);

            success(res, undefined, 'Product soft deleted successfully');
        } catch (err) {
            error(res, 'Error deleting product', 500, err instanceof Error ? err.message : 'Unknown error');
        }
    };

    restoreProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const idParam = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

            if (!idParam) {
                error(res, 'Product ID is required', 400);
                return;
            }

            const id = parseInt(idParam);

            if (isNaN(id) || id <= 0) {
                error(res, 'Invalid product ID', 400);
                return;
            }

            const restored = await this.productService.restoreProduct(id);

            if (!restored) {
                error(res, 'Product not found or not deleted', 404);
                return;
            }
            await this.recordActivity("product.updated", "Producto restaurado", req.entity as User | undefined);

            success(res, undefined, 'Product restored successfully');
        } catch (err) {
            error(res, 'Error restoring product', 500, err instanceof Error ? err.message : 'Unknown error');
        }
    };

    permanentlyDeleteProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const idParam = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

            if (!idParam) {
                error(res, 'Product ID is required', 400);
                return;
            }

            const id = parseInt(idParam);

            if (isNaN(id) || id <= 0) {
                error(res, 'Invalid product ID', 400);
                return;
            }

            const deleted = await this.productService.permanentlyDeleteProduct(id);

            if (!deleted) {
                error(res, 'Product not found', 404);
                return;
            }
            await this.recordActivity("product.deleted", "Producto eliminado permanentemente", req.entity as User | undefined);

            success(res, undefined, 'Product permanently deleted successfully');
        } catch (err) {
            error(res, 'Error permanently deleting product', 500, err instanceof Error ? err.message : 'Unknown error');
        }
    };

    private async recordActivity(type: string, description: string, actor?: User): Promise<void> {
        try {
            await this.analyticsEventService?.record(type, description, actor?.isAdmin ? actor.name : null);
        } catch {
            // Dashboard activity must not affect core product operations.
        }
    }
}
