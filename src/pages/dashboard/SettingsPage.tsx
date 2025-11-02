import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Save, CheckCircle, Lock, KeyRound, Smartphone, Trash2, RotateCcw } from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';
import ShopLocationSetup from '../../components/ShopLocationSetup';
import OwnerPinModal from '../../components/OwnerPinModal';
import ChangeOwnerPinModal from '../../components/ChangeOwnerPinModal';
import { CancelSubscriptionModal } from '../../components/CancelSubscriptionModal';
import { DeleteAccountModal } from '../../components/DeleteAccountModal';
import { AuthorizeDeviceModal } from '../../components/AuthorizeDeviceModal';
import { storeDeviceFingerprint } from '../../lib/deviceFingerprint';
import ResetShopPinModal from '../../components/ResetShopPinModal';
import ToggleTrustedDevicesModal from '../../components/ToggleTrustedDevicesModal';

interface Shop {
  id: string;
  shop_name: string;
  owner_name: string;
  owner_email: string;
  owner_pin: string | null;
  shop_pin: string | null;
  short_code: string | null;
  trusted_devices_enabled: boolean;
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
  const [activeTab, setActiveTab] = useState<'business' | 'loyalty' | 'subscription' | 'nfc' | 'security'>('business');
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAuthDeviceModal, setShowAuthDeviceModal] = useState(false);
  const [showResetShopPinModal, setShowResetShopPinModal] = useState(false);
  const [showToggleTrustedDevicesModal, setShowToggleTrustedDevicesModal] = useState(false);
  const [trustedDevices, setTrustedDevices] = useState<any[]>([]);
  const [currentDeviceFingerprint, setCurrentDeviceFingerprint] = useState<string>('');

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

  // Check PIN unlock status on mount and if PIN needs to be set
  useEffect(() => {
    if (!shopId) return;

    const checkUnlockStatus = async () => {
      // First check if PIN is set
      const { data: shopData } = await supabase
        .from('shops')
        .select('owner_pin')
        .eq('id', shopId)
        .single();

      // If PIN not set, show create PIN modal instead
      if (!shopData?.owner_pin || shopData.owner_pin === '000000') {
        setIsUnlocked(false);
        setShowPinModal(false); // Don't show verify modal
        setShowChangePinModal(true); // Show create PIN modal
        return;
      }

      // PIN is set - check unlock status
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

      // Load trusted devices
      await loadTrustedDevices();
      
      // Initialize device fingerprint
      const fingerprint = storeDeviceFingerprint();
      setCurrentDeviceFingerprint(fingerprint);
    } catch (error) {
      console.error('Error loading shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrustedDevices = async () => {
    if (!shopId) return;
    
    try {
      const { data, error } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrustedDevices(data || []);
    } catch (error) {
      console.error('Error loading trusted devices:', error);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    const confirmed = confirm(
      'Revoke access for this device?\n\n' +
      'Staff will no longer be able to clock in from this device without GPS verification.'
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('trusted_devices')
        .update({ is_active: false })
        .eq('id', deviceId);

      if (error) throw error;

      setMessage({ type: 'success', text: '✓ Device access revoked' });
      setTimeout(() => setMessage(null), 3000);
      await loadTrustedDevices();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to revoke device' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleReactivateDevice = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('trusted_devices')
        .update({ is_active: true })
        .eq('id', deviceId);

      if (error) throw error;

      setMessage({ type: 'success', text: '✓ Device reactivated' });
      setTimeout(() => setMessage(null), 3000);
      await loadTrustedDevices();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to reactivate device' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatRelativeTime = (date: string | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  const currentDeviceIsTrusted = trustedDevices.some(
    d => d.device_fingerprint === currentDeviceFingerprint && d.is_active
  );

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

  // saveFeatureSettings removed - features tab no longer exists

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
            <button
              onClick={() => setActiveTab('security')}
              className={`tab ${activeTab === 'security' ? 'active' : ''}`}
            >
              Security
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

          {activeTab === 'security' && (
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Security Settings</h2>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Owner PIN</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Your 6-digit PIN protects sensitive settings. Change it regularly for better security.
                    </p>
                    {shop.owner_pin && shop.owner_pin !== '000000' ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-800">
                          <strong>Current Status:</strong> PIN is set and active. You can change it below.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-yellow-800">
                          <strong>Action Required:</strong> PIN not set. Please create a PIN to secure your settings.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowChangePinModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  <KeyRound className="w-4 h-4" />
                  {shop.owner_pin && shop.owner_pin !== '000000' ? 'Change PIN' : 'Create PIN'}
                </button>
              </div>

              {/* SHOP PIN & PORTAL LINKS SECTION */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🏪 Shop PIN & Portal Access</h3>
                
                {/* Shop PIN Configuration */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shop PIN (6 digits)
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      {shop.shop_pin ? (
                        <div className="flex items-center gap-3">
                          <code className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-lg font-mono font-semibold">
                            {shop.shop_pin}
                          </code>
                          <button
                            onClick={async () => {
                              const newPin = prompt('Enter new 6-digit shop PIN:');
                              if (newPin && newPin.length === 6 && /^\d{6}$/.test(newPin)) {
                                const { error } = await supabase
                                  .from('shops')
                                  .update({ shop_pin: newPin })
                                  .eq('id', shopId);
                                if (error) {
                                  alert('Failed to update shop PIN');
                                } else {
                                  alert('Shop PIN updated successfully');
                                  await loadShop();
                                }
                              } else if (newPin) {
                                alert('PIN must be exactly 6 digits');
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Change Shop PIN
                          </button>
                          <button
                            onClick={() => setShowResetShopPinModal(true)}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                            title="Reset shop PIN (requires owner PIN verification)"
                          >
                            Reset Shop PIN
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={async () => {
                              // Generate random PIN
                              const firstDigit = Math.floor(Math.random() * 9) + 1; // 1-9
                              const restDigits = Math.floor(Math.random() * 100000); // 0-99999
                              const generatedPin = firstDigit.toString() + restDigits.toString().padStart(5, '0');
                              
                              const useGenerated = confirm(
                                `Generated Shop PIN: ${generatedPin}\n\nUse this PIN?`
                              );
                              
                              if (useGenerated) {
                                const { error } = await supabase
                                  .from('shops')
                                  .update({ shop_pin: generatedPin })
                                  .eq('id', shopId);
                                if (error) {
                                  alert('Failed to set shop PIN');
                                } else {
                                  alert(`Shop PIN set to: ${generatedPin}\n\nShare this PIN with your staff!`);
                                  await loadShop();
                                }
                              } else {
                                const newPin = prompt('Enter 6-digit shop PIN for tablet access:');
                                if (newPin && newPin.length === 6 && /^\d{6}$/.test(newPin)) {
                                  const { error } = await supabase
                                    .from('shops')
                                    .update({ shop_pin: newPin })
                                    .eq('id', shopId);
                                  if (error) {
                                    alert('Failed to set shop PIN');
                                  } else {
                                    alert('Shop PIN set successfully');
                                    await loadShop();
                                  }
                                } else if (newPin) {
                                  alert('PIN must be exactly 6 digits');
                                }
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            Generate Shop PIN
                          </button>
                          <span className="text-sm text-gray-600">or</span>
                          <button
                            onClick={async () => {
                              const newPin = prompt('Enter 6-digit shop PIN for tablet access:');
                              if (newPin && newPin.length === 6 && /^\d{6}$/.test(newPin)) {
                                const { error } = await supabase
                                  .from('shops')
                                  .update({ shop_pin: newPin })
                                  .eq('id', shopId);
                                if (error) {
                                  alert('Failed to set shop PIN');
                                } else {
                                  alert('Shop PIN set successfully');
                                  await loadShop();
                                }
                              } else if (newPin) {
                                alert('PIN must be exactly 6 digits');
                              }
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                          >
                            Set Custom PIN
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    This PIN is used to unlock the shop tablet. All staff share this PIN to access the tablet, 
                    then enter their own PIN for each action (clock in, check in customer).
                  </p>
                  {shop.shop_pin && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ Forgot shop PIN? Use "Reset Shop PIN" - requires your owner PIN for security.
                    </p>
                  )}
                </div>

                {/* Portal Links */}
                {shop.short_code && (
                  <div className="space-y-4">
                    {/* Shop Tablet Portal */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                            🏪 Shop Tablet Portal
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">For Shared Tablet</span>
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Open this on your shop tablet. All staff use the same shop PIN to access, 
                            then enter their own PIN for each action.
                          </p>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={`${window.location.origin}/shop/${shop.short_code}`}
                              readOnly
                              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/shop/${shop.short_code}`);
                                alert('Shop portal link copied!');
                              }}
                              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                            >
                              📋 Copy
                            </button>
                          </div>
                          {shop.shop_pin && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-900">
                                <strong>Shop PIN:</strong> <code className="font-mono font-semibold">{shop.shop_pin}</code>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Staff Personal Portal */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                            📱 Staff Personal Portal
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">For Personal Phones</span>
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Staff use this on their personal phones to view their hours, wages, 
                            and clock in/out remotely. Each staff logs in with their own PIN.
                          </p>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={`${window.location.origin}/staff/${shop.short_code}`}
                              readOnly
                              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/staff/${shop.short_code}`);
                                alert('Staff portal link copied!');
                              }}
                              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                            >
                              📋 Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!shop.short_code && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      Short code not available. Portal links will be generated once short code is created.
                    </p>
                  </div>
                )}
              </div>

              {/* TRUSTED DEVICES SECTION */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
                <div className="flex items-start gap-3 mb-4">
                  <Smartphone className="w-6 h-6 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">📱 Trusted Devices</h3>
                      {/* Enable/Disable Toggle */}
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${shop.trusted_devices_enabled ? 'text-green-700' : 'text-gray-600'}`}>
                          {shop.trusted_devices_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <button
                          onClick={() => setShowToggleTrustedDevicesModal(true)}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            shop.trusted_devices_enabled
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                          title="Critical setting - requires owner PIN and password"
                        >
                          {shop.trusted_devices_enabled ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Authorize devices (tablets, computers) that are always at your shop. 
                      Staff can clock in from trusted devices without GPS verification.
                    </p>
                    {!shop.trusted_devices_enabled && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-yellow-800">
                          <strong>⚠️ Trusted Devices is disabled.</strong> All clock-ins require GPS verification, 
                          even from shop tablets. Enable this feature to allow trusted devices to bypass GPS.
                        </p>
                      </div>
                    )}

                    {/* Current Device Status */}
                    {shop.trusted_devices_enabled ? (
                      <div className={`rounded-lg p-4 mb-4 ${currentDeviceIsTrusted ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                        <strong className={currentDeviceIsTrusted ? 'text-green-900' : 'text-yellow-900'}>This Device:</strong>
                        {currentDeviceIsTrusted ? (
                          <p className="mb-0 mt-2 text-green-800 text-sm">
                            ✓ This device is trusted. Staff can clock in without GPS verification.
                          </p>
                        ) : (
                          <>
                            <p className="mb-2 mt-2 text-yellow-800 text-sm">
                              ⚠️ This device is NOT trusted. Staff will need GPS verification to clock in.
                            </p>
                            <button
                              onClick={() => setShowAuthDeviceModal(true)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              Authorize This Device
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-gray-600">
                          Trusted devices feature is disabled. Enable it above to authorize devices.
                        </p>
                      </div>
                    )}

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <strong className="text-blue-900">💡 When to use trusted devices:</strong>
                      <ul className="mb-0 mt-2 text-blue-800 text-sm space-y-1">
                        <li><strong>Shop tablet/computer:</strong> Always at counter → Authorize it</li>
                        <li><strong>Staff personal phones:</strong> They take home → Don't authorize (use GPS)</li>
                      </ul>
                    </div>

                    {/* List of Trusted Devices */}
                    {trustedDevices.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Authorized Devices ({trustedDevices.filter(d => d.is_active).length})
                        </h4>
                        
                        <div className="space-y-3">
                          {trustedDevices.map(device => (
                            <div key={device.id} className={`border rounded-lg p-4 ${!device.is_active ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h5 className="font-semibold text-gray-900">{device.device_name}</h5>
                                    {device.is_active ? (
                                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Active</span>
                                    ) : (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">Revoked</span>
                                    )}
                                  </div>

                                  <div className="text-sm text-gray-600 space-y-1">
                                    <p>Authorized: {formatDate(device.authorized_at)}</p>
                                    {device.last_used_at && (
                                      <p>Last used: {formatRelativeTime(device.last_used_at)}</p>
                                    )}
                                    {device.notes && (
                                      <p className="text-gray-700">Note: {device.notes}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex gap-2 ml-4">
                                  {device.is_active ? (
                                    <button
                                      onClick={() => handleRevokeDevice(device.id)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Revoke access"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleReactivateDevice(device.id)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Reactivate"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {trustedDevices.length === 0 && shop.trusted_devices_enabled && (
                      <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-600 mb-3">No trusted devices yet.</p>
                        <button
                          onClick={() => setShowAuthDeviceModal(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Authorize This Device
                        </button>
                      </div>
                    )}
                    {trustedDevices.length === 0 && !shop.trusted_devices_enabled && (
                      <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-600">Enable trusted devices above to authorize devices.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* DANGER ZONE */}
              <div className="danger-zone-section mt-8">
                <div className="danger-zone-header">
                  <h2 className="text-xl font-semibold mb-2">⚠️ Danger Zone</h2>
                  <p className="text-sm text-gray-600">
                    Irreversible actions. Please be careful.
                  </p>
                </div>

                <div className="danger-zone-content">
                  {/* Cancel Subscription */}
                  <div className="danger-action">
                    <div className="danger-action-info">
                      <h3 className="text-lg font-semibold mb-2">Cancel Subscription</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Stop your subscription to DigiGet. Access ends at the end of 
                        your current billing period. Your data will be kept for 30 days 
                        in case you want to reactivate.
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>✓ Data preserved for 30 days</li>
                        <li>✓ Can reactivate anytime</li>
                        <li>✓ No refund for unused time</li>
                      </ul>
                    </div>
                    <div className="danger-action-button">
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                        disabled={shop.subscription_status === 'cancelled'}
                      >
                        Cancel Subscription
                      </button>
                    </div>
                  </div>

                  {/* Delete Account */}
                  <div className="danger-action">
                    <div className="danger-action-info">
                      <h3 className="text-lg font-semibold mb-2">Delete Account</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Permanently delete your shop account and all associated data. 
                        This includes all staff, customers, clock history, and loyalty points. 
                        This action CANNOT be undone.
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>❌ All staff deleted</li>
                        <li>❌ All customers deleted</li>
                        <li>❌ All clock history deleted</li>
                        <li>❌ Cannot be recovered</li>
                      </ul>
                    </div>
                    <div className="danger-action-button">
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                      >
                        Delete Account
                      </button>
                    </div>
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

      {/* Cancel Subscription Modal */}
      {showCancelModal && shop && (
        <CancelSubscriptionModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          shop={shop}
        />
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && shop && (
        <DeleteAccountModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          shop={shop}
        />
      )}

      {/* Change PIN Modal */}
      {showChangePinModal && shop && (
        <ChangeOwnerPinModal
          shopId={shop.id}
          currentPin={shop.owner_pin}
          isFirstTime={!shop.owner_pin || shop.owner_pin === '000000'}
          onSuccess={() => {
            setShowChangePinModal(false);
            setMessage({ type: 'success', text: shop.owner_pin === '000000' || !shop.owner_pin ? 'PIN created successfully!' : 'PIN changed successfully!' });
            setTimeout(() => setMessage(null), 3000);
            // Unlock settings after creating PIN
            sessionStorage.setItem(`owner_unlocked_${shop.id}`, 'true');
            sessionStorage.setItem(`owner_unlock_time_${shop.id}`, Date.now().toString());
            setIsUnlocked(true);
            // Reload shop to get updated PIN
            loadShop();
          }}
          onCancel={() => {
            setShowChangePinModal(false);
            // If first time and cancelled, redirect to dashboard
            if (!shop.owner_pin || shop.owner_pin === '000000') {
              navigate('/dashboard');
            }
          }}
        />
      )}

      {/* Authorize Device Modal */}
      {showAuthDeviceModal && shopId && (
        <AuthorizeDeviceModal
          isOpen={showAuthDeviceModal}
          onClose={() => setShowAuthDeviceModal(false)}
          shopId={shopId}
          onSuccess={() => {
            setShowAuthDeviceModal(false);
            loadTrustedDevices();
          }}
        />
      )}

      {showResetShopPinModal && shopId && (
        <ResetShopPinModal
          isOpen={showResetShopPinModal}
          onClose={() => setShowResetShopPinModal(false)}
          shopId={shopId}
          onSuccess={(newPin) => {
            setShowResetShopPinModal(false);
            loadShop();
            setMessage({
              type: 'success',
              text: `Shop PIN reset successfully! New PIN: ${newPin}. Share this with your staff.`
            });
            setTimeout(() => setMessage(null), 5000);
          }}
        />
      )}

      {showToggleTrustedDevicesModal && shopId && (
        <ToggleTrustedDevicesModal
          isOpen={showToggleTrustedDevicesModal}
          onClose={() => setShowToggleTrustedDevicesModal(false)}
          shopId={shopId}
          currentValue={shop.trusted_devices_enabled}
          onSuccess={() => {
            setShowToggleTrustedDevicesModal(false);
            loadShop();
            setMessage({
              type: 'success',
              text: `Trusted devices ${shop.trusted_devices_enabled ? 'disabled' : 'enabled'} successfully.`
            });
            setTimeout(() => setMessage(null), 5000);
          }}
        />
      )}
    </>
  );
}
