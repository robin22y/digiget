import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getDeviceFingerprint } from '../lib/deviceFingerprint';

interface AuthorizeDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  onSuccess: () => void;
}

export function AuthorizeDeviceModal({ 
  isOpen, 
  onClose, 
  shopId, 
  onSuccess 
}: AuthorizeDeviceModalProps) {
  const [deviceName, setDeviceName] = useState('');
  const [notes, setNotes] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleAuthorize() {
    setLoading(true);
    setError('');

    try {
      // Verify owner PIN
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('owner_pin, user_id')
        .eq('id', shopId)
        .single();

      if (shopError) throw new Error('Failed to verify PIN');

      if (shopData.owner_pin !== pin) {
        setError('Incorrect PIN');
        setPin('');
        setLoading(false);
        return;
      }

      // Get device fingerprint
      const fingerprint = getDeviceFingerprint();
      if (!fingerprint) {
        throw new Error('Failed to identify device');
      }

      // Check if already exists
      const { data: existing } = await supabase
        .from('trusted_devices')
        .select('id')
        .eq('shop_id', shopId)
        .eq('device_fingerprint', fingerprint)
        .maybeSingle();

      if (existing) {
        // If exists but inactive, reactivate it
        const { error: updateError } = await supabase
          .from('trusted_devices')
          .update({
            is_active: true,
            device_name: deviceName || 'Unnamed Device',
            notes: notes || null,
            authorized_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
        alert('✓ Device reactivated successfully!');
        onSuccess();
        return;
      }

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();

      // Authorize device
      const { error: insertError } = await supabase
        .from('trusted_devices')
        .insert({
          shop_id: shopId,
          device_name: deviceName || 'Unnamed Device',
          device_fingerprint: fingerprint,
          authorized_by: user?.id || shopData.user_id,
          notes: notes || null,
          is_active: true
        });

      if (insertError) throw insertError;

      alert('✓ Device authorized successfully!');
      onSuccess();

    } catch (err: any) {
      console.error('Authorization error:', err);
      setError(err.message || 'Failed to authorize device. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Authorize This Device</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="mb-4 text-gray-700">
            Authorize this shared shop device (tablet/computer) as a trusted device. 
            Staff will be able to clock in/out from this device without GPS verification 
            since it's physically located at your shop.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <strong className="text-yellow-900">⚠️ Important:</strong>
            <p className="mb-0 mt-2 text-yellow-800 text-sm">
              Only authorize devices that are physically at your shop (like the counter tablet). 
              This allows staff to clock in/out and check in customers without GPS tracking. 
              Don't authorize staff personal phones - they should use GPS verification.
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Device Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Counter Tablet, Reception iPad"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              autoFocus
            />
            <span className="text-xs text-gray-500 mt-1 block">
              Give this device a name so you can identify it later
            </span>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="e.g., Black iPad at front desk"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Owner PIN
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={6}
              placeholder="Enter your 6-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            />
            <span className="text-xs text-gray-500 mt-1 block">
              Enter your owner PIN to authorize this device
            </span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button 
            onClick={onClose} 
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAuthorize}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!deviceName || pin.length !== 6 || loading}
          >
            {loading ? 'Authorizing...' : 'Authorize Device'}
          </button>
        </div>
      </div>
    </div>
  );
}

