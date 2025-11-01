import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { logger, getUserFriendlyError } from '../lib/logger';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Use Supabase's built-in password reset
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        logger.error('Password reset error', error, { email });
        setMessage({
          type: 'error',
          text: getUserFriendlyError(error),
        });
        setLoading(false);
        return;
      }

      // Success - show confirmation message
      setMessage({
        type: 'success',
        text: 'Password reset email sent! Please check your inbox and click the link to reset your password.',
      });
      setEmail(''); // Clear email for security
    } catch (err: any) {
      logger.error('Password reset failed', err, { email });
      setMessage({
        type: 'error',
        text: getUserFriendlyError(err),
      });
    } finally {
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
                <span className="text-3xl">🔐</span>
              </div>
            </div>
            <h1 className="mb-2">Forgot Password?</h1>
            <p className="text-muted">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {message && (
            <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-group">
              <label className="label">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
                autoFocus
              />
              <span className="help-text">
                We'll send a password reset link to this email address.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
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

        <div className="mt-6 text-center">
          <p className="text-muted text-sm">
            Remember your password?{' '}
            <Link to="/login" className="text-primary" style={{ color: '#2563EB' }}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

