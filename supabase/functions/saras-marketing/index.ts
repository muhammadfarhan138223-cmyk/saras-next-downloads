const originAllowed = "https://sarasdownload.farhanbalouch.com";
const recent = new Map<string, number[]>();

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function limited(req: Request) {
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((time) => now - time < 60_000);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 2000) for (const [key, values] of recent) if (!values.some((time) => now - time < 60_000)) recent.delete(key);
  return hits.length > 8;
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function tokenHash(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST" && req.method !== "DELETE") return json(405, { error: "Method not allowed." });
  if (req.headers.get("origin") !== originAllowed) return json(403, { error: "This request did not come from the SARAS website." });
  if (limited(req)) return json(429, { error: "Please wait a minute before trying again." });
  const length = Number(req.headers.get("content-length") || 0);
  if (length > 4096) return json(413, { error: "This request is too large." });

  const url = Deno.env.get("SUPABASE_URL");
  const legacySecret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  const secret = legacySecret || secretKeys.default;
  if (!url || !secret) return json(503, { error: "The email update service is not available yet." });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(400, { error: "Invalid request." }); }
  const headers = { apikey: secret, authorization: `Bearer ${secret}`, "content-type": "application/json" };

  try {
    if (req.method === "POST") {
      if (body.website) return json(200, { ok: true, unsubscribeToken: randomToken() });
      const email = String(body.email || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) return json(400, { error: "Enter a valid email address." });
      if (body.consent !== true) return json(400, { error: "Please agree to receive occasional SARAS updates." });
      const token = randomToken();
      const now = new Date().toISOString();
      const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/marketing_subscribers?on_conflict=email`, {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ email, consented_at: now, consent_version: "2026-10-20-v1", status: "active", subscription_token_hash: await tokenHash(token), updated_at: now }),
      });
      if (!response.ok) return json(502, { error: "The email update service could not save this address." });
      return json(200, { ok: true, unsubscribeToken: token });
    }

    const token = String(body.unsubscribeToken || "");
    if (token.length < 32 || token.length > 128) return json(400, { error: "This unsubscribe request is invalid." });
    const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/marketing_subscribers?subscription_token_hash=eq.${encodeURIComponent(await tokenHash(token))}&status=eq.active`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({ status: "unsubscribed", updated_at: new Date().toISOString() }),
    });
    if (!response.ok) return json(502, { error: "The email update service could not process this request." });
    const changed = await response.json();
    return json(200, { ok: true, changed: Array.isArray(changed) && changed.length > 0 });
  } catch {
    return json(503, { error: "The email update service is temporarily unavailable." });
  }
});
