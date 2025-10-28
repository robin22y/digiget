import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Mail, Download, Send, Power, PowerOff } from 'lucide-react';

interface ShopDetail {
  id: string;
  shop_name: string;
  owner_name: string;
  owner_email: string;
  postcode: string | null;
  business_category: string | null;
  subscription_status: string;
  plan_type: string;
  created_at: string;
  updated_at: string;
}

interface ShopMetrics {
  customers_count: number;
  points_issued: number;
  rewards_redeemed: number;
  staff_count: number;
}

interface ActivityLog {
  id: string;
  action: string;
  user_type: string;
  created_at: string;
}

export default function ShopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [metrics, setMetrics] = useState<ShopMetrics>({
    customers_count: 0,
    points_issued: 0,
    rewards_redeemed: 0,
    staff_count: 0,
  });
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadShopDetail();
      loadMetrics();
      loadActivity();
    }
  }, [id]);

  const loadShopDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setShop(data);
    } catch (error) {
      console.error('Error loading shop detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    if (!id) return;

    try {
      // Get customers count
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', id);

      // Get points issued
      const { count: pointsCount } = await supabase
        .from('loyalty_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', id)
        .eq('transaction_type', 'point_added');

      // Get rewards redeemed
      const { count: rewardsCount } = await supabase
        .from('loyalty_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', id)
        .eq('transaction_type', 'point_redeemed');

      // Get staff count
      const { count: staffCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', id);

      setMetrics({
        customers_count: customersCount || 0,
        points_issued: pointsCount || 0,
        rewards_redeemed: rewardsCount || 0,
        staff_count: staffCount || 0,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const loadActivity = async () => {
    if (!id) return;

    // Simplified activity log - in production, you'd have a proper activity_log table
    try {
      const { data: recentCheckIns } = await supabase
        .from('loyalty_transactions')
        .select('id, created_at, shop_id')
        .eq('shop_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentCheckIns) {
        setActivity(
          recentCheckIns.map(item => ({
            id: item.id,
            action: 'Customer check-in',
            user_type: 'customer',
            created_at: item.created_at,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading activity:', error);
    }
  };

  const handleStatusToggle = async () => {
    if (!shop) return;

    const newStatus = shop.subscription_status === 'active' ? 'cancelled' : 'active';

    try {
      const { error } = await supabase
        .from('shops')
        .update({ subscription_status: newStatus })
        .eq('id', shop.id);

      if (error) throw error;
      await loadShopDetail();
      alert(`Shop ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleEmailReport = async () => {
    // Placeholder - implement actual email sending
    alert('Monthly report will be emailed to the owner');
  };

  const handleDownloadCSV = async () => {
    // Placeholder - implement actual CSV export
    alert('Downloading shop data as CSV...');
  };

  const handleSendNotice = () => {
    // Navigate to notices page with pre-filled shop filter
    navigate('/super-admin/notices', { state: { shopId: id } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-start h-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div>
        <p className="text-gray-600">Shop not found</p>
        <button
          onClick={() => navigate('/super-admin/shops')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Back to Shops
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate('/super-admin/shops')}
          className="mr-3 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">{shop.shop_name}</h1>
      </div>

      {/* Shop Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Shop Information</h2>
          </div>
          <button
            onClick={handleStatusToggle}
            className={`flex items-center px-4 py-2 rounded-xl font-semibold transition-colors ${
              shop.subscription_status === 'active'
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {shop.subscription_status === 'active' ? (
              <>
                <PowerOff className="w-4 h-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="w-4 h-4 mr-2" />
                Activate
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Owner</label>
            <p className="text-sm font-medium text-gray-900">{shop.owner_name}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Email</label>
            <p className="text-sm font-medium text-gray-900">{shop.owner_email}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Postcode</label>
            <p className="text-sm font-medium text-gray-900">{shop.postcode || '-'}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Type</label>
            <p className="text-sm font-medium text-gray-900">{shop.business_category || '-'}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Plan</label>
            <p className="text-sm font-medium text-gray-900 capitalize">{shop.plan_type}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
            <span
              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                shop.subscription_status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : shop.subscription_status === 'trial'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {shop.subscription_status}
            </span>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Created</label>
            <p className="text-sm font-medium text-gray-900">{new Date(shop.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Last Active</label>
            <p className="text-sm font-medium text-gray-900">{shop.updated_at ? new Date(shop.updated_at).toLocaleDateString() : '-'}</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Customers</div>
          <div className="text-2xl font-bold text-gray-900">{metrics.customers_count.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Points Issued</div>
          <div className="text-2xl font-bold text-blue-600">{metrics.points_issued.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Rewards Redeemed</div>
          <div className="text-2xl font-bold text-green-600">{metrics.rewards_redeemed.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Staff</div>
          <div className="text-2xl font-bold text-purple-600">{metrics.staff_count.toLocaleString()}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleEmailReport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            <Mail className="w-4 h-4 mr-2" />
            Email Monthly Report
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV Data
          </button>
          <button
            onClick={handleSendNotice}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Notice to Owner
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-semibold text-gray-900">Date</th>
                <th className="text-left py-2 font-semibold text-gray-900">Action</th>
                <th className="text-left py-2 font-semibold text-gray-900">User</th>
              </tr>
            </thead>
            <tbody>
              {activity.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-500">No recent activity</td>
                </tr>
              ) : (
                activity.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-2 text-gray-600">{new Date(item.created_at).toLocaleString()}</td>
                    <td className="py-2 text-gray-900">{item.action}</td>
                    <td className="py-2 text-gray-600 capitalize">{item.user_type}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

