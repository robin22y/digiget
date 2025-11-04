import { useState, useRef, useEffect } from 'react';
import { Lock, X, AlertCircle } from 'lucide-react';
import { validateOwnerPIN, isWeakOwnerPIN, getWeakPINReason } from '../utils/pinValidation';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ChangeOwnerPinModalProps {
  shopId: string;
  currentPin: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  isFirstTime?: boolean; // If true, skip verification step
}

export default function ChangeOwnerPinModal({ shopId, currentPin, onSuccess, onCancel, isFirstTime = false }: ChangeOwnerPinModalProps) {
  const { signIn } = useAuth();
  
  // SECURITY: Always require current PIN verification before allowing new PIN entry
  // Only skip verification if it's truly the first time (no PIN exists) or PIN is explicitly null/empty
  const hasCurrentPin = currentPin && currentPin !== null && currentPin.trim() !== '' && currentPin !== '000000';
  const needsVerification = !isFirstTime && hasCurrentPin;
  
  // SECURITY: Minimal debug logging - no sensitive data
  if (process.env.NODE_ENV === 'development') {
    console.log('ChangeOwnerPinModal Debug (sanitized):', {
      hasCurrentPin,
      isFirstTime,
      needsVerification
      // All sensitive data hidden for security
    });
  }
  
  const [step, setStep] = useState<'verify' | 'password' | 'newpin'>(() => {
    // SECURITY: Password is mandatory for PIN changes - always start with password verification
    if (needsVerification) {
      return 'password'; // Require password instead of PIN
    }
    return 'newpin';
  });
  const [verifyPin, setVerifyPin] = useState('');
  const [password, setPassword] = useState('');
  const [shopEmail, setShopEmail] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const verifyPinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const newPinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Load shop email on mount for password verification
  useEffect(() => {
    if (needsVerification && !shopEmail) {
      supabase
        .from('shops')
        .select('owner_email')
        .eq('id', shopId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setShopEmail(data.owner_email);
          }
        });
    }
  }, [shopId, needsVerification, shopEmail]);

  // CRITICAL: Always enforce verification step when needed - this runs on mount and when props change
  useEffect(() => {
    const shouldVerify = !isFirstTime && hasCurrentPin;
    // SECURITY: Minimal debug logging - no sensitive data
    if (process.env.NODE_ENV === 'development') {
      console.log('ChangeOwnerPinModal useEffect (sanitized):', {
        shouldVerify,
        isFirstTime,
        hasCurrentPin,
        currentStep: step
        // All sensitive data hidden for security
      });
    }
    
    if (shouldVerify) {
      // SECURITY: Password is mandatory for PIN changes - always require password verification
      if (step !== 'password' && step !== 'newpin') {
        // SECURITY: Minimal logging
        if (process.env.NODE_ENV === 'development') {
          console.log('FORCING password verification step');
        }
        setStep('password'); // Always use password verification
        setVerifyPin('');
        setPassword('');
        setNewPin('');
        setConfirmNewPin('');
        setError('');
      }
    } else if (!shouldVerify) {
      // Only allow new PIN step if verification not needed
      // SECURITY: Minimal logging
      if (process.env.NODE_ENV === 'development') {
        console.log('Allowing new PIN step - no verification needed');
      }
      setStep('newpin');
      setVerifyPin('');
      setPassword('');
      setNewPin('');
      setConfirmNewPin('');
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirstTime, hasCurrentPin, currentPin]);

  const handleVerifyPinPad = (digit: string) => {
    if (verifyPin.length < 6 && !loading) {
      setVerifyPin(prev => prev + digit);
      setError('');
      
      const nextIndex = verifyPin.length;
      setTimeout(() => {
        if (verifyPinInputRefs.current[nextIndex]) {
          verifyPinInputRefs.current[nextIndex]?.focus();
        }
      }, 10);
    }
  };

  const handleVerifyBackspace = () => {
    if (verifyPin.length > 0 && !loading) {
      setVerifyPin(prev => prev.slice(0, -1));
      setError('');
    }
  };

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

  const handleNewPinBackspace = () => {
    if (confirmNewPin.length > 0) {
      setConfirmNewPin(prev => prev.slice(0, -1));
    } else if (newPin.length > 0) {
      setNewPin(prev => prev.slice(0, -1));
    }
    setError('');
  };

  const handleVerifyPin = async () => {
    if (verifyPin.length !== 6) {
      setError('Please enter your current 6-digit PIN');
      return;
    }

    // SECURITY: Always verify current PIN matches before allowing PIN change
    if (!currentPin) {
      setError('No current PIN found. Please use password verification instead.');
      return;
    }

    if (verifyPin !== currentPin) {
      setError('Incorrect PIN. Please try again or use password verification.');
      setVerifyPin('');
      // Clear all input refs
      verifyPinInputRefs.current.forEach(ref => {
        if (ref) ref.value = '';
      });
      return;
    }

    // PIN verified - move to new PIN step
    setStep('newpin');
    setError('');
    setVerifyPin('');
    // Clear verify PIN input refs
    verifyPinInputRefs.current.forEach(ref => {
      if (ref) ref.value = '';
    });
  };

  const handleVerifyPassword = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (!shopEmail) {
      setError('Unable to verify password. Please try PIN verification instead.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify password by attempting to sign in
      const { error: signInError } = await signIn(shopEmail, password);

      if (signInError) {
        if (signInError.message?.includes('Invalid login credentials') || signInError.message?.includes('invalid_credentials')) {
          setError('Incorrect password. Please try again.');
        } else {
          setError('Failed to verify password. Please try again.');
        }
        setPassword('');
        setLoading(false);
        return;
      }

      // Password verified - move to new PIN step
      setStep('newpin');
      setError('');
      setPassword(''); // Clear password for security
      setLoading(false);
    } catch (err: any) {
      console.error('Password verification error:', err);
      setError('Failed to verify password. Please try again.');
      setPassword('');
      setLoading(false);
    }
  };

  const handleSetNewPin = async () => {
    // SECURITY: Password verification is mandatory for PIN changes
    if (!isFirstTime && hasCurrentPin && step !== 'newpin') {
      console.error('SECURITY: Attempted to set new PIN without password verification!');
      setError('Password verification is required. Please verify your password first.');
      setStep('password'); // Always require password
      return;
    }
    
    // Double-check: if we need verification but step is wrong, enforce password verification
    if (!isFirstTime && hasCurrentPin && step === 'password') {
      setError('Please complete password verification first');
      return;
    }

    // Validate PIN
    if (!validateOwnerPIN(newPin)) {
      setError('PIN must be exactly 6 digits');
      return;
    }

    if (newPin !== confirmNewPin) {
      setError('PINs do not match');
      return;
    }

    // Only check if not first time setup
    if (!isFirstTime && currentPin && newPin === currentPin) {
      setError('New PIN must be different from current PIN');
      return;
    }

    if (isWeakOwnerPIN(newPin)) {
      setError(getWeakPINReason(newPin) || 'Please choose a stronger PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // SECURITY: Minimal logging - no sensitive data
      if (process.env.NODE_ENV === 'development') {
        console.log('Attempting to update PIN (shop ID hidden)');
      }
      
      // Update PIN in database
      const { error: updateError } = await supabase
        .from('shops')
        .update({ owner_pin: newPin })
        .eq('id', shopId)
        .select('owner_pin')
        .single();

      if (updateError) {
        console.error('PIN update error:', updateError);
        throw updateError;
      }

      // SECURITY: Success confirmation only - no data logged
      if (process.env.NODE_ENV === 'development') {
        console.log('PIN updated successfully (all data hidden for security)');
      }

      // Success
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
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {isFirstTime 
                ? 'Create Your PIN' 
                : step === 'password'
                  ? 'Verify Password (Required)'
                  : 'Set New PIN'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECURITY: Password is mandatory for PIN changes - always require password verification */}
        {(!isFirstTime && hasCurrentPin && step === 'password') ? (
          <>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
              <strong className="text-red-600">Password is required</strong> to change your PIN. Please enter your account password to verify your identity.
            </p>

            {/* Password Input */}
            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && password) {
                    handleVerifyPassword();
                  }
                }}
                placeholder="Enter your login password"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm sm:text-base min-h-[44px]"
                autoFocus
                disabled={loading}
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
                onClick={handleVerifyPassword}
                disabled={loading || !password}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                type="button"
              >
                {loading ? 'Verifying...' : 'Verify Password & Continue'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Only show new PIN screen if verification is not needed OR verification has been completed */}
            {(!isFirstTime && hasCurrentPin && step === 'newpin') ? (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs sm:text-sm text-red-800 font-semibold">
                  ⚠️ SECURITY ERROR: You must verify your current PIN first!
                </p>
                <button
                  onClick={() => setStep('verify')}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  Go to Verification
                </button>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                {isFirstTime 
                  ? 'Create a 6-digit PIN to protect your shop settings. Make sure it\'s something memorable but secure.'
                  : 'Enter your new 6-digit PIN. Make sure it\'s something memorable but secure.'}
              </p>
            )}

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
                    type="password"
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
                      letterSpacing: '0.1em',
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
                    type="password"
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
                      letterSpacing: '0.1em',
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
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-2 sm:gap-3">
              {/* Only show back button if verification was completed and we're on new PIN step */}
              {(!isFirstTime && hasCurrentPin && step === 'newpin') && (
                <button
                  onClick={() => {
                    setStep('verify');
                    setNewPin('');
                    setConfirmNewPin('');
                    setError('');
                  }}
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base min-h-[44px]"
                  disabled={loading}
                  type="button"
                >
                  Back to Verify
                </button>
              )}
              <button
                onClick={handleSetNewPin}
                disabled={loading || newPin.length !== 6 || confirmNewPin.length !== 6 || !validateOwnerPIN(newPin) || newPin !== confirmNewPin || isWeakOwnerPIN(newPin)}
                className={`${needsVerification && step === 'newpin' ? 'flex-1' : 'w-full'} px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]`}
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
                {loading ? 'Saving...' : isFirstTime ? 'Create PIN' : 'Change PIN'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

