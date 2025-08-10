# Product API Documentation

## Overview
This API provides comprehensive product management capabilities including filtering, CRUD operations, and soft delete functionality using Express and TypeORM. All filters are optional and can be combined for powerful search functionality.

## Soft Delete Feature
This API implements soft delete functionality, meaning products are not permanently removed from the database when deleted. Instead, they are marked with a `deletedAt` timestamp and excluded from normal operations.

## Endpoints

### Product Filtering

#### 1. Filter Products with Query Parameters
**GET** `/api/products/query`

Filter products using URL query parameters.

#### Available Filters:
- `id` - Exact product ID match
- `name` - Partial text search in product name (case-insensitive)
- `description` - Partial text search in description (case-insensitive)
- `code` - Partial text search in product code (case-insensitive)
- `price` - Exact price match
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `stock` - Exact stock quantity match
- `minStock` - Minimum stock filter
- `maxStock` - Maximum stock filter
- `sortBy` - Column to sort by (`id`, `name`, `price`, `description`, `code`, `stock`)
- `sortOrder` - Sort direction (`ASC` or `DESC`)
- `limit` - Maximum number of results (1-100)
- `offset` - Number of results to skip for pagination
- `includeDeleted` - Include soft-deleted products in results (`true`/`false`)

#### Examples:

```bash
# Basic filtering (excludes deleted products by default)
GET /api/products/query?name=shirt&minPrice=20&maxPrice=100

# Include soft-deleted products in results
GET /api/products/query?name=laptop&includeDeleted=true

# Multiple filters with sorting
GET /api/products/query?name=laptop&minStock=5&sortBy=price&sortOrder=ASC

# Complex filtering with pagination
GET /api/products/query?description=cotton&minPrice=15&maxPrice=50&minStock=10&sortBy=name&sortOrder=DESC&limit=20&offset=0
```

#### 2. Filter Products with Request Body
**POST** `/api/products/filter`

Filter products using a JSON request body.

#### Request Body Example:
```json
{
  "name": "laptop",
  "minPrice": 500,
  "maxPrice": 1500,
  "sortBy": "price",
  "sortOrder": "ASC",
  "includeDeleted": false
}
```

### CRUD Operations

#### 3. Get All Products
**GET** `/api/products`

Retrieve all active (non-deleted) products.

#### 4. Get Product by ID
**GET** `/api/products/:id`

Retrieve a specific product by ID (excludes soft-deleted products).

#### 5. Create Product
**POST** `/api/products`

Create a new product.

#### 6. Update Product
**PUT** `/api/products/:id`

Update an existing product (only works on non-deleted products).

#### 7. Soft Delete Product
**DELETE** `/api/products/:id`

Soft delete a product (marks it as deleted but doesn't remove from database).

Response:
```json
{
  "success": true,
  "message": "Product soft deleted successfully"
}
```

### Soft Delete Management

#### 8. Get Deleted Products
**GET** `/api/products/deleted`

Retrieve all soft-deleted products.

Response:
```json
{
  "success": true,
  "message": "Deleted products retrieved successfully",
  "data": [...],
  "count": 5
}
```

#### 9. Restore Product
**POST** `/api/products/:id/restore`

Restore a soft-deleted product back to active status.

Response:
```json
{
  "success": true,
  "message": "Product restored successfully"
}
```

#### 10. Permanently Delete Product
**DELETE** `/api/products/:id/permanent`

⚠️ **WARNING**: This permanently removes the product from the database and cannot be undone.

Response:
```json
{
  "success": true,
  "message": "Product permanently deleted successfully"
}
```
  "minPrice": 500,
  "maxPrice": 2000,
  "minStock": 1,
  "sortBy": "price",
  "sortOrder": "ASC",
  "limit": 10,
  "offset": 0
}
```

### 3. Standard CRUD Operations

#### Get All Products
**GET** `/api/products`

#### Get Product by ID
**GET** `/api/products/:id`

#### Create Product
**POST** `/api/products`

Request Body:
```json
{
  "name": "Product Name",
  "price": 99.99,
  "description": "Product description",
  "code": "PROD001",
  "stock": 50
}
```

#### Update Product
**PUT** `/api/products/:id`

Request Body (all fields optional):
```json
{
  "name": "Updated Name",
  "price": 109.99,
  "description": "Updated description",
  "code": "PROD001-V2",
  "stock": 45
}
```

#### Delete Product
**DELETE** `/api/products/:id`

## Response Format

### Success Response:
```json
{
  "success": true,
  "message": "Products filtered successfully",
  "data": [...],
  "meta": {
    "total": 150,
    "count": 10,
    "appliedFilters": {
      "name": "laptop",
      "minPrice": 500,
      "maxPrice": 2000,
      "sortBy": "price",
      "sortOrder": "ASC"
    }
  }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Price must be a number"],
  "details": [
    {
      "property": "price",
      "value": "invalid",
      "constraints": {
        "isNumber": "Price must be a number"
      }
    }
  ]
}
```

## Validation Rules

### Number Fields:
- All numeric fields must be valid numbers
- Prices and IDs must be ≥ 0
- Stock quantities must be ≥ 0
- Limit must be between 1-100
- Offset must be ≥ 0

### String Fields:
- Name: 1-100 characters
- Description: 1-1000 characters
- Code: 1-50 characters

### Enum Fields:
- `sortBy`: Must be one of `id`, `name`, `price`, `description`, `code`, `stock`
- `sortOrder`: Must be either `ASC` or `DESC`

### Boolean Fields:
- `includeDeleted`: Must be either `true` or `false`

### Custom Validations:
- `minPrice` cannot be greater than `maxPrice`
- `minStock` cannot be greater than `maxStock`

## Soft Delete Behavior

### Default Behavior:
- All query operations exclude soft-deleted products by default
- Use `includeDeleted=true` to include them in results
- Soft-deleted products have a `deletedAt` timestamp

### Soft Delete Operations:
1. **Soft Delete**: Sets `deletedAt` timestamp, product becomes inactive
2. **Restore**: Removes `deletedAt` timestamp, product becomes active again
3. **Permanent Delete**: Actually removes the record from database

## Usage Examples

### 1. Search by Name and Price Range (Active Products Only)
```bash
curl "http://localhost:3000/api/products/query?name=laptop&minPrice=500&maxPrice=1500"
```

### 2. Search Including Deleted Products
```bash
curl "http://localhost:3000/api/products/query?name=laptop&includeDeleted=true"
```

### 3. Get All Deleted Products
```bash
curl "http://localhost:3000/api/products/deleted"
```

### 4. Soft Delete a Product
```bash
curl -X DELETE "http://localhost:3000/api/products/123"
```

### 5. Restore a Deleted Product
```bash
curl -X POST "http://localhost:3000/api/products/123/restore"
```

### 6. Permanently Delete a Product
```bash
curl -X DELETE "http://localhost:3000/api/products/123/permanent"
```

### 7. Filter with Complex Criteria
```bash
curl -X POST http://localhost:3000/api/products/filter \
  -H "Content-Type: application/json" \
  -d '{
    "description": "gaming",
    "minPrice": 800,
    "minStock": 5,
    "sortBy": "price",
    "sortOrder": "DESC",
    "limit": 20,
    "includeDeleted": false
  }'
```

### 3. Paginated Results
```bash
curl "http://localhost:3000/api/products/query?sortBy=name&sortOrder=ASC&limit=10&offset=20"
```

## Error Handling

The API includes comprehensive error handling:

1. **Validation Errors (400)**: Invalid input data
2. **Not Found (404)**: Product doesn't exist or is not accessible
   - For regular operations: Product not found or is soft-deleted
   - For restore operations: Product not found in deleted state
   - For delete operations: Product not found or already deleted
3. **Server Errors (500)**: Database or internal errors

### Soft Delete Specific Errors:

#### Trying to Update/Access Deleted Product:
```json
{
  "success": false,
  "message": "Product not found"
}
```

#### Trying to Restore Non-Deleted Product:
```json
{
  "success": false,
  "message": "Product not found in deleted state"
}
```

#### Trying to Delete Already Deleted Product:
```json
{
  "success": false,
  "message": "Product not found or already deleted"
}
```

All errors return a structured JSON response with details about what went wrong.

## Performance Notes

- Database queries are optimized using TypeORM QueryBuilder
- Indexes should be created on frequently filtered columns (`name`, `price`, `stock`)
- Pagination is recommended for large datasets
- Text searches use case-insensitive LIKE operations
