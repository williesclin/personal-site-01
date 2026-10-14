import React,{useCallback,useEffect,useState} from 'react';
import './research-data-status.css';

type DataStatus={
 equities?:{retrievedAt?:string;companies?:number};
 research?:{retrievedAt?:string;filingObservations?:number;observedIssuers?:number};
 researchWarehouse?:{connected?:boolean;reconciliation?:{match?:boolean};domains?:{identityMatch?:boolean}};
 membershipRelease?:{billingEnabled?:boolean;research?:{passed?:number;total?:number;releaseAllowed?:boolean}};
};

const formatDate=(value:string|undefined,locale:string)=>{
 if(!value)return null;
 const date=new Date(value);
 if(Number.isNaN(date.getTime()))return null;
 return new Intl.DateTimeFormat(locale==='zh-hant'?'zh-TW':'en',{dateStyle:'medium',timeZone:'Asia/Taipei'}).format(date);
};

export function ResearchDataStatus({locale}:{locale:string}){
 const zh=locale==='zh-hant',t=(en:string,cn:string)=>zh?cn:en;
 const [state,setState]=useState<{status:'loading'|'ready'|'error';data?:DataStatus}>({status:'loading'});
 const load=useCallback(()=>{
  setState({status:'loading'});
  fetch('/api/data-status',{headers:{accept:'application/json'},cache:'no-store'})
   .then(async response=>{if(!response.ok)throw new Error('status');return response.json()})
   .then(data=>setState({status:'ready',data}))
   .catch(()=>setState({status:'error'}));
 },[]);
 useEffect(load,[load]);
 const data=state.data,previewDate=formatDate(data?.equities?.retrievedAt,locale),evidenceDate=formatDate(data?.research?.retrievedAt,locale);
 const warehouseVerified=data?.researchWarehouse?.connected===true&&data?.researchWarehouse?.reconciliation?.match===true&&data?.researchWarehouse?.domains?.identityMatch===true;
 const researchOpen=data?.membershipRelease?.billingEnabled===true&&data?.membershipRelease?.research?.releaseAllowed===true;
 return <section className="research-data-status" aria-labelledby="research-data-status-title">
  <div className="research-data-status-heading"><div><p className="eyebrow">{t('DATA VERIFICATION','資料驗證')}</p><h2 id="research-data-status-title">{t('Availability is not the same as verification','可使用，不等於已完成驗證')}</h2></div><a href={`/${locale}/methodology/`}>{t('How verification works','了解驗證方法')} →</a></div>
  {state.status==='loading'?<p role="status">{t('Checking the latest published status…','正在核對最新公開狀態…')}</p>:state.status==='error'?<div className="research-status-error" role="status"><p>{t('The live status could not be loaded. The preview may still work, but freshness and full-data verification cannot be confirmed right now.','目前無法載入即時狀態。公開預覽可能仍可使用，但此刻無法確認資料新鮮度與完整資料驗證結果。')}</p><button className="btn" type="button" onClick={load}>{t('Retry status check','重新核對狀態')}</button></div>:<div className="research-status-grid">
   <article><span className="status-dot ready" aria-hidden="true"/><p className="eyebrow">{t('PUBLIC PREVIEW','公開預覽')}</p><h3>{t('Available','可使用')}</h3><p>{t(`${data?.equities?.companies??'—'} company profiles; public figures remain limited to the named preview instruments.`,`${data?.equities?.companies??'—'} 家公司資料頁；公開財務數字仍限於明示的預覽標的。`)}</p><small>{previewDate?t('Snapshot dated '+previewDate,'快照日期 '+previewDate):t('Snapshot date unavailable','無法取得快照日期')}</small></article>
   <article><span className={`status-dot ${warehouseVerified?'ready':'pending'}`} aria-hidden="true"/><p className="eyebrow">{t('FULL RESEARCH DATA','完整研究資料')}</p><h3>{warehouseVerified?t('Verified','已驗證'):t('Verification pending','尚待驗證')}</h3><p>{warehouseVerified?t('The private dataset is connected and its expected records and identities match.','私有資料集已連接，預期紀錄與資料身分均相符。'):t('The public evidence feed is current, but the private full dataset has not passed connection and exact-identity reconciliation.','公開證據資料已更新，但私有完整資料集尚未通過連接與精確資料身分核對。')}</p><small>{evidenceDate?t('Public evidence dated '+evidenceDate,'公開證據日期 '+evidenceDate):t('Evidence date unavailable','無法取得證據日期')} · {data?.research?.filingObservations??'—'} {t('filing observations','筆申報觀測')}</small></article>
   <article><span className={`status-dot ${researchOpen?'ready':'pending'}`} aria-hidden="true"/><p className="eyebrow">{t('RESEARCH MEMBERSHIP','RESEARCH 會員')}</p><h3>{researchOpen?t('Available for purchase','可購買'):t('Not on sale','尚未銷售')}</h3><p>{t('Access is released only after every required product, data, payment, rights and security gate passes.','只有產品、資料、付款、來源權利與安全門檻全部通過後，才會開放購買。')}</p><small>{data?.membershipRelease?.research?.passed??'—'} / {data?.membershipRelease?.research?.total??'—'} {t('release gates passed','項發布門檻已通過')}</small></article>
  </div>}
  <p className="research-status-note">{t('Status describes data and access readiness, not investment quality or expected returns.','此狀態只說明資料與使用資格是否就緒，不代表投資品質或預期報酬。')} <a href={`/${locale}/coverage/`}>{t('View exact coverage','查看明確資料範圍')}</a></p>
 </section>;
}
