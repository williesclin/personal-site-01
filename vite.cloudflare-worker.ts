import {defineConfig} from 'vite';
export default defineConfig({publicDir:false,build:{outDir:'cloudflare-dist/server',emptyOutDir:true,lib:{entry:'cloudflare/worker.ts',formats:['es'],fileName:'worker'},target:'es2022',minify:false}});
