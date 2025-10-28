import { useState, useEffect } from 'react';
import { Clock, CheckCircle, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ClockEntry {
  id: string;
  clock_in_time: string;
  clock_out_time: string | null;
  hours_worked: number | null;
  tasks_complete: boolean;
  tasks_assigned: string[] | null;
}

interface StaffWorkHistoryProps {
  employeeId: string;
}

export default function StaffWorkHistory({ employeeId }: StaffWorkHistoryProps) {
  const [entries, setEntries] = useState<ClockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadHistory();
  }, [employeeId, timeframe]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('clock_entries')
        .select('*')
        .eq('employee_id', employeeId)
        .order('clock_in_time', { ascending: false });

      if (timeframe === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('clock_in_time', weekAgo.toISOString());
      } else if (timeframe === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('clock_in_time', monthAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const totalHours = entries
    .filter(e => e.hours_worked)
    .reduce((sum, e) => sum + (e.hours_worked || 0), 0);

  const completedShifts = entries.filter(e => e.clock_out_time).length;

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setTimeframe('week')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            timeframe === 'week'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => setTimeframe('month')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            timeframe === 'month'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Last 30 Days
        </button>
        <button
          onClick={() => setTimeframe('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            timeframe === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Time
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
          <Clock className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-3xl font-bold text-blue-900">{totalHours.toFixed(1)}h</p>
          <p className="text-sm text-blue-700">Total Hours</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
          <Calendar className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-3xl font-bold text-green-900">{completedShifts}</p>
          <p className="text-sm text-green-700">Shifts Completed</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">No work history for this period</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{formatDate(entry.clock_in_time)}</p>
                  <p className="text-sm text-gray-600">
                    {formatTime(entry.clock_in_time)} - {entry.clock_out_time ? formatTime(entry.clock_out_time) : 'In Progress'}
                  </p>
                </div>
                {entry.clock_out_time ? (
                  <div className="text-right">
                    <p className="font-bold text-blue-600">
                      {entry.hours_worked ? formatDuration(entry.hours_worked) : '-'}
                    </p>
                  </div>
                ) : (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Active
                  </span>
                )}
              </div>

              {entry.tasks_assigned && entry.tasks_assigned.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className={`w-4 h-4 ${entry.tasks_complete ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={entry.tasks_complete ? 'text-green-700' : 'text-gray-600'}>
                    {entry.tasks_complete ? 'All tasks completed' : `${entry.tasks_assigned.length} tasks assigned`}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
