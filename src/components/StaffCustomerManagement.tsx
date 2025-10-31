import { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Customer {
  id: string;
  phone: string;
  name: string | null;
  current_points: number;
  total_visits: number;
  last_visit_at?: string;
}

interface StaffCustomerManagementProps {
  employeeId: string;
  shopId: string;
}

export default function StaffCustomerManagement({ employeeId, shopId }: StaffCustomerManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [shop, setShop] = useState<any>(null);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadShop();
  }, [shopId]);

  const loadShop = async () => {
    const { data } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .maybeSingle();

    setShop(data);
  };

  const searchCustomers = async () => {
    if (!searchTerm.trim()) {
      setCustomers([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .or(`phone.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
        .eq('active', true)
        .order('last_visit_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error searching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const createNewCustomer = async () => {
    if (!searchTerm.trim() || searchTerm.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          shop_id: shopId,
          phone: searchTerm,
          name: customerName.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      setSelectedCustomer(data);
      setCustomers([]);
      setSearchTerm('');
      setCustomerName('');
    } catch (err) {
      console.error('Error creating customer:', err);
      alert('Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const redeemReward = async () => {
    if (!selectedCustomer || !shop) return;

    if (selectedCustomer.current_points < shop.points_needed) {
      alert('Customer does not have enough points');
      return;
    }

    setLoading(true);
    try {
      const newPoints = selectedCustomer.current_points - shop.points_needed;

      const { error: customerError } = await supabase
        .from('customers')
        .update({
          current_points: newPoints,
          rewards_redeemed: selectedCustomer.total_visits + 1,
        })
        .eq('id', selectedCustomer.id);

      if (customerError) throw customerError;

      const { error: transactionError } = await supabase
        .from('loyalty_transactions')
        .insert({
          shop_id: shopId,
          customer_id: selectedCustomer.id,
          transaction_type: 'reward_redeemed',
          points_change: -shop.points_needed,
          balance_after: newPoints,
          added_by_employee_id: employeeId,
        });

      if (transactionError) throw transactionError;

      setSelectedCustomer({
        ...selectedCustomer,
        current_points: newPoints,
      });

      alert(`Reward redeemed! Customer gets: ${shop.reward_description}`);
    } catch (err) {
      console.error('Error redeeming reward:', err);
      alert('Failed to redeem reward');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!selectedCustomer) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({ name: editName.trim() || null })
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      setSelectedCustomer({
        ...selectedCustomer,
        name: editName.trim() || null,
      });

      setEditingName(false);
      setEditName('');
      alert('Customer name updated successfully');
    } catch (err) {
      console.error('Error updating name:', err);
      alert('Failed to update name');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoint = async () => {
    if (!selectedCustomer) return;

    setLoading(true);
    try {
      // Check cooldown period
      const daysBetweenPoints = shop?.days_between_points || 7;
      const lastVisitDate = selectedCustomer.last_visit_at 
        ? new Date(selectedCustomer.last_visit_at)
        : null;

      if (lastVisitDate) {
        const daysSinceLastVisit = Math.floor((Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastVisit < daysBetweenPoints) {
          const remainingDays = daysBetweenPoints - daysSinceLastVisit;
          alert(`Please wait ${remainingDays} more day${remainingDays !== 1 ? 's' : ''} before adding the next point.`);
          setLoading(false);
          return;
        }
      }

      // Add point
      const newPoints = selectedCustomer.current_points + 1;
      const newTotalVisits = selectedCustomer.total_visits + 1;

      const { error: updateError } = await supabase
        .from('customers')
        .update({
          current_points: newPoints,
          lifetime_points: selectedCustomer.current_points + 1,
          total_visits: newTotalVisits,
          last_visit_at: new Date().toISOString(),
        })
        .eq('id', selectedCustomer.id);

      if (updateError) throw updateError;

      // Create loyalty transaction
      const { error: transError } = await supabase
        .from('loyalty_transactions')
        .insert({
          shop_id: shopId,
          customer_id: selectedCustomer.id,
          transaction_type: 'point_added',
          points_change: 1,
          balance_after: newPoints,
          added_by_employee_id: employeeId,
        });

      if (transError) throw transError;

      setSelectedCustomer({
        ...selectedCustomer,
        current_points: newPoints,
        total_visits: newTotalVisits,
      });

      alert('Point added successfully!');
    } catch (err) {
      console.error('Error adding point:', err);
      alert('Failed to add point');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchCustomers()}
          placeholder="Search by phone or name..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        onClick={searchCustomers}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300"
      >
        {loading ? 'Searching...' : 'Search'}
      </button>

      {customers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg divide-y">
          {customers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => {
                setSelectedCustomer(customer);
                setCustomers([]);
                setSearchTerm('');
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900">{customer.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">{customer.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600">{customer.current_points} points</p>
                  <p className="text-xs text-gray-500">{customer.total_visits} visits</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {customers.length === 0 && searchTerm && !loading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <p className="text-gray-600 mb-4 text-center">No customer found with that phone number</p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Name (Optional)</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button
            onClick={createNewCustomer}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create New Customer
          </button>
        </div>
      )}

      {selectedCustomer && shop && (
        <div className="bg-white border-2 border-blue-500 rounded-xl p-6 space-y-4">
          <div className="text-center">
            {!editingName ? (
              <>
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedCustomer.name || selectedCustomer.phone}
                </h3>
                <p className="text-gray-600">{selectedCustomer.phone}</p>
                <button
                  onClick={() => {
                    setEditingName(true);
                    setEditName(selectedCustomer.name || '');
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Edit Name
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter customer full name"
                  className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center"
                  autoFocus
                />
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handleUpdateName}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setEditName('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-1">Current Points</p>
            <p className="text-5xl font-bold text-blue-600 mb-2">
              {selectedCustomer.current_points}
            </p>
            <p className="text-sm text-gray-600">
              {shop.points_needed - selectedCustomer.current_points > 0
                ? `${shop.points_needed - selectedCustomer.current_points} more points until reward`
                : 'Ready to redeem!'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{selectedCustomer.total_visits}</p>
              <p className="text-sm text-gray-600">Total Visits</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{shop.points_needed}</p>
              <p className="text-sm text-gray-600">Points Needed</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleAddPoint}
              disabled={loading}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300"
            >
              Add Point
            </button>

            {selectedCustomer.current_points >= shop.points_needed && (
              <button
                onClick={redeemReward}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-300"
              >
                Redeem Reward: {shop.reward_description}
              </button>
            )}

            <button
              onClick={() => {
                setSelectedCustomer(null);
                setCustomerName('');
                setEditingName(false);
                setEditName('');
              }}
              className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
