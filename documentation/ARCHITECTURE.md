# Architecture & Design Patterns

## Overall Architecture

This project uses a **Horizontal Architecture by Feature**, where each module is self-contained with its own controller, service, entity, validators, and routes.

## Architectural Pattern

### Layer Structure

Each feature module contains the following layers:

```
Feature Module (e.g., Product)
├── product.controller.ts    (HTTP Request/Response Handling)
├── product.service.ts       (Business Logic)
├── product.entity.ts        (Database Schema)
├── product.validators.ts    (Input Validation)
├── product.routes.ts        (Route Definition)
└── [subdirectories]         (Additional types/entities)
```

### Request Flow

```
HTTP Request
    ↓
Express Middleware (CORS, Auth, Body Parser)
    ↓
Route Handler (product.routes)
    ↓
Middleware Chain (Auth, Admin checks, etc.)
    ↓
Controller Method (product.controller)
    ↓
Service Method (product.service)
    ↓
TypeORM Repository (Database Operations)
    ↓
Database
    ↓
Response Back Through Layers
    ↓
HTTP Response
```

## Core Components

### 1. Controllers
- Handle HTTP requests and responses
- Validate input parameters
- Call service methods
- Format response objects
- Located in `*.controller.ts`

Example:
```typescript
export class ProductController {
    filterProductsQuery = async (req: Request, res: Response): Promise<void> => {
        // Validate filters
        // Call service
        // Return formatted response
    };
}
```

### 2. Services
- Implement business logic
- Handle data transformation
- Manage complex operations
- Interact with repositories
- Located in `*.service.ts`

### 3. Entities
- Define database schema using TypeORM decorators
- Specify relationships (ManyToOne, OneToMany, etc.)
- Include validation metadata
- Located in `*.entity.ts`

### 4. Routes
- Define HTTP endpoints and methods
- Apply middleware to routes
- Connect controllers to routes
- Located in `*.routes.ts`

### 5. Validators
- Define input validation rules
- Ensure data integrity
- Use class-validator for decorators
- Located in `*.validators.ts` or `dtos/`

### 6. DTOs (Data Transfer Objects)
- Located in `dtos/` folder
- Define request/response shapes
- Separate from entity definitions
- Used for type safety

## Authentication & Authorization

### Flow
1. **Google OAuth** → Token received
2. **Auth Service** → Process OAuth user, generate JWT
3. **JWT Middleware** → Validate token on subsequent requests
4. **Auth Middleware** → Verify authentication
5. **Admin Middleware** → Check admin role for protected routes

### Key Files
- `auth/auth.controller.ts` - OAuth callbacks
- `auth/auth.service.ts` - OAuth processing
- `middlewares/auth.middleware.ts` - JWT validation
- `middlewares/check-admin.middleware.ts` - Admin role check

## Database Design

### ORM: TypeORM
- Decorators for entity mapping
- Active Record pattern
- Migrations for schema versioning
- Repository pattern for data access

### Key Entities
- **User** - Authenticated users
- **Product** - Catalog items
- **Order** - Customer orders (Cart/Checkout status)
- **OrderItem** - Line items in orders
- **Discount** - User-specific discount codes

## Error Handling

### Response Format
```typescript
{
    success: boolean,
    message: string,
    data?: T,
    error?: string
}
```

### Status Codes
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden (admin-only)
- `500` - Server Error

## Middleware Stack

1. **CORS Middleware** - Cross-Origin Resource Sharing
2. **Body Parser** - JSON request body parsing
3. **Passport** - OAuth initialization
4. **Auth Middleware** - JWT verification
5. **Admin Middleware** - Role-based access
6. **Custom Validation** - Route-specific validators

## Dependency Injection

TypeORM repositories are passed to services and controllers:
```typescript
constructor(
    orderRepo: Repository<Order>,
    itemRepo: Repository<OrderItem>,
    productRepo: Repository<Product>,
    userRepo: Repository<User>,
    private discountService: DiscountService
)
```

## CORS Policy

- **Origin**: * (all origins, configurable)
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Origin, X-Requested-With, Content-Type, Accept, Authorization

## Configuration

- Centralized in `data-source.ts` for TypeORM
- Environment variables via `.env` file
- Logging enabled in development

## Performance Considerations

1. **Eager vs Lazy Loading** - Configured in entity relationships
2. **Query Filtering** - Advanced product filtering with multiple criteria
3. **Pagination** - Limit/offset support in filters
4. **Soft Deletes** - Using `@DeleteDateColumn()` for data retention

## Testing Architecture

- Unit tests for services
- Integration tests for API endpoints
- Mock repositories for testing

---

This architecture promotes:
- **Modularity** - Each feature is independent
- **Scalability** - Easy to add new features
- **Maintainability** - Clear separation of concerns
- **Testability** - Services can be tested independently
