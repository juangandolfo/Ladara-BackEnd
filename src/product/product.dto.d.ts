export declare class ProductFilterDto {
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
export declare class CreateProductDto {
    name: string;
    price: number;
    description?: string;
    code?: string;
    stock?: number;
}
export declare class UpdateProductDto {
    name?: string;
    price?: number;
    description?: string;
    code?: string;
    stock?: number;
}
//# sourceMappingURL=product.dto.d.ts.map