import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { canDownload } from '../lib/windows-release.mjs';
import { createInterface } from 'node:readline/promises';
let address=process.argv[2];
if(!address){const prompt=createInterface({input:process.stdin,output:process.stdout});address=(await prompt.question('Paste the public HTTPS installer download URL: ')).trim();prompt.close()}
const file=new URL('../release/windows.json',import.meta.url);
const release=JSON.parse(await readFile(file,'utf8'));
const candidate={...release,url:address,enabled:true,approvedForPublication:true};
if(!canDownload(candidate))throw new Error('Release checks are incomplete, or the URL is not a clean HTTPS .exe address.');
const response=await fetch(address,{signal:AbortSignal.timeout(1800000)});
if(!response.ok || !response.url.startsWith('https:') || !response.body)throw new Error('Hosted installer is not reachable over HTTPS.');
const hash=createHash('sha256');let bytes=0;
for await(const chunk of response.body){bytes+=chunk.length;if(bytes>release.bytes)throw new Error('Hosted file exceeds the verified installer size.');hash.update(chunk)}
if(bytes!==release.bytes || hash.digest('hex')!==release.sha256)throw new Error('Hosted installer does not match the verified SHA-256 and size. Download remains disabled.');
await writeFile(file,JSON.stringify(candidate,null,2)+'\n');
console.log('Hosted installer hash/size verified. Download enabled in source. Rebuild the existing website; publishing remains a separate action.');
