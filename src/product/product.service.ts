import {Repository, SelectQueryBuilder} from "typeorm";
import {AppDataSource} from "../data-source";
import {Product} from "./product.entity";
import {User} from "../user/user.entity";
import {DiscountService} from "../discount/discount.service";
import {Discount} from "../discount/discount.entity";

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

export class ProductService {
    private productRepository: Repository<Product>;
    private discountService: DiscountService;

    constructor() {
        this.productRepository = AppDataSource.getRepository(Product);
        this.discountService = new DiscountService(AppDataSource.getRepository(Discount));
    }

    /**
     * Filter products with multiple optional filters
     */
    async filterProducts(filters: ProductFilters, userId: string): Promise<ProductFilterResult> {
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

            // Fetch user (assuming you have userId)
            const user = await AppDataSource.getRepository(User).findOneBy({id: userId});

            const productsWithDiscount = await Promise.all(
                products.map(async (product) => {
                    const discountedPrice = user
                        ? await this.applyDiscountsToPrice(product.id, product.price, user)
                        : product.price;
                    return {...product, discountedPrice};
                })
            );

            // Use productsWithDiscount in your response
            return {
                products: productsWithDiscount,
                total,
                count: productsWithDiscount.length,
                appliedFilters: this.sanitizeFilters(filters)
            };
        } catch (error) {
            throw new Error(`Error filtering products: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Apply all filters to the query builder
     */
    private applyFilters(queryBuilder: SelectQueryBuilder<Product>, filters: ProductFilters): void {
        // Exact ID match
        if (filters.id !== undefined) {
            queryBuilder.andWhere("product.id = :id", {id: filters.id});
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
            queryBuilder.andWhere("product.price = :price", {price: filters.price});
        }

        // Price range filters
        if (filters.minPrice !== undefined) {
            queryBuilder.andWhere("product.price >= :minPrice", {minPrice: filters.minPrice});
        }

        if (filters.maxPrice !== undefined) {
            queryBuilder.andWhere("product.price <= :maxPrice", {maxPrice: filters.maxPrice});
        }

        // Exact stock match
        if (filters.stock !== undefined) {
            queryBuilder.andWhere("product.stock = :stock", {stock: filters.stock});
        }

        // Stock range filters
        if (filters.minStock !== undefined) {
            queryBuilder.andWhere("product.stock >= :minStock", {minStock: filters.minStock});
        }

        if (filters.maxStock !== undefined) {
            queryBuilder.andWhere("product.stock <= :maxStock", {maxStock: filters.maxStock});
        }
    }

    /**
     * Apply sorting to the query builder
     */
    private applySorting(queryBuilder: SelectQueryBuilder<Product>, filters: ProductFilters): void {
        const sortBy = filters.sortBy || 'id';
        const sortOrder = filters.sortOrder || 'ASC';

        queryBuilder.orderBy(`product.${sortBy}`, sortOrder);
    }

    /**
     * Apply pagination to the query builder
     */
    private applyPagination(queryBuilder: SelectQueryBuilder<Product>, filters: ProductFilters): void {
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
    private sanitizeFilters(filters: ProductFilters): ProductFilters {
        const sanitized: Partial<ProductFilters> = {};

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                (sanitized as any)[key] = value;
            }
        });

        return sanitized as ProductFilters;
    }

    /**
     * Get all products without filters
     */
    async getAllProducts(includeDeleted: boolean = false): Promise<Product[]> {
        try {
            if (includeDeleted) {
                return await this.productRepository.find({withDeleted: true});
            }
            return await this.productRepository.find();
        } catch (error) {
            throw new Error(`Error fetching products: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get product by ID
     */
    async getProductById(id: number, includeDeleted: boolean = false): Promise<Product | null> {
        try {
            if (includeDeleted) {
                return await this.productRepository.findOne({
                    where: {id},
                    withDeleted: true
                });
            }
            return await this.productRepository.findOneBy({id});
        } catch (error) {
            throw new Error(`Error fetching product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Create a new product
     */
    async createProduct(productData: Partial<Product>): Promise<Product> {
        console.log("Filters received:sandadshahdshsad");
        try {
            const product = this.productRepository.create(productData);
            return await this.productRepository.save(product);
        } catch (error) {
            throw new Error(`Error creating product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Update a product
     */
    async updateProduct(id: number, productData: Partial<Product>): Promise<Product | null> {
        try {
            // Check if product exists and is not soft deleted
            const existingProduct = await this.getProductById(id, false);
            if (!existingProduct) {
                return null;
            }

            await this.productRepository.update(id, productData);
            return await this.getProductById(id, false);
        } catch (error) {
            throw new Error(`Error updating product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Soft delete a product
     */
    async deleteProduct(id: number): Promise<boolean> {
        try {
            // Check if product exists and is not already soft deleted
            const existingProduct = await this.getProductById(id, false);
            if (!existingProduct) {
                return false;
            }

            const result = await this.productRepository.softDelete(id);
            return (result.affected !== undefined && result.affected !== null && result.affected > 0);
        } catch (error) {
            throw new Error(`Error deleting product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Restore a soft-deleted product
     */
    async restoreProduct(id: number): Promise<boolean> {
        try {
            // Check if product exists in soft deleted state
            const deletedProduct = await this.getProductById(id, true);
            if (!deletedProduct || !deletedProduct.deletedAt) {
                return false;
            }

            const result = await this.productRepository.restore(id);
            return (result.affected !== undefined && result.affected !== null && result.affected > 0);
        } catch (error) {
            throw new Error(`Error restoring product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Permanently delete a product (hard delete)
     */
    async permanentlyDeleteProduct(id: number): Promise<boolean> {
        try {
            // This will permanently delete the product regardless of soft delete status
            const result = await this.productRepository.delete(id);
            return (result.affected !== undefined && result.affected !== null && result.affected > 0);
        } catch (error) {
            throw new Error(`Error permanently deleting product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get only soft-deleted products
     */
    async getDeletedProducts(): Promise<Product[]> {
        try {
            return await this.productRepository
                .createQueryBuilder("product")
                .withDeleted()
                .where("product.deletedAt IS NOT NULL")
                .getMany();
        } catch (error) {
            throw new Error(`Error fetching deleted products: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * aux function to find and apply discounts to a product price
     */
    async applyDiscountsToPrice(productId: number, originalPrice: number, user: User): Promise<number> {
        const discounts = await this.discountService.listDiscountsByUser(user.id);
        let finalPrice = originalPrice;

        for await (const discount of discounts) {
            if (discount.type === 'percent') {
                const discountedPrice = originalPrice * (1 - (discount.value / 100));
                if (discountedPrice < finalPrice) {
                    finalPrice = discountedPrice;
                }
            } else if (discount.type === 'fixed') {
                const discountedPrice = originalPrice - discount.value;
                if (discountedPrice < finalPrice) {
                    finalPrice = discountedPrice;
                }
            }
        }
        return finalPrice;
    }
}
