import { createHash, randomBytes } from 'node:crypto';

const recent = new Map();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function json(res, status, payload) { res.status(status); res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.json(payload); }
function parseBody(req) { if (req.body && typeof req.body === 'object') return req.body; try { return JSON.parse(req.body || '{}'); } catch { return {}; } }
function tokenHash(token) { return createHash('sha256').update(token).digest('hex'); }
function limited(req) {
  const ip=String(req.headers['x-forwarded-for']||'unknown').split(',')[0].trim();
  const now=Date.now(); const recentHits=(recent.get(ip)||[]).filter(t=>now-t<60_000);
  recentHits.push(now); recent.set(ip,recentHits);
  if (recent.size > 2000) for (const [key, hits] of recent) if (!hits.some(t => now-t<60_000)) recent.delete(key);
  return recentHits.length>8;
}

export default async function handler(req,res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') return json(res,405,{error:'Method not allowed.'});
  if (limited(req)) return json(res,429,{error:'Please wait a minute before trying again.'});
  const origin=req.headers.origin;
  const allowed=(process.env.SITE_URL||`https://${req.headers.host||''}`).replace(/\/$/,'');
  if (!origin || origin !== allowed) return json(res,403,{error:'This request did not come from the SARAS website.'});
  const length=Number(req.headers['content-length']||0);
  if (length > 4096) return json(res,413,{error:'This request is too large.'});
  const url=process.env.SUPABASE_URL; const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return json(res,503,{error:'Email updates are not configured yet.'});
  const body=parseBody(req);
  const headers={apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=minimal'};
  try {
    if (req.method === 'POST') {
      if (body.website) return json(res,200,{ok:true,unsubscribeToken:randomBytes(32).toString('base64url')});
      const email=String(body.email||'').trim().toLowerCase();
      if (!emailPattern.test(email)||email.length>320) return json(res,400,{error:'Enter a valid email address.'});
      if (body.consent !== true) return json(res,400,{error:'Please agree to receive occasional SARAS updates.'});
      const token=randomBytes(32).toString('base64url');
      const response=await fetch(`${url.replace(/\/$/,'')}/rest/v1/marketing_subscribers?on_conflict=email`,{method:'POST',headers:{...headers,Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({email,consented_at:new Date().toISOString(),consent_version:'2026-10-20-v1',status:'active',subscription_token_hash:tokenHash(token),updated_at:new Date().toISOString()})});
      if(!response.ok){await response.text();return json(res,502,{error:'The email update service could not save this address.'})}
      return json(res,200,{ok:true,unsubscribeToken:token});
    }
    const token=String(body.unsubscribeToken||'');
    if(token.length<32||token.length>128)return json(res,400,{error:'This unsubscribe link is invalid.'});
    const hash=tokenHash(token);
    const response=await fetch(`${url.replace(/\/$/,'')}/rest/v1/marketing_subscribers?subscription_token_hash=eq.${encodeURIComponent(hash)}&status=eq.active`,{method:'PATCH',headers:{...headers,Prefer:'return=representation'},body:JSON.stringify({status:'unsubscribed',updated_at:new Date().toISOString()})});
    if(!response.ok){await response.text();return json(res,502,{error:'The update service could not process the unsubscribe request.'})}
    const changed=await response.json();
    return json(res,200,{ok:true,changed:Array.isArray(changed)&&changed.length>0});
  } catch { return json(res,503,{error:'The email update service is temporarily unavailable.'}); }
}
