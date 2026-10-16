import assert from 'node:assert/strict';
import test from 'node:test';
import manifest from '../data/recovery-readiness.json' with {type:'json'};
import {publicRecoveryReadiness,recoveryReadiness} from '../app/recovery-readiness.mjs';

test('recovery status remains fail-closed until every gate is passed',()=>{
 const current=recoveryReadiness(manifest);
 assert.equal(current.ready,false);
 assert.equal(current.passed,1);
 assert.equal(current.total,6);
 assert.equal(current.gates.find(g=>g.id==='isolated-database-restore').status,'not_tested');
});

test('public recovery status is bilingual and does not expose credentials',()=>{
 const current=publicRecoveryReadiness(manifest);
 assert.ok(current.gates.every(g=>g.label.en&&g.label['zh-hant']&&g.detail.en&&g.detail['zh-hant']));
 assert.doesNotMatch(JSON.stringify(current),/supabase\.co|service[_-]?key|project[_-]?(id|ref)/i);
});

test('duplicate or manually asserted gates are rejected',()=>{
 assert.throws(()=>recoveryReadiness({...manifest,gates:[manifest.gates[0],manifest.gates[0]]}),/Invalid/);
 assert.throws(()=>recoveryReadiness({...manifest,gates:[{...manifest.gates[0],status:'approved'}]}),/Invalid/);
});
