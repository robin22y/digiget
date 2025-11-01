import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LogOut, Users, ClipboardList, Clock, History, AlertTriangle, MapPin, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import StaffCustomerManagement from '../../components/StaffCustomerManagement';
// import StaffTaskManagement from '../../components/StaffTaskManagement';
import StaffWorkHistory from '../../components/StaffWorkHistory';
import StaffIncidentReport from '../../components/StaffIncidentReport';
import StaffLocationCheckins from '../../components/StaffLocationCheckins';
import StaffRequests from '../../components/StaffRequests';
import { getCurrentPosition, formatLocation, calculateDistance, getAreaName } from '../../utils/geolocation';
import { createShopNotification } from '../../utils/deviceDetection';
import { handleStaffClock } from '../../lib/clockService';

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
  const { shopSlug } = useParams();
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
    if (shopSlug) {
      loadShop();
    }
  }, [shopSlug]);

  // Periodically check for clock entry status (for sync with staff access link)
  useEffect(() => {
    if (!employee?.id) return;
    
    // Check immediately and then every 10 seconds to stay in sync
    checkCurrentClockEntry();
    const interval = setInterval(() => {
      checkCurrentClockEntry();
    }, 10000); // every 10 seconds for real-time sync
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

  // Helper function to check if a string is a UUID
  const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const loadShop = async () => {
    if (!shopSlug || !shopSlug.trim()) {
      setError('Shop slug missing');
      setLoading(false);
      return;
    }

    // Trim and validate identifier
    const trimmedIdentifier = shopSlug.trim();
    
    if (trimmedIdentifier.length === 0) {
      setError('Invalid shop URL');
      setLoading(false);
      return;
    }

    try {
      let shopData = null;
      let shopError = null;

      // Check if it's a UUID or slug
      if (isUUID(trimmedIdentifier)) {
        // It's a UUID - query by ID
        console.log('Loading shop by UUID:', trimmedIdentifier);
        const { data, error } = await supabase
          .from('shops')
          .select('id, shop_name, owner_name, auto_logout_hours, latitude, longitude, open_time, close_time')
          .eq('id', trimmedIdentifier)
          .maybeSingle();
        shopData = data;
        shopError = error;
      } else {
        // It's a slug - query by slug
        console.log('Loading shop by slug:', trimmedIdentifier);
        const { data, error } = await supabase
          .from('shops')
          .select('id, shop_name, owner_name, auto_logout_hours, latitude, longitude, open_time, close_time')
          .eq('slug', trimmedIdentifier)
          .maybeSingle();
        shopData = data;
        shopError = error;
      }

      if (shopError) {
        console.error('Shop lookup error:', {
          error: shopError,
          code: shopError.code,
          message: shopError.message,
          details: shopError.details,
          hint: shopError.hint,
          identifier: trimmedIdentifier,
          isUUID: isUUID(trimmedIdentifier)
        });
        
        // Handle specific error cases
        if (shopError.message?.includes('column') && shopError.message?.includes('does not exist')) {
          // Column doesn't exist - try fallback to UUID lookup if it wasn't already tried
          if (!isUUID(trimmedIdentifier)) {
            console.log('Slug column may not exist, trying UUID lookup...');
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('shops')
              .select('id, shop_name, owner_name, auto_logout_hours, latitude, longitude, open_time, close_time')
              .eq('id', trimmedIdentifier)
              .maybeSingle();
            
            if (!fallbackError && fallbackData) {
              shopData = fallbackData;
              shopError = null;
            } else {
              // Provide more detailed error information
              if (shopError.code === 'PGRST116') {
                setError('Shop not found. Please check the URL.');
              } else if (shopError.code === '42501') {
                setError('Permission denied. Please contact your shop owner.');
              } else if (shopError.code === 'PGRST301') {
                setError('Multiple shops found. Please contact support.');
              } else if (shopError.code === '22P02') {
                setError('Invalid shop identifier. Please check the URL.');
              } else {
                const errorMsg = shopError.message || shopError.details || 'Unknown error';
                setError(`Failed to load shop: ${errorMsg}`);
                console.error('Full error details:', JSON.stringify(shopError, null, 2));
              }
              setLoading(false);
              return;
            }
          } else {
            const errorMsg = shopError.message || shopError.details || 'Unknown error';
            setError(`Failed to load shop: ${errorMsg}`);
            console.error('Full error details:', JSON.stringify(shopError, null, 2));
            setLoading(false);
            return;
          }
        } else {
          // Provide more detailed error information
          if (shopError.code === 'PGRST116') {
            setError('Shop not found. Please check the URL.');
          } else if (shopError.code === '42501') {
            setError('Permission denied. Please contact your shop owner.');
          } else if (shopError.code === 'PGRST301') {
            setError('Multiple shops found. Please contact support.');
          } else if (shopError.code === '22P02') {
            setError('Invalid shop identifier. Please check the URL.');
          } else {
            const errorMsg = shopError.message || shopError.details || 'Unknown error';
            setError(`Failed to load shop: ${errorMsg}`);
            console.error('Full error details:', JSON.stringify(shopError, null, 2));
          }
          setLoading(false);
          return;
        }
      }

      if (!shopData) {
        setError(`Shop not found with identifier: ${trimmedIdentifier}. Please check the URL.`);
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
    } catch (err: any) {
      console.error('Error loading shop:', err);
      // Provide more detailed error message
      const errorMessage = err?.message || err?.error_description || 'Failed to load shop';
      setError(`Error: ${errorMessage}. Please try again or contact support.`);
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!shop || !shop.id || !pin.trim()) {
      setError('Please enter your PIN');
      return;
    }

    try {
      // Find employee by PIN and shop
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('shop_id', shop.id)
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

      // Get location for notification tracking
      let location: { latitude: number; longitude: number } | null = null;
      let distance = 0;
      let locationName: string | null = null;
      
      try {
        location = await getCurrentPosition();
        if (location && shop.latitude && shop.longitude) {
          distance = calculateDistance(
            location.latitude,
            location.longitude,
            shop.latitude,
            shop.longitude
          );
          locationName = await getAreaName(location.latitude, location.longitude);
        }
      } catch (locationError) {
        console.warn('Could not get location for notification:', locationError);
      }

      // Create notification if login is from a distance (> 100m from shop)
      if (location && shop.latitude && shop.longitude && distance > 100) {
        const distanceText = distance < 1000 
          ? `${Math.round(distance)}m` 
          : `${(distance / 1000).toFixed(2)}km`;
        
        await createShopNotification(
          shop.id,
          'login_attempt',
          {
            title: 'Remote Login Attempt',
            message: `${employeeData.first_name} ${employeeData.last_name || ''} logged in from ${distanceText} away from shop location${locationName ? ` (${locationName})` : ''}.`,
            employeeId: employeeData.id,
            employeeName: `${employeeData.first_name} ${employeeData.last_name || ''}`,
            attemptLatitude: location.latitude,
            attemptLongitude: location.longitude,
            distanceFromShop: distance,
            locationName: locationName,
          }
        );
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
    if (!employee || !shop) {
      setCurrentClockEntry(null);
      setElapsedTime('');
      return;
    }

    const { data, error } = await supabase
      .from('clock_entries')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('shop_id', shop.id)
      .is('clock_out_time', null)
      .order('clock_in_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('Error checking clock entry:', error);
      return;
    }

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

    setCurrentClockEntry(data || null);
    if (!data) {
      setElapsedTime('');
    }
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

            {/* Incident reporting hidden */}
            {/* Requests hidden */}
          </div>

          {currentClockEntry && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-bold text-green-900 text-lg mb-1">Currently Clocked In</p>
                    <p className="text-sm text-green-700 mb-2">
                      Clocked in at {new Date(currentClockEntry.clock_in_time).toLocaleTimeString()}
                    </p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-900 font-mono">{elapsedTime}</span>
                      <span className="text-sm text-green-700">working</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setView('clock')}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Clock className="w-5 h-5" />
                  Clock Out
                </button>
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

      {/* Tasks view hidden */}

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

      // Use unified clock service for GPS clock-in
      // Note: GPS method allows remote clock-ins (no radius restriction)
      const result = await handleStaffClock(
        employee.id,
        employee.shop_id,
        'gps',
        {
          shopLocation: shop.latitude && shop.longitude ? {
            latitude: shop.latitude,
            longitude: shop.longitude,
            radius: 10000 // Large radius for GPS method (allows remote)
          } : undefined
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to clock in');
      }

      // Create notification for clock-in attempts from distance
      if (location && shop.latitude && shop.longitude) {
        let locationName: string | null = null;
        try {
          locationName = await getAreaName(location.latitude, location.longitude);
        } catch (error) {
          console.warn('Could not get location name:', error);
        }

        const distanceText = distance < 1000 
          ? `${Math.round(distance)}m` 
          : `${(distance / 1000).toFixed(2)}km`;

        await createShopNotification(
          shop.id,
          'clock_in_attempt',
          {
            title: isRemoteClockIn ? 'Remote Clock-In' : 'Clock-In',
            message: `${employee.first_name} ${employee.last_name || ''} clocked in${isRemoteClockIn ? ` from ${distanceText} away from shop` : ' at shop location'}${locationName ? ` (${locationName})` : ''}.`,
            employeeId: employee.id,
            employeeName: `${employee.first_name} ${employee.last_name || ''}`,
            attemptLatitude: location.latitude,
            attemptLongitude: location.longitude,
            distanceFromShop: distance,
            locationName: locationName,
          }
        );
      }

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
    if (!employee || !shop) return;

    setLoading(true);
    try {
      // Use unified clock service (automatically detects clock out)
      const result = await handleStaffClock(
        employee.id,
        employee.shop_id,
        'gps',
        {
          shopLocation: shop.latitude && shop.longitude ? {
            latitude: shop.latitude,
            longitude: shop.longitude,
            radius: 10000 // Large radius for GPS method
          } : undefined
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to clock out');
      }

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
