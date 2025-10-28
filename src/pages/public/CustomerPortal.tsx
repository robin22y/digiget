import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Star, MapPin, Phone, Gift, CheckCircle, AlertCircle } from 'lucide-react';

interface Shop {
  id: string;
  shop_name: string;
  address: string | null;
  postcode: string | null;
  image_url: string | null;
  points_needed: number;
  reward_description: string;
}

interface FlashOffer {
  id: string;
  offer_text: string;
  offer_type: 'percentage' | 'fixed_amount' | 'free_item' | null;
  offer_value: number | null;
  ends_at: string | null;
}

interface Customer {
  id: string;
  name: string | null;
  phone: string;
  current_points: number;
  lifetime_points: number;
  total_visits: number;
}

export default function CustomerPortal() {
  const { shopId } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [offers, setOffers] = useState<FlashOffer[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (shopId) {
      loadShopData();
      // Try to get customer from localStorage (if they've visited before)
      const storedPhone = localStorage.getItem(`customer_phone_${shopId}`);
      if (storedPhone) {
        setPhone(storedPhone);
        loadCustomer(storedPhone);
      }
    }
  }, [shopId]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadShopData = async () => {
    try {
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id, shop_name, address, postcode, image_url, points_needed, reward_description')
        .eq('id', shopId)
        .single();

      if (shopError) throw shopError;
      setShop(shopData);

      // Load active flash offers
      const { data: offersData, error: offersError } = await supabase
        .from('flash_offers')
        .select('id, offer_text, offer_type, offer_value, ends_at')
        .eq('shop_id', shopId)
        .eq('active', true)
        .lte('starts_at', new Date().toISOString())
        .or('ends_at.is.null,ends_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (!offersError && offersData) {
        setOffers(offersData);
      }
    } catch (error) {
      console.error('Error loading shop:', error);
      showToast('Failed to load shop information', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomer = async (phoneNumber: string) => {
    try {
      const cleanPhone = phoneNumber.replace(/\s/g, '');
      const { data: customerData } = await supabase
        .from('customers')
        .select('id, name, phone, current_points, lifetime_points, total_visits')
        .eq('shop_id', shopId)
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (customerData) {
        setCustomer(customerData);
        setName(customerData.name || '');
      }
    } catch (error) {
      console.error('Error loading customer:', error);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    if (numbers.length <= 8) return `${numbers.slice(0, 5)} ${numbers.slice(5)}`;
    return `${numbers.slice(0, 5)} ${numbers.slice(5, 8)} ${numbers.slice(8, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    if (formatted.replace(/\s/g, '').length >= 10) {
      loadCustomer(formatted);
    } else {
      setCustomer(null);
    }
  };

  const handleCheckIn = async () => {
    if (!shopId) return;
    
    const cleanPhone = phone.replace(/\s/g, '');
    if (cleanPhone.length < 10) {
      showToast('Please enter a valid phone number', 'error');
      return;
    }

    setCheckingIn(true);

    try {
      // Find or create customer
      let customerId: string | null = null;
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('shop_id', shopId)
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;
        // Update customer stats
        await supabase
          .from('customers')
          .update({
            total_visits: (customer?.total_visits || 0) + 1,
            last_visit_at: new Date().toISOString(),
            name: name.trim() || null,
          })
          .eq('id', customerId);
      } else {
        // Create new customer
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            shop_id: shopId,
            phone: cleanPhone,
            name: name.trim() || null,
            total_visits: 1,
            current_points: 1,
            lifetime_points: 1,
            first_visit_at: new Date().toISOString(),
            last_visit_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (newCustomer) {
          customerId = newCustomer.id;
        }
      }

      // Create visit record
      await supabase
        .from('customer_visits')
        .insert({
          shop_id: shopId,
          customer_id: customerId,
          customer_phone: cleanPhone,
          check_in_method: 'qr',
          points_awarded: 1,
        });

      // Add loyalty points transaction
      const currentPoints = customer?.current_points || 0;
      await supabase
        .from('loyalty_transactions')
        .insert({
          shop_id: shopId,
          customer_id: customerId,
          transaction_type: 'point_added',
          points_change: 1,
          balance_after: currentPoints + 1,
          notes: 'QR code check-in',
        });

      // Update customer points if they exist
      if (customerId) {
        await supabase
          .from('customers')
          .update({
            current_points: (customer?.current_points || 0) + 1,
            lifetime_points: (customer?.lifetime_points || 0) + 1,
          })
          .eq('id', customerId);
      }

      // Store phone for future visits
      localStorage.setItem(`customer_phone_${shopId}`, cleanPhone);

      // Reload customer data
      await loadCustomer(cleanPhone);

      showToast('✅ Check-in successful! +1 point awarded');
      setShowRatingModal(true);
    } catch (error: any) {
      console.error('Check-in error:', error);
      showToast(error.message || 'Failed to check in. Please try again.', 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }

    setSubmittingRating(true);

    try {
      const cleanPhone = phone.replace(/\s/g, '');
      const customerId = customer?.id || null;

      await supabase
        .from('shop_ratings')
        .insert({
          shop_id: shopId,
          customer_id: customerId,
          customer_phone: cleanPhone,
          rating,
          feedback: feedback.trim() || null,
          visible_to_shop: true,
        });

      showToast('Thank you for your feedback!');
      setShowRatingModal(false);
      setRating(0);
      setFeedback('');
    } catch (error: any) {
      console.error('Rating error:', error);
      showToast('Failed to submit rating', 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  const canRedeemReward = shop && customer && customer.current_points >= shop.points_needed;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Shop Not Found</h1>
          <p className="text-gray-600">This shop is not available or has been deactivated.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {shop.image_url && (
              <img
                src={shop.image_url}
                alt={shop.shop_name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{shop.shop_name}</h1>
              {(shop.address || shop.postcode) && (
                <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{[shop.address, shop.postcode].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Flash Offers */}
        {offers.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Special Offers</h2>
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-4 shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Gift className="w-5 h-5" />
                      <span className="font-semibold">Flash Offer</span>
                    </div>
                    <p className="text-sm leading-relaxed">{offer.offer_text}</p>
                    {offer.ends_at && (
                      <p className="text-xs mt-2 opacity-90">
                        Expires: {new Date(offer.ends_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Check-In Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Check In</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="07123 456789"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleCheckIn}
              disabled={checkingIn || !phone.replace(/\s/g, '').match(/^\d{10,11}$/)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {checkingIn ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Checking In...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Check In & Earn 1 Point
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loyalty Summary */}
        {customer && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Points</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{customer.current_points}</div>
                <div className="text-xs text-gray-600">Current</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{customer.total_visits}</div>
                <div className="text-xs text-gray-600">Visits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{customer.lifetime_points}</div>
                <div className="text-xs text-gray-600">All Time</div>
              </div>
            </div>

            {shop.points_needed > 0 && (
              <div className="bg-blue-50 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-700 mb-1">
                  <span className="font-semibold">{shop.points_needed - customer.current_points}</span> more points until:
                </p>
                <p className="text-sm font-semibold text-blue-700">{shop.reward_description}</p>
              </div>
            )}

            {canRedeemReward && (
              <button
                onClick={() => {
                  // Handle reward redemption - would need to create a transaction
                  showToast('Reward redemption coming soon! Contact staff to redeem.');
                }}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
              >
                Redeem Reward
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Rate Your Experience</h2>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us about your experience (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setRating(0);
                  setFeedback('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Skip
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={submittingRating || rating === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submittingRating ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

