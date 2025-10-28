import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Store, Users, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';

interface ShopStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
}

interface TopShop {
  id: string;
  shop_name: string;
  owner_name: string;
  postcode: string | null;
  staff_count: number;
  points_issued: number;
  last_active: string;
}

interface InactiveShop {
  id: string;
  shop_name: string;
  postcode: string | null;
  owner_email: string;
  last_login: string | null;
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ShopStats>({ total: 0, active: 0, inactive: 0, suspended: 0 });
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [topShops, setTopShops] = useState<TopShop[]>([]);
  const [inactiveShops, setInactiveShops] = useState<InactiveShop[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load shop stats
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id, subscription_status');

      if (shopsError) throw shopsError;

      const shopStats: ShopStats = {
        total: shops?.length || 0,
        active: shops?.filter(s => s.subscription_status === 'active').length || 0,
        inactive: shops?.filter(s => s.subscription_status === 'trial' || s.subscription_status === 'cancelled').length || 0,
        suspended: shops?.filter(s => s.subscription_status === 'expired').length || 0,
      };

      setStats(shopStats);

      // Load total customers
      const { count: customersCount, error: customersError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      if (!customersError) {
        setTotalCustomers(customersCount || 0);
      }

      // Load check-ins from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: checkInsCount, error: checkInsError } = await supabase
        .from('loyalty_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('transaction_type', 'point_added')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (!checkInsError) {
        setTotalCheckIns(checkInsCount || 0);
      }

      // Load top performing shops (simplified - would need aggregation in real implementation)
      const { data: allShops, error: allShopsError } = await supabase
        .from('shops')
        .select('id, shop_name, owner_name, owner_email, postcode')
        .order('updated_at', { ascending: false })
        .limit(10);

      if (!allShopsError && allShops) {
        // Get staff counts and points for each shop
        const topShopsData = await Promise.all(
          allShops.map(async (shop) => {
            const { count: staffCount } = await supabase
              .from('employees')
              .select('*', { count: 'exact', head: true })
              .eq('shop_id', shop.id);

            const { count: pointsCount } = await supabase
              .from('loyalty_transactions')
              .select('*', { count: 'exact', head: true })
              .eq('shop_id', shop.id)
              .eq('transaction_type', 'point_added')
              .gte('created_at', sevenDaysAgo.toISOString());

            return {
              id: shop.id,
              shop_name: shop.shop_name,
              owner_name: shop.owner_name,
              postcode: shop.postcode,
              staff_count: staffCount || 0,
              points_issued: pointsCount || 0,
              last_active: shop.updated_at || '',
            };
          })
        );

        setTopShops(topShopsData.sort((a, b) => b.points_issued - a.points_issued).slice(0, 5));
      }

      // Load inactive shops (no activity in 14 days)
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const { data: inactiveShopsData, error: inactiveError } = await supabase
        .from('shops')
        .select('id, shop_name, postcode, owner_email, updated_at')
        .or(`updated_at.lt.${fourteenDaysAgo.toISOString()},updated_at.is.null`)
        .limit(10);

      if (!inactiveError && inactiveShopsData) {
        setInactiveShops(
          inactiveShopsData.map(shop => ({
            id: shop.id,
            shop_name: shop.shop_name,
            postcode: shop.postcode,
            owner_email: shop.owner_email,
            last_login: shop.updated_at,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-start h-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center text-gray-600 text-sm mb-2">
            <Store className="w-5 h-5 mr-2 text-blue-600" />
            <span className="font-medium">Total Shops</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center text-gray-600 text-sm mb-2">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            <span className="font-medium">Active</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center text-gray-600 text-sm mb-2">
            <AlertCircle className="w-5 h-5 mr-2 text-gray-600" />
            <span className="font-medium">Inactive</span>
          </div>
          <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center text-gray-600 text-sm mb-2">
            <Users className="w-5 h-5 mr-2 text-purple-600" />
            <span className="font-medium">Customers</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalCustomers.toLocaleString()}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center text-gray-600 text-sm mb-2">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            <span className="font-medium">Check-ins (7d)</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{totalCheckIns.toLocaleString()}</div>
        </div>
      </div>

      {/* Top Performing Shops */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Top Performing Shops</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-semibold text-gray-900">Shop Name</th>
                <th className="text-left py-2 font-semibold text-gray-900">Owner</th>
                <th className="text-left py-2 font-semibold text-gray-900">Postcode</th>
                <th className="text-right py-2 font-semibold text-gray-900">Staff</th>
                <th className="text-right py-2 font-semibold text-gray-900">Points (7d)</th>
                <th className="text-left py-2 font-semibold text-gray-900">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {topShops.map((shop) => (
                <tr key={shop.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/super-admin/shops/${shop.id}`)}>
                  <td className="py-2 text-gray-900 font-medium">{shop.shop_name}</td>
                  <td className="py-2 text-gray-700">{shop.owner_name}</td>
                  <td className="py-2 text-gray-600">{shop.postcode || '-'}</td>
                  <td className="py-2 text-right text-gray-700">{shop.staff_count}</td>
                  <td className="py-2 text-right text-blue-600 font-semibold">{shop.points_issued}</td>
                  <td className="py-2 text-gray-600">{shop.last_active ? new Date(shop.last_active).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inactive Shops */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Inactive Shops (no activity in 14 days)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-semibold text-gray-900">Shop Name</th>
                <th className="text-left py-2 font-semibold text-gray-900">Postcode</th>
                <th className="text-left py-2 font-semibold text-gray-900">Owner Email</th>
                <th className="text-left py-2 font-semibold text-gray-900">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {inactiveShops.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">No inactive shops found</td>
                </tr>
              ) : (
                inactiveShops.map((shop) => (
                  <tr key={shop.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/super-admin/shops/${shop.id}`)}>
                    <td className="py-2 text-gray-900 font-medium">{shop.shop_name}</td>
                    <td className="py-2 text-gray-600">{shop.postcode || '-'}</td>
                    <td className="py-2 text-gray-700">{shop.owner_email}</td>
                    <td className="py-2 text-gray-600">{shop.last_login ? new Date(shop.last_login).toLocaleDateString() : 'Never'}</td>
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

