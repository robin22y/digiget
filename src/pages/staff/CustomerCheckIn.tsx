import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CheckCircle, Gift, Star, X, ArrowLeft } from 'lucide-react';

interface Customer {
  id: string;
  phone: string;
  name: string | null;
  current_points: number;
  total_visits: number;
  last_visit_at: string | null;
}

interface ShopSettings {
  points_per_visit: number;
  points_for_reward: number;
  reward_description: string;
}

export default function CustomerCheckIn() {
  const { shopId, employeeId } = useParams<{ shopId: string; employeeId?: string }>();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const phoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shopId) {
      loadShopSettings();
    }
  }, [shopId]);

  // Auto-lookup when 11 digits entered
  useEffect(() => {
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    if (cleanPhone.length === 11) {
      lookupCustomer();
    } else {
      // Reset state if phone number changes
      setCustomer(null);
      setIsNewCustomer(false);
      setSuccessMessage('');
      setError('');
    }
  }, [phoneNumber]);

  // Auto-focus phone input after check-in
  useEffect(() => {
    if (!customer && !isNewCustomer && phoneNumber === '') {
      setTimeout(() => {
        phoneInputRef.current?.focus();
      }, 100);
    }
  }, [customer, isNewCustomer, phoneNumber]);

  async function loadShopSettings() {
    if (!shopId) return;

    // Try to get from shops table directly (some shops have points_needed, reward_description)
    const { data: shop } = await supabase
      .from('shops')
      .select('points_needed, reward_description')
      .eq('id', shopId)
      .single();

    if (shop) {
      setShopSettings({
        points_per_visit: 1,
        points_for_reward: shop.points_needed || 10,
        reward_description: shop.reward_description || 'Free haircut'
      });
    } else {
      // Fallback defaults
      setShopSettings({
        points_per_visit: 1,
        points_for_reward: 10,
        reward_description: 'Free haircut'
      });
    }
  }

  async function lookupCustomer() {
    if (!shopId || !shopSettings) return;

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    const cleanPhone = phoneNumber.replace(/\s/g, '');

    try {
      const { data, error: lookupError } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .eq('phone', cleanPhone)
        .single();

      if (lookupError && lookupError.code === 'PGRST116') {
        // No customer found - new customer
        setIsNewCustomer(true);
        setCustomer(null);
      } else if (lookupError) {
        throw lookupError;
      } else if (data) {
        // Returning customer
        setCustomer(data);
        setIsNewCustomer(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to lookup customer');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCheckInNewCustomer() {
    if (!firstName.trim()) {
      setError('Please enter customer first name');
      return;
    }

    if (!shopId || !shopSettings || !employeeId) return;

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const cleanPhone = phoneNumber.replace(/\s/g, '');

      // 1. Create customer
      const fullName = lastName.trim() 
        ? `${firstName.trim()} ${lastName.trim()}`.trim()
        : firstName.trim();
      
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          shop_id: shopId,
          phone: cleanPhone,
          name: fullName,
          current_points: shopSettings.points_per_visit,
          total_visits: 1,
          last_visit_at: new Date().toISOString()
        })
        .select()
        .single();

      if (customerError) {
        throw customerError;
      }

      // 2. Create visit record
      await supabase
        .from('customer_visits')
        .insert({
          customer_id: newCustomer.id,
          shop_id: shopId,
          visit_date: new Date().toISOString(),
          points_earned: shopSettings.points_per_visit,
          staff_id: employeeId || null
        });

      // 3. Create loyalty transaction
      await supabase
        .from('loyalty_transactions')
        .insert({
          shop_id: shopId,
          customer_id: newCustomer.id,
          transaction_type: 'point_added',
          points_change: shopSettings.points_per_visit,
          balance_after: shopSettings.points_per_visit
        });

      // 4. Show success
      setCustomer(newCustomer);
      setIsNewCustomer(false);
      setSuccessMessage(`✓ ${firstName} is now a loyalty member!`);

      // 5. Auto-reset after 3 seconds
      setTimeout(() => {
        resetForm();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create customer');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddPoint() {
    if (!customer || !shopId || !shopSettings || !employeeId) return;

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Check 30-minute cooldown
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      const { data: recentVisit } = await supabase
        .from('customer_visits')
        .select('visit_date')
        .eq('customer_id', customer.id)
        .gte('visit_date', thirtyMinutesAgo)
        .order('visit_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentVisit) {
        const lastCheckInTime = new Date(recentVisit.visit_date);
        const now = new Date();
        const minutesSince = Math.ceil((now.getTime() - lastCheckInTime.getTime()) / (1000 * 60));
        const remainingMinutes = 30 - minutesSince;
        setError(`Please wait ${remainingMinutes} more minute${remainingMinutes !== 1 ? 's' : ''} before adding points again.`);
        setIsLoading(false);
        return;
      }

      // 1. Update customer points
      const newPoints = customer.current_points + shopSettings.points_per_visit;
      const { data: updatedCustomer } = await supabase
        .from('customers')
        .update({
          current_points: newPoints,
          total_visits: customer.total_visits + 1,
          last_visit_at: new Date().toISOString()
        })
        .eq('id', customer.id)
        .select()
        .single();

      if (!updatedCustomer) {
        throw new Error('Failed to update customer');
      }

      // 2. Create visit record
      await supabase
        .from('customer_visits')
        .insert({
          customer_id: customer.id,
          shop_id: shopId,
          visit_date: new Date().toISOString(),
          points_earned: shopSettings.points_per_visit,
          staff_id: employeeId
        });

      // 3. Create loyalty transaction
      await supabase
        .from('loyalty_transactions')
        .insert({
          shop_id: shopId,
          customer_id: customer.id,
          transaction_type: 'point_added',
          points_change: shopSettings.points_per_visit,
          balance_after: newPoints
        });

      // 4. Update UI
      setCustomer(updatedCustomer);

      // 5. Show appropriate message
      const pointsRemaining = shopSettings.points_for_reward - newPoints;
      const customerName = customer.name?.split(' ')[0] || 'Customer';
      if (pointsRemaining === 0) {
        setSuccessMessage(`🎉 ${customerName} earned a ${shopSettings.reward_description}!`);
      } else if (pointsRemaining === 1) {
        setSuccessMessage(`✓ Point added! Just 1 more visit for reward!`);
      } else {
        setSuccessMessage(`✓ Point added! ${pointsRemaining} more visits for reward.`);
      }

      // 6. Auto-reset after 3 seconds
      setTimeout(() => {
        resetForm();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add point');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRedeemReward() {
    if (!customer || !shopId || !shopSettings || !employeeId) return;

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // 1. Reset points to 0
      const { data: updatedCustomer } = await supabase
        .from('customers')
        .update({
          current_points: 0,
          total_visits: customer.total_visits + 1,
          last_visit_at: new Date().toISOString()
        })
        .eq('id', customer.id)
        .select()
        .single();

      if (!updatedCustomer) {
        throw new Error('Failed to update customer');
      }

      // 2. Create visit record with reward flag
      await supabase
        .from('customer_visits')
        .insert({
          customer_id: customer.id,
          shop_id: shopId,
          visit_date: new Date().toISOString(),
          points_earned: 0,
          is_reward_redeemed: true,
          staff_id: employeeId
        });

      // 3. Create loyalty transaction
      await supabase
        .from('loyalty_transactions')
        .insert({
          shop_id: shopId,
          customer_id: customer.id,
          transaction_type: 'reward_redeemed',
          points_change: -shopSettings.points_for_reward,
          balance_after: 0
        });

      // 4. Show success
      const customerName = customer.name?.split(' ')[0] || 'Customer';
      setCustomer(updatedCustomer);
      setSuccessMessage(`🎁 ${customerName} redeemed their ${shopSettings.reward_description}!`);

      // 5. Auto-reset after 4 seconds
      setTimeout(() => {
        resetForm();
      }, 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to redeem reward');
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setPhoneNumber('');
    setCustomer(null);
    setIsNewCustomer(false);
    setFirstName('');
    setLastName('');
    setSuccessMessage('');
    setError('');
  }

  function handlePhoneInput(digit: string | 'backspace' | 'submit') {
    if (digit === 'backspace') {
      setPhoneNumber(prev => {
        const cleaned = prev.replace(/\s/g, '');
        const newNumber = cleaned.slice(0, -1);
        return formatPhoneNumber(newNumber);
      });
    } else if (digit === 'submit') {
      if (phoneNumber.replace(/\s/g, '').length === 11) {
        lookupCustomer();
      }
    } else {
      const cleaned = phoneNumber.replace(/\s/g, '');
      if (cleaned.length < 11) {
        const newNumber = cleaned + digit;
        setPhoneNumber(formatPhoneNumber(newNumber));
      }
    }
  }

  function formatPhoneNumber(number: string): string {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.length <= 5) return cleaned;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }

  function renderStars(current: number, total: number) {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <Star
            key={i}
            className={`w-6 h-6 ${i < current ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  }

  // Customer at reward threshold - show redeem option
  if (customer && !isNewCustomer && shopSettings && customer.current_points >= shopSettings.points_for_reward) {
    const customerName = customer.name?.split(' ')[0] || 'Customer';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 pb-20">
        <div className="max-w-2xl mx-auto p-4 pt-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              WELCOME BACK {customerName.toUpperCase()}! 🎉
            </h2>

            <div className="my-8">
              <div className="text-2xl font-bold text-gray-700 mb-2">Points: {customer.current_points} / {shopSettings.points_for_reward}</div>
              {renderStars(customer.current_points, shopSettings.points_for_reward)}
            </div>

            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-6 mb-8">
              <div className="text-4xl mb-2">🎁</div>
              <div className="text-2xl font-bold text-yellow-900">
                {shopSettings.reward_description.toUpperCase()} EARNED!
              </div>
            </div>

            {customer.last_visit_at && (
              <p className="text-gray-600 mb-6">
                Last visit: {new Date(customer.last_visit_at).toLocaleDateString()}
              </p>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleRedeemReward}
                disabled={isLoading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-6 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : `🎁 Redeem ${shopSettings.reward_description}`}
              </button>

              <button
                onClick={handleAddPoint}
                disabled={isLoading}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-4 rounded-xl font-semibold text-lg transition-all disabled:opacity-50"
              >
                Add Another Point Instead
              </button>

              <button
                onClick={resetForm}
                className="w-full text-gray-600 hover:text-gray-900 py-3 text-sm"
              >
                Check In Another Customer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Returning customer view
  if (customer && !isNewCustomer && shopSettings) {
    const pointsRemaining = shopSettings.points_for_reward - customer.current_points;
    const isClose = pointsRemaining <= 2;
    const customerName = customer.name?.split(' ')[0] || 'Customer';

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-20">
        <div className="max-w-2xl mx-auto p-4 pt-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-4xl mb-4">👋</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              ✓ WELCOME BACK {customerName.toUpperCase()}! 👋
            </h2>

            <div className="my-8">
              <div className="text-3xl font-bold text-gray-900 mb-3">
                Points: {customer.current_points} / {shopSettings.points_for_reward}
              </div>
              {renderStars(customer.current_points, shopSettings.points_for_reward)}
              
              {isClose && (
                <div className="mt-4 bg-orange-100 border-2 border-orange-400 rounded-xl p-4">
                  <div className="text-2xl mb-1">🎉</div>
                  <div className="text-xl font-bold text-orange-900">
                    {pointsRemaining === 1 
                      ? 'Just 1 more visit = FREE HAIRCUT!'
                      : `${pointsRemaining} more visits = FREE HAIRCUT`}
                  </div>
                </div>
              )}
            </div>

            {customer.last_visit_at && (
              <p className="text-gray-600 mb-2">
                Last visit: {new Date(customer.last_visit_at).toLocaleDateString()}
              </p>
            )}
            <p className="text-gray-600 mb-6">
              Total visits: {customer.total_visits}
            </p>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            )}

            <button
              onClick={handleAddPoint}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {isLoading ? 'Processing...' : 'Add Point (+1)'}
            </button>

            <button
              onClick={resetForm}
              className="w-full text-gray-600 hover:text-gray-900 py-3 text-sm"
            >
              Next Customer →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // New customer view
  if (isNewCustomer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-20">
        <div className="max-w-2xl mx-auto p-4 pt-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-4xl mb-4 text-center">✨</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">NEW CUSTOMER</h2>
            <p className="text-2xl font-semibold text-center text-gray-700 mb-8">{formatPhoneNumber(phoneNumber)}</p>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter first name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name (optional)</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <button
              onClick={handleCheckInNewCustomer}
              disabled={isLoading || !firstName.trim()}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {isLoading ? 'Creating...' : 'Check In & Add Point'}
            </button>

            <button
              onClick={resetForm}
              className="w-full text-gray-600 hover:text-gray-900 py-3 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Phone entry view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-20">
      <div className="max-w-2xl mx-auto p-4 pt-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">CHECK IN CUSTOMER</h2>

          {/* Phone Number Display */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
              Enter phone number:
            </label>
            <div className="text-5xl font-bold text-gray-900 text-center mb-6 min-h-[72px] flex items-center justify-center">
              {phoneNumber || '07586 868 654'}
            </div>
            <input
              ref={phoneInputRef}
              type="tel"
              value={phoneNumber}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\s/g, '');
                if (cleaned.length <= 11 && /^\d*$/.test(cleaned)) {
                  setPhoneNumber(formatPhoneNumber(cleaned));
                }
              }}
              className="sr-only"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="text-center text-gray-600 mb-6">Looking up customer...</div>
          )}

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handlePhoneInput(num.toString())}
                className="h-20 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl text-3xl font-bold text-gray-900 transition-colors shadow-md"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => handlePhoneInput('backspace')}
              className="h-20 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded-xl flex items-center justify-center transition-colors shadow-md"
            >
              <X className="w-8 h-8 text-gray-700" />
            </button>
            <button
              onClick={() => handlePhoneInput('0')}
              className="h-20 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl text-3xl font-bold text-gray-900 transition-colors shadow-md"
            >
              0
            </button>
            <button
              onClick={() => handlePhoneInput('submit')}
              disabled={phoneNumber.replace(/\s/g, '').length !== 11 || isLoading}
              className="h-20 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors shadow-md"
            >
              <CheckCircle className="w-8 h-8 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

