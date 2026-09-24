import test from 'node:test';import assert from 'node:assert/strict';
import {readMemberAccess,isWorkspaceHash,workspaceDestination} from '../app/member-access.mjs';
import {handleApi} from '../cloudflare-dist/server/worker.js';
test('A failed, malformed or expired membership read never grants or silently downgrades access',async()=>{
 for(const status of [401,403])assert.equal((await readMemberAccess(new Response(null,{status}))).status,'guest');
 for(const status of [429,500,503])await assert.rejects(()=>readMemberAccess(new Response(null,{status})));
 for(const body of [{plan:'pro'}, {plan:'admin',billingEnabled:false},{plan:'pro',billingEnabled:false,periodEnd:'2020-01-01'}])await assert.rejects(()=>readMemberAccess(Response.json(body)));
 const r=await readMemberAccess(Response.json({plan:'research',billingEnabled:false,periodEnd:'2099-01-01',limits:{watch:999}}));assert.equal(r.access.limits.watch,30);
 assert.equal((await readMemberAccess(Response.json({plan:'free',billingEnabled:false}))).access.plan,'free');
});
test('Tool destinations survive authentication while content anchors stay on public pages',()=>{
 for(const h of ['analysis','equities','news','records','account']){assert.equal(workspaceDestination(h),h);assert.equal(isWorkspaceHash('#'+h),true)}
 for(const h of ['content','lottery','events-heading','unknown']){assert.equal(isWorkspaceHash('#'+h),false);assert.equal(workspaceDestination(h),'dashboard')}
});
test('Sign out clears this browser after expiry or an upstream failure while retaining CSRF protection',async()=>{
 const orig=globalThis.fetch;const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'fake',SITE_URL:'https://quantpathlabs.com'};
 const req=(origin='https://quantpathlabs.com')=>new Request('https://quantpathlabs.com/api/logout',{method:'POST',headers:{Origin:origin,Cookie:'__Host-qpl_session=expired'}});
 try{for(const status of [401,403,503]){globalThis.fetch=async()=>Response.json({}, {status});const r=await handleApi(req(),env);assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/Max-Age=0/);assert.equal((await r.json()).scope,'this_browser');}
 globalThis.fetch=async()=>{throw Error('network')};assert.equal((await handleApi(req(),env)).status,200);assert.equal((await handleApi(req('https://evil.example'),env)).status,403);
 assert.match((await handleApi(req(),{})).headers.get('set-cookie'),/Max-Age=0/);
 }finally{globalThis.fetch=orig}
});
