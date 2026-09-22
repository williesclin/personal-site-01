// The small manifest pins the exact UTF-8 bytes of both repository snapshots.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateEquities} from '../app/equity-engine.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const rawEquities=await readFile(new URL('../data/equities.json',import.meta.url),'utf8');
const rawFeed=await readFile(new URL('../data/research-feed.json',import.meta.url),'utf8');
const equities=validateEquities(JSON.parse(rawEquities)),feed=JSON.parse(rawFeed);
if(hash(JSON.stringify(equities.companies))!==equities.hash)throw Error('Invalid financial hash');
if(feed.version!==1||!Array.isArray(feed.documents)||feed.documents.some(d=>!equities.companies.some(i=>d.symbols.includes(i.symbol))||!d.url.startsWith('https://www.sec.gov/Archives/')))throw Error('Invalid feed');
const manifest={version:1,equitiesSha256:hash(rawEquities),feedSha256:hash(rawFeed)};
await writeFile(new URL('../data/research-sync.json',import.meta.url),JSON.stringify(manifest)+'\n');console.log(JSON.stringify({...manifest,companies:equities.companies.length,documents:feed.documents.length}));
