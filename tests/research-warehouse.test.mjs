import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ETFS} from '../app/etf-catalog.mjs';
import {buildResearchWarehouse} from '../app/research-warehouse.mjs';

const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const [equities,quarterly,macro,context,digital,lotto,power,daily,powerball,megamillions,researchFeed,researchReadiness]=await Promise.all([
 read('data/equities.json'),read('data/quarterly.json'),read('data/macro-series.json'),read('data/market-context.json'),read('data/digital-assets.json'),
 read('data/lotto649.json'),read('data/superlotto638.json'),read('data/daily539.json'),read('data/us-powerball.json'),read('data/us-megamillions.json'),
 read('data/research-feed.json'),read('data/research-model-readiness.json')
]);
const w=buildResearchWarehouse({equities,quarterly,macro,context,digital,etfs:ETFS,lotteries:[lotto,power,daily,powerball,megamillions],researchFeed,researchReadiness});
assert.equal(w.sources.length,12);
assert.equal(w.instruments.length,68);
assert.equal(w.fundProfiles.length,14);
assert.ok(w.annualFacts.length>2000);
assert.ok(w.quarterFacts.length>4000);
assert.ok(w.ttmFacts.length>250);
assert.ok(w.macroObservations.length>100);
assert.ok(w.fxObservations.length>100);
assert.ok(w.digitalFacts.length>=4);
assert.ok(w.lotteryDraws.length>4000);
assert.equal(w.evidenceDocuments.length,researchFeed.documents.length);
assert.ok(w.evidenceFilings.length>0);
const market=w.statuses.find(x=>x.dataset_key==='market_prices');
assert.equal(market.status,'blocked');
assert.equal(market.rights_status,'review_required');
assert.ok(!JSON.stringify(w).includes('user_id'));
console.log('PASS: warehouse separates research domains and keeps unlicensed market prices blocked.');
