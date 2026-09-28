import test from 'node:test';
import assert from 'node:assert/strict';
import equities from '../data/equities.json' with {type:'json'};
import {handleApi} from '../cloudflare-dist/server/worker.js';

test('member evidence distinguishes source retrieval from completed database hash verification',async()=>{
 const original=globalThis.fetch;
 const active={plan:'research',status:'active',period_start:'2026-01-01',period_end:'2099-01-01'};
 globalThis.fetch=async input=>{
  const url=String(input);
  if(url.endsWith('/auth/v1/user'))return Response.json({id:'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',email_confirmed_at:'2026-01-01'});
  if(url.includes('/profiles?'))return Response.json([{role:'member'}]);
  if(url.includes('/memberships?'))return Response.json([active]);
  if(url.includes('/research_documents?'))return Response.json([]);
  if(url.includes('/research_filing_observations?'))return Response.json([]);
  if(url.includes('/research_ingestions?'))return Response.json([{hash:equities.hash,recorded_at:'2026-09-22T14:44:47Z',retrieved_at:'2026-09-22T14:31:23Z',company_count:equities.companies.length,completed_at:'2026-09-22T14:50:30Z'}]);
  throw Error('Unexpected request '+url);
 };
 try{
  const response=await handleApi(new Request('https://quantpathlabs.com/api/research-evidence',{headers:{Cookie:'__Host-qpl_session=test'}}),{SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'test',SITE_URL:'https://quantpathlabs.com'});
  assert.equal(response.status,200);
  const data=await response.json();
  assert.equal(data.databaseSync.current,true);
  assert.equal(data.databaseSync.status,'current');
  assert.equal(data.snapshot.hash,equities.hash);
  assert.equal(data.snapshot.retrievedAt,equities.retrievedAt);
  assert.equal(data.ingestion.recorded_at,'2026-09-22T14:44:47Z');
 }finally{globalThis.fetch=original}
});
