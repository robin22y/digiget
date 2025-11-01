/**
 * Shop Location Setup Component
 * Provides 3 easy ways to set shop location:
 * 1. Use current location (GPS)
 * 2. Search by address
 * 3. Click on map
 */

import { useState } from 'react';
import AddressAutocomplete from './AddressAutocomplete';

interface Location {
  lat: number;
  lng: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  radius: number;
  method?: 'current' | 'search' | 'map';
}

interface ShopLocationSetupProps {
  onLocationSet: (location: LocationData) => Promise<void>;
  initialLocation?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
}

// Helper: Reverse geocode (lat/lng to address)
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'User-Agent': 'DigiGet Shop Location Setup',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Reverse geocode failed');
    }
    
    const data = await response.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.error('Reverse geocode failed:', error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

// Helper: Get user's city for map centering (defaults to UK center)
function getUserCity(): Location {
  // Default to Manchester, UK
  return { lat: 53.4808, lng: -2.2426 };
}

export default function ShopLocationSetup({
  onLocationSet,
  initialLocation,
}: ShopLocationSetupProps) {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<Location | null>(
    initialLocation?.latitude && initialLocation?.longitude
      ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
      : null
  );
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [method, setMethod] = useState<'current' | 'search' | 'map'>('current');
  const [error, setError] = useState('');
  const [radius, setRadius] = useState(50);

  // OPTION 1: Use Current Location
  async function handleUseCurrentLocation() {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          // Reverse geocode to get address
          const addr = await reverseGeocode(lat, lng);
          setLocation({ lat, lng });
          setAddress(addr);
          setError('');
        } catch (err) {
          setError('Could not get address for this location');
          setLocation({ lat, lng });
          setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        let errorMessage = 'Could not get your location. ';
        if (err.code === err.PERMISSION_DENIED) {
          errorMessage += 'Please enable location access in your browser settings.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMessage += 'Location information is unavailable.';
        } else {
          errorMessage += 'Please try again.';
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  // OPTION 2: Search Address
  async function handleAddressSearch(selectedPlace: {
    geometry: {
      location: {
        lat: () => number;
        lng: () => number;
      };
    };
    formatted_address: string;
  }) {
    setLoading(true);
    setError('');
    
    try {
      const lat = selectedPlace.geometry.location.lat();
      const lng = selectedPlace.geometry.location.lng();
      const addr = selectedPlace.formatted_address;

      setLocation({ lat, lng });
      setAddress(addr);
      setMethod('search');
    } catch (err) {
      setError('Could not process selected address');
    } finally {
      setLoading(false);
    }
  }

  // OPTION 3: Click on Map (simple version without Leaflet for now)
  // Note: Full implementation would require Leaflet library
  function handleMapClick(lat: number, lng: number) {
    setError('');
    reverseGeocode(lat, lng).then((addr) => {
      setLocation({ lat, lng });
      setAddress(addr);
    });
  }

  // Confirm and save
  async function handleConfirm() {
    if (!location) {
      setError('Please set your shop location first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onLocationSet({
        latitude: location.lat,
        longitude: location.lng,
        address: address,
        radius: radius,
        method: method,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save location');
      setLoading(false);
    }
  }

  return (
    <div className="shop-location-setup">
      <h2 className="text-xl font-semibold mb-2">Set Your Shop Location</h2>
      <p className="text-sm text-gray-600 mb-6">
        We'll use this to verify staff are at your shop when they clock in.
      </p>

      {/* Method Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          className={`flex-1 px-4 py-3 font-semibold transition-all ${
            method === 'current'
              ? 'border-b-3 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setMethod('current')}
        >
          📍 Use My Location
        </button>
        <button
          className={`flex-1 px-4 py-3 font-semibold transition-all ${
            method === 'search'
              ? 'border-b-3 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setMethod('search')}
        >
          🔍 Search Address
        </button>
        <button
          className={`flex-1 px-4 py-3 font-semibold transition-all ${
            method === 'map'
              ? 'border-b-3 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setMethod('map')}
        >
          🗺️ Pick on Map
        </button>
      </div>

      {/* OPTION 1: Current Location */}
      {method === 'current' && (
        <div className="method-content">
          {location ? (
            <div className="bg-green-50 border-l-4 border-green-600 p-4 mb-4 rounded-r-lg">
              <p className="font-semibold mb-2 text-green-800">✓ Location Captured</p>
              <p className="text-sm text-green-700 mb-4">
                {address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}
              </p>
              <button
                onClick={() => {
                  setLocation(null);
                  setAddress('');
                  setError('');
                }}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Reset & Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4 rounded-r-lg">
                <p className="font-semibold mb-2">Step 1:</p>
                <p className="text-sm mb-2">Make sure you're at your shop right now</p>
                <p className="font-semibold mb-2">Step 2:</p>
                <p className="text-sm mb-2">Click the button below</p>
                <p className="font-semibold mb-2">Step 3:</p>
                <p className="text-sm">Allow location access when prompted</p>
              </div>
              
              <button
                onClick={handleUseCurrentLocation}
                disabled={loading}
                className="w-full btn btn-primary py-4 text-lg"
              >
                {loading ? 'Getting location...' : '📍 Use My Current Location'}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                  <button
                    onClick={() => {
                      setError('');
                      setLoading(false);
                    }}
                    className="block mt-2 text-sm text-red-600 hover:text-red-700 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* OPTION 2: Address Search */}
      {method === 'search' && (
        <div className="method-content">
          <p className="text-sm text-gray-600 mb-4">
            Type your shop address and select from the dropdown:
          </p>
          <AddressAutocomplete
            onPlaceSelected={handleAddressSearch}
            placeholder="Type your shop address..."
          />
          {loading && (
            <div className="mt-4 text-sm text-gray-500">Processing location...</div>
          )}
        </div>
      )}

      {/* OPTION 3: Map Click - Simple version with manual entry */}
      {method === 'map' && (
        <div className="method-content">
          <p className="text-sm text-gray-600 mb-4">
            Enter your location manually or use the other methods above:
          </p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Latitude</label>
              <input
                type="number"
                step="0.000001"
                value={location?.lat || ''}
                onChange={(e) => {
                  const lat = parseFloat(e.target.value);
                  if (!isNaN(lat)) {
                    setLocation((prev) => ({ lat, lng: prev?.lng || 0 }));
                  }
                }}
                className="input"
                placeholder="51.5074"
              />
            </div>
            <div>
              <label className="label">Longitude</label>
              <input
                type="number"
                step="0.000001"
                value={location?.lng || ''}
                onChange={(e) => {
                  const lng = parseFloat(e.target.value);
                  if (!isNaN(lng)) {
                    setLocation((prev) => ({ lat: prev?.lat || 0, lng }));
                  }
                }}
                className="input"
                placeholder="-0.1278"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            💡 Tip: Use "Use My Location" or "Search Address" for easier setup
          </p>
        </div>
      )}

      {/* Location Preview */}
      {location && (
        <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-green-600">
            ✓ Location Set
          </h3>
          <div className="space-y-2 mb-4">
            <p>
              <strong>Address:</strong> {address}
            </p>
            <p>
              <strong>Coordinates:</strong> {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          </div>
          
          {/* Radius selector */}
          <div className="form-group mb-4">
            <label className="label">Verification Radius</label>
            <select
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="input"
            >
              <option value={30}>30 meters (small shop)</option>
              <option value={50}>50 meters (recommended)</option>
              <option value={100}>100 meters (large area/parking)</option>
            </select>
            <span className="help-text">
              Staff must be within this distance to clock in
            </span>
          </div>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full btn btn-primary py-4 text-lg"
          >
            {loading ? 'Saving...' : 'Confirm & Save Location'}
          </button>
        </div>
      )}
    </div>
  );
}

