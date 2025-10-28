import { useParams, useOutletContext } from 'react-router-dom';
import ShopQRCode from '../../components/ShopQRCode';

interface Shop {
  shop_name: string;
}

export default function QRCodePage() {
  const { shopId } = useParams();
  const { shop } = useOutletContext<{ shop: Shop }>();

  return (
    <div>
      <ShopQRCode shopId={shopId || ''} shopName={shop.shop_name} />
    </div>
  );
}

