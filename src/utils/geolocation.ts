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
    // Use zoom level 18 for street/road level accuracy
    // Add user agent header as required by Nominatim
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'DigiGet-Location/1.0'
        }
      }
    );
    
    if (!response.ok) {
      console.error('Reverse geocoding failed:', response.status);
      return 'Location unavailable';
    }
    
    const data = await response.json();
    
    if (data.address) {
      const addr = data.address;
      
      // Get road/street name (most specific location identifier)
      const road = addr.road || addr.street || addr.footway || addr.path || addr.pedestrian || addr.cycleway;
      
      // Get house number if available (most precise)
      const houseNumber = addr.house_number || addr.house_name;
      
      // Get area identifiers (from most specific to least)
      const suburb = addr.suburb || addr.neighbourhood || addr.village;
      const cityDistrict = addr.city_district || addr.borough;
      const city = addr.city || addr.town || addr.municipality;
      const county = addr.county;
      const postcode = addr.postcode;
      
      // Build location string starting with most specific
      const parts: string[] = [];
      
      // Add house number + road name if available (most precise)
      if (houseNumber && road) {
        parts.push(`${houseNumber} ${road}`);
      } else if (road) {
        parts.push(road);
      }
      
      // Add suburb/neighbourhood if available and different
      if (suburb && suburb !== road) {
        parts.push(suburb);
      }
      
      // Add city/district if available and not already included
      if (cityDistrict && cityDistrict !== road && cityDistrict !== suburb) {
        parts.push(cityDistrict);
      }
      
      // Add city if available and not already included
      if (city && !parts.some(part => 
        part.toLowerCase().includes(city.toLowerCase()) || 
        city.toLowerCase().includes(part.toLowerCase())
      )) {
        parts.push(city);
      }
      
      // If we have parts, return joined string
      if (parts.length > 0) {
        return parts.join(', ');
      }
      
      // Fallback: try display_name parsing for UK addresses
      if (data.display_name) {
        const displayParts = data.display_name.split(',').map(s => s.trim());
        
        // For UK addresses, typically: "Road Name, Area, City, County, Postcode, Country"
        // Extract first 2-3 meaningful parts (road and area)
        const meaningfulParts: string[] = [];
        const skipTerms = ['england', 'united kingdom', 'uk', 'gb', 'liverpool', 'london'];
        
        for (let i = 0; i < Math.min(displayParts.length, 4); i++) {
          const part = displayParts[i];
          if (part && part.length >= 3) {
            const partLower = part.toLowerCase();
            // Skip if it's a country/region or already included
            if (!skipTerms.some(term => partLower.includes(term)) && 
                !meaningfulParts.some(existing => existing.toLowerCase() === partLower)) {
              meaningfulParts.push(part);
              // Stop after getting road name and area (typically first 2 parts)
              if (meaningfulParts.length >= 2 && part.match(/^[A-Za-z\s]+$/)) {
                break;
              }
            }
          }
        }
        
        if (meaningfulParts.length > 0) {
          return meaningfulParts.join(', ');
        }
      }
      
      // Last resort: return city or county
      return city || county || 'Location unavailable';
    }
    
    return 'Location unavailable';
  } catch (error) {
    console.error('Error getting area name:', error);
    return 'Location unavailable';
  }
}
