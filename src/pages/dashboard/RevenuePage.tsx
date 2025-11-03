import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Calendar, TrendingUp, DollarSign, Users, Download, ArrowLeft, ArrowRight } from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';
import { useOwnerPinProtection } from '../../hooks/useOwnerPinProtection';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getDailyRevenue, getWeeklyRevenue, getMonthlyRevenue, getTopPerformers, getBestDays } from '../../lib/revenueAnalytics';

type ViewType = 'daily' | 'weekly' | 'monthly';

export default function RevenuePage() {
  const { shopId: paramShopId } = useParams();
  const { currentShop, hasAccess, loading: shopLoading } = useShop();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [dailyData, setDailyData] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [bestDays, setBestDays] = useState<any[]>([]);

  // Use currentShop.id from context (secure)
  const shopId = currentShop?.id || (paramShopId && hasAccess(paramShopId) ? paramShopId : null);

  // PIN protection
  const { isUnlocked, checking, showPinModal, PinProtectionModal } = useOwnerPinProtection({
    shopId,
    onCancel: () => navigate('/dashboard'),
  });

  // Validate access
  useEffect(() => {
    if (!shopLoading && paramShopId) {
      if (!hasAccess(paramShopId)) {
        navigate('/dashboard');
        return;
      }
    }
  }, [paramShopId, hasAccess, shopLoading, navigate]);

  const loadRevenueDataRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    loadRevenueDataRef.current = loadRevenueData;
  }, [shopId, view, selectedDate]);

  useEffect(() => {
    if (shopId && isUnlocked && loadRevenueDataRef.current) {
      loadRevenueDataRef.current();
      
      // Set up real-time subscription for automatic updates
      const channel = supabase
        .channel(`revenue-updates-${shopId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'customer_visits',
            filter: `shop_id=eq.${shopId}`
          },
          (payload) => {
            console.log('Customer visit changed:', payload);
            if (loadRevenueDataRef.current) {
              setRefreshing(true);
              loadRevenueDataRef.current().finally(() => setRefreshing(false));
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'employee_contributions',
            filter: `shop_id=eq.${shopId}`
          },
          (payload) => {
            console.log('Employee contribution changed:', payload);
            if (loadRevenueDataRef.current) {
              setRefreshing(true);
              loadRevenueDataRef.current().finally(() => setRefreshing(false));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [shopId, view, selectedDate, isUnlocked]);

  const loadRevenueData = async () => {
    if (!shopId) return;

    if (!refreshing) {
      setLoading(true);
    }

    try {
      if (view === 'daily') {
        const data = await getDailyRevenue(shopId, selectedDate);
        setDailyData(data);
      } else if (view === 'weekly') {
        const data = await getWeeklyRevenue(shopId);
        setWeeklyData(data);
        
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const performers = await getTopPerformers(shopId, {
          start: weekAgo.toISOString(),
          end: today.toISOString()
        });
        setTopPerformers(performers);
        
        const best = await getBestDays(shopId, {
          start: weekAgo.toISOString(),
          end: today.toISOString()
        });
        setBestDays(best);
      } else if (view === 'monthly') {
        const date = new Date(selectedDate);
        const data = await getMonthlyRevenue(shopId, date.getFullYear(), date.getMonth() + 1);
        setMonthlyData(data);
      }
    } catch (error) {
      console.error('Failed to load revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    const today = new Date();
    if (date < today) {
      date.setDate(date.getDate() + 1);
      setSelectedDate(date.toISOString().split('T')[0]);
    }
  };

  const handlePreviousMonth = () => {
    const date = new Date(selectedDate);
    date.setMonth(date.getMonth() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextMonth = () => {
    const date = new Date(selectedDate);
    const today = new Date();
    if (date < today) {
      date.setMonth(date.getMonth() + 1);
      const maxDate = new Date(today.getFullYear(), today.getMonth(), 1);
      if (date > maxDate) {
        setSelectedDate(today.toISOString().split('T')[0]);
      } else {
        setSelectedDate(date.toISOString().split('T')[0]);
      }
    }
  };

  const exportRevenueReport = () => {
    // Import export utility
    import('../../lib/exportPayroll').then(({ exportToCSV }) => {
      const data: (string | number)[][] = [];
      const headers = ['Date/Period', 'Revenue', 'Commission Paid', 'Net Revenue', 'Transactions', 'Average Bill'];

      if (view === 'daily' && dailyData) {
        headers[0] = 'Date';
        data.push([
          dailyData.date,
          dailyData.totalRevenue,
          dailyData.totalCommission,
          dailyData.netRevenue,
          dailyData.totalCustomers,
          dailyData.averageBill
        ]);
      } else if (view === 'weekly' && weeklyData) {
        headers[0] = 'Week (Last 7 Days)';
        data.push([
          'Last 7 Days',
          weeklyData.totalRevenue,
          weeklyData.totalCommission,
          weeklyData.netRevenue,
          weeklyData.totalCustomers,
          weeklyData.averageBill
        ]);
        
        // Add daily breakdown
        weeklyData.dailyBreakdown.forEach((day: any) => {
          data.push([
            day.date,
            day.revenue,
            day.commission,
            day.revenue - day.commission,
            day.customers,
            day.customers > 0 ? day.revenue / day.customers : 0
          ]);
        });
      } else if (view === 'monthly' && monthlyData) {
        headers[0] = 'Month';
        const monthName = new Date(0, monthlyData.month - 1).toLocaleString('en-GB', { month: 'long' });
        data.push([
          `${monthName} ${monthlyData.year}`,
          monthlyData.totalRevenue,
          monthlyData.totalCommission,
          monthlyData.netRevenue,
          monthlyData.totalCustomers,
          monthlyData.averageBill
        ]);
      }

      const filename = `revenue-${view}-${selectedDate}.csv`;
      exportToCSV(data, filename, headers);
    });
  };

  const COLORS = ['#007aff', '#34c759', '#ff9500', '#ff3b30', '#af52de', '#5ac8fa'];

  // Show PIN modal if not unlocked
  if (checking || showPinModal) {
    return (
      <>
        <PinProtectionModal />
        {showPinModal && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-gray-600">PIN required to access revenue report</p>
            </div>
          </div>
        )}
      </>
    );
  }

  if (!isUnlocked) {
    return (
      <>
        <PinProtectionModal />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600">PIN required to access revenue report</p>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <PinProtectionModal />
      <div className="revenue-dashboard">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">💰 Revenue Dashboard</h1>
            {refreshing && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Updating...</span>
              </div>
            )}
          </div>
          <button
            onClick={exportRevenueReport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            <Download className="w-5 h-5 mr-2" />
            Export Report
          </button>
        </div>

        {/* View Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <div className="flex gap-2">
              <button
                onClick={() => setView('daily')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  view === 'daily'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📅 Daily
              </button>
              <button
                onClick={() => setView('weekly')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  view === 'weekly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📊 Weekly
              </button>
              <button
                onClick={() => setView('monthly')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  view === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📈 Monthly
              </button>
            </div>
          </div>

          {/* Date Navigator */}
          {(view === 'daily' || view === 'monthly') && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={view === 'daily' ? handlePreviousDay : handlePreviousMonth}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <input
                type={view === 'daily' ? 'date' : 'month'}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={view === 'daily' ? selectedDate : selectedDate.slice(0, 7)}
                onChange={(e) => {
                  if (view === 'daily') {
                    setSelectedDate(e.target.value);
                  } else {
                    setSelectedDate(e.target.value + '-01');
                  }
                }}
                max={view === 'daily' ? new Date().toISOString().split('T')[0] : new Date().toISOString().slice(0, 7)}
              />
              <button
                onClick={view === 'daily' ? handleNextDay : handleNextMonth}
                disabled={
                  (view === 'daily' && selectedDate >= new Date().toISOString().split('T')[0]) ||
                  (view === 'monthly' && selectedDate.slice(0, 7) >= new Date().toISOString().slice(0, 7))
                }
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* DAILY VIEW */}
        {view === 'daily' && dailyData && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-500 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">💰</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">£{dailyData.totalRevenue.toFixed(2)}</div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Total Revenue</div>
                <div className="text-xs text-gray-600">{dailyData.totalCustomers} customers</div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-500 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">💸</div>
                <div className="text-3xl font-bold text-orange-700 mb-1">£{dailyData.totalCommission.toFixed(2)}</div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Commission Paid</div>
                <div className="text-xs text-gray-600">
                  {dailyData.totalRevenue > 0 
                    ? ((dailyData.totalCommission / dailyData.totalRevenue) * 100).toFixed(1)
                    : 0}% of revenue
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">📈</div>
                <div className="text-3xl font-bold text-green-700 mb-1">£{dailyData.netRevenue.toFixed(2)}</div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Net Revenue</div>
                <div className="text-xs text-gray-600">After commission</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-500 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">🎯</div>
                <div className="text-3xl font-bold text-purple-700 mb-1">£{dailyData.averageBill.toFixed(2)}</div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Average Bill</div>
                <div className="text-xs text-gray-600">Per customer</div>
              </div>
            </div>

            {/* Hourly Breakdown Chart */}
            {dailyData.hourlyBreakdown && dailyData.hourlyBreakdown.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  ⏰ Revenue by Hour
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyData.hourlyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(hour) => `${hour}:00`}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => `£${parseFloat(value).toFixed(2)}`}
                      labelFormatter={(hour) => `${hour}:00 - ${hour}:59`}
                    />
                    <Bar dataKey="revenue" fill="#007aff" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Staff Performance */}
            {dailyData.staffBreakdown && dailyData.staffBreakdown.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  👥 Staff Performance Today
                </h2>
                <div className="space-y-3">
                  {dailyData.staffBreakdown.map((staff: any, index: number) => (
                    <div key={staff.staff?.id || index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-white text-sm ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-br from-orange-700 to-orange-900' :
                        'bg-gradient-to-br from-blue-500 to-blue-700'
                      }`}>
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {staff.staff?.first_name} {staff.staff?.last_name || ''}
                        </div>
                        <div className="text-sm text-gray-600">
                          {staff.customers} customers
                          {staff.commission > 0 && (
                            <> • £{staff.commission.toFixed(2)} commission</>
                          )}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        £{staff.revenue.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* WEEKLY VIEW */}
        {view === 'weekly' && weeklyData && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-500 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">💰</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">£{weeklyData.totalRevenue.toFixed(2)}</div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Total Revenue</div>
                <div className="text-xs text-gray-600">Last 7 days</div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-500 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">💸</div>
                <div className="text-3xl font-bold text-orange-700 mb-1">£{weeklyData.totalCommission.toFixed(2)}</div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Commission Paid</div>
                <div className="text-xs text-gray-600">
                  {weeklyData.totalRevenue > 0 
                    ? ((weeklyData.totalCommission / weeklyData.totalRevenue) * 100).toFixed(1)
                    : 0}% of revenue
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">📈</div>
                <div className="text-3xl font-bold text-green-700 mb-1">£{weeklyData.netRevenue.toFixed(2)}</div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Net Revenue</div>
                <div className="text-xs text-gray-600">After commission</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-500 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">👥</div>
                <div className="text-3xl font-bold text-purple-700 mb-1">{weeklyData.totalCustomers}</div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Total Customers</div>
                <div className="text-xs text-gray-600">£{weeklyData.averageBill.toFixed(2)} avg</div>
              </div>
            </div>

            {/* Daily Trend */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Daily Revenue Trend
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData.dailyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-GB', { 
                      day: '2-digit', 
                      month: 'short' 
                    })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: any) => `£${parseFloat(value).toFixed(2)}`}
                    labelFormatter={(date) => new Date(date).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long'
                    })}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#007aff" 
                    strokeWidth={3}
                    name="Revenue"
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="commission" 
                    stroke="#ff9500" 
                    strokeWidth={2}
                    name="Commission"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Top Performers */}
              {topPerformers.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    🏆 Top Performers This Week
                  </h2>
                  <div className="space-y-3">
                    {topPerformers.map((performer: any, index: number) => (
                      <div key={performer.staff?.id || index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className={`w-12 h-12 flex items-center justify-center rounded-full font-bold text-white ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                          index === 2 ? 'bg-gradient-to-br from-orange-700 to-orange-900' :
                          'bg-gradient-to-br from-blue-500 to-blue-700'
                        }`}>
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {performer.staff?.first_name} {performer.staff?.last_name || ''}
                          </div>
                          <div className="text-sm text-gray-600">
                            {performer.customers} customers
                          </div>
                        </div>
                        <div className="text-xl font-bold text-blue-600">
                          £{performer.revenue.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Best Days */}
              {bestDays.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    📅 Best Performing Days
                  </h2>
                  <div className="space-y-3">
                    {bestDays.map((day: any, index: number) => (
                      <div key={day.date} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold text-sm">
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{day.dayName}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(day.date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short'
                            })} • {day.customers} customers
                          </div>
                        </div>
                        <div className="text-xl font-bold text-green-600">
                          £{day.revenue.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Staff Breakdown Pie Chart */}
            {weeklyData.staffBreakdown && weeklyData.staffBreakdown.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Staff Revenue Distribution
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={weeklyData.staffBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.staff?.first_name || 'Unknown'}: £${entry.revenue.toFixed(0)}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {weeklyData.staffBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `£${parseFloat(value).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {/* MONTHLY VIEW */}
        {view === 'monthly' && monthlyData && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-500 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">💰</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">£{monthlyData.totalRevenue.toFixed(2)}</div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Total Revenue</div>
                <div className="text-xs text-gray-600">
                  {new Date(0, monthlyData.month - 1).toLocaleString('en-GB', { month: 'long' })} {monthlyData.year}
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-500 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">💸</div>
                <div className="text-3xl font-bold text-orange-700 mb-1">£{monthlyData.totalCommission.toFixed(2)}</div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Commission Paid</div>
                <div className="text-xs text-gray-600">
                  {monthlyData.totalRevenue > 0 
                    ? ((monthlyData.totalCommission / monthlyData.totalRevenue) * 100).toFixed(1)
                    : 0}% of revenue
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">📈</div>
                <div className="text-3xl font-bold text-green-700 mb-1">£{monthlyData.netRevenue.toFixed(2)}</div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Net Revenue</div>
                <div className="text-xs text-gray-600">After commission</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-500 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">👥</div>
                <div className="text-3xl font-bold text-purple-700 mb-1">{monthlyData.totalCustomers}</div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Total Customers</div>
                <div className="text-xs text-gray-600">£{monthlyData.averageBill.toFixed(2)} avg</div>
              </div>
            </div>

            {/* Weekly Breakdown */}
            {monthlyData.weeklyBreakdown && monthlyData.weeklyBreakdown.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  📊 Weekly Breakdown
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData.weeklyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="week" 
                      tickFormatter={(week) => `Week ${week}`}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => `£${parseFloat(value).toFixed(2)}`}
                      labelFormatter={(week) => `Week ${week}`}
                    />
                    <Bar dataKey="revenue" fill="#007aff" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
