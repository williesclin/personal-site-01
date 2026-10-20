import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const equity=await readFile(new URL('../app/equity-research.tsx',import.meta.url),'utf8');
const context=await readFile(new URL('../app/research-context.tsx',import.meta.url),'utf8');
const evidence=await readFile(new URL('../app/research-evidence.tsx',import.meta.url),'utf8');
const toolbox=await readFile(new URL('../app/research-toolbox.tsx',import.meta.url),'utf8');

for(const anchor of ['research-overview','financials','charts','market-context','funds','evidence','saved-research'])assert.ok((equity+context+evidence+toolbox).includes('id="'+anchor+'"')||equity.includes('href="#'+anchor+'"'),anchor);
for(const copy of ['Period change analyzer','Data coverage checker','Quick company-set presets','Guided research',"Today's Actions"])assert.ok(toolbox.includes(copy),copy);
assert.ok(equity.includes('eq-workspace-nav'));
assert.ok(equity.includes('eq-save-bar'));
assert.ok(equity.includes('eq-fund-table'));
assert.ok(evidence.includes('eq-evidence-summary'));
// One mount owns #evidence for both locales and access tiers. Duplicate mounts
// produced duplicate IDs, repeated copy and duplicate entitled evidence fetches.
assert.equal((equity.match(/<ResearchEvidence\b/g)||[]).length,1,'one evidence component per research workspace');
assert.ok(equity.indexOf('<ResearchEvidence')>equity.indexOf('id="funds"'),'sources follow funds, matching navigation order');
assert.ok(equity.includes('{!focused&&<ResearchEvidence'),'focused instrument pages retain their existing scope');
for(const locale of ['en','zh-hant']){
 const html=await readFile(new URL('../cloudflare-dist/client/'+locale+'/research/index.html',import.meta.url),'utf8');
 assert.equal((html.match(/id="evidence"/g)||[]).length,1,locale+' prerender has one evidence anchor');
 assert.ok(html.includes('href="#evidence"'),locale+' source navigation still resolves');
}
console.log('PASS: research workspace keeps navigation, compact save flow, comparison tools and progressive disclosure.');
