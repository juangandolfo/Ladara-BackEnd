# Next Task: Track Independent Order Fulfillment States

## Goal
Represent payment, invoicing, and delivery independently. An order is `completed` only after it is invoiced, paid, and delivered; delivery does not require a document identifier.

## Requirements
- Checkout accepts only `bank_transfer` or `cash` as the payment method and saves the choice when the order is placed. Do not store payment credentials.
- Track payment separately from the order workflow: unpaid/paid state, optional payment reference, and `paidAt`. Admins can mark an order paid; timestamps are server-generated.
- Track invoicing with an optional invoice identifier and `invoiceIssuedAt`. Saving an invoice identifier records issuance; timestamps are server-generated.
- Track delivery independently with delivered state/`deliveredAt` and an optional delivery-document identifier. Admins can mark an order delivered without an identifier. Saving an identifier alone must not imply delivery.
- Preserve cart/preparation workflow behavior. Derive or synchronize `COMPLETED` only when invoice issuance, payment, and delivery are all recorded. Do not allow the existing admin completion action to bypass these requirements. Set `completedAt` when the order first satisfies all three conditions.
- Expose the admin updates through authenticated admin-only API action(s), with validation and clear partial-update semantics. Include all new fields in order responses and the shared frontend API contract documentation.
- Add TypeORM migration(s) that preserve existing orders and current payment-method values; do not silently relabel or discard historical data.
- Update order, API, database, and frontend-contract documentation as applicable.

## Work Items
1. [DONE] Inspect order entity, service/controller/routes/validators, DTO mapping, migrations, tests, and current documentation.
2. [DONE] Add independent payment, invoice, and delivery persistence fields and a backward-compatible migration.
3. [DONE] Implement and validate checkout payment-method restrictions and admin update operations, including completion synchronization and timestamps.
4. [DONE] Extend order response DTOs and shared frontend contracts; document request/response behavior and authorization.
5. [DONE] Add tests for checkout methods, independent/optional delivery identifiers, admin authorization and validation, invoice/payment/delivery combinations, and completion timestamps.
6. [DONE] Run the full test suite and build; report migration and API changes.

## Acceptance Criteria
- An order can be unpaid, delivered without a delivery identifier, and/or uninvoiced in any valid combination; these facts are represented without forcing a linear status transition.
- Delivery-document identifier is optional and independent of delivered state.
- Invoice issuance, payment, and delivery are each independently represented and timestamped.
- `COMPLETED` and `completedAt` are set only when all three completion conditions are met; the admin cannot force completion prematurely.
- Existing orders and historical payment-method values remain readable after migration.
- Tests and build pass.
