import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LogOut, Users, CheckCircle, ClipboardList, Clock, History, AlertTriangle, MapPin, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import StaffCustomerManagement from '../../components/StaffCustomerManagement';
import StaffTaskManagement from '../../components/StaffTaskManagement';
import StaffWorkHistory from '../../components/StaffWorkHistory';
import StaffIncidentReport from '../../components/StaffIncidentReport';
import StaffLocationCheckins from '../../components/StaffLocationCheckins';
import StaffRequests from '../../components/StaffRequests';
import { getCurrentPosition, formatLocation, calculateDistance, getAreaName } from '../../utils/geolocation';

interface Employee {
  id: string;
  shop_id: string;
  first_name: string;
  last_name: string;
  role: string;
  photo_url: string | null;
  is_field_staff?: boolean; // Added for field staff check
}

interface Shop {
  id: string;
  shop_name: string;
  owner_name?: string;
  auto_logout_hours: number;
  latitude: number | null;
  longitude: number | null;
  open_time?: string | null; // 'HH:MM'
  close_time?: string | null; // 'HH:MM'
}

interface ClockEntry {
  id: string;
  clock_in_time: string;
  clock_out_time: string | null;
  hours_worked: number | null;
}

type View = 'auth' | 'home' | 'customers' | 'tasks' | 'clock' | 'history' | 'incident' | 'locations' | 'requests';

function parseTodayTime(hhmm?: string | null): Date | null {
  if (!hhmm) return null;
  const [hh, mm] = hhmm.split(':');
  if (hh === undefined || mm === undefined) return null;
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hh), parseInt(mm), 0, 0);
  return d;
}

export default function StaffPortal() {
  const { shopId } = useParams();
  const [view, setView] = useState<View>('auth');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [currentClockEntry, setCurrentClockEntry] = useState<ClockEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState('');
  const [autoLogoutChecked, setAutoLogoutChecked] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distanceFromShop, setDistanceFromShop] = useState<number | null>(null);
  const [currentLocationName, setCurrentLocationName] = useState<string | null>(null);

  useEffect(() => {
    if (shopId) {
      loadShop();
    }
  }, [shopId]);

  // Periodically check for auto clock-out
  useEffect(() => {
    const interval = setInterval(() => {
      checkCurrentClockEntry();
    }, 5 * 60 * 1000); // every 5 minutes
    return () => clearInterval(interval);
  }, [employee?.id, shop?.id]);

  useEffect(() => {
    const updateLocation = async () => {
      const location = await getCurrentPosition();
      if (location) {
        setCurrentLocation(location);

        // Get location name
        const areaName = await getAreaName(location.latitude, location.longitude);
        setCurrentLocationName(areaName);

        if (shop?.latitude && shop?.longitude) {
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            shop.latitude,
            shop.longitude
          );
          setDistanceFromShop(distance);
        }
      } else {
        setCurrentLocationName(null);
      }
    };

    updateLocation();
    const interval = setInterval(updateLocation, 30000);
    return () => clearInterval(interval);
  }, [shop]);

  const loadShop = async () => {
    if (!shopId) {
      setError('Shop ID missing');
      setLoading(false);
      return;
    }

    try {
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id, shop_name, owner_name, auto_logout_hours, latitude, longitude, open_time, close_time')
        .eq('id', shopId)
        .single();

      if (shopError) {
        console.error('Shop lookup error:', shopError);
        throw shopError;
      }

      if (!shopData) {
        setError('Shop not found');
        setLoading(false);
        return;
      }

      // Set shop with all data
      setShop({
        ...shopData,
        owner_name: shopData.owner_name || undefined,
        auto_logout_hours: shopData.auto_logout_hours || 13,
        open_time: shopData.open_time || null,
        close_time: shopData.close_time || null,
      });
    } catch (err) {
      console.error('Error loading shop:', err);
      setError('Failed to load shop');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!shop || !shopId || !pin.trim()) {
      setError('Please enter your PIN');
      return;
    }

    try {
      // Find employee by PIN and shop
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('shop_id', shopId)
        .eq('pin', pin.trim())
        .eq('active', true)
        .maybeSingle();

      if (employeeError) {
        console.error('Employee lookup error:', employeeError);
        throw employeeError;
      }

      if (!employeeData) {
        setError('Invalid PIN. Please check your PIN and try again.');
        setPin('');
        return;
      }

      // Check if PIN has expired
      if (employeeData.pin_expires_at) {
        const expiryDate = new Date(employeeData.pin_expires_at);
        const now = new Date();
        if (expiryDate < now) {
          setError('Your PIN has expired. Please contact your manager for a new PIN.');
          setPin('');
          return;
        }
      }

      setEmployee(employeeData);
      await checkCurrentClockEntry();
      setView('home');
      setPin('');
    } catch (err) {
      console.error('Error verifying PIN:', err);
      setError('Failed to verify PIN');
      setPin('');
    }
  };

  const checkCurrentClockEntry = async () => {
    if (!employee) return;

    const { data } = await supabase
      .from('clock_entries')
      .select('*')
      .eq('employee_id', employee.id)
      .is('clock_out_time', null)
      .order('clock_in_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && shop && !autoLogoutChecked) {
      const clockInTime = new Date(data.clock_in_time);
      const now = new Date();
      const limitHours = shop.auto_logout_hours || 12; // default 12 hours
      const limitByDuration = new Date(clockInTime.getTime() + (limitHours * 60 * 60 * 1000));
      const closing = parseTodayTime(shop.close_time);

      const cutoff = closing ? new Date(Math.min(limitByDuration.getTime(), closing.getTime())) : limitByDuration;
      const hoursWorkedAtCutoff = (cutoff.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

      if (now >= cutoff) {
        await autoClockOut(data, hoursWorkedAtCutoff);
        setCurrentClockEntry(null);
        setAutoLogoutChecked(true);
        return;
      }
    }

    setCurrentClockEntry(data);
  };

  const autoClockOut = async (entry: ClockEntry, hours?: number) => {
    try {
      const clockInTime = new Date(entry.clock_in_time);
      let clockOutTime: Date;
      let hrs = hours;
      if (!hrs) {
        const limitHours = shop!.auto_logout_hours || 12;
        clockOutTime = new Date(clockInTime.getTime() + (limitHours * 60 * 60 * 1000));
        hrs = limitHours;
      } else {
        clockOutTime = new Date(clockInTime.getTime() + (hrs * 60 * 60 * 1000));
      }

      await supabase
        .from('clock_entries')
        .update({
          clock_out_time: clockOutTime.toISOString(),
          hours_worked: hrs,
        })
        .eq('id', entry.id);
    } catch (err) {
      console.error('Error auto-clocking out:', err);
    }
  };

  const handleSignOut = () => {
    setEmployee(null);
    setView('auth');
    setPin('');
    setCurrentClockEntry(null);
  };

  useEffect(() => {
    if (!currentClockEntry) {
      setElapsedTime('');
      return;
    }

    const updateTimer = () => {
      const clockInTime = new Date(currentClockEntry.clock_in_time);
      const now = new Date();
      const diff = now.getTime() - clockInTime.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [currentClockEntry]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Portal Not Available</h2>
          <p className="text-gray-600 mb-4">{error || 'Shop not found'}</p>
        </div>
      </div>
    );
  }

  if (view === 'auth' || !employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Users className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Staff Portal
            </h2>
            <p className="text-gray-600 mt-1">{shop.shop_name}</p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={10}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter PIN"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!pin.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{shop.shop_name}</h1>
              <p className="text-sm text-gray-600">
                {employee.first_name} {employee.last_name} • {employee.role}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {currentLocation && (
                <div className="bg-blue-50 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-700" />
                    <div>
                      <p className="text-xs text-blue-700 font-medium">Your Location</p>
                      <p className="text-xs text-blue-900">
                        {currentLocationName || formatLocation(currentLocation.latitude, currentLocation.longitude)}
                      </p>
                      {distanceFromShop !== null && shop.latitude && shop.longitude && (
                        <p className="text-xs text-blue-600">
                          {distanceFromShop < 1000
                            ? `${Math.round(distanceFromShop)}m from shop`
                            : `${(distanceFromShop / 1000).toFixed(1)}km from shop`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {currentClockEntry && elapsedTime && (
                <div className="bg-green-100 px-4 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-700" />
                    <div>
                      <p className="text-xs text-green-700 font-medium">Working Time</p>
                      <p className="text-lg font-bold text-green-900 font-mono">{elapsedTime}</p>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {view === 'home' && (
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <button
              onClick={() => setView('customers')}
              className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all border-2 border-transparent hover:border-blue-500"
            >
              <Users className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Customers</h3>
              <p className="text-gray-600">Manage customer check-ins and loyalty points</p>
            </button>

            <button
              onClick={() => setView('tasks')}
              className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all border-2 border-transparent hover:border-blue-500"
            >
              <ClipboardList className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tasks</h3>
              <p className="text-gray-600">View and complete your assigned tasks</p>
            </button>

            <button
              onClick={() => setView('clock')}
              className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all border-2 border-transparent hover:border-blue-500"
            >
              <Clock className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {currentClockEntry ? 'Clock Out' : 'Clock In'}
              </h3>
              <p className="text-gray-600">
                {currentClockEntry ? 'End your shift' : 'Start your shift'}
              </p>
            </button>

            {currentClockEntry && (
              <button
                onClick={() => setView('locations')}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all border-2 border-transparent hover:border-purple-500"
              >
                <MapPin className="w-12 h-12 text-purple-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Locations</h3>
                <p className="text-gray-600">Check in/out of work locations</p>
              </button>
            )}

            <button
              onClick={() => setView('history')}
              className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all border-2 border-transparent hover:border-blue-500"
            >
              <History className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Work History</h3>
              <p className="text-gray-600">View your shifts and completed tasks</p>
            </button>

            <button
              onClick={() => setView('incident')}
              className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all border-2 border-transparent hover:border-red-500"
            >
              <AlertTriangle className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Report Incident</h3>
              <p className="text-gray-600">Report issues or incidents to management</p>
            </button>

            <button
              onClick={() => setView('requests')}
              className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all border-2 border-transparent hover:border-indigo-500"
            >
              <Package className="w-12 h-12 text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Requests</h3>
              <p className="text-gray-600">Request uniforms, equipment, or supplies</p>
            </button>
          </div>

          {currentClockEntry && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Currently Clocked In</p>
                  <p className="text-sm text-green-700">
                    Since {new Date(currentClockEntry.clock_in_time).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'customers' && (
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => setView('home')}
            className="mb-6 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Home
          </button>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Management</h2>
            <StaffCustomerManagement employeeId={employee.id} shopId={shop.id} />
          </div>
        </div>
      )}

      {view === 'tasks' && (
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => setView('home')}
            className="mb-6 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Home
          </button>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Tasks</h2>
            <StaffTaskManagement
              employeeId={employee.id}
              shopId={shop.id}
              currentClockEntryId={currentClockEntry?.id}
            />
          </div>
        </div>
      )}

      {view === 'clock' && (
        <StaffClockView
          employee={employee}
          shop={shop}
          currentClockEntry={currentClockEntry}
          onClockAction={async () => {
            await checkCurrentClockEntry();
            setView('home');
          }}
          onBack={() => setView('home')}
        />
      )}

      {view === 'history' && (
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => setView('home')}
            className="mb-6 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Home
          </button>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Work History</h2>
            <StaffWorkHistory employeeId={employee.id} />
          </div>
        </div>
      )}

      {view === 'locations' && currentClockEntry && (
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => setView('home')}
            className="mb-6 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Home
          </button>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-8 h-8 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Location Check-In</h2>
            </div>
            <StaffLocationCheckins 
              employeeId={employee.id} 
              shopId={shop.id} 
              clockEntryId={currentClockEntry.id}
            />
          </div>
        </div>
      )}

      {view === 'incident' && (
        <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => setView('home')}
            className="mb-6 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Home
          </button>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">Report Incident</h2>
            </div>
            <StaffIncidentReport employeeId={employee.id} shopId={shop.id} />
          </div>
        </div>
      )}

      {view === 'requests' && (
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => setView('home')}
            className="mb-6 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Home
          </button>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <Package className="w-8 h-8 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">Staff Requests</h2>
            </div>
            <StaffRequests employeeId={employee.id} shopId={shop.id} />
          </div>
        </div>
      )}
    </div>
  );
}

function StaffClockView({
  employee,
  shop,
  currentClockEntry,
  onClockAction,
  onBack
}: {
  employee: Employee;
  shop: Shop;
  currentClockEntry: ClockEntry | null;
  onClockAction: () => void;
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleClockIn = async () => {
    if (!employee || !shop) return;

    setLoading(true);
    try {
      // Check opening time restriction
      const opening = parseTodayTime(shop.open_time);
      const isField = (employee as any)?.role?.toLowerCase?.() === 'field' || (employee as any)?.is_field_staff === true;
      const now = new Date();
      if (opening && now < opening && !isField) {
        alert('Clock-in is not allowed before opening time. Please try again at opening time or contact your manager.');
        setLoading(false);
        return;
      }

      // Try to get location, but don't block clock-in if it fails
      let location: { latitude: number; longitude: number } | null = null;
      try {
        location = await getCurrentPosition();
      } catch (locationError) {
        console.warn('Could not get location:', locationError);
        // Continue without location - don't block clock-in
      }

      let isRemoteClockIn = false;
      let distance = 0;
      let hasPreApproval = false;

      // Only calculate distance if both shop location and user location are available
      if (location && shop.latitude && shop.longitude) {
        distance = calculateDistance(
          location.latitude,
          location.longitude,
          shop.latitude,
          shop.longitude
        );

        isRemoteClockIn = distance > 100;

        // Check for pre-approval if remote clock-in
        if (isRemoteClockIn) {
          const today = new Date();
          const currentDay = today.getDay();
          const todayDate = today.toISOString().split('T')[0];

          const { data: preApprovals } = await supabase
            .from('remote_clock_in_approvals')
            .select('*')
            .eq('employee_id', employee.id)
            .eq('shop_id', employee.shop_id)
            .eq('is_active', true)
            .contains('days_of_week', [currentDay])
            .lte('start_date', todayDate)
            .gte('end_date', todayDate);

          hasPreApproval = !!(preApprovals && preApprovals.length > 0);
        }
      }

      // Clock in immediately (allow work to continue)
      // Location is optional - null values are allowed
      const { error } = await supabase
        .from('clock_entries')
        .insert({
          shop_id: employee.shop_id,
          employee_id: employee.id,
          clock_in_time: new Date().toISOString(),
          clock_in_latitude: location?.latitude || null,
          clock_in_longitude: location?.longitude || null,
        });

      if (error) throw error;

      // If remote clock-in, create approval request for shop owner (unless pre-approved)
      if (location && isRemoteClockIn && !hasPreApproval) {
        const { error: requestError } = await supabase
          .from('clock_in_requests')
          .insert({
            shop_id: employee.shop_id,
            employee_id: employee.id,
            request_latitude: location.latitude,
            request_longitude: location.longitude,
            distance_from_shop: distance,
            requested_at: new Date().toISOString(),
            status: 'pending',
          })
          .select()
          .single();

        if (requestError) {
          console.warn('Failed to create clock-in request:', requestError);
          // Don't block the clock-in if request creation fails
        } else {
          // Create notification for shop owner
          const distanceText = distance < 1000 
            ? `${Math.round(distance)}m` 
            : `${(distance / 1000).toFixed(2)}km`;
          
          const { error: noticeError } = await supabase
            .from('notices')
            .insert({
              title: 'Remote Clock-In Request',
              body: `${employee.first_name} ${employee.last_name} clocked in from ${distanceText} away from the shop location. Please review and approve in the Clock Requests section.`,
              audience_filter: `shop:${shop.id}`,
              sent_by: 'system',
              show_on_dashboard: true,
            });

          if (noticeError) {
            console.warn('Failed to create notification:', noticeError);
          }
        }

        // Show friendly message with owner name
        const ownerName = shop.owner_name || 'the shop owner';
        const distanceText = distance < 1000 
          ? `${Math.round(distance)}m` 
          : `${(distance / 1000).toFixed(2)}km`;
        
        alert(
          `✅ You're clocked in!\n\n` +
          `You are ${distanceText} away from the shop location. ` +
          `You can continue working - ${ownerName} will review and approve your shift.`
        );
      } else if (location && isRemoteClockIn && hasPreApproval) {
        // Pre-approved remote clock-in
        const distanceText = distance < 1000 
          ? `${Math.round(distance)}m` 
          : `${(distance / 1000).toFixed(2)}km`;
        
        alert(
          `✅ You're clocked in!\n\n` +
          `You are ${distanceText} away from the shop location. ` +
          `Your remote clock-in is pre-approved - you're all set!`
        );
      } else if (!location && shop.latitude && shop.longitude) {
        // Location permission denied but shop has location set - notify shop owner
        const { error: notificationError } = await supabase
          .from('notices')
          .insert({
            title: 'Location-Disabled Clock-In',
            body: `${employee.first_name} ${employee.last_name} clocked in but location permission was disabled on their device. GPS tracking unavailable for this shift.`,
            audience_filter: `shop:${shop.id}`,
            sent_by: 'system',
            show_on_dashboard: true,
          });

        if (notificationError) {
          console.warn('Failed to create notification:', notificationError);
        }

        alert('✅ You\'re clocked in!\n\nNote: Location permission was not granted. GPS tracking is disabled for this clock-in. Shop owner has been notified.');
      } else {
        // Successful clock-in with or without location
        alert('✅ You\'re clocked in!');
      }
      
      // Always refresh the clock entry to update UI
      await onClockAction();
    } catch (err) {
      console.error('Error clocking in:', err);
      alert('Failed to clock in: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentClockEntry) return;

    setLoading(true);
    try {
      const location = await getCurrentPosition();

      const clockOutTime = new Date();
      const clockInTime = new Date(currentClockEntry.clock_in_time);
      const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

      const { error } = await supabase
        .from('clock_entries')
        .update({
          clock_out_time: clockOutTime.toISOString(),
          hours_worked: hoursWorked,
          clock_out_latitude: location?.latitude || null,
          clock_out_longitude: location?.longitude || null,
        })
        .eq('id', currentClockEntry.id);

      if (error) throw error;
      await onClockAction();
    } catch (err) {
      console.error('Error clocking out:', err);
      alert('Failed to clock out');
    } finally {
      setLoading(false);
    }
  };

  const isField = (employee as any)?.role?.toLowerCase?.() === 'field' || (employee as any)?.is_field_staff === true;
  const opening = parseTodayTime(shop.open_time);
  const now = new Date();
  const beforeOpen = opening ? now < opening : false;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={onBack}
        className="mb-6 text-blue-600 hover:text-blue-700 font-medium"
      >
        ← Back to Home
      </button>
      <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto text-center">
        <Clock className="w-16 h-16 text-blue-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {currentClockEntry ? 'Clock Out' : 'Clock In'}
        </h2>
        <p className="text-gray-600 mb-8">
          {currentClockEntry
            ? `You clocked in at ${new Date(currentClockEntry.clock_in_time).toLocaleTimeString()}`
            : 'Start your shift now'}
        </p>
        {beforeOpen && !isField && (
          <div className="mb-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-900 text-sm">
            ⏰ Clock-in is disabled before opening time ({shop.open_time}). Please try again at opening or contact your manager.
          </div>
        )}
        <button
          onClick={currentClockEntry ? handleClockOut : handleClockIn}
          disabled={loading}
          className={`w-full py-4 rounded-lg font-semibold text-white transition-colors ${
            currentClockEntry
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          } disabled:bg-gray-300`}
        >
          {loading ? 'Processing...' : currentClockEntry ? 'Clock Out' : 'Clock In'}
        </button>
      </div>
    </div>
  );
}
