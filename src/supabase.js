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
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error)
  }
} else {
  if (import.meta.env.DEV) {
    console.warn('⚠️ Supabase environment variables not set. Supabase features will be disabled.')
    console.warn('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
  }
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
export const logShiftComplete = async (itemsChecked, skippedItems = [], shiftType = 'Unspecified') => {
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
    if (import.meta.env.DEV) {
      console.warn('Supabase not available - cannot delete data')
    }
    return { success: false, message: 'Cloud sync is not available. Your data is stored locally on your device only.' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    if (import.meta.env.DEV) {
      console.warn('No user authenticated - cannot delete data')
    }
    return { success: false, message: 'No user authenticated. Cannot delete cloud data.' }
  }

  try {
    // Delete all logs for this user
    const { data, error } = await supabase
      .from('shift_logs')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting data:', error)
      return { success: false, message: `Error deleting cloud data: ${error.message}. Please try again.` }
    }

    console.log(`Deleted logs for user: ${user.id}`)
    return { success: true, message: `Successfully deleted your cloud logs.` }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error deleting data:', error)
    }
    return { success: false, message: `Error deleting cloud data: ${error.message}. Please try again.` }
  }
}

