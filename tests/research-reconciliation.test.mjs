import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildResearchManifest, researchFeedFacts, verifyResearchManifest} from '../app/research-reconciliation.mjs';

const rawEquities = await readFile(new URL('../data/equities.json', import.meta.url), 'utf8');
const rawFeed = await readFile(new URL('../data/research-feed.json', import.meta.url), 'utf8');
const pinnedManifest = JSON.parse(await readFile(new URL('../data/research-sync.json', import.meta.url), 'utf8'));
const feed = JSON.parse(rawFeed);
const manifest = buildResearchManifest(rawEquities, rawFeed);

const facts = researchFeedFacts(feed);
assert.deepEqual(facts, {
  documentCount: pinnedManifest.documentCount,
  issuerCount: pinnedManifest.issuerCount,
  backfillCount: pinnedManifest.backfillCount,
  documentIdsSha256: pinnedManifest.documentIdsSha256,
  feedRetrievedAt: pinnedManifest.feedRetrievedAt,
});
assert.deepEqual(verifyResearchManifest(manifest, rawEquities, rawFeed), manifest);
assert.throws(() => verifyResearchManifest({...manifest, documentCount: manifest.documentCount - 1}, rawEquities, rawFeed), /documentCount/);
assert.throws(() => researchFeedFacts({...feed, documents: [...feed.documents, feed.documents[0]]}), /Duplicate/);

console.log('PASS: research manifest pins exact filing count, issuer coverage, backfill count and ID digest.');
