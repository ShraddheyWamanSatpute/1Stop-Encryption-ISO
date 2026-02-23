# NPM Scripts Setup Complete ✅

## What Was Set Up

Custom npm scripts have been configured for development, testing, and production deployments for all three applications:

1. **Main App** - React + Vite application
2. **YourStop** - Next.js customer booking application  
3. **ESS** - Employee Self Service portal (optimized build)

---

## 📦 New Dependencies Added

- `concurrently` - For running multiple dev servers simultaneously

---

## 🚀 Available Scripts

### Development
- `npm run dev` / `npm run dev:main` - Start main app (port 5173)
- `npm run dev:ess` - Start ESS-optimized dev server (port 5174)
- `npm run dev:yourstop` - Start YourStop (port 3000)
- `npm run dev:all` - Start main app + YourStop together

### Testing
- `npm run test:main` - Test main app (lint + type check + build)
- `npm run test:ess` - Test ESS (lint + type check + build)
- `npm run test:yourstop` - Test YourStop (type check)
- `npm run test:all` - Test all applications

### Building
- `npm run build:main` - Build main app → `dist/`
- `npm run build:ess` - Build ESS → `dist-ess/`
- `npm run build:yourstop` - Build YourStop → `.next/` or `out/`
- `npm run build:all` - Build all applications

### Deployment
- `npm run deploy:main` - Build + instructions for main app
- `npm run deploy:ess` - Build + instructions for ESS
- `npm run deploy:yourstop` - Build + instructions for YourStop
- `npm run deploy:all` - Build all + deployment instructions

### Cleanup
- `npm run clean` - Clean main app artifacts
- `npm run clean:ess` - Clean ESS artifacts
- `npm run clean:yourstop` - Clean YourStop artifacts
- `npm run clean:all` - Clean all artifacts

### Installation
- `npm run install:all` - Install dependencies for all apps

---

## 📁 New Files Created

1. **`vite.config.ess.ts`** - ESS-specific Vite configuration
   - Outputs to `dist-ess/`
   - Runs on port 5174
   - Optimized for ESS routes

2. **`scripts/clean.cjs`** - Cross-platform clean script
   - Works on Windows, macOS, and Linux
   - Safely removes build directories

3. **`NPM_SCRIPTS_GUIDE.md`** - Comprehensive documentation
   - All scripts explained
   - Usage examples
   - Troubleshooting guide

4. **`src/yourstop/frontend/package.json`** - Updated with standard Next.js scripts
   - Added `dev`, `build`, `start`, `lint` scripts

---

## 🎯 Quick Start

### Daily Development
```bash
# Start everything
npm run dev:all

# Or individually
npm run dev:main
npm run dev:yourstop
npm run dev:ess
```

### Before Production
```bash
# Test everything
npm run test:all

# Build everything
npm run build:all

# Clean old builds
npm run clean:all
```

### Deploy to Production
```bash
# Deploy main app
npm run deploy:main
# → Deploy dist/ folder

# Deploy ESS
npm run deploy:ess
# → Deploy dist-ess/ folder

# Deploy YourStop
npm run deploy:yourstop
# → Deploy .next/ or out/ folder
```

---

## 📝 Next Steps

1. **Install dependencies** (if not already done):
   ```bash
   npm run install:all
   ```

2. **Test the scripts**:
   ```bash
   npm run dev:all
   ```

3. **Review the guide**:
   - See `NPM_SCRIPTS_GUIDE.md` for detailed documentation

---

## ⚠️ Important Notes

- **ESS Build**: The ESS build outputs to `dist-ess/` (separate from main app's `dist/`)
- **YourStop**: Requires separate dependencies installation in `src/yourstop/frontend/`
- **Ports**: 
  - Main app: 5173
  - ESS: 5174
  - YourStop: 3000
- **Windows Compatibility**: All scripts are cross-platform compatible

---

## 🔧 Troubleshooting

If you encounter issues:

1. **Port conflicts**: Change ports in config files
2. **Missing dependencies**: Run `npm run install:all`
3. **Build errors**: Run `npm run clean:all` then rebuild
4. **Type errors**: Run `npm run test:all` to identify issues

For more help, see `NPM_SCRIPTS_GUIDE.md`.
