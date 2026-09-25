// Optional local QA only. This output is NEVER copied into cloudflare-dist.
import {build} from 'vite';import fs from 'node:fs/promises';
const out=process.env.QP_FIXTURE_OUTPUT||'/tmp/quantpath-phase2-fixture';await fs.mkdir(out,{recursive:true});
await build({configFile:false,resolve:{alias:{'@':process.cwd()}},define:{'process.env.NODE_ENV':'"production"'},build:{outDir:out,emptyOutDir:false,lib:{entry:'tests/phase2-fixture.tsx',name:'Phase2Fixture',formats:['iife'],fileName:()=> 'fixture.js'},minify:true}});
let css='';for(const f of (await fs.readdir('cloudflare-dist/client/assets')).filter(x=>x.endsWith('.css')))css+=await fs.readFile('cloudflare-dist/client/assets/'+f,'utf8');
const inner=`<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="fixture.js"></script></html>`;await fs.writeFile(out+'/inner.html',inner);
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
await fs.writeFile(out+'/index.html',`<!doctype html><html lang="en"><meta charset="utf-8"><title>QuantPath Phase 2 layout acceptance</title><h1>375px / 390px · synthetic acceptance</h1><p>Synthetic numbers and controlled state only. No real session, API, member records or financial feed.</p><div style="display:flex;gap:24px"><iframe title="375px test" srcdoc="${esc(inner)}" width="375" height="1000"></iframe><iframe title="390px test" srcdoc="${esc(inner)}" width="390" height="1000"></iframe></div></html>`);
