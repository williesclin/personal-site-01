import {useEffect,useState} from 'react';
export function ResearchEvidence({locale,full}:{locale:string;full:boolean}){
 const t=(a:string,b:string)=>locale==='zh-hant'?b:a;
 const [data,setData]=useState<any>(null),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{if(!full)return;const ac=new AbortController();setFailed(false);fetch('/api/research-evidence',{signal:ac.signal}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(setData).catch(e=>{if(e.name!=='AbortError')setFailed(true)});return()=>ac.abort()},[full,attempt]);
 return <section className="eq-section"><h2>{t('News, attention & AI readiness','新聞、聲量與 AI 準備狀態')}</h2>
 <div className="eq-scroll" tabIndex={0}><table><thead><tr><th>{t('Plan','方案')}</th><th>{t('Research dimensions','研究維度')}</th><th>{t('Current status','目前狀態')}</th></tr></thead><tbody>
 <tr><th>Free</th><td>{t('NVIDIA: 3 annual periods, 3 metrics; IVV preview','NVIDIA 三年度、三指標；IVV 預覽')}</td><td>{t('Public preview; verified sign-in unlocks free lottery tools','公開預覽；驗證登入後免費使用樂透工具')}</td></tr>
 <tr><th>Research</th><td>{t('50 companies, 14 financial dimensions, line/bar/scatter charts, source news, 30 watchlist symbols / 5 saved conditions','50 家公司、14 個財務維度、折線／長條／散佈圖、來源新聞、30 標的／5 組條件')}</td><td>{t('Requires an effective membership; subscriptions are not on sale','需有效會員资格；訂閱尚未銷售')}</td></tr>
 <tr><th>Pro</th><td>{t('Research + 200 symbols / 30 conditions; AI classification, risk and alerts after validation','Research 加 200 標的／30 組條件；AI 分類、風險與警示須驗證後提供')}</td><td>{t('Advanced AI not released; no accuracy or return promise','進階 AI 尚未發布，不承諾準確率或報酬')}</td></tr>
 </tbody></table></div>
 <p>{t('News article counts describe the monitored sources, not people, social reach or market-wide attention. Social feeds and sentiment models are not connected. No email, push or trading alerts are sent.','新聞篇數只描述已觀測來源，不是人數、社群觸及或全市場聲量。社群來源與情緒模型尚未接入；不發送 Email、推播或交易提醒。')}</p>
 {!full?<p>{t('Source records are available within the member research service.','來源紀錄於會員研究服務內提供。')}</p>:failed?<p role="alert">{t('Evidence could not be loaded.','來源紀錄無法載入。')} <button className="btn" onClick={()=>setAttempt(n=>n+1)}>{t('Retry','重試')}</button></p>:!data?<p role="status">{t('Loading evidence…','載入來源紀錄…')}</p>:<>
 <p className="eq-meta">{t('Latest recorded ingestion','最近入庫')} {data.ingestion?.recorded_at||'—'} · {t('Partial source coverage; historical filings were backfilled, not observed in real time.','來源覆蓋不完整；歷史申報為回補，不是當時即時觀測。')}</p>
 <div className="eq-cards">{data.documents.map((d:any)=><article key={d.id} className="eq-card"><small>{d.kind==='news'?t('Issuer news','發行人新聞'):t('Annual filing','年度申報')} · {d.published_on}</small><h3><a href={d.canonical_url} target="_blank" rel="noreferrer">{d.title}</a></h3><p>{d.summary[locale==='zh-hant'?'zh-hant':'en']}</p><small>{t('First recorded','首次記錄')} {d.first_seen_at}</small></article>)}</div>
 </>}
 </section>;
}
