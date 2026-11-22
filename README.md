# Ladara-BackEnd

## Frontend API expectations

[`openapi.yaml`](openapi.yaml) documents what the current frontend sends and
consumes, not an implemented or agreed backend contract. The backend stack,
implementation, response status codes, and deployment configuration are not
established. The frontend currently uses `http://localhost:3000`.
Default OpenAPI responses intentionally leave bodies and status codes
unspecified. The `x-client-expected-content` extension records client-consumed
JSON shapes; standard OpenAPI tooling does not enforce those shapes.

The contract is based on the frontend's `src/app/services/auth.service.ts`,
`product.service.ts`, `order.service.ts`, their models under
`src/app/services/models/`, and the home, cart, checkout, and my-orders
components. TypeScript declarations describe client assumptions, not server
guarantees; some consumers accept more than the declared shapes.

Known discrepancies to resolve before implementation:

- Current order is consumed as both an object and an array; repeat-order
  expects an array. The order service DTO permits missing items and nested
  products, while order history dereferences both without guards.
- The product query DTO declares `meta` required and `data` optional, but the
  home screen tolerates either being absent; categories data is also optional.
- The home screen sends a `category` product filter absent from the filter DTO.
- The cart validates coupons through the API, while checkout locally applies
  `DISCOUNT10` at 10% and calculates tax locally.
- Product and order requests send `Authorization: Bearer null` when logged
  out; the frontend calls `/auth/me` only when it has a bearer token. This does
  not establish the server's authorization policy.
- The Google login flow uses a popup and a same-origin `postMessage`; its HTTP
  response or redirect is unspecified. Mocked or client-handled error codes do
  not establish backend status-code requirements.

Agree on these differences, API behavior, and error/status semantics before
implementing dependent backend or frontend changes.
