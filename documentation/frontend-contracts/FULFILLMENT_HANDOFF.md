# Frontend Handoff: Order Fulfillment

- Checkout: `POST /orders/:id/checkout`; `paymentMethod` must be `bank_transfer` or `cash`. Checkout records the choice but does not process payment.
- Admin updates: `PATCH /orders/:id/fulfillment` with an admin JWT. Send any non-empty subset of `paymentStatus` (`unpaid`/`paid`), `paymentReference` (string/null), `invoiceIssued` (boolean), `invoiceIdentifier` (string/null), `isDelivered` (boolean), and `deliveryDocumentIdentifier` (string/null). Omitted fields stay unchanged; null clears optional references.
- Timestamps (`paidAt`, `invoiceIssuedAt`, `deliveredAt`, `completedAt`) are server-generated. An invoice identifier implies issuance; a delivery-document identifier does not imply delivery. Delivery can be marked without a document identifier.
- All order responses now include `paymentStatus`, `paymentReference`, `paidAt`, `invoiceIdentifier`, `invoiceIssuedAt`, `isDelivered`, `deliveredAt`, `deliveryDocumentIdentifier`, and `completedAt` (`null` for unset dates/references; `isDelivered` is boolean).
- Status becomes `completed` only when paid + invoiced + delivered; otherwise preserve workflow state. Do not rely on calling the legacy completion action to force completion (it returns `409` if requirements are missing).
- Shared types: `CheckoutOrderDto`, `OrderFulfillmentUpdateDto`, `OrderPaymentMethod`, and `OrderPaymentStatus`. Endpoint builder: `ApiRoutes.orders.updateFulfillment(orderId)`.
