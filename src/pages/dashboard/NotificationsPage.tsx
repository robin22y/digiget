import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useShop } from '../../contexts/ShopContext';
import { Bell, MapPin, Globe, Monitor, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { getAreaName } from '../../utils/geolocation';

interface ShopNotification {
  id: string;
  shop_id: string;
  notification_type: 'login_attempt' | 'clock_in_attempt' | 'remote_access';
  title: string;
  message: string;
  employee_id: string | null;
  employee_name: string | null;
  attempt_latitude: number | null;
  attempt_longitude: number | null;
  distance_from_shop: number | null;
  location_name: string | null;
  device_info: {
    userAgent?: string;
    platform?: string;
    vendor?: string;
    language?: string;
    screenResolution?: string;
  } | null;
  ip_address: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export default function NotificationsPage() {
  const { shopId: paramShopId } = useParams();
  const { currentShop, hasAccess, loading: shopLoading } = useShop();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<ShopNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'login_attempt' | 'clock_in_attempt'>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const shopId = currentShop?.id || (paramShopId && hasAccess(paramShopId) ? paramShopId : null);

  useEffect(() => {
    if (!shopLoading && paramShopId) {
      if (!hasAccess(paramShopId)) {
        navigate('/dashboard');
        return;
      }
    }
  }, [paramShopId, hasAccess, shopLoading, navigate]);

  useEffect(() => {
    if (shopId) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [shopId, filter]);

  const loadNotifications = async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('shop_notifications')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter === 'unread') {
        query = query.eq('is_read', false);
      } else if (filter === 'login_attempt' || filter === 'clock_in_attempt') {
        query = query.eq('notification_type', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get location names for notifications that don't have them
      const notificationsWithLocation = await Promise.all(
        (data || []).map(async (notification) => {
          if (notification.attempt_latitude && notification.attempt_longitude && !notification.location_name) {
            try {
              const locationName = await getAreaName(
                notification.attempt_latitude,
                notification.attempt_longitude
              );
              return { ...notification, location_name: locationName };
            } catch (error) {
              return notification;
            }
          }
          return notification;
        })
      );

      setNotifications(notificationsWithLocation as ShopNotification[]);

      // Count unread notifications
      const unread = (data || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('shop_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!shopId) return;
    
    try {
      const { error } = await supabase
        .from('shop_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('shop_id', shopId)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'login_attempt':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'clock_in_attempt':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDistance = (distance: number | null) => {
    if (!distance) return 'Unknown';
    if (distance < 1000) return `${Math.round(distance)}m`;
    return `${(distance / 1000).toFixed(2)}km`;
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Security Notifications</h1>
          <p className="text-gray-600">
            Monitor login attempts and clock-in activities from remote locations
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
        <button
          onClick={() => setFilter('login_attempt')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'login_attempt'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Login Attempts
        </button>
        <button
          onClick={() => setFilter('clock_in_attempt')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'clock_in_attempt'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Clock-In Attempts
        </button>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No notifications found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow-sm border-l-4 p-6 ${
                notification.is_read
                  ? 'border-gray-300 opacity-75'
                  : notification.notification_type === 'login_attempt'
                  ? 'border-orange-500'
                  : 'border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      {!notification.is_read && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          New
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{notification.message}</p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {notification.employee_name && (
                        <div>
                          <span className="text-gray-500">Employee:</span>{' '}
                          <span className="font-medium">{notification.employee_name}</span>
                        </div>
                      )}

                      {notification.distance_from_shop !== null && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-500">Distance:</span>{' '}
                          <span className="font-medium">
                            {formatDistance(notification.distance_from_shop)}
                          </span>
                        </div>
                      )}

                      {notification.location_name && (
                        <div>
                          <span className="text-gray-500">Location:</span>{' '}
                          <span className="font-medium">{notification.location_name}</span>
                        </div>
                      )}

                      {notification.ip_address && (
                        <div className="flex items-center gap-1">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-500">IP Address:</span>{' '}
                          <span className="font-mono font-medium">{notification.ip_address}</span>
                        </div>
                      )}

                      {notification.device_info && (
                        <div className="flex items-center gap-1">
                          <Monitor className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="text-gray-500">Device:</span>{' '}
                            <span className="font-medium">
                              {notification.device_info.platform || 'Unknown'}
                            </span>
                            {notification.device_info.screenResolution && (
                              <span className="text-gray-500 ml-2">
                                ({notification.device_info.screenResolution})
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {notification.device_info?.userAgent && (
                        <div className="md:col-span-2 lg:col-span-3">
                          <details className="cursor-pointer">
                            <summary className="text-gray-500 hover:text-gray-700">
                              View User Agent
                            </summary>
                            <p className="mt-2 text-xs font-mono text-gray-600 bg-gray-50 p-2 rounded">
                              {notification.device_info.userAgent}
                            </p>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!notification.is_read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Mark as read"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

