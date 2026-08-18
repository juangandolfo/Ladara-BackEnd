# Middleware Documentation

## Overview

Middleware functions are Express handlers that process requests before they reach controllers. This project uses custom middleware for authentication, authorization, and validation.

## Middleware Types

### 1. Authentication Middleware
- Validates JWT tokens
- Extracts user from token
- Protects authenticated endpoints

### 2. Authorization Middleware
- Checks user roles
- Verifies admin privileges
- Checks resource ownership

### 3. Validation Middleware
- Validates request parameters
- Validates request body
- Handled via express-validator

---

## Authentication Middleware

### `createAuthorizeMiddleware(userService: UserService)`

**File**: `src/middlewares/auth.middleware.ts`

**Purpose**: Verify JWT token and load user for authenticated routes

**Factory Pattern**: Returns middleware function that uses injected UserService

**Parameters**:
- `userService` - UserService instance for user lookup

**Returns**: Async middleware function

### Implementation

```typescript
export const createAuthorizeMiddleware = (userService: any) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // 1. Extract Authorization header
        const header = req.headers["authorization"];
        const bearerToken = header?.split(" ");
        
        // 2. Validate header format
        if (!bearerToken || bearerToken.length !== 2) {
            res.status(403).send("Forbidden: No token provided");
            return;
        }
        
        // 3. Extract token
        const token = bearerToken[1];
        if (!token) {
            res.status(403).send("Forbidden: No token provided");
            return;
        }
        
        try {
            // 4. Verify and decode token
            const entity = jwt.verify(token, SECRET_KEY) as JwtPayload;
            
            if (!entity || !entity.name) {
                res.status(403).send("Forbidden: Invalid token payload");
                return;
            }
            
            // 5. Load user from database
            req.entity = await userService.getEntityById(entity.id);
            
            if (!req.entity) {
                res.status(403).send("Forbidden: User not found");
                return;
            }
            
            // 6. Proceed to next middleware
            next();
        } catch (err) {
            res.status(403).send("Forbidden: Invalid token");
        }
    };
};
```

### Usage

```typescript
// In route definition
const authorize = createAuthorizeMiddleware(new UserService(userRepository));

router.get("/protected-endpoint", authorize, controller.method);
```

### Token Format

Expected header format:
```
Authorization: Bearer <jwt_token>
```

### JWT Verification
- Checks signature with `SECRET_JWT_KEY`
- Validates expiration
- Extracts payload with `{ id, name }`

### Error Responses

| Condition | Status | Message |
|-----------|--------|---------|
| No header | 403 | "Forbidden: No token provided" |
| Invalid format | 403 | "Forbidden: No token provided" |
| Invalid token | 403 | "Forbidden: Invalid token" |
| No payload | 403 | "Forbidden: Invalid token payload" |
| User not in DB | 403 | "Forbidden: User not found" |

### `req.entity` Assignment
After successful verification:
```typescript
req.entity = {
    id: "user-uuid",
    name: "John Doe",
    isAdmin: false
}
```

This User object is available to subsequent middleware and controllers.

---

## Authorization Middleware

### `checkAdminMiddleware`

**File**: `src/middlewares/check-admin.middleware.ts`

**Purpose**: Verify user has admin role

**Requirements**: Must be used AFTER auth middleware (requires req.entity)

### Implementation

```typescript
export const checkAdminMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const user = req.entity as User;
        
        if (!user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        
        if (!user.isAdmin) {
            res.status(403).json({ message: 'Access denied. Admin privileges required' });
            return;
        }
        
        next();
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
```

### Usage

```typescript
const adminOnly = [authorize, checkAdminMiddleware];

router.post('/products', adminOnly, createProduct);
router.put('/products/:id', adminOnly, updateProduct);
router.delete('/products/:id', adminOnly, deleteProduct);
```

### Error Responses

| Condition | Status | Message |
|-----------|--------|---------|
| No user (req.entity) | 401 | "User not authenticated" |
| User not admin | 403 | "Access denied. Admin privileges required" |
| Error | 500 | "Internal server error" |

---

### `isOrderOwnerMiddleware`

**File**: `src/middlewares/is-order-owner.middleware.ts`

**Purpose**: Verify user owns the order they're trying to modify

**Requirements**: Must be used AFTER auth middleware

### Implementation

```typescript
export const isOrderOwnerMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = req.entity as User;
        const orderId = req.params.id;
        
        // Fetch order and check ownership
        const order = await orderRepository.findOne({
            where: { id: orderId },
            relations: ['user']
        });
        
        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        
        if (order.user.id !== user.id) {
            res.status(403).json({ message: 'You do not own this order' });
            return;
        }
        
        next();
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
```

### Usage

```typescript
const authorizeAndCheckOwner = [authorize, isOrderOwnerMiddleware];

router.post('/orders/:id/items', 
    authorizeAndCheckOwner,
    addItemToOrder
);
```

### Error Responses

| Condition | Status | Message |
|-----------|--------|---------|
| Order not found | 404 | "Order not found" |
| User doesn't own order | 403 | "You do not own this order" |
| Error | 500 | "Internal server error" |

---

## Middleware Stacking

Multiple middleware can be combined in routes:

```typescript
// Basic authentication
router.get('/my-orders', authorize, getMyOrders);

// With admin check
router.post('/products', 
    authorize, 
    checkAdminMiddleware, 
    createProduct
);

// With ownership check
router.put('/orders/:id/items/:itemId',
    authorize,
    isOrderOwnerMiddleware,
    updateItemQuantity
);

// Named middleware stack
const adminOnly = [authorize, checkAdminMiddleware];
const ownerOrAdmin = [authorize, isOrderOwnerMiddleware];

router.delete('/products/:id', adminOnly, deleteProduct);
router.post('/orders/:id/complete', adminOnly, completeOrder);
router.post('/orders/:id/items', ownerOrAdmin, addItem);
```

---

## Middleware Execution Order

Middleware executes in the order specified:

```typescript
// Order matters!
router.delete('/products/:id',
    // 1. Validate ID parameter
    productIdParamValidator,
    handleValidationErrors,
    
    // 2. Authenticate user
    authorize,
    
    // 3. Check admin role
    checkAdminMiddleware,
    
    // 4. Execute controller
    deleteProduct
);
```

If any middleware rejects (calls res.send/json without calling next), 
subsequent middleware is skipped.

---

## Built-in Express Middleware

Also configured in `server.ts`:

```typescript
// CORS middleware
app.use(cors());

// Request logging
app.use((req, res, next) => {
    console.log("Incoming request:", req.method, req.url);
    next();
});

// Body parsing
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Passport OAuth
app.use(passport.initialize());

// CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});
```

---

## Validation Middleware

### Using express-validator

```typescript
import { body, param, validationResult } from 'express-validator';

// Define validators
export const createProductValidators = [
    body('name').isString().notEmpty(),
    body('price').isFloat({ min: 0 }).notEmpty(),
    body('category').isString().notEmpty(),
    body('image').isURL().notEmpty()
];

// Validation error handler
export const handleValidationErrors = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Usage in route
router.post('/products',
    createProductValidators,
    handleValidationErrors,
    createProduct
);
```

---

## Custom Request Type Extension

**File**: `src/types/express.d.ts`

```typescript
declare global {
    namespace Express {
        interface Request {
            entity?: User;  // Populated by auth middleware
        }
    }
}
```

This allows TypeScript to recognize `req.entity` as valid.

---

## Error Handling Best Practices

### Always call next() on success
```typescript
if (authorized) {
    next();  // Required!
} else {
    res.status(403).json({ error: "Unauthorized" });
    return;
}
```

### Catch all errors
```typescript
try {
    const user = await userService.getUser();
    req.entity = user;
    next();
} catch (error) {
    res.status(500).json({ message: "Internal server error" });
}
```

### Return early after sending response
```typescript
if (!token) {
    res.status(403).send("No token");
    return;  // Prevent continue
}
```

---

## Performance Considerations

1. **Middleware Order**: Expensive operations later in chain
2. **Early Validation**: Validate format before database queries
3. **Caching**: Cache user lookups if possible
4. **Async Operations**: Use async/await properly

---

## Testing Middleware

### Mock Request/Response

```typescript
const mockReq = {
    headers: { authorization: 'Bearer token' },
    entity: null
} as Request;

const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
} as unknown as Response;

const mockNext = jest.fn();

await middleware(mockReq, mockRes, mockNext);
```

---

## Related Documentation

- [Authentication Module](./AUTH.md)
- [User Module](./USER.md)
- [Express Validator Docs](https://express-validator.github.io/docs/)

---

## Security Checklist

- [ ] All endpoints verify JWT token
- [ ] Admin endpoints check isAdmin flag
- [ ] Order endpoints verify ownership
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] CORS properly configured for frontend domain
- [ ] JWT secret strong and secure
- [ ] Passwords never logged
