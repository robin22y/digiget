import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { handleStaffClock } from '../lib/clockService';

interface ShopClockInOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  onSuccess?: () => void;
}

export function ShopClockInOutModal({ 
  isOpen, 
  onClose, 
  shopId,
  onSuccess 
}: ShopClockInOutModalProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [employee, setEmployee] = useState<any>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult('');

    try {
      // Find staff by their personal PIN
      const { data: staffData, error: staffError } = await supabase
        .from('employees')
        .select('*')
        .eq('shop_id', shopId)
        .eq('pin', pin)
        .eq('active', true)
        .maybeSingle();

      if (staffError || !staffData) {
        setResult('❌ Invalid staff PIN');
        setPin('');
        setLoading(false);
        return;
      }

      setEmployee(staffData);

      // Check if currently clocked in
      const { data: activeShift } = await supabase
        .from('clock_entries')
        .select('*')
        .eq('employee_id', staffData.id)
        .eq('shop_id', shopId)
        .is('clock_out_time', null)
        .maybeSingle();

      // Get shop data for GPS verification (if needed)
      const { data: shopData } = await supabase
        .from('shops')
        .select('latitude, longitude')
        .eq('id', shopId)
        .single();

      if (activeShift) {
        // Clock out
        const result = await handleStaffClock(
          staffData.id,
          shopId,
          'shop_tablet',
          {
            shopLocation: shopData?.latitude && shopData?.longitude ? {
              latitude: shopData.latitude,
              longitude: shopData.longitude,
              radius: 10000 // Allow remote for GPS method
            } : undefined
          }
        );

        if (result.success) {
          setResult(`✓ ${staffData.first_name} clocked out!`);
          setTimeout(() => {
            onClose();
            setPin('');
            setResult('');
            setEmployee(null);
            if (onSuccess) onSuccess();
          }, 2000);
        } else {
          setResult(`❌ ${result.error || 'Failed to clock out'}`);
        }
      } else {
        // Clock in
        const result = await handleStaffClock(
          staffData.id,
          shopId,
          'shop_tablet',
          {
            shopLocation: shopData?.latitude && shopData?.longitude ? {
              latitude: shopData.latitude,
              longitude: shopData.longitude,
              radius: 50 // Strict radius for shop tablet
            } : undefined
          }
        );

        if (result.success) {
          setResult(`✓ ${staffData.first_name} clocked in!`);
          setTimeout(() => {
            onClose();
            setPin('');
            setResult('');
            setEmployee(null);
            if (onSuccess) onSuccess();
          }, 2000);
        } else {
          setResult(`❌ ${result.error || 'Failed to clock in'}`);
        }
      }

    } catch (error: any) {
      console.error('Clock error:', error);
      setResult('❌ Failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-xl max-w-md w-full" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">⏰ Clock In/Out</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!result ? (
            <>
              <p className="text-gray-700 mb-4 text-center">
                Enter YOUR 4-digit staff PIN
              </p>

              <form onSubmit={handleSubmit}>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  className="w-full px-4 py-6 border-2 border-gray-300 rounded-xl text-center text-4xl font-semibold tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />

                <button
                  type="submit"
                  className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={pin.length !== 4 || loading}
                >
                  {loading ? 'Processing...' : 'Submit'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${result.startsWith('✓') ? 'bg-green-100' : 'bg-red-100'}`}>
                <span className="text-4xl">{result.startsWith('✓') ? '✓' : '❌'}</span>
              </div>
              <p className={`text-lg font-semibold ${result.startsWith('✓') ? 'text-green-800' : 'text-red-800'}`}>
                {result}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

