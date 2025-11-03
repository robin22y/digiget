import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

export type Database = {
  public: {
    Tables: {
      shops: {
        Row: {
          id: string;
          user_id: string;
          shop_name: string;
          owner_name: string;
          owner_email: string;
          business_category: string | null;
          plan_type: 'basic' | 'pro';
          subscription_status: 'trial' | 'active' | 'cancelled' | 'expired';
          trial_ends_at: string | null;
          subscription_started_at: string | null;
          cancelled_at: string | null;
          access_ends_at: string | null;
          data_deletion_at: string | null;
          loyalty_enabled: boolean;
          points_type: 'per_visit' | 'per_spend';
          points_needed: number;
          reward_type: 'free_product' | 'fixed_discount' | 'percentage_discount';
          reward_value: number | null;
          reward_description: string;
          diary_enabled: boolean;
          owner_pin: string; // 6-digit Console PIN for owner access (staff PINs remain 4 digits)
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shops']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['shops']['Insert']>;
      };
      employees: {
        Row: {
          id: string;
          shop_id: string;
          first_name: string;
          last_name: string | null;
          pin: string;
          role: 'staff' | 'manager';
          photo_url: string | null;
          phone: string | null;
          hourly_rate: number | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['employees']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['employees']['Insert']>;
      };
      customers: {
        Row: {
          id: string;
          shop_id: string;
          phone: string;
          name: string | null;
          current_points: number;
          lifetime_points: number;
          total_visits: number;
          rewards_redeemed: number;
          active: boolean;
          first_visit_at: string;
          last_visit_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };
      clock_entries: {
        Row: {
          id: string;
          shop_id: string;
          employee_id: string;
          clock_in_time: string;
          clock_out_time: string | null;
          hours_worked: number | null;
          tasks_complete: boolean;
          tasks_assigned: any;
          tasks_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clock_entries']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['clock_entries']['Insert']>;
      };
    };
  };
};
