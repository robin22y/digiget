import { useState } from 'react';
import { X, Lock, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ResetShopPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  onSuccess: (newPin: string) => void;
}

/**
 * Generate a random 6-digit PIN
 */
function generateShopPin(): string {
  // Generate random 6-digit PIN (avoid leading zeros for better readability)
  const firstDigit = Math.floor(Math.random() * 9) + 1; // 1-9
  const restDigits = Math.floor(Math.random() * 100000); // 0-99999
  return firstDigit.toString() + restDigits.toString().padStart(5, '0');
}

export default function ResetShopPinModal({ isOpen, onClose, shopId, onSuccess }: ResetShopPinModalProps) {
  const [step, setStep] = useState<'verify' | 'confirm'>('verify');
  const [ownerPin, setOwnerPin] = useState('');
  const [generatedPin, setGeneratedPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Generate PIN when moving to confirm step
  const handleVerifyOwnerPin = async () => {
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

      // Owner PIN verified - generate new shop PIN and move to confirm step
      const newPin = generateShopPin();
      setGeneratedPin(newPin);
      setStep('confirm');
      setLoading(false);
    } catch (err: any) {
      console.error('PIN verification error:', err);
      setError('Failed to verify PIN. Please try again.');
      setLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    if (!generatedPin) {
      setError('No PIN generated');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update shop PIN
      const { error: updateError } = await supabase
        .from('shops')
        .update({ shop_pin: generatedPin })
        .eq('id', shopId);

      if (updateError) throw updateError;

      // Success
      onSuccess(generatedPin);
      handleClose();
    } catch (err: any) {
      console.error('Shop PIN reset error:', err);
      setError('Failed to reset shop PIN. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('verify');
    setOwnerPin('');
    setGeneratedPin('');
    setError('');
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 'verify' ? 'Reset Shop PIN' : 'Confirm New Shop PIN'}
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
          {step === 'verify' ? (
            <>
              <p className="text-gray-700 mb-4">
                To reset the shop PIN, please verify your owner PIN. A new random shop PIN will be generated.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
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
                  onClick={handleVerifyOwnerPin}
                  disabled={ownerPin.length !== 6 || loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Verifying...' : 'Verify & Generate'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900 mb-2">
                  <strong>Owner PIN verified!</strong>
                </p>
                <p className="text-sm text-blue-800">
                  A new shop PIN has been generated. Share this PIN with your staff to access the tablet.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Shop PIN
                </label>
                <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-6 text-center">
                  <code className="text-4xl font-bold text-gray-900 tracking-widest font-mono">
                    {generatedPin}
                  </code>
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Write this down! You'll need to share it with staff.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep('verify');
                    setOwnerPin('');
                    setGeneratedPin('');
                    setError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmReset}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Saving...' : 'Confirm & Save'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

