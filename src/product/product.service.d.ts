import { Product } from "./product.entity";
export interface ProductFilters {
    id?: number;
    name?: string;
    description?: string;
    code?: string;
    price?: number;
    minPrice?: number;
    maxPrice?: number;
    stock?: number;
    minStock?: number;
    maxStock?: number;
    sortBy?: 'id' | 'name' | 'price' | 'description' | 'code' | 'stock';
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
    includeDeleted?: boolean;
}
export interface ProductFilterResult {
    products: Product[];
    total: number;
    count: number;
    appliedFilters: ProductFilters;
}
export declare class ProductService {
    private productRepository;
    constructor();
    /**
     * Filter products with multiple optional filters
     */
    filterProducts(filters: ProductFilters): Promise<ProductFilterResult>;
    /**
     * Apply all filters to the query builder
     */
    private applyFilters;
    /**
     * Apply sorting to the query builder
     */
    private applySorting;
    /**
     * Apply pagination to the query builder
     */
    private applyPagination;
    /**
     * Remove undefined values from filters for response
     */
    private sanitizeFilters;
    /**
     * Get all products without filters
     */
    getAllProducts(includeDeleted?: boolean): Promise<Product[]>;
    /**
     * Get product by ID
     */
    getProductById(id: number, includeDeleted?: boolean): Promise<Product | null>;
    /**
     * Create a new product
     */
    createProduct(productData: Partial<Product>): Promise<Product>;
    /**
     * Update a product
     */
    updateProduct(id: number, productData: Partial<Product>): Promise<Product | null>;
    /**
     * Soft delete a product
     */
    deleteProduct(id: number): Promise<boolean>;
    /**
     * Restore a soft-deleted product
     */
    restoreProduct(id: number): Promise<boolean>;
    /**
     * Permanently delete a product (hard delete)
     */
    permanentlyDeleteProduct(id: number): Promise<boolean>;
    /**
     * Get only soft-deleted products
     */
    getDeletedProducts(): Promise<Product[]>;
}
//# sourceMappingURL=product.service.d.ts.map