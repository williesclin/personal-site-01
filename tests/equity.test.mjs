import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {normalizeCompany,validateEquities,ratios,annualFee} from '../app/equity-engine.mjs';
const snapshot=JSON.parse(readFileSync(new URL('../data/equities.json',import.meta.url)));
test('Real snapshot has three companies, distinct annual periods and a reproducible hash',()=>{
 validateEquities(snapshot);assert.equal(snapshot.hash,createHash('sha256').update(JSON.stringify(snapshot.companies)).digest('hex'));
 for(const c of snapshot.companies){assert.equal(c.years.length,8);for(let i=0;i<c.years.length;i++){const r=c.years[i];assert.ok(r.revenue.value>0);assert.ok(r.start<r.end);if(i)assert.ok(c.years[i-1].end>r.end);for(const k of ['revenue','netIncome','operatingCashFlow'])if(r[k])assert.ok(r[k].filed>=r.end);}}
 const bad=structuredClone(snapshot);bad.companies[0].years[0].revenue.value='215';assert.throws(()=>validateEquities(bad));
});
test('Annual extraction handles tag migration, restatements, cutoff and exact-period alignment',()=>{
 const f=(year,val,extra={})=>({start:`${year}-01-01`,end:`${year}-12-31`,val,form:'10-K',filed:`${year+1}-02-01`,accn:`0000000001-${String(year+1).slice(2)}-000001`,...extra});
 const raw={cik:1,facts:{'us-gaap':{Revenues:{units:{USD:[f(2023,30),f(2023,33,{filed:'2025-02-01'}),f(2024,40),f(2025,50),f(2026,60),f(2025,2,{start:'2025-10-01'}),f(2025,2,{form:'10-Q'})]}},RevenueFromContractWithCustomerExcludingAssessedTax:{units:{USD:[f(2022,20)]}},NetIncomeLoss:{units:{USD:[f(2025,10,{start:'2025-01-02'})]}}}}};
 const c=normalizeCompany(raw,{cik:'0000000001',symbol:'TEST'},'2026-09-20');assert.deepEqual(c.years.map(r=>r.revenue.value),[50,40,33,20]);assert.equal(c.years[0].netIncome,null);assert.equal(c.years[3].revenue.tag,'RevenueFromContractWithCustomerExcludingAssessedTax');
});
test('Ratios reject missing/nonconsecutive periods; fee estimates retain genuine zero',()=>{
 const a={start:'2025-01-01',end:'2025-12-31',revenue:{value:120},netIncome:{value:-12}},b={end:'2024-12-31',revenue:{value:100}};
 assert.ok(Math.abs(ratios(a,b).growth-20)<1e-9);assert.equal(ratios(a,b).margin,-10);assert.equal(ratios(a,{...b,end:'2023-12-31'}).growth,null);assert.equal(ratios(undefined,b).growth,null);assert.equal(ratios(a,{...b,revenue:{value:0}}).growth,null);
 assert.equal(annualFee(10000,0.03),3);assert.equal(annualFee(0,0.07),0);for(const v of [-1,NaN,Infinity,'100',1e10])assert.equal(annualFee(v,.03),null);
});
