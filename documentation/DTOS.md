# Data Transfer Objects (DTOs)

## Overview

DTOs (Data Transfer Objects) define the shape of data exchanged between frontend and backend. They provide:
- Type safety
- Request/response validation
- Separation from database entities
- Frontend-backend contract enforcement
- Consistent API interface

## File Location

`src/dtos/`

---

## ProductFilterDto

**File**: `src/dtos/product.dto.ts`

**Purpose**: Define product filtering and query interface

### Interface: ProductFilterDto

Used for querying and filtering products.

```typescript
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
```

### Fields

| Field | Type | Purpose |
|-------|------|---------|
| `id` | number? | Exact product ID |
| `name` | string? | Search by name |
| `description` | string? | Search by description |
| `code` | string? | Search by product code |
| `price` | number? | Exact price match |
| `minPrice` | number? | Minimum price filter |
| `maxPrice` | number? | Maximum price filter |
| `stock` | number? | Exact stock quantity |
| `minStock` | number? | Minimum stock filter |
| `maxStock` | number? | Maximum stock filter |
| `category` | string? | Filter by category |
| `sortBy` | string? | Sort column name |
| `sortOrder` | 'ASC' \| 'DESC'? | Sort direction |
| `limit` | number? | Results per page |
| `offset` | number? | Pagination offset |
| `includeDeleted` | boolean? | Include soft-deleted |

### Usage Examples

#### Query String (GET)
```bash
GET /products/query?category=Electronics&minPrice=50&maxPrice=500&sortBy=price&sortOrder=ASC&limit=20
```

Parsed to:
```typescript
{
    category: 'Electronics',
    minPrice: 50,
    maxPrice: 500,
    sortBy: 'price',
    sortOrder: 'ASC',
    limit: 20
}
```

#### Request Body (POST)
```json
{
    "category": "Electronics",
    "minPrice": 50,
    "maxPrice": 500,
    "sortBy": "price",
    "sortOrder": "ASC",
    "limit": 20,
    "offset": 0
}
```

---

### Class: CreateProductDto

**Purpose**: Define request body for product creation

```typescript
export class CreateProductDto {
    name: string;
    price: number;
    description?: string;
    code?: string;
    stock?: number;
}
```

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | Product name |
| `price` | number | Yes | Product price |
| `description` | string | No | Product details |
| `code` | string | No | SKU or product code |
| `stock` | number | No | Initial stock quantity |

### Example

```typescript
// Frontend sends:
{
    "name": "Wireless Headphones",
    "price": 79.99,
    "description": "High-quality noise cancelling",
    "code": "WH-001",
    "stock": 50
}

// Backend creates Product entity with these fields
// Additional fields (id, category, image, deletedAt) handled by controller
```

---

### Class: UpdateProductDto

**Purpose**: Define request body for product updates

```typescript
export class UpdateProductDto {
    name?: string;
    price?: number;
}
```

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | No | New product name |
| `price` | number | No | New product price |

### Partial Update

All fields are optional. Only provided fields are updated:

```typescript
// Update only price
PUT /products/1
{ "price": 89.99 }

// Update only name
PUT /products/1
{ "name": "Updated Name" }

// Update both
PUT /products/1
{ "name": "Updated", "price": 89.99 }
```

---

## Order DTOs

**File**: `src/dtos/order.dto.ts`

### Interface: AddItemToOrderDto

```typescript
export interface AddItemToOrderDto {
    productId: number;
    quantity: number;
}
```

**Purpose**: Add item to order request

**Fields**:
- `productId` (required): ID of product to add
- `quantity` (required): Quantity to add

**Example**:
```json
{
    "productId": 1,
    "quantity": 2
}
```

---

### Interface: OrderItemDto

```typescript
export interface OrderItemDto {
    id: number;
    productId: number;
    quantity: number;
    price: number;
    total: number;
    product?: {
        id: number;
        name: string;
        price: number;
        discountedPrice: number;
        image: string;
        category: string;
        description?: string;
    };
}
```

**Purpose**: Represent line item in response

**Fields**:
- `id` - OrderItem ID
- `productId` - Product ID
- `quantity` - Item quantity
- `price` - Price at time of order
- `total` - quantity * price
- `product` - Nested product details (optional)

**Example Response**:
```json
{
    "id": 1,
    "productId": 1,
    "quantity": 2,
    "price": 49.99,
    "total": 99.98,
    "discountedPrice": 44.99,
    "product": {
        "id": 1,
        "name": "Wireless Headphones",
        "price": 49.99,
        "discountedPrice": 44.99,
        "image": "url/to/image.jpg",
        "category": "Electronics"
    }
}
```

---

### Interface: OrderDto

```typescript
export interface OrderDto {
    id: number;
    userId: number;
    status: string;
    total: number;
    createdAt: string;
    updatedAt: string;
    items?: OrderItemDto[];
}
```

**Purpose**: Represent complete order in response

**Fields**:
- `id` - Order ID
- `userId` - User ID
- `status` - Order status (cart, preparing, completed)
- `total` - Total order amount
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp
- `items` - Array of OrderItemDto

**Example Response**:
```json
{
    "id": 1,
    "userId": "user-uuid",
    "status": "cart",
    "total": 199.98,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:15:00Z",
    "items": [
        { ... OrderItemDto ... },
        { ... OrderItemDto ... }
    ]
}
```

---

## Response Interface

### ApiResponse<T>

**Purpose**: Standardized response format for all endpoints

```typescript
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}
```

### Fields

| Field | Type | Purpose |
|-------|------|---------|
| `success` | boolean | Operation success |
| `message` | string | Human-readable message |
| `data` | T | Response payload (generic) |
| `error` | string? | Error details if failed |

### Generic Response Types

```typescript
export interface CreateOrderResponse extends ApiResponse<OrderDto> {}
export interface GetOrderResponse extends ApiResponse<OrderDto> {}
export interface GetCurrentOrderResponse extends ApiResponse<OrderDto[]> {}
export interface CancelOrderResponse extends ApiResponse<OrderDto> {}
export interface AddItemResponse extends ApiResponse<OrderItemDto> {}
export interface DeleteItemResponse extends ApiResponse<never> {
    message: string;
}
```

### Usage

```typescript
// Success response with single order
const response: GetOrderResponse = {
    success: true,
    message: "Order retrieved successfully",
    data: orderDto
};

// Success response with multiple orders
const response: GetCurrentOrderResponse = {
    success: true,
    message: "Orders retrieved successfully",
    data: [orderDto1, orderDto2]
};

// Error response
const response: ApiResponse<any> = {
    success: false,
    message: "Operation failed",
    error: "Order not found"
};

// Delete response (no data)
const response: DeleteItemResponse = {
    success: true,
    message: "Item removed successfully"
};
```

---

## DTO Validation

DTOs are validated using decorators at route level:

### Validation Example

```typescript
// Route definition
router.post('/orders/:id/items',
    // Validators ensure data matches AddItemToOrderDto
    [
        param('id').isInt().notEmpty(),
        body('productId').isInt().notEmpty(),
        body('quantity').isInt().isInt({ min: 1 })
    ],
    handleValidationErrors,  // Throws 400 if validation fails
    addItemToOrder
);

// Controller receives validated data
async function addItemToOrder(req: Request, res: Response) {
    const data: AddItemToOrderDto = req.body;
    // data is guaranteed to have productId and quantity
    // Both are numbers and quantity >= 1
}
```

---

## Frontend Integration

### TypeScript Types

Frontend can use same DTOs via shared types file:

```typescript
// frontend/src/types/api.ts
export interface OrderItemDto {
    id: number;
    productId: number;
    quantity: number;
    price: number;
    total: number;
    product?: ProductInfo;
}

export interface OrderDto {
    id: number;
    userId: string;
    status: 'cart' | 'preparing' | 'completed';
    total: number;
    createdAt: string;
    updatedAt: string;
    items?: OrderItemDto[];
}

// Usage in React component
import { OrderDto, AddItemToOrderDto } from './types/api';

const MyOrder: React.FC<{ order: OrderDto }> = ({ order }) => {
    return (
        <div>
            <h1>Order #{order.id}</h1>
            <p>Total: ${order.total}</p>
            {order.items?.map(item => (
                <div key={item.id}>{item.product?.name}</div>
            ))}
        </div>
    );
};
```

---

## Design Principles

### Separation of Concerns
- **Entity**: Database representation (Product, Order)
- **DTO**: API contract (ProductFilterDto, OrderDto)
- Entities can change without breaking API

### Partial Specifications
- UpdateProductDto has optional fields
- AddItemToOrderDto has required fields
- Flexibility where needed, strictness where required

### Nested Data
- OrderItemDto includes nested Product info
- Reduces frontend API calls
- Avoids excessive data transfer

### Generic Response Wrapper
- All responses follow ApiResponse<T> pattern
- Frontend can handle consistently
- Type-safe with TypeScript generics

---

## Future Enhancements

- [ ] Pagination DTO for list responses
- [ ] Discount DTO for discount operations
- [ ] User profile DTO
- [ ] Error details DTO
- [ ] Filtering pagination metadata DTO
- [ ] Bulk operation DTOs
- [ ] Search results DTO

---

Related Documentation:
- [API Endpoints](./API.md)
- [Database Schema](./DATABASE.md)
- [Product Module](./PRODUCT.md)
- [Order Module](./ORDER.md)
