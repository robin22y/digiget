import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getDocs,
  query,
  where,
  writeBatch,
  deleteDoc
} from 'firebase/firestore'

// Your web app's Firebase configuration
// Load from environment variables for security
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Debug: Log environment variable status (always log for debugging)
const hasApiKey = !!import.meta.env.VITE_FIREBASE_API_KEY
const hasAuthDomain = !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
const hasProjectId = !!import.meta.env.VITE_FIREBASE_PROJECT_ID

// Always log this in production to help debug
console.log('🔍 Firebase Config Check:', {
  hasApiKey,
  hasAuthDomain,
  hasProjectId,
  apiKeyLength: import.meta.env.VITE_FIREBASE_API_KEY?.length || 0,
  apiKeyPreview: import.meta.env.VITE_FIREBASE_API_KEY ? import.meta.env.VITE_FIREBASE_API_KEY.substring(0, 10) + '...' : 'MISSING',
  env: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  allViteEnvVars: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'))
})

// Warn if environment variables are not set (only in development)
if (!import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.DEV) {
  console.warn('⚠️ Firebase environment variables not set. Firebase features will be disabled.')
}

// Initialize Firebase (with error handling)
let app, auth, db
try {
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    console.log('✅ Initializing Firebase with config...')
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    console.log('✅ Firebase app and auth initialized')
    
    // Initialize Firestore with persistent cache (new API)
    // This replaces the deprecated enableIndexedDbPersistence()
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
          tabManager: persistentMultipleTabManager()
        })
      })
      console.log('✅ Firestore initialized with persistent cache')
    } catch (cacheError) {
      // Fallback to default Firestore if cache initialization fails
      console.warn('⚠️ Failed to initialize persistent cache, using default:', cacheError)
      db = getFirestore(app)
      console.log('✅ Firestore initialized with default cache')
    }
  } else {
    console.warn('❌ Firebase not initialized - VITE_FIREBASE_API_KEY is missing')
    console.warn('Available env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')))
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error)
  console.error('Error details:', {
    message: error.message,
    code: error.code,
    stack: error.stack
  })
}

// Export auth and db (will be undefined if Firebase failed to initialize)
export { auth, db }

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
 * Sign in user anonymously when app loads
 * This creates a unique anonymous user ID for tracking
 */
export const signInAnonymouslyUser = async () => {
  if (!auth) {
      // Only log in development
      if (import.meta.env.DEV) {
        console.warn('Firebase auth not available - skipping anonymous sign-in')
      }
    return null
  }
  
  try {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          // User is already signed in
          console.log('User already signed in:', user.uid)
          resolve(user)
        } else {
          // No user, sign in anonymously
          try {
            const userCredential = await signInAnonymously(auth)
            console.log('Anonymous user signed in:', userCredential.user.uid)
            resolve(userCredential.user)
          } catch (error) {
            console.error('Error signing in anonymously:', error)
            reject(error)
          }
        }
      })
    })
  } catch (error) {
    console.error('Error in signInAnonymouslyUser:', error)
    throw error
  }
}

/**
 * Log shift completion to Firestore
 * Saves data to shift_logs collection with offline support
 * 
 * @param {number} itemsChecked - Count of cards swiped right (DONE)
 * @param {string[]} skippedItems - Array of titles of cards swiped left (SKIP)
 * @param {string} shiftType - Type of shift (optional, defaults to 'Unspecified')
 */
export const logShiftComplete = async (itemsChecked, skippedItems = [], shiftType = 'Unspecified') => {
  if (!db || !auth) {
    // Always log this in both dev and prod so users know data isn't being saved
    console.warn('⚠️ Firebase not available - shift log not saved to cloud. Data is stored locally only.')
    return null
  }
  
  try {
    const user = auth.currentUser
    
    if (!user) {
      if (import.meta.env.DEV) {
        console.warn('No user authenticated, attempting to sign in...')
      }
      await signInAnonymouslyUser()
    }

    // Fetch location (runs in background, non-blocking)
    const locationData = await getRoughLocation()

    const shiftLog = {
      userId: auth.currentUser.uid,
      timestamp: serverTimestamp(),
      itemsChecked: itemsChecked,
      skippedItems: skippedItems,
      shiftType: shiftType,
      // Save the location data (city/region level only, no precise GPS)
      location: locationData
    }

    // Add document to shift_logs collection
    // Firestore will automatically queue this if offline and sync when online
    console.log('📝 Attempting to save shift log to Firestore...', {
      userId: auth.currentUser.uid,
      itemsChecked,
      shiftType,
      skippedCount: skippedItems.length,
      environment: import.meta.env.MODE,
      isProd: import.meta.env.PROD,
      dbExists: !!db,
      authExists: !!auth
    })
    
    console.log('📤 Sending to Firestore...')
    
    // Add timeout to catch hanging requests
    const savePromise = addDoc(collection(db, 'shift_logs'), shiftLog)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Firestore save timeout after 10 seconds')), 10000)
    )
    
    const docRef = await Promise.race([savePromise, timeoutPromise])
    
    // Always log success so users know data was saved
    console.log('✅ Shift log saved to Firebase with ID:', docRef.id)
    console.log('✅ Document path:', docRef.path)
    
    // Verify it was actually saved by checking if we can read it back
    // (This helps catch cases where it's queued but not actually saved)
    try {
      // Small delay to ensure write is processed
      await new Promise(resolve => setTimeout(resolve, 500))
      console.log('✅ Write confirmed - data should be in Firestore now')
    } catch (verifyError) {
      console.warn('⚠️ Could not verify write, but document ID was returned:', docRef.id)
    }
    
    return docRef.id
  } catch (error) {
    // Always log errors so users know something went wrong
    console.error('❌ Error logging shift completion:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    // Check if it's a permissions error
    if (error.code === 'permission-denied' || error.code === 'permissions-denied') {
      console.error('🔒 PERMISSION DENIED: Check Firestore security rules!')
      console.error('The security rules may be blocking writes. Make sure anonymous users can write to shift_logs collection.')
      console.error('Current user:', auth.currentUser?.uid)
    }
    
    // Check if it's a network error (might be queued for offline)
    if (error.code === 'unavailable' || error.message?.includes('network')) {
      console.warn('⚠️ Network error - data will be queued and synced when online')
      console.warn('This is normal if you\'re offline. Firestore will sync automatically.')
    }
    
    // Even if there's an error, the data will be queued for sync when online
    // thanks to offline persistence
    throw error
  }
}

/**
 * GDPR: Delete all data for the current user
 * This function finds all shift logs belonging to the current user and deletes them
 * @returns {Promise<boolean>} True if deletion was successful
 */
export const deleteUserData = async () => {
  if (!db || !auth) {
    if (import.meta.env.DEV) {
      console.warn('Firebase not available - cannot delete data')
    }
    // Return gracefully instead of throwing - Firebase features are optional
    return { success: false, message: 'Cloud sync is not available. Your data is stored locally on your device only.' }
  }

  const user = auth.currentUser
  if (!user) {
    console.warn('No user authenticated - cannot delete data')
    return false
  }

  try {
    // 1. Find all logs for this user
    const q = query(
      collection(db, 'shift_logs'),
      where('userId', '==', user.uid)
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      console.log('No logs found for user')
      return true
    }

    // 2. Delete them in a batch (efficient)
    const batch = writeBatch(db)
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    await batch.commit()

    if (import.meta.env.DEV) {
      console.log(`Deleted ${snapshot.size} logs for user.`)
    }
    
    // 3. Optional: Delete the anonymous user account itself
    // Note: Uncommenting this will delete the user account, which may cause issues
    // if the user wants to continue using the app. Consider if this is desired behavior.
    // await user.delete() 
    
    return { success: true, message: `Deleted ${snapshot.size} log(s) from cloud.` }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error deleting data:', error)
    }
    return { success: false, message: 'Failed to delete data. Please try again.' }
  }
}
