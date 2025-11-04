import { useState } from 'react';
import { Shield, KeyRound, Smartphone, MapPin, ChevronRight } from 'lucide-react';
import BackButton from '../BackButton';
import ChangeOwnerPinModal from '../../../components/ChangeOwnerPinModal';
import { AuthorizeDeviceModal } from '../../../components/AuthorizeDeviceModal';
import ShopLocationSetup from '../../../components/ShopLocationSetup';
import { supabase } from '../../../lib/supabase';

interface SecuritySettingsMobileProps {
  shopId: string;
  latitude?: string;
  longitude?: string;
  trustedDevices: any[];
  currentDeviceFingerprint: string;
  onBack: () => void;
  onUpdateLocation?: () => void;
}

export default function SecuritySettingsMobile({
  shopId,
  latitude,
  longitude,
  trustedDevices: initialTrustedDevices,
  currentDeviceFingerprint,
  onBack,
  onUpdateLocation,
}: SecuritySettingsMobileProps) {
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [showAuthDeviceModal, setShowAuthDeviceModal] = useState(false);
  const [trustedDevices, setTrustedDevices] = useState(initialTrustedDevices);
  const [showLocationSetup, setShowLocationSetup] = useState(false);
  const [currentLatitude, setCurrentLatitude] = useState(latitude);
  const [currentLongitude, setCurrentLongitude] = useState(longitude);
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  return (
    <div className="md:hidden bg-[#f7f8fa] min-h-screen">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex items-center gap-3">
          <BackButton onClick={onBack} />
          <h1 className="text-lg font-bold text-gray-900">Security & Location</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Change PIN */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">PIN</h2>
          <button
            onClick={() => setShowChangePinModal(true)}
            className="w-full bg-white rounded-2xl p-4 border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6366F1] rounded-xl flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">Change Owner PIN</div>
                <div className="text-xs text-gray-600">Update your security PIN</div>
              </div>
            </div>
          </button>
        </div>

        {/* Trusted Devices */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">Trusted Devices</h2>
          <button
            onClick={() => setShowAuthDeviceModal(true)}
            className="w-full bg-white rounded-2xl p-4 border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow active:scale-98 mb-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2F80ED] rounded-xl flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">Authorize This Device</div>
                <div className="text-xs text-gray-600">Skip PIN on this device</div>
              </div>
            </div>
          </button>
          {trustedDevices.length > 0 && (
            <div className="space-y-2">
              {trustedDevices.map((device) => (
                <div key={device.id} className="bg-white rounded-2xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">
                        {device.device_name || 'Trusted Device'}
                      </div>
                      <div className="text-xs text-gray-600">
                        Added {new Date(device.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shop Location */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">Location</h2>
          {locationMessage && (
            <div className={`rounded-2xl p-4 mb-3 ${
              locationMessage.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="text-sm font-medium">{locationMessage.text}</div>
            </div>
          )}
          {currentLatitude && currentLongitude ? (
            <button
              type="button"
              onClick={() => setShowLocationSetup(true)}
              className="w-full bg-white rounded-2xl p-4 border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow active:scale-98 mb-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#27AE60] rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-gray-900">Shop Location</div>
                  <div className="text-xs text-gray-600">
                    {currentLatitude.slice(0, 7)}, {currentLongitude.slice(0, 7)}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowLocationSetup(true)}
              className="w-full bg-white rounded-2xl p-4 border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-gray-900">Set Shop Location</div>
                  <div className="text-xs text-gray-600">Tap to set your shop's location</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      {showChangePinModal && (
        <ChangeOwnerPinModal
          shopId={shopId}
          currentPin=""
          onSuccess={() => setShowChangePinModal(false)}
          onCancel={() => setShowChangePinModal(false)}
        />
      )}
      {showAuthDeviceModal && (
        <AuthorizeDeviceModal
          shopId={shopId}
          onClose={() => setShowAuthDeviceModal(false)}
          onSuccess={() => {
            setShowAuthDeviceModal(false);
            // Reload trusted devices
            if (onUpdateLocation) onUpdateLocation();
          }}
        />
      )}
      {showLocationSetup && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
            <BackButton onClick={() => setShowLocationSetup(false)} />
            <h1 className="text-lg font-bold text-gray-900">Set Shop Location</h1>
          </div>
          <div className="px-4 py-6">
            <ShopLocationSetup
              onLocationSet={async (locationData) => {
                setSavingLocation(true);
                setLocationMessage(null);
                
                try {
                  const { error } = await supabase
                    .from('shops')
                    .update({
                      latitude: locationData.latitude,
                      longitude: locationData.longitude,
                    })
                    .eq('id', shopId);

                  if (error) throw error;

                  setCurrentLatitude(locationData.latitude.toString());
                  setCurrentLongitude(locationData.longitude.toString());
                  setLocationMessage({ type: 'success', text: 'Shop location saved successfully!' });
                  
                  // Reload location if callback provided
                  if (onUpdateLocation) {
                    onUpdateLocation();
                  }

                  setTimeout(() => {
                    setShowLocationSetup(false);
                    setLocationMessage(null);
                  }, 2000);
                } catch (error: any) {
                  console.error('Error saving location:', error);
                  setLocationMessage({ type: 'error', text: error.message || 'Failed to save location' });
                } finally {
                  setSavingLocation(false);
                }
              }}
              initialLocation={
                currentLatitude && currentLongitude
                  ? {
                      latitude: parseFloat(currentLatitude),
                      longitude: parseFloat(currentLongitude),
                    }
                  : undefined
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

