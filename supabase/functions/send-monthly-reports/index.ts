// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// NOTE: Replace placeholders with your actual email sending implementation
// This function ensures each owner receives ONLY their own shop's report

interface RequestBody {
  plan?: 'basic' | 'pro' | 'all';
  shopIds?: string[];
  startDate?: string; // ISO date (YYYY-MM-DD)
  endDate?: string;   // ISO date (YYYY-MM-DD)
}

async function getSupabaseClient(req: Request) {
  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabase = createClient(url, serviceRoleKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
  });
  return supabase;
}

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const supabase = await getSupabaseClient(req);
    const body = (await req.json().catch(() => ({}))) as RequestBody;

    const startDate = body.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = body.endDate || new Date().toISOString().split('T')[0];

    // Build target shops list
    let shopsQuery = supabase
      .from('shops')
      .select('id, shop_name, owner_email, plan_type, subscription_status')
      .eq('subscription_status', 'active');

    if (body.plan && body.plan !== 'all') {
      shopsQuery = shopsQuery.eq('plan_type', body.plan);
    }

    if (body.shopIds && body.shopIds.length > 0) {
      shopsQuery = shopsQuery.in('id', body.shopIds);
    }

    const { data: shops, error: shopsError } = await shopsQuery;
    if (shopsError) throw shopsError;

    const results: any[] = [];

    for (const shop of shops || []) {
      if (!shop.owner_email) continue; // skip if no recipient

      // Compute per-shop metrics in range
      const { count: customers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shop.id);

      const { count: pointsIssued } = await supabase
        .from('loyalty_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shop.id)
        .eq('transaction_type', 'point_added')
        .gte('created_at', startDate)
        .lte('created_at', `${endDate}T23:59:59`);

      const { count: rewardsRedeemed } = await supabase
        .from('loyalty_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shop.id)
        .eq('transaction_type', 'reward_redeemed')
        .gte('created_at', startDate)
        .lte('created_at', `${endDate}T23:59:59`);

      const { count: staffCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shop.id);

      // Placeholder email send - replace with actual SMTP/provider call
      const subject = `Monthly Report · ${shop.shop_name}`;
      const html = `
        <h2>Monthly Report for ${shop.shop_name}</h2>
        <p>Period: ${startDate} to ${endDate}</p>
        <ul>
          <li>Total Customers: <b>${customers || 0}</b></li>
          <li>Points Issued: <b>${pointsIssued || 0}</b></li>
          <li>Rewards Redeemed: <b>${rewardsRedeemed || 0}</b></li>
          <li>Total Staff: <b>${staffCount || 0}</b></li>
          <li>Plan: <b>${shop.plan_type?.toUpperCase() || 'N/A'}</b></li>
        </ul>
      `;

      // TODO: Replace this with your email automation function/provider
      console.log('EMAIL ->', {
        to: shop.owner_email,
        subject,
        html,
      });

      results.push({ shop_id: shop.id, to: shop.owner_email, ok: true });
    }

    return new Response(JSON.stringify({ ok: true, sent: results.length, results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('send-monthly-reports error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), { status: 500 });
  }
});
