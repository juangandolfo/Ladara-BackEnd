# Setup & Installation Guide

## Prerequisites

- **Node.js**: v18+ (LTS recommended)
- **npm**: v9+
- **MySQL**: v8+
- **Git**: For version control
- **Visual Studio Code** (Optional but recommended)

## Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/juangandolfo/Ladara-BackEnd.git
cd Ladara-BackEnd
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`:
- Express.js
- TypeORM
- TypeScript
- Passport (OAuth)
- JWT
- Validators
- MySQL2

### 3. Environment Configuration

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Configure the following variables:

```env
# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ladara

# Server
PORT=3000
NODE_ENV=development

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=7d
```

### 4. Database Setup

#### Create Database

```sql
CREATE DATABASE ladara;
USE ladara;
```

#### Run Migrations

```bash
npm run migration:run
```

This applies all pending migrations from the `db/migrations/` directory.

#### (Optional) Seed Database

To populate with sample data:

```bash
npm run seed
```

## Development Server

### Start Development Server

```bash
npm run dev
```

This uses `nodemon` and `ts-node` to:
- Watch for file changes
- Automatically reload the server
- Compile TypeScript on the fly

Server runs on: `http://localhost:3000`

### Build for Production

```bash
npm run build
```

Compiles TypeScript to JavaScript in the `dist/` directory.

### Start Production Server

```bash
npm start
```

## Docker Setup (Optional)

### Build Docker Image

```bash
docker build -t ladara-backend .
```

### Run with Docker Compose

```bash
docker-compose up -d
```

This starts:
- Express server on port 3000
- MySQL database on port 3306

### Stop Services

```bash
docker-compose down
```

## Project Structure After Setup

```
Ladara-BackEnd/
├── src/                    # Source code
│   ├── auth/              # Authentication
│   ├── product/           # Products
│   ├── order/             # Orders
│   ├── discount/          # Discounts
│   ├── user/              # Users
│   ├── middlewares/       # Express middlewares
│   ├── dtos/              # Data Transfer Objects
│   ├── seeds/             # Database seeds
│   ├── data-source.ts     # TypeORM config
│   └── server.ts          # Express app
├── db/                     # Database
│   └── migrations/        # Migration files
├── documentation/         # This documentation
├── dist/                  # Compiled JS (after build)
├── node_modules/          # Dependencies
├── package.json           # Project metadata
├── tsconfig.json          # TypeScript config
├── Dockerfile             # Docker image definition
├── docker-compose.yml     # Docker services
└── .env                   # Environment variables
```

## Verify Installation

### Check Database Connection

```bash
npm run dev
```

Look for console output:
```
AppDataSource initialized successfully
Incoming request: GET /
```

### Test API Endpoint

```bash
curl http://localhost:3000/products
```

Should return:
```json
{
    "success": true,
    "message": "Products filtered successfully",
    "data": [...],
    "meta": {...}
}
```

## Database Migrations

### Run Pending Migrations

```bash
npm run migration:run
```

### Revert Last Migration

```bash
npm run migration:revert
```

### Generate New Migration

After modifying entities, generate migration:

```bash
npm run migration:generate db/migrations/migrations
```

TypeORM will detect changes and create migration file.

## Troubleshooting

### Issue: MySQL Connection Failed

**Solution:**
- Verify MySQL is running: `mysql -u root -p`
- Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in `.env`
- Ensure database exists: `CREATE DATABASE ladara;`

### Issue: Port Already in Use

**Solution:**
```bash
# Change PORT in .env
PORT=3001

# Or kill process using port 3000
# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: TypeScript Compilation Error

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Migrations Not Running

**Solution:**
```bash
# Check migration files exist
ls db/migrations/

# Verify data-source.ts config
# Run with verbose output
npm run migration:run -- --verbose
```

## Development Workflow

1. **Modify Code** - Edit TypeScript files
2. **Auto-Reload** - Changes automatically reload (with `npm run dev`)
3. **Test API** - Use Postman or curl to test endpoints
4. **Database Changes** - Generate migration, run migration
5. **Commit** - Push changes to git

### Git Branch Conventions

```bash
# Feature development
git checkout -b feat/feature-name

# Bug fixes
git checkout -b fix/bug-name

# Refactoring
git checkout -b refactor/component-name
```

## IDE Setup (VS Code)

### Recommended Extensions

1. **ES7+ React/Redux/React-Native snippets** - dsznajder.es7-react-js-snippets
2. **Prettier - Code formatter** - esbenp.prettier-vscode
3. **ESLint** - dbaeumer.vscode-eslint
4. **Thunder Client** - rangav.vscode-thunder-client (API testing)
5. **MySQL** - cweijan.vscode-mysql-client2

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
    "editor.formatOnSave": true,
    "[typescript]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "editor.tabSize": 2,
    "editor.insertSpaces": true
}
```

## Next Steps

1. Read [API Endpoints](./API.md) to understand available endpoints
2. Review [Module Structure](./MODULES.md) for code organization
3. Check [Environment Variables](./ENVIRONMENT.md) for configuration details
4. Follow [Database Schema](./DATABASE.md) for entity relationships

---

**For issues or questions, refer to the project's GitHub issues or contact the team.**
