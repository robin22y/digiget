import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface ShortUrlRedirectProps {
  redirectType: 'clock-in' | 'portal';
}

/**
 * Component that resolves short codes to shop IDs and redirects
 * Used for /s/:code (clock-in) and /p/:code (portal) routes
 */
export default function ShortUrlRedirect({ redirectType }: ShortUrlRedirectProps) {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function resolveShortCode() {
      if (!code) {
        setError('Invalid code');
        setLoading(false);
        return;
      }

      try {
        // Look up shop by short code (case-insensitive)
        const { data: shop, error: lookupError } = await supabase
          .from('shops')
          .select('id')
          .eq('short_code', code.toUpperCase())
          .maybeSingle();

        if (lookupError) {
          console.error('Short code lookup error:', lookupError);
          setError('Failed to resolve code');
          setLoading(false);
          return;
        }

        if (!shop) {
          // Code not found, redirect to 404
          navigate('/404', { replace: true });
          return;
        }

        // Redirect to appropriate page based on type
        if (redirectType === 'clock-in') {
          navigate(`/staff/${shop.id}/clock-in`, { replace: true });
        } else {
          // portal - redirect to personal staff portal using short code
          navigate(`/staff/${code.toUpperCase()}`, { replace: true });
        }
      } catch (err: any) {
        console.error('Error resolving short code:', err);
        setError(err.message || 'An error occurred');
        setLoading(false);
      }
    }

    resolveShortCode();
  }, [code, navigate, redirectType]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return null;
}

