import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('dist');
const failures = [];
async function walk(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else out.push(p)}return out}
const files=await walk(root);const html=files.filter(p=>p.endsWith('.html'));const canonicals=new Set();
for(const file of html){const body=await readFile(file,'utf8');if(!body.includes('manifest.webmanifest'))failures.push(`${file}: missing PWA manifest`);if(body.includes('/login/')||body.includes('/signup/'))failures.push(`${file}: customer login/signup link remains`);if(body.includes('airypixie256.chatgpt.site'))failures.push(`${file}: old preview canonical remains`);if(!file.endsWith(`${path.sep}offline.html`)&&!file.endsWith(`${path.sep}404.html`)){const canonical=body.match(/<link rel="canonical" href="([^"]+)"/);if(!canonical)failures.push(`${file}: canonical URL is missing`);else if(canonicals.has(canonical[1]))failures.push(`${file}: duplicate canonical URL ${canonical[1]}`);else canonicals.add(canonical[1])}}
for(const file of ['manifest.webmanifest','sw.js','offline.html','assets/pwa.js','assets/pwa.css','assets/pwa-192.png','assets/pwa-512.png','assets/apple-touch-icon.png','updates/index.html'])if(!files.includes(path.join(root,file)))failures.push(`${file}: missing PWA or updates asset`);
const manifest=JSON.parse(await readFile(path.join(root,'manifest.webmanifest'),'utf8'));
if(manifest.display!=='standalone'||manifest.scope!=='/')failures.push('Manifest is not installable at site root');
if(files.some(file=>file.includes(`${path.sep}login${path.sep}`)||file.includes(`${path.sep}signup${path.sep}`)))failures.push('Customer account pages remain in the public project');
const sitemap=await readFile(path.join(root,'sitemap.xml'),'utf8');if(sitemap.includes('airypixie256.chatgpt.site'))failures.push('Sitemap points at the old private preview');
const api=await readFile(path.resolve('api/updates.js'),'utf8');
if(!api.includes('SUPABASE_SERVICE_ROLE_KEY')||api.includes('service_role_key=')||api.includes('Access-Control-Allow-Origin'))failures.push('Newsletter API server key or cross-origin rules need review');
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(`Site check passed: ${html.length} pages, PWA manifest, offline shell, no customer auth links.`);
