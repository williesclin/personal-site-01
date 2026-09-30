'use client';
import {useEffect,useMemo,useState} from 'react';
import {ACTION_MODEL_LIBRARY,DEFAULT_ACTION_CONFIG,normalizeActionConfig} from './action-engine.mjs';
import './action-decision.css';

const labels={
 'add-review':['Add review','加碼研究'],
 hold:['Hold review','持有檢視'],
 'trim-review':['Trim review','減碼檢視'],
 'exit-review':['Exit review','退出檢視'],
 watch:['Watch','觀察'],
 opportunity:['Opportunity','機會'],
 'no-action':['No released action','尚無發布動作']
};
export function ActionDecisionCenter({locale,go}:{locale:string;go:(v:any)=>void}){
 const zh=locale==='zh-hant',t=(en:string,zhText:string)=>zh?zhText:en;
 const [review,setReview]=useState<any>(null),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
 const [admin,setAdmin]=useState(false),[config,setConfig]=useState<any>(null),[saving,setSaving]=useState(false),[notice,setNotice]=useState('');
 const [learning,setLearning]=useState<any>(null),[running,setRunning]=useState(false),[importing,setImporting]=useState(false);
 useEffect(()=>{let live=true;setError(false);fetch('/api/action-review',{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{if(live)setReview(d)}).catch(()=>{if(live)setError(true)});return()=>{live=false}},[attempt]);
 useEffect(()=>{let live=true;fetch('/api/action-models',{cache:'no-store'}).then(async r=>{if(r.status===403||r.status===401)return null;if(!r.ok)throw Error();return r.json()}).then(d=>{if(live&&d){setAdmin(true);setConfig(d.config);fetch('/api/action-learning-status',{cache:'no-store'}).then(x=>x.ok?x.json():null).then(s=>{if(live&&s)setLearning(s)}).catch(()=>{})}}).catch(()=>{});return()=>{live=false}},[]);
 const modelMap=useMemo(()=>Object.fromEntries(ACTION_MODEL_LIBRARY.map(m=>[m.id,m])),[]);
 async function save(){
  if(!config||saving)return;setSaving(true);setNotice('');
  try{
   const next=normalizeActionConfig({...config,updatedAt:new Date().toISOString()});
   const r=await fetch('/api/action-models',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(next)});
   const d=await r.json();if(!r.ok)throw Error(d.error||'Save failed');setConfig(d.config);setNotice(t('Model configuration saved. Action review will use the new version on the next refresh.','模型設定已儲存；下一次重新整理 Action Review 時會使用新版本。'));setAttempt(x=>x+1);
  }catch(e:any){setNotice(e.message||t('Could not save model configuration.','模型設定無法儲存。'))}finally{setSaving(false)}
 }
 function updateModel(id:string,patch:any){setConfig((c:any)=>({...c,models:c.models.map((m:any)=>m.id===id?{...m,...patch}:m)}))}
 async function refreshLearning(){const r=await fetch('/api/action-learning-status',{cache:'no-store'});if(r.ok)setLearning(await r.json())}
 async function runLearning(){if(running)return;setRunning(true);setNotice('');try{const r=await fetch('/api/action-learning-run',{method:'POST'});const d=await r.json();if(!r.ok)throw Error(d.error||'Learning run failed');setNotice(t(`Daily learning run completed: ${d.snapshotCount} shadow snapshots, ${d.evaluatedCount} outcome evaluations.`,`每日學習已完成：${d.snapshotCount} 筆影子快照、${d.evaluatedCount} 筆結果評估。`));await refreshLearning();setAttempt(x=>x+1)}catch(e:any){setNotice(e.message||t('Learning run failed.','每日學習執行失敗。'))}finally{setRunning(false)}}
 async function importMarketFile(file:File|null){if(!file||importing)return;setImporting(true);setNotice('');try{if(file.size>1048576)throw Error(t('File must be smaller than 1 MB.','檔案需小於 1 MB。'));const parsed=JSON.parse(await file.text());const r=await fetch('/api/action-market-import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(parsed)});const d=await r.json();if(!r.ok)throw Error(d.error||'Import failed');setNotice(t(`Imported ${d.count} market observations. Rights status: ${d.rightsStatus}.`,`已匯入 ${d.count} 筆市場觀測；權利狀態：${d.rightsStatus}。`));await refreshLearning()}catch(e:any){setNotice(e.message||t('Market data import failed.','市場資料匯入失敗。'))}finally{setImporting(false)}}
 return <section className="action-center">
  <div className="action-heading"><div><span className="eyebrow">ACTION INTELLIGENCE</span><h2>{t("Today's decision queue","今天的決策佇列")}</h2><p>{t('Start from what deserves attention, then open the evidence. No trade action is released unless enough validated models agree.','先看今天哪些標的值得處理，再打開證據；只有足夠且已驗證的模型一致時，才允許發布動作。')}</p></div><button className="btn" onClick={()=>setAttempt(x=>x+1)}>{t('Refresh','重新整理')}</button></div>
  {error?<div className="action-empty"><strong>{t('Action review is unavailable.','Action Review 目前無法讀取。')}</strong><button className="btn" onClick={()=>setAttempt(x=>x+1)}>{t('Retry','重試')}</button></div>:!review?<div className="action-empty">{t('Building today’s review queue…','正在建立今天的研究佇列…')}</div>:<>
   <div className="action-status-row"><span className={'action-mode '+review.mode}>{review.mode==='released'?t('Released','已發布'):t('Shadow mode','影子模式')}</span><span>{t('Config version','設定版本')} v{review.configVersion}</span><span>{t('Minimum validated models','最少已驗證模型')} {review.thresholds.minimumModels}</span><span>{t('Outcome learning','結果學習')}: {review.outcomeTracking.ready?t('Ready','已就緒'):t('Pending market/portfolio outcome data','等待行情／投資組合結果資料')}</span></div>
   {review.rows.length===0?<div className="action-empty"><strong>{t('No symbols are in your research watchlist yet.','你的研究觀察清單目前沒有標的。')}</strong><button className="btn primary" onClick={()=>go('equities')}>{t('Choose investments','選擇投資標的')}</button></div>:<div className="action-list">{review.rows.slice(0,12).map((row:any)=><article className="action-row" key={row.symbol}>
    <div className="action-symbol"><strong>{row.symbol}</strong><span className={'action-badge '+row.action}>{labels[row.action]?.[zh?1:0]||row.action}</span></div>
    <div className="action-summary"><strong>{row.enoughEvidence?t('Validated model coverage is sufficient for the release gate.','已驗證模型覆蓋已達發布門檻。'):t('Evidence gate not met — keep this as research, not a trade instruction.','證據門檻尚未達成——保留為研究，不作交易指令。')}</strong><small>{row.nextStep}</small><div className="model-chips">{row.signals.map((s:any)=><span key={s.id} className={s.available&&s.status==='validated'?'ready':''}>{modelMap[s.id]?.label?.[zh?'zh':'en']||s.id} · {s.status}{s.score!=null?' · '+s.score:''}</span>)}</div></div>
    <div className="action-score"><strong>{row.score??'—'}</strong><small>{t('consensus','共識')}</small><span>{row.availableModels}/{row.totalModels} {t('validated','已驗證')}</span></div>
    <button className="btn" onClick={()=>go('equities')}>{t('Open evidence','查看證據')}</button>
   </article>)}</div>}
   <p className="action-disclaimer">{t('Research actions are evidence-review states, not personalized investment advice. In shadow mode the system deliberately withholds buy/sell outputs while models and outcome evaluation are incomplete.','研究動作是證據檢視狀態，不是個人化投資建議。影子模式會在模型與結果評估尚未完整時刻意不發布買賣輸出。')}</p>
  </>}
  {admin&&config&&<details className="model-studio">
   <summary><span><strong>{t('AI Model Studio','AI 模型工作室')}</strong><small>{t('Administrator controls for model weights, validation state and release gate. Changes are versioned.','管理員可調整模型權重、驗證狀態與發布門檻；每次修改都保留版本。')}</small></span><span>v{config.version}</span></summary>
   <div className="model-studio-body">
    <div className="studio-grid">{config.models.map((m:any)=>{const meta=modelMap[m.id];return <div className="model-control" key={m.id}><div><strong>{meta?.label?.[zh?'zh':'en']||m.id}</strong><small>{meta?.purpose?.[zh?'zh':'en']}</small></div><label>{t('Weight','權重')}<input type="number" min="0" max="100" value={m.weight} onChange={e=>updateModel(m.id,{weight:Number(e.target.value)})}/></label><label>{t('Status','狀態')}<select value={m.status} onChange={e=>updateModel(m.id,{status:e.target.value})}><option value="draft">{t('Draft','草稿')}</option><option value="shadow">{t('Shadow test','影子測試')}</option><option value="validated">{t('Validated','已驗證')}</option></select></label><label className="model-toggle"><input type="checkbox" checked={m.enabled} onChange={e=>updateModel(m.id,{enabled:e.target.checked})}/>{t('Enabled','啟用')}</label></div>})}</div>
    <div className="studio-thresholds"><label>{t('Minimum models','最少模型')}<input type="number" min="2" max="6" value={config.thresholds.minimumModels} onChange={e=>setConfig({...config,thresholds:{...config.thresholds,minimumModels:Number(e.target.value)}})}/></label><label>{t('Minimum confidence','最低信心')}<input type="number" min="50" max="95" value={config.thresholds.minimumConfidence} onChange={e=>setConfig({...config,thresholds:{...config.thresholds,minimumConfidence:Number(e.target.value)}})}/></label><label>{t('Release mode','發布模式')}<select value={config.mode} onChange={e=>setConfig({...config,mode:e.target.value})}><option value="shadow">{t('Shadow only','只做影子測試')}</option><option value="released">{t('Released action','發布 Action')}</option></select></label></div>
    <label className="studio-note">{t('Model change note','模型修改備註')}<textarea maxLength={1000} value={config.note||''} onChange={e=>setConfig({...config,note:e.target.value})}/></label>
    <div className="learning-loop-card"><div><span className="eyebrow">LEARNING LOOP</span><h3>{t('Outcome learning & model improvement','結果學習與模型改善')}</h3><p>{t('Daily shadow snapshots are stored first. Only verified, rights-approved market observations can mature 7/30/90/180-day outcomes. Weight changes become candidates for review; they never overwrite a released model automatically.','每天先保存影子決策快照；只有已驗證且權利允許的市場資料，才能形成 7／30／90／180 天結果。權重調整只會形成候選版本供審核，不會自動覆寫已發布模型。')}</p></div>{learning&&<div className="learning-metrics"><span><strong>{learning.snapshots}</strong>{t('Snapshots','快照')}</span><span><strong>{learning.evaluatedSnapshots}</strong>{t('Complete outcomes','完整結果')}</span><span><strong>{learning.approvedMarketObservations}</strong>{t('Approved market rows','核准行情')}</span><span><strong>{learning.candidates}</strong>{t('Pending candidates','待審候選')}</span></div>}<p className="learning-reason">{learning?.reason||t('Checking learning-loop readiness…','正在確認學習迴圈狀態…')}</p><div className="studio-actions"><button className="btn" disabled={running} onClick={()=>void runLearning()}>{running?t('Running…','執行中…'):t('Run learning now','立即執行學習')}</button><label className="btn market-import">{importing?t('Importing…','匯入中…'):t('Import verified market JSON','匯入已驗證市場 JSON')}<input type="file" accept="application/json,.json" disabled={importing} onChange={e=>void importMarketFile(e.target.files?.[0]||null)}/></label></div><small>{t('Imported market files must include source, adjusted close, currency and session date. Rights default to review_required unless explicitly approved.','匯入市場資料需包含來源、調整後收盤價、幣別與交易日；若未明確核准使用權，預設為 review_required，不會進入模型結果評估。')}</small></div>
    <div className="studio-actions"><button className="btn primary" disabled={saving} onClick={()=>void save()}>{saving?t('Saving…','儲存中…'):t('Save new model version','儲存新模型版本')}</button><button className="btn" onClick={()=>setConfig(DEFAULT_ACTION_CONFIG)}>{t('Load baseline draft','載入基準草稿')}</button>{notice&&<span role="status">{notice}</span>}</div>
    <p className="action-disclaimer">{t('A validated label alone cannot release an action. The server also requires benchmark-adjusted 90-day evidence across at least 30 samples, 20 dates and 10 symbols for the minimum number of models. Validation should follow chronological holdout, baseline, leakage and robustness checks.','只把狀態標成「已驗證」不能發布 Action。伺服器還會要求最少模型數各自具備基準調整後的 90 天證據，且至少涵蓋 30 個樣本、20 個日期與 10 檔標的；驗證仍須完成時間序列樣本外、基準、資料洩漏與穩健性檢查。')}</p>
   </div>
  </details>}
 </section>;
}
