import { canDownload, windowsRelease } from '../lib/windows-release.mjs';
export default function handler(req,res) {
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  if (!['GET','HEAD'].includes(req.method)) { res.setHeader('Allow','GET, HEAD'); return res.status(405).end(); }
  if (!canDownload()) { res.setHeader('Retry-After','86400'); return res.status(503).json({error:'SARAS Windows release is still being verified. Public downloads are not enabled.'}); }
  res.setHeader('Location',windowsRelease.url);
  res.setHeader('X-SARAS-SHA256',windowsRelease.sha256);
  res.setHeader('X-SARAS-Channel',windowsRelease.channel || 'stable');
  return res.status(307).end();
}
