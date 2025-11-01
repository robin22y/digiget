/**
 * Automated email sending functions
 * For weekly reports, trial reminders, etc.
 */

import { supabase } from './supabase';
import { sendEmail } from './email';
import { payrollReportEmail } from '../templates/payrollReportEmail';
import { trialEndingEmail } from '../templates/trialEndingEmail';

interface Shop {
  id: string;
  name: string;
  owner_email: string;
  trial_ends_at?: string;
  subscription_status: string;
}

/**
 * Get all active shops
 */
async function getActiveShops(): Promise<Shop[]> {
  const { data, error } = await supabase
    .from('shops')
    .select('id, shop_name, owner_email, subscription_status')
    .eq('subscription_status', 'active')
    .eq('plan_type', 'pro'); // Only pro plans get weekly reports

  if (error) {
    console.error('Error fetching active shops:', error);
    return [];
  }

  return (data || []).map((shop) => ({
    id: shop.id,
    name: shop.shop_name,
    owner_email: shop.owner_email,
    subscription_status: shop.subscription_status,
  }));
}

/**
 * Get shops with trials ending in X days
 */
async function getTrialsEnding(days: number): Promise<Shop[]> {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + days);
  const targetDateStr = targetDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('shops')
    .select('id, shop_name, owner_email, trial_ends_at, subscription_status')
    .eq('subscription_status', 'trial')
    .gte('trial_ends_at', `${targetDateStr}T00:00:00`)
    .lt('trial_ends_at', `${targetDateStr}T23:59:59`);

  if (error) {
    console.error('Error fetching trials ending:', error);
    return [];
  }

  return (data || []).map((shop) => ({
    id: shop.id,
    name: shop.shop_name,
    owner_email: shop.owner_email,
    trial_ends_at: shop.trial_ends_at,
    subscription_status: shop.subscription_status,
  }));
}

/**
 * Generate payroll report for a shop
 */
async function generatePayrollReport(shopId: string): Promise<any> {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  
  const weekEnd = new Date();

  // Get shop info
  const { data: shop } = await supabase
    .from('shops')
    .select('shop_name')
    .eq('id', shopId)
    .single();

  // Get clock entries for the week
  const { data: clockEntries } = await supabase
    .from('clock_entries')
    .select('*, employees(first_name, last_name, hourly_rate)')
    .eq('shop_id', shopId)
    .gte('clock_in_time', weekStart.toISOString())
    .lt('clock_in_time', weekEnd.toISOString());

  // Calculate payroll
  const staffMap = new Map();
  let totalHours = 0;
  let totalPay = 0;

  clockEntries?.forEach((entry) => {
    if (!entry.clock_out_time) return; // Skip active entries

    const employee = entry.employees;
    const employeeName = `${employee?.first_name || ''} ${employee?.last_name || ''}`.trim();
    const hourlyRate = employee?.hourly_rate || 0;

    const clockIn = new Date(entry.clock_in_time);
    const clockOut = new Date(entry.clock_out_time);
    const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

    if (!staffMap.has(entry.employee_id)) {
      staffMap.set(entry.employee_id, {
        name: employeeName,
        hours: 0,
        pay: 0,
      });
    }

    const staff = staffMap.get(entry.employee_id);
    staff.hours += hours;
    staff.pay += hours * hourlyRate;
    totalHours += hours;
    totalPay += hours * hourlyRate;
  });

  return {
    shopName: shop?.shop_name || 'Shop',
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    totalHours,
    totalPay,
    staffCount: staffMap.size,
    staff: Array.from(staffMap.values()),
  };
}

/**
 * Send weekly payroll reports to all active shops
 */
export async function sendWeeklyReports() {
  const shops = await getActiveShops();
  const results = [];

  for (const shop of shops) {
    try {
      const report = await generatePayrollReport(shop.id);

      if (report.staffCount === 0) {
        console.log(`Skipping ${shop.name} - no staff worked this week`);
        continue;
      }

      const result = await sendEmail({
        to: shop.owner_email,
        subject: `Weekly Payroll Report - ${shop.name}`,
        html: payrollReportEmail(report),
      });

      results.push({ shop: shop.name, success: result.success, error: result.error });
    } catch (error: any) {
      console.error(`Error sending report to ${shop.name}:`, error);
      results.push({ shop: shop.name, success: false, error: error.message });
    }
  }

  return results;
}

/**
 * Send trial ending reminders
 */
export async function sendTrialReminders(daysLeft: number = 7) {
  const shops = await getTrialsEnding(daysLeft);
  const results = [];

  for (const shop of shops) {
    try {
      if (!shop.trial_ends_at) continue;

      const trialEndDate = new Date(shop.trial_ends_at);
      const result = await sendEmail({
        to: shop.owner_email,
        subject: `Your DigiGet trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
        html: trialEndingEmail(shop.name, trialEndDate, daysLeft),
      });

      results.push({ shop: shop.name, success: result.success, error: result.error });
    } catch (error: any) {
      console.error(`Error sending reminder to ${shop.name}:`, error);
      results.push({ shop: shop.name, success: false, error: error.message });
    }
  }

  return results;
}

