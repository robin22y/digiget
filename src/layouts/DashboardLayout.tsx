import { useEffect, useState } from 'react';
import { Outlet, useParams, NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, CheckCircle, UserCheck, ClipboardList, Calendar, AlertTriangle, Settings, LogOut, Tablet, MapPin, Zap, Navigation, Clock, Package, QrCode, Menu, X, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';
import { isFeatureEnabled, isAdminOrOwner } from '../config/features';
import ShopSwitcher from '../components/ShopSwitcher';

interface Shop {
  id: string;
  shop_name: string;
  plan_type: 'basic' | 'pro';
  diary_enabled: boolean;
  payment_status?: 'ok' | 'failed' | 'grace' | 'past_due' | 'cancelled' | null;
  grace_until?: string | null;
  user_id?: string;
}

export default function DashboardLayout() {
  const { shopId: paramShopId } = useParams();
  const { currentShop, hasAccess, loading: shopLoading, isMultiLocation } = useShop();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingClockRequests, setPendingClockRequests] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  
  // Use currentShop.id from context (preferred) or validated paramShopId
  const shopId = currentShop?.id || (paramShopId && hasAccess(paramShopId) ? paramShopId : null);

  // Determine if current user is shop owner/admin for feature flag bypass
  const isOwnerOrAdmin = user !== null && shop !== null && 
    (shop.user_id === user.id || isAdminOrOwner(user));

  // Validate access when paramShopId changes
  useEffect(() => {
    if (!shopLoading && paramShopId) {
      if (!hasAccess(paramShopId)) {
        navigate('/dashboard');
        return;
      }
    }
  }, [paramShopId, hasAccess, shopLoading, navigate]);

  useEffect(() => {
    if (shopId) {
      loadShop();
      if (shop?.plan_type === 'pro') {
        loadPendingClockRequests();
        const interval = setInterval(loadPendingClockRequests, 30000);
        return () => clearInterval(interval);
      }
    }
  }, [shopId, shop?.plan_type]);

  const loadPendingClockRequests = async () => {
    try {
      const { count, error } = await supabase
        .from('clock_in_requests')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .eq('status', 'pending');

      if (!error && count !== null) {
        setPendingClockRequests(count);
      }
    } catch (error) {
      console.error('Error loading pending clock requests:', error);
    }
  };

  const loadShop = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('id, shop_name, plan_type, diary_enabled, payment_status, grace_until, user_id')
        .eq('id', shopId)
        .single();

      if (error) throw error;
      setShop(data);
    } catch (error) {
      console.error('Error loading shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const renderBillingBanner = () => {
    if (!shop) return null;
    if (shop.payment_status === 'grace' && shop.grace_until) {
      const end = new Date(shop.grace_until).getTime();
      const now = Date.now();
      const ms = Math.max(0, end - now);
      const hrs = Math.floor(ms / (1000 * 60 * 60));
      const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      return (
        <div className="mb-3 p-4 rounded-modern bg-gradient-to-r from-modern-orange/10 to-modern-yellow/10 border border-modern-orange/30 text-modern-orange shadow-modern">
          ⚠️ Payment failed. Pro remains active for: <b>{hrs}h {mins}m</b>. Please update your payment to avoid downgrade.
        </div>
      );
    }
    if (shop.payment_status === 'past_due') {
      return (
        <div className="mb-3 p-4 rounded-modern bg-gradient-to-r from-modern-red/10 to-red-50 border border-modern-red/30 text-modern-red shadow-modern">
          🚫 Your account has been downgraded to Basic due to non-payment. Pro features are disabled until payment is restored.
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-start p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex items-start p-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop Not Found</h2>
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:text-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Build navigation items with feature flags
  const navItems = [
    // Core features (always visible)
    { to: `/dashboard/${shopId}`, icon: Home, label: 'Home', end: true, feature: 'dashboard' as const },
    { to: `/dashboard/${shopId}/qr-code`, icon: QrCode, label: 'QR Code', feature: 'qrCodes' as const },
    { to: `/dashboard/${shopId}/customers`, icon: Users, label: 'Customers', feature: 'viewCustomers' as const },
    
    // Staff management (visible based on plan and feature flag, always visible to owners/admins)
    ...((shop.plan_type === 'pro' || shop.plan_type === 'basic') && isFeatureEnabled('manageStaff', user) ? [
      { to: `/dashboard/${shopId}/staff`, icon: UserCheck, label: 'Manage Staff', feature: 'manageStaff' as const },
    ] : []),
    
    // Pro plan features with feature flags
    // ADMIN/OWNER: Always see all features (feature flags bypassed via isOwnerOrAdmin check in isFeatureEnabled)
    ...(shop.plan_type === 'pro' ? [
      // HIDDEN FOR BARBER SHOP FOCUS - Can be re-enabled via feature flags
      // Owners/admins always see these regardless of feature flags
      (isOwnerOrAdmin || isFeatureEnabled('staffRequests', user)) && { to: `/dashboard/${shopId}/staff-requests`, icon: Package, label: 'Staff Requests', feature: 'staffRequests' as const },
      (isOwnerOrAdmin || isFeatureEnabled('workVisits', user)) && { to: `/dashboard/${shopId}/staff-locations`, icon: Navigation, label: 'Work Visits', feature: 'workVisits' as const },
      (isOwnerOrAdmin || isFeatureEnabled('remoteWorkers', user)) && { to: `/dashboard/${shopId}/remote-workers`, icon: MapPin, label: 'Remote Workers', feature: 'remoteWorkers' as const },
      (isOwnerOrAdmin || isFeatureEnabled('remoteApprovals', user)) && { to: `/dashboard/${shopId}/remote-approvals`, icon: CheckCircle, label: 'Remote Approvals', feature: 'remoteApprovals' as const },
      (isOwnerOrAdmin || isFeatureEnabled('staffJobs', user)) && { to: `/dashboard/${shopId}/tasks`, icon: ClipboardList, label: 'Staff Jobs', feature: 'staffJobs' as const },
      (isOwnerOrAdmin || isFeatureEnabled('reportProblem', user)) && { to: `/dashboard/${shopId}/incidents`, icon: AlertTriangle, label: 'Report a Problem', feature: 'reportProblem' as const },
      (isOwnerOrAdmin || isFeatureEnabled('fixTimeEntries', user)) && { to: `/dashboard/${shopId}/clock-requests`, icon: Clock, label: 'Fix Time Entries', feature: 'fixTimeEntries' as const },
    ].filter(Boolean) as any[] : []),
    
    // Diary (if enabled)
    ...(shop.diary_enabled ? [
      { to: `/dashboard/${shopId}/diary`, icon: Calendar, label: 'Diary', feature: undefined },
    ] : []),
    
    // Deals (Pro plan only, visible to admins/owners regardless of feature flag)
    ...(shop.plan_type === 'pro' && isFeatureEnabled('dealsOffers', user) ? [
      { to: `/dashboard/${shopId}/flash-offers`, icon: Zap, label: 'Deals', feature: 'dealsOffers' as const },
    ] : []),
    
    // Ratings (hidden by feature flag, but visible to admins/owners)
    ...((isOwnerOrAdmin || isFeatureEnabled('ratings', user)) ? [
      { to: `/dashboard/${shopId}/ratings`, icon: Star, label: 'Ratings', feature: 'ratings' as const },
    ] : []),
    
    // Settings (always visible)
    { to: `/dashboard/${shopId}/settings`, icon: Settings, label: 'Shop Settings', feature: 'shopSettings' as const },
  ].filter((item): item is typeof item & { to: string; icon: any; label: string } => {
    // Filter out items that don't pass feature check
    if (!item) return false;
    if (item.feature && !isFeatureEnabled(item.feature)) return false;
    return true;
  });

  return (
    <div className="flex bg-system-bg">
      <aside className="hidden md:flex md:flex-shrink-0 md:fixed md:left-0 md:top-0 md:bottom-0">
        <div className="flex flex-col w-64 bg-white border-r border-system-separator">
          <div className="flex items-center justify-between h-16 px-5 border-b border-system-separator bg-gradient-to-br from-modern-blue to-modern-indigo">
            <div>
              <h1 className="text-xl font-bold text-white">DigiGet</h1>
              {isMultiLocation ? (
                <div className="mt-1">
                  <ShopSwitcher />
                </div>
              ) : (
                <p className="text-xs text-white/80">{shop.shop_name}</p>
              )}
            </div>
          </div>

          <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto bg-white">
            {navItems.map((item) => {
              const isClockRequests = item.to.includes('clock-requests');
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 text-sm font-medium rounded-modern transition-all duration-200 hover-lift ${
                      isActive
                        ? 'bg-gradient-to-r from-modern-blue to-modern-indigo text-white shadow-modern'
                        : 'text-system-label hover:bg-system-bg active:bg-system-bg'
                    }`
                  }
                >
                  <div className="flex items-center">
                    <item.icon className={`w-5 h-5 mr-3 ${item.to.includes('clock-requests') && pendingClockRequests > 0 ? 'animate-pulse' : ''}`} />
                    {item.label}
                  </div>
                  {isClockRequests && pendingClockRequests > 0 && (
                    <span className="ml-auto px-2.5 py-1 bg-modern-red text-white text-xs font-bold rounded-full shadow-modern">
                      {pendingClockRequests}
                    </span>
                  )}
                </NavLink>
              );
            })}

            <a
              href={`/tablet/${shopId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-3 text-sm font-medium rounded-modern transition-all duration-200 text-modern-blue hover:bg-system-bg border-t border-system-separator mt-3 hover-lift"
            >
              <Tablet className="w-5 h-5 mr-3" />
              Staff Access Link
            </a>
          </nav>

          <div className="p-4 border-t border-system-separator bg-white">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-modern-red rounded-modern transition-all duration-200 hover:bg-system-bg active:bg-system-bg"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen overflow-x-hidden">
        <main className="bg-system-bg flex-1 overflow-x-hidden">
          <div className="p-4 pb-20 md:pb-4 max-w-full overflow-x-hidden">
            {renderBillingBanner()}
            <Outlet context={{ shop }} />
          </div>
        </main>

        {/* Mobile Bottom Navigation - Simplified to 5 items max */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-system-separator z-50 safe-area-inset-bottom shadow-modern-lg">
          <div className="flex justify-around max-w-full overflow-x-hidden">
            {/* Core items: Home, QR Code, Customers, Manage Staff, More */}
            {navItems
              .filter(item => {
                // Show only core items in bottom nav: Home, QR Code, Customers, Manage Staff
                const coreItems = ['Home', 'QR Code', 'Customers', 'Manage Staff'];
                return coreItems.includes(item.label);
              })
              .slice(0, 4)
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setShowMobileMenu(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center py-2 px-2 sm:px-3 text-xs flex-1 min-w-0 transition-all duration-200 ${
                      isActive ? 'text-modern-blue' : 'text-system-secondary'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6 mb-1 flex-shrink-0" />
                  <span className="truncate w-full text-center text-[10px] sm:text-xs">{item.label}</span>
                </NavLink>
              ))}
            {/* More button - shows all other items */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className={`flex flex-col items-center py-2 px-2 sm:px-3 text-xs flex-1 min-w-0 transition-all duration-200 ${
                showMobileMenu ? 'text-modern-blue' : 'text-system-secondary'
              }`}
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 mb-1 flex-shrink-0" />
              <span className="truncate w-full text-center text-[10px] sm:text-xs">More</span>
            </button>
          </div>
        </nav>

        {/* Mobile Menu Drawer */}
        {showMobileMenu && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowMobileMenu(false)}
          >
            <div 
              className="fixed right-0 top-0 bottom-0 bg-white w-80 max-w-[85vw] shadow-xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-br from-modern-blue to-modern-indigo border-b border-system-separator px-5 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Menu</h2>
                  <p className="text-xs text-white/80">{shop.shop_name}</p>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 text-white hover:text-white/80 rounded-modern transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="px-3 py-4 space-y-1 bg-white">
                {navItems.map((item) => {
                  const isClockRequests = item.to.includes('clock-requests');
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setShowMobileMenu(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-4 py-3 text-sm font-medium rounded-modern transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-modern-blue to-modern-indigo text-white shadow-modern'
                            : 'text-system-label hover:bg-system-bg active:bg-system-bg'
                        }`
                      }
                    >
                      <div className="flex items-center">
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.label}
                      </div>
                      {isClockRequests && pendingClockRequests > 0 && (
                        <span className="ml-auto px-2.5 py-1 bg-modern-red text-white text-xs font-bold rounded-full shadow-modern">
                          {pendingClockRequests}
                        </span>
                      )}
                    </NavLink>
                  );
                })}

                <a
                  href={`/tablet/${shopId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-3 text-sm font-medium rounded-modern transition-all duration-200 text-modern-blue hover:bg-system-bg border-t border-system-separator mt-3"
                >
                  <Tablet className="w-5 h-5 mr-3" />
                  Staff Access Link
                </a>
              </nav>

              <div className="p-4 border-t border-system-separator bg-white">
                <button
                  onClick={() => {
                    handleSignOut();
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm font-medium text-modern-red rounded-modern transition-all duration-200 hover:bg-system-bg active:bg-system-bg"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
