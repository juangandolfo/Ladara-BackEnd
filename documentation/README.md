# Ladara Backend - Project Documentation

## Overview

Ladara Backend is an Express.js TypeScript application built with TypeORM, providing a complete e-commerce backend system with user authentication, product management, order processing, and discount functionality.

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 5.1.0
- **Database**: MySQL with TypeORM 0.3.25
- **Authentication**: JWT + Google OAuth 2.0
- **Validation**: class-validator + express-validator
- **Development**: ts-node, nodemon, Typescript 5.9

## Project Structure

```
src/
├── auth/              # Authentication & OAuth handling
├── customer/          # Customer management
├── discount/          # Discount management
├── dtos/             # Data Transfer Objects
├── middlewares/      # Express middlewares
├── order/            # Order management
│   ├── entities/     # Order & OrderItem entities
│   └── types/        # Order status types
├── product/          # Product management
├── purchase/         # Purchase handling
├── seeds/            # Database seed data
├── types/            # Global type definitions
├── user/             # User management
├── data-source.ts    # TypeORM configuration
└── server.ts         # Express app setup
```

## Key Features

- **User Management**: User registration via Google OAuth
- **Authentication**: JWT-based authentication with role-based access
- **Product Management**: Advanced product filtering, CRUD operations
- **Order Management**: Shopping cart functionality, order tracking
- **Discount System**: Fixed or percentage-based discounts with usage limits
- **Admin Controls**: Admin middleware for protected operations

## Documentation Files

This documentation is organized into modular files for easy navigation and AI agent integration:

### Getting Started
- [Agent Rules & Best Practices](./AGENT_RULES.md) - Guidelines for AI agents using this documentation
- [Architecture](./ARCHITECTURE.md) - System design and patterns
- [Setup & Installation](./SETUP.md) - Development environment setup

### Core Documentation
- [Database Schema](./DATABASE.md) - Entity relationships and migrations
- [API Endpoints](./API.md) - REST API documentation
- [Module Structure](./MODULES.md) - Module organization

### Module-Specific Guides
- [Authentication Module](./AUTH.md) - Auth implementation details
- [Product Module](./PRODUCT.md) - Product features and endpoints
- [Order Module](./ORDER.md) - Order processing system
- [Discount Module](./DISCOUNT.md) - Discount system
- [User Module](./USER.md) - User management

### Technical Details
- [Middleware](./MIDDLEWARE.md) - Custom middlewares
- [DTOs](./DTOS.md) - Data Transfer Objects
- [Types](./TYPES.md) - Custom TypeScript types
- [Environment Variables](./ENVIRONMENT.md) - Configuration guide

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run database migrations
npm run migration:run

# Seed database (optional)
npm run seed

# Start development server
npm run dev
```

## Development Commands

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Start development server with hot reload
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration
- `npm run migration:generate` - Generate new migration from entities
- `npm run seed` - Seed database with initial data

## Architecture Pattern

The project follows a **horizontal architecture by feature**. Each module contains:
- `*.controller.ts` - HTTP request handlers
- `*.service.ts` - Business logic
- `*.entity.ts` - Database entity definitions
- `*.validators.ts` - Input validation rules
- `*.routes.ts` - Route definitions

## Database

- **Type**: MySQL
- **ORM**: TypeORM with migrations
- **Entities**: User, Product, Order, OrderItem, Discount
- **Auto-sync**: Enabled for development

## Authentication

- Google OAuth 2.0 integration
- JWT tokens for API authentication
- Role-based access control (Admin/User)

## Port

Default port: `3000` (configurable via `PORT` environment variable)

---

**For detailed information about specific modules, refer to the dedicated documentation files listed above.**
