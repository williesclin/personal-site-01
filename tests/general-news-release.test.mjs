import test from 'node:test';
import assert from 'node:assert/strict';
import gate from '../data/general-news-release-gate.json' with {type:'json'};
import {evaluateGeneralNewsRelease,REQUIRED_RIGHTS_USES} from '../app/general-news-release.mjs';

test('general news remains fail-closed while rights, coverage, policies and review are incomplete',()=>{
 const result=evaluateGeneralNewsRelease(gate);
 assert.equal(gate.status,'blocked');
 assert.deepEqual(Object.keys(gate.rights),REQUIRED_RIGHTS_USES);
 assert.equal(result.releaseAllowed,false);
 assert.equal(result.rightsApproved,false);
 assert.equal(result.coverageComplete,false);
 assert.equal(result.policyComplete,false);
 assert.equal(result.humanReviewReady,false);
 assert.ok(result.missing.includes('rights.commercial.status'));
 assert.ok(result.missing.includes('coverage.universe'));
 assert.ok(result.missing.includes('correctionPolicy.url'));
 assert.ok(result.missing.includes('deletionPolicy.url'));
 assert.ok(result.missing.includes('humanReview.minimumReviewed.notMet'));
});

test('release requires every gate and reconciled denominator accounting',()=>{
 const complete={
  ...structuredClone(gate),
  rights:Object.fromEntries(REQUIRED_RIGHTS_USES.map(use=>[use,{status:'approved',evidenceUrl:`https://example.com/rights/${use}`}])),
  coverage:{
   universe:'50-company issuer universe',
   querySetVersion:'issuer-news-v1',
   window:{start:'2026-10-01T00:00:00Z',end:'2026-10-08T00:00:00Z',timezone:'UTC',cutoffTime:'00:00'},
   attemptedQueries:50,successfulQueries:49,failedQueries:1,retrievedDocuments:20,deduplicatedDocuments:18
  },
  correctionPolicy:{url:'https://example.com/corrections',slaHours:72},
  deletionPolicy:{url:'https://example.com/deletions',slaHours:72},
  humanReview:{reviewedDocuments:100,minimumReviewed:100,doubleReviewedDocuments:20,minimumDoubleReviewRate:0.2,agreementRate:0.9,disagreementsResolved:true}
 };
 const result=evaluateGeneralNewsRelease(complete);
 assert.equal(result.releaseAllowed,true);
 assert.deepEqual(result.missing,[]);
 complete.coverage.failedQueries=0;
 assert.equal(evaluateGeneralNewsRelease(complete).releaseAllowed,false);
 assert.ok(evaluateGeneralNewsRelease(complete).missing.includes('coverage.queryAccounting'));
});
