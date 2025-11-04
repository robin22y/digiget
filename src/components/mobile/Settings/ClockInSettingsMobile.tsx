import { useState } from 'react';
import { Save, Clock } from 'lucide-react';
import BackButton from '../BackButton';
import { supabase } from '../../../lib/supabase';

interface ClockInSettingsMobileProps {
  shopId: string;
  qrCodeEnabled: boolean;
  nfcEnabled: boolean;
  tabletPinEnabled: boolean;
  gpsEnabled: boolean;
  onBack: () => void;
  onSave?: (data: any) => void;
}

export default function ClockInSettingsMobile({
  shopId,
  qrCodeEnabled: initialQrCodeEnabled,
  nfcEnabled: initialNfcEnabled,
  tabletPinEnabled: initialTabletPinEnabled,
  gpsEnabled: initialGpsEnabled,
  onBack,
  onSave,
}: ClockInSettingsMobileProps) {
  const [qrCodeEnabled, setQrCodeEnabled] = useState(initialQrCodeEnabled);
  const [nfcEnabled, setNfcEnabled] = useState(initialNfcEnabled);
  const [tabletPinEnabled, setTabletPinEnabled] = useState(initialTabletPinEnabled);
  const [gpsEnabled, setGpsEnabled] = useState(initialGpsEnabled);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // First, try to update with all columns including gps_enabled
      let updateData: any = {
        qr_code_enabled: qrCodeEnabled,
        nfc_enabled: nfcEnabled,
        tablet_pin_enabled: tabletPinEnabled,
        gps_enabled: gpsEnabled,
      };

      let { error } = await supabase
        .from('shops')
        .update(updateData)
        .eq('id', shopId);

      // If error is about missing gps_enabled column, retry without it
      if (error && error.code === 'PGRST204' && error.message?.includes('gps_enabled')) {
        updateData = {
          qr_code_enabled: qrCodeEnabled,
          nfc_enabled: nfcEnabled,
          tablet_pin_enabled: tabletPinEnabled,
        };

        const { error: retryError } = await supabase
          .from('shops')
          .update(updateData)
          .eq('id', shopId);
        
        if (retryError) throw retryError;
      } else if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Clock-in settings saved successfully!' });
      
      if (onSave) {
        onSave({ qrCodeEnabled, nfcEnabled, tabletPinEnabled, gpsEnabled });
      }

      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving clock-in settings:', error);
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
          <h1 className="text-lg font-bold text-gray-900">Clock-In Methods</h1>
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

        {/* QR Code Toggle */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2F80ED] rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">QR Code</div>
                <div className="text-xs text-gray-600">Staff scan QR code to clock in</div>
              </div>
            </div>
            <button
              onClick={() => setQrCodeEnabled(!qrCodeEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                qrCodeEnabled ? 'bg-[#27AE60]' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                qrCodeEnabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* NFC Toggle */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#9B59B6] rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">NFC Tag</div>
                <div className="text-xs text-gray-600">Tap NFC tag to clock in</div>
              </div>
            </div>
            <button
              onClick={() => setNfcEnabled(!nfcEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                nfcEnabled ? 'bg-[#27AE60]' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                nfcEnabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Tablet PIN Toggle */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2F80ED] rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Tablet PIN</div>
                <div className="text-xs text-gray-600">Enter PIN on tablet to clock in</div>
              </div>
            </div>
            <button
              onClick={() => setTabletPinEnabled(!tabletPinEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                tabletPinEnabled ? 'bg-[#27AE60]' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                tabletPinEnabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* GPS Toggle */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6366F1] rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">GPS Location</div>
                <div className="text-xs text-gray-600">Use location for clock-in verification</div>
              </div>
            </div>
            <button
              onClick={() => setGpsEnabled(!gpsEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                gpsEnabled ? 'bg-[#27AE60]' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                gpsEnabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>
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

