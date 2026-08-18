# Order Module

## Overview

The Order module manages shopping carts and order processing. It handles cart creation, item management, order status tracking, and discount application. Orders can exist in multiple states: CART (active shopping), PREPARING, and COMPLETED.

## Files

- `order.controller.ts` - HTTP request handlers
- `order.service.ts` - Business logic
- `order.routes.ts` - Route definitions
- `order.validators.ts` - Input validation
- `entities/order.entity.ts` - Order entity
- `entities/order-item.entity.ts` - OrderItem entity
- `types/order-status.type.ts` - Status enum

## Entities

### Order Entity

**Table**: `order`

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | INT | PK, Auto-increment | Order identifier |
| `user` | UUID | FK to users, NOT NULL | Order owner |
| `createdAt` | DATETIME | Auto-set | Creation timestamp |
| `total` | DECIMAL(10,2) | NOT NULL | Order total amount |
| `items` | Relation | OneToMany, cascade | Order line items |
| `status` | ENUM | Not null, default: CART | Current order status |

### OrderItem Entity

**Table**: `order_item`

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | INT | PK, Auto-increment | Item identifier |
| `order` | INT | FK to order | Parent order |
| `product` | INT | FK to product | Product reference |
| `quantity` | INT | NOT NULL | Item quantity |
| `price` | DECIMAL(10,2) | NOT NULL | Price at time of order |

### Order Status Enum

```typescript
enum OrderStatus {
    CART = 'cart',           // Active shopping cart
    PREPARING = 'preparing', // Order being prepared
    COMPLETED = 'completed'  // Order completed
}
```

---

## OrderService

### Methods

#### `createOrder(userId: string): Promise<Order>`

Create new order/shopping cart for user.

**Parameters**:
- `userId` - User UUID

**Returns**: New Order entity

**Logic**:
1. Find or verify user exists
2. Check if CART order already exists
3. If exists, return existing
4. If not, create new with:
   - status: CART
   - total: 0
   - empty items array
5. Save and return

**Note**: User can have only one active CART at a time

---

#### `getCurrentOrder(userId: string): Promise<Order[]>`

Get active shopping cart (CART status) for user.

**Parameters**:
- `userId` - User UUID

**Returns**: Array of CART status orders (typically 1)

**Relations Loaded**:
- items
- items.product
- user

**Post-Processing**:
- Applies user discounts to each item price
- Adds `discountedPrice` to items

---

#### `getOrdersByUser(userId: string): Promise<Order[]>`

Get all orders for user (all statuses).

**Parameters**:
- `userId` - User UUID

**Returns**: Array of all user orders (sorted by creation date, newest first)

**Sorting**: createdAt DESC

**Relations Loaded**:
- items
- items.product
- user

**Post-Processing**: Applies discounts to all items

---

#### `addItemToOrder(orderId: number, productId: number, quantity: number): Promise<OrderItem>`

Add or update product in order.

**Parameters**:
- `orderId` - Order ID
- `productId` - Product ID
- `quantity` - Quantity to add

**Returns**: OrderItem (created or updated)

**Logic**:
1. Fetch order and product
2. Check if item already in order
3. If exists: increment quantity
4. If not exists: create new item
5. Save item
6. Recalculate order total
7. Return item

---

#### `updateItemQuantityInOrder(itemId: number, quantity: number): Promise<OrderItem>`

Update quantity of existing order item.

**Parameters**:
- `itemId` - OrderItem ID
- `quantity` - New quantity

**Returns**: Updated OrderItem

**Logic**:
1. Find item by ID
2. Update quantity
3. Recalculate order total
4. Save item

---

#### `deleteItemFromOrder(itemId: number): Promise<void>`

Remove item from order.

**Parameters**:
- `itemId` - OrderItem ID

**Logic**:
1. Find and delete item by ID
2. Recalculate parent order total

---

#### `markOrderCompleted(orderId: number): Promise<Order>`

Mark order as completed (admin only).

**Parameters**:
- `orderId` - Order ID

**Returns**: Updated Order with COMPLETED status

**Logic**:
1. Find order
2. Set status to COMPLETED
3. Create new CART for user
4. Save

---

#### `applyDiscountsToPrice(productId: number, originalPrice: number, user: User): Promise<number | null>`

Calculate final price after discount application.

**Parameters**:
- `productId` - Product ID
- `originalPrice` - Base price from OrderItem
- `user` - User object

**Returns**: 
- Discounted price if discounts found
- null if no discounts apply

**Logic**:
1. Get all user discounts from DiscountService
2. Calculate price with each discount
3. Apply discount that results in lowest price
4. Decrement discount usage count if applicable
5. Return final price

**Discount Types**:
- `fixed`: Final = original - value
- `percent`: Final = original * (1 - value/100)

---

## OrderController

### Methods

#### `getCurrentOrder(req: Request, res: Response): Promise<void>`

Handle GET /orders/current

**Authentication**: Required (JWT)

**Logic**:
1. Extract user from req.entity
2. Get current order (CART status)
3. If none exists, create new
4. Return as array

**Response**:
```json
{
    "success": true,
    "message": "Orders retrieved successfully",
    "data": [
        {
            "id": 1,
            "status": "cart",
            "total": 199.98,
            "createdAt": "2024-01-15T10:30:00Z",
            "items": [
                {
                    "id": 1,
                    "productId": 1,
                    "quantity": 2,
                    "price": 49.99,
                    "discountedPrice": 44.99,
                    "total": 99.98,
                    "product": {...}
                }
            ]
        }
    ]
}
```

---

#### `getOrdersByUser(req: Request, res: Response): Promise<void>`

Handle GET /orders

**Authentication**: Required (JWT)

**Returns**: All orders for user (cart and completed)

---

#### `addItemToOrder(req: Request, res: Response): Promise<void>`

Handle POST /orders/:id/items

**Authentication**: Required (JWT, order owner)

**Path Parameter**: `id` - Order ID

**Request Body**:
```json
{
    "productId": 1,
    "quantity": 2
}
```

**Validation**:
- productId: required, positive integer
- quantity: required, positive integer

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

#### `updateItemQuantityInOrder(req: Request, res: Response): Promise<void>`

Handle PUT /orders/items/:itemId

**Authentication**: Required (JWT)

**Path Parameter**: `itemId` - OrderItem ID

**Request Body**:
```json
{
    "quantity": 5
}
```

**Validation**:
- quantity: required, positive integer

---

#### `deleteItemFromOrder(req: Request, res: Response): Promise<void>`

Handle DELETE /orders/items/:itemId

**Authentication**: Required (JWT)

**Path Parameter**: `itemId` - OrderItem ID

**Response**:
```json
{
    "success": true,
    "message": "Item removed from order successfully"
}
```

---

#### `markOrderCompleted(req: Request, res: Response): Promise<void>`

Handle POST /orders/:id/complete

**Authentication**: Required (JWT, admin only)

**Path Parameter**: `id` - Order ID

**Logic**:
1. Verify admin role
2. Get order
3. Set status to COMPLETED
4. Create new CART order for user
5. Return updated order

---

## Routes

```typescript
// Get current shopping cart
router.get("/current", authorize, getCurrentOrder);

// Get all user orders
router.get("/", authorize, getOrdersByUser);

// Add item to order
router.post("/:id/items", 
    orderIdParamValidator,
    addItemToOrderValidators,
    handleValidationErrors,
    authorize,
    isOrderOwnerMiddleware,
    addItemToOrder
);

// Update item quantity
router.put("/items/:itemId",
    itemIdParamValidator,
    updateItemQuantityValidators,
    handleValidationErrors,
    authorize,
    updateItemQuantityInOrder
);

// Remove item from order
router.delete("/items/:itemId",
    itemIdParamValidator,
    handleValidationErrors,
    authorize,
    deleteItemFromOrder
);

// Mark order completed
router.post("/:id/complete",
    orderIdParamValidator,
    handleValidationErrors,
    authorize,
    checkAdminMiddleware,
    markOrderCompleted
);
```

---

## Validators

### addItemToOrderValidators

- productId: required, positive integer
- quantity: required, positive integer, min 1

### updateItemQuantityValidators

- quantity: required, positive integer, min 1

### orderIdParamValidator

- id: required, positive integer

### itemIdParamValidator

- id: required, positive integer

---

## Order Lifecycle

```
1. User browses products
   ↓
2. Create CART order (on first add to cart)
   ↓
3. Add items to CART order
   ↓
4. Modify quantities / Remove items
   ↓
5. Discounts applied at checkout
   ↓
6. Admin marks as PREPARING
   ↓
7. Admin marks as COMPLETED
   ↓
8. New CART created for next shopping session
```

---

## Shopping Cart Flow

### First Visit
```
GET /orders/current
→ No CART order exists
→ Create new CART order
→ Return empty cart
```

### Add Item
```
POST /orders/:cartId/items
{ productId: 1, quantity: 2 }
→ Create OrderItem
→ Attach to CART order
→ Return item with applied discount
```

### View Cart
```
GET /orders/current
→ Return CART order with all items
→ Each item includes discountedPrice
```

### Modify Cart
```
PUT /orders/items/:itemId
{ quantity: 5 }
→ Update item quantity
→ Recalculate order total

DELETE /orders/items/:itemId
→ Remove item
→ Recalculate order total
```

### Checkout (Admin Action)
```
POST /orders/:cartId/complete
→ Mark order as COMPLETED
→ Create new CART for user
```

---

## Discount Application

When getting order items, discounts are automatically calculated:

```typescript
// For each item in order:
1. Get item.price (base price)
2. Look up user discounts
3. Apply best discount
4. Add discountedPrice field

result: {
    price: 49.99,           // Original price
    discountedPrice: 44.99, // After best discount
    total: 89.98            // Quantity * price
}
```

---

## Important Notes

### Price Snapshot
OrderItem stores `price` at time of order addition. This allows:
- Product price changes don't affect existing orders
- Historical accuracy
- Audit trail

### Order Total Calculation
Total = SUM(OrderItem.quantity * OrderItem.price)

Discounts are applied per-item, not order-level.

### Cascade Delete
When Order is deleted, all OrderItems are automatically deleted due to:
```typescript
@OneToMany(() => OrderItem, item => item.order, { cascade: true })
items: OrderItem[];
```

---

## Error Handling

### Product Not Found
```json
{
    "success": false,
    "message": "Product not found"
}
```

### Order Not Found
```json
{
    "success": false,
    "message": "Order not found"
}
```

### Unauthorized
```json
{
    "success": false,
    "message": "Not authorized to modify this order"
}
```

---

## Integration Points

- **Product Module**: Fetches product details
- **Discount Module**: Applies user discounts
- **User Module**: Validates order owner
- **Auth Middleware**: Ensures user authentication
- **Admin Middleware**: Protects admin operations

---

Related Documentation:
- [API Endpoints](./API.md#order-endpoints)
- [Database Schema](./DATABASE.md#3-order)
- [Discount Module](./DISCOUNT.md)
- [Product Module](./PRODUCT.md)
- [Middleware](./MIDDLEWARE.md)
