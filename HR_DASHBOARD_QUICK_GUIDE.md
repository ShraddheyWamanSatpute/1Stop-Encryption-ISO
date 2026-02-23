# HR Dashboard - Quick Reference Guide

## Overview
The HR Dashboard has been updated with improved widget rendering, automatic layout persistence, and fully functional filtering. All changes are saved automatically to the database.

## Key Features

### 1. Widget Display
✅ **Labels and data now fit perfectly** - All text sizes responsively to widget dimensions
✅ **Clean canvas** - No background colors or borders on chart areas
✅ **No cutoff** - All labels, legends, and data points are fully visible

### 2. Layout Persistence

#### How It Works
- **Automatic Saving**: Your layout saves automatically whenever you:
  - Move a widget (drag it)
  - Resize a widget
  - Add a new widget
  - Remove a widget
  - Change widget settings

- **Automatic Loading**: Your custom layout loads automatically when you:
  - Refresh the page
  - Navigate away and come back
  - Log out and log back in

#### Storage
- **Primary**: Firebase Realtime Database
- **Backup**: Browser localStorage
- **Location**: `/companies/{companyID}/sites/{siteID}/dashboards/hr/layout`

#### What's Saved
- Widget positions (x, y coordinates)
- Widget sizes (width, height)
- Widget types (chart, stat, table, etc.)
- Widget data sources
- Widget settings (colors, labels, etc.)
- Last updated timestamp
- User who made the changes

### 3. Edit Mode

#### Entering Edit Mode
1. Click the **"Edit Layout"** button in the dashboard header
2. Grid overlay appears (optional - toggle with "Show Grid" switch)
3. Widgets become draggable and resizable

#### While in Edit Mode
- **Drag** widgets to reposition them
- **Resize** widgets by dragging corners/edges
- **Right-click** a widget for context menu options
- **Click** the settings icon on any widget to customize it
- **Add** new widgets via the "Add New" dropdown

#### Exiting Edit Mode
1. Click **"Save Layout"** button
2. Layout saves automatically to database and localStorage
3. Widgets become fixed in place

### 4. Date Range Filtering

#### Available Options
- **Today**: Shows data from today only
- **Yesterday**: Shows data from yesterday
- **Last 7 Days**: Shows data from the past week
- **Last 30 Days**: Shows data from the past month
- **This Month**: Shows data from start of current month
- **Last Month**: Shows data from previous month
- **This Year**: Shows data from start of current year
- **Last Year**: Shows data from previous year
- **Custom Range**: Pick exact start and end dates

#### How to Change Date Range
1. Click the calendar icon button in the dashboard header
2. Select your desired range from the dropdown
3. For custom range, select dates in the popup dialog
4. All widgets automatically refresh with new data

#### What Changes
- Historical trend data in charts
- Data point ranges in line/bar charts
- Aggregated values in stat cards
- Comparison periods in reports

### 5. Frequency Filtering

#### Available Options
- **Daily**: Shows data points by day
- **Weekly**: Shows data points by week
- **Monthly**: Shows data points by month
- **Quarterly**: Shows data points by quarter
- **Yearly**: Shows data points by year

#### How to Change Frequency
1. Click one of the frequency chips in the dashboard header
2. All widgets automatically refresh with new granularity

#### Data Point Limits
- **Hourly**: Max 168 points (1 week)
- **Daily**: Max 90 points (90 days)
- **Weekly**: Max 52 points (52 weeks)
- **Monthly**: Max 24 points (24 months)

### 6. Adding Widgets

#### Steps
1. Enter edit mode
2. Click **"Add New" → "Add Widget"**
3. Choose widget type:
   - **Stat Card**: Single number display
   - **Bar Chart**: Comparison over time/categories
   - **Line Chart**: Trends over time
   - **Pie Chart**: Part-to-whole relationships
   - **Table**: Detailed data listing
   - **Dashboard Card**: Highlighted metric with icon

4. Select data type:
   - Total Employees
   - Attendance Rate
   - Performance Score
   - Turnover Rate
   - Recruitment Metrics
   - Training Completion
   - Payroll Costs
   - Department Distribution
   - And more...

5. Click "Add Widget"
6. Widget appears at bottom of dashboard
7. Drag to desired position
8. Resize as needed
9. Exit edit mode to save

### 7. Widget Settings

#### Accessing Settings
- **Method 1**: Right-click widget → "Settings"
- **Method 2**: Click settings icon in edit mode

#### Available Settings
- **Title**: Change widget display name
- **Data Source**: Change what data is displayed
- **Colors**: Customize background, border, text, and series colors
- **Display Mode**: Price vs. Quantity vs. Percentage
- **Chart Type**: For charts (bar, line, area, stacked, etc.)
- **Visibility**: Show/hide data series

### 8. Removing Widgets

#### Methods
- **Method 1**: Right-click widget → "Remove"
- **Method 2**: Click "Clear Widgets" to remove all (with confirmation)

### 9. Troubleshooting

#### Layout Not Saving
- Check console for error messages
- Verify you're logged in
- Ensure you have edit permissions
- Check internet connection
- Try clearing browser cache

#### Widgets Not Loading
- Refresh the page
- Check if default widgets appear
- Verify data permissions
- Check console for errors

#### Data Not Updating
- Verify date range is set correctly
- Check frequency setting
- Ensure data exists for selected period
- Refresh the page
- Check HR data is loaded

#### Visual Issues
- Try zooming to 100% in browser
- Refresh the page
- Clear browser cache
- Check for console errors

### 10. Best Practices

#### Layout Design
✅ Group related widgets together
✅ Place most important metrics at the top
✅ Use consistent widget sizes for clean look
✅ Leave some spacing between widgets
✅ Align widgets to grid for professional appearance

#### Widget Selection
✅ Use stat cards for key metrics
✅ Use charts for trends and comparisons
✅ Use tables for detailed breakdowns
✅ Limit to 6-8 widgets for best performance
✅ Choose appropriate chart types for data

#### Performance
✅ Avoid too many widgets (>10)
✅ Use appropriate date ranges (not too large)
✅ Exit edit mode when not editing
✅ Refresh periodically for latest data

## Console Logging

Useful console messages for debugging:
```
HR Dashboard: Date range changed to: {range}
HR Dashboard: Frequency changed to: {frequency}
HR Dashboard: Entering/Exiting edit mode
useWidgetManager: Dashboard layout saved to database for hr
useWidgetManager: Found database layout for hr, widgets count: X
```

## Summary

The updated HR dashboard provides:
- **Perfect widget rendering** with no text cutoff
- **Automatic layout persistence** across sessions
- **Real-time filtering** by date range and frequency
- **Intuitive editing** with drag-and-drop
- **Database integration** for reliable storage
- **Responsive design** that adapts to any screen size

All features work seamlessly together to provide a professional, customizable dashboard experience.

