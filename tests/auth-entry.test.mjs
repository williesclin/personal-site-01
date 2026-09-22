import test from 'node:test';
import assert from 'node:assert/strict';
import {authCopy,authText,authErrorKey,createAuthSubmitter} from '../app/auth-i18n.mjs';
import {readFile} from 'node:fs/promises';
test('auth translations use complete stable keys',()=>{
 assert.deepEqual(Object.keys(authCopy.en).sort(),Object.keys(authCopy['zh-hant']).sort());
 for(const locale of Object.keys(authCopy))for(const key of Object.keys(authCopy.en))assert.ok(authText(locale,key).length);
 assert.equal(authText('unsupported','auth.email'),'Email');
});
test('unconfigured and unknown auth actions never transmit',async()=>{
 let calls=0;const submit=createAuthSubmitter(async()=>{calls++;return Response.json({ok:true})});
 assert.equal((await submit({view:'login',configured:false})).error,'errors.unavailable');
 assert.equal((await submit({view:'admin',configured:true})).error,'errors.request');assert.equal(calls,0);
});
test('reset sends no password and safe success does not assert account existence',async()=>{
 let body;const submit=createAuthSubmitter(async(url,options)=>{assert.equal(url,'/api/reset');assert.equal(options.credentials,'same-origin');body=JSON.parse(options.body);return Response.json({ok:true})});
 assert.deepEqual(await submit({view:'reset',email:'fixture@example.invalid',password:'must-not-be-sent',configured:true}),{ok:true});assert.deepEqual(body,{email:'fixture@example.invalid'});
 assert.match(authCopy.en['auth.reset.success'],/^If /);
});
test('duplicate submits are blocked and failure can be retried',async()=>{
 let resolve,calls=0;const submit=createAuthSubmitter(()=>{calls++;return new Promise(r=>{resolve=r})});
 const args={view:'login',configured:true,email:'fixture@example.invalid',password:'test-only-password'};
 const first=submit(args);assert.deepEqual(await submit(args),{ignored:true});assert.equal(calls,1);resolve(Response.json({error:'private provider detail'},{status:401}));assert.deepEqual(await first,{error:'errors.credentials'});
 const second=submit(args);resolve(Response.json({ok:true}));assert.deepEqual(await second,{ok:true});assert.equal(calls,2);
});
test('errors are localized categories, never provider response bodies',async()=>{
 assert.equal(authErrorKey(429),'errors.rateLimit');assert.equal(authErrorKey(503),'errors.unavailable');
 const network=createAuthSubmitter(async()=>{throw Error('secret')});assert.deepEqual(await network({configured:true,view:'login'}),{error:'errors.network'});
 const invalid=createAuthSubmitter(async()=>new Response('not JSON'));assert.deepEqual(await invalid({configured:true,view:'signup'}),{error:'errors.request'});
});
test('auth localization neither remounts the form nor persists credentials',async()=>{
 const source=await readFile(new URL('../app/auth-entry.tsx',import.meta.url),'utf8');
 assert.doesNotMatch(source,/localStorage|sessionStorage|console\.|gtag/);assert.match(source,/\},\[view\]\)/);
 const app=await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');assert.match(app,/<AuthEntry locale=\{locale\}/);assert.doesNotMatch(app,/<AuthEntry[^>]*key=/);
});
