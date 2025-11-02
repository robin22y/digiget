import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PINModalProps {
  isOpen: boolean;
  menuName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PINModal({ isOpen, menuName, onSuccess, onCancel }: PINModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit() {
    if (pin.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      if (!user?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // Get shop data for current user
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id, owner_pin')
        .eq('user_id', user.id)
        .maybeSingle();

      if (shopError || !shopData) {
        setError('Shop not found');
        setLoading(false);
        return;
      }

      // Verify owner PIN
      if (!shopData.owner_pin || shopData.owner_pin !== pin) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setError(t('security.wrong_pin'));
        setPin('');
        
        if (newAttempts >= 3) {
          // Lock out after 3 attempts
          setError(t('security.locked_out'));
          setTimeout(() => {
            setAttempts(0);
            setError('');
          }, 60000); // 1 minute lockout
        }
        
        setLoading(false);
        return;
      }

      // PIN correct
      onSuccess();
    } catch (err) {
      console.error('PIN verification error:', err);
      setError('Failed to verify PIN');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(num: number) {
    if (pin.length < 6 && attempts < 3) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 6) {
        // Auto-submit when 6 digits entered
        setTimeout(() => handleSubmit(), 100);
      }
    }
  }

  function handleBackspace() {
    setPin(pin.slice(0, -1));
    setError('');
  }

  function handleClear() {
    setPin('');
    setError('');
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold">🔒 {t('security.enter_pin')}</h2>
          <button 
            onClick={onCancel} 
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-3">
            {t('security.accessing')} <strong>{menuName}</strong>
          </p>

          <p className="text-gray-600 mb-6">
            {t('security.enter_6_digit')}
          </p>

          {/* PIN Display */}
          <div className="flex justify-center gap-3 mb-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  pin[i] 
                    ? 'border-blue-600 bg-blue-600 text-white' 
                    : 'border-gray-300'
                }`}
              >
                {pin[i] && '•'}
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
              {error}
              {attempts > 0 && attempts < 3 && (
                <p className="mt-1 text-sm">
                  {t('security.attempts_remaining')}: {3 - attempts}
                </p>
              )}
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                className="aspect-square min-h-[60px] text-2xl font-semibold border-2 border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={loading || attempts >= 3}
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleBackspace}
              className="aspect-square min-h-[60px] text-xl font-semibold border-2 border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={loading || pin.length === 0}
            >
              ←
            </button>
            <button
              onClick={() => handleKeyPress(0)}
              className="aspect-square min-h-[60px] text-2xl font-semibold border-2 border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={loading || attempts >= 3}
            >
              0
            </button>
            <button
              onClick={handleClear}
              className="aspect-square min-h-[60px] text-lg font-semibold border-2 border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={loading || pin.length === 0}
            >
              C
            </button>
          </div>

          <button
            onClick={onCancel}
            className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

