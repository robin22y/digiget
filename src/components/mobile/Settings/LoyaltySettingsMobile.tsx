import { useState } from 'react';
import { Save, Heart } from 'lucide-react';
import BackButton from '../BackButton';
import { supabase } from '../../../lib/supabase';

interface LoyaltySettingsMobileProps {
  shopId: string;
  loyaltyEnabled: boolean;
  pointsType: 'per_visit' | 'per_spend';
  pointsNeeded: number;
  daysBetweenPoints: number;
  rewardType: 'free_product' | 'fixed_discount' | 'percentage_discount';
  rewardValue: string;
  rewardDescription: string;
  onBack: () => void;
  onSave?: (data: any) => void;
}

export default function LoyaltySettingsMobile({
  shopId,
  loyaltyEnabled: initialLoyaltyEnabled,
  pointsType: initialPointsType,
  pointsNeeded: initialPointsNeeded,
  daysBetweenPoints: initialDaysBetweenPoints,
  rewardType: initialRewardType,
  rewardValue: initialRewardValue,
  rewardDescription: initialRewardDescription,
  onBack,
  onSave,
}: LoyaltySettingsMobileProps) {
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(initialLoyaltyEnabled);
  const [pointsType, setPointsType] = useState<'per_visit' | 'per_spend'>(initialPointsType);
  const [pointsNeeded, setPointsNeeded] = useState(initialPointsNeeded);
  const [daysBetweenPoints, setDaysBetweenPoints] = useState(initialDaysBetweenPoints);
  const [rewardType, setRewardType] = useState<'free_product' | 'fixed_discount' | 'percentage_discount'>(initialRewardType);
  const [rewardValue, setRewardValue] = useState(initialRewardValue || '');
  const [rewardDescription, setRewardDescription] = useState(initialRewardDescription || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('shops')
        .update({
          loyalty_enabled: loyaltyEnabled,
          points_type: pointsType,
          points_needed: pointsNeeded,
          days_between_points: daysBetweenPoints,
          reward_type: rewardType,
          reward_value: rewardValue ? parseFloat(rewardValue) : null,
          reward_description: rewardDescription,
        })
        .eq('id', shopId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Loyalty settings saved successfully!' });
      
      if (onSave) {
        onSave({ loyaltyEnabled, pointsType, pointsNeeded, daysBetweenPoints, rewardType, rewardValue, rewardDescription });
      }

      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving loyalty settings:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="md:hidden bg-[#f7f8fa] min-h-screen">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex items-center gap-3">
          <BackButton onClick={onBack} />
          <h1 className="text-lg font-bold text-gray-900">Loyalty Program</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Success/Error Message */}
        {message && (
          <div className={`rounded-2xl p-4 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="text-sm font-medium">{message.text}</div>
          </div>
        )}

        {/* Enable Loyalty Toggle */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F2994A] rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Loyalty Program Enabled</div>
                <div className="text-xs text-gray-600">Enable or disable loyalty points</div>
              </div>
            </div>
            <button
              onClick={() => setLoyaltyEnabled(!loyaltyEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                loyaltyEnabled ? 'bg-[#27AE60]' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                loyaltyEnabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {loyaltyEnabled && (
          <>
            {/* Points System */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Points System</label>
              <div className="space-y-2">
                <button
                  onClick={() => setPointsType('per_visit')}
                  className={`w-full px-4 py-3 rounded-2xl border-2 text-left transition-all ${
                    pointsType === 'per_visit'
                      ? 'border-[#2F80ED] bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-900">Per Visit</div>
                  <div className="text-xs text-gray-600">Customer gets 1 point per visit</div>
                </button>
                <button
                  onClick={() => setPointsType('per_spend')}
                  className={`w-full px-4 py-3 rounded-2xl border-2 text-left transition-all ${
                    pointsType === 'per_spend'
                      ? 'border-[#2F80ED] bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-900">Per £ Spent</div>
                  <div className="text-xs text-gray-600">Customer gets 1 point per £ spent</div>
                </button>
              </div>
            </div>

            {/* Points Needed */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Points Needed for Reward</label>
              <input
                type="number"
                value={pointsNeeded}
                onChange={(e) => setPointsNeeded(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-4 py-3 bg-[#f7f8fa] border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-[#2F80ED] focus:border-transparent"
                placeholder="6"
              />
              <p className="text-xs text-gray-500 mt-2">Common values: 5, 6, 8, 10</p>
            </div>

            {/* Days Between Points */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Days Between Points</label>
              <input
                type="number"
                value={daysBetweenPoints}
                onChange={(e) => setDaysBetweenPoints(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-3 bg-[#f7f8fa] border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-[#2F80ED] focus:border-transparent"
                placeholder="7"
              />
              <p className="text-xs text-gray-500 mt-2">Minimum days a customer must wait before earning the next point. Set to 0 to allow daily points.</p>
            </div>

            {/* Reward Type */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Reward Type</label>
              <select
                value={rewardType}
                onChange={(e) => setRewardType(e.target.value as any)}
                className="w-full px-4 py-3 bg-[#f7f8fa] border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-[#2F80ED] focus:border-transparent"
              >
                <option value="free_product">Free Product/Service</option>
                <option value="fixed_discount">Fixed Discount (£)</option>
                <option value="percentage_discount">Percentage Discount (%)</option>
              </select>
            </div>

            {/* Reward Value */}
            {(rewardType === 'fixed_discount' || rewardType === 'percentage_discount') && (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  {rewardType === 'fixed_discount' ? 'Discount Amount (£)' : 'Discount Percentage (%)'}
                </label>
                <input
                  type="number"
                  value={rewardValue}
                  onChange={(e) => setRewardValue(e.target.value)}
                  min="0"
                  step={rewardType === 'percentage_discount' ? '1' : '0.01'}
                  className="w-full px-4 py-3 bg-[#f7f8fa] border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-[#2F80ED] focus:border-transparent"
                  placeholder={rewardType === 'fixed_discount' ? '10.00' : '10'}
                />
              </div>
            )}

            {/* Reward Description */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Reward Description</label>
              <input
                type="text"
                value={rewardDescription}
                onChange={(e) => setRewardDescription(e.target.value)}
                className="w-full px-4 py-3 bg-[#f7f8fa] border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-[#2F80ED] focus:border-transparent"
                placeholder="Free service"
              />
            </div>
          </>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#2F80ED] text-white rounded-2xl py-4 mt-6 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

