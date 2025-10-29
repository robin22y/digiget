import { useEffect, useState } from 'react';
import { Outlet, useParams, NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, CheckCircle, UserCheck, ClipboardList, Calendar, AlertTriangle, Settings, LogOut, Tablet, MapPin, Zap, Navigation, Clock, Package, QrCode, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Shop {
  id: string;
  shop_name: string;
  plan_type: 'basic' | 'pro';
  diary_enabled: boolean;
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
        .select('id, shop_name, plan_type, diary_enabled')
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
    { to: `/dashboard/${shopId}/checkin`, icon: CheckCircle, label: 'Check In' },
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
    { to: `/dashboard/${shopId}/flash-offers`, icon: Zap, label: 'Deals' },
    { to: `/dashboard/${shopId}/settings`, icon: Settings, label: 'Shop Settings' },
  ];

  return (
    <div className="flex bg-white">
      <aside className="hidden md:flex md:flex-shrink-0 md:fixed md:left-0 md:top-0 md:bottom-0">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200">
          <div className="flex items-center h-14 px-4 border-b border-gray-200">
            <div>
              <h1 className="text-xl font-bold text-blue-600">DigiGet</h1>
              <p className="text-xs text-gray-600">{shop.shop_name}</p>
            </div>
          </div>

          <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isClockRequests = item.to.includes('clock-requests');
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <div className="flex items-center">
                    <item.icon className="w-4 h-4 mr-2.5" />
                    {item.label}
                  </div>
                  {isClockRequests && pendingClockRequests > 0 && (
                    <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
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
              className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-50 border-t border-gray-200 mt-2"
            >
              <Tablet className="w-4 h-4 mr-2.5" />
              Staff Access Link
            </a>
          </nav>

          <div className="p-3 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen overflow-x-hidden">
        <main className="bg-gray-50 flex-1 overflow-x-hidden">
          <div className="p-4 pb-20 md:pb-4 max-w-full overflow-x-hidden">
            <Outlet context={{ shop }} />
          </div>
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
          <div className="flex justify-around max-w-full overflow-x-hidden">
            {navItems.slice(0, 4).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setShowMobileMenu(false)}
                className={({ isActive }) =>
                  `flex flex-col items-center py-2 px-2 sm:px-3 text-xs flex-1 min-w-0 ${
                    isActive ? 'text-blue-600' : 'text-gray-600'
                  }`
                }
              >
                <item.icon className="w-5 h-5 sm:w-6 sm:h-6 mb-1 flex-shrink-0" />
                <span className="truncate w-full text-center text-[10px] sm:text-xs">{item.label}</span>
              </NavLink>
            ))}
            <button
              onClick={() => setShowMobileMenu(true)}
              className={`flex flex-col items-center py-2 px-2 sm:px-3 text-xs flex-1 min-w-0 ${
                showMobileMenu ? 'text-blue-600' : 'text-gray-600'
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
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Menu</h2>
                  <p className="text-xs text-gray-600">{shop.shop_name}</p>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="px-2 py-4 space-y-1">
                {navItems.map((item) => {
                  const isClockRequests = item.to.includes('clock-requests');
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setShowMobileMenu(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`
                      }
                    >
                      <div className="flex items-center">
                        <item.icon className="w-4 h-4 mr-2.5" />
                        {item.label}
                      </div>
                      {isClockRequests && pendingClockRequests > 0 && (
                        <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
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
                  className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-50 border-t border-gray-200 mt-2"
                >
                  <Tablet className="w-4 h-4 mr-2.5" />
                  Staff Access Link
                </a>
              </nav>

              <div className="p-3 border-t border-gray-200">
                <button
                  onClick={() => {
                    handleSignOut();
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2.5" />
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
