import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {articles,pages,publicRoute} from '../app/public-content.mjs';
import {safeView} from '../cloudflare/analytics-browser.mjs';
test('public catalog has complete paired translations and unique stable URLs',()=>{assert.equal(new Set(articles.map(a=>a.id)).size,articles.length);for(const a of articles){assert.equal(a.status,'published');for(const lang of ['en','zh-hant']){assert.ok(a[lang].title&&a[lang].summary);assert.equal(a[lang].sections.length,a.en.sections.length);for(const [h,b] of a[lang].sections)assert.ok(h&&b)}}});
test('public tracking uses only known routes and never arbitrary paths or queries',()=>{assert.equal(safeView('','/en/library/compare-models-fairly/'),'public/en/library/compare-models-fairly');assert.equal(safeView('','/en/library/private-email@example.com/'),null);assert.equal(safeView('#login','/en/'),null);assert.equal(safeView('','/en/?email=x'),null);assert.equal(publicRoute('/zh-hant/library/').locale,'zh-hant');});
test('all localized URLs contain prerendered content and reciprocal language links',async()=>{for(const locale of ['en','zh-hant'])for(const page of pages){const html=await readFile(`cloudflare-dist/client/${locale}/${page}${page?'/':''}index.html`,'utf8');assert.match(html,/<h1>/);assert.match(html,/rel="canonical"/);assert.match(html,/hreflang="en"/);assert.match(html,/hreflang="zh-Hant"/);assert.ok(!html.includes('<div id="root"></div>'));}});
