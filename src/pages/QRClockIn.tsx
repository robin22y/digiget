import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { handleStaffClock } from '../lib/clockService';
import { Clock, CheckCircle, X, AlertCircle } from 'lucide-react';

interface Shop {
  id: string;
  shop_name: string;
  qr_code_enabled: boolean;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string | null;
  pin: string;
  shop_id: string;
}

interface ClockEntry {
  id: string;
  employee_id: string;
  shop_id: string;
  clock_in_time: string;
  clock_out_time: string | null;
  clock_in_method: string | null;
}

export default function QRClockIn() {
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get('shop');
  
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [staff, setStaff] = useState<Employee | null>(null);
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (shopId) {
      verifyShopAndLoad();
    } else {
      setError('Invalid QR code - no shop ID provided');
      setLoading(false);
    }
  }, [shopId]);

  async function verifyShopAndLoad() {
    if (!shopId) return;

    try {
      // Verify shop exists and QR code is enabled
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id, shop_name, qr_code_enabled')
        .eq('id', shopId)
        .maybeSingle();

      if (shopError) {
        console.error('Error verifying shop:', shopError);
        setError('Failed to verify shop. Please try again.');
        setLoading(false);
        return;
      }

      if (!shopData) {
        setError('Invalid shop. Please contact your shop owner.');
        setLoading(false);
        return;
      }

      if (!shopData.qr_code_enabled) {
        setError('QR code clock-in is disabled for this shop. Please use another method.');
        setLoading(false);
        return;
      }

      setShop(shopData as Shop);
      setLoading(false);
    } catch (err: any) {
      console.error('Shop verification error:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  async function handlePinSubmit() {
    if (!shop || pin.length !== 4) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      // Find staff by PIN
      const { data: staffData, error: staffError } = await supabase
        .from('employees')
        .select('*')
        .eq('shop_id', shop.id)
        .eq('pin', pin.trim())
        .eq('active', true)
        .maybeSingle();

      if (staffError || !staffData) {
        setError('Invalid PIN. Please try again.');
        setPin('');
        setIsSubmitting(false);
        return;
      }

      setStaff(staffData);

      // Use unified clock service (automatically handles in/out)
      const result = await handleStaffClock(
        staffData.id,
        shop.id,
        'qr_code'
      );

      if (result.success) {
        setMessage(result.message || 'Success');
        setPin('');
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          if (window.opener) {
            window.close();
          } else {
            setMessage('✓ Operation successful! You can close this window.');
          }
        }, 3000);
      } else {
        setError(result.error || 'Failed to process clock operation');
        setPin('');
      }

      setIsSubmitting(false);

    } catch (err: any) {
      console.error('Clock in/out error:', err);
      setError('Something went wrong. Please try again.');
      setPin('');
      setIsSubmitting(false);
    }
  }

  function handleNumberPad(digit: string | 'backspace' | 'submit') {
    if (digit === 'backspace') {
      setPin(prev => prev.slice(0, -1));
    } else if (digit === 'submit') {
      if (pin.length === 4) {
        handlePinSubmit();
      }
    } else if (pin.length < 4) {
      setPin(prev => prev + digit);
      
      // Auto-submit when 4 digits entered
      if (pin.length === 3) {
        setTimeout(() => {
          handlePinSubmit();
        }, 100);
      }
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Verifying shop...</p>
        </div>
      </div>
    );
  }

  if (error && !shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid QR Code</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-600">
            Contact your shop owner if this QR code should work.
          </p>
        </div>
      </div>
    );
  }

  if (!shop) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        {message ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{message}</h2>
            <p className="text-sm text-gray-600">This window will close automatically</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span className="font-semibold text-sm">QR Code Clock-In</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{shop.shop_name}</h1>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                Enter Your 4-Digit PIN:
              </label>
              <div className="flex justify-center gap-4 mb-6">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="w-16 h-16 bg-gray-100 border-2 border-gray-300 rounded-xl flex items-center justify-center text-2xl font-bold"
                  >
                    {pin[index] ? '•' : ''}
                  </div>
                ))}
              </div>

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberPad(num.toString())}
                    disabled={isSubmitting}
                    className="h-20 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl text-2xl font-bold text-gray-900 transition-colors shadow-md disabled:opacity-50"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => handleNumberPad('backspace')}
                  disabled={isSubmitting}
                  className="h-20 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded-xl flex items-center justify-center transition-colors shadow-md disabled:opacity-50"
                >
                  <X className="w-6 h-6 text-gray-700" />
                </button>
                <button
                  onClick={() => handleNumberPad('0')}
                  disabled={isSubmitting}
                  className="h-20 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl text-2xl font-bold text-gray-900 transition-colors shadow-md disabled:opacity-50"
                >
                  0
                </button>
                <button
                  onClick={() => handleNumberPad('submit')}
                  disabled={pin.length !== 4 || isSubmitting}
                  className="h-20 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors shadow-md"
                >
                  <CheckCircle className="w-8 h-8 text-white" />
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div className="text-center mt-6">
              <p className="text-xs text-gray-500">
                📸 Scan the QR code when you arrive and leave
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

