import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { User, LogOut, Edit2, Save, X, Trash2, Gift, Star, Award, Crown, Sparkles, AlertCircle } from 'lucide-react';

interface Shop {
  id: string;
  shop_name: string;
  points_needed: number;
  reward_description: string;
}

interface Customer {
  id: string;
  phone: string;
  name: string | null;
  current_points: number;
  classification: 'VIP' | 'Regular' | 'New' | null;
  tier: 'New' | 'VIP' | 'Super Star' | 'Royal' | null;
}

export default function CustomerLoginPortal() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // UK phone number regex: accepts +44 or 0 prefix, followed by 10 digits
  const ukPhoneRegex = /^(?:\+44|0)[1-9]\d{9}$/;

  // Check for stored login session
  useEffect(() => {
    if (shopId) {
      const storedCustomer = localStorage.getItem(`customer_${shopId}`);
      if (storedCustomer) {
        try {
          const customerData = JSON.parse(storedCustomer);
          setCustomer(customerData);
          setLoggedIn(true);
          loadCustomerData(customerData.id);
        } catch (e) {
          console.error('Error parsing stored customer:', e);
          localStorage.removeItem(`customer_${shopId}`);
        }
      }
      loadShop();
    }
  }, [shopId]);

  const loadShop = async () => {
    if (!shopId) return;
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('id, shop_name, points_needed, reward_description')
        .eq('id', shopId)
        .single();

      if (error) throw error;
      setShop(data);
    } catch (err: any) {
      console.error('Error loading shop:', err);
      setError('Shop not found');
    }
  };

  const loadCustomerData = async (customerId: string) => {
    if (!shopId || !customerId) return;
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, phone, name, current_points, classification, tier')
        .eq('id', customerId)
        .eq('shop_id', shopId)
        .single();

      if (error) throw error;
      if (data) {
        setCustomer(data);
        // Update stored customer data
        localStorage.setItem(`customer_${shopId}`, JSON.stringify(data));
      }
    } catch (err: any) {
      console.error('Error loading customer:', err);
      setError('Failed to load customer data');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Clean phone number (remove spaces)
    const cleanPhone = phone.replace(/\s/g, '');

    // Validate UK phone number
    if (!ukPhoneRegex.test(cleanPhone)) {
      setError('Please enter a valid UK phone number (e.g., 07123456789 or +447123456789)');
      setLoading(false);
      return;
    }

    if (!shopId) {
      setError('Shop ID missing');
      setLoading(false);
      return;
    }

    try {
      // Search for customer by phone and shop
      const { data, error: searchError } = await supabase
        .from('customers')
        .select('id, phone, name, current_points, classification, tier')
        .eq('shop_id', shopId)
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (searchError) throw searchError;

      if (data) {
        setCustomer(data);
        setLoggedIn(true);
        setPhone('');
        // Store customer data in localStorage
        localStorage.setItem(`customer_${shopId}`, JSON.stringify(data));
      } else {
        setError('No account found with this phone number. Please check in at the shop first to create an account.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditName = () => {
    setEditedName(customer?.name || '');
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!customer || !shopId) return;
    setSavingName(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({ name: editedName.trim() || null })
        .eq('id', customer.id);

      if (error) throw error;

      // Reload customer data
      await loadCustomerData(customer.id);
      setEditingName(false);
    } catch (err: any) {
      console.error('Error updating name:', err);
      setError('Failed to update name. Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingName(false);
    setEditedName('');
  };

  const handleLogout = () => {
    if (shopId) {
      localStorage.removeItem(`customer_${shopId}`);
    }
    setLoggedIn(false);
    setCustomer(null);
    setPhone('');
    setError('');
  };

  const handleDeleteData = async () => {
    if (!customer || !shopId) return;

    if (deleteConfirmText.toLowerCase() !== 'delete') {
      setError('Please type "delete" to confirm');
      return;
    }

    setDeleting(true);
    try {
      // Delete customer data
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customer.id);

      if (error) throw error;

      // Clear stored data
      localStorage.removeItem(`customer_${shopId}`);

      // Reset state
      setLoggedIn(false);
      setCustomer(null);
      setShowDeleteModal(false);
      setDeleteConfirmText('');
      setError('');
      alert('Your personal data has been deleted successfully.');
    } catch (err: any) {
      console.error('Error deleting data:', err);
      setError('Failed to delete data. Please try again or contact support.');
    } finally {
      setDeleting(false);
    }
  };

  const getPointsRemaining = () => {
    if (!shop || !customer) return 0;
    return Math.max(0, shop.points_needed - customer.current_points);
  };

  const getClassificationBadge = () => {
    if (!customer) return null;
    
    // Priority: tier > classification
    const displayTier = customer.tier || customer.classification || 'New';
    
    const badges = {
      'Royal': { icon: Crown, color: 'bg-purple-600', textColor: 'text-purple-100' },
      'Super Star': { icon: Sparkles, color: 'bg-yellow-500', textColor: 'text-yellow-100' },
      'VIP': { icon: Star, color: 'bg-blue-600', textColor: 'text-blue-100' },
      'Regular': { icon: User, color: 'bg-green-600', textColor: 'text-green-100' },
      'New': { icon: User, color: 'bg-gray-500', textColor: 'text-gray-100' },
    };

    const badge = badges[displayTier as keyof typeof badges] || badges['New'];
    const Icon = badge.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${badge.color} ${badge.textColor} font-semibold`}>
        <Icon className="w-5 h-5" />
        <span>{displayTier}</span>
      </div>
    );
  };

  if (!shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md mx-auto p-6">
        {!loggedIn ? (
          /* Login Form */
          <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Portal</h1>
              <p className="text-gray-600">{shop.shop_name}</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  UK Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07123456789 or +447123456789"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your UK phone number (starting with 0 or +44)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        ) : (
          /* Customer Dashboard */
          <div className="space-y-6 mt-8">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
                  <p className="text-gray-600">{shop.shop_name}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>

              {/* Classification Badge */}
              {getClassificationBadge()}
            </div>

            {/* Points Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gift className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Your Points</h2>
                </div>
              </div>
              <div className="text-5xl font-bold mb-2">{customer?.current_points || 0}</div>
              <p className="text-blue-100 text-sm mb-4">
                {getPointsRemaining() > 0
                  ? `${getPointsRemaining()} more point${getPointsRemaining() !== 1 ? 's' : ''} needed for reward`
                  : '🎉 You\'re eligible for a reward!'}
              </p>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-sm">
                  <strong>Reward:</strong> {shop.reward_description}
                </p>
              </div>
            </div>

            {/* Name Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Your Name</h2>
                {!editingName && (
                  <button
                    onClick={handleEditName}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {editingName ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {savingName ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 text-lg">
                  {customer?.name || (
                    <span className="text-gray-400 italic">No name set. Click edit to add your name.</span>
                  )}
                </p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Delete Data Footer */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
              <p className="text-sm text-gray-600 mb-4">
                You can request to delete all your personal data from this shop's records. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span>Delete My Data</span>
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Personal Data</h3>
              <p className="text-gray-600 mb-4">
                This will permanently delete all your data from {shop.shop_name}. This action cannot be undone.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type "delete" to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="delete"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteData}
                  disabled={deleting || deleteConfirmText.toLowerCase() !== 'delete'}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting...' : 'Delete Forever'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

