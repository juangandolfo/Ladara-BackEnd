# Environment Variables Configuration

## Overview

Environment variables configure the application for different deployment environments (development, staging, production). They store sensitive information and environment-specific settings without hardcoding them into source code.

## Setup

### Create `.env` File

```bash
# Create from template (if exists)
cp .env.example .env

# Or create manually
touch .env
```

### Load Variables

The application uses `dotenv` package to load `.env` into `process.env`:

```typescript
import dotenv from 'dotenv';
dotenv.config();  // Loads .env file
```

---

## Database Configuration

### `DB_HOST`
- **Type**: String
- **Default**: `127.0.0.1`
- **Example**: `localhost`, `db.example.com`
- **Purpose**: MySQL server hostname/IP

### `DB_PORT`
- **Type**: Number
- **Default**: `3306`
- **Example**: `3306`, `3307`
- **Purpose**: MySQL server port

### `DB_USER`
- **Type**: String
- **Default**: `root`
- **Example**: `mysql_user`, `admin`
- **Purpose**: Database username for authentication

### `DB_PASSWORD`
- **Type**: String
- **Default**: `password`
- **Example**: `secure-password-123`
- **Purpose**: Database password
- **Security**: Never commit to git, use .gitignore

### `DB_NAME`
- **Type**: String
- **Default**: `ladara`
- **Example**: `ladara_prod`, `ladara_dev`
- **Purpose**: Database name to use

### Full Database Example

```env
# Development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=dev_password
DB_NAME=ladara_dev

# Or Production
DB_HOST=db.production.com
DB_PORT=3306
DB_USER=prod_user
DB_PASSWORD=secure_prod_password
DB_NAME=ladara_prod
```

---

## Server Configuration

### `PORT`
- **Type**: Number
- **Default**: `3000`
- **Example**: `3000`, `8080`, `5000`
- **Purpose**: Server listen port
- **Usage**:
  ```typescript
  const PORT = process.env.PORT || 3000;
  app.listen(PORT);
  ```

### `NODE_ENV`
- **Type**: String
- **Options**: `development`, `staging`, `production`
- **Default**: (none, should be explicit)
- **Purpose**: Deployment environment
- **Usage**:
  ```typescript
  if (process.env.NODE_ENV === 'production') {
      // Production-specific code
  }
  ```

### Full Server Example

```env
PORT=3000
NODE_ENV=development

# Or production
PORT=8080
NODE_ENV=production
```

---

## Authentication Configuration

### `GOOGLE_CLIENT_ID`
- **Type**: String
- **Required**: Yes (for Google OAuth)
- **Format**: `xxx.apps.googleusercontent.com`
- **Source**: Google Cloud Console
- **Purpose**: Identifies your app to Google OAuth
- **Get**: https://console.cloud.google.com/

### `GOOGLE_CLIENT_SECRET`
- **Type**: String
- **Required**: Yes (for Google OAuth)
- **Format**: Random string
- **Source**: Google Cloud Console
- **Purpose**: Secret for OAuth authentication
- **Security**: Never expose, never commit
- **Get**: https://console.cloud.google.com/

### `GOOGLE_CALLBACK_URL`
- **Type**: String
- **Format**: Full URL to callback endpoint
- **Example**: `http://localhost:3000/auth/google/callback`
- **Purpose**: Where Google redirects after login
- **Must Match**: Registered in Google Cloud Console
- **Production**: Use HTTPS

### `SECRET_JWT_KEY`
- **Type**: String
- **Default**: `some secret key` (DO NOT USE IN PRODUCTION)
- **Format**: Random, secure string
- **Purpose**: Sign and verify JWT tokens
- **Security**: Very important, make it strong
- **Length**: At least 32 characters recommended
- **Generation**: Use `openssl rand -base64 32`

### Full Auth Example

```env
# Development
GOOGLE_CLIENT_ID=xxx-xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
SECRET_JWT_KEY=dev_secret_key_not_secure

# Or Production
GOOGLE_CLIENT_ID=yyy-yyy.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-yyy
GOOGLE_CALLBACK_URL=https://api.example.com/auth/google/callback
SECRET_JWT_KEY=super_secure_random_string_min_32_chars
```

---

## Environment Files by Environment

### Development `.env`

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=dev_password
DB_NAME=ladara_dev

# Google OAuth
GOOGLE_CLIENT_ID=dev-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=dev_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT
SECRET_JWT_KEY=dev_secret_jwt_key
```

### Staging `.env.staging`

```env
# Server
PORT=8080
NODE_ENV=staging

# Database
DB_HOST=staging-db.example.com
DB_PORT=3306
DB_USER=staging_user
DB_PASSWORD=${STAGING_DB_PASSWORD}
DB_NAME=ladara_staging

# Google OAuth
GOOGLE_CLIENT_ID=staging-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=${STAGING_GOOGLE_SECRET}
GOOGLE_CALLBACK_URL=https://staging-api.example.com/auth/google/callback

# JWT
SECRET_JWT_KEY=${STAGING_JWT_SECRET}
```

### Production `.env.production`

```env
# Server
PORT=3000
NODE_ENV=production

# Database
DB_HOST=prod-db.example.com
DB_PORT=3306
DB_USER=prod_db_user
DB_PASSWORD=${PROD_DB_PASSWORD}
DB_NAME=ladara_production

# Google OAuth
GOOGLE_CLIENT_ID=prod-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=${PROD_GOOGLE_SECRET}
GOOGLE_CALLBACK_URL=https://api.example.com/auth/google/callback

# JWT
SECRET_JWT_KEY=${PROD_JWT_SECRET}
```

---

## Security Best Practices

### 1. Never Commit Secrets

**.gitignore**:
```
.env
.env.local
.env.*.local
*.key
*.pem
```

### 2. Use Strong Passwords

**Database Password**:
- Minimum 12 characters
- Mix uppercase, lowercase, numbers, symbols
- No dictionary words
- Use password manager: `openssl rand -base64 32`

**JWT Secret**:
- Minimum 32 characters
- Cryptographically random
- Generate: `openssl rand -base64 32`

**Google Secret**:
- Provided by Google (don't create your own)
- Treat like password
- Rotate regularly in Google Console

### 3. Environment Variable Vault

**For Production**:
- Use AWS Secrets Manager
- Use Heroku Config Vars
- Use Docker secrets
- Use HashiCorp Vault
- Never commit to git

### 4. Access Control

Only commit:
- `.env.example` (template with placeholder values)
- Instructions for setting variables

**Example `.env.example`**:
```env
# Copy this file to .env and fill with actual values
DB_HOST=your_database_host
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name

PORT=3000
NODE_ENV=development

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=your_callback_url

SECRET_JWT_KEY=your_secret_jwt_key
```

### 5. Rotation Strategy

**Regular Rotation**:
- Passwords: Every 90 days
- JWT Secret: Every 6 months or if compromised
- Google Secret: Regenerate in console, update all servers

---

## Loading in Code

### At Startup

```typescript
// server.ts
import dotenv from 'dotenv';
dotenv.config();  // Must be at top

// Variables now available
const dbHost = process.env.DB_HOST;
const port = process.env.PORT;
```

### Multiple Files

```typescript
// data-source.ts
import dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// auth.service.ts
import dotenv from 'dotenv';
dotenv.config();

const SECRET_KEY = process.env.SECRET_JWT_KEY || 'fallback_secret';
```

### Validation on Startup

```typescript
// Ensure required variables exist
if (!process.env.DB_HOST) {
    throw new Error('DB_HOST environment variable is required');
}

if (!process.env.SECRET_JWT_KEY) {
    throw new Error('SECRET_JWT_KEY environment variable is required');
}

if (process.env.SECRET_JWT_KEY === 'some secret key') {
    throw new Error('SECRET_JWT_KEY must be changed from default');
}
```

---

## Type Safety with Environment Variables

### Strong Typing

```typescript
// Avoid using process.env directly
// ❌ Not type-safe
const host = process.env.DB_HOST;
const port = parseInt(process.env.DB_PORT);  // Could be NaN

// ✅ Type-safe with validation
const config = {
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    },
    server: {
        port: parseInt(process.env.PORT || '3000', 10),
        env: process.env.NODE_ENV as 'development' | 'staging' | 'production',
    },
    auth: {
        googleClientId: process.env.GOOGLE_CLIENT_ID,
        googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
        jwtSecret: process.env.SECRET_JWT_KEY,
    }
};
```

---

## Docker with Environment Variables

### In Dockerfile

```dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Pass environment variables at runtime
CMD ["npm", "start"]
```

### In docker-compose.yml

```yaml
version: '3'
services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=db
      - DB_PORT=3306
      - DB_USER=root
      - DB_PASSWORD=root_password
      - DB_NAME=ladara
      - PORT=3000
      - NODE_ENV=production
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - SECRET_JWT_KEY=${SECRET_JWT_KEY}
    depends_on:
      - db
  
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: ladara
    ports:
      - "3306:3306"
```

### Run with Env File

```bash
docker-compose --env-file .env.production up
```

---

## Troubleshooting

### Variables Not Loading

```typescript
// Ensure dotenv.config() is FIRST line
import dotenv from 'dotenv';
dotenv.config();  // Must be before imports that use variables

import { AppDataSource } from './data-source';  // After dotenv.config()
```

### Connection Failed

1. Check all DB_ variables are set
2. Verify database is running
3. Test credentials: `mysql -h DB_HOST -u DB_USER -p DB_PASSWORD`

### OAuth Redirect Fails

1. Verify GOOGLE_CALLBACK_URL matches Google Console
2. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
3. Ensure app is registered in Google Cloud Console

### JWT Errors

1. Verify SECRET_JWT_KEY is set
2. Not changed between application restarts
3. Same value across all server instances

---

## Checklist for Deployment

- [ ] All required variables set
- [ ] Database password is strong
- [ ] JWT secret is strong (32+ chars, random)
- [ ] Google OAuth credentials configured
- [ ] CALLBACK_URL matches registered domain
- [ ] NODE_ENV set to `production`
- [ ] PORT set appropriately
- [ ] Database accessible from server
- [ ] HTTPS enabled for production
- [ ] Variables stored in secure vault
- [ ] No secrets in git repository
- [ ] .env.example has placeholders only

---

Related Documentation:
- [Setup & Installation](./SETUP.md)
- [Database Schema](./DATABASE.md)
- [Authentication Module](./AUTH.md)
