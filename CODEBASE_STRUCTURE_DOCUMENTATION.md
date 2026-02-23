# 1Stop Version 5.3 - Codebase Structure Documentation

## Overview
This is a comprehensive business management platform built with React, TypeScript, Vite, and Firebase. The application consists of multiple modules: HR Management, Bookings, Finance, POS (Point of Sale), Stock Management, Analytics, and a customer-facing booking app (YourStop).

---

## Root Level Files

### Configuration Files

#### `package.json`
- **Purpose**: Defines project dependencies, scripts, and metadata
- **Key Actions**:
  - Manages npm packages and dependencies
  - Contains build scripts for main app, ESS (mobile), and YourStop
  - Provides dev, build, test, and deploy commands
- **Use**: Run `npm install` to install dependencies, `npm run dev` to start development server

#### `vite.config.ts`
- **Purpose**: Vite bundler configuration
- **Key Actions**:
  - Configures React plugin
  - Sets up path aliases (@, @frontend, @yourstop)
  - Handles environment variable transformations
  - Configures build optimizations
- **Use**: Controls build process and development server settings

#### `tsconfig.json` & `tsconfig.node.json`
- **Purpose**: TypeScript compiler configuration
- **Key Actions**: Defines TypeScript rules, paths, and compilation options
- **Use**: Ensures type safety across the codebase

#### `tailwind.config.ts`
- **Purpose**: Tailwind CSS configuration
- **Key Actions**: Defines theme, colors, and utility class configurations
- **Use**: Customizes styling system

#### `firebase.json`
- **Purpose**: Firebase hosting and functions configuration
- **Key Actions**: Configures Firebase deployment settings
- **Use**: Deploys application to Firebase hosting

#### `database.rules.json`
- **Purpose**: Firebase Realtime Database security rules
- **Key Actions**: Defines read/write permissions for database operations
- **Use**: Secures data access based on user authentication

---

## Source Directory Structure (`/src`)

### Main Entry Points

#### `main.tsx`
- **Purpose**: Application entry point
- **Key Actions**:
  - Renders React app to DOM
  - Sets up core providers (Settings, Company, LazyContextProvider)
  - Initializes routing with BrowserRouter
- **Use**: First file executed when app loads

#### `App.tsx`
- **Purpose**: Main application component with routing logic
- **Key Actions**:
  - Defines all application routes
  - Handles device detection (mobile vs desktop)
  - Manages public, protected, mobile, and YourStop routes
  - Wraps app with theme and calculator providers
- **Use**: Central routing hub for entire application

---

## Backend Directory (`/src/backend`)

### Context (`/src/backend/context`)

React Context providers for state management across modules:

#### `CompanyContext.tsx`
- **Purpose**: Manages company-related state
- **Key Actions**: Handles company selection, site/subsite management, multi-tenancy
- **Use**: Provides company data to all components

#### `SettingsContext.tsx`
- **Purpose**: Manages application settings
- **Key Actions**: Loads user preferences, theme settings, notifications
- **Use**: Provides settings throughout the app

#### `HRContext.tsx`
- **Purpose**: HR module state management
- **Key Actions**: Manages employees, shifts, payroll, attendance
- **Use**: Powers HR dashboard and employee management features

#### `BookingsContext.tsx`
- **Purpose**: Booking system state management
- **Key Actions**: Manages reservations, calendar, tables, floor plans
- **Use**: Powers booking calendar and reservation system

#### `FinanceContext.tsx`
- **Purpose**: Finance module state management
- **Key Actions**: Manages transactions, invoices, expenses, banking
- **Use**: Powers finance dashboard and accounting features

#### `StockContext.tsx`
- **Purpose**: Inventory management state
- **Key Actions**: Manages stock items, purchases, stock counts, par levels
- **Use**: Powers inventory management system

#### `POSContext.tsx`
- **Purpose**: Point of Sale system state
- **Key Actions**: Manages orders, menu items, payments, tills
- **Use**: Powers POS functionality

#### `DashboardContext.tsx`
- **Purpose**: Dashboard widget state management
- **Key Actions**: Manages customizable dashboard layouts, widgets, KPIs
- **Use**: Powers dynamic dashboard functionality

#### `MessengerContext.tsx`
- **Purpose**: Internal messaging system state
- **Key Actions**: Manages chat conversations, contacts, messages
- **Use**: Powers internal communication features

#### `NotificationsContext.tsx`
- **Purpose**: Notification system state
- **Key Actions**: Manages user notifications, alerts, reminders
- **Use**: Powers notification center

#### `AnalyticsContext.tsx`
- **Purpose**: Analytics data state
- **Key Actions**: Manages analytics metrics, reports, charts
- **Use**: Powers analytics dashboard

#### `AssistantContext.tsx`
- **Purpose**: AI assistant state management
- **Key Actions**: Manages AI chat interface, Vertex AI integration
- **Use**: Powers AI assistant features

#### `CalculatorContext.tsx`
- **Purpose**: Calculator widget state
- **Key Actions**: Manages calculator widget functionality
- **Use**: Provides calculator functionality

### Functions (`/src/backend/functions`)

Business logic functions for each module:

#### `Company.tsx`
- **Purpose**: Company management functions
- **Key Actions**: Create, update, delete companies; manage sites/subsites
- **Use**: Called by Company components for data operations

#### `HRs.tsx`
- **Purpose**: HR operations functions
- **Key Actions**: Employee CRUD, shift management, payroll calculations
- **Use**: Powers HR module functionality

#### `Bookings.tsx`
- **Purpose**: Booking operations functions
- **Key Actions**: Create/update bookings, manage tables, handle calendar events
- **Use**: Powers booking system operations

#### `Finance.tsx` & `FinanceAdvanced.tsx`
- **Purpose**: Financial operations
- **Key Actions**: Transaction management, invoicing, expense tracking
- **Use**: Powers finance module operations

#### `Stock.tsx`
- **Purpose**: Stock management operations
- **Key Actions**: Stock CRUD, purchase orders, stock counts
- **Use**: Powers inventory management

#### `POS.tsx`
- **Purpose**: POS operations
- **Key Actions**: Order creation, payment processing, menu management
- **Use**: Powers POS system

#### `PayrollCalculation.tsx`
- **Purpose**: Payroll calculation logic
- **Key Actions**: Calculate wages, taxes, NIC, pensions
- **Use**: Powers payroll processing

#### `HMRCRTISubmission.tsx` & `HMRCSettings.tsx`
- **Purpose**: HMRC integration functions
- **Key Actions**: RTI submissions, tax compliance, HMRC API integration
- **Use**: Powers HMRC compliance features

#### `Analytics.tsx`
- **Purpose**: Analytics calculations
- **Key Actions**: Generate analytics metrics, calculate KPIs
- **Use**: Powers analytics features

#### `Messenger.tsx`
- **Purpose**: Messaging operations
- **Key Actions**: Send/receive messages, manage conversations
- **Use**: Powers messaging system

#### `Notifications.tsx`
- **Purpose**: Notification operations
- **Key Actions**: Create, send, manage notifications
- **Use**: Powers notification system

#### `Settings.tsx`
- **Purpose**: Settings operations
- **Key Actions**: Update user/company settings
- **Use**: Powers settings management

#### `MeasureHelpers.tsx`
- **Purpose**: Unit of measure utilities
- **Key Actions**: Convert between measurement units
- **Use**: Used by stock and finance modules

### Interfaces (`/src/backend/interfaces`)

TypeScript type definitions for all modules:
- `Company.tsx` - Company types
- `HRs.tsx` - HR types
- `Bookings.tsx` - Booking types
- `Finance.tsx` - Finance types
- `Stock.tsx` - Stock types
- `POS.tsx` - POS types
- `Dashboard.tsx` - Dashboard types
- `Messenger.tsx` - Messenger types
- `Notifications.tsx` - Notification types
- `Settings.tsx` - Settings types
- `Checklist.ts` - Checklist types

### RTDatabase (`/src/backend/rtdatabase`)

Firebase Realtime Database operations:
- `Company.tsx` - Company database operations
- `HRs.tsx` - HR database operations
- `Bookings.tsx` - Booking database operations
- `Finance.tsx` - Finance database operations
- `Stock.tsx` - Stock database operations
- `POS.tsx` - POS database operations
- `Product.tsx` - Product database operations
- `Location.tsx` - Location database operations
- `Messenger.tsx` - Messenger database operations
- `Notifications.tsx` - Notifications database operations
- `Settings.tsx` - Settings database operations

### Services (`/src/backend/services`)

External service integrations:

#### `Firebase.ts`
- **Purpose**: Firebase initialization and configuration
- **Key Actions**: Initializes Firebase services (Auth, Database, Storage)
- **Use**: Base service for Firebase operations

#### `Google.ts`
- **Purpose**: Google API integration
- **Key Actions**: Google OAuth, Calendar API, Gmail API
- **Use**: Powers Google integrations

#### `VertexAI.ts` & `VertexService.ts`
- **Purpose**: Google Vertex AI integration
- **Key Actions**: AI chat, text generation, AI features
- **Use**: Powers AI assistant functionality

#### `WeatherService.tsx`
- **Purpose**: Weather data service
- **Key Actions**: Fetches weather information
- **Use**: Displays weather in dashboard

#### `/hmrc/` - HMRC Integration Services
- **Purpose**: HMRC API integration
- **Files**:
  - `HMRCAPIClient.ts` - HMRC API client
  - `HMRCAuthService.ts` - OAuth authentication
  - `RTIXMLGenerator.ts` - RTI XML generation
  - `RTIValidationService.ts` - RTI validation
  - `FraudPreventionService.ts` - Fraud prevention headers
  - `types.ts` - HMRC type definitions
- **Use**: Powers HMRC compliance and tax submissions

#### `/payroll/` - Payroll Services
- **Purpose**: Payroll calculation services
- **Files**:
  - `PayrollEngine.ts` - Main payroll engine
  - `TaxCalculation.ts` - Tax calculations
  - `NICalculation.ts` - National Insurance calculations
  - `PensionCalculation.ts` - Pension calculations
  - `StudentLoanCalculation.ts` - Student loan deductions
  - `types.ts` - Payroll types
- **Use**: Powers payroll processing

#### `/pos-integration/` - POS Integration Services
- **Purpose**: Third-party POS system integration
- **Files**:
  - `/lightspeed/` - Lightspeed POS integration
    - `LightspeedAPIClient.ts` - API client
    - `LightspeedAuthService.ts` - OAuth authentication
    - `LightspeedSyncService.ts` - Data synchronization
  - `types.ts` - Integration types
- **Use**: Integrates with external POS systems

### Utils (`/src/backend/utils`)

Utility functions:
- `CachedFetcher.ts` - Data caching utilities
- `ContextCacheWrapper.tsx` - Context caching wrapper
- `ContextDependencies.ts` - Context dependency management
- `DataCache.ts` - General data caching
- `dashboardUtils.ts` - Dashboard utility functions
- `checklistUtils.ts` - Checklist utilities
- `emailSender.ts` - Email sending utilities
- `PerformanceTimer.ts` - Performance monitoring

### Hooks (`/src/backend/hooks`)

Custom React hooks:
- `useCachedData.ts` - Hook for cached data fetching
- `useContextSelector.ts` - Optimized context selector hook

---

## Frontend Directory (`/src/frontend`)

### Components (`/src/frontend/components`)

UI components organized by module:

#### `/analytics/`
- `AnalyticsDashboard.tsx` - Main analytics dashboard
- `ComprehensiveAnalyticsDashboard.tsx` - Enhanced analytics view

#### `/assistant/`
- `AssistantContainer.tsx` - AI assistant container
- `AssistantWidget.tsx` - Assistant widget component
- `ImprovedAssistant.tsx` - Enhanced assistant UI

#### `/auth/`
- `JoinCompany.tsx` - Company joining component

#### `/bookings/`
- **Purpose**: Booking system components
- **Key Files**:
  - `BookingCalendar.tsx` - Calendar view
  - `BookingDiary.tsx` - Diary view
  - `BookingForm.tsx` - Booking form
  - `BookingList.tsx` - Booking list
  - `BookingReports.tsx` - Booking reports
  - `TableManagement.tsx` - Table management
  - `FloorPlanEditor.tsx` - Floor plan designer
  - `/reports/` - Booking report components
  - `/forms/` - Booking form components
  - `/tools/` - Booking utility components

#### `/company/`
- `ChecklistCompletion.tsx` - Checklist management
- `GenerateJoinCode.tsx` - Company join code generation
- `JoinCompanyByCode.tsx` - Join by code component
- `PermissionFilter.tsx` - Permission management

#### `/dashboard/`
- `/cards/` - Dashboard card components
  - `ChartCard.tsx` - Chart widget card
  - `KPICard.tsx` - KPI widget card
  - `TableCard.tsx` - Table widget card
- `CustomizableDashboard.tsx` - Main customizable dashboard

#### `/finance/`
- **Purpose**: Finance module components
- **Key Files**:
  - `FinanceDashboard.tsx` - Finance dashboard
  - `Banking.tsx` - Banking interface
  - `Purchases.tsx` - Purchase management
  - `SalesReport.tsx` - Sales reporting
  - `Sidebar.tsx` - Finance sidebar navigation
  - `/forms/` - Finance form components

#### `/floorfriend/`
- **Purpose**: FloorFriend restaurant management tools
- **Key Files**:
  - `FloorFriendExcelUpload.tsx` - Excel upload
  - `FloorFriendMenus.tsx` - Menu management
  - `FloorFriendNotes.tsx` - Notes management
  - `FloorFriendPreorders.tsx` - Preorder management
  - `FloorFriendRunsheet.tsx` - Runsheet generation
  - `FloorFriendTableTracking.tsx` - Table tracking

#### `/global/`
- **Purpose**: Global/shared components
- **Key Files**:
  - `GlobalAppBar.tsx` - Main app bar
  - `Sidebar.tsx` - Main sidebar
  - `MobileSidebar.tsx` - Mobile sidebar
  - `CompanyDropdown.tsx` - Company selector
  - `SiteDropdown.tsx` - Site selector
  - `SubsiteDropdown.tsx` - Subsite selector
  - `LocationSelector.tsx` - Location selector
  - `LazyContextProvider.tsx` - Lazy context loading
  - `LazyProviders.tsx` - Lazy provider wrapper
  - `RequireCompanyContext.tsx` - Company context guard

#### `/hr/`
- **Purpose**: HR module components
- **Key Files**:
  - `HRDashboard.tsx` - HR dashboard
  - `EmployeeList.tsx` - Employee listing
  - `EmployeeForm.tsx` - Employee form
  - `EmployeeDetailView.tsx` - Employee detail view
  - `PayrollManagement.tsx` - Payroll interface
  - `ScheduleManager.tsx` - Shift scheduling
  - `TimeOffManagement.tsx` - Leave management
  - `ClockInOutFeature.tsx` - Time tracking
  - `AICalendarIntegration.tsx` - AI calendar integration
  - `/reports/` - HR report components (13 files)
  - `/forms/` - HR form components (26 files)
  - `/settings/` - HR settings components

#### `/messenger/`
- `ChatArea.tsx` - Chat interface
- `ChatSidebar.tsx` - Chat sidebar
- `ContactsManager.tsx` - Contact management
- `MessageList.tsx` - Message list
- `NewChatDialog.tsx` - New chat dialog
- `UserStatusBar.tsx` - User status display

#### `/pos/`
- **Purpose**: POS system components (37 files)
- **Key Actions**: Till screens, menu management, order processing, payment handling
- **Use**: Powers POS interface

#### `/reusable/`
- **Purpose**: Reusable UI components
- **Files**: 23 reusable component files (buttons, modals, forms, etc.)

#### `/shared/`
- `ExcelUpload.tsx` - Excel file upload component

#### `/stock/`
- **Purpose**: Stock management components
- **Key Files**:
  - `StockTable.tsx` - Main stock table
  - `StockDataGrid.tsx` - Stock data grid
  - `CategoriesManagement.tsx` - Category management
  - `SuppliersManagement.tsx` - Supplier management
  - `LocationsManagement.tsx` - Location management
  - `MeasuresManagement.tsx` - Unit of measure management
  - `CoursesManagement.tsx` - Course management
  - `ParLevelsManagement.tsx` - Par level management
  - `PurchaseOrdersTable.tsx` - Purchase order table
  - `StockCountTable.tsx` - Stock count table
  - `/reports/` - Stock report components (9 files)
  - `/forms/` - Stock form components (10 files)

#### `/tools/`
- Utility tool components (3 files)

### Pages (`/src/frontend/pages`)

Main page components organized by route:

#### Root Level Pages
- `Login.tsx` - Login page
- `Register.tsx` - Registration page
- `ResetPassword.tsx` - Password reset
- `Join.tsx` - Join page
- `Settings.tsx` - Settings page
- `Dashboard.tsx` - Main dashboard
- `Company.tsx` - Company page router
- `HR.tsx` - HR page router
- `Bookings.tsx` - Bookings page router
- `Finance.tsx` - Finance page router
- `POS.tsx` - POS page router
- `StockDashboard.tsx` - Stock dashboard
- `Analytics.tsx` - Analytics page
- `Messenger.tsx` - Messenger page
- `YourStop.tsx` - YourStop router

#### `/admin/`
- `AdminDashboard.tsx` - Admin dashboard
- `AdminLayout.tsx` - Admin layout wrapper
- `AdminContracts.tsx` - Contract management
- `AdminClients.tsx` - Client management
- `AdminViewer.tsx` - Admin viewer
- `CreateAdmin.tsx` - Admin creation

#### `/company/`
- `CompanySetup.tsx` - Company setup wizard
- `CompanyInfo.tsx` - Company information
- `CreateCompanyInfo.tsx` - Create company
- `SiteManagement.tsx` - Site management
- `CreateSiteManagement.tsx` - Create site
- `Checklists.tsx` - Checklist management
- `ChecklistTypes.tsx` - Checklist type management
- `ChecklistDashboard.tsx` - Checklist dashboard
- `ChecklistHistory.tsx` - Checklist history
- `MyChecklist.tsx` - User checklist
- `Permissions.tsx` - Permission management
- `UserSiteAllocation.tsx` - User-site allocation
- `ContractManagement.tsx` - Contract management

#### `/dashboard/`
- Module-specific dashboards:
  - `GlobalDashboard.tsx` - Global dashboard
  - `BookingsDashboard.tsx` - Bookings dashboard
  - `FinanceDashboard.tsx` - Finance dashboard
  - `HRDashboard.tsx` - HR dashboard
  - `POSDashboard.tsx` - POS dashboard
  - `StockDashboard.tsx` - Stock dashboard

#### `/finance/`
- `Dashboard.tsx` - Finance dashboard
- `Accounting.tsx` - Accounting page
- `Banking.tsx` - Banking page
- `Budgeting.tsx` - Budgeting page
- `Contacts.tsx` - Contact management
- `Currency.tsx` - Currency management
- `Expenses.tsx` - Expense management
- `Purchases.tsx` - Purchase management
- `Reporting.tsx` - Reporting interface
- `Reports.tsx` - Reports page
- `Sales.tsx` - Sales page
- `Settings.tsx` - Finance settings
- `FinanceTest.tsx` - Finance testing page

#### `/hmrc/`
- `OAuthCallback.tsx` - HMRC OAuth callback handler

#### `/pos/`
- `POSDashboard.tsx` - POS dashboard
- `POSManagement.tsx` - POS management
- `NewOrder.tsx` - New order page
- `Orders.tsx` - Orders list
- `OrderDetail.tsx` - Order detail view
- `MenuManagement.tsx` - Menu management
- `TableManagement.tsx` - Table management
- `FloorPlanManagement.tsx` - Floor plan management
- `TillManagement.tsx` - Till management
- `TillScreen.tsx` - Till screen interface
- `TillFullScreen.tsx` - Full screen till
- `TillUsage.tsx` - Till usage tracking
- `DeviceManagement.tsx` - Device management
- `PaymentManagement.tsx` - Payment method management
- `DiscountsManagement.tsx` - Discount management
- `PromotionsManagement.tsx` - Promotion management
- `CoursesManagement.tsx` - Course management
- `SalesCategoryManagement.tsx` - Sales category management
- `ScreenManagement.tsx` - Screen management
- `BillsManagement.tsx` - Bill management
- `CorrectionsManagement.tsx` - Corrections management

#### `/stock/`
- `StockItemForm.tsx` - Stock item form
- `AddParLevel.tsx` - Add par level
- `AddPurchase.tsx` - Add purchase
- `AddStockCount.tsx` - Add stock count
- `EditPurchase.tsx` - Edit purchase
- `EditStockItem.tsx` - Edit stock item

#### `/tools/`
- `FloorFriend.tsx` - FloorFriend tool
- `PdfToExcelConverter.tsx` - PDF to Excel converter
- `ExcelToPdfConverter.tsx` - Excel to PDF converter
- `ExcelReformat.tsx` - Excel reformatter
- `ExcelPdf.tsx` - Excel/PDF utilities

#### `/yourstop/`
- **Purpose**: Customer-facing booking application pages
- **Key Files**:
  - `YourStopLayout.tsx` - Layout wrapper
  - `YourStopIndex.tsx` - Home page
  - `ExplorePage.tsx` - Explore restaurants
  - `RestaurantsPage.tsx` - Restaurant listing
  - `RestaurantDetailPage.tsx` - Restaurant details
  - `BookingPage.tsx` - Booking interface
  - `AuthPage.tsx` - Authentication
  - `ProfileManagementPage.tsx` - Profile management
  - `MyBookingsPage.tsx` - User bookings
  - `FavoritesPage.tsx` - Favorites
  - `ContactPage.tsx` - Contact page
  - `AboutPage.tsx` - About page
  - `SearchPage.tsx` - Search page
  - `ProfilePage.tsx` - User profile

#### `/bookings/`
- `PreorderPage.tsx` - Preorder interface

#### `/notifications/`
- `ViewAllNotifications.tsx` - Notifications view

### Layouts (`/src/frontend/layouts`)
- `MainLayout.tsx` - Main application layout wrapper

### Hooks (`/src/frontend/hooks`)
- `useBackgroundPreloader.ts` - Background data preloading
- `usePermission.tsx` - Permission checking hook
- `useTouchInteractions.ts` - Touch interaction handling
- `useWidgetManager.ts` - Widget management hook

### Styles (`/src/frontend/styles`)
- `global.css` - Global styles
- Theme configuration files

### Utils (`/src/frontend/utils`)
- Utility functions for frontend operations (7 files)

### Types (`/src/frontend/types`)
- Frontend-specific TypeScript type definitions

---

## Mobile Directory (`/src/mobile`)

### Purpose
Mobile app for Employee Self-Service (ESS) - lightweight version for mobile devices

### Structure
- `ESSApp.tsx` - Main mobile app component
- `MobileProviders.tsx` - Mobile-specific context providers
- `/components/` - Mobile components (7 files)
- `/context/` - Mobile context providers (2 files)
- `/hooks/` - Mobile hooks (7 files)
- `/layouts/` - Mobile layouts (4 files)
- `/pages/` - Mobile pages (12 files)
- `/routes/` - Mobile routing (2 files)
- `/styles/` - Mobile styles (2 files)
- `/types/` - Mobile types (2 files)
- `/utils/` - Mobile utilities (5 files)

### Key Actions
- Provides HR features on mobile
- Lightweight context loading
- Touch-optimized UI
- Clock in/out functionality
- Shift viewing
- Employee self-service features

---

## Other Directories

### `/src/yourstop/` & `/src/oldyourstop/`
- Legacy/backup YourStop implementation
- Contains Next.js-based version
- Used for reference and migration

### `/src/theme/`
- `AppTheme.tsx` - Application theme configuration

### `/src/components/`
- `DeviceRouter.tsx` - Device detection and routing

### `/src/config/`
- `keys.ts` - API keys configuration
- `logging.ts` - Logging configuration

### `/src/utils/`
- `deviceDetection.ts` - Device detection utilities

---

## Functions Directory (`/functions`)

Firebase Cloud Functions for backend operations:

### Source Files (`/functions/src`)
- `index.ts` - Main functions entry point
- `admin.ts` - Admin operations
- `hmrcOAuth.ts` - HMRC OAuth handling
- `oauthGoogle.ts` - Google OAuth handling
- `oauthOutlook.ts` - Outlook OAuth handling
- `checkOAuthStatus.ts` - OAuth status checking
- `sendEmailWithGmail.ts` - Gmail email sending
- `sendTestEmail.ts` - Test email functionality
- `keys.ts` - API keys management

### Purpose
- Handles server-side operations
- OAuth authentication flows
- Email sending
- Secure API key management

---

## Public Directory (`/public`)

Static assets:
- `logo.png` - Application logo
- `vite.svg` - Vite logo

---

## Scripts Directory (`/scripts`)

Utility scripts:
- Build scripts
- Deployment scripts
- Cleanup scripts

---

## Key Features by Module

### HR Module
- Employee management (CRUD)
- Shift scheduling
- Payroll processing
- Time tracking (clock in/out)
- Leave management
- Performance reviews
- Training management
- Compliance tracking
- HR reports (13 report types)
- HMRC integration for RTI submissions

### Bookings Module
- Reservation management
- Calendar/diary views
- Table management
- Floor plan designer
- Preorder system
- Waitlist management
- Booking reports (11 report types)
- Location management

### Finance Module
- Accounting operations
- Banking integration
- Invoice management
- Expense tracking
- Purchase management
- Sales reporting
- Budgeting
- Financial reports
- Multi-currency support

### POS Module
- Order management
- Menu management
- Till screen customization
- Payment processing
- Discount/promotion management
- Table tracking
- Course management
- Device management
- Lightspeed POS integration

### Stock Module
- Inventory management
- Purchase orders
- Stock counts
- Par level management
- Supplier management
- Category management
- Location management
- Unit of measure management
- Stock reports (9 report types)

### Analytics Module
- Comprehensive analytics dashboard
- KPI tracking
- Custom reports
- Data visualization
- Performance metrics

### Messenger Module
- Internal messaging
- Contact management
- Group chats
- Message history

### Dashboard Module
- Customizable dashboard
- Drag-and-drop widgets
- KPI cards
- Chart widgets
- Table widgets
- Layout saving

### YourStop Module
- Customer-facing booking app
- Restaurant discovery
- Online booking
- Profile management
- Favorites
- Booking history

---

## Technology Stack

### Frontend
- **Framework**: React 18.2
- **Language**: TypeScript
- **Build Tool**: Vite 5.0
- **Routing**: React Router DOM 6.20
- **UI Library**: Material-UI (MUI) 5.14
- **Styling**: Tailwind CSS, Emotion
- **Charts**: Chart.js, Recharts
- **State Management**: React Context API

### Backend
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Functions**: Firebase Cloud Functions
- **Hosting**: Firebase Hosting / Vercel

### External Services
- **AI**: Google Vertex AI
- **Email**: EmailJS, Gmail API
- **OAuth**: Google, Outlook, Lightspeed
- **Tax**: HMRC API
- **Weather**: Weather API

---

## Development Workflow

### Starting Development
```bash
npm run dev              # Main app
npm run dev:ess         # ESS mobile app
npm run dev:yourstop    # YourStop app
npm run dev:all         # All apps concurrently
```

### Building
```bash
npm run build           # Main app
npm run build:ess       # ESS app
npm run build:yourstop  # YourStop app
npm run build:all       # All apps
```

### Testing
```bash
npm run test:main       # Test main app
npm run lint            # Lint code
```

---

## Architecture Patterns

### Context-Based State Management
- Each module has its own context provider
- Lazy loading of contexts for performance
- Cached data fetching to reduce API calls

### Component Organization
- Feature-based folder structure
- Reusable components in `/reusable`
- Shared components in `/shared`

### Routing Strategy
- Device-based routing (mobile vs desktop)
- Protected routes for authenticated users
- Public routes for login/registration
- Module-based route organization

### Performance Optimizations
- Lazy context loading
- Code splitting by route
- Cached data fetching
- Background preloading
- Optimized re-renders with context selectors

---

## Security Features

- Firebase Authentication
- Database security rules
- Protected routes
- Permission-based access control
- OAuth for external integrations
- Secure API key management (Cloud Functions)

---

## Multi-Tenancy

- Company-based data isolation
- Site and subsite support
- User-company associations
- Permission-based access
- Context-based company selection

---

This documentation provides a comprehensive overview of the codebase structure. Each module follows consistent patterns for maintainability and scalability.
