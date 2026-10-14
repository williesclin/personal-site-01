import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../app/research-data-status.tsx',import.meta.url),'utf8');
const page=fs.readFileSync(new URL('../app/public-site.tsx',import.meta.url),'utf8');

test('public research page renders one bilingual data verification card',()=>{
 assert.match(page,/ResearchDataStatus locale=\{locale\}/);
 for(const text of ['Availability is not the same as verification','可使用，不等於已完成驗證','PUBLIC PREVIEW','公開預覽','FULL RESEARCH DATA','完整研究資料','RESEARCH MEMBERSHIP','RESEARCH 會員'])assert.ok(source.includes(text),text);
});

test('verified state requires connection, record reconciliation and exact identity match',()=>{
 assert.match(source,/connected===true&&data\?\.researchWarehouse\?\.reconciliation\?\.match===true&&data\?\.researchWarehouse\?\.domains\?\.identityMatch===true/);
 assert.match(source,/billingEnabled===true&&data\?\.membershipRelease\?\.research\?\.releaseAllowed===true/);
 assert.doesNotMatch(source,/reason/);
});

test('status loading failure is explicit and recoverable',()=>{
 assert.match(source,/cache:'no-store'/);
 assert.match(source,/Retry status check/);
 assert.match(source,/重新核對狀態/);
 assert.match(source,/onClick=\{load\}/);
});
