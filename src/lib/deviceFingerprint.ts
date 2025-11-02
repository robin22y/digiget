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

    return !!data && !error;
  } catch (error) {
    console.error('Error checking device trust:', error);
    return false;
  }
}

