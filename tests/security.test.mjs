import assert from 'node:assert/strict';
import {handleApi} from '../cloudflare-dist/server/worker.js';
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'not-a-real-key',SITE_URL:'https://quantpathlabs.com'};
let calls=0;
const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{calls++;throw new Error('Unexpected outbound request');};
let r=await handleApi(new Request('https://quantpathlabs.com/api/session'),{});
assert.deepEqual(await r.json(),{configured:false,user:null});
r=await handleApi(new Request('https://quantpathlabs.com/api/workspace/record',{method:'POST',headers:{Origin:'https://evil.example'},body:'{}'}),env);assert.equal(r.status,403);
for(const path of ['members','workspace/run','workspace/publish-run','workspace/record']){
 r=await handleApi(new Request('https://quantpathlabs.com/api/'+path,{method:path==='members'?'GET':'POST',headers:{Origin:'https://quantpathlabs.com'},...(path==='members'?{}:{body:'{}'})}),env);assert.equal(r.status,401);
}
assert.equal(calls,0);
globalThis.fetch=async(url)=>{calls++;if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',email:'member@example.com',email_confirmed_at:'2026-09-20'});if(String(url).includes('/profiles?'))return Response.json([{role:'member',monthly_budget:1000}]);throw new Error('Forbidden outbound call');};
r=await handleApi(new Request('https://quantpathlabs.com/api/workspace/publish-run',{method:'POST',headers:{Origin:'https://quantpathlabs.com',Cookie:'__Host-qpl_session=test'},body:JSON.stringify({id:'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'})}),env);assert.equal(r.status,403);assert.equal(calls,2);
globalThis.fetch=originalFetch;
console.log('PASS: unconfigured fail closed, CSRF origin rejection, unauthenticated denial, member/admin isolation.');
