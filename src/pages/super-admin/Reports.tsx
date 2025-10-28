import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Download, Mail, Calendar, FileText } from 'lucide-react';

interface ReportData {
  total_active_shops: number;
  total_customers: number;
  total_points_issued: number;
  total_rewards_redeemed: number;
  total_staff: number;
  new_shops_this_month: number;
}

export default function Reports() {
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [autoEmailEnabled, setAutoEmailEnabled] = useState(false);

  useEffect(() => {
    generateReport();
  }, [startDate, endDate]);

  const generateReport = async () => {
    setLoading(true);
    try {
      // Get total active shops
      const { count: activeShopsCount } = await supabase
        .from('shops')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'active');

      // Get total customers
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // Get total points issued
      const { count: totalPoints } = await supabase
        .from('loyalty_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('transaction_type', 'point_added')
        .gte('created_at', startDate)
        .lte('created_at', `${endDate}T23:59:59`);

      // Get total rewards redeemed
      const { count: totalRewards } = await supabase
        .from('loyalty_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('transaction_type', 'point_redeemed')
        .gte('created_at', startDate)
        .lte('created_at', `${endDate}T23:59:59`);

      // Get total staff
      const { count: totalStaff } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });

      // Get new shops this month
      const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const { count: newShops } = await supabase
        .from('shops')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstOfMonth.toISOString());

      setReportData({
        total_active_shops: activeShopsCount || 0,
        total_customers: totalCustomers || 0,
        total_points_issued: totalPoints || 0,
        total_rewards_redeemed: totalRewards || 0,
        total_staff: totalStaff || 0,
        new_shops_this_month: newShops || 0,
      });
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    // Placeholder - implement actual CSV export
    alert('Exporting report data as CSV...');
  };

  const handleEmailToAllOwners = () => {
    // Placeholder - implement actual email sending
    alert('Emailing report to all shop owners...');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Reports</h1>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Date Range:</label>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-gray-600">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={generateReport}
            disabled={loading}
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Report Data */}
      {reportData && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center text-gray-600 text-sm mb-2">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              <span className="font-medium">Active Shops</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{reportData.total_active_shops}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center text-gray-600 text-sm mb-2">
              <FileText className="w-5 h-5 mr-2 text-purple-600" />
              <span className="font-medium">Total Customers</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{reportData.total_customers.toLocaleString()}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center text-gray-600 text-sm mb-2">
              <FileText className="w-5 h-5 mr-2 text-green-600" />
              <span className="font-medium">Points Issued</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{reportData.total_points_issued.toLocaleString()}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center text-gray-600 text-sm mb-2">
              <FileText className="w-5 h-5 mr-2 text-green-600" />
              <span className="font-medium">Rewards Redeemed</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{reportData.total_rewards_redeemed.toLocaleString()}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center text-gray-600 text-sm mb-2">
              <FileText className="w-5 h-5 mr-2 text-indigo-600" />
              <span className="font-medium">Total Staff</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{reportData.total_staff.toLocaleString()}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center text-gray-600 text-sm mb-2">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              <span className="font-medium">New Shops (This Month)</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{reportData.new_shops_this_month}</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={handleEmailToAllOwners}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            <Mail className="w-4 h-4 mr-2" />
            Email to All Owners
          </button>
        </div>
      </div>

      {/* Auto Email Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Schedule Monthly Auto Email</h3>
            <p className="text-sm text-gray-600">Automatically email reports to all shop owners on the 1st of each month</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoEmailEnabled}
              onChange={(e) => setAutoEmailEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
}

