# Product Module

## Overview

The Product module manages the product catalog, including CRUD operations, advanced filtering, stock management, and soft deletion. It provides flexible filtering capabilities for both backend operations and frontend searches.

## Files

- `product.controller.ts` - HTTP request handlers
- `product.service.ts` - Business logic
- `product.entity.ts` - Database schema
- `product.validators.ts` - Input validation rules
- `product.routes.ts` - Route definitions

## Entity: Product

### Fields

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | INT | PK, Auto-increment | Unique identifier |
| `name` | VARCHAR(100) | NOT NULL | Product name |
| `price` | DECIMAL(10,2) | NOT NULL | Product price |
| `description` | TEXT | Nullable | Product details |
| `code` | VARCHAR(50) | Nullable, Unique | SKU/Product code |
| `stock` | INT | Default: 0 | Available quantity |
| `category` | VARCHAR(50) | NOT NULL | Product category |
| `image` | VARCHAR(255) | NOT NULL | Image URL |
| `deletedAt` | DATETIME | Nullable | Soft delete timestamp |

### Example Product

```json
{
    "id": 1,
    "name": "Wireless Headphones",
    "price": 79.99,
    "description": "High-quality wireless headphones with noise cancellation",
    "code": "WH-001",
    "stock": 50,
    "category": "Electronics",
    "image": "https://cdn.example.com/headphones.jpg",
    "deletedAt": null,
    "discountedPrice": 69.99
}
```

---

## ProductService

### Interface: ProductFilters

Used for filtering queries:

```typescript
interface ProductFilters {
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
```

### Methods

#### `filterProducts(filters: ProductFilters, userId: string): Promise<ProductFilterResult>`

Core filtering method supporting advanced queries.

**Parameters**:
- `filters` - ProductFilters object with query criteria
- `userId` - User ID for discount calculation

**Returns**:
```typescript
{
    products: Product[],
    total: number,        // Total matches without pagination
    count: number,        // Count in current page
    appliedFilters: ProductFilters
}
```

**Features**:
1. **Price Filtering**:
   - Single price match
   - Range filtering (minPrice, maxPrice)
   - Decimal precision (10,2)

2. **Stock Filtering**:
   - Exact match
   - Range filtering (minStock, maxStock)

3. **Text Search**:
   - Search by name, description, code
   - Database-level filtering

4. **Category Filtering**:
   - Exact category match
   - Get unique categories separately

5. **Sorting**:
   - Multiple sort columns
   - ASC/DESC order
   - Default: no specific order

6. **Pagination**:
   - Limit: results per page (default: 10)
   - Offset: starting position

7. **Soft Delete Handling**:
   - `includeDeleted: false` (default) - excludes deleted products
   - `includeDeleted: true` - includes deleted products

8. **Discount Application**:
   - Calculates discounted price for user
   - Adds `discountedPrice` field to each product

**Example Usage**:
```typescript
const filters = {
    category: 'Electronics',
    minPrice: 50,
    maxPrice: 150,
    sortBy: 'price',
    sortOrder: 'ASC',
    limit: 20,
    offset: 0
};

const result = await productService.filterProducts(filters, userId);
```

---

#### `applyFilters(queryBuilder, filters)`

Helper method to apply filter conditions to QueryBuilder.

**Filters Applied**:
- Exact match: id, code, price, stock
- Range: minPrice, maxPrice, minStock, maxStock
- Text search: name, description
- Category: exact match

---

#### `applySorting(queryBuilder, filters)`

Apply sort order to query.

**Supported Columns**:
- id, name, price, description, code, stock

**Default**: No sorting

---

#### `applyPagination(queryBuilder, filters)`

Apply limit and offset for pagination.

**Defaults**:
- limit: No limit
- offset: 0

---

#### `applyDiscountsToPrice(productId: number, originalPrice: number, user: User): Promise<number>`

Calculate final price after applying user discounts.

**Parameters**:
- `productId` - Product ID
- `originalPrice` - Base price
- `user` - User object (for discount lookup)

**Returns**: Final discounted price

**Logic**:
1. Get all discounts for user
2. Calculate price with each discount
3. Return lowest resulting price
4. If multiple discounts, apply best one

**Discount Types**:
- `fixed`: Subtract fixed amount
- `percent`: Apply percentage discount

---

## ProductController

### Methods

#### `filterProductsQuery(req: Request, res: Response): Promise<void>`

Handle GET /products/query with query parameters.

**Query Parameters**: All ProductFilters fields

**Validation**:
- minPrice <= maxPrice
- minStock <= maxStock
- All parameters optional

**Response**: Filtered products with metadata

---

#### `filterProductsBody(req: Request, res: Response): Promise<void>`

Handle POST /products/filter with request body.

**Request Body**: ProductFilters object

**Advantages over query**:
- Better for complex queries
- Supports large filter objects
- Cleaner API design

---

#### `getAllProducts(req: Request, res: Response): Promise<void>`

Get all products (admin only).

**Authentication**: Required, admin role

**Pagination**: Supports limit/offset

---

#### `getDeletedProducts(req: Request, res: Response): Promise<void>`

Get soft-deleted products (admin only).

**Authentication**: Required, admin role

**Includes**: Products with deletedAt timestamp

---

#### `createProduct(req: Request, res: Response): Promise<void>`

Create new product (admin only).

**Authentication**: Required, admin role

**Request Body**:
```json
{
    "name": "Product Name",
    "price": 99.99,
    "category": "Electronics",
    "image": "url/to/image.jpg",
    "description": "Optional description",
    "code": "PROD001",
    "stock": 50
}
```

**Validations**:
- name: required, string
- price: required, positive number
- category: required, string
- image: required, URL
- code: optional, unique if provided
- stock: optional, non-negative integer

---

#### `updateProduct(req: Request, res: Response): Promise<void>`

Update product details (admin only).

**Authentication**: Required, admin role

**Path Parameter**: `id` - Product ID

**Request Body** (partial):
```json
{
    "name": "Updated Name",
    "price": 89.99,
    "stock": 30
}
```

**Updatable Fields**:
- name, price, description, code, stock, category, image

---

#### `deleteProduct(req: Request, res: Response): Promise<void>`

Soft delete product (admin only).

**Authentication**: Required, admin role

**Path Parameter**: `id` - Product ID

**Effect**: Sets `deletedAt` to current timestamp

**Reversible**: Can restore with restoreProduct()

---

#### `permanentlyDeleteProduct(req: Request, res: Response): Promise<void>`

Permanently delete product from database (admin only).

**Authentication**: Required, admin role

**Path Parameter**: `id` - Product ID

**Effect**: Removes product and all related data

**Warning**: Cannot be undone

---

#### `restoreProduct(req: Request, res: Response): Promise<void>`

Restore soft-deleted product (admin only).

**Authentication**: Required, admin role

**Path Parameter**: `id` - Product ID

**Effect**: Clears `deletedAt` timestamp

---

#### `getAllCategories(req: Request, res: Response): Promise<void>`

Get unique product categories.

**Authentication**: None

**Response**:
```json
{
    "success": true,
    "data": ["Electronics", "Clothing", "Home", "Books"]
}
```

---

## Routes

```typescript
// Public endpoints
router.get('/query', filterProductsValidators, handleValidationErrors, filterProductsQuery);
router.post('/filter', filterProductsValidators, handleValidationErrors, filterProductsBody);
router.get('/categories', getAllCategories);

// Admin-only endpoints
router.get('/', adminOnly, getAllProducts);
router.get('/deleted', adminOnly, getDeletedProducts);
router.post('/', adminOnly, createProductValidators, handleValidationErrors, createProduct);
router.put('/:id', adminOnly, updateProductValidators, handleValidationErrors, updateProduct);
router.delete('/:id', adminOnly, deleteProduct);
router.delete('/:id/permanent', adminOnly, permanentlyDeleteProduct);
router.post('/:id/restore', adminOnly, restoreProduct);
```

---

## Validators

### Input Validation Rules

**createProductValidators**:
- name: required, string, 1-100 chars
- price: required, number, > 0
- category: required, string
- image: required, URL format
- description: optional, string
- code: optional, unique
- stock: optional, non-negative integer

**updateProductValidators**:
- All fields optional
- If provided, must meet same constraints as create

**filterProductsValidators**:
- price/minPrice/maxPrice: numbers if provided
- stock/minStock/maxStock: integers if provided
- limit/offset: positive integers
- sortOrder: 'ASC' or 'DESC'
- sortBy: valid column name

**productIdParamValidator**:
- id: required, positive integer

---

## Features in Detail

### Advanced Filtering Example

```bash
# Complex filter with multiple criteria
POST /products/filter

{
    "category": "Electronics",
    "minPrice": 50,
    "maxPrice": 500,
    "minStock": 5,
    "maxStock": 1000,
    "sortBy": "price",
    "sortOrder": "ASC",
    "limit": 50,
    "offset": 100
}
```

### Soft Delete System

**Benefits**:
- Data recovery capability
- Audit trail
- Referential integrity

**Query Examples**:
```typescript
// Exclude deleted (default)
await filterProducts({ ...filters, includeDeleted: false });

// Include deleted products
await filterProducts({ ...filters, includeDeleted: true });
```

### Discount Integration

Products automatically include discounted price:

```json
{
    "id": 1,
    "name": "Headphones",
    "price": 79.99,
    "discountedPrice": 69.99,  // After user discounts applied
    ...
}
```

---

## Performance Considerations

1. **Database Indexing**: Consider adding indexes on:
   - category
   - code (unique)
   - price
   - stock

2. **Query Optimization**:
   - Use pagination for large datasets
   - Filter on database level
   - Avoid unnecessary relations

3. **Caching Opportunities**:
   - Category list (rarely changes)
   - Product details (moderate changes)

---

## Error Handling

### Validation Errors (400)
```json
{
    "success": false,
    "message": "Validation failed",
    "error": "Minimum price cannot be greater than maximum price"
}
```

### Not Found (404)
```json
{
    "success": false,
    "message": "Product not found"
}
```

### Unauthorized (401)
```json
{
    "success": false,
    "message": "Unauthorized"
}
```

### Forbidden (403)
```json
{
    "success": false,
    "message": "Admin privileges required"
}
```

---

## Integration Points

- **Discount Module**: For price calculations
- **Order Module**: Products in orders/carts
- **User Module**: Discount lookups by user
- **Database**: TypeORM entity management

---

Related Documentation:
- [API Endpoints](./API.md#product-endpoints)
- [Database Schema](./DATABASE.md#2-product)
- [Discount Module](./DISCOUNT.md)
- [Order Module](./ORDER.md)
