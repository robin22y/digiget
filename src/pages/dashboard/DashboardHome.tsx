import { useEffect, useState } from 'react';
import { useParams, useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, Clock, Receipt,
  Settings,
  DollarSign, UserCheck, QrCode, AlertTriangle,
  Phone, FileText, Bell, Zap
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useShop } from '../../contexts/ShopContext';

interface Shop {
  id: string;
  shop_name: string;
  plan_type: 'basic' | 'pro';
  trial_ends_at?: string;
  subscription_status?: string;
}

export default function DashboardHome() {
  const { shopId: paramShopId } = useParams();
  const { shop: outletShop } = useOutletContext<{ shop: Shop }>();
  const { currentShop, hasAccess } = useShop();
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const [pendingClockRequests, setPendingClockRequests] = useState(0);

  const shop = currentShop ? {
    id: currentShop.id,
    shop_name: currentShop.shop_name,
    plan_type: (outletShop?.plan_type || 'basic') as 'basic' | 'pro',
    trial_ends_at: outletShop?.trial_ends_at || '',
    subscription_status: outletShop?.subscription_status || ''
  } : outletShop;

  const shopId = currentShop?.id || (paramShopId && hasAccess(paramShopId) ? paramShopId : shop?.id);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<string>('');
  const [shopShortCode, setShopShortCode] = useState<string>('');
  const [customersToday, setCustomersToday] = useState(0);
  const [newCustomersToday, setNewCustomersToday] = useState(0);
  const [revenueToday, setRevenueToday] = useState(0);
  const [avgRevenuePerCut, setAvgRevenuePerCut] = useState(0);
  const [lateClockOuts, setLateClockOuts] = useState(0);

  useEffect(() => {
    if (shopId) {
      loadShopLocation();
      loadShopShortCode();
      loadPendingClockRequests();
      loadDashboardStats();
      setLoading(false);
      const interval = setInterval(() => {
        loadPendingClockRequests();
        loadDashboardStats();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [shopId]);

  // Security: Clear owner PIN unlock when returning from external pages (shop portal, tablet)
  // This ensures PIN is required again after navigating away
  useEffect(() => {
    if (shopId && routeLocation.pathname === `/dashboard/${shopId}`) {
      // Check if we're returning from an external page by checking document referrer
      // or by checking if the unlock was set recently (within last second)
      const unlockTime = sessionStorage.getItem(`owner_unlock_time_${shopId}`);
      if (unlockTime) {
        const timeSinceUnlock = Date.now() - parseInt(unlockTime, 10);
        // If unlock was set more than 5 seconds ago, we likely navigated away and back
        // Clear it to force PIN re-entry
        if (timeSinceUnlock > 5000) {
          // Check if we came from shop or tablet pages
          const referrer = document.referrer;
          if (referrer && (referrer.includes('/shop/') || referrer.includes('/tablet/') || referrer.includes('/staff/'))) {
            sessionStorage.removeItem(`owner_unlocked_${shopId}`);
            sessionStorage.removeItem(`owner_unlock_time_${shopId}`);
          }
        }
      }
    }
  }, [routeLocation.pathname, shopId]);

  const loadShopShortCode = async () => {
    try {
      const { data } = await supabase
        .from('shops')
        .select('short_code')
        .eq('id', shopId)
        .single();
      
      if (data?.short_code) {
        setShopShortCode(data.short_code);
      }
    } catch (error) {
      console.error('Error loading shop short code:', error);
    }
  };

  const loadPendingClockRequests = async () => {
    try {
      const { count } = await supabase
        .from('clock_in_requests')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .eq('status', 'pending');
      if (count !== null) {
        setPendingClockRequests(count);
      }
    } catch (error) {
      console.error('Error loading pending clock requests:', error);
    }
  };

  const loadShopLocation = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('latitude, longitude, shop_name')
        .eq('id', shopId)
        .single();
      
      if (error) {
        const { data: minimalData } = await supabase
          .from('shops')
          .select('shop_name')
          .eq('id', shopId)
          .single();
        
        if (minimalData) {
          setLocation('Location not set');
        } else {
          setLocation('Location not set');
        }
        return;
      }
      
      if (data) {
        if (data.latitude && data.longitude) {
          setLocation(`${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`);
        } else {
          setLocation('Location not set');
        }
      } else {
        setLocation('Location not set');
      }
    } catch (error) {
      console.error('Error loading location:', error);
      setLocation('Location not set');
    }
  };

  const loadDashboardStats = async () => {
    if (!shopId) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowISO = tomorrow.toISOString();

      // Get customers today (from customer_visits using created_at)
      const { count: visitsToday } = await supabase
        .from('customer_visits')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .gte('created_at', todayISO)
        .lt('created_at', tomorrowISO);

      setCustomersToday(visitsToday || 0);

      // Get new customers today
      const { count: newCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .gte('created_at', todayISO)
        .lt('created_at', tomorrowISO);

      setNewCustomersToday(newCustomers || 0);

      // Get revenue today (from customer_visits bill_amount using created_at)
      const { data: visitsData } = await supabase
        .from('customer_visits')
        .select('bill_amount, created_at')
        .eq('shop_id', shopId)
        .gte('created_at', todayISO)
        .lt('created_at', tomorrowISO);

      const totalRevenue = visitsData?.reduce((sum, visit) => sum + (parseFloat(visit.bill_amount?.toString() || '0') || 0), 0) || 0;
      setRevenueToday(totalRevenue);
      
      // Calculate average per cut
      const visitCount = visitsData?.length || 1;
      setAvgRevenuePerCut(visitCount > 0 ? totalRevenue / visitCount : 0);

      // Check for late clock outs (simplified - check if any clock entries don't have clock_out_time today)
      const { count: lateCount } = await supabase
        .from('clock_entries')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .gte('clock_in_time', todayISO)
        .lt('clock_in_time', tomorrowISO)
        .is('clock_out_time', null);

      setLateClockOuts(lateCount || 0);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Mobile Dashboard - Modern iPhone-style layout
  const MobileDashboard = () => (
    <div className="md:hidden bg-[#f7f8fa] min-h-screen pb-6">
      {/* Header Bar */}
      <div className="sticky top-0 z-50 bg-[#222] text-white px-4 py-3 flex items-center justify-center shadow-md">
        <h1 className="text-lg font-bold text-white">Digiget</h1>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Stats Row - 2 Cards side by side */}
        <div className="grid grid-cols-2 gap-3">
          {/* Customers Today Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 font-medium">Customers Today</span>
              <Users className="w-4 h-4 text-[#2F80ED]" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{customersToday}</div>
            {newCustomersToday > 0 && (
              <div className="text-xs text-[#2F80ED] mt-1 font-medium">+{newCustomersToday} new</div>
            )}
          </div>

          {/* Revenue Today Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 font-medium">Est. Revenue Today</span>
              <DollarSign className="w-4 h-4 text-[#F2994A]" />
            </div>
            <div className="text-2xl font-bold text-gray-900">£{revenueToday.toFixed(2)}</div>
            {avgRevenuePerCut > 0 && (
              <div className="text-xs text-[#F2994A] mt-1 font-medium">Avg per cut: £{avgRevenuePerCut.toFixed(2)}</div>
            )}
          </div>
        </div>

        {/* Action Alert */}
        {(pendingClockRequests > 0 || lateClockOuts > 0) && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {pendingClockRequests > 0 && `${pendingClockRequests} Clock-In Request${pendingClockRequests > 1 ? 's' : ''}`}
                    {pendingClockRequests > 0 && lateClockOuts > 0 && ' • '}
                    {lateClockOuts > 0 && `${lateClockOuts} Staff Clocked Out Late`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate(`/dashboard/${shopId}/clock-requests`)}
                className="text-sm font-semibold text-[#2F80ED] px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
              >
                Review
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions Section */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 px-1">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            {/* Check-in Customer - Blue */}
                          <button
                            onClick={() => {
                              // Clear owner PIN unlock when navigating to shop portal
                              // This ensures PIN is required again when returning
                              if (shopId) {
                                sessionStorage.removeItem(`owner_unlocked_${shopId}`);
                                sessionStorage.removeItem(`owner_unlock_time_${shopId}`);
                              }
                              if (shopShortCode) {
                                navigate(`/shop/${shopShortCode}`);
                              } else {
                                // Fallback to tablet portal if no short code
                                navigate(`/tablet/${shopId}`);
                              }
                            }}
                            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 shadow-sm border border-blue-200 flex flex-col items-center gap-2 hover:shadow-md hover:scale-[1.02] transition-all active:scale-95"
                          >
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-gray-900">Check-in</div>
                <div className="text-[10px] text-gray-600">Customer</div>
              </div>
            </button>

            {/* Clock In/Out - Indigo */}
                          <button
                            onClick={() => {
                              // Clear owner PIN unlock when navigating to tablet portal
                              // This ensures PIN is required again when returning
                              if (shopId) {
                                sessionStorage.removeItem(`owner_unlocked_${shopId}`);
                                sessionStorage.removeItem(`owner_unlock_time_${shopId}`);
                              }
                              navigate(`/tablet/${shopId}`);
                            }}
                            className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-4 shadow-sm border border-indigo-200 flex flex-col items-center gap-2 hover:shadow-md hover:scale-[1.02] transition-all active:scale-95"
                          >
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-gray-900">Clock</div>
                <div className="text-[10px] text-gray-600">In/Out</div>
              </div>
            </button>

            {/* Manage Staff - Green */}
            <button
              onClick={() => navigate(`/dashboard/${shopId}/staff`)}
              className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-4 shadow-sm border border-green-200 flex flex-col items-center gap-2 hover:shadow-md hover:scale-[1.02] transition-all active:scale-95"
            >
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-gray-900">Manage</div>
                <div className="text-[10px] text-gray-600">Staff</div>
              </div>
            </button>
          </div>
        </div>

        {/* Reports & Management Section */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 px-1">Reports & Management</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Customers - Blue */}
            <button
              onClick={() => navigate(`/dashboard/${shopId}/customers`)}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 shadow-sm border border-blue-200 flex items-center gap-3 hover:shadow-md hover:scale-[1.02] transition-all active:scale-98"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">Customers</div>
                <div className="text-xs text-gray-600">All Customers</div>
              </div>
            </button>

            {/* Revenue - Green */}
            <button
              onClick={() => navigate(`/dashboard/${shopId}/revenue`)}
              className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-4 shadow-sm border border-green-200 flex items-center gap-3 hover:shadow-md hover:scale-[1.02] transition-all active:scale-98"
            >
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">Revenue</div>
                <div className="text-xs text-gray-600">Dashboard</div>
              </div>
            </button>

            {/* Payroll - Teal */}
            <button
              onClick={() => navigate(`/dashboard/${shopId}/payroll`)}
              className="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-2xl p-4 shadow-sm border border-teal-200 flex items-center gap-3 hover:shadow-md hover:scale-[1.02] transition-all active:scale-98"
            >
              <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">Payroll</div>
                <div className="text-xs text-gray-600">Report</div>
              </div>
            </button>

            {/* QR Code - Indigo */}
            <button
              onClick={() => navigate(`/dashboard/${shopId}/qr-code`)}
              className="bg-gradient-to-br from-indigo-50 to-blue-100 rounded-2xl p-4 shadow-sm border border-indigo-200 flex items-center gap-3 hover:shadow-md hover:scale-[1.02] transition-all active:scale-98"
            >
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">QR Code</div>
                <div className="text-xs text-gray-600">Staff Access</div>
              </div>
            </button>

            {/* Deals - Orange/Amber */}
            <button
              onClick={() => navigate(`/dashboard/${shopId}/flash-offers`)}
              className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-4 shadow-sm border border-amber-200 flex items-center gap-3 hover:shadow-md hover:scale-[1.02] transition-all active:scale-98"
            >
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">Deals</div>
                <div className="text-xs text-gray-600">& Promotions</div>
              </div>
            </button>

            {/* Notifications - Purple */}
            <button
              onClick={() => navigate(`/dashboard/${shopId}/notifications`)}
              className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-4 shadow-sm border border-purple-200 flex items-center gap-3 hover:shadow-md hover:scale-[1.02] transition-all active:scale-98"
            >
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">Notifications</div>
                <div className="text-xs text-gray-600">Alerts</div>
              </div>
            </button>

            {/* Settings - Gray/Slate - Full width at bottom */}
            <button
              onClick={() => navigate(`/dashboard/${shopId}/settings`)}
              className="col-span-2 bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-3 hover:shadow-md hover:scale-[1.02] transition-all active:scale-98"
            >
              <div className="w-10 h-10 bg-slate-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">Shop Settings</div>
                <div className="text-xs text-gray-600">Configure your shop preferences</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Desktop Dashboard - Keep existing desktop layout
  const DesktopDashboard = () => (
    <>
      {/* Desktop Header - Show on desktop */}
      <div className="hidden md:block mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{shop?.shop_name || 'My Shop'}</h1>
        <p className="text-gray-600 mt-1">{location || 'Location not set'}</p>
      </div>

      {/* Desktop Quick Actions Grid - Show on desktop */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <button
          onClick={() => navigate(`/dashboard/${shopId}/customers`)}
          className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
        >
          <Users className="w-6 h-6 mr-3 text-blue-600" />
          <div className="font-semibold text-gray-900">Customers</div>
        </button>
        <button
          onClick={() => navigate(`/dashboard/${shopId}/qr-code`)}
          className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
        >
          <QrCode className="w-6 h-6 mr-3 text-blue-600" />
          <div className="font-semibold text-gray-900">QR Code</div>
        </button>
        <button
          onClick={() => navigate(`/dashboard/${shopId}/staff`)}
          className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
        >
          <UserCheck className="w-6 h-6 mr-3 text-blue-600" />
          <div className="font-semibold text-gray-900">Manage Staff</div>
        </button>
        <button
          onClick={() => navigate(`/dashboard/${shopId}/revenue`)}
          className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
        >
          <DollarSign className="w-6 h-6 mr-3 text-blue-600" />
          <div className="font-semibold text-gray-900">Revenue</div>
        </button>
        <button
          onClick={() => navigate(`/dashboard/${shopId}/payroll`)}
          className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
        >
          <Receipt className="w-6 h-6 mr-3 text-blue-600" />
          <div className="font-semibold text-gray-900">Payroll Report</div>
        </button>
        <button
          onClick={() => navigate(`/dashboard/${shopId}/clock-requests`)}
          className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all relative"
        >
          <Clock className={`w-6 h-6 mr-3 text-blue-600 ${pendingClockRequests > 0 ? 'animate-pulse' : ''}`} />
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Clock-In Requests</div>
            {pendingClockRequests > 0 && (
              <div className="text-sm text-red-600 font-bold">{pendingClockRequests} pending</div>
            )}
          </div>
        </button>
        <button
          onClick={() => navigate(`/dashboard/${shopId}/settings`)}
          className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
        >
          <Settings className="w-6 h-6 mr-3 text-blue-600" />
          <div className="font-semibold text-gray-900">Shop Settings</div>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Dashboard */}
      <MobileDashboard />
      
      {/* Desktop Dashboard */}
      <div className="hidden md:block">
        <DesktopDashboard />
      </div>
    </>
  );
}
