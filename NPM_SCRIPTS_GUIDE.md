# NPM Scripts Guide

This guide explains all available npm scripts for development, testing, and production deployments.

## 📋 Overview

The project consists of three main applications:
- **Main App**: React + Vite application (default port 5173)
- **YourStop**: Next.js customer booking application (port 3000)
- **ESS**: Employee Self Service portal (part of main app, accessible at `/ESS`)

---

## 🚀 Development Scripts

### Main App Development

```bash
# Start main app dev server
npm run dev
# or
npm run dev:main
```

**Port**: `http://localhost:5173`

### ESS Development

```bash
# Start ESS-specific dev server (optimized for ESS routes)
npm run dev:ess
```

**Port**: `http://localhost:5174` (opens at `/ESS`)

### YourStop Development

```bash
# Start YourStop dev server
npm run dev:yourstop
```

**Port**: `http://localhost:3000`

### Run All Apps Together

```bash
# Start main app and YourStop simultaneously
npm run dev:all
```

This uses `concurrently` to run both servers with color-coded output:
- **MAIN** (blue): Main app on port 5173
- **YOURSTOP** (green): YourStop on port 3000

---

## 🧪 Testing Scripts

### Type Checking & Linting

```bash
# Lint main app
npm run lint

# Lint and auto-fix
npm run lint:fix

# Test main app (lint + type check + build check)
npm run test:main

# Test ESS (lint + type check + build check)
npm run test:ess

# Test YourStop (type check only)
npm run test:yourstop

# Test all applications
npm run test:all
```

---

## 📦 Build Scripts

### Production Builds

```bash
# Build main app
npm run build
# or
npm run build:main

# Build ESS (outputs to dist-ess/)
npm run build:ess

# Build YourStop
npm run build:yourstop

# Build all applications
npm run build:all
```

### Build with Type Checking

```bash
# Build main app with type checking
npm run build:check:main

# Build ESS with type checking
npm run build:check:ess

# Build YourStop with type checking
npm run build:check:yourstop

# Build all with type checking
npm run build:check:all
```

**Output Directories**:
- Main app: `dist/`
- ESS: `dist-ess/`
- YourStop: `src/yourstop/frontend/.next/` or `src/yourstop/frontend/out/` (if static export)

---

## 👀 Preview Scripts

Preview production builds locally:

```bash
# Preview main app build
npm run preview
# or
npm run preview:main

# Preview ESS build
npm run preview:ess

# Preview YourStop build (requires build first)
npm run preview:yourstop
```

---

## 🚢 Deployment Scripts

These scripts build the applications and provide deployment instructions:

```bash
# Deploy main app
npm run deploy:main
# Output: dist/ folder ready for deployment

# Deploy ESS
npm run deploy:ess
# Output: dist-ess/ folder ready for deployment

# Deploy YourStop
npm run deploy:yourstop
# Output: .next/ or out/ folder ready for deployment

# Deploy all applications
npm run deploy:all
```

### Deployment Targets

#### Main App & ESS
Deploy the `dist/` or `dist-ess/` folder to:
- **Vercel**: Connect repo or deploy via CLI
- **Netlify**: Drag & drop or connect repo
- **Firebase Hosting**: `firebase deploy --only hosting`
- **AWS S3 + CloudFront**: Upload to S3 bucket
- **Custom Server**: Copy files to web server

#### YourStop
Deploy the `.next/` folder (or `out/` for static export) to:
- **Vercel** (recommended for Next.js): Auto-detects Next.js
- **Netlify**: Configure as Next.js site
- **Custom Node.js Server**: Run `npm start` in production

---

## 🧹 Cleanup Scripts

```bash
# Clean main app build artifacts
npm run clean

# Clean ESS build artifacts
npm run clean:ess

# Clean YourStop build artifacts
npm run clean:yourstop

# Clean all build artifacts
npm run clean:all
```

---

## 📥 Installation Scripts

```bash
# Install dependencies for all applications
npm run install:all
```

This installs:
1. Main app dependencies (root `node_modules/`)
2. YourStop dependencies (`src/yourstop/frontend/node_modules/`)

---

## 🔧 Environment Variables

### Main App & ESS
Create `.env` file in project root:
```env
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_API_KEY=your-api-key
# ... other VITE_ prefixed variables
```

### YourStop
Create `.env.local` in `src/yourstop/frontend/`:
```env
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
# ... other NEXT_PUBLIC_ prefixed variables
```

---

## 📝 Quick Reference

### Daily Development
```bash
# Start everything
npm run dev:all

# Or start individually
npm run dev:main      # Main app only
npm run dev:yourstop  # YourStop only
npm run dev:ess       # ESS optimized
```

### Before Committing
```bash
# Run all tests
npm run test:all

# Or individually
npm run test:main
npm run test:ess
npm run test:yourstop
```

### Production Deployment
```bash
# Build everything
npm run build:all

# Or build individually
npm run build:main
npm run build:ess
npm run build:yourstop
```

---

## 🐛 Troubleshooting

### Port Already in Use
If port 5173 or 3000 is already in use:
- **Main app**: Change port in `vite.config.ts` server.port
- **YourStop**: Change port in `src/yourstop/frontend/package.json` dev script: `next dev -p 3001`

### Build Failures
1. Run `npm run clean:all` to remove old build artifacts
2. Run `npm run install:all` to ensure all dependencies are installed
3. Check for TypeScript errors: `npm run test:all`

### Concurrently Not Found
If `dev:all` fails, install dependencies:
```bash
npm install
```

---

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Quick Start Guide](./QUICK_START.md)
