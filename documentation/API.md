# API reference

Development base URL: `http://localhost:3000`. Auth routes use `/auth`; all other routes use `/api`. Protected routes require `Authorization: Bearer <token>` unless noted.

Most JSON responses use `{ success, message?, data?, ... }`, but response shapes vary. Validation errors may return `{ success: false, errors }`; auth middleware may return plain text with status `403`. OAuth callback returns HTML that posts `{ user, token }` to the opener.

## Authentication

| Method and path | Access | Purpose and result |
|---|---|---|
| `GET /auth/google` | Public | Redirects to Google OAuth. |
| `GET /auth/google/callback` | OAuth callback | Posts `{ user, token }` to the opener, then closes the window. JWT expires after one hour. |
| `GET /auth/me` | Bearer token | Returns `{ user }`. The first registered user becomes admin. |

## Products — `/api/products`

| Method and path | Access | Purpose / output |
|---|---|---|
| `GET /query` | Public | Query filters; returns `data` and `meta`. |
| `POST /filter` | Public | Body filters; returns `data` and `meta`. |
| `GET /categories` | Public | Category list in `data`. |
| `GET /` | Admin | All products in `data`. |
| `GET /deleted` | Admin | Deleted products in `data`. |
| `POST /` | Admin | Create product; returns it in `data`. Requires `name`, `price`, `stock`, `category`; optional `description`, `code`, `image`. |
| `PUT /:id` | Admin | Partial update; returns product in `data`. |
| `DELETE /:id` | Admin | Soft-delete product. |
| `DELETE /:id/permanent` | Admin | Permanently delete product. |
| `POST /:id/restore` | Admin | Restore deleted product. |

Filter fields: `id`, `name`, `description`, `code`, `price`, `minPrice`, `maxPrice`, `stock`, `minStock`, `maxStock`, `category`, `sortBy`, `sortOrder`, `limit`, `offset`, `includeDeleted`. Sort order is `ASC` or `DESC`. There is no `GET /:id` route.

## Orders — `/api/orders`

| Method and path | Access | Purpose / output |
|---|---|---|
| `GET /checkout` | Public | Serves a simple HTML page. |
| `GET /recommendations?limit=` | Public | Product list; default limit 4, maximum 12. |
| `GET /current` | Bearer token | User's cart; creates one if absent. |
| `DELETE /current/items` | Bearer token | Clears the user's current cart. |
| `GET /` | Bearer token | User's non-cart orders; returns `404` when none exist. |
| `GET /admin` | Admin | All orders, newest first. |
| `GET /admin/dashboard-summary` | Admin | Cart, placed, and recently completed counts. |
| `POST /coupons/validate` | Bearer token | Body `{ code }`; accepts `SAVE` followed by 1–2 digits. |
| `POST /:id/validate` | Order owner | Checks stock and price; returns `valid` and `rejectedItems`. |
| `POST /:id/items` | Order owner | Body `{ productId, quantity }`; adds/merges a cart item. |
| `POST /:id/checkout` | Order owner | Body `{ billingInformationId, paymentMethod }`; accepts `bank_transfer` or `cash`. Places order; does not process payment. |
| `PATCH /:id/fulfillment` | Admin | Partially updates payment, invoice, and delivery state; returns order. |
| `POST /:id/complete` | Admin | Completes order and sends confirmation email; `409` unless paid, invoiced, and delivered. |
| `PUT /items/:itemId` | Bearer token* | Body `{ quantity }`; updates quantity; `0` removes item. |
| `DELETE /items/:itemId` | Bearer token* | Decreases quantity by one; removes item at zero. |

Order responses include totals, items, billing data, and payment/invoice/delivery fields. Fulfillment accepts one or more of `paymentStatus` (`unpaid`/`paid`), `paymentReference`, `invoiceIssued`, `invoiceIdentifier`, `isDelivered`, and `deliveryDocumentIdentifier`. Omitted fields stay unchanged; nullable identifiers can be cleared with `null`. Timestamps are server-generated. Completion is synchronized only when payment, invoice issuance, and delivery are all recorded. No payment credentials are accepted.

**Access caveat:** the two `items/:itemId` routes currently authenticate but do not verify item ownership. Add owner checks before relying on them for user isolation.

## Billing information — `/api/billing-information`

All routes require a bearer token and scope records to the current user.

| Method and path | Purpose / output |
|---|---|
| `GET /` | List saved addresses in `data`. |
| `GET /:id` | Get one address; another user's record returns `404`. |
| `POST /` | Create address; returns `201` and the address. |
| `PUT /:id` | Update address; returns updated address. |
| `DELETE /:id` | Delete address; `409` if an order uses it. |

Required body fields: `fullName`, `addressLine1`, `city`, `postalCode`, `country`. Optional: `company`, `addressLine2`, `state`, `phone`. Update also requires all required fields.

## Business settings — `/api/settings`

| Method and path | Access | Purpose / input |
|---|---|---|
| `GET /shipping-cost` | Bearer token | Returns `{ key, value }`. |
| `PUT /shipping-cost` | Admin | Body `{ shippingCost }` or `{ value }`. |
| `GET /free-shipping-threshold` | Bearer token | Returns `{ key, value }`; zero disables threshold. |
| `PUT /free-shipping-threshold` | Admin | Body `{ freeShippingThreshold }` or `{ value }`. |

## Discounts — `/api/discounts`

| Method and path | Access | Purpose / output |
|---|---|---|
| `GET /` | Admin | List discounts in `data`. |
| `GET /deleted` | Admin | List deleted discounts in `data`. |
| `POST /` | Admin | Create discount; fields: `user`, `value`, `type`, `description`, `usesLeft`. |
| `PUT /:id` | Admin | Update supplied fields. |
| `DELETE /:id` | Admin | Delete discount; current service performs a hard delete. |

Discount `type` is `fixed` or `percent`; `usesLeft: null` means unlimited. Create validation is currently minimal.
