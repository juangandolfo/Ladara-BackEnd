# Billing Information Frontend Handoff

## Summary

Billing addresses are now reusable, authenticated user records. The frontend should let the signed-in user manage multiple addresses, select one during checkout, and send its ID to the order checkout endpoint. Checkout no longer accepts a new inline `billingAddress` object.

## Backend endpoints

The backend mounts billing information at `/api/billing-information`. Send the JWT as `Authorization: Bearer <token>` on every request.

| Action | Request | Notes |
| --- | --- | --- |
| List addresses | `GET /api/billing-information` | Returns the signed-in user's addresses in `data` (an empty array if none). |
| Get one | `GET /api/billing-information/:id` | Other users' addresses are not visible; returns `404`. |
| Create | `POST /api/billing-information` | Creates an address for the signed-in user. |
| Replace/update | `PUT /api/billing-information/:id` | Send a complete address object; only the owner can update it. |
| Delete | `DELETE /api/billing-information/:id` | Returns `409` if an order already references the address. |

Create/update body:

```json
{
  "fullName": "Jane Doe",
  "company": "Example, Inc.",
  "addressLine1": "123 Main Street",
  "addressLine2": "Apartment 4",
  "city": "Springfield",
  "state": "IL",
  "postalCode": "62701",
  "country": "US",
  "phone": "+15551234567"
}
```

Required: `fullName`, `addressLine1`, `city`, `postalCode`, and `country`. The remaining fields are optional. Responses contain those address fields plus `id`, `userId`, and `createdAt`.

## Checkout flow

1. Load addresses with `GET /api/billing-information`.
2. Let the user select an address. If there are no addresses, guide them to create one before checkout.
3. Submit the selected `id` and payment method:

```http
POST /api/orders/12/checkout
Authorization: Bearer <jwt>
Content-Type: application/json
```

```json
{
  "billingInformationId": 45,
  "paymentMethod": "bank_transfer"
}
```

`billingInformationId` must belong to the authenticated user. `paymentMethod` accepts only `bank_transfer` or `cash`. Checkout still requires the user to own the order and the order to be a non-empty cart. This records the choice; it does not process a payment.

The order response includes `billingInformationId` and a `billingAddress` object resolved from the selected record, alongside the normal order and fulfillment fields. Use the ID for checkout requests; the returned address is for display.

## Address changes and order history

Orders reference the saved billing record rather than a checkout-time snapshot. Editing an address therefore changes the address returned for orders linked to it. The API prevents deletion while any order references the record. Explain this behavior in the UI if users can edit or remove saved addresses.

Admins can see the selected address on each order returned by `GET /api/orders/admin`; there is no separate endpoint for browsing all users' addresses.

## Shared contracts

The contract sources are in this folder:

- `BillingInformation` / `BillingInformationInput` and `CheckoutOrderDto` in `types.ts`
- `ApiRoutes.billingInformation.list/create/getById/update/delete()` and `ApiRoutes.orders.checkout(orderId)` in `api-endpoints.ts`

The existing endpoint builders use `http://localhost:3000` as their base and omit `/api` from product/order/resource paths. Configure the frontend API base/path so these requests reach `/api/...`; authentication remains under `/auth`.

## Related backend docs

- [REST API details](../API.md#billing-information-endpoints)
- [Order and checkout behavior](../ORDER.md)
- [DTO contracts](../DTOS.md)
- [Shared contract package guide](README.md)
