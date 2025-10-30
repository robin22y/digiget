import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { signIn } = useAuth();

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

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Unable to verify user. Please try again.');
        return;
      }

      // Check if user is super admin
      // Check email ending with @digiget.uk (case-insensitive)
      const emailLower = user.email?.toLowerCase() || '';
      const isSuperAdminByEmail = emailLower.endsWith('@digiget.uk');
      const isSuperAdminByMetadata = user.user_metadata?.role === 'super' || 
                                     user.user_metadata?.is_super_admin === true;
      const isSuperAdmin = isSuperAdminByEmail || isSuperAdminByMetadata;

      console.log('Login check:', {
        email: user.email,
        emailLower,
        isSuperAdminByEmail,
        isSuperAdminByMetadata,
        user_metadata: user.user_metadata,
        isSuperAdmin
      });

      if (isSuperAdmin) {
        // Redirect super admin to super admin dashboard
        console.log('Redirecting super admin to dashboard');
        navigate('/super-admin/dashboard');
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
        navigate(`/dashboard/${shops[0].id}`);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full animate-fade-in">
        {/* Logo/Icon */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-apple-blue to-apple-indigo rounded-ios flex items-center justify-center shadow-apple">
              <span className="text-3xl">🔐</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 bg-gradient-to-r from-apple-blue to-apple-indigo bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-lg">Sign in to your DigiGet account</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
              className="input-ios"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-ios"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-ios btn-ios-primary"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-600 mb-3">
            Don't have an account?
          </p>
          <Link to="/signup" className="inline-block px-6 py-3 bg-gradient-to-r from-apple-blue/10 to-apple-indigo/10 text-apple-blue hover:from-apple-blue/20 hover:to-apple-indigo/20 font-bold rounded-ios transition-all duration-300 border-2 border-apple-blue/30 hover:border-apple-blue/50">
            Start Free Trial
          </Link>
        </div>
      </div>
    </div>
  );
}
