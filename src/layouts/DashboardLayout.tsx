import { useEffect, useState } from 'react';
import { Outlet, useParams, NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, CheckCircle, UserCheck, ClipboardList, Calendar, AlertTriangle, Settings, LogOut, Tablet, MapPin, Zap, Navigation, Clock, Package, QrCode, Menu, X, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Shop {
  id: string;
  shop_name: string;
  plan_type: 'basic' | 'pro';
  diary_enabled: boolean;
  payment_status?: 'ok' | 'failed' | 'grace' | 'past_due' | 'cancelled' | null;
  grace_until?: string | null;
}

export default function DashboardLayout() {
  const { shopId } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingClockRequests, setPendingClockRequests] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadShop();
    if (shopId && shop?.plan_type === 'pro') {
      loadPendingClockRequests();
      const interval = setInterval(loadPendingClockRequests, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
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
        .select('id, shop_name, plan_type, diary_enabled, payment_status, grace_until')
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
        <div className="mb-3 p-4 rounded-ios bg-gradient-to-r from-apple-orange/10 to-apple-yellow/10 border border-apple-orange/30 text-apple-orange shadow-apple">
          ⚠️ Payment failed. Pro remains active for: <b>{hrs}h {mins}m</b>. Please update your payment to avoid downgrade.
        </div>
      );
    }
    if (shop.payment_status === 'past_due') {
      return (
        <div className="mb-3 p-4 rounded-ios bg-gradient-to-r from-apple-red/10 to-red-50 border border-apple-red/30 text-apple-red shadow-apple">
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

  const navItems = [
    { to: `/dashboard/${shopId}`, icon: Home, label: 'Home', end: true },
    { to: `/dashboard/${shopId}/qr-code`, icon: QrCode, label: 'QR Code' },
    { to: `/dashboard/${shopId}/customers`, icon: Users, label: 'Customers' },
    ...(shop.plan_type === 'pro' ? [
      { to: `/dashboard/${shopId}/staff`, icon: UserCheck, label: 'Manage Staff' },
      { to: `/dashboard/${shopId}/staff-requests`, icon: Package, label: 'Staff Requests' },
      { to: `/dashboard/${shopId}/staff-locations`, icon: Navigation, label: 'Work Visits' },
      { to: `/dashboard/${shopId}/remote-workers`, icon: MapPin, label: 'Remote Workers' },
      { to: `/dashboard/${shopId}/remote-approvals`, icon: CheckCircle, label: 'Remote Approvals' },
      { to: `/dashboard/${shopId}/tasks`, icon: ClipboardList, label: 'Staff Jobs' },
      { to: `/dashboard/${shopId}/incidents`, icon: AlertTriangle, label: 'Report a Problem' },
      { to: `/dashboard/${shopId}/clock-requests`, icon: Clock, label: 'Fix Time Entries' },
    ] : []),
    ...(shop.diary_enabled ? [
      { to: `/dashboard/${shopId}/diary`, icon: Calendar, label: 'Diary' },
    ] : []),
    ...(shop.plan_type === 'basic' ? [
      { to: `/dashboard/${shopId}/staff`, icon: UserCheck, label: 'Manage Staff' },
    ] : []),
    ...(shop.plan_type === 'pro' ? [
      { to: `/dashboard/${shopId}/flash-offers`, icon: Zap, label: 'Deals' },
    ] : []),
    { to: `/dashboard/${shopId}/ratings`, icon: Star, label: 'Ratings' },
    { to: `/dashboard/${shopId}/settings`, icon: Settings, label: 'Shop Settings' },
  ];

  return (
    <div className="flex bg-ios-bg">
      <aside className="hidden md:flex md:flex-shrink-0 md:fixed md:left-0 md:top-0 md:bottom-0">
        <div className="flex flex-col w-64 bg-white border-r border-ios-separator">
          <div className="flex items-center h-16 px-5 border-b border-ios-separator bg-gradient-to-br from-apple-blue to-apple-indigo">
            <div>
              <h1 className="text-xl font-bold text-white">DigiGet</h1>
              <p className="text-xs text-white/80">{shop.shop_name}</p>
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
                    `flex items-center justify-between px-4 py-3 text-sm font-medium rounded-ios transition-all duration-200 hover-lift ${
                      isActive
                        ? 'bg-gradient-to-r from-apple-blue to-apple-indigo text-white shadow-apple'
                        : 'text-ios-label hover:bg-ios-bg active:bg-ios-bg'
                    }`
                  }
                >
                  <div className="flex items-center">
                    <item.icon className={`w-5 h-5 mr-3 ${item.to.includes('clock-requests') && pendingClockRequests > 0 ? 'animate-pulse' : ''}`} />
                    {item.label}
                  </div>
                  {isClockRequests && pendingClockRequests > 0 && (
                    <span className="ml-auto px-2.5 py-1 bg-apple-red text-white text-xs font-bold rounded-full shadow-apple">
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
              className="flex items-center px-4 py-3 text-sm font-medium rounded-ios transition-all duration-200 text-apple-blue hover:bg-ios-bg border-t border-ios-separator mt-3 hover-lift"
            >
              <Tablet className="w-5 h-5 mr-3" />
              Staff Access Link
            </a>
          </nav>

          <div className="p-4 border-t border-ios-separator bg-white">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-apple-red rounded-ios transition-all duration-200 hover:bg-ios-bg active:bg-ios-bg"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen overflow-x-hidden">
        <main className="bg-ios-bg flex-1 overflow-x-hidden">
          <div className="p-4 pb-20 md:pb-4 max-w-full overflow-x-hidden">
            {renderBillingBanner()}
            <Outlet context={{ shop }} />
          </div>
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-ios-separator z-50 safe-area-inset-bottom shadow-apple-lg">
          <div className="flex justify-around max-w-full overflow-x-hidden">
            {navItems.slice(0, 4).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setShowMobileMenu(false)}
                className={({ isActive }) =>
                  `flex flex-col items-center py-2 px-2 sm:px-3 text-xs flex-1 min-w-0 transition-all duration-200 ${
                    isActive ? 'text-apple-blue' : 'text-ios-secondary'
                  }`
                }
              >
                <item.icon className="w-5 h-5 sm:w-6 sm:h-6 mb-1 flex-shrink-0" />
                <span className="truncate w-full text-center text-[10px] sm:text-xs">{item.label}</span>
              </NavLink>
            ))}
            <button
              onClick={() => setShowMobileMenu(true)}
              className={`flex flex-col items-center py-2 px-2 sm:px-3 text-xs flex-1 min-w-0 transition-all duration-200 ${
                showMobileMenu ? 'text-apple-blue' : 'text-ios-secondary'
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
              <div className="sticky top-0 bg-gradient-to-br from-apple-blue to-apple-indigo border-b border-ios-separator px-5 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Menu</h2>
                  <p className="text-xs text-white/80">{shop.shop_name}</p>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 text-white hover:text-white/80 rounded-ios transition-all duration-200"
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
                        `flex items-center justify-between px-4 py-3 text-sm font-medium rounded-ios transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-apple-blue to-apple-indigo text-white shadow-apple'
                            : 'text-ios-label hover:bg-ios-bg active:bg-ios-bg'
                        }`
                      }
                    >
                      <div className="flex items-center">
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.label}
                      </div>
                      {isClockRequests && pendingClockRequests > 0 && (
                        <span className="ml-auto px-2.5 py-1 bg-apple-red text-white text-xs font-bold rounded-full shadow-apple">
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
                  className="flex items-center px-4 py-3 text-sm font-medium rounded-ios transition-all duration-200 text-apple-blue hover:bg-ios-bg border-t border-ios-separator mt-3"
                >
                  <Tablet className="w-5 h-5 mr-3" />
                  Staff Access Link
                </a>
              </nav>

              <div className="p-4 border-t border-ios-separator bg-white">
                <button
                  onClick={() => {
                    handleSignOut();
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm font-medium text-apple-red rounded-ios transition-all duration-200 hover:bg-ios-bg active:bg-ios-bg"
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
