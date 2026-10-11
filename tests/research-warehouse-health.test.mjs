import test from 'node:test';
import assert from 'node:assert/strict';
import {researchWarehouseConnectionStatus,safeScheduledError} from '../app/research-warehouse-health.mjs';

const feed={retrievedAt:'2026-10-11T00:15:00.000Z',documents:[{kind:'filing'},{kind:'filing'},{kind:'news'}]};

test('warehouse status fails closed when either private binding is absent',()=>{
 const status=researchWarehouseConnectionStatus({labUrl:'https://project.supabase.co',feed,now:new Date('2026-10-11T01:15:00Z')});
 assert.equal(status.connected,false);
 assert.equal(status.status,'blocked');
 assert.equal(status.scheduledFullSync,'blocked');
 assert.equal(status.reason,'missing_private_research_database_binding');
 assert.equal(status.expectedEvidence.filingObservations,2);
 assert.equal(status.expectedEvidence.ageHours,1);
 assert.equal(JSON.stringify(status).includes('service'),false);
});

test('warehouse status reports configured without exposing binding values',()=>{
 const status=researchWarehouseConnectionStatus({labUrl:'https://project.supabase.co',labServiceKey:'private-value-that-is-never-returned',feed});
 assert.equal(status.connected,true);
 assert.equal(status.status,'configured');
 assert.equal(status.reason,null);
 assert.equal(JSON.stringify(status).includes('private-value'),false);
});

test('scheduled errors use bounded non-secret reason codes',()=>{
 assert.equal(safeScheduledError(new Error('Research warehouse database is not connected.')),'research_database_not_connected');
 assert.equal(safeScheduledError(new Error('upstream included a credential')),'research_warehouse_sync_failed');
});
