# Database Schema & Migrations

## Database Overview

- **Type**: MySQL 8.0+
- **ORM**: TypeORM 0.3.25
- **Connection Pool**: mysql2/promise
- **Synchronization**: Enabled (auto-creates tables from entities)
- **Logging**: Enabled in development

## Entity Relationships Diagram

```
User (1) ──────────┐
  │                 │
  ├──────────────── Order (N)
  │                 │
  │                 └─── OrderItem (N)
  │                         │
  │                         └─── Product
  │
  └──────────────── Discount (N)

Product
  └─ No direct relations
```

## Entities

### 1. User

**Table**: `users`

```typescript
@Entity({ name: "users" })
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", nullable: false })
    name: string;

    @Column({ type: "boolean", default: false })
    isAdmin: boolean;
}
```

**Fields**:
- `id` (UUID) - Primary key, auto-generated
- `name` (VARCHAR) - User's full name
- `isAdmin` (BOOLEAN) - Admin role flag

**Purpose**: Stores authenticated users from Google OAuth

**Relationships**:
- One-to-Many: Orders
- One-to-Many: Discounts

---

### 2. Product

**Table**: `product`

```typescript
@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @Column("decimal", { precision: 10, scale: 2 })
    price: number;

    @Column("text", { nullable: true })
    description: string;

    @Column({ length: 50, nullable: true })
    code: string;

    @Column("int", { default: 0 })
    stock: number;

    @Column({ length: 50, nullable: false })
    category: string;

    @Column({ length: 255, nullable: false })
    image: string;

    @DeleteDateColumn()
    deletedAt: Date;
}
```

**Fields**:
- `id` (INT) - Primary key, auto-increment
- `name` (VARCHAR 100) - Product name
- `price` (DECIMAL 10,2) - Price with 2 decimal places
- `description` (TEXT) - Product details
- `code` (VARCHAR 50) - SKU or product code
- `stock` (INT) - Available quantity
- `category` (VARCHAR 50) - Product category
- `image` (VARCHAR 255) - Image URL
- `deletedAt` (DATETIME) - Soft delete timestamp

**Purpose**: Product catalog

**Features**:
- Soft deletes via `@DeleteDateColumn()`
- Decimal price for accuracy
- Category-based organization
- Stock tracking

**Relationships**:
- One-to-Many: OrderItems

---

### 3. Order

**Table**: `order`

```typescript
@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { nullable: false })
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @Column("decimal", { precision: 10, scale: 2 })
    total: number;

    @OneToMany(() => OrderItem, item => item.order, { cascade: true })
    items: OrderItem[];

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.CART
    })
    status: OrderStatus;
}
```

**Fields**:
- `id` (INT) - Primary key
- `user` (UUID) - Foreign key to User
- `createdAt` (DATETIME) - Auto-set creation time
- `total` (DECIMAL 10,2) - Order total amount
- `items` (Relation) - OrderItem array with cascade delete
- `status` (ENUM) - Current order status

**Status Values**:
- `CART` - Shopping cart (active order)
- `PENDING` - Awaiting payment
- `CONFIRMED` - Payment confirmed
- `SHIPPED` - In transit
- `DELIVERED` - Completed

**Purpose**: Customer orders/shopping carts

**Features**:
- Cascade delete items when order deleted
- Auto-tracked creation time
- Status tracking
- One cart per user at CART status

**Relationships**:
- Many-to-One: User
- One-to-Many: OrderItems

---

### 4. OrderItem

**Table**: `order_item`

```typescript
@Entity()
export class OrderItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order, order => order.items)
    order: Order;

    @ManyToOne(() => Product, { nullable: false })
    product: Product;

    @Column("int")
    quantity: number;

    @Column("decimal", { precision: 10, scale: 2 })
    price: number;
}
```

**Fields**:
- `id` (INT) - Primary key
- `order` (INT) - Foreign key to Order
- `product` (INT) - Foreign key to Product
- `quantity` (INT) - Number of items
- `price` (DECIMAL 10,2) - Price at time of order

**Purpose**: Line items in orders

**Features**:
- Stores price snapshot (allows price changes without affecting past orders)
- Links orders to products
- Supports quantity

**Relationships**:
- Many-to-One: Order (bidirectional)
- Many-to-One: Product

---

### 5. Discount

**Table**: `discount`

```typescript
@Entity()
export class Discount {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { nullable: false })
    user: User;

    @Column("decimal", { precision: 5, scale: 2 })
    value: number;

    @Column({ default: "fixed" })
    type: "fixed" | "percent";

    @Column({ nullable: true })
    description: string;

    @Column({ type: "int", nullable: true })
    usesLeft: number | null;

    @DeleteDateColumn({ nullable: true })
    deletedAt: Date;
}
```

**Fields**:
- `id` (INT) - Primary key
- `user` (UUID) - Foreign key to User
- `value` (DECIMAL 5,2) - Discount amount or percentage
- `type` (VARCHAR) - "fixed" or "percent"
- `description` (VARCHAR) - Discount label/name
- `usesLeft` (INT) - Remaining uses, null = unlimited
- `deletedAt` (DATETIME) - Soft delete timestamp

**Purpose**: User-specific discounts/coupon codes

**Features**:
- Two discount types (fixed amount or percentage)
- Usage limit tracking
- Per-user assignment
- Soft deletes

**Relationships**:
- Many-to-One: User

---

## Database Configuration

### Connection Settings

File: `src/data-source.ts`

```typescript
export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "ladara",
    synchronize: true,      // Auto-create tables
    logging: true,          // Log queries
    entities: [Product, User, Order, OrderItem, Discount],
    migrations: [`${__dirname}/../db/migrations/*.ts`],
    subscribers: [],
});
```

**Key Settings**:
- `synchronize: true` - Auto-sync entities with database
- `logging: true` - Log all SQL queries
- `entities` - List of ORM entities
- `migrations` - Path to migration files

## Migrations

### Location

`db/migrations/` - Contains timestamped migration files

### Migration Naming Convention

```
<timestamp>-migrations.ts
<timestamp>-migrations.js
```

Example: `1755290298000-migrations.ts`

### Running Migrations

```bash
# Apply pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate new migration from entity changes
npm run migration:generate db/migrations/migrations
```

### Migration File Structure

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1755290298000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Apply changes
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert changes
    }
}
```

## Indexes

### Recommended Indexes (Not Currently Set)

```sql
-- Performance optimization
CREATE INDEX idx_product_category ON product(category);
CREATE INDEX idx_order_user_id ON order(userId);
CREATE INDEX idx_order_item_order_id ON order_item(orderId);
CREATE INDEX idx_discount_user_id ON discount(userId);
CREATE INDEX idx_product_code ON product(code);
```

## Views & Stored Procedures

Currently: None implemented

## Backups

### Manual Backup

```bash
mysqldump -u root -p ladara > backup.sql
```

### Restore from Backup

```bash
mysql -u root -p ladara < backup.sql
```

## Data Integrity

### Constraints

- **Foreign Keys**: Enabled on all relationships
- **NOT NULL**: Applied to required fields
- **DEFAULT Values**: Set for boolean and enum fields
- **CASCADE DELETE**: Enabled on Order → OrderItem

### Soft Deletes

Used for: Product, Discount

- Records are marked as deleted (not removed)
- `@DeleteDateColumn()` decorator sets `deletedAt` timestamp
- Allows data recovery and audit trails

## Performance Considerations

### Query Optimization

1. **Eager vs Lazy Loading** - Configure in entity relations
2. **Select Fields** - Only fetch needed columns
3. **Pagination** - Use limit/offset for large result sets
4. **Filtering** - Use database-level filters when possible

### Connection Pooling

Default pool size: Handled by mysql2

### Caching Strategy

Currently: None implemented (can be added with Redis)

## Seed Data

### File

`src/seeds/seed.ts`

**Command**:
```bash
npm run seed
```

**Purpose**: Populate database with initial test data

## Database Maintenance

### Check Database Size

```sql
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'ladara'
ORDER BY size_mb DESC;
```

### Optimize Tables

```sql
OPTIMIZE TABLE users;
OPTIMIZE TABLE product;
OPTIMIZE TABLE order;
OPTIMIZE TABLE order_item;
OPTIMIZE TABLE discount;
```

---

For detailed entity documentation, see individual module files: [AUTH.md](./AUTH.md), [PRODUCT.md](./PRODUCT.md), [ORDER.md](./ORDER.md), [DISCOUNT.md](./DISCOUNT.md), [USER.md](./USER.md)
