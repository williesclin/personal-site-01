import {spawnSync} from 'node:child_process';
for(const config of ['vite.cloudflare-client.ts','vite.cloudflare-worker.ts']){
 const r=spawnSync(process.execPath,['node_modules/vite/bin/vite.js','build','--config',config],{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);
}
