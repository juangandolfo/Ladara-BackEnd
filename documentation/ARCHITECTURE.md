# Architecture

## System

Node.js/TypeScript, Express 5, TypeORM, and MySQL. `src/server.ts` initializes the database and middleware, then mounts feature routers. Auth is mounted at `/auth`; products, orders, discounts, settings, and billing information are mounted under `/api`.

## Request and data flow

`Express → route and middleware → controller → service → TypeORM repository → MySQL`

Features are grouped by domain under `src/` (`auth`, `product`, `order`, `discount`, `billing-information`, `business-settings`, `analytics`). Routes apply validation and authentication; services implement business rules; entities define persistence; DTOs describe API data. Analytics stores activity events and reports from order/payment, product-category, billing-country, and business-setting data.

## Authentication

Google OAuth creates a JWT with a one-hour expiry. Protected routes validate the bearer token; admin routes additionally check `User.isAdmin`. The first registered user is made admin. See [API reference](./API.md) for route-specific access and exceptions.

## Orders

An order starts as a cart. Checkout associates the user's saved billing address and payment method, then moves the order out of the cart; it does not process a payment. Payment, invoice issuance, and delivery are tracked separately. Completion requires all three and uses server-generated timestamps.

## Persistence and checks

TypeORM repositories access MySQL. Schema changes use migrations; automatic synchronization is disabled. Run `npm test` and `npm run build` after changes. Database scripts are listed in `package.json`.

## Analytics

Dashboard date boundaries are interpreted in the configurable IANA business timezone, while database timestamps remain UTC. Orders and items retain billing-country and category snapshots for stable historical reporting. Dashboard activity is best-effort audit data and does not block core business writes. Visitor/source/conversion analytics are intentionally not implemented until a frontend tracking contract exists.
