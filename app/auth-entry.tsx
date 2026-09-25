import {safeReturnPath} from './return-path.mjs';
import {findInstrument} from './instrument-catalog.mjs';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {authText,createAuthSubmitter} from './auth-i18n.mjs';
import './auth-entry.css';
type AuthView='login'|'signup'|'reset';
export function AuthEntry({view,go,startDemo,configured,signedIn,locale,setLocale}:{view:AuthView;go:(v:any)=>void;startDemo:()=>void;configured:boolean;signedIn:()=>Promise<void>;locale:string;setLocale:(locale:string)=>void}) {
 const t=(key:string)=>authText(locale,key);
 const back=typeof window==='undefined'?null:safeReturnPath(new URLSearchParams(window.location.search).get('return'),locale),symbol=back?.match(/\/assets\/([A-Z0-9.-]+)\//)?.[1],destination=symbol&&findInstrument(symbol)?symbol:back?.includes('/search/')?(locale==='en'?'your search results':'搜尋結果'):back?.includes('/news/')?(locale==='en'?'filing events':'申報事件'):back?.includes('/research/')?(locale==='en'?'stock & ETF research':'股票與 ETF 研究'):null;
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const submitter=useRef(createAuthSubmitter((...args:any[])=>fetch(...args as [any,any])));
 const active=useRef(true);
 useEffect(()=>{active.current=true;return()=>{active.current=false}},[]);
 useEffect(()=>{setMessage('');setError('');setPassword('');},[view]);
 async function submit(e:FormEvent) {
  e.preventDefault(); if(busy||!configured)return;
  setError('');setBusy(true);
  const result=await submitter.current({view,email,password,configured});
  if(!active.current)return;
  try {
   if(result.error)setError(result.error);
   else if(result.ok){setPassword('');if(view==='login'){await signedIn();}else setMessage(`auth.${view}.success`);}
  }catch{if(active.current)setError('errors.credentials');}
  finally{if(active.current)setBusy(false);}
 }
 return <div className="auth-page" lang={locale==='en'?'en':'zh-Hant'}>
  <aside className="auth-visual"><div className="brand"><img src="/favicon.svg" alt=""/><strong>QuantPath <em>Labs</em></strong></div><div><h1>{t('auth.heading')}</h1><p>{t('auth.intro')}</p></div><p>© 2026 QuantPath Labs</p></aside>
  <main className="auth-form-wrap"><div className="auth-form">
   <button className="btn" type="button" aria-label={t('auth.language')} lang={locale==='en'?'zh-Hant':'en'} onClick={()=>setLocale(locale==='en'?'zh-hant':'en')}>{locale==='en'?'繁體中文':'English'}</button>
   <h1 id="auth-title" style={{fontSize:30,marginTop:24}}>{t(`auth.${view}.title`)}</h1><p>{t(`auth.${view}.description`)}</p>
   {destination&&<p className="auth-note">{locale==='en'?'After sign-in, return to: ':'登入後返回：'}<strong>{destination}</strong></p>}<p className="auth-note">{t('auth.scope')}</p>
   {!configured&&<div role="status" className="auth-note">{t('auth.unavailable')}</div>}
   {message?<div className="success-message" role="status">{t(message)}<button className="btn" type="button" onClick={()=>go('login')}>{t('auth.login.link')}</button></div>:<form className="form-stack" aria-labelledby="auth-title" aria-busy={busy} onSubmit={submit}>
    <label className="field"><span>{t('auth.email')}</span><input type="email" autoComplete="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} required disabled={!configured||busy}/></label>
    {view!=='reset'&&<label className="field"><span>{t('auth.password')}</span><input type="password" autoComplete={view==='signup'?'new-password':'current-password'} minLength={12} maxLength={256} aria-describedby="password-hint" value={password} onChange={e=>setPassword(e.target.value)} required disabled={!configured||busy}/><small id="password-hint">{t('auth.passwordHint')}</small></label>}
    {error&&<div role="alert" className="error-message">{t(error)}</div>}
    <button className="btn primary" type="submit" disabled={!configured||busy}>{busy?t('status.busy'):t(`auth.${view}.submit`)}</button>
    <div className="auth-links">{view==='login'?<><button className="btn" type="button" disabled={busy} onClick={()=>go('signup')}>{t('auth.signup.link')}</button><button className="btn" type="button" disabled={busy} onClick={()=>go('reset')}>{t('auth.reset.link')}</button></>:<button className="btn" type="button" disabled={busy} onClick={()=>go('login')}>{t('auth.login.link')}</button>}</div>
   </form>}
   <div className="auth-divider">QuantPath Labs</div><button className="btn" type="button" disabled={busy} onClick={()=>startDemo()}>{t('auth.demo')}</button><p className="small muted">{t('auth.demoHint')}</p>
   <button className="auth-back" type="button" disabled={busy} onClick={()=>back?window.location.assign(back):go('home')}>{t('auth.home')}</button>
  </div></main>
 </div>;
}
