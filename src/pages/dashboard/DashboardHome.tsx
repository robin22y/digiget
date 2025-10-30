import { useEffect, useState } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Clock, TrendingUp, Award, Users, QrCode, UserCheck, Wrench, ClipboardList, DollarSign, Zap, Star, MessageSquare } from 'lucide-react';
import DashboardNotifications from '../../components/DashboardNotifications';
import { maskPhone, maskCustomerId, maskEmail, maskName } from '../../utils/maskCustomerData';

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
  const [ratings, setRatings] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'actions' | 'feedbacks'>('actions');

  useEffect(() => {
    loadStats();
    loadRatings();
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

  const loadRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_ratings')
        .select(`
          *,
          customers (
            id,
            phone,
            email,
            name,
            classification
          )
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setRatings(data || []);

      // Calculate average rating
      if (data && data.length > 0) {
        const sum = data.reduce((acc, rating) => acc + rating.rating, 0);
        setAverageRating(sum / data.length);
      } else {
        setAverageRating(null);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
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
      <div className="bg-white rounded-ios shadow-apple border border-ios-separator p-5 mb-4">
        {/* Shop name and badges at top of stats card */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-ios-label">{shop.shop_name}</h1>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-apple-indigo to-apple-purple text-white shadow-apple">
              {shop.plan_type === 'pro' ? '✨ Pro' : 'Basic'}
            </span>
            {shop.subscription_status === 'trial' && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-apple-green to-green-400 text-white shadow-apple">
                ⏰ {daysUntilTrialEnd}d
              </span>
            )}
          </div>
        </div>
        <h2 className="text-sm font-semibold text-ios-secondary mb-4">Today's Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-apple-blue to-blue-400 rounded-ios p-4 shadow-apple border border-apple-blue/20">
            <div className="flex items-center text-white/90 text-sm mb-2">
              <Users className="w-5 h-5 mr-2" />
              <span className="font-medium">Customers</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.todayCustomers}</div>
          </div>
          <div className="bg-gradient-to-br from-apple-purple to-purple-400 rounded-ios p-4 shadow-apple border border-apple-purple/20">
            <div className="flex items-center text-white/90 text-sm mb-2">
              <Award className="w-5 h-5 mr-2" />
              <span className="font-medium">Rewards</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.todayRewards}</div>
          </div>
          <div className="bg-gradient-to-br from-apple-green to-green-400 rounded-ios p-4 shadow-apple border border-apple-green/20">
            <div className="flex items-center text-white/90 text-sm mb-2">
              <TrendingUp className="w-5 h-5 mr-2" />
              <span className="font-medium">Points</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.todayPoints}</div>
          </div>
          {shop.plan_type === 'pro' && (
            <div className="bg-gradient-to-br from-apple-orange to-orange-400 rounded-ios p-4 shadow-apple border border-apple-orange/20">
              <div className="flex items-center text-white/90 text-sm mb-2">
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-medium">Hours</span>
              </div>
              <div className="text-3xl font-bold text-white">{stats.staffHours.toFixed(1)}h</div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-3">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('actions')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'actions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Quick Actions
            </button>
            <button
              onClick={() => setActiveTab('feedbacks')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'feedbacks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Feedbacks from Customers
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'actions' ? (
            <>
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </>
          ) : (
            <>
              {/* Feedbacks from Customers Tab */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Feedbacks from Customers</h2>
                </div>
                <Link
                  to={`/dashboard/${shopId}/ratings`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All →
                </Link>
              </div>

              {ratings.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No customer feedback yet</p>
                  <p className="text-gray-400 text-xs mt-1">Customer ratings will appear here once they submit feedback</p>
                </div>
              ) : (
                <>
                  {/* Average Rating Display */}
                  {averageRating !== null && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Average Rating</p>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-blue-700">{averageRating.toFixed(1)}</span>
                            {renderStars(Math.round(averageRating))}
                            <span className="text-sm text-gray-600">
                              ({ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Ratings List */}
                  <div className="space-y-3">
                    {ratings.slice(0, 5).map((rating) => {
                      const customer = rating.customers;
                      return (
                        <div
                          key={rating.id}
                          className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {renderStars(rating.rating)}
                                <span className="text-sm font-medium text-gray-700">
                                  {rating.rating} / 5
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(rating.created_at).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>

                              {/* Masked Customer Information */}
                              <div className="text-xs text-gray-500 space-y-1 mb-2">
                                {customer.name && (
                                  <p>
                                    <span className="font-medium">Name:</span> {maskName(customer.name)}
                                  </p>
                                )}
                                {customer.phone && (
                                  <p>
                                    <span className="font-medium">Phone:</span> {maskPhone(customer.phone)}
                                  </p>
                                )}
                                {customer.email && (
                                  <p>
                                    <span className="font-medium">Email:</span> {maskEmail(customer.email)}
                                  </p>
                                )}
                                <p>
                                  <span className="font-medium">ID:</span> {maskCustomerId(customer.id)}
                                </p>
                              </div>

                              {/* Comment */}
                              {rating.comment && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <p className="text-sm text-gray-700 italic">"{rating.comment}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
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
