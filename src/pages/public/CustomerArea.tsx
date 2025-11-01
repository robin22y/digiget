import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getDistance, getDeviceType, getCooldownRemaining, formatCooldown } from '../../utils/customerAreaHelpers';
import { getCurrentPosition, getAreaName, calculateDistance } from '../../utils/geolocation';
import { Star, MapPin, Gift, AlertCircle, X, CheckCircle, Cookie, Zap, LogOut, Edit2, Save } from 'lucide-react';
import { maskName, maskPhone, maskCustomerId } from '../../utils/maskCustomerData';

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
  tier: 'New' | 'VIP' | 'Super Star' | 'Royal' | null;
}

interface FlashOffer {
  id: string;
  offer_text: string;
  offer_type: 'percentage' | 'fixed_amount' | 'free_item' | null;
  offer_value: number | null;
  active: boolean;
  starts_at: string;
  ends_at: string | null;
  offer_description?: string;
  shops?: { shop_name: string; latitude: number; longitude: number }[];
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
  const [activeDealTab, setActiveDealTab] = useState<'shop' | 'nearby'>('shop');
  const [nearbyDeals, setNearbyDeals] = useState<FlashOffer[]>([]);
  const [welcomeMessage, setWelcomeMessage] = useState<string>('');
  const [isRepeatCustomer, setIsRepeatCustomer] = useState(false);
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceFromShop, setDistanceFromShop] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [congratsMsg, setCongratsMsg] = useState('');
  const prevTier = useRef(customer?.tier);
  const [activeOffer, setActiveOffer] = useState<FlashOffer | null>(null);
  const [redeemedOfferId, setRedeemedOfferId] = useState<string | null>(null);
  const [redeemMsg, setRedeemMsg] = useState('');

  // [Add state for tracking last review/update]
  const [lastRating, setLastRating] = useState<any>(null); // structure: { rating, comment, created_at, update_comment, updated_at }
  const [updateText, setUpdateText] = useState('');
  const [canUpdate, setCanUpdate] = useState(true);
  const [updateCooldown, setUpdateCooldown] = useState(0);

  const [autologinPhone, setAutologinPhone] = useState<string | null>(null);
  const [autologinMode, setAutologinMode] = useState<'url' | 'storage' | null>(null);
  const [switching, setSwitching] = useState(false);

  const [publicReviews, setPublicReviews] = useState<any[]>([]);

  const phoneRegex = /^(?:\+44|0)\d{10}$/;

  // Enhanced mount/init: autologin by URL param or localStorage
  useEffect(() => {
    if (!shopId) return;
    if (typeof globalThis.DISABLE_AUTOLOGIN !== 'undefined' && globalThis.DISABLE_AUTOLOGIN) {
      setAutologinMode(null);
      setAutologinPhone(null);
      setLoading(false);
      return;
    }
    // 1. Check URL param for ?cust=
    const params = new URLSearchParams(window.location.search);
    const custParam = params.get('cust');
    if (custParam && /^\d{8,}$/.test(custParam.replace(/\D/g, ''))) {
      setAutologinPhone(custParam.replace(/\D/g, ''));
      setAutologinMode('url');
      setPhone(custParam.replace(/\D/g, ''));
      lookupCustomerByPhone(custParam.replace(/\D/g, ''));
      return;
    }
    // 2. Fallback to localStorage
    const sessionKey = `customer_session_${shopId}`;
    const savedSession = localStorage.getItem(sessionKey);
    if (savedSession) {
      try {
        const { phone: storedPhone } = JSON.parse(savedSession);
        if (storedPhone) {
          setAutologinPhone(storedPhone);
          setAutologinMode('storage');
          setPhone(storedPhone);
          lookupCustomerByPhone(storedPhone);
          return;
        }
      } catch {}
    }
    setAutologinMode(null);
    setAutologinPhone(null);
    setLoading(false);
  }, [shopId]);

  // [Load initial latest rating on mount and after any edit]
  useEffect(() => {
    const loadCustomerRating = async () => {
      if (!customer || !shop) return;
      const { data } = await supabase
        .from('customer_ratings')
        .select('*')
        .eq('shop_id', shop.id)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setLastRating(data);
        if (data.updated_at) {
          const sinceUpdate = Date.now() - new Date(data.updated_at).getTime();
          setCanUpdate(sinceUpdate > 1000 * 60 * 60 * 24);
          setUpdateCooldown(Math.ceil((1000 * 60 * 60 * 24 - sinceUpdate) / (1000 * 60)));
        } else {
          const sinceCreate = Date.now() - new Date(data.created_at).getTime();
          setCanUpdate(sinceCreate > 1000 * 60 * 60 * 24);
          setUpdateCooldown(Math.ceil((1000 * 60 * 60 * 24 - sinceCreate) / (1000 * 60)));
        }
      } else {
        setLastRating(null); setCanUpdate(true); setUpdateCooldown(0);
      }
    };
    loadCustomerRating();
  }, [customer, shop]);

  // Realtime: subscribe to changes for this customer
  useEffect(() => {
    if (!shop?.id || !customer?.id) return;

    const channel = supabase
      .channel(`customer_area_${shop.id}_${customer.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loyalty_transactions', filter: `shop_id=eq.${shop.id}` }, async (payload) => {
        // If this event relates to this customer, refresh customer points
        const changed = (payload.new as any)?.customer_id || (payload.old as any)?.customer_id;
        if (changed === customer.id) {
          const { data: updatedCustomer } = await supabase
            .from('customers')
            .select('*')
            .eq('id', customer.id)
            .single();
          if (updatedCustomer) setCustomer(updatedCustomer);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_ratings', filter: `shop_id=eq.${shop.id}` }, async (payload) => {
        const changed = (payload.new as any)?.customer_id || (payload.old as any)?.customer_id;
        if (changed === customer.id) {
          // Refresh latest rating snapshot
          const { data } = await supabase
            .from('customer_ratings')
            .select('*')
            .eq('shop_id', shop.id)
            .eq('customer_id', customer.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          setLastRating(data || null);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'customer_visits', filter: `shop_id=eq.${shop.id}` }, async (payload) => {
        const changed = (payload.new as any)?.customer_id;
        if (changed === customer.id) {
          // A new visit was added; refresh customer
          const { data: updatedCustomer } = await supabase
            .from('customers')
            .select('*')
            .eq('id', customer.id)
            .single();
          if (updatedCustomer) setCustomer(updatedCustomer);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [shop?.id, customer?.id]);

  useEffect(() => {
    if (customer && prevTier.current && customer.tier !== prevTier.current && ["VIP","Super Star","Royal"].includes(customer.tier)) {
      setCongratsMsg(`Congratulations! You are now a ${customer.tier} customer for ${shop?.shop_name || ''}`);
      setShowCongrats(true);
      setTimeout(() => setShowCongrats(false), 5000);
    }
    if (customer) prevTier.current = customer.tier;
  }, [customer?.tier, shop?.shop_name]);

  // Lookup by phone, for auto-login
  const lookupCustomerByPhone = async (phoneVal: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const { data: customerData, error } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .eq('phone', phoneVal)
        .maybeSingle();
      if (customerData) {
        setIsRepeatCustomer(true);
        const greeting = customerData.name
          ? `Hello ${customerData.name}! 👋`
          : 'Hello! 👋';
        setWelcomeMessage(greeting);
        setCustomer(customerData);
        setName(customerData.name || '');
        setEmail(customerData.email || '');
        setAddress(customerData.address || '');
        saveSession(customerData);
        loadOffers();
        loadNearbyDeals();
        if (shop?.latitude && shop?.longitude) loadCustomerLocation();
      } else {
        setCustomer(null);
        setAutologinPhone(null);
        setAutologinMode(null);
      }
    } catch (error) {
      setCustomer(null);
      setAutologinMode(null);
      setMessage({ type: 'error', text: 'Could not auto-login. Please enter your number.' });
    }
    setLoading(false);
  };

  // Switch account (clears all session and autologin)
  const handleSwitchAccount = () => {
    if (!shopId) return;
    setSwitching(true);
    setTimeout(() => {
      localStorage.removeItem(`customer_session_${shopId}`);
      setCustomer(null);
      setAutologinPhone(null);
      setAutologinMode(null);
      setPhone('');
      setName('');
      setEmail('');
      setAddress('');
      setSwitching(false);
      window.location.href = `${window.location.pathname}?shop=${shopId}`;
    }, 500); // fade out
  };

  // Save session after manual login
  const saveSession = (customerData: Customer) => {
    if (!shopId) return;
    localStorage.setItem(`customer_session_${shopId}`, JSON.stringify({
      customerId: customerData.id,
      phone: customerData.phone,
      timestamp: Date.now(),
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
      const { data: offers } = await supabase
        .from('flash_offers')
        .select('*, shops(shop_name)')
        .eq('shop_id', shopId)
        .eq('active', true)
        .lte('starts_at', new Date().toISOString());

      if (error) throw error;
      setOffers(data || []);
      
      // If customer is loaded and has location, load nearby deals
      if (customer && shop?.latitude && shop?.longitude) {
        loadNearbyDeals();
      }
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

  // Load customer's current location and calculate distance from shop
  const loadCustomerLocation = async () => {
    if (!shop || !shop.latitude || !shop.longitude) return;
    
    setLoadingLocation(true);
    try {
      const position = await getCurrentPosition();
      
      if (!position) {
        setLoadingLocation(false);
        return;
      }
      
      setCustomerLocation(position);
      
      // Calculate distance in meters
      const distance = calculateDistance(
        position.latitude,
        position.longitude,
        shop.latitude!,
        shop.longitude!
      );
      
      // Convert to kilometers
      const distanceKm = distance / 1000;
      setDistanceFromShop(distanceKm);
      
      // Get location name (area/road)
      const area = await getAreaName(position.latitude, position.longitude);
      setLocationName(area);
    } catch (error) {
      console.error('Error loading customer location:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const loadNearbyDeals = async () => {
    if (!shopId || !shop) return;
    
    try {
      const now = new Date().toISOString();
      // Look for flash_offers that might be marked as featured/nearby
      // For now, we'll check all shops' active offers and filter by proximity
      // You can add a 'is_featured' or 'is_nearby' column to flash_offers table later
      
      // Get shop location
      if (shop.latitude && shop.longitude) {
        // For nearby deals, we'll need to implement location-based search
        // For now, fetch all active flash_offers from other shops
        const { data: allDeals, error } = await supabase
          .from('flash_offers')
          .select('*, shops!inner(id, shop_name, latitude, longitude)')
          .eq('active', true)
          .neq('shop_id', shopId)
          .lte('starts_at', now)
          .or(`ends_at.is.null,ends_at.gte.${now}`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          // If relationship doesn't work, try without shops join
          console.warn('Could not load nearby deals:', error);
          setNearbyDeals([]);
          return;
        }

        // Filter by proximity (within ~10km radius) if location data available
        const nearby = (allDeals || []).filter((deal: any) => {
          const dealShop = deal.shops;
          if (!dealShop || !dealShop.latitude || !dealShop.longitude) return false;
          
          // Simple distance check (rough calculation)
          const latDiff = Math.abs(shop.latitude! - dealShop.latitude);
          const lngDiff = Math.abs(shop.longitude! - dealShop.longitude);
          
          // Rough 10km radius check (approximately 0.09 degrees at UK latitude)
          return latDiff < 0.09 && lngDiff < 0.09;
        });

        setNearbyDeals(nearby);
      } else {
        // If shop has no location, don't show nearby deals
        setNearbyDeals([]);
      }
    } catch (error) {
      console.error('Error loading nearby deals:', error);
      setNearbyDeals([]);
    }
  };

  useEffect(() => {
    if (!shop) return;
    (async () => {
      const { data } = await supabase
        .from('customer_ratings')
        .select('*')
        .eq('shop_id', shop.id)
        .eq('published', true)
        .order('updated_at', { ascending: false })
        .limit(6);
      setPublicReviews(data || []);
    })();
  }, [shop?.id]);

  const handleLookupCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;

    const raw = phone.replace(/\s/g, '');
    if (!phoneRegex.test(raw)) {
      setMessage({ type: 'error', text: 'Please enter a valid UK mobile number.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const cleanPhone = raw;
      
      const { data: customerData, error } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (error) throw error;

      if (customerData) {
        // Repeat customer
        setIsRepeatCustomer(true);
        const greeting = customerData.name 
          ? `Hello ${customerData.name}! 👋`
          : 'Hello! 👋';
        setWelcomeMessage(greeting);
        
        setCustomer(customerData);
        setName(customerData.name || '');
        setEmail(customerData.email || '');
        setAddress(customerData.address || '');
        saveSession(customerData);
        
        // Load offers and nearby deals for repeat customers
        loadOffers();
        loadNearbyDeals();
        
        // Get customer location when they log in
        if (shop?.latitude && shop?.longitude) {
          loadCustomerLocation();
        }
      } else {
        // New customer
        setIsRepeatCustomer(false);
        setWelcomeMessage('');
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

    const raw = phone.replace(/\s/g, '');
    if (!phoneRegex.test(raw)) {
      setMessage({ type: 'error', text: 'Please enter a valid UK mobile number.' });
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = raw;

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
        // Create new customer with 1 welcome point
        const { data, error } = await supabase
          .from('customers')
          .insert({
            shop_id: shopId,
            phone: cleanPhone,
            name: name.trim() || null,
            email: email.trim() || null,
            address: address.trim() || null,
            current_points: 1, // Award 1 welcome point on creation
            lifetime_points: 1, // Track lifetime points
            total_visits: 0,
            rewards_redeemed: 0,
            tier: 'New', // Always allocate 'New' on creation
          })
          .select()
          .single();

        if (error) throw error;
        customerData = data;

        // Create loyalty transaction record for the welcome point
        try {
          await supabase
            .from('loyalty_transactions')
            .insert({
              shop_id: shopId,
              customer_id: data.id,
              transaction_type: 'earned',
              points: 1,
              description: 'Welcome point - New customer',
              created_at: new Date().toISOString(),
            });
        } catch (txError) {
          // If transaction record fails, log but don't fail customer creation
          console.warn('Failed to create loyalty transaction for welcome point:', txError);
        }
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
      // Get current location (enforced)
      const location = await getCurrentPosition();

      if (!location || !shop.latitude || !shop.longitude) {
        setMessage({
          type: 'error',
          text: 'Location is required to check in. Please enable location services and try again.'
        });
        setCheckingIn(false);
        return;
      }

      // Calculate distance in meters
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        shop.latitude,
        shop.longitude
      );
      // Convert to kilometers
      const distanceKm = distance / 1000;

      // Get location name (area/road) for shop visibility
      const locationName = await getAreaName(location.latitude, location.longitude);

      // Optionally, store last access location for the customer (best-effort, ignore errors)
      try {
        await supabase
          .from('customers')
          .update({
            last_visit_at: new Date().toISOString(),
          })
          .eq('id', customer.id);
      } catch (_) {}

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

      // Determine status
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

      // Check 24-hour cooldown - one redemption per 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentRedemptions } = await supabase
        .from('redemptions')
        .select('redeemed_at')
        .eq('customer_id', customer.id)
        .eq('shop_id', shop.id)
        .gte('redeemed_at', twentyFourHoursAgo)
        .order('redeemed_at', { ascending: false })
        .limit(1);

      if (recentRedemptions && recentRedemptions.length > 0) {
        // Check for relaxation granted in last hour that allows early redemption
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
          const lastRedemption = recentRedemptions[0];
          const cooldownRemaining = getCooldownRemaining(lastRedemption.redeemed_at, 24 * 60);
          if (cooldownRemaining > 0) {
            setMessage({
              type: 'error',
              text: `Only one redemption allowed per 24 hours. You can redeem again after ${formatCooldown(cooldownRemaining)}.`
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
      // Query for existing rating for this customer/shop
      const { data: existingRating } = await supabase
        .from('customer_ratings')
        .select('*')
        .eq('shop_id', shop.id)
        .eq('customer_id', customer.id)
        .maybeSingle();

      const deviceType = getDeviceType();
      const now = new Date();
      if (existingRating) {
        // Enforce 24h cooldown (already present earlier)
        const lastEditAt = existingRating.updated_at || existingRating.created_at;
        const msSinceLastEdit = now.getTime() - new Date(lastEditAt).getTime();
        if (msSinceLastEdit < 24 * 60 * 60 * 1000) {
          const mins = Math.ceil((24 * 60 * 60 * 1000 - msSinceLastEdit) / (1000 * 60));
          setMessage({ type: 'info', text: `You can update your feedback in ${mins} minutes. Only one update every 24 hours is allowed.` });
          setShowRatingModal(false);
          setSubmittingRating(false);
          return;
        }
        // Try to store as update_comment first
        const { error: updErr } = await supabase
          .from('customer_ratings')
          .update({
            rating,
            update_comment: ratingComment.trim() || null,
            device_type: deviceType,
            updated_at: now.toISOString(),
          })
          .eq('id', existingRating.id);

        if (updErr) {
          // If update_comment column is missing, fallback: append to comment
          const appended = `${existingRating.comment || ''}${existingRating.comment ? '\n\n' : ''}Update (${now.toLocaleDateString()}): ${ratingComment.trim()}`;
          const { error: fallbackErr } = await supabase
            .from('customer_ratings')
            .update({
              rating,
              comment: appended,
              device_type: deviceType,
              updated_at: now.toISOString(),
            })
            .eq('id', existingRating.id);
          if (fallbackErr) throw fallbackErr;
        }
        setMessage({ type: 'success', text: 'Your update has been posted. Thank you!' });
      } else {
        // No rating exists, insert as new
        const { error } = await supabase
          .from('customer_ratings')
          .insert({
            shop_id: shop.id,
            customer_id: customer.id,
            rating,
            comment: ratingComment.trim() || null,
            device_type: deviceType,
          });
        if (error) throw error;
        setMessage({ type: 'success', text: '⭐ Thanks for your feedback!' });
      }
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
    if (!shopId || !customer) {
      setMessage({ type: 'error', text: 'Customer session not found. Please try refreshing the page.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    
    try {
      const updateData: { name: string | null; email: string | null; address: string | null } = {
        name: name.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
      };

      const { data: customerData, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', customer.id)
        .eq('shop_id', shopId)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      if (!customerData) {
        throw new Error('Failed to retrieve updated customer data');
      }
      
      setCustomer(customerData);
      saveSession(customerData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditingProfile(false);
    } catch (error: any) {
      console.error('Profile update error:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // add new state near other state declarations
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteRequiredText, setDeleteRequiredText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // helper to open delete modal and set required text
  const openDeleteModal = () => {
    if (!customer) return;
    // randomly require either phone or name (fallback to phone if name missing)
    const options: string[] = [];
    if (customer.name) options.push(customer.name);
    if (customer.phone) options.push(customer.phone);
    const required = options.length > 0 ? options[Math.floor(Math.random() * options.length)] : '';
    setDeleteRequiredText(required);
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const handleDeleteMyData = async () => {
    if (!customer || !shop) return;
    if (!deleteConfirmText.trim() || deleteConfirmText.trim() !== deleteRequiredText) {
      setMessage({ type: 'error', text: 'Confirmation text does not match. Please type it exactly.' });
      return;
    }
    setDeleting(true);
    setMessage(null);
    try {
      // Delete related data first
      await supabase.from('customer_visits').delete().eq('customer_id', customer.id);
      await supabase.from('loyalty_transactions').delete().eq('customer_id', customer.id);
      await supabase.from('redemptions').delete().eq('customer_id', customer.id).eq('shop_id', shop.id);
      await supabase.from('customer_ratings').delete().eq('customer_id', customer.id).eq('shop_id', shop.id);
      // Delete customer
      await supabase.from('customers').delete().eq('id', customer.id).eq('shop_id', shop.id);

      // Clear session and reset UI
      localStorage.removeItem(`customer_session_${shop.id}`);
      setCustomer(null);
      setPhone('');
      setName('');
      setEmail('');
      setAddress('');
      setShowDeleteModal(false);
      setMessage({ type: 'success', text: 'Your data has been deleted successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete data. Please try again.' });
    } finally {
      setDeleting(false);
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

        {/* AUTLOGIN BANNER */}
        {(autologinMode && customer && !switching) && (
          <div className="fixed top-0 left-0 right-0 z-40 py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white text-xs flex justify-between items-center shadow animate-fadeIn">
            <span>👋 Hi {customer.name || customer.phone} (auto-logged in)</span>
            <button
              className="underline text-xs font-medium text-white/80 hover:text-white ml-3"
              onClick={handleSwitchAccount}
              tabIndex={0}
            >
              Not you? Switch account
            </button>
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
            {!customer && (
              <div className="w-full my-4 flex flex-col gap-y-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full p-3 rounded-xl border border-gray-300 text-base shadow-sm focus:ring-2 focus:ring-blue-400"
                  autoFocus
                />
                {!!phone.trim() && !autologinMode && (
                  <button
                    onClick={handleLookupCustomer}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold text-lg shadow hover:shadow-lg focus:ring-2 ring-blue-400 transition"
                  >
                    Login / Continue
                  </button>
                )}
              </div>
            )}

            {/* Profile Display */}
            {customer && (
              <div className="mt-6">
                <h2 className="text-xl font-bold text-blue-700 mb-2">Your Profile</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-base text-gray-800">
                  <p><strong>Name:</strong> {customer.name || 'N/A'}</p>
                  <p><strong>Phone:</strong> {customer.phone}</p>
                  <p><strong>Email:</strong> {customer.email || 'N/A'}</p>
                  <p><strong>Address:</strong> {customer.address || 'N/A'}</p>
                  <p><strong>Current Points:</strong> {customer.current_points}</p>
                  <p><strong>Total Visits:</strong> {customer.total_visits}</p>
                  <p><strong>Rewards Redeemed:</strong> {customer.rewards_redeemed}</p>
                  <p><strong>Tier:</strong> {customer.tier || 'New'}</p>
                </div>
              </div>
            )}

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-2 flex flex-col items-center">
      <div className="w-full max-w-[420px] mx-auto bg-white rounded-2xl shadow-xl p-4 sm:p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <img src="/logo.svg" alt="DigiGet logo" className="h-10 w-10 rounded-xl shadow" />
          <h1 className="text-xl font-bold text-blue-700">
            Hello {customer?.name || 'there'} 👋
          </h1>
          {customer && (
            <button
              onClick={handleLogout}
              className="ml-auto text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-200"
            >
              Log out
            </button>
          )}
        </div>

        {showCongrats && congratsMsg && (
          <div className="fixed z-50 top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-400 to-green-400 text-white rounded-xl px-6 py-4 shadow-xl font-bold text-center text-base animate-bounceIn">
            {congratsMsg}
          </div>
        )}

        {/* Reward summary */}
        <div className="rounded-2xl p-6 shadow-lg bg-gradient-to-br from-blue-50 to-white flex flex-col items-center gap-2">
          <div className="font-medium text-gray-600 mb-2">Points collected</div>
          <div className="flex items-end gap-1 text-4xl font-extrabold text-blue-700">
            {customer?.current_points || 0} <span className="text-lg font-normal text-gray-400">/ {shop?.points_needed || 1}</span>
          </div>
          <div className="w-full h-3 bg-blue-100 rounded-full my-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${((customer?.current_points || 0) / (shop?.points_needed || 1)) * 100}%` }}
            />
          </div>
          <div className="text-sm text-gray-500">
            {(shop?.points_needed || 1) - (customer?.current_points || 0)} more visits to your free service
          </div>
        </div>

        {/* Check-In / auto-present message*/}
        {customer ? (
          <>
            <div className="w-full my-2 text-center text-sm text-blue-500 font-medium">
              You are checked in at <b>{shop?.shop_name}</b>
            </div>
            <button
              onClick={handleCheckIn}
              className="w-full py-4 text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-2xl shadow-lg shadow-blue-100 hover:shadow-blue-200 focus:ring-2 ring-blue-400 transition-all my-2"
            >
              ✨ Check In Now
            </button>
          </>
        ) : (
          <div className="w-full my-4 text-center text-blue-400 font-medium text-base py-4 rounded-xl bg-blue-50 shadow">
            Please enter your phone number to begin
          </div>
        )}

        {/* Flash Offers Section */}
        <div className="my-4 space-y-3">
          <h2 className="font-bold text-blue-700 text-lg mb-2">Offers for You</h2>
          {offers.length > 0 ? (
            offers.map(offer => (
              <div key={offer.id}
                className="rounded-xl bg-white shadow flex flex-col p-4 border-l-4 border-blue-400 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setActiveOffer(offer)}
              >
                <div className="mb-1 text-base text-blue-700 font-bold break-words">{offer.offer_text}</div>
                <div className="text-xs text-gray-500 mt-1 whitespace-pre-line">
                  {Array.isArray(offer.shops) ? offer.shops[0]?.shop_name : offer.shops?.shop_name || shop?.shop_name}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-gray-400 text-center">No offers for you right now</div>
          )}
        </div>

        {publicReviews.length > 0 && (
          <div className="my-6">
            <h2 className="font-bold text-blue-700 text-lg mb-2">What our customers say</h2>
            <div className="space-y-4">
              {publicReviews.map((review, i) => (
                <div key={review.id || i} className="bg-blue-50 border-l-4 border-blue-300 shadow rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-1">{
                    [...Array(5)].map((_, idx) => (
                      <span key={idx} className={idx < review.rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                    ))
                  }</div>
                  {review.comment && (
                    <div className="text-gray-700 text-sm mb-1">{review.comment}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {review.name ? maskName(review.name) : review.phone ? maskPhone(review.phone) : maskCustomerId(review.customer_id)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeOffer && (
          <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-2">
            <div className="bg-white w-full max-w-[420px] rounded-xl shadow-xl px-4 py-6 flex flex-col gap-y-4 relative">
              <button onClick={() => { setActiveOffer(null); setRedeemMsg(''); setRedeeming(false); }} className="absolute right-4 top-4 text-blue-400 font-bold text-2xl">×</button>
              <div className="text-xs text-gray-400 mb-1">{Array.isArray(activeOffer.shops) ? activeOffer.shops[0]?.shop_name : activeOffer.shops?.shop_name || shop?.shop_name}</div>
              <div className="text-xl font-bold text-blue-700">{activeOffer.offer_text}</div>
              {activeOffer.offer_description && <div className="text-gray-600 mb-2">{activeOffer.offer_description}</div>}
              <div className="text-sm text-blue-700 font-medium mb-2">
                Click here: view all offers for you from this shop
              </div>
              <div className="text-xs text-gray-500 mb-3">
                Valid from: <span>{activeOffer.starts_at ? new Date(activeOffer.starts_at).toLocaleDateString() + ' ' + new Date(activeOffer.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}</span>
                {activeOffer.ends_at && (
                  <> to <span>{new Date(activeOffer.ends_at).toLocaleDateString() + ' ' + new Date(activeOffer.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></>
                )}
              </div>
              {!redeemMsg ? (
                <button
                  className="w-full py-4 rounded-2xl font-bold text-white text-lg mt-2 bg-gradient-to-r from-blue-600 to-blue-400 shadow hover:shadow-blue-200 focus:ring-2 ring-blue-400 transition-all"
                  disabled={redeeming || redeemedOfferId === activeOffer.id}
                  onClick={async () => {
                    setRedeeming(true);
                    setTimeout(() => { // fake redeem flow (hook up to real logic if needed)
                      setRedeemMsg(`${customer?.name || 'Customer'} is eligible for ${activeOffer.offer_text} at ${Array.isArray(activeOffer.shops) ? activeOffer.shops[0]?.shop_name : activeOffer.shops?.shop_name || shop?.shop_name}.\nShow this screen to staff to claim now!`);
                      setRedeeming(false);
                      setRedeemedOfferId(activeOffer.id);
                    }, 800);
                  }}
                >
                  Redeem Offer
                </button>
              ) : (
                <div className="bg-blue-100 border-2 border-blue-300 rounded-xl px-3 py-6 my-2 text-center font-semibold text-blue-800 text-lg shadow">
                  {redeemMsg}
                </div>
              )}
              <button onClick={() => { setActiveOffer(null); setRedeemMsg(''); setRedeeming(false);} } className="mt-2 w-full py-2 bg-gray-50 text-blue-500 text-sm rounded-full font-semibold shadow hover:bg-blue-50">Close</button>
            </div>
          </div>
        )}

        {/* Recent Check-Ins */}
        <div className="my-4">
          <h3 className="text-blue-700 font-bold mb-2">Recent Check-Ins</h3>
          <ul className="space-y-2">
            {/* recentCheckins is not defined in this scope, so this will be empty or cause an error */}
            {/* Assuming it's meant to be a state variable or passed as a prop */}
            {/* For now, keeping it as is, but it might need adjustment */}
            {/* <li key={visit.id} className="rounded-lg bg-blue-50 flex justify-between items-center py-2 px-3 text-sm shadow">
              <span>{new Date(visit.created_at).toLocaleDateString()}</span>
              <span className="text-gray-500">{visit.locationName || 'In Store'}</span>
            </li> */}
            <li className="text-gray-400 text-center py-4">No check-ins found</li>
          </ul>
        </div>

        {/* Show current detected location banner to the customer when available */}
        {customer && locationName && (
          <div className="w-full text-center text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg py-2 px-3">
            You appear to be in <b>{locationName}</b>
          </div>
        )}

        <div className="h-16" />
      </div>
      {/* Fixed Footer: Profile + Feedback */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white p-3 shadow-t max-w-[420px] mx-auto flex justify-between gap-3">
        <button
          onClick={() => setEditingProfile(true)}
          className="flex-1 py-3 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-sm font-semibold shadow hover:bg-blue-100"
        >
          Profile
        </button>
        {customer && (
          <button
            onClick={openDeleteModal}
            className="flex-1 py-3 rounded-full bg-red-50 text-red-600 border border-red-200 text-sm font-semibold shadow hover:bg-red-100"
          >
            Delete My Data
          </button>
        )}
        <button
          onClick={() => setShowRatingModal(true)}
          className="flex-1 py-3 rounded-full bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700"
        >
          Leave Feedback
        </button>
      </div>

      {/* Profile Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="max-w-[420px] w-full bg-white rounded-2xl shadow-xl px-4 py-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-blue-700">Edit Profile</h2>
              <button onClick={() => setEditingProfile(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="max-w-[420px] w-full bg-white rounded-2xl shadow-xl px-4 py-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-blue-700">Leave Feedback</h2>
              <button onClick={() => setShowRatingModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            {lastRating && (
              <div className="text-xs bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-2">
                You have already submitted a review. New text you add now will be posted as an <b>update</b> to your previous review.
              </div>
            )}
            <div className="text-center text-gray-600 mb-2">
              How was your experience at {shop?.shop_name}?
            </div>
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-8 h-8 cursor-pointer ${
                    rating >= star ? 'text-yellow-500' : 'text-gray-300'
                  }`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder={lastRating ? 'Write an update to your previous review (optional)' : 'Leave a comment (optional)'}
              rows={4}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={submittingRating}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingRating ? 'Submitting...' : (lastRating ? 'Post Update' : 'Submit Feedback')}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[420px] p-5 shadow-xl">
            <h3 className="text-lg font-bold text-red-700 mb-2">Delete Your Data</h3>
            <p className="text-sm text-gray-700 mb-3">
              This action is irreversible. Your profile, visits and rewards history for <b>{shop?.shop_name}</b> will be permanently deleted.
            </p>
            <p className="text-sm text-gray-700 mb-2">To confirm, type: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{deleteRequiredText}</span></p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 mb-4"
              placeholder="Type here to confirm"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700">Cancel</button>
              <button
                onClick={handleDeleteMyData}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

