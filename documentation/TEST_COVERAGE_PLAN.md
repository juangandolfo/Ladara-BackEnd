# Test Coverage Improvement Plan

## Goal

Establish a reliable, full-source coverage baseline and improve automated test coverage in prioritized business-critical modules without reducing existing test quality.

## Current baseline

- Test run: **39 passed, 0 failed**.
- Node's built-in coverage report for application files loaded by the current tests:
  - Lines: **69.21%**
  - Branches: **57.33%**
  - Functions: **76.77%**
- The current tests are concentrated in five files: billing-information service, email service, auth middleware, cart behavior, and order service.
- This is **not a full-repository baseline**. The report listed only nine application files loaded during the test run; source modules not listed were not measured and must not be interpreted as 0% coverage.
- `npm test -- --coverage` runs the tests but does not enable Node coverage with the current package script. The run that produced the figures above used Node's `--experimental-test-coverage` option and the project's `TS_NODE_TRANSPILE_ONLY=true` setting.

### Reproducible full-source baseline (2026-11-08)

- Run `npm run test:coverage` to execute all tests and create text and HTML reports in `coverage/`.
- The command uses `c8 --all` over `src/**/*.ts`, excluding tests, declarations, and dependencies. `coverage/` is git-ignored.
- The first full-source report measured **33.26% lines, 33.26% statements, 51.62% branches, and 2.05% functions** across application source. The low function rate is partly due to TypeScript entity classes, which are included in the all-source denominator but are not meaningful unit-test targets on their own.
- All application source files, including unimported modules, are included and the report maps to TypeScript sources. The HTML report is `coverage/index.html`.
- After the first coverage additions, the suite had 47 tests and measured 32.39% lines, 57.77% branches, and 61.46% functions.
- The latest verified suite has **50 tests passing** and measures **34.09% lines, 59.34% branches, and 64.91% functions**. The aggregate includes all source files, including untested routes, entities, and startup wiring; function coverage is therefore sensitive to transpiled decorators and declarations.

## Implementation plan

### Phase 1 — Make full-source coverage reproducible

1. Add a coverage command to the package scripts and use a coverage reporter configured to include all `src/**/*.ts` files, including unimported files, while excluding test files and generated output. **Completed:** `npm run test:coverage` uses c8 and emits text and HTML reports.
2. Prefer a V8 coverage tool such as `c8` with an all-files option; verify that its report maps instrumentation back to TypeScript source files under the existing `ts-node` test setup.
3. Produce both text and HTML reports. Confirm the HTML report includes unexecuted application files at 0% and that test files are excluded. **Completed.**
4. Run the existing suite through the coverage command and record the full-source baseline before adding tests. **Completed:** 39 tests passed; baseline recorded above.

**Acceptance:** one documented package command runs the complete test suite and emits a full-source report; the report includes files not imported by tests and points to TypeScript source locations.

**Initial enforced thresholds:** `npm run test:coverage` also requires at least 30% lines, 54% branches, and 59% functions. Raise these as coverage improves; do not lower them to mask regressions.

### Phase 2 — Improve order controller coverage

**Progress:** Focused tests now cover checkout error mapping, cart quantity validation/not-found handling, coupon validation, admin DTO/dashboard responses, empty user-order results, fulfillment success/not-found, and completion success/not-found. Order-service tests also cover cart creation/reuse, missing users, and discount selection. Other controller and service branches remain for future coverage.

The current report gives `order.controller.ts` the lowest reported coverage: **47.22% lines, 29.79% branches, and 55.00% functions**.

Add focused controller tests for:

- Successful responses and DTO mapping for current-order, user-order, admin-order, dashboard, cart, checkout, coupon, validation, and fulfillment handlers.
- Missing order/item responses and invalid request data.
- Checkout error mapping: empty order, order outside cart state, invalid payment method, missing billing information, and unexpected service errors.
- Fulfillment update success, missing order, and unexpected errors; completion conflict and service-error handling.
- Authentication/missing-user behavior where the controller itself handles it.

Target: [order.controller.ts](../src/order/order.controller.ts).

### Phase 3 — Cover order-service branches

`order.service.ts` has **80.53% line coverage but 57.63% branch coverage** in the partial report. Add tests for uncovered business and failure paths, informed by the full-source report:

- Creating/reusing carts, missing users, and shipping-cost defaults.
- Empty/missing carts, item/product lookup failures, invalid quantities, and stock/price conflicts.
- Discount absent, valid, expired, inactive, minimum-spend, and unsupported-type paths.
- Checkout ownership, missing billing information, empty orders, invalid payment methods, and non-cart orders.
- Fulfillment partial updates, repeated timestamps, completion synchronization, and persistence failures.

Target: [order.service.ts](../src/order/order.service.ts). Keep assertions focused on observable outcomes and avoid coupling to TypeORM internals unnecessarily.

### Phase 4 — Cover settings and billing services

**Progress:** Added business-settings default creation, normalization, threshold boundary/update, and repository-failure tests. Added billing-information ordering, create/update normalization and ownership, missing-user, successful deletion, and order-reference protection tests.

The current partial report shows `business-setting.service.ts` at **52.67% line coverage** and `billing-information.service.ts` at **67.19% line coverage**.

For business settings, cover default creation when settings are absent, retrieval of existing values, set/create and update behavior, free-shipping threshold boundaries, and repository failures. Target: [business-setting.service.ts](../src/business-settings/business-setting.service.ts).

For billing information, cover list ordering/query ownership, successful create and update normalization, missing users, nonexistent or other-user records, successful delete, and order-reference protection. Target: [billing-information.service.ts](../src/billing-information/billing-information.service.ts).

### Phase 5 — Cover modules absent from the current report

**Progress:** Added authentication token/create-user tests and user-service lookup tests. Product and discount modules and their controllers/validators remain untested.

After Phase 1 establishes their actual baseline, add tests for application modules not represented in the existing report. Prioritize business logic and externally observable behavior:

1. Product and discount services, validators, and controllers.
2. Authentication service/controller flows and user service behavior.
3. Billing-information and business-settings controllers/validators.
4. Route wiring and server-level middleware behavior where unit tests cannot verify the contract adequately.

Candidate areas include [product](../src/product), [discount](../src/discount), [auth](../src/auth), [user](../src/user), and [billing-information](../src/billing-information). Do not prioritize migration files, seeds, or startup-only wiring above core request and business logic unless the full report identifies a critical gap.

### Phase 6 — Add gradual coverage thresholds

1. Set initial line, branch, and function thresholds slightly below the measured full-source baseline so the check is stable while gaps are addressed.
2. Raise thresholds in small increments as each phase lands, prioritizing branch coverage for validation and authorization logic.
3. Ensure the coverage command fails CI when thresholds are missed and produces a report artifact for review.
4. Update this plan or the project documentation with the final command and threshold policy after implementation.

## Testing guidance

- Preserve the existing test suite and run it after each phase.
- Prefer Node's built-in test runner and existing mock patterns unless an HTTP-level test requires a small additional test dependency.
- Cover success, validation, not-found, authorization, conflict, and unexpected-error cases where those paths exist.
- Keep tests deterministic: control time for timestamp/expiry behavior and avoid dependence on external services or a live database in unit tests.
- Review branch coverage, not just line coverage; a line can be covered while important true/false paths remain untested.

## Completion criteria

- A reproducible command measures all application TypeScript source files, including files not loaded by tests.
- The complete test suite passes under that command.
- The initially unreported source modules have measured baselines.
- Tests are added for the prioritized uncovered paths, with no regressions in existing behavior.
- Coverage thresholds are enforced and are raised based on verified results rather than guessed targets.
