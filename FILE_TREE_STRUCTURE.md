# 1Stop Version 5.3 - Complete File Tree Structure

## 📁 Complete Directory Tree with File Descriptions

```
1Stop-Version-5.3/
│
├── 📄 package.json                      # Project dependencies, scripts, and npm configuration
├── 📄 package-lock.json                 # Locked dependency versions
├── 📄 tsconfig.json                     # TypeScript configuration for main app
├── 📄 tsconfig.node.json                # TypeScript config for Node.js tools
├── 📄 vite.config.ts                    # Vite bundler configuration (main app)
├── 📄 vite.config.ess.ts                # Vite config for ESS mobile app
├── 📄 tailwind.config.ts                # Tailwind CSS configuration
├── 📄 postcss.config.js                 # PostCSS configuration
├── 📄 postcss.config.mjs                # PostCSS config (ES module)
├── 📄 firebase.json                     # Firebase hosting and functions config
├── 📄 database.rules.json               # Firebase Realtime Database security rules
├── 📄 vercel.json                       # Vercel deployment configuration
├── 📄 docker-compose.yml                # Docker Compose configuration
├── 📄 Dockerfile.main                   # Docker configuration for main app
├── 📄 nginx.conf                        # Nginx server configuration
├── 📄 index.html                        # Main HTML entry point
├── 📄 README.md                         # Project readme
│
├── 📁 public/                           # Static assets directory
│   ├── logo.png                         # Application logo
│   └── vite.svg                         # Vite logo
│
├── 📁 functions/                        # Firebase Cloud Functions
│   ├── 📄 package.json                  # Functions dependencies
│   ├── 📄 tsconfig.json                 # TypeScript config for functions
│   ├── 📄 env.example                   # Environment variables template
│   │
│   ├── 📁 src/                          # Functions source code
│   │   ├── index.ts                     # Main functions entry point - exports all functions
│   │   ├── admin.ts                     # Admin operations functions
│   │   ├── hmrcOAuth.ts                 # HMRC OAuth authentication handler
│   │   ├── oauthGoogle.ts               # Google OAuth authentication handler
│   │   ├── oauthOutlook.ts              # Outlook OAuth authentication handler
│   │   ├── checkOAuthStatus.ts          # OAuth status checking function
│   │   ├── sendEmailWithGmail.ts        # Gmail email sending function
│   │   ├── sendTestEmail.ts             # Test email sending function
│   │   └── keys.ts                      # API keys management
│   │
│   └── 📁 lib/                          # Compiled JavaScript output
│
├── 📁 scripts/                          # Build and utility scripts
│
├── 📁 src/                              # Main source code directory
│   │
│   ├── 📄 main.tsx                      # ⭐ Application entry point - initializes React app
│   ├── 📄 App.tsx                       # ⭐ Main app component - handles routing and layout
│   │
│   ├── 📁 backend/                      # Backend logic and state management
│   │   │
│   │   ├── 📁 context/                  # React Context providers for state management
│   │   │   ├── CompanyContext.tsx       # Manages company data, site/subsite selection
│   │   │   ├── SettingsContext.tsx      # Manages user and app settings
│   │   │   ├── HRContext.tsx            # HR module state (employees, shifts, payroll)
│   │   │   ├── BookingsContext.tsx      # Booking system state (reservations, calendar)
│   │   │   ├── FinanceContext.tsx       # Finance module state (transactions, invoices)
│   │   │   ├── StockContext.tsx         # Stock/inventory state (items, purchases, counts)
│   │   │   ├── POSContext.tsx           # POS system state (orders, menu, payments)
│   │   │   ├── DashboardContext.tsx     # Dashboard widgets and layout state
│   │   │   ├── MessengerContext.tsx     # Internal messaging state
│   │   │   ├── NotificationsContext.tsx # Notification system state
│   │   │   ├── AnalyticsContext.tsx     # Analytics data state
│   │   │   ├── AssistantContext.tsx     # AI assistant state
│   │   │   ├── CalculatorContext.tsx    # Calculator widget state
│   │   │   └── helpers.ts               # Context helper functions
│   │   │
│   │   ├── 📁 functions/                # Business logic functions for each module
│   │   │   ├── Company.tsx              # Company CRUD operations
│   │   │   ├── HRs.tsx                  # HR operations (employees, shifts, payroll)
│   │   │   ├── Bookings.tsx             # Booking operations (create, update, manage)
│   │   │   ├── Finance.tsx              # Basic finance operations
│   │   │   ├── FinanceAdvanced.tsx      # Advanced finance operations
│   │   │   ├── Stock.tsx                # Stock management operations
│   │   │   ├── POS.tsx                  # POS operations (orders, payments)
│   │   │   ├── PayrollCalculation.tsx   # Payroll calculation logic
│   │   │   ├── HMRCRTISubmission.tsx    # HMRC RTI submission functions
│   │   │   ├── HMRCSettings.tsx         # HMRC settings management
│   │   │   ├── Analytics.tsx            # Analytics calculations
│   │   │   ├── Messenger.tsx            # Messaging operations
│   │   │   ├── Notifications.tsx        # Notification operations
│   │   │   ├── Settings.tsx             # Settings operations
│   │   │   ├── MeasureHelpers.tsx       # Unit of measure conversion utilities
│   │   │   └── ProtectedRoute.tsx       # Route protection component
│   │   │
│   │   ├── 📁 interfaces/               # TypeScript type definitions
│   │   │   ├── Company.tsx              # Company-related types
│   │   │   ├── HRs.tsx                  # HR types (Employee, Shift, Payroll)
│   │   │   ├── Bookings.tsx             # Booking types (Reservation, Table)
│   │   │   ├── Finance.tsx              # Finance types (Transaction, Invoice)
│   │   │   ├── Stock.tsx                # Stock types (Item, Purchase, Count)
│   │   │   ├── POS.tsx                  # POS types (Order, Menu, Payment)
│   │   │   ├── Dashboard.tsx            # Dashboard widget types
│   │   │   ├── Messenger.tsx            # Messenger types (Message, Chat)
│   │   │   ├── Notifications.tsx        # Notification types
│   │   │   ├── Settings.tsx             # Settings types
│   │   │   └── Checklist.ts             # Checklist types
│   │   │
│   │   ├── 📁 rtdatabase/               # Firebase Realtime Database operations
│   │   │   ├── Company.tsx              # Company database CRUD
│   │   │   ├── HRs.tsx                  # HR database operations
│   │   │   ├── Bookings.tsx             # Booking database operations
│   │   │   ├── Finance.tsx              # Finance database operations
│   │   │   ├── Stock.tsx                # Stock database operations
│   │   │   ├── POS.tsx                  # POS database operations
│   │   │   ├── Product.tsx              # Product database operations
│   │   │   ├── Location.tsx             # Location database operations
│   │   │   ├── Messenger.tsx            # Messenger database operations
│   │   │   ├── Notifications.tsx        # Notifications database operations
│   │   │   └── Settings.tsx             # Settings database operations
│   │   │
│   │   ├── 📁 services/                 # External service integrations
│   │   │   ├── Firebase.ts              # Firebase initialization and config
│   │   │   ├── Google.ts                # Google API integration (OAuth, Calendar, Gmail)
│   │   │   ├── VertexAI.ts              # Google Vertex AI integration
│   │   │   ├── VertexService.ts         # Vertex AI service wrapper
│   │   │   ├── WeatherService.tsx       # Weather data service
│   │   │   │
│   │   │   ├── 📁 hmrc/                 # HMRC API integration services
│   │   │   │   ├── index.ts             # HMRC services exports
│   │   │   │   ├── HMRCAPIClient.ts     # HMRC API HTTP client
│   │   │   │   ├── HMRCAuthService.ts   # HMRC OAuth authentication
│   │   │   │   ├── RTIXMLGenerator.ts   # RTI XML document generator
│   │   │   │   ├── RTIValidationService.ts # RTI validation logic
│   │   │   │   ├── FraudPreventionService.ts # Fraud prevention headers
│   │   │   │   └── types.ts             # HMRC type definitions
│   │   │   │
│   │   │   ├── 📁 payroll/              # Payroll calculation services
│   │   │   │   ├── index.ts             # Payroll services exports
│   │   │   │   ├── PayrollEngine.ts     # Main payroll calculation engine
│   │   │   │   ├── TaxCalculation.ts    # Tax calculation logic
│   │   │   │   ├── NICalculation.ts     # National Insurance calculations
│   │   │   │   ├── PensionCalculation.ts # Pension contribution calculations
│   │   │   │   ├── StudentLoanCalculation.ts # Student loan deductions
│   │   │   │   └── types.ts             # Payroll types
│   │   │   │
│   │   │   └── 📁 pos-integration/      # POS system integrations
│   │   │       ├── index.ts             # POS integration exports
│   │   │       ├── types.ts             # Integration types
│   │   │       └── 📁 lightspeed/       # Lightspeed POS integration
│   │   │           ├── index.ts         # Lightspeed exports
│   │   │           ├── LightspeedAPIClient.ts # Lightspeed API client
│   │   │           ├── LightspeedAuthService.ts # Lightspeed OAuth
│   │   │           └── LightspeedSyncService.ts # Data synchronization
│   │   │
│   │   ├── 📁 utils/                    # Utility functions
│   │   │   ├── CachedFetcher.ts         # Cached data fetching utilities
│   │   │   ├── ContextCacheWrapper.tsx  # Context caching wrapper component
│   │   │   ├── ContextDependencies.ts   # Context dependency management
│   │   │   ├── DataCache.ts             # General data caching utilities
│   │   │   ├── dashboardUtils.ts        # Dashboard utility functions
│   │   │   ├── checklistUtils.ts        # Checklist utility functions
│   │   │   ├── emailSender.ts           # Email sending utilities
│   │   │   ├── PerformanceTimer.ts      # Performance monitoring utilities
│   │   │   └── testVertexAI.ts          # Vertex AI testing utilities
│   │   │
│   │   └── 📁 hooks/                    # Custom React hooks
│   │       ├── useCachedData.ts         # Hook for cached data fetching
│   │       └── useContextSelector.ts    # Optimized context selector hook
│   │
│   ├── 📁 frontend/                     # Frontend components and pages
│   │   │
│   │   ├── 📁 components/               # UI components organized by module
│   │   │   │
│   │   │   ├── 📁 analytics/            # Analytics components
│   │   │   │   ├── AnalyticsDashboard.tsx # Main analytics dashboard
│   │   │   │   └── ComprehensiveAnalyticsDashboard.tsx # Enhanced analytics view
│   │   │   │
│   │   │   ├── 📁 assistant/            # AI Assistant components
│   │   │   │   ├── AssistantContainer.tsx # Assistant container component
│   │   │   │   ├── AssistantWidget.tsx  # Assistant widget UI
│   │   │   │   └── ImprovedAssistant.tsx # Enhanced assistant interface
│   │   │   │
│   │   │   ├── 📁 auth/                 # Authentication components
│   │   │   │   └── JoinCompany.tsx      # Company joining interface
│   │   │   │
│   │   │   ├── 📁 bookings/             # Booking system components
│   │   │   │   ├── BookingCalendar.tsx  # Calendar view for bookings
│   │   │   │   ├── BookingDiary.tsx     # Diary view for bookings
│   │   │   │   ├── BookingForm.tsx      # Booking creation/editing form
│   │   │   │   ├── BookingList.tsx      # Booking list view
│   │   │   │   ├── BookingReports.tsx   # Booking reports interface
│   │   │   │   ├── BookingDetails.tsx   # Booking detail view
│   │   │   │   ├── BookingSettings.tsx  # Booking settings
│   │   │   │   ├── BookingSettingsTabs.tsx # Settings tabs
│   │   │   │   ├── BookingsList.tsx     # Alternative booking list
│   │   │   │   ├── TableManagement.tsx  # Table management interface
│   │   │   │   ├── FloorPlanEditor.tsx  # Floor plan designer
│   │   │   │   ├── TableLayoutDesigner.tsx # Table layout designer
│   │   │   │   ├── LocationManagement.tsx # Location management
│   │   │   │   ├── BookingTypesManagement.tsx # Booking type management
│   │   │   │   ├── StatusManagement.tsx # Booking status management
│   │   │   │   ├── TagsManagement.tsx   # Tag management
│   │   │   │   ├── WaitlistManager.tsx  # Waitlist management
│   │   │   │   ├── PreorderProfiles.tsx # Preorder profile management
│   │   │   │   ├── index.ts             # Bookings components exports
│   │   │   │   │
│   │   │   │   ├── 📁 forms/            # Booking form components (8 files)
│   │   │   │   ├── 📁 reports/          # Booking report components (11 files)
│   │   │   │   └── 📁 tools/            # Booking utility components (8 files)
│   │   │   │
│   │   │   ├── 📁 company/              # Company management components
│   │   │   │   ├── ChecklistCompletion.tsx # Checklist management
│   │   │   │   ├── GenerateJoinCode.tsx # Company join code generator
│   │   │   │   ├── JoinCompanyByCode.tsx # Join company by code UI
│   │   │   │   └── PermissionFilter.tsx # Permission filtering component
│   │   │   │
│   │   │   ├── 📁 dashboard/            # Dashboard components
│   │   │   │   ├── CustomizableDashboard.tsx # Main customizable dashboard
│   │   │   │   └── 📁 cards/            # Dashboard widget cards
│   │   │   │       ├── ChartCard.tsx    # Chart widget card
│   │   │   │       ├── KPICard.tsx      # KPI widget card
│   │   │   │       └── TableCard.tsx    # Table widget card
│   │   │   │
│   │   │   ├── 📁 finance/              # Finance module components
│   │   │   │   ├── FinanceDashboard.tsx # Finance dashboard
│   │   │   │   ├── Banking.tsx          # Banking interface
│   │   │   │   ├── Purchases.tsx        # Purchase management
│   │   │   │   ├── SalesReport.tsx      # Sales reporting
│   │   │   │   ├── Sidebar.tsx          # Finance sidebar navigation
│   │   │   │   └── 📁 forms/            # Finance form components (5 files)
│   │   │   │
│   │   │   ├── 📁 floorfriend/          # FloorFriend restaurant tools
│   │   │   │   ├── FloorFriendExcelUpload.tsx # Excel upload
│   │   │   │   ├── FloorFriendMenus.tsx # Menu management
│   │   │   │   ├── FloorFriendNotes.tsx # Notes management
│   │   │   │   ├── FloorFriendPreorders.tsx # Preorder management
│   │   │   │   ├── FloorFriendRunsheet.tsx # Runsheet generator
│   │   │   │   ├── FloorFriendTableTracking.tsx # Table tracking
│   │   │   │   └── index.ts             # FloorFriend exports
│   │   │   │
│   │   │   ├── 📁 global/               # Global/shared components
│   │   │   │   ├── GlobalAppBar.tsx     # Main application bar
│   │   │   │   ├── Sidebar.tsx          # Main sidebar navigation
│   │   │   │   ├── MobileSidebar.tsx    # Mobile sidebar
│   │   │   │   ├── CompanyDropdown.tsx  # Company selector dropdown
│   │   │   │   ├── SiteDropdown.tsx     # Site selector dropdown
│   │   │   │   ├── SiteDropdownNew.tsx  # New site dropdown
│   │   │   │   ├── SubsiteDropdown.tsx  # Subsite selector dropdown
│   │   │   │   ├── LocationSelector.tsx # Location selector
│   │   │   │   ├── LazyContextProvider.tsx # Lazy context loading wrapper
│   │   │   │   ├── LazyProviders.tsx    # Lazy provider wrapper
│   │   │   │   ├── RequireCompanyContext.tsx # Company context guard
│   │   │   │   ├── AutoSelectSiteOnBoot.tsx # Auto site selection
│   │   │   │   ├── PlaceholderComponent.tsx # Placeholder component
│   │   │   │   └── LocationPlaceholder.tsx # Location placeholder
│   │   │   │
│   │   │   ├── 📁 hr/                   # HR module components
│   │   │   │   ├── HRDashboard.tsx      # HR dashboard
│   │   │   │   ├── EmployeeList.tsx     # Employee listing
│   │   │   │   ├── EmployeeForm.tsx     # Employee form
│   │   │   │   ├── EmployeeDetailView.tsx # Employee detail view
│   │   │   │   ├── ViewEmployee.tsx     # View employee component
│   │   │   │   ├── EmployeeSelfService.tsx # Employee self-service
│   │   │   │   ├── PayrollManagement.tsx # Payroll interface
│   │   │   │   ├── ScheduleManager.tsx  # Shift scheduling manager
│   │   │   │   ├── TimeOffManagement.tsx # Leave management
│   │   │   │   ├── ClockInOutFeature.tsx # Time tracking (clock in/out)
│   │   │   │   ├── CalendarView.tsx     # Calendar view for shifts
│   │   │   │   ├── ListView.tsx         # List view for employees
│   │   │   │   ├── FinalizeShifts.tsx   # Shift finalization
│   │   │   │   ├── InviteEmployee.tsx   # Employee invitation
│   │   │   │   ├── DepartmentManagement.tsx # Department management
│   │   │   │   ├── RoleManagement.tsx   # Role management
│   │   │   │   ├── TrainingManagement.tsx # Training management
│   │   │   │   ├── PerformanceReviewManagement.tsx # Performance reviews
│   │   │   │   ├── RecruitmentManagement.tsx # Recruitment
│   │   │   │   ├── ContractsManagement.tsx # Contract management
│   │   │   │   ├── BenefitsManagement.tsx # Benefits management
│   │   │   │   ├── ExpensesManagement.tsx # Expense management
│   │   │   │   ├── ComplianceTracking.tsx # Compliance tracking
│   │   │   │   ├── WarningsTracking.tsx # Warnings tracking
│   │   │   │   ├── DiversityInclusion.tsx # Diversity & inclusion
│   │   │   │   ├── Competitions.tsx     # Competitions
│   │   │   │   ├── EventsManagement.tsx # Events management
│   │   │   │   ├── AnnouncementsManagement.tsx # Announcements
│   │   │   │   ├── ServiceChargeAllocationPage.tsx # Service charge allocation
│   │   │   │   ├── StarterChecklist.tsx # New starter checklist
│   │   │   │   ├── Settings.tsx         # HR settings
│   │   │   │   ├── HRAnalytics.tsx      # HR analytics
│   │   │   │   ├── AICalendarIntegration.tsx # AI calendar integration
│   │   │   │   ├── AICalendarModal.tsx  # AI calendar modal
│   │   │   │   ├── AICalendarRoute.tsx  # AI calendar route
│   │   │   │   ├── AICalendarSchedule.tsx # AI calendar scheduling
│   │   │   │   ├── index.ts             # HR components exports
│   │   │   │   │
│   │   │   │   ├── 📁 forms/            # HR form components (26 files)
│   │   │   │   │   ├── EmployeeCRUDForm.tsx # Employee CRUD form
│   │   │   │   │   ├── ShiftForm.tsx    # Shift form
│   │   │   │   │   ├── ScheduleCRUDForm.tsx # Schedule CRUD form
│   │   │   │   │   ├── BulkScheduleForm.tsx # Bulk scheduling form
│   │   │   │   │   ├── PayrollCRUDForm.tsx # Payroll form
│   │   │   │   │   ├── TimeOffCRUDForm.tsx # Time off form
│   │   │   │   │   ├── ClockInOutCRUDForm.tsx # Clock in/out form
│   │   │   │   │   ├── AttendanceCRUDForm.tsx # Attendance form
│   │   │   │   │   ├── DepartmentCRUDForm.tsx # Department form
│   │   │   │   │   ├── RoleCRUDForm.tsx # Role form
│   │   │   │   │   ├── TrainingCRUDForm.tsx # Training form
│   │   │   │   │   ├── PerformanceCRUDForm.tsx # Performance form
│   │   │   │   │   ├── RecruitmentCRUDForm.tsx # Recruitment form
│   │   │   │   │   ├── ContractCRUDForm.tsx # Contract form
│   │   │   │   │   ├── BenefitsCRUDForm.tsx # Benefits form
│   │   │   │   │   ├── ExpensesCRUDForm.tsx # Expenses form
│   │   │   │   │   ├── ComplianceCRUDForm.tsx # Compliance form
│   │   │   │   │   ├── WarningCRUDForm.tsx # Warning form
│   │   │   │   │   ├── CalendarCRUDForm.tsx # Calendar form
│   │   │   │   │   ├── ChecklistCRUDForm.tsx # Checklist form
│   │   │   │   │   ├── InviteCRUDForm.tsx # Invite form
│   │   │   │   │   ├── AnnouncementCRUDForm.tsx # Announcement form
│   │   │   │   │   ├── EventCRUDForm.tsx # Event form
│   │   │   │   │   ├── CompetitionCRUDForm.tsx # Competition form
│   │   │   │   │   ├── DiversityCRUDForm.tsx # Diversity form
│   │   │   │   │   └── index.ts         # Forms exports
│   │   │   │   │
│   │   │   │   ├── 📁 reports/          # HR report components (13 files)
│   │   │   │   │   ├── HRReportsDashboard.tsx # Reports dashboard
│   │   │   │   │   ├── EmployeeDirectoryReport.tsx # Employee directory
│   │   │   │   │   ├── EmployeeChangesReport.tsx # Employee changes
│   │   │   │   │   ├── NewStarterFormReport.tsx # New starter form
│   │   │   │   │   ├── LeaverFormReport.tsx # Leaver form
│   │   │   │   │   ├── HolidayEntitlementReport.tsx # Holiday entitlement
│   │   │   │   │   ├── AbsenceSummaryReport.tsx # Absence summary
│   │   │   │   │   ├── SicknessLogReport.tsx # Sickness log
│   │   │   │   │   ├── RightToWorkExpiryReport.tsx # Right to work expiry
│   │   │   │   │   ├── VisaStatusReport.tsx # Visa status
│   │   │   │   │   ├── StudentVisaHoursMonitorReport.tsx # Student visa hours
│   │   │   │   │   ├── EmployeeDocumentationTrackerReport.tsx # Documentation tracker
│   │   │   │   │   └── HMRCSubmissionHistoryReport.tsx # HMRC submission history
│   │   │   │   │
│   │   │   │   └── 📁 settings/         # HR settings components (4 files)
│   │   │   │       ├── EmployeeDefaultsTab.tsx # Employee defaults
│   │   │   │       ├── HMRCSettingsTab.tsx # HMRC settings
│   │   │   │       ├── PayrollSettingsTab.tsx # Payroll settings
│   │   │   │       └── RTISubmissionTab.tsx # RTI submission
│   │   │   │
│   │   │   ├── 📁 messenger/            # Messaging components
│   │   │   │   ├── ChatArea.tsx         # Main chat interface
│   │   │   │   ├── ChatSidebar.tsx      # Chat sidebar
│   │   │   │   ├── ContactsManager.tsx  # Contact management
│   │   │   │   ├── MessageList.tsx      # Message list display
│   │   │   │   ├── NewChatDialog.tsx    # New chat dialog
│   │   │   │   └── UserStatusBar.tsx    # User status display
│   │   │   │
│   │   │   ├── 📁 pos/                  # POS system components (37 files)
│   │   │   │   ├── Till screens, menu management, order processing components
│   │   │   │   ├── Payment handling, discount/promotion components
│   │   │   │   └── Device and table management components
│   │   │   │
│   │   │   ├── 📁 reusable/             # Reusable UI components (23 files)
│   │   │   │   ├── Buttons, modals, forms, cards, etc.
│   │   │   │   └── Shared UI components used across modules
│   │   │   │
│   │   │   ├── 📁 shared/               # Shared components
│   │   │   │   └── ExcelUpload.tsx      # Excel file upload component
│   │   │   │
│   │   │   ├── 📁 stock/                # Stock management components
│   │   │   │   ├── StockTable.tsx       # Main stock table
│   │   │   │   ├── StockDataGrid.tsx    # Stock data grid
│   │   │   │   ├── ManagementGrid.tsx   # Management grid
│   │   │   │   ├── CategoriesManagement.tsx # Category management
│   │   │   │   ├── SuppliersManagement.tsx # Supplier management
│   │   │   │   ├── LocationsManagement.tsx # Location management
│   │   │   │   ├── MeasuresManagement.tsx # Unit of measure management
│   │   │   │   ├── CoursesManagement.tsx # Course management
│   │   │   │   ├── ParLevelsManagement.tsx # Par level management
│   │   │   │   ├── ParLevelsTable.tsx   # Par levels table
│   │   │   │   ├── PurchaseOrdersTable.tsx # Purchase order table
│   │   │   │   ├── StockCountTable.tsx  # Stock count table
│   │   │   │   ├── StockSettings.tsx    # Stock settings
│   │   │   │   ├── ReportsGrid.tsx      # Reports grid
│   │   │   │   ├── index.ts             # Stock components exports
│   │   │   │   ├── index.tsx            # Alternative exports
│   │   │   │   │
│   │   │   │   ├── 📁 forms/            # Stock form components (10 files)
│   │   │   │   └── 📁 reports/          # Stock report components (9 files)
│   │   │   │
│   │   │   ├── 📁 tools/                # Utility tool components (3 files)
│   │   │   │
│   │   │   └── 📁 common/               # Common components
│   │   │       └── LocationPlaceholder.tsx # Location placeholder
│   │   │
│   │   ├── 📁 pages/                    # Page components organized by route
│   │   │   │
│   │   │   ├── 📄 Login.tsx             # Login page
│   │   │   ├── 📄 Register.tsx          # Registration page
│   │   │   ├── 📄 ResetPassword.tsx     # Password reset page
│   │   │   ├── 📄 Join.tsx              # Join page
│   │   │   ├── 📄 Settings.tsx          # Settings page router
│   │   │   ├── 📄 Dashboard.tsx         # Main dashboard page
│   │   │   ├── 📄 Company.tsx           # Company page router
│   │   │   ├── 📄 HR.tsx                # HR page router
│   │   │   ├── 📄 Bookings.tsx          # Bookings page router
│   │   │   ├── 📄 Finance.tsx           # Finance page router
│   │   │   ├── 📄 POS.tsx               # POS page router
│   │   │   ├── 📄 StockDashboard.tsx    # Stock dashboard page
│   │   │   ├── 📄 Analytics.tsx         # Analytics page
│   │   │   ├── 📄 Messenger.tsx         # Messenger page
│   │   │   ├── 📄 YourStop.tsx          # YourStop router
│   │   │   ├── 📄 CreateCompany.tsx     # Create company page
│   │   │   ├── 📄 AcceptSiteInvite.tsx  # Accept site invite page
│   │   │   ├── 📄 ContractView.tsx      # Contract view page
│   │   │   ├── 📄 Temp.tsx              # Temporary/testing page
│   │   │   ├── 📄 OAuthCallback.tsx     # OAuth callback handler
│   │   │   │
│   │   │   ├── 📁 admin/                # Admin pages
│   │   │   │   ├── AdminLayout.tsx      # Admin layout wrapper
│   │   │   │   ├── AdminDashboard.tsx   # Admin dashboard
│   │   │   │   ├── AdminContracts.tsx   # Contract management
│   │   │   │   ├── AdminClients.tsx     # Client management
│   │   │   │   ├── AdminViewer.tsx      # Admin viewer
│   │   │   │   └── CreateAdmin.tsx      # Admin creation
│   │   │   │
│   │   │   ├── 📁 company/              # Company pages
│   │   │   │   ├── CompanySetup.tsx     # Company setup wizard
│   │   │   │   ├── CompanyInfo.tsx      # Company information
│   │   │   │   ├── CreateCompanyInfo.tsx # Create company
│   │   │   │   ├── SiteManagement.tsx   # Site management
│   │   │   │   ├── CreateSiteManagement.tsx # Create site
│   │   │   │   ├── Checklists.tsx       # Checklist management
│   │   │   │   ├── ChecklistTypes.tsx   # Checklist type management
│   │   │   │   ├── ChecklistDashboard.tsx # Checklist dashboard
│   │   │   │   ├── ChecklistHistory.tsx # Checklist history
│   │   │   │   ├── MyChecklist.tsx      # User checklist
│   │   │   │   ├── Permissions.tsx      # Permission management
│   │   │   │   ├── UserSiteAllocation.tsx # User-site allocation
│   │   │   │   └── ContractManagement.tsx # Contract management
│   │   │   │
│   │   │   ├── 📁 dashboard/            # Module dashboards
│   │   │   │   ├── GlobalDashboard.tsx  # Global dashboard
│   │   │   │   ├── BookingsDashboard.tsx # Bookings dashboard
│   │   │   │   ├── FinanceDashboard.tsx # Finance dashboard
│   │   │   │   ├── HRDashboard.tsx      # HR dashboard
│   │   │   │   ├── POSDashboard.tsx     # POS dashboard
│   │   │   │   └── StockDashboard.tsx   # Stock dashboard
│   │   │   │
│   │   │   ├── 📁 finance/              # Finance pages
│   │   │   │   ├── Dashboard.tsx        # Finance dashboard
│   │   │   │   ├── Accounting.tsx       # Accounting page
│   │   │   │   ├── Banking.tsx          # Banking page
│   │   │   │   ├── Budgeting.tsx        # Budgeting page
│   │   │   │   ├── Contacts.tsx         # Contact management
│   │   │   │   ├── Currency.tsx         # Currency management
│   │   │   │   ├── Expenses.tsx         # Expense management
│   │   │   │   ├── Purchases.tsx        # Purchase management
│   │   │   │   ├── Reporting.tsx        # Reporting interface
│   │   │   │   ├── Reports.tsx          # Reports page
│   │   │   │   ├── Sales.tsx            # Sales page
│   │   │   │   ├── Settings.tsx         # Finance settings
│   │   │   │   ├── FinanceTest.tsx      # Finance testing page
│   │   │   │   └── index.ts             # Finance pages exports
│   │   │   │
│   │   │   ├── 📁 hmrc/                 # HMRC pages
│   │   │   │   └── OAuthCallback.tsx    # HMRC OAuth callback
│   │   │   │
│   │   │   ├── 📁 pos/                  # POS pages
│   │   │   │   ├── POSDashboard.tsx     # POS dashboard
│   │   │   │   ├── POSManagement.tsx    # POS management
│   │   │   │   ├── NewOrder.tsx         # New order page
│   │   │   │   ├── Orders.tsx           # Orders list
│   │   │   │   ├── OrderDetail.tsx      # Order detail view
│   │   │   │   ├── MenuManagement.tsx   # Menu management
│   │   │   │   ├── TableManagement.tsx  # Table management
│   │   │   │   ├── FloorPlanManagement.tsx # Floor plan management
│   │   │   │   ├── TillManagement.tsx   # Till management
│   │   │   │   ├── TillScreen.tsx       # Till screen interface
│   │   │   │   ├── TillFullScreen.tsx   # Full screen till
│   │   │   │   ├── TillUsage.tsx        # Till usage tracking
│   │   │   │   ├── DeviceManagement.tsx # Device management
│   │   │   │   ├── PaymentManagement.tsx # Payment method management
│   │   │   │   ├── DiscountsManagement.tsx # Discount management
│   │   │   │   ├── PromotionsManagement.tsx # Promotion management
│   │   │   │   ├── CoursesManagement.tsx # Course management
│   │   │   │   ├── SalesCategoryManagement.tsx # Sales category management
│   │   │   │   ├── ScreenManagement.tsx # Screen management
│   │   │   │   ├── BillsManagement.tsx  # Bill management
│   │   │   │   └── CorrectionsManagement.tsx # Corrections management
│   │   │   │
│   │   │   ├── 📁 stock/                # Stock pages
│   │   │   │   ├── StockItemForm.tsx    # Stock item form page
│   │   │   │   ├── AddParLevel.tsx      # Add par level page
│   │   │   │   ├── AddPurchase.tsx      # Add purchase page
│   │   │   │   ├── AddStockCount.tsx    # Add stock count page
│   │   │   │   ├── EditPurchase.tsx     # Edit purchase page
│   │   │   │   └── EditStockItem.tsx    # Edit stock item page
│   │   │   │
│   │   │   ├── 📁 tools/                # Tool pages
│   │   │   │   ├── FloorFriend.tsx      # FloorFriend tool page
│   │   │   │   ├── PdfToExcelConverter.tsx # PDF to Excel converter
│   │   │   │   ├── ExcelToPdfConverter.tsx # Excel to PDF converter
│   │   │   │   ├── ExcelReformat.tsx    # Excel reformatter
│   │   │   │   ├── ExcelPdf.tsx         # Excel/PDF utilities
│   │   │   │   └── 📁 originals/        # Original tool files
│   │   │   │
│   │   │   ├── 📁 yourstop/             # YourStop customer app pages
│   │   │   │   ├── YourStopLayout.tsx   # YourStop layout wrapper
│   │   │   │   ├── YourStopIndex.tsx    # Home page
│   │   │   │   ├── ExplorePage.tsx      # Explore restaurants
│   │   │   │   ├── RestaurantsPage.tsx  # Restaurant listing
│   │   │   │   ├── RestaurantDetailPage.tsx # Restaurant details
│   │   │   │   ├── BookingPage.tsx      # Booking interface
│   │   │   │   ├── AuthPage.tsx         # Authentication
│   │   │   │   ├── ProfileManagementPage.tsx # Profile management
│   │   │   │   ├── MyBookingsPage.tsx   # User bookings
│   │   │   │   ├── FavoritesPage.tsx    # Favorites
│   │   │   │   ├── ContactPage.tsx      # Contact page
│   │   │   │   ├── AboutPage.tsx        # About page
│   │   │   │   ├── SearchPage.tsx       # Search page
│   │   │   │   ├── ProfilePage.tsx      # User profile
│   │   │   │   └── yourstop-globals.css # YourStop global styles
│   │   │   │
│   │   │   ├── 📁 bookings/             # Booking pages
│   │   │   │   └── PreorderPage.tsx     # Preorder interface
│   │   │   │
│   │   │   └── 📁 notifications/        # Notification pages
│   │   │       └── ViewAllNotifications.tsx # Notifications view
│   │   │
│   │   ├── 📁 layouts/                  # Layout components
│   │   │   └── MainLayout.tsx           # Main application layout wrapper
│   │   │
│   │   ├── 📁 hooks/                    # Custom React hooks
│   │   │   ├── useBackgroundPreloader.ts # Background data preloading hook
│   │   │   ├── usePermission.tsx        # Permission checking hook
│   │   │   ├── useTouchInteractions.ts  # Touch interaction handling hook
│   │   │   └── useWidgetManager.ts      # Widget management hook
│   │   │
│   │   ├── 📁 styles/                   # Style files
│   │   │   ├── global.css               # Global CSS styles
│   │   │   └── Theme configuration files
│   │   │
│   │   ├── 📁 utils/                    # Frontend utility functions (7 files)
│   │   │
│   │   └── 📁 types/                    # Frontend TypeScript types
│   │
│   ├── 📁 mobile/                       # Mobile app (ESS - Employee Self-Service)
│   │   │
│   │   ├── 📄 ESSApp.tsx                # Main mobile app component
│   │   ├── 📄 MobileProviders.tsx       # Mobile context providers
│   │   ├── 📄 index.ts                  # Mobile exports
│   │   │
│   │   ├── 📁 components/               # Mobile components (7 files)
│   │   │   ├── ESSEmployeeSelector.tsx  # Employee selector
│   │   │   ├── ESSLocationSelector.tsx  # Location selector
│   │   │   ├── ESSLoadingScreen.tsx     # Loading screen
│   │   │   ├── ESSEmptyState.tsx        # Empty state
│   │   │   ├── ESSErrorScreen.tsx       # Error screen
│   │   │   └── ESSSessionRestoreWrapper.tsx # Session restore
│   │   │
│   │   ├── 📁 context/                  # Mobile context providers (2 files)
│   │   │   └── ESSContext.tsx           # ESS context
│   │   │
│   │   ├── 📁 hooks/                    # Mobile hooks (7 files)
│   │   │
│   │   ├── 📁 layouts/                  # Mobile layouts (4 files)
│   │   │   ├── ESSLayout.tsx            # Main ESS layout
│   │   │   ├── ESSHeader.tsx            # ESS header
│   │   │   └── ESSBottomNavigation.tsx  # Bottom navigation
│   │   │
│   │   ├── 📁 pages/                    # Mobile pages (12 files)
│   │   │   ├── ESSDashboard.tsx         # ESS dashboard
│   │   │   ├── ESSProfile.tsx           # Employee profile
│   │   │   ├── ESSClock.tsx             # Clock in/out
│   │   │   ├── ESSSchedule.tsx          # View schedule
│   │   │   ├── ESSPayslips.tsx          # View payslips
│   │   │   ├── ESSTimeOff.tsx           # Time off requests
│   │   │   ├── ESSHolidays.tsx          # Holiday calendar
│   │   │   ├── ESSDocuments.tsx         # Documents
│   │   │   ├── ESSEmergencyContacts.tsx # Emergency contacts
│   │   │   ├── ESSPerformance.tsx       # Performance reviews
│   │   │   ├── ESSCompanySelector.tsx   # Company selector
│   │   │   └── index.ts                 # Pages exports
│   │   │
│   │   ├── 📁 routes/                   # Mobile routing (2 files)
│   │   │   └── ESSProtectedRoute.tsx    # Protected route wrapper
│   │   │
│   │   ├── 📁 styles/                   # Mobile styles (2 files)
│   │   │
│   │   ├── 📁 types/                    # Mobile types (2 files)
│   │   │
│   │   └── 📁 utils/                    # Mobile utilities (5 files)
│   │
│   ├── 📁 components/                   # Root-level components
│   │   └── DeviceRouter.tsx             # Device detection and routing
│   │
│   ├── 📁 config/                       # Configuration files
│   │   ├── keys.ts                      # API keys configuration
│   │   └── logging.ts                   # Logging configuration
│   │
│   ├── 📁 theme/                        # Theme configuration
│   │   └── AppTheme.tsx                 # Application theme provider
│   │
│   ├── 📁 types/                        # Root-level types
│   │   └── react-animated-weather.d.ts  # Weather animation types
│   │
│   ├── 📁 utils/                        # Root-level utilities
│   │   └── deviceDetection.ts           # Device detection utilities
│   │
│   ├── 📁 yourstop/                     # Legacy YourStop implementation
│   │   └── (Next.js-based structure)
│   │
│   ├── 📁 oldyourstop/                  # Backup YourStop implementation
│   │   └── (Next.js-based structure)
│   │
│   └── 📄 vite-env.d.ts                 # Vite environment types
│
└── 📁 (Documentation files - *.md)      # Various documentation files
```

## 📋 Key File Categories

### 🎯 Entry Points
- `src/main.tsx` - React app initialization
- `src/App.tsx` - Routing and app structure
- `index.html` - HTML entry point

### 🧠 State Management
- `src/backend/context/*` - React Context providers
- Each module has its own context for state management

### 💼 Business Logic
- `src/backend/functions/*` - Module-specific operations
- `src/backend/services/*` - External service integrations
- `src/backend/rtdatabase/*` - Database operations

### 🎨 UI Components
- `src/frontend/components/*` - Organized by module
- `src/frontend/pages/*` - Page components
- `src/frontend/reusable/*` - Shared UI components

### 📱 Mobile App
- `src/mobile/*` - ESS (Employee Self-Service) mobile app
- Lightweight version for mobile devices

### ☁️ Backend Functions
- `functions/src/*` - Firebase Cloud Functions
- Handles OAuth, email sending, server-side operations

### ⚙️ Configuration
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Build configuration
- `tsconfig.json` - TypeScript configuration
- `firebase.json` - Firebase configuration
- `tailwind.config.ts` - CSS configuration

This tree structure shows the complete organization of the codebase with descriptions of what each file and directory does.
