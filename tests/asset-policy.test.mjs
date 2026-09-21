import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Workers Static Assets is asset-first. Testing worker.ts alone misses _headers.
const read = path => readFile(new URL('../'+path,import.meta.url),'utf8');
test('built static HTML policy matches the approved Worker analytics policy',async()=>{
  const worker=await read('cloudflare/worker.ts');
  const policy=worker.match(/h\.set\('Content-Security-Policy',"([^"]+)"\)/)?.[1];
  assert.ok(policy,'Worker must declare a CSP');
  for(const path of ['public/_headers','cloudflare-dist/client/_headers']){
    const actual=(await read(path)).match(/^\s*Content-Security-Policy:\s*(.+)$/m)?.[1];
    assert.equal(actual,policy,`${path}: static and Worker CSP must remain aligned`);
    const directives=Object.fromEntries(actual.split(';').map(s=>s.trim().split(/\s+/)).filter(s=>s[0]).map(([key,...values])=>[key,values]));
    assert.deepEqual(directives['script-src'],["'self'",'https://www.googletagmanager.com']);
    assert.deepEqual(directives['connect-src'],["'self'",'https://www.google-analytics.com','https://region1.google-analytics.com','https://www.googletagmanager.com']);
    for(const key of ['script-src','connect-src']) for(const denied of ['*',"'unsafe-inline'","'unsafe-eval'",'https:']) assert.ok(!directives[key].includes(denied));
    assert.deepEqual(directives['frame-ancestors'],["'none'"]);
    assert.deepEqual(directives['form-action'],["'self'"]);
  }
});
