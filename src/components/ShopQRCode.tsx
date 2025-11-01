import { useState, useRef, useEffect } from 'react';
import { QRCode } from 'react-qr-code';
import { Download, Copy, RefreshCw, CheckCircle, FileImage, FileText, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ShopQRCodeProps {
  shopId: string;
  shopName: string;
}

interface Shop {
  branded_qr_url?: string | null;
  branded_qr_pdf?: string | null;
}

export default function ShopQRCode({ shopId, shopName }: ShopQRCodeProps) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [shop, setShop] = useState<Shop | null>(null);
  const [generatingBranded, setGeneratingBranded] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // QR code links to customer login portal
  const defaultCheckInUrl = `${window.location.origin}/customer/${shopId}/login`;

  // Load or generate QR URL
  useEffect(() => {
    const loadQRUrl = async () => {
      if (!shopId) {
        setQrUrl(defaultCheckInUrl);
        return;
      }

      try {
        // Try to fetch existing QR URL and branded QR URLs
        const { data: shopData, error: fetchError } = await supabase
          .from('shops')
          .select('qr_url, qr_code_active, branded_qr_url, branded_qr_pdf')
          .eq('id', shopId)
          .maybeSingle();

        if (fetchError) {
          console.warn('Could not fetch shop QR URL (may be missing columns):', fetchError);
          // Continue with default URL even if fetch fails
          setQrUrl(defaultCheckInUrl);
          return;
        }

        if (shopData) {
          setShop(shopData);
          if (shopData.qr_url) {
            setQrUrl(shopData.qr_url);
          } else {
          // Generate and save if not exists (for existing shops without QR codes)
          const newQrUrl = defaultCheckInUrl;
          
          // Try to update, but don't fail if columns don't exist
          try {
            const { error: updateError } = await supabase
              .from('shops')
              .update({ 
                qr_url: newQrUrl,
                qr_code_active: true 
              })
              .eq('id', shopId);
            
            if (updateError) {
              // If update fails (e.g., columns don't exist), log but continue
              console.warn('Could not save QR URL to database (columns may not exist):', updateError);
            }
          } catch (updateErr) {
            console.warn('Error updating QR URL:', updateErr);
          }
          
          // Always set the URL locally even if DB update fails
          setQrUrl(newQrUrl);
          }
        }
      } catch (error) {
        console.error('Error loading QR URL:', error);
        // Always fallback to default URL
        setQrUrl(defaultCheckInUrl);
      }
    };

    loadQRUrl();
  }, [shopId, defaultCheckInUrl]);

  const handleGenerateBranded = async () => {
    if (!confirm('Generate branded QR poster? This will create a print-ready poster with DigiGet branding.')) {
      return;
    }

    setGeneratingBranded(true);
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be logged in to generate branded QR codes.');
        setGeneratingBranded(false);
        return;
      }

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('generate-branded-qr', {
        body: { shopId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        // Reload shop data to get new branded QR URL
        const { data: shopData } = await supabase
          .from('shops')
          .select('branded_qr_url, branded_qr_pdf')
          .eq('id', shopId)
          .single();
        
        if (shopData) {
          setShop(shopData);
        }
        
        alert('✅ Branded QR code generated successfully! You can now download it below.');
      } else {
        throw new Error(data?.error || 'Failed to generate branded QR');
      }
    } catch (error: any) {
      console.error('Error generating branded QR:', error);
      alert('Failed to generate branded QR: ' + (error.message || 'Unknown error'));
    } finally {
      setGeneratingBranded(false);
    }
  };

  const handleCopyLink = () => {
    if (!qrUrl) return;
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!confirm('Regenerate QR code? The link will remain the same, but this will refresh the code.')) {
      return;
    }

    setRegenerating(true);
    try {
      // Regenerate QR URL (ensures it uses the current domain)
      const newQrUrl = defaultCheckInUrl;
      
      // Try to update database, but don't fail if it doesn't work
      try {
        const { error } = await supabase
          .from('shops')
          .update({ 
            qr_url: newQrUrl, 
            qr_code_active: true,
            updated_at: new Date().toISOString() 
          })
          .eq('id', shopId);
        
        if (error) {
          console.warn('Could not update QR URL in database:', error);
          // Continue anyway - the QR code will still work
        }
      } catch (updateErr) {
        console.warn('Error updating QR URL:', updateErr);
      }
      
      // Always update local state
      setQrUrl(newQrUrl);
      
      setTimeout(() => {
        setRegenerating(false);
        alert('QR Code regenerated successfully! You can now reprint or download it.');
      }, 500);
    } catch (error: any) {
      console.error('Error regenerating QR:', error);
      setRegenerating(false);
      // Even on error, update the URL locally
      setQrUrl(defaultCheckInUrl);
      alert('QR Code refreshed (may not be saved to database). You can still use it.');
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // High resolution for printing
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
            link.download = `digiget-checkin-qr-${shopName.replace(/\s+/g, '-').toLowerCase()}.png`;
            link.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Check-In QR Code</h2>
          <p className="text-sm text-gray-600 mt-1">
            Customers can scan this QR code to access their customer portal to view points and account. 
            Print or download to display at your shop.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            disabled={regenerating || !qrUrl}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Re-generate QR Code"
          >
            <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
            {regenerating ? 'Regenerating...' : 'Re-Generate'}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* QR Code Display */}
        <div className="flex-shrink-0">
          <div className="bg-white p-6 rounded-lg border-2 border-gray-200 flex justify-center" ref={qrRef}>
            {qrUrl ? (
              <QRCode
                value={qrUrl}
                size={200}
                level="H"
                includeMargin={true}
                fgColor="#1f2937"
                bgColor="#ffffff"
              />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-400">
                Loading QR Code...
              </div>
            )}
          </div>
        </div>

        {/* Actions and Info */}
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-In URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={qrUrl || defaultCheckInUrl}
                readOnly
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                title="Copy link"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDownloadQR}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              Download QR as PNG
            </button>
            <button
              onClick={() => {
                // Open print dialog with only the QR code section
                const printContent = qrRef.current?.innerHTML || '';
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>${shopName} - Check-In QR Code</title>
                        <style>
                          @page { margin: 20mm; size: A4; }
                          body { 
                            font-family: Arial, sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            padding: 20px;
                          }
                          h1 { margin: 0 0 10px 0; font-size: 24px; color: #1f2937; }
                          p { margin: 0 0 30px 0; color: #6b7280; font-size: 14px; }
                          .qr-container { 
                            border: 2px solid #e5e7eb;
                            padding: 20px;
                            border-radius: 8px;
                            background: white;
                          }
                          svg { display: block; }
                        </style>
                      </head>
                      <body>
                        <h1>${shopName}</h1>
                        <p>Customer Portal QR Code - Scan to view your account</p>
                        <div class="qr-container">${printContent}</div>
                        <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">
                          Powered by DigiGet - digiget.uk
                        </p>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  printWindow.onload = () => {
                    printWindow.focus();
                    printWindow.print();
                  };
                }
              }}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Print
            </button>
          </div>

          {/* Branded QR Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-4 mt-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-indigo-900 mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Branded QR Poster
                </h3>
                <p className="text-xs text-indigo-700">
                  Professional A5 print-ready poster with DigiGet branding
                </p>
              </div>
              {!shop?.branded_qr_url && (
                <button
                  onClick={handleGenerateBranded}
                  disabled={generatingBranded}
                  className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  {generatingBranded ? 'Generating...' : 'Generate'}
                </button>
              )}
            </div>
            
            {shop?.branded_qr_url ? (
              <div className="flex gap-2">
                <a
                  href={shop.branded_qr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium"
                >
                  <FileImage className="w-4 h-4" />
                  Download PNG
                </a>
                {shop.branded_qr_pdf && (
                  <a
                    href={shop.branded_qr_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    Download PDF
                  </a>
                )}
              </div>
            ) : (
              <p className="text-xs text-indigo-600">
                Click "Generate" to create a branded poster with your shop name and DigiGet logo.
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">📱 How to Use</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Download or print this QR code</li>
              <li>Display it at your shop entrance or counter</li>
              <li>Customers scan it to access their portal to view points and account</li>
              <li>No app download required - works with any QR scanner</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

