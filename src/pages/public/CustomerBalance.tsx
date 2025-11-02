import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Star, Edit2, Save, X } from 'lucide-react';

export default function CustomerBalance() {
  const { shopId } = useParams();
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);

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
        setEditedName(customerData.name || '');
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

  const handleSaveName = async () => {
    if (!customer || !shopId) return;
    
    setSavingName(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({ name: editedName.trim() || null })
        .eq('id', customer.id);

      if (error) throw error;

      // Update local customer state
      setCustomer({ ...customer, name: editedName.trim() || null });
      setIsEditingName(false);
    } catch (error) {
      console.error('Error saving name:', error);
      alert('Failed to save name. Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  if (customer && shop) {
    const isRewardReady = customer.current_points >= shop.points_needed;
    const pointsNeeded = Math.max(0, shop.points_needed - customer.current_points);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">{shop.shop_name}</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-6 text-center">Your Loyalty Balance</h2>

          {/* Name Section */}
          <div className="mb-6">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Enter your name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  title="Save name"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsEditingName(false);
                    setEditedName(customer.name || '');
                  }}
                  className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-lg text-gray-900 mb-2">
                  {customer.name ? (
                    <>Hi {customer.name}! 👋</>
                  ) : (
                    <>Hi there! 👋</>
                  )}
                </p>
                <button
                  onClick={() => {
                    setIsEditingName(true);
                    setEditedName(customer.name || '');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
                >
                  <Edit2 className="w-3 h-3" />
                  {customer.name ? 'Edit name' : 'Add your name'}
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-2 mb-6">
            {renderStars(customer.current_points, shop.points_needed)}
          </div>

          {/* Points Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900 mb-1">
                {customer.current_points} / {shop.points_needed}
              </p>
              <p className="text-sm text-blue-700">Accumulated Points</p>
            </div>
          </div>

          {/* Points Needed */}
          {!isRewardReady && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-center">
              <p className="text-lg font-semibold text-gray-900 mb-1">
                {pointsNeeded} more {pointsNeeded !== 1 ? 'points' : 'point'} needed
              </p>
              <p className="text-sm text-gray-600">for your reward</p>
            </div>
          )}

          {isRewardReady ? (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-6 text-center">
              <p className="text-2xl font-bold text-green-800 mb-2">🎁 YOU'VE EARNED A REWARD!</p>
              <p className="text-lg text-green-700">{shop.reward_description}</p>
              <p className="text-sm text-green-600 mt-4">
                Show this screen to staff to claim your reward.
              </p>
            </div>
          ) : null}

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
