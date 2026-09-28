'use client';
import {useEffect,useMemo,useState} from 'react';

type USGame='powerball'|'megamillions';
type Draw={id:string;date:string;numbers:number[];special:number;multiplier:number|null};
type Dataset={schemaVersion:number;game:USGame;source:string;sourceUrl:string;officialGameUrl:string;retrievedAt:string;coverageStart:string;coverageEnd:string;count:number;draws:Draw[]};

const config={
 powerball:{name:'Powerball',main:'1–69',special:'Powerball 1–26',specialLabel:{en:'Powerball',zh:'Powerball'},draws:{en:'Mon · Wed · Sat',zh:'週一 · 週三 · 週六'}},
 megamillions:{name:'Mega Millions',main:'1–70',special:'Mega Ball 1–24',specialLabel:{en:'Mega Ball',zh:'Mega Ball'},draws:{en:'Tue · Fri',zh:'週二 · 週五'}}
} as const;

function validDataset(value:any,game:USGame):value is Dataset{
 if(!value||value.schemaVersion!==1||value.game!==game||!Array.isArray(value.draws)||value.count!==value.draws.length||!Number.isFinite(Date.parse(value.retrievedAt)))return false;
 const g=game==='powerball'?{main:69,special:26}:{main:70,special:24};
 return value.draws.every((d:any)=>typeof d.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d.date)&&Array.isArray(d.numbers)&&d.numbers.length===5&&new Set(d.numbers).size===5&&d.numbers.every((n:any)=>Number.isInteger(n)&&n>=1&&n<=g.main)&&Number.isInteger(d.special)&&d.special>=1&&d.special<=g.special);
}

export function USLotteryResults({locale='en',game}:{locale?:string;game:USGame}){
 const zh=locale==='zh-hant',t=(en:string,zhText:string)=>zh?zhText:en,g=config[game];
 const [data,setData]=useState<Dataset|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
 const [query,setQuery]=useState(''),[from,setFrom]=useState(''),[to,setTo]=useState(''),[page,setPage]=useState(0);
 useEffect(()=>{const ac=new AbortController();setLoading(true);setError(false);setData(null);fetch('/api/us-lottery/'+game,{signal:ac.signal,cache:'no-cache'}).then(async r=>{if(!r.ok)throw Error();const d=await r.json();if(!validDataset(d,game))throw Error();if(!ac.signal.aborted)setData(d)}).catch(e=>{if(e.name!=='AbortError'&&!ac.signal.aborted)setError(true)}).finally(()=>{if(!ac.signal.aborted)setLoading(false)});return()=>ac.abort()},[game,attempt]);
 const filtered=useMemo(()=>{const q=query.trim();return (data?.draws||[]).filter(d=>(!q||d.date.includes(q)||d.numbers.join(' ').includes(q)||String(d.special)===q)&&(!from||d.date>=from)&&(!to||d.date<=to))},[data,query,from,to]);
 const pages=Math.max(1,Math.ceil(filtered.length/20)),latest=data?.draws[0],stale=!!(data&&Date.now()-Date.parse(data.retrievedAt)>72*3600000),rangeError=!!(from&&to&&from>to);
 useEffect(()=>{setPage(0)},[query,from,to,game]);
 return <div className="us-lottery-results">
  <div className="page-heading"><div><div className="eyebrow">U.S. LOTTERY / OFFICIAL RESULTS</div><h1>{g.name}</h1><p>{t('Winning numbers and historical draws are refreshed automatically from a U.S. state gaming regulator open-data feed.','中獎號碼與歷史開獎資料會由美國州政府博弈監管機關的開放資料自動更新。')}</p></div></div>
  <div className="us-game-meta">
   <span><strong>{t('Number pools','號碼範圍')}</strong>{g.main} + {g.special}</span>
   <span><strong>{t('Draw days','開獎日')}</strong>{zh?g.draws.zh:g.draws.en}</span>
   <span><strong>{t('Access','使用方式')}</strong>{t('Results research only','開獎結果研究')}</span>
  </div>
  {loading&&<div className="callout" role="status">{t('Loading official draw results…','正在讀取正式開獎資料…')}</div>}
  {error&&<div className="error-message" role="alert">{t('Official results could not be loaded. This does not mean there was no drawing.','正式開獎資料暫時無法讀取；這不代表沒有開獎。')} <button className="btn" onClick={()=>setAttempt(x=>x+1)}>{t('Try again','重試')}</button></div>}
  {data&&latest&&<>
   <section className="panel us-latest-draw">
    <div className="panel-head"><div><p className="eyebrow">{t('LATEST INCLUDED DRAW','最新收錄')}</p><h2>{latest.date}</h2><p>{t('Numbers are displayed from the validated snapshot. Always check the official game before claiming a prize.','以下號碼來自驗證後快照；兌獎前仍應以官方遊戲公告為準。')}</p></div><span className={'badge '+(stale?'neutral':'')}>{stale?t('Refresh overdue','更新逾時'):t('Auto-updated','自動更新')}</span></div>
    <div className="panel-body us-latest-body"><div className="us-number-row">{latest.numbers.map(n=><span className="ball us-main-ball" key={n}>{String(n).padStart(2,'0')}</span>)}<span className={'ball us-special-ball '+game}>{String(latest.special).padStart(2,'0')}</span></div>{game==='powerball'&&latest.multiplier&&<p className="small">{t('Power Play','Power Play')} {latest.multiplier}x</p>}</div>
   </section>
   <section className="panel us-draw-history">
    <div className="panel-head"><div><h2>{t('Every draw in the current dataset','逐期中獎號碼')}</h2><p>{t('Search by date or number. Newest draws are shown first.','可依日期或號碼搜尋；最新一期置頂。')}</p></div></div>
    <div className="panel-body">
     <div className="us-lottery-filters">
      <label className="field">{t('Search','搜尋')}<input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('Date or number','日期或號碼')} maxLength={20}/></label>
      <label className="field">{t('From','開始日期')}<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label>
      <label className="field">{t('To','結束日期')}<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label>
      <button className="btn" onClick={()=>{setQuery('');setFrom('');setTo('')}}>{t('Clear','清除')}</button>
     </div>
     {rangeError?<div className="error-message">{t('Start date must not be after end date.','開始日期不能晚於結束日期。')}</div>:<>
      <p className="small us-result-count">{filtered.length} {t('draws','期')} · {t('page','第')} {page+1} / {pages}</p>
      <div className="us-draw-list">{filtered.slice(page*20,(page+1)*20).map(d=><article className="us-draw-row" key={d.id}><time dateTime={d.date}>{d.date}</time><div className="us-number-row compact">{d.numbers.map(n=><span className="ball small us-main-ball" key={n}>{String(n).padStart(2,'0')}</span>)}<span className={'ball small us-special-ball '+game}>{String(d.special).padStart(2,'0')}</span></div><div className="us-draw-extra">{game==='powerball'&&d.multiplier?'Power Play '+d.multiplier+'x':zh?g.specialLabel.zh:g.specialLabel.en}</div></article>)}</div>
      {!filtered.length&&<div className="dashboard-empty"><strong>{t('No matching draws','沒有符合條件的開獎紀錄')}</strong></div>}
      <div className="actions spaced"><button className="btn" disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))}>{t('Previous','上一頁')}</button><button className="btn" disabled={page+1>=pages} onClick={()=>setPage(p=>p+1)}>{t('Next','下一頁')}</button></div>
     </>}
    </div>
   </section>
   <section className="panel panel-body us-source-note"><h2>{t('Data source & refresh','資料來源與更新')}</h2><p>{t('Automated ingestion uses the New York State Gaming Commission dataset on NY Open Data. The site keeps a validated local snapshot so a source outage does not silently erase prior results.','自動擷取使用 New York State Gaming Commission 在 NY Open Data 的資料集；網站保存驗證後快照，來源暫時中斷時不會把既有結果靜默刪除。')}</p><p className="small">{t('Dataset coverage','資料涵蓋')}: {data.coverageStart} → {data.coverageEnd} · {data.count} {t('draws','期')}<br/>{t('Last successful retrieval','最近成功擷取')}: {new Date(data.retrievedAt).toLocaleString(zh?'zh-TW':'en-US',{timeZone:'Asia/Taipei'})} · Asia/Taipei</p><div className="actions"><a className="btn" href={data.sourceUrl} target="_blank" rel="noreferrer">{t('Government data source','政府資料來源')} ↗</a><a className="btn" href={data.officialGameUrl} target="_blank" rel="noreferrer">{t('Official game results','官方遊戲結果')} ↗</a></div><p className="small muted">{t('For results research only. Ticket availability, purchase rules, claim rules and taxes vary by jurisdiction. Official certified results prevail.','僅供開獎結果研究。彩券販售、購買、兌獎與稅務規則依各司法管轄區而異；正式認證結果以官方紀錄為準。')}</p></section>
  </>}
 </div>;
}
