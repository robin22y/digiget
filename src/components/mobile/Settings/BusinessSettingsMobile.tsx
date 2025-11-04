import { useState } from 'react';
import { Save } from 'lucide-react';
import BackButton from '../BackButton';
import ShopLocationSetup from '../../../components/ShopLocationSetup';
import { supabase } from '../../../lib/supabase';

interface BusinessSettingsMobileProps {
  shopId: string;
  shopName: string;
  ownerName: string;
  businessCategory: string;
  latitude?: string;
  longitude?: string;
  onBack: () => void;
  onSave?: (data: { shopName: string; ownerName: string; businessCategory: string }) => void;
}

export default function BusinessSettingsMobile({
  shopId,
  shopName: initialShopName,
  ownerName: initialOwnerName,
  businessCategory: initialBusinessCategory,
  latitude: initialLatitude,
  longitude: initialLongitude,
  onBack,
  onSave,
}: BusinessSettingsMobileProps) {
  const [shopName, setShopName] = useState(initialShopName);
  const [ownerName, setOwnerName] = useState(initialOwnerName);
  const [businessCategory, setBusinessCategory] = useState(initialBusinessCategory);
  const [latitude, setLatitude] = useState(initialLatitude || '');
  const [longitude, setLongitude] = useState(initialLongitude || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Save to database
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

      setMessage({ type: 'success', text: 'Business settings saved successfully!' });
      
      if (onSave) {
        onSave({ shopName, ownerName, businessCategory });
      }

      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving business settings:', error);
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
          <h1 className="text-lg font-bold text-gray-900">Business Settings</h1>
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

        {/* Shop Name */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Shop Name</label>
          <input
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="w-full px-4 py-3 bg-[#f7f8fa] border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-[#2F80ED] focus:border-transparent"
            placeholder="Enter your shop name"
          />
        </div>

        {/* Owner Name */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Owner Name</label>
          <input
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="w-full px-4 py-3 bg-[#f7f8fa] border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-[#2F80ED] focus:border-transparent"
            placeholder="Enter owner name"
          />
        </div>

        {/* Business Category */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Business Category</label>
          <select
            value={businessCategory}
            onChange={(e) => setBusinessCategory(e.target.value)}
            className="w-full px-4 py-3 bg-[#f7f8fa] border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-[#2F80ED] focus:border-transparent"
            disabled
          >
            <option value="hair_salon">Hair Salon / Barbershop</option>
          </select>
          <p className="text-xs text-gray-500 mt-2">Currently only available for Hair Salons / Barbershops</p>
        </div>

        {/* Shop Location Section */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Shop Location (Geofencing)</h3>
          <p className="text-xs text-gray-600 mb-4">
            Set your shop's location to enable geofencing. Staff members will need approval to clock in from more than 100 meters away.
          </p>
          
          {latitude && longitude ? (
            <div className="bg-white rounded-2xl p-4 border border-gray-200 mb-4">
              <div className="font-semibold text-sm text-gray-900 mb-2">Current Location:</div>
              <div className="text-sm text-gray-600 mb-3">
                Coordinates: {latitude}, {longitude}
              </div>
              <button
                onClick={() => {
                  setLatitude('');
                  setLongitude('');
                }}
                className="text-sm text-[#2F80ED] font-medium hover:underline"
              >
                Change Location
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-4 border border-gray-200">
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
            </div>
          )}
        </div>

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

