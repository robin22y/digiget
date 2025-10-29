import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Star, Filter, Search, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ShopRating {
  shop_id: string;
  shop_name: string;
  owner_name: string;
  owner_email: string;
  postcode: string | null;
  business_category: string | null;
  average_rating: number;
  total_ratings: number;
  city: string | null;
}

export default function TopRatedShops() {
  const navigate = useNavigate();
  const [shops, setShops] = useState<ShopRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPostcode, setFilterPostcode] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'count'>('rating');

  useEffect(() => {
    loadTopRatedShops();
  }, [filterPostcode, filterCity, filterCategory, sortBy]);

  const loadTopRatedShops = async () => {
    try {
      setLoading(true);
      
      // Get all shops with their ratings
      const { data: allRatings, error: ratingsError } = await supabase
        .from('customer_ratings')
        .select(`
          shop_id,
          rating,
          shops!inner (
            id,
            shop_name,
            owner_name,
            owner_email,
            postcode,
            business_category
          )
        `);

      if (ratingsError) {
        // Handle case where shops table doesn't have postcode/business_category
        if (ratingsError.message?.includes('postcode') || ratingsError.message?.includes('business_category')) {
          const { data: fallbackRatings, error: fallbackError } = await supabase
            .from('customer_ratings')
            .select(`
              shop_id,
              rating,
              shops!inner (
                id,
                shop_name,
                owner_name,
                owner_email
              )
            `);

          if (fallbackError) throw fallbackError;
          
          // Process ratings without postcode/category
          processRatings(fallbackRatings || [], true);
          return;
        }
        throw ratingsError;
      }

      processRatings(allRatings || [], false);
    } catch (error) {
      console.error('Error loading top rated shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const processRatings = async (ratings: any[], hasPostcode: boolean) => {
    // Group ratings by shop
    const shopRatingsMap = new Map<string, { ratings: number[]; shop: any }>();

    ratings.forEach((r: any) => {
      const shopId = r.shop_id;
      const shop = r.shops;
      
      if (!shopRatingsMap.has(shopId)) {
        shopRatingsMap.set(shopId, { ratings: [], shop });
      }
      
      shopRatingsMap.get(shopId)!.ratings.push(r.rating);
    });

    // Calculate averages and get location data
    const shopsWithRatings: ShopRating[] = await Promise.all(
      Array.from(shopRatingsMap.entries()).map(async ([shopId, data]) => {
        const avgRating = data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length;
        const totalRatings = data.ratings.length;

        // Get city from postcode if needed
        let city = null;
        if (hasPostcode && data.shop.postcode) {
          // Extract city from postcode (simple extraction - first part before space)
          const postcodeParts = data.shop.postcode.split(' ');
          if (postcodeParts.length > 0) {
            // Try to get city name from postcode area
            city = postcodeParts[0];
          }
        }

        return {
          shop_id: shopId,
          shop_name: data.shop.shop_name,
          owner_name: data.shop.owner_name,
          owner_email: data.shop.owner_email,
          postcode: data.shop.postcode || null,
          business_category: data.shop.business_category || null,
          average_rating: Math.round(avgRating * 10) / 10,
          total_ratings: totalRatings,
          city: city,
        };
      })
    );

    // Apply filters
    let filtered = shopsWithRatings;

    if (filterPostcode) {
      filtered = filtered.filter(shop => 
        shop.postcode?.toLowerCase().includes(filterPostcode.toLowerCase())
      );
    }

    if (filterCity) {
      filtered = filtered.filter(shop => 
        shop.city?.toLowerCase().includes(filterCity.toLowerCase()) ||
        shop.postcode?.toLowerCase().includes(filterCity.toLowerCase())
      );
    }

    if (filterCategory) {
      filtered = filtered.filter(shop => 
        shop.business_category?.toLowerCase().includes(filterCategory.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'rating') {
      filtered.sort((a, b) => b.average_rating - a.average_rating);
    } else {
      filtered.sort((a, b) => b.total_ratings - a.total_ratings);
    }

    setShops(filtered);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Top Rated Shops</h1>
          <p className="text-sm text-gray-600">Shops ranked by customer ratings and feedback</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Postcode</label>
            <input
              type="text"
              value={filterPostcode}
              onChange={(e) => setFilterPostcode(e.target.value)}
              placeholder="Filter by postcode"
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              placeholder="Filter by city"
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              placeholder="Filter by category"
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rating' | 'count')}
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="rating">Average Rating</option>
              <option value="count">Total Ratings</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shops List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {shops.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Shops Found</h2>
            <p className="text-gray-600">
              {filterPostcode || filterCity || filterCategory
                ? 'Try adjusting your filters'
                : 'No shops have received ratings yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Rank</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Shop Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Owner</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Location</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Rating</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Reviews</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((shop, index) => (
                  <tr key={shop.shop_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-bold text-blue-600">#{index + 1}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{shop.shop_name}</td>
                    <td className="py-3 px-4 text-gray-700">{shop.owner_name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{shop.postcode || 'N/A'}</span>
                        {shop.city && (
                          <span className="text-gray-400">• {shop.city}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {shop.business_category || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {renderStars(shop.average_rating)}
                        <span className="font-semibold text-gray-900">
                          {shop.average_rating.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {shop.total_ratings} {shop.total_ratings === 1 ? 'review' : 'reviews'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/super-admin/shops/${shop.shop_id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

