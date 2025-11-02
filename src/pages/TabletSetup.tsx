import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { authorizeDevice } from '../lib/deviceFingerprint';
import '../styles/shop-owner.css';

export function TabletSetup() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState<'login' | 'authorize'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shop, setShop] = useState<any>(null);

  async function handleOwnerLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Sign in owner
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!code) {
        setError('Shop code missing');
        setLoading(false);
        return;
      }

      // Verify owner owns this shop
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('short_code', code)
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (shopError || !shopData) {
        setError(t('device.not_owner'));
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      setShop(shopData);
      setStep('authorize');
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  }

  async function handleAuthorizeTablet() {
    if (!shop?.id || !shop?.user_id) return;

    setLoading(true);
    setError('');

    try {
      const result = await authorizeDevice(
        shop.id,
        shop.user_id,
        'Shop Tablet'
      );

      if (!result.success) {
        setError(result.error || 'Failed to authorize tablet');
        setLoading(false);
        return;
      }

      // Redirect to shop portal
      navigate(`/shop/${code}`);
    } catch (err: any) {
      console.error('Authorization error:', err);
      setError('Failed to authorize tablet');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'login') {
    return (
      <div className="setup-page">
        <div className="container-small">
          <div className="card text-center">
            <div className="setup-icon">🔐</div>
            <h1 className="mb-2">{t('device.first_time_setup')}</h1>
            <p className="text-gray-600 mb-4">
              {t('device.owner_login')}
            </p>

            <form onSubmit={handleOwnerLogin}>
              <div className="form-group text-left">
                <label className="label">{t('device.owner_email')}</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@example.com"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group text-left">
                <label className="label">{t('device.password')}</label>
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary btn-large"
                disabled={loading}
              >
                {loading ? t('common.loading') : t('common.next')}
              </button>
            </form>

            <div className="alert alert-info mt-4 text-left">
              <strong>Staff?</strong>
              <p className="mb-0 mt-2">
                Ask the owner to set up this tablet first.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-page">
      <div className="container-small">
        <div className="card text-center">
          <div className="success-icon">✓</div>
          <h1 className="mb-2">{t('device.authorize_tablet')}</h1>
          
          <div className="device-preview">
            <div className="device-icon">📱</div>
            <p className="text-gray-600">
              Authorize this tablet as a trusted device. You won't need to enter the shop PIN on this device again.
            </p>
          </div>

          <div className="alert alert-warning text-left">
            <strong>⚠️ Important:</strong>
            <ul className="mb-0 mt-2">
              <li>✓ Counter tablet at shop</li>
              <li>✓ Reception device at shop</li>
              <li>❌ Personal phone</li>
              <li>❌ Home computer</li>
            </ul>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <button
            onClick={handleAuthorizeTablet}
            className="btn btn-primary btn-large"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('device.authorize')}
          </button>

          <button
            onClick={() => setStep('login')}
            className="btn btn-secondary mt-2"
          >
            ← {t('common.back')}
          </button>
        </div>
      </div>
    </div>
  );
}

