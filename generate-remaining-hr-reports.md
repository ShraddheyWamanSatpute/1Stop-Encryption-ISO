# Generate Remaining HR Reports

## Already Created ✅
1. EmployeeDirectoryReport.tsx
2. AbsenceSummaryReport.tsx
3. HolidayEntitlementReport.tsx
4. HRReportsDashboard.tsx (with placeholders)

## Remaining Reports to Create (8)

### Template Structure for Each Report

Each report follows this pattern:

```typescript
"use client"

import React, { useState, useMemo } from "react"
import { Box, Paper, Table, ... } from "@mui/material"
import { useHR } from "../../../../backend/context/HRContext"
import { useCompany } from "../../../../backend/context/CompanyContext"
import DataHeader from "../../reusable/DataHeader"
import { subDays, format, ... } from "date-fns"

type GroupByType = "none" | "..." // specific to report

const ReportName: React.FC = () => {
  const { state: hrState } = useHR()
  const { state: companyState } = useCompany()
  
  // State for filters
  const [dateType, setDateType] = useState<"day" | "week" | "month" | "custom">("month")
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [customStartDate, setCustomStartDate] = useState<Date>(subDays(new Date(), 30))
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date())
  const [groupBy, setGroupBy] = useState<GroupByType>("none")
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  
  // Compute date range
  const { startDate, endDate } = useMemo(() => {
    // ... date logic
  }, [dateType, currentDate, customStartDate, customEndDate])
  
  // Filter data
  const filteredData = useMemo(() => {
    // ... filtering logic
  }, [/* dependencies */])
  
  // Calculate metrics
  const metrics = useMemo(() => {
    // ... metrics calculation
  }, [filteredData])
  
  // Group data
  const groupedData = useMemo(() => {
    if (groupBy === "none") return []
    // ... grouping logic
  }, [filteredData, groupBy])
  
  return (
    <Box>
      <DataHeader {...props} />
      
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* 4-8 metric cards */}
      </Grid>
      
      {/* Optional breakdown section */}
      
      {/* Grouped Data Table */}
      {groupBy !== "none" && groupedData.length > 0 && (
        <TableContainer component={Paper}>
          {/* Grouped table */}
        </TableContainer>
      )}
      
      {/* Detailed Data Table */}
      <TableContainer component={Paper}>
        {/* Detailed table with first 50 rows */}
      </TableContainer>
    </Box>
  )
}

export default ReportName
```

## Report Specifications

### 5. NewStarterFormReport
- **Data Source**: `employees` filtered by `hireDate` within range
- **Filters**: Location, Department, Date Range, Manager
- **GroupBy**: Department, Location, Manager, Month
- **Metrics**: Total Starters, By Department, By Contract Type, Avg per Month
- **Table Columns**: Name, Start Date, Position, Department, Manager, Contract Type, Training Checklist Status

### 6. LeaverFormReport
- **Data Source**: `employees` with `status="terminated"` or `endDate`
- **Filters**: Location, Department, Date Range, Leaver Reason
- **GroupBy**: Department, Location, Reason, Month
- **Metrics**: Total Leavers, By Reason, Turnover %, Exit Interview Completion %
- **Table Columns**: Name, Department, Final Working Day, Leaver Reason, Notice Period, Exit Interview

### 7. EmployeeChangesReport
- **Data Source**: Custom change log or compare employee records over time (may need to track changes)
- **Filters**: Location, Department, Change Type, Date Range
- **GroupBy**: Department, Change Type, Month
- **Metrics**: Total Changes, Promotions, Transfers, Pay Changes
- **Table Columns**: Employee, Department, Change Type, Old Value, New Value, Effective Date

### 8. EmployeeDocumentationTrackerReport
- **Data Source**: `complianceTasks` or documents field in employee
- **Filters**: Document Type, Expiry Range, Compliance Status, Location
- **GroupBy**: Document Type, Location, Status
- **Metrics**: Total Documents, Expiring Soon, Overdue, Compliant %
- **Table Columns**: Employee, Document Type, Issue Date, Expiry Date, Uploaded By, Status

### 9. SicknessLogReport
- **Data Source**: `timeOffs` filtered by `type="sick_leave"`
- **Filters**: Location, Department, Date Range, Certified (Y/N)
- **GroupBy**: Employee, Department, Month
- **Metrics**: Total Sick Days, Avg per Employee, Certified %, Frequent Sick (>X days)
- **Table Columns**: Employee, Department, Start/End Dates, Duration, Certified, Reason

### 10. RightToWorkExpiryReport
- **Data Source**: `employees` with `rightToWork` expiry date
- **Filters**: Location, Document Type, Expiry Range, Status
- **GroupBy**: Document Type, Location, Expiry Status
- **Metrics**: Total Documents, Expiring <30 days, Expired, Valid
- **Table Columns**: Employee, Document Type, Expiry Date, Days Until Expiry, Status

### 11. VisaStatusReport
- **Data Source**: `employees` with visa information
- **Filters**: Visa Type, Expiry Range, Location, Department
- **GroupBy**: Visa Type, Location, Expiry Status
- **Metrics**: Total Visa Holders, Expiring <60 days, By Visa Type
- **Table Columns**: Employee, Visa Type, Issue Date, Expiry Date, Remaining Weeks, Status

### 12. StudentVisaHoursMonitorReport
- **Data Source**: `employees` with student visa + `attendances` or `schedules` for hours
- **Filters**: Week, Location, Department, Breach Only
- **GroupBy**: Employee, Week, Department
- **Metrics**: Total Student Visa Employees, Total Breaches, At Risk (>18hrs), Compliant
- **Table Columns**: Employee, Visa Type, Week Start, Hours Worked, Limit (20hrs), Breach Flag

## Quick Generation Instructions

1. Copy the template structure above
2. Replace `ReportName` with the specific report name
3. Update `GroupByType` with relevant grouping options
4. Implement the data filtering based on specifications
5. Add appropriate filter options to DataHeader
6. Create summary cards for key metrics
7. Implement grouped data table if needed
8. Create detailed data table with relevant columns

## Data Access Notes

- **Employees**: `hrState.employees`
- **Departments**: `hrState.departments`
- **TimeOffs**: `hrState.timeOffs`
- **Attendances**: `hrState.attendances`
- **ComplianceTasks**: `hrState.complianceTasks`
- **Schedules**: `hrState.schedules`
- **Sites**: `companyState.sites`

## Would You Like Me To:

A) ✅ **Continue creating all 8 remaining reports now** (recommended)
B) Create just the top 3 priority reports (Visa Status, Right to Work, Student Hours)
C) Provide this as documentation for your team to implement

**Recommendation: Option A** - Complete all reports for full functionality like booking reports.




