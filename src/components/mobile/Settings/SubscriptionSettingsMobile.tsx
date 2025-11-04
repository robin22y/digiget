import { CreditCard, CheckCircle } from 'lucide-react';
import BackButton from '../BackButton';

interface SubscriptionSettingsMobileProps {
  planType: 'basic' | 'pro';
  subscriptionStatus: string;
  trialEndsAt?: string | null;
  subscriptionStartedAt?: string | null;
  onBack: () => void;
  onCancelSubscription?: () => void;
}

export default function SubscriptionSettingsMobile({
  planType,
  subscriptionStatus,
  trialEndsAt,
  subscriptionStartedAt,
  onBack,
  onCancelSubscription,
}: SubscriptionSettingsMobileProps) {
  const getStatusBadge = () => {
    if (subscriptionStatus === 'active') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">Active</span>;
    } else if (subscriptionStatus === 'trial') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">Trial</span>;
    } else {
      return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">Cancelled</span>;
    }
  };

  return (
    <div className="md:hidden bg-[#f7f8fa] min-h-screen">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex items-center gap-3">
          <BackButton onClick={onBack} />
          <h1 className="text-lg font-bold text-gray-900">Subscription</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Current Plan */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#27AE60] rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">
                {planType === 'pro' ? 'Pro Plan' : 'Basic Plan'}
              </div>
              <div className="text-xs text-gray-600">{getStatusBadge()}</div>
            </div>
          </div>

          {trialEndsAt && subscriptionStatus === 'trial' && (
            <div className="pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Trial Ends</div>
              <div className="text-sm font-semibold text-gray-900">
                {new Date(trialEndsAt).toLocaleDateString()}
              </div>
            </div>
          )}

          {subscriptionStartedAt && subscriptionStatus === 'active' && (
            <div className="pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Started</div>
              <div className="text-sm font-semibold text-gray-900">
                {new Date(subscriptionStartedAt).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {/* Plan Features */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <div className="text-sm font-semibold text-gray-900 mb-3">Plan Features</div>
          <div className="space-y-2">
            {planType === 'pro' ? (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-700">Unlimited staff members</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-700">Advanced analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-700">Priority support</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-700">Up to 5 staff members</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-700">Basic features</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Cancel Subscription */}
        {subscriptionStatus === 'active' && onCancelSubscription && (
          <button
            onClick={onCancelSubscription}
            className="w-full bg-red-50 text-red-600 rounded-2xl py-4 mt-6 font-semibold flex items-center justify-center gap-2 border border-red-200 active:scale-95 transition-transform"
          >
            Cancel Subscription
          </button>
        )}
      </div>
    </div>
  );
}

