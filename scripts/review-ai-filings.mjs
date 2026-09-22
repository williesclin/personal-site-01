// Only source URLs and short, original descriptions enter the product. Raw filings stay in scratch.
import {readFile,writeFile} from 'node:fs/promises';
const dir='/tmp/quantpath-ai50-audit',audit=JSON.parse(await readFile(`${dir}/audit.json`,'utf8'));
const results=[];
for(const r of audit.results){
 let html;try{html=await readFile(`${dir}/${r.symbol}-10k.html`,'utf8')}catch{const res=await fetch(r.filingURL,{headers:{'User-Agent':'QuantPathLabs/1.0 (+https://quantpathlabs.com)'},signal:AbortSignal.timeout(45000)});if(!res.ok)throw Error(`${r.symbol}: ${res.status}`);html=await res.text();await writeFile(`${dir}/${r.symbol}-10k.html`,html);await new Promise(r=>setTimeout(r,1100));}
 const text=html.replace(/<[^>]*>/g,' ').replace(/&[^;]+;/g,' ').replace(/\s+/g,' ');
 const matches=[...text.matchAll(/artificial intelligence|generative AI|machine learning|AI infrastructure/gi)].map(m=>text.slice(Math.max(0,m.index-160),m.index+330));
 results.push({symbol:r.symbol,url:r.filingURL,matches:matches.slice(0,5),count:matches.length});console.log(r.symbol,matches.length);
}
await writeFile(`${dir}/ai-evidence.json`,JSON.stringify(results,null,2));
