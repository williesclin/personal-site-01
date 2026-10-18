import assert from 'node:assert/strict';
import test from 'node:test';
import {validateRecoveryExportEvidence} from '../scripts/recovery-export-evidence.mjs';

const artifact=kind=>({kind,bytes:128,sha256:'a'.repeat(64),encryption:'age'});
const exported=scope=>({
 scope,
 exportedAt:'2026-10-18T00:00:00Z',
 recoveryPointAt:'2026-10-17T23:59:00Z',
 managedSchemasExcluded:['auth','extensions','storage'],
 artifacts:['schema','data','roles'].map(artifact)
});
const valid={
 version:1,
 generatedAt:'2026-10-18T00:05:00Z',
 storage:{offsite:true,encrypted:true,retentionDays:30,locationClass:'offline-encrypted-volume'},
 exports:[exported('membership'),exported('research')]
};

test('accepts fresh, complete and encrypted evidence for both databases',()=>{
 const result=validateRecoveryExportEvidence(valid,{now:new Date('2026-10-18T08:00:00Z')});
 assert.equal(result.verified,true);
 assert.deepEqual(result.exports.map(item=>item.scope),['membership','research']);
 assert.ok(result.exports.every(item=>item.artifacts===3));
});

test('rejects stale, local-only, incomplete or unverifiable evidence',()=>{
 assert.throws(()=>validateRecoveryExportEvidence(valid,{now:new Date('2026-10-20T00:01:00Z')}),/freshness/);
 assert.throws(()=>validateRecoveryExportEvidence({...valid,storage:{...valid.storage,offsite:false}},{now:new Date('2026-10-18T08:00:00Z')}),/off-site/);
 assert.throws(()=>validateRecoveryExportEvidence({...valid,exports:[valid.exports[0]]},{now:new Date('2026-10-18T08:00:00Z')}),/both required/);
 const bad=structuredClone(valid);
 bad.exports[0].artifacts[0].sha256='approved';
 assert.throws(()=>validateRecoveryExportEvidence(bad,{now:new Date('2026-10-18T08:00:00Z')}),/SHA-256/);
});

test('records managed-schema exclusions instead of implying a full platform backup',()=>{
 const bad=structuredClone(valid);
 bad.exports[1].managedSchemasExcluded=['storage'];
 assert.throws(()=>validateRecoveryExportEvidence(bad,{now:new Date('2026-10-18T08:00:00Z')}),/managed schema exclusions/);
});
