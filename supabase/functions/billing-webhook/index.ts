// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

async function getSupabase() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  return createClient(url, serviceRoleKey);
}

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const supabase = await getSupabase();
    const payload = await req.json();
    const event = payload?.event as string | undefined; // e.g., 'payment_failed' | 'payment_succeeded'
    const shopId = payload?.shop_id as string | undefined; // assumed mapping from your billing system
    if (!event || !shopId) return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });

    if (event === 'payment_failed') {
      const now = new Date();
      const graceUntil = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString();
      // remember original plan if pro
      const { data: shop } = await supabase.from('shops').select('plan_type, owner_email').eq('id', shopId).single();
      await supabase
        .from('shops')
        .update({
          payment_status: 'grace',
          grace_until: graceUntil,
          last_payment_failed_at: now.toISOString(),
          original_plan_type: shop?.plan_type === 'pro' ? 'pro' : (shop?.original_plan_type || null),
        })
        .eq('id', shopId);
      // TODO: send email: failure + grace started
      console.log('EMAIL: grace started ->', shop?.owner_email);
      return new Response(JSON.stringify({ ok: true }));
    }

    if (event === 'payment_succeeded') {
      const { data: shop } = await supabase.from('shops').select('original_plan_type, owner_email').eq('id', shopId).single();
      await supabase
        .from('shops')
        .update({
          payment_status: 'ok',
          grace_until: null,
          last_reminder_at: null,
          plan_type: shop?.original_plan_type === 'pro' ? 'pro' : undefined,
        })
        .eq('id', shopId);
      // TODO: send email: reinstated
      console.log('EMAIL: reinstated ->', shop?.owner_email);
      return new Response(JSON.stringify({ ok: true }));
    }

    return new Response(JSON.stringify({ ignored: true }));
  } catch (e: any) {
    console.error('billing-webhook error', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
