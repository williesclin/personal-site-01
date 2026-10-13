import test from 'node:test';
import assert from 'node:assert/strict';
import {researchWarehouseConnectionStatus,safeScheduledError} from '../app/research-warehouse-health.mjs';

const feed={retrievedAt:'2026-10-11T00:15:00.000Z',documents:[{id:'f1',kind:'filing'},{id:'f2',kind:'filing'},{id:'n1',kind:'news'}]};
const bindings={labUrl:'https://project.supabase.co',labServiceKey:'private-value-that-is-never-returned'};
const rows=[{dataset_key:'a',updated_at:'2026-10-11T00:16:00Z'},{dataset_key:'b',updated_at:'2026-10-11T00:16:00Z'}];
const verified={readSucceeded:true,lastAttemptStatus:'success',lastSuccessfulAt:'2026-10-11T00:20:00Z',fullSyncStartedAt:'2026-10-11T00:16:00Z',actualFilingIds:['f1','f2'],expectedDatasetKeys:['a','b'],datasetRows:rows};

test('warehouse status fails closed when either private binding is absent',()=>{
 const status=researchWarehouseConnectionStatus({labUrl:bindings.labUrl,feed,now:new Date('2026-10-11T01:15:00Z')});
 assert.equal(status.bindingsConfigured,false);
 assert.equal(status.connected,false);
 assert.equal(status.status,'blocked');
 assert.equal(status.scheduledFullSync,'blocked');
 assert.equal(status.reason,'missing_private_research_database_binding');
 assert.equal(status.expectedEvidence.filingObservations,2);
 assert.equal(status.expectedEvidence.ageHours,1);
 assert.equal(JSON.stringify(status).includes('service'),false);
});

test('bindings alone require a verified successful full sync',()=>{
 const status=researchWarehouseConnectionStatus({...bindings,feed});
 assert.equal(status.bindingsConfigured,true);
 assert.equal(status.connected,false);
 assert.equal(status.status,'verification_required');
 assert.equal(status.reason,'full_sync_not_verified');
 assert.equal(status.scheduledFullSync,'verification_required');
 assert.equal(JSON.stringify(status).includes('private-value'),false);
});

test('a successful full sync older than the feed stays unverified',()=>{
 const status=researchWarehouseConnectionStatus({...bindings,feed,verification:{...verified,lastSuccessfulAt:'2026-10-10T23:00:00Z',fullSyncStartedAt:'2026-10-10T22:59:00Z'}});
 assert.equal(status.connected,false);
 assert.equal(status.reason,'full_sync_older_than_feed');
});

test('current full sync with mismatched evidence stays unverified',()=>{
 const status=researchWarehouseConnectionStatus({...bindings,feed,verification:{...verified,actualFilingIds:['f1']}});
 assert.equal(status.connected,false);
 assert.equal(status.reason,'evidence_reconciliation_mismatch');
 assert.deepEqual(status.reconciliation,{expectedFilingObservations:2,actualFilingObservations:1,match:false});
});

test('same evidence count with a different document id stays unverified',()=>{
 const status=researchWarehouseConnectionStatus({...bindings,feed,verification:{...verified,actualFilingIds:['f1','wrong']}});
 assert.equal(status.connected,false);
 assert.equal(status.reason,'evidence_reconciliation_mismatch');
 assert.deepEqual(status.reconciliation,{expectedFilingObservations:2,actualFilingObservations:2,match:false});
 assert.equal(JSON.stringify(status).includes('wrong'),false);
});

test('current full sync with stale domain rows stays unverified',()=>{
 const status=researchWarehouseConnectionStatus({...bindings,feed,verification:{...verified,datasetRows:[rows[0],{dataset_key:'b',updated_at:'2026-10-10T00:00:00Z'}]}});
 assert.equal(status.connected,false);
 assert.equal(status.reason,'domain_status_not_refreshed');
 assert.deepEqual(status.domains,{expected:2,verified:1,identityMatch:true,allCurrent:false});
});

test('same domain count with a different dataset key stays unverified',()=>{
 const status=researchWarehouseConnectionStatus({...bindings,feed,verification:{...verified,datasetRows:[rows[0],{dataset_key:'wrong',updated_at:'2026-10-11T00:16:00Z'}]}});
 assert.equal(status.connected,false);
 assert.equal(status.reason,'domain_status_not_refreshed');
 assert.deepEqual(status.domains,{expected:2,verified:1,identityMatch:false,allCurrent:false});
});

test('connection turns verified only after current sync, exact evidence and all domain rows',()=>{
 const status=researchWarehouseConnectionStatus({...bindings,feed,now:new Date('2026-10-11T01:20:00Z'),verification:verified});
 assert.equal(status.connected,true);
 assert.equal(status.status,'verified');
 assert.equal(status.reason,null);
 assert.equal(status.scheduledFullSync,'verified');
 assert.equal(status.fullSync.ageHours,1);
 assert.deepEqual(status.domains,{expected:2,verified:2,identityMatch:true,allCurrent:true});
});

test('scheduled errors use bounded non-secret reason codes',()=>{
 assert.equal(safeScheduledError(new Error('Research warehouse database is not connected.')),'research_database_not_connected');
 assert.equal(safeScheduledError(new Error('upstream included a credential')),'research_warehouse_sync_failed');
});
