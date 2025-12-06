import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// Load from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug: Log environment variable status (only in development)
if (import.meta.env.DEV) {
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
}

// Verify key format (should be a JWT)
if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
  console.warn('⚠️ WARNING: API key should start with "eyJ" (JWT format). Current key might be incorrect.')
}

// Initialize Supabase client
let supabase = null
// Store the URL globally so edge functions can access it
let storedSupabaseUrl = supabaseUrl

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    })
    if (import.meta.env.DEV) {
      console.log('✅ Supabase client initialized')
      console.log('✅ Supabase URL:', supabaseUrl)
      console.log('✅ Supabase client object:', !!supabase)
    }
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
      if (import.meta.env.DEV) {
        console.log('User already signed in:', session.user.id)
      }
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

    if (import.meta.env.DEV) {
      console.log('Anonymous user signed in:', data.user.id)
    }
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

    if (import.meta.env.DEV) {
      console.log('✅ User authenticated:', {
        uid: user.id,
        isAnonymous: user.is_anonymous || true
      })
    }

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

    if (import.meta.env.DEV) {
      console.log('📝 Attempting to save shift log to Supabase...', {
        userId: user.id,
        itemsChecked,
        shiftType,
        skippedCount: skippedItems.length,
        isTest: isTest,
        isTestValue: shiftLog.is_test,
        networkStatus: navigator.onLine ? 'Online' : 'Offline'
      })
    }

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

    if (import.meta.env.DEV) {
      console.log('✅ Shift log saved successfully. Document ID:', insertedData.id)
    }
    return insertedData
  } catch (error) {
    console.error('❌ Error logging shift completion:', error)
    throw error
  }
}

/**
 * Track when a user clicks the install button
 * This is used for metrics to count how many users view/click the install button
 * @returns {Promise<{success: boolean}>} Result of the operation
 */
export const trackInstallButtonClick = async () => {
  if (!supabase) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ Supabase not available - install button click not tracked')
    }
    return { success: false }
  }

  // Skip tracking if admin is logged in
  const isAdmin = await checkAdminDevice()
  if (isAdmin) {
    if (import.meta.env.DEV) {
      console.log('⏭️ Skipping install button click tracking - admin device')
    }
    return { success: false }
  }

  try {
    // Ensure user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      const user = await signInAnonymouslyUser()
      if (!user) {
        return { success: false }
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false }
    }

    // Check if we've already tracked this user's install button click
    const trackingKey = `digiget-install-button-clicked-${user.id}`
    const alreadyTracked = localStorage.getItem(trackingKey)
    
    if (alreadyTracked) {
      // Already tracked this user, skip
      return { success: true, alreadyTracked: true }
    }

    // Mark as tracked in localStorage to avoid duplicate tracking
    localStorage.setItem(trackingKey, 'true')

    // Store in shift_logs with a special flag to indicate install button click
    const installLog = {
      user_id: user.id,
      items_checked: 0, // Special value to indicate this is an install button click event
      skipped_items: [],
      shift_type: 'InstallButtonClick', // Special shift type to identify install button clicks
      location: null,
      is_test: false,
      created_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('shift_logs')
      .insert([installLog])

    if (error) {
      console.error('❌ Error tracking install button click:', error)
      // Remove the localStorage flag so we can retry
      localStorage.removeItem(trackingKey)
      return { success: false }
    }

    if (import.meta.env.DEV) {
      console.log('✅ Install button click tracked for user:', user.id)
    }

    return { success: true }
  } catch (error) {
    console.error('❌ Error tracking install button click:', error)
    return { success: false }
  }
}

/**
 * Track when a user modifies a default card
 * This is used for metrics to count how many users customize their cards
 * @returns {Promise<{success: boolean}>} Result of the operation
 */
export const trackCardModification = async () => {
  if (!supabase) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ Supabase not available - card modification not tracked')
    }
    return { success: false }
  }

  // Skip tracking if admin is logged in
  const isAdmin = await checkAdminDevice()
  if (isAdmin) {
    if (import.meta.env.DEV) {
      console.log('⏭️ Skipping card modification tracking - admin device')
    }
    return { success: false }
  }

  try {
    // Ensure user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      const user = await signInAnonymouslyUser()
      if (!user) {
        return { success: false }
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false }
    }

    // Check if we've already tracked this user's card modification
    const trackingKey = `digiget-card-modification-tracked-${user.id}`
    const alreadyTracked = localStorage.getItem(trackingKey)
    
    if (alreadyTracked) {
      // Already tracked this user, skip
      return { success: true, alreadyTracked: true }
    }

    // Mark as tracked in localStorage to avoid duplicate tracking
    localStorage.setItem(trackingKey, 'true')

    // Store in shift_logs with a special flag to indicate card modification
    // We'll use a special shift_type or add metadata
    const modificationLog = {
      user_id: user.id,
      items_checked: 0, // Special value to indicate this is a card modification event
      skipped_items: [],
      shift_type: 'CardModification', // Special shift type to identify card modifications
      location: null,
      is_test: false,
      created_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('shift_logs')
      .insert([modificationLog])

    if (error) {
      console.error('❌ Error tracking card modification:', error)
      // Remove the localStorage flag so we can retry
      localStorage.removeItem(trackingKey)
      return { success: false }
    }

    if (import.meta.env.DEV) {
      console.log('✅ Card modification tracked for user:', user.id)
    }

    return { success: true }
  } catch (error) {
    console.error('❌ Error tracking card modification:', error)
    return { success: false }
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
    if (import.meta.env.DEV) {
      console.log('No user authenticated, attempting anonymous sign-in...')
    }
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

  if (import.meta.env.DEV) {
    console.log('User authenticated for delete operation:', user.id)
  }

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

    if (import.meta.env.DEV) {
      console.log(`Deleted ${logCount} logs for user: ${user.id}`)
    }
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
 * Uses Edge Function for secure registration (bypasses RLS)
 */
export const registerAdminDevice = async () => {
  if (!supabase) {
    console.warn('Supabase not available - using localStorage only')
    localStorage.setItem('digiget_admin_device', 'true')
    return { success: true, localOnly: true }
  }

  try {
    const deviceId = getDeviceId()
    const deviceName = navigator.userAgentData?.brands?.[0]?.brand || navigator.platform || 'Unknown Device'
    const userAgent = navigator.userAgent

    // Try Edge Function first (secure, bypasses RLS)
    try {
      const result = await registerAdminDeviceSecure(deviceId, deviceName, userAgent)
      if (result.device && !result.error) {
        localStorage.setItem('digiget_admin_device', 'true')
        if (import.meta.env.DEV) {
          console.log('✅ Admin device registered via Edge Function:', result.device)
        }
        return { success: true, device: result.device }
      }
    } catch (edgeError) {
      if (import.meta.env.DEV) {
        console.warn('Edge Function not available, trying direct insert:', edgeError)
      }
    }

    // Fallback to direct insert (requires INSERT policy)
    // This will fail if RLS policies don't allow INSERT
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

    if (error) {
      if (import.meta.env.DEV) {
        console.error('Error registering admin device (direct insert failed):', error)
        console.warn('💡 Tip: Deploy Edge Functions to enable secure device registration')
      }
      throw error
    }

    // Also set localStorage for backward compatibility
    localStorage.setItem('digiget_admin_device', 'true')
    return { success: true, device: data }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error registering admin device:', error)
    }
    // Fallback to localStorage (device will work but won't show in admin dashboard)
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

  // Then check via Edge Function (secure, bypasses RLS)
  if (!supabase) {
    return false
  }

  try {
    const deviceId = getDeviceId()
    
    // Use Edge Function to check admin device status
    const url = getEdgeFunctionUrl('check-admin-device')
    
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`, // Supabase requires anon key for edge function access
        'Content-Type': 'application/json',
        'apikey': anonKey
      },
      body: JSON.stringify({ device_id: deviceId })
    })

    if (!response.ok) {
      // If Edge Function not available, fall back to direct query (for backward compatibility)
      // This will fail if RLS policies are removed, but provides graceful degradation
      if (import.meta.env.DEV) {
        console.warn('Edge Function not available, falling back to direct query')
      }
      
      // Try direct query as fallback
      const { data, error } = await supabase
        .from('admin_devices')
        .select('id, last_used_at')
        .eq('device_id', deviceId)
        .single()

      if (error && error.code !== 'PGRST116') {
        if (import.meta.env.DEV) {
          console.error('Error checking admin device:', error)
        }
        return false
      }

      if (data) {
        // Update last_used_at
        await supabase
          .from('admin_devices')
          .update({ last_used_at: new Date().toISOString() })
          .eq('device_id', deviceId)
        
        localStorage.setItem('digiget_admin_device', 'true')
        return true
      }
      
      return false
    }

    const result = await response.json()
    
    if (result.isAdmin) {
      // Set localStorage for faster future checks
      localStorage.setItem('digiget_admin_device', 'true')
      return true
    }

    return false
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error checking admin device:', error)
    }
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

// ============================================
// SECURE EDGE FUNCTIONS (Admin Operations)
// ============================================
// These functions use Supabase Edge Functions with service role key
// This bypasses RLS and ensures only authorized admins can perform operations

const ADMIN_PASSWORD = 'Rncdm@2025' // Should match App.vue admin password

/**
 * Get Supabase Edge Functions URL
 */
const getEdgeFunctionUrl = (functionName) => {
  // Try to get URL from environment variable first
  let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || storedSupabaseUrl
  
  // If not in env, try to get it from the stored URL (from client initialization)
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL not configured. Please set it in your .env file and restart the dev server.')
  }
  
  // Edge Functions are at: https://<project-ref>.supabase.co/functions/v1/<function-name>
  const url = new URL(supabaseUrl)
  return `${url.protocol}//${url.host}/functions/v1/${functionName}`
}

/**
 * Call Edge Function with admin authentication
 */
const callEdgeFunction = async (functionName, options = {}) => {
  const { method = 'GET', body = null } = options
  
  // Check if Supabase is configured
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.')
  }
  
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!anonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY not configured. Edge functions require the anon key for authentication.')
  }
  
  let url
  try {
    url = getEdgeFunctionUrl(functionName)
  } catch (error) {
    // If URL can't be determined, provide helpful error
    throw new Error(`Cannot call edge function ${functionName}: ${error.message}`)
  }
  
  // Supabase Edge Functions require the anon key as Bearer token for authentication
  // We pass our custom admin password in a custom header that the edge function will check
  const headers = {
    'Authorization': `Bearer ${anonKey}`, // Supabase requires this for edge function access
    'Content-Type': 'application/json',
    'apikey': anonKey,
    'x-admin-password': ADMIN_PASSWORD // Custom header for our admin password check
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`Error calling Edge Function ${functionName}:`, error)
    }
    throw error
  }
}

/**
 * Fetch all shift logs for admin metrics (via Edge Function)
 */
export const fetchAllShiftLogs = async () => {
  try {
    const result = await callEdgeFunction('admin-metrics', { method: 'POST' })
    
    if (import.meta.env.DEV) {
      console.log('📊 Edge function response:', {
        hasLogs: !!result.logs,
        logsCount: result.logs?.length || 0,
        hasError: !!result.error,
        error: result.error
      })
    }
    
    if (result.error) {
      console.error('❌ Edge function returned error:', result.error)
      throw new Error(result.error)
    }
    
    if (!result.logs) {
      console.warn('⚠️ Edge function returned no logs array. Response:', result)
      return []
    }
    
    return result.logs
  } catch (error) {
    console.error('❌ Error fetching shift logs:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    // Re-throw so AdminDashboard can handle it
    throw error
  }
}

/**
 * Fetch all ads (via Edge Function)
 */
export const fetchAllAds = async () => {
  try {
    const result = await callEdgeFunction('admin-ads', { method: 'GET' })
    return result.ads || []
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error fetching ads:', error)
    }
    return []
  }
}

/**
 * Create a new ad (via Edge Function)
 */
export const createAd = async (adData) => {
  try {
    const result = await callEdgeFunction('admin-ads', {
      method: 'POST',
      body: adData
    })
    return { ad: result.ad, error: result.error }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error creating ad:', error)
    }
    return { ad: null, error: error.message }
  }
}

/**
 * Update an ad (via Edge Function)
 */
export const updateAd = async (adId, updates) => {
  try {
    const url = getEdgeFunctionUrl('admin-ads')
    const response = await fetch(`${url}?id=${adId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${ADMIN_PASSWORD}`,
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    return { ad: result.ad, error: result.error }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error updating ad:', error)
    }
    return { ad: null, error: error.message }
  }
}

/**
 * Delete an ad (via Edge Function)
 */
export const deleteAd = async (adId) => {
  try {
    const url = getEdgeFunctionUrl('admin-ads')
    const response = await fetch(`${url}?id=${adId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${ADMIN_PASSWORD}`,
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    return { success: result.success, error: result.error }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error deleting ad:', error)
    }
    return { success: false, error: error.message }
  }
}

/**
 * Fetch all admin devices (via Edge Function)
 */
export const fetchAllAdminDevices = async () => {
  try {
    const result = await callEdgeFunction('admin-devices', { method: 'GET' })
    return result.devices || []
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error fetching admin devices:', error)
    }
    return []
  }
}

/**
 * Register admin device (via Edge Function)
 */
export const registerAdminDeviceSecure = async (deviceId, deviceName, userAgent) => {
  try {
    const result = await callEdgeFunction('admin-devices', {
      method: 'POST',
      body: { device_id: deviceId, device_name: deviceName, user_agent: userAgent }
    })
    return { device: result.device, error: result.error }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error registering admin device:', error)
    }
    return { device: null, error: error.message }
  }
}

/**
 * Delete admin device (via Edge Function)
 */
export const deleteAdminDeviceSecure = async (deviceId) => {
  try {
    const url = getEdgeFunctionUrl('admin-devices')
    const response = await fetch(`${url}?device_id=${deviceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${ADMIN_PASSWORD}`,
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    return { success: result.success, error: result.error }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error deleting admin device:', error)
    }
    return { success: false, error: error.message }
  }
}

/**
 * Purge test data (via Edge Function)
 */
export const purgeTestData = async () => {
  try {
    const result = await callEdgeFunction('admin-purge-test-data', { method: 'POST' })
    return { deleted_count: result.deleted_count || 0, error: result.error }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error purging test data:', error)
    }
    return { deleted_count: 0, error: error.message }
  }
}

/**
 * Fetch active notices (public - for users)
 */
export const fetchActiveNotices = async () => {
  if (!supabase) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ fetchActiveNotices: Supabase not initialized')
    }
    return []
  }

  try {
    const { data: notices, error } = await supabase
      .from('notices')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      if (import.meta.env.DEV) {
        console.error('❌ Error fetching notices:', error)
        // Check if table doesn't exist
        if (error.code === '42P01') {
          console.error('⚠️ Notices table does not exist. Please run the SQL schema to create it.')
        }
      }
      return []
    }

    if (import.meta.env.DEV) {
      console.log('📋 Fetched notices:', notices?.length || 0, 'notices')
    }

    return notices || []
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('❌ Exception fetching notices:', error)
    }
    return []
  }
}

/**
 * Fetch all notices (admin - via Edge Function)
 */
export const fetchAllNotices = async () => {
  try {
    const result = await callEdgeFunction('admin-notices', { method: 'GET' })
    return result.notices || []
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error fetching notices:', error)
    }
    return []
  }
}

/**
 * Create a new notice (admin - via Edge Function)
 */
export const createNotice = async (noticeData) => {
  try {
    const result = await callEdgeFunction('admin-notices', {
      method: 'POST',
      body: noticeData
    })
    return { notice: result.notice, error: result.error }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error creating notice:', error)
    }
    return { notice: null, error: error.message }
  }
}

/**
 * Update a notice (admin - via Edge Function)
 */
export const updateNotice = async (noticeId, updates) => {
  try {
    const url = getEdgeFunctionUrl('admin-notices')
    const response = await fetch(`${url}?id=${noticeId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        'x-admin-password': ADMIN_PASSWORD
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    return { notice: result.notice, error: result.error }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error updating notice:', error)
    }
    return { notice: null, error: error.message }
  }
}

/**
 * Delete a notice (admin - via Edge Function)
 */
export const deleteNotice = async (noticeId) => {
  try {
    const url = getEdgeFunctionUrl('admin-notices')
    const response = await fetch(`${url}?id=${noticeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        'x-admin-password': ADMIN_PASSWORD
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    return { success: result.success, error: result.error }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error deleting notice:', error)
    }
    return { success: false, error: error.message }
  }
}

