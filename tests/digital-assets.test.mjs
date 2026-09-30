import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const data=JSON.parse(await readFile(new URL('../data/digital-assets.json',import.meta.url),'utf8'));
assert.equal(data.version,1);
assert.equal(data.marketData.status,'rights_review');
assert.equal(data.assets.BTC.priceUsd,null);
assert.equal(data.assets.ETH.priceUsd,null);
assert.equal(data.stablecoins.USDC.pegTarget,1);
assert.ok(data.stablecoins.USDC.reservesUsd>=data.stablecoins.USDC.circulationUsd);
assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(data.stablecoins.USDC.reserveAsOf));
assert.equal(data.stablecoins.USDT.reserveStatus,'issuer_source_connected');
const page=await readFile(new URL('../app/cross-assets.tsx',import.meta.url),'utf8');
for(const phrase of ['data-rights gate','資料使用權限門檻','Total reserves','總儲備','Market price / 24h change','市場價格／24h 變動'])assert.ok(page.includes(phrase),phrase);
console.log('PASS: digital asset page distinguishes issuer facts from unlicensed market prices.');
