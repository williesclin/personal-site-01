import assert from 'node:assert/strict';
import {GAMES,generateNumbers,validateReport,canCompare,initialWorkspace} from '../app/domain.ts';
for(const name of Object.keys(GAMES)){
 const g=GAMES[name],rows=generateNumbers(name,100);
 assert.equal(new Set(rows.map(r=>r.join(','))).size,100);
 for(const r of rows){assert.equal(r.length,g.count+(g.second?1:0));assert.equal(new Set(r.slice(0,g.count)).size,g.count);assert(r.slice(0,g.count).every(n=>n>=1&&n<=g.max));if(g.second)assert(r[g.count]>=1&&r[g.count]<=g.second);}
}
assert.throws(()=>generateNumbers('lotto',101));
assert.throws(()=>generateNumbers('lotto',1.5));
assert.throws(()=>validateReport({name:'missing fields'}));
assert(canCompare(initialWorkspace.runs.slice(0,2)));
assert(!canCompare([initialWorkspace.runs[0],{...initialWorkspace.runs[1],dataset:'OTHER'}]));
assert(!canCompare([initialWorkspace.runs[0],{...initialWorkspace.runs[1],budget:1000}]));
assert(!canCompare([initialWorkspace.runs[0],{...initialWorkspace.runs[1],trials:10}]));
console.log('PASS: lottery ranges, unique batches, input rejection and experiment comparability.');
