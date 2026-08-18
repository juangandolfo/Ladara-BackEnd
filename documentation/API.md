# REST API Endpoints

## Base URL

```
http://localhost:3000
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All endpoints return a standardized response format:

```json
{
    "success": boolean,
    "message": string,
    "data": T,
    "error": string (optional)
}
```

---

## Auth Endpoints

### Google OAuth Login

**Endpoint**: `GET /auth/google`

**Description**: Initiates Google OAuth 2.0 authentication flow

**Authentication**: None

**Parameters**: None

**Response**: Redirects to Google OAuth consent screen

---

### Google OAuth Callback

**Endpoint**: `GET /auth/google/callback`

**Description**: Handles Google OAuth callback after user authentication

**Authentication**: OAuth token (handled by Passport)

**Parameters**:
- `code` (query) - Authorization code from Google
- `state` (query) - CSRF protection state

**Response**:
```json
{
    "user": {
        "id": "uuid",
        "name": "John Doe",
        "isAdmin": false
    },
    "token": "jwt_token_here"
}
```

---

### Get Current User

**Endpoint**: `GET /auth/me`

**Description**: Get authenticated user information

**Authentication**: Required (JWT Bearer token)

**Parameters**: None

**Response**:
```json
{
    "success": true,
    "message": "User retrieved",
    "data": {
        "id": "uuid",
        "name": "John Doe",
        "isAdmin": false
    }
}
```

---

## Product Endpoints

### Filter Products by Query

**Endpoint**: `GET /products/query`

**Description**: Filter products using query parameters

**Authentication**: None

**Query Parameters**:
- `id` (number) - Product ID
- `name` (string) - Product name
- `category` (string) - Product category
- `minPrice` (number) - Minimum price
- `maxPrice` (number) - Maximum price
- `minStock` (number) - Minimum stock quantity
- `maxStock` (number) - Maximum stock quantity
- `code` (string) - Product code/SKU
- `description` (string) - Product description
- `stock` (number) - Available stock
- `sortBy` (string) - Sort field: id, name, price, description, code, stock
- `sortOrder` (string) - ASC or DESC
- `limit` (number) - Results per page (default: 10)
- `offset` (number) - Pagination offset (default: 0)
- `includeDeleted` (boolean) - Include soft-deleted products

**Response**:
```json
{
    "success": true,
    "message": "Products filtered successfully",
    "data": [
        {
            "id": 1,
            "name": "Product Name",
            "price": 29.99,
            "discountedPrice": 24.99,
            "category": "Electronics",
            "stock": 100,
            "image": "url/to/image.jpg",
            "description": "Product description",
            "code": "PROD001",
            "deletedAt": null
        }
    ],
    "meta": {
        "total": 150,
        "count": 10,
        "appliedFilters": {...}
    }
}
```

---

### Filter Products by Body

**Endpoint**: `POST /products/filter`

**Description**: Filter products using request body (recommended for complex queries)

**Authentication**: None

**Request Body**:
```json
{
    "category": "Electronics",
    "minPrice": 10,
    "maxPrice": 100,
    "sortBy": "price",
    "sortOrder": "ASC",
    "limit": 20,
    "offset": 0
}
```

**Response**: Same as GET /products/query

---

### Get All Categories

**Endpoint**: `GET /products/categories`

**Description**: Get all unique product categories

**Authentication**: None

**Parameters**: None

**Response**:
```json
{
    "success": true,
    "message": "Categories retrieved",
    "data": ["Electronics", "Clothing", "Home", "Books"]
}
```

---

### Get All Products

**Endpoint**: `GET /products`

**Description**: Get all products (admin only)

**Authentication**: Required (JWT token with admin role)

**Parameters**:
- `limit` (query, number)
- `offset` (query, number)

**Response**:
```json
{
    "success": true,
    "message": "All products retrieved",
    "data": [...]
}
```

---

### Get Deleted Products

**Endpoint**: `GET /products/deleted`

**Description**: Get soft-deleted products (admin only)

**Authentication**: Required (JWT token with admin role)

**Parameters**:
- `limit` (query, number)
- `offset` (query, number)

**Response**: Array of products with `deletedAt` timestamp

---

### Create Product

**Endpoint**: `POST /products`

**Description**: Create new product (admin only)

**Authentication**: Required (JWT token with admin role)

**Request Body**:
```json
{
    "name": "New Product",
    "price": 49.99,
    "category": "Electronics",
    "image": "url/to/image.jpg",
    "description": "Product description",
    "code": "PROD002",
    "stock": 50
}
```

**Response**:
```json
{
    "success": true,
    "message": "Product created successfully",
    "data": {
        "id": 2,
        "name": "New Product",
        ...
    }
}
```

---

### Update Product

**Endpoint**: `PUT /products/:id`

**Description**: Update product (admin only)

**Authentication**: Required (JWT token with admin role)

**Path Parameters**:
- `id` (number) - Product ID

**Request Body**:
```json
{
    "name": "Updated Name",
    "price": 39.99
}
```

**Response**: Updated product object

---

### Delete Product (Soft Delete)

**Endpoint**: `DELETE /products/:id`

**Description**: Soft delete product (admin only)

**Authentication**: Required (JWT token with admin role)

**Path Parameters**:
- `id` (number) - Product ID

**Response**:
```json
{
    "success": true,
    "message": "Product deleted successfully"
}
```

---

### Permanently Delete Product

**Endpoint**: `DELETE /products/:id/permanent`

**Description**: Permanently delete product from database (admin only)

**Authentication**: Required (JWT token with admin role)

**Path Parameters**:
- `id` (number) - Product ID

**Response**:
```json
{
    "success": true,
    "message": "Product permanently deleted"
}
```

---

### Restore Product

**Endpoint**: `POST /products/:id/restore`

**Description**: Restore soft-deleted product (admin only)

**Authentication**: Required (JWT token with admin role)

**Path Parameters**:
- `id` (number) - Product ID

**Response**: Restored product object

---

## Order Endpoints

### Get Current Order

**Endpoint**: `GET /orders/current`

**Description**: Get current shopping cart (CART status order) for authenticated user

**Authentication**: Required (JWT token)

**Parameters**: None

**Response**:
```json
{
    "success": true,
    "message": "Orders retrieved successfully",
    "data": [
        {
            "id": 1,
            "userId": "user-uuid",
            "status": "cart",
            "total": 99.99,
            "createdAt": "2024-01-15T10:30:00Z",
            "items": [
                {
                    "id": 1,
                    "productId": 1,
                    "quantity": 2,
                    "price": 49.99,
                    "total": 99.98,
                    "product": {
                        "id": 1,
                        "name": "Product Name",
                        "price": 49.99,
                        "discountedPrice": 44.99,
                        "image": "url/to/image.jpg",
                        "category": "Electronics"
                    }
                }
            ]
        }
    ]
}
```

---

### Get All Orders for User

**Endpoint**: `GET /orders`

**Description**: Get all orders (cart and completed) for authenticated user

**Authentication**: Required (JWT token)

**Parameters**: None

**Response**: Array of order objects

---

### Add Item to Order

**Endpoint**: `POST /orders/:id/items`

**Description**: Add product to shopping cart order

**Authentication**: Required (JWT token, must be order owner)

**Path Parameters**:
- `id` (number) - Order ID

**Request Body**:
```json
{
    "productId": 1,
    "quantity": 2
}
```

**Response**:
```json
{
    "success": true,
    "message": "Item added to order successfully",
    "data": {
        "id": 1,
        "productId": 1,
        "quantity": 2,
        "price": 49.99,
        "total": 99.98
    }
}
```

---

### Update Item Quantity

**Endpoint**: `PUT /orders/items/:itemId`

**Description**: Update quantity of item in order

**Authentication**: Required (JWT token)

**Path Parameters**:
- `itemId` (number) - Order item ID

**Request Body**:
```json
{
    "quantity": 5
}
```

**Response**: Updated order item object

---

### Delete Item from Order

**Endpoint**: `DELETE /orders/items/:itemId`

**Description**: Remove item from shopping cart

**Authentication**: Required (JWT token)

**Path Parameters**:
- `itemId` (number) - Order item ID

**Response**:
```json
{
    "success": true,
    "message": "Item removed from order successfully"
}
```

---

### Mark Order as Completed

**Endpoint**: `POST /orders/:id/complete`

**Description**: Mark order as completed (admin only)

**Authentication**: Required (JWT token with admin role)

**Path Parameters**:
- `id` (number) - Order ID

**Response**: Updated order object with status "completed"

---

## Discount Endpoints

### Create Discount

**Endpoint**: `POST /discounts`

**Description**: Create discount for a user (admin only)

**Authentication**: Required (JWT token with admin role)

**Request Body**:
```json
{
    "userId": "user-uuid",
    "value": 10.00,
    "type": "fixed",
    "description": "Summer Sale - $10 off",
    "usesLeft": 5
}
```

**Response**:
```json
{
    "success": true,
    "message": "Discount created successfully",
    "data": {
        "id": 1,
        "userId": "user-uuid",
        "value": 10.00,
        "type": "fixed",
        "description": "Summer Sale - $10 off",
        "usesLeft": 5,
        "deletedAt": null
    }
}
```

---

### List Discounts

**Endpoint**: `GET /discounts`

**Description**: Get all active discounts (admin only)

**Authentication**: Required (JWT token with admin role)

**Parameters**: None

**Response**:
```json
{
    "success": true,
    "message": "Discounts retrieved successfully",
    "data": [...]
}
```

---

### List Deleted Discounts

**Endpoint**: `GET /discounts/deleted`

**Description**: Get soft-deleted discounts (admin only)

**Authentication**: Required (JWT token with admin role)

**Parameters**: None

**Response**: Array of deleted discount objects

---

### Update Discount

**Endpoint**: `PUT /discounts/:id`

**Description**: Update discount (admin only)

**Authentication**: Required (JWT token with admin role)

**Path Parameters**:
- `id` (number) - Discount ID

**Request Body**:
```json
{
    "value": 15.00,
    "usesLeft": 10
}
```

**Response**: Updated discount object

---

### Delete Discount

**Endpoint**: `DELETE /discounts/:id`

**Description**: Soft delete discount (admin only)

**Authentication**: Required (JWT token with admin role)

**Path Parameters**:
- `id` (number) - Discount ID

**Response**:
```json
{
    "success": true,
    "message": "Discount deleted successfully"
}
```

---

## Error Handling

### Common Error Responses

**400 Bad Request**:
```json
{
    "success": false,
    "message": "Validation failed",
    "error": "Minimum price cannot be greater than maximum price"
}
```

**401 Unauthorized**:
```json
{
    "success": false,
    "message": "Unauthorized",
    "error": "No token provided"
}
```

**403 Forbidden**:
```json
{
    "success": false,
    "message": "Access denied",
    "error": "Admin privileges required"
}
```

**500 Internal Server Error**:
```json
{
    "success": false,
    "message": "Internal server error",
    "error": "Error details..."
}
```

---

## Rate Limiting

Currently: Not implemented

## CORS

- **Allowed Origins**: * (all)
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Origin, X-Requested-With, Content-Type, Accept, Authorization

---

For module-specific details, see:
- [Product Module](./PRODUCT.md)
- [Order Module](./ORDER.md)
- [Discount Module](./DISCOUNT.md)
- [Authentication Module](./AUTH.md)
