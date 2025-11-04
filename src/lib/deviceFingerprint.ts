import { supabase } from './supabase';

/**
 * Generate unique device fingerprint
 * This identifies the device without tracking user personally
 */
export function generateDeviceFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth.toString(),
    new Date().getTimezoneOffset().toString(),
    (window.sessionStorage ? '1' : '0'),
    (window.localStorage ? '1' : '0'),
    navigator.hardwareConcurrency?.toString() || '0',
    (navigator as any).deviceMemory?.toString() || '0',
  ];

  const fingerprint = components.join('|');
  
  // Hash it for privacy
  return hashString(fingerprint);
}

/**
 * Simple hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Store device fingerprint in localStorage
 */
export function storeDeviceFingerprint(): string {
  let fingerprint = localStorage.getItem('device_fingerprint');
  
  if (!fingerprint) {
    fingerprint = generateDeviceFingerprint();
    localStorage.setItem('device_fingerprint', fingerprint);
  }
  
  return fingerprint;
}

/**
 * Get stored device fingerprint
 */
export function getDeviceFingerprint(): string | null {
  return localStorage.getItem('device_fingerprint');
}

/**
 * Check if current device is trusted for this shop
 */
export async function isDeviceTrusted(shopId: string): Promise<boolean> {
  const fingerprint = getDeviceFingerprint();
  
  if (!fingerprint) return false;

  try {
    const { data, error } = await supabase
      .from('trusted_devices')
      .select('is_active')
      .eq('shop_id', shopId)
      .eq('device_fingerprint', fingerprint)
      .eq('is_active', true)
      .maybeSingle();

    if (data && !error) {
      // Update last used time
      await supabase
        .from('trusted_devices')
        .update({ last_used_at: new Date().toISOString() })
        .eq('device_fingerprint', fingerprint);
      
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking device trust:', error);
    return false;
  }
}

/**
 * Authorize current device as trusted for a shop
 */
export async function authorizeDevice(
  shopId: string, 
  authorizedBy: string,
  deviceName?: string
): Promise<{ success: boolean; error?: string }> {
  const fingerprint = storeDeviceFingerprint();

  try {
    // Check if already authorized
    const { data: existing } = await supabase
      .from('trusted_devices')
      .select('*')
      .eq('device_fingerprint', fingerprint)
      .eq('shop_id', shopId)
      .maybeSingle();

    if (existing) {
      // Already authorized, just update
      const { error: updateError } = await supabase
        .from('trusted_devices')
        .update({ 
          is_active: true,
          last_used_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;
      return { success: true };
    }

    // Create new authorization
    const { error: insertError } = await supabase
      .from('trusted_devices')
      .insert({
        shop_id: shopId,
        device_name: deviceName || 'Shop Tablet',
        device_fingerprint: fingerprint,
        authorized_by: authorizedBy,
        is_active: true,
        authorized_at: new Date().toISOString()
      });

    if (insertError) throw insertError;
    return { success: true };
  } catch (error: any) {
    console.error('Error authorizing device:', error);
    return { success: false, error: error.message || 'Failed to authorize device' };
  }
}

/**
 * Revoke/Deauthorize a trusted device
 */
export async function revokeDevice(
  shopId: string,
  deviceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update device to inactive - revoked_at column may not exist, so we only update is_active
    const { error: updateError } = await supabase
      .from('trusted_devices')
      .update({ 
        is_active: false
      })
      .eq('id', deviceId)
      .eq('shop_id', shopId);

    if (updateError) throw updateError;
    return { success: true };
  } catch (error: any) {
    console.error('Error revoking device:', error);
    return { success: false, error: error.message || 'Failed to revoke device' };
  }
}

/**
 * Revoke all trusted devices for a shop
 */
export async function revokeAllDevices(
  shopId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Revoke all active devices - revoked_at column may not exist, so we only update is_active
    const { error: updateError } = await supabase
      .from('trusted_devices')
      .update({ 
        is_active: false
      })
      .eq('shop_id', shopId)
      .eq('is_active', true);

    if (updateError) throw updateError;
    return { success: true };
  } catch (error: any) {
    console.error('Error revoking all devices:', error);
    return { success: false, error: error.message || 'Failed to revoke devices' };
  }
}

