import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { getShopAnalytics } from '../lib/shopAnalytics';
import { exportAnalyticsToPDF } from '../lib/exportPDF';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import '../styles/analytics.css';

type PeriodType = 'today' | 'week' | 'month' | 'custom';

export function OwnerAnalytics() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  const [period, setPeriod] = useState<PeriodType>('week');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);

  useEffect(() => {
    loadShop();
  }, [user]);

  useEffect(() => {
    if (shop?.id) {
      loadAnalytics();
    }
  }, [period, customStart, customEnd, shop?.id]);

  const shopId = shop?.id || '';

  async function loadShop() {
    if (!user?.id) return;
    
    try {
      // Try to get shop from user_id first
      let { data } = await supabase
        .from('shops')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // If no shop found by user_id, try to get from URL params (if on /dashboard/:shopId/analytics)
      if (!data) {
        const pathParts = window.location.pathname.split('/');
        const shopIdIndex = pathParts.indexOf('dashboard');
        if (shopIdIndex >= 0 && pathParts[shopIdIndex + 1]) {
          const shopIdFromUrl = pathParts[shopIdIndex + 1];
          const { data: shopData } = await supabase
            .from('shops')
            .select('*')
            .eq('id', shopIdFromUrl)
            .maybeSingle();
          
          if (shopData) {
            data = shopData;
          }
        }
      }
      
      if (data) {
        setShop(data);
      }
    } catch (error) {
      console.error('Error loading shop:', error);
    }
  }

  function getDateRange() {
    const end = new Date();
    let start = new Date();

    if (period === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'custom') {
      start = new Date(customStart);
      end.setTime(new Date(customEnd).getTime());
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }

  async function loadAnalytics() {
    if (!shop?.id) return;
    
    setLoading(true);
    try {
      const dateRange = getDateRange();
      const data = await getShopAnalytics(shop.id, dateRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleExportPDF() {
    if (!analytics || !shop) return;
    
    await exportAnalyticsToPDF({
      shop,
      analytics,
      period,
      dateRange: getDateRange(),
      dashboardRef: dashboardRef.current
    });
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shop data...</p>
        </div>
      </div>
    );
  }

  if (loading || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const { overview, staffPerformance, revenueChart, payrollBreakdown } = analytics;

  // Colors for charts
  const COLORS = ['#007aff', '#34c759', '#ff9500', '#ff3b30', '#af52de', '#5ac8fa'];

  return (
    <div className="analytics-dashboard" ref={dashboardRef}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>📊 Shop Analytics</h1>
          <p className="text-muted">{shop?.shop_name}</p>
        </div>
        <button onClick={handleExportPDF} className="btn btn-primary">
          📄 Export PDF Report
        </button>
      </div>

      {/* Period Selector */}
      <div className="card">
        <div className="period-selector">
          <button
            onClick={() => setPeriod('today')}
            className={`btn ${period === 'today' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`btn ${period === 'week' ? 'btn-primary' : 'btn-secondary'}`}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`btn ${period === 'month' ? 'btn-primary' : 'btn-secondary'}`}
          >
            This Month
          </button>
          <button
            onClick={() => setPeriod('custom')}
            className={`btn ${period === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Custom Range
          </button>
        </div>

        {period === 'custom' && (
          <div className="custom-range">
            <input
              type="date"
              className="input"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
            <span>to</span>
            <input
              type="date"
              className="input"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-icon">💰</div>
          <div className="metric-value">£{overview.totalRevenue.toFixed(2)}</div>
          <div className="metric-label">Total Revenue</div>
          <div className="metric-sublabel">
            £{overview.averageBill.toFixed(2)} avg per customer
          </div>
        </div>

        <div className="metric-card payroll">
          <div className="metric-icon">💸</div>
          <div className="metric-value">£{overview.totalPayroll.toFixed(2)}</div>
          <div className="metric-label">Total Payroll</div>
          <div className="metric-sublabel">
            Wages + Commission
          </div>
        </div>

        <div className="metric-card profit">
          <div className="metric-icon">
            {overview.netProfit >= 0 ? '📈' : '📉'}
          </div>
          <div className={`metric-value ${overview.netProfit >= 0 ? 'positive' : 'negative'}`}>
            £{overview.netProfit.toFixed(2)}
          </div>
          <div className="metric-label">Net Profit</div>
          <div className="metric-sublabel">
            {overview.profitMargin}% margin
          </div>
        </div>

        <div className="metric-card customers">
          <div className="metric-icon">👥</div>
          <div className="metric-value">{overview.totalCustomers}</div>
          <div className="metric-label">Total Customers</div>
          <div className="metric-sublabel">
            {overview.totalVisits} visits
          </div>
        </div>

        <div className="metric-card new">
          <div className="metric-icon">✨</div>
          <div className="metric-value">{overview.newCustomers}</div>
          <div className="metric-label">New Customers</div>
          <div className="metric-sublabel">
            {overview.totalCustomers > 0 
              ? ((overview.newCustomers / overview.totalCustomers) * 100).toFixed(0)
              : 0}% of total
          </div>
        </div>

        <div className="metric-card returning">
          <div className="metric-icon">🔁</div>
          <div className="metric-value">{overview.returningCustomers}</div>
          <div className="metric-label">Returning Customers</div>
          <div className="metric-sublabel">
            {overview.totalCustomers > 0 
              ? ((overview.returningCustomers / overview.totalCustomers) * 100).toFixed(0)
              : 0}% of total
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="card">
        <h3>📈 Daily Revenue Trend</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: 'short' 
                })}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => `£${parseFloat(value).toFixed(2)}`}
                labelFormatter={(date) => new Date(date).toLocaleDateString('en-GB')}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#007aff" 
                strokeWidth={3}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Staff Performance */}
      <div className="card">
        <h3>👥 Staff Performance</h3>
        <p className="text-muted">Revenue generated by each team member</p>

        {staffPerformance.length > 0 ? (
          <>
            <div className="staff-performance-list">
              {staffPerformance.map((staff: any, index: number) => (
                <div key={staff.staff?.id || index} className="staff-performance-item">
                  <div className="staff-rank">#{index + 1}</div>
                  <div className="staff-info">
                    <div className="staff-name">
                      {staff.staff?.first_name || 'Unknown'} {staff.staff?.last_name || ''}
                    </div>
                    <div className="staff-stats">
                      <span>{staff.customersServed} customers</span>
                      <span>•</span>
                      <span>£{staff.revenue.toFixed(2)} revenue</span>
                      {staff.commission > 0 && (
                        <>
                          <span>•</span>
                          <span>£{staff.commission.toFixed(2)} commission</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="staff-revenue">
                    £{staff.revenue.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Staff Revenue Bar Chart */}
            <div className="chart-container mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={staffPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey={(data: any) => `${data.staff?.first_name || 'Unknown'} ${(data.staff?.last_name || '').charAt(0) || ''}`}
                  />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `£${parseFloat(value).toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#007aff" name="Revenue Generated" />
                  {payrollBreakdown.commission > 0 && (
                    <Bar dataKey="commission" fill="#34c759" name="Commission Earned" />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <p className="text-muted">No staff performance data available</p>
        )}
      </div>

      {/* Payroll Breakdown */}
      <div className="card">
        <h3>💸 Payroll Breakdown</h3>
        
        <div className="payroll-grid">
          <div className="payroll-item">
            <div className="payroll-label">Hourly Wages</div>
            <div className="payroll-value">£{payrollBreakdown.hourlyWages.toFixed(2)}</div>
            <div className="payroll-percent">
              {payrollBreakdown.total > 0 ? ((payrollBreakdown.hourlyWages / payrollBreakdown.total) * 100).toFixed(0) : 0}%
            </div>
          </div>

          <div className="payroll-item">
            <div className="payroll-label">Commission</div>
            <div className="payroll-value">£{payrollBreakdown.commission.toFixed(2)}</div>
            <div className="payroll-percent">
              {payrollBreakdown.total > 0 ? ((payrollBreakdown.commission / payrollBreakdown.total) * 100).toFixed(0) : 0}%
            </div>
          </div>

          <div className="payroll-item total">
            <div className="payroll-label">Total Payroll</div>
            <div className="payroll-value">£{payrollBreakdown.total.toFixed(2)}</div>
            <div className="payroll-percent">
              {overview.totalRevenue > 0 ? ((payrollBreakdown.total / overview.totalRevenue) * 100).toFixed(0) : 0}% of revenue
            </div>
          </div>
        </div>

        {/* Payroll Pie Chart */}
        {payrollBreakdown.total > 0 && (
          <div className="chart-container mt-4">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Hourly Wages', value: payrollBreakdown.hourlyWages },
                    { name: 'Commission', value: payrollBreakdown.commission }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: £${entry.value.toFixed(2)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0, 1].map((index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `£${parseFloat(value).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Revenue vs Payroll Comparison */}
      <div className="card">
        <h3>💰 Revenue vs Payroll</h3>
        
        <div className="comparison-bars">
          <div className="comparison-item">
            <div className="comparison-label">Revenue</div>
            <div className="comparison-bar-wrapper">
              <div 
                className="comparison-bar revenue-bar"
                style={{ width: '100%' }}
              >
                £{overview.totalRevenue.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="comparison-item">
            <div className="comparison-label">Payroll</div>
            <div className="comparison-bar-wrapper">
              <div 
                className="comparison-bar payroll-bar"
                style={{ 
                  width: overview.totalRevenue > 0 ? `${(overview.totalPayroll / overview.totalRevenue) * 100}%` : '0%'
                }}
              >
                £{overview.totalPayroll.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="comparison-item">
            <div className="comparison-label">Profit</div>
            <div className="comparison-bar-wrapper">
              <div 
                className={`comparison-bar profit-bar ${overview.netProfit >= 0 ? 'positive' : 'negative'}`}
                style={{ 
                  width: overview.totalRevenue > 0 ? `${Math.abs((overview.netProfit / overview.totalRevenue) * 100)}%` : '0%'
                }}
              >
                £{overview.netProfit.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Breakdown */}
      {overview.totalCustomers > 0 && (
        <div className="card">
          <h3>👥 Customer Breakdown</h3>
          
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'New Customers', value: overview.newCustomers },
                    { name: 'Returning Customers', value: overview.returningCustomers }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#34c759" />
                  <Cell fill="#007aff" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

