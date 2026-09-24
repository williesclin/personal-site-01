import test from 'node:test';import assert from 'node:assert/strict';
import {DIMENSIONS,dimensionValue,chartRows,scatterRows} from '../app/research-dimensions.mjs';
import {normalizeCompany} from '../app/equity-engine.mjs';
test('Scatter eligibility uses finite paired values, retaining zero and negative values but not missing axes',()=>{
 const c=(symbol,revenue,net)=>({symbol,years:[{start:'2025-01-01',end:'2025-12-31',revenue:revenue===null?null:{value:revenue},netIncome:net===null?null:{value:net}}]});
 const companies=[c('X_ONLY',999999,null),c('Y_ONLY',null,888888),c('ZERO',0,0),c('LOSS',100,-10)];
 const s=scatterRows(companies,'revenue','netIncome');
 assert.equal(s.rows.length,4);assert.deepEqual(s.valid.map(r=>r.symbol),['ZERO','LOSS']);
 assert.deepEqual(s.valid.map(r=>r.value),[0,100]);assert.deepEqual(s.valid.map(r=>r.other),[0,-10]);
 assert.equal(scatterRows(companies.slice(0,2),'revenue','netIncome').valid.length,0);
 assert.equal(scatterRows(companies,'revenue','netIncome','2024').valid.length,0);
 assert.equal(scatterRows([c('BAD',Infinity,1)],'revenue','netIncome').valid.length,0);
});
test('Fourteen dimensions retain null, real zero, negative profit and exact fiscal adjacency',()=>{
 assert.equal(Object.keys(DIMENSIONS).length,14);
 const row={start:'2025-01-01',end:'2025-12-31',revenue:{value:100},netIncome:{value:-10},operatingCashFlow:{value:0},capitalExpenditure:{value:5},grossProfit:null};
 assert.equal(dimensionValue(row,'netMargin'),-10);assert.equal(dimensionValue(row,'cashFlowMargin'),0);assert.equal(dimensionValue(row,'freeCashFlow'),-5);assert.equal(dimensionValue(row,'grossMargin'),null);
 assert.equal(dimensionValue(row,'revenueGrowth',{end:'2024-12-31',revenue:{value:50}}),100);assert.equal(dimensionValue(row,'revenueGrowth',{end:'2023-12-31',revenue:{value:50}}),null);
 assert.equal(dimensionValue({...row,revenue:{value:0}},'netMargin'),null);
 assert.equal(chartRows([{symbol:'TEST',years:[row]}],'revenue','2024')[0].value,null);
});
test('Calendarized duplicate annual starts resolve only with equal values and a disclosed prior end',()=>{
 const f=(start,end,val)=>({start,end,val,filed:'2026-01-01',form:'10-K',accn:'0000000001-26-000001'});
 const facts=[f('2020-04-25','2021-04-30',100),f('2020-05-01','2021-04-30',100),f('2019-04-27','2020-04-24',90),f('2018-04-28','2019-04-26',80)];
 const raw={cik:1,facts:{'us-gaap':{Revenues:{units:{USD:facts}}}}};
 assert.equal(normalizeCompany(raw,{cik:'0000000001'},'2026-09-22').years[0].start,'2020-04-25');
 facts[1].val=101;assert.throws(()=>normalizeCompany(raw,{cik:'0000000001'},'2026-09-22'),/Ambiguous/);
});
