# Lightspeed Integration - Multi-Level Support (Company/Site/Subsite)

## ✅ Multi-Level Support Implemented

The Lightspeed integration now supports **three levels** of data isolation and configuration:

1. **Company Level** - Company-wide Lightspeed connection
2. **Site Level** - Site-specific Lightspeed connection
3. **Subsite Level** - Subsite-specific Lightspeed connection

---

## 📊 How It Works

### Settings Storage Paths

Settings are stored at different paths based on the selected level:

#### Company Level
```
companies/{companyId}/settings/lightspeedIntegration
```
- Used when no site or subsite is selected
- Company-wide Lightspeed connection
- All sites/subsites can inherit or override

#### Site Level
```
companies/{companyId}/sites/{siteId}/settings/lightspeedIntegration
```
- Used when a site is selected but no subsite
- Site-specific Lightspeed connection
- Overrides company-level settings for that site

#### Subsite Level
```
companies/{companyId}/sites/{siteId}/subsites/{subsiteId}/settings/lightspeedIntegration
```
- Used when both site and subsite are selected
- Subsite-specific Lightspeed connection
- Overrides site-level and company-level settings

---

### Data Sync Paths

Data syncs to the appropriate level based on selection:

#### Company Level Sync
- **Stock:** `companies/{companyId}/data/stock`
- **POS:** `companies/{companyId}/data/pos`

#### Site Level Sync
- **Stock:** `companies/{companyId}/sites/{siteId}/data/stock`
- **POS:** `companies/{companyId}/sites/{siteId}/data/pos`

#### Subsite Level Sync
- **Stock:** `companies/{companyId}/sites/{siteId}/subsites/{subsiteId}/data/stock`
- **POS:** `companies/{companyId}/sites/{siteId}/subsites/{subsiteId}/data/pos`

---

## 🎯 Use Cases

### Scenario 1: Company-Wide Integration
**Setup:** Company has one Lightspeed account for all locations

- Select **Company** level (no site/subsite selected)
- Connect Lightspeed account
- Sync data to company level
- All sites/subsites can access the synced data

### Scenario 2: Site-Specific Integration
**Setup:** Each site has its own Lightspeed account

- Select a **Site**
- Connect that site's Lightspeed account
- Sync data to that site's database
- Other sites remain independent

### Scenario 3: Subsite-Specific Integration
**Setup:** Each subsite (e.g., different departments) has its own Lightspeed account

- Select a **Site** and **Subsite**
- Connect that subsite's Lightspeed account
- Sync data to that subsite's database
- Other subsites remain independent

### Scenario 4: Mixed Setup
**Setup:** Some sites use company account, others have their own

- Company level: Connect main Lightspeed account
- Site A: Override with its own Lightspeed account
- Site B: Use company-level account (inherits)
- Subsite A1: Override with its own Lightspeed account

---

## 🔧 Implementation Details

### Component Changes

**POSIntegrationSettings Component:**
- Now accepts `subsiteId` prop
- Automatically detects current level from CompanyContext
- Shows current sync level in UI
- Loads/saves settings at the correct level

### Sync Service Changes

**LightspeedSyncService:**
- Updated to accept optional `siteId` and `subsiteId`
- Base path helpers support all three levels
- Syncs data to the correct database path

### Settings Path Logic

The component automatically determines the settings path:

```typescript
if (subsiteId && siteId) {
  // Subsite level
  path = `companies/${companyId}/sites/${siteId}/subsites/${subsiteId}/settings/lightspeedIntegration`
} else if (siteId) {
  // Site level
  path = `companies/${companyId}/sites/${siteId}/settings/lightspeedIntegration`
} else {
  // Company level
  path = `companies/${companyId}/settings/lightspeedIntegration`
}
```

---

## 📋 UI Features

### Level Indicator
The settings UI now shows the current sync level:
- **"Sync Level: Company"** - When at company level
- **"Sync Level: Site"** - When at site level
- **"Sync Level: Subsite"** - When at subsite level

### Automatic Level Detection
- Component automatically detects the current level from CompanyContext
- Settings load/save at the appropriate level
- No manual level selection needed

---

## 🔄 Inheritance Model

Currently, each level is **independent** - there's no automatic inheritance. However, the architecture supports:

### Future Enhancement: Inheritance
You could implement inheritance where:
- Site inherits company settings if no site settings exist
- Subsite inherits site settings if no subsite settings exist
- Lower levels can override higher levels

---

## ✅ Benefits

1. **Flexibility** - Each company/site/subsite can have its own Lightspeed account
2. **Isolation** - Data is completely isolated at each level
3. **Scalability** - Supports complex multi-location businesses
4. **Granular Control** - Fine-grained control over sync settings per level

---

## 📝 Example Scenarios

### Restaurant Chain
- **Company Level:** Main Lightspeed account for corporate reporting
- **Site Level:** Each restaurant location has its own Lightspeed account
- **Subsite Level:** Different departments (dining room, bar, takeout) have separate accounts

### Retail Store
- **Company Level:** Company-wide product catalog
- **Site Level:** Each store location syncs its own inventory
- **Subsite Level:** Different departments (clothing, electronics) sync separately

### Multi-Brand Business
- **Company Level:** Shared products across brands
- **Site Level:** Each brand has its own Lightspeed account
- **Subsite Level:** Different product lines within a brand

---

## 🚀 Usage

1. **Navigate to Settings**
   - Go to Stock Settings or POS Settings
   - The component automatically detects your current level

2. **Select Level** (if needed)
   - Company: No site/subsite selected
   - Site: Select a site
   - Subsite: Select a site and subsite

3. **Connect Lightspeed**
   - Enter credentials
   - Connect at the current level

4. **Sync Data**
   - Data syncs to the appropriate database path
   - Each level maintains its own data

---

**Last Updated:** [Current Date]
**Status:** ✅ Fully implemented with company/site/subsite support

