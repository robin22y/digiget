import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getDistance, getDeviceType, getCooldownRemaining, formatCooldown } from '../../utils/customerAreaHelpers';
import { getCurrentPosition, getAreaName } from '../../utils/geolocation';
import { Star, MapPin, Gift, AlertCircle, X, CheckCircle, Cookie, Zap, LogOut, Edit2, Save } from 'lucide-react';

interface Shop {
  id: string;
  shop_name: string;
  logo_url?: string;
  points_needed: number;
  reward_description: string;
  latitude?: number;
  longitude?: number;
  owner_address?: string;
}

interface Customer {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  address: string | null;
  current_points: number;
  total_visits: number;
  rewards_redeemed: number;
}

interface FlashOffer {
  id: string;
  offer_text: string;
  offer_type: 'percentage' | 'fixed_amount' | 'free_item' | null;
  offer_value: number | null;
  active: boolean;
  starts_at: string;
  ends_at: string | null;
}

export default function CustomerArea() {
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get('shop');
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [offers, setOffers] = useState<FlashOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  // Load shop on mount and check for saved customer session
  useEffect(() => {
    if (!shopId) {
      setMessage({ type: 'error', text: 'Invalid shop link. Please scan the QR code again.' });
      setLoading(false);
      return;
    }
    
    loadShop();
    loadOffers();
    checkCookieConsent();
    checkSavedSession();
  }, [shopId]);

  // Check for saved customer session in localStorage
  const checkSavedSession = async () => {
    if (!shopId) return;
    
    const savedSession = localStorage.getItem(`customer_session_${shopId}`);
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        const { data: customerData, error } = await supabase
          .from('customers')
          .select('*')
          .eq('shop_id', shopId)
          .eq('id', sessionData.customerId)
          .maybeSingle();

        if (!error && customerData) {
          setCustomer(customerData);
          setName(customerData.name || '');
          setEmail(customerData.email || '');
          setAddress(customerData.address || '');
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error loading saved session:', error);
      }
    }
    setLoading(false);
  };

  // Save customer session to localStorage
  const saveSession = (customerData: Customer) => {
    if (!shopId) return;
    localStorage.setItem(`customer_session_${shopId}`, JSON.stringify({
      customerId: customerData.id,
      phone: customerData.phone,
      timestamp: Date.now()
    }));
  };

  // Logout - clear session
  const handleLogout = () => {
    if (!shopId) return;
    localStorage.removeItem(`customer_session_${shopId}`);
    setCustomer(null);
    setPhone('');
    setName('');
    setEmail('');
    setAddress('');
    setEditingProfile(false);
    setMessage({ type: 'info', text: 'Logged out successfully.' });
  };

  // Check if cookies consent is stored
  const checkCookieConsent = () => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowCookieBanner(true);
    }
  };

  // Accept cookies
  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowCookieBanner(false);
  };

  const loadShop = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('id, shop_name, logo_url, points_needed, reward_description, latitude, longitude, owner_address')
        .eq('id', shopId)
        .single();

      if (error) throw error;
      setShop(data);
    } catch (error: any) {
      console.error('Error loading shop:', error);
      setMessage({ type: 'error', text: 'Failed to load shop information.' });
    } finally {
      setLoading(false);
    }
  };

  const loadOffers = async () => {
    if (!shopId) return;
    
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('flash_offers')
        .select('*')
        .eq('shop_id', shopId)
        .eq('active', true)
        .lte('starts_at', now)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error('Error loading offers:', error);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    if (numbers.length <= 8) return `${numbers.slice(0, 5)} ${numbers.slice(5)}`;
    return `${numbers.slice(0, 5)} ${numbers.slice(5, 8)} ${numbers.slice(8, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleLookupCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;

    setLoading(true);
    setMessage(null);

    try {
      const cleanPhone = phone.replace(/\s/g, '');
      
      const { data: customerData, error } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (error) throw error;

      if (customerData) {
        setCustomer(customerData);
        setName(customerData.name || '');
        setEmail(customerData.email || '');
        setAddress(customerData.address || '');
        saveSession(customerData);
      } else {
        // New customer - allow them to add details
        setCustomer(null);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomer = async () => {
    if (!shopId || !phone.replace(/\s/g, '')) {
      setMessage({ type: 'error', text: 'Phone number is required.' });
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\s/g, '');

      // Check if customer exists
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .eq('phone', cleanPhone)
        .maybeSingle();

      let customerData;
      
      if (existingCustomer) {
        // Update existing customer
        const { data, error } = await supabase
          .from('customers')
          .update({
            name: name.trim() || existingCustomer.name || null,
            email: email.trim() || existingCustomer.email || null,
            address: address.trim() || existingCustomer.address || null,
          })
          .eq('id', existingCustomer.id)
          .select()
          .single();

        if (error) throw error;
        customerData = data;
      } else {
        // Create new customer
        const { data, error } = await supabase
          .from('customers')
          .insert({
            shop_id: shopId,
            phone: cleanPhone,
            name: name.trim() || null,
            email: email.trim() || null,
            address: address.trim() || null,
            current_points: 0,
            lifetime_points: 0,
            total_visits: 0,
            rewards_redeemed: 0,
          })
          .select()
          .single();

        if (error) throw error;
        customerData = data;
      }

      setCustomer(customerData);
      saveSession(customerData);
      setMessage({ type: 'success', text: 'Profile saved successfully!' });
      setEditingProfile(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!shop || !customer) return;

    setCheckingIn(true);
    setMessage(null);

    try {
      // Get current location
      const location = await getCurrentPosition();
      
      if (!location || !shop.latitude || !shop.longitude) {
        // Allow check-in without location, but mark as pending
        await processCheckIn(null, 'pending', null);
        return;
      }

      // Get location name
      const locationName = await getAreaName(location.latitude, location.longitude);
      
      // Calculate distance
      const distance = getDistance(
        location.latitude,
        location.longitude,
        shop.latitude,
        shop.longitude
      );

      // Check 30-minute cooldown (unless relaxation granted)
      const { data: lastCheckIn } = await supabase
        .from('customer_visits')
        .select('check_in_time')
        .eq('customer_id', customer.id)
        .eq('status', 'approved')
        .order('check_in_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastCheckIn) {
        // Check for relaxation granted in last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: relaxation } = await supabase
          .from('relaxations')
          .select('*')
          .eq('customer_id', customer.id)
          .eq('shop_id', shop.id)
          .eq('relaxation_type', 'point_earning')
          .gte('granted_at', oneHourAgo)
          .maybeSingle();

        if (!relaxation) {
          const cooldownRemaining = getCooldownRemaining(lastCheckIn.check_in_time, 30);
          if (cooldownRemaining > 0) {
            setMessage({
              type: 'info',
              text: `Please wait ${formatCooldown(cooldownRemaining)} before earning more points.`
            });
            setCheckingIn(false);
            return;
          }
        }
      }

      // Determine status based on distance
      const status = distance <= 200 ? 'approved' : 'pending';
      
      await processCheckIn(location, status, locationName, distance);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setCheckingIn(false);
    }
  };

  const processCheckIn = async (
    location: { latitude: number; longitude: number } | null,
    status: 'approved' | 'pending',
    locationName: string | null,
    distance?: number
  ) => {
    if (!shop || !customer) return;

    const deviceType = getDeviceType();

    // Create visit record
    const { data: visit, error: visitError } = await supabase
      .from('customer_visits')
      .insert({
        customer_id: customer.id,
        shop_id: shop.id,
        lat: location?.latitude || null,
        lng: location?.longitude || null,
        location_name: locationName,
        device_type: deviceType,
        check_in_time: new Date().toISOString(),
        status: status,
        distance_from_shop: distance || null,
      })
      .select()
      .single();

    if (visitError) throw visitError;

      // If approved, add point and update customer
      if (status === 'approved') {
        const newPoints = (customer.current_points || 0) + 1;
        const newTotalVisits = (customer.total_visits || 0) + 1;
        const newLifetimePoints = (customer.lifetime_points || 0) + 1;

        await supabase
          .from('customers')
          .update({
            current_points: newPoints,
            lifetime_points: newLifetimePoints,
            total_visits: newTotalVisits,
            last_visit_at: new Date().toISOString(),
          })
          .eq('id', customer.id);

        await supabase
          .from('loyalty_transactions')
          .insert({
            shop_id: shop.id,
            customer_id: customer.id,
            transaction_type: 'point_added',
            points_change: 1,
            balance_after: newPoints,
          });

        // Reload customer data
        const { data: updatedCustomer } = await supabase
          .from('customers')
          .select('*')
          .eq('id', customer.id)
          .single();

        if (updatedCustomer) setCustomer(updatedCustomer);

        const pointsNeeded = shop.points_needed - newPoints;
        if (newPoints >= shop.points_needed) {
          setMessage({
            type: 'success',
            text: `🎉 You've earned a reward! ${shop.reward_description}`
          });
        } else {
          setMessage({
            type: 'success',
            text: `You have ${newPoints} points 🎉 Collect ${pointsNeeded} more for your ${shop.reward_description}!`
          });
        }
        
        // Show rating modal after successful check-in
        setTimeout(() => {
          setShowRatingModal(true);
        }, 1500);
      } else {
        setMessage({
          type: 'info',
          text: 'Check-in submitted! Your location is more than 200m away. Waiting for shop approval.'
        });
      }
    };

  const handleRedeem = async () => {
    if (!shop || !customer) return;

    setRedeeming(true);
    setMessage(null);

    try {
      // Check if customer has enough points
      if (customer.current_points < shop.points_needed) {
        setMessage({
          type: 'error',
          text: `You need ${shop.points_needed} points to redeem. You have ${customer.current_points}.`
        });
        setRedeeming(false);
        return;
      }

      // Check 24-hour cooldown (unless relaxation granted)
      const { data: lastRedemption } = await supabase
        .from('redemptions')
        .select('redeemed_at')
        .eq('customer_id', customer.id)
        .eq('shop_id', shop.id)
        .order('redeemed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastRedemption) {
        // Check for relaxation granted in last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: relaxation } = await supabase
          .from('relaxations')
          .select('*')
          .eq('customer_id', customer.id)
          .eq('shop_id', shop.id)
          .eq('relaxation_type', 'redemption')
          .gte('granted_at', oneHourAgo)
          .maybeSingle();

        if (!relaxation) {
          const cooldownRemaining = getCooldownRemaining(lastRedemption.redeemed_at, 24 * 60);
          if (cooldownRemaining > 0) {
            setMessage({
              type: 'info',
              text: `You can redeem again after ${formatCooldown(cooldownRemaining)}.`
            });
            setRedeeming(false);
            return;
          }
        }
      }

      // Process redemption
      await supabase
        .from('customers')
        .update({
          current_points: 0,
          rewards_redeemed: customer.rewards_redeemed + 1,
        })
        .eq('id', customer.id);

      await supabase
        .from('loyalty_transactions')
        .insert({
          shop_id: shop.id,
          customer_id: customer.id,
          transaction_type: 'reward_redeemed',
          points_change: -shop.points_needed,
          balance_after: 0,
        });

      await supabase
        .from('redemptions')
        .insert({
          customer_id: customer.id,
          shop_id: shop.id,
          redeemed_at: new Date().toISOString(),
        });

      // Reload customer
      const { data: updatedCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customer.id)
        .single();

      if (updatedCustomer) setCustomer(updatedCustomer);

      setMessage({
        type: 'success',
        text: `🎁 Reward redeemed! ${shop.reward_description} Show this to staff to claim.`
      });
      
      // Show rating modal after successful redemption
      setTimeout(() => {
        setShowRatingModal(true);
      }, 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setRedeeming(false);
    }
  };

  // Handle rating submission
  const handleSubmitRating = async () => {
    if (!shop || !customer || rating === 0) {
      setMessage({ type: 'error', text: 'Please select a rating (1-5 stars).' });
      return;
    }

    setSubmittingRating(true);
    try {
      // Check if customer has already rated in last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentRating } = await supabase
        .from('customer_ratings')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('shop_id', shop.id)
        .gte('created_at', oneDayAgo)
        .maybeSingle();

      if (recentRating) {
        setMessage({
          type: 'info',
          text: 'You have already submitted a rating today. Thank you for your feedback!'
        });
        setShowRatingModal(false);
        setSubmittingRating(false);
        return;
      }

      const deviceType = getDeviceType();
      
      const { error } = await supabase
        .from('customer_ratings')
        .insert({
          shop_id: shop.id,
          customer_id: customer.id,
          rating: rating,
          comment: ratingComment.trim() || null,
          device_type: deviceType,
        });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: '⭐ Thanks for your feedback!'
      });
      setShowRatingModal(false);
      setRating(0);
      setRatingComment('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubmittingRating(false);
    }
  };

  // Save profile updates
  const handleUpdateProfile = async () => {
    if (!shopId || !customer) return;

    setLoading(true);
    try {
      const { data: customerData, error } = await supabase
        .from('customers')
        .update({
          name: name.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
        })
        .eq('id', customer.id)
        .select()
        .single();

      if (error) throw error;
      
      setCustomer(customerData);
      saveSession(customerData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditingProfile(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Shop Not Found</h2>
          <p className="text-gray-600">{message?.text || 'Invalid shop link. Please scan the QR code again.'}</p>
        </div>
      </div>
    );
  }

  // Phone entry view
  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        {/* Cookie Banner */}
        {showCookieBanner && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 shadow-lg">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Cookie className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  We use cookies to enhance your experience. By continuing, you agree to our cookie policy.
                </p>
              </div>
              <button
                onClick={acceptCookies}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm font-semibold whitespace-nowrap"
              >
                Accept
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center min-h-screen p-4 pt-20 pb-24">
          <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8 max-w-md w-full">
            {/* Shop Header */}
            <div className="text-center mb-6">
              {shop.logo_url && (
                <img
                  src={shop.logo_url}
                  alt={shop.shop_name}
                  className="h-16 w-16 mx-auto mb-3 rounded-full object-cover"
                />
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{shop.shop_name}</h1>
              {shop.owner_address && (
                <p className="text-sm text-gray-500 mb-2">{shop.owner_address}</p>
              )}
              <p className="text-gray-600">Welcome! Enter your phone number to get started.</p>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`mb-4 p-3 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : message.type === 'error'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Phone Entry Form */}
            <form onSubmit={handleLookupCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="07XXX XXX XXX"
                  required
                  className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Checking...' : 'Continue'}
              </button>
            </form>

            {/* Optional Details - Always visible for new customers */}
            <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Optional Details</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Your address"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <button
                onClick={handleSaveCustomer}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-6 px-4">
          <div className="max-w-4xl mx-auto text-center text-sm text-gray-600 space-y-2">
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/privacy-policy" className="hover:text-blue-600">Privacy Policy</a>
              <span>•</span>
              <a href="/gdpr" className="hover:text-blue-600">GDPR Compliance</a>
            </div>
            <p className="text-xs">© {new Date().getFullYear()} {shop.shop_name}. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  // Main customer view
  const pointsNeeded = shop.points_needed - customer.current_points;
  const canRedeem = customer.current_points >= shop.points_needed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pb-24">
      {/* Cookie Banner */}
      {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 shadow-lg">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                We use cookies to enhance your experience. By continuing, you agree to our cookie policy.
              </p>
            </div>
            <button
              onClick={acceptCookies}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm font-semibold whitespace-nowrap"
            >
              Accept
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4">
        {/* Shop Header with Logout */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 text-center">
              {shop.logo_url && (
                <img
                  src={shop.logo_url}
                  alt={shop.shop_name}
                  className="h-16 w-16 mx-auto mb-3 rounded-full object-cover"
                />
              )}
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{shop.shop_name}</h1>
              {shop.owner_address && (
                <p className="text-sm text-gray-500 mb-2">{shop.owner_address}</p>
              )}
              <p className="text-gray-600">Hi {customer.name || 'there'}! 👋</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

          {/* Profile Details */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Profile</h3>
              {!editingProfile && (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
            
            {editingProfile ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name (Optional)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address (Optional)</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Your address"
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingProfile(false);
                      setName(customer.name || '');
                      setEmail(customer.email || '');
                      setAddress(customer.address || '');
                    }}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-gray-600">
                {customer.name && <p>Name: {customer.name}</p>}
                {customer.email && <p>Email: {customer.email}</p>}
                {customer.address && <p>Address: {customer.address}</p>}
                {!customer.name && !customer.email && !customer.address && (
                  <p className="text-gray-400 italic">No profile details added yet. Click Edit to add them.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 p-4 rounded-xl ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border-2 border-green-200'
                : message.type === 'error'
                ? 'bg-red-50 text-red-800 border-2 border-red-200'
                : 'bg-blue-50 text-blue-800 border-2 border-blue-200'
            }`}
          >
            <div className="flex items-start gap-2">
              {message.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
              {message.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
              <p className="flex-1">{message.text}</p>
              <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Points Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 mb-4 text-white">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-4">Your Points</h2>
            <div className="flex justify-center gap-2 mb-4">
              {Array.from({ length: shop.points_needed }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-8 h-8 ${
                    i < customer.current_points
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-white/30'
                  }`}
                />
              ))}
            </div>
            <p className="text-3xl font-bold mb-2">
              You have {customer.current_points} point{customer.current_points !== 1 ? 's' : ''} 🎉
            </p>
            {pointsNeeded > 0 ? (
              <p className="text-blue-100">
                Collect {pointsNeeded} more for your {shop.reward_description}!
              </p>
            ) : (
              <p className="text-yellow-300 font-semibold">🎁 Reward Ready!</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleCheckIn}
            disabled={checkingIn}
            className="bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <MapPin className="w-5 h-5" />
            {checkingIn ? 'Checking In...' : 'Check In'}
          </button>

          <button
            onClick={handleRedeem}
            disabled={redeeming || !canRedeem}
            className="bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Gift className="w-5 h-5" />
            {redeeming ? 'Redeeming...' : 'Redeem Points'}
          </button>
        </div>

        {/* Offers Section */}
        {offers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Current Offers</h2>
            <div className="space-y-3">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50"
                >
                  <div className="flex items-start gap-3">
                    <Zap className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{offer.offer_text}</h3>
                      {offer.ends_at && (
                        <p className="text-sm text-gray-600">
                          Expires: {new Date(offer.ends_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Stats</h2>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{customer.total_visits}</p>
              <p className="text-sm text-gray-600">Total Visits</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{customer.rewards_redeemed}</p>
              <p className="text-sm text-gray-600">Rewards Claimed</p>
            </div>
          </div>
        </div>
      </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-6 px-4 mt-8">
          <div className="max-w-4xl mx-auto text-center text-sm text-gray-600 space-y-2">
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/privacy-policy" className="hover:text-blue-600">Privacy Policy</a>
              <span>•</span>
              <a href="/gdpr" className="hover:text-blue-600">GDPR Compliance</a>
            </div>
            <p className="text-xs">© {new Date().getFullYear()} {shop.shop_name}. All rights reserved.</p>
          </div>
        </footer>

        {/* Rating Modal */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Rate Your Experience</h2>
                <button
                  onClick={() => {
                    setShowRatingModal(false);
                    setRating(0);
                    setRatingComment('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-600 mb-4">How would you rate your experience?</p>

              {/* Star Rating */}
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>

              {/* Comment Box */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment (Optional)
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Tell us about your experience..."
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitRating}
                disabled={submittingRating || rating === 0}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingRating ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

