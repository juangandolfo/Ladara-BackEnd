export class ProductFilterDto {
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
    category?: string;
    sortBy?: 'id' | 'name' | 'price' | 'description' | 'code' | 'stock';
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
    includeDeleted?: boolean;
}

export class CreateProductDto {
    name: string;
    price: number;
    description?: string;
    code?: string;
    stock?: number;
}

export class UpdateProductDto {
    name?: string;
    price?: number;
}