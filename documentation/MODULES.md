# Module Structure & Organization

## Project Module Organization

This project uses a **Horizontal Architecture by Feature**, where each module is independent and self-contained.

## Module Directory Structure

```
src/
├── auth/              # Authentication & OAuth
├── customer/          # Customer management (empty)
├── discount/          # Discount management
├── dtos/              # Data Transfer Objects
├── middlewares/       # Express middlewares
├── order/             # Order/Cart management
│   ├── entities/      # Order entity definitions
│   └── types/         # Order type definitions
├── product/           # Product management
├── purchase/          # Purchase handling (empty)
├── seeds/             # Database seeding
├── types/             # Global type definitions
├── user/              # User management
├── data-source.ts     # TypeORM configuration
└── server.ts          # Express app initialization
```

## Standard Module Structure

Each feature module (auth, product, order, discount, user) follows this pattern:

```
module-name/
├── module-name.controller.ts    # HTTP handlers
├── module-name.service.ts       # Business logic
├── module-name.entity.ts        # Database schema
├── module-name.validators.ts    # Input validation
├── module-name.routes.ts        # Route definitions
└── [subdirectories]/            # Module-specific types/entities
    ├── entities/
    └── types/
```

## Module Breakdown

### 1. Authentication Module (`auth/`)

**Files**:
- `auth.controller.ts` - Handles OAuth callbacks
- `auth.service.ts` - OAuth processing logic
- `auth.routes.ts` - Auth endpoints

**Responsibilities**:
- Google OAuth 2.0 integration
- JWT token generation
- User creation on first login
- User authentication endpoints

**Key Methods**:
- `googleCallback()` - Process OAuth callback
- `handleGoogleUser()` - Create/retrieve user from OAuth profile

**Routes**:
- `GET /auth/google` - Initiate OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/me` - Get current user

---

### 2. Product Module (`product/`)

**Files**:
- `product.controller.ts` - Request handlers
- `product.service.ts` - Business logic
- `product.entity.ts` - Database schema
- `product.validators.ts` - Input validation
- `product.routes.ts` - Route definitions

**Responsibilities**:
- Product CRUD operations
- Advanced filtering
- Discount application
- Stock management
- Soft deletion

**Key Methods**:
- `filterProducts()` - Filter with multiple criteria
- `createProduct()` - Create new product
- `updateProduct()` - Update product details
- `deleteProduct()` - Soft delete
- `permanentlyDeleteProduct()` - Hard delete
- `restoreProduct()` - Restore deleted product

**Routes**:
- `GET /products/query` - Filter by query params
- `POST /products/filter` - Filter by body
- `GET /products/categories` - Get all categories
- `POST /products` - Create (admin)
- `PUT /products/:id` - Update (admin)
- `DELETE /products/:id` - Delete (admin)

**Filters Supported**:
- Price range (minPrice, maxPrice)
- Stock range (minStock, maxStock)
- Category
- Search (name, code, description)
- Sorting (id, name, price, stock)
- Pagination (limit, offset)

---

### 3. Order Module (`order/`)

**Structure**:
```
order/
├── order.controller.ts
├── order.service.ts
├── order.validators.ts
├── order.routes.ts
├── entities/
│   ├── order.entity.ts      # Main order entity
│   └── order-item.entity.ts # Line items
└── types/
    └── order-status.type.ts # Status enum
```

**Entities**:
- `Order` - Shopping cart/order header
- `OrderItem` - Line items in order

**Statuses** (OrderStatus enum):
- `CART` - Active shopping cart
- `PREPARING` - Order being prepared
- `COMPLETED` - Order finished

**Responsibilities**:
- Shopping cart management
- Order creation
- Item management
- Order status tracking
- Discount calculation

**Key Methods**:
- `getCurrentOrder()` - Get active cart
- `createOrder()` - Create new order/cart
- `addItemToOrder()` - Add product to cart
- `updateItemQuantity()` - Change quantity
- `deleteItemFromOrder()` - Remove item
- `markOrderCompleted()` - Complete order

**Routes**:
- `GET /orders/current` - Get current cart
- `GET /orders` - Get all user orders
- `POST /orders/:id/items` - Add to cart
- `PUT /orders/items/:itemId` - Update quantity
- `DELETE /orders/items/:itemId` - Remove item
- `POST /orders/:id/complete` - Complete order

---

### 4. Discount Module (`discount/`)

**Files**:
- `discount.controller.ts` - Request handlers
- `discount.service.ts` - Business logic
- `discount.entity.ts` - Database schema
- `discount.validators.ts` - Input validation
- `discount.routes.ts` - Route definitions

**Responsibilities**:
- Discount creation & management
- Apply discounts to products
- Track usage limits
- Soft deletion

**Discount Types**:
- `fixed` - Fixed amount discount (e.g., $10 off)
- `percent` - Percentage discount (e.g., 20% off)

**Features**:
- Per-user discounts
- Usage limits (null = unlimited)
- Soft deletion
- Admin-only management

**Key Methods**:
- `createDiscount()` - Create discount
- `applyDiscount()` - Apply to price
- `updateDiscount()` - Modify discount
- `deleteDiscount()` - Soft delete

**Routes**:
- `POST /discounts` - Create (admin)
- `GET /discounts` - List active (admin)
- `GET /discounts/deleted` - List deleted (admin)
- `PUT /discounts/:id` - Update (admin)
- `DELETE /discounts/:id` - Delete (admin)

---

### 5. User Module (`user/`)

**Files**:
- `user.entity.ts` - User schema
- `user.service.ts` - User operations

**Responsibilities**:
- User data management
- Role management (admin flag)

**Key Methods**:
- `getEntityById()` - Retrieve user by ID
- `getUserByEmail()` - Find by email
- `setAdmin()` - Grant admin role

---

### 6. Middleware (`middlewares/`)

**Files**:
- `auth.middleware.ts` - JWT validation
- `check-admin.middleware.ts` - Admin role verification
- `is-order-owner.middleware.ts` - Order ownership check

**Middleware Functions**:
- `createAuthorizeMiddleware()` - Verify JWT token
- `checkAdminMiddleware()` - Verify admin role
- `isOrderOwnerMiddleware()` - Verify order ownership

---

### 7. Data Transfer Objects (`dtos/`)

**Files**:
- `product.dto.ts` - Product request/response shapes
- `order.dto.ts` - Order request/response shapes

**Purpose**:
- Type safety for API contracts
- Separate from entity definitions
- Consistent with frontend expectations

---

### 8. Global Types (`types/`)

**Files**:
- `express.d.ts` - Express type extensions

**Purpose**:
- Extend Express Request/Response types
- Add custom properties (e.g., `req.entity`)

---

### 9. Database (`seeds/`)

**Files**:
- `seed.ts` - Database seeding script

**Purpose**:
- Populate database with test data
- Initialize required records

**Command**: `npm run seed`

---

### 10. Configuration

**Files**:
- `data-source.ts` - TypeORM configuration
- `server.ts` - Express app setup

**data-source.ts**:
- Database connection settings
- Entity registration
- Migration configuration
- Logging settings

**server.ts**:
- Express app creation
- Middleware setup
- Route registration
- Server initialization

---

## Dependency Flow

```
Request
  ↓
Routes (routes.ts)
  ↓
Middleware Chain
  ↓
Controller (controller.ts)
  ↓
Service (service.ts)
  ↓
Repository (TypeORM)
  ↓
Database Entity (entity.ts)
  ↓
MySQL Database
```

## Shared Components

### Validators
- Used in routes to validate input
- Middleware-style function composition
- Error handling

### Services
- Contain business logic
- Can be injected into controllers
- May depend on other services
- Example: OrderService depends on DiscountService

### DTOs
- Define request/response contracts
- Support type checking
- Separate from entities
- Enable frontend-backend consistency

---

## Module Dependencies

```
Auth Module
  ├── User Module
  └── No other internal dependencies

Product Module
  ├── Discount Module (for discount calculation)
  └── User Module (for user-specific discounts)

Order Module
  ├── Product Module
  ├── User Module
  ├── Discount Module
  └── OrderItem Entity

Discount Module
  └── User Module

User Module
  └── No other internal dependencies

Middleware
  └── User Module (for auth verification)
```

---

## Adding a New Module

1. Create folder: `src/[module-name]/`
2. Create files:
   - `[module-name].controller.ts`
   - `[module-name].service.ts`
   - `[module-name].entity.ts`
   - `[module-name].validators.ts`
   - `[module-name].routes.ts`
3. Register entity in `data-source.ts`
4. Register routes in `server.ts`
5. Add documentation

---

## Naming Conventions

- Files: `kebab-case` with feature name
- Classes: `PascalCase`
- Functions/methods: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Routes: `/kebab-case`

## Testing Strategy

- Unit tests for services
- Integration tests for controllers
- Mock repositories
- Test validators independently

---

For detailed module documentation:
- [AUTH.md](./AUTH.md)
- [PRODUCT.md](./PRODUCT.md)
- [ORDER.md](./ORDER.md)
- [DISCOUNT.md](./DISCOUNT.md)
- [USER.md](./USER.md)
- [MIDDLEWARE.md](./MIDDLEWARE.md)
