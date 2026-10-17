import React,{useCallback,useEffect,useState} from 'react';
import './recovery-readiness-card.css';

type GateStatus='passed'|'blocked'|'not_tested';
type Gate={id:string;status:GateStatus;label:Record<string,string>;detail:Record<string,string>};
type RecoveryReadiness={reviewedOn:string;ready:boolean;passed:number;total:number;gates:Gate[]};
type DataStatus={recoveryReadiness?:RecoveryReadiness};

export function RecoveryReadinessCard({locale}:{locale:string}){
 const zh=locale==='zh-hant',t=(en:string,cn:string)=>zh?cn:en;
 const [state,setState]=useState<{status:'loading'|'ready'|'error';data?:RecoveryReadiness}>({status:'loading'});
 const load=useCallback(()=>{
  setState({status:'loading'});
  fetch('/api/data-status',{headers:{accept:'application/json'},cache:'no-store'})
   .then(async response=>{if(!response.ok)throw new Error('status');return response.json() as Promise<DataStatus>})
   .then(data=>{if(!data.recoveryReadiness)throw new Error('missing');setState({status:'ready',data:data.recoveryReadiness})})
   .catch(()=>setState({status:'error'}));
 },[]);
 useEffect(load,[load]);
 const statusText=(status:GateStatus)=>status==='passed'?t('Verified','已驗證'):status==='blocked'?t('Blocked','受阻'):t('Not tested','未測試');
 return <section className="recovery-readiness-card" aria-labelledby="recovery-readiness-title">
  <p className="eyebrow">{t('RECOVERY EVIDENCE','復原證據')}</p>
  <div className="recovery-readiness-heading"><div><h2 id="recovery-readiness-title">{t('Recovery claims need restore evidence','復原主張需要實際還原證據')}</h2><p>{t('Version history, a successful build and a healthy database do not prove that data can be restored.','版本歷史、建置成功與資料庫健康，不等於資料可還原。')}</p></div>{state.status==='ready'&&<strong className={state.data?.ready?'ready':'pending'}>{state.data?.ready?t('Recovery-ready','復原就緒'):t('Not recovery-ready','尚未達復原就緒')}</strong>}</div>
  {state.status==='loading'?<p role="status">{t('Checking the published recovery evidence…','正在核對已發布的復原證據…')}</p>:state.status==='error'?<div className="recovery-readiness-error" role="status"><p>{t('The live recovery status could not be loaded. No readiness claim can be made until it is available.','目前無法載入復原狀態；在狀態恢復前，不應主張已達復原就緒。')}</p><button className="btn" type="button" onClick={load}>{t('Retry status check','重新核對狀態')}</button></div>:<><div className="recovery-readiness-score" role="status"><strong>{state.data?.passed} / {state.data?.total}</strong><span>{t('evidence gates verified','項證據門檻已驗證')} · {t('Reviewed','檢查日期')} {state.data?.reviewedOn}</span></div><ul className="recovery-gate-list">{state.data?.gates.map(gate=><li key={gate.id}><span className={`recovery-gate-status ${gate.status}`}>{statusText(gate.status)}</span><div><h3>{gate.label[locale]}</h3><p>{gate.detail[locale]}</p></div></li>)}</ul></>}
  <div className="recovery-readiness-actions"><a href={`/${locale}/coverage/`}>{t('Review current coverage','查看目前涵蓋範圍')}</a><a href={`/${locale}/pricing/`}>{t('Review release gates','查看發布門檻')}</a></div>
 </section>;
}
