import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { QRCode } from 'react-qr-code';
import { Copy, Download, Power, PowerOff, QrCode, ExternalLink, X, CheckCircle, FileImage, FileText, Sparkles } from 'lucide-react';

interface Shop {
  id: string;
  shop_name: string;
  owner_name: string;
  owner_email: string;
  postcode: string | null;
  qr_url: string | null;
  qr_code_active: boolean;
  subscription_status: string;
  branded_qr_url?: string | null;
  branded_qr_pdf?: string | null;
}

export default function QRManagement() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [copiedShopId, setCopiedShopId] = useState<string | null>(null);
  const qrRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setError(null);
      // Try with postcode first
      let { data, error: queryError } = await supabase
        .from('shops')
        .select('id, shop_name, owner_name, owner_email, postcode, qr_url, qr_code_active, subscription_status, branded_qr_url, branded_qr_pdf')
        .order('shop_name', { ascending: true });

      // If postcode column doesn't exist, try without it
      if (queryError && (queryError.message?.includes('postcode') || queryError.code === '42703')) {
        console.warn('Postcode column not found, loading without it');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('shops')
          .select('id, shop_name, owner_name, owner_email, qr_url, qr_code_active, subscription_status, branded_qr_url, branded_qr_pdf')
          .order('shop_name', { ascending: true });
        
        if (fallbackError) {
          setError(`Failed to load shops: ${fallbackError.message}`);
          setShops([]);
          return;
        }
        // Add null postcode to all shops
        data = (fallbackData || []).map(shop => ({ ...shop, postcode: null }));
        queryError = null;
      }

      if (queryError) {
        console.error('Error loading shops:', queryError);
        setError(`Failed to load shops: ${queryError.message}`);
        setShops([]);
        return;
      }
      
      // Ensure all shops have QR URLs
      const shopsWithQR = (data || []).map(shop => ({
        ...shop,
        qr_url: shop.qr_url || `${window.location.origin}/customer/${shop.id}/login`
      }));
      
      setShops(shopsWithQR);
    } catch (error: any) {
      console.error('Error loading shops:', error);
      setError(`Unexpected error: ${error.message || 'Unknown error'}`);
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleQR = async (shop: Shop) => {
    try {
      const { error } = await supabase
        .from('shops')
        .update({ qr_code_active: !shop.qr_code_active })
        .eq('id', shop.id);

      if (error) throw error;
      loadShops();
    } catch (error: any) {
      alert(`Failed to toggle QR: ${error.message}`);
    }
  };

  const handleCopyLink = (shopId: string, qrUrl: string) => {
    navigator.clipboard.writeText(qrUrl);
    setCopiedShopId(shopId);
    setTimeout(() => setCopiedShopId(null), 2000);
  };

  const handleDownloadQR = (shop: Shop) => {
    const qrElement = qrRefs.current[shop.id];
    if (!qrElement) return;

    const svg = qrElement.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const scale = 4;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `digiget-qr-${shop.shop_name.replace(/\s+/g, '-').toLowerCase()}.png`;
            link.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">QR Code Management</h1>
        <button
          onClick={loadShops}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-sm text-gray-600 mb-4">
          Manage QR codes for all shops. Each QR code links directly to the shop's check-in page.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-semibold text-gray-900">Shop Name</th>
                <th className="text-left py-3 font-semibold text-gray-900">Owner</th>
                <th className="text-left py-3 font-semibold text-gray-900">Postcode</th>
                <th className="text-left py-3 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 font-semibold text-gray-900">QR Status</th>
                <th className="text-left py-3 font-semibold text-gray-900">QR Code</th>
                <th className="text-left py-3 font-semibold text-gray-900">Branded</th>
                <th className="text-right py-3 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shops.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    {error ? 'Error loading shops. Please try refreshing.' : 'No shops found'}
                  </td>
                </tr>
              ) : (
                shops.map((shop) => {
                  const checkInUrl = shop.qr_url || `${window.location.origin}/customer/${shop.id}/login`;
                  return (
                    <tr key={shop.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-gray-900 font-medium">{shop.shop_name}</td>
                      <td className="py-3 text-gray-700">{shop.owner_name}</td>
                      <td className="py-3 text-gray-600">{shop.postcode || '-'}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            shop.subscription_status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : shop.subscription_status === 'trial'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {shop.subscription_status}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            shop.qr_code_active !== false
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {shop.qr_code_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div 
                          ref={el => qrRefs.current[shop.id] = el}
                          className="inline-block bg-white p-2 border border-gray-200 rounded"
                        >
                          <QRCode
                            value={checkInUrl}
                            size={60}
                            level="H"
                            includeMargin={false}
                          />
                        </div>
                      </td>
                      <td className="py-3">
                        {shop.branded_qr_url ? (
                          <div className="flex items-center gap-1">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Available
                            </span>
                            <a
                              href={shop.branded_qr_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title="Download Branded PNG"
                            >
                              <FileImage className="w-3.5 h-3.5" />
                            </a>
                            {shop.branded_qr_pdf && (
                              <a
                                href={shop.branded_qr_pdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                title="Download Branded PDF"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Not Generated
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedShop(shop)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCopyLink(shop.id, checkInUrl)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Copy link"
                          >
                            {copiedShopId === shop.id ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDownloadQR(shop)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Download QR"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <a
                            href={checkInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Open check-in page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleToggleQR(shop)}
                            className={`p-2 rounded-lg transition-colors ${
                              shop.qr_code_active !== false
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={shop.qr_code_active !== false ? 'Deactivate QR' : 'Activate QR'}
                          >
                            {shop.qr_code_active !== false ? (
                              <PowerOff className="w-4 h-4" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Preview Modal */}
      {selectedShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">QR Code for {selectedShop.shop_name}</h2>
              <button
                onClick={() => setSelectedShop(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg border-2 border-gray-200 mb-4 flex justify-center">
              <QRCode
                value={selectedShop.qr_url || `${window.location.origin}/customer/${selectedShop.id}/login`}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-600 mb-1">Check-In URL:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={selectedShop.qr_url || `${window.location.origin}/customer/${selectedShop.id}/login`}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm font-mono truncate"
                />
                <button
                  onClick={() => handleCopyLink(selectedShop.id, selectedShop.qr_url || `${window.location.origin}/dashboard/${selectedShop.id}/checkin`)}
                  className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                >
                  {copiedShopId === selectedShop.id ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleDownloadQR(selectedShop)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Download className="w-5 h-5" />
                Download QR
              </button>
              <a
                href={`mailto:${selectedShop.owner_email}?subject=DigiGet Customer Portal QR Code&body=Your customer portal QR code link: ${selectedShop.qr_url || `${window.location.origin}/customer/${selectedShop.id}/login`}`}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Email Link
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

