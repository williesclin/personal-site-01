import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReviewAssignmentManifest} from '../scripts/review-assignment.mjs';

const documents = Array.from({length: 6}, (_, index) => ({
  id: String(index + 1).padStart(64, '0'),
  contentHash: String(index + 11).padStart(64, 'a'),
  url: `https://www.sec.gov/Archives/edgar/data/1/${index + 1}-index.html`,
  sourceId: 'sec-edgar',
  symbols: [index < 3 ? 'AAA' : 'BBB'],
  form: '8-K',
  items: '8.01',
  publishedOn: index < 2 ? '2026-10-01' : `2026-10-0${index}`,
  eventOn: index < 2 ? '2026-09-30' : `2026-10-0${index}`,
  firstObservedAt: '2026-10-08T00:00:00.000Z',
  backfill: false,
}));

test('assignment manifest uses real immutable sources without inventing completed labels', () => {
  const manifest = buildReviewAssignmentManifest(documents, '2026-10-09T00:00:00.000Z');
  assert.equal(manifest.assignments.length, 6);
  assert.equal(new Set(manifest.assignments.map(row => row.documentId)).size, 6);
  assert.equal(manifest.grouping.eventGroups, 5);
  assert.equal(manifest.readiness.documentShortfall, 94);
  assert.equal(manifest.readiness.doubleReviewAssignedNow, 2);
  assert.equal(manifest.readiness.releaseAllowed, false);
  assert.equal(manifest.reviewerOwnershipVerified, false);
  assert.ok(manifest.assignments.every(row => row.reviewStatus === 'unreviewed' && row.topic === '' && row.evidenceNote === ''));
  assert.ok(manifest.assignments.every(row => row.sourceUrl.startsWith('https://www.sec.gov/')));
  const sameEvent = manifest.assignments.filter(row => ['0'.repeat(63)+'1','0'.repeat(63)+'2'].includes(row.documentId));
  assert.equal(new Set(sameEvent.map(row => row.eventGroupId)).size, 1);
  assert.equal(new Set(sameEvent.map(row => row.primaryReviewerSlot)).size, 1);
});
