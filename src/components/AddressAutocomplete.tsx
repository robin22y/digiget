/**
 * Address Autocomplete Component
 * Uses OpenStreetMap Nominatim API (FREE, no API key needed)
 */

import { useState, useEffect } from 'react';

interface AddressAutocompleteProps {
  onPlaceSelected: (place: {
    geometry: {
      location: {
        lat: () => number;
        lng: () => number;
      };
    };
    formatted_address: string;
  }) => void;
  placeholder?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function AddressAutocomplete({
  onPlaceSelected,
  placeholder = 'Type your shop address...',
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      
      try {
        // OpenStreetMap Nominatim API (FREE, no API key)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query)}&` +
          `format=json&` +
          `addressdetails=1&` +
          `countrycodes=gb&` +
          `limit=5`,
          {
            headers: {
              'User-Agent': 'DigiGet Shop Location Setup', // Required by Nominatim
            },
          }
        );
        
        if (!response.ok) {
          throw new Error('Search failed');
        }
        
        const data = await response.json();
        setSuggestions(data || []);
      } catch (error) {
        console.error('Address search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [query]);

  function handleSelect(place: NominatimResult) {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    
    onPlaceSelected({
      geometry: {
        location: {
          lat: () => lat,
          lng: () => lng,
        },
      },
      formatted_address: place.display_name,
    });

    setQuery(place.display_name);
    setSuggestions([]);
  }

  return (
    <div className="address-autocomplete">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="input"
        autoComplete="off"
      />
      
      {loading && (
        <div className="text-sm text-gray-500 mt-2">Searching...</div>
      )}
      
      {suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((place) => (
            <li 
              key={place.place_id}
              onClick={() => handleSelect(place)}
              className="suggestion-item"
            >
              <span className="text">📍 {place.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

