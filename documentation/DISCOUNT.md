# Discount Module

## Overview

The Discount module manages promotional discounts for users. Discounts can be fixed amounts or percentages, have optional usage limits, and are user-specific. This module integrates with the Order and Product modules to apply discounts during checkout and price display.

## Files

- `discount.controller.ts` - HTTP request handlers
- `discount.service.ts` - Business logic
- `discount.entity.ts` - Database schema
- `discount.validators.ts` - Input validation
- `discount.routes.ts` - Route definitions

## Entity: Discount

**Table**: `discount`

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | INT | PK, Auto-increment | Discount identifier |
| `user` | UUID | FK to users, NOT NULL | Discount owner |
| `value` | DECIMAL(5,2) | NOT NULL | Discount value |
| `type` | VARCHAR | Default: "fixed" | Discount type |
| `description` | VARCHAR | Nullable | Discount label |
| `usesLeft` | INT | Nullable | Remaining uses |
| `deletedAt` | DATETIME | Nullable | Soft delete timestamp |

### Example Discount

```json
{
    "id": 1,
    "userId": "user-uuid",
    "value": 10.00,
    "type": "fixed",
    "description": "Summer Sale - $10 off",
    "usesLeft": 5,
    "deletedAt": null
}
```

---

## Discount Types

### Fixed Discount
- **Type Value**: `"fixed"`
- **Calculation**: `finalPrice = originalPrice - value`
- **Example**: $10 off any purchase
- **Use Case**: Holiday promotions, loyalty rewards

### Percentage Discount
- **Type Value**: `"percent"`
- **Calculation**: `finalPrice = originalPrice * (1 - value/100)`
- **Example**: 20% off
- **Use Case**: Seasonal sales, percentage-based promotions

### Usage Limits

**Unlimited Uses**:
- Set `usesLeft` to `null`
- Discount can be used indefinitely

**Limited Uses**:
- Set `usesLeft` to positive integer
- Each use decrements the counter
- Automatically deleted when `usesLeft` reaches 0

---

## DiscountService

### Methods

#### `createDiscount(data: Partial<Discount>): Promise<Discount>`

Create new discount for user.

**Parameters**:
```typescript
{
    user: User,              // User entity or relationship
    value: number,           // 10.00 or 20
    type: "fixed"|"percent", // Discount type
    description?: string,    // Optional label
    usesLeft?: number|null   // null = unlimited
}
```

**Returns**: Created Discount entity

**Validation**:
- value must be positive
- type must be "fixed" or "percent"
- user must exist

**Example**:
```typescript
const discount = await discountService.createDiscount({
    user: userEntity,
    value: 15.00,
    type: "fixed",
    description: "Winter Sale",
    usesLeft: 10
});
```

---

#### `getDiscount(id: number): Promise<Discount | null>`

Retrieve discount by ID.

**Parameters**:
- `id` - Discount ID

**Returns**: Discount or null if not found

---

#### `listDiscounts(): Promise<Discount[]>`

Get all active discounts.

**Returns**: Array of active (non-deleted) discounts

**Excludes**: Soft-deleted discounts

---

#### `listDeletedDiscounts(): Promise<Discount[]>`

Get soft-deleted discounts.

**Returns**: Array of deleted discounts only

**Admin Only**: Useful for recovery

---

#### `listDiscountsByUser(userId: string): Promise<Discount[]>`

Get all active discounts for specific user.

**Parameters**:
- `userId` - User UUID

**Returns**: Array of user's active discounts

**Relations Loaded**: user

**Logic**:
1. Query discounts where user.id = userId
2. Exclude deleted (deletedAt is null)
3. Return sorted (or not sorted)

---

#### `updateDiscount(id: number, data: Partial<Discount>): Promise<Discount | null>`

Update discount details.

**Parameters**:
- `id` - Discount ID
- `data` - Partial discount object

**Returns**: Updated Discount or null if not found

**Updatable Fields**:
- value
- type
- description
- usesLeft

**Example**:
```typescript
const updated = await discountService.updateDiscount(1, {
    usesLeft: 5,
    description: "Updated Summer Sale"
});
```

---

#### `deleteDiscount(id: number): Promise<boolean>`

Soft delete discount.

**Parameters**:
- `id` - Discount ID

**Returns**: true if deleted, false if not found

**Effect**: Sets `deletedAt` to current timestamp

**Reversible**: Can restore from database directly

---

#### `useDiscount(id: number): Promise<boolean>`

Apply discount and decrement usage counter.

**Parameters**:
- `id` - Discount ID

**Returns**: true if successfully used, false if not available

**Logic**:
1. Find discount by ID
2. If `usesLeft` is null (unlimited):
   - Allow use
   - Don't decrement
   - Return true
3. If `usesLeft` > 0:
   - Decrement usesLeft
   - If now 0: auto-delete
   - Save and return true
4. If `usesLeft` === 0:
   - Deny use
   - Return false

---

## DiscountController

### Methods

#### `createDiscount(req: Request, res: Response): Promise<void>`

Handle POST /discounts (admin only)

**Authentication**: Required, admin role

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

**Validation**:
- userId: required, valid UUID
- value: required, positive number
- type: required, "fixed" or "percent"
- description: optional, string
- usesLeft: optional, positive integer or null

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

#### `listDiscounts(req: Request, res: Response): Promise<void>`

Handle GET /discounts (admin only)

**Authentication**: Required, admin role

**Returns**: All active discounts in system

---

#### `listDeletedDiscounts(req: Request, res: Response): Promise<void>`

Handle GET /discounts/deleted (admin only)

**Authentication**: Required, admin role

**Returns**: Soft-deleted discounts only

---

#### `updateDiscount(req: Request, res: Response): Promise<void>`

Handle PUT /discounts/:id (admin only)

**Authentication**: Required, admin role

**Path Parameter**: `id` - Discount ID

**Request Body** (partial):
```json
{
    "value": 15.00,
    "usesLeft": 10,
    "description": "Updated description"
}
```

**Response**: Updated Discount object

---

#### `deleteDiscount(req: Request, res: Response): Promise<void>`

Handle DELETE /discounts/:id (admin only)

**Authentication**: Required, admin role

**Path Parameter**: `id` - Discount ID

**Response**:
```json
{
    "success": true,
    "message": "Discount deleted successfully"
}
```

---

## Routes

```typescript
// Create discount (admin only)
router.post("/", 
    createDiscountValidators,
    handleValidationErrors,
    authorize,
    checkAdminMiddleware,
    createDiscount
);

// Update discount (admin only)
router.put("/:id",
    updateDiscountValidators,
    handleValidationErrors,
    authorize,
    checkAdminMiddleware,
    updateDiscount
);

// Delete discount (admin only)
router.delete("/:id",
    idParamValidator,
    handleValidationErrors,
    authorize,
    checkAdminMiddleware,
    deleteDiscount
);

// List active discounts (admin only)
router.get("/",
    authorize,
    checkAdminMiddleware,
    listDiscounts
);

// List deleted discounts (admin only)
router.get("/deleted",
    authorize,
    checkAdminMiddleware,
    listDeletedDiscounts
);
```

---

## Validators

### createDiscountValidators

- userId: required, valid UUID format
- value: required, positive number
- type: required, must be "fixed" or "percent"
- description: optional, string
- usesLeft: optional, positive integer

### updateDiscountValidators

- All fields optional
- If provided, must meet same constraints as create

### idParamValidator

- id: required, positive integer

---

## Discount Application Logic

### Where Discounts Are Applied

1. **Product Display** (Product Module)
   - Each product shows `discountedPrice`
   - Calculated from user's best discount
   - Location: ProductService.filterProducts()

2. **Order Items** (Order Module)
   - Each item shows `discountedPrice`
   - Applied when retrieving order/cart
   - Location: OrderService.applyDiscountsToPrice()

### Discount Selection
When multiple discounts apply:
- System calculates price with each discount
- Returns the price resulting from the **best** (lowest price) discount
- Only one discount per product per transaction

### Unlimited vs Limited

**Unlimited Usage**:
```json
{
    "usesLeft": null,
    "description": "Permanent 10% discount for VIP members"
}
```

**Limited Usage**:
```json
{
    "usesLeft": 5,
    "description": "One-time use coupon"
}
```

---

## Examples

### Create Fixed Discount

```bash
curl -X POST http://localhost:3000/discounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "value": 15.00,
    "type": "fixed",
    "description": "Loyalty Reward",
    "usesLeft": null
  }'
```

### Create Limited Percentage Discount

```bash
curl -X POST http://localhost:3000/discounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-456",
    "value": 20,
    "type": "percent",
    "description": "Black Friday Sale - 20% off",
    "usesLeft": 1
  }'
```

### Update Usage Limit

```bash
curl -X PUT http://localhost:3000/discounts/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "usesLeft": 10
  }'
```

---

## Price Calculation Examples

### Fixed Discount
```
Original Price: $100.00
Discount: $10.00 (fixed)
Final Price: $100.00 - $10.00 = $90.00
```

### Percentage Discount
```
Original Price: $100.00
Discount: 20% (percent)
Final Price: $100.00 * (1 - 20/100) = $80.00
```

### Best Discount Selection
```
Original Price: $100.00
Discount 1: $15.00 fixed → $85.00
Discount 2: 10% percent → $90.00
Discount 3: $20.00 fixed → $80.00 ← BEST

Final Price: $80.00
```

---

## Integration Points

- **User Module**: Discounts belong to users
- **Order Module**: Discounts applied to order items
- **Product Module**: Discounts applied to product prices
- **Auth Middleware**: Admin-only operations

---

## Limitations & Future Enhancements

### Current Limitations
- One discount per product per transaction
- No expiration date support
- No category-based discounts
- No automatic application rules

### Potential Enhancements
- [ ] Discount expiration dates
- [ ] Category-based discounts
- [ ] Bulk discounts (e.g., buy 3 get 1 free)
- [ ] Stacking multiple discounts
- [ ] Usage tracking and analytics
- [ ] Discount codes/coupon codes
- [ ] Automated promotions

---

Related Documentation:
- [API Endpoints](./API.md#discount-endpoints)
- [Database Schema](./DATABASE.md#5-discount)
- [Order Module](./ORDER.md)
- [Product Module](./PRODUCT.md)
