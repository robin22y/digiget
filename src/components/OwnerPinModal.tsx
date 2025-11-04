import { useState, useEffect, useRef } from 'react';
import { Lock, X, AlertCircle, RefreshCw } from 'lucide-react';
import { validateOwnerPIN, isWeakOwnerPIN, getWeakPINReason, isLockedOut, recordFailedAttempt, recordSuccessfulAttempt, getLockoutTimeRemaining, getRemainingAttempts } from '../utils/pinValidation';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface OwnerPinModalProps {
  shopId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function OwnerPinModal({ shopId, onSuccess, onCancel }: OwnerPinModalProps) {
  const { user, signIn } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [showResetFlow, setShowResetFlow] = useState(false);
  const [resetStep, setResetStep] = useState<'password' | 'newpin'>('password');
  const [password, setPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [shopEmail, setShopEmail] = useState('');
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const newPinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const identifier = `owner-pin-${shopId}`;

  // Load shop email on mount
  useEffect(() => {
    const loadShopEmail = async () => {
      const { data } = await supabase
        .from('shops')
        .select('owner_email')
        .eq('id', shopId)
        .single();
      
      if (data) {
        setShopEmail(data.owner_email);
      }
    };
    loadShopEmail();
  }, [shopId]);

  useEffect(() => {
    // Check if locked out
    if (isLockedOut(identifier)) {
      const remaining = getLockoutTimeRemaining(identifier);
      setError(`Too many failed attempts. Try again in ${remaining} minute${remaining !== 1 ? 's' : ''}.`);
    } else {
      setAttemptsRemaining(getRemainingAttempts(identifier));
    }

    // Focus first input on mount
    if (pinInputRefs.current[0]) {
      pinInputRefs.current[0]?.focus();
    }
  }, [identifier]);

  // Auto-submit when 6 digits entered (only when not in reset flow)
  useEffect(() => {
    if (pin.length === 6 && !showResetFlow) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, showResetFlow]);

  const handleSubmit = async () => {
    if (pin.length !== 6) {
      setError('Please enter your 6-digit PIN');
      return;
    }

    // Check if locked out
    if (isLockedOut(identifier)) {
      const remaining = getLockoutTimeRemaining(identifier);
      setError(`Too many failed attempts. Try again in ${remaining} minute${remaining !== 1 ? 's' : ''}.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Validate PIN format
      if (!validateOwnerPIN(pin)) {
        setError('PIN must be exactly 6 digits');
        setLoading(false);
        return;
      }

      // Get shop owner PIN from database
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('owner_pin')
        .eq('id', shopId)
        .single();

      if (shopError || !shopData) {
        setError('Failed to verify PIN. Please try again.');
        setLoading(false);
        return;
      }

      // Check if PIN is not set (null or default)
      if (!shopData.owner_pin || shopData.owner_pin === '000000') {
        // PIN not set - redirect to create PIN flow
        // We'll handle this by showing an error and letting the reset flow handle it
        setError('PIN not set. Please use "Reset with password" below to create your PIN.');
        setPin('');
        setLoading(false);
        return;
      }

      // Verify PIN
      if (shopData.owner_pin !== pin) {
        const remaining = recordFailedAttempt(identifier);
        setAttemptsRemaining(remaining);

        if (remaining === 0) {
          const lockoutTime = getLockoutTimeRemaining(identifier);
          setError(`Too many failed attempts. Locked out for ${lockoutTime} minute${lockoutTime !== 1 ? 's' : ''}.`);
        } else {
          setError(`Incorrect PIN. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
        }

        setPin('');
        // Focus first input
        if (pinInputRefs.current[0]) {
          pinInputRefs.current[0]?.focus();
        }
        setLoading(false);
        return;
      }

      // Success - record and unlock
      recordSuccessfulAttempt(identifier);
      sessionStorage.setItem(`owner_unlocked_${shopId}`, 'true');
      sessionStorage.setItem(`owner_unlock_time_${shopId}`, Date.now().toString());

      onSuccess();
    } catch (err: any) {
      console.error('PIN verification error:', err);
      setError('Failed to verify PIN. Please try again.');
      setPin('');
      setLoading(false);
    }
  };

  const handleNumberPad = (digit: string) => {
    if (pin.length < 6 && !loading) {
      setPin(prev => prev + digit);
      setError('');
      
      // Focus next input
      const nextIndex = pin.length;
      setTimeout(() => {
        if (pinInputRefs.current[nextIndex]) {
          pinInputRefs.current[nextIndex]?.focus();
        }
      }, 10);
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0 && !loading) {
      setPin(prev => prev.slice(0, -1));
      setError('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && pin.length === index && index > 0) {
      // Focus previous input on backspace
      if (pinInputRefs.current[index - 1]) {
        pinInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      if (pinInputRefs.current[index - 1]) {
        pinInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowRight' && index < 5) {
      if (pinInputRefs.current[index + 1]) {
        pinInputRefs.current[index + 1]?.focus();
      }
    } else if (/^\d$/.test(e.key)) {
      // Direct number input
      if (pin.length < 6) {
        setPin(prev => prev + e.key);
        setError('');
        const nextIndex = index + 1;
        setTimeout(() => {
          if (pinInputRefs.current[nextIndex]) {
            pinInputRefs.current[nextIndex]?.focus();
          }
        }, 10);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setPin(pasted);
      setError('');
      // Focus last input
      setTimeout(() => {
        if (pinInputRefs.current[5]) {
          pinInputRefs.current[5]?.focus();
        }
      }, 10);
    }
  };

  // Verify password handler
  const handleVerifyPassword = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get shop email to verify password
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('owner_email')
        .eq('id', shopId)
        .single();

      if (shopError || !shopData) {
        setError('Unable to verify password. Please try again.');
        setLoading(false);
        return;
      }

      // Verify password by attempting to sign in
      const { error: signInError } = await signIn(shopData.owner_email, password);

      if (signInError) {
        if (signInError.message?.includes('Invalid login credentials') || signInError.message?.includes('invalid_credentials')) {
          setError('Incorrect password. Please try again.');
        } else {
          setError('Failed to verify password. Please try again.');
        }
        setLoading(false);
        return;
      }

      // Password verified - move to new PIN step
      setResetStep('newpin');
      setError('');
      setPassword(''); // Clear password for security
      setLoading(false);
    } catch (err: any) {
      console.error('Password verification error:', err);
      setError('Failed to verify password. Please try again.');
      setLoading(false);
    }
  };

  // New PIN pad handler
  const handleNewPinPad = (digit: string) => {
    if (loading) return; // Don't allow input while saving
    
    if (newPin.length < 6) {
      setNewPin(prev => prev + digit);
      setError('');
    } else if (newPin.length === 6 && confirmNewPin.length < 6) {
      setConfirmNewPin(prev => prev + digit);
      setError('');
    }
  };

  // New PIN backspace handler
  const handleNewPinBackspace = () => {
    if (confirmNewPin.length > 0) {
      setConfirmNewPin(prev => prev.slice(0, -1));
    } else if (newPin.length > 0) {
      setNewPin(prev => prev.slice(0, -1));
    }
    setError('');
  };

  // Set new PIN handler
  const handleSetNewPin = async () => {
    // Validate PIN
    if (!validateOwnerPIN(newPin)) {
      setError('PIN must be exactly 6 digits');
      return;
    }

    if (newPin !== confirmNewPin) {
      setError('PINs do not match');
      return;
    }

    if (isWeakOwnerPIN(newPin)) {
      setError(getWeakPINReason(newPin) || 'Please choose a stronger PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Attempting to reset PIN for shop:', shopId);
      
      // Update PIN in database
      const { data, error: updateError } = await supabase
        .from('shops')
        .update({ owner_pin: newPin })
        .eq('id', shopId)
        .select('owner_pin')
        .single();

      if (updateError) {
        console.error('PIN reset error:', updateError);
        throw updateError;
      }

      console.log('PIN reset successfully:', data);

      // Success - clear reset flow and unlock
      recordSuccessfulAttempt(identifier);
      sessionStorage.setItem(`owner_unlocked_${shopId}`, 'true');
      sessionStorage.setItem(`owner_unlock_time_${shopId}`, Date.now().toString());

      setShowResetFlow(false);
      setResetStep('password');
      setNewPin('');
      setConfirmNewPin('');
      setPassword('');

      // Show success and unlock
      onSuccess();
    } catch (err: any) {
      console.error('Set new PIN error:', err);
      const errorMessage = err?.message || err?.error_description || 'Failed to set new PIN. Please try again.';
      setError(`Error: ${errorMessage}. ${err?.code ? `Code: ${err.code}` : ''}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 my-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Enter Owner PIN</h2>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
          Enter your 6-digit owner PIN to access shop settings
        </p>

        {/* PIN Display */}
        <div className="flex justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <input
              key={index}
              ref={(el) => (pinInputRefs.current[index] = el)}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={pin[index] || ''}
              readOnly
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              style={{
                borderColor: pin[index] ? '#3B82F6' : '#D1D5DB',
                WebkitAppearance: 'none',
              }}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-red-800">{error}</p>
              {attemptsRemaining > 0 && attemptsRemaining < 5 && (
                <p className="text-xs text-red-600 mt-1">
                  {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
                </p>
              )}
            </div>
          </div>
        )}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              onClick={() => handleNumberPad(digit.toString())}
              disabled={loading || pin.length >= 6}
              className="py-3 px-4 sm:py-4 sm:px-6 text-lg sm:text-xl font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 min-h-[44px]"
              type="button"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={() => handleNumberPad('0')}
            disabled={loading || pin.length >= 6}
            className="py-3 px-4 sm:py-4 sm:px-6 text-lg sm:text-xl font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 min-h-[44px]"
            type="button"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            disabled={loading || pin.length === 0}
            className="py-3 px-4 sm:py-4 sm:px-6 text-lg sm:text-xl font-semibold bg-gray-100 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 min-h-[44px]"
            type="button"
          >
            ⌫
          </button>
        </div>

        {loading && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600 mt-2">Verifying PIN...</p>
          </div>
        )}

        {/* Reset PIN Option */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowResetFlow(true)}
            disabled={loading}
            className="w-full text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
            type="button"
          >
            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
            Forgot PIN? Reset with password
          </button>
        </div>
      </div>

      {/* Reset PIN Flow Modal */}
      {showResetFlow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 my-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {resetStep === 'password' ? 'Verify Password' : 'Set New PIN'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowResetFlow(false);
                  setResetStep('password');
                  setPassword('');
                  setNewPin('');
                  setConfirmNewPin('');
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                disabled={loading}
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetStep === 'password' ? (
              <>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  Enter your account password to reset your PIN. This ensures only you can change your PIN.
                </p>

                <div className="mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Account Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && password) {
                        handleVerifyPassword();
                      }
                    }}
                    placeholder="Enter your login password"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm sm:text-base min-h-[44px]"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setShowResetFlow(false);
                      setResetStep('password');
                      setPassword('');
                      setError('');
                    }}
                    className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base min-h-[44px]"
                    disabled={loading}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyPassword}
                    disabled={loading || !password}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                    type="button"
                  >
                    {loading ? 'Verifying...' : 'Verify Password'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  Enter your new 6-digit PIN. Make sure it's something memorable but secure.
                </p>

                {/* New PIN Display */}
                <div className="mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    New PIN (6 digits)
                  </label>
                  <div className="flex justify-center gap-2 sm:gap-3">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        ref={(el) => (newPinInputRefs.current[index] = el)}
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={newPin[index] || ''}
                        readOnly
                        onKeyDown={(e) => {
                          if (e.key >= '0' && e.key <= '9' && newPin.length < 6) {
                            e.preventDefault();
                            handleNewPinPad(e.key);
                          } else if (e.key === 'Backspace' && newPin.length > 0) {
                            e.preventDefault();
                            handleNewPinBackspace();
                          }
                        }}
                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        style={{
                          borderColor: newPin[index] ? '#3B82F6' : '#D1D5DB',
                          WebkitAppearance: 'none',
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* PIN Validation Messages */}
                  {newPin.length > 0 && (
                    <div className="mt-3">
                      {newPin.length < 6 && (
                        <p className="text-sm text-gray-600">Enter {6 - newPin.length} more digit{6 - newPin.length !== 1 ? 's' : ''}</p>
                      )}
                      {newPin.length === 6 && !validateOwnerPIN(newPin) && (
                        <p className="text-sm text-red-600">PIN must contain only digits</p>
                      )}
                      {validateOwnerPIN(newPin) && isWeakOwnerPIN(newPin) && (
                        <p className="text-sm text-orange-600">
                          ⚠️ {getWeakPINReason(newPin)}
                        </p>
                      )}
                      {validateOwnerPIN(newPin) && !isWeakOwnerPIN(newPin) && (
                        <p className="text-sm text-green-600">✓ PIN looks good</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm PIN Display */}
                <div className="mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Confirm New PIN
                  </label>
                  <div className="flex justify-center gap-2 sm:gap-3">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={confirmNewPin[index] || ''}
                        readOnly
                        onKeyDown={(e) => {
                          if (newPin.length === 6) {
                            if (e.key >= '0' && e.key <= '9' && confirmNewPin.length < 6) {
                              e.preventDefault();
                              handleNewPinPad(e.key);
                            } else if (e.key === 'Backspace' && confirmNewPin.length > 0) {
                              e.preventDefault();
                              handleNewPinBackspace();
                            }
                          }
                        }}
                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        style={{
                          borderColor: confirmNewPin[index] 
                            ? (newPin === confirmNewPin ? '#10B981' : '#EF4444')
                            : '#D1D5DB',
                          WebkitAppearance: 'none',
                        }}
                      />
                    ))}
                  </div>
                  {confirmNewPin.length > 0 && (
                    <div className="mt-2">
                      {confirmNewPin.length < 6 && (
                        <p className="text-sm text-gray-600">Confirm PIN: {6 - confirmNewPin.length} more digit{6 - confirmNewPin.length !== 1 ? 's' : ''}</p>
                      )}
                      {confirmNewPin.length === 6 && newPin !== confirmNewPin && (
                        <p className="text-sm text-red-600">PINs don't match</p>
                      )}
                      {confirmNewPin.length === 6 && newPin === confirmNewPin && validateOwnerPIN(newPin) && !isWeakOwnerPIN(newPin) && (
                        <p className="text-sm text-green-600">✓ PINs match</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Number Pad for New PIN */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                    <button
                      key={digit}
                      onClick={() => handleNewPinPad(digit.toString())}
                      disabled={loading || (newPin.length >= 6 && confirmNewPin.length >= 6)}
                      className="py-3 px-4 sm:py-4 sm:px-6 text-lg sm:text-xl font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 min-h-[44px]"
                      type="button"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    onClick={() => handleNewPinPad('0')}
                    disabled={loading || (newPin.length >= 6 && confirmNewPin.length >= 6)}
                    className="py-3 px-4 sm:py-4 sm:px-6 text-lg sm:text-xl font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 min-h-[44px]"
                    type="button"
                  >
                    0
                  </button>
                  <button
                    onClick={handleNewPinBackspace}
                    disabled={loading || (confirmNewPin.length === 0 && newPin.length === 0)}
                    className="py-3 px-4 sm:py-4 sm:px-6 text-lg sm:text-xl font-semibold bg-gray-100 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 min-h-[44px]"
                    type="button"
                  >
                    ⌫
                  </button>
                </div>

                {error && (
                  <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setResetStep('password');
                      setNewPin('');
                      setConfirmNewPin('');
                      setError('');
                    }}
                    className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base min-h-[44px]"
                    disabled={loading}
                    type="button"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSetNewPin}
                    disabled={loading || newPin.length !== 6 || confirmNewPin.length !== 6 || !validateOwnerPIN(newPin) || newPin !== confirmNewPin || isWeakOwnerPIN(newPin)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                    title={
                      loading ? 'Saving...' :
                      newPin.length !== 6 ? 'Enter 6-digit PIN' :
                      confirmNewPin.length !== 6 ? 'Confirm your PIN' :
                      !validateOwnerPIN(newPin) ? 'PIN must be 6 digits' :
                      newPin !== confirmNewPin ? 'PINs must match' :
                      isWeakOwnerPIN(newPin) ? 'PIN is too weak' :
                      'Click to save PIN'
                    }
                    type="button"
                  >
                    {loading ? 'Saving...' : 'Set New PIN'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

