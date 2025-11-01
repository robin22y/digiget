import { useState, useRef } from 'react';
import { Lock, X, AlertCircle, RefreshCw } from 'lucide-react';
import { validateOwnerPIN, isWeakOwnerPIN, getWeakPINReason } from '../utils/pinValidation';
import { supabase } from '../lib/supabase';

interface ChangeOwnerPinModalProps {
  shopId: string;
  currentPin: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  isFirstTime?: boolean; // If true, skip verification step
}

export default function ChangeOwnerPinModal({ shopId, currentPin, onSuccess, onCancel, isFirstTime = false }: ChangeOwnerPinModalProps) {
  // Skip verify step if first time or PIN is null/default
  const needsVerification = !isFirstTime && currentPin && currentPin !== '000000' && currentPin !== null;
  const [step, setStep] = useState<'verify' | 'newpin'>(needsVerification ? 'verify' : 'newpin');
  const [verifyPin, setVerifyPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const verifyPinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const newPinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

    if (verifyPin !== currentPin) {
      setError('Incorrect PIN. Please try again.');
      setVerifyPin('');
      return;
    }

    // PIN verified - move to new PIN step
    setStep('newpin');
    setError('');
    setVerifyPin('');
  };

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
      console.log('Attempting to update PIN for shop:', shopId);
      
      // Update PIN in database
      const { data, error: updateError } = await supabase
        .from('shops')
        .update({ owner_pin: newPin })
        .eq('id', shopId)
        .select('owner_pin')
        .single();

      if (updateError) {
        console.error('PIN update error:', updateError);
        throw updateError;
      }

      console.log('PIN updated successfully:', data);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {isFirstTime ? 'Create Your PIN' : step === 'verify' ? 'Verify Current PIN' : 'Set New PIN'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'verify' && !isFirstTime ? (
          <>
            <p className="text-sm text-gray-600 mb-6">
              Enter your current 6-digit owner PIN to continue
            </p>

            {/* Verify PIN Display */}
            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  ref={(el) => (verifyPinInputRefs.current[index] = el)}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={verifyPin[index] || ''}
                  readOnly
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  style={{
                    borderColor: verifyPin[index] ? '#3B82F6' : '#D1D5DB',
                  }}
                />
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleVerifyPinPad(digit.toString())}
                  disabled={loading || verifyPin.length >= 6}
                  className="py-4 px-6 text-xl font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={() => handleVerifyPinPad('0')}
                disabled={loading || verifyPin.length >= 6}
                className="py-4 px-6 text-xl font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                0
              </button>
              <button
                onClick={handleVerifyBackspace}
                disabled={loading || verifyPin.length === 0}
                className="py-4 px-6 text-xl font-semibold bg-gray-100 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                ⌫
              </button>
            </div>

            {/* Auto-submit when 6 digits entered */}
            {verifyPin.length === 6 && !loading && (
              <button
                onClick={handleVerifyPin}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Verify PIN
              </button>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">
              {isFirstTime 
                ? 'Create a 6-digit PIN to protect your shop settings. Make sure it\'s something memorable but secure.'
                : 'Enter your new 6-digit PIN. Make sure it\'s something memorable but secure.'}
            </p>

            {/* New PIN Display */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New PIN (6 digits)
              </label>
              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    ref={(el) => (newPinInputRefs.current[index] = el)}
                    type="password"
                    inputMode="numeric"
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
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    style={{
                      borderColor: newPin[index] ? '#3B82F6' : '#D1D5DB',
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
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New PIN
              </label>
              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    type="password"
                    inputMode="numeric"
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
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    style={{
                      borderColor: confirmNewPin[index] 
                        ? (newPin === confirmNewPin ? '#10B981' : '#EF4444')
                        : '#D1D5DB',
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
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleNewPinPad(digit.toString())}
                  disabled={loading || (newPin.length >= 6 && confirmNewPin.length >= 6)}
                  className="py-4 px-6 text-xl font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  type="button"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={() => handleNewPinPad('0')}
                disabled={loading || (newPin.length >= 6 && confirmNewPin.length >= 6)}
                className="py-4 px-6 text-xl font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                type="button"
              >
                0
              </button>
              <button
                onClick={handleNewPinBackspace}
                disabled={loading || (confirmNewPin.length === 0 && newPin.length === 0)}
                className="py-4 px-6 text-xl font-semibold bg-gray-100 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
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

            <div className="flex gap-3">
              {!isFirstTime && step !== 'verify' && (
                <button
                  onClick={() => {
                    setStep('verify');
                    setNewPin('');
                    setConfirmNewPin('');
                    setError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Back
                </button>
              )}
              <button
                onClick={handleSetNewPin}
                disabled={loading || newPin.length !== 6 || confirmNewPin.length !== 6 || !validateOwnerPIN(newPin) || newPin !== confirmNewPin || isWeakOwnerPIN(newPin)}
                className={`${!isFirstTime && step !== 'verify' ? 'flex-1' : 'w-full'} px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                title={
                  loading ? 'Saving...' :
                  newPin.length !== 6 ? 'Enter 6-digit PIN' :
                  confirmNewPin.length !== 6 ? 'Confirm your PIN' :
                  !validateOwnerPIN(newPin) ? 'PIN must be 6 digits' :
                  newPin !== confirmNewPin ? 'PINs must match' :
                  isWeakOwnerPIN(newPin) ? 'PIN is too weak' :
                  'Click to save PIN'
                }
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

