'use client';
import {useEffect,useState} from 'react';

export function ResearchWarehouseStatus({locale}:{locale:string}){
 const zh=locale==='zh-hant',t=(en:string,cn:string)=>zh?cn:en;
 const [data,setData]=useState<any>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const load=()=>{setError('');fetch('/api/research-warehouse-status',{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'Load failed');setData(d)}).catch(e=>setError(e.message||'Load failed'))};
 useEffect(()=>{load()},[]);
 async function sync(){if(busy)return;setBusy(true);setError('');try{const r=await fetch('/api/research-warehouse-sync',{method:'POST'});const d=await r.json();if(!r.ok)throw Error(d.error||'Sync failed');await load();}catch(e:any){setError(e.message||'Sync failed')}finally{setBusy(false)}}
 const rows=data?.datasets||[];
 const grouped=Object.entries(rows.reduce((acc:any,row:any)=>{(acc[row.domain]??=[]).push(row);return acc},{}));
 const fmtDate=(v:string|null)=>v?new Intl.DateTimeFormat(zh?'zh-TW':'en-US',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v)):'—';
 return <section className="panel">
  <div className="panel-head"><div><h2>{t('Research warehouse','研究資料庫')}</h2><p>{t('Shared research data is separated from member/auth data and grouped by domain.','共用研究資料與會員／登入資料分離，並依資料域分類。')}</p></div><button className="btn" disabled={busy} onClick={()=>void sync()}>{busy?t('Syncing…','同步中…'):t('Sync now','立即同步')}</button></div>
  {error&&<div className="error-message">{error}</div>}
  {!data?<div className="panel-body">{t('Loading warehouse status…','載入資料庫狀態…')}</div>:<div className="panel-body">
   <div className="stats-grid">{[['catalog',t('Catalog','目錄')],['fundamental',t('Fundamentals','財報')],['macro',t('Macro','總經')],['market',t('Market prices','行情')]].map(([domain,label])=>{const rs=rows.filter((x:any)=>x.domain===domain),count=rs.reduce((n:number,x:any)=>n+Number(x.record_count||0),0),blocked=rs.some((x:any)=>x.status==='blocked');return <div className="stat-card" key={domain}><div className="stat-head">{label}</div><div className="stat-value">{count.toLocaleString()}</div><div className="stat-foot">{blocked?t('Blocked / review required','受阻／待確認'):t('Stored rows','已儲存筆數')}</div></div>})}</div>
   <div className="table-wrap"><table className="data-table"><thead><tr><th>{t('Domain','分類')}</th><th>{t('Dataset','資料集')}</th><th>{t('Status','狀態')}</th><th>{t('Rows','筆數')}</th><th>{t('Coverage','範圍')}</th><th>{t('Rights','使用權')}</th></tr></thead><tbody>{grouped.flatMap(([domain,items]:any)=>items.map((row:any)=><tr key={row.dataset_key}><td>{domain}</td><td><strong>{row.dataset_key}</strong><small>{row.last_retrieved_at?fmtDate(row.last_retrieved_at):'—'}</small></td><td><span className={'badge '+(row.status==='blocked'?'amber':row.status==='ready'?'':'neutral')}>{row.status}</span></td><td>{Number(row.record_count||0).toLocaleString()}</td><td>{row.coverage_start||'—'} → {row.coverage_end||'—'}</td><td>{row.rights_status||'—'}</td></tr>))}</tbody></table></div>
   <p className="small muted">{t('Market-price rows remain empty until a provider with approved commercial display / redistribution rights is connected. Other verified numeric datasets are stored in the research database.','行情資料在取得可供商業展示／再散布的供應商授權前維持空白；其他已驗證數值資料已儲存在研究資料庫。')}</p>
   {data.runs?.[0]&&<p className="small muted">{t('Last full sync','最近完整同步')}: {fmtDate(data.runs[0].completed_at)} · {data.runs[0].status} · {Number(data.runs[0].record_count||0).toLocaleString()} {t('rows','筆')}</p>}
  </div>}
 </section>;
}
