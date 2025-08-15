"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProductDto = exports.CreateProductDto = exports.ProductFilterDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class ProductFilterDto {
    id;
    name;
    description;
    code;
    price;
    minPrice;
    maxPrice;
    stock;
    minStock;
    maxStock;
    sortBy;
    sortOrder;
    limit;
    offset;
    includeDeleted;
}
exports.ProductFilterDto = ProductFilterDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsNumber)({}, { message: 'ID must be a number' }),
    (0, class_validator_1.Min)(1, { message: 'ID must be greater than 0' }),
    __metadata("design:type", Number)
], ProductFilterDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Name must be a string' }),
    (0, class_validator_1.Length)(1, 100, { message: 'Name must be between 1 and 100 characters' }),
    __metadata("design:type", String)
], ProductFilterDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Description must be a string' }),
    (0, class_validator_1.Length)(1, 1000, { message: 'Description must be between 1 and 1000 characters' }),
    __metadata("design:type", String)
], ProductFilterDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Code must be a string' }),
    (0, class_validator_1.Length)(1, 50, { message: 'Code must be between 1 and 50 characters' }),
    __metadata("design:type", String)
], ProductFilterDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    (0, class_validator_1.IsNumber)({}, { message: 'Price must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Price must be greater than or equal to 0' }),
    __metadata("design:type", Number)
], ProductFilterDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    (0, class_validator_1.IsNumber)({}, { message: 'Minimum price must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Minimum price must be greater than or equal to 0' }),
    __metadata("design:type", Number)
], ProductFilterDto.prototype, "minPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    (0, class_validator_1.IsNumber)({}, { message: 'Maximum price must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Maximum price must be greater than or equal to 0' }),
    __metadata("design:type", Number)
], ProductFilterDto.prototype, "maxPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsNumber)({}, { message: 'Stock must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Stock must be greater than or equal to 0' }),
    __metadata("design:type", Number)
], ProductFilterDto.prototype, "stock", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsNumber)({}, { message: 'Minimum stock must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Minimum stock must be greater than or equal to 0' }),
    __metadata("design:type", Number)
], ProductFilterDto.prototype, "minStock", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsNumber)({}, { message: 'Maximum stock must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Maximum stock must be greater than or equal to 0' }),
    __metadata("design:type", Number)
], ProductFilterDto.prototype, "maxStock", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['id', 'name', 'price', 'description', 'code', 'stock'], {
        message: 'Sort by must be one of: id, name, price, description, code, stock'
    }),
    __metadata("design:type", String)
], ProductFilterDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['ASC', 'DESC'], {
        message: 'Sort order must be either ASC or DESC'
    }),
    __metadata("design:type", String)
], ProductFilterDto.prototype, "sortOrder", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsNumber)({}, { message: 'Limit must be a number' }),
    (0, class_validator_1.Min)(1, { message: 'Limit must be greater than 0' }),
    (0, class_validator_1.Max)(100, { message: 'Limit cannot exceed 100' }),
    __metadata("design:type", Number)
], ProductFilterDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsNumber)({}, { message: 'Offset must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Offset must be greater than or equal to 0' }),
    __metadata("design:type", Number)
], ProductFilterDto.prototype, "offset", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    (0, class_validator_1.IsBoolean)({ message: 'Include deleted must be a boolean' }),
    __metadata("design:type", Boolean)
], ProductFilterDto.prototype, "includeDeleted", void 0);
class CreateProductDto {
    name;
    price;
    description;
    code;
    stock;
}
exports.CreateProductDto = CreateProductDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Name must be a string' }),
    (0, class_validator_1.Length)(1, 100, { message: 'Name must be between 1 and 100 characters' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "name", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    (0, class_validator_1.IsNumber)({}, { message: 'Price must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Price must be greater than or equal to 0' }),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Description must be a string' }),
    (0, class_validator_1.Length)(1, 1000, { message: 'Description must be between 1 and 1000 characters' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Code must be a string' }),
    (0, class_validator_1.Length)(1, 50, { message: 'Code must be between 1 and 50 characters' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsNumber)({}, { message: 'Stock must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Stock must be greater than or equal to 0' }),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "stock", void 0);
class UpdateProductDto {
    name;
    price;
    description;
    code;
    stock;
}
exports.UpdateProductDto = UpdateProductDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Name must be a string' }),
    (0, class_validator_1.Length)(1, 100, { message: 'Name must be between 1 and 100 characters' }),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    (0, class_validator_1.IsNumber)({}, { message: 'Price must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Price must be greater than or equal to 0' }),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Description must be a string' }),
    (0, class_validator_1.Length)(1, 1000, { message: 'Description must be between 1 and 1000 characters' }),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Code must be a string' }),
    (0, class_validator_1.Length)(1, 50, { message: 'Code must be between 1 and 50 characters' }),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsNumber)({}, { message: 'Stock must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Stock must be greater than or equal to 0' }),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "stock", void 0);
//# sourceMappingURL=product.dto.js.map