import { useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * Dynamic shop icon route
 * Generates PNG icon with shop initials
 */
export default function ShopIcon() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const size = parseInt(searchParams.get('size') || '192', 10);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!code || !canvasRef.current) return;

    const loadIcon = async () => {
      try {
        const { data: shop, error } = await supabase
          .from('shops')
          .select('shop_name')
          .eq('short_code', code)
          .maybeSingle();

        if (error || !shop) {
          // Default icon if shop not found
          drawIcon(canvasRef.current!, 'DG', size);
          return;
        }

        // Generate shop initials
        const getInitials = (name: string): string => {
          return name
            .split(' ')
            .map(word => word[0])
            .filter(char => char && /[A-Za-z]/.test(char))
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'DG';
        };

        const initials = getInitials(shop.shop_name);
        drawIcon(canvasRef.current!, initials, size);
      } catch (error) {
        console.error('Error loading shop icon:', error);
        drawIcon(canvasRef.current!, 'DG', size);
      }
    };

    loadIcon();
  }, [code, size]);

  const drawIcon = (canvas: HTMLCanvasElement, initials: string, iconSize: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = iconSize;
    canvas.height = iconSize;

    // Clear canvas
    ctx.clearRect(0, 0, iconSize, iconSize);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, iconSize, iconSize);
    gradient.addColorStop(0, '#2563EB');
    gradient.addColorStop(1, '#1e40af');
    ctx.fillStyle = gradient;
    
    // Draw rounded rectangle background
    const radius = iconSize * 0.2; // 20% border radius
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(iconSize - radius, 0);
    ctx.quadraticCurveTo(iconSize, 0, iconSize, radius);
    ctx.lineTo(iconSize, iconSize - radius);
    ctx.quadraticCurveTo(iconSize, iconSize, iconSize - radius, iconSize);
    ctx.lineTo(radius, iconSize);
    ctx.quadraticCurveTo(0, iconSize, 0, iconSize - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();

    // Draw text (initials)
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${iconSize * 0.4}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, iconSize / 2, iconSize / 2);

    // Convert canvas to blob and download/display
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        // For display purposes, we'll keep it in the canvas
        // The route handler should serve this as PNG
      }
    }, 'image/png');
  };

  return (
    <canvas 
      ref={canvasRef}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        display: 'block',
        margin: '0 auto'
      }}
    />
  );
}

