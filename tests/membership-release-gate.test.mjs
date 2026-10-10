import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {membershipReleaseReadiness,publicMembershipReleaseStatus} from '../app/membership-release-gate.mjs';

const gate=JSON.parse(await readFile(new URL('../data/membership-release-gate.json',import.meta.url),'utf8'));

test('paid plans remain fail closed until every release gate and billing switch pass',()=>{
 const current=membershipReleaseReadiness(gate,{billingEnabled:false});
 assert.equal(current.research.passed,1);
 assert.equal(current.research.total,7);
 assert.equal(current.research.evidenceComplete,false);
 assert.equal(current.research.releaseAllowed,false);
 assert.equal(current.pro.releaseAllowed,false);
 assert.equal(publicMembershipReleaseStatus(gate).gates[0].evidence,undefined);
 const allPassed={...gate,gateSet:gate.gateSet.map(g=>({...g,status:'passed'})),pro:{...gate.pro,advancedToolsReleased:true,reviewedLabels:100,outOfSampleEvidence:true}};
 assert.equal(membershipReleaseReadiness(allPassed,{billingEnabled:false}).research.releaseAllowed,false);
 assert.equal(membershipReleaseReadiness(allPassed,{billingEnabled:true}).pro.releaseAllowed,true);
});

test('gate definition is bilingual, unique and matches current coverage evidence',()=>{
 const ids=gate.gateSet.map(g=>g.id);
 assert.equal(new Set(ids).size,ids.length);
 assert.ok(gate.gateSet.every(g=>g.label.en&&g.label['zh-hant']&&g.detail.en&&g.detail['zh-hant']));
 const coverage=gate.gateSet.find(g=>g.id==='verified-coverage').evidence;
 assert.ok(coverage.companies>=coverage.requiredCompanies);
 assert.ok(coverage.funds>=coverage.requiredFunds);
});
