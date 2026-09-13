# Cart Frontend Handoff

## Important Route Prefix

The backend mounts these resources under `/api`:

- Products: `/api/products`
- Orders/cart: `/api/orders`
- Settings: `/api/settings`

The current `api-endpoints.ts` file omits `/api` from product and order URLs. Update the frontend base URL or endpoint builders before testing cart behavior. Authentication routes remain under `/auth`.

## Required Cart Flow

1. Authenticate and keep the JWT access token.
2. Request the current cart:

```http
GET http://localhost:3000/api/orders/current
Authorization: Bearer <jwt>
```

The response is an array in `data`. The backend creates an empty cart automatically when the authenticated user has no active cart.

```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "userId": "user-uuid",
      "status": "cart",
      "total": 0,
      "shippingCost": 8,
      "items": []
    }
  ]
}
```

3. Use `data[0].id` as the cart/order ID. Add a product with:

```http
POST http://localhost:3000/api/orders/12/items
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "productId": 3,
  "quantity": 1
}
```

The request returns the added or updated line item in `data`, not the complete cart. Refetch `GET /api/orders/current` after adding, updating, or deleting an item to refresh totals.

## Item Operations

```http
PUT /api/orders/items/:itemId
Authorization: Bearer <jwt>
Content-Type: application/json

{ "quantity": 2 }
```

```http
DELETE /api/orders/items/:itemId
Authorization: Bearer <jwt>
```

A quantity of `0` on the PUT removes the item. The DELETE endpoint decreases quantity by one; repeat it or use PUT with `0` to remove the line completely.

## Validation and Errors

- `productId` must be a positive integer.
- Add quantity must be a positive integer.
- Update quantity must be a non-negative integer.
- Missing/invalid JWT returns an authentication error.
- A valid request with a nonexistent product or order returns `404`.
- Validation failures return `400` with an `errors` array.

## Frontend Contract Fix

The endpoint builders should produce paths like:

```typescript
const API_BASE_URL = 'http://localhost:3000/api';
const ORDER_ENDPOINTS = {
  current: '/orders/current',
  addItem: (orderId: number) => `/orders/${orderId}/items`,
};
```

Do not call `POST /orders` to create a cart; that route does not exist. Fetching `/api/orders/current` is the cart initialization step.

## Local Backend

The backend must be running with `npm run start` on port `3000`. The database trigger repair migration has already been applied locally. If using another environment, run:

```bash
npm run migration:run
```
