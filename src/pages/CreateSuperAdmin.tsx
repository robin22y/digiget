import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSuperAdminAccount, DEFAULT_SUPER_ADMIN_EMAIL, DEFAULT_SUPER_ADMIN_PASSWORD } from '../utils/createSuperAdmin';
import { supabase } from '../lib/supabase';

export default function CreateSuperAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleCreateAccount = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    const result = await createSuperAdminAccount();

    if (result.success) {
      setMessage('Super admin account created! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      if (result.message.includes('already exists')) {
        // Try to sign in instead
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: DEFAULT_SUPER_ADMIN_EMAIL,
          password: DEFAULT_SUPER_ADMIN_PASSWORD,
        });

        if (signInError) {
          setError('Account exists but password may have been changed. Please use the login page.');
        } else {
          setMessage('Signed in successfully! Redirecting...');
          setTimeout(() => {
            navigate('/super-admin/dashboard');
          }, 1000);
        }
      } else {
        setError(result.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Super Admin Account</h1>
          <p className="text-sm text-gray-600">
            This will create a super admin account with default credentials
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-blue-900 mb-2">Default Credentials:</p>
          <div className="space-y-1 text-sm">
            <p><span className="font-semibold">Email:</span> {DEFAULT_SUPER_ADMIN_EMAIL}</p>
            <p><span className="font-semibold">Password:</span> {DEFAULT_SUPER_ADMIN_PASSWORD}</p>
          </div>
          <p className="text-xs text-blue-700 mt-2">
            ⚠️ Change this password after first login for security!
          </p>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
            <p className="text-sm text-green-800">{message}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          onClick={handleCreateAccount}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : 'Create Super Admin Account'}
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

