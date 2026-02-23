# 📊 Booking Reports Quick Start Guide

## 🚀 Getting Started

### 1. Access the Reports Dashboard

The main dashboard component with all 10 reports in tabs:

```typescript
import { BookingsReportsDashboard } from '@/frontend/components/bookings'

function BookingsPage() {
  return <BookingsReportsDashboard />
}
```

### 2. Use Individual Reports

Access specific reports directly:

```typescript
import { 
  BookingsSummaryReport,
  BookingVelocityReport,
  // ... other reports
} from '@/frontend/components/bookings'

function MyCustomPage() {
  return (
    <div>
      <BookingsSummaryReport />
    </div>
  )
}
```

---

## 📋 Available Reports

| # | Report Name | Purpose | Key Metrics |
|---|------------|---------|-------------|
| 1 | **Bookings Summary** | Daily/weekly overview | Total bookings, covers, capacity %, walk-ins |
| 2 | **Booking Velocity** | Booking pace & lead time | Lead time, conversion rate, rebooking % |
| 3 | **Walk-in & Live** | Same-day tracking | Walk-ins, wait times, dwell times, spend |
| 4 | **Payments & Deposits** | Financial tracking | Paid, outstanding, refunds, deposits |
| 5 | **Preorders & Packages** | Advance orders | Preorders, packages, menu types, items |
| 6 | **Source & Conversion** | Channel performance | Sources, conversion %, cancellation % |
| 7 | **Staff Performance** | Team productivity | Bookings managed, conversion, value |
| 8 | **Forecast & Availability** | Future capacity | Forecast revenue, capacity %, variance |
| 9 | **Cancellations & No-shows** | Loss tracking | Cancellations, no-shows, recovery rate |
| 10 | **Event & Promotion** | Event ROI | Event performance, revenue, deposits |

---

## 🎯 Common Use Cases

### View Today's Bookings
1. Open **Bookings Summary Report**
2. Select **Day** view
3. Today's date is selected by default

### Analyze Walk-in Performance
1. Open **Walk-in & Live Bookings Report**
2. Select date range (default: today)
3. View metrics: wait times, spend, table utilization

### Track Outstanding Payments
1. Open **Payments & Deposits Report**
2. Filter by **Status**: "Pending" or "Unpaid"
3. View total outstanding amount

### Forecast Next Week's Revenue
1. Open **Forecast & Availability Report**
2. Select **Week** view
3. Set date to next week
4. View forecast revenue and capacity

### Identify Cancellation Patterns
1. Open **Cancellations & No-show Report**
2. Select **Month** view
3. Group by **Reason** to see top causes

### Compare Staff Performance
1. Open **Staff Performance Report**
2. Select date range
3. View leaderboard with conversion rates

### Analyze Event Success
1. Open **Event & Promotion Performance Report**
2. Filter by specific event
3. View revenue, conversion %, and ROI

---

## 🔧 Filter Options

All reports support flexible filtering:

### Date Controls
- **Day**: Single day view
- **Week**: 7-day period from selected date
- **Month**: 30-day period from selected date
- **Custom**: Choose start and end dates

### Common Filters
- **Site**: Select one or multiple sites
- **Status**: Confirmed, Enquiry, Cancelled, etc.
- **Booking Type**: Standard, Event, Private, Walk-in
- **Source**: Website, Phone, Partner, Social Media
- **Daypart**: Breakfast, Lunch, Dinner, Late

### Report-Specific Filters
- **Staff Member**: Filter by who managed the booking
- **Payment Status**: Paid, Pending, Refunded
- **Lead Time Range**: 0-2 days, 3-7 days, etc.
- **Menu Type**: Standard, Dinner, Drinks, Package
- **Event/Promotion**: Specific events or promotions

---

## 📊 Grouping Options

### Group Data By:
- **None**: Flat list of data
- **Site**: Compare performance across locations
- **Date**: Daily breakdown
- **Area/Section**: Compare different areas
- **Source**: Compare booking channels
- **Staff**: Compare team members
- **Event**: Compare different events

---

## 💾 Export Data

Each report includes export options:

1. **CSV Export**: Click CSV button in DataHeader
2. **PDF Export**: Click PDF button in DataHeader

*Note: Export functionality needs to be connected to actual export logic*

---

## 🎨 Visual Indicators

### Color Coding
- 🟢 **Green**: Good performance, confirmed, success
- 🟡 **Yellow/Orange**: Attention needed, pending, warning
- 🔴 **Red**: Problems, cancellations, errors
- 🔵 **Blue**: Neutral information

### Status Chips
- Use colored chips for quick status identification
- Clickable for filtering (in future enhancement)

### Progress Bars
- Capacity utilization
- Conversion rates
- Performance metrics

---

## 📱 Responsive Design

All reports are fully responsive:
- **Desktop**: Full table view with all columns
- **Tablet**: Optimized layout with essential columns
- **Mobile**: Card-based view for easier navigation

---

## 🔍 Understanding the Metrics

### Conversion Rate
```
Conversion Rate = (Confirmed Bookings ÷ Total Enquiries) × 100
```

### Capacity %
```
Capacity % = (Total Covers ÷ Venue Capacity) × 100
```

### Cancellation Rate
```
Cancellation Rate = (Cancelled Bookings ÷ Total Bookings) × 100
```

### Recovery Rate
```
Recovery Rate = (Recovered Bookings ÷ Total Losses) × 100
```

### Lead Time
```
Lead Time = Visit Date - Booking Created Date
```

---

## 🔧 Integration with Other Systems

### Bookings Context
All reports read from `BookingsContext`:
- Booking data
- Tables data
- Booking settings
- Customer data

### Company Context
Site and location information:
- Multi-site filtering
- Site-specific metrics

### POS Integration (Future)
- Walk-in spend tracking
- Average spend calculations
- Revenue per cover

---

## 📈 Best Practices

### Daily Operations
1. Check **Bookings Summary** each morning
2. Monitor **Walk-in & Live** throughout the day
3. Review **Payments & Deposits** for outstanding balances

### Weekly Review
1. Analyze **Booking Velocity** for trends
2. Check **Source & Conversion** for channel performance
3. Review **Staff Performance** for team optimization

### Monthly Analysis
1. Deep dive into **Cancellations & No-shows**
2. Analyze **Event & Promotion** performance
3. Use **Forecast & Availability** for next month planning

### Strategic Planning
1. Use **Source & Conversion** for marketing decisions
2. Analyze **Staff Performance** for training needs
3. Review **Event & Promotion** for event strategy

---

## ⚡ Performance Tips

1. **Use appropriate date ranges**: Shorter ranges load faster
2. **Filter data**: Use site/status filters to reduce dataset
3. **Group wisely**: Only group when needed for analysis
4. **Export large datasets**: For complex analysis, export to Excel

---

## 🆘 Troubleshooting

### No Data Showing
- Check date range is correct
- Verify filters aren't too restrictive
- Ensure booking data exists in database

### Slow Performance
- Reduce date range
- Apply filters to limit data
- Contact support if issue persists

### Export Not Working
- Ensure export function is properly configured
- Check browser allows downloads
- Try different export format

---

## 🎓 Training Resources

### For Managers
- Focus on Summary, Forecast, and Staff Performance reports
- Learn to identify trends and patterns
- Use data for scheduling and capacity planning

### For Staff
- Learn to use Walk-in & Live report
- Understand Payments & Deposits tracking
- Master booking entry for accurate reporting

### For Marketing
- Master Source & Conversion report
- Analyze Event & Promotion performance
- Use insights for campaign optimization

---

## 📞 Support

For questions or issues:
1. Check this quick start guide
2. Review BOOKING_REPORTS_SYSTEM_COMPLETE.md for details
3. Contact your system administrator

---

## 🎉 You're Ready!

You now have access to a comprehensive booking analytics system. Start with the **Bookings Summary Report** to get familiar with the interface, then explore other reports based on your needs.

Happy analyzing! 📊✨

