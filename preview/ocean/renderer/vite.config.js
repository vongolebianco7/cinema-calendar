import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({base:'./',build:{lib:{entry:resolve(import.meta.dirname,'src/pages-entry.js'),formats:['es'],fileName:()=> 'ocean-pages.js'},rollupOptions:{output:{assetFileNames:'assets/[name][extname]'}}}});
