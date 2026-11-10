import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { canDownload, windowsRelease, previewChecks } from '../lib/windows-release.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'site');
const output = path.join(root, 'dist');
const vercelHost = process.env.VERCEL_ENV === 'production' ? process.env.VERCEL_PROJECT_PRODUCTION_URL : process.env.VERCEL_URL;
const base = (process.env.SITE_URL || (vercelHost ? `https://${vercelHost}` : 'https://saras-next.vercel.app')).replace(/\/$/, '');
await rm(output, { recursive: true, force: true });
await cp(source, output, { recursive: true });
let localDownload=null;
if (process.env.SARAS_LOCAL_INSTALLER && !process.env.VERCEL) {
  if(!windowsRelease.unsignedAcknowledged || previewChecks.some(key=>windowsRelease.checks?.[key]!==true))throw new Error('Local preview download requires completed local checks and unsigned preview acceptance');
  const artifact=path.resolve(process.env.SARAS_LOCAL_INSTALLER);
  const hash=createHash('sha256');let size=0;
  for await (const chunk of createReadStream(artifact)) { hash.update(chunk);size+=chunk.length; }
  if(hash.digest('hex')!==windowsRelease.sha256 || size!==windowsRelease.bytes)throw new Error('Local installer does not match verified release metadata');
  await mkdir(path.join(output,'downloads'),{recursive:true});
  await cp(artifact,path.join(output,'downloads',path.basename(artifact)));
  localDownload='/downloads/'+path.basename(artifact);
}
await rm(path.join(output, 'login'), { recursive: true, force: true });
await rm(path.join(output, 'signup'), { recursive: true, force: true });
await rm(path.join(output, 'updates'), { recursive: true, force: true });
await cp(path.join(source, 'updates'), path.join(output, 'updates'), { recursive: true });

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(file)); else files.push(file);
  }
  return files;
}

const pages = (await walk(output)).filter(file => file.endsWith('.html'));
for (const file of pages) {
  let html = await readFile(file, 'utf8');
  html = html.replace('<a class="" href="/faq/">Help</a>', '<a class="" href="/guide/">Setup guide</a><a class="" href="/history/">Versions</a><a class="" href="/faq/">Help</a>');
  html = html.replace('<a class="" href="/faq/">FAQ</a>', '<a class="" href="/guide/">Setup guide</a><a class="" href="/history/">Versions &amp; history</a><a class="" href="/faq/">FAQ</a>');
  if (file === path.join(output,'updates','index.html')) {
    html = html.replace('<body>', '<body class="updates-page">');
    html = html.replace('</head>', '<link rel="stylesheet" href="/assets/updates.css"></head>');
    html = html.replace('We will only use your address for SARAS product news. Your email stays in the existing SARAS Supabase project; it is separate from app accounts and PC pairing.', 'Join the optional SARAS product and release email list. Your address is stored separately from app accounts and PC pairing. Signups are saved now; email delivery will begin when SARAS email announcements launch.');
  }
  if (file === path.join(output,'download','index.html')) {
    const available = canDownload() || localDownload;
    const fileSize = Math.round(windowsRelease.bytes / 1048576);
    const control = available
      ? '<a id="download-installer" class="download-cta" href="'+(localDownload||'/api/download')+'" '+(localDownload?'download':'')+' aria-describedby="download-status"><span class="download-cta-icon" aria-hidden="true">↓</span><span class="download-cta-copy"><strong>Download SARAS for Windows</strong><small>Setup EXE · '+fileSize+' MiB · Free preview</small></span><span class="download-cta-arrow" aria-hidden="true">→</span></a><p id="download-status" class="download-status" role="status" aria-live="polite">Official Windows installer · '+fileSize+' MiB · No Python install needed.</p>'
      : '<button class="download-cta is-unavailable" type="button" disabled aria-disabled="true"><span class="download-cta-icon" aria-hidden="true">…</span><span class="download-cta-copy"><strong>Windows download is being verified</strong><small>Check this page again for availability.</small></span></button><p class="download-status" role="status">The verified Windows download is temporarily unavailable.</p>';
    html = html.replace('<!-- DOWNLOAD_ACTION -->', control);
    html = html.replaceAll('__SARAS_VERSION__',windowsRelease.version).replaceAll('__SARAS_SHA256__',windowsRelease.sha256).replaceAll('__SARAS_DATE__',windowsRelease.publishedAt || '');
    html = html.replace('</head>', '<link rel="stylesheet" href="/assets/download.css"></head>');
    html = html.replace('</body>', '<script defer src="/assets/download.js"></script></body>');
  }
  html = html.replaceAll('https://saras-next-assistant.airypixie256.chatgpt.site', base);
  if (file === path.join(output, '404.html')) html = html.replace(/<link rel="canonical" href="[^"]+">/g, '').replace('<meta name="robots" content="index,follow,max-image-preview:large">', '<meta name="robots" content="noindex,nofollow">');
  html = html.replace(/<a class="signin" href="\/login\/">Sign in<\/a>/g, '');
  html = html.replaceAll('<a class="" href="/signup/">Early access</a>', '<a class="" href="/updates/">Email updates</a>');
  html = html.replace('<article><h2>What you will download</h2>', '<article><h2>Use SARAS on your phone</h2><p>Open this HTTPS website on your phone and tap <b>Install SARAS</b>. iPhone users can use Safari’s Share menu, then Add to Home Screen. It opens like an app and keeps visited public pages available offline. This installs the website only; it does not install the Windows companion or turn on PC access.</p></article><article><h2>What you will download</h2>');
  html = html.replace('<h2>This information website</h2><p>This website does not ask for passwords, payment details, microphone access or an email address. It has no advertising or analytics scripts added by SARAS. Hosting infrastructure can process standard request information such as IP address and browser details under its own terms.</p>', '<h2>This information website</h2><p>This website does not ask for passwords, payment details or microphone access. The optional email updates form stores your email address, consent time, consent version, subscription status and a hashed unsubscribe token in a separate marketing_subscribers table in the existing SARAS Supabase project. It does not create an app login or pair a PC. The unsubscribe token stays in the browser where you subscribed. The API uses a server-only Supabase service key; never put that key in browser code. The site has no advertising or analytics scripts added by SARAS. Vercel and Supabase may process standard request and security logs under their own terms.</p>');
  const installControls = '<button class="button secondary pwa-install" type="button" data-install-app hidden>Install SARAS</button><dialog id="install-help" class="install-help"><form method="dialog"><button class="dialog-close" aria-label="Close">×</button></form><p class="eyebrow">SARAS NEXT</p><h2>Add SARAS to your phone</h2><p>In Safari, tap <b>Share</b>, then <b>Add to Home Screen</b>. In Chrome, open the menu and choose <b>Install app</b> or <b>Add to Home screen</b>.</p><p>This installs the SARAS website for quick, app-style access. Windows PC control still requires the separate SARAS companion and secure pairing.</p><form method="dialog"><button class="button primary">Got it</button></form></dialog>';
  html = html.replace('</header>', `${installControls}</header>`);
  html = html.replace('</head>', '<link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png"><link rel="stylesheet" href="/assets/pwa.css"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default"><meta name="apple-mobile-web-app-title" content="SARAS Next"></head>');
  html = html.replace('</body>', '<script defer src="/assets/pwa.js"></script></body>');
  await writeFile(file, html);
}

const indexablePages = pages.filter(file => !['404.html', 'offline.html'].includes(path.basename(file)));
const paths = indexablePages.map(file => '/' + path.relative(output, file).replaceAll('\\', '/').replace(/index\.html$/, ''));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(url => `<url><loc>${base}${url}</loc>${['/download/','/history/','/releases/'].includes(url)&&windowsRelease.publishedAt?`<lastmod>${windowsRelease.publishedAt}</lastmod>`:''}</url>`).join('')}</urlset>`;
await writeFile(path.join(output, 'sitemap.xml'), sitemap);
await writeFile(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${base}/sitemap.xml\n`);
console.log(`Built ${pages.length} HTML pages for ${base}`);
