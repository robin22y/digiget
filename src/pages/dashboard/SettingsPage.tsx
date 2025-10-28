import { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Save, CheckCircle } from 'lucide-react';

interface Shop {
  id: string;
  shop_name: string;
  owner_name: string;
  owner_email: string;
  business_category: string;
  plan_type: 'basic' | 'pro';
  subscription_status: string;
  trial_ends_at: string;
  loyalty_enabled: boolean;
  points_type: 'per_visit' | 'per_spend';
  points_needed: number;
  reward_type: 'free_product' | 'fixed_discount' | 'percentage_discount';
  reward_value: number | null;
  reward_description: string;
  diary_enabled: boolean;
  auto_logout_hours: number;
}

export default function SettingsPage() {
  const { shopId } = useParams();
  const { shop: contextShop } = useOutletContext<{ shop: any }>();
  const [activeTab, setActiveTab] = useState<'business' | 'loyalty' | 'features' | 'subscription'>('business');
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');

  const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);
  const [pointsType, setPointsType] = useState<'per_visit' | 'per_spend'>('per_visit');
  const [pointsNeeded, setPointsNeeded] = useState(6);
  const [rewardType, setRewardType] = useState<'free_product' | 'fixed_discount' | 'percentage_discount'>('free_product');
  const [rewardValue, setRewardValue] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');

  const [diaryEnabled, setDiaryEnabled] = useState(false);
  const [autoLogoutHours, setAutoLogoutHours] = useState(13);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  useEffect(() => {
    loadShop();
  }, [shopId]);

  const loadShop = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

      if (error) throw error;
      setShop(data);

      setShopName(data.shop_name);
      setOwnerName(data.owner_name);
      setBusinessCategory(data.business_category);

      setLoyaltyEnabled(data.loyalty_enabled);
      setPointsType(data.points_type);
      setPointsNeeded(data.points_needed);
      setRewardType(data.reward_type);
      setRewardValue(data.reward_value?.toString() || '');
      setRewardDescription(data.reward_description);

      setDiaryEnabled(data.diary_enabled);
      setAutoLogoutHours(data.auto_logout_hours || 13);
      setLatitude(data.latitude?.toString() || '');
      setLongitude(data.longitude?.toString() || '');
    } catch (error) {
      console.error('Error loading shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBusinessSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('shops')
        .update({
          shop_name: shopName,
          owner_name: ownerName,
          business_category: businessCategory
        })
        .eq('id', shopId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Business settings saved successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const saveLoyaltySettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('shops')
        .update({
          loyalty_enabled: loyaltyEnabled,
          points_type: pointsType,
          points_needed: pointsNeeded,
          reward_type: rewardType,
          reward_value: rewardValue ? parseFloat(rewardValue) : null,
          reward_description: rewardDescription
        })
        .eq('id', shopId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Loyalty settings saved successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const saveFeatureSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('shops')
        .update({
          diary_enabled: diaryEnabled,
          auto_logout_hours: autoLogoutHours,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
        })
        .eq('id', shopId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Feature settings saved successfully. Refresh the page to see changes.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!shop) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop not found</h2>
        <p className="text-gray-600">Unable to load shop settings</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Settings</h1>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('business')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'business'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Business
            </button>
            <button
              onClick={() => setActiveTab('loyalty')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'loyalty'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Loyalty
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'features'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Features
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'subscription'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Subscription
            </button>
          </nav>
        </div>

        <div className="p-6">
          {message && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          {activeTab === 'business' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Business Settings</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Category</label>
                <select
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="hair_salon">Hair Salon / Barbershop</option>
                  <option value="beauty_salon">Beauty & Nail Salon</option>
                  <option value="cafe">Cafe / Coffee Shop</option>
                  <option value="restaurant">Restaurant / Takeaway</option>
                  <option value="retail">Retail / Convenience Store</option>
                  <option value="health_wellness">Health & Wellness</option>
                  <option value="professional_services">Professional Services</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <button
                onClick={saveBusinessSettings}
                disabled={saving}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'loyalty' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Loyalty Program Settings</h2>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={loyaltyEnabled}
                  onChange={(e) => setLoyaltyEnabled(e.target.checked)}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Loyalty program enabled</label>
              </div>

              {loyaltyEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Points System</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={pointsType === 'per_visit'}
                          onChange={() => setPointsType('per_visit')}
                          className="mr-2"
                        />
                        <span>Per visit (customer gets 1 point per visit)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={pointsType === 'per_spend'}
                          onChange={() => setPointsType('per_spend')}
                          className="mr-2"
                        />
                        <span>Per £ spent (customer gets 1 point per £ spent)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points needed for reward
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={pointsNeeded}
                      onChange={(e) => setPointsNeeded(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">Common values: 5, 6, 8, 10</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reward Type</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={rewardType === 'free_product'}
                          onChange={() => setRewardType('free_product')}
                          className="mr-2"
                        />
                        <span>Free product/service</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={rewardType === 'fixed_discount'}
                          onChange={() => setRewardType('fixed_discount')}
                          className="mr-2"
                        />
                        <span>Fixed amount off (£)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={rewardType === 'percentage_discount'}
                          onChange={() => setRewardType('percentage_discount')}
                          className="mr-2"
                        />
                        <span>Percentage discount (%)</span>
                      </label>
                    </div>
                  </div>

                  {(rewardType === 'fixed_discount' || rewardType === 'percentage_discount') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {rewardType === 'fixed_discount' ? 'Discount Amount (£)' : 'Discount Percentage (%)'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={rewardValue}
                        onChange={(e) => setRewardValue(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={rewardType === 'fixed_discount' ? '10.00' : '20'}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reward Description
                    </label>
                    <input
                      type="text"
                      value={rewardDescription}
                      onChange={(e) => setRewardDescription(e.target.value)}
                      placeholder="e.g., Free coffee, £10 off, 20% discount"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">What customer sees when reward is ready</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Current Program Summary</h3>
                    <p className="text-blue-800 text-sm">
                      Customers get 1 point per {pointsType === 'per_visit' ? 'visit' : '£ spent'}.
                      After {pointsNeeded} {pointsType === 'per_visit' ? 'visits' : 'points'}, they get {rewardDescription || 'a reward'}.
                    </p>
                  </div>
                </>
              )}

              <button
                onClick={saveLoyaltySettings}
                disabled={saving}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Feature Settings</h2>

              {shop.plan_type === 'basic' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-yellow-900 mb-1">Upgrade to Pro</h3>
                  <p className="text-yellow-800 text-sm mb-3">
                    Get access to staff management, task checklists, payroll tracking, and incident reports.
                  </p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold">
                    Upgrade to Pro - £9.99/month
                  </button>
                </div>
              )}

              <div>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={diaryEnabled}
                    onChange={(e) => setDiaryEnabled(e.target.checked)}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Enable diary/appointments</label>
                </div>
                <p className="text-sm text-gray-500 ml-6">
                  For appointment-based businesses (salons, spas, health services)
                </p>
              </div>

              {shop.plan_type === 'pro' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auto-logout after (hours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={autoLogoutHours}
                      onChange={(e) => setAutoLogoutHours(parseInt(e.target.value) || 13)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Staff will be automatically clocked out after this duration. Default: 13 hours
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Shop Location (Geofencing)</h3>
                    <p className="text-blue-800 text-sm mb-4">
                      Set your shop's location to enable geofencing. Staff members will need approval to clock in from more than 100 meters away.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Latitude
                        </label>
                        <input
                          type="text"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                          placeholder="e.g., 51.5074"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Longitude
                        </label>
                        <input
                          type="text"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                          placeholder="e.g., -0.1278"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Find your coordinates at: <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Maps</a> (right-click on location → copy coordinates)
                    </p>
                  </div>
                </>
              )}

              <button
                onClick={saveFeatureSettings}
                disabled={saving}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Subscription</h2>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Current Plan</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {shop.plan_type === 'pro' ? 'Pro' : 'Basic'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {shop.plan_type === 'pro' ? '£9.99' : '£5.99'}/month
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{shop.subscription_status}</p>
                    {shop.subscription_status === 'trial' && (
                      <p className="text-sm text-gray-600">
                        Trial ends: {new Date(shop.trial_ends_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {shop.subscription_status === 'trial' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-1">Free Trial Active</h3>
                  <p className="text-green-800 text-sm">
                    Your {shop.plan_type === 'pro' ? 'Pro' : 'Basic'} plan trial ends on{' '}
                    {new Date(shop.trial_ends_at).toLocaleDateString()}. No payment required until then.
                  </p>
                </div>
              )}

              {shop.plan_type === 'basic' && (
                <div className="border-2 border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upgrade to Pro</h3>
                  <p className="text-gray-600 mb-4">£9.99/month</p>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm">Staff clock in/out tracking</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm">Task management with mandatory completion</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm">Payroll hours tracking and reports</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm">Incident reporting system</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm">Staff performance analytics</span>
                    </li>
                  </ul>
                  <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                    Upgrade to Pro
                  </button>
                </div>
              )}

              {shop.plan_type === 'pro' && (
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Downgrade to Basic</h3>
                  <p className="text-gray-600 mb-4">£5.99/month (save £4/month)</p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-900 font-medium mb-2">You will lose access to:</p>
                    <ul className="space-y-1 text-sm text-yellow-800">
                      <li>• Staff management and clock in/out</li>
                      <li>• Task checklists</li>
                      <li>• Payroll tracking</li>
                      <li>• Incident reports</li>
                    </ul>
                  </div>
                  <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                    Downgrade to Basic
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
