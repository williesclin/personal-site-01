// Build local component acceptance pages, never included in production output.
import {build} from 'vite';import fs from 'node:fs/promises';
const out=process.env.QP_FIXTURE_OUTPUT||'/tmp/quantpath-workspace-fixture';await fs.mkdir(out,{recursive:true});
await build({configFile:false,resolve:{alias:{'@':process.cwd()}},define:{'process.env.NODE_ENV':'"production"'},build:{outDir:out,emptyOutDir:false,lib:{entry:'tests/workspace-fixture.tsx',name:'WorkspaceFixture',formats:['iife'],fileName:()=> 'fixture.js'},minify:true}});
const assets='cloudflare-dist/client/assets';let css='';for(const f of (await fs.readdir(assets)).filter(x=>x.endsWith('.css')))css+=await fs.readFile(assets+'/'+f,'utf8');
await fs.writeFile(out+'/inner.html',`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="fixture.js"></script></html>`);
await fs.writeFile(out+'/index.html','<!doctype html><html lang="en"><meta charset="utf-8"><title>QuantPath responsive fixture — synthetic only</title><h1>375px / 390px · local component checks</h1><p>These frames test layout and component behavior. They do not authenticate or write account data.</p><div style="display:flex;gap:24px"><iframe title="375px test" src="inner.html" width="375" height="850"></iframe><iframe title="390px test" src="inner.html" width="390" height="850"></iframe></div></html>');
console.log(out);
