# Reports and Dashboards Comprehensive Audit Report

## Executive Summary

This document provides a comprehensive audit of all reports and dashboard components to ensure:
1. ✅ Correct company/site/subsite filtering
2. ✅ Proper date range and frequency handling
3. ✅ Comprehensive error handling
4. ✅ Data validation and safety

## Issues Identified

### 1. Date Range Calculation Issues

**Problem:** Some reports use incorrect date calculations:
- `ProductSalesAnalysisReport` uses `subDays(currentDate, 7)` for week view instead of `startOfWeek`/`endOfWeek`
- Week view should show the week containing the current date, not "last 7 days"
- Month view should show the full month, not "last 30 days"

**Fixed:**
- ✅ Created `reportHelpers.ts` with `calculateDateRange()` function
- ✅ Fixed `ProductSalesAnalysisReport` as example
- ⏳ Need to fix remaining reports

### 2. Company/Site/Subsite Filtering Issues

**Problem:** Reports filter by `siteId` in data but don't respect the company context's selected site/subsite:
- Contexts load data from multiple paths (company/site/subsite) and merge them
- Reports might show data from all levels instead of just the selected level
- No validation that data matches the selected context

**Fixed:**
- ✅ Created `filterByCompanyContext()` helper function
- ✅ Fixed `ProductSalesAnalysisReport` as example
- ⏳ Need to fix remaining reports

### 3. Error Handling Issues

**Problem:** Most reports lack proper error handling:
- No try-catch blocks around data processing
- No validation for empty/null data
- No error messages displayed to users
- No loading states

**Fixed:**
- ✅ Added error handling to `ProductSalesAnalysisReport`
- ✅ Created safe helper functions (`safeArray`, `safeNumber`, `safeString`, `safeParseDate`)
- ⏳ Need to add to remaining reports

### 4. Data Validation Issues

**Problem:** Reports assume data is always valid:
- No checks for missing required fields
- No handling of malformed data
- Potential crashes on invalid dates or null values

**Fixed:**
- ✅ Created validation helpers
- ✅ Fixed `ProductSalesAnalysisReport` as example
- ⏳ Need to fix remaining reports

## Reports Status

### HR Reports (12 reports)
- [ ] EmployeeDirectoryReport.tsx
- [ ] AbsenceSummaryReport.tsx
- [ ] HolidayEntitlementReport.tsx
- [ ] RightToWorkExpiryReport.tsx
- [ ] StudentVisaHoursMonitorReport.tsx
- [ ] NewStarterFormReport.tsx
- [ ] EmployeeDocumentationTrackerReport.tsx
- [ ] EmployeeChangesReport.tsx
- [ ] SicknessLogReport.tsx
- [ ] VisaStatusReport.tsx
- [ ] LeaverFormReport.tsx
- [ ] HRReportsDashboard.tsx

### Bookings Reports (10 reports)
- [ ] BookingsSummaryReport.tsx
- [ ] BookingVelocityReport.tsx
- [ ] WalkInLiveBookingsReport.tsx
- [ ] PaymentsDepositsReport.tsx
- [ ] PreordersPackagesReport.tsx
- [ ] SourceConversionReport.tsx
- [ ] StaffPerformanceReport.tsx
- [ ] ForecastAvailabilityReport.tsx
- [ ] CancellationsNoShowReport.tsx
- [ ] EventPromotionPerformanceReport.tsx

### Stock Reports (8 reports)
- [x] ProductSalesAnalysisReport.tsx ✅ **FIXED**
- [ ] SalesSummaryReport.tsx
- [ ] TillCashReconciliationReport.tsx
- [ ] BankingDepositReport.tsx
- [ ] DiscountsPromotionsReport.tsx
- [ ] StockMovementValuationReport.tsx
- [ ] PurchaseSupplierReport.tsx
- [ ] CostMarginAnalysisReport.tsx

### Finance Reports
- [ ] Reports.tsx (main page)
- [ ] Reporting.tsx
- [ ] SalesReport.tsx

## Dashboard Status

### Dashboards to Check
- [ ] HR Dashboard (`src/frontend/pages/HR.tsx`)
- [ ] Bookings Dashboard (`src/frontend/pages/BookingsDashboard.tsx`)
- [ ] Stock Dashboard (`src/frontend/pages/StockDashboard.tsx`)
- [ ] Finance Dashboard (`src/frontend/pages/finance/Dashboard.tsx`)
- [ ] POS Dashboard (`src/frontend/pages/POS.tsx`)
- [ ] CustomizableDashboard (`src/frontend/components/dashboard/CustomizableDashboard.tsx`)

## Fix Pattern

For each report, apply the following fixes:

### 1. Import Helpers
```typescript
import { 
  calculateDateRange, 
  filterByCompanyContext, 
  isDateInRange, 
  safeArray,
  safeNumber,
  safeString,
  safeParseDate
} from "../../../../utils/reportHelpers"
```

### 2. Fix Date Range Calculation
```typescript
// OLD:
const { startDate, endDate } = useMemo(() => {
  switch (dateType) {
    case "week":
      return { startDate: subDays(currentDate, 7), endDate: currentDate }
    // ...
  }
}, [dateType, currentDate, customStartDate, customEndDate])

// NEW:
const { startDate, endDate } = useMemo(() => {
  return calculateDateRange(dateType, currentDate, customStartDate, customEndDate)
}, [dateType, currentDate, customStartDate, customEndDate])
```

### 3. Add Company Context Filtering
```typescript
// Filter data by company context first
const contextFilteredData = filterByCompanyContext(
  safeArray(rawData),
  companyState.selectedSiteID,
  companyState.selectedSubsiteID
)
```

### 4. Add Error Handling
```typescript
const processedData = useMemo(() => {
  try {
    // ... processing logic
    return result
  } catch (error) {
    console.error("Error processing data:", error)
    return []
  }
}, [dependencies])
```

### 5. Use Safe Helpers
```typescript
// Use safeNumber, safeString, safeArray for all data access
const value = safeNumber(item.price, 0)
const name = safeString(item.name, "Unknown")
const items = safeArray(item.items)
```

## Next Steps

1. ✅ Create helper utilities (`reportHelpers.ts`)
2. ✅ Fix example report (`ProductSalesAnalysisReport.tsx`)
3. ⏳ Fix all remaining reports systematically
4. ⏳ Fix all dashboards
5. ⏳ Test all fixes
6. ⏳ Create comprehensive test cases

## Testing Checklist

For each fixed report/dashboard, verify:
- [ ] Date ranges work correctly (day/week/month/custom)
- [ ] Company/site/subsite filtering works correctly
- [ ] Error handling prevents crashes
- [ ] Empty data states are handled gracefully
- [ ] Invalid dates are handled safely
- [ ] Loading states work correctly
- [ ] No console errors

## Notes

- The contexts (HR, Bookings, POS, Stock, Finance) already handle multi-path loading
- Reports should respect the selected company/site/subsite from CompanyContext
- All date calculations should use the helper functions for consistency
- All data access should use safe helpers to prevent crashes

