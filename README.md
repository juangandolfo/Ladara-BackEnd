# Ladara Backend

TypeScript/Express API for Ladara's product catalog, carts and orders, billing information, discounts, and business settings.

## Run locally

1. Install dependencies: `npm install`.
2. Configure MySQL and `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `SECRET_JWT_KEY`. `PORT` and `CALLBACK_URL` are optional.
3. Apply migrations: `npm run migration:run`.
4. Start the server: `npm run dev` (default port `3000`).

## Checks

- `npm test` — run tests
- `npm run test:coverage` — tests with coverage thresholds
- `npm run build` — compile TypeScript

## Documentation

- [Architecture](documentation/ARCHITECTURE.md)
- [API reference](documentation/API.md)
- [Agent instructions](.github/copilot-instructions.md)
- [Frontend contracts package](documentation/frontend-contracts/README.md)



