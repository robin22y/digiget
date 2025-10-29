import { useEffect, useState } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Clock, TrendingUp, Award, Users, QrCode, UserCheck, Wrench, ClipboardList, DollarSign, Zap } from 'lucide-react';
import DashboardNotifications from '../../components/DashboardNotifications';

interface Shop {
  id: string;
  shop_name: string;
  plan_type: 'basic' | 'pro';
  trial_ends_at: string;
  subscription_status: string;
}

export default function DashboardHome() {
  const { shopId } = useParams();
  const { shop } = useOutletContext<{ shop: Shop }>();
  const [stats, setStats] = useState({
    todayCustomers: 0,
    todayRewards: 0,
    todayPoints: 0,
    staffHours: 0,
    activeStaff: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [shopId]);

  const loadStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: transactions } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('shop_id', shopId)
        .gte('created_at', today.toISOString());

      const todayCustomers = transactions?.filter(t => t.transaction_type === 'point_added').length || 0;
      const todayRewards = transactions?.filter(t => t.transaction_type === 'reward_redeemed').length || 0;
      const todayPoints = transactions?.filter(t => t.transaction_type === 'point_added').length || 0;

      let staffHours = 0;
      let activeStaff = 0;

      if (shop.plan_type === 'pro') {
        const { data: clockEntries } = await supabase
          .from('clock_entries')
          .select('*, employees!inner(*)')
          .eq('shop_id', shopId)
          .gte('clock_in_time', today.toISOString());

        if (clockEntries) {
          staffHours = clockEntries
            .filter(e => e.hours_worked)
            .reduce((sum, e) => sum + (e.hours_worked || 0), 0);

          activeStaff = clockEntries.filter(e => !e.clock_out_time).length;
        }
      }

      setStats({
        todayCustomers,
        todayRewards,
        todayPoints,
        staffHours,
        activeStaff
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const daysUntilTrialEnd = shop.trial_ends_at
    ? Math.ceil((new Date(shop.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  if (loading) {
    return (
      <div className="max-w-full">
        <div className="flex items-center justify-start h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Notifications Banner */}
      <DashboardNotifications shopId={shopId || ''} />

      {/* Stats Grid with inline header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-3">
        {/* Shop name and badges at top of stats card */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900">{shop.shop_name}</h1>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {shop.plan_type === 'pro' ? 'Pro' : 'Basic'}
            </span>
            {shop.subscription_status === 'trial' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ⏰ {daysUntilTrialEnd}d
              </span>
            )}
          </div>
        </div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Today's Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center text-gray-600 text-sm mb-2">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              <span className="font-medium">Customers</span>
            </div>
            <div className="text-3xl font-bold text-blue-700">{stats.todayCustomers}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center text-gray-600 text-sm mb-2">
              <Award className="w-5 h-5 mr-2 text-purple-600" />
              <span className="font-medium">Rewards</span>
            </div>
            <div className="text-3xl font-bold text-purple-700">{stats.todayRewards}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center text-gray-600 text-sm mb-2">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              <span className="font-medium">Points</span>
            </div>
            <div className="text-3xl font-bold text-green-700">{stats.todayPoints}</div>
          </div>
          {shop.plan_type === 'pro' && (
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center text-gray-600 text-sm mb-2">
                <Clock className="w-5 h-5 mr-2 text-orange-600" />
                <span className="font-medium">Hours</span>
              </div>
              <div className="text-3xl font-bold text-orange-700">{stats.staffHours.toFixed(1)}h</div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-3">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to={`/dashboard/${shopId}/checkin`}
            className="group relative overflow-hidden px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="font-bold text-lg">Check In Customer</div>
            <div className="text-sm text-blue-100">Add points and track visits</div>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-3xl opacity-20">✓</div>
          </Link>
          <Link
            to={`/dashboard/${shopId}/customers`}
            className="group relative overflow-hidden px-6 py-5 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl text-white hover:from-teal-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="font-bold text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              View All Customers
            </div>
            <div className="text-sm text-teal-100">See all your customers</div>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-3xl opacity-20">👥</div>
          </Link>
          <Link
            to={`/dashboard/${shopId}/qr-code`}
            className="group relative overflow-hidden px-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="font-bold text-lg flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              QR Code
            </div>
            <div className="text-sm text-indigo-100">View, print, or download your check-in QR</div>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-3xl opacity-20">📱</div>
          </Link>
          {shop.plan_type === 'basic' && (
            <Link
              to={`/dashboard/${shopId}/staff`}
              className="group relative overflow-hidden px-6 py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <div className="font-bold text-lg flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Manage Your Staff
              </div>
              <div className="text-sm text-purple-100">Add or edit staff (1 staff limit)</div>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-3xl opacity-20">👥</div>
            </Link>
          )}
          {shop.plan_type === 'pro' && (
            <>
              <Link
                to={`/dashboard/${shopId}/flash-offers`}
                className="group relative overflow-hidden px-6 py-5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <div className="font-bold text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Deals
                </div>
                <div className="text-sm text-yellow-100">Create and manage flash offers</div>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-3xl opacity-20">⚡</div>
              </Link>
              <Link
                to={`/dashboard/${shopId}/staff`}
                className="group relative overflow-hidden px-6 py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <div className="font-bold text-lg flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Manage Your Staff
                </div>
                <div className="text-sm text-purple-100">Add or edit staff details</div>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-3xl opacity-20">👥</div>
              </Link>
              <Link
                to={`/dashboard/${shopId}/clock-requests`}
                className="group relative overflow-hidden px-6 py-5 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl text-white hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <div className="font-bold text-lg flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Fix Time Entries
                </div>
                <div className="text-sm text-orange-100">Review and fix clock-in requests</div>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-3xl opacity-20">⏰</div>
              </Link>
              <Link
                to={`/dashboard/${shopId}/staff/payroll`}
                className="group relative overflow-hidden px-6 py-5 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl text-white hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <div className="font-bold text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  View Payroll Report
                </div>
                <div className="text-sm text-emerald-100">Track staff hours and pay</div>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-3xl opacity-20">💰</div>
              </Link>
              <Link
                to={`/dashboard/${shopId}/tasks`}
                className="group relative overflow-hidden px-6 py-5 bg-gradient-to-r from-amber-600 to-yellow-600 rounded-xl text-white hover:from-amber-700 hover:to-yellow-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <div className="font-bold text-lg flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Staff Jobs
                </div>
                <div className="text-sm text-amber-100">View and manage staff jobs</div>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-3xl opacity-20">✓</div>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Active Staff Alert */}
      {shop.plan_type === 'pro' && stats.activeStaff > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">👥 Currently Working</h3>
              <p className="text-gray-700">{stats.activeStaff} staff member{stats.activeStaff !== 1 ? 's' : ''} clocked in</p>
            </div>
            <Link
              to={`/dashboard/${shopId}/staff`}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              View All Staff →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
