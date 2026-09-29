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
 useEffect(()=>{let live=true;setError(false);fetch('/api/action-review',{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{if(live)setReview(d)}).catch(()=>{if(live)setError(true)});return()=>{live=false}},[attempt]);
 useEffect(()=>{let live=true;fetch('/api/action-models',{cache:'no-store'}).then(async r=>{if(r.status===403||r.status===401)return null;if(!r.ok)throw Error();return r.json()}).then(d=>{if(live&&d){setAdmin(true);setConfig(d.config)}}).catch(()=>{});return()=>{live=false}},[]);
 const modelMap=useMemo(()=>Object.fromEntries(ACTION_MODEL_LIBRARY.map(m=>[m.id,m])),[]);
 async function save(){
  if(!config||saving)return;setSaving(true);setNotice('');
  try{
   const next=normalizeActionConfig({...config,version:(config.version||1)+1,updatedAt:new Date().toISOString()});
   const r=await fetch('/api/action-models',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(next)});
   const d=await r.json();if(!r.ok)throw Error(d.error||'Save failed');setConfig(d.config);setNotice(t('Model configuration saved. Action review will use the new version on the next refresh.','模型設定已儲存；下一次重新整理 Action Review 時會使用新版本。'));setAttempt(x=>x+1);
  }catch(e:any){setNotice(e.message||t('Could not save model configuration.','模型設定無法儲存。'))}finally{setSaving(false)}
 }
 function updateModel(id:string,patch:any){setConfig((c:any)=>({...c,models:c.models.map((m:any)=>m.id===id?{...m,...patch}:m)}))}
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
    <div className="studio-actions"><button className="btn primary" disabled={saving} onClick={()=>void save()}>{saving?t('Saving…','儲存中…'):t('Save new model version','儲存新模型版本')}</button><button className="btn" onClick={()=>setConfig(DEFAULT_ACTION_CONFIG)}>{t('Load baseline draft','載入基準草稿')}</button>{notice&&<span role="status">{notice}</span>}</div>
    <p className="action-disclaimer">{t('Released mode is rejected unless the minimum enabled models are marked validated. Validation status should only be changed after chronological holdout, baseline, leakage and robustness checks are complete.','若未達到最少啟用模型且都標記為「已驗證」，後端會拒絕切換發布模式。只有完成時間序列樣本外、基準、資料洩漏與穩健性檢查後，才應更新驗證狀態。')}</p>
   </div>
  </details>}
 </section>;
}
