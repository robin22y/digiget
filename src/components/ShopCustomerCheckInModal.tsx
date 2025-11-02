import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
  const [step, setStep] = useState<'phone' | 'pin'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [staffPin, setStaffPin] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employee, setEmployee] = useState<any>(null);

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
      } else {
        // Create new customer
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
            shop_id: shopId,
            phone: cleanPhone,
            current_points: 0,
            lifetime_points: 0,
            total_visits: 0,
          })
          .select()
          .single();

        if (createError) throw createError;
        setCustomer(newCustomer);
      }

      // Move to PIN entry
      setStep('pin');

    } catch (error: any) {
      console.error('Customer error:', error);
      setError('Failed to find customer');
    } finally {
      setLoading(false);
    }
  }

  async function handleStaffPinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Verify staff PIN
      const { data: staffData, error: staffError } = await supabase
        .from('employees')
        .select('*')
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

      // Create customer visit record (track who checked them in)
      const { error: visitError } = await supabase
        .from('customer_visits')
        .insert({
          customer_id: customer.id,
          shop_id: shopId,
          staff_id: staffData.id, // Track who checked them in
          visit_date: new Date().toISOString(),
        });

      if (visitError) {
        console.error('Visit error:', visitError);
        // Don't fail if visit record fails
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

      // Show success
      const pointsText = canEarnPoint 
        ? `Points: ${newPoints}/${shop?.points_needed || 6}`
        : 'Loyalty program disabled';
      
      setError(''); // Clear any errors
      alert(
        `✓ ${customer.phone || phoneNumber} checked in!\n\n` +
        `${pointsText}\n` +
        `Checked in by: ${staffData.first_name}`
      );

      // Reset and close
      setTimeout(() => {
        onClose();
        setPhoneNumber('');
        setStaffPin('');
        setCustomer(null);
        setEmployee(null);
        setStep('phone');
        setError('');
        if (onSuccess) onSuccess();
      }, 1000);

    } catch (error: any) {
      console.error('Check-in error:', error);
      setError(error.message || 'Failed to check in customer');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">👤 Check In Customer</h2>
          <button 
            onClick={onClose} 
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
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-blue-900 mb-1">Customer: {customer?.phone || phoneNumber}</p>
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
          )}
        </div>
      </div>
    </div>
  );
}

