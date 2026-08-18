# Authentication Module

## Overview

The Authentication module handles user identity verification and OAuth 2.0 integration with Google. It manages user creation, JWT token generation, and session management.

## Files

- `auth.controller.ts` - OAuth callback handler
- `auth.service.ts` - Authentication logic
- `auth.routes.ts` - Route definitions

## Key Features

### Google OAuth 2.0 Integration
- Automated user creation on first login
- First user becomes admin
- Google profile data mapping

### JWT Authentication
- Token generation on login
- Token validation on protected routes
- 1-hour token expiration

### User Management
- Automatic user creation from OAuth profile
- User lookup by ID
- Role assignment (admin/regular user)

---

## AuthService

### Methods

#### `handleGoogleUser(profile: any): Promise<{ user: User, token: string }>`

Processes Google OAuth profile and handles user creation/retrieval.

**Parameters**:
- `profile` - Google OAuth profile object

**Returns**: Object containing User and JWT token

**Logic**:
1. Check if user exists by Google ID
2. If not exists:
   - Check if this is the first user
   - Create user with admin role if first user
   - Otherwise create regular user
3. Generate JWT token
4. Return user and token

**Example**:
```typescript
const { user, token } = await authService.handleGoogleUser(profile);
// user: { id: "google-id", name: "John Doe", isAdmin: false }
// token: "eyJhbGciOiJIUzI1NiIs..."
```

---

#### `verifyToken(token: string): Promise<{ user: User }>`

Verifies JWT token and retrieves associated user.

**Parameters**:
- `token` - JWT token string

**Returns**: Object containing verified User

**Throws**: Error if token invalid or user not found

**Process**:
1. Verify token signature and expiration
2. Extract user ID from token
3. Fetch user from database
4. Return user if found

---

## AuthController

### Methods

#### `googleCallback(req: Request, res: Response): Promise<void>`

Handles Google OAuth callback after user authentication.

**Route**: `GET /auth/google/callback`

**Middleware**: 
- Passport Google OAuth verification
- Automatic authentication

**Response**: HTML page with postMessage

**Logic**:
1. Extract user from OAuth profile
2. Call authService.handleGoogleUser()
3. Send user and token via postMessage to parent window
4. Close OAuth popup window

**Response Format**:
```html
<script>
    window.opener.postMessage(
        { user: {...}, token: "..." },
        'target-origin'
    );
    window.close();
</script>
```

---

## Routes

### `GET /auth/google`

**Description**: Initiate Google OAuth 2.0 flow

**Authentication**: None

**Middleware**: `passport.authenticate("google")`

**Scopes Requested**:
- `profile` - Basic profile info
- `email` - Email address

**Action**: Redirects to Google consent screen

---

### `GET /auth/google/callback`

**Description**: Handle Google OAuth callback

**Authentication**: OAuth token (Passport)

**Handler**: `authController.googleCallback()`

**Response**: HTML with postMessage containing token

---

### `GET /auth/me`

**Description**: Get current authenticated user

**Authentication**: Required (JWT Bearer token)

**Handler**: Validates JWT and returns user info

**Response**:
```json
{
    "error": null,
    "user": {
        "id": "uuid",
        "name": "John Doe",
        "isAdmin": false
    }
}
```

---

## Configuration

### Environment Variables

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT Secret
SECRET_JWT_KEY=your-secret-key-here
```

### Token Configuration

- **Algorithm**: HS256
- **Expiration**: 1 hour
- **Payload**: { id, name }

---

## Passport Configuration

### Google Strategy

```typescript
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
}))
```

**Verification Callback**:
- Receives: accessToken, refreshToken, profile, done callback
- Returns: profile object to req.user

---

## User Creation Logic

When user authenticates via Google for first time:

```
1. Check if user with Google ID exists
2. If NOT exists:
   a. Count existing users
   b. If count === 0: Set isAdmin = true
   c. If count > 0: Set isAdmin = false
   d. Create user in database
3. Generate JWT token
4. Return user object
```

### First User Advantage
The first user to register automatically becomes an admin, allowing them to manage products and discounts.

---

## JWT Token Format

```typescript
Token payload:
{
    id: string,      // User UUID
    name: string,    // User name
    iat: number,     // Issued at
    exp: number      // Expiration time
}
```

## Token Verification

On each protected route request:

1. Extract token from `Authorization: Bearer <token>`
2. Verify signature with `SECRET_JWT_KEY`
3. Check expiration
4. Load user from database
5. Set `req.entity` to user object
6. Proceed or reject based on result

---

## Error Handling

### Missing Token
```
Status: 403
Message: "Forbidden: No token provided"
```

### Invalid Token
```
Status: 403
Message: "Forbidden: Invalid token"
```

### User Not Found
```
Status: 403
Message: "Forbidden: User not found"
```

### Google OAuth Failure
```
Status: 500
Message: "Failed to handle Google user: {error details}"
```

---

## Security Considerations

1. **JWT Secret**: Must be strong and environment-specific
2. **Token Expiration**: 1 hour balances security and UX
3. **HTTPS**: Required in production for OAuth flow
4. **Callback URL**: Must be registered in Google Console
5. **CORS**: Allow frontend origin in production
6. **Session**: No session storage (stateless)

---

## Frontend Integration

### OAuth Flow

```javascript
// 1. Open OAuth popup
const popup = window.open(
    'http://localhost:3000/auth/google',
    'oauth-popup',
    'width=500,height=600'
);

// 2. Listen for token from popup
window.addEventListener('message', (event) => {
    if (event.data.token) {
        // 3. Store token
        localStorage.setItem('token', event.data.token);
        // 4. Use in API calls
    }
});
```

### Using JWT in API Calls

```javascript
// Add to Authorization header
const response = await fetch('http://localhost:3000/products', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
```

---

## Testing

### Test Google Callback

```bash
# Get token from Google OAuth flow
TOKEN="your_jwt_token"

# Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/auth/me
```

### Test Invalid Token

```bash
curl -H "Authorization: Bearer invalid_token" \
    http://localhost:3000/auth/me
# Expected: 403 Forbidden
```

---

## Troubleshooting

### Issue: "Invalid client" error in OAuth
**Solution**: Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env

### Issue: Callback URL mismatch
**Solution**: Ensure GOOGLE_CALLBACK_URL matches Google Console settings

### Issue: Token always invalid
**Solution**: Check SECRET_JWT_KEY is set and consistent

### Issue: First user not admin
**Solution**: Ensure database is empty on first user creation

---

## Future Enhancements

- [ ] OAuth refresh token handling
- [ ] Role-based access control (RBAC)
- [ ] Multi-factor authentication (MFA)
- [ ] Social login with other providers
- [ ] Token rotation mechanism
- [ ] Logout functionality with token blacklist
- [ ] Password-based authentication as fallback

---

Related Documentation:
- [Middleware](./MIDDLEWARE.md) - Auth middleware implementation
- [User Module](./USER.md) - User entity details
- [Database](./DATABASE.md) - User entity schema
