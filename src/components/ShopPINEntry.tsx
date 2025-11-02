import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface ShopPINEntryProps {
  code: string;
  onUnlock: (shop: any) => void;
}

export function ShopPINEntry({ code, onUnlock }: ShopPINEntryProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Verify shop PIN
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('id, shop_name, short_code, shop_pin')
        .eq('short_code', code)
        .maybeSingle();

      if (shopError) {
        setError('Failed to find shop');
        setLoading(false);
        return;
      }

      if (!shop) {
        setError('Shop not found');
        setLoading(false);
        return;
      }

      // Check if shop PIN is set
      if (!shop.shop_pin || shop.shop_pin === '') {
        setError('Shop PIN not configured. Please contact the shop owner.');
        setLoading(false);
        return;
      }

      if (shop.shop_pin !== pin) {
        setError('Incorrect shop PIN');
        setPin('');
        setLoading(false);
        return;
      }

      // Unlock shop portal
      onUnlock(shop);

    } catch (error: any) {
      console.error('Shop PIN error:', error);
      setError('Failed to unlock. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🏪</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Shop Portal</h1>
          <p className="text-gray-600">Enter shop PIN to access tablet</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              className="w-full px-4 py-6 border-2 border-gray-300 rounded-xl text-center text-4xl font-semibold tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={pin.length !== 6 || loading}
          >
            {loading ? 'Unlocking...' : 'Unlock Tablet'}
          </button>
        </form>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <strong className="text-blue-900 text-sm">💡 Staff:</strong>
          <p className="mb-0 mt-2 text-blue-800 text-xs">
            This is the shop PIN (shared with everyone). 
            You'll enter YOUR personal PIN when clocking in or checking in customers.
          </p>
        </div>

        <p className="text-gray-600 text-sm text-center mt-6">
          Need your personal portal?{' '}
          <a href={`/staff/${code}`} className="text-blue-600 hover:text-blue-700 font-medium">
            Access Staff Portal →
          </a>
        </p>
      </div>
    </div>
  );
}

