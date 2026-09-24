import {useEffect,useState} from 'react';
import {readMemberAccess} from './member-access.mjs';
export function useMemberAccess(enabled=true){
 const [state,setState]=useState<any>({status:'loading',access:null}),[attempt,setAttempt]=useState(0);
 useEffect(()=>{if(!enabled){setState({status:'demo',access:null});return;}let live=true,controller:AbortController|null=null,expiry:ReturnType<typeof setTimeout>;
 const refresh=async()=>{controller?.abort();const ac=new AbortController();controller=ac;setState((previous:any)=>previous.status==='ready'&&(!previous.access.periodEnd||Date.parse(previous.access.periodEnd)>Date.now())?previous:{status:'loading',access:null});try{const result=await readMemberAccess(await fetch('/api/membership',{signal:ac.signal,credentials:'same-origin',cache:'no-store'}));if(!live||ac.signal.aborted)return;setState(result);clearTimeout(expiry);if(result.access?.periodEnd)expiry=setTimeout(refresh,Math.min(2147483647,Math.max(50,Date.parse(result.access.periodEnd)-Date.now()+25)));}catch{if(live&&!ac.signal.aborted)setState({status:'error',access:null});}};
 const focus=()=>{if(document.visibilityState==='visible')void refresh()};void refresh();const interval=setInterval(focus,60000);window.addEventListener('focus',focus);document.addEventListener('visibilitychange',focus);
 return()=>{live=false;controller?.abort();clearTimeout(expiry);clearInterval(interval);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus)};
 },[enabled,attempt]);return {...state,retry:()=>setAttempt(n=>n+1)};
}
export function PublicMemberAccess({locale,path}:{locale:string;path:string}){
 const m=useMemberAccess(),zh=locale==='zh-hant';
 return <div className="actions public-member-access" aria-label={zh?'會員入口':'Member access'}>{m.status==='ready'?<><a className="btn" href={path+'#dashboard'}>{zh?'會員工作台':'My workspace'} ↗</a><a href={path+'#account'}>{m.access.plan==='free'?'Free':m.access.plan==='pro'?'Pro':'Research'} · {zh?'我的方案':'My membership'}</a></>:m.status==='error'?<><a className="btn" href={path+'#account'}>{zh?'查看會員狀態':'Check membership'}</a><button className="text-link" onClick={m.retry}>{zh?'重試':'Retry'}</button></>:<><a href={path+'#login'}>{zh?'會員登入':'Sign in'}</a><a className="btn" href={path+'#signup'}>{zh?'免費建立帳號':'Free account'} ↗</a></>}</div>;
}
