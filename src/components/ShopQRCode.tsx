import { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'react-qr-code';
import { Download, Copy, RefreshCw, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ShopQRCodeProps {
  shopId: string;
  shopName: string;
}

export default function ShopQRCode({ shopId, shopName }: ShopQRCodeProps) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');
  const qrRef = useRef<HTMLDivElement>(null);

  const defaultCheckInUrl = `${window.location.origin}/dashboard/${shopId}/checkin`;

  // Load or generate QR URL
  useEffect(() => {
    const loadQRUrl = async () => {
      try {
        const { data: shop } = await supabase
          .from('shops')
          .select('qr_url')
          .eq('id', shopId)
          .single();

        if (shop?.qr_url) {
          setQrUrl(shop.qr_url);
        } else {
          // Generate and save if not exists (for existing shops without QR codes)
          const newQrUrl = defaultCheckInUrl;
          const { error: updateError } = await supabase
            .from('shops')
            .update({ 
              qr_url: newQrUrl,
              qr_code_active: true 
            })
            .eq('id', shopId);
          
          if (!updateError) {
            setQrUrl(newQrUrl);
          } else {
            console.error('Error generating QR URL:', updateError);
            setQrUrl(defaultCheckInUrl); // Use default even if save fails
          }
        }
      } catch (error) {
        console.error('Error loading QR URL:', error);
        setQrUrl(defaultCheckInUrl);
      }
    };

    if (shopId) {
      loadQRUrl();
    }
  }, [shopId, defaultCheckInUrl]);

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
      const { error } = await supabase
        .from('shops')
        .update({ 
          qr_url: newQrUrl, 
          qr_code_active: true,
          updated_at: new Date().toISOString() 
        })
        .eq('id', shopId);
      
      if (error) throw error;
      
      setQrUrl(newQrUrl);
      setTimeout(() => {
        setRegenerating(false);
        alert('QR Code regenerated successfully! You can now reprint or download it.');
      }, 500);
    } catch (error: any) {
      console.error('Error regenerating QR:', error);
      alert(`Failed to regenerate QR code: ${error.message}`);
      setRegenerating(false);
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
            Customers can scan this QR code to go directly to your check-in page. 
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
              <QRCodeSVG
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
                        <p>Check-In QR Code - Scan to check in instantly</p>
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">📱 How to Use</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Download or print this QR code</li>
              <li>Display it at your shop entrance or counter</li>
              <li>Customers scan it to open your check-in page instantly</li>
              <li>No app download required - works with any QR scanner</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

