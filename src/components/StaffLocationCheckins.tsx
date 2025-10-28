import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, Clock, Navigation, CheckCircle, XCircle } from 'lucide-react';
import { getCurrentPosition } from '../utils/geolocation';

interface LocationCheckin {
  id: string;
  location_name: string | null;
  check_in_time: string;
  check_out_time: string | null;
  check_in_latitude: number;
  check_in_longitude: number;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  notes: string | null;
}

interface StaffLocationCheckinsProps {
  employeeId: string;
  shopId: string;
  clockEntryId: string;
}

export default function StaffLocationCheckins({ 
  employeeId, 
  shopId, 
  clockEntryId 
}: StaffLocationCheckinsProps) {
  const [activeCheckin, setActiveCheckin] = useState<LocationCheckin | null>(null);
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<LocationCheckin[]>([]);

  useEffect(() => {
    loadActiveCheckin();
    loadHistory();
  }, [employeeId, clockEntryId]);

  const loadActiveCheckin = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_location_checkins')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('clock_entry_id', clockEntryId)
        .is('check_out_time', null)
        .order('check_in_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveCheckin(data);
    } catch (error) {
      console.error('Error loading active check-in:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_location_checkins')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('clock_entry_id', clockEntryId)
        .order('check_in_time', { ascending: false })
        .limit(10);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!locationName.trim()) {
      alert('Please enter a location name (e.g., "Customer Site - 123 Main St")');
      return;
    }

    setLoading(true);
    try {
      const location = await getCurrentPosition();

      if (!location) {
        alert('Location permission required to check in');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('staff_location_checkins')
        .insert({
          shop_id: shopId,
          employee_id: employeeId,
          clock_entry_id: clockEntryId,
          location_name: locationName.trim(),
          check_in_latitude: location.latitude,
          check_in_longitude: location.longitude,
        });

      if (error) throw error;

      setLocationName('');
      await loadActiveCheckin();
      await loadHistory();
      alert('Location checked in successfully!');
    } catch (error: any) {
      console.error('Error checking in:', error);
      alert(error.message || 'Failed to check in to location');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeCheckin) return;

    setLoading(true);
    try {
      const location = await getCurrentPosition();

      if (!location) {
        alert('Location permission required to check out');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('staff_location_checkins')
        .update({
          check_out_time: new Date().toISOString(),
          check_out_latitude: location.latitude,
          check_out_longitude: location.longitude,
        })
        .eq('id', activeCheckin.id);

      if (error) throw error;

      await loadActiveCheckin();
      await loadHistory();
      alert('Location checked out successfully!');
    } catch (error: any) {
      console.error('Error checking out:', error);
      alert(error.message || 'Failed to check out from location');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (checkIn: string, checkOut: string | null) => {
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Active Check-in Status */}
      {activeCheckin ? (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Currently At</h3>
                <p className="text-xl font-semibold text-green-700">{activeCheckin.location_name}</p>
              </div>
            </div>
            <button
              onClick={handleCheckOut}
              disabled={loading}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Checking Out...' : 'Check Out'}
            </button>
          </div>
          <div className="text-sm text-gray-600">
            <p>Checked in: {new Date(activeCheckin.check_in_time).toLocaleString()}</p>
            <p>Duration: {formatDuration(activeCheckin.check_in_time, null)}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Check In to Location</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Name <span className="text-gray-500">(e.g., "Customer Site - 123 Main St")</span>
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Where are you working?"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleCheckIn()}
              />
            </div>
            <button
              onClick={handleCheckIn}
              disabled={loading || !locationName.trim()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <MapPin className="w-5 h-5" />
              {loading ? 'Checking In...' : 'Check In to Location'}
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Locations</h3>
          <div className="space-y-3">
            {history.map((checkin) => (
              <div
                key={checkin.id}
                className={`p-4 rounded-lg border-2 ${
                  checkin.id === activeCheckin?.id
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">{checkin.location_name || 'Unnamed Location'}</h4>
                      {!checkin.check_out_time && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <Clock className="w-4 h-4 inline mr-1" />
                        In: {new Date(checkin.check_in_time).toLocaleTimeString()}
                      </p>
                      {checkin.check_out_time ? (
                        <p>
                          <XCircle className="w-4 h-4 inline mr-1" />
                          Out: {new Date(checkin.check_out_time).toLocaleTimeString()}
                        </p>
                      ) : null}
                      <p>
                        <Navigation className="w-4 h-4 inline mr-1" />
                        Duration: {formatDuration(checkin.check_in_time, checkin.check_out_time)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

