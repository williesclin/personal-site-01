import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const endpoint='https://api.taiwanlottery.com/TLCAPIWeB/Lottery/Lotto649Result';
const tiers=['jackpotAssign','secondAssign','thirdAssign','fourthAssign','fifthAssign','sixthAssign','seventhAssign','normalAssign'];
export function normalize(row){
 const nums=row.drawNumberSize,date=row.lotteryDate?.slice(0,10),id=String(row.period);
 if(!/^\d{9}$/.test(id)||!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||new Date(date).toISOString().slice(0,10)!==date||!Array.isArray(nums)||nums.length!==7||new Set(nums).size!==7||!nums.every(n=>Number.isInteger(n)&&n>=1&&n<=49))throw Error('Invalid draw '+id);
 const prizes=tiers.map(key=>{const p=row[key];if(!p||![p.winnerCount,p.perPrize].every(v=>Number.isSafeInteger(v)&&v>=0))throw Error('Invalid prize '+id);return [p.winnerCount,p.perPrize]});
 return {id,date,numbers:nums.slice(0,6).sort((a,b)=>a-b),special:nums[6],prizes};
}
export function validateDraws(draws){
 if(new Set(draws.map(d=>d.id)).size!==draws.length)throw Error('Duplicate periods');
 const byYear=new Map();for(const d of draws){const y=d.id.slice(0,3);const a=byYear.get(y)||[];a.push(Number(d.id.slice(3)));byYear.set(y,a);}
 for(const a of byYear.values()){a.sort((x,y)=>x-y);for(let i=1;i<a.length;i++)if(a[i]!==a[i-1]+1)throw Error('Missing period within year');}
 return [...draws].sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
}
async function get(url){for(let n=0;n<3;n++){try{const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json();if(j.rtCode!==0||!Array.isArray(j.content?.lotto649Res))throw Error('Official data unavailable');return j.content;}catch(e){if(n===2)throw e;await new Promise(r=>setTimeout(r,1500*(n+1)));}}}
export async function sync(){
 const now=new Date(),end=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit'}).format(now).slice(0,7);
 // Keep all history from 2022; do not roll old draws off the dataset.
 const all=[],requests=[];let total=null;
 for(let page=1;page<=50;page++){const u=new URL(endpoint);for(const [k,v] of Object.entries({month:'2022-01',endMonth:end,pageNum:String(page),pageSize:'200'}))u.searchParams.set(k,v);const c=await get(u);requests.push(u.href);if(total===null)total=c.totalSize;if(total!==c.totalSize)throw Error('Source changed during pagination; retry next run');all.push(...c.lotto649Res.map(normalize));if(all.length>=total)break;if(!c.lotto649Res.length)throw Error('Incomplete source pagination');await new Promise(r=>setTimeout(r,800));}
 if(all.length!==total||all.length<500)throw Error('Incomplete backfill');
 const draws=validateDraws(all);if(draws.some(d=>d.date>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei'}).format(now)))throw Error('Future draw');
 const path='public/data/lotto649.json';let old;try{old=JSON.parse(await readFile(path,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;}
 const ids=new Set(draws.map(d=>d.id));if(old?.draws.some(d=>!ids.has(d.id)))throw Error('Source lost previously published periods');
 const hash=createHash('sha256').update(JSON.stringify(draws)).digest('hex');
 const output={schemaVersion:1,game:'lotto',source:'Taiwan Lottery',sourceUrl:'https://www.taiwanlottery.com/lotto/result/lotto649/',retrievedAt:now.toISOString(),coverageStart:draws.at(-1).date,coverageEnd:draws[0].date,count:draws.length,sha256:hash,requests,draws};
 await mkdir('public/data',{recursive:true});await writeFile(path+'.tmp',JSON.stringify(output));await rename(path+'.tmp',path);console.log(JSON.stringify({count:draws.length,start:output.coverageStart,end:output.coverageEnd,sha256:hash}));
}
if(process.argv[1]?.endsWith('sync-lottery.mjs'))await sync();
