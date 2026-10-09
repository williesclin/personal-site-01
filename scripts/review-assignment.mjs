import {createHash} from 'node:crypto';

const byText = (a, b) => String(a).localeCompare(String(b), 'en');
const stableHash = value => createHash('sha256').update(value).digest('hex');

export function buildReviewAssignmentManifest(documents, generatedAt = new Date().toISOString()) {
  if (!Array.isArray(documents) || documents.length === 0) throw new Error('At least one source document is required');

  const unique = new Map();
  for (const document of documents) {
    if (!document?.id || !document?.contentHash || !document?.url || !document?.symbols?.[0]) {
      throw new Error('Document identity, source URL, content hash and issuer symbol are required');
    }
    const existing = unique.get(document.id);
    if (existing && (existing.contentHash !== document.contentHash || existing.url !== document.url)) {
      throw new Error(`Conflicting source versions for ${document.id}`);
    }
    unique.set(document.id, document);
  }

  const sourceDocuments = [...unique.values()].sort((a, b) =>
    byText(a.symbols[0], b.symbols[0]) ||
    byText(a.eventOn || a.publishedOn, b.eventOn || b.publishedOn) ||
    byText(a.id, b.id)
  );
  const groupMap = new Map();
  for (const document of sourceDocuments) {
    const symbol = document.symbols[0];
    const eventDate = document.eventOn || document.publishedOn;
    const groupKey = `${symbol}|${eventDate}`;
    if (!groupMap.has(groupKey)) groupMap.set(groupKey, []);
    groupMap.get(groupKey).push(document);
  }

  const groups = [...groupMap.entries()]
    .map(([groupKey, groupDocuments]) => ({
      groupKey,
      eventGroupId: `event-${stableHash(groupKey).slice(0, 16)}`,
      documents: groupDocuments.sort((a, b) => byText(a.id, b.id)),
    }))
    .sort((a, b) => b.documents.length - a.documents.length || byText(a.groupKey, b.groupKey));

  const primaryLoads = {'slot-a': 0, 'slot-b': 0};
  for (const group of groups) {
    group.primaryReviewerSlot = primaryLoads['slot-a'] <= primaryLoads['slot-b'] ? 'slot-a' : 'slot-b';
    primaryLoads[group.primaryReviewerSlot] += group.documents.length;
  }

  const doubleReviewNow = Math.ceil(sourceDocuments.length * 0.2);
  const doubleReviewIds = new Set(
    groups.flatMap(group => group.documents.map(document => ({document, group})))
      .sort((a, b) => byText(a.document.id, b.document.id))
      .slice(0, doubleReviewNow)
      .map(({document}) => document.id)
  );

  const assignments = groups.flatMap(group => group.documents.map(document => ({
    documentId: document.id,
    contentHash: document.contentHash,
    sourceUrl: document.url,
    sourceId: document.sourceId,
    issuer: document.symbols[0],
    form: document.form,
    items: document.items || '',
    publishedOn: document.publishedOn,
    eventOn: document.eventOn || null,
    firstObservedAt: document.firstObservedAt,
    backfill: Boolean(document.backfill),
    eventGroupId: group.eventGroupId,
    primaryReviewerSlot: group.primaryReviewerSlot,
    secondaryReviewerSlot: doubleReviewIds.has(document.id)
      ? (group.primaryReviewerSlot === 'slot-a' ? 'slot-b' : 'slot-a')
      : null,
    reviewStatus: 'unreviewed',
    topic: '',
    sentiment: '',
    evidenceNote: '',
    reviewedAt: '',
  }))).sort((a, b) => byText(a.documentId, b.documentId));

  const releaseMinimum = 100;
  const doubleReviewMinimum = Math.ceil(releaseMinimum * 0.2);
  return {
    schemaVersion: 1,
    generatedAt,
    source: 'QuantPath versioned SEC filing metadata; original links only',
    assignmentStatus: 'prepared_not_owned',
    reviewerOwnershipVerified: false,
    reviewerSlots: [
      {slot: 'slot-a', ownerCode: '', verified: false},
      {slot: 'slot-b', ownerCode: '', verified: false},
    ],
    readiness: {
      releaseAllowed: false,
      reviewedDocuments: 0,
      availableUniqueDocuments: assignments.length,
      minimumReviewedDocuments: releaseMinimum,
      documentShortfall: Math.max(0, releaseMinimum - assignments.length),
      doubleReviewAssignedNow: doubleReviewIds.size,
      minimumDoubleReviewedDocuments: doubleReviewMinimum,
      doubleReviewShortfall: Math.max(0, doubleReviewMinimum - doubleReviewIds.size),
    },
    grouping: {
      rule: 'issuer plus event date; eventOn falls back to publishedOn',
      eventGroups: groups.length,
      primaryLoads,
    },
    assignments,
  };
}
