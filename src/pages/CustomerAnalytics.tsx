import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  getFrequentCustomers,
  getMissingCustomers,
  getStaffPerformance,
  getCustomerStats,
  getVisitTrend
} from '../lib/customerAnalytics';
import '../styles/shop-owner.css';

type DateRangeType = 'week' | 'month' | 'custom';

export function CustomerAnalytics() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<any>(null);
  const [frequentCustomers, setFrequentCustomers] = useState<any[]>([]);
  const [missingCustomers, setMissingCustomers] = useState<any[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<any[]>([]);
  const [visitTrend, setVisitTrend] = useState<any[]>([]);
  const [missingDays, setMissingDays] = useState(30);

  useEffect(() => {
    loadShopData();
  }, [user]);

  useEffect(() => {
    if (shop?.id) {
      loadAnalytics();
    }
  }, [shop?.id, dateRangeType, customStart, customEnd, missingDays]);

  async function loadShopData() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setShop(data);
      }
    } catch (error) {
      console.error('Error loading shop:', error);
    }
  }

  function getDateRange() {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    let start: Date;

    if (dateRangeType === 'week') {
      start = new Date();
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (dateRangeType === 'month') {
      start = new Date();
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
    } else {
      start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
      const endDate = new Date(customEnd);
      endDate.setHours(23, 59, 59, 999);
      return { start: start.toISOString(), end: endDate.toISOString() };
    }

    return { start: start.toISOString(), end: end.toISOString() };
  }

  async function loadAnalytics() {
    if (!shop?.id) return;

    setLoading(true);

    try {
      const dateRange = getDateRange();

      const [statsData, frequentData, missingData, staffData, trendData] = 
        await Promise.all([
          getCustomerStats(shop.id, dateRange),
          getFrequentCustomers(shop.id, dateRange, 10),
          getMissingCustomers(shop.id, missingDays, 20),
          getStaffPerformance(shop.id, dateRange),
          getVisitTrend(shop.id, dateRange)
        ]);

      setStats(statsData);
      setFrequentCustomers(frequentData);
      setMissingCustomers(missingData);
      setStaffPerformance(staffData);
      setVisitTrend(trendData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  async function exportToCSV() {
    if (!stats) return;

    // Create CSV data
    const csvData = [
      ['Customer Analytics Report'],
      ['Period:', dateRangeType],
      ['Generated:', new Date().toLocaleString()],
      [''],
      ['Overall Stats'],
      ['Total Visits', stats?.totalVisits],
      ['Unique Customers', stats?.uniqueCustomers],
      ['New Customers', stats?.newCustomers],
      ['Returning Customers', stats?.returningCustomers],
      [''],
      ['Frequent Customers'],
      ['Phone', 'Name', 'Visits', 'Points', 'Last Visit'],
      ...frequentCustomers.map(c => [
        c.customer.phone,
        c.customer.name || '',
        c.visitCount,
        c.customer.current_points,
        formatDate(c.lastVisit)
      ]),
      [''],
      ['Staff Performance'],
      ['Staff Name', 'Customers Handled'],
      ...staffPerformance.map(s => [
        `${s.staff.first_name} ${s.staff.last_name}`,
        s.customerCount
      ])
    ];

    const csv = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-analytics-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatDate(isoString: string | null): string {
    if (!isoString) return 'Never';
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  async function sendReminderSMS(customer: any) {
    // TODO: Integrate with SMS service (Twilio, etc)
    alert(`Send reminder SMS to ${customer.phone}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No shop found.</p>
          <button
            onClick={() => navigate('/owner-home')}
            className="btn btn-primary"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page shop-owner-home">
      <div className="page-header">
        <h1>📊 Customer Analytics</h1>
        <div className="flex gap-2">
          <button onClick={exportToCSV} className="btn btn-secondary">
            📥 Export CSV
          </button>
          <button onClick={() => navigate('/owner-home')} className="btn btn-secondary">
            ← Back
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="card">
        <div className="filter-group">
          <label className="label">Time Period</label>
          <div className="button-group">
            <button
              onClick={() => setDateRangeType('week')}
              className={`btn ${dateRangeType === 'week' ? 'btn-primary' : 'btn-secondary'}`}
            >
              This Week
            </button>
            <button
              onClick={() => setDateRangeType('month')}
              className={`btn ${dateRangeType === 'month' ? 'btn-primary' : 'btn-secondary'}`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateRangeType('custom')}
              className={`btn ${dateRangeType === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Custom Range
            </button>
          </div>

          {dateRangeType === 'custom' && (
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
      </div>

      {/* Overall Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats?.totalVisits || 0}</div>
          <div className="stat-label">Total Visits</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{stats?.uniqueCustomers || 0}</div>
          <div className="stat-label">Unique Customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✨</div>
          <div className="stat-value">{stats?.newCustomers || 0}</div>
          <div className="stat-label">New Customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔁</div>
          <div className="stat-value">{stats?.returningCustomers || 0}</div>
          <div className="stat-label">Returning Customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{stats?.averageVisitsPerCustomer || '0'}</div>
          <div className="stat-label">Avg Visits/Customer</div>
        </div>
      </div>

      {/* Frequent Customers */}
      <div className="card">
        <h3>🏆 Top Customers (Most Visits)</h3>
        <div className="table-responsive">
          <table className="data-table table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Phone Number</th>
                <th>Name</th>
                <th>Visits</th>
                <th>Loyalty Points</th>
                <th>Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {frequentCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No customer visits in this period
                  </td>
                </tr>
              ) : (
                frequentCustomers.map((customer, index) => (
                  <tr key={customer.customer.id}>
                    <td>
                      <span className={`rank-badge rank-${index + 1}`}>
                        #{index + 1}
                      </span>
                    </td>
                    <td>{customer.customer.phone}</td>
                    <td>{customer.customer.name || '—'}</td>
                    <td>
                      <span className="visit-count">{customer.visitCount}</span>
                    </td>
                    <td>
                      <span className="points-badge">
                        {customer.customer.current_points} pts
                      </span>
                    </td>
                    <td>{formatDate(customer.lastVisit)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Missing Customers */}
      <div className="card">
        <div className="card-header">
          <h3>⚠️ Missing Customers</h3>
          <div className="filter-group-inline">
            <label>Haven't visited in:</label>
            <select
              className="input"
              value={missingDays}
              onChange={(e) => setMissingDays(Number(e.target.value))}
              style={{ width: 'auto', minWidth: '120px' }}
            >
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table table">
            <thead>
              <tr>
                <th>Phone Number</th>
                <th>Name</th>
                <th>Last Visit</th>
                <th>Days Since</th>
                <th>Loyalty Points</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {missingCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No missing customers found
                  </td>
                </tr>
              ) : (
                missingCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.phone}</td>
                    <td>{customer.name || '—'}</td>
                    <td>{formatDate(customer.lastVisit)}</td>
                    <td>
                      <span className="days-badge">
                        {customer.daysSinceLastVisit} days
                      </span>
                    </td>
                    <td>{customer.current_points} pts</td>
                    <td>
                      <button
                        onClick={() => sendReminderSMS(customer)}
                        className="btn btn-sm btn-primary"
                      >
                        📱 Send Reminder
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Performance */}
      <div className="card">
        <h3>👥 Staff Performance</h3>
        <p className="text-muted">Customers handled in selected period</p>

        {staffPerformance.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No staff performance data</p>
        ) : (
          <div className="staff-performance-list">
            {staffPerformance.map((staff, index) => {
              const maxCount = staffPerformance[0]?.customerCount || 1;
              return (
                <div key={staff.staff.id} className="performance-item">
                  <div className="performance-rank">#{index + 1}</div>
                  <div className="performance-info">
                    <div className="staff-name">
                      {staff.staff.first_name} {staff.staff.last_name}
                    </div>
                    <div className="customer-count">
                      {staff.customerCount} customers
                    </div>
                  </div>
                  <div className="performance-bar">
                    <div
                      className="performance-fill"
                      style={{
                        width: `${(staff.customerCount / maxCount) * 100}%`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Visit Trend Chart */}
      <div className="card">
        <h3>📈 Visit Trend</h3>
        {visitTrend.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No visit data for this period</p>
        ) : (
          <div className="chart-container">
            <SimpleLineChart data={visitTrend} />
          </div>
        )}
      </div>
    </div>
  );
}

// Simple line chart component
function SimpleLineChart({ data }: { data: any[] }) {
  if (data.length === 0) return <p>No data</p>;

  const maxVisits = Math.max(...data.map(d => d.visits));

  return (
    <div className="simple-chart">
      {data.map((point, index) => (
        <div key={index} className="chart-bar">
          <div
            className="chart-bar-fill"
            style={{ height: `${(point.visits / maxVisits) * 100}%` }}
          />
          <div className="chart-label">{point.date.split('-')[2]}</div>
          <div className="chart-value">{point.visits}</div>
        </div>
      ))}
    </div>
  );
}

