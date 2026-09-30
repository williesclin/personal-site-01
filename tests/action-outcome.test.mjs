import assert from 'node:assert/strict';
import {validateMarketImport,evaluateSnapshot,summarizeEvaluations,candidateReadiness,releaseReadiness} from '../app/action-outcome.mjs';

const imported=validateMarketImport({
 rightsStatus:'approved',
 source:'licensed-test-feed',
 records:[
  {symbol:'NVDA',sessionDate:'2026-09-30',adjustedClose:100,currency:'USD',retrievedAt:'2026-10-01T00:00:00Z'},
  {symbol:'NVDA',sessionDate:'2026-10-06',adjustedClose:105,currency:'USD',retrievedAt:'2026-10-07T00:00:00Z'},
  {symbol:'VTI',sessionDate:'2026-09-30',adjustedClose:200,currency:'USD',retrievedAt:'2026-10-01T00:00:00Z'},
  {symbol:'VTI',sessionDate:'2026-10-06',adjustedClose:204,currency:'USD',retrievedAt:'2026-10-07T00:00:00Z'}
 ]
},{now:new Date('2026-10-07T00:00:00Z')});
assert.equal(imported.records.length,4);
assert.equal(imported.records[0].rights_status,'approved');
assert.throws(()=>validateMarketImport({source:'x',records:[{symbol:'NVDA',sessionDate:'2099-01-01',adjustedClose:1,currency:'USD'}]},{now:new Date('2026-10-07T00:00:00Z')}),/Future/);

const snapshot={
 symbol:'NVDA',
 decision_date:'2026-09-29',
 evidence:{evaluation:{horizonsDays:[7],benchmarkSymbol:'VTI'},signals:[{id:'fundamental',available:true,status:'shadow',score:70}]},
 outcome:{}
};
const outcome=evaluateSnapshot(snapshot,imported.records,'2026-10-06');
assert.equal(outcome.evaluated,1);
assert.equal(outcome.outcome.entryDate,'2026-09-30');
assert.equal(outcome.outcome.horizons['7'].return,0.05);
assert.equal(outcome.outcome.horizons['7'].benchmarkReturn,0.02);
assert.equal(outcome.outcome.horizons['7'].excessReturn,0.03);

const summaries=summarizeEvaluations([{...snapshot,outcome:outcome.outcome}],['fundamental'],[7]);
assert.equal(summaries[0].sampleCount,1);
assert.equal(summaries[0].hitRate,1);
assert.equal(candidateReadiness(summaries,{minimumModels:1,minimumSamples:1,minimumDates:1,minimumSymbols:1,horizonDays:7}).ready,true);
assert.equal(releaseReadiness([],{thresholds:{minimumModels:4}}).ready,false);
const releaseRows=['fundamental','quality','valuation','risk'].map(model_id=>({
 model_id,horizon_days:90,sample_count:30,hit_rate:0.6,avg_excess_return:0.01,
 details:{distinctDates:20,distinctSymbols:10,benchmarkReady:true}
}));
assert.equal(releaseReadiness(releaseRows,{thresholds:{minimumModels:4}}).ready,true);
console.log('PASS: outcome learning remains point-in-time, rights-gated and candidate updates require benchmark-adjusted evidence.');
