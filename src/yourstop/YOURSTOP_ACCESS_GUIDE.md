# YourStop Access Guide

## 🚀 How to Access YourStop

YourStop is a **separate Next.js application** that runs independently from the main React app. Here's how to access it:

## Option 1: Direct Access (Recommended for Development)

### Step 1: Start the YourStop Next.js Server

Open a terminal and navigate to the YourStop frontend directory:

```bash
cd src/yourstop/frontend
npm run dev
```

This will start the Next.js development server on **http://localhost:3000**

### Step 2: Access YourStop

Open your browser and navigate to:
- **http://localhost:3000** (Direct access)
- Or **http://localhost:5173/YourStop** (via main app redirect)

## Option 2: Via Main App Route (With Proxy)

The main app now has a route configured that will redirect to YourStop:

1. Start the main app: `npm run dev` (port 5173)
2. Start YourStop: `cd src/yourstop/frontend && npm run dev` (port 3000)
3. Navigate to: **http://localhost:5173/YourStop**

The route will automatically redirect to the YourStop Next.js app.

## 🔧 Configuration

### Vite Proxy (Already Configured)

The `vite.config.ts` has been updated with a proxy configuration:

```typescript
server: {
  proxy: {
    '/yourstop': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/yourstop/, ''),
    },
  },
}
```

This allows the main app to proxy requests to the YourStop Next.js app.

### Route Handler

A route handler has been added to `src/frontend/pages/YourStop.tsx` that:
- Redirects to the Next.js app in development
- Can be configured for production deployment

## 📋 Quick Start Commands

### Development (Two Terminals Required)

**Terminal 1 - Main App:**
```bash
npm run dev
# Runs on http://localhost:5173
```

**Terminal 2 - YourStop:**
```bash
cd src/yourstop/frontend
npm run dev
# Runs on http://localhost:3000
```

### Access URLs

- Main App: http://localhost:5173
- YourStop (Direct): http://localhost:3000
- YourStop (via Main App): http://localhost:5173/YourStop

## 🐛 Troubleshooting

### Issue: "Cannot GET /yourstop"

**Solution**: Make sure the YourStop Next.js server is running on port 3000.

```bash
cd src/yourstop/frontend
npm run dev
```

### Issue: Proxy Not Working

**Solution**: 
1. Check that both servers are running
2. Verify the proxy configuration in `vite.config.ts`
3. Try accessing directly at http://localhost:3000

### Issue: Port 3000 Already in Use

**Solution**: Change the YourStop port in `src/yourstop/frontend/package.json`:

```json
{
  "scripts": {
    "dev": "next dev --turbopack -p 3001"
  }
}
```

Then update the proxy target in `vite.config.ts` to `http://localhost:3001`.

## 🚀 Production Deployment

For production, you have several options:

### Option 1: Separate Deployment
- Deploy YourStop as a separate Next.js app (Vercel, Netlify, etc.)
- Deploy main app separately
- Use subdomain: `yourstop.yourdomain.com`

### Option 2: Integrated Deployment
- Build YourStop as static export
- Serve from main app's public folder
- Use route handling in main app

### Option 3: Reverse Proxy
- Use nginx or similar to route `/yourstop/*` to Next.js app
- Both apps on same domain

## 📝 Current Setup

- **Main App**: React + Vite (port 5173)
- **YourStop**: Next.js (port 3000)
- **Route**: `/YourStop` redirects to Next.js app
- **Proxy**: Configured in `vite.config.ts`

## ✅ Verification Checklist

- [ ] YourStop Next.js server is running on port 3000
- [ ] Main app is running on port 5173
- [ ] Can access http://localhost:3000 directly
- [ ] Can access http://localhost:5173/YourStop (redirects)
- [ ] No console errors

---

**Note**: The YourStop app is completely separate with its own:
- ✅ Authentication system (`customerAuth`)
- ✅ Database collections (`customer*`)
- ✅ Security rules
- ✅ API routes

This separation ensures complete isolation from the main app.

