# Security Notice

## Exposed Secrets

⚠️ **IMPORTANT**: A Google API key was detected in commit `24f63f13` in the file `seedFirestore.js`.

### Immediate Actions Required:

1. **Rotate the API Key**: The API key is already exposed in git history. You MUST:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to APIs & Services > Credentials
   - Delete or restrict the exposed API key
   - Create a new API key with proper restrictions

2. **Set Up Environment Variables**:
   - Copy `.env.example` to `.env`
   - Add your Firebase credentials to `.env`
   - **DO NOT commit `.env` to git** (it's already in `.gitignore`)

3. **Firebase Security Rules**:
   - Review and tighten Firestore security rules
   - Ensure anonymous users can only write their own data
   - Restrict read access as needed

### Current Status:

- ✅ Firebase config moved to environment variables
- ✅ `.env` file added to `.gitignore`
- ✅ `seedFirestore.js` added to `.gitignore`
- ⚠️ **API key still needs to be rotated** (it's in git history)

### Note:

The current code includes fallback values for development, but these should be removed once you've set up your `.env` file. The fallback values are only there to prevent the app from breaking during the transition.

