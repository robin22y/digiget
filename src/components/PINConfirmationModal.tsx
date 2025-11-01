import { useState } from 'react';
import { X, AlertTriangle, Trash2, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useShop } from '../contexts/ShopContext';

interface PINConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  warningText?: string;
  actionType?: 'delete' | 'cancel' | 'danger';
  requireTypedConfirmation?: boolean;
  confirmationText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PINConfirmationModal({
  isOpen,
  title,
  message,
  warningText = 'This action cannot be undone',
  actionType = 'danger',
  requireTypedConfirmation = false,
  confirmationText = '',
  onConfirm,
  onCancel
}: PINConfirmationModalProps) {
  const [pin, setPin] = useState('');
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentShop } = useShop();

  if (!isOpen) return null;

  async function handleConfirm() {
    if (!currentShop?.id) {
      setError('Shop not found');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Validate PIN length
      if (pin.length !== 6) {
        setError('PIN must be 6 digits');
        setLoading(false);
        return;
      }

      // Verify typed confirmation if required
      if (requireTypedConfirmation && typedConfirmation !== confirmationText) {
        setError(`Please type "${confirmationText}" to confirm`);
        setLoading(false);
        return;
      }

      // Verify PIN against database
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('owner_pin')
        .eq('id', currentShop.id)
        .single();

      if (shopError) {
        console.error('PIN verification error:', shopError);
        setError('Failed to verify PIN. Please try again.');
        setLoading(false);
        return;
      }

      if (!shop?.owner_pin || shop.owner_pin !== pin) {
        setError('Incorrect PIN. Please try again.');
        setPin('');
        setLoading(false);
        return;
      }

      // PIN verified - proceed with action
      onConfirm();
      
      // Reset and close
      setPin('');
      setTypedConfirmation('');
      setError('');
      setLoading(false);

    } catch (error: any) {
      console.error('PIN confirmation error:', error);
      setError(error.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  }

  function handleCancel() {
    setPin('');
    setTypedConfirmation('');
    setError('');
    onCancel();
  }

  const isConfirmDisabled = loading || pin.length !== 6 || (requireTypedConfirmation && typedConfirmation !== confirmationText);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleCancel}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {actionType === 'delete' ? (
              <Trash2 className="w-6 h-6 text-red-600" />
            ) : (
              <Lock className="w-6 h-6 text-orange-600" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">{message}</p>

          {/* Warning Alert */}
          <div className={`p-3 rounded-lg border ${
            actionType === 'delete' 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-orange-50 border-orange-200 text-orange-800'
          }`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-medium">Warning:</strong> {warningText}
              </div>
            </div>
          </div>

          {/* Typed Confirmation (for extra critical actions) */}
          {requireTypedConfirmation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <strong className="text-red-600">{confirmationText}</strong> to confirm:
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                placeholder={confirmationText}
                disabled={loading}
              />
            </div>
          )}

          {/* PIN Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Owner PIN to confirm:
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-mono text-center text-xl tracking-widest"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit PIN"
              autoFocus
              disabled={loading}
              inputMode="numeric"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button 
            onClick={handleCancel} 
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              actionType === 'delete'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
            disabled={isConfirmDisabled}
          >
            {loading ? 'Confirming...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

