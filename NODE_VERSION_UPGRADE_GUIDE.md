# Node.js Version Upgrade Guide

## ⚠️ Current Status

Your current Node.js version: **v18.20.8**

Firebase packages require: **Node.js >= 20.0.0**

## 📋 Impact

The installation completed successfully, but you may encounter:
- Runtime warnings or errors with Firebase features
- Potential compatibility issues with newer Firebase SDK features
- Missing optimizations available in Node.js 20+

**Good news**: The npm scripts we set up will still work, but upgrading is recommended for best compatibility.

---

## 🚀 Upgrade Options

### Option 1: Using Node Version Manager (nvm) - Recommended

#### Windows (nvm-windows)
1. **Download nvm-windows**:
   - Visit: https://github.com/coreybutler/nvm-windows/releases
   - Download `nvm-setup.exe` and install

2. **Install Node.js 20**:
   ```powershell
   nvm install 20.18.0
   nvm use 20.18.0
   ```

3. **Verify**:
   ```powershell
   node --version
   # Should show: v20.18.0
   ```

#### macOS/Linux (nvm)
```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 20
nvm install 20.18.0
nvm use 20.18.0

# Set as default
nvm alias default 20.18.0
```

### Option 2: Direct Download

1. **Visit**: https://nodejs.org/
2. **Download**: Node.js 20.x LTS (Long Term Support)
3. **Install**: Run the installer
4. **Verify**: 
   ```powershell
   node --version
   ```

### Option 3: Using Chocolatey (Windows)

```powershell
# Install Chocolatey (if not installed)
# Visit: https://chocolatey.org/install

# Install Node.js 20
choco install nodejs-lts --version=20.18.0
```

---

## 🔄 After Upgrading

1. **Reinstall dependencies**:
   ```powershell
   npm run clean:all
   npm run install:all
   ```

2. **Verify no warnings**:
   ```powershell
   npm install
   # Should see no EBADENGINE warnings
   ```

3. **Test the setup**:
   ```powershell
   npm run dev:main
   ```

---

## 🔒 Security Vulnerabilities

After upgrading Node.js, address security vulnerabilities:

```powershell
# Check vulnerabilities
npm audit

# Auto-fix what can be fixed
npm audit fix

# Review critical issues
npm audit --audit-level=high
```

**Note**: Some vulnerabilities may require manual review or dependency updates.

---

## ✅ Quick Checklist

- [ ] Upgrade Node.js to version 20.x
- [ ] Verify: `node --version` shows v20.x
- [ ] Reinstall dependencies: `npm run install:all`
- [ ] Run security audit: `npm audit fix`
- [ ] Test dev server: `npm run dev:main`

---

## 🆘 If You Can't Upgrade Right Now

The scripts will still work, but:

1. **Monitor for issues**: Watch for Firebase-related errors
2. **Test thoroughly**: Ensure all Firebase features work correctly
3. **Plan upgrade**: Schedule Node.js upgrade when possible
4. **Use workaround**: If issues occur, consider using `--ignore-engines` flag (not recommended for production)

```powershell
# Temporary workaround (not recommended)
npm install --ignore-engines
```

---

## 📚 Additional Resources

- [Node.js Download](https://nodejs.org/)
- [nvm-windows](https://github.com/coreybutler/nvm-windows)
- [nvm (macOS/Linux)](https://github.com/nvm-sh/nvm)
- [npm audit documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
