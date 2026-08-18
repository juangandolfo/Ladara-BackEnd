# Custom Types

## Overview

Custom TypeScript types extend and define domain-specific data structures. They provide type safety and semantic meaning to the codebase.

## File Locations

- `src/types/express.d.ts` - Express type extensions
- `src/order/types/order-status.type.ts` - Order status enum

---

## Express Type Extensions

**File**: `src/types/express.d.ts`

**Purpose**: Extend Express Request interface to support custom properties

### Implementation

```typescript
declare global {
    namespace Express {
        interface Request {
            entity?: User;
        }
    }
}
```

### Purpose of `req.entity`

After JWT authentication, the User object is attached to the request:

```typescript
// In auth middleware
const user = await userService.getEntityById(userId);
req.entity = user;  // TypeScript recognizes this due to extension
```

### Usage in Controllers

```typescript
// Controllers can safely access req.entity
async function getCurrentOrder(req: Request, res: Response) {
    const user = req.entity as User;  // Type-safe access
    const orders = await orderService.getCurrentOrder(user.id);
    res.json(orders);
}

// Or destructuring
async function getCurrentOrder(req: Request, res: Response) {
    const { entity: user } = req;
    if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
    }
    // user is now guaranteed to be User type
}
```

### Benefits

1. **Type Safety**: TypeScript knows `req.entity` exists
2. **IntelliSense**: IDE autocomplete for `req.entity` properties
3. **Compile-time Checking**: Errors caught before runtime
4. **Documentation**: Code is self-documenting

### Without Extension

Without this declaration, TypeScript would error:

```typescript
// ❌ Error: Property 'entity' does not exist on type 'Request'
const user = req.entity;
```

---

## Order Status Type

**File**: `src/order/types/order-status.type.ts`

**Purpose**: Define valid order statuses using TypeScript enum

### Implementation

```typescript
export enum OrderStatus {
    CART = 'cart',           // Active shopping cart
    PREPARING = 'preparing', // Order being prepared
    COMPLETED = 'completed'  // Order completed
}
```

### Usage

#### Type Definition

```typescript
// In Order entity
@Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.CART
})
status: OrderStatus;
```

#### Comparison

```typescript
// Type-safe status checks
if (order.status === OrderStatus.CART) {
    // Order is active shopping cart
}

if (order.status === OrderStatus.COMPLETED) {
    // Order is finished
}

// ❌ Would error - invalid status
if (order.status === 'completed') {  // TypeScript error if strict mode
    // ...
}
```

#### Filtering

```typescript
// Get all carts
const carts = await orderRepository.find({
    where: { status: OrderStatus.CART }
});

// Get completed orders
const completed = await orderRepository.find({
    where: { status: OrderStatus.COMPLETED }
});
```

#### Iteration

```typescript
// Iterate all statuses
Object.values(OrderStatus).forEach(status => {
    console.log(status);  // 'cart', 'preparing', 'completed'
});
```

---

### Enum Values

| Enum Member | String Value | Purpose |
|------------|--------------|---------|
| `CART` | `'cart'` | Active shopping cart |
| `PREPARING` | `'preparing'` | Order being prepared |
| `COMPLETED` | `'completed'` | Order finished |

---

### String vs Enum

**Using Enum** (Recommended):
```typescript
// Type-safe, autocomplete, compile-time checking
order.status = OrderStatus.CART;
```

**Using String** (Avoid):
```typescript
// Not type-safe, no autocomplete, typos caught at runtime
order.status = 'cart';
```

---

## Why Custom Types Matter

### Without Proper Types

```typescript
// What is user?
async function getOrder(user: any) {
    // Could have any properties
    // No autocomplete
    // Errors at runtime
    const orders = user.orders;  // Might not exist
}
```

### With Proper Types

```typescript
// Clear what user is
async function getOrder(user: User) {
    // User is known to have id, name, isAdmin
    // Full autocomplete
    // Errors at compile time
    const orders = await orderService.getOrdersByUser(user.id);
}
```

---

## Type Safety Benefits

### 1. Prevention of Errors

```typescript
// Without type: Compiles but crashes at runtime
const user = req.entity;
const id = user.userId;  // Wrong property name!

// With type: Error at compile time
const user = req.entity as User;  // TypeScript knows User has 'id', not 'userId'
const id = user.id;  // Correct
```

### 2. Autocomplete/IntelliSense

```typescript
// With proper types, IDE suggests:
req.entity.    // ← autocomplete shows: id, name, isAdmin

// Without types:
req.entity.    // ← no suggestions
```

### 3. Refactoring Safety

If User interface changes:
```typescript
// Before: User had 'firstName' and 'lastName'
// After: User has 'name'

// All references to user.firstName are flagged as errors
// Must be updated to user.name
// No broken code in production
```

---

## Extending Types for Modules

When creating new modules, define custom types:

```typescript
// src/custom-module/types/custom-status.type.ts
export enum CustomStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    ARCHIVED = 'archived'
}

// src/custom-module/custom.entity.ts
@Column({ type: 'enum', enum: CustomStatus })
status: CustomStatus;
```

---

## Related TypeScript Concepts

### Enum vs Object

```typescript
// Enum: More type-safe, smaller compiled size
export enum Status {
    ACTIVE = 'active',
    INACTIVE = 'inactive'
}

// Object: Allows computed properties
export const Status = {
    ACTIVE: 'active',
    INACTIVE: 'inactive'
} as const;
```

### Type vs Interface

```typescript
// Type: Can represent unions, primitives
type Status = 'active' | 'inactive' | 'archived';

// Interface: For objects, can extend
interface OrderBase {
    id: number;
}

interface Order extends OrderBase {
    status: Status;
}
```

### Generics

```typescript
// Generic type for flexible response
interface ApiResponse<T> {
    success: boolean;
    data: T;
}

// Usage: Type is inferred
const response: ApiResponse<User> = {
    success: true,
    data: user
};
```

---

## Declaration Files

**Why Needed**: Libraries without built-in TypeScript support need `.d.ts` files

**Express Extension Example**:
```typescript
// express.d.ts is a declaration file (.d.ts)
// It doesn't contain runtime code, only type definitions
// TypeScript uses it to understand Express Request interface

declare global {
    namespace Express {
        interface Request {
            entity?: User;
        }
    }
}
```

---

## Best Practices

1. **Use Enums for Fixed Sets**:
   ```typescript
   // Good: OrderStatus has fixed values
   export enum OrderStatus { ... }
   
   // Bad: User roles could grow
   export enum UserRole { ADMIN, USER }
   ```

2. **Document Type Purpose**:
   ```typescript
   /** Represents possible states for an Order */
   export enum OrderStatus { ... }
   ```

3. **Export for External Use**:
   ```typescript
   // Good: Can be imported by other modules
   export enum OrderStatus { ... }
   
   // Bad: Only internal to file
   enum OrderStatus { ... }
   ```

4. **Use String Enums for Databases**:
   ```typescript
   // Databases store strings, not numeric values
   export enum OrderStatus {
       CART = 'cart',        // Stored as 'cart'
       COMPLETED = 'completed'  // Stored as 'completed'
   }
   ```

---

## Future Type Additions

- [ ] Custom error types
- [ ] Validation decorators
- [ ] Request/response schema types
- [ ] Pagination types
- [ ] Filter criteria types
- [ ] Sort direction types

---

Related Documentation:
- [Express TypeScript Setup](./SETUP.md)
- [Order Module](./ORDER.md)
- [Database Schema](./DATABASE.md)
