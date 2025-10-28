import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Star } from 'lucide-react';

export default function CustomerBalance() {
  const { shopId } = useParams();
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

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

  const handleCheckBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);

    try {
      const cleanPhone = phone.replace(/\s/g, '');

      const { data: shopData } = await supabase
        .from('shops')
        .select('shop_name, points_needed, reward_description')
        .eq('id', shopId)
        .single();

      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (customerData) {
        setCustomer(customerData);
        setShop(shopData);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error checking balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (points: number, needed: number) => {
    const stars = [];
    for (let i = 0; i < needed; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-8 h-8 ${i < points ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  if (customer && shop) {
    const isRewardReady = customer.current_points >= shop.points_needed;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{shop.shop_name}</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-6">Your Loyalty Balance</h2>

          <p className="text-lg text-gray-900 mb-6">Hi {customer.name || 'there'}! 👋</p>

          <div className="flex justify-center gap-2 mb-6">
            {renderStars(customer.current_points, shop.points_needed)}
          </div>

          <p className="text-lg text-gray-700 mb-6">
            You have {customer.current_points} out of {shop.points_needed} visits!
          </p>

          {isRewardReady ? (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-6">
              <p className="text-2xl font-bold text-green-800 mb-2">🎁 YOU'VE EARNED A REWARD!</p>
              <p className="text-lg text-green-700">{shop.reward_description}</p>
              <p className="text-sm text-green-600 mt-4">
                Show this screen to staff to claim your reward.
              </p>
            </div>
          ) : (
            <p className="text-gray-600 mb-6">
              {shop.points_needed - customer.current_points} more visit{shop.points_needed - customer.current_points !== 1 ? 's' : ''} to earn your reward!
            </p>
          )}

          <div className="text-sm text-gray-600 space-y-1">
            <p>Total visits: {customer.total_visits}</p>
            <p>Rewards claimed: {customer.rewards_redeemed}</p>
          </div>

          <button
            onClick={() => {
              setCustomer(null);
              setShop(null);
              setPhone('');
            }}
            className="mt-6 text-blue-600 hover:text-blue-700 font-medium"
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Phone Number Not Found</h2>
          <p className="text-gray-600 mb-6">
            Ask staff to add you to the loyalty program on your next visit!
          </p>
          <button
            onClick={() => {
              setNotFound(false);
              setPhone('');
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Loyalty Rewards</h1>
          <p className="text-gray-600">Check your loyalty balance</p>
        </div>

        <form onSubmit={handleCheckBalance}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter your phone number:
          </label>
          <input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="07XXX XXX XXX"
            required
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Balance'}
          </button>
        </form>
      </div>
    </div>
  );
}
