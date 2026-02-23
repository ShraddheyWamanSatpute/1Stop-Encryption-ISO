# Deployment Options for 1Stop + YourStop

This document outlines all deployment options for the main 1Stop app and the YourStop customer booking section.

## 🏗️ Architecture Overview

- **Main App**: React + Vite (port 5173 in dev)
- **YourStop**: Next.js (port 3000 in dev)
- **Complete Separation**: Different auth, databases, and deployment options

## 📦 Deployment Scenarios

### Option 1: Separate Deployments (Recommended)

**Best for**: Production, scalability, independent updates

#### Main App Deployment
- **Platform**: Vercel, Netlify, AWS, or custom server
- **Build**: `npm run build`
- **Output**: `dist/` folder
- **URL**: `https://app.yourdomain.com` or `https://yourdomain.com`

#### YourStop Deployment
- **Platform**: Vercel (recommended for Next.js), Netlify, or custom server
- **Build**: `cd src/yourstop/frontend && npm run build`
- **Output**: `.next/` folder (or static export)
- **URL**: `https://yourstop.yourdomain.com` or `https://yourdomain.com/yourstop`

**Benefits**:
- ✅ Independent scaling
- ✅ Separate deployments
- ✅ Different domains/subdomains
- ✅ Independent rollbacks
- ✅ Separate billing/quota

---

### Option 2: Combined Deployment (Single Domain)

**Best for**: Unified experience, simpler domain management

#### Setup Options:

**A. Reverse Proxy (Nginx/Apache)**
```nginx
# Main app
location / {
    proxy_pass http://localhost:5173;
}

# YourStop
location /yourstop {
    proxy_pass http://localhost:3000;
    rewrite ^/yourstop(.*)$ $1 break;
}
```

**B. Vite Proxy (Development)**
Already configured in `vite.config.ts`

**C. Next.js Rewrites (Production)**
Configure Next.js to handle both apps

**Benefits**:
- ✅ Single domain
- ✅ Unified experience
- ✅ Shared cookies (if needed)
- ⚠️ More complex setup
- ⚠️ Coupled deployments

---

### Option 3: Static Export + Integration

**Best for**: Simple hosting, CDN distribution

#### Steps:
1. Build YourStop as static export
2. Copy output to main app's public folder
3. Serve from single server

**Configuration**:
```json
// src/yourstop/frontend/next.config.ts
{
  output: 'export',
  basePath: '/yourstop',
  assetPrefix: '/yourstop'
}
```

**Benefits**:
- ✅ Single deployment
- ✅ Simple hosting
- ✅ Fast CDN distribution
- ⚠️ No Next.js API routes
- ⚠️ No server-side features

---

## 🚀 Development Commands

### Run Both Servers Together
```bash
npm run dev:all
```

This runs:
- Main app on http://localhost:5173
- YourStop on http://localhost:3000

### Run Separately
```bash
# Main app only
npm run dev

# YourStop only
npm run dev:yourstop
```

---

## 📋 Production Build Commands

### Build Both
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

## 🌐 Deployment Configurations

### Vercel Deployment

#### Separate Projects (Recommended)

**Main App** (`vercel.json`):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

**YourStop** (`src/yourstop/vercel.json` - already exists):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "frontend/$1"
    }
  ]
}
```

#### Combined Project
Use Vercel monorepo support or deploy as separate projects with rewrites.

---

### Firebase Hosting

#### Separate Projects

**Main App** (`firebase.json`):
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**YourStop** (`src/yourstop/firebase.json` - already exists):
```json
{
  "hosting": {
    "public": "frontend/out",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

### Docker Deployment

#### Separate Containers

**Main App Dockerfile**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

**YourStop Dockerfile**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY src/yourstop/frontend/package*.json ./
RUN npm install
COPY src/yourstop/frontend .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Docker Compose**:
```yaml
version: '3.8'
services:
  main-app:
    build: .
    ports:
      - "5173:5173"
    environment:
      - NODE_ENV=production
  
  yourstop:
    build:
      context: .
      dockerfile: src/yourstop/frontend/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
```

---

## 🔧 Environment Variables

### Main App
```env
VITE_FIREBASE_PROJECT_ID=your-main-project
VITE_FIREBASE_API_KEY=your-main-api-key
# ... other main app env vars
```

### YourStop
```env
NEXT_PUBLIC_CUSTOMER_FIREBASE_PROJECT_ID=yourstop-customers
NEXT_PUBLIC_CUSTOMER_FIREBASE_API_KEY=yourstop-api-key
# ... other YourStop env vars
```

---

## 📝 Deployment Scripts

### Deploy Main App
```bash
npm run build
# Then deploy dist/ folder to your hosting
```

### Deploy YourStop
```bash
cd src/yourstop/frontend
npm run build
# Then deploy .next/ or out/ folder to your hosting
```

### Deploy Both
```bash
npm run build:all
# Deploy both dist/ and src/yourstop/frontend/.next/
```

---

## 🎯 Recommended Setup

### Development
- Use `npm run dev:all` to run both servers
- Access at http://localhost:5173 and http://localhost:3000

### Production
- **Option A**: Deploy separately (recommended)
  - Main app: `app.yourdomain.com`
  - YourStop: `yourstop.yourdomain.com` or `yourdomain.com/yourstop`
  
- **Option B**: Deploy combined with reverse proxy
  - Single domain: `yourdomain.com`
  - Main app: `yourdomain.com`
  - YourStop: `yourdomain.com/yourstop`

---

## ✅ Deployment Checklist

### Main App
- [ ] Set environment variables
- [ ] Build: `npm run build`
- [ ] Test build: `npm run preview`
- [ ] Deploy `dist/` folder
- [ ] Configure domain/DNS
- [ ] Test production build

### YourStop
- [ ] Set environment variables
- [ ] Build: `cd src/yourstop/frontend && npm run build`
- [ ] Test build: `cd src/yourstop/frontend && npm start`
- [ ] Deploy `.next/` or `out/` folder
- [ ] Configure domain/DNS
- [ ] Test production build
- [ ] Configure Firebase (customer project)
- [ ] Deploy Firestore security rules

### Combined
- [ ] Set up reverse proxy
- [ ] Configure routing
- [ ] Test both apps on same domain
- [ ] Configure SSL certificates
- [ ] Test all routes

---

**Last Updated**: 2024

