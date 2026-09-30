import {readFile,writeFile,rename} from 'node:fs/promises';

const path=new URL('../data/digital-assets.json',import.meta.url),tmp=new URL('../data/digital-assets.json.tmp',import.meta.url);
const old=JSON.parse(await readFile(path,'utf8'));
const now=new Date().toISOString();
const clean=text=>text.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
async function page(url){const r=await fetch(url,{headers:{'User-Agent':'QuantPathLabs/1.0 (+https://quantpathlabs.com; issuer-transparency research)'},signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('HTTP '+r.status);return clean(await r.text());}
function money(text,label){
 const re=new RegExp(label+'[^$]{0,120}\\$\\s*([0-9]+(?:\\.[0-9]+)?)\\s*([BMT])','i'),m=text.match(re);if(!m)return null;
 const mult={B:1e9,M:1e6,T:1e12}[m[2].toUpperCase()];return Number(m[1])*mult;
}
function dateValue(text){
 const m=text.match(/As of\s+(?:Sep(?:tember)?|Sept)\.?\s+(\d{1,2}),\s*(20\d{2})/i);if(!m)return null;return m[2]+'-09-'+String(Number(m[1])).padStart(2,'0');
}
const next=structuredClone(old);next.reviewedAt=now.slice(0,10);
try{
 const circle=await page('https://www.circle.com/transparency');
 const circulation=money(circle,'In circulation'),reserves=money(circle,'Total Reserves'),asOf=dateValue(circle);
 if(!(circulation>0&&reserves>=circulation&&asOf))throw Error('Circle fields unavailable');
 Object.assign(next.stablecoins.USDC,{circulationUsd:circulation,reservesUsd:reserves,reserveAsOf:asOf,reserveStatus:'verified_issuer_snapshot',retrievedAt:now});
}catch(e){next.stablecoins.USDC.lastAttemptAt=now;next.stablecoins.USDC.refreshError=e.constructor?.name||'Error';}
try{
 const tether=await page('https://tether.to/en/transparency/');
 if(!/pegged at 1-to-1/i.test(tether.text)||!/(typically refreshed daily|typically published daily)/i.test(tether.text))throw Error('Tether transparency markers unavailable');
 Object.assign(next.stablecoins.USDT,{reserveStatus:'issuer_source_connected',retrievedAt:now});
}catch(e){next.stablecoins.USDT.lastAttemptAt=now;next.stablecoins.USDT.refreshError=e.constructor?.name||'Error';}
await writeFile(tmp,JSON.stringify(next,null,2)+'\n');await rename(tmp,path);
console.log(JSON.stringify({reviewedAt:next.reviewedAt,USDC:{asOf:next.stablecoins.USDC.reserveAsOf,circulation:next.stablecoins.USDC.circulationUsd,reserves:next.stablecoins.USDC.reservesUsd},USDT:{status:next.stablecoins.USDT.reserveStatus}}));
