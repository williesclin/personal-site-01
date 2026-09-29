import assert from 'node:assert/strict';
import {DEFAULT_ACTION_CONFIG,normalizeActionConfig,buildActionReview} from '../app/action-engine.mjs';

const company={symbol:'TEST',years:[
 {end:'2026-12-31',revenue:{value:120},netIncome:{value:18},operatingCashFlow:{value:24}},
 {end:'2025-12-31',revenue:{value:100},netIncome:{value:12},operatingCashFlow:{value:20}}
]};
const review=buildActionReview({watchlist:['TEST'],companies:[company],config:DEFAULT_ACTION_CONFIG,retrievedAt:'2026-09-29T00:00:00Z'});
assert.equal(review.mode,'shadow');
assert.equal(review.rows.length,1);
assert.equal(review.rows[0].action,'no-action');
assert.equal(review.rows[0].enoughEvidence,false);
assert.equal(review.rows[0].availableModels,0);

const validated=normalizeActionConfig({...DEFAULT_ACTION_CONFIG,mode:'released',models:DEFAULT_ACTION_CONFIG.models.map(m=>({...m,status:'validated'}))});
const released=buildActionReview({watchlist:['TEST'],companies:[company],config:validated});
assert.equal(released.mode,'released');
assert.equal(released.rows[0].enoughEvidence,false);
assert.equal(released.rows[0].action,'no-action');

assert.throws(()=>normalizeActionConfig({...DEFAULT_ACTION_CONFIG,mode:'released'}),/validated/);
console.log('PASS: action engine stays fail-closed until enough validated model evidence exists.');
