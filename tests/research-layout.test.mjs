import assert from 'node:assert/strict';
import {defaultResearchLayout,layoutForSaved,validateLayout,MAX_COMPARE} from '../app/research-layout.mjs';

const base=defaultResearchLayout();
assert.equal(base.version,2);
assert.equal(base.yearFrom,'all');
assert.equal(base.yearTo,'latest');
assert.equal(base.benchmark,'VTI');
assert.deepEqual(validateLayout(base),base);

const multi={...base,yearFrom:'2022',yearTo:'2025',selectedFunds:['IVV','VTI'],macroIds:['us-cpi','us-rate'],chart:{...base.chart,selected:['NVDA','MSFT','AMD']}};
assert.deepEqual(validateLayout(multi).chart.selected,['NVDA','MSFT','AMD']);
assert.equal(validateLayout(multi).selectedFunds.length,2);

const legacy={version:1,onlyWatch:false,amount:'10000',chart:{...base.chart,selected:['NVDA']}};
const upgraded=validateLayout(legacy);
assert.equal(upgraded.version,2);
assert.equal(upgraded.benchmark,'VTI');

assert.throws(()=>validateLayout({...base,benchmark:'NOTREAL'}));
assert.throws(()=>validateLayout({...base,chart:{...base.chart,selected:Array.from({length:MAX_COMPARE+1},(_,i)=>'X'+i)}}));
assert.equal(layoutForSaved({}).version,2);
console.log('PASS: research layouts preserve multi-select, year range, benchmark and legacy compatibility.');
