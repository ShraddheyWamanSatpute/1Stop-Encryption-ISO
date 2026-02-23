# 🍽️ Book My Table - Restaurant Discovery Platform

## 🚀 Quick Start (3 Steps)

### 1. Prerequisites
- **Node.js 18+**: Download from https://nodejs.org/
- **Git**: Download from https://git-scm.com/

### 2. Install Dependencies
```bash
# Option A: Use the quick start script
# Windows: Double-click QUICK_START.bat
# Mac/Linux: Run ./QUICK_START.sh

# Option B: Manual installation
npm run install:all
```

### 3. Run the Application
```bash
# Start both backend and frontend
npm run dev

# Or start separately:
# Terminal 1: npm run dev:backend
# Terminal 2: npm run dev:frontend
```

### 4. Open Browser
Go to: **http://localhost:3000**

---

## 📋 What You'll See

### Without API Keys (Default)
- ✅ Restaurant listings with sample data
- ✅ Search and filter functionality
- ✅ Restaurant detail pages
- ✅ Responsive design for all devices
- ✅ Booking interface

### With API Keys (Enhanced)
- ✅ Real restaurant data from Google Places
- ✅ High-quality restaurant photos
- ✅ Accurate ratings and reviews
- ✅ Location-based search

---

## 🔧 Adding API Keys (Optional)

### Google Places API (Recommended)
1. Go to: https://console.cloud.google.com/
2. Enable "Places API"
3. Create API key
4. Add to both files:
   - `backend/.env`: `GOOGLE_PLACES_API_KEY=your_key`
   - `frontend/.env.local`: `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_key`

---

## 📱 Features

- **Restaurant Discovery**: Browse thousands of restaurants
- **Smart Search**: Find restaurants by cuisine, location, or name
- **Detailed Information**: Photos, ratings, reviews, contact info
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Booking System**: Make reservations (UI ready)
- **Modern UI**: Clean, intuitive interface

---

## 🆘 Need Help?

1. **Check the detailed guide**: `SETUP_GUIDE_FOR_MANAGER.md`
2. **Common issues**:
   - Port 3000 in use? Try `npx kill-port 3000`
   - Node modules issues? Delete `node_modules` and run `npm install` again
3. **Error messages**: Check the terminal output for specific errors

---

## 📁 Project Structure

```
Book_My_Table_2/
├── backend/              # API server (Node.js/Express)
├── frontend/             # Web app (Next.js/React)
├── SETUP_GUIDE_FOR_MANAGER.md  # Detailed setup instructions
├── QUICK_START.bat       # Windows quick start
├── QUICK_START.sh        # Mac/Linux quick start
└── README_MANAGER.md     # This file
```

---

**Ready to explore restaurants? Just run `npm run dev` and open http://localhost:3000! 🎉**
