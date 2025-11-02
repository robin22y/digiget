import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Calendar, Download, ChevronDown, ChevronUp, MapPin, Lock } from 'lucide-react';
import { formatLocation, getGoogleMapsLink } from '../../utils/geolocation';
import { useShop } from '../../contexts/ShopContext';
import { useOwnerPinProtection } from '../../hooks/useOwnerPinProtection';

interface Employee {
  id: string;
  first_name: string;
  last_name: string | null;
  hourly_rate: number | null;
}

interface PayrollData {
  employee: Employee;
  totalHours: number;
  daysWorked: number;
  totalPay: number;
  dailyBreakdown: Array<{
    date: string;
    clockIn: string;
    clockOut: string;
    hours: number;
    clockInLat: number | null;
    clockInLng: number | null;
    clockOutLat: number | null;
    clockOutLng: number | null;
    clockInMethod: string;
    clockOutMethod: string | null;
  }>;
}

export default function PayrollPage() {
  const { shopId: paramShopId } = useParams();
  const { currentShop, hasAccess, loading: shopLoading } = useShop();
  const navigate = useNavigate();
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth'>('thisWeek');
  const [loading, setLoading] = useState(true);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  // Use currentShop.id from context (secure)
  const shopId = currentShop?.id || (paramShopId && hasAccess(paramShopId) ? paramShopId : null);

  // PIN protection
  const { isUnlocked, checking, showPinModal, PinProtectionModal } = useOwnerPinProtection({
    shopId,
    onCancel: () => navigate('/dashboard'),
  });

  // Validate access
  useEffect(() => {
    if (!shopLoading && paramShopId) {
      if (!hasAccess(paramShopId)) {
        navigate('/dashboard');
        return;
      }
    }
  }, [paramShopId, hasAccess, shopLoading, navigate]);

  useEffect(() => {
    if (shopId && isUnlocked) {
      loadPayrollData();
    }
  }, [shopId, period, isUnlocked]);

  const getDateRange = () => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'thisWeek':
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'lastWeek':
        start.setDate(now.getDate() - now.getDay() - 7);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - now.getDay() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  };

  const loadPayrollData = async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      const { start, end } = getDateRange();

      const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .eq('shop_id', shopId)
        .eq('active', true);

      if (!employees) return;

      const payrollPromises = employees.map(async (employee) => {
        const { data: clockEntries } = await supabase
          .from('clock_entries')
          .select('*')
          .eq('employee_id', employee.id)
          .gte('clock_in_time', start.toISOString())
          .lte('clock_in_time', end.toISOString())
          .not('clock_out_time', 'is', null)
          .order('clock_in_time', { ascending: true });

        const totalHours = clockEntries?.reduce((sum, entry) => sum + (entry.hours_worked || 0), 0) || 0;
        const daysWorked = new Set(clockEntries?.map(e => new Date(e.clock_in_time).toDateString())).size;
        const totalPay = totalHours * (employee.hourly_rate || 0);

        const dailyBreakdown = clockEntries?.map(entry => ({
          date: new Date(entry.clock_in_time).toLocaleDateString('en-GB'),
          clockIn: new Date(entry.clock_in_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          clockOut: entry.clock_out_time ? new Date(entry.clock_out_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-',
          hours: entry.hours_worked || 0,
          clockInLat: entry.clock_in_latitude,
          clockInLng: entry.clock_in_longitude,
          clockOutLat: entry.clock_out_latitude,
          clockOutLng: entry.clock_out_longitude,
          clockInMethod: entry.clock_in_method || 'unknown',
          clockOutMethod: entry.clock_out_method || null,
        })) || [];

        return {
          employee,
          totalHours,
          daysWorked,
          totalPay,
          dailyBreakdown
        };
      });

      const data = await Promise.all(payrollPromises);
      setPayrollData(data.filter(d => d.totalHours > 0).sort((a, b) => b.totalHours - a.totalHours));
    } catch (error) {
      console.error('Error loading payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    // Import the export utility
    import('../../lib/exportPayroll').then(({ exportPayrollToCSV }) => {
      // Transform payroll data to PayrollRow format
      const exportData: import('../../lib/exportPayroll').PayrollRow[] = [];

      payrollData.forEach(({ employee, dailyBreakdown }) => {
        dailyBreakdown.forEach(day => {
          exportData.push({
            employeeName: `${employee.first_name} ${employee.last_name || ''}`.trim(),
            date: day.date,
            clockIn: day.clockIn,
            clockOut: day.clockOut,
            hours: day.hours,
            hourlyRate: employee.hourly_rate || 0,
            pay: employee.hourly_rate ? day.hours * employee.hourly_rate : 0,
            notes: ''
          });
        });
      });

      // Export with Excel-compatible format
      const filename = `payroll-${period}-${new Date().toISOString().split('T')[0]}.csv`;
      exportPayrollToCSV(exportData, filename);
    });
  };

  const totalHours = payrollData.reduce((sum, d) => sum + d.totalHours, 0);
  const totalPay = payrollData.reduce((sum, d) => sum + d.totalPay, 0);

  // Helper functions for method display
  function getMethodIcon(method: string): string {
    switch(method) {
      case 'nfc': return '📱';
      case 'qr_code': return '📸';
      case 'shop_tablet': return '💻';
      case 'gps': return '📍';
      case 'manual_override': return '✋';
      default: return '❓';
    }
  }

  function getMethodColorClass(method: string): string {
    switch(method) {
      case 'nfc': return 'bg-green-100 text-green-800';
      case 'qr_code': return 'bg-blue-100 text-blue-800';
      case 'shop_tablet': return 'bg-gray-100 text-gray-800';
      case 'gps': return 'bg-orange-100 text-orange-800';
      case 'manual_override': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Show PIN modal if not unlocked
  if (checking || showPinModal) {
    return (
      <>
        <PinProtectionModal />
        {showPinModal && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">PIN required to access payroll report</p>
            </div>
          </div>
        )}
      </>
    );
  }

  if (!isUnlocked) {
    return (
      <>
        <PinProtectionModal />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">PIN required to access payroll report</p>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <PinProtectionModal />
      <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payroll Report</h1>
        <button
          onClick={exportToCSV}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
        >
          <Download className="w-5 h-5 mr-2" />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="thisWeek">This Week</option>
            <option value="lastWeek">Last Week</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Total Hours</p>
            <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Staff Members</p>
            <p className="text-2xl font-bold text-gray-900">{payrollData.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Payroll</p>
            <p className="text-2xl font-bold text-gray-900">£{totalPay.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {payrollData.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">No clock entries for this period</p>
          </div>
        ) : (
          payrollData.map(({ employee, totalHours, daysWorked, totalPay, dailyBreakdown }) => (
            <div key={employee.id} className="bg-white rounded-lg shadow">
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedEmployee(expandedEmployee === employee.id ? null : employee.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {employee.first_name} {employee.last_name || ''}
                    </h3>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Hours</p>
                        <p className="font-semibold text-gray-900">{totalHours.toFixed(1)}h</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Days Worked</p>
                        <p className="font-semibold text-gray-900">{daysWorked}</p>
                      </div>
                      {employee.hourly_rate && (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">Hourly Rate</p>
                            <p className="font-semibold text-gray-900">£{employee.hourly_rate.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Pay</p>
                            <p className="font-semibold text-green-600">£{totalPay.toFixed(2)}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    {expandedEmployee === employee.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                </div>
              </div>

              {expandedEmployee === employee.id && (
                <div className="px-6 pb-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mt-4 mb-3">Daily Breakdown</h4>
                  <div className="space-y-2">
                    {dailyBreakdown.map((day, index) => (
                      <div key={index} className="py-2 border-b border-gray-100 last:border-0">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">{day.date}</span>
                          </div>
                          <div className="flex-1 text-center">
                            <span className="text-sm text-gray-600">
                              {day.clockIn} - {day.clockOut}
                            </span>
                          </div>
                          <div className="flex-1 text-right">
                            <span className="text-sm font-medium text-gray-900">{day.hours.toFixed(2)}h</span>
                          </div>
                        </div>
                        {/* Method badges */}
                        <div className="flex gap-2 mt-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getMethodColorClass(day.clockInMethod)}`}>
                            {getMethodIcon(day.clockInMethod)} IN
                          </span>
                          {day.clockOutMethod && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getMethodColorClass(day.clockOutMethod)}`}>
                              {getMethodIcon(day.clockOutMethod)} OUT
                            </span>
                          )}
                        </div>
                        {(day.clockInLat || day.clockOutLat) && (
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            {day.clockInLat && day.clockInLng && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>In:</span>
                                <a
                                  href={getGoogleMapsLink(day.clockInLat, day.clockInLng) || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {formatLocation(day.clockInLat, day.clockInLng)}
                                </a>
                              </div>
                            )}
                            {day.clockOutLat && day.clockOutLng && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>Out:</span>
                                <a
                                  href={getGoogleMapsLink(day.clockOutLat, day.clockOutLng) || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {formatLocation(day.clockOutLat, day.clockOutLng)}
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      </div>
    </>
  );
}
