import assert from 'node:assert/strict';
import handler from '../api/updates.js';

const previousFetch=globalThis.fetch;
process.env.SITE_URL='https://saras.example';
process.env.SUPABASE_URL='https://db.example';
process.env.SUPABASE_ANON_KEY='test-public-anon-key';
function response(){return{code:200,headers:{},body:null,status(code){this.code=code;return this},setHeader(key,value){this.headers[key]=value},json(body){this.body=body}}}
function request(method,body,ip){return{method,body,headers:{origin:'https://saras.example',host:'saras.example','x-forwarded-for':ip||`127.0.0.${Math.floor(Math.random()*200)+1}`,'content-length':'120'}}}
try{
  let res=response();await handler(request('GET',{},'127.0.0.1'),res);assert.equal(res.code,405);
  res=response();await handler({...request('POST',{email:'bad',consent:true}),headers:{origin:'https://other.example',host:'saras.example'}},res);assert.equal(res.code,403);
  globalThis.fetch=async()=>new Response(JSON.stringify({error:'Please agree to receive occasional SARAS updates.'}),{status:400,headers:{'content-type':'application/json'}});
  res=response();await handler(request('POST',{email:'person@example.com',consent:false}),res);assert.equal(res.code,400);
  globalThis.fetch=async(url,options)=>{assert.match(url,/functions\/v1\/saras-marketing$/);assert.equal(options.headers.Authorization,'Bearer test-public-anon-key');assert.equal(options.headers.Origin,'https://saras.example');assert.doesNotMatch(JSON.stringify(options.body),/test-public-anon-key/);return new Response(JSON.stringify({ok:true,unsubscribeToken:'A'.repeat(43)}),{status:200,headers:{'content-type':'application/json'}})};
  res=response();await handler(request('POST',{email:'Person@Example.com',consent:true}),res);assert.equal(res.code,200);assert.equal(res.body.ok,true);assert.equal(res.body.unsubscribeToken.length,43);
  globalThis.fetch=async(url,options)=>{assert.match(url,/functions\/v1\/saras-marketing$/);assert.equal(options.method,'DELETE');assert.equal(options.headers.Authorization,'Bearer test-public-anon-key');assert.match(options.body,/unsubscribeToken/);return new Response(JSON.stringify({ok:true,changed:true}),{status:200,headers:{'content-type':'application/json'}})};
  res=response();await handler(request('DELETE',{unsubscribeToken:'A'.repeat(43)}),res);assert.equal(res.code,200);assert.equal(res.body.changed,true);
  console.log('Email updates API checks passed: consent, origin gate, function proxy, subscription and unsubscribe paths.');
}finally{globalThis.fetch=previousFetch;delete process.env.SITE_URL;delete process.env.SUPABASE_URL;delete process.env.SUPABASE_ANON_KEY}
