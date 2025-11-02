import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: any;
}

type Step = 'warning' | 'confirm' | 'pin';

export function DeleteAccountModal({ 
  isOpen, 
  onClose, 
  shop 
}: DeleteAccountModalProps) {
  const [step, setStep] = useState<Step>('warning');
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const confirmationText = 'DELETE MY ACCOUNT';

  async function handleDelete() {
    setLoading(true);
    setError('');

    try {
      // Verify PIN
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('owner_pin')
        .eq('id', shop.id)
        .single();

      if (shopError) throw new Error('Failed to verify PIN');

      if (shopData.owner_pin !== pin) {
        setError('Incorrect PIN. Please try again.');
        setPin('');
        setLoading(false);
        return;
      }

      // Send deletion confirmation email BEFORE deleting (optional)
      try {
        // Note: Email template should be configured in send-email edge function
        await supabase.functions.invoke('send-email', {
          body: {
            to: shop.owner_email,
            template: 'account_deleted',
            data: {
              shop_name: shop.shop_name
            }
          }
        });
      } catch (emailErr) {
        // Email sending is not critical - continue with deletion
        console.warn('Failed to send deletion email (non-critical):', emailErr);
      }

      // Delete all related data (cascade via RLS and foreign keys)
      const { error: deleteError } = await supabase
        .from('shops')
        .delete()
        .eq('id', shop.id);

      if (deleteError) throw deleteError;

      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();

      // Redirect to goodbye page
      window.location.href = '/account-deleted';

    } catch (err: any) {
      console.error('Deletion error:', err);
      setError('Failed to delete account. Please contact support at help@digiget.uk');
      setLoading(false);
    }
  }

  function handleClose() {
    setStep('warning');
    setTypedConfirmation('');
    setPin('');
    setError('');
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">🚨 Delete Account</h2>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Final Warning */}
          {step === 'warning' && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <strong className="text-red-900 block mb-2">⚠️ THIS CANNOT BE UNDONE</strong>
                <p className="mt-2 mb-0 text-red-800 text-sm">
                  You are about to PERMANENTLY DELETE your account and all data.
                </p>
              </div>

              <h3 className="mb-3 font-semibold text-gray-900">What will be deleted:</h3>
              <ul className="space-y-2 mb-4">
                <li className="text-gray-700">❌ Your shop account</li>
                <li className="text-gray-700">❌ All staff members</li>
                <li className="text-gray-700">❌ All customers</li>
                <li className="text-gray-700">❌ All clock-in/out history</li>
                <li className="text-gray-700">❌ All loyalty points</li>
                <li className="text-gray-700">❌ All payroll records</li>
                <li className="text-gray-700">❌ All settings and data</li>
              </ul>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <strong className="text-blue-900 block mb-2">💡 Looking for something else?</strong>
                <ul className="mb-0 mt-2 text-blue-800 text-sm space-y-1">
                  <li>To pause your account: Cancel subscription (keeps data)</li>
                  <li>To export your data: Go to Reports → Export All Data</li>
                  <li>Need help? Email <a href="mailto:help@digiget.uk" className="underline">help@digiget.uk</a></li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleClose} 
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel - Keep My Account
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  I Understand - Continue
                </button>
              </div>
            </>
          )}

          {/* Step 2: Type Confirmation */}
          {step === 'confirm' && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <strong className="text-red-900">FINAL CONFIRMATION REQUIRED</strong>
              </div>

              <p className="mb-3 text-gray-700">
                This will permanently delete <strong>{shop.shop_name}</strong> and all associated data.
              </p>

              <p className="mb-4 text-gray-700">
                Type <strong className="text-red-600">{confirmationText}</strong> to confirm:
              </p>

              <div className="mb-6">
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder={confirmationText}
                  value={typedConfirmation}
                  onChange={(e) => setTypedConfirmation(e.target.value.toUpperCase())}
                  autoFocus
                />
                {typedConfirmation && typedConfirmation !== confirmationText && (
                  <p className="mt-2 text-sm text-red-600">
                    Text doesn't match. Type exactly: {confirmationText}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setStep('warning')} 
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Go Back
                </button>
                <button
                  onClick={() => setStep('pin')}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={typedConfirmation !== confirmationText}
                >
                  Continue to PIN
                </button>
              </div>
            </>
          )}

          {/* Step 3: PIN Verification */}
          {step === 'pin' && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <strong className="text-red-900">LAST STEP - ENTER PIN</strong>
              </div>

              <p className="mb-4 text-gray-700">
                Enter your owner PIN to permanently delete your account.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner PIN
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  maxLength={6}
                  placeholder="Enter 6-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <strong className="text-orange-900 block mb-2">⚠️ This is your last chance to cancel.</strong>
                <p className="mb-0 mt-2 text-orange-800 text-sm">
                  Once you click "Delete Account Forever", all your data will be 
                  permanently deleted. There is no way to recover it.
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setStep('confirm')} 
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Go Back
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={pin.length !== 6 || loading}
                >
                  {loading ? 'Deleting...' : 'Delete Account Forever'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

