import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: any;
}

type Step = 'reason' | 'confirm' | 'pin';

export function CancelSubscriptionModal({ 
  isOpen, 
  onClose, 
  shop 
}: CancelSubscriptionModalProps) {
  const [step, setStep] = useState<Step>('reason');
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  function getEndDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  async function handleCancel() {
    setLoading(true);
    setError('');

    try {
      // Verify PIN
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('owner_pin, subscription_status')
        .eq('id', shop.id)
        .single();

      if (shopError) throw new Error('Failed to verify PIN');

      if (shopData.owner_pin !== pin) {
        setError('Incorrect PIN. Please try again.');
        setPin('');
        setLoading(false);
        return;
      }

      // Cancel subscription
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // Current billing period end

      const { error: updateError } = await supabase
        .from('shops')
        .update({
          subscription_status: 'cancelled',
          subscription_end_date: endDate.toISOString(),
          cancellation_reason: reason,
          cancellation_feedback: feedback || null,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', shop.id);

      if (updateError) throw updateError;

      // Send cancellation email (optional - don't block if it fails)
      try {
        // Note: Email template should be configured in send-email edge function
        // For now, silently fail if email sending doesn't work
        await supabase.functions.invoke('send-email', {
          body: {
            to: shop.owner_email,
            template: 'subscription_cancelled',
            data: {
              shop_name: shop.shop_name,
              end_date: getEndDate()
            }
          }
        });
      } catch (emailErr) {
        // Email sending is not critical - continue with cancellation
        console.warn('Failed to send cancellation email (non-critical):', emailErr);
      }

      // Redirect to cancellation confirmation page
      window.location.href = '/subscription-cancelled';

    } catch (err: any) {
      console.error('Cancellation error:', err);
      setError('Failed to cancel subscription. Please contact support at help@digiget.uk');
      setLoading(false);
    }
  }

  function handleClose() {
    setStep('reason');
    setReason('');
    setFeedback('');
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
          <h2 className="text-xl font-semibold text-gray-900">Cancel Subscription</h2>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Reason */}
          {step === 'reason' && (
            <>
              <p className="mb-4 text-gray-700">
                We're sorry to see you go. Please let us know why you're cancelling 
                so we can improve.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why are you cancelling?
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                >
                  <option value="">Select a reason...</option>
                  <option value="too_expensive">Too expensive</option>
                  <option value="not_using">Not using it enough</option>
                  <option value="missing_features">Missing features I need</option>
                  <option value="too_complicated">Too complicated to use</option>
                  <option value="found_alternative">Found a better alternative</option>
                  <option value="closing_business">Closing my business</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional feedback (optional)
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Tell us more about your experience..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleClose} 
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Never Mind
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!reason}
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {/* Step 2: Confirmation */}
          {step === 'confirm' && (
            <>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <strong className="text-orange-900">⚠️ What happens when you cancel:</strong>
                <ul className="mt-2 mb-0 text-orange-800 text-sm space-y-1">
                  <li>Your subscription ends: <strong>{getEndDate()}</strong></li>
                  <li>You can use DigiGet until then</li>
                  <li>After that, you won't be able to log in</li>
                  <li>Your data will be kept for 30 days</li>
                  <li>You can reactivate within 30 days</li>
                  <li>After 30 days, all data is deleted</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <strong className="text-blue-900">💡 Need help instead?</strong>
                <p className="mb-0 mt-2 text-blue-800 text-sm">
                  If you're having issues, contact us at{' '}
                  <a href="mailto:help@digiget.uk" className="underline">help@digiget.uk</a>.
                  We're here to help!
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setStep('reason')} 
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Go Back
                </button>
                <button
                  onClick={() => setStep('pin')}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Yes, Cancel Subscription
                </button>
              </div>
            </>
          )}

          {/* Step 3: PIN Confirmation */}
          {step === 'pin' && (
            <>
              <p className="mb-4 text-gray-700">
                Enter your owner PIN to confirm cancellation.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner PIN
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

              <div className="flex gap-3">
                <button 
                  onClick={() => setStep('confirm')} 
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Go Back
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={pin.length !== 6 || loading}
                >
                  {loading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

