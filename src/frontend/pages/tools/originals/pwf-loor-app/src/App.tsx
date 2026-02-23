import type React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import UploadPage from "./pages/UploadPage"
import ItemSummaryPage from "./pages/ItemSummaryPage"
import TurnOversPage from "./pages/TurnOversPage"
import { LogInProvider } from "./context/LogInContext"
import { AppContainer, AppBox } from "./styles/StyledComponents"
import AppNavbar from "./pages/AppNavBar"
import AppTheme from "./context/AppTheme"
import ProtectedRoute from "./components/ProtectedRoute"
import Login from "./pages/LogIn"
import ResetPassword from "./pages/ForgotPassword"
import Register from "./pages/Register"
import StaffList from "./pages/StaffList"
import HolidayCalendar from "./pages/HolidayCalander"
import ManagerCalendar from "./pages/ManagerCalander"
import { RoleProvider } from "./context/RoleContext"
import RegisterManager from "./pages/RegisterManager"
import NumbersPage from "./pages/NumbersPage"
import MaintenanceListPage from "./pages/MaintenanceList"
import ChecklistPage from "./pages/ChecklistPage"
import RoleChecklistPage from "./pages/RoleChecklistPage"
import NotesToManagersPage from "./pages/NotesToManagersPage"
import SharedTablesPage from "./pages/SharedTablesPage"
import CombinedRunsheetPreordersPage from "./pages/RunsheetsAndPreordersPage"
import InviteStaff from "./pages/InviteStaff"
import AssignTables from "./pages/AssignTables"
import MenuManagement from "./pages/MenuManagement"
import CustomerMenuView from "./pages/CustomerMenuView"
import MenuView from "./pages/MenuView"
import TableTracking from "./pages/TableTracking"
import ConsumablesManagement from "./pages/ConsumablesManagement"
import BrunchSharesPage from "./pages/BrunchSharesPage"

const App: React.FC = () => {
  return (
    <LogInProvider>
      <RoleProvider>
        <AppTheme>
          <Router>
            <AppContainer>
              <AppNavbar />
              <AppBox>
                <Routes>
                  <Route path="/LogIn" element={<Login />} />
                  <Route path="/456321789" element={<Register />} />
                  <Route path="/08800880" element={<RegisterManager />} />
                  <Route path="/ResetPassword" element={<ResetPassword />} />
                  <Route path="/" element={<ProtectedRoute element={<CombinedRunsheetPreordersPage />} />} />
                  <Route path="/Upload" element={<ProtectedRoute element={<UploadPage />} />} />
                  <Route path="/Summary" element={<ProtectedRoute element={<ItemSummaryPage />} />} />
                  <Route path="/Turnovers" element={<ProtectedRoute element={<TurnOversPage />} />} />
                  <Route path="/Staff" element={<ProtectedRoute element={<StaffList />} />} />
                  <Route path="/Holidays" element={<ProtectedRoute element={<HolidayCalendar />} />} />
                  <Route path="/Holiday" element={<ProtectedRoute element={<ManagerCalendar />} />} />
                  <Route path="/Numbers" element={<ProtectedRoute element={<NumbersPage />} />} />
                  <Route path="/Maintenance" element={<ProtectedRoute element={<MaintenanceListPage />} />} />
                  <Route path="/Checklist" element={<ProtectedRoute element={<ChecklistPage />} />} />
                  <Route path="/MyChecklist" element={<ProtectedRoute element={<RoleChecklistPage />} />} />
                  <Route path="/Notes" element={<ProtectedRoute element={<NotesToManagersPage />} />} />
                  <Route path="/Shared" element={<ProtectedRoute element={<SharedTablesPage />} />} />
                  <Route path="/BrunchShares" element={<ProtectedRoute element={<BrunchSharesPage />} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                  <Route path="/Invite" element={<ProtectedRoute element={<InviteStaff />} />} />
                  <Route path="/Consumables" element={<ProtectedRoute element={<ConsumablesManagement />} />} />
                  <Route path="/Menus" element={<ProtectedRoute element={<MenuView />} />} />
                  <Route path="/MenuManagement" element={<ProtectedRoute element={<MenuManagement />} />} />
                  <Route path="/TableTracking" element={<ProtectedRoute element={<TableTracking />} />} />
                  <Route path="/AssignTables" element={<ProtectedRoute element={<AssignTables />} />} />
                  <Route path="/customer-menu/:menuId" element={<CustomerMenuView />} />
                </Routes>
              </AppBox>
            </AppContainer>
          </Router>
        </AppTheme>
      </RoleProvider>
    </LogInProvider>
  )
}

export default App
