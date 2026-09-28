import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeUS,validateUSDraws} from '../scripts/sync-us-lottery.mjs';
test('normalizes current Powerball and Mega Millions draw formats',()=>{
 const p=normalizeUS({draw_date:'2026-09-26T00:00:00.000',winning_numbers:'14 40 52 55 57 24',multiplier:'3'},'powerball');
 assert.deepEqual(p,{id:'2026-09-26',date:'2026-09-26',numbers:[14,40,52,55,57],special:24,multiplier:3});
 const m=normalizeUS({draw_date:'2026-09-25T00:00:00.000',winning_numbers:'25 57 58 67 68',mega_ball:'16'},'megamillions');
 assert.deepEqual(m,{id:'2026-09-25',date:'2026-09-25',numbers:[25,57,58,67,68],special:16,multiplier:null});
});
test('rejects duplicate and invalid draws',()=>{
 assert.throws(()=>normalizeUS({draw_date:'2026-09-26T00:00:00.000',winning_numbers:'14 14 52 55 57 24'},'powerball'));
 const d=normalizeUS({draw_date:'2026-09-26T00:00:00.000',winning_numbers:'14 40 52 55 57 24'},'powerball');
 assert.throws(()=>validateUSDraws([d,d],'powerball'));
});
