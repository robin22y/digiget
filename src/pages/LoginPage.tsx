import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user } = useAuth();

  // Show success message if redirected from password reset
  useEffect(() => {
    if (location.state?.message) {
      setError(''); // Clear any existing error
      setSuccessMessage(location.state.message);
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        console.error('Sign in error:', signInError);
        
        // Provide more helpful error messages
        if (signInError.message?.includes('Invalid login credentials') || 
            signInError.message?.includes('invalid_credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (signInError.message?.includes('Email not confirmed') || 
                   signInError.message?.includes('email_not_confirmed')) {
          setError('Please check your email and confirm your account before logging in. Check your inbox for a confirmation email.');
        } else if (signInError.message?.includes('Email rate limit exceeded')) {
          setError('Too many login attempts. Please wait a few minutes and try again.');
        } else if (signInError.status === 400) {
          // For 400 errors, show more detail
          const errorMsg = signInError.message || signInError.msg || 'Invalid request. Please check your email and password.';
          setError(`Login failed: ${errorMsg} (Error code: ${signInError.status || '400'})`);
        } else {
          setError(signInError.message || signInError.msg || 'Login failed. Please try again.');
        }
        return;
      }

      // Wait for auth state to update (important for mobile browsers)
      // Get the current user after signIn completes
      let currentUser = user;
      
      // If user not immediately available, wait a bit and check again
      if (!currentUser) {
        // Wait for auth state to propagate
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data: { user: fetchedUser } } = await supabase.auth.getUser();
        currentUser = fetchedUser;
      }

      if (!currentUser) {
        setError('Unable to verify user. Please try again.');
        return;
      }

      // Check if user is super admin
      // Check email ending with @digiget.uk (case-insensitive)
      const emailLower = currentUser.email?.toLowerCase() || '';
      const isSuperAdminByEmail = emailLower.endsWith('@digiget.uk');
      const isSuperAdminByMetadata = currentUser.user_metadata?.role === 'super' || 
                                     currentUser.user_metadata?.is_super_admin === true;
      const isSuperAdmin = isSuperAdminByEmail || isSuperAdminByMetadata;

      console.log('Login check:', {
        email: currentUser.email,
        emailLower,
        isSuperAdminByEmail,
        isSuperAdminByMetadata,
        user_metadata: currentUser.user_metadata,
        isSuperAdmin
      });

      if (isSuperAdmin) {
        // Redirect super admin to super admin dashboard
        // Use window.location for mobile browsers to ensure clean redirect
        console.log('Redirecting super admin to dashboard');
        
        // Wait a bit more to ensure auth state is fully updated
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Use replace to avoid back button issues, and full navigation for mobile
        if (window.location.pathname === '/super-admin/dashboard') {
          // Already on dashboard, just reload
          window.location.reload();
        } else {
          // Navigate with replace to prevent loop
          window.location.href = '/super-admin/dashboard';
        }
        return;
      }

      // For regular users, check for shops
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (shopsError) {
        console.error('Shops query error:', shopsError);
        // Provide more specific error message
        if (shopsError.code === 'PGRST116') {
          setError('Database tables not set up. Please contact support.');
        } else if (shopsError.code === '42501') {
          setError('Permission denied. Please check your account permissions.');
        } else {
          setError(`Unable to load your shop: ${shopsError.message}`);
        }
        return;
      }

      if (shops && shops.length > 0) {
        // Wait a bit for auth state to update before redirecting
        await new Promise(resolve => setTimeout(resolve, 100));
        navigate(`/dashboard/${shops[0].id}`, { replace: true });
      } else {
        setError('No shop found. Please sign up first.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-2 sm:p-4" 
      style={{ 
        position: 'relative', 
        zIndex: 100,
        minHeight: '-webkit-fill-available',
        backgroundColor: '#f5f5f7' // Light gray background
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-12 max-w-md w-full overflow-y-auto" 
        style={{ 
          position: 'relative', 
          zIndex: 100,
          marginTop: 'auto',
          marginBottom: 'auto',
          maxHeight: '-webkit-fill-available'
        }}
      >
        {/* Logo/Icon */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-modern-blue to-modern-indigo rounded-modern flex items-center justify-center shadow-modern">
              <span className="text-3xl">🔐</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 bg-gradient-to-r from-modern-blue to-modern-indigo bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-lg">Sign in to your DigiGet account</p>
        </div>

        {successMessage && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 border border-green-200">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form 
          onSubmit={handleSubmit} 
          className="space-y-5" 
          noValidate 
          style={{ position: 'relative', zIndex: 100 }}
          autoComplete="on"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-modern"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <Link 
                to="/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-modern"
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-modern btn-modern-primary touch-manipulation"
            style={{ 
              minHeight: '48px',
              WebkitTapHighlightColor: 'transparent',
              position: 'relative',
              zIndex: 100,
              touchAction: 'manipulation',
              userSelect: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
            onClick={(e) => {
              // Ensure form submission on mobile
              if (!e.defaultPrevented) {
                const form = e.currentTarget.closest('form');
                if (form && !form.checkValidity()) {
                  form.reportValidity();
                }
              }
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-600 mb-3">
            Don't have an account?
          </p>
          <Link to="/signup" className="inline-block px-6 py-3 bg-gradient-to-r from-modern-blue/10 to-modern-indigo/10 text-modern-blue hover:from-modern-blue/20 hover:to-modern-indigo/20 font-bold rounded-modern transition-all duration-300 border-2 border-modern-blue/30 hover:border-modern-blue/50">
            Start Free Trial
          </Link>
        </div>
      </div>
    </div>
  );
}
