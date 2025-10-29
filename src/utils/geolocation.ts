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
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
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

// Get area name from coordinates using reverse geocoding
export async function getAreaName(latitude: number, longitude: number): Promise<string> {
  try {
    // Use zoom level 16-17 for suburb/neighborhood level accuracy
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`
    );
    const data = await response.json();
    
    if (data.address) {
      // Get road/street information
      const road = data.address.road || data.address.street || data.address.path || data.address.pedestrian;
      
      // Prioritize specific local area names first, then add city for context
      const suburb = data.address.suburb;
      const neighbourhood = data.address.neighbourhood;
      const village = data.address.village;
      const cityDistrict = data.address.city_district;
      const borough = data.address.borough;
      const district = data.address.district;
      const ward = data.address.ward; // Orrell Park might be a ward
      const quarter = data.address.quarter;
      const residential = data.address.residential;
      const city = data.address.city || data.address.town || data.address.municipality;
      
      // Build location name: prefer specific area, add city if different
      let locationName = '';
      
      // First try to get a specific area name (check most specific first)
      if (ward) {
        locationName = ward;
      } else if (suburb) {
        locationName = suburb;
      } else if (neighbourhood) {
        locationName = neighbourhood;
      } else if (residential) {
        locationName = residential;
      } else if (quarter) {
        locationName = quarter;
      } else if (village) {
        locationName = village;
      } else if (cityDistrict) {
        locationName = cityDistrict;
      } else if (borough) {
        locationName = borough;
      } else if (district) {
        locationName = district;
      }
      
      // Build the final location string: Road + Area + City
      const parts: string[] = [];
      
      // Add road name if available (most specific)
      if (road) {
        parts.push(road);
      }
      
      // Add area name if available and different from road
      if (locationName && locationName !== road) {
        parts.push(locationName);
      }
      
      // Add city if available and different from road and area
      if (city && city !== road && city !== locationName) {
        // Only add city if it's not already included
        if (!parts.some(part => part.toLowerCase().includes(city.toLowerCase()) || 
                                city.toLowerCase().includes(part.toLowerCase()))) {
          parts.push(city);
        }
      }
      
      // If we have parts, join them; otherwise fallback
      if (parts.length > 0) {
        locationName = parts.join(', ');
      } else if (!locationName && city) {
        // If no specific area found, just use the city
        locationName = city;
      }
      
      // If we still don't have a name, try to extract from display_name
      if (!locationName && data.display_name) {
        const displayParts = data.display_name.split(',').map(s => s.trim());
        // Look for meaningful location names (skip street, postal code, country)
        const skipTerms = ['england', 'united kingdom', 'uk', 'gb'];
        const foundParts: string[] = [];
        
        for (let i = 0; i < Math.min(displayParts.length - 2, 5); i++) {
          const part = displayParts[i];
          if (part && part.length >= 3 && !skipTerms.some(term => part.toLowerCase().includes(term))) {
            foundParts.push(part);
            if (foundParts.length >= 2) break; // Get road and area
          }
        }
        
        if (foundParts.length > 0) {
          locationName = foundParts.join(', ');
          // Add city if different
          if (city && !foundParts.some(part => part.toLowerCase().includes(city.toLowerCase()) || 
                                           city.toLowerCase().includes(part.toLowerCase()))) {
            locationName = `${locationName}, ${city}`;
          }
        }
      }
      
      return locationName || city || 'Unknown Area';
    }
    return 'Unknown Area';
  } catch (error) {
    console.error('Error getting area name:', error);
    return 'Unknown Area';
  }
}
