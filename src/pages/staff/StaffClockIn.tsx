import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { handleStaffClock } from '../../lib/clockService';
import { Clock, CheckCircle, X, AlertCircle } from 'lucide-react';
import { getCurrentPosition, calculateDistance, getAreaName } from '../../utils/geolocation';
import { useShop } from '../../contexts/ShopContext';
import GPSConsentModal from '../../components/GPSConsentModal';

interface Employee {
  id: string;
  first_name: string;
  last_name: string | null;
  pin: string;
  shop_id: string;
  gps_location_consent: boolean | null;
}

interface ClockEntry {
  id: string;
  employee_id: string;
  shop_id: string;
  clock_in_time: string;
  clock_out_time: string | null;
  clock_in_latitude: number | null;
  clock_in_longitude: number | null;
}

interface CurrentlyWorking {
  id: string;
  clock_in_time: string;
  employee: {
    first_name: string;
    last_name: string | null;
  };
}

export default function StaffClockIn() {
  const { shopId: paramShopId } = useParams<{ shopId: string }>();
  const { currentShop, hasAccess, loading: shopLoading } = useShop();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [currentClockEntry, setCurrentClockEntry] = useState<ClockEntry | null>(null);
  const [currentlyWorking, setCurrentlyWorking] = useState<CurrentlyWorking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shop, setShop] = useState<any>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState('');
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingEmployee, setPendingEmployee] = useState<Employee | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Validate access if shopId comes from URL params
  useEffect(() => {
    if (paramShopId && !shopLoading) {
      if (!hasAccess(paramShopId)) {
        navigate('/dashboard');
        return;
      }
    }
  }, [paramShopId, hasAccess, shopLoading, navigate]);

  // Use currentShop.id (from context) or validated paramShopId
  const shopId = currentShop?.id || (paramShopId && hasAccess(paramShopId) ? paramShopId : null);

  useEffect(() => {
    if (shopId) {
      loadShop();
      loadCurrentlyWorkingStaff();
      
      // Refresh currently working staff every 5 seconds for real-time updates
      const interval = setInterval(() => {
        loadCurrentlyWorkingStaff();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [shopId, refreshKey]);

  // Check if staff member (from PIN) is already clocked in and sync with portal
  useEffect(() => {
    if (employee?.id && shopId) {
      checkExistingClockIn();
      // Poll every 10 seconds to stay in sync with staff portal
      const interval = setInterval(() => {
        checkExistingClockIn();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [employee?.id, shopId]);

  // Update elapsed time every second for real-time display
  useEffect(() => {
    if (!currentClockEntry) {
      setElapsedTime('');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const clockIn = new Date(currentClockEntry.clock_in_time);
      const diff = now.getTime() - clockIn.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setElapsedTime(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer(); // Calculate immediately
    const interval = setInterval(updateTimer, 1000); // Update every second

    return () => clearInterval(interval);
  }, [currentClockEntry]);

  async function loadShop() {
    if (!shopId) return;
    const { data } = await supabase
      .from('shops')
      .select('id, shop_name, latitude, longitude, plan_type, nfc_tag_active, require_nfc, allow_gps_fallback')
      .eq('id', shopId)
      .single();

    if (data) setShop(data);
  }

  async function loadCurrentlyWorkingStaff() {
    if (!shopId) return;

    const { data, error } = await supabase
      .from('clock_entries')
      .select(`
        id,
        clock_in_time,
        employee:employees!clock_entries_employee_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('shop_id', shopId)
      .is('clock_out_time', null)
      .order('clock_in_time', { ascending: false });

    if (error) {
      console.error('Error loading currently working staff:', error);
      return;
    }

    setCurrentlyWorking(
      (data || []).map((entry: any) => ({
        id: entry.id,
        clock_in_time: entry.clock_in_time,
        employee: {
          first_name: entry.employee.first_name,
          last_name: entry.employee.last_name
        }
      }))
    );
  }

  async function checkExistingClockIn() {
    if (!employee?.id || !shopId || !shop) {
      // If no employee or shop, clear clock entry state
      if (!employee?.id) {
        setCurrentClockEntry(null);
        setElapsedTime('');
      }
      return;
    }

    // Use unified clock service (automatically handles in/out)
    try {
      const result = await handleStaffClock(
        employee.id,
        shopId,
        'shop_tablet',
        {
          shopLocation: shop.latitude && shop.longitude ? {
            latitude: shop.latitude,
            longitude: shop.longitude,
            radius: 50
          } : undefined
        }
      );

      if (result.success) {
        setSuccessMessage(result.message || 'Success');
        setError('');
        setPin('');
        
        // Clear employee state after 2 seconds for shared device mode
        setTimeout(() => {
          setEmployee(null);
          setCurrentClockEntry(null);
          setLocationName(null);
          setElapsedTime('');
          setSuccessMessage('');
        }, 2000);
        
        // Refresh currently working list
        await loadCurrentlyWorkingStaff();
        setRefreshKey(prev => prev + 1);
      } else {
        setError(result.error || 'Failed to process clock operation');
        setPin('');
        setEmployee(null);
      }
    } catch (err: any) {
      console.error('Clock operation error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setPin('');
      setEmployee(null);
    }
  }

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    if (!shopId) {
      setError('Shop ID is required');
      setIsLoading(false);
      return;
    }

    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN');
      setIsLoading(false);
      return;
    }

    try {
      // Verify PIN
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('shop_id', shopId)
        .eq('pin', pin.trim())
        .eq('active', true)
        .maybeSingle();

      if (empError || !employees) {
        setError('Invalid PIN. Please try again.');
        setPin('');
        setIsLoading(false);
        return;
      }

      // Check GPS consent - show modal if consent is null (first time)
      if (employees.gps_location_consent === null) {
        setPendingEmployee(employees);
        setShowConsentModal(true);
        setPin('');
        setIsLoading(false);
        return;
      }

      // If consent declined, show error
      if (employees.gps_location_consent === false) {
        setError('GPS location consent is required to use the clock in/out feature. Please contact your manager.');
        setPin('');
        setIsLoading(false);
        return;
      }

      // Consent given - check if already clocked in
      setEmployee(employees);
      
      // Check existing clock entry (will trigger clock in/out automatically)
      await checkExistingClockIn();
      
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to verify PIN');
      setPin('');
      setIsLoading(false);
    }
  }

  async function handleClockIn() {
    if (!employee || !shopId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Check if already clocked in (double-check)
      const { data: existing } = await supabase
        .from('clock_entries')
        .select('id')
        .eq('employee_id', employee.id)
        .eq('shop_id', shopId)
        .is('clock_out_time', null)
        .maybeSingle();

      if (existing) {
        setError(`${employee.first_name} is already clocked in`);
        setPin('');
        setEmployee(null);
        setIsLoading(false);
        return;
      }

      // Get GPS location
      const location = await getCurrentPosition();

      // Verify within shop radius (50m) - for all shops
      if (location && shop.latitude && shop.longitude) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          shop.latitude,
          shop.longitude
        );

        if (distance > 50) {
          setError(`You must be within 50m of the shop to clock in. You are ${Math.round(distance)}m away.`);
          setIsLoading(false);
          return;
        }

        // Get location name
        const areaName = await getAreaName(location.latitude, location.longitude);
        setLocationName(areaName);
      }

      // Check if shop requires NFC (and NFC is active) but GPS fallback is disabled
      if (shop.require_nfc && shop.nfc_tag_active && !shop.allow_gps_fallback) {
        setError('This shop requires NFC tag for clock-in. Please tap the NFC tag at the shop entrance.');
        setPin('');
        setEmployee(null);
        setIsLoading(false);
        return;
      }

      // Create clock-in record (with GPS method)
      const { data: clockIn, error: clockError } = await supabase
        .from('clock_entries')
        .insert({
          shop_id: shopId,
          employee_id: employee.id,
          clock_in_time: new Date().toISOString(),
          clock_in_latitude: location?.latitude || null,
          clock_in_longitude: location?.longitude || null,
          clock_in_method: 'gps', // GPS-based clock-in
        })
        .select()
        .single();

      if (clockError) {
        throw clockError;
      }

      // Show success message
      setSuccessMessage(`✓ ${employee.first_name} clocked in at ${new Date().toLocaleTimeString()}`);
      setError('');
      setPin('');
      
      // Clear employee state after 2 seconds for shared device mode (return to PIN entry)
      setTimeout(() => {
        setEmployee(null);
        setCurrentClockEntry(null);
        setLocationName(null);
        setElapsedTime('');
        setSuccessMessage('');
      }, 2000);
      
      // Refresh currently working list immediately
      await loadCurrentlyWorkingStaff();
      setRefreshKey(prev => prev + 1); // Trigger refresh
    } catch (err: any) {
      setError(err.message || 'Clock-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleClockOut() {
    if (!currentClockEntry || !employee) {
      // If we don't have currentClockEntry, try to get it
      if (employee?.id && shopId) {
        const { data } = await supabase
          .from('clock_entries')
          .select('*')
          .eq('employee_id', employee.id)
          .eq('shop_id', shopId)
          .is('clock_out_time', null)
          .order('clock_in_time', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (data) {
          setCurrentClockEntry(data);
        } else {
          setError(`${employee.first_name} is not clocked in`);
          setPin('');
          setEmployee(null);
          setIsLoading(false);
          return;
        }
      } else {
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      let location: { latitude: number; longitude: number } | null = null;
      try {
        location = await getCurrentPosition();
      } catch (locationError) {
        console.warn('Could not get location for clock out:', locationError);
        // Continue without location
      }

      const clockOutTime = new Date();
      const clockInTime = new Date(currentClockEntry!.clock_in_time);
      const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

      const { error: updateError } = await supabase
        .from('clock_entries')
        .update({
          clock_out_time: clockOutTime.toISOString(),
          clock_out_latitude: location?.latitude || null,
          clock_out_longitude: location?.longitude || null,
          hours_worked: parseFloat(hoursWorked.toFixed(2)),
          clock_out_method: 'gps', // GPS-based clock-out
        })
        .eq('id', currentClockEntry!.id);

      if (updateError) {
        throw updateError;
      }

      // Show success message (use variables calculated earlier)
      setSuccessMessage(`✓ ${employee.first_name} clocked out. Worked ${hoursWorked.toFixed(1)}h today.`);
      
      // Reset state for shared device mode - clear employee to return to PIN entry
      setCurrentClockEntry(null);
      setEmployee(null); // Clear employee state for shared device mode
      setLocationName(null);
      setElapsedTime('');
      setError('');
      setPin('');
      
      // Refresh currently working list
      await loadCurrentlyWorkingStaff();
      setRefreshKey(prev => prev + 1); // Trigger refresh
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Clock-out failed');
    } finally {
      setIsLoading(false);
    }
  }

  function handleNumberPad(digit: string | 'backspace' | 'submit') {
    if (digit === 'backspace') {
      setPin(prev => prev.slice(0, -1));
    } else if (digit === 'submit') {
      if (pin.length === 4) {
        handlePinSubmit({ preventDefault: () => {} } as React.FormEvent);
      }
    } else if (pin.length < 4) {
      setPin(prev => prev + digit);
    }
  }

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
      setEmployee(updatedEmployee);
      setPendingEmployee(null);
      setShowConsentModal(false);

      // Check for existing clock-in
      await checkExistingClockIn();
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
      setPin('');
    } catch (err: any) {
      console.error('Error saving consent decline:', err);
      setError('Failed to save response. Please try again.');
      setShowConsentModal(false);
    }
  };

  // If staff is clocked in, show clocked-in view
  if (currentClockEntry && employee) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back, {employee.first_name}!
            </h2>
            <p className="text-sm text-gray-600 mt-1">You're clocked in and ready</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 space-y-6 mt-8">
          {/* Clock Status Card */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-bold text-green-900 text-xl">Clocked In</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-700 font-medium">Working Time</p>
                <p className="text-3xl font-bold text-green-900 font-mono">{elapsedTime}</p>
              </div>
            </div>
            <div className="space-y-2 text-gray-700 bg-white/50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                <span className="font-semibold">Clock In Time:</span>
                <span>{new Date(currentClockEntry.clock_in_time).toLocaleTimeString()}</span>
              </div>
              {locationName && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-semibold">Location:</span>
                  <span>{locationName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={() => navigate(`/staff/${shopId}/check-in-customer/${employee.id}`)}
              className="w-full bg-green-600 text-white py-6 rounded-xl hover:bg-green-700 transition-colors font-bold text-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              ✓ Check In Customer
            </button>

            <button
              onClick={handleClockOut}
              disabled={isLoading}
              className="w-full bg-red-600 text-white py-5 rounded-xl hover:bg-red-700 transition-colors font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Clock Out Now'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // PIN entry view (shared device mode)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pb-20">
      <div className="max-w-2xl mx-auto p-4 pt-8">
        {/* Shared Device Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">
                <strong>📱 Shared Device Mode</strong>
              </p>
              <p className="mt-1 text-sm text-blue-700">
                All staff use this device to clock in and out. Enter your 4-digit PIN to clock in. 
                Enter your PIN again to clock out. No logout needed between staff members.
              </p>
            </div>
          </div>
        </div>

        {/* Currently Working Staff */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Currently Working:</h3>
          {currentlyWorking.length === 0 ? (
            <p className="text-gray-500 text-sm">No staff clocked in yet</p>
          ) : (
            <div className="space-y-3">
              {currentlyWorking.map((staff) => {
                const clockInTime = new Date(staff.clock_in_time);
                const now = new Date();
                const diff = now.getTime() - clockInTime.getTime();
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                
                return (
                  <div key={staff.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <span className="font-semibold text-gray-900">
                        {staff.employee.first_name} {staff.employee.last_name || ''}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        (since {clockInTime.toLocaleTimeString()})
                      </span>
                    </div>
                    <span className="text-sm font-medium text-green-700">
                      {hours}h {minutes}m
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PIN Entry Card */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Staff Clock In/Out
          </h2>
          {shop && (
            <p className="text-center text-gray-600 mb-8">{shop.shop_name}</p>
          )}

          {successMessage && (
            <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* PIN Display */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
              Enter Your 4-Digit PIN:
            </label>
            <div className="flex justify-center gap-4 mb-6">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="w-16 h-16 bg-gray-100 border-2 border-gray-300 rounded-xl flex items-center justify-center text-2xl font-bold"
                >
                  {pin[index] ? '•' : ''}
                </div>
              ))}
            </div>

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberPad(num.toString())}
                  className="h-20 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl text-2xl font-bold text-gray-900 transition-colors shadow-md"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => handleNumberPad('backspace')}
                className="h-20 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded-xl flex items-center justify-center transition-colors shadow-md"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
              <button
                onClick={() => handleNumberPad('0')}
                className="h-20 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl text-2xl font-bold text-gray-900 transition-colors shadow-md"
              >
                0
              </button>
              <button
                onClick={() => handleNumberPad('submit')}
                disabled={pin.length !== 4 || isLoading}
                className="h-20 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors shadow-md"
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </button>
            </div>
          </div>

          <form onSubmit={handlePinSubmit} className="hidden">
            <input type="submit" />
          </form>
        </div>
      </div>

      <GPSConsentModal
        isOpen={showConsentModal}
        employeeName={pendingEmployee?.first_name || 'Staff Member'}
        onAgree={handleConsentAgree}
        onDecline={handleConsentDecline}
      />
    </div>
  );
}

