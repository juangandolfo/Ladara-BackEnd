# Ladara Shared Contracts

Shared TypeScript types, API endpoints, and error handling for Ladara backend and frontend.

## Installation

### From GitHub (Recommended)

```bash
npm install github:juangandolfo/Ladara-BackEnd#main:documentation/frontend-contracts
```

### From Local Path

For development in a monorepo:

```bash
npm install file:../documentation/frontend-contracts
```

### As Workspace

In a monorepo with workspaces:

```json
{
  "workspaces": [
    "packages/frontend",
    "packages/backend/documentation/frontend-contracts"
  ]
}
```

## Usage

### Import Types

```typescript
import {
  OrderDto,
  ProductFilterDto,
  OrderStatus,
  User,
  ApiResponse,
  AddItemToOrderDto
} from '@ladara/shared-contracts';

// Use in your code
const order: OrderDto = {
  id: 1,
  userId: 'user-123',
  status: OrderStatus.CART,
  total: 99.99,
  createdAt: new Date().toISOString(),
  items: []
};
```

### Use API Endpoints

```typescript
import { ApiRoutes, createAuthHeader } from '@ladara/shared-contracts';

// Get type-safe API URLs
const url = ApiRoutes.products.query({ category: 'Electronics' });

// Create auth headers
const headers = createAuthHeader(token);

// Make requests
const response = await fetch(url, {
  method: 'GET',
  headers
});
```

### Error Handling

```typescript
import {
  ApiError,
  parseApiError,
  shouldLogoutOnError,
  ApiErrorCode
} from '@ladara/shared-contracts';

try {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new ApiError(
      ApiErrorCode.NETWORK_ERROR,
      `HTTP ${response.status}`
    );
  }
} catch (error) {
  const apiError = parseApiError(error);
  
  if (shouldLogoutOnError(apiError)) {
    // Logout user
  }
  
  if (apiError.isRetriable()) {
    // Retry logic
  }
  
  console.error(apiError.getDisplayMessage());
}
```

## Structure

### Types (`types.ts`)

- **Enums**: `OrderStatus`, `DiscountType`
- **DTOs**: `ProductFilterDto`, `CreateProductDto`, `OrderDto`, etc.
- **Interfaces**: `User`, `Order`, `Product`, `Discount`, etc.
- **Responses**: `ApiResponse<T>`, `ErrorResponse`, etc.

### API Endpoints (`api-endpoints.ts`)

- `AUTH_ENDPOINTS` - Authentication routes
- `PRODUCT_ENDPOINTS` - Product management routes
- `ORDER_ENDPOINTS` - Order/cart routes
- `DISCOUNT_ENDPOINTS` - Discount routes
- `ApiRoutes` - Type-safe URL builders

### Error Handling (`errors.ts`)

- `ApiErrorCode` - Enumeration of error codes
- `ApiError` - Main error class
- `ValidationError`, `UnauthorizedError`, `NotFoundError`, etc. - Specific error types
- `parseApiError()` - Parse axios/fetch errors
- `shouldRetry()` - Determine if request should be retried

## Examples

### Fetching Products

```typescript
import { ApiRoutes, ProductFilterDto } from '@ladara/shared-contracts';

const filters: ProductFilterDto = {
  category: 'Electronics',
  minPrice: 50,
  maxPrice: 500,
  limit: 20
};

const url = ApiRoutes.products.query(filters);
const response = await fetch(url);
const data = await response.json();
```

### Creating an Order Item

```typescript
import { ApiRoutes, AddItemToOrderDto, createAuthHeader } from '@ladara/shared-contracts';

const item: AddItemToOrderDto = {
  productId: 1,
  quantity: 2
};

const url = ApiRoutes.orders.addItem(orderId);
const response = await fetch(url, {
  method: 'POST',
  headers: createAuthHeader(token),
  body: JSON.stringify(item)
});
```

### Handling Errors

```typescript
import { parseApiError, ApiError } from '@ladara/shared-contracts';

try {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(ApiErrorCode.VALIDATION_ERROR, error.message);
  }
} catch (error) {
  const apiError = parseApiError(error);
  if (apiError.isValidationError()) {
    // Show validation errors
  }
}
```

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

### Clean

```bash
npm run clean
```

## Publishing

To publish to npm:

```bash
npm publish
```

## Documentation

For complete documentation, see:
- [API Endpoints](../../API.md)
- [Architecture](../../ARCHITECTURE.md)
- [DTOs](../../DTOS.md)
- [Types](../../TYPES.md)

## Version

Current version: 1.0.0
Last updated: 2026-08-18

## License

ISC
