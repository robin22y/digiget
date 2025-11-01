import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Clock, AlertCircle } from 'lucide-react';
import { getCurrentPosition, calculateDistance, getAreaName } from '../../utils/geolocation';
import GPSConsentModal from '../../components/GPSConsentModal';

interface ClockEntry {
  id: string;
  employee_id: string;
  clock_in_time: string;
  tasks_assigned: any;
}


interface TabletInterfaceProps {
  shopId?: string; // Optional prop to override URL param
  employeeId?: string; // Optional employee ID for /xtra/:staffIdentifier routes
}

export default function TabletInterface({ shopId: propShopId, employeeId: propEmployeeId }: TabletInterfaceProps = {}) {
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
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingEmployee, setPendingEmployee] = useState<any>(null);

  useEffect(() => {
    loadShop();
  }, [shopId]);

  const handleConsentAgree = async () => {
    if (!pendingEmployee || !shopId) return;

    try {
      const { error } = await supabase
        .from('employees')
        .update({
          gps_location_consent: true,
          gps_consent_given_at: new Date().toISOString(),
          gps_consent_version: '1.0'
        })
        .eq('id', pendingEmployee.id);

      if (error) throw error;

      // Refresh employee data and proceed
      const updatedEmployee = { ...pendingEmployee, gps_location_consent: true };
      setCurrentEmployee(updatedEmployee);
      setPendingEmployee(null);
      setShowConsentModal(false);

      // Continue with normal flow
      const { data: activeEntry } = await supabase
        .from('clock_entries')
        .select('*')
        .eq('employee_id', updatedEmployee.id)
        .is('clock_out_time', null)
        .maybeSingle();

      if (activeEntry) {
        setCurrentEntry(activeEntry);
        if (activeEntry.clock_in_latitude && activeEntry.clock_in_longitude) {
          const locationName = await getAreaName(
            activeEntry.clock_in_latitude,
            activeEntry.clock_in_longitude
          );
          setClockInLocationName(locationName);
        }
        setView('workspace');
      } else {
        setView('ready');
      }
    } catch (err: any) {
      console.error('Error saving consent:', err);
      setError('Failed to save consent. Please try again.');
      setShowConsentModal(false);
    }
  };

  const handleConsentDecline = async () => {
    if (!pendingEmployee || !shopId) return;

    try {
      const { error } = await supabase
        .from('employees')
        .update({
          gps_location_consent: false,
          gps_consent_given_at: new Date().toISOString(),
          gps_consent_version: '1.0'
        })
        .eq('id', pendingEmployee.id);

      if (error) throw error;

      setPendingEmployee(null);
      setShowConsentModal(false);
      setError('GPS location consent is required to use the clock in/out feature. Please contact your manager.');
      setView('idle');
    } catch (err: any) {
      console.error('Error saving consent decline:', err);
      setError('Failed to save response. Please try again.');
      setShowConsentModal(false);
    }
  };


  const [shopPlanType, setShopPlanType] = useState<'basic' | 'pro' | null>(null);

  const loadShop = async () => {
    if (!shopId) return;
    const { data } = await supabase
      .from('shops')
      .select('shop_name, points_needed, reward_description, plan_type')
      .eq('id', shopId)
      .single();
    setShop(data);
    setShopPlanType(data?.plan_type || null);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // If employeeId is provided (from /xtra route), verify PIN against that specific employee
      // Otherwise, find any employee with matching PIN (for /tablet/:shopId route)
      let employee;
      
      if (propEmployeeId) {
        console.log('[TabletInterface] Verifying PIN for specific employee:', { propEmployeeId, shopId, pinLength: pin.length });
        // Verify PIN for specific employee
        const { data: specificEmployee, error: empError } = await supabase
          .from('employees')
          .select('*')
          .eq('id', propEmployeeId)
          .eq('shop_id', shopId)
          .eq('pin', pin)
          .eq('active', true)
          .maybeSingle();

        console.log('[TabletInterface] Employee lookup result:', { specificEmployee, empError });

        if (empError || !specificEmployee) {
          throw new Error('Invalid PIN. Please try again.');
        }
        employee = specificEmployee;
      } else {
        // Find any employee with matching PIN (original behavior)
        const { data: employees } = await supabase
          .from('employees')
          .select('*')
          .eq('shop_id', shopId)
          .eq('pin', pin)
          .eq('active', true);

        if (!employees || employees.length === 0) {
          throw new Error('Invalid PIN. Please try again.');
        }

        employee = employees[0];
      }

      console.log('[TabletInterface] Employee authenticated:', employee.first_name);

      // Check for PIN expiry (30 days after last change)
      const now = new Date();
      const pinExpiry = employee.pin_expires_at ? new Date(employee.pin_expires_at) : null;
      const isPinExpired = pinExpiry && now > pinExpiry;

      console.log('[TabletInterface] PIN expiry check:', { isPinExpired, pinExpiry });

      // Only force PIN change if expired (not on first use)
      if (isPinExpired) {
        console.log('[TabletInterface] PIN expired, showing change PIN view');
        setPin('');
        setView('changepin');
        return;
      }

      // Check GPS consent - show modal if consent is null (first time)
      console.log('[TabletInterface] GPS consent:', employee.gps_location_consent);
      if (employee.gps_location_consent === null) {
        console.log('[TabletInterface] No GPS consent, showing consent modal');
        setPendingEmployee(employee);
        setShowConsentModal(true);
        setPin('');
        return;
      }

      // If consent declined, show error
      if (employee.gps_location_consent === false) {
        console.log('[TabletInterface] GPS consent declined, showing error');
        setError('GPS location consent is required to use the clock in/out feature. Please contact your manager.');
        setPin('');
        return;
      }

      // Consent given - proceed with normal flow
      console.log('[TabletInterface] All checks passed, proceeding with normal flow');
      setCurrentEmployee(employee);

      const { data: activeEntry } = await supabase
        .from('clock_entries')
        .select('*')
        .eq('employee_id', employee.id)
        .is('clock_out_time', null)
        .maybeSingle();

      console.log('[TabletInterface] Active entry check:', { activeEntry });

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
        console.log('[TabletInterface] Setting view to workspace');
        setView('workspace');
      } else {
        // Show ready view with Clock In button instead of auto-clocking in
        console.log('[TabletInterface] Setting view to ready');
        setView('ready');
      }

      setPin('');
    } catch (err: any) {
      console.error('[TabletInterface] PIN submit error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clockIn = async (employeeId: string) => {
    setLoading(true);
    setClockInMessage('');
    try {
      // Get current location (optional - don't block clock-in if it fails)
      let location: { latitude: number; longitude: number } | null = null;
      try {
        location = await getCurrentPosition();
      } catch (locationError) {
        console.warn('Could not get location:', locationError);
        // Only continue without location if consent was given (but location failed)
        // If no consent, this shouldn't happen, but check anyway
        if (!currentEmployee?.gps_location_consent) {
          setError('GPS location is required. Please enable location services and try again.');
          setLoading(false);
          return;
        }
        // Continue without location - allow clock-in to proceed
      }
      
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
        try {
          areaName = await getAreaName(location.latitude, location.longitude);
          setClockInLocationName(areaName);
        } catch (areaError) {
          console.warn('Could not get area name:', areaError);
          setClockInLocationName(null);
        }
      } else {
        setClockInLocationName(null);
      }

      // Check if location is more than 100m from shop (geofencing available to all shops)
      if (location && shopData?.latitude && shopData?.longitude && shopPlanType === 'pro') {
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
        // Show ready view instead of auto-clocking in
        setView('ready');
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
      // Get location for clock out (optional - don't block clock-out if it fails)
      let location: { latitude: number; longitude: number } | null = null;
      try {
        location = await getCurrentPosition();
      } catch (locationError) {
        console.warn('Could not get location for clock-out:', locationError);
        // Continue without location - allow clock-out to proceed
      }

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
      <>
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
        <GPSConsentModal
          isOpen={showConsentModal}
          employeeName={pendingEmployee?.first_name || 'Staff Member'}
          onAgree={handleConsentAgree}
          onDecline={handleConsentDecline}
        />
      </>
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
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-5 h-5 text-blue-600" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <span className="font-semibold">Clocked in:</span>
                  <span>{new Date(currentEntry!.clock_in_time).toLocaleTimeString()}</span>
                  <span className="text-blue-600 font-medium">• {getElapsedTime()} in shift</span>
                </div>
              </div>
              {clockInLocationName && (
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <span className="font-semibold">Location:</span>
                    <span className="ml-2">{clockInLocationName}</span>
                  </div>
                </div>
              )}
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

          <div className="bg-white rounded-lg shadow p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Staff Actions</h3>
            <div className="space-y-4">
              <button
                onClick={handleClockOut}
                disabled={loading}
                className="w-full bg-red-600 text-white py-5 rounded-lg hover:bg-red-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
