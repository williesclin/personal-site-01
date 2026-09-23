import {readFile,writeFile} from 'node:fs/promises';import {publicNewsPreview} from '../app/news-engine.mjs';
const data=JSON.parse(await readFile(new URL('../data/research-feed.json',import.meta.url),'utf8'));
await writeFile(new URL('../app/news-preview.generated.mjs',import.meta.url),'// Generated public NVIDIA-only preview. Never import the full feed in client code.\nexport const newsPreview='+JSON.stringify(publicNewsPreview(data),null,2)+';\n');
