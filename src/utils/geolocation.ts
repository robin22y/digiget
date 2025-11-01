export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export async function getCurrentPosition(): Promise<GeoLocation | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true, // Use GPS for maximum accuracy
        timeout: 15000, // Increased timeout for better GPS lock
        maximumAge: 60000, // Accept cached position up to 1 minute old
      }
    );
  });
}

export function formatLocation(lat: number | null, lng: number | null): string {
  if (lat === null || lng === null) return 'Location not available';
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export function getGoogleMapsLink(lat: number | null, lng: number | null): string | null {
  if (lat === null || lng === null) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Get area name from coordinates using reverse geocoding with road/street level accuracy
export async function getAreaName(latitude: number, longitude: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=18`,
      {
        headers: {
          'User-Agent': 'DigiGet Location Service',
        },
      }
    );
    
    if (!response.ok) {
      // Fallback to coordinates if API fails
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
    
    const data = await response.json();
    
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
