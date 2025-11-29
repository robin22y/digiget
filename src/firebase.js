import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp,
  enableIndexedDbPersistence
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

// Warn if environment variables are not set
if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  console.error('❌ Firebase environment variables not set! Please create a .env file with your Firebase credentials.')
  throw new Error('Firebase configuration is missing. Please set up environment variables.')
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication
export const auth = getAuth(app)

// Initialize Firestore
export const db = getFirestore(app)

// Enable offline persistence
// This allows the app to work offline and sync when connection is restored
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time
    console.warn('Firestore persistence failed: Multiple tabs open')
  } else if (err.code === 'unimplemented') {
    // The current browser does not support all of the features required
    console.warn('Firestore persistence not available in this browser')
  } else {
    console.error('Firestore persistence error:', err)
  }
})

/**
 * Sign in user anonymously when app loads
 * This creates a unique anonymous user ID for tracking
 */
export const signInAnonymouslyUser = async () => {
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
 */
export const logShiftComplete = async (itemsChecked, skippedItems = []) => {
  try {
    const user = auth.currentUser
    
    if (!user) {
      console.warn('No user authenticated, attempting to sign in...')
      await signInAnonymouslyUser()
    }

    const shiftLog = {
      userId: auth.currentUser.uid,
      timestamp: serverTimestamp(),
      itemsChecked: itemsChecked,
      skippedItems: skippedItems
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
