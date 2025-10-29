import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Clock, AlertCircle } from 'lucide-react';
import { getCurrentPosition, calculateDistance, getAreaName } from '../../utils/geolocation';

interface ClockEntry {
  id: string;
  employee_id: string;
  clock_in_time: string;
  tasks_assigned: any;
}


interface TabletInterfaceProps {
  shopId?: string; // Optional prop to override URL param
}

export default function TabletInterface({ shopId: propShopId }: TabletInterfaceProps = {}) {
  const { shopId: paramShopId } = useParams<{ shopId?: string }>();
  const shopId = propShopId || paramShopId;
  
  if (!shopId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow p-8 max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-red-600">Shop ID is required</p>
        </div>
      </div>
    );
  }
  const [view, setView] = useState<'idle' | 'pin' | 'changepin' | 'ready' | 'workspace'>('idle');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [currentEntry, setCurrentEntry] = useState<ClockEntry | null>(null);
  const [shop, setShop] = useState<any>(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [clockInMessage, setClockInMessage] = useState('');
  const [clockInLocationName, setClockInLocationName] = useState<string | null>(null);

  useEffect(() => {
    loadShop();
  }, [shopId]);


  const loadShop = async () => {
    if (!shopId) return;
    const { data } = await supabase
      .from('shops')
      .select('shop_name, points_needed, reward_description')
      .eq('id', shopId)
      .single();
    setShop(data);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .eq('shop_id', shopId)
        .eq('pin', pin)
        .eq('active', true);

      if (!employees || employees.length === 0) {
        throw new Error('Invalid PIN. Please try again.');
      }

      const employee = employees[0];
      setCurrentEmployee(employee);

      const now = new Date();
      const pinExpiry = employee.pin_expires_at ? new Date(employee.pin_expires_at) : null;
      const isPinExpired = pinExpiry && now > pinExpiry;

      if (employee.pin_change_required || isPinExpired) {
        setPin('');
        setView('changepin');
        return;
      }

      const { data: activeEntry } = await supabase
        .from('clock_entries')
        .select('*')
        .eq('employee_id', employee.id)
        .is('clock_out_time', null)
        .maybeSingle();

      if (activeEntry) {
        setCurrentEntry(activeEntry);
        // Load location name if coordinates exist
        if (activeEntry.clock_in_latitude && activeEntry.clock_in_longitude) {
          const locationName = await getAreaName(
            activeEntry.clock_in_latitude,
            activeEntry.clock_in_longitude
          );
          setClockInLocationName(locationName);
        }
        setView('workspace');
      } else {
        // Show ready view with Clock In button instead of auto-clocking in
        setView('ready');
      }

      setPin('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clockIn = async (employeeId: string) => {
    setLoading(true);
    setClockInMessage('');
    try {
      // Get current location
      let location = await getCurrentPosition();
      let distance = 0;
      let areaName = '';
      let isRemoteClockIn = false;
      let hasPreApproval = false;

      // Get shop location
      const { data: shopData } = await supabase
        .from('shops')
        .select('latitude, longitude')
        .eq('id', shopId)
        .single();

      // Always get area name if location is available (for display)
      if (location) {
        areaName = await getAreaName(location.latitude, location.longitude);
        setClockInLocationName(areaName);
      } else {
        setClockInLocationName(null);
      }

      // Check if location is more than 100m from shop
      if (location && shopData?.latitude && shopData?.longitude) {
        distance = calculateDistance(
          location.latitude,
          location.longitude,
          shopData.latitude,
          shopData.longitude
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
            .eq('employee_id', employeeId)
            .eq('shop_id', shopId)
            .eq('is_active', true)
            .contains('days_of_week', [currentDay])
            .lte('start_date', todayDate)
            .gte('end_date', todayDate);

          hasPreApproval = !!(preApprovals && preApprovals.length > 0);

          // Only create request and show message if NOT pre-approved
          if (!hasPreApproval) {
            // Create clock-in request
            const { error: requestError } = await supabase
              .from('clock_in_requests')
              .insert({
                shop_id: shopId,
                employee_id: employeeId,
                requested_at: new Date().toISOString(),
                request_latitude: location.latitude,
                request_longitude: location.longitude,
                distance_from_shop: distance,
                status: 'pending'
              });

            if (requestError) {
              console.error('Error creating clock-in request:', requestError);
            }

            const distanceText = distance < 1000
              ? `${Math.round(distance)}m`
              : `${(distance / 1000).toFixed(2)}km`;
            
            setClockInMessage(
              `You are in ${areaName} (${distanceText} from shop). Approval request sent to store manager. Please contact store if approval is delayed.`
            );
          }
        }
      }

      // Create clock entry (always create it, but mark location if remote)
      const { data: entry, error } = await supabase
        .from('clock_entries')
        .insert({
          shop_id: shopId,
          employee_id: employeeId,
          clock_in_time: new Date().toISOString(),
          clock_in_latitude: location?.latitude || null,
          clock_in_longitude: location?.longitude || null,
          tasks_assigned: []
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentEntry(entry);
      setView('workspace');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        throw new Error('PIN must be exactly 4 digits');
      }

      if (newPin !== confirmPin) {
        throw new Error('PINs do not match');
      }

      const now = new Date().toISOString();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const { error: updateError } = await supabase
        .from('employees')
        .update({
          pin: newPin,
          pin_change_required: false,
          last_pin_change_at: now,
          pin_expires_at: expiryDate.toISOString()
        })
        .eq('id', currentEmployee.id);

      if (updateError) throw updateError;

      const { data: activeEntry } = await supabase
        .from('clock_entries')
        .select('*')
        .eq('employee_id', currentEmployee.id)
        .is('clock_out_time', null)
        .maybeSingle();

      if (activeEntry) {
        setCurrentEntry(activeEntry);
        // Load location name if coordinates exist
        if (activeEntry.clock_in_latitude && activeEntry.clock_in_longitude) {
          const locationName = await getAreaName(
            activeEntry.clock_in_latitude,
            activeEntry.clock_in_longitude
          );
          setClockInLocationName(locationName);
        }
        setView('workspace');
      } else {
        await clockIn(currentEmployee.id);
      }

      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!confirm('Clock out now?')) return;

    setLoading(true);
    try {
      // Get location for clock out
      let location = await getCurrentPosition();

      const clockOutTime = new Date();
      const clockInTime = new Date(currentEntry!.clock_in_time);
      const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

      await supabase
        .from('clock_entries')
        .update({
          clock_out_time: clockOutTime.toISOString(),
          clock_out_latitude: location?.latitude || null,
          clock_out_longitude: location?.longitude || null,
          hours_worked: parseFloat(hoursWorked.toFixed(2))
        })
        .eq('id', currentEntry!.id);

      setView('idle');
      setCurrentEmployee(null);
      setCurrentEntry(null);
      setClockInMessage('');
      setClockInLocationName(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };


  const getElapsedTime = () => {
    if (!currentEntry) return '0h 0m';
    const now = new Date();
    const clockIn = new Date(currentEntry.clock_in_time);
    const diff = now.getTime() - clockIn.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (view === 'idle') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">DigiGet</h1>
          {shop && <p className="text-xl text-gray-600 mb-8">{shop.shop_name}</p>}
          <button
            onClick={() => setView('pin')}
            className="px-12 py-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-2xl font-bold"
          >
            STAFF CLOCK IN/OUT
          </button>
          <p className="mt-4 text-gray-500">No staff currently clocked in</p>
        </div>
      </div>
    );
  }

  if (view === 'pin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Enter Your PIN</h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full px-6 py-4 text-3xl text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || pin.length !== 4}
              className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Submit'}
            </button>
          </form>

          <button
            onClick={() => {
              setView('idle');
              setPin('');
              setError('');
            }}
            className="w-full mt-4 text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>

          <p className="mt-6 text-sm text-gray-500 text-center">
            Forgot PIN? Ask your manager
          </p>
        </div>
      </div>
    );
  }

  if (view === 'ready') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome, {currentEmployee?.first_name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">Ready to clock in</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 space-y-6 mt-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Clock In</h3>
            <p className="text-gray-600 mb-6">
              Click the button below to clock in. Your location will be recorded.
            </p>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={() => currentEmployee && clockIn(currentEmployee.id)}
                disabled={loading || !currentEmployee}
                className="w-full bg-green-600 text-white py-6 rounded-lg hover:bg-green-700 transition-colors font-semibold text-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Clocking In...' : 'Clock In'}
              </button>
              
              <button
                onClick={() => {
                  setView('idle');
                  setCurrentEmployee(null);
                  setError('');
                }}
                className="w-full bg-gray-200 text-gray-700 py-4 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'changepin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Change Your PIN</h2>
          <p className="text-gray-600 text-center mb-6">
            {currentEmployee?.pin_expires_at && new Date() > new Date(currentEmployee.pin_expires_at)
              ? 'Your PIN has expired. Please create a new one.'
              : 'For security, please create a new 4-digit PIN'}
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleChangePinSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-6 py-4 text-3xl text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-6 py-4 text-3xl text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading || newPin.length !== 4 || confirmPin.length !== 4}
              className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Set New PIN'}
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-500 text-center">
            Remember this PIN - you'll need it to clock in/out. It will expire in 30 days.
          </p>
        </div>
      </div>
    );
  }

  if (view === 'workspace') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome, {currentEmployee.first_name}
            </h2>
            <div className="flex items-center text-gray-600 mt-1">
              <Clock className="w-4 h-4 mr-1" />
              <span>
                Clocked in: {new Date(currentEntry!.clock_in_time).toLocaleTimeString()} ({getElapsedTime()})
                {clockInLocationName && (
                  <span className="ml-2 text-gray-500">• {clockInLocationName}</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {clockInMessage && (
            <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-800">{clockInMessage}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Staff Actions</h3>
            <div className="space-y-4">
              <button
                onClick={handleClockOut}
                disabled={loading}
                className="w-full bg-red-600 text-white py-4 rounded-lg hover:bg-red-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Clock Out'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
