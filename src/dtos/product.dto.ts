import { Transform, Type } from 'class-transformer';
import { IsOptional, IsNumber, IsString, IsIn, Min, Max, Length, IsBoolean } from 'class-validator';

export class ProductFilterDto {
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber({}, { message: 'ID must be a number' })
    @Min(1, { message: 'ID must be greater than 0' })
    id?: number;

    @IsOptional()
    @IsString({ message: 'Name must be a string' })
    @Length(1, 100, { message: 'Name must be between 1 and 100 characters' })
    name?: string;

    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    @Length(1, 1000, { message: 'Description must be between 1 and 1000 characters' })
    description?: string;

    @IsOptional()
    @IsString({ message: 'Code must be a string' })
    @Length(1, 50, { message: 'Code must be between 1 and 50 characters' })
    code?: string;

    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    @IsNumber({}, { message: 'Price must be a number' })
    @Min(0, { message: 'Price must be greater than or equal to 0' })
    price?: number;

    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    @IsNumber({}, { message: 'Minimum price must be a number' })
    @Min(0, { message: 'Minimum price must be greater than or equal to 0' })
    minPrice?: number;

    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    @IsNumber({}, { message: 'Maximum price must be a number' })
    @Min(0, { message: 'Maximum price must be greater than or equal to 0' })
    maxPrice?: number;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber({}, { message: 'Stock must be a number' })
    @Min(0, { message: 'Stock must be greater than or equal to 0' })
    stock?: number;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber({}, { message: 'Minimum stock must be a number' })
    @Min(0, { message: 'Minimum stock must be greater than or equal to 0' })
    minStock?: number;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber({}, { message: 'Maximum stock must be a number' })
    @Min(0, { message: 'Maximum stock must be greater than or equal to 0' })
    maxStock?: number;

    //category
    @IsOptional()
    @IsString({ message: 'Category must be a string' })
    @Length(1, 100, { message: 'Category must be between 1 and 100 characters' })
    category?: string;

    @IsOptional()
    @IsIn(['id', 'name', 'price', 'description', 'code', 'stock'], {
        message: 'Sort by must be one of: id, name, price, description, code, stock'
    })
    sortBy?: 'id' | 'name' | 'price' | 'description' | 'code' | 'stock';

    @IsOptional()
    @IsIn(['ASC', 'DESC'], {
        message: 'Sort order must be either ASC or DESC'
    })
    sortOrder?: 'ASC' | 'DESC';

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber({}, { message: 'Limit must be a number' })
    @Min(1, { message: 'Limit must be greater than 0' })
    @Max(100, { message: 'Limit cannot exceed 100' })
    limit?: number;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber({}, { message: 'Offset must be a number' })
    @Min(0, { message: 'Offset must be greater than or equal to 0' })
    offset?: number;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean({ message: 'Include deleted must be a boolean' })
    includeDeleted?: boolean;
}

export class CreateProductDto {
    @IsString({ message: 'Name must be a string' })
    @Length(1, 100, { message: 'Name must be between 1 and 100 characters' })
    name: string;

    @Transform(({ value }) => parseFloat(value))
    @IsNumber({}, { message: 'Price must be a number' })
    @Min(0, { message: 'Price must be greater than or equal to 0' })
    price: number;

    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    @Length(1, 1000, { message: 'Description must be between 1 and 1000 characters' })
    description?: string;

    @IsOptional()
    @IsString({ message: 'Code must be a string' })
    @Length(1, 50, { message: 'Code must be between 1 and 50 characters' })
    code?: string;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber({}, { message: 'Stock must be a number' })
    @Min(0, { message: 'Stock must be greater than or equal to 0' })
    stock?: number;
}

export class UpdateProductDto {
    @IsOptional()
    @IsString({ message: 'Name must be a string' })
    @Length(1, 100, { message: 'Name must be between 1 and 100 characters' })
    name?: string;

    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    @IsNumber({}, { message: 'Price must be a number' })
    @Min(0, { message: 'Price must be greater than or equal to 0' })
    price?: number;

    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    @Length(1, 1000, { message: 'Description must be between 1 and 1000 characters' })
    description?: string;

    @IsOptional()
    @IsString({ message: 'Code must be a string' })
    @Length(1, 50, { message: 'Code must be between 1 and 50 characters' })
    code?: string;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber({}, { message: 'Stock must be a number' })
    @Min(0, { message: 'Stock must be greater than or equal to 0' })
    stock?: number;
}
