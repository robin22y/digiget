import { supabase } from './supabase';
import { getCurrentPosition, calculateDistance } from '../utils/geolocation';
import { isDeviceTrusted, getDeviceFingerprint } from './deviceFingerprint';

export interface ClockInResult {
  success: boolean;
  message?: string;
  error?: string;
  clockEvent?: any;
  action?: 'clock_in' | 'clock_out';
}

interface GeoLocation {
  latitude: number;
  longitude: number;
}

interface ShopLocation {
  latitude: number;
  longitude: number;
  radius: number;
}

/**
 * UNIFIED CLOCK-IN/OUT FUNCTION
 * Works for ALL methods: NFC, QR, Tablet, GPS
 * Automatically detects if staff needs to clock in or out
 */
export async function handleStaffClock(
  employeeId: string,
  shopId: string,
  method: 'nfc' | 'qr_code' | 'shop_tablet' | 'gps',
  options?: {
    nfcTagId?: string;
    requireGPS?: boolean;
    shopLocation?: ShopLocation;
  }
): Promise<ClockInResult> {
  
  try {
    // STEP 1: Check if staff is currently clocked in
    const { data: existingClockIn, error: checkError } = await supabase
      .from('clock_entries')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('shop_id', shopId)
      .is('clock_out_time', null)
      .order('clock_in_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking clock status:', checkError);
      return {
        success: false,
        error: 'Failed to check clock status. Please try again.'
      };
    }

    // STEP 2: Determine action (clock in or clock out)
    if (existingClockIn) {
      // Staff is clocked in → CLOCK OUT
      return await performClockOut(existingClockIn.id, employeeId, method, options);
    } else {
      // Staff is not clocked in → CLOCK IN
      return await performClockIn(employeeId, shopId, method, options);
    }

  } catch (error) {
    console.error('Clock operation error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * CLOCK IN - Create new clock event
 */
async function performClockIn(
  employeeId: string,
  shopId: string,
  method: 'nfc' | 'qr_code' | 'shop_tablet' | 'gps',
  options?: any
): Promise<ClockInResult> {
  
  const now = new Date();
  let location: GeoLocation | null = null;
  let verificationMethod: 'trusted_device' | 'gps_verified' | 'no_verification' = 'no_verification';
  let deviceFingerprint: string | null = null;

  // Check if device is trusted
  const deviceTrusted = await isDeviceTrusted(shopId);
  
  if (deviceTrusted) {
    // Trusted device - skip GPS verification
    console.log('Trusted device detected - skipping GPS verification');
    verificationMethod = 'trusted_device';
    deviceFingerprint = getDeviceFingerprint();
  } else {
    // Device not trusted - proceed with GPS verification if required
  // Get GPS location if required or if using GPS method
  // Also get location for shop_tablet method if shopLocation is provided (for verification)
  if (method === 'gps' || options?.requireGPS || (method === 'shop_tablet' && options?.shopLocation)) {
    try {
      location = await getCurrentPosition();

      if (!location && (method === 'gps' || options?.requireGPS)) {
        return {
          success: false,
          error: 'Could not get your location. Please enable GPS and try again.'
        };
      }

      // Verify within shop radius (if shop location provided)
      // Note: GPS method uses a large radius (10000m) to allow remote clock-ins
      // Other methods (shop_tablet, nfc, qr_code) use strict radius (50m)
      if (location && options?.shopLocation) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          options.shopLocation.latitude,
          options.shopLocation.longitude
        );

        // GPS method allows larger radius for remote work
        const allowedRadius = method === 'gps' ? Math.max(options.shopLocation.radius || 50, 10000) : (options.shopLocation.radius || 50);
        const withinRadius = distance <= allowedRadius;

        if (!withinRadius && method !== 'gps') {
          return {
            success: false,
            error: `You must be within ${options.shopLocation.radius || 50}m of the shop to clock in. You are ${Math.round(distance)}m away.`
          };
        }
          
          // GPS verified successfully
          verificationMethod = 'gps_verified';
        // GPS method: don't block even if far away (allows remote clock-ins)
      }
    } catch (gpsError) {
      console.error('GPS error:', gpsError);
      if (method === 'gps' || options?.requireGPS) {
        return {
          success: false,
          error: 'GPS location is required but could not be obtained. Please try again.'
        };
      }
      // For shop_tablet, continue without location if GPS fails
      }
    }
  }

  // Create clock-in record
  const clockInData: any = {
    employee_id: employeeId,
    shop_id: shopId,
    clock_in_time: now.toISOString(),
    clock_in_method: method,
    clock_in_latitude: location?.latitude || null,
    clock_in_longitude: location?.longitude || null,
    clock_out_time: null, // Important: explicitly set to null
    clock_out_method: null,
    clock_out_latitude: null,
    clock_out_longitude: null,
    nfc_tag_id: options?.nfcTagId || null,
    verification_method: verificationMethod,
    device_fingerprint: deviceFingerprint,
  };

  const { data: clockEvent, error: insertError } = await supabase
    .from('clock_entries')
    .insert(clockInData)
    .select()
    .single();

  if (insertError) {
    console.error('Clock-in insert error:', insertError);
    // Check if it's a duplicate constraint violation
    if (insertError.code === '23505') {
      return {
        success: false,
        error: 'You are already clocked in. Please clock out first.'
      };
    }
    return {
      success: false,
      error: 'Failed to clock in. Please try again.'
    };
  }

  // Get staff name for message
  const { data: staff } = await supabase
    .from('employees')
    .select('first_name, last_name')
    .eq('id', employeeId)
    .single();

  return {
    success: true,
    action: 'clock_in',
    message: `✓ ${staff?.first_name || 'Staff'} clocked in at ${formatTime(now)}`,
    clockEvent: clockEvent
  };
}

/**
 * CLOCK OUT - Update existing clock event
 */
async function performClockOut(
  clockEventId: string,
  employeeId: string,
  method: 'nfc' | 'qr_code' | 'shop_tablet' | 'gps',
  options?: any
): Promise<ClockInResult> {
  
  const now = new Date();
  let location: GeoLocation | null = null;

  // Get GPS location if using GPS method (optional for clock-out)
  if (method === 'gps') {
    try {
      location = await getCurrentPosition();
      // Don't fail if GPS unavailable for clock-out
    } catch (gpsError) {
      console.warn('GPS unavailable for clock-out:', gpsError);
    }
  }

  // Get the clock-in entry to calculate hours
  const { data: clockInEntry } = await supabase
    .from('clock_entries')
    .select('clock_in_time')
    .eq('id', clockEventId)
    .single();

  if (!clockInEntry) {
    return {
      success: false,
      error: 'Clock entry not found. Please try again.'
    };
  }

  const clockInTime = new Date(clockInEntry.clock_in_time);
  const hoursWorked = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

  // Update clock-out time
  const { data: clockEvent, error: updateError } = await supabase
    .from('clock_entries')
    .update({
      clock_out_time: now.toISOString(),
      clock_out_method: method,
      clock_out_latitude: location?.latitude || null,
      clock_out_longitude: location?.longitude || null,
      hours_worked: parseFloat(hoursWorked.toFixed(2)),
      nfc_tag_id: method === 'nfc' ? (options?.nfcTagId || null) : undefined,
    })
    .eq('id', clockEventId)
    .select(`
      *,
      employee:employee_id (
        first_name,
        last_name
      )
    `)
    .single();

  if (updateError) {
    console.error('Clock-out update error:', updateError);
    return {
      success: false,
      error: 'Failed to clock out. Please try again.'
    };
  }

  return {
    success: true,
    action: 'clock_out',
    message: `✓ ${clockEvent?.employee?.first_name || 'Staff'} clocked out. Worked ${hoursWorked.toFixed(1)}h today.`,
    clockEvent: clockEvent
  };
}

/**
 * Helper: Format time for display
 */
function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Get current clock status for a staff member
 */
export async function getStaffClockStatus(employeeId: string, shopId: string) {
  const { data, error } = await supabase
    .from('clock_entries')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('shop_id', shopId)
    .is('clock_out_time', null)
    .maybeSingle();

  if (error) {
    console.error('Error fetching clock status:', error);
    return null;
  }

  return data;
}

