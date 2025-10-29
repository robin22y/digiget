import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Search, Plus, Filter, Eye, Power, PowerOff, Trash2 } from 'lucide-react';

interface Shop {
  id: string;
  shop_name: string;
  owner_name: string;
  owner_email: string;
  postcode: string | null;
  business_category: string | null;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

export default function ManageShops() {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedShops, setSelectedShops] = useState<Set<string>>(new Set());
  
  // New shop form state
  const [newShop, setNewShop] = useState({
    shop_name: '',
    owner_name: '',
    owner_email: '',
    phone: '',
    postcode: '',
    type: '',
  });

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    filterShops();
  }, [shops, searchQuery, statusFilter, typeFilter]);

  const loadShops = async () => {
    try {
      // Try with all columns first
      let { data, error } = await supabase
        .from('shops')
        .select('id, shop_name, owner_name, owner_email, postcode, business_category, subscription_status, created_at, updated_at')
        .order('created_at', { ascending: false });

      // If postcode or business_category columns don't exist, try without them
      if (error && (error.message?.includes('column') || error.code === '42703')) {
        console.warn('Some columns missing, trying fallback query');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('shops')
          .select('id, shop_name, owner_name, owner_email, subscription_status, created_at, updated_at')
          .order('created_at', { ascending: false });
          
          if (!fallbackError) {
            // Add null for missing columns
            const shopsWithDefaults = (fallbackData || []).map(shop => ({
              ...shop,
              postcode: null,
              business_category: null,
              updated_at: shop.updated_at || shop.created_at
            }));
            setShops(shopsWithDefaults);
            return;
          }
        }
        throw error;
      }
      setShops(data || []);
    } catch (error) {
      console.error('Error loading shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterShops = () => {
    let filtered = shops;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        shop =>
          shop.shop_name.toLowerCase().includes(query) ||
          shop.owner_name.toLowerCase().includes(query) ||
          shop.owner_email.toLowerCase().includes(query) ||
          shop.postcode?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(shop => shop.subscription_status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(shop => shop.business_category === typeFilter);
    }

    setFilteredShops(filtered);
  };

  const handleToggleSelection = (shopId: string) => {
    const newSelected = new Set(selectedShops);
    if (newSelected.has(shopId)) {
      newSelected.delete(shopId);
    } else {
      newSelected.add(shopId);
    }
    setSelectedShops(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedShops.size === filteredShops.length) {
      setSelectedShops(new Set());
    } else {
      setSelectedShops(new Set(filteredShops.map(s => s.id)));
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate') => {
    if (selectedShops.size === 0) return;

    const newStatus = action === 'activate' ? 'active' : 'cancelled';

    try {
      const { error } = await supabase
        .from('shops')
        .update({ subscription_status: newStatus })
        .in('id', Array.from(selectedShops));

      if (error) throw error;
      await loadShops();
      setSelectedShops(new Set());
      alert(`${selectedShops.size} shop(s) ${action}d successfully`);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleShopAction = async (shopId: string, action: 'activate' | 'deactivate' | 'delete') => {
    try {
      if (action === 'delete') {
        if (!confirm('Are you sure you want to delete this shop? This action cannot be undone.')) return;
        
        const { error } = await supabase
          .from('shops')
          .delete()
          .eq('id', shopId);

        if (error) throw error;
      } else {
        const newStatus = action === 'activate' ? 'active' : 'cancelled';
        const { error } = await supabase
          .from('shops')
          .update({ subscription_status: newStatus })
          .eq('id', shopId);

        if (error) throw error;
      }

      await loadShops();
      alert(`Shop ${action}d successfully`);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // In a real implementation, you'd also create the owner account in auth.users
      const { data: newShopData, error } = await supabase
        .from('shops')
        .insert({
          shop_name: newShop.shop_name,
          owner_name: newShop.owner_name,
          owner_email: newShop.owner_email,
          business_category: newShop.type || null,
          postcode: newShop.postcode || null,
          subscription_status: 'trial',
          plan_type: 'basic',
          loyalty_enabled: true,
          points_type: 'per_visit',
          points_needed: 10,
          reward_type: 'free_product',
          reward_description: 'Free item',
          qr_code_active: true,
          user_id: '00000000-0000-0000-0000-000000000000' // Placeholder - should be set when creating actual user
        })
        .select()
        .single();

      if (error) throw error;

      // Generate and save QR URL
      if (newShopData) {
        const qrUrl = `${window.location.origin}/dashboard/${newShopData.id}/checkin`;
        await supabase
          .from('shops')
          .update({ qr_url: qrUrl })
          .eq('id', newShopData.id);
      }

      setShowAddModal(false);
      setNewShop({ shop_name: '', owner_name: '', owner_email: '', phone: '', postcode: '', type: '' });
      await loadShops();
      alert('Shop created successfully');
    } catch (error: any) {
      alert(`Error creating shop: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-start h-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const uniqueTypes = Array.from(new Set(shops.map(s => s.business_category).filter(Boolean)));

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Manage Shops</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Shop
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, postcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {selectedShops.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors text-sm"
              >
                Activate ({selectedShops.size})
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors text-sm"
              >
                Deactivate ({selectedShops.size})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Shops Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-2">
                  <input
                    type="checkbox"
                    checked={selectedShops.size === filteredShops.length && filteredShops.length > 0}
                    onChange={handleToggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left py-2 font-semibold text-gray-900">Shop Name</th>
                <th className="text-left py-2 font-semibold text-gray-900">Owner</th>
                <th className="text-left py-2 font-semibold text-gray-900">Email</th>
                <th className="text-left py-2 font-semibold text-gray-900">Postcode</th>
                <th className="text-left py-2 font-semibold text-gray-900">Type</th>
                <th className="text-left py-2 font-semibold text-gray-900">Status</th>
                <th className="text-left py-2 font-semibold text-gray-900">Created</th>
                <th className="text-left py-2 font-semibold text-gray-900">Last Activity</th>
                <th className="text-right py-2 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShops.map((shop) => (
                <tr key={shop.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 pr-2">
                    <input
                      type="checkbox"
                      checked={selectedShops.has(shop.id)}
                      onChange={() => handleToggleSelection(shop.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="py-2 text-gray-900 font-medium">{shop.shop_name}</td>
                  <td className="py-2 text-gray-700">{shop.owner_name}</td>
                  <td className="py-2 text-gray-700">{shop.owner_email}</td>
                  <td className="py-2 text-gray-600">{shop.postcode || '-'}</td>
                  <td className="py-2 text-gray-600">{shop.business_category || '-'}</td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        shop.subscription_status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : shop.subscription_status === 'trial'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {shop.subscription_status}
                    </span>
                  </td>
                  <td className="py-2 text-gray-600">{new Date(shop.created_at).toLocaleDateString()}</td>
                  <td className="py-2 text-gray-600">{shop.updated_at ? new Date(shop.updated_at).toLocaleDateString() : '-'}</td>
                  <td className="py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => navigate(`/super-admin/shops/${shop.id}`)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {shop.subscription_status !== 'active' && (
                        <button
                          onClick={() => handleShopAction(shop.id, 'activate')}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Activate"
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      )}
                      {shop.subscription_status === 'active' && (
                        <button
                          onClick={() => handleShopAction(shop.id, 'deactivate')}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="Deactivate"
                        >
                          <PowerOff className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleShopAction(shop.id, 'delete')}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Shop Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Shop</h2>
            <form onSubmit={handleAddShop} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                <input
                  type="text"
                  required
                  value={newShop.shop_name}
                  onChange={(e) => setNewShop({ ...newShop, shop_name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                <input
                  type="text"
                  required
                  value={newShop.owner_name}
                  onChange={(e) => setNewShop({ ...newShop, owner_name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email</label>
                <input
                  type="email"
                  required
                  value={newShop.owner_email}
                  onChange={(e) => setNewShop({ ...newShop, owner_email: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newShop.phone}
                  onChange={(e) => setNewShop({ ...newShop, phone: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                <input
                  type="text"
                  value={newShop.postcode}
                  onChange={(e) => setNewShop({ ...newShop, postcode: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <input
                  type="text"
                  placeholder="e.g., Coffee shop, Barbershop"
                  value={newShop.type}
                  onChange={(e) => setNewShop({ ...newShop, type: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Create Shop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

