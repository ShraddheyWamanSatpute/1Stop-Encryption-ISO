# JWT RS256 Migration Guide

## Overview

The YourStop backend has been upgraded from HS256 (symmetric) to RS256 (asymmetric) JWT signing for enhanced security and compliance with ISO 27001, PCI DSS, and SOC 2 standards.

## What Changed

### Before (HS256)
- Used a single secret key (`JWT_SECRET`)
- Symmetric algorithm (same key for signing and verification)
- Acceptable for internal services but less secure

### After (RS256)
- Uses RSA key pair (`JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY`)
- Asymmetric algorithm (private key for signing, public key for verification)
- Industry standard for distributed systems
- Better key management and security

## Migration Steps

### 1. Generate RSA Key Pair

Run the key generation script:

```bash
npm run jwt:generate
```

Or directly (if dependencies are installed):

```bash
npx tsx scripts/generate-jwt-keys.ts
```

**Note:** If `tsx` is not installed, the script will use `npx` automatically.

This will create:
- `jwt-private-key.pem` (keep secret!)
- `jwt-public-key.pem` (can be shared)

### 2. Set Environment Variables

Add the keys to your `.env` file or deployment environment:

```bash
# JWT Configuration (RS256)
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...your private key here...
-----END PRIVATE KEY-----"

JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
...your public key here...
-----END PUBLIC KEY-----"
```

**Important:** 
- Keep private key secure (never commit to version control)
- For production, store keys in Firebase Secrets or secure vault
- Public key can be shared (used for token verification)

### 3. Update Deployment Configuration

#### Firebase Secrets (Recommended for Production)

```bash
# Set private key
firebase functions:secrets:set JWT_PRIVATE_KEY

# Set public key
firebase functions:secrets:set JWT_PUBLIC_KEY
```

#### Environment Variables (Alternative)

Set `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` in your deployment platform:
- Vercel: Project Settings → Environment Variables
- Heroku: `heroku config:set JWT_PRIVATE_KEY="..."`
- AWS: Parameter Store or Secrets Manager
- Docker: Environment variables in docker-compose.yml

### 4. Verify Migration

1. **Check logs on startup:**
   ```
   ✅ JWT RSA keys loaded successfully (RS256 algorithm)
   ```

2. **Test authentication:**
   - Register a new user
   - Login with credentials
   - Verify JWT token is signed with RS256

3. **Verify token algorithm:**
   ```bash
   # Decode JWT header (use jwt.io or similar)
   # Should show: "alg": "RS256"
   ```

## Backward Compatibility

### Development Mode
- If RSA keys are not found, the system will fall back to `JWT_SECRET` (HS256)
- A warning will be logged: `⚠️ Using legacy JWT_SECRET (HS256)`
- This allows gradual migration in development

### Production Mode
- **RSA keys are required** in production
- System will throw an error if keys are not found
- No fallback to HS256 in production

## Security Best Practices

1. **Key Generation:**
   - Use at least 2048-bit keys (4096-bit recommended for high security)
   - Generate keys on a secure machine
   - Never share private keys

2. **Key Storage:**
   - ✅ Store in Firebase Secrets (production)
   - ✅ Store in environment variables (secure deployment)
   - ✅ Use secure vault (AWS Secrets Manager, HashiCorp Vault)
   - ❌ Never commit to version control
   - ❌ Never store in code or configuration files

3. **Key Rotation:**
   - Rotate keys periodically (recommended: annually)
   - Generate new key pair: `npm run jwt:generate`
   - Update environment variables
   - Old tokens will remain valid until expiry

4. **Key Access:**
   - Limit access to private keys (principle of least privilege)
   - Use separate keys for development and production
   - Monitor key access and usage

## Troubleshooting

### Error: "JWT RSA keys not found"

**Solution:**
1. Generate keys: `npm run jwt:generate`
2. Set environment variables: `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY`
3. Restart the server

### Error: "Invalid RSA key format"

**Solution:**
- Ensure keys are in PEM format
- Check for proper BEGIN/END markers
- Verify no extra whitespace or characters

### Warning: "Using legacy JWT_SECRET"

**Solution:**
- This is acceptable in development
- For production, generate and set RSA keys
- See migration steps above

### Tokens not verifying

**Solution:**
1. Verify public key matches private key
2. Check token algorithm is RS256
3. Ensure keys are properly formatted (PEM)
4. Check token expiration

## Key Generation Options

### Standard (2048-bit)
```bash
npm run jwt:generate
```

### Custom Key Size (4096-bit)
```bash
tsx scripts/generate-jwt-keys.ts --key-size 4096
```

### Custom Output Directory
```bash
tsx scripts/generate-jwt-keys.ts --output-dir ./keys
```

## Compliance

This upgrade ensures compliance with:
- ✅ **ISO 27001 Annex A (Cryptography)** - Strong cryptographic algorithms
- ✅ **PCI DSS Requirement 3** - Protect stored cardholder data
- ✅ **SOC 2 CC6** - Logical and physical access controls
- ✅ **GDPR Article 32** - Security of processing

## Support

For issues or questions:
1. Check this migration guide
2. Review `ENGINEERING_CONTROLS_VERIFICATION.md`
3. Check logs for specific error messages
4. Verify environment variables are set correctly

---

**Last Updated:** January 19, 2025  
**Version:** 1.0.0
