import { supabase } from './supabase';

interface DateRange {
  start: string;
  end: string;
}

/**
 * Get frequently visited customers
 * Returns customers sorted by visit count in given period
 */
export async function getFrequentCustomers(
  shopId: string,
  dateRange: DateRange,
  limit: number = 10
) {
  // Try customer_checkins first, fallback to customer_visits
  let data: any[] = [];

  // Try customer_checkins table
  const checkinsResult = await supabase
    .from('customer_checkins')
    .select(`
      customer_id,
      checkin_time,
      customers (
        id,
        phone,
        name,
        current_points,
        total_visits,
        last_visit_at
      )
    `)
    .eq('shop_id', shopId)
    .gte('checkin_time', dateRange.start)
    .lte('checkin_time', dateRange.end)
    .order('checkin_time', { ascending: false });

  // If table doesn't exist (code 42P01), try customer_visits
  if (checkinsResult.error && checkinsResult.error.code === '42P01') {
    const visitsResult = await supabase
      .from('customer_visits')
      .select(`
        customer_id,
        visit_date,
        customers (
          id,
          phone,
          name,
          current_points,
          total_visits,
          last_visit_at
        )
      `)
      .eq('shop_id', shopId)
      .gte('visit_date', dateRange.start)
      .lte('visit_date', dateRange.end)
      .order('visit_date', { ascending: false });

    if (visitsResult.error) throw visitsResult.error;
    data = visitsResult.data || [];
    // Normalize visit_date to checkin_time
    data = data.map(v => ({ ...v, checkin_time: v.visit_date }));
  } else {
    if (checkinsResult.error) throw checkinsResult.error;
    data = checkinsResult.data || [];
  }

  // Count visits per customer
  const customerVisitCounts = data.reduce((acc: any, visit: any) => {
    const customerId = visit.customer_id;
    if (!customerId || !visit.customers) return acc;

    if (!acc[customerId]) {
      acc[customerId] = {
        customer: visit.customers,
        visitCount: 0,
        lastVisit: visit.checkin_time
      };
    }
    acc[customerId].visitCount++;
    // Keep most recent visit date
    if (new Date(visit.checkin_time) > new Date(acc[customerId].lastVisit)) {
      acc[customerId].lastVisit = visit.checkin_time;
    }
    return acc;
  }, {});

  // Convert to array and sort by visit count
  const sorted = Object.values(customerVisitCounts)
    .sort((a: any, b: any) => b.visitCount - a.visitCount)
    .slice(0, limit);

  return sorted;
}

/**
 * Get missing customers (haven't visited in X days)
 * Returns customers who visited before but not recently
 */
export async function getMissingCustomers(
  shopId: string,
  daysSinceLastVisit: number = 30,
  limit: number = 50
) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastVisit);
  const cutoffISO = cutoffDate.toISOString();

  // Get all customers for this shop
  const { data: allCustomers, error: customerError } = await supabase
    .from('customers')
    .select(`
      id,
      phone,
      name,
      current_points,
      last_visit_at,
      created_at
    `)
    .eq('shop_id', shopId)
    .eq('active', true);

  if (customerError) throw customerError;

  // Filter for customers who haven't visited in X days
  const missing = allCustomers
    .filter(customer => {
      if (!customer.last_visit_at) {
        // Never visited - check if created more than X days ago
        const created = new Date(customer.created_at);
        const daysSinceCreated = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceCreated >= daysSinceLastVisit;
      }
      const lastVisit = new Date(customer.last_visit_at);
      const daysSince = (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince >= daysSinceLastVisit;
    })
    .map(customer => {
      const lastVisit = customer.last_visit_at 
        ? new Date(customer.last_visit_at)
        : new Date(customer.created_at);
      const daysSince = Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...customer,
        lastVisit: customer.last_visit_at || customer.created_at,
        daysSinceLastVisit: daysSince
      };
    })
    .sort((a, b) => (b.daysSinceLastVisit || 0) - (a.daysSinceLastVisit || 0))
    .slice(0, limit);

  return missing;
}

/**
 * Get staff performance metrics
 * Returns number of customers handled by each staff member
 */
export async function getStaffPerformance(
  shopId: string,
  dateRange: DateRange
) {
  // Try customer_checkins first, fallback to customer_visits
  let data: any[] = [];

  const checkinsResult = await supabase
    .from('customer_checkins')
    .select(`
      checked_in_by_employee_id,
      checkin_time,
      employees:checked_in_by_employee_id (
        id,
        first_name,
        last_name
      )
    `)
    .eq('shop_id', shopId)
    .gte('checkin_time', dateRange.start)
    .lte('checkin_time', dateRange.end)
    .not('checked_in_by_employee_id', 'is', null);

  // If table doesn't exist (code 42P01), try customer_visits
  if (checkinsResult.error && checkinsResult.error.code === '42P01') {
    const visitsResult = await supabase
      .from('customer_visits')
      .select(`
        staff_id,
        visit_date,
        employees:staff_id (
          id,
          first_name,
          last_name
        )
      `)
      .eq('shop_id', shopId)
      .gte('visit_date', dateRange.start)
      .lte('visit_date', dateRange.end)
      .not('staff_id', 'is', null);

    if (visitsResult.error) throw visitsResult.error;
    data = (visitsResult.data || []).map(v => ({
      checked_in_by_employee_id: v.staff_id,
      employees: v.employees
    }));
  } else {
    if (checkinsResult.error) throw checkinsResult.error;
    data = checkinsResult.data || [];
  }

  // Count customers per staff member
  const staffCounts = data.reduce((acc: any, checkin: any) => {
    const staffId = checkin.checked_in_by_employee_id;
    if (!staffId || !checkin.employees) return acc;

    if (!acc[staffId]) {
      acc[staffId] = {
        staff: checkin.employees,
        customerCount: 0
      };
    }
    acc[staffId].customerCount++;
    return acc;
  }, {});

  // Convert to array and sort by customer count
  const sorted = Object.values(staffCounts)
    .sort((a: any, b: any) => b.customerCount - a.customerCount);

  return sorted;
}

/**
 * Get overall customer stats for a period
 */
export async function getCustomerStats(
  shopId: string,
  dateRange: DateRange
) {
  // Try customer_checkins first, fallback to customer_visits
  let checkins: any[] = [];

  const checkinsResult = await supabase
    .from('customer_checkins')
    .select('id, customer_id')
    .eq('shop_id', shopId)
    .gte('checkin_time', dateRange.start)
    .lte('checkin_time', dateRange.end);

  // If table doesn't exist (code 42P01), try customer_visits
  if (checkinsResult.error && checkinsResult.error.code === '42P01') {
    const visitsResult = await supabase
      .from('customer_visits')
      .select('id, customer_id')
      .eq('shop_id', shopId)
      .gte('visit_date', dateRange.start)
      .lte('visit_date', dateRange.end);
    
    if (visitsResult.error) throw visitsResult.error;
    checkins = visitsResult.data || [];
  } else {
    if (checkinsResult.error) throw checkinsResult.error;
    checkins = checkinsResult.data || [];
  }

  // Unique customers in period
  const uniqueCustomerIds = new Set(checkins.map(c => c.customer_id).filter(Boolean));
  const uniqueCount = uniqueCustomerIds.size;

  // New customers created in period
  const { data: newCustomers, error: newError } = await supabase
    .from('customers')
    .select('id')
    .eq('shop_id', shopId)
    .gte('created_at', dateRange.start)
    .lte('created_at', dateRange.end);

  if (newError) throw newError;

  // Returning customers (visited during period but created before period)
  const { data: allCustomersInPeriod } = await supabase
    .from('customers')
    .select('id, created_at')
    .eq('shop_id', shopId)
    .in('id', Array.from(uniqueCustomerIds));

  const returningCount = (allCustomersInPeriod || []).filter(
    c => new Date(c.created_at) < new Date(dateRange.start)
  ).length;

  return {
    totalVisits: checkins?.length || 0,
    uniqueCustomers: uniqueCount,
    newCustomers: newCustomers?.length || 0,
    returningCustomers: returningCount,
    averageVisitsPerCustomer: uniqueCount > 0 
      ? ((checkins?.length || 0) / uniqueCount).toFixed(1) 
      : '0'
  };
}

/**
 * Get customer visit trend (daily breakdown)
 */
export async function getVisitTrend(
  shopId: string,
  dateRange: DateRange
) {
  // Try customer_checkins first, fallback to customer_visits
  let data: any[] = [];

  const checkinsResult = await supabase
    .from('customer_checkins')
    .select('checkin_time')
    .eq('shop_id', shopId)
    .gte('checkin_time', dateRange.start)
    .lte('checkin_time', dateRange.end)
    .order('checkin_time', { ascending: true });

  // If table doesn't exist (code 42P01), try customer_visits
  if (checkinsResult.error && checkinsResult.error.code === '42P01') {
    const visitsResult = await supabase
      .from('customer_visits')
      .select('visit_date')
      .eq('shop_id', shopId)
      .gte('visit_date', dateRange.start)
      .lte('visit_date', dateRange.end)
      .order('visit_date', { ascending: true });
    
    if (visitsResult.error) throw visitsResult.error;
    data = (visitsResult.data || []).map(v => ({ checkin_time: v.visit_date }));
  } else {
    if (checkinsResult.error) throw checkinsResult.error;
    data = checkinsResult.data || [];
  }

  // Group by date
  const dailyCounts = data.reduce((acc: any, checkin) => {
    const date = checkin.checkin_time.split('T')[0]; // Get date part only
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  // Convert to array format for charts
  return Object.entries(dailyCounts).map(([date, count]) => ({
    date,
    visits: count
  }));
}

