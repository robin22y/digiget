import { useState } from 'react';
import { X, Lock, AlertTriangle, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ToggleTrustedDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  currentValue: boolean;
  onSuccess: () => void;
}

export default function ToggleTrustedDevicesModal({ 
  isOpen, 
  onClose, 
  shopId, 
  currentValue,
  onSuccess 
}: ToggleTrustedDevicesModalProps) {
  const { signIn } = useAuth();
  const [step, setStep] = useState<'pin' | 'password'>('pin');
  const [ownerPin, setOwnerPin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleVerifyPin = async () => {
    if (ownerPin.length !== 6) {
      setError('Please enter your 6-digit owner PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify owner PIN
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

      if (shopData.owner_pin !== ownerPin) {
        setError('Incorrect owner PIN');
        setOwnerPin('');
        setLoading(false);
        return;
      }

      // PIN verified - move to password step
      setStep('password');
      setError('');
      setLoading(false);
    } catch (err: any) {
      console.error('PIN verification error:', err);
      setError('Failed to verify PIN. Please try again.');
      setLoading(false);
    }
  };

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
        setPassword('');
        setLoading(false);
        return;
      }

      // Both PIN and password verified - toggle the setting
      const { error: updateError } = await supabase
        .from('shops')
        .update({ trusted_devices_enabled: !currentValue })
        .eq('id', shopId);

      if (updateError) {
        throw updateError;
      }

      // Success
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Toggle trusted devices error:', err);
      setError('Failed to update setting. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('pin');
    setOwnerPin('');
    setPassword('');
    setError('');
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 'pin' ? 'Verify Owner PIN' : 'Verify Password'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Critical Security Warning */}
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 mb-1">
                  ⚠️ Critical Security Setting
                </p>
                <p className="text-sm text-red-800">
                  {currentValue 
                    ? 'Disabling trusted devices will require GPS verification for ALL clock-ins, even from shop tablets.'
                    : 'Enabling trusted devices allows authorized devices to bypass GPS verification. Only authorize devices physically at your shop.'}
                </p>
              </div>
            </div>
          </div>

          {step === 'pin' ? (
            <>
              <p className="text-gray-700 mb-4">
                This is a critical security setting. Please verify your <strong>Owner PIN</strong> to continue.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  Owner PIN (6 digits)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-center text-2xl font-semibold tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••"
                  value={ownerPin}
                  onChange={(e) => setOwnerPin(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && ownerPin.length === 6) {
                      handleVerifyPin();
                    }
                  }}
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyPin}
                  disabled={ownerPin.length !== 6 || loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Verifying...' : 'Verify PIN'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-900">
                  <strong>✓ Owner PIN verified</strong>
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  Now verify your password to complete the change.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Account Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your login password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && password) {
                      handleVerifyPassword();
                    }
                  }}
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep('pin');
                    setPassword('');
                    setError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyPassword}
                  disabled={!password || loading}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Updating...' : `${currentValue ? 'Disable' : 'Enable'} Trusted Devices`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

