# Firebase Setup Instructions

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Enable **Anonymous** authentication:
   - Click on the "Sign-in method" tab
   - Click on "Anonymous"
   - Enable it and click "Save"

## Step 3: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Start in **test mode** (for development) or **production mode** (with security rules)
4. Select a location for your database

## Step 4: Get Your Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "Digiget")
5. Copy the `firebaseConfig` object

## Step 5: Update firebase.js

Open `src/firebase.js` and replace the placeholder config with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-actual-app-id"
}
```

## Step 6: Set Up Firestore Security Rules (Optional but Recommended)

In Firebase Console, go to **Firestore Database** > **Rules** and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shift_logs/{document=**} {
      // Allow anonymous users to write their own shift logs
      allow write: if request.auth != null && 
                     request.auth.uid == resource.data.userId;
      allow read: if false; // No reads for security
    }
  }
}
```

## Offline Support

The app is already configured for offline support. Firestore will:
- Cache data locally using IndexedDB
- Queue writes when offline
- Automatically sync when connection is restored

No additional configuration needed!
