# Deployment Quick Start Guide

## 🚀 Development - Run Both Apps

### Single Command (Recommended)
```bash
npm run dev:all
```

This starts:
- ✅ Main app on http://localhost:5173
- ✅ YourStop on http://localhost:3000

### Separate Commands
```bash
# Terminal 1 - Main app
npm run dev

# Terminal 2 - YourStop
npm run dev:yourstop
```

---

## 📦 Production Builds

### Build Both Apps
```bash
npm run build:all
```

### Build Separately
```bash
# Main app
npm run build

# YourStop
npm run build:yourstop
```

---

## 🌐 Deployment Options

### Option 1: Separate Deployments (Recommended)

#### Deploy Main App
```bash
npm run build
# Deploy dist/ folder to:
# - Vercel
# - Netlify
# - AWS S3 + CloudFront
# - Firebase Hosting
# - Custom server
```

#### Deploy YourStop
```bash
cd src/yourstop/frontend
npm run build
# Deploy .next/ folder to:
# - Vercel (recommended for Next.js)
# - Netlify
# - Custom server with Node.js
```

**URLs**:
- Main app: `https://app.yourdomain.com`
- YourStop: `https://yourstop.yourdomain.com`

---

### Option 2: Combined Deployment (Same Domain)

#### Using Docker Compose
```bash
docker-compose up -d
```

This starts:
- Main app on port 5173
- YourStop on port 3000
- Nginx reverse proxy on port 80

**URLs**:
- Main app: `http://yourdomain.com`
- YourStop: `http://yourdomain.com/yourstop`

#### Using Nginx (Manual)
1. Build both apps
2. Configure nginx (see `nginx.conf`)
3. Deploy both builds
4. Start nginx

---

### Option 3: Static Export (YourStop Only)

For simple hosting without Next.js server:

```bash
cd src/yourstop/frontend
npm run build:static
# Deploy out/ folder to any static host
```

**Note**: This disables Next.js API routes and server features.

---

## 🔧 Environment Setup

### Main App (.env)
```env
VITE_FIREBASE_PROJECT_ID=your-main-project
VITE_FIREBASE_API_KEY=your-main-api-key
```

### YourStop (.env.local in src/yourstop/frontend/)
```env
NEXT_PUBLIC_CUSTOMER_FIREBASE_PROJECT_ID=yourstop-customers
NEXT_PUBLIC_CUSTOMER_FIREBASE_API_KEY=yourstop-api-key
NEXT_PUBLIC_CUSTOMER_FIREBASE_AUTH_DOMAIN=customers.yourdomain.com
NEXT_PUBLIC_CUSTOMER_FIREBASE_DATABASE_URL=https://yourstop-customers-default-rtdb.firebaseio.com
```

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Set all environment variables
- [ ] Test builds locally
- [ ] Configure Firebase projects
- [ ] Set up security rules
- [ ] Test authentication

### Main App Deployment
- [ ] `npm run build`
- [ ] Test `npm run preview`
- [ ] Deploy `dist/` folder
- [ ] Configure domain
- [ ] Test production build

### YourStop Deployment
- [ ] `cd src/yourstop/frontend && npm run build`
- [ ] Test `npm start`
- [ ] Deploy `.next/` or `out/` folder
- [ ] Configure domain
- [ ] Test production build
- [ ] Deploy Firestore rules

### Post-Deployment
- [ ] Test all routes
- [ ] Test authentication
- [ ] Test bookings
- [ ] Monitor errors
- [ ] Set up analytics

---

## 🎯 Quick Reference

| Command | Description |
|---------|-------------|
| `npm run dev:all` | Run both apps in development |
| `npm run dev` | Run main app only |
| `npm run dev:yourstop` | Run YourStop only |
| `npm run build:all` | Build both apps |
| `npm run build` | Build main app only |
| `npm run build:yourstop` | Build YourStop only |

---

## 📚 Full Documentation

See `DEPLOYMENT_OPTIONS.md` for detailed deployment configurations.

