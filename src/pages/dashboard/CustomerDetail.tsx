import { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Star, Award, Calendar, TrendingUp } from 'lucide-react';

interface Shop {
  points_needed: number;
  reward_description: string;
}

interface Customer {
  id: string;
  phone: string;
  name: string | null;
  current_points: number;
  lifetime_points: number;
  total_visits: number;
  rewards_redeemed: number;
  first_visit_at: string;
  last_visit_at: string;
}

interface Transaction {
  id: string;
  transaction_type: string;
  points_change: number;
  balance_after: number;
  created_at: string;
  notes: string | null;
  employees: {
    first_name: string;
    last_name: string | null;
  } | null;
}

export default function CustomerDetail() {
  const { shopId, customerId } = useParams();
  const navigate = useNavigate();
  const { shop } = useOutletContext<{ shop: Shop }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      const { data: transactionData, error: transactionError } = await supabase
        .from('loyalty_transactions')
        .select('*, employees(first_name, last_name)')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (transactionError) throw transactionError;
      setTransactions(transactionData || []);
    } catch (error) {
      console.error('Error loading customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemReward = async () => {
    if (!customer || customer.current_points < shop.points_needed) return;

    if (!confirm(`Redeem reward: ${shop.reward_description}?`)) return;

    try {
      await supabase
        .from('customers')
        .update({
          current_points: 0,
          rewards_redeemed: customer.rewards_redeemed + 1
        })
        .eq('id', customerId);

      await supabase
        .from('loyalty_transactions')
        .insert({
          shop_id: shopId!,
          customer_id: customerId!,
          transaction_type: 'reward_redeemed',
          points_change: -shop.points_needed,
          balance_after: 0
        });

      loadCustomerData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleAddPoint = async () => {
    if (!customer) return;

    try {
      const newPoints = customer.current_points + 1;

      await supabase
        .from('customers')
        .update({
          current_points: newPoints,
          lifetime_points: customer.lifetime_points + 1,
          total_visits: customer.total_visits + 1,
          last_visit_at: new Date().toISOString()
        })
        .eq('id', customerId);

      await supabase
        .from('loyalty_transactions')
        .insert({
          shop_id: shopId!,
          customer_id: customerId!,
          transaction_type: 'point_added',
          points_change: 1,
          balance_after: newPoints,
          notes: 'Manually added by owner'
        });

      loadCustomerData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const renderStars = (points: number) => {
    const stars = [];
    for (let i = 0; i < shop.points_needed; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-6 h-6 ${i < points ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!customer) {
    return (
      <div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Not Found</h2>
          <Link to={`/dashboard/${shopId}/customers`} className="text-blue-600 hover:text-blue-700">
            ← Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  const isRewardReady = customer.current_points >= shop.points_needed;
  const daysSinceFirstVisit = Math.floor(
    (new Date().getTime() - new Date(customer.first_visit_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysSinceLastVisit = Math.floor(
    (new Date().getTime() - new Date(customer.last_visit_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div>
      <button
        onClick={() => navigate(`/dashboard/${shopId}/customers`)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Customers
      </button>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {customer.name || 'Unnamed Customer'}
            </h1>
            <p className="text-lg text-gray-600">{customer.phone}</p>
          </div>
          <div className="text-right">
            {isRewardReady && (
              <button
                onClick={handleRedeemReward}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold mb-2"
              >
                Redeem Reward
              </button>
            )}
            <button
              onClick={handleAddPoint}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold block w-full"
            >
              Add Point Manually
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center mb-6">
          <div className="flex space-x-2">
            {renderStars(customer.current_points)}
          </div>
        </div>

        <div className="text-center mb-6">
          <p className="text-xl font-semibold text-gray-900">
            {customer.current_points}/{shop.points_needed} visits
          </p>
          {isRewardReady ? (
            <p className="text-green-600 font-semibold mt-2">🎁 REWARD READY!</p>
          ) : (
            <p className="text-gray-600 mt-2">
              {shop.points_needed - customer.current_points} more visit{shop.points_needed - customer.current_points !== 1 ? 's' : ''} to reward
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center text-gray-600 mb-1">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span className="text-sm">Total Visits</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{customer.total_visits}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-gray-600 mb-1">
              <Star className="w-4 h-4 mr-1" />
              <span className="text-sm">Lifetime Points</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{customer.lifetime_points}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-gray-600 mb-1">
              <Award className="w-4 h-4 mr-1" />
              <span className="text-sm">Rewards Claimed</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{customer.rewards_redeemed}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-gray-600 mb-1">
              <Calendar className="w-4 h-4 mr-1" />
              <span className="text-sm">Last Visit</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {daysSinceLastVisit === 0 ? 'Today' : `${daysSinceLastVisit}d ago`}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
          <p>Member since: {new Date(customer.first_visit_at).toLocaleDateString()} ({daysSinceFirstVisit} days)</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Visit History</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-600">No transaction history yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="border-b border-gray-200 pb-3 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.transaction_type === 'point_added' && '➕ Point Added'}
                      {transaction.transaction_type === 'reward_redeemed' && '🎁 Reward Redeemed'}
                      {transaction.transaction_type === 'points_adjusted' && '✏️ Points Adjusted'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(transaction.created_at).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {transaction.employees && (
                      <p className="text-sm text-gray-500 mt-1">
                        By: {transaction.employees.first_name} {transaction.employees.last_name || ''}
                      </p>
                    )}
                    {transaction.notes && (
                      <p className="text-sm text-gray-500 mt-1">{transaction.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${
                      transaction.points_change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.points_change > 0 ? '+' : ''}{transaction.points_change}
                    </p>
                    <p className="text-sm text-gray-600">Balance: {transaction.balance_after}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
