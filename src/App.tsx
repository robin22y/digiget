import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ShopProvider } from './contexts/ShopContext';
import LandingPage from './pages/LandingPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import CreateSuperAdmin from './pages/CreateSuperAdmin';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import CheckInPage from './pages/dashboard/CheckInPage';
import QRCodePage from './pages/dashboard/QRCodePage';
import CustomersPage from './pages/dashboard/CustomersPage';
import CustomerDetail from './pages/dashboard/CustomerDetail';
import StaffPage from './pages/dashboard/StaffPage';
import PayrollPage from './pages/dashboard/PayrollPage';
import TasksPage from './pages/dashboard/TasksPage';
import TaskHistoryPage from './pages/dashboard/TaskHistoryPage';
import DiaryPage from './pages/dashboard/DiaryPage';
import IncidentsPage from './pages/dashboard/IncidentsPage';
import ClockInRequestsPage from './pages/dashboard/ClockInRequestsPage';
import StaffLocationsPage from './pages/dashboard/StaffLocationsPage';
import RemoteWorkers from './pages/dashboard/RemoteWorkers';
import RemoteClockInApprovals from './pages/dashboard/RemoteClockInApprovals';
import StaffRequestsPage from './pages/dashboard/StaffRequestsPage';
import FlashOffersPage from './pages/dashboard/FlashOffersPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import RatingsPage from './pages/dashboard/RatingsPage';
import TabletInterface from './pages/tablet/TabletInterface';
import TabletInterfaceByName from './pages/tablet/TabletInterfaceByName';
import CustomerBalance from './pages/public/CustomerBalance';
import CustomerArea from './pages/public/CustomerArea';
import StaffPortal from './pages/staff/StaffPortal';
import StaffClockIn from './pages/staff/StaffClockIn';
import CustomerCheckIn from './pages/staff/CustomerCheckIn';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedSuperAdminRoute from './components/ProtectedSuperAdminRoute';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import SuperAdminDashboard from './pages/super-admin/Dashboard';
import ManageShops from './pages/super-admin/ManageShops';
import ShopDetail from './pages/super-admin/ShopDetail';
import QRManagement from './pages/super-admin/QRManagement';
import AllDeals from './pages/super-admin/AllDeals';
import Reports from './pages/super-admin/Reports';
import Notices from './pages/super-admin/Notices';
import SuperAdminSettings from './pages/super-admin/Settings';
import TopRatedShops from './pages/super-admin/TopRatedShops';
import ShopTalk from './pages/ShopTalk.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import GDPRRights from './pages/GDPRRights';
import CookiePolicy from './pages/CookiePolicy';
import DashboardRedirect from './pages/DashboardRedirect';

function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/create-super-admin" element={<CreateSuperAdmin />} />

          <Route path="/:shopId/balance" element={<CustomerBalance />} />
          <Route path="/rewards" element={<CustomerArea />} />

          <Route path="/tablet/:shopId" element={<TabletInterface />} />
          
          <Route path="/xtra/:staffIdentifier" element={<TabletInterfaceByName />} />

          <Route path="/:shopName/:staffName" element={<StaffPortal />} />

          {/* New staff-facing pages */}
          <Route path="/staff/:shopId/clock-in" element={<StaffClockIn />} />
          <Route path="/staff/:shopId/check-in-customer" element={<CustomerCheckIn />} />
          <Route path="/staff/:shopId/check-in-customer/:employeeId" element={<CustomerCheckIn />} />

          {/* Short check-in routes */}
          <Route path="/c/:shopId" element={<CheckInPage />} />
          <Route path="/checkin/:shopId" element={<CheckInPage />} />
          
          {/* Public check-in page - accessible without authentication */}
          <Route path="/dashboard/:shopId/checkin" element={<CheckInPage />} />

          {/* Dashboard redirect - redirects to user's shop dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />

          <Route path="/blog" element={<ShopTalk />} />

          {/* Legal Pages */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/gdpr" element={<GDPRRights />} />
          <Route path="/cookies" element={<CookiePolicy />} />

          <Route
            path="/dashboard/:shopId"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="qr-code" element={<QRCodePage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:customerId" element={<CustomerDetail />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="staff/payroll" element={<PayrollPage />} />
            <Route path="staff-requests" element={<StaffRequestsPage />} />
            <Route path="staff-locations" element={<StaffLocationsPage />} />
            <Route path="remote-workers" element={<RemoteWorkers />} />
            <Route path="remote-approvals" element={<RemoteClockInApprovals />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="tasks/history" element={<TaskHistoryPage />} />
            <Route path="diary" element={<DiaryPage />} />
            <Route path="incidents" element={<IncidentsPage />} />
            <Route path="clock-requests" element={<ClockInRequestsPage />} />
            <Route path="flash-offers" element={<FlashOffersPage />} />
            <Route path="ratings" element={<RatingsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route
            path="/super-admin"
            element={
              <ProtectedSuperAdminRoute>
                <SuperAdminLayout />
              </ProtectedSuperAdminRoute>
            }
          >
            <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="shops" element={<ManageShops />} />
            <Route path="shops/:id" element={<ShopDetail />} />
            <Route path="qr-management" element={<QRManagement />} />
            <Route path="all-deals" element={<AllDeals />} />
            <Route path="top-rated-shops" element={<TopRatedShops />} />
            <Route path="reports" element={<Reports />} />
            <Route path="notices" element={<Notices />} />
            <Route path="settings" element={<SuperAdminSettings />} />
          </Route>

        </Routes>
      </BrowserRouter>
      </ShopProvider>
    </AuthProvider>
  );
}

export default App;
