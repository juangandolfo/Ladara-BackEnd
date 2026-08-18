# AI Agent Rules & Best Practices

## Purpose

This document establishes guidelines and best practices for AI agents (frontend AI agents, autonomous agents, or other AI systems) working with the Ladara Backend documentation and API.

---

## Core Principles

### 1. Plan Before Executing
**Rule**: Always analyze and plan before making requests or modifications.

**Practice**:
- Understand the full scope of the task
- Identify all affected modules and endpoints
- Check dependencies and impacts
- Plan the sequence of operations
- Document assumptions

**Example**:
```
❌ Wrong: Immediately call DELETE /products/:id
✅ Right: 
   1. Check if product is in any active orders
   2. Verify deletion won't break order integrity
   3. Consider backup/soft delete option
   4. Then execute deletion
```

### 2. Read Documentation First
**Rule**: Consult relevant documentation before querying the API.

**Practice**:
- Search documentation for information
- Check module-specific docs before generic docs
- Verify API endpoint signatures
- Review error scenarios
- Understand data structures

**Search Priority**:
1. Module-specific file (PRODUCT.md, ORDER.md, etc.)
2. API.md for endpoint details
3. DATABASE.md for schema
4. ARCHITECTURE.md for patterns

### 3. Validate Before Executing
**Rule**: Verify all requirements are met before executing operations.

**Practice**:
- Check authentication requirements
- Verify user roles and permissions
- Confirm data format matches DTO
- Validate required vs optional fields
- Check for side effects

### 4. Handle Errors Gracefully
**Rule**: Anticipate and handle errors appropriately.

**Practice**:
- Check status codes in responses
- Parse error messages
- Implement retry logic for transient errors
- Log failures for debugging
- Provide meaningful error messages to users

---

## Documentation Search Strategy

### Effective Search Patterns

#### Finding Endpoints
**Task**: "Find the endpoint to get user's current order"

**Search Process**:
1. **Search**: "current order" in [ORDER.md](./ORDER.md)
2. **Find**: `GET /orders/current`
3. **Review**: Authentication, response format, status codes
4. **Execute**: Make request with proper headers

**Command**:
```bash
grep -r "current order" documentation/
# or
grep -r "GET /orders" documentation/
```

#### Finding Entity Structure
**Task**: "What fields does OrderItem have?"

**Search Process**:
1. **Search**: "OrderItem Entity" in [DATABASE.md](./DATABASE.md)
2. **Find**: Complete entity definition with all fields
3. **Review**: Field types and constraints
4. **Use**: For validation and response parsing

#### Finding Business Logic
**Task**: "How are discounts applied to prices?"

**Search Process**:
1. **Search**: "discount" in [DISCOUNT.md](./DISCOUNT.md)
2. **Find**: Discount types, calculation methods
3. **Search**: "applyDiscount" in [PRODUCT.md](./PRODUCT.md) and [ORDER.md](./ORDER.md)
4. **Review**: Implementation details and examples

#### Finding Requirements
**Task**: "What's required to create a product?"

**Search Process**:
1. **Search**: "CreateProductDto" in [DTOS.md](./DTOS.md)
2. **Find**: Required vs optional fields
3. **Search**: Validators in [PRODUCT.md](./PRODUCT.md)
4. **Review**: Validation rules and constraints

---

## Common Task Patterns

### Pattern 1: Retrieve Data

```
PLAN:
1. Identify entity (Product, Order, User)
2. Check if authentication required
3. Find endpoint and query parameters
4. Plan pagination if needed
5. Execute

SEARCH:
- Documentation file for module
- "GET /" endpoints
- Query parameter documentation
- Response format

EXECUTE:
- GET /products/query?category=Electronics&limit=20
```

### Pattern 2: Create Resource

```
PLAN:
1. Verify authentication and authorization
2. Check if admin-only
3. Find DTO requirements
4. Validate data against DTO
5. Check dependencies
6. Execute

SEARCH:
- Module DTO file
- CreateXxxDto in DTOS.md
- POST endpoint in API.md
- Validator rules in module docs

EXECUTE:
- POST /products with CreateProductDto body
```

### Pattern 3: Update Resource

```
PLAN:
1. Fetch current resource
2. Identify fields to change
3. Verify authorization
4. Check update constraints
5. Execute
6. Verify response

SEARCH:
- UpdateXxxDto in DTOS.md
- PUT endpoint in API.md
- Module validation rules
- Impact on related entities

EXECUTE:
- PUT /products/:id with UpdateProductDto body
```

### Pattern 4: Delete Resource

```
PLAN:
1. Check if soft or hard delete
2. Verify authorization
3. Check dependencies/references
4. Confirm user intent
5. Execute
6. Verify removal

SEARCH:
- DELETE endpoints in API.md
- Soft vs hard delete in module docs
- Impact on related entities
- Recovery options

EXECUTE:
- DELETE /products/:id (soft delete)
- DELETE /products/:id/permanent (hard delete)
```

---

## API Interaction Rules

### Authentication
**Rule**: Always include JWT token for protected endpoints

**Practice**:
```bash
# ✅ Correct
curl -H "Authorization: Bearer <token>" http://localhost:3000/protected

# ❌ Wrong
curl http://localhost:3000/protected
```

### Headers
**Required Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body
**Rule**: Validate body matches DTO before sending

**Practice**:
1. Check required fields in DTO
2. Verify field types
3. Validate field ranges/formats
4. Include all required fields
5. Omit undefined optional fields

### Response Handling
**Rule**: Always check `success` and `message` fields

**Practice**:
```typescript
if (response.success) {
    // Process response.data
} else {
    // Handle error from response.message
    // Check HTTP status code
    // Log for debugging
}
```

### Error Responses
**Expected Status Codes**:
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no token)
- `403` - Forbidden (no permissions)
- `404` - Not Found
- `500` - Server Error

---

## Permission Matrix

### Public Endpoints (No Auth)
- `GET /products/query`
- `POST /products/filter`
- `GET /products/categories`
- `GET /auth/google`
- `GET /auth/google/callback`

### User Endpoints (Auth Required)
- `GET /auth/me`
- `GET /orders/current`
- `GET /orders`
- `POST /orders/:id/items`
- `PUT /orders/items/:itemId`
- `DELETE /orders/items/:itemId`

### Admin Endpoints (Auth + Admin Role Required)
- `GET /products` (all)
- `GET /products/deleted`
- `POST /products`
- `PUT /products/:id`
- `DELETE /products/:id`
- `DELETE /products/:id/permanent`
- `POST /products/:id/restore`
- `POST /discounts`
- `GET /discounts`
- `GET /discounts/deleted`
- `PUT /discounts/:id`
- `DELETE /discounts/:id`
- `POST /orders/:id/complete`

### Special Requirements
- **Order Owner Check**: Can only modify own orders
- **First User**: Automatically becomes admin

---

## Data Integrity Rules

### Database Constraints
**Rule**: Respect all foreign keys and relationships

**Practice**:
1. Cannot create order without valid user
2. Cannot add item to order without valid product
3. Cannot create discount without valid user
4. Cannot delete product while in active order

### Soft Deletes
**Rule**: Use soft delete by default, hard delete only when necessary

**Practice**:
- `DELETE /products/:id` → Soft delete (reversible)
- `DELETE /products/:id/permanent` → Hard delete (irreversible)
- Search `includeDeleted=true` to find soft-deleted items
- Restore with `POST /products/:id/restore`

### Cascading Operations
**Rule**: Understand cascade effects before deleting

**Practice**:
- Deleting Order → Auto-deletes all OrderItems
- Deleting Product → Cannot delete if in active orders
- Check dependencies in [DATABASE.md](./DATABASE.md) before delete

---

## Debugging Guidelines

### When API Call Fails

**Step 1: Check Authentication**
```
- Is token included?
- Is token valid? (not expired)
- Does user exist in database?
```

**Step 2: Check Permissions**
```
- Is endpoint admin-only?
- Is user an admin?
- Does user own the resource?
```

**Step 3: Check Data**
```
- Does body match DTO?
- Are all required fields present?
- Are field types correct?
- Are values in valid ranges?
```

**Step 4: Check Dependencies**
```
- Do referenced entities exist?
- Are relationships valid?
- Check foreign key constraints?
```

**Step 5: Review Documentation**
```
- Re-read relevant module doc
- Check exact endpoint path
- Verify query parameters
- Review response format
```

### Error Message Mapping

| Error Message | Likely Cause | Check |
|---------------|-------------|-------|
| "Forbidden: No token provided" | Missing auth header | Authorization header |
| "Forbidden: Invalid token" | Expired/invalid token | Token validity |
| "Admin privileges required" | Not admin user | User.isAdmin flag |
| "Validation failed" | Invalid request body | Request body format |
| "Not found" | Resource doesn't exist | Resource ID |
| "You do not own this order" | Wrong user | User context |

---

## Documentation Maintenance Rules

### When to Search and Update Documentation

**Scenario 1: API Behavior Differs from Documentation**
```
ACTION:
1. Verify actual API behavior
2. Check which docs are outdated
3. Update relevant documentation files
4. Cross-reference in related files

FILES TO CHECK:
- API.md for endpoint details
- Module-specific docs
- ARCHITECTURE.md for patterns
- DATABASE.md for schema
```

**Scenario 2: New Feature Added**
```
ACTION:
1. Document in module-specific file
2. Add to API.md endpoints list
3. Update MODULES.md if structure changed
4. Add to README.md if major feature
5. Add examples in relevant docs

FILES TO UPDATE:
- Module docs (PRODUCT.md, ORDER.md, etc.)
- API.md
- MODULES.md
- DATABASE.md (if schema changed)
```

**Scenario 3: Bug Fix or Behavior Change**
```
ACTION:
1. Find all references in documentation
2. Update old behavior description
3. Add new behavior details
4. Include fix version/date
5. Note migration steps if needed

FILES TO CHECK:
- Module-specific docs
- API.md
- ARCHITECTURE.md
- Any example code
```

### Search and Update Checklist

When updating documentation:
- [ ] Search all files for related content
- [ ] Update all references to changed behavior
- [ ] Check related modules that might be affected
- [ ] Update examples in API.md
- [ ] Update code examples in module docs
- [ ] Verify cross-references still accurate
- [ ] Check DATABASE.md if schema changed
- [ ] Update README if major change
- [ ] Note date/version of change

---

## Best Practices for Common Operations

### Getting Product List with Discounts
```
SEARCH: PRODUCT.md - "filterProducts"
PLAN:
1. Get user ID for discount lookup
2. Use GET /products/query or POST /products/filter
3. Response includes discountedPrice field
4. Parse per-product prices

REMEMBER:
- discountedPrice is null if no discounts
- Best discount is automatically selected
- Price is calculated per-item
```

### Creating Order and Adding Items
```
SEARCH: ORDER.md - "Order Lifecycle"
PLAN:
1. GET /orders/current to get cart
2. If no cart, POST creates one
3. POST /orders/:id/items to add products
4. Can modify quantities with PUT
5. Can remove items with DELETE

REMEMBER:
- Each user has one CART order
- Items include discountedPrice
- Total auto-calculated
- No checkout endpoint (handled by admin)
```

### Managing User Discounts
```
SEARCH: DISCOUNT.md - "Discount Application"
PLAN:
1. POST /discounts to create (admin only)
2. Discounts apply automatically to products
3. Fixed or percentage types
4. Optional usage limits
5. Soft delete when done

REMEMBER:
- Per-user assignments only
- Best discount selected if multiple
- Unlimited if usesLeft = null
- Auto-deletes when usesLeft = 0
```

### Admin Product Management
```
SEARCH: PRODUCT.md - "Routes"
PLAN:
1. POST /products to create
2. PUT /products/:id to update
3. DELETE /products/:id to soft delete
4. DELETE /products/:id/permanent to hard delete
5. POST /products/:id/restore to recover

REMEMBER:
- All require admin role
- Soft delete is reversible
- Hard delete is permanent
- Can only hard delete non-referenced products
```

---

## Query Examples for Common Searches

### Find how to filter products by price range
```bash
grep -i "minPrice\|maxPrice\|price range" documentation/*.md
# Returns: PRODUCT.md, API.md, DTOS.md
```

### Find discount calculation logic
```bash
grep -i "discount" documentation/DISCOUNT.md
grep -i "discount" documentation/ORDER.md | grep -i "apply\|calculation"
```

### Find authentication middleware
```bash
grep -i "authorization\|jwt\|token" documentation/MIDDLEWARE.md
grep -i "jwt\|token" documentation/AUTH.md
```

### Find order status workflow
```bash
grep -i "status\|CART\|COMPLETED\|PREPARING" documentation/ORDER.md
grep -i "OrderStatus" documentation/TYPES.md
```

### Find database relationships
```bash
grep -i "relationship\|foreign key\|ManyToOne\|OneToMany" documentation/DATABASE.md
```

---

## Performance Considerations

### Query Optimization
**Rule**: Use pagination and filtering at database level

**Practice**:
- Include `limit` and `offset` for large result sets
- Use specific filters instead of fetching all
- Sort at database level, not in application
- Example: `GET /products/query?category=Electronics&limit=20&offset=0`

### Caching Opportunities
**Practice**:
- Categories list rarely changes → Can cache
- Product details can be cached (invalidate on update)
- User details can be cached (invalidate on login)
- Discount list needs frequent refresh

### Batch Operations
**Practice**:
- Don't make individual requests for each item
- Use limit/offset for pagination
- Group related operations

---

## Security Rules

### Never Expose Sensitive Data
**Rule**: Tokens, passwords, API keys stay in headers/env

**Practice**:
- Don't log authentication tokens
- Don't send secrets in request body
- Don't include credentials in URLs
- Use HTTPS in production

### Validate User Context
**Rule**: Always verify user has permission for operation

**Practice**:
- Check token is valid before operations
- Verify user is admin for admin endpoints
- Verify user owns resource for personal endpoints
- Log security-relevant operations

### Input Sanitization
**Rule**: Validate all input against DTOs

**Practice**:
- Check required fields present
- Verify field types match
- Validate ranges and formats
- Reject malformed requests

---

## Changelog & Updates

### How to Search for Recent Changes
```bash
# Search for version numbers or dates
grep -i "version\|2026\|changed\|updated" documentation/*.md

# Search specific module
grep -i "enhancement\|fix\|new" documentation/PRODUCT.md
```

### Documenting Changes

When updating documentation, include:
```markdown
## Changes (As of 2026-08-18)

- **Updated**: Product filtering now includes X
- **Added**: New endpoint POST /products/bulk
- **Fixed**: Discount calculation bug
- **Removed**: Deprecated endpoint GET /products/old
```

---

## Troubleshooting Common Issues

### "No token provided" Error

```
SEARCH: MIDDLEWARE.md - "Authentication Middleware"
CHECK:
1. Is Authorization header present?
2. Is format "Bearer <token>"?
3. Is token value after Bearer?
4. Did token expire?

FIX:
- Add Authorization header
- Use format: Authorization: Bearer <token>
- Refresh token from auth endpoint
```

### "Admin privileges required" Error

```
SEARCH: USER.md - "Admin Capabilities"
CHECK:
1. Is user the first user (auto-admin)?
2. Has admin role been granted?
3. Is endpoint actually admin-only?

FIX:
- Verify user.isAdmin = true
- Use admin account for admin operations
```

### "Product not found" Error

```
SEARCH: PRODUCT.md - "Error Handling"
CHECK:
1. Does product ID exist?
2. Was product soft-deleted?
3. Is product ID correct format (number)?

FIX:
- Get correct product ID
- Use GET /products with filters to find
- Use GET /products/deleted if looking for deleted
```

### Discount Not Applied

```
SEARCH: DISCOUNT.md - "Discount Application"
CHECK:
1. Does user have discount?
2. Are discount uses exhausted?
3. Is product in filter?

FIX:
- Create discount via POST /discounts
- Check usesLeft field
- Verify discount scope
```

---

## Summary Checklist for AI Agents

Before executing any operation:

- [ ] **Understand** the full task scope
- [ ] **Plan** the sequence of operations
- [ ] **Search** documentation for relevant info
- [ ] **Verify** all prerequisites are met
- [ ] **Check** permissions and authentication
- [ ] **Validate** request data against DTOs
- [ ] **Execute** the operation
- [ ] **Verify** response and status codes
- [ ] **Handle** errors appropriately
- [ ] **Update** documentation if behavior differs
- [ ] **Log** results for debugging
- [ ] **Communicate** results to user

---

## Related Documentation Files

- [README.md](./README.md) - Project overview
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [API.md](./API.md) - All endpoints
- [MODULES.md](./MODULES.md) - Module structure
- [AUTH.md](./AUTH.md) - Authentication
- [DATABASE.md](./DATABASE.md) - Database schema
- [MIDDLEWARE.md](./MIDDLEWARE.md) - Request handling

---

**Last Updated**: 2026-08-18  
**Version**: 1.0
