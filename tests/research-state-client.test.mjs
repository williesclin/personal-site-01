import test from 'node:test';
import assert from 'node:assert/strict';
import {createResearchStateClient} from '../app/research-state-client.mjs';

test('Ambiguous writes require a successful fresh read before another write', async () => {
 let server = {watchlist: [], saved: []}, failPost = true, failRead = false, posts = 0;
 const client = createResearchStateClient(async (_url, options) => {
  assert.equal(options.cache, 'no-store');
  assert.equal(options.credentials, 'same-origin');
  if (options.method === 'POST') {
   posts++; server = JSON.parse(options.body);
   if (failPost) throw Error('Response lost after commit');
  } else if (failRead) return new Response(null, {status: 503});
  return Response.json({state: server});
 });
 await assert.rejects(() => client.save(server));
 await client.load();
 await assert.rejects(() => client.save({watchlist: ['NVDA'], saved: []}));
 await assert.rejects(() => client.save({watchlist: ['AMD'], saved: []}));
 assert.equal(posts, 1);
 failRead = true; await assert.rejects(() => client.load());
 await assert.rejects(() => client.save(server)); assert.equal(posts, 1);
 failRead = false;
 assert.deepEqual((await client.load()).watchlist, ['NVDA']);
 failPost = false;
 assert.deepEqual((await client.save({watchlist: ['NVDA','AMD'], saved: []})).watchlist, ['NVDA','AMD']);
});

test('Concurrent requests and malformed reads cannot unlock a stale write', async () => {
 let resolve, calls = 0;
 const client = createResearchStateClient(() => {calls++; return new Promise(r => {resolve = r;});});
 const pending = client.load();
 await assert.rejects(() => client.load());
 await assert.rejects(() => client.save({watchlist: [], saved: []}));
 resolve(Response.json({state: {watchlist: 'invalid', saved: []}}));
 await assert.rejects(() => pending);
 await assert.rejects(() => client.save({watchlist: [], saved: []}));
 assert.equal(calls, 1);
});

test('A reduced plan can read retained records without changing server write authorization', async () => {
 const state = {watchlist: Array.from({length: 31}, (_,i) => 'T'+i), saved: []};
 const client = createResearchStateClient(async () => Response.json({state}));
 assert.equal((await client.load()).watchlist.length, 31);
});
