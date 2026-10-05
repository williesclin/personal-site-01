import {createHash} from 'node:crypto';

const sha256 = value => createHash('sha256').update(value).digest('hex');

export function researchFeedFacts(feed) {
  if (feed?.version !== 1 || !Array.isArray(feed.documents)) throw Error('Invalid research feed');
  const documentIds = feed.documents.map(document => document.id).sort();
  if (new Set(documentIds).size !== documentIds.length) throw Error('Duplicate research document id');
  return {
    documentCount: documentIds.length,
    issuerCount: new Set(feed.documents.flatMap(document => document.symbols)).size,
    backfillCount: feed.documents.filter(document => document.backfill).length,
    documentIdsSha256: sha256(documentIds.join(',')),
    feedRetrievedAt: feed.retrievedAt,
  };
}

export function buildResearchManifest(rawEquities, rawFeed) {
  const feed = JSON.parse(rawFeed);
  return {
    version: 1,
    equitiesSha256: sha256(rawEquities),
    feedSha256: sha256(rawFeed),
    ...researchFeedFacts(feed),
  };
}

export function verifyResearchManifest(manifest, rawEquities, rawFeed) {
  const expected = buildResearchManifest(rawEquities, rawFeed);
  for (const [key, value] of Object.entries(expected)) {
    if (manifest?.[key] !== value) throw Error(`Research manifest mismatch: ${key}`);
  }
  return expected;
}
