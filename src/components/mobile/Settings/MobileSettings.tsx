import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Heart, Clock, Shield, CreditCard, 
  MapPin, ChevronRight, Trash2
} from 'lucide-react';
import BusinessSettingsMobile from './BusinessSettingsMobile';
import LoyaltySettingsMobile from './LoyaltySettingsMobile';
import ClockInSettingsMobile from './ClockInSettingsMobile';
import SecuritySettingsMobile from './SecuritySettingsMobile';
import SubscriptionSettingsMobile from './SubscriptionSettingsMobile';
import BackButton from '../BackButton';

interface MobileSettingsProps {
  shopId: string;
  shopName: string;
  ownerName: string;
  businessCategory: string;
  latitude?: string;
  longitude?: string;
  loyaltyEnabled: boolean;
  pointsType: 'per_visit' | 'per_spend';
  pointsNeeded: number;
  daysBetweenPoints: number;
  rewardType: 'free_product' | 'fixed_discount' | 'percentage_discount';
  rewardValue: string;
  rewardDescription: string;
  qrCodeEnabled: boolean;
  nfcEnabled: boolean;
  tabletPinEnabled: boolean;
  gpsEnabled: boolean;
  planType: 'basic' | 'pro';
  subscriptionStatus: string;
  trialEndsAt?: string | null;
  subscriptionStartedAt?: string | null;
  trustedDevices: any[];
  currentDeviceFingerprint: string;
  onNavigateToSubPage?: (tab: string) => void;
  onCancelSubscription?: () => void;
}

export default function MobileSettings({
  shopId,
  shopName,
  ownerName,
  businessCategory,
  latitude,
  longitude,
  loyaltyEnabled,
  pointsType,
  pointsNeeded,
  daysBetweenPoints,
  rewardType,
  rewardValue,
  rewardDescription,
  qrCodeEnabled,
  nfcEnabled,
  tabletPinEnabled,
  gpsEnabled,
  planType,
  subscriptionStatus,
  trialEndsAt,
  subscriptionStartedAt,
  trustedDevices,
  currentDeviceFingerprint,
  onNavigateToSubPage,
  onCancelSubscription,
}: MobileSettingsProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleTabClick = (tab: string) => {
    console.log('Tab clicked:', tab);
    setActiveTab(tab);
    if (onNavigateToSubPage) {
      onNavigateToSubPage(tab);
    }
  };

  const handleBack = () => {
    setActiveTab(null);
  };

  // If a sub-page is active, render it
  if (activeTab === 'business') {
    return (
      <BusinessSettingsMobile
        shopId={shopId}
        shopName={shopName}
        ownerName={ownerName}
        businessCategory={businessCategory}
        latitude={latitude}
        longitude={longitude}
        onBack={handleBack}
        onSave={(data) => {
          console.log('Settings saved:', data);
        }}
      />
    );
  }

  if (activeTab === 'loyalty') {
    return (
      <LoyaltySettingsMobile
        shopId={shopId}
        loyaltyEnabled={loyaltyEnabled}
        pointsType={pointsType}
        pointsNeeded={pointsNeeded}
        daysBetweenPoints={daysBetweenPoints}
        rewardType={rewardType}
        rewardValue={rewardValue}
        rewardDescription={rewardDescription}
        onBack={handleBack}
        onSave={(data) => {
          console.log('Loyalty settings saved:', data);
        }}
      />
    );
  }

  if (activeTab === 'nfc') {
    return (
      <ClockInSettingsMobile
        shopId={shopId}
        qrCodeEnabled={qrCodeEnabled}
        nfcEnabled={nfcEnabled}
        tabletPinEnabled={tabletPinEnabled}
        gpsEnabled={gpsEnabled}
        onBack={handleBack}
        onSave={(data) => {
          console.log('Clock-in settings saved:', data);
        }}
      />
    );
  }

  if (activeTab === 'security') {
    return (
      <SecuritySettingsMobile
        shopId={shopId}
        latitude={latitude}
        longitude={longitude}
        trustedDevices={trustedDevices}
        currentDeviceFingerprint={currentDeviceFingerprint}
        onBack={handleBack}
        onUpdateLocation={() => {
          // Reload trusted devices if needed
        }}
      />
    );
  }

  if (activeTab === 'subscription') {
    return (
      <SubscriptionSettingsMobile
        planType={planType}
        subscriptionStatus={subscriptionStatus}
        trialEndsAt={trialEndsAt}
        subscriptionStartedAt={subscriptionStartedAt}
        onBack={handleBack}
        onCancelSubscription={onCancelSubscription}
      />
    );
  }

  // Main settings menu
  return (
    <div className="md:hidden bg-[#f7f8fa] min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Settings</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* BUSINESS INFORMATION */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">Business</h2>
          <button
            type="button"
            onClick={() => handleTabClick('business')}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow active:scale-98 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2F80ED] rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">Business Information</div>
                <div className="text-xs text-gray-600">{shopName || 'Shop name'}</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* LOYALTY PROGRAM */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">Loyalty</h2>
          <button
            type="button"
            onClick={() => handleTabClick('loyalty')}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow active:scale-98 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F2994A] rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">Loyalty Program</div>
                <div className="text-xs text-gray-600">
                  {loyaltyEnabled ? `${pointsNeeded} points = ${rewardDescription || 'reward'}` : 'Disabled'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* CLOCK-IN METHODS */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">Clock-In</h2>
          <button
            type="button"
            onClick={() => handleTabClick('nfc')}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow active:scale-98 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#9B59B6] rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">Clock-In Methods</div>
                <div className="text-xs text-gray-600">
                  {[qrCodeEnabled && 'QR Code', nfcEnabled && 'NFC', tabletPinEnabled && 'Tablet PIN', gpsEnabled && 'GPS'].filter(Boolean).join(' • ') || 'None enabled'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* SECURITY & LOCATION */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">Security</h2>
          <button
            type="button"
            onClick={() => handleTabClick('security')}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow active:scale-98 mb-3 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6366F1] rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">Security & Location</div>
                <div className="text-xs text-gray-600">Trusted devices, PIN, location</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          {latitude && longitude && (
            <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#27AE60] rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <div className="text-sm font-semibold text-gray-900">Shop Location</div>
                <div className="text-xs text-gray-600">
                  {latitude.slice(0, 7)}, {longitude.slice(0, 7)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SUBSCRIPTION */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">Subscription</h2>
          <button
            type="button"
            onClick={() => handleTabClick('subscription')}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow active:scale-98 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#27AE60] rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">Subscription</div>
                <div className="text-xs text-gray-600">
                  {planType === 'pro' ? 'Pro Plan' : 'Basic Plan'} • {subscriptionStatus === 'active' ? 'Active' : subscriptionStatus === 'trial' ? 'Trial' : 'Cancelled'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* DANGER ZONE */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">Danger Zone</h2>
          <div className="space-y-3">
            <button
              onClick={() => handleTabClick('cancel-subscription')}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-red-200 flex items-center justify-between hover:shadow-md transition-shadow active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-red-600">Cancel Subscription</div>
                  <div className="text-xs text-gray-600">End subscription at billing period</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={() => handleTabClick('delete-account')}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-red-200 flex items-center justify-between hover:shadow-md transition-shadow active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-red-600">Delete Account</div>
                  <div className="text-xs text-gray-600">Permanently delete all data</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

