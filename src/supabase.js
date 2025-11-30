import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// Load from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug: Log environment variable status
const keyPreview = supabaseAnonKey 
  ? `${supabaseAnonKey.substring(0, 30)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 20)}` 
  : 'MISSING'

console.log('🔍 Supabase Config Check:', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  url: supabaseUrl || 'MISSING',
  keyPreview: keyPreview,
  keyLength: supabaseAnonKey?.length || 0,
  keyStartsWith: supabaseAnonKey?.substring(0, 10) || 'N/A',
  keyEndsWith: supabaseAnonKey?.substring(supabaseAnonKey?.length - 10) || 'N/A',
  env: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD
})

// Verify key format (should be a JWT)
if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
  console.warn('⚠️ WARNING: API key should start with "eyJ" (JWT format). Current key might be incorrect.')
}

// Initialize Supabase client
let supabase = null

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    })
    console.log('✅ Supabase client initialized')
    console.log('✅ Supabase URL:', supabaseUrl)
    console.log('✅ Supabase client object:', !!supabase)
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    })
  }
} else {
  console.warn('⚠️ Supabase environment variables not set. Supabase features will be disabled.')
  console.warn('Missing:', {
    url: !supabaseUrl,
    key: !supabaseAnonKey
  })
  console.warn('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
  console.warn('Then restart your dev server')
}

// Export supabase client
export { supabase }

/**
 * Get rough location from IP geolocation
 * This is privacy-safe: no user permission needed, only city/region level accuracy
 * @returns {Promise<{city: string, region: string, country: string}>}
 */
const getRoughLocation = async () => {
  try {
    // Timeout after 2 seconds so we don't delay the app if the service is down
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)
    
    const response = await fetch('https://ipapi.co/json/', { signal: controller.signal })
    clearTimeout(timeoutId)
    
    const data = await response.json()
    return {
      city: data.city || 'Unknown',
      region: data.region || 'Unknown', // e.g., "England"
      country: data.country_name || 'Unknown'
    }
  } catch (error) {
    console.warn('Location fetch failed, saving as Unknown:', error)
    return { city: 'Unknown', region: 'Unknown', country: 'Unknown' }
  }
}

/**
 * Sign in user anonymously
 * Supabase uses anonymous sign-in via auth.signInAnonymously()
 */
export const signInAnonymouslyUser = async () => {
  if (!supabase) {
    if (import.meta.env.DEV) {
      console.warn('Supabase not available - skipping anonymous sign-in')
    }
    return null
  }

  try {
    // Check if user is already signed in
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      console.log('User already signed in:', session.user.id)
      return session.user
    }

    // Sign in anonymously
    const { data, error } = await supabase.auth.signInAnonymously()
    
    if (error) {
      console.error('Error signing in anonymously:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code
      })
      if (error.message.includes('Invalid API key')) {
        console.error('🔴 API KEY ISSUE:')
        console.error('1. Check your .env file has VITE_SUPABASE_ANON_KEY set correctly')
        console.error('2. Restart your dev server after changing .env')
        console.error('3. Verify the key in Supabase Dashboard → Settings → API')
        console.error('4. Make sure Anonymous auth is enabled in Supabase Dashboard → Authentication → Providers')
      }
      if (error.message.includes('Signups not allowed') || error.code === 'signup_disabled') {
        console.error('🔴 SIGNUPS DISABLED:')
        console.error('1. Go to Supabase Dashboard → Authentication → Providers')
        console.error('2. Enable "Allow new users to sign up" toggle')
        console.error('3. This is required for anonymous sign-ins to work')
      }
      return null
    }

    console.log('Anonymous user signed in:', data.user.id)
    return data.user
  } catch (error) {
    console.error('Error in signInAnonymouslyUser:', error)
    return null
  }
}

/**
 * Log shift completion to Supabase
 * Saves data to shift_logs table
 * 
 * @param {number} itemsChecked - Count of cards swiped right (DONE)
 * @param {string[]} skippedItems - Array of titles of cards swiped left (SKIP)
 * @param {string} shiftType - Type of shift (optional, defaults to 'Unspecified')
 */
export const logShiftComplete = async (itemsChecked, skippedItems = [], shiftType = 'Unspecified', isTest = false) => {
  if (!supabase) {
    console.warn('⚠️ Supabase not available - shift log not saved to cloud. Data is stored locally only.')
    return null
  }

  try {
    // Ensure user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.warn('⚠️ No user authenticated, attempting to sign in...')
      const user = await signInAnonymouslyUser()
      if (!user) {
        console.error('❌ Failed to sign in anonymously - cannot save data')
        return null
      }
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('❌ No user found after authentication')
      return null
    }

    console.log('✅ User authenticated:', {
      uid: user.id,
      isAnonymous: user.is_anonymous || true
    })

    // Fetch location (runs in background, non-blocking)
    const locationData = await getRoughLocation()

    const shiftLog = {
      user_id: user.id,
      items_checked: itemsChecked,
      skipped_items: skippedItems,
      shift_type: shiftType,
      location: locationData,
      is_test: isTest,
      created_at: new Date().toISOString()
    }

    console.log('📝 Attempting to save shift log to Supabase...', {
      userId: user.id,
      itemsChecked,
      shiftType,
      skippedCount: skippedItems.length,
      networkStatus: navigator.onLine ? 'Online' : 'Offline'
    })

    // Insert into Supabase
    const { data: insertedData, error } = await supabase
      .from('shift_logs')
      .insert([shiftLog])
      .select()
      .single()

    if (error) {
      console.error('❌ Error saving shift log:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      
      if (error.code === 'PGRST301' || error.message.includes('permission')) {
        console.error('🔒 PERMISSION DENIED: Check Supabase RLS (Row Level Security) policies!')
        console.error('Go to: Supabase Dashboard → Authentication → Policies')
      }
      
      throw error
    }

    console.log('✅ Shift log saved successfully. Document ID:', insertedData.id)
    return insertedData
  } catch (error) {
    console.error('❌ Error logging shift completion:', error)
    throw error
  }
}

/**
 * GDPR: Delete all data for the current user
 * This function finds all shift logs belonging to the current user and deletes them
 * @returns {Promise<{success: boolean, message: string}>} Result of the operation
 */
export const deleteUserData = async () => {
  if (!supabase) {
    console.warn('Supabase not available - cannot delete data')
    console.warn('Debug info:', {
      supabaseClient: !!supabase,
      hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      url: import.meta.env.VITE_SUPABASE_URL || 'MISSING',
      keyPreview: import.meta.env.VITE_SUPABASE_ANON_KEY ? import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'MISSING'
    })
    return { success: false, message: 'Cloud sync is not available. Your data is stored locally on your device only.' }
  }

  // Check if user is authenticated, try to sign in if not
  let { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.log('No user authenticated, attempting anonymous sign-in...')
    try {
      user = await signInAnonymouslyUser()
      if (!user) {
        console.warn('Failed to sign in anonymously - cannot delete data')
        return { success: false, message: 'Unable to authenticate. Please refresh the page and try again.' }
      }
    } catch (authError) {
      console.error('Error signing in:', authError)
      return { success: false, message: 'Unable to authenticate. Please make sure signups are enabled in Supabase.' }
    }
  }

  console.log('User authenticated for delete operation:', user.id)

  try {
    // First, check how many logs exist for this user
    const { count: logCount } = await supabase
      .from('shift_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (logCount === 0) {
      return { success: true, message: 'No cloud data found to delete. Your data is stored locally only.' }
    }

    // Delete all logs for this user
    const { error } = await supabase
      .from('shift_logs')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting data:', error)
      if (error.code === 'PGRST301' || error.message.includes('permission')) {
        return { success: false, message: 'Permission denied. Please check Supabase RLS policies are configured correctly.' }
      }
      return { success: false, message: `Error deleting cloud data: ${error.message}. Please try again.` }
    }

    console.log(`Deleted ${logCount} logs for user: ${user.id}`)
    return { success: true, message: `Successfully deleted ${logCount} cloud log${logCount === 1 ? '' : 's'}.` }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error deleting data:', error)
    }
    return { success: false, message: `Error deleting cloud data: ${error.message}. Please try again.` }
  }
}

/**
 * Generate a unique device ID (stored in localStorage)
 */
const getDeviceId = () => {
  let deviceId = localStorage.getItem('digiget_device_id')
  if (!deviceId) {
    // Generate a unique ID
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('digiget_device_id', deviceId)
  }
  return deviceId
}

/**
 * Register this device as an admin device in Supabase
 */
export const registerAdminDevice = async () => {
  if (!supabase) {
    console.warn('Supabase not available - using localStorage only')
    localStorage.setItem('digiget_admin_device', 'true')
    return { success: true, localOnly: true }
  }

  try {
    const deviceId = getDeviceId()
    const deviceName = navigator.userAgentData?.brands?.[0]?.brand || 'Unknown Device'
    const userAgent = navigator.userAgent

    const { data, error } = await supabase
      .from('admin_devices')
      .upsert({
        device_id: deviceId,
        device_name: deviceName,
        user_agent: userAgent,
        last_used_at: new Date().toISOString()
      }, {
        onConflict: 'device_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) throw error

    // Also set localStorage for backward compatibility
    localStorage.setItem('digiget_admin_device', 'true')
    return { success: true, device: data }
  } catch (error) {
    console.error('Error registering admin device:', error)
    // Fallback to localStorage
    localStorage.setItem('digiget_admin_device', 'true')
    return { success: true, localOnly: true, error: error.message }
  }
}

/**
 * Check if this device is registered as admin
 */
export const checkAdminDevice = async () => {
  // First check localStorage (fast, works offline)
  if (localStorage.getItem('digiget_admin_device') === 'true') {
    return true
  }

  // Then check Supabase if available
  if (!supabase) {
    return false
  }

  try {
    const deviceId = getDeviceId()
    const { data, error } = await supabase
      .from('admin_devices')
      .select('id, last_used_at')
      .eq('device_id', deviceId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking admin device:', error)
      return false
    }

    if (data) {
      // Update last_used_at
      await supabase
        .from('admin_devices')
        .update({ last_used_at: new Date().toISOString() })
        .eq('device_id', deviceId)
      
      // Set localStorage for faster future checks
      localStorage.setItem('digiget_admin_device', 'true')
      return true
    }

    return false
  } catch (error) {
    console.error('Error checking admin device:', error)
    return false
  }
}

/**
 * Get all admin devices
 */
export const getAllAdminDevices = async () => {
  if (!supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('admin_devices')
      .select('*')
      .order('last_used_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching admin devices:', error)
    return []
  }
}

/**
 * Delete an admin device
 */
export const deleteAdminDevice = async (deviceId) => {
  if (!supabase) {
    return { success: false, message: 'Supabase not available' }
  }

  try {
    const { error } = await supabase
      .from('admin_devices')
      .delete()
      .eq('device_id', deviceId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error deleting admin device:', error)
    return { success: false, message: error.message }
  }
}

