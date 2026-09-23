import test from 'node:test';
import assert from 'node:assert/strict';
import feed from '../data/research-feed.json' with {type:'json'};
import readiness from '../data/research-model-readiness.json' with {type:'json'};
import {researchPublicStatus} from '../app/research-public-status.mjs';

test('public status reports coverage and keeps unreleased AI blocked',()=>{
 const status=researchPublicStatus(feed,readiness);
 assert.equal(status.filingObservations,66);
 assert.equal(status.observedIssuers,31);
 assert.equal(status.backfillObservations,66);
 assert.equal(status.socialStatus,'not_connected');
 assert.equal(status.newsStatus,'rights_review');
 assert.equal(status.ai.reviewedLabels,0);
 assert.equal(status.ai.minimumReviewed,100);
 assert.equal(status.ai.releaseAllowed,false);
 assert.equal(status.ai.status,'blocked');
 assert.equal('documents' in status,false);
});
