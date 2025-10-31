import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SignupData {
  businessCategory: string;
  planType: 'basic' | 'pro';
  ownerName: string;
  shopName: string;
  email: string;
  password: string;
  loyaltyVisits: number;
  rewardDescription: string;
}

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupData, setSignupData] = useState<Partial<SignupData>>({
    loyaltyVisits: 6,
    rewardDescription: 'Free service',
    businessCategory: 'hair_salon', // Default to barber shop
    planType: 'basic' // Default to basic plan
  });

  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();


  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await signUp(
        signupData.email!,
        signupData.password!,
        {
          owner_name: signupData.ownerName,
          shop_name: signupData.shopName
        }
      );

      if (signUpError) {
        console.error('Signup error:', signUpError);
        // Handle "user already registered" error gracefully
        const errorMessage = signUpError.message.toLowerCase();
        if (errorMessage.includes('already registered') || 
            errorMessage.includes('already exists') || 
            errorMessage.includes('user already registered') ||
            signUpError.status === 422) {
          setError('An account with this email already exists. Please log in instead.');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          setLoading(false);
          return;
        }
        setError(signUpError.message || 'Failed to create account. Please try again.');
        setLoading(false);
        return;
      }
      
      // Check if signup was successful
      if (!data?.user) {
        setError('Signup failed. Please try again.');
        return;
      }

      // Automatically sign in the user after successful signup (bypasses email confirmation)
      let userId = data.user.id;
      
      if (!data.session) {
        // No session from signup, try to sign in automatically
        const { error: signInError } = await signIn(
          signupData.email!,
          signupData.password!
        );

        if (signInError) {
          // If auto-signin fails, log it but continue with user creation
          console.warn('Auto sign-in failed:', signInError.message);
          // Note: We still have the user ID from signup, so we can create the shop
        }
        
        // Get the current user ID (might have changed after sign-in)
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          userId = currentUser.id;
        }
      }

      // Create the shop record
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      // Create shop data
      const shopData: any = {
        user_id: userId,
        shop_name: signupData.shopName!,
        owner_name: signupData.ownerName!,
        owner_email: signupData.email!,
        business_category: signupData.businessCategory!,
        plan_type: signupData.planType!,
        subscription_status: 'trial',
        trial_ends_at: trialEndsAt.toISOString(),
        loyalty_enabled: true,
        points_type: 'per_visit',
        points_needed: signupData.loyaltyVisits!,
        reward_type: 'free_product',
        reward_description: signupData.rewardDescription!,
        diary_enabled: ['hair_salon', 'beauty_salon', 'health_wellness'].includes(signupData.businessCategory!),
      };

      // Try inserting with QR code column first, fallback without it if column doesn't exist
      let { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert({
          ...shopData,
          qr_code_active: true
        })
        .select()
        .single();

      // If error is about missing column, retry without it
      if (shopError && shopError.message && shopError.message.includes('column') && shopError.message.includes('schema cache')) {
        console.warn('QR code columns not found, creating shop without them. Please run add_qr_code_columns.sql migration.');
        
        // Retry without qr_code_active
        const retryResult = await supabase
          .from('shops')
          .insert(shopData)
          .select()
          .single();
        
        shop = retryResult.data;
        shopError = retryResult.error;
      }

      if (shopError) {
        console.error('Shop creation error:', shopError);
        
        // Check if error is about missing columns
        if (shopError.message && shopError.message.includes('column') && shopError.message.includes('schema cache')) {
          setError('Database schema is missing required columns. Please run the migration SQL script (add_qr_code_columns.sql) in Supabase. Contact support for assistance.');
          setLoading(false);
          return;
        }
        
        // If shop creation fails, try to get existing shop for this user
        const { data: existingShop } = await supabase
          .from('shops')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (existingShop) {
          // User already has a shop, redirect to dashboard
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            navigate(`/dashboard/${existingShop.id}`);
            return;
          }
        }
        
        setError(`Failed to create shop: ${shopError.message || 'Unknown error'}. Please contact support.`);
        setLoading(false);
        return;
      }

      if (!shop) {
        setError('Shop was not created. Please try again or contact support.');
        setLoading(false);
        return;
      }

      // Generate and save QR URL after shop is created (so we have the ID)
      const qrUrl = `${window.location.origin}/dashboard/${shop.id}/checkin`;
      await supabase
        .from('shops')
        .update({ qr_url: qrUrl })
        .eq('id', shop.id);

      // Check if we have an active session before navigating
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        navigate(`/dashboard/${shop.id}`);
      } else {
        // If no session, redirect to login with a message
        setError('Account created! Please check your email to confirm your account, then log in.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      // Set generic error for unexpected errors (only if we haven't already set one via early returns)
      const currentError = error || err.message || 'An unexpected error occurred during signup. Please try again or contact support.';
      setError(currentError);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 bg-gradient-to-r from-modern-blue to-modern-indigo bg-clip-text text-transparent">
            Your Details
          </h1>
          <p className="text-gray-600">Let's set up your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleDetailsSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              required
              placeholder="John Doe"
              value={signupData.ownerName || ''}
              onChange={(e) => setSignupData({ ...signupData, ownerName: e.target.value })}
              className="input-modern"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Business/Shop Name
            </label>
            <input
              type="text"
              required
              placeholder="My Awesome Shop"
              value={signupData.shopName || ''}
              onChange={(e) => setSignupData({ ...signupData, shopName: e.target.value })}
              className="input-modern"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={signupData.email || ''}
              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
              className="input-modern"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={signupData.password || ''}
              onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
              className="input-modern"
            />
            <p className="text-xs text-gray-500 mt-2">Minimum 8 characters</p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-modern btn-modern-primary"
            >
              {loading ? 'Creating Account...' : 'Create Account & Start Free Trial'}
            </button>
          </div>

          <div className="text-center text-sm text-gray-600 bg-modern-blue/5 py-3 rounded-modern border-2 border-modern-blue/20">
            ⭐ 14 days free • No card required
          </div>
        </form>
      </div>
    </div>
  );
}
