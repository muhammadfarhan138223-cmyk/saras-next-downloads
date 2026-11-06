const recent = new Map();
function json(res, status, payload) { res.status(status); res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.json(payload); }
function parseBody(req) { if (req.body && typeof req.body === 'object') return req.body; try { return JSON.parse(req.body || '{}'); } catch { return {}; } }
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
  const url=process.env.SUPABASE_URL; const key=process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return json(res,503,{error:'Email signup is temporarily unavailable. Please try again later.'});
  const body=parseBody(req);
  try {
    const response=await fetch(`${url.replace(/\/$/,'')}/functions/v1/saras-marketing`,{
      method:req.method,
      headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Origin:allowed,'x-forwarded-for':String(req.headers['x-forwarded-for']||'')},
      body:JSON.stringify(body)
    });
    const result=await response.json().catch(()=>({error:'The email update service returned an invalid response.'}));
    return json(res,response.status,result);
  } catch { return json(res,503,{error:'The email update service is temporarily unavailable. Please try again later.'}); }
}
