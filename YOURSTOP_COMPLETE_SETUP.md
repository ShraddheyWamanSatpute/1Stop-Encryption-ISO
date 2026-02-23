# YourStop Complete Setup & Deployment Guide

## ✅ What's Been Implemented

### Features
- ✅ Optimized restaurant loading (3 pages initially, lazy load more)
- ✅ Separate customer authentication & database
- ✅ Functional bookings section with CRUD
- ✅ Infinite scroll for restaurants
- ✅ Booking modification feature
- ✅ Real-time booking updates
- ✅ Favorites system
- ✅ All Priority 1 upgrades

### Infrastructure
- ✅ Separate Firebase instance for customers
- ✅ Separate Firestore collections
- ✅ Security rules for customer data
- ✅ Route integration with main app
- ✅ Development scripts for both apps

---

## 🚀 Development Commands

### Run Both Apps Together (Recommended)
```bash
npm run dev:all
```

**What it does**:
- Starts main app on http://localhost:5173
- Starts YourStop on http://localhost:3000
- Color-coded output (blue for main, green for YourStop)

### Run Apps Separately

**Main App Only**:
```bash
npm run dev
# Runs on http://localhost:5173
```

**YourStop Only**:
```bash
npm run dev:yourstop
# Runs on http://localhost:3000
```

### First Time Setup
```bash
# Windows
.\setup-dev.ps1

# Linux/Mac
chmod +x setup-dev.sh
./setup-dev.sh
```

This installs dependencies for both apps.

---

## 📦 Build Commands

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

**Best for**: Production, scalability, independent updates

#### Main App
- **Build**: `npm run build`
- **Output**: `dist/` folder
- **Deploy to**: Vercel, Netlify, AWS, Firebase Hosting, or custom server
- **URL**: `https://app.yourdomain.com`

#### YourStop
- **Build**: `cd src/yourstop/frontend && npm run build`
- **Output**: `.next/` folder (or `out/` for static)
- **Deploy to**: Vercel (recommended), Netlify, or custom Node.js server
- **URL**: `https://yourstop.yourdomain.com` or `https://yourdomain.com/yourstop`

**Benefits**:
- ✅ Complete independence
- ✅ Separate scaling
- ✅ Independent deployments
- ✅ Different domains/subdomains

---

### Option 2: Combined Deployment (Same Domain)

**Best for**: Unified experience, single domain

#### Using Docker Compose
```bash
docker-compose up -d
```

**Configuration**:
- Main app: Port 5173
- YourStop: Port 3000
- Nginx: Port 80 (reverse proxy)

**URLs**:
- Main app: `http://yourdomain.com`
- YourStop: `http://yourdomain.com/yourstop`

#### Using Nginx (Manual)
1. Build both apps: `npm run build:all`
2. Configure nginx (see `nginx.conf`)
3. Deploy both builds
4. Start nginx

---

### Option 3: Static Export (YourStop)

**Best for**: Simple hosting, CDN distribution

```bash
cd src/yourstop/frontend
npm run build:static
# Deploy out/ folder to any static host
```

**Note**: Disables Next.js API routes and server features.

---

## 📋 Available npm Scripts

### Development
| Command | Description |
|---------|-------------|
| `npm run dev` | Run main app only |
| `npm run dev:yourstop` | Run YourStop only |
| `npm run dev:all` | **Run both apps together** |

### Build
| Command | Description |
|---------|-------------|
| `npm run build` | Build main app only |
| `npm run build:yourstop` | Build YourStop only |
| `npm run build:all` | **Build both apps** |

### Preview
| Command | Description |
|---------|-------------|
| `npm run preview` | Preview main app build |
| `npm run preview:all` | Preview both apps |

---

## 🔧 Configuration Files

### Main App
- `vite.config.ts` - Vite config with YourStop proxy
- `package.json` - Scripts for running both apps
- `vercel.json` - Vercel deployment config
- `Dockerfile.main` - Docker config for main app

### YourStop
- `src/yourstop/frontend/next.config.ts` - Next.js config
- `src/yourstop/frontend/next.config.production.ts` - Production config
- `src/yourstop/frontend/Dockerfile` - Docker config
- `src/yourstop/vercel.json` - Vercel deployment config

### Combined
- `docker-compose.yml` - Docker Compose for both apps
- `nginx.conf` - Nginx reverse proxy config

---

## 🎯 Quick Start

### 1. Install Dependencies
```bash
npm install
cd src/yourstop/frontend && npm install
```

### 2. Start Development
```bash
npm run dev:all
```

### 3. Access Apps
- Main app: http://localhost:5173
- YourStop: http://localhost:3000
- YourStop (via main): http://localhost:5173/YourStop

---

## 📚 Documentation Files

- `DEPLOYMENT_OPTIONS.md` - Detailed deployment configurations
- `DEPLOYMENT_QUICK_START.md` - Quick reference guide
- `YOURSTOP_ACCESS_GUIDE.md` - Access instructions
- `CUSTOMER_AUTH_AND_DATABASE_SEPARATION.md` - Auth/DB separation details
- `ALL_UPGRADES_IMPLEMENTED.md` - Feature implementation summary

---

## ✅ Summary

**Development**: Use `npm run dev:all` to run both apps

**Deployment**: Choose from:
1. **Separate** (recommended) - Deploy independently
2. **Combined** - Deploy together with reverse proxy
3. **Static** - Export YourStop as static files

All options are configured and ready to use!

