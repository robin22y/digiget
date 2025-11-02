import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Download, Mail, Calendar, FileText } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToCSV } from '../../lib/exportPayroll';

interface ReportData {
  total_active_shops: number;
  total_customers: number;
  total_points_issued: number;
  total_rewards_redeemed: number;
  total_staff: number;
  new_shops_this_month: number;
}

interface ShopLite {
  id: string;
  shop_name: string;
  owner_email: string | null;
  plan_type: 'basic' | 'pro' | null;
  subscription_status?: string | null;
}

export default function Reports() {
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // new frequency and preview state
  const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewSummary, setPreviewSummary] = useState<{ totalTargets: number; sampleShop?: string; sample?: ReportData | null }>({ totalTargets: 0, sampleShop: undefined, sample: null });

  const [shops, setShops] = useState<ShopLite[]>([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'all' | 'basic' | 'pro'>('all');
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [selectedShopName, setSelectedShopName] = useState<string>('');
  
  // Chart data state
  const [chartData, setChartData] = useState<any[]>([]);
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  const [dailyActivity, setDailyActivity] = useState<any[]>([]);

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    // Update selected shop name when id changes
    const s = shops.find(x => x.id === selectedShopId);
    setSelectedShopName(s?.shop_name || '');
  }, [selectedShopId, shops]);

  const loadShops = async () => {
    setShopsLoading(true);
    try {
      const { data } = await supabase
        .from('shops')
        .select('id, shop_name, owner_email, plan_type, subscription_status')
        .order('shop_name', { ascending: true });
      setShops(data || []);
    } catch (e) {
      console.error('Failed to load shops for reports:', e);
      setShops([]);
    } finally {
      setShopsLoading(false);
    }
  };

  const filteredShops = shops.filter((s) => selectedPlan === 'all' ? true : (s.plan_type === selectedPlan));

  const toggleShop = (id: string) => {
    setSelectedShopIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleExportCSV = () => {
    if (!reportData) {
      alert('Please generate a report first');
      return;
    }

    const csvData = [
      ['Metric', 'Value'],
      ['Active Shops', reportData.total_active_shops],
      ['Total Customers', reportData.total_customers],
      ['Points Issued', reportData.total_points_issued],
      ['Rewards Redeemed', reportData.total_rewards_redeemed],
      ['Total Staff', reportData.total_staff],
      ['New Shops (This Month)', reportData.new_shops_this_month],
      [''],
      ['Date Range', `${startDate} to ${endDate}`],
      ['Generated', new Date().toISOString()]
    ];

    const filename = selectedShopName 
      ? `report-${selectedShopName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.csv`
      : `report-all-shops-${Date.now()}.csv`;

    exportToCSV(csvData, filename);
  };

  const getRangeForFrequency = (): { start: string; end: string } => {
    const end = new Date();
    let start = new Date();
    if (frequency === 'monthly') {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
    } else if (frequency === 'weekly') {
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    }
    const startISO = start.toISOString().split('T')[0];
    const endISO = end.toISOString().split('T')[0];
    return { start: startISO, end: endISO };
  };

  const handlePreviewProShops = async () => {
    // Prepare preview for Pro shops only
    setPreviewLoading(true);
    try {
      const proShops = shops.filter(s => s.plan_type === 'pro' && s.owner_email);
      const { start, end } = getRangeForFrequency();

      let sample: ReportData | null = null;
      let sampleShopName: string | undefined = undefined;

      if (proShops.length > 0) {
        const shop = proShops[0];
        sampleShopName = shop.shop_name;
        // Compute sample metrics for the first pro shop
        const { count: shopCustomers } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shop.id);
        const { count: shopPoints } = await supabase
          .from('loyalty_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shop.id)
          .eq('transaction_type', 'point_added')
          .gte('created_at', start)
          .lte('created_at', `${end}T23:59:59`);
        const { count: shopRewards } = await supabase
          .from('loyalty_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shop.id)
          .eq('transaction_type', 'reward_redeemed')
          .gte('created_at', start)
          .lte('created_at', `${end}T23:59:59`);
        const { count: shopStaff } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shop.id);

        sample = {
          total_active_shops: shop.subscription_status === 'active' ? 1 : 0,
          total_customers: shopCustomers || 0,
          total_points_issued: shopPoints || 0,
          total_rewards_redeemed: shopRewards || 0,
          total_staff: shopStaff || 0,
          new_shops_this_month: 0,
        };
      }

      setPreviewSummary({ totalTargets: proShops.length, sampleShop: sampleShopName, sample });
      setShowPreview(true);
    } finally {
      setPreviewLoading(false);
    }
  };

  const postToFunction = async (payload: any) => {
    const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-monthly-reports`;
    const resp = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(txt || `Function failed with status ${resp.status}`);
    }
    return resp.json();
  };

  const handleConfirmSendPro = async () => {
    try {
      const { start, end } = getRangeForFrequency();
      const res = await postToFunction({ plan: 'pro', startDate: start, endDate: end });
      alert(`Sent to ${res.sent} Pro shop(s).`);
      setShowPreview(false);
    } catch (e: any) {
      alert(e.message || 'Failed to trigger emails');
    }
  };

  const handleEmailByPlan = async () => {
    const targets = filteredShops.filter(s => s.owner_email);
    if (targets.length === 0) {
      alert('No shops found for the selected plan.');
      return;
    }
    try {
      const res = await postToFunction({
        plan: selectedPlan === 'all' ? undefined : selectedPlan,
        startDate,
        endDate,
      });
      alert(`Sent to ${res.sent} shop(s).`);
    } catch (e: any) {
      alert(e.message || 'Failed to trigger emails');
    }
  };

  const handleEmailSelectedShops = async () => {
    const targets = shops.filter(s => selectedShopIds.includes(s.id) && s.owner_email);
    if (targets.length === 0) {
      alert('Please select at least one shop with an email address.');
      return;
    }
    try {
      const res = await postToFunction({
        shopIds: selectedShopIds,
        startDate,
        endDate,
      });
      alert(`Sent to ${res.sent} selected shop(s).`);
    } catch (e: any) {
      alert(e.message || 'Failed to trigger emails');
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      if (selectedShopId) {
        // Per-shop report
        const shopId = selectedShopId;
        // Customers for this shop
        const { count: shopCustomers } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shopId);
        // Points issued (date range)
        const { count: shopPoints } = await supabase
          .from('loyalty_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shopId)
          .eq('transaction_type', 'point_added')
          .gte('created_at', startDate)
          .lte('created_at', `${endDate}T23:59:59`);
        // Rewards redeemed (correct type: reward_redeemed)
        const { count: shopRewards } = await supabase
          .from('loyalty_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shopId)
          .eq('transaction_type', 'reward_redeemed')
          .gte('created_at', startDate)
          .lte('created_at', `${endDate}T23:59:59`);
        // Staff count
        const { count: shopStaff } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shopId);

        setReportData({
          total_active_shops: shops.find(s => s.id === shopId && s.subscription_status === 'active') ? 1 : 0,
          total_customers: shopCustomers || 0,
          total_points_issued: shopPoints || 0,
          total_rewards_redeemed: shopRewards || 0,
          total_staff: shopStaff || 0,
          new_shops_this_month: 0,
        });
        
        // Load chart data for shop
        await loadShopChartData(shopId);
      } else {
        // Global report
        const { count: activeShopsCount } = await supabase
          .from('shops')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_status', 'active');
        const { count: totalCustomers } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });
        const { count: totalPoints } = await supabase
          .from('loyalty_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('transaction_type', 'point_added')
          .gte('created_at', startDate)
          .lte('created_at', `${endDate}T23:59:59`);
        const { count: totalRewards } = await supabase
          .from('loyalty_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('transaction_type', 'reward_redeemed')
          .gte('created_at', startDate)
          .lte('created_at', `${endDate}T23:59:59`);
        const { count: totalStaff } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true });
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
        
        // Load chart data for global
        await loadGlobalChartData();
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadShopChartData = async (shopId: string) => {
    try {
      // Daily activity for shop
      const { data: activity } = await supabase
        .from('loyalty_transactions')
        .select('created_at, transaction_type')
        .eq('shop_id', shopId)
        .gte('created_at', startDate)
        .lte('created_at', `${endDate}T23:59:59`);
      
      if (activity) {
        const daily = groupByDay(activity);
        setDailyActivity(daily);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };
  
  const loadGlobalChartData = async () => {
    try {
      // Plan distribution
      const basicCount = shops.filter(s => s.plan_type === 'basic').length;
      const proCount = shops.filter(s => s.plan_type === 'pro').length;
      setPlanDistribution([
        { name: 'Basic', value: basicCount, color: '#3b82f6' },
        { name: 'Pro', value: proCount, color: '#10b981' }
      ]);
      
      // Daily activity across all shops
      const { data: activity } = await supabase
        .from('loyalty_transactions')
        .select('created_at, transaction_type')
        .gte('created_at', startDate)
        .lte('created_at', `${endDate}T23:59:59`);
      
      if (activity) {
        const daily = groupByDay(activity);
        setDailyActivity(daily);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };
  
  const groupByDay = (transactions: any[]) => {
    const grouped = transactions.reduce((acc, t) => {
      const date = t.created_at.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, points: 0, rewards: 0 };
      }
      if (t.transaction_type === 'point_added') acc[date].points += 1;
      if (t.transaction_type === 'reward_redeemed') acc[date].rewards += 1;
      return acc;
    }, {} as any);
    
    return Object.values(grouped).sort((a: any, b: any) => a.date.localeCompare(b.date));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Reports {selectedShopName ? `· ${selectedShopName}` : ''}</h1>
      </div>

      {/* Frequency control for Pro shops */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Send to DigiGet Pro Shops</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Frequency:</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as 'monthly'|'weekly'|'daily')}
            className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
          </select>
          <button
            onClick={handlePreviewProShops}
            disabled={previewLoading}
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {previewLoading ? 'Preparing Preview…' : 'Preview & Send'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">This will send each Pro shop their own report for the selected frequency period.</p>
      </div>

      {/* Targets */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Targets</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value as 'all' | 'basic' | 'pro')}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Plans</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Generate for Individual Shop</label>
            <select
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Shops (Global Report)</option>
              {shops.map(s => (
                <option key={s.id} value={s.id}>{s.shop_name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Pick a shop to generate a focused report.</p>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Individual Shops (Email)</label>
            <div className="max-h-40 overflow-auto border-2 border-gray-200 rounded-xl p-2">
              {shopsLoading ? (
                <div className="text-sm text-gray-500 p-2">Loading shops…</div>
              ) : (
                (filteredShops.length === 0 ? (
                  <div className="text-sm text-gray-500 p-2">No shops match the selected plan.</div>
                ) : (
                  <ul className="space-y-1">
                    {filteredShops.map(s => (
                      <li key={s.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedShopIds.includes(s.id)}
                          onChange={() => toggleShop(s.id)}
                        />
                        <span className="text-sm text-gray-800">{s.shop_name}</span>
                        <span className="text-xs text-gray-400">{s.plan_type?.toUpperCase()}</span>
                      </li>
                    ))}
                  </ul>
                ))
              )}
            </div>
          </div>
        </div>
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
        <>
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

          {/* Charts */}
          {!selectedShopId && planDistribution.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {dailyActivity.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="points" stroke="#3b82f6" name="Points Issued" strokeWidth={2} />
                  <Line type="monotone" dataKey="rewards" stroke="#10b981" name="Rewards Redeemed" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExportCSV} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button onClick={handleEmailByPlan} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            <Mail className="w-4 h-4 mr-2" />
            Email by Plan
          </button>
          <button onClick={handleEmailSelectedShops} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
            <Mail className="w-4 h-4 mr-2" />
            Email Selected Shops
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-xl p-4 sm:p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Send to Pro Shops</h3>
            <p className="text-sm text-gray-700 mb-3">Targets: <b>{previewSummary.totalTargets}</b> Pro shop(s)</p>
            {previewSummary.sample && (
              <div className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50">
                <p className="text-sm text-gray-700 mb-1">Sample: <b>{previewSummary.sampleShop}</b></p>
                <ul className="text-sm text-gray-700 grid grid-cols-2 gap-2">
                  <li>Customers: <b>{previewSummary.sample.total_customers}</b></li>
                  <li>Staff: <b>{previewSummary.sample.total_staff}</b></li>
                  <li>Points Issued: <b>{previewSummary.sample.total_points_issued}</b></li>
                  <li>Rewards Redeemed: <b>{previewSummary.sample.total_rewards_redeemed}</b></li>
                </ul>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowPreview(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold">Cancel</button>
              <button onClick={handleConfirmSendPro} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">Send Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

