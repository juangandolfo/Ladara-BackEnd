"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const data_source_1 = require("../data-source");
const product_entity_1 = require("./product.entity");
class ProductService {
    productRepository;
    constructor() {
        this.productRepository = data_source_1.AppDataSource.getRepository(product_entity_1.Product);
    }
    /**
     * Filter products with multiple optional filters
     */
    async filterProducts(filters) {
        try {
            const queryBuilder = this.productRepository.createQueryBuilder("product");
            // Include or exclude soft-deleted products
            if (filters.includeDeleted) {
                queryBuilder.withDeleted();
            }
            // Apply filters
            this.applyFilters(queryBuilder, filters);
            // Apply sorting
            this.applySorting(queryBuilder, filters);
            // Get total count before pagination
            const total = await queryBuilder.getCount();
            // Apply pagination
            this.applyPagination(queryBuilder, filters);
            // Execute query
            const products = await queryBuilder.getMany();
            return {
                products,
                total,
                count: products.length,
                appliedFilters: this.sanitizeFilters(filters)
            };
        }
        catch (error) {
            throw new Error(`Error filtering products: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Apply all filters to the query builder
     */
    applyFilters(queryBuilder, filters) {
        // Exact ID match
        if (filters.id !== undefined) {
            queryBuilder.andWhere("product.id = :id", { id: filters.id });
        }
        // Name partial search (case-insensitive)
        if (filters.name) {
            queryBuilder.andWhere("LOWER(product.name) LIKE LOWER(:name)", {
                name: `%${filters.name}%`
            });
        }
        // Description partial search (case-insensitive)
        if (filters.description) {
            queryBuilder.andWhere("LOWER(product.description) LIKE LOWER(:description)", {
                description: `%${filters.description}%`
            });
        }
        // Code partial search (case-insensitive)
        if (filters.code) {
            queryBuilder.andWhere("LOWER(product.code) LIKE LOWER(:code)", {
                code: `%${filters.code}%`
            });
        }
        // Exact price match
        if (filters.price !== undefined) {
            queryBuilder.andWhere("product.price = :price", { price: filters.price });
        }
        // Price range filters
        if (filters.minPrice !== undefined) {
            queryBuilder.andWhere("product.price >= :minPrice", { minPrice: filters.minPrice });
        }
        if (filters.maxPrice !== undefined) {
            queryBuilder.andWhere("product.price <= :maxPrice", { maxPrice: filters.maxPrice });
        }
        // Exact stock match
        if (filters.stock !== undefined) {
            queryBuilder.andWhere("product.stock = :stock", { stock: filters.stock });
        }
        // Stock range filters
        if (filters.minStock !== undefined) {
            queryBuilder.andWhere("product.stock >= :minStock", { minStock: filters.minStock });
        }
        if (filters.maxStock !== undefined) {
            queryBuilder.andWhere("product.stock <= :maxStock", { maxStock: filters.maxStock });
        }
    }
    /**
     * Apply sorting to the query builder
     */
    applySorting(queryBuilder, filters) {
        const sortBy = filters.sortBy || 'id';
        const sortOrder = filters.sortOrder || 'ASC';
        queryBuilder.orderBy(`product.${sortBy}`, sortOrder);
    }
    /**
     * Apply pagination to the query builder
     */
    applyPagination(queryBuilder, filters) {
        if (filters.limit !== undefined) {
            queryBuilder.limit(filters.limit);
        }
        if (filters.offset !== undefined) {
            queryBuilder.offset(filters.offset);
        }
    }
    /**
     * Remove undefined values from filters for response
     */
    sanitizeFilters(filters) {
        const sanitized = {};
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                sanitized[key] = value;
            }
        });
        return sanitized;
    }
    /**
     * Get all products without filters
     */
    async getAllProducts(includeDeleted = false) {
        try {
            if (includeDeleted) {
                return await this.productRepository.find({ withDeleted: true });
            }
            return await this.productRepository.find();
        }
        catch (error) {
            throw new Error(`Error fetching products: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get product by ID
     */
    async getProductById(id, includeDeleted = false) {
        try {
            if (includeDeleted) {
                return await this.productRepository.findOne({
                    where: { id },
                    withDeleted: true
                });
            }
            return await this.productRepository.findOneBy({ id });
        }
        catch (error) {
            throw new Error(`Error fetching product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Create a new product
     */
    async createProduct(productData) {
        try {
            const product = this.productRepository.create(productData);
            return await this.productRepository.save(product);
        }
        catch (error) {
            throw new Error(`Error creating product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Update a product
     */
    async updateProduct(id, productData) {
        try {
            // Check if product exists and is not soft deleted
            const existingProduct = await this.getProductById(id, false);
            if (!existingProduct) {
                return null;
            }
            await this.productRepository.update(id, productData);
            return await this.getProductById(id, false);
        }
        catch (error) {
            throw new Error(`Error updating product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Soft delete a product
     */
    async deleteProduct(id) {
        try {
            // Check if product exists and is not already soft deleted
            const existingProduct = await this.getProductById(id, false);
            if (!existingProduct) {
                return false;
            }
            const result = await this.productRepository.softDelete(id);
            return (result.affected !== undefined && result.affected !== null && result.affected > 0);
        }
        catch (error) {
            throw new Error(`Error deleting product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Restore a soft-deleted product
     */
    async restoreProduct(id) {
        try {
            // Check if product exists in soft deleted state
            const deletedProduct = await this.getProductById(id, true);
            if (!deletedProduct || !deletedProduct.deletedAt) {
                return false;
            }
            const result = await this.productRepository.restore(id);
            return (result.affected !== undefined && result.affected !== null && result.affected > 0);
        }
        catch (error) {
            throw new Error(`Error restoring product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Permanently delete a product (hard delete)
     */
    async permanentlyDeleteProduct(id) {
        try {
            // This will permanently delete the product regardless of soft delete status
            const result = await this.productRepository.delete(id);
            return (result.affected !== undefined && result.affected !== null && result.affected > 0);
        }
        catch (error) {
            throw new Error(`Error permanently deleting product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get only soft-deleted products
     */
    async getDeletedProducts() {
        try {
            return await this.productRepository
                .createQueryBuilder("product")
                .withDeleted()
                .where("product.deletedAt IS NOT NULL")
                .getMany();
        }
        catch (error) {
            throw new Error(`Error fetching deleted products: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.ProductService = ProductService;
//# sourceMappingURL=product.service.js.map