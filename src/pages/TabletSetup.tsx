import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { authorizeDevice } from '../lib/deviceFingerprint';

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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('device.first_time_setup')}</h1>
          <p className="text-gray-600 mb-6">
            {t('device.owner_login')}
          </p>

          <form onSubmit={handleOwnerLogin} className="text-left">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('device.owner_email')}
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
                required
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('device.password')}
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? t('common.loading') : t('common.next')}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
            <strong className="text-blue-900">{t('common.important')}:</strong>
            <p className="text-sm text-blue-800 mt-2 mb-0">
              Staff? Ask the owner to set up this tablet first.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center">
        <div className="text-6xl mb-4 text-green-600">✓</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('device.authorize_tablet')}</h1>
        
        <div className="my-6">
          <div className="text-5xl mb-3">📱</div>
          <p className="text-gray-600">
            {t('device.authorize_description')}
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
          <strong className="text-yellow-900 block mb-2">⚠️ {t('device.important')}</strong>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>Counter tablet at shop</li>
            <li>Reception device at shop</li>
            <li className="text-yellow-600">Not for personal phone</li>
            <li className="text-yellow-600">Not for home computer</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleAuthorizeTablet}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 mb-3"
          disabled={loading}
        >
          {loading ? t('common.loading') : t('device.authorize')}
        </button>

        <button
          onClick={() => setStep('login')}
          className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
        >
          ← {t('common.back')}
        </button>
      </div>
    </div>
  );
}

