import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ShopProvider } from './contexts/ShopContext';
import { InstallPrompt } from './components/InstallPrompt';
import { OfflineIndicator } from './components/OfflineIndicator';
import { updateManifest, detectPWAType } from './utils/manifestManager';
import ShopManifest from './pages/ShopManifest';
import ShopIcon from './pages/ShopIcon';
import LandingPage from './pages/LandingPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
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
import CustomerLoginPortal from './pages/public/CustomerLoginPortal';
import StaffPortal from './pages/staff/StaffPortal';
import ShopPortal from './pages/ShopPortal';
import { TabletSetup } from './pages/TabletSetup';
import { ShopOwnerHome } from './pages/ShopOwnerHome';
import { CustomerAnalytics } from './pages/CustomerAnalytics';
import { OwnerAnalytics } from './pages/OwnerAnalytics';
import StaffClockIn from './pages/staff/StaffClockIn';
import CustomerCheckIn from './pages/staff/CustomerCheckIn';
import NFCClockIn from './pages/NFCClockIn';
import QRClockIn from './pages/QRClockIn';
import ShortUrlRedirect from './pages/ShortUrlRedirect';
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
import EmailTemplates from './pages/super-admin/EmailTemplates';
import AssignNFCTags from './pages/super-admin/AssignNFCTags';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import TopRatedShops from './pages/super-admin/TopRatedShops';
// @ts-ignore - JSX file
import ShopTalk from './pages/ShopTalk.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import GDPRRights from './pages/GDPRRights';
import CookiePolicy from './pages/CookiePolicy';
import DashboardRedirect from './pages/DashboardRedirect';
import SubscriptionCancelled from './pages/SubscriptionCancelled';
import AccountDeleted from './pages/AccountDeleted';

function ManifestUpdater() {
  const location = useLocation();
  const params = useParams();

  useEffect(() => {
    const { type, shopCode } = detectPWAType(location.pathname);
    
    // Optionally load shop name for Apple title (cosmetic only)
    if (type === 'shop' && shopCode) {
      const loadShopName = async () => {
        try {
          const { supabase } = await import('./lib/supabase');
          const { data: shop } = await supabase
            .from('shops')
            .select('shop_name')
            .eq('short_code', shopCode)
            .maybeSingle();
          
          if (shop?.shop_name) {
            // Update Apple title only - uses single manifest
            const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement;
            if (appleTitle) {
              appleTitle.content = shop.shop_name;
            }
          }
        } catch (error) {
          console.error('Error loading shop name:', error);
        }
      };
      loadShopName();
    }
    
    // Always use single unified manifest
    updateManifest('default', shopCode);
  }, [location.pathname, params.code]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <BrowserRouter>
        <ManifestUpdater />
        <Routes>
          {/* Manifest and Icon Routes - Must be before other routes */}
          <Route path="/shop/:code/manifest.json" element={<ShopManifest />} />
          <Route path="/shop/:code/icon" element={<ShopIcon />} />
          
          {/* Existing Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/create-super-admin" element={<CreateSuperAdmin />} />

          <Route path="/:shopId/balance" element={<CustomerBalance />} />
          <Route path="/rewards" element={<CustomerArea />} />
          <Route path="/customer/:shopId/login" element={<CustomerLoginPortal />} />

          <Route path="/tablet/:shopId" element={<TabletInterface />} />
          
          <Route path="/xtra/:staffIdentifier" element={<TabletInterfaceByName />} />

          {/* Staff Portal - Personal (for phones) */}
          <Route path="/staff-portal/:shopSlug" element={<StaffPortal />} />
          <Route path="/staff/:code" element={<StaffPortal />} />

          {/* Shop Portal - Shared Tablet (shop PIN) */}
          <Route path="/shop/:code" element={<ShopPortal />} />
          
          {/* Tablet Setup - First Time Authorization */}
          <Route path="/setup/:code" element={<TabletSetup />} />
          
          {/* Shop Owner Home - Simplified Dashboard */}
          <Route path="/owner-home" element={<ShopOwnerHome />} />
          
          {/* Customer Analytics */}
          <Route path="/analytics" element={<CustomerAnalytics />} />

          {/* New staff-facing pages */}
          <Route path="/staff/:shopId/clock-in" element={<StaffClockIn />} />
          <Route path="/staff/:shopId/check-in-customer" element={<CustomerCheckIn />} />
          <Route path="/staff/:shopId/check-in-customer/:employeeId" element={<CustomerCheckIn />} />
          
          {/* NFC Clock-In (public route, no auth required) */}
          <Route path="/nfc-clock" element={<NFCClockIn />} />
          
          {/* QR Code Clock-In (public route, no auth required) */}
          <Route path="/qr-clock" element={<QRClockIn />} />

          {/* Short URL routes (short codes) */}
          <Route path="/s/:code" element={<ShortUrlRedirect redirectType="clock-in" />} />
          <Route path="/p/:code" element={<Navigate to="/staff/:code" replace />} />

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
          <Route path="/subscription-cancelled" element={<SubscriptionCancelled />} />
          <Route path="/account-deleted" element={<AccountDeleted />} />
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
            <Route path="payroll" element={<PayrollPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
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
            <Route path="analytics" element={<OwnerAnalytics />} />
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
            <Route path="email-templates" element={<EmailTemplates />} />
            <Route path="assign-nfc-tags" element={<AssignNFCTags />} />
            <Route path="settings" element={<SuperAdminSettings />} />
          </Route>

        </Routes>
        <OfflineIndicator />
        <InstallPrompt />
      </BrowserRouter>
      </ShopProvider>
    </AuthProvider>
  );
}

export default App;
