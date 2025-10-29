import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MapPin, Clock, Navigation, User, CheckCircle } from 'lucide-react';
import { getAreaName } from '../../utils/geolocation';

interface LocationCheckin {
  id: string;
  employee_id: string;
  clock_entry_id: string;
  location_name: string | null;
  check_in_time: string;
  check_out_time: string | null;
  check_in_latitude: number;
  check_in_longitude: number;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  notes: string | null;
  employees: {
    first_name: string;
    last_name: string | null;
  };
  clock_entries: {
    clock_in_time: string;
    clock_out_time: string | null;
  };
  locationName?: string;
}

export default function StaffLocationsPage() {
  const { shopId } = useParams();
  const [checkins, setCheckins] = useState<LocationCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'today'>('active');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  useEffect(() => {
    loadCheckins();
  }, [shopId, filter, selectedEmployee]);

  const loadCheckins = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('staff_location_checkins')
        .select(`
          *,
          employees(first_name, last_name),
          clock_entries(clock_in_time, clock_out_time)
        `)
        .eq('shop_id', shopId || '')
        .order('check_in_time', { ascending: false });

      // Apply filters
      if (filter === 'active') {
        query = query.is('check_out_time', null);
      } else if (filter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('check_in_time', today.toISOString());
      }

      if (selectedEmployee !== 'all') {
        query = query.eq('employee_id', selectedEmployee);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get location names for all checkins
      const checkinsWithLocationNames = await Promise.all(
        (data || []).map(async (checkin) => {
          let locationName = '';
          if (checkin.check_in_latitude && checkin.check_in_longitude) {
            locationName = await getAreaName(checkin.check_in_latitude, checkin.check_in_longitude);
          }
          return {
            ...checkin,
            locationName
          };
        })
      );

      setCheckins(checkinsWithLocationNames);
    } catch (error) {
      console.error('Error loading location check-ins:', error);
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
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get unique employees for filter
  const uniqueEmployees = Array.from(
    new Map(checkins.map(c => [c.employee_id, c.employees])).entries()
  );

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
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Work Visits</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'today')}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Active Check-Ins</option>
              <option value="today">Today's Check-Ins</option>
              <option value="all">All Check-Ins</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Staff Member</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Staff</option>
              {uniqueEmployees.map(([id, emp]) => (
                <option key={id} value={id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Check-ins List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          {filter === 'active' ? 'Active Locations' : filter === 'today' ? "Today's Check-Ins" : 'All Check-Ins'}
        </h2>
        
        {checkins.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No location check-ins found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {checkins.map((checkin) => (
              <div
                key={checkin.id}
                className={`p-4 rounded-lg border-2 ${
                  !checkin.check_out_time
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {checkin.location_name || 'Unnamed Location'}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>
                            {checkin.employees.first_name} {checkin.employees.last_name}
                          </span>
                        </div>
                      </div>
                      {!checkin.check_out_time && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                      <div>
                        <Clock className="w-4 h-4 inline mr-1" />
                        <span className="font-medium">Checked In:</span>
                        <br />
                        {new Date(checkin.check_in_time).toLocaleString()}
                      </div>
                      {checkin.check_out_time ? (
                        <div>
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          <span className="font-medium">Checked Out:</span>
                          <br />
                          {new Date(checkin.check_out_time).toLocaleString()}
                        </div>
                      ) : (
                        <div className="text-gray-400">
                          <span className="font-medium">Still at location</span>
                        </div>
                      )}
                      <div>
                        <Navigation className="w-4 h-4 inline mr-1" />
                        <span className="font-medium">Duration:</span>
                        <br />
                        {formatDuration(checkin.check_in_time, checkin.check_out_time)}
                      </div>
                      <div>
                        <span className="font-medium">Location:</span>
                        <br />
                        <span className="text-xs">
                          {checkin.locationName || `${checkin.check_in_latitude.toFixed(6)}, ${checkin.check_in_longitude.toFixed(6)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

