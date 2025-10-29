import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Zap, Search, Filter, X } from 'lucide-react';

interface FlashOffer {
  id: string;
  shop_id: string;
  offer_text: string;
  offer_type: 'percentage' | 'fixed_amount' | 'free_item' | null;
  offer_value: number | null;
  active: boolean;
  starts_at: string;
  ends_at: string | null;
  target_classifications: string[] | null;
  created_at: string;
}

interface OfferWithShop extends FlashOffer {
  shops: {
    id: string;
    shop_name: string;
    postcode: string | null;
    city: string | null;
    owner_name: string;
    owner_email: string;
  };
}

export default function AllDeals() {
  const [offers, setOffers] = useState<OfferWithShop[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterShop, setFilterShop] = useState<string>('all');
  const [filterPostcode, setFilterPostcode] = useState<string>('');
  const [filterCity, setFilterCity] = useState<string>('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');

  // Extract city from postcode for filtering
  const extractCityFromPostcode = (postcode: string | null | undefined): string | null => {
    if (!postcode) return null;
    const parts = postcode.split(' ');
    return parts[0] || null;
  };

  useEffect(() => {
    loadShops();
    loadOffers();
  }, []);

  useEffect(() => {
    loadOffers();
  }, [filterShop, filterPostcode, filterCity, filterActive, searchText]);

  const loadShops = async () => {
    try {
      let { data, error } = await supabase
        .from('shops')
        .select('id, shop_name, postcode')
        .order('shop_name', { ascending: true });

      // Fallback if postcode column doesn't exist
      if (error && (error.message?.includes('postcode') || error.code === '42703')) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('shops')
          .select('id, shop_name')
          .order('shop_name', { ascending: true });
        if (!fallbackError && fallbackData) {
          data = fallbackData.map(shop => ({ ...shop, postcode: null }));
          error = null;
        }
      }

      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error('Error loading shops:', error);
    }
  };

  const loadOffers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('flash_offers')
        .select(`
          *,
          shops (
            id,
            shop_name,
            postcode,
            owner_name,
            owner_email
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filterShop !== 'all') {
        query = query.eq('shop_id', filterShop);
      }

      if (filterActive === 'active') {
        query = query.eq('active', true);
      } else if (filterActive === 'inactive') {
        query = query.eq('active', false);
      }

      let { data, error } = await query;
      
      // Fallback if postcode column doesn't exist
      if (error && (error.message?.includes('postcode') || error.code === '42703')) {
        let fallbackQuery = supabase
          .from('flash_offers')
          .select(`
            *,
            shops (
              id,
              shop_name,
              owner_name,
              owner_email
            )
          `)
          .order('created_at', { ascending: false });
        
        if (filterShop !== 'all') {
          fallbackQuery = fallbackQuery.eq('shop_id', filterShop);
        }
        if (filterActive === 'active') {
          fallbackQuery = fallbackQuery.eq('active', true);
        } else if (filterActive === 'inactive') {
          fallbackQuery = fallbackQuery.eq('active', false);
        }
        
        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        if (!fallbackError && fallbackData) {
          data = fallbackData.map(offer => ({
            ...offer,
            shops: offer.shops ? { ...offer.shops, postcode: null } : null
          }));
          error = null;
        }
      }

      if (error) throw error;

      let filteredOffers = (data || []) as OfferWithShop[];

      // Apply text-based filters (postcode, city, search)
      if (filterPostcode) {
        filteredOffers = filteredOffers.filter(offer => 
          offer.shops?.postcode?.toLowerCase().includes(filterPostcode.toLowerCase())
        );
      }

      if (filterCity) {
        filteredOffers = filteredOffers.filter(offer => {
          const cityFromPostcode = extractCityFromPostcode(offer.shops?.postcode);
          return cityFromPostcode?.toLowerCase().includes(filterCity.toLowerCase());
        });
      }

      if (searchText) {
        const searchLower = searchText.toLowerCase();
        filteredOffers = filteredOffers.filter(offer =>
          offer.offer_text.toLowerCase().includes(searchLower) ||
          offer.shops?.shop_name?.toLowerCase().includes(searchLower) ||
          offer.shops?.owner_name?.toLowerCase().includes(searchLower) ||
          offer.shops?.owner_email?.toLowerCase().includes(searchLower)
        );
      }

      setOffers(filteredOffers);
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUniquePostcodes = () => {
    const postcodes = offers
      .map(offer => offer.shops?.postcode)
      .filter((postcode): postcode is string => !!postcode && postcode.trim() !== '');
    return [...new Set(postcodes)].sort();
  };

  // Extract city from postcode (first part before space) or use empty array
  const getUniqueCities = () => {
    const cities = offers
      .map(offer => {
        const postcode = offer.shops?.postcode;
        if (!postcode) return null;
        // Extract potential city from postcode pattern (e.g., "L1 2AB" -> "L1")
        const parts = postcode.split(' ');
        return parts[0] || null;
      })
      .filter((city): city is string => !!city && city.trim() !== '');
    return [...new Set(cities)].sort();
  };

  const formatOfferValue = (offer: FlashOffer) => {
    if (!offer.offer_type || !offer.offer_value) return '';
    
    switch (offer.offer_type) {
      case 'percentage':
        return `${offer.offer_value}%`;
      case 'fixed_amount':
        return `£${offer.offer_value.toFixed(2)}`;
      case 'free_item':
        return 'Free Item';
      default:
        return '';
    }
  };

  const isCurrentlyActive = (offer: FlashOffer) => {
    if (!offer.active) return false;
    const now = new Date();
    const startsAt = new Date(offer.starts_at);
    if (now < startsAt) return false;
    if (offer.ends_at) {
      const endsAt = new Date(offer.ends_at);
      if (now > endsAt) return false;
    }
    return true;
  };

  const clearFilters = () => {
    setFilterShop('all');
    setFilterPostcode('');
    setFilterCity('');
    setFilterActive('all');
    setSearchText('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-8 h-8 text-yellow-500" />
            All Deals
          </h1>
          <p className="text-gray-600 mt-1">View and manage deals from all shops</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h2>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search offers, shops, owners..."
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Shop Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shop</label>
            <select
              value={filterShop}
              onChange={(e) => setFilterShop(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Shops</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.shop_name}
                </option>
              ))}
            </select>
          </div>

          {/* Postcode Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
            <select
              value={filterPostcode}
              onChange={(e) => setFilterPostcode(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Postcodes</option>
              {getUniquePostcodes().map((postcode) => (
                <option key={postcode} value={postcode}>
                  {postcode}
                </option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Cities</option>
              {getUniqueCities().map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Active Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold">{offers.length}</span> deal{offers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Deals List */}
      {offers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No deals found</p>
          <p className="text-gray-500 text-sm mt-2">
            {searchText || filterShop !== 'all' || filterPostcode || filterCity || filterActive !== 'all'
              ? 'Try adjusting your filters'
              : 'No deals have been created yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`bg-white rounded-xl shadow-sm border-2 ${
                isCurrentlyActive(offer)
                  ? 'border-yellow-400 bg-yellow-50'
                  : offer.active
                  ? 'border-gray-200'
                  : 'border-gray-200 opacity-60'
              } p-6`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className={`w-6 h-6 ${isCurrentlyActive(offer) ? 'text-yellow-500' : 'text-gray-400'}`} />
                    <h3 className="text-lg font-bold text-gray-900">{offer.offer_text}</h3>
                    {offer.offer_type && offer.offer_value && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {formatOfferValue(offer)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Shop Information</p>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">Name:</span> {offer.shops?.shop_name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">Owner:</span> {offer.shops?.owner_name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">Email:</span> {offer.shops?.owner_email || 'N/A'}
                      </p>
                      {offer.shops?.postcode && (
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Postcode:</span> {offer.shops.postcode}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Offer Details</p>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">Starts:</span>{' '}
                        {new Date(offer.starts_at).toLocaleString()}
                      </p>
                      {offer.ends_at && (
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Ends:</span>{' '}
                          {new Date(offer.ends_at).toLocaleString()}
                        </p>
                      )}
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">Status:</span>{' '}
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            isCurrentlyActive(offer)
                              ? 'bg-green-100 text-green-700'
                              : offer.active
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {isCurrentlyActive(offer)
                            ? 'Currently Active'
                            : offer.active
                            ? 'Active (Not Started)'
                            : 'Inactive'}
                        </span>
                      </p>
                      {offer.target_classifications && offer.target_classifications.length > 0 && (
                        <p className="text-sm text-gray-900 mt-1">
                          <span className="font-medium">Target:</span>{' '}
                          {offer.target_classifications.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

