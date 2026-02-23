# HR Reports Implementation Plan

## Status: IN PROGRESS

Creating 11 HR reports following the booking reports pattern.

### Reports to Create:

✅ 1. **Employee Directory Report** - COMPLETE
⏳ 2. **New Starter Form Report** - IN PROGRESS
⏳ 3. **Leaver Form Report** - PENDING
⏳ 4. **Employee Changes Report** - PENDING
⏳ 5. **Employee Documentation Tracker Report** - PENDING
⏳ 6. **Absence Summary Report** - PENDING
⏳ 7. **Holiday Entitlement Report** - PENDING
⏳ 8. **Sickness Log Report** - PENDING
⏳ 9. **Right to Work Expiry Report** - PENDING
⏳ 10. **Visa Status Report** - PENDING
⏳ 11. **Student Visa Hours Monitor Report** - PENDING
⏳ 12. **HR Reports Dashboard** - PENDING

### Pattern Being Followed:
- Same structure as booking reports
- DataHeader integration
- Multi-select filters
- Summary cards
- Grouped data tables
- Export functionality
- Responsive design

### Data Sources:
- HRContext (useHR hook with state property)
- CompanyContext for sites
- Employee, TimeOff, Attendance, ComplianceTask data

All reports will be created in: `src/frontend/components/hr/reports/`




