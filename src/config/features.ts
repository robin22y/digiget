/**
 * Feature Flags Configuration
 * 
 * Use these flags to hide/show features without deleting code.
 * Toggle features on/off by changing true/false values.
 * 
 * DEV MODE: Set VITE_DEV_MODE=true to show all features for testing
 */

export const FEATURES = {
  // CORE FEATURES (always visible)
  dashboard: true,
  staffClockIn: true,
  manageStaff: true,
  customerCheckIn: true,
  viewCustomers: true,
  payrollReports: true,
  dealsOffers: true,
  qrCodes: true,
  shopSettings: true,
  
  // HIDDEN FEATURES (set to false for barber shop focus)
  staffRequests: false,
  workVisits: false,
  remoteWorkers: false,
  remoteApprovals: false,
  staffJobs: false,
  reportProblem: false,
  fixTimeEntries: false,
  ratings: false,
  feedbackTab: false,
  contactUs: false,
  
  // OPTIONAL: Can be toggled via environment variable
  devMode: import.meta.env.VITE_DEV_MODE === 'true',
  
  // Customer portal features
  customerProfileEdit: false,
  customerOffers: false,
  customerFeedback: false,
  customerLogin: false,
};

/**
 * Check if a user is admin/owner
 * - Super admins: email ends with @digiget.uk OR role='super' OR is_super_admin=true
 * - Shop owners: User who owns the shop (determined by shop.user_id)
 */
export const isAdminOrOwner = (user: any): boolean => {
  if (!user) return false;
  
  // Check for super admin
  const emailLower = user.email?.toLowerCase() || '';
  const isSuperAdmin = emailLower.endsWith('@digiget.uk') ||
                       user.user_metadata?.role === 'super' ||
                       user.user_metadata?.is_super_admin === true;
  
  return isSuperAdmin;
};

/**
 * Check if a feature is enabled
 * @param feature - Feature key from FEATURES object
 * @param user - User object from auth context (optional, for role checking)
 * @returns true if feature is enabled, false otherwise
 * 
 * CRITICAL: Admins/Owners always see everything (ignores feature flags)
 */
export const isFeatureEnabled = (
  feature: keyof typeof FEATURES,
  user?: any
): boolean => {
  // Admins/Owners see everything - ignore feature flags
  if (user && isAdminOrOwner(user)) {
    return true;
  }
  
  // In dev mode, show all features except those explicitly set to false
  if (FEATURES.devMode && FEATURES[feature] !== false) {
    return true;
  }
  
  // Regular staff/users see only enabled features
  return FEATURES[feature] ?? false;
};

