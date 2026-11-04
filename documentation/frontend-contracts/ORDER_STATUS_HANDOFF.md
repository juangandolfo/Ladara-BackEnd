# Frontend Handoff: Order Status Consolidation

- Replace `PENDING_PAYMENT` and `PREPARING` with `ORDER_PLACED` (`order_placed`) in frontend status types, filters, badges, and UI logic. Supported workflow statuses are now `CART` (`cart`), `ORDER_PLACED` (`order_placed`), and `COMPLETED` (`completed`).
- Checkout changes status from `cart` to `order_placed`. Payment, invoice, and delivery flags remain independent; inspect them to show pending admin actions.
- If a requirement is removed from a completed order, status returns to `order_placed` (not `preparing`). `completedAt` retains its first-completion timestamp.
- Admin dashboard summary now returns `cartCount`, `orderPlacedCount`, and `completedLast30DaysCount`; replace the old `pendingPaymentCount` and `preparingCount` UI. Shared type: `AdminOrderDashboardSummary`.
- Backend migration `1800000007000-order-placed-status` consolidates historical `pending_payment` and `preparing` rows, retaining each original value internally in `legacyWorkflowStatus`. It does not expose that compatibility field in order DTOs.
