import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildResearchManifest, researchFeedFacts, verifyResearchManifest} from '../app/research-reconciliation.mjs';

const rawEquities = await readFile(new URL('../data/equities.json', import.meta.url), 'utf8');
const rawFeed = await readFile(new URL('../data/research-feed.json', import.meta.url), 'utf8');
const feed = JSON.parse(rawFeed);
const manifest = buildResearchManifest(rawEquities, rawFeed);

assert.deepEqual(researchFeedFacts(feed), {
  documentCount: 77,
  issuerCount: 34,
  backfillCount: 66,
  documentIdsSha256: '5d14ecb60600688ea17098091b6808669437a5d4e662d3f68085269efce1a0f3',
  feedRetrievedAt: '2026-10-04T21:43:26.934Z',
});
assert.deepEqual(verifyResearchManifest(manifest, rawEquities, rawFeed), manifest);
assert.throws(() => verifyResearchManifest({...manifest, documentCount: 76}, rawEquities, rawFeed), /documentCount/);
assert.throws(() => researchFeedFacts({...feed, documents: [...feed.documents, feed.documents[0]]}), /Duplicate/);

console.log('PASS: research manifest pins exact filing count, issuer coverage, backfill count and ID digest.');
