/**
 * Geolocation utilities
 * Handles GPS verification and distance calculations
 */

export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export async function getCurrentPosition(
  options: {
    timeout?: number;
    enableHighAccuracy?: boolean;
    maximumAge?: number;
  } = {}
): Promise<Location | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported by this browser');
      resolve(null);
      return;
    }

    const timeout = options.timeout || 10000;
    let timeoutId: NodeJS.Timeout | null = null;

    const clearTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    timeoutId = setTimeout(() => {
      console.error('Geolocation request timed out');
      resolve(null);
    }, timeout);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimer();
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        clearTimer();
        console.error('Geolocation error:', {
          code: error.code,
          message: error.message,
        });
        resolve(null);
      },
      {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: timeout,
        maximumAge: options.maximumAge ?? 0, // Don't use cached positions
      }
    );
  });
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if user location is within allowed radius of shop
 */
export function isWithinRadius(
  userLocation: Location | null,
  shopLocation: { latitude: number; longitude: number },
  radiusMeters: number
): { within: boolean; distance?: number; message?: string } {
  if (!userLocation) {
    return {
      within: false,
      message: 'Could not get your location. Please enable GPS permissions.',
    };
  }

  // Validate locations
  if (
    !validateLocation(userLocation.latitude, userLocation.longitude) ||
    !validateLocation(shopLocation.latitude, shopLocation.longitude)
  ) {
    return {
      within: false,
      message: 'Invalid location coordinates.',
    };
  }

  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    shopLocation.latitude,
    shopLocation.longitude
  );

  // Check accuracy - if GPS accuracy is worse than radius, warn user
  if (userLocation.accuracy > radiusMeters) {
    return {
      within: distance <= radiusMeters,
      distance: Math.round(distance),
      message: `GPS accuracy is low (±${Math.round(userLocation.accuracy)}m). Please move to a location with better signal.`,
    };
  }

  return {
    within: distance <= radiusMeters,
    distance: Math.round(distance),
    message:
      distance > radiusMeters
        ? `You are ${Math.round(distance)}m away. Please move within ${radiusMeters}m of the shop.`
        : undefined,
  };
}

function validateLocation(latitude: number, longitude: number): boolean {
  return (
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

