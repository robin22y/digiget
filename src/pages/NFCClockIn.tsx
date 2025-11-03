import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { handleStaffClock } from '../lib/clockService';
import { Clock, CheckCircle, X, AlertCircle } from 'lucide-react';

interface Shop {
  id: string;
  shop_name: string;
  nfc_tag_id: string;
  nfc_tag_active: boolean;
  require_nfc: boolean;
  allow_gps_fallback: boolean;
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

export default function NFCClockIn() {
  const [searchParams] = useSearchParams();
  const nfcTagId = searchParams.get('tag');
  
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [staff, setStaff] = useState<Employee | null>(null);
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const verifyingRef = useRef(false);

  useEffect(() => {
    // Prevent multiple verification calls
    if (verifyingRef.current || shop) return;
    
    if (!nfcTagId) {
      setError('Invalid NFC tag - no tag ID provided');
      setLoading(false);
      return;
    }

    // Mark as verifying to prevent duplicate calls
    verifyingRef.current = true;
    setLoading(true);
    setError('');

    async function verifyNFCTag() {
      try {
        // Verify NFC tag exists and is active
        const { data: shopData, error: shopError } = await supabase
          .from('shops')
          .select('*')
          .eq('nfc_tag_id', nfcTagId)
          .eq('nfc_tag_active', true)
          .maybeSingle();

        if (shopError) {
          console.error('Error verifying NFC tag:', shopError);
          setError(`Failed to verify NFC tag: ${shopError.message || 'Please try again.'}`);
          setLoading(false);
          verifyingRef.current = false;
          return;
        }

        if (!shopData) {
          setError('Invalid or inactive NFC tag. Please contact your shop owner.');
          setLoading(false);
          verifyingRef.current = false;
          return;
        }

        setShop(shopData as Shop);
        setLoading(false);
        // Don't reset verifyingRef - we've successfully verified
      } catch (err: any) {
        console.error('NFC tag verification error:', err);
        setError(`Something went wrong: ${err.message || 'Please try again.'}`);
        setLoading(false);
        verifyingRef.current = false;
      }
    }

    verifyNFCTag();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nfcTagId]); // Only depend on nfcTagId - shop check is handled in the effect

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
        'nfc',
        {
          nfcTagId: nfcTagId || undefined
        }
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
        // Show detailed error message to help debug
        const errorMsg = result.error || 'Failed to process clock operation';
        console.error('NFC Clock-in failed:', {
          error: errorMsg,
          employeeId: staffData.id,
          shopId: shop.id,
          method: 'nfc',
          nfcTagId
        });
        setError(errorMsg);
        setPin('');
      }

      setIsSubmitting(false);

    } catch (err: any) {
      console.error('Clock in/out error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        employeeId: staff?.id,
        shopId: shop?.id
      });
      
      // Show more specific error messages
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.error?.message) {
        errorMessage = err.error.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
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
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Verifying NFC tag...</p>
        </div>
      </div>
    );
  }

  if (error && !shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid NFC Tag</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-600">
            Contact your shop owner if this tag should work.
          </p>
        </div>
      </div>
    );
  }

  if (!shop) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
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
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full mb-4">
                <Clock className="w-5 h-5" />
                <span className="font-semibold text-sm">NFC Clock-In</span>
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
                💡 Tap the NFC tag when you arrive and leave
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

