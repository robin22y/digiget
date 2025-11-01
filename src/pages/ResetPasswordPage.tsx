import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { logger, getUserFriendlyError } from '../lib/logger';
import { validatePassword } from '../lib/validation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a valid reset token in the URL
    const hash = window.location.hash;
    if (!hash && !searchParams.get('token')) {
      setMessage({
        type: 'error',
        text: 'Invalid or missing reset link. Please request a new password reset.',
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validate passwords
    if (!validatePassword(password)) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 8 characters and contain both letters and numbers.',
      });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match. Please try again.',
      });
      return;
    }

    setLoading(true);

    try {
      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        logger.error('Password update error', error);
        setMessage({
          type: 'error',
          text: getUserFriendlyError(error),
        });
        setLoading(false);
        return;
      }

      // Success
      setMessage({
        type: 'success',
        text: 'Password reset successfully! Redirecting to login...',
      });

      // Clear the hash/token from URL
      window.history.replaceState({}, '', window.location.pathname);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Password reset successfully. Please log in with your new password.' }
        });
      }, 2000);
    } catch (err: any) {
      logger.error('Password reset failed', err);
      setMessage({
        type: 'error',
        text: getUserFriendlyError(err),
      });
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div className="card">
          <div className="text-center mb-6">
            <div className="mb-4 flex justify-center">
              <div 
                className="w-16 h-16 bg-gradient-to-br from-modern-blue to-modern-indigo rounded-modern flex items-center justify-center shadow-modern"
                style={{ 
                  background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              >
                <span className="text-3xl">🔑</span>
              </div>
            </div>
            <h1 className="mb-2">Reset Your Password</h1>
            <p className="text-muted">
              Enter your new password below.
            </p>
          </div>

          {message && (
            <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-group">
              <label className="label">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="input"
                minLength={8}
                autoFocus
              />
              <span className="help-text">
                Must be at least 8 characters with letters and numbers
              </span>
            </div>

            <div className="form-group">
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="input"
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <Link 
              to="/login" 
              className="text-primary hover:underline"
              style={{ color: '#2563EB' }}
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

