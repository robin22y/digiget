import { supabase } from './supabase';

interface DateRange {
  start: string;
  end: string;
}

/**
 * Get revenue for a specific day
 */
export async function getDailyRevenue(shopId: string, date: string) {
  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;

  // Fetch visits - handle both checked_in_by_employee_id and staff_id column names
  const { data: visits } = await supabase
    .from('customer_visits')
    .select('*')
    .eq('shop_id', shopId)
    .gte('visit_date', startOfDay)
    .lte('visit_date', endOfDay)
    .not('bill_amount', 'is', null);

  // Fetch employee details separately
  const employeeIds = visits?.map(v => v.checked_in_by_employee_id).filter(Boolean) || [];
  const { data: employees } = employeeIds.length > 0 ? await supabase
    .from('employees')
    .select('id, first_name, last_name, payment_type, commission_percentage')
    .in('id', employeeIds as string[]) : { data: [] };
  
  const employeeMap = new Map((employees || []).map((e: any) => [e.id, e]));
  
  // Attach employee data to visits
  const visitsWithEmployees = visits?.map(visit => ({
    ...visit,
    employee: visit.checked_in_by_employee_id ? employeeMap.get(visit.checked_in_by_employee_id) : null
  })) || [];

  const totalRevenue = visitsWithEmployees?.reduce((sum, v) => sum + parseFloat(v.bill_amount?.toString() || '0'), 0) || 0;
  
  // Get commission from employee_contributions table for accurate payroll tracking
  // This ensures consistency with payroll reports
  // Use consistent date format (YYYY-MM-DD) for DATE column comparison
  const { data: contributions } = await supabase
    .from('employee_contributions')
    .select('commission_earned')
    .eq('shop_id', shopId)
    .eq('contribution_date', date); // Use eq for exact date match instead of gte/lte
  
  const totalCommission = contributions?.reduce((sum, c) => sum + parseFloat(c.commission_earned?.toString() || '0'), 0) || 0;
  const totalCustomers = visitsWithEmployees?.length || 0;

  // Group by staff - aggregate revenue from visits, commission from contributions
  const staffBreakdown = visitsWithEmployees?.reduce((acc: any, visit) => {
    const staffId = visit.checked_in_by_employee_id;
    if (!staffId) return acc;

    if (!acc[staffId]) {
      acc[staffId] = {
        staff: visit.employee,
        revenue: 0,
        commission: 0,
        customers: 0
      };
    }

    acc[staffId].revenue += parseFloat(visit.bill_amount?.toString() || '0');
    acc[staffId].customers++;

    return acc;
  }, {});

  // Add commission from employee_contributions for each staff member
  // Use consistent date format for DATE column comparison
  const { data: contributionDetails } = await supabase
    .from('employee_contributions')
    .select('employee_id, commission_earned')
    .eq('shop_id', shopId)
    .eq('contribution_date', date); // Use eq for exact date match

  contributionDetails?.forEach((contrib: any) => {
    const staffId = contrib.employee_id;
    if (staffId && staffBreakdown[staffId]) {
      staffBreakdown[staffId].commission += parseFloat(contrib.commission_earned?.toString() || '0');
    }
  });

  // Group by hour for chart
  const hourlyBreakdown = visitsWithEmployees?.reduce((acc: any, visit) => {
    const visitDate = new Date(visit.visit_date);
    const hour = visitDate.getHours();
    if (!acc[hour]) {
      acc[hour] = {
        hour,
        revenue: 0,
        customers: 0
      };
    }
    acc[hour].revenue += parseFloat(visit.bill_amount?.toString() || '0');
    acc[hour].customers++;
    return acc;
  }, {});

  return {
    date,
    totalRevenue,
    totalCommission,
    netRevenue: totalRevenue - totalCommission,
    totalCustomers,
    averageBill: totalCustomers > 0 ? totalRevenue / totalCustomers : 0,
    staffBreakdown: Object.values(staffBreakdown || {}),
    hourlyBreakdown: Object.values(hourlyBreakdown || {}).sort((a: any, b: any) => a.hour - b.hour)
  };
}

/**
 * Get revenue for current week (last 7 days)
 */
export async function getWeeklyRevenue(shopId: string) {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: visits } = await supabase
    .from('customer_visits')
    .select('*')
    .eq('shop_id', shopId)
    .gte('visit_date', weekAgo.toISOString())
    .lte('visit_date', today.toISOString())
    .not('bill_amount', 'is', null);

  // Fetch employee details separately
  const employeeIds = visits?.map(v => v.checked_in_by_employee_id).filter(Boolean) || [];
  const { data: employees } = employeeIds.length > 0 ? await supabase
    .from('employees')
    .select('id, first_name, last_name')
    .in('id', employeeIds as string[]) : { data: [] };
  
  const employeeMap = new Map((employees || []).map((e: any) => [e.id, e]));
  const visitsWithEmployees = visits?.map(visit => ({
    ...visit,
    employee: visit.checked_in_by_employee_id ? employeeMap.get(visit.checked_in_by_employee_id) : null
  })) || [];

  const totalRevenue = visitsWithEmployees?.reduce((sum, v) => sum + parseFloat(v.bill_amount?.toString() || '0'), 0) || 0;
  
  // Get commission from employee_contributions table for accurate payroll tracking
  // Use consistent date format for DATE column comparison
  const weekAgoDateStr = weekAgo.toISOString().split('T')[0];
  const todayDateStr = today.toISOString().split('T')[0];
  
  const { data: contributions } = await supabase
    .from('employee_contributions')
    .select('commission_earned')
    .eq('shop_id', shopId)
    .gte('contribution_date', weekAgoDateStr)
    .lte('contribution_date', todayDateStr);
  
  const totalCommission = contributions?.reduce((sum, c) => sum + parseFloat(c.commission_earned?.toString() || '0'), 0) || 0;

  // Group by day - revenue from visits, commission from contributions
  const dailyBreakdown = visitsWithEmployees?.reduce((acc: any, visit) => {
    const date = visit.visit_date.split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        date,
        revenue: 0,
        commission: 0,
        customers: 0
      };
    }
    acc[date].revenue += parseFloat(visit.bill_amount?.toString() || '0');
    acc[date].customers++;
    return acc;
  }, {});

  // Add commission from employee_contributions for each day
  const { data: dailyContributions } = await supabase
    .from('employee_contributions')
    .select('contribution_date, commission_earned')
    .eq('shop_id', shopId)
    .gte('contribution_date', weekAgoDateStr)
    .lte('contribution_date', todayDateStr);

  dailyContributions?.forEach((contrib: any) => {
    const date = contrib.contribution_date;
    if (date && dailyBreakdown[date]) {
      dailyBreakdown[date].commission += parseFloat(contrib.commission_earned?.toString() || '0');
    }
  });

  // Group by staff - revenue from visits, commission from contributions
  const staffBreakdown = visitsWithEmployees?.reduce((acc: any, visit) => {
    const staffId = visit.checked_in_by_employee_id;
    if (!staffId) return acc;

    if (!acc[staffId]) {
      acc[staffId] = {
        staff: visit.employee,
        revenue: 0,
        customers: 0,
        commission: 0
      };
    }

    acc[staffId].revenue += parseFloat(visit.bill_amount?.toString() || '0');
    acc[staffId].customers++;

    return acc;
  }, {});

  // Add commission from employee_contributions for each staff member
  // Use consistent date format for DATE column comparison
  const { data: staffContributions } = await supabase
    .from('employee_contributions')
    .select('employee_id, commission_earned')
    .eq('shop_id', shopId)
    .gte('contribution_date', weekAgoDateStr)
    .lte('contribution_date', todayDateStr);

  staffContributions?.forEach((contrib: any) => {
    const staffId = contrib.employee_id;
    if (staffId && staffBreakdown[staffId]) {
      staffBreakdown[staffId].commission += parseFloat(contrib.commission_earned?.toString() || '0');
    }
  });

  return {
    totalRevenue,
    totalCommission,
    netRevenue: totalRevenue - totalCommission,
    totalCustomers: visitsWithEmployees?.length || 0,
    averageBill: visitsWithEmployees?.length > 0 ? totalRevenue / visitsWithEmployees.length : 0,
    dailyBreakdown: Object.values(dailyBreakdown || {}).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ),
    staffBreakdown: Object.values(staffBreakdown || {})
      .sort((a: any, b: any) => b.revenue - a.revenue)
  };
}

/**
 * Get revenue for current month
 */
export async function getMonthlyRevenue(shopId: string, year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  endDate.setHours(23, 59, 59, 999);

  const { data: visits } = await supabase
    .from('customer_visits')
    .select('*')
    .eq('shop_id', shopId)
    .gte('visit_date', startDate.toISOString())
    .lte('visit_date', endDate.toISOString())
    .not('bill_amount', 'is', null);

  const totalRevenue = visits?.reduce((sum, v) => sum + parseFloat(v.bill_amount?.toString() || '0'), 0) || 0;
  
  // Get commission from employee_contributions table for accurate payroll tracking
  // Use consistent date format for DATE column comparison
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  const { data: contributions } = await supabase
    .from('employee_contributions')
    .select('commission_earned')
    .eq('shop_id', shopId)
    .gte('contribution_date', startDateStr)
    .lte('contribution_date', endDateStr);
  
  const totalCommission = contributions?.reduce((sum, c) => sum + parseFloat(c.commission_earned?.toString() || '0'), 0) || 0;

  // Group by week
  const weeklyBreakdown = visits?.reduce((acc: any, visit) => {
    const date = new Date(visit.visit_date);
    const weekNum = Math.ceil(date.getDate() / 7);
    
    if (!acc[weekNum]) {
      acc[weekNum] = {
        week: weekNum,
        revenue: 0,
        customers: 0
      };
    }
    
    acc[weekNum].revenue += parseFloat(visit.bill_amount?.toString() || '0');
    acc[weekNum].customers++;
    
    return acc;
  }, {});

  return {
    year,
    month,
    totalRevenue,
    totalCommission,
    netRevenue: totalRevenue - totalCommission,
    totalCustomers: visits?.length || 0,
    averageBill: visits?.length > 0 ? totalRevenue / visits.length : 0,
    weeklyBreakdown: Object.values(weeklyBreakdown || {})
  };
}

/**
 * Get top performing staff by revenue
 */
export async function getTopPerformers(shopId: string, dateRange: DateRange, limit: number = 5) {
  const { data: visits } = await supabase
    .from('customer_visits')
    .select('*')
    .eq('shop_id', shopId)
    .gte('visit_date', dateRange.start)
    .lte('visit_date', dateRange.end)
    .not('bill_amount', 'is', null);

  // Fetch employee details separately
  const employeeIds = visits?.map(v => v.checked_in_by_employee_id).filter(Boolean) || [];
  const { data: employees } = employeeIds.length > 0 ? await supabase
    .from('employees')
    .select('id, first_name, last_name')
    .in('id', employeeIds as string[]) : { data: [] };
  
  const employeeMap = new Map((employees || []).map((e: any) => [e.id, e]));
  const visitsWithEmployees = visits?.map(visit => ({
    ...visit,
    employee: visit.checked_in_by_employee_id ? employeeMap.get(visit.checked_in_by_employee_id) : null
  })) || [];

  // Group by staff - revenue from visits, commission from contributions
  const staffPerformance = visitsWithEmployees?.reduce((acc: any, visit) => {
    const staffId = visit.checked_in_by_employee_id;
    if (!staffId) return acc;

    if (!acc[staffId]) {
      acc[staffId] = {
        staff: visit.employee,
        revenue: 0,
        customers: 0,
        commission: 0
      };
    }

    acc[staffId].revenue += parseFloat(visit.bill_amount?.toString() || '0');
    acc[staffId].customers++;

    return acc;
  }, {});

  // Add commission from employee_contributions for each staff member
  // Use consistent date format for DATE column comparison
  const startDateStr = dateRange.start.split('T')[0];
  const endDateStr = dateRange.end.split('T')[0];
  
  const { data: staffContributions } = await supabase
    .from('employee_contributions')
    .select('employee_id, commission_earned')
    .eq('shop_id', shopId)
    .gte('contribution_date', startDateStr)
    .lte('contribution_date', endDateStr);

  staffContributions?.forEach((contrib: any) => {
    const staffId = contrib.employee_id;
    if (staffId && staffPerformance[staffId]) {
      staffPerformance[staffId].commission += parseFloat(contrib.commission_earned?.toString() || '0');
    }
  });

  return Object.values(staffPerformance || {})
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, limit);
}

/**
 * Get best performing days
 */
export async function getBestDays(shopId: string, dateRange: DateRange, limit: number = 5) {
  const { data: visits } = await supabase
    .from('customer_visits')
    .select('*')
    .eq('shop_id', shopId)
    .gte('visit_date', dateRange.start)
    .lte('visit_date', dateRange.end)
    .not('bill_amount', 'is', null);

  const dailyRevenue = visits?.reduce((acc: any, visit) => {
    const date = visit.visit_date.split('T')[0];
    const dayName = new Date(visit.visit_date).toLocaleDateString('en-GB', { weekday: 'long' });
    
    if (!acc[date]) {
      acc[date] = {
        date,
        dayName,
        revenue: 0,
        customers: 0
      };
    }
    
    acc[date].revenue += parseFloat(visit.bill_amount?.toString() || '0');
    acc[date].customers++;
    
    return acc;
  }, {});

  return Object.values(dailyRevenue || {})
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, limit);
}

