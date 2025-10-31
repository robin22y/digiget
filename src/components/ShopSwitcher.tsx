import { useShop } from '../contexts/ShopContext';
import { ChevronDown } from 'lucide-react';

export default function ShopSwitcher() {
  const { currentShop, accessibleShops, isMultiLocation, switchShop } = useShop();

  if (!isMultiLocation || !currentShop) {
    return null;
  }

  return (
    <div className="relative">
      <select
        value={currentShop.id}
        onChange={(e) => switchShop(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-transparent cursor-pointer"
        aria-label="Select shop location"
      >
        {accessibleShops.map((shop) => (
          <option key={shop.id} value={shop.id}>
            {shop.location_name || shop.shop_name}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
    </div>
  );
}

