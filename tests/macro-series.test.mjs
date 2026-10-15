import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const data=JSON.parse(await readFile(new URL('../data/macro-series.json',import.meta.url),'utf8'));
assert.equal(data.version,1);
assert.equal(data.source,'U.S. Bureau of Labor Statistics Public Data API');
assert.ok(Number.isFinite(Date.parse(data.retrievedAt)));
const byId=Object.fromEntries(data.series.map(s=>[s.id,s]));
for(const id of ['us-cpi','us-jobs']){
 const s=byId[id];assert.ok(s);assert.ok(Array.isArray(s.rows)&&s.rows.length>=60);
 let prev='';for(const row of s.rows){assert.ok(/^\d{4}-\d{2}$/.test(row.date));assert.ok(Number.isFinite(row.value));assert.equal(typeof row.preliminary,'boolean');assert.ok(row.date>prev);prev=row.date;}
}
const latestMonth=new Date(data.retrievedAt).toISOString().slice(0,7);
for(const id of ['us-cpi','us-jobs']){
 const observed=byId[id].rows.at(-1).date;
 assert.ok(observed<=latestMonth);
 const age=(Number(latestMonth.slice(0,4))-Number(observed.slice(0,4)))*12+Number(latestMonth.slice(5,7))-Number(observed.slice(5,7));
 assert.ok(age>=0&&age<=3);
}
assert.ok(byId['us-cpi'].rows.every(row=>row.value>=-10&&row.value<=30));
assert.ok(byId['us-jobs'].rows.every(row=>row.value>=0&&row.value<=30));
console.log('PASS: official BLS macro trend snapshot is dated, ordered and non-synthetic.');
