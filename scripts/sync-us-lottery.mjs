import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';

export const US_GAMES={
 powerball:{dataset:'d6yy-54nr',start:'2015-10-07',mainMax:69,specialMax:26,source:'https://data.ny.gov/Government-Finance/Lottery-Powerball-Winning-Numbers-Beginning-2010/d6yy-54nr',official:'https://www.powerball.com/previous-results'},
 megamillions:{dataset:'5xaw-6ayf',start:'2025-04-08',mainMax:70,specialMax:24,source:'https://data.ny.gov/Government-Finance/Lottery-Mega-Millions-Winning-Numbers-Beginning-20/5xaw-6ayf',official:'https://www.megamillions.com/winning-numbers/last-25-drawings'}
};

function int(v){const n=Number(v);return Number.isInteger(n)?n:null}
export function normalizeUS(row,game){
 const g=US_GAMES[game];if(!g)throw Error('Unknown game');
 const date=String(row.draw_date||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Invalid draw date');
 let all=String(row.winning_numbers||'').trim().split(/\s+/).filter(Boolean).map(int);
 let numbers,special;
 if(game==='powerball'){
  if(all.length!==6||all.some(v=>v===null))throw Error('Invalid Powerball numbers '+date);
  numbers=all.slice(0,5);special=all[5];
 }else{
  if(all.length!==5||all.some(v=>v===null))throw Error('Invalid Mega Millions numbers '+date);
  numbers=all;special=int(row.mega_ball);
 }
 if(new Set(numbers).size!==5||numbers.some(n=>n<1||n>g.mainMax)||special===null||special<1||special>g.specialMax)throw Error('Out-of-range draw '+date);
 const multiplier=int(row.multiplier);
 return {id:date,date,numbers:[...numbers].sort((a,b)=>a-b),special,multiplier:multiplier&&multiplier>0?multiplier:null};
}
export function validateUSDraws(draws,game){
 if(!Array.isArray(draws)||!draws.length)throw Error('No draws');
 if(new Set(draws.map(d=>d.id)).size!==draws.length)throw Error('Duplicate draws');
 const g=US_GAMES[game];for(const d of draws){if(d.date<g.start)throw Error('Wrong game era');}
 return [...draws].sort((a,b)=>b.date.localeCompare(a.date));
}
async function fetchJSON(url){for(let n=0;n<3;n++){try{const r=await fetch(url,{headers:{'User-Agent':'QuantPathLabs/1.0 (+https://quantpathlabs.com)'},signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json();if(!Array.isArray(j))throw Error('Invalid response');return j}catch(e){if(n===2)throw e;await new Promise(r=>setTimeout(r,1500*(n+1)))}}}
export async function syncUS(game){
 const g=US_GAMES[game];const endpoint=new URL('https://data.ny.gov/resource/'+g.dataset+'.json');
 endpoint.searchParams.set('$limit','5000');endpoint.searchParams.set('$order','draw_date DESC');endpoint.searchParams.set('$where',`draw_date >= '${g.start}T00:00:00.000'`);
 const rows=await fetchJSON(endpoint);const draws=validateUSDraws(rows.map(row=>normalizeUS(row,game)),game);
 if(draws.length<100)throw Error('Incomplete '+game+' history');
 const now=new Date(),today=now.toISOString().slice(0,10);if(draws[0].date>today)throw Error('Future draw');
 const path='data/us-'+game+'.json';let old;try{old=JSON.parse(await readFile(path,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
 const ids=new Set(draws.map(d=>d.id));if(old?.draws?.some(d=>d.date>=g.start&&!ids.has(d.id)))throw Error('Source lost a previously published draw');
 const hash=createHash('sha256').update(JSON.stringify(draws)).digest('hex');
 const output={schemaVersion:1,game,source:'New York State Gaming Commission / NY Open Data',sourceUrl:g.source,officialGameUrl:g.official,retrievedAt:now.toISOString(),coverageStart:draws.at(-1).date,coverageEnd:draws[0].date,count:draws.length,sha256:hash,draws};
 await mkdir('data',{recursive:true});await writeFile(path+'.tmp',JSON.stringify(output));await rename(path+'.tmp',path);console.log(JSON.stringify({game,count:draws.length,start:output.coverageStart,end:output.coverageEnd,sha256:hash}));
}
if(process.argv[1]?.endsWith('sync-us-lottery.mjs')){let failed=false;for(const game of Object.keys(US_GAMES)){try{await syncUS(game)}catch(e){failed=true;console.error(game+': '+e.message)}}if(failed)process.exitCode=1;}
