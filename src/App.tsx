import React from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { isMobilePhone } from "./utils/deviceDetection"
import MainLayout from "./frontend/layouts/MainLayout"
import Settings from "./frontend/pages/Settings"
import AppThemeProvider from "./theme/AppTheme"
import Login from "./frontend/pages/Login"
import ProtectedRoute from "./backend/functions/ProtectedRoute"
import Register from "./frontend/pages/Register"
import Join from "./frontend/pages/Join"
import JoinCompany from "./frontend/components/auth/JoinCompany"
import ResetPassword from "./frontend/pages/ResetPassword"
import ESSApp from "./mobile/ESSApp"
import MobileProviders from "./mobile/MobileProviders"
import DeviceRouter from "./components/DeviceRouter"

// Company related imports
import Company from "./frontend/pages/Company"
import CompanySetup from "./frontend/pages/company/CompanySetup"
import CreateCompany from "./frontend/pages/CreateCompany"
import AdminLayout from "./frontend/pages/admin/AdminLayout"
import AdminDashboard from "./frontend/pages/admin/AdminDashboard"
import AdminContracts from "./frontend/pages/admin/AdminContracts"
import AdminClients from "./frontend/pages/admin/AdminClients"
import AdminViewer from "./frontend/pages/admin/AdminViewer"
import CreateAdmin from "./frontend/pages/admin/CreateAdmin"
import { CalculatorProvider } from "./backend/context/CalculatorContext"
import Temp from "./frontend/pages/Temp"
import AcceptSiteInvite from "./frontend/pages/AcceptSiteInvite"
import { LazyProviders } from "./frontend/components/global/LazyProviders"
import HR from "./frontend/pages/HR"
import Bookings from "./frontend/pages/Bookings"
import Finance from "./frontend/pages/Finance"
import POS from "./frontend/pages/POS"
import TillScreen from "./frontend/pages/pos/TillScreen"
import TillUsage from "./frontend/pages/pos/TillUsage"
import MessengerComponent from "./frontend/pages/Messenger"
import Dashboard from "./frontend/pages/Dashboard"
import StockDashboard from "./frontend/pages/StockDashboard"
import Analytics from "./frontend/pages/Analytics"
import YourStopLayout from "./frontend/pages/yourstop/YourStopLayout"
import YourStopIndex from "./frontend/pages/yourstop/YourStopIndex"
import ExplorePage from "./frontend/pages/yourstop/ExplorePage"
import RestaurantsPage from "./frontend/pages/yourstop/RestaurantsPage"
import RestaurantDetailPage from "./frontend/pages/yourstop/RestaurantDetailPage"
import BookingPage from "./frontend/pages/yourstop/BookingPage"
import AuthPage from "./frontend/pages/yourstop/AuthPage"
import ProfileManagementPage from "./frontend/pages/yourstop/ProfileManagementPage"
import MyBookingsPage from "./frontend/pages/yourstop/MyBookingsPage"
import FavoritesPage from "./frontend/pages/yourstop/FavoritesPage"
import ContactPage from "./frontend/pages/yourstop/ContactPage"
import AboutPage from "./frontend/pages/yourstop/AboutPage"
import SearchPage from "./frontend/pages/yourstop/SearchPage"
import ProfilePage from "./frontend/pages/yourstop/ProfilePage"
import FloorFriend from "./frontend/pages/tools/FloorFriend"
import PdfToExcelConverter from "./frontend/pages/tools/PdfToExcelConverter"
import ExcelToPdfConverter from "./frontend/pages/tools/ExcelToPdfConverter"
import ExcelReformat from "./frontend/pages/tools/ExcelReformat"
import AssistantContainer from "./frontend/components/assistant/AssistantContainer"
import ViewAllNotifications from "./frontend/pages/notifications/ViewAllNotifications"
import StockItemForm from "./frontend/pages/stock/StockItemForm"
import AddParLevel from "./frontend/pages/stock/AddParLevel"
import AddPurchase from "./frontend/pages/stock/AddPurchase"
import AddStockCount from "./frontend/pages/stock/AddStockCount"
import EditPurchase from "./frontend/pages/stock/EditPurchase"
import EditStockItem from "./frontend/pages/stock/EditStockItem"
import FinanceTest from "./frontend/pages/finance/FinanceTest"
import ContractView from "./frontend/pages/ContractView"
import PreorderPage from "./frontend/pages/bookings/PreorderPage"
import OAuthCallback from "./frontend/pages/OAuthCallback"
import HMRCOAuthCallback from "./frontend/pages/hmrc/OAuthCallback"
import PrivacyPolicy from "./frontend/pages/PrivacyPolicy"

// Component to redirect lowercase mobile routes to capitalized versions
const MobileRouteRedirect: React.FC<{ to: string }> = ({ to }) => {
  const location = useLocation()
  // Replace /mobile or /ess with the capitalized version, preserving the rest of the path
  const path = location.pathname.replace(/^\/mobile/i, to).replace(/^\/ess/i, to === "/Mobile" ? "/ESS" : "/Mobile")
  return <Navigate to={path} replace />
}

function AppContent() {
  const location = useLocation()
  
  // Detect if device is mobile - this is critical to prevent loading heavy contexts on mobile
  const isMobileDevice = isMobilePhone()
  const isMobileRoute = location.pathname.startsWith("/Mobile") || location.pathname.startsWith("/ESS") ||
                        location.pathname.startsWith("/mobile") || location.pathname.startsWith("/ess")
  const isPublicRoute = location.pathname.startsWith("/Login") || 
                        location.pathname.startsWith("/Register") ||
                        location.pathname.startsWith("/ResetPassword") ||
                        location.pathname.startsWith("/Join") ||
                        location.pathname.startsWith("/OAuth") ||
                        location.pathname.startsWith("/HMRC") ||
                        location.pathname.startsWith("/Preorder") ||
                        location.pathname.startsWith("/PrivacyPolicy") ||
                        location.pathname.startsWith("/privacy-policy") ||
                        location.pathname.startsWith("/login") || 
                        location.pathname.startsWith("/register") ||
                        location.pathname.startsWith("/reset-password") ||
                        location.pathname.startsWith("/join") ||
                        location.pathname.startsWith("/oauth") ||
                        location.pathname.startsWith("/hmrc") ||
                        location.pathname.startsWith("/preorder")
  const isYourStopRoute = location.pathname.startsWith("/YourStop") || 
                          location.pathname.startsWith("/yourstop")
  
  // If mobile device and not on mobile route or public route, redirect immediately
  if (isMobileDevice && !isMobileRoute && !isPublicRoute && location.pathname !== "/") {
    return <Navigate to="/Mobile" replace />
  }
  
  // For mobile routes OR mobile devices, skip LazyProviders to avoid loading heavy contexts
  // ESS is the mobile app and only loads essential contexts (Settings, Company, HR via MobileProviders)
  // YourStop routes are completely independent and should not load main app contexts
  if (isMobileRoute || isMobileDevice || isYourStopRoute) {
    return (
      <Routes>
        {/* Public routes */}
        <Route path="/Login" element={<Login />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/ResetPassword" element={<ResetPassword />} />
        <Route path="/Join" element={<Join />} />
        <Route path="/JoinCompany" element={<JoinCompany />} />
        <Route path="/AcceptSiteInvite" element={<AcceptSiteInvite />} />
        <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
        {/* Public preorder route */}
        <Route path="/Preorder/:companyId/:siteId/:bookingId" element={<PreorderPage />} />
        {/* OAuth callback routes */}
        <Route path="/OAuth/Callback/Gmail" element={<OAuthCallback />} />
        <Route path="/OAuth/Callback/Outlook" element={<OAuthCallback />} />
        <Route path="/OAuth/Callback/Lightspeed" element={<OAuthCallback />} />
        <Route path="/HMRC/Callback" element={<HMRCOAuthCallback />} />
        {/* Legacy lowercase routes for backward compatibility */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/join" element={<Join />} />
        <Route path="/join-company" element={<JoinCompany />} />
        <Route path="/accept-site-invite" element={<AcceptSiteInvite />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/preorder/:companyId/:siteId/:bookingId" element={<PreorderPage />} />
        <Route path="/oauth/callback/gmail" element={<OAuthCallback />} />
        <Route path="/oauth/callback/outlook" element={<OAuthCallback />} />
        <Route path="/oauth/callback/lightspeed" element={<OAuthCallback />} />
        <Route path="/hmrc/callback" element={<HMRCOAuthCallback />} />

        {/* Mobile Routes - /Mobile/* - ESS is the mobile app, lightweight (only HRProvider) */}
        <Route path="/Mobile" element={<Navigate to="/Mobile/dashboard" replace />} />
        <Route path="/Mobile/*" element={<MobileProviders><ESSApp /></MobileProviders>} />
        
        {/* ESS Routes - /ESS/* - Keep for backward compatibility, also needs MobileProviders */}
        <Route path="/ESS" element={<Navigate to="/ESS/dashboard" replace />} />
        <Route path="/ESS/*" element={<MobileProviders><ESSApp /></MobileProviders>} />
        
        {/* Legacy lowercase mobile routes - redirect to PascalCase for backward compatibility */}
        <Route path="/mobile" element={<Navigate to="/Mobile/dashboard" replace />} />
        <Route path="/mobile/*" element={<MobileRouteRedirect to="/Mobile" />} />
        <Route path="/ess" element={<Navigate to="/ESS/dashboard" replace />} />
        <Route path="/ess/*" element={<MobileRouteRedirect to="/ESS" />} />

        {/* YourStop Routes - Customer Booking App (Completely Independent) */}
        <Route path="/YourStop" element={<YourStopLayout><YourStopIndex /></YourStopLayout>} />
        <Route path="/YourStop/explore" element={<YourStopLayout><ExplorePage /></YourStopLayout>} />
        <Route path="/YourStop/restaurants" element={<YourStopLayout><RestaurantsPage /></YourStopLayout>} />
        <Route path="/YourStop/restaurants/:id" element={<YourStopLayout><RestaurantDetailPage /></YourStopLayout>} />
        <Route path="/YourStop/booking" element={<YourStopLayout><BookingPage /></YourStopLayout>} />
        <Route path="/YourStop/auth" element={<YourStopLayout><AuthPage /></YourStopLayout>} />
        <Route path="/YourStop/profile-management" element={<YourStopLayout><ProfileManagementPage /></YourStopLayout>} />
        <Route path="/YourStop/my-bookings" element={<YourStopLayout><MyBookingsPage /></YourStopLayout>} />
        <Route path="/YourStop/favorites" element={<YourStopLayout><FavoritesPage /></YourStopLayout>} />
        <Route path="/YourStop/contact" element={<YourStopLayout><ContactPage /></YourStopLayout>} />
        <Route path="/YourStop/about" element={<YourStopLayout><AboutPage /></YourStopLayout>} />
        <Route path="/YourStop/search" element={<YourStopLayout><SearchPage /></YourStopLayout>} />
        <Route path="/YourStop/profile" element={<YourStopLayout><ProfilePage /></YourStopLayout>} />
        <Route path="/YourStop/*" element={<YourStopLayout><YourStopIndex /></YourStopLayout>} />
        {/* Legacy lowercase YourStop routes */}
        <Route path="/yourstop" element={<Navigate to="/YourStop" replace />} />
        <Route path="/yourstop/*" element={<Navigate to="/YourStop" replace />} />

        {/* Root route - device-based redirect */}
        <Route path="/" element={<DeviceRouter />} />
      </Routes>
    )
  }
  
  return (
    <LazyProviders>
          <>
            <Routes>
              {/* Public routes */}
              <Route path="/Login" element={<Login />} />
              <Route path="/Register" element={<Register />} />
              <Route path="/ResetPassword" element={<ResetPassword />} />
              <Route path="/Join" element={<Join />} />
              <Route path="/JoinCompany" element={<JoinCompany />} />
              <Route path="/AcceptSiteInvite" element={<AcceptSiteInvite />} />
              <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
              {/* Public preorder route */}
              <Route path="/Preorder/:companyId/:siteId/:bookingId" element={<PreorderPage />} />
              {/* OAuth callback routes */}
              <Route path="/OAuth/Callback/Gmail" element={<OAuthCallback />} />
              <Route path="/OAuth/Callback/Outlook" element={<OAuthCallback />} />
              <Route path="/OAuth/Callback/Lightspeed" element={<OAuthCallback />} />
              <Route path="/HMRC/Callback" element={<HMRCOAuthCallback />} />
              {/* Legacy lowercase routes for backward compatibility */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/join" element={<Join />} />
              <Route path="/join-company" element={<JoinCompany />} />
              <Route path="/accept-site-invite" element={<AcceptSiteInvite />} />
              <Route path="/preorder/:companyId/:siteId/:bookingId" element={<PreorderPage />} />
              <Route path="/oauth/callback/gmail" element={<OAuthCallback />} />
              <Route path="/oauth/callback/outlook" element={<OAuthCallback />} />
              <Route path="/oauth/callback/lightspeed" element={<OAuthCallback />} />
              <Route path="/hmrc/callback" element={<HMRCOAuthCallback />} />

              {/* Mobile Routes - /Mobile/* - ESS is the mobile app */}
              <Route path="/Mobile" element={<Navigate to="/Mobile/dashboard" replace />} />
              <Route path="/Mobile/*" element={<MobileProviders><ESSApp /></MobileProviders>} />
              
              {/* ESS Routes - /ESS/* - Keep for backward compatibility */}
              <Route path="/ESS" element={<Navigate to="/ESS/dashboard" replace />} />
              <Route path="/ESS/*" element={<MobileProviders><ESSApp /></MobileProviders>} />
              
              {/* Legacy lowercase mobile routes - redirect to PascalCase for backward compatibility */}
              <Route path="/mobile" element={<Navigate to="/Mobile/dashboard" replace />} />
              <Route path="/mobile/*" element={<MobileRouteRedirect to="/Mobile" />} />
              <Route path="/ess" element={<Navigate to="/ESS/dashboard" replace />} />
              <Route path="/ess/*" element={<MobileRouteRedirect to="/ESS" />} />

              {/* Legacy /app route - redirect to root for backward compatibility */}
              <Route path="/app" element={<Navigate to="/" replace />} />
              <Route path="/app/*" element={<Navigate to="/" replace />} />

              {/* App Routes (PC/Tablet) - Root level */}
              <Route path="/*" element={<ProtectedRoute element={<MainLayout />} />}>
                <Route index element={<Navigate to="/Company" replace />} />
                <Route path="Dashboard" element={<Dashboard />} />

                {/* Stock Routes */}
                <Route path="Stock" element={<Navigate to="/Stock/Items" replace />} />
                <Route path="Stock/Items" element={<StockDashboard />} />
                <Route path="Stock/PurchaseOrders" element={<StockDashboard />} />
                <Route path="Stock/StockCounts" element={<StockDashboard />} />
                <Route path="Stock/ParLevels" element={<StockDashboard />} />
                <Route path="Stock/Management/*" element={<StockDashboard />} />
                <Route path="Stock/Reports" element={<StockDashboard />} />
                <Route path="Stock/Settings" element={<StockDashboard />} />
                <Route path="Stock/AddItem" element={<StockItemForm />} />
                <Route path="Stock/AddStockCount" element={<AddStockCount />} />
                <Route path="Stock/EditStockCount/:id" element={<AddStockCount />} />
                <Route path="Stock/AddPurchase" element={<AddPurchase />} />
                <Route path="Stock/AddParLevel" element={<AddParLevel />} />
                <Route path="Stock/EditPurchase/:id" element={<EditPurchase />} />
                <Route path="Stock/EditItem/:id" element={<EditStockItem />} />

                {/* Finance Routes */}
                <Route path="Finance" element={<Navigate to="/Finance/Dashboard" replace />} />
                <Route path="Finance/*" element={<Finance />} />
                <Route path="Finance-Test" element={<FinanceTest />} />

                {/* Company Routes */}
                <Route path="Company" element={<Navigate to="/Company/Dashboard" replace />} />
                <Route path="Company/*" element={<Company />} />
                <Route path="Company/Setup" element={<CompanySetup />} />
                <Route path="CreateCompany" element={<CreateCompany />} />

                {/* Tools Routes */}
                <Route path="Tools" element={<Temp />} />
                <Route path="Tools/FloorFriend" element={<FloorFriend />} />
                <Route path="Tools/PdfToExcel" element={<PdfToExcelConverter />} />
                <Route path="Tools/ExcelToPdf" element={<ExcelToPdfConverter />} />
                <Route path="Tools/ExcelReformat" element={<ExcelReformat />} />
                <Route path="Temp" element={<Temp />} />
                <Route path="Notifications" element={<ViewAllNotifications />} />

                {/* HR and Bookings Routes */}
                <Route path="HR" element={<Navigate to="/HR/Dashboard" replace />} />
                <Route path="HR/*" element={<HR />} />
                <Route path="Contract/:companyId/:siteId/:contractId" element={<ContractView />} />
                <Route path="Bookings" element={<Navigate to="/Bookings/Dashboard" replace />} />
                <Route path="Bookings/*" element={<Bookings />} />
                <Route path="Messenger" element={<MessengerComponent />} />
                <Route path="Messenger/*" element={<MessengerComponent />} />
                <Route path="Settings" element={<Navigate to="/Settings/Personal" replace />} />
                <Route path="Settings/*" element={<Settings />} />

                {/* POS Routes */}
                <Route path="POS" element={<Navigate to="/POS/ItemSales" replace />} />
                <Route path="POS/TillScreen/Add" element={<TillScreen />} />
                <Route path="POS/TillScreen/Edit/:screenId" element={<TillScreen />} />
                <Route path="POS/TillUsage" element={<TillUsage />} />
                <Route path="POS/TillUsage/:screenId" element={<TillUsage />} />
                <Route path="POS/*" element={<POS />} />

                {/* Analytics Routes */}
                <Route path="Analytics" element={<Analytics />} />

                {/* Admin Routes */}
                <Route path="admin" element={<ProtectedRoute element={<AdminLayout />} />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="create-company" element={<CreateCompany />} />
                  <Route path="create-admin" element={<CreateAdmin />} />
                  <Route path="contracts" element={<AdminContracts />} />
                  <Route path="clients" element={<AdminClients />} />
                  <Route path="viewer" element={<AdminViewer />} />
                </Route>

              </Route>

              {/* Root route - device-based redirect */}
              <Route path="/" element={<DeviceRouter />} />
              
              {/* Legacy routes - redirect to capitalized paths for backward compatibility */}
              <Route path="/dashboard" element={<Navigate to="/Dashboard" replace />} />
              <Route path="/Dashboard" element={<Navigate to="/Dashboard" replace />} />
              <Route path="/stock" element={<Navigate to="/Stock/Items" replace />} />
              <Route path="/stock/*" element={<Navigate to="/Stock/Items" replace />} />
              <Route path="/finance" element={<Navigate to="/Finance/Dashboard" replace />} />
              <Route path="/finance/*" element={<Navigate to="/Finance/Dashboard" replace />} />
              <Route path="/company" element={<Navigate to="/Company/Dashboard" replace />} />
              <Route path="/company/*" element={<Navigate to="/Company/Dashboard" replace />} />
              <Route path="/hr" element={<Navigate to="/HR/Dashboard" replace />} />
              <Route path="/hr/*" element={<Navigate to="/HR/Dashboard" replace />} />
              <Route path="/bookings" element={<Navigate to="/Bookings/Dashboard" replace />} />
              <Route path="/bookings/*" element={<Navigate to="/Bookings/Dashboard" replace />} />
              <Route path="/settings" element={<Navigate to="/Settings/Personal" replace />} />
              <Route path="/settings/*" element={<Navigate to="/Settings/Personal" replace />} />
              <Route path="/pos" element={<Navigate to="/POS/ItemSales" replace />} />
              <Route path="/pos/*" element={<Navigate to="/POS/ItemSales" replace />} />
              <Route path="/analytics" element={<Navigate to="/Analytics" replace />} />
              <Route path="/messenger" element={<Navigate to="/Messenger" replace />} />
              <Route path="/messenger/*" element={<Navigate to="/Messenger" replace />} />
              <Route path="/tools" element={<Navigate to="/Tools" replace />} />
              <Route path="/tools/*" element={<Navigate to="/Tools" replace />} />
              <Route path="/temp" element={<Navigate to="/Temp" replace />} />
              <Route path="/notifications" element={<Navigate to="/Notifications" replace />} />
              <Route path="/yourstop" element={<Navigate to="/YourStop" replace />} />
              <Route path="/yourstop/*" element={<Navigate to="/YourStop" replace />} />
              
              {/* Backward compatibility redirects for hyphenated routes */}
              <Route path="/Reset-Password" element={<Navigate to="/ResetPassword" replace />} />
              <Route path="/Join-Company" element={<Navigate to="/JoinCompany" replace />} />
              <Route path="/Accept-Site-Invite" element={<Navigate to="/AcceptSiteInvite" replace />} />
              <Route path="/Stock/Purchase-Orders" element={<Navigate to="/Stock/PurchaseOrders" replace />} />
              <Route path="/Stock/Stock-Counts" element={<Navigate to="/Stock/StockCounts" replace />} />
              <Route path="/Stock/Par-Levels" element={<Navigate to="/Stock/ParLevels" replace />} />
              <Route path="/Stock/Add-Item" element={<Navigate to="/Stock/AddItem" replace />} />
              <Route path="/Stock/Add-Stock-Count" element={<Navigate to="/Stock/AddStockCount" replace />} />
              <Route path="/Stock/Edit-Stock-Count/:id" element={<Navigate to="/Stock/EditStockCount/:id" replace />} />
              <Route path="/Stock/Add-Purchase" element={<Navigate to="/Stock/AddPurchase" replace />} />
              <Route path="/Stock/Add-Par-Level" element={<Navigate to="/Stock/AddParLevel" replace />} />
              <Route path="/Stock/Edit-Purchase/:id" element={<Navigate to="/Stock/EditPurchase/:id" replace />} />
              <Route path="/Stock/Edit-Item/:id" element={<Navigate to="/Stock/EditItem/:id" replace />} />
              <Route path="/Tools/Floor-Friend" element={<Navigate to="/Tools/FloorFriend" replace />} />
              <Route path="/Tools/Pdf-To-Excel" element={<Navigate to="/Tools/PdfToExcel" replace />} />
              <Route path="/Tools/Excel-To-Pdf" element={<Navigate to="/Tools/ExcelToPdf" replace />} />
              <Route path="/Tools/Excel-Reformat" element={<Navigate to="/Tools/ExcelReformat" replace />} />
              <Route path="/POS/Item-Sales" element={<Navigate to="/POS/ItemSales" replace />} />
              <Route path="/POS/Till-Screen/*" element={<Navigate to="/POS/TillScreen/*" replace />} />
              <Route path="/POS/Till-Usage" element={<Navigate to="/POS/TillUsage" replace />} />
              <Route path="/POS/Till-Usage/:screenId" element={<Navigate to="/POS/TillUsage/:screenId" replace />} />
            </Routes>
            <AssistantContainer />
          </>
        </LazyProviders>
  )
}

function App() {
  return (
    <AppThemeProvider>
      <CalculatorProvider>
        <AppContent />
      </CalculatorProvider>
    </AppThemeProvider>
  )
}

export default App