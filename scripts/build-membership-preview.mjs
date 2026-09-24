import {build} from 'vite';
import fs from 'node:fs/promises';
const out='cloudflare-dist/client/__membership-qa';
await build({configFile:false,publicDir:false,resolve:{alias:{'@':process.cwd()}},define:{'process.env.NODE_ENV':'"production"'},build:{outDir:out,emptyOutDir:true,lib:{entry:'tests/membership-fixture.tsx',name:'MembershipFixture',formats:['iife'],fileName:()=> 'fixture.js'},minify:true}});
let css='';for(const f of (await fs.readdir('cloudflare-dist/client/assets')).filter(x=>x.endsWith('.css')))css+=await fs.readFile('cloudflare-dist/client/assets/'+f,'utf8');
await fs.writeFile(out+'/fixture.css',css);
const inner='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/__membership-qa/fixture.css"><div id="root"></div><script src="/__membership-qa/fixture.js"></script></html>';
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
await fs.writeFile(out+'/index.html',`<!doctype html><html lang="en"><meta charset="utf-8"><title>QuantPath membership presentation checks</title><h1>Synthetic membership fixtures · no account access</h1><p>375 / 390 CSS pixels. No real member, payment or stored data.</p><div style="display:flex;gap:20px"><iframe title="375px test" srcdoc="${esc(inner)}" width="375" height="920"></iframe><iframe title="390px test" srcdoc="${esc(inner)}" width="390" height="920"></iframe></div></html>`);
