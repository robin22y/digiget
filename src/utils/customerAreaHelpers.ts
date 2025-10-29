/**
 * Helper functions for CustomerArea component
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function getDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Detect device type
 */
export function getDeviceType(): string {
  const ua = navigator.userAgent;
  
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
}

/**
 * Calculate remaining cooldown time in minutes
 * Returns 0 if cooldown has passed
 */
export function getCooldownRemaining(
  lastActionTime: string | null,
  limitMinutes: number
): number {
  if (!lastActionTime) return 0;
  
  const lastTime = new Date(lastActionTime).getTime();
  const now = Date.now();
  const elapsedMinutes = (now - lastTime) / (1000 * 60);
  const remaining = limitMinutes - elapsedMinutes;
  
  return Math.max(0, Math.ceil(remaining));
}

/**
 * Format cooldown time in a friendly way
 */
export function formatCooldown(minutes: number): string {
  if (minutes <= 0) return '';
  
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours}h ${mins}m`;
}

