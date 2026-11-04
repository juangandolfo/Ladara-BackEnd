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

## Frontend Contract Compatibility

The backend now includes the contract expected by the frontend for coupon validation and checkout validation.

### Coupon validation

```http
POST http://localhost:3000/api/orders/coupons/validate
Authorization: Bearer <jwt>
Content-Type: application/json

{ "code": "SAVE5" }
```

Success:

```json
{
  "success": true,
  "data": {
    "valid": true,
    "code": "SAVE5",
    "discountAmount": 5
  }
}
```

Failure:

```json
{
  "success": false,
  "message": "El cupón no es válido o ha expirado"
}
```

### Checkout validation

```http
POST http://localhost:3000/api/orders/12/validate
Authorization: Bearer <jwt>
Content-Type: application/json

{}
```

Success:

```json
{
  "success": true,
  "data": {
    "valid": true,
    "rejectedItems": []
  }
}
```

### Submit checkout details

First load the user's saved addresses from `GET /api/billing-information` and let them select one. If the user has no saved address, create one before checkout. Full CRUD details and response examples are in [BILLING_INFORMATION_HANDOFF.md](BILLING_INFORMATION_HANDOFF.md).

```http
POST http://localhost:3000/api/orders/12/checkout
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "billingInformationId": 45,
  "paymentMethod": "bank_transfer"
}
```

The authenticated user must own both the order and selected billing record, and the order must be a non-empty cart. `paymentMethod` accepts only `bank_transfer` or `cash`. The response includes `billingInformationId` and the selected address as `billingAddress`, along with the independent payment, invoice, and delivery fields. Checkout records the selected method and address but does not process payment. Never send payment credentials.

## Admin fulfillment update

Admins can update any subset of fulfillment facts; fields omitted from the request remain unchanged. The shared `OrderFulfillmentUpdateDto` type describes the request:

```http
PATCH http://localhost:3000/api/orders/12/fulfillment
Authorization: Bearer <admin-jwt>
Content-Type: application/json
```

```json
{
  "paymentStatus": "paid",
  "paymentReference": "TRANSFER-9382",
  "invoiceIdentifier": "INV-2026-0042",
  "isDelivered": true
}
```

`paidAt`, `invoiceIssuedAt`, and `deliveredAt` are server-generated. An invoice identifier implies issuance; a delivery-document identifier alone does not imply delivery. Optional reference/identifier fields can be cleared with `null`. Order responses include these fields and `completedAt`; status becomes `completed` once payment, invoice issuance, and delivery are all recorded.

Failure:

```json
{
  "success": false,
  "data": {
    "valid": false,
    "rejectedItems": [
      {
        "itemId": 12,
        "reason": "OUT_OF_STOCK",
        "message": "Producto sin stock disponible"
      }
    ]
  }
}
```

### Empty-cart recommendations

The backend exposes a dedicated recommendation endpoint:

```http
GET http://localhost:3000/api/orders/recommendations?limit=4
```

Response shape:

```json
{
  "success": true,
  "message": "Recommended products retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Product name",
      "price": 19.99,
      "stock": 15,
      "image": "https://example.com/image.jpg",
      "category": "drinks",
      "description": "Optional description"
    }
  ]
}
```

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
