import { supabase } from '../lib/supabase';

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface LocationError {
  code: number;
  message: string;
}

/**
 * Get user's current location with high accuracy
 * Returns promise that resolves with location or rejects with error
 */
export async function getCurrentLocation(): Promise<LocationResult> {
  return new Promise((resolve, reject) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocation is not supported by your browser. Please use a modern browser or enable location services.'
      });
      return;
    }

    // Options for high accuracy
    const options: PositionOptions = {
      enableHighAccuracy: true,  // Use GPS if available
      timeout: 15000,            // Wait up to 15 seconds
      maximumAge: 0              // Don't use cached position
    };

    // Get current position
    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy, // Accuracy in meters
          timestamp: position.timestamp
        });
      },
      // Error callback
      (error) => {
        let message = 'Failed to get location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message += 'You denied location access. Please enable location permissions in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            message += 'Location information is unavailable. Make sure GPS/location services are enabled.';
            break;
          case error.TIMEOUT:
            message += 'Location request timed out. Please try again.';
            break;
          default:
            message += 'An unknown error occurred.';
        }
        
        reject({
          code: error.code,
          message: message
        });
      },
      options
    );
  });
}

/**
 * Get location with multiple attempts for better accuracy
 * Takes the best (most accurate) reading from multiple attempts
 */
export async function getAccurateLocation(attempts: number = 3): Promise<LocationResult> {
  const results: LocationResult[] = [];
  
  // Try multiple times
  for (let i = 0; i < attempts; i++) {
    try {
      const location = await getCurrentLocation();
      results.push(location);
      
      // If we get very accurate reading (within 20m), use it immediately
      if (location.accuracy <= 20) {
        return location;
      }
      
      // Wait a bit between attempts for GPS to stabilize
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      // If all attempts fail, throw the last error
      if (i === attempts - 1) {
        throw error;
      }
      // Otherwise continue trying
    }
  }
  
  // Return the most accurate reading
  if (results.length === 0) {
    throw {
      code: -1,
      message: 'Failed to get location after multiple attempts.'
    };
  }
  
  return results.reduce((best, current) => 
    current.accuracy < best.accuracy ? current : best
  );
}

/**
 * Legacy function for backward compatibility
 */
export async function getCurrentPosition(): Promise<GeoLocation | null> {
  try {
    const location = await getCurrentLocation();
    return {
      latitude: location.latitude,
      longitude: location.longitude,
    };
  } catch (error) {
    console.warn('Geolocation error:', error);
    return null;
  }
}

export function formatLocation(lat: number | null, lng: number | null): string {
  if (lat === null || lng === null) return 'Location not available';
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export function getGoogleMapsLink(lat: number | null, lng: number | null): string | null {
  if (lat === null || lng === null) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/**
 * Calculate distance between two GPS points using Haversine formula
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
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Check if location is within allowed radius
 */
export function isWithinRadius(
  currentLat: number,
  currentLng: number,
  targetLat: number,
  targetLng: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(currentLat, currentLng, targetLat, targetLng);
  return distance <= radiusMeters;
}

/**
 * Get accuracy level string
 */
export function getAccuracyLevel(accuracy: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (accuracy <= 20) return 'excellent';
  if (accuracy <= 50) return 'good';
  if (accuracy <= 100) return 'fair';
  return 'poor';
}

// Get area name from coordinates using reverse geocoding with road/street level accuracy
export async function getAreaName(latitude: number, longitude: number): Promise<string> {
  try {
    // Use Supabase Edge Function to proxy Nominatim requests (avoids CORS issues)
    const { data, error } = await supabase.functions.invoke('reverse-geocode', {
      body: { latitude, longitude }
    });
    
    if (error) {
      console.warn('Reverse geocoding edge function error, using coordinates:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
    
    if (!data) {
      console.warn('Reverse geocoding returned no data, using coordinates');
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
    
    // Check if response has error field
    if (data.error) {
      // If fallback provided, use it, otherwise use coordinates
      return data.fallback || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
    
    if (data && data.address) {
      const addr = data.address;
      
      // Prioritize road/street name (most specific location identifier)
      const road = addr.road || addr.street || addr.footway || addr.path || addr.pedestrian || addr.cycleway || addr.amenity;
      
      // Get house number if available (most precise)
      const houseNumber = addr.house_number || addr.house_name;
      
      // Get area identifiers (from most specific to least)
      const suburb = addr.suburb || addr.neighbourhood || addr.village || addr.quarter;
      const cityDistrict = addr.city_district || addr.borough || addr.district;
      const city = addr.city || addr.town || addr.municipality;
      
      // Build location string prioritizing street/road name
      const parts: string[] = [];
      
      // Priority 1: House number + road name (most precise)
      if (houseNumber && road) {
        parts.push(`${houseNumber} ${road}`);
      } 
      // Priority 2: Just road name
      else if (road) {
        parts.push(road);
      }
      
      // Priority 3: Add suburb/neighbourhood if road not available or as additional context
      if (suburb && suburb !== road) {
        // Only add if we don't already have a road name, or if it's meaningful
        if (!road || parts.length === 0) {
          parts.push(suburb);
        }
      }
      
      // Priority 4: Add city/district if no road/suburb
      if (parts.length === 0) {
        if (cityDistrict) {
          parts.push(cityDistrict);
        } else if (city) {
          parts.push(city);
        }
      }
      
      // If we have meaningful parts, return them
      if (parts.length > 0) {
        return parts.join(', ');
      }
      
      // Fallback: Parse display_name to extract street name
      if (data.display_name) {
        const displayParts = data.display_name.split(',').map(s => s.trim());
        
        // For UK addresses, typically: "Road Name, Area, City, County, Postcode, Country"
        // Extract first meaningful part (usually the road name)
        const meaningfulParts: string[] = [];
        const skipTerms = ['england', 'united kingdom', 'uk', 'gb'];
        
        for (let i = 0; i < Math.min(displayParts.length, 3); i++) {
          const part = displayParts[i];
          if (part && part.length >= 3) {
            const partLower = part.toLowerCase();
            // Skip if it's a country/region
            if (!skipTerms.some(term => partLower.includes(term))) {
              meaningfulParts.push(part);
              // Stop after getting road name (typically first part)
              if (meaningfulParts.length >= 1) {
                break;
              }
            }
          }
        }
        
        if (meaningfulParts.length > 0) {
          return meaningfulParts.join(', ');
        }
      }
    }
    
    // If no address data, try display_name as last resort
    if (data.display_name) {
      const displayParts = data.display_name.split(',').map(s => s.trim());
      if (displayParts.length > 0) {
        // Return first part which is usually the street/road name
        return displayParts[0];
      }
    }
    
    // Ultimate fallback: return formatted coordinates
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  } catch (error: any) {
    console.warn('Reverse geocoding failed:', error);
    // Return formatted coordinates as fallback
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
}
