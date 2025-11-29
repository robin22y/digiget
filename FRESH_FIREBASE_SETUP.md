# Fresh Firebase Setup Guide

## Step 1: Create New Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `digiget-fresh` (or any name you prefer)
4. Disable Google Analytics (optional, for simplicity)
5. Click **"Create project"**

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Click on **"Anonymous"**
5. Enable it and click **"Save"**

## Step 3: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for now - we'll add rules after)
4. Select a location closest to your users (e.g., `europe-west2` for UK)
5. Click **"Enable"**

## Step 4: Set Up Security Rules

1. Go to **Firestore Database** → **Rules**
2. Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anonymous users to create shift logs
    match /shift_logs/{document=**} {
      allow create: if request.auth != null && 
                     request.auth.uid == request.resource.data.userId;
      allow read: if request.auth != null;
      allow update, delete: if false;
    }
    
    // Ads collection
    match /ads/{document=**} {
      allow read: if true;
      allow write: if false; // Only admins (add admin check later)
    }
  }
}
```

3. Click **"Publish"**

## Step 5: Get Your Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **"Your apps"** section
3. Click the web icon (`</>`)
4. Register app with nickname: **"Digiget Web"**
5. Copy the `firebaseConfig` object

## Step 6: Update Environment Variables

1. Update your `.env` file with the NEW Firebase credentials:

```
VITE_FIREBASE_API_KEY=your-new-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-new-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-new-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-new-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-new-sender-id
VITE_FIREBASE_APP_ID=your-new-app-id
```

2. Update the same variables in **Vercel**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Update all 6 `VITE_FIREBASE_*` variables with the new values
   - Make sure they're set for **Production**, **Preview**, and **Development**

## Step 7: Test

1. Rebuild and redeploy
2. Test locally first
3. Then test in production

## Alternative: Reset Current Project

If you want to keep the same project but reset it:

1. **Firestore Database** → Delete all documents (or just `shift_logs` collection)
2. **Firestore Database** → **Rules** → Reset to test mode or update rules
3. **Authentication** → Make sure Anonymous is enabled
4. Keep the same config, just reset the data/rules

