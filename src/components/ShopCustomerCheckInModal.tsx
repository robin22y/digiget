import { useState, useEffect } from 'react';
import { X, Gift, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ShopCustomerCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  onSuccess?: () => void;
}

export function ShopCustomerCheckInModal({ 
  isOpen, 
  onClose, 
  shopId,
  onSuccess 
}: ShopCustomerCheckInModalProps) {
  const [step, setStep] = useState<'phone' | 'bill' | 'pin' | 'name' | 'success' | 'redeem'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [staffPin, setStaffPin] = useState('');
  const [redeemPin, setRedeemPin] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employee, setEmployee] = useState<any>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);

  // Load shop data on mount
  useEffect(() => {
    if (isOpen && shopId) {
      loadShop();
    }
  }, [isOpen, shopId]);

  async function loadShop() {
    try {
      const { data } = await supabase
        .from('shops')
        .select('shop_name, points_needed, reward_description, loyalty_enabled, points_type')
        .eq('id', shopId)
        .single();
      setShop(data);
    } catch (error) {
      console.error('Error loading shop:', error);
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    if (numbers.length <= 8) return `${numbers.slice(0, 5)} ${numbers.slice(5)}`;
    return `${numbers.slice(0, 5)} ${numbers.slice(5, 8)} ${numbers.slice(8, 11)}`;
  };

  if (!isOpen) return null;

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const cleanPhone = phoneNumber.replace(/\s/g, '');

      // Find or create customer
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (existingCustomer) {
        setCustomer(existingCustomer);
        setIsNewCustomer(false);
        // Move to bill amount entry for existing customers
        setStep('bill');
      } else {
        // Create new customer immediately (without name - will add later)
        setIsNewCustomer(true);
        try {
          const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert({
              shop_id: shopId,
              phone: cleanPhone,
              name: null,
              current_points: 0,
              lifetime_points: 0,
              total_visits: 0,
            })
            .select()
            .single();

          if (createError) throw createError;
          setCustomer(newCustomer);
          // Move to bill amount entry now that customer exists
          setStep('bill');
        } catch (createErr: any) {
          setError('Failed to create customer. Please try again.');
          console.error('Customer creation error:', createErr);
        }
      }

    } catch (error: any) {
      console.error('Customer error:', error);
      setError('Failed to find customer');
    } finally {
      setLoading(false);
    }
  }

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Update customer name
      const { data: updatedCustomer, error: updateError } = await supabase
        .from('customers')
        .update({
          name: customerName.trim() || null,
        })
        .eq('id', customer.id)
        .select()
        .single();

      if (updateError) throw updateError;
      setCustomer(updatedCustomer);

      // Move to success screen
      setStep('success');
      startAutoCloseTimer();
    } catch (error: any) {
      console.error('Error updating customer name:', error);
      setError('Failed to update customer name');
    } finally {
      setLoading(false);
    }
  }

  function startAutoCloseTimer() {
    // Clear any existing timer
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
    }

    // Set new timer to close after 2 minutes
    const timer = setTimeout(() => {
      handleClose();
    }, 2 * 60 * 1000); // 2 minutes in milliseconds

    setAutoCloseTimer(timer);
  }

  useEffect(() => {
    // Cleanup timer on unmount
    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [autoCloseTimer]);

  async function handleStaffPinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Verify staff PIN
      const { data: staffData, error: staffError } = await supabase
        .from('employees')
        .select('*, payment_type, commission_percentage, base_hourly_rate, hourly_rate')
        .eq('shop_id', shopId)
        .eq('pin', staffPin)
        .eq('active', true)
        .maybeSingle();

      if (staffError || !staffData) {
        setError('Invalid staff PIN');
        setStaffPin('');
        setLoading(false);
        return;
      }

      setEmployee(staffData);

      // Validate customer exists
      if (!customer || !customer.id) {
        setError('Customer not found. Please try again.');
        setLoading(false);
        return;
      }

      // Calculate commission if bill amount provided and staff has commission
      const bill = parseFloat(billAmount || '0');
      let commissionEarned = 0;

      if (bill > 0 && (staffData.payment_type === 'commission' || staffData.payment_type === 'hybrid')) {
        const commissionPct = staffData.commission_percentage || 0;
        commissionEarned = (bill * commissionPct) / 100;
      }

      // Check 30-minute cooldown for same phone number
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      const { data: recentTransaction } = await supabase
        .from('loyalty_transactions')
        .select('created_at')
        .eq('shop_id', shopId)
        .eq('customer_id', customer.id)
        .eq('transaction_type', 'point_added')
        .gte('created_at', thirtyMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentTransaction) {
        const lastCheckInTime = new Date(recentTransaction.created_at);
        const now = new Date();
        const minutesSince = Math.ceil((now.getTime() - lastCheckInTime.getTime()) / (1000 * 60));
        const remainingMinutes = 30 - minutesSince;
        setError(`Please wait ${remainingMinutes} more minute${remainingMinutes !== 1 ? 's' : ''} before adding points again.`);
        setLoading(false);
        return;
      }

      // Award loyalty point if enabled
      const newPoints = customer.current_points + 1;
      const newTotalVisits = customer.total_visits + 1;
      const canEarnPoint = shop?.loyalty_enabled !== false;

      // Update customer
      const { data: updatedCustomer } = await supabase
        .from('customers')
        .update({
          current_points: canEarnPoint ? newPoints : customer.current_points,
          lifetime_points: canEarnPoint ? (customer.lifetime_points + 1) : customer.lifetime_points,
          total_visits: newTotalVisits,
          last_visit_at: new Date().toISOString(),
        })
        .eq('id', customer.id)
        .select()
        .single();

      if (updatedCustomer) {
        setCustomer(updatedCustomer);
      }

      // Create customer visit record (track who checked them in, bill amount, commission)
      const { data: visitRecord, error: visitError } = await supabase
        .from('customer_visits')
        .insert({
          customer_id: customer.id,
          shop_id: shopId,
          staff_id: staffData.id, // Track who checked them in
          checked_in_by_employee_id: staffData.id, // Also store in new column
          visit_date: new Date().toISOString(),
          bill_amount: bill > 0 ? bill : null,
          commission_earned: commissionEarned > 0 ? commissionEarned : null,
        })
        .select()
        .single();

      if (visitError) {
        console.error('Visit error:', visitError);
        // Don't fail if visit record fails
      }

      // Record employee contribution if bill amount or commission exists
      if ((bill > 0 || commissionEarned > 0) && visitRecord) {
        await supabase
          .from('employee_contributions')
          .insert({
            shop_id: shopId,
            employee_id: staffData.id,
            customer_checkin_id: visitRecord.id,
            contribution_date: new Date().toISOString().split('T')[0],
            bill_amount: bill > 0 ? bill : 0,
            commission_earned: commissionEarned,
            total_earnings: commissionEarned, // Will add hourly wages during payroll calculation
          });
      }

      // Create loyalty transaction if point was added
      if (canEarnPoint) {
        await supabase
          .from('loyalty_transactions')
          .insert({
            shop_id: shopId,
            customer_id: customer.id,
            transaction_type: 'point_added',
            points_change: 1,
            balance_after: newPoints,
            added_by_employee_id: staffData.id, // Track who did it
          });
      }

      // Update customer state with new points
      if (updatedCustomer) {
        setCustomer(updatedCustomer);
      }

      // If new customer and no name, show name input first
      if (isNewCustomer && updatedCustomer && !updatedCustomer.name) {
        setError('');
        setStep('name');
      } else {
        // Move to success screen showing points and redeem option
        setError('');
        setStep('success');
        startAutoCloseTimer();
      }
      
      if (onSuccess) onSuccess();

    } catch (error: any) {
      console.error('Check-in error:', error);
      setError(error.message || 'Failed to check in customer');
    } finally {
      setLoading(false);
    }
  }

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!customer || !shop || customer.current_points < shop.points_needed) {
        setError('Customer does not have enough points');
        setLoading(false);
        return;
      }

      // Verify staff PIN for redemption
      const { data: staffData, error: staffError } = await supabase
        .from('employees')
        .select('*')
        .eq('shop_id', shopId)
        .eq('pin', redeemPin)
        .eq('active', true)
        .maybeSingle();

      if (staffError || !staffData) {
        setError('Invalid staff PIN');
        setRedeemPin('');
        setLoading(false);
        return;
      }

      // Redeem reward - points go back to zero
      const newPoints = 0;
      
      // Update customer points
      const { data: updatedCustomer, error: updateError } = await supabase
        .from('customers')
        .update({
          current_points: newPoints,
          rewards_redeemed: customer.rewards_redeemed + 1,
        })
        .eq('id', customer.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Create loyalty transaction for redemption
      await supabase
        .from('loyalty_transactions')
        .insert({
          shop_id: shopId,
          customer_id: customer.id,
          transaction_type: 'reward_redeemed',
          points_change: -shop.points_needed,
          balance_after: newPoints,
          added_by_employee_id: staffData.id,
        });

      // Update customer state with 0 points
      setCustomer(updatedCustomer);
      
      // Show success message
      alert(
        `🎉 Reward Redeemed!\n\n` +
        `Customer: ${updatedCustomer.name || updatedCustomer.phone}\n` +
        `Reward: ${shop.reward_description}\n` +
        `Points remaining: 0\n` +
        `Redeemed by: ${staffData.first_name}`
      );

      // Reset redeem PIN and go back to success screen to show updated points
      setRedeemPin('');
      setError('');
      setLoading(false);
      setStep('success');
      startAutoCloseTimer();

    } catch (error: any) {
      console.error('Redeem error:', error);
      setError(error.message || 'Failed to redeem reward');
      setLoading(false);
    }
  }

  function handleClose() {
    // Clear auto-close timer
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }

    // Reset all state
    setPhoneNumber('');
    setBillAmount('');
    setCustomerName('');
    setStaffPin('');
    setRedeemPin('');
    setCustomer(null);
    setEmployee(null);
    setStep('phone');
    setError('');
    setIsNewCustomer(false);
    onClose();
  }

  const pointsNeeded = shop?.points_needed || 6;
  const pointsRemaining = customer ? Math.max(0, pointsNeeded - customer.current_points) : pointsNeeded;
  const canRedeem = customer && customer.current_points >= pointsNeeded;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div 
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'success' ? '✅ Check-In Complete' : step === 'redeem' ? '🎁 Redeem Reward' : '👤 Check In Customer'}
          </h2>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {step === 'phone' ? (
            <>
              <p className="text-gray-700 mb-4 text-center">
                Enter customer's phone number
              </p>

              <form onSubmit={handlePhoneSubmit}>
                <input
                  type="tel"
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl text-center text-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                  placeholder="07123 456 789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(formatPhone(e.target.value))}
                  autoFocus
                />

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={phoneNumber.replace(/\s/g, '').length < 10 || loading}
                >
                  {loading ? 'Loading...' : 'Continue'}
                </button>
              </form>
            </>
          ) : step === 'bill' ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-blue-900 mb-1">
                  Customer: {customer?.name || customer?.phone || phoneNumber}
                </p>
                <p className="text-blue-800 text-sm">
                  Current Points: {customer?.current_points || 0}
                  {shop?.points_needed && ` / ${shop.points_needed} needed`}
                </p>
              </div>

              <p className="text-gray-700 mb-4 text-center">
                Enter bill amount (optional)
              </p>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (billAmount === '' || parseFloat(billAmount || '0') >= 0) {
                  setStep('pin');
                }
              }}>
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl font-semibold">£</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-4 border-2 border-gray-300 rounded-xl text-center text-2xl font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    autoFocus
                  />
                </div>

                <p className="text-xs text-gray-500 mb-4 text-center">
                  Bill amount helps track revenue and calculate commissions
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Staff PIN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBillAmount('');
                    setStep('pin');
                  }}
                  className="w-full py-2 mt-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                >
                  Skip (no bill amount)
                </button>
              </form>
            </>
          ) : step === 'pin' ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-blue-900 mb-1">
                  Customer: {customer?.name || customer?.phone || phoneNumber}
                </p>
                <p className="text-blue-800 text-sm">
                  Current Points: {customer?.current_points || 0}
                  {shop?.points_needed && ` / ${shop.points_needed} needed`}
                </p>
              </div>

              <p className="text-gray-700 mb-4 text-center">
                Enter YOUR staff PIN to complete check-in
              </p>

              <form onSubmit={handleStaffPinSubmit}>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  className="w-full px-4 py-6 border-2 border-gray-300 rounded-xl text-center text-4xl font-semibold tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                  placeholder="••••"
                  value={staffPin}
                  onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={staffPin.length !== 4 || loading}
                >
                  {loading ? 'Checking In...' : 'Check In Customer'}
                </button>
              </form>

              <button
                onClick={() => {
                  setStep('phone');
                  setStaffPin('');
                  setError('');
                }}
                className="w-full mt-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back
              </button>
            </>
          ) : step === 'name' ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-center">
                <p className="text-2xl mb-2">✨</p>
                <p className="font-semibold text-green-900 mb-1">New Customer Checked In!</p>
                <p className="text-green-800 text-sm">Phone: {phoneNumber}</p>
                <p className="text-green-700 font-semibold mt-2">
                  Points Awarded: {customer?.current_points || 0}
                </p>
              </div>

              <p className="text-gray-700 mb-4 text-center">
                Enter customer's name (optional)
              </p>

              <form onSubmit={handleNameSubmit}>
                <input
                  type="text"
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl text-center text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                  placeholder="Customer Name (Optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  autoFocus
                />

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Continue'}
                </button>
              </form>

              <button
                onClick={() => {
                  setStep('success');
                  startAutoCloseTimer();
                }}
                className="w-full mt-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Skip & Continue
              </button>
            </>
          ) : step === 'success' ? (
            <>
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">✓</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {customer?.name ? `Welcome, ${customer.name}!` : 'Customer Checked In!'}
                </h3>
                {customer?.name && (
                  <p className="text-lg text-gray-700 mb-2">
                    Thank you for visiting us!
                  </p>
                )}
                {!customer?.name && (
                  <p className="text-gray-600">
                    {customer?.phone}
                  </p>
                )}
              </div>

              {/* Points Display */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-4">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  <span className="text-3xl font-bold text-gray-900">
                    {customer?.current_points || 0}
                  </span>
                  <span className="text-xl text-gray-600">points</span>
                </div>
                <div className="text-center">
                  <p className="text-gray-700 font-semibold mb-1">
                    {pointsRemaining > 0 ? (
                      <span>
                        {pointsRemaining} more point{pointsRemaining !== 1 ? 's' : ''} for reward
                      </span>
                    ) : (
                      <span className="text-green-600">🎉 Ready to redeem!</span>
                    )}
                  </p>
                  {shop?.reward_description && (
                    <p className="text-sm text-gray-600 mt-2">
                      Reward: {shop.reward_description}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {pointsNeeded > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress to reward</span>
                    <span>{customer?.current_points || 0}/{pointsNeeded}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-500 flex items-center justify-center"
                      style={{
                        width: `${Math.min(100, ((customer?.current_points || 0) / pointsNeeded) * 100)}%`
                      }}
                    >
                      {(customer?.current_points || 0) >= pointsNeeded && (
                        <span className="text-white text-xs font-bold">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Redeem Button */}
              {canRedeem && shop?.reward_description && (
                <button
                  onClick={() => setStep('redeem')}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold text-lg flex items-center justify-center gap-2 shadow-lg"
                >
                  <Gift className="w-5 h-5" />
                  Redeem Reward
                </button>
              )}

              {/* Auto-close notice */}
              <div className="text-center mt-4 mb-4">
                <p className="text-xs text-gray-500">
                  This window will auto-close in 2 minutes
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleClose();
                    // Reset for next customer after a brief delay
                    setTimeout(() => {
                      setPhoneNumber('');
                      setCustomerName('');
                      setCustomer(null);
                      setEmployee(null);
                      setStep('phone');
                    }, 100);
                  }}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  Check In Another
                </button>
              </div>
            </>
          ) : step === 'redeem' ? (
            <>
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 mb-6 text-center">
                <Gift className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Redeem Reward
                </h3>
                <p className="text-gray-700 mb-1">
                  <strong>{customer?.name || customer?.phone}</strong>
                </p>
                <p className="text-lg font-semibold text-green-600 mb-2">
                  {customer?.current_points} points available
                </p>
                <p className="text-gray-600 text-sm">
                  Reward: <strong>{shop?.reward_description}</strong>
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Points will reset to 0 after redemption
                </p>
              </div>

              <p className="text-gray-700 mb-4 text-center">
                Enter YOUR staff PIN to confirm redemption
              </p>

              <form onSubmit={handleRedeem}>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  className="w-full px-4 py-6 border-2 border-gray-300 rounded-xl text-center text-4xl font-semibold tracking-widest focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-4"
                  placeholder="••••"
                  value={redeemPin}
                  onChange={(e) => setRedeemPin(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={redeemPin.length !== 4 || loading}
                >
                  {loading ? 'Redeeming...' : (
                    <>
                      <Gift className="w-5 h-5" />
                      Redeem Reward
                    </>
                  )}
                </button>
              </form>

              <button
                onClick={() => {
                  setStep('success');
                  setRedeemPin('');
                  setError('');
                }}
                className="w-full mt-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Cancel
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

