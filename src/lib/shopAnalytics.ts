import { supabase } from './supabase';

interface DateRange {
  start: string;
  end: string;
}

/**
 * Get comprehensive shop analytics for owner dashboard
 */
export async function getShopAnalytics(shopId: string, dateRange: DateRange) {
  // Get all customer visits in period
  // Try customer_visits first, fallback to customer_checkins if needed
  let visits: any[] = [];
  
  const visitsResult = await supabase
    .from('customer_visits')
    .select(`
      *,
      customers(*)
    `)
    .eq('shop_id', shopId)
    .gte('visit_date', dateRange.start)
    .lte('visit_date', dateRange.end);

  if (visitsResult.error && visitsResult.error.code === '42P01') {
    // Try customer_checkins if customer_visits doesn't exist
    const checkinsResult = await supabase
      .from('customer_checkins')
      .select(`
        *,
        customers(*)
      `)
      .eq('shop_id', shopId)
      .gte('checkin_time', dateRange.start)
      .lte('checkin_time', dateRange.end);
    
    if (!checkinsResult.error) {
      visits = (checkinsResult.data || []).map(c => ({
        ...c,
        visit_date: c.checkin_time,
        staff_id: c.checked_in_by_employee_id
      }));
    }
  } else {
    visits = visitsResult.data || [];
  }

  // Get staff data for visits
  const staffIds = [...new Set(visits.map(v => v.staff_id || v.checked_in_by_employee_id).filter(Boolean))];
  const staffData: any = {};
  
  if (staffIds.length > 0) {
    const { data: employees } = await supabase
      .from('employees')
      .select('*')
      .in('id', staffIds);
    
    employees?.forEach(emp => {
      staffData[emp.id] = emp;
    });
  }
  
  // Attach staff data to visits
  visits = visits.map(v => ({
    ...v,
    employees: staffData[v.staff_id || v.checked_in_by_employee_id] || {}
  }));

  // Get all clock entries in period (for hourly wages calculation)
  const { data: clockEvents } = await supabase
    .from('clock_entries')
    .select('*, employees(*)')
    .eq('shop_id', shopId)
    .gte('clock_in_time', dateRange.start)
    .lte('clock_in_time', dateRange.end)
    .not('clock_out_time', 'is', null);

  // Get all customers (to determine new vs returning)
  const { data: allCustomers } = await supabase
    .from('customers')
    .select('id, created_at')
    .eq('shop_id', shopId);

  // Calculate metrics
  const totalRevenue = visits?.reduce((sum, v) => sum + parseFloat(v.bill_amount || 0), 0) || 0;
  const totalCommission = visits?.reduce((sum, v) => sum + parseFloat(v.commission_earned || 0), 0) || 0;
  
  // Calculate payroll
  const totalHourlyWages = clockEvents?.reduce((sum, e) => {
    const employee = e.employees as any;
    if (!employee) return sum;
    
    const rate = employee.payment_type === 'commission' 
      ? 0 
      : (employee.hourly_rate || employee.base_hourly_rate || 0);
    const hours = e.hours_worked || 0;
    return sum + (hours * rate);
  }, 0) || 0;

  const totalPayroll = totalHourlyWages + totalCommission;
  const netProfit = totalRevenue - totalPayroll;

  // New vs returning customers
  const customersInPeriod = new Set(visits?.map(v => v.customer_id).filter(Boolean) || []);
  const newCustomersInPeriod = allCustomers?.filter(c => {
    const created = new Date(c.created_at);
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    return created >= start && created <= end && customersInPeriod.has(c.id);
  }).length || 0;

  const returningCustomers = customersInPeriod.size - newCustomersInPeriod;

  // Staff contributions
  const staffContributions = visits?.reduce((acc: any, visit: any) => {
    const staffId = visit.staff_id || visit.checked_in_by_employee_id;
    if (!staffId) return acc;

    if (!acc[staffId]) {
      acc[staffId] = {
        staff: visit.employees || {},
        customersServed: 0,
        revenue: 0,
        commission: 0
      };
    }

    acc[staffId].customersServed++;
    acc[staffId].revenue += parseFloat(visit.bill_amount || 0);
    acc[staffId].commission += parseFloat(visit.commission_earned || 0);

    return acc;
  }, {});

  const staffPerformance = Object.values(staffContributions || {})
    .sort((a: any, b: any) => b.revenue - a.revenue);

  // Daily breakdown for chart
  const dailyData = visits?.reduce((acc: any, visit: any) => {
    const date = visit.visit_date ? (visit.visit_date.split('T')[0] || visit.visit_date) : new Date().toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        date,
        revenue: 0,
        customers: 0,
        commission: 0
      };
    }
    acc[date].revenue += parseFloat(visit.bill_amount || 0);
    acc[date].customers++;
    acc[date].commission += parseFloat(visit.commission_earned || 0);
    return acc;
  }, {});

  const revenueChart = Object.values(dailyData || {})
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    overview: {
      totalRevenue,
      totalPayroll,
      netProfit,
      profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0',
      totalCustomers: customersInPeriod.size,
      newCustomers: newCustomersInPeriod,
      returningCustomers: Math.max(0, returningCustomers),
      totalVisits: visits?.length || 0,
      averageBill: totalRevenue / (visits?.length || 1)
    },
    staffPerformance,
    revenueChart,
    payrollBreakdown: {
      hourlyWages: totalHourlyWages,
      commission: totalCommission,
      total: totalPayroll
    }
  };
}

/**
 * Get staff-specific analytics
 */
export async function getStaffAnalytics(shopId: string, staffId: string, dateRange: DateRange) {
  const { data: contributions } = await supabase
    .from('employee_contributions')
    .select('*')
    .eq('shop_id', shopId)
    .eq('employee_id', staffId)
    .gte('contribution_date', dateRange.start)
    .lte('contribution_date', dateRange.end)
    .order('contribution_date', { ascending: true });

  const { data: clockEvents } = await supabase
    .from('clock_entries')
    .select('*')
    .eq('employee_id', staffId)
    .eq('shop_id', shopId)
    .gte('clock_in_time', dateRange.start)
    .not('clock_out_time', 'is', null);

  const totalRevenue = contributions?.reduce((sum, c) => sum + parseFloat(c.bill_amount || 0), 0) || 0;
  const totalCommission = contributions?.reduce((sum, c) => sum + parseFloat(c.commission_earned || 0), 0) || 0;
  const totalHours = clockEvents?.reduce((sum, e) => sum + (e.hours_worked || 0), 0) || 0;

  return {
    totalRevenue,
    totalCommission,
    totalHours,
    customersServed: contributions?.length || 0,
    contributions
  };
}

