# 1Stop Hospitality Management System - Complete Dataset

This folder contains a comprehensive, structured dataset for the 1Stop hospitality management system, designed for seamless import into Firebase Realtime Database or similar NoSQL databases.

## 📁 Dataset Structure

### Core Files

1. **`skeleton_structure.json`** - Complete company/site/subsite hierarchy with empty data folders
2. **`bookings_data.json`** - Restaurant booking and reservation management data
3. **`stock_data.json`** - Inventory management with products, suppliers, and stock movements
4. **`pos_data.json`** - Point of sale transactions, payments, and daily sales reports
5. **`hr_data.json`** - Human resources with employees, departments, roles, and payroll
6. **`finance_data.json`** - Financial management including accounts, invoices, and expenses
7. **`messenger_data.json`** - Internal communication system with chats and notifications
8. **`checklist_data.json`** - Operational checklists and completion tracking

## 🏗️ Architecture Features

### Referential Integrity
- All datasets use consistent IDs that cross-reference properly
- Site and subsite IDs match the skeleton structure
- Employee IDs align with user accounts
- Product IDs link across stock, POS, and booking systems

### UK Business Context
- GBP currency throughout financial data
- UK addresses, postcodes, and phone numbers
- VAT calculations and National Insurance numbers
- British hospitality industry scenarios

### Database Structure
Each dataset is designed as flat JSON for easy import:
```
companies/
├── {companyId}/
│   ├── sites/
│   │   └── {siteId}/
│   │       ├── subsites/
│   │       ├── bookings/
│   │       ├── stock/
│   │       ├── pos/
│   │       ├── hr/
│   │       ├── finance/
│   │       ├── messenger/
│   │       └── checklists/
```

## 📊 Data Coverage

### Bookings System
- Customer management with contact details
- Table management and floor plans
- Booking types (dine-in, takeaway, delivery)
- Waitlist management
- Event bookings

### Stock Management
- Product catalog with categories and suppliers
- Stock movements and inventory tracking
- Purchase orders and supplier management
- Stock takes and wastage tracking
- Sales integration

### POS System
- Transaction processing with detailed line items
- Payment methods (card, cash) with proper receipts
- Daily sales reporting and analytics
- Discount and promotion management
- Refund processing

### HR Management
- Employee records with full personal details
- Department and role hierarchies
- Shift scheduling and time management
- Payroll processing with UK tax calculations
- Performance reviews and announcements

### Finance System
- Chart of accounts with proper categorization
- Invoice and bill management
- Customer and supplier contacts
- Bank account reconciliation
- Expense tracking and budgeting

### Messenger System
- Internal chat functionality
- User status management
- Contact invitations and management
- Notification system
- Draft message handling

### Checklist System
- Operational checklists with multiple item types
- Scheduling (daily, weekly, monthly)
- Completion tracking with signatures and photos
- Multi-site assignment capabilities

## 🚀 Import Instructions

1. **Skeleton First**: Import `skeleton_structure.json` to establish the company hierarchy
2. **Data Import**: Import each flat dataset file to populate the respective modules
3. **Verification**: Ensure all cross-references resolve correctly
4. **Testing**: Test application functionality with the imported data

## 🔧 Technical Specifications

- **Format**: JSON (compatible with Firebase Realtime Database)
- **Encoding**: UTF-8
- **Timestamps**: Unix timestamps (milliseconds)
- **Currency**: GBP (British Pounds)
- **Date Format**: ISO 8601 strings where applicable

## 📈 Sample Data Metrics

- **Sites**: 5 restaurant locations
- **Employees**: 50+ staff members across all sites
- **Products**: 100+ menu items and inventory products
- **Transactions**: Sample POS transactions with realistic data
- **Bookings**: Customer reservations and table management
- **Checklists**: Operational procedures and compliance tracking

## 🎯 Use Cases

This dataset supports:
- Multi-site restaurant chain management
- Staff scheduling and HR operations
- Inventory and supply chain management
- Financial reporting and accounting
- Customer relationship management
- Operational compliance and quality control

## 📝 Notes

- All personal data is anonymized and suitable for testing
- Financial figures are realistic but fictional
- Phone numbers and addresses are formatted correctly but not real
- Email addresses use example domains

---

**Generated for**: 1Stop Hospitality Management System  
**Date**: January 2025  
**Version**: 1.0  
**Contact**: Development Team
