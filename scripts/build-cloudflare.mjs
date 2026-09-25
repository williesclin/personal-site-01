import {spawnSync} from 'node:child_process';
const preview=spawnSync(process.execPath,['scripts/build-news-preview.mjs'],{stdio:'inherit'});if(preview.status!==0)process.exit(preview.status??1);
for(const config of ['vite.cloudflare-client.ts','vite.cloudflare-worker.ts','vite.public-ssr.ts']){
 const r=spawnSync(process.execPath,['node_modules/vite/bin/vite.js','build','--config',config],{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);
}

const pages=spawnSync(process.execPath,['scripts/prerender-public.mjs'],{stdio:'inherit'});if(pages.status!==0)process.exit(pages.status??1);
