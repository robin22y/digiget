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

// Warn if environment variables are not set (only in development)
if (!import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.DEV) {
  console.warn('⚠️ Firebase environment variables not set. Firebase features will be disabled.')
}

// Initialize Firebase (with error handling)
let app, auth, db
try {
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    
    // Initialize Firestore with persistent cache (new API)
    // This replaces the deprecated enableIndexedDbPersistence()
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
          tabManager: persistentMultipleTabManager()
        })
      })
    } catch (cacheError) {
      // Fallback to default Firestore if cache initialization fails
      console.warn('Failed to initialize persistent cache, using default:', cacheError)
      db = getFirestore(app)
    }
  } else {
    // Only log in development
    if (import.meta.env.DEV) {
      console.warn('Firebase not initialized - environment variables missing')
    }
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error)
    if (import.meta.env.DEV) {
      console.warn('The app will continue to work, but Firebase features will be disabled.')
    }
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
    console.warn('Firebase not available - shift log not saved')
    return null
  }
  
  try {
    const user = auth.currentUser
    
    if (!user) {
      console.warn('No user authenticated, attempting to sign in...')
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
    const docRef = await addDoc(collection(db, 'shift_logs'), shiftLog)
    
    console.log('Shift log saved with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error logging shift completion:', error)
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
    console.warn('Firebase not available - cannot delete data')
    throw new Error('Firebase not available')
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

    console.log(`Deleted ${snapshot.size} logs for user.`)
    
    // 3. Optional: Delete the anonymous user account itself
    // Note: Uncommenting this will delete the user account, which may cause issues
    // if the user wants to continue using the app. Consider if this is desired behavior.
    // await user.delete() 
    
    return true
  } catch (error) {
    console.error('Error deleting data:', error)
    throw error
  }
}
