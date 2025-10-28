import { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CheckCircle, Star } from 'lucide-react';

interface Shop {
  id: string;
  points_needed: number;
  reward_description: string;
}

interface Customer {
  id: string;
  phone: string;
  name: string | null;
  current_points: number;
}

export default function CheckInPage() {
  const { shopId } = useParams();
  const { shop } = useOutletContext<{ shop: Shop }>();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);

  useEffect(() => {
    loadRecentCheckins();
  }, [shopId]);

  const loadRecentCheckins = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('loyalty_transactions')
        .select('*, customers(*)')
        .eq('shop_id', shopId)
        .eq('transaction_type', 'point_added')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setRecentCheckins(data);
      }
    } catch (error) {
      console.error('Error loading recent check-ins:', error);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    if (numbers.length <= 8) return `${numbers.slice(0, 5)} ${numbers.slice(5)}`;
    return `${numbers.slice(0, 5)} ${numbers.slice(5, 8)} ${numbers.slice(8, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const cleanPhone = phone.replace(/\s/g, '');

      let { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (!customer) {
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
            shop_id: shopId!,
            phone: cleanPhone,
            current_points: 1,
            lifetime_points: 1,
            total_visits: 1
          })
          .select()
          .single();

        if (createError) throw createError;
        customer = newCustomer;

        await supabase
          .from('loyalty_transactions')
          .insert({
            shop_id: shopId!,
            customer_id: customer.id,
            transaction_type: 'point_added',
            points_change: 1,
            balance_after: 1
          });

        setMessage({
          type: 'success',
          text: `New customer! 1/${shop.points_needed} visits`
        });
      } else {
        const newPoints = customer.current_points + 1;
        const newTotalVisits = customer.total_visits + 1;

        if (newPoints >= shop.points_needed) {
          setMessage({
            type: 'success',
            text: `🎉 REWARD READY! Customer has earned ${shop.reward_description}`
          });
        } else {
          setMessage({
            type: 'success',
            text: `Point added! ${newPoints}/${shop.points_needed} visits`
          });
        }

        await supabase
          .from('customers')
          .update({
            current_points: newPoints,
            lifetime_points: customer.lifetime_points + 1,
            total_visits: newTotalVisits,
            last_visit_at: new Date().toISOString()
          })
          .eq('id', customer.id);

        await supabase
          .from('loyalty_transactions')
          .insert({
            shop_id: shopId!,
            customer_id: customer.id,
            transaction_type: 'point_added',
            points_change: 1,
            balance_after: newPoints
          });
      }

      setPhone('');
      loadRecentCheckins();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemReward = async (customerId: string) => {
    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (!customer) return;

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
          customer_id: customerId,
          transaction_type: 'reward_redeemed',
          points_change: -shop.points_needed,
          balance_after: 0
        });

      setMessage({
        type: 'success',
        text: 'Reward redeemed! Customer starts fresh at 0 visits'
      });

      loadRecentCheckins();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const renderStars = (points: number) => {
    const stars = [];
    for (let i = 0; i < shop.points_needed; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-5 h-5 ${i < points ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Check In Customer</h1>

        {message && (
          <div
            className={`mb-4 p-4 rounded-xl border-l-4 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border-green-500' 
                : 'bg-red-50 text-red-700 border-red-500'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleCheckIn}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Enter customer phone number:
          </label>
          <input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="07XXX XXX XXX"
            required
            className="w-full px-4 py-3.5 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-4"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? 'Adding Point...' : '✨ Add Point'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Check-Ins (Today)</h2>
        {recentCheckins.length === 0 ? (
          <p className="text-gray-500">No check-ins today yet</p>
        ) : (
          <div className="space-y-4">
            {recentCheckins.map((checkin) => {
              const customer = checkin.customers;
              const isRewardReady = customer.current_points >= shop.points_needed;

              return (
                <div key={checkin.id} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {customer.name || customer.phone}
                      </p>
                      <div className="flex items-center mt-1">
                        {renderStars(customer.current_points)}
                        <span className="ml-2 text-sm text-gray-600">
                          {customer.current_points}/{shop.points_needed} visits
                        </span>
                      </div>
                      {isRewardReady && (
                        <p className="text-green-600 font-semibold mt-1">⭐ REWARD READY!</p>
                      )}
                    </div>
                    {isRewardReady && (
                      <button
                        onClick={() => handleRedeemReward(customer.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Redeem Reward
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
