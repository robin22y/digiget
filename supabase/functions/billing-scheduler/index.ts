// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

async function getSupabase() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  return createClient(url, serviceRoleKey);
}

serve(async () => {
  try {
    const supabase = await getSupabase();
    const now = new Date();

    // Fetch shops in grace
    const { data: shops } = await supabase
      .from('shops')
      .select('id, owner_email, plan_type, original_plan_type, payment_status, grace_until, last_reminder_at')
      .eq('payment_status', 'grace');

    const sent: any[] = [];

    for (const s of shops || []) {
      if (!s.grace_until) continue;
      const graceUntil = new Date(s.grace_until);
      const msRemaining = graceUntil.getTime() - now.getTime();

      if (msRemaining <= 0) {
        // downgrade
        await supabase
          .from('shops')
          .update({ plan_type: 'basic', payment_status: 'past_due' })
          .eq('id', s.id);
        console.log('EMAIL: downgraded ->', s.owner_email);
        sent.push({ id: s.id, action: 'downgraded' });
        continue;
      }

      // reminders at 24h and 1h remaining
      const hrsRemaining = msRemaining / (1000 * 60 * 60);
      const lastRem = s.last_reminder_at ? new Date(s.last_reminder_at).getTime() : 0;
      const should24 = hrsRemaining <= 24 && lastRem < (now.getTime() - 6 * 60 * 60 * 1000);
      const should1 = hrsRemaining <= 1 && lastRem < (now.getTime() - 15 * 60 * 1000);
      if (should1 || should24) {
        await supabase
          .from('shops')
          .update({ last_reminder_at: now.toISOString() })
          .eq('id', s.id);
        console.log('EMAIL: reminder ->', s.owner_email, 'hrsRemaining', hrsRemaining.toFixed(2));
        sent.push({ id: s.id, action: 'reminder', hrs: hrsRemaining });
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: (shops || []).length, sent }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('billing-scheduler error', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
