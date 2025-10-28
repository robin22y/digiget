import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MapPin, User, Clock, Navigation, CheckCircle } from 'lucide-react';

interface RemoteWorker {
  employee_id: string;
  employee_name: string;
  clock_entry_id: string;
  clock_in_time: string;
  distance: number;
  location_name: string | null;
  has_pre_approval: boolean;
}

export default function RemoteWorkers() {
  const { shopId } = useParams();
  const [remoteWorkers, setRemoteWorkers] = useState<RemoteWorker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRemoteWorkers();
    const interval = setInterval(loadRemoteWorkers, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [shopId]);

  const loadRemoteWorkers = async () => {
    try {
      // Get all active clock entries (employees currently clocked in)
      const { data: activeEntries, error: entriesError } = await supabase
        .from('clock_entries')
        .select('id, employee_id, clock_in_time, clock_in_latitude, clock_in_longitude')
        .eq('shop_id', shopId)
        .is('clock_out_time', null);

      if (entriesError) throw entriesError;
      if (!activeEntries || activeEntries.length === 0) {
        setRemoteWorkers([]);
        setLoading(false);
        return;
      }

      // Get shop location
      const { data: shopData } = await supabase
        .from('shops')
        .select('latitude, longitude')
        .eq('id', shopId)
        .single();

      if (!shopData || !shopData.latitude || !shopData.longitude) {
        setRemoteWorkers([]);
        setLoading(false);
        return;
      }

      // Calculate distances and filter remote workers (>100m)
      const employeesWithDistance = await Promise.all(
        activeEntries.map(async (entry) => {
          if (!entry.clock_in_latitude || !entry.clock_in_longitude) return null;

          const distance = calculateDistance(
            entry.clock_in_latitude,
            entry.clock_in_longitude,
            shopData.latitude,
            shopData.longitude
          );

          if (distance <= 100) return null; // Not remote

          // Get employee details
          const { data: employee } = await supabase
            .from('employees')
            .select('first_name, last_name')
            .eq('id', entry.employee_id)
            .single();

          // Check for pre-approval
          const today = new Date();
          const currentDay = today.getDay();
          const todayDate = today.toISOString().split('T')[0];

          const { data: preApprovals } = await supabase
            .from('remote_clock_in_approvals')
            .select('id')
            .eq('employee_id', entry.employee_id)
            .eq('shop_id', shopId)
            .eq('is_active', true)
            .contains('days_of_week', [currentDay])
            .lte('start_date', todayDate)
            .gte('end_date', todayDate)
            .limit(1);

          // Get current location check-in if any
          const { data: currentLocation } = await supabase
            .from('staff_location_checkins')
            .select('location_name')
            .eq('clock_entry_id', entry.id)
            .is('check_out_time', null)
            .order('check_in_time', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            employee_id: entry.employee_id,
            employee_name: employee ? `${employee.first_name} ${employee.last_name || ''}`.trim() : 'Unknown',
            clock_entry_id: entry.id,
            clock_in_time: entry.clock_in_time,
            distance: Math.round(distance),
            location_name: currentLocation?.location_name || null,
            has_pre_approval: (preApprovals && preApprovals.length > 0) || false,
          };
        })
      );

      setRemoteWorkers(employeesWithDistance.filter(Boolean) as RemoteWorker[]);
    } catch (error) {
      console.error('Error loading remote workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDuration = (clockIn: string) => {
    const start = new Date(clockIn);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-start h-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Remote Workers</h1>
        <p className="text-sm text-gray-600">Staff currently working away from the shop</p>
      </div>

      {remoteWorkers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No remote workers at the moment.</p>
          <p className="text-sm text-gray-500 mt-2">Staff working more than 100m from the shop will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {remoteWorkers.map((worker) => (
            <div
              key={worker.clock_entry_id}
              className={`bg-white rounded-xl shadow-sm border-2 p-4 ${
                worker.has_pre_approval ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{worker.employee_name}</h3>
                    {worker.has_pre_approval && (
                      <span className="text-xs text-green-700 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Pre-Approved
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Navigation className="w-4 h-4 text-purple-600" />
                  <span>
                    <strong>{worker.distance < 1000 ? `${worker.distance}m` : `${(worker.distance / 1000).toFixed(2)}km`}</strong> from shop
                  </span>
                </div>

                {worker.location_name && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="truncate">{worker.location_name}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span>Clocked in: {new Date(worker.clock_in_time).toLocaleTimeString()}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-medium">Duration:</span>
                  <span>{formatDuration(worker.clock_in_time)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

