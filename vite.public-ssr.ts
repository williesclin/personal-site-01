import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],build:{ssr:'app/public-site.tsx',outDir:'cloudflare-dist/prerender',emptyOutDir:true}});
