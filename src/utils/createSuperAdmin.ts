// Utility function to create a super admin account
// Note: This uses the public Supabase signup API
// For production, use Supabase Admin API with service role key

import { supabase } from '../lib/supabase';

export const DEFAULT_SUPER_ADMIN_EMAIL = 'robin@digiget.uk';
export const DEFAULT_SUPER_ADMIN_PASSWORD = 'DigiGet2024!'; // Change this after first login

export async function createSuperAdminAccount() {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: DEFAULT_SUPER_ADMIN_EMAIL,
      password: DEFAULT_SUPER_ADMIN_PASSWORD,
      options: {
        data: {
          role: 'super',
          is_super_admin: true,
          owner_name: 'Robin',
          shop_name: 'DigiGet Admin'
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return {
          success: false,
          message: 'Account already exists. Please log in with the default password.',
          error: null
        };
      }
      throw error;
    }

    return {
      success: true,
      message: 'Super admin account created successfully!',
      data
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error creating account: ${error.message}`,
      error
    };
  }
}

