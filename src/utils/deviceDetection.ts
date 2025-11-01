/**
 * Get device information from browser
 */
export function getDeviceInfo() {
  const navigator = window.navigator;
  
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    vendor: navigator.vendor,
    language: navigator.language,
    languages: navigator.languages?.join(', ') || navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    deviceMemory: (navigator as any).deviceMemory || null,
    hardwareConcurrency: navigator.hardwareConcurrency || null,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

/**
 * Get user's IP address using a public API
 */
export async function getIPAddress(): Promise<string | null> {
  try {
    // Try multiple IP detection services as fallback
    const services = [
      'https://api.ipify.org?format=json',
      'https://ipapi.co/json/',
      'https://api64.ipify.org?format=json',
    ];

    for (const service of services) {
      try {
        const response = await fetch(service, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Different services return IP in different fields
          return data.ip || data.query || data.address || null;
        }
      } catch (error) {
        console.warn(`IP detection service ${service} failed:`, error);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting IP address:', error);
    return null;
  }
}

/**
 * Create a notification entry for shop security tracking
 */
export async function createShopNotification(
  shopId: string,
  notificationType: 'login_attempt' | 'clock_in_attempt' | 'remote_access',
  options: {
    title: string;
    message: string;
    employeeId?: string | null;
    employeeName?: string | null;
    attemptLatitude?: number | null;
    attemptLongitude?: number | null;
    distanceFromShop?: number | null;
    locationName?: string | null;
  }
) {
  try {
    const { supabase } = await import('../lib/supabase');
    
    const deviceInfo = getDeviceInfo();
    const ipAddress = await getIPAddress();

    const { error } = await supabase
      .from('shop_notifications')
      .insert({
        shop_id: shopId,
        notification_type: notificationType,
        title: options.title,
        message: options.message,
        employee_id: options.employeeId || null,
        employee_name: options.employeeName || null,
        attempt_latitude: options.attemptLatitude || null,
        attempt_longitude: options.attemptLongitude || null,
        distance_from_shop: options.distanceFromShop || null,
        location_name: options.locationName || null,
        device_info: deviceInfo,
        ip_address: ipAddress,
      });

    if (error) {
      console.error('Error creating shop notification:', error);
      // Don't throw - notifications are non-critical
    }
  } catch (error) {
    console.error('Error creating shop notification:', error);
    // Fail silently - notifications shouldn't block operations
  }
}

