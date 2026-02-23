# Testing Authentication Endpoints

## Quick Test Guide

The server should automatically restart with `tsx watch`. The auth routes are now available at `/api/auth/*`.

---

## Step 1: Register a New User

Open a **new terminal window** (keep the server running) and run:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Important:** Copy the `token` value - you'll need it for the next steps!

---

## Step 2: Verify Token is RS256

1. Copy the token from the registration response
2. Visit: https://jwt.io
3. Paste the token in the "Encoded" section
4. **Verify:**
   - Algorithm shows: **RS256** (not HS256)
   - Token can be decoded
   - Payload contains `userId`

---

## Step 3: Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User"
  },
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Step 4: Verify Token

Replace `YOUR_TOKEN_HERE` with the token from login/register:

```bash
curl -X GET http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

---

## Alternative: Using a REST Client

If you prefer a GUI tool:

### Postman / Insomnia / Thunder Client

**Register:**
- Method: `POST`
- URL: `http://localhost:3001/api/auth/register`
- Headers: `Content-Type: application/json`
- Body (JSON):
```json
{
  "email": "test@example.com",
  "password": "Test123!",
  "name": "Test User"
}
```

**Login:**
- Method: `POST`
- URL: `http://localhost:3001/api/auth/login`
- Headers: `Content-Type: application/json`
- Body (JSON):
```json
{
  "email": "test@example.com",
  "password": "Test123!"
}
```

**Verify Token:**
- Method: `GET`
- URL: `http://localhost:3001/api/auth/verify`
- Headers: 
  - `Authorization: Bearer YOUR_TOKEN_HERE`

---

## Troubleshooting

### Error: "User already exists"
- The user was already registered
- Try a different email or delete the user from the database

### Error: "Invalid email or password"
- Check the email and password are correct
- Note: Password verification may be disabled in development

### Error: "No token provided"
- Make sure you're including the `Authorization: Bearer TOKEN` header
- Check the token is copied correctly (no extra spaces)

### Error: "Invalid or expired token"
- Token may have expired
- Generate a new token by logging in again
- Check the token format is correct

---

## Success Criteria

✅ Registration returns a token  
✅ Token decodes at jwt.io showing **RS256** algorithm  
✅ Login returns a token  
✅ Token verification works  
✅ All endpoints return proper JSON responses  

---

## Next Steps

Once authentication is working:
1. Test protected routes (routes that require authentication)
2. Test token expiration
3. Test error handling
4. Deploy to production with proper environment variables
