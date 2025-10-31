import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import ShopQRCode from '../../components/ShopQRCode';
import { useShop } from '../../contexts/ShopContext';
import { useEffect } from 'react';

interface Shop {
  shop_name: string;
}

export default function QRCodePage() {
  const { shopId: paramShopId } = useParams();
  const { shop: outletShop } = useOutletContext<{ shop: Shop }>();
  const { currentShop, hasAccess, loading: shopLoading } = useShop();
  const navigate = useNavigate();

  // Use currentShop from context or validated paramShopId
  const shop = outletShop;
  const shopId = currentShop?.id || (paramShopId && hasAccess(paramShopId) ? paramShopId : null);

  // Validate access
  useEffect(() => {
    if (!shopLoading && paramShopId) {
      if (!hasAccess(paramShopId)) {
        navigate('/dashboard');
        return;
      }
    }
  }, [paramShopId, hasAccess, shopLoading, navigate]);

  return (
    <div>
      <ShopQRCode shopId={shopId || ''} shopName={shop?.shop_name || ''} />
    </div>
  );
}

