import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../app/recovery-readiness-card.tsx',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../app/recovery-readiness-card.css',import.meta.url),'utf8');
const publicSite=fs.readFileSync(new URL('../app/public-site.tsx',import.meta.url),'utf8');

test('methodology exposes the bilingual recovery evidence card',()=>{
 assert.match(publicSite,/RecoveryReadinessCard/);
 assert.match(source,/Recovery claims need restore evidence/);
 assert.match(source,/復原主張需要實際還原證據/);
 assert.match(source,/Version history, a successful build and a healthy database do not prove/);
});

test('live status fails closed and offers recovery',()=>{
 assert.match(source,/cache:'no-store'/);
 assert.match(source,/No readiness claim can be made/);
 assert.match(source,/Retry status check/);
 assert.match(source,/state\.data\?\.passed/);
 assert.match(source,/state\.data\?\.total/);
});

test('mobile layout collapses to one column',()=>{
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/\.recovery-gate-list li\{grid-template-columns:1fr\}/);
});
