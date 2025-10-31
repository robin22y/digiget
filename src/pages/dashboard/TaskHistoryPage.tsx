import { useEffect, useState } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Calendar, CheckCircle, XCircle, Camera, ChevronDown, ChevronUp, Image as ImageIcon, MapPin } from 'lucide-react';
import { formatLocation, getGoogleMapsLink } from '../../utils/geolocation';
import { useShop } from '../../contexts/ShopContext';

interface Shop {
  plan_type: 'basic' | 'pro';
}

interface TaskCompletion {
  id: string;
  task_id: string;
  employee_id: string;
  completed: boolean;
  not_completed_reason: string | null;
  image_url: string | null;
  completed_at: string;
  task_date: string;
  latitude: number | null;
  longitude: number | null;
  tasks: {
    task_name: string;
    task_description: string | null;
    require_image: boolean;
  };
  employees: {
    first_name: string;
    last_name: string | null;
  };
}

interface DailyCompletions {
  date: string;
  completions: TaskCompletion[];
  totalTasks: number;
  completedCount: number;
  incompletedCount: number;
}

export default function TaskHistoryPage() {
  const { shopId: paramShopId } = useParams();
  const { shop: outletShop } = useOutletContext<{ shop: Shop }>();
  const { currentShop, hasAccess, loading: shopLoading } = useShop();
  const navigate = useNavigate();
  const [dailyCompletions, setDailyCompletions] = useState<DailyCompletions[]>([]);

  // Use currentShop from context or validated paramShopId
  const shop = outletShop;
  const shopId = currentShop?.id || (paramShopId && hasAccess(paramShopId) ? paramShopId : null);

  // Validate access
  useEffect(() => {
    if (!shopLoading && paramShopId) {
      if (!hasAccess(paramShopId)) {
        navigate('/dashboard');
        return;
      }
    }
  }, [paramShopId, hasAccess, shopLoading, navigate]);
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(30);

  useEffect(() => {
    if (shop.plan_type === 'pro') {
      loadTaskHistory();
    }
  }, [shopId, shop, dateRange]);

  const loadTaskHistory = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      const { data: completionsData, error: completionsError } = await supabase
        .from('task_completions')
        .select(`
          *,
          tasks (
            task_name,
            task_description,
            require_image
          ),
          employees (
            first_name,
            last_name
          )
        `)
        .eq('shop_id', shopId)
        .gte('task_date', startDate.toISOString().split('T')[0])
        .order('completed_at', { ascending: false });

      if (completionsError) throw completionsError;

      const grouped = new Map<string, TaskCompletion[]>();
      completionsData?.forEach((completion) => {
        const date = new Date(completion.task_date).toISOString().split('T')[0];
        if (!grouped.has(date)) {
          grouped.set(date, []);
        }
        grouped.get(date)!.push(completion as any);
      });

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id')
        .eq('shop_id', shopId)
        .eq('active', true);

      if (tasksError) throw tasksError;
      const totalTasks = tasksData?.length || 0;

      const dailyData: DailyCompletions[] = Array.from(grouped.entries()).map(([date, completions]) => {
        const completedCount = completions.filter(c => c.completed).length;
        const incompletedCount = completions.filter(c => !c.completed).length;

        return {
          date,
          completions,
          totalTasks,
          completedCount,
          incompletedCount,
        };
      });

      dailyData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setDailyCompletions(dailyData);
    } catch (error) {
      console.error('Error loading task history:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = date.toISOString().split('T')[0];
    const todayOnly = today.toISOString().split('T')[0];
    const yesterdayOnly = yesterday.toISOString().split('T')[0];

    if (dateOnly === todayOnly) return 'Today';
    if (dateOnly === yesterdayOnly) return 'Yesterday';

    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (shop.plan_type !== 'pro') {
    return (
      <div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">Pro Feature</h2>
          <p className="text-yellow-800">
            Task history is only available on the Pro plan.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-start py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Task Completion History</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">View:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 180 days</option>
            <option value={365}>Last 365 days</option>
          </select>
        </div>
      </div>

      {dailyCompletions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No task completions found in the selected date range.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dailyCompletions.map((daily) => {
            const isExpanded = expandedDates.has(daily.date);
            const completionRate = daily.totalTasks > 0
              ? (daily.completedCount / daily.totalTasks) * 100
              : 0;

            return (
              <div key={daily.date} className="bg-white rounded-lg shadow overflow-hidden">
                <button
                  onClick={() => toggleDate(daily.date)}
                  className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Calendar className="w-6 h-6 text-gray-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatDate(daily.date)}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm">
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            {daily.completedCount} completed
                          </span>
                          {daily.incompletedCount > 0 && (
                            <span className="flex items-center gap-1 text-red-600">
                              <XCircle className="w-4 h-4" />
                              {daily.incompletedCount} not completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {completionRate.toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">completion rate</div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-6 h-6 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="space-y-4">
                      {daily.completions.map((completion) => (
                        <div
                          key={completion.id}
                          className={`p-4 rounded-lg border-2 ${
                            completion.completed
                              ? 'bg-green-50 border-green-200'
                              : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {completion.completed ? (
                              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className={`font-semibold ${
                                  completion.completed ? 'text-green-900' : 'text-red-900'
                                }`}>
                                  {completion.tasks.task_name}
                                </h4>
                                {completion.tasks.require_image && (
                                  <Camera className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                              {completion.tasks.task_description && (
                                <p className={`text-sm mt-1 ${
                                  completion.completed ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  {completion.tasks.task_description}
                                </p>
                              )}
                              <p className="text-xs text-gray-600 mt-2">
                                By: {completion.employees.first_name} {completion.employees.last_name || ''}
                                {' • '}
                                {new Date(completion.completed_at).toLocaleString('en-GB', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>

                              {completion.latitude && completion.longitude && (
                                <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  <a
                                    href={getGoogleMapsLink(completion.latitude, completion.longitude) || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {formatLocation(completion.latitude, completion.longitude)}
                                  </a>
                                </div>
                              )}

                              {completion.image_url && (
                                <div className="mt-3">
                                  <button
                                    onClick={() => setSelectedImage(completion.image_url)}
                                    className="relative group"
                                  >
                                    <img
                                      src={completion.image_url}
                                      alt="Task completion"
                                      className="w-32 h-32 object-cover rounded border-2 border-green-300 hover:border-blue-500 transition-colors"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded flex items-center justify-center">
                                      <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </button>
                                </div>
                              )}

                              {!completion.completed && completion.not_completed_reason && (
                                <div className="mt-3 p-3 bg-red-100 rounded">
                                  <p className="font-medium text-red-900 text-sm">Reason not completed:</p>
                                  <p className="text-red-800 text-sm mt-1">{completion.not_completed_reason}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-sm"
            >
              Close
            </button>
            <img
              src={selectedImage}
              alt="Task completion full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
