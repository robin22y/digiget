import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Bell, X, AlertCircle, Clock, MapPin } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  body: string;
  audience_filter: string;
  created_at: string;
  show_on_dashboard: boolean;
}

interface DashboardNotificationsProps {
  shopId: string;
}

export default function DashboardNotifications({ shopId }: DashboardNotificationsProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadNotices();
    const interval = setInterval(loadNotices, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [shopId]);

  const loadNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('show_on_dashboard', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading notices:', error);
        return;
      }

      if (data) {
        // Filter to only show notices for this shop
        const shopNotices = data.filter(
          notice => notice.audience_filter === 'all' || notice.audience_filter === `shop:${shopId}`
        );
        setNotices(shopNotices);
      }
    } catch (error) {
      console.error('Error loading notices:', error);
    }
  };

  const handleDismiss = (noticeId: string) => {
    setDismissed(prev => new Set(prev).add(noticeId));
  };

  const activeNotices = notices.filter(n => !dismissed.has(n.id));

  if (activeNotices.length === 0) return null;

  return (
    <div className="space-y-3 mb-4">
      {activeNotices.map((notice) => {
        const isClockInRequest = notice.title.includes('Clock-In');
        const isLocationDisabled = notice.title.includes('Location-Disabled');

        return (
          <div
            key={notice.id}
            className={`rounded-xl p-4 border-l-4 ${
              isClockInRequest
                ? 'bg-orange-50 border-orange-400'
                : isLocationDisabled
                ? 'bg-yellow-50 border-yellow-400'
                : 'bg-blue-50 border-blue-400'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                {isClockInRequest ? (
                  <Clock className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                ) : isLocationDisabled ? (
                  <MapPin className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <Bell className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{notice.title}</h3>
                  <p className="text-sm text-gray-700 mb-2">{notice.body}</p>
                  {isClockInRequest && (
                    <Link
                      to={`/dashboard/${shopId}/clock-requests`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-orange-700 hover:text-orange-800"
                    >
                      Review Clock-In Requests →
                    </Link>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDismiss(notice.id)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

