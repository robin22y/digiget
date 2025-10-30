import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Star, MessageSquare } from 'lucide-react';
import { maskPhone, maskCustomerId, maskEmail, maskName } from '../../utils/maskCustomerData';
import { Switch } from '@headlessui/react'; // or use a custom toggle if you don't have this package

interface Rating {
  id: string;
  rating: number;
  comment: string | null;
  device_type: string;
  created_at: string;
  customers: {
    phone: string | null;
    email: string | null;
    name: string | null;
    id: string;
  };
  published: boolean;
}

export default function RatingsPage() {
  const { shopId } = useParams();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  useEffect(() => {
    loadRatings();
  }, [shopId]);

  const loadRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_ratings')
        .select(`
          *,
          customers (
            id,
            phone,
            email,
            name
          )
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRatings(data || []);

      // Calculate average rating
      if (data && data.length > 0) {
        const sum = data.reduce((acc, rating) => acc + rating.rating, 0);
        setAverageRating(sum / data.length);
      } else {
        setAverageRating(null);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    }[size];

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Customer Ratings</h1>
            <p className="text-sm text-gray-600">
              View customer feedback and ratings for your shop
            </p>
          </div>
          {averageRating !== null && (
            <div className="text-center bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-xs text-gray-600 mb-2">Average Rating</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-bold text-blue-700">
                  {averageRating.toFixed(1)}
                </span>
                <div className="flex items-center">
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Based on {ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'}
              </p>
            </div>
          )}
        </div>
      </div>

      {ratings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Ratings Yet</h2>
          <p className="text-gray-600">
            Customer ratings and feedback will appear here once customers start leaving reviews.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Ratings</h2>
          <div className="space-y-4">
            {ratings.map((rating) => {
              const customer = rating.customers;
              return (
                <div
                  key={rating.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex flex-row gap-5 items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {renderStars(rating.rating, 'md')}
                        <span className="text-sm font-medium text-gray-700">
                          {rating.rating} / 5
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(rating.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      {/* Masked Customer Information */}
                      <div className="text-xs text-gray-500 space-y-1">
                        {customer.name && (
                          <p>
                            <span className="font-medium">Name:</span> {maskName(customer.name)}
                          </p>
                        )}
                        {customer.phone && (
                          <p>
                            <span className="font-medium">Phone:</span> {maskPhone(customer.phone)}
                          </p>
                        )}
                        {customer.email && (
                          <p>
                            <span className="font-medium">Email:</span> {maskEmail(customer.email)}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">ID:</span> {maskCustomerId(customer.id)}
                        </p>
                        <p>
                          <span className="font-medium">Device:</span> {rating.device_type}
                        </p>
                      </div>
                    </div>
                    <div className="ml-auto flex flex-row items-center gap-2">
                      <label className="text-xs font-medium text-gray-700">Published publicly</label>
                      <input
                        type="checkbox"
                        checked={!!rating.published}
                        onChange={async () => {
                          setUpdating(rating.id);
                          setUpdateMsg(null);
                          // Optimistically update state
                          setRatings((prevRatings) => prevRatings.map(r => r.id === rating.id ? { ...r, published: !rating.published } : r));
                          const { error } = await supabase
                            .from('customer_ratings')
                            .update({ published: !rating.published })
                            .eq('id', rating.id);
                          if (error) {
                            setUpdateMsg('Error updating status');
                            // Revert optimistic state
                            setRatings((prevRatings) => prevRatings.map(r => r.id === rating.id ? { ...r, published: rating.published } : r));
                          } else {
                            setUpdateMsg('Publish status updated!');
                            // Reload from server after a short delay for smoothness
                            setTimeout(() => {
                              loadRatings();
                            }, 500);
                          }
                          setUpdating(null);
                        }}
                        disabled={updating === rating.id}
                        className="ml-1 rounded focus:ring-blue-400 border-gray-300"
                      />
                      {updating === rating.id && <span className="text-blue-500 text-xs ml-1">Saving...</span>}
                    </div>
                  </div>
                  
                  {rating.comment && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-700 italic">"{rating.comment}"</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {updateMsg && (
            <div className="mt-2 mb-4 p-2 rounded bg-blue-50 text-blue-700 text-sm border border-blue-200">{updateMsg}</div>
          )}
        </div>
      )}
    </div>
  );
}

