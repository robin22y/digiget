import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Save, CheckCircle, Lock } from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';
import ShopLocationSetup from '../../components/ShopLocationSetup';
import OwnerPinModal from '../../components/OwnerPinModal';

interface Shop {
  id: string;
  shop_name: string;
  owner_name: string;
  owner_email: string;
  business_category: string;
  plan_type: 'basic' | 'pro';
  subscription_status: string;
  trial_ends_at: string | null;
  subscription_started_at: string | null;
  loyalty_enabled: boolean;
  points_type: 'per_visit' | 'per_spend';
  points_needed: number;
  reward_type: 'free_product' | 'fixed_discount' | 'percentage_discount';
  reward_value: number | null;
  reward_description: string;
  diary_enabled: boolean;
  auto_logout_hours: number;
  days_between_points: number;
  nfc_tag_id: string | null;
  nfc_tag_active: boolean;
  require_nfc: boolean;
  allow_gps_fallback: boolean;
  qr_code_enabled: boolean;
  nfc_enabled: boolean;
  tablet_pin_enabled: boolean;
  gps_enabled: boolean;
}

export default function SettingsPage() {
  const { shopId: paramShopId } = useParams();
  const { currentShop, hasAccess, loading: shopLoading } = useShop();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'business' | 'loyalty' | 'subscription' | 'nfc' | 'features'>('business');
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const handlePinSuccess = () => {
    setIsUnlocked(true);
    setShowPinModal(false);
  };

  const handleLockSettings = () => {
    if (shopId) {
      sessionStorage.removeItem(`owner_unlocked_${shopId}`);
      sessionStorage.removeItem(`owner_unlock_time_${shopId}`);
      setIsUnlocked(false);
      setShowPinModal(true);
    }
  };

  // Use currentShop.id from context (secure)
  const shopId = currentShop?.id || (paramShopId && hasAccess(paramShopId) ? paramShopId : null);

  // Validate access
  useEffect(() => {
    if (!shopLoading && paramShopId) {
      if (!hasAccess(paramShopId)) {
        navigate('/dashboard');
        return;
      }
    }
  }, [paramShopId, hasAccess, shopLoading, navigate]);

  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');

  const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);
  const [pointsType, setPointsType] = useState<'per_visit' | 'per_spend'>('per_visit');
  const [pointsNeeded, setPointsNeeded] = useState(6);
  const [daysBetweenPoints, setDaysBetweenPoints] = useState(7);
  const [rewardType, setRewardType] = useState<'free_product' | 'fixed_discount' | 'percentage_discount'>('free_product');
  const [rewardValue, setRewardValue] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');

  const [diaryEnabled, setDiaryEnabled] = useState(false);
  const [autoLogoutHours, setAutoLogoutHours] = useState(12);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');

  // Tier criteria settings
  const [tierAutoUpgradeEnabled, setTierAutoUpgradeEnabled] = useState(false);
  const [tierVipThreshold, setTierVipThreshold] = useState('');
  const [tierSuperStarThreshold, setTierSuperStarThreshold] = useState('');
  const [tierRoyalThreshold, setTierRoyalThreshold] = useState('');

  // NFC settings
  const [nfcTagActive, setNfcTagActive] = useState(false);
  const [requireNfc, setRequireNfc] = useState(false);
  const [allowGpsFallback, setAllowGpsFallback] = useState(true);
  
  // Clock-in method settings (4-tier system)
  const [qrCodeEnabled, setQrCodeEnabled] = useState(true);
  const [nfcEnabled, setNfcEnabled] = useState(false);
  const [tabletPinEnabled, setTabletPinEnabled] = useState(true);
  const [gpsEnabled, setGpsEnabled] = useState(false);

  // Check PIN unlock status on mount
  useEffect(() => {
    if (!shopId) return;

    const checkUnlockStatus = () => {
      const unlocked = sessionStorage.getItem(`owner_unlocked_${shopId}`);
      const unlockTime = sessionStorage.getItem(`owner_unlock_time_${shopId}`);

      if (unlocked === 'true' && unlockTime) {
        // Check if unlock is still valid (30 minutes)
        const timeSinceUnlock = Date.now() - parseInt(unlockTime, 10);
        const UNLOCK_DURATION = 30 * 60 * 1000; // 30 minutes

        if (timeSinceUnlock < UNLOCK_DURATION) {
          setIsUnlocked(true);
          setShowPinModal(false);
          return;
        } else {
          // Unlock expired
          sessionStorage.removeItem(`owner_unlocked_${shopId}`);
          sessionStorage.removeItem(`owner_unlock_time_${shopId}`);
        }
      }

      // Not unlocked or expired - show PIN modal
      setIsUnlocked(false);
      setShowPinModal(true);
    };

    checkUnlockStatus();

    // Check unlock status periodically (every minute)
    const interval = setInterval(checkUnlockStatus, 60000);

    return () => clearInterval(interval);
  }, [shopId]);

  useEffect(() => {
    if (!isUnlocked || !shopId) return;

    loadShop();
    
    // Set up real-time subscription for shop settings
    const channel = supabase
      .channel(`shop_settings_${shopId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'shops', 
          filter: `id=eq.${shopId}` 
        }, 
        (payload) => {
          // Update local state when shop is updated from another device
          const updatedShop = payload.new as any;
          setShop(updatedShop);
          
          // Update all form fields to reflect changes
          setShopName(updatedShop.shop_name);
          setOwnerName(updatedShop.owner_name);
          setBusinessCategory(updatedShop.business_category);
          
          setLoyaltyEnabled(updatedShop.loyalty_enabled);
          setPointsType(updatedShop.points_type);
          setPointsNeeded(updatedShop.points_needed);
          setDaysBetweenPoints(updatedShop.days_between_points || 7);
          setRewardType(updatedShop.reward_type);
          setRewardValue(updatedShop.reward_value?.toString() || '');
          setRewardDescription(updatedShop.reward_description);
          
          setDiaryEnabled(updatedShop.diary_enabled);
          setAutoLogoutHours(updatedShop.auto_logout_hours || 12);
          setLatitude(updatedShop.latitude?.toString() || '');
          setLongitude(updatedShop.longitude?.toString() || '');
          setOpenTime(updatedShop.open_time || '');
          setCloseTime(updatedShop.close_time || '');
          
          setTierAutoUpgradeEnabled(updatedShop.tier_auto_upgrade_enabled || false);
          setTierVipThreshold(updatedShop.tier_vip_threshold?.toString() || '');
          setTierSuperStarThreshold(updatedShop.tier_super_star_threshold?.toString() || '');
          setTierRoyalThreshold(updatedShop.tier_royal_threshold?.toString() || '');
          
          // Show notification that settings were updated
          setMessage({ type: 'success', text: 'Settings updated from another device' });
          setTimeout(() => setMessage(null), 3000);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, isUnlocked]);

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
      setDaysBetweenPoints(data.days_between_points || 7);
      setRewardType(data.reward_type);
      setRewardValue(data.reward_value?.toString() || '');
      setRewardDescription(data.reward_description);

      setDiaryEnabled(data.diary_enabled);
      setAutoLogoutHours(data.auto_logout_hours || 12);
      setLatitude(data.latitude?.toString() || '');
      setLongitude(data.longitude?.toString() || '');
      setOpenTime(data.open_time || '');
      setCloseTime(data.close_time || '');

      // Load tier criteria
      setTierAutoUpgradeEnabled(data.tier_auto_upgrade_enabled || false);
      setTierVipThreshold(data.tier_vip_threshold?.toString() || '');
      setTierSuperStarThreshold(data.tier_super_star_threshold?.toString() || '');
      setTierRoyalThreshold(data.tier_royal_threshold?.toString() || '');

      // Load NFC settings
      setNfcTagActive(data.nfc_tag_active || false);
      setRequireNfc(data.require_nfc || false);
      setAllowGpsFallback(data.allow_gps_fallback !== false); // Default to true
      
      // Load clock-in method settings
      setQrCodeEnabled(data.qr_code_enabled !== false); // Default to true
      setNfcEnabled(data.nfc_enabled || false);
      setTabletPinEnabled(data.tablet_pin_enabled !== false); // Default to true
      setGpsEnabled(data.gps_enabled || false);
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
          business_category: businessCategory,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
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
          days_between_points: daysBetweenPoints,
          reward_type: rewardType,
          reward_value: rewardValue ? parseFloat(rewardValue) : null,
          reward_description: rewardDescription,
          tier_auto_upgrade_enabled: tierAutoUpgradeEnabled,
          tier_vip_threshold: tierVipThreshold ? parseInt(tierVipThreshold) : null,
          tier_super_star_threshold: tierSuperStarThreshold ? parseInt(tierSuperStarThreshold) : null,
          tier_royal_threshold: tierRoyalThreshold ? parseInt(tierRoyalThreshold) : null
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
          open_time: openTime || null,
          close_time: closeTime || null,
        })
        .eq('id', shopId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Feature settings saved successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const saveNFCSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Validate at least one method is enabled
      if (!qrCodeEnabled && !nfcEnabled && !tabletPinEnabled && !gpsEnabled) {
        setMessage({ type: 'error', text: 'You must enable at least one clock-in method!' });
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('shops')
        .update({
          nfc_tag_active: nfcTagActive,
          require_nfc: requireNfc,
          allow_gps_fallback: allowGpsFallback,
          // Clock-in method toggles
          qr_code_enabled: qrCodeEnabled,
          nfc_enabled: nfcEnabled,
          tablet_pin_enabled: tabletPinEnabled,
          gps_enabled: gpsEnabled,
        })
        .eq('id', shopId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Clock-in settings saved successfully' });
      setTimeout(() => setMessage(null), 3000);
      
      // Reload shop data to reflect changes
      await loadShop();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  // No upgrade function needed - all features available to all shops

  // Show loading/PIN modal while checking unlock status
  if ((loading && !isUnlocked) || (!isUnlocked && showPinModal)) {
    return (
      <>
        {showPinModal && shopId && (
          <OwnerPinModal
            shopId={shopId}
            onSuccess={handlePinSuccess}
            onCancel={() => navigate('/dashboard')}
          />
        )}
        {!showPinModal && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        )}
      </>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!shop || !isUnlocked) {
    return (
      <>
        {showPinModal && shopId && (
          <OwnerPinModal
            shopId={shopId}
            onSuccess={handlePinSuccess}
            onCancel={() => navigate('/dashboard')}
          />
        )}
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop not found</h2>
          <p className="text-gray-600">Unable to load shop settings</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page">
      <div className="container">
        <h1 className="mb-4">Settings</h1>

        <div className="card">
          {/* Tabs */}
          <div className="tabs">
            <button
              onClick={() => setActiveTab('business')}
              className={`tab ${activeTab === 'business' ? 'active' : ''}`}
            >
              Business
            </button>
            <button
              onClick={() => setActiveTab('loyalty')}
              className={`tab ${activeTab === 'loyalty' ? 'active' : ''}`}
            >
              Loyalty
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`tab ${activeTab === 'subscription' ? 'active' : ''}`}
            >
              Subscription
            </button>
            <button
              onClick={() => setActiveTab('nfc')}
              className={`tab ${activeTab === 'nfc' ? 'active' : ''}`}
            >
              NFC Clock-In
            </button>
          </div>

          {message && (
            <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              {message.text}
            </div>
          )}

          {activeTab === 'business' && (
            <div>
              <h2 className="mb-3">Business Settings</h2>

              <div className="form-group">
                <label className="label">Shop Name</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="input"
                  placeholder="Enter your shop name"
                />
              </div>

              <div className="form-group">
                <label className="label">Owner Name</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="input"
                  placeholder="Enter owner name"
                />
              </div>

              <div className="form-group">
                <label className="label">Business Category</label>
                <select
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="input"
                  disabled
                >
                  <option value="hair_salon">Hair Salon / Barbershop</option>
                </select>
                <span className="help-text">Currently only available for Hair Salons / Barbershops</span>
              </div>

              <div className="form-group mt-6">
                <h3 className="text-lg font-semibold mb-3">Shop Location (Geofencing)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Set your shop's location to enable geofencing. Staff members will need approval to clock in from more than 100 meters away.
                </p>
                
                {(latitude && longitude) ? (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                    <p className="font-semibold mb-2">Current Location:</p>
                    <p className="text-sm text-gray-600 mb-2">
                      Coordinates: {latitude}, {longitude}
                    </p>
                    <button
                      onClick={() => {
                        setLatitude('');
                        setLongitude('');
                      }}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Change Location
                    </button>
                  </div>
                ) : (
                  <ShopLocationSetup
                    onLocationSet={async (locationData) => {
                      setLatitude(locationData.latitude.toString());
                      setLongitude(locationData.longitude.toString());
                      // Save immediately when location is set
                      await supabase
                        .from('shops')
                        .update({
                          latitude: locationData.latitude,
                          longitude: locationData.longitude,
                        })
                        .eq('id', shopId);
                      
                      setMessage({
                        type: 'success',
                        text: 'Shop location saved successfully!',
                      });
                      setTimeout(() => setMessage(null), 3000);
                    }}
                  />
                )}
              </div>

              <button
                onClick={saveBusinessSettings}
                disabled={saving}
                className="btn btn-primary"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'loyalty' && (
            <div>
              <h2 className="mb-3">Loyalty Program Settings</h2>

              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="loyalty-enabled"
                  checked={loyaltyEnabled}
                  onChange={(e) => setLoyaltyEnabled(e.target.checked)}
                />
                <label htmlFor="loyalty-enabled" className="checkbox-label">
                  Loyalty program enabled
                </label>
              </div>

              {loyaltyEnabled && (
                <>
                  <div className="form-group mt-4">
                    <label className="label">Points System</label>
                    
                    <div className="radio-wrapper">
                      <input
                        type="radio"
                        id="points-per-visit"
                        name="points-system"
                        checked={pointsType === 'per_visit'}
                        onChange={() => setPointsType('per_visit')}
                      />
                      <label htmlFor="points-per-visit" className="radio-label">
                        Per visit (customer gets 1 point per visit)
                      </label>
                    </div>
                    
                    <div className="radio-wrapper">
                      <input
                        type="radio"
                        id="points-per-pound"
                        name="points-system"
                        checked={pointsType === 'per_spend'}
                        onChange={() => setPointsType('per_spend')}
                      />
                      <label htmlFor="points-per-pound" className="radio-label">
                        Per £ spent (customer gets 1 point per £ spent)
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="label">Points needed for reward</label>
                    <input
                      type="number"
                      min="1"
                      value={pointsNeeded}
                      onChange={(e) => setPointsNeeded(parseInt(e.target.value) || 1)}
                      className="input"
                    />
                    <span className="help-text">Common values: 5, 6, 8, 10</span>
                  </div>

                  <div className="form-group">
                    <label className="label">Days between points</label>
                    <input
                      type="number"
                      min="0"
                      value={daysBetweenPoints}
                      onChange={(e) => setDaysBetweenPoints(parseInt(e.target.value) || 0)}
                      className="input"
                    />
                    <span className="help-text">
                      Minimum days a customer must wait before earning the next point. Default: 7 days. Set to 0 to allow daily points.
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="label">Reward Type</label>
                    
                    <div className="radio-wrapper">
                      <input
                        type="radio"
                        id="free-service"
                        name="reward-type"
                        checked={rewardType === 'free_product'}
                        onChange={() => setRewardType('free_product')}
                      />
                      <label htmlFor="free-service" className="radio-label">
                        Free product/service
                      </label>
                    </div>
                    
                    <div className="radio-wrapper">
                      <input
                        type="radio"
                        id="percentage-discount"
                        name="reward-type"
                        checked={rewardType === 'percentage_discount'}
                        onChange={() => setRewardType('percentage_discount')}
                      />
                      <label htmlFor="percentage-discount" className="radio-label">
                        Percentage discount (%)
                      </label>
                    </div>
                    
                    <div className="radio-wrapper">
                      <input
                        type="radio"
                        id="fixed-discount"
                        name="reward-type"
                        checked={rewardType === 'fixed_discount'}
                        onChange={() => setRewardType('fixed_discount')}
                      />
                      <label htmlFor="fixed-discount" className="radio-label">
                        Fixed amount off (£)
                      </label>
                    </div>
                  </div>

                  {(rewardType === 'fixed_discount' || rewardType === 'percentage_discount') && (
                    <div className="form-group">
                      <label className="label">
                        {rewardType === 'fixed_discount' ? 'Discount Amount (£)' : 'Discount Percentage (%)'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={rewardValue}
                        onChange={(e) => setRewardValue(e.target.value)}
                        className="input"
                        placeholder={rewardType === 'fixed_discount' ? '10.00' : '20'}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="label">Reward Description</label>
                    <textarea
                      value={rewardDescription}
                      onChange={(e) => setRewardDescription(e.target.value)}
                      placeholder="e.g., Free coffee, £10 off, 20% discount"
                      rows={3}
                      className="input"
                    />
                    <span className="help-text">What customer sees when reward is ready</span>
                  </div>

                  <div className="alert alert-info">
                    <strong>Current Program Summary</strong><br />
                    Customers get 1 point per {pointsType === 'per_visit' ? 'visit' : '£ spent'}. After {pointsNeeded} {pointsType === 'per_visit' ? 'visits' : 'points'}, they get {rewardDescription || 'a reward'}.
                  </div>
                </>
              )}

                  {/* Customer Tier Classification */}
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h3 className="mb-4">Customer Tier Classification</h3>
                    <p className="text-muted mb-4">
                      Automatically upgrade customers to tiers based on their lifetime points. Manual tier assignments will override auto-upgrade.
                    </p>

                    <div className="checkbox-wrapper">
                      <input
                        type="checkbox"
                        id="tier-auto-upgrade"
                        checked={tierAutoUpgradeEnabled}
                        onChange={(e) => setTierAutoUpgradeEnabled(e.target.checked)}
                      />
                      <label htmlFor="tier-auto-upgrade" className="checkbox-label">Enable automatic tier upgrades</label>
                    </div>

                    {tierAutoUpgradeEnabled && (
                      <div className="card mt-4">
                        <div className="form-group">
                          <label className="label">🌟 VIP Tier Threshold (lifetime points)</label>
                          <input
                            type="number"
                            min="0"
                            value={tierVipThreshold}
                            onChange={(e) => setTierVipThreshold(e.target.value)}
                            placeholder="e.g., 50"
                            className="input"
                          />
                          <span className="help-text">Customers with this many lifetime points or more will be VIP</span>
                        </div>

                        <div className="form-group">
                          <label className="label">🔥 Super Star Tier Threshold (lifetime points)</label>
                          <input
                            type="number"
                            min="0"
                            value={tierSuperStarThreshold}
                            onChange={(e) => setTierSuperStarThreshold(e.target.value)}
                            placeholder="e.g., 200"
                            className="input"
                          />
                          <span className="help-text">Customers with this many lifetime points or more will be Super Star</span>
                        </div>

                        <div className="form-group">
                          <label className="label">👑 Royal Tier Threshold (lifetime points)</label>
                          <input
                            type="number"
                            min="0"
                            value={tierRoyalThreshold}
                            onChange={(e) => setTierRoyalThreshold(e.target.value)}
                            placeholder="e.g., 500"
                            className="input"
                          />
                          <span className="help-text">Customers with this many lifetime points or more will be Royal</span>
                        </div>

                        <div className="alert alert-info">
                          <strong>Note:</strong> Thresholds should be in ascending order (VIP &lt; Super Star &lt; Royal). 
                          Customers will be assigned the highest tier they qualify for. 
                          Manual tier assignments always override automatic upgrades.
                        </div>
                      </div>
                    )}
                  </div>

              <button
                onClick={saveLoyaltySettings}
                disabled={saving}
                className="btn btn-primary"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Feature Settings</h2>

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
                      onChange={(e) => setAutoLogoutHours(parseInt(e.target.value) || 12)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Staff will be automatically clocked out after this duration. Default: 12 hours
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
                      <input
                        type="time"
                        value={openTime}
                        onChange={(e) => setOpenTime(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
                      <input
                        type="time"
                        value={closeTime}
                        onChange={(e) => setCloseTime(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
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
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Subscription</h2>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Subscription Plan</p>
                    <p className="text-lg font-semibold text-gray-900">
                      £29.99/month
                    </p>
                    <p className="text-sm text-gray-600">
                      {shop.subscription_status === 'trial' ? 'Free Trial' : 'Active Subscription'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{shop.subscription_status}</p>
                    {shop.subscription_status === 'trial' && shop.trial_ends_at && (
                      <p className="text-sm text-gray-600">
                        {(() => {
                          const trialEnd = new Date(shop.trial_ends_at);
                          const now = new Date();
                          const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          if (daysLeft <= 0) {
                            return 'Trial ended';
                          }
                          return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
                        })()}
                      </p>
                    )}
                    {shop.subscription_status === 'active' && shop.subscription_started_at && (
                      <p className="text-sm text-gray-600">
                        {(() => {
                          const subscriptionStart = new Date(shop.subscription_started_at);
                          const nextPayment = new Date(subscriptionStart);
                          nextPayment.setMonth(nextPayment.getMonth() + 1);
                          // Find the next payment date (next month same day)
                          const now = new Date();
                          while (nextPayment <= now) {
                            nextPayment.setMonth(nextPayment.getMonth() + 1);
                          }
                          return `Next payment: ${nextPayment.toLocaleDateString()}`;
                        })()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {shop.subscription_status === 'trial' && shop.trial_ends_at && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-1">Free Trial Active</h3>
                  <p className="text-green-800 text-sm">
                    {(() => {
                      const trialEnd = new Date(shop.trial_ends_at);
                      const now = new Date();
                      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      if (daysLeft <= 0) {
                        return `Your 14-day free trial has ended. Your subscription will be £29.99/month starting ${trialEnd.toLocaleDateString()}.`;
                      }
                      return `You have ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining in your 14-day free trial. After the trial ends on ${trialEnd.toLocaleDateString()}, your subscription will be £29.99/month.`;
                    })()}
                  </p>
                </div>
              )}

              {shop.subscription_status === 'active' && shop.subscription_started_at && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-1">Active Subscription</h3>
                  <p className="text-blue-800 text-sm">
                    {(() => {
                      const subscriptionStart = new Date(shop.subscription_started_at);
                      const nextPayment = new Date(subscriptionStart);
                      nextPayment.setMonth(nextPayment.getMonth() + 1);
                      const now = new Date();
                      while (nextPayment <= now) {
                        nextPayment.setMonth(nextPayment.getMonth() + 1);
                      }
                      return `Your next payment of £29.99 is due on ${nextPayment.toLocaleDateString()}.`;
                    })()}
                  </p>
                </div>
              )}


            </div>
          )}

          {activeTab === 'nfc' && (
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">NFC Clock-In Setup</h2>

              {shop.nfc_tag_id ? (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-900">NFC Tag Assigned</span>
                    </div>
                    <p className="text-green-800 text-sm">
                      Your shop has an NFC tag. Staff can tap their phone to the tag for instant clock-in.
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Tag ID</label>
                        <div className="mt-1 flex items-center gap-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">{shop.nfc_tag_id}</code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(shop.nfc_tag_id || '');
                              setMessage({ type: 'success', text: 'Tag ID copied to clipboard!' });
                              setTimeout(() => setMessage(null), 2000);
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                            title="Copy Tag ID"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Status</label>
                        <div className="mt-1">
                          {nfcTagActive ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">NFC Clock-In URL</label>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 break-all">
                          {`${window.location.origin}/nfc-clock?tag=${shop.nfc_tag_id}`}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/nfc-clock?tag=${shop.nfc_tag_id}`);
                            setMessage({ type: 'success', text: 'URL copied to clipboard!' });
                            setTimeout(() => setMessage(null), 2000);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                          title="Copy URL"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="nfc-active"
                        checked={nfcTagActive}
                        onChange={(e) => setNfcTagActive(e.target.checked)}
                        className="mt-1"
                      />
                      <label htmlFor="nfc-active" className="flex-1">
                        <span className="font-medium text-gray-900">NFC tag is active</span>
                        <p className="text-sm text-gray-600 mt-1">
                          When enabled, staff can use the NFC tag to clock in/out. Disable if tag is lost or damaged.
                        </p>
                      </label>
                    </div>

                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="require-nfc"
                        checked={requireNfc}
                        onChange={(e) => setRequireNfc(e.target.checked)}
                        disabled={!nfcTagActive}
                        className="mt-1"
                      />
                      <label htmlFor="require-nfc" className="flex-1">
                        <span className="font-medium text-gray-900">Require NFC for all clock-ins</span>
                        <p className="text-sm text-gray-600 mt-1">
                          When enabled, staff MUST use NFC tag (GPS clock-in disabled). Only enable if all staff have NFC-capable phones.
                        </p>
                      </label>
                    </div>

                    {requireNfc && nfcTagActive && (
                      <div className="flex items-start gap-3 ml-7">
                        <input
                          type="checkbox"
                          id="allow-gps-fallback"
                          checked={allowGpsFallback}
                          onChange={(e) => setAllowGpsFallback(e.target.checked)}
                          className="mt-1"
                        />
                        <label htmlFor="allow-gps-fallback" className="flex-1">
                          <span className="font-medium text-gray-900">Allow GPS as backup</span>
                          <p className="text-sm text-gray-600 mt-1">
                            If NFC fails or staff phone doesn't support NFC, allow GPS clock-in as fallback.
                          </p>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">📱 Installing Your NFC Tag</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                      <li>Place tag near shop entrance (chest height, easy to reach)</li>
                      <li>Clean surface before sticking (use alcohol wipe if needed)</li>
                      <li>Test by tapping your phone to the tag - should open clock-in page</li>
                      <li>Instruct staff to tap tag when arriving/leaving</li>
                      <li>Tag works indoors (no GPS needed) and is instant</li>
                    </ol>
                  </div>

                  <button
                    onClick={saveNFCSettings}
                    disabled={saving}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {saving ? 'Saving...' : 'Save NFC Settings'}
                  </button>
                </>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <h3 className="font-semibold text-yellow-900 mb-2">No NFC Tag Assigned</h3>
                  <p className="text-yellow-800 text-sm mb-4">
                    NFC tags are available for the first 20 founding member shops (free, worth £25).
                  </p>
                  <p className="text-yellow-800 text-sm">
                    Contact <a href="mailto:support@digiget.uk" className="underline">support@digiget.uk</a> to request your free NFC tag.
                  </p>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">💡 Why NFC is Better Than GPS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-900 mb-1">GPS Problems:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Fails indoors/basements</li>
                      <li>Inaccurate in city centers</li>
                      <li>"100m from shop" when inside</li>
                      <li>Drains battery</li>
                      <li>Takes 10-30 seconds</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">NFC Benefits:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Tap phone = clocked in (&lt;1 second)</li>
                      <li>Works anywhere (indoors, basement, etc)</li>
                      <li>100% accurate</li>
                      <li>No battery drain</li>
                      <li>Physical proof of presence</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      </div>

      {/* Lock Button - Show when unlocked */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={handleLockSettings}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-lg"
          title="Lock settings (requires PIN to unlock again)"
        >
          <Lock className="w-4 h-4" />
          Lock Settings
        </button>
      </div>
    </>
  );
}
