# 🚀 Book My Table - Setup Guide for Manager

## 📋 Prerequisites

Before running the website, ensure the following are installed on your system:

### 1. **Node.js** (Required)
- **Version**: Node.js 18.x or higher
- **Download**: https://nodejs.org/
- **Verify Installation**: Open terminal/command prompt and run:
  ```bash
  node --version
  npm --version
  ```

### 2. **Git** (Required)
- **Download**: https://git-scm.com/
- **Verify Installation**: Run:
  ```bash
  git --version
  ```

### 3. **Code Editor** (Recommended)
- **VS Code**: https://code.visualstudio.com/
- **Or any editor of choice**

## 🛠️ Setup Instructions

### Step 1: Extract the Project
1. Extract the zip file to a folder (e.g., `Book_My_Table_2`)
2. Open terminal/command prompt
3. Navigate to the project folder:
   ```bash
   cd Book_My_Table_2
   ```

### Step 2: Install Dependencies

#### Backend Setup
```bash
cd backend
npm install
```

#### Frontend Setup
```bash
cd ../frontend
npm install
```

### Step 3: Environment Configuration

#### Backend Environment
1. Navigate to backend folder:
   ```bash
   cd backend
   ```

2. Create environment file:
   ```bash
   cp env.example .env
   ```

3. Edit `.env` file and add your API keys:
   ```env
   # Google Places API (Required for restaurant data)
   GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
   
   # Foursquare API (Optional - for enhanced data)
   FOURSQUARE_API_KEY=your_foursquare_api_key_here
   
   # Yelp API (Optional - for enhanced data)
   YELP_API_KEY=your_yelp_api_key_here
   
   # Firebase Configuration (Optional - for advanced features)
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_PRIVATE_KEY=your_firebase_private_key
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   ```

#### Frontend Environment
1. Navigate to frontend folder:
   ```bash
   cd frontend
   ```

2. Create environment file:
   ```bash
   cp env-template.txt .env.local
   ```

3. Edit `.env.local` file:
   ```env
   # Google Places API (Required)
   NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
   
   # Foursquare API (Optional)
   NEXT_PUBLIC_FOURSQUARE_API_KEY=your_foursquare_api_key_here
   
   # Yelp API (Optional)
   NEXT_PUBLIC_YELP_API_KEY=your_yelp_api_key_here
   ```

### Step 4: Get API Keys (Required)

#### Google Places API (Essential)
1. Go to: https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable "Places API" and "Maps JavaScript API"
4. Create credentials (API Key)
5. Copy the API key to both backend and frontend .env files

#### Optional APIs (For Enhanced Features)
- **Foursquare**: https://developer.foursquare.com/
- **Yelp**: https://www.yelp.com/developers/

### Step 5: Run the Application

#### Start Backend Server
```bash
cd backend
npm run dev
```
The backend will run on: http://localhost:3000

#### Start Frontend Server (New Terminal)
```bash
cd frontend
npm run dev
```
The frontend will run on: http://localhost:3000 (or 3001 if 3000 is occupied)

### Step 6: Access the Website
Open your browser and go to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3000/api/restaurants

## 🎯 Quick Start (Minimal Setup)

If you want to run the website quickly without API keys:

1. **Install dependencies** (as shown above)
2. **Skip environment setup** - the app will work with placeholder data
3. **Run both servers**:
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend  
   cd frontend && npm run dev
   ```

## 🔧 Troubleshooting

### Common Issues:

#### 1. Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- --port 3001
```

#### 2. Node Modules Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 3. Permission Issues (Mac/Linux)
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

#### 4. Windows Issues
- Use **Command Prompt as Administrator**
- Or use **PowerShell**
- Install **Windows Build Tools**: `npm install --global windows-build-tools`

## 📱 Features Available

### Without API Keys:
- ✅ Restaurant listing with sample data
- ✅ Search functionality
- ✅ Restaurant detail pages
- ✅ Responsive design
- ✅ Basic booking interface

### With API Keys:
- ✅ Real restaurant data from Google Places
- ✅ Enhanced restaurant information
- ✅ High-quality restaurant photos
- ✅ Accurate ratings and reviews
- ✅ Location-based search

## 🚀 Production Deployment

For production deployment, consider:
- **Vercel** (Frontend): https://vercel.com/
- **Railway** (Backend): https://railway.app/
- **Heroku** (Backend): https://heroku.com/

## 📞 Support

If you encounter any issues:
1. Check the terminal for error messages
2. Ensure all dependencies are installed
3. Verify API keys are correctly set
4. Check if ports 3000 and 3001 are available

## 📁 Project Structure

```
Book_My_Table_2/
├── backend/           # Node.js/Express API server
├── frontend/          # Next.js React application
├── docs/             # Documentation
├── data/             # Sample restaurant data
└── README.md         # Main project documentation
```

---

**Note**: The website is fully functional even without API keys, using sample data. Adding API keys enhances the experience with real restaurant data and photos.
