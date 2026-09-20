import test from 'node:test';
import assert from 'node:assert/strict';
import {effectivePlan,validateResearchState,membershipView} from '../app/membership.mjs';
import worker,{handleApi} from '../cloudflare-dist/server/worker.js';
const now=Date.parse('2026-09-21T00:00:00Z');
const active={plan:'research',status:'active',period_start:'2026-09-20T00:00:00Z',period_end:'2026-10-20T00:00:00Z'};
test('Entitlements handle paid-through cancellation, exact expiry, malformed dates and disabled billing',()=>{assert.equal(effectivePlan(active,now),'research');assert.equal(effectivePlan({...active,status:'canceling'},now),'research');for(const row of [null,{...active,status:'past_due'},{...active,period_end:'invalid'},{...active,period_end:'2026-09-21T00:00:00Z'},{...active,period_start:'2026-10-01T00:00:00Z'},{...active,plan:'admin'}])assert.equal(effectivePlan(row,now),'free');assert.equal(membershipView(active,now).billingEnabled,false);});
test('Plan quotas and condition input validation',()=>{const state={watchlist:['NVDA'],saved:[{id:'abc',name:'Test',query:'NVDA',year:'latest',metrics:['revenue']}]};assert.deepEqual(validateResearchState(state,'research'),state);assert.throws(()=>validateResearchState(state,'free'));assert.throws(()=>validateResearchState({...state,watchlist:['NVDA','NVDA']},'research'));assert.throws(()=>validateResearchState({...state,saved:Array.from({length:6},(_,i)=>({...state.saved[0],id:String(i)}))},'research'));assert.equal(validateResearchState({...state,saved:Array.from({length:6},(_,i)=>({...state.saved[0],id:String(i)}))},'pro').saved.length,6);});
test('Worker denies unauthenticated/private data, forged metadata, expired plan and blocked checkout; allows free lottery and active Research',async()=>{
 const original=globalThis.fetch;let plan=null,calls=0;
 globalThis.fetch=async url=>{calls++;if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',email:'test@example.com',email_confirmed_at:'2026-09-20',user_metadata:{plan:'pro'}});if(String(url).includes('/profiles?'))return Response.json([{role:'admin',monthly_budget:0}]);if(String(url).includes('/memberships?'))return Response.json(plan?[plan]:[]);if(String(url).includes('/research_state?'))return Response.json([]);throw Error('Unexpected URL');};
 const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'fake',SITE_URL:'https://quantpathlabs.com',ASSETS:{fetch:()=>{throw Error('Static bypass')}}};
 const req=(path,signed=false,method='GET')=>new Request('https://quantpathlabs.com'+path,{method,headers:{...(signed?{Cookie:'__Host-qpl_session=test'}:{}),Origin:'https://quantpathlabs.com'}});
 try{
  for(const path of ['/api/research-data','/api/lottery/lotto649','/api/membership','/api/research-state'])assert.equal((await handleApi(req(path),env)).status,401);
  assert.equal(calls,0);
  const preview=await (await handleApi(req('/api/research-preview'),env)).json();assert.equal(preview.companies.length,1);assert.equal(preview.companies[0].years.length,3);assert.equal(preview.preview,true);
  assert.equal((await worker.fetch(req('/data/equities.json'),env)).status,404);
  assert.equal((await handleApi(req('/api/research-data',true),env)).status,403);
  assert.equal((await handleApi(req('/api/lottery/lotto649',true),env)).status,200);
  assert.equal((await handleApi(req('/api/checkout',true,'POST'),env)).status,503);
  plan={...active,period_end:'2099-01-01T00:00:00Z'};assert.equal((await handleApi(req('/api/research-data',true),env)).status,200);assert.equal((await handleApi(req('/api/pro-tools',true),env)).status,403);
  plan={...plan,plan:'pro'};assert.equal((await handleApi(req('/api/pro-tools',true),env)).status,503);
  plan={...plan,period_end:'2020-01-01T00:00:00Z'};assert.equal((await handleApi(req('/api/research-data',true),env)).status,403);
 }finally{globalThis.fetch=original;}
});
