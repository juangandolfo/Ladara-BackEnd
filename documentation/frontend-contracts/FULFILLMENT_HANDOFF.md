# Frontend Handoff: Order Fulfillment

- Checkout: `POST /orders/:id/checkout`; `paymentMethod` must be `bank_transfer` or `cash`. Checkout records the choice but does not process payment.
- Workflow status is now only `cart`, `order_placed`, or `completed`. Checkout changes `cart` to `order_placed`; payment, invoice, and delivery flags show pending actions. If a completion prerequisite is removed, status returns to `order_placed`.
- Admin updates: `PATCH /orders/:id/fulfillment` with an admin JWT. Send any non-empty subset of `paymentStatus` (`unpaid`/`paid`), `paymentReference` (string/null), `invoiceIssued` (boolean), `invoiceIdentifier` (string/null), `isDelivered` (boolean), and `deliveryDocumentIdentifier` (string/null). Omitted fields stay unchanged; null clears optional references.
- Timestamps (`paidAt`, `invoiceIssuedAt`, `deliveredAt`, `completedAt`) are server-generated. An invoice identifier implies issuance; a delivery-document identifier does not imply delivery. Delivery can be marked without a document identifier.
- All order responses now include `paymentStatus`, `paymentReference`, `paidAt`, `invoiceIdentifier`, `invoiceIssuedAt`, `isDelivered`, `deliveredAt`, `deliveryDocumentIdentifier`, and `completedAt` (`null` for unset dates/references; `isDelivered` is boolean).
- Status becomes `completed` only when paid + invoiced + delivered. Do not rely on calling the legacy completion action to force completion (it returns `409` if requirements are missing).
- Admin dashboard summary fields are now `cartCount`, `orderPlacedCount`, and `completedLast30DaysCount` (replacing the old pending-payment/preparing counts).
- Shared types: `CheckoutOrderDto`, `OrderFulfillmentUpdateDto`, `OrderPaymentMethod`, and `OrderPaymentStatus`. Endpoint builder: `ApiRoutes.orders.updateFulfillment(orderId)`.
