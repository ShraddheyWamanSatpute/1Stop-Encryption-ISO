# HMRC Integration - Company/Site/Subsite Level Support

## ✅ Implementation Complete

The HMRC integration now supports configuration at **Company**, **Site**, or **Subsite** levels with automatic hierarchy fallback.

---

## 🏗️ Architecture

### Hierarchy System

Settings are checked in this order:
1. **Subsite** level (if subsite selected)
2. **Site** level (if site selected)
3. **Company** level (always available)

This allows:
- **Company-wide settings**: Set once for all sites/subsites
- **Site-specific settings**: Override company settings for a specific site
- **Subsite-specific settings**: Override site/company settings for a specific subsite

---

## 📁 Database Structure

### Company Level
```
companies/{companyId}/data/company/hmrcSettings
```

### Site Level
```
companies/{companyId}/sites/{siteId}/data/company/hmrcSettings
```

### Subsite Level
```
companies/{companyId}/sites/{siteId}/subsites/{subsiteId}/data/company/hmrcSettings
```

---

## 🔧 Updated Functions

### `fetchHMRCSettings(companyId, siteId, subsiteId)`

**Returns:** `{ settings: HMRCSettings | null, foundAt: "subsite" | "site" | "company" | null }`

Automatically checks hierarchy and returns:
- The first found settings
- Where they were found (subsite/site/company)

**Example:**
```typescript
const { settings, foundAt } = await fetchHMRCSettings(
  companyId,
  siteId,
  subsiteId
)

if (settings) {
  console.log(`Settings found at: ${foundAt} level`)
  // Use settings...
}
```

### `saveHMRCSettings(companyId, siteId, subsiteId, level, settings)`

**Parameters:**
- `companyId`: Required
- `siteId`: Required if level is "site" or "subsite"
- `subsiteId`: Required if level is "subsite"
- `level`: "company" | "site" | "subsite"
- `settings`: HMRCSettings object

**Example:**
```typescript
// Save at company level
await saveHMRCSettings(companyId, null, null, "company", settings)

// Save at site level
await saveHMRCSettings(companyId, siteId, null, "site", settings)

// Save at subsite level
await saveHMRCSettings(companyId, siteId, subsiteId, "subsite", settings)
```

### `updateHMRCTokens(companyId, siteId, subsiteId, tokens)`

Automatically finds where settings are stored and updates tokens there.

**Example:**
```typescript
await updateHMRCTokens(companyId, siteId, subsiteId, {
  accessToken: "...",
  refreshToken: "...",
  expiresIn: 3600
})
```

---

## 🎨 UI Updates

### HMRC Settings Tab

**New Features:**
1. **Level Selector**: Choose where to store settings (Company/Site/Subsite)
2. **Settings Location Indicator**: Shows where current settings are found
3. **Automatic Level Detection**: Defaults to most specific level available

**UI Components:**
- Dropdown to select level
- Alert showing where settings are currently stored
- Validation to ensure required selections (site/subsite) are made

---

## 🔄 Updated Submission Functions

All HMRC submission functions now support hierarchy:

### `submitFPSForPayrollRun(companyId, siteId, payrollIds, userId, subsiteId)`
- Automatically finds HMRC settings using hierarchy
- Uses settings from the most specific level available

### `submitEPS(companyId, siteId, epsData, userId, subsiteId)`
- Automatically finds HMRC settings using hierarchy
- Updates settings at the same level where they're stored

### `autoSubmitFPSForPayroll(companyId, siteId, payrollId, userId, subsiteId)`
- Checks hierarchy for auto-submit settings
- Only auto-submits if enabled at the appropriate level

---

## 📋 Usage Examples

### Example 1: Company-Wide Settings

```typescript
// Save at company level
await saveHMRCSettings(
  companyId,
  null,
  null,
  "company",
  {
    employerPAYEReference: "123/AB45678",
    accountsOfficeReference: "123PA00012345",
    // ... other settings
  }
)

// All sites/subsites will use these settings unless overridden
```

### Example 2: Site-Specific Settings

```typescript
// Save at site level (overrides company settings for this site)
await saveHMRCSettings(
  companyId,
  siteId,
  null,
  "site",
  {
    employerPAYEReference: "456/CD78901",  // Different PAYE ref for this site
    accountsOfficeReference: "456PA00078901",
    // ... other settings
  }
)

// This site and its subsites will use these settings
// (unless subsite has its own settings)
```

### Example 3: Subsite-Specific Settings

```typescript
// Save at subsite level (overrides site/company settings)
await saveHMRCSettings(
  companyId,
  siteId,
  subsiteId,
  "subsite",
  {
    employerPAYEReference: "789/EF01234",  // Different PAYE ref for this subsite
    accountsOfficeReference: "789PA00001234",
    // ... other settings
  }
)

// Only this subsite will use these settings
```

### Example 4: Fetching Settings (Automatic Hierarchy)

```typescript
// Automatically checks: subsite → site → company
const { settings, foundAt } = await fetchHMRCSettings(
  companyId,
  siteId,
  subsiteId
)

if (settings) {
  console.log(`Using settings from ${foundAt} level`)
  // Use settings for payroll submission
}
```

---

## ✅ Benefits

1. **Flexibility**: Configure HMRC settings at the most appropriate level
2. **Inheritance**: Lower levels inherit from higher levels automatically
3. **Override**: Lower levels can override higher levels when needed
4. **Simplicity**: UI automatically detects and shows where settings are stored
5. **Compliance**: Each company/site/subsite can have their own PAYE reference

---

## 🔍 Verification

### Settings Location
- ✅ Company level: `companies/{companyId}/data/company/hmrcSettings`
- ✅ Site level: `companies/{companyId}/sites/{siteId}/data/company/hmrcSettings`
- ✅ Subsite level: `companies/{companyId}/sites/{siteId}/subsites/{subsiteId}/data/company/hmrcSettings`

### Hierarchy Check
- ✅ Checks subsite first (if subsiteId provided)
- ✅ Falls back to site (if siteId provided)
- ✅ Falls back to company (always available)

### UI Features
- ✅ Level selector dropdown
- ✅ Settings location indicator
- ✅ Automatic level detection
- ✅ Validation for required selections

### Submission Functions
- ✅ All functions support hierarchy
- ✅ Settings automatically found at correct level
- ✅ Updates happen at the same level where settings are stored

---

## 🎯 Summary

The HMRC integration now fully supports:
- ✅ Company-level configuration
- ✅ Site-level configuration
- ✅ Subsite-level configuration
- ✅ Automatic hierarchy fallback
- ✅ UI for selecting configuration level
- ✅ All submission functions use hierarchy

**Ready for production use with multi-level configuration support!** 🎉

