import { useState, useEffect } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Star, Calendar, Clock, User, ArrowLeft, MessageSquare, X } from 'lucide-react';
import { getDeviceType } from '../../utils/customerAreaHelpers';

interface Shop {
  id: string;
  points_needed: number;
  reward_description: string;
  plan_type?: 'basic' | 'pro';
}

interface Appointment {
  id: string;
  customer_name: string | null;
  appointment_date: string;
  appointment_time: string;
  service_type: string | null;
}

export default function CheckInPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  // Try to get shop from outlet context (for authenticated users), otherwise load directly
  // useOutletContext will return undefined if not in a context, so we use optional chaining
  const outletContext = useOutletContext<{ shop?: Shop }>() || {};
  const [shop, setShop] = useState<Shop | null>(outletContext?.shop || null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);
  const [foundAppointment, setFoundAppointment] = useState<Appointment | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(null);

  // Load shop data if not provided from outlet context
  useEffect(() => {
    if (!shop && shopId) {
      const loadShop = async () => {
        try {
          const { data, error } = await supabase
            .from('shops')
            .select('id, points_needed, reward_description, plan_type')
            .eq('id', shopId)
            .single();

          if (!error && data) {
            setShop(data);
          }
        } catch (error) {
          console.error('Error loading shop:', error);
        }
      };
      loadShop();
    }
  }, [shopId, shop]);

  useEffect(() => {
    if (shopId && shop) {
      loadRecentCheckins();
    }
  }, [shopId, shop]);

  const loadRecentCheckins = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('loyalty_transactions')
        .select('*, customers(*)')
        .eq('shop_id', shopId)
        .eq('transaction_type', 'point_added')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setRecentCheckins(data);
      }
    } catch (error) {
      console.error('Error loading recent check-ins:', error);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    if (numbers.length <= 8) return `${numbers.slice(0, 5)} ${numbers.slice(5)}`;
    return `${numbers.slice(0, 5)} ${numbers.slice(5, 8)} ${numbers.slice(8, 11)}`;
  };

  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    setFoundAppointment(null);
    setCustomerName('');
    setShowAdditionalFields(false);

    // Check for appointment when phone number is entered
    const cleanPhone = formatted.replace(/\s/g, '');
    if (cleanPhone.length >= 10) {
      const today = new Date();
      const todayDate = today.toISOString().split('T')[0];

      const { data: appointment } = await supabase
        .from('appointments')
        .select('*')
        .eq('shop_id', shopId)
        .eq('customer_phone', cleanPhone)
        .eq('appointment_date', todayDate)
        .eq('status', 'scheduled')
        .order('appointment_time', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (appointment) {
        setFoundAppointment({
          id: appointment.id,
          customer_name: appointment.customer_name,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          service_type: appointment.service_type,
        });
        if (appointment.customer_name) {
          setCustomerName(appointment.customer_name);
        }
      }
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) {
      setMessage({ type: 'error', text: 'Shop information not loaded. Please try again.' });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      // Check monthly check-in limit for basic plan
      if (shop.plan_type === 'basic') {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const { count, error: countError } = await supabase
          .from('loyalty_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shopId)
          .eq('transaction_type', 'point_added')
          .gte('created_at', firstDayOfMonth.toISOString());

        if (countError) {
          console.error('Error checking monthly limit:', countError);
        } else if (count && count >= 50) {
          setMessage({
            type: 'error',
            text: `Monthly check-in limit reached (50 check-ins). Basic plan allows 50 customer check-ins per month. Please upgrade to Pro plan for unlimited check-ins.`
          });
          setLoading(false);
          return;
        }
      }

      const cleanPhone = phone.replace(/\s/g, '');

      // Check for existing customer
      let { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .eq('phone', cleanPhone)
        .maybeSingle();

      // Check 30-minute cooldown for same phone number
      if (customer) {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        
        const { data: recentTransaction } = await supabase
          .from('loyalty_transactions')
          .select('created_at')
          .eq('shop_id', shopId)
          .eq('customer_id', customer.id)
          .eq('transaction_type', 'point_added')
          .gte('created_at', thirtyMinutesAgo)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentTransaction) {
          const lastCheckInTime = new Date(recentTransaction.created_at);
          const now = new Date();
          const minutesSince = Math.ceil((now.getTime() - lastCheckInTime.getTime()) / (1000 * 60));
          const remainingMinutes = 30 - minutesSince;

          setMessage({
            type: 'error',
            text: `Please wait ${remainingMinutes} more minute${remainingMinutes !== 1 ? 's' : ''} before adding points again. Same phone number can only earn points once every 30 minutes.`
          });
          setLoading(false);
          return;
        }
      }

      const updateData: any = {};
      if (customerName.trim()) {
        updateData.name = customerName.trim();
      }

      if (!customer) {
        // New customer
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
            shop_id: shopId!,
            phone: cleanPhone,
            name: customerName.trim() || null,
            current_points: 1,
            lifetime_points: 1,
            total_visits: 1,
          })
          .select()
          .single();

        if (createError) throw createError;
        customer = newCustomer;

        await supabase
          .from('loyalty_transactions')
          .insert({
            shop_id: shopId!,
            customer_id: customer.id,
            transaction_type: 'point_added',
            points_change: 1,
            balance_after: 1,
          });

        setMessage({
          type: 'success',
          text: `New customer! 1/${shop.points_needed} visits`,
        });
      } else {
        // Existing customer - update name if provided
        if (Object.keys(updateData).length > 0) {
          await supabase.from('customers').update(updateData).eq('id', customer.id);
        }

        const newPoints = customer.current_points + 1;
        const newTotalVisits = customer.total_visits + 1;

        if (newPoints >= shop.points_needed) {
          setMessage({
            type: 'success',
            text: `🎉 REWARD READY! Customer has earned ${shop.reward_description}`,
          });
        } else {
          setMessage({
            type: 'success',
            text: `Point added! ${newPoints}/${shop.points_needed} visits`,
          });
        }

        await supabase
          .from('customers')
          .update({
            current_points: newPoints,
            lifetime_points: customer.lifetime_points + 1,
            total_visits: newTotalVisits,
            last_visit_at: new Date().toISOString(),
            ...updateData,
          })
          .eq('id', customer.id);

        await supabase
          .from('loyalty_transactions')
          .insert({
            shop_id: shopId!,
            customer_id: customer.id,
            transaction_type: 'point_added',
            points_change: 1,
            balance_after: newPoints,
          });
      }

      // Mark appointment as checked in if found
      if (foundAppointment) {
        await supabase
          .from('appointments')
          .update({
            checked_in_at: new Date().toISOString(),
            status: 'completed',
          })
          .eq('id', foundAppointment.id);
      }

      setCurrentCustomerId(customer.id);
      setPhone('');
      setCustomerName('');
      setFoundAppointment(null);
      setShowAdditionalFields(false);
      if (shop) {
        loadRecentCheckins();
      }
      
      // Show rating modal after successful check-in
      setTimeout(() => {
        setShowRatingModal(true);
      }, 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemReward = async (customerId: string) => {
    if (!shop) return;
    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (!customer) return;

      await supabase
        .from('customers')
        .update({
          current_points: 0,
          rewards_redeemed: customer.rewards_redeemed + 1,
        })
        .eq('id', customerId);

      await supabase
        .from('loyalty_transactions')
        .insert({
          shop_id: shopId!,
          customer_id: customerId,
          transaction_type: 'reward_redeemed',
          points_change: -shop.points_needed,
          balance_after: 0,
        });

      setMessage({
        type: 'success',
        text: 'Reward redeemed! Customer starts fresh at 0 visits',
      });

      loadRecentCheckins();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const renderStars = (points: number) => {
    if (!shop) return null;
    const stars = [];
    for (let i = 0; i < shop.points_needed; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-5 h-5 ${i < points ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  // Handle rating submission
  const handleSubmitRating = async () => {
    if (!shop || !currentCustomerId || rating === 0) {
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
        .eq('customer_id', currentCustomerId)
        .eq('shop_id', shop.id)
        .gte('created_at', oneDayAgo)
        .maybeSingle();

      if (recentRating) {
        setMessage({
          type: 'success',
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
          customer_id: currentCustomerId,
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
      setCurrentCustomerId(null);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubmittingRating(false);
    }
  };

  // Open feedback modal for a specific customer
  const handleOpenFeedback = (customerId: string) => {
    setCurrentCustomerId(customerId);
    setShowRatingModal(true);
    setRating(0);
    setRatingComment('');
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  if (!shop) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Determine if user is authenticated (has shop in context)
  const isAuthenticated = !!outletContext?.shop;

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Back button - always visible on mobile, also visible on desktop when not in dashboard layout */}
      <button
        onClick={() => {
          if (isAuthenticated && shopId) {
            navigate(`/dashboard/${shopId}`);
          } else {
            window.history.back();
          }
        }}
        className="md:hidden flex items-center text-gray-600 hover:text-gray-900 mb-4 p-2 -ml-2 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        <span className="text-sm font-medium">{isAuthenticated ? 'Back to Home' : 'Back'}</span>
      </button>

      {/* Desktop back button - only shown when not in dashboard layout */}
      {!isAuthenticated && (
        <button
          onClick={() => window.history.back()}
          className="hidden md:flex items-center text-gray-600 hover:text-gray-900 mb-4 p-2 -ml-2 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">Back</span>
        </button>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Check In Customer</h1>

        {message && (
          <div
            className={`mb-4 p-4 rounded-xl border-l-4 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border-green-500'
                : 'bg-red-50 text-red-700 border-red-500'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Appointment Info */}
        {foundAppointment && (
          <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Appointment Found</h3>
                {foundAppointment.customer_name && (
                  <p className="text-blue-800 flex items-center gap-2 mb-1">
                    <User className="w-4 h-4" />
                    <strong>Name:</strong> {foundAppointment.customer_name}
                  </p>
                )}
                <p className="text-blue-800 flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4" />
                  <strong>Time:</strong> {formatTime(foundAppointment.appointment_time)}
                </p>
                {foundAppointment.service_type && (
                  <p className="text-blue-800 text-sm">
                    <strong>Service:</strong> {foundAppointment.service_type}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleCheckIn}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Enter customer phone number:
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="07XXX XXX XXX"
              required
              className="w-full px-4 py-3.5 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Optional Fields */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowAdditionalFields(!showAdditionalFields)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showAdditionalFields ? '−' : '+'} Add Optional Details
            </button>
          </div>

          {showAdditionalFields && (
            <div className="space-y-4 mb-4 p-4 bg-gray-50 rounded-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                {foundAppointment?.customer_name && !customerName && (
                  <p className="text-xs text-blue-600 mt-1">
                    Found in appointment: {foundAppointment.customer_name}
                  </p>
                )}
              </div>

            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? 'Adding Point...' : '✨ Add Point'}
          </button>
        </form>
      </div>

      {/* General Feedback Button - Always Visible */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Customer Feedback</h2>
            <p className="text-sm text-gray-500">Share your experience with us</p>
          </div>
          <button
            onClick={async () => {
              if (!phone.trim()) {
                setMessage({
                  type: 'error',
                  text: 'Please enter a phone number first to leave feedback.'
                });
                return;
              }
              const cleanPhone = phone.replace(/\s/g, '');
              const { data: customer } = await supabase
                .from('customers')
                .select('id')
                .eq('shop_id', shopId!)
                .eq('phone', cleanPhone)
                .maybeSingle();
              
              if (customer) {
                handleOpenFeedback(customer.id);
              } else {
                setMessage({
                  type: 'error',
                  text: 'Please check in first to leave feedback, or enter your phone number.'
                });
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
            title="Leave Feedback"
          >
            <MessageSquare className="w-4 h-4" />
            Leave Feedback
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Check-Ins (Today)</h2>
        {recentCheckins.length === 0 ? (
          <p className="text-gray-500">No check-ins today yet</p>
        ) : (
          <div className="space-y-4">
            {recentCheckins.map((checkin) => {
              const customer = checkin.customers;
              const isRewardReady = customer.current_points >= shop.points_needed;

              return (
                <div key={checkin.id} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {customer.name || customer.phone}
                        </p>
                        {customer.classification && (
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              customer.classification === 'VIP'
                                ? 'bg-purple-100 text-purple-700'
                                : customer.classification === 'Regular'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {customer.classification}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center mt-1">
                        {renderStars(customer.current_points)}
                        <span className="ml-2 text-sm text-gray-600">
                          {customer.current_points}/{shop.points_needed} visits
                        </span>
                      </div>
                      {isRewardReady && (
                        <p className="text-green-600 font-semibold mt-1">⭐ REWARD READY!</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenFeedback(customer.id)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                        title="Leave Feedback"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">Feedback</span>
                      </button>
                      {isRewardReady && (
                        <button
                          onClick={() => handleRedeemReward(customer.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Redeem Reward
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
                  setCurrentCustomerId(null);
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
                Comment (Optional, max 200 characters)
              </label>
              <textarea
                value={ratingComment}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setRatingComment(e.target.value);
                  }
                }}
                placeholder="Tell us about your experience..."
                rows={3}
                maxLength={200}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {ratingComment.length}/200
              </p>
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
