import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const data=JSON.parse(await readFile(new URL('../data/macro-series.json',import.meta.url),'utf8'));
assert.equal(data.version,1);
assert.equal(data.source,'U.S. Bureau of Labor Statistics Public Data API');
assert.ok(Number.isFinite(Date.parse(data.retrievedAt)));
const byId=Object.fromEntries(data.series.map(s=>[s.id,s]));
for(const id of ['us-cpi','us-jobs']){
 const s=byId[id];assert.ok(s);assert.ok(Array.isArray(s.rows)&&s.rows.length>=60);
 let prev='';for(const row of s.rows){assert.ok(/^\d{4}-\d{2}$/.test(row.date));assert.ok(Number.isFinite(row.value));assert.ok(row.date>prev);prev=row.date;}
}
assert.ok(Math.abs(byId['us-cpi'].rows.at(-1).value-3.4)<0.2);
assert.ok(Math.abs(byId['us-jobs'].rows.at(-1).value-4.1)<0.2);
console.log('PASS: official BLS macro trend snapshot is dated, ordered and non-synthetic.');
