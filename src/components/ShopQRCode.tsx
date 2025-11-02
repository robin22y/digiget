import { useState, useRef, useEffect } from 'react';
import { QRCode } from 'react-qr-code';
import { Download, Copy, RefreshCw, CheckCircle, FileImage, FileText, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ShopQRCodeProps {
  shopId: string;
  shopName: string;
}

interface Shop {
  short_code?: string | null;
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

  // Load shop short_code and generate staff clock-in URL
  useEffect(() => {
    const loadQRUrl = async () => {
      if (!shopId) {
        return;
      }

      try {
        // Fetch shop short_code for staff clock-in QR code
        const { data: shopData, error: fetchError } = await supabase
          .from('shops')
          .select('short_code, branded_qr_url, branded_qr_pdf')
          .eq('id', shopId)
          .maybeSingle();

        if (fetchError) {
          console.warn('Could not fetch shop data:', fetchError);
          return;
        }

        if (shopData) {
          setShop(shopData);
          // Use short code URL for staff clock-in
          if (shopData.short_code) {
            const staffClockInUrl = `${window.location.origin}/s/${shopData.short_code}`;
            setQrUrl(staffClockInUrl);
          } else {
            // Fallback to UUID-based URL if short_code doesn't exist yet
            const fallbackUrl = `${window.location.origin}/staff/${shopId}/clock-in`;
            setQrUrl(fallbackUrl);
            console.warn('Shop does not have short_code yet. Using fallback URL.');
          }
        }
      } catch (error) {
        console.error('Error loading QR URL:', error);
      }
    };

    loadQRUrl();
  }, [shopId]);

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
    if (!confirm('Refresh QR code display? The link will remain the same, but this will refresh the visual code.')) {
      return;
    }

    setRegenerating(true);
    try {
      // Just refresh the display - URL doesn't change (it's based on short_code)
      // Reload shop data to ensure we have latest short_code
      const { data: shopData } = await supabase
        .from('shops')
        .select('short_code')
        .eq('id', shopId)
        .maybeSingle();

      if (shopData?.short_code) {
        const staffClockInUrl = `${window.location.origin}/s/${shopData.short_code}`;
        setQrUrl(staffClockInUrl);
      }
      
      setTimeout(() => {
        setRegenerating(false);
        alert('QR Code refreshed successfully! You can now reprint or download it.');
      }, 500);
    } catch (error: any) {
      console.error('Error regenerating QR:', error);
      setRegenerating(false);
      alert('QR Code refreshed.');
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
            link.download = `${shopName.replace(/\s+/g, '-').toLowerCase()}-staff-clock-in-qr.png`;
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
          <h2 className="text-lg font-semibold text-gray-900">Staff Clock-In QR Code</h2>
          <p className="text-sm text-gray-600 mt-1">
            Print this QR code and place it near your shop entrance. Staff scan it to quickly clock in/out. 
            Takes only 5 seconds per clock-in.
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
                id="staff-clock-in-qr"
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
              Staff Clock-In URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={qrUrl || ''}
                readOnly
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono truncate"
                onClick={(e) => (e.target as HTMLInputElement).select()}
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
              Download QR Code (PNG)
            </button>
            <button
              onClick={() => {
                // Get QR code SVG
                const svg = qrRef.current?.querySelector('svg');
                if (!svg) return;
                
                const svgData = new XMLSerializer().serializeToString(svg);
                const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
                
                // Create printable card with instructions
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>Staff Clock-In Card - ${shopName}</title>
                        <style>
                          @page { margin: 20mm; size: A4; }
                          body { 
                            font-family: Arial, sans-serif;
                            max-width: 600px;
                            margin: 40px auto;
                            padding: 40px;
                            text-align: center;
                          }
                          h1 { 
                            margin: 0 0 10px 0; 
                            font-size: 32px; 
                            color: #1f2937; 
                          }
                          h2 {
                            margin: 0 0 30px 0;
                            font-size: 24px;
                            color: #6b7280;
                          }
                          .qr-container { 
                            background: white;
                            padding: 30px;
                            border: 3px solid #1f2937;
                            border-radius: 12px;
                            margin: 30px auto;
                            display: inline-block;
                          }
                          .instructions {
                            text-align: left;
                            margin: 30px auto;
                            max-width: 400px;
                            background: #f5f5f5;
                            padding: 20px;
                            border-radius: 8px;
                          }
                          .instructions h3 {
                            margin-top: 0;
                            color: #1f2937;
                            font-size: 18px;
                          }
                          .instructions ol {
                            margin: 10px 0;
                            padding-left: 20px;
                          }
                          .instructions li {
                            margin: 10px 0;
                            font-size: 16px;
                            line-height: 1.5;
                          }
                          .url {
                            font-family: monospace;
                            background: #e0e0e0;
                            padding: 10px;
                            border-radius: 4px;
                            margin: 20px 0;
                            word-break: break-all;
                            font-size: 14px;
                          }
                          .footer {
                            color: #9ca3af;
                            font-size: 14px;
                            margin-top: 40px;
                          }
                          svg { display: block; }
                        </style>
                      </head>
                      <body>
                        <h1>${shopName}</h1>
                        <h2>Staff Clock-In</h2>
                        
                        <div class="qr-container">
                          <img src="data:image/svg+xml;base64,${svgBase64}" width="300" height="300" alt="Staff Clock-In QR Code" />
                        </div>
                        
                        <div class="instructions">
                          <h3>📱 How to Clock In:</h3>
                          <ol>
                            <li>Open camera on your phone</li>
                            <li>Point at QR code above</li>
                            <li>Tap notification to open link</li>
                            <li>Enter your 4-digit PIN</li>
                            <li>Tap "Clock In" - Done!</li>
                          </ol>
                          
                          <p><strong>Or visit:</strong></p>
                          <div class="url">${qrUrl ? qrUrl.replace(window.location.origin, 'digiget.uk') : 'digiget.uk/s/[CODE]'}</div>
                        </div>
                        
                        <p class="footer">
                          Powered by DigiGet
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
              Print Card
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
            <h3 className="text-sm font-semibold text-blue-900 mb-2">📱 How It Works</h3>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Print this QR code (or download and print the PNG)</li>
              <li>Place near entrance at chest height</li>
              <li>Staff scans with phone camera</li>
              <li>Enters 4-digit PIN</li>
              <li>Clocked in! (5 seconds total)</li>
            </ol>
            <div className="mt-3 p-3 bg-blue-100 rounded-lg border border-blue-300">
              <p className="text-xs text-blue-900 font-medium">💡 Tip:</p>
              <p className="text-xs text-blue-800">
                Laminate the printed QR code or put it in a plastic sleeve to protect it from wear and tear.
              </p>
            </div>
            <div className="mt-3">
              <p className="text-xs text-blue-700 font-medium mb-1">Or share the link:</p>
              <p className="text-xs text-blue-600">
                Staff can bookmark the link above on their phones for quick access without scanning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

