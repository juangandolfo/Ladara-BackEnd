import { Request, Response } from 'express';
export declare class ProductController {
    private productService;
    constructor();
    /**
     * GET /products/query - Filter products with query parameters
     */
    filterProductsQuery: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /products/filter - Filter products with request body
     */
    filterProductsBody: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /products - Get all products
     */
    getAllProducts: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /products/:id - Get product by ID
     */
    getProductById: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /products - Create a new product
     */
    createProduct: (req: Request, res: Response) => Promise<void>;
    /**
     * PUT /products/:id - Update a product
     */
    updateProduct: (req: Request, res: Response) => Promise<void>;
    /**
     * DELETE /products/:id - Soft delete a product
     */
    deleteProduct: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /products/:id/restore - Restore a soft-deleted product
     */
    restoreProduct: (req: Request, res: Response) => Promise<void>;
    /**
     * DELETE /products/:id/permanent - Permanently delete a product
     */
    permanentlyDeleteProduct: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /products/deleted - Get all soft-deleted products
     */
    getDeletedProducts: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=product.controller.d.ts.map