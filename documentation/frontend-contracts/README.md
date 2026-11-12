# Ladara shared contracts

TypeScript DTOs, API URL builders, and error utilities for the Ladara frontend/backend integration.

## Use locally

From the package directory, run `npm install` and `npm run build`. For a frontend in the same repository, install this package by local path; for a deployed frontend, publish or install the package using your chosen package workflow.

## Contents

- `types.ts` — request/response DTOs and shared types
- `api-endpoints.ts` — URL builders for backend routes (local base URL defaults to `http://localhost:3000`)
- `errors.ts` — API error types and parsing helpers

Example:

```ts
import { ApiRoutes, createAuthHeader } from '@ladara/shared-contracts';

const url = ApiRoutes.orders.updateFulfillment(orderId);
const headers = createAuthHeader(token);
```

This package describes the API but does not guarantee that each operation is authorized for the current user. See the [API reference](../API.md) for permissions and behavior.
