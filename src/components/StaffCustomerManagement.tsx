import { useState, useEffect } from 'react';
import { Search, Plus, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Customer {
  id: string;
  phone: string;
  name: string | null;
  current_points: number;
  total_visits: number;
}

interface StaffCustomerManagementProps {
  employeeId: string;
  shopId: string;
}

export default function StaffCustomerManagement({ employeeId, shopId }: StaffCustomerManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [shop, setShop] = useState<any>(null);

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
        })
        .select()
        .single();

      if (error) throw error;
      setSelectedCustomer(data);
      setCustomers([]);
      setSearchTerm('');
    } catch (err) {
      console.error('Error creating customer:', err);
      alert('Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const addPoints = async () => {
    if (!selectedCustomer || !shop) return;

    setLoading(true);
    try {
      const pointsToAdd = shop.points_type === 'per_visit' ? 1 : 0;
      const newPoints = selectedCustomer.current_points + pointsToAdd;

      const { error: customerError } = await supabase
        .from('customers')
        .update({
          current_points: newPoints,
          lifetime_points: selectedCustomer.total_visits + pointsToAdd,
          total_visits: selectedCustomer.total_visits + 1,
          last_visit_at: new Date().toISOString(),
        })
        .eq('id', selectedCustomer.id);

      if (customerError) throw customerError;

      const { error: transactionError } = await supabase
        .from('loyalty_transactions')
        .insert({
          shop_id: shopId,
          customer_id: selectedCustomer.id,
          transaction_type: 'point_added',
          points_change: pointsToAdd,
          balance_after: newPoints,
          added_by_employee_id: employeeId,
        });

      if (transactionError) throw transactionError;

      setSelectedCustomer({
        ...selectedCustomer,
        current_points: newPoints,
        total_visits: selectedCustomer.total_visits + 1,
      });

      alert('Points added successfully!');
    } catch (err) {
      console.error('Error adding points:', err);
      alert('Failed to add points');
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
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-4">No customer found with that phone number</p>
          <button
            onClick={createNewCustomer}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create New Customer
          </button>
        </div>
      )}

      {selectedCustomer && shop && (
        <div className="bg-white border-2 border-blue-500 rounded-xl p-6 space-y-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900">
              {selectedCustomer.name || selectedCustomer.phone}
            </h3>
            <p className="text-gray-600">{selectedCustomer.phone}</p>
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
              onClick={addPoints}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300"
            >
              <CheckCircle className="w-5 h-5" />
              Add Point (Check In)
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
              onClick={() => setSelectedCustomer(null)}
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
