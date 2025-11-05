import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // NEVER expose this to frontend
);

export const handler: Handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { shopId, pin, device } = body;

    if (!shopId || !pin) {
      return { statusCode: 400, body: "Missing fields" };
    }

    // Get PIN hash from DB
    const { data, error } = await supabase
      .from("shops")
      .select("id, owner_pin_hash")
      .eq("id", shopId)
      .single();

    if (error || !data) {
      return { statusCode: 404, body: "Shop not found" };
    }

    // TEMP DEV ONLY — remove later
    const ok = pin === process.env.TEMP_DEV_ONLY_PLAIN_PIN;

    if (!ok) {
      return { statusCode: 401, body: "Invalid PIN" };
    }

    // Return HttpOnly cookie
    return {
      statusCode: 200,
      headers: {
        "Set-Cookie": `owner_unlocked_${shopId}=1; HttpOnly; SameSite=Strict; Secure; Path=/; Max-Age=3600`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    return { statusCode: 500, body: "Server error" };
  }
};
