import {publicRoute} from '../app/public-content.mjs';
// Optional GA4 measurement. No Google request until explicit opt-in.
const routes = new Set(['home','dashboard','analysis','planner','records']);
export function safeView(hash, pathname = "/") {
  if ((!hash || hash === "#home" || hash === "#content") && pathname !== "/") {
    const page = publicRoute(pathname);
    return page ? `public/${page.locale}/${page.page || "home"}` : null;
  }
  const value = hash.replace(/^#/, '') || 'home';
  return routes.has(value) ? value : null;
}
export function installAnalytics(id) {
  if (!/^G-[A-Z0-9]+$/.test(id || '') || !['quantpathlabs.com','www.quantpathlabs.com'].includes(location.hostname)) return;
  const key = 'qpl-analytics-consent-v1';
  let consent = false, loaded = false, previous = null;
  try { consent = localStorage.getItem(key) === 'yes'; } catch {}
  window.dataLayer = window.dataLayer || [];
  function tag() { window.dataLayer.push(arguments); }
  function view() {
    const route = safeView(location.hash, location.pathname);
    if (!consent || !route || route === previous) return;
    previous = route;
    tag('config', id, {send_page_view:false, page_location:location.origin+'/analytics-view/'+route,
      page_title:'QuantPath '+route, page_referrer:'', allow_google_signals:false, allow_ad_personalization_signals:false});
    tag('event','page_view',{page_location:location.origin+'/analytics-view/'+route,page_title:'QuantPath '+route,page_referrer:''});
  }
  function start() {
    if (!consent) return;
    if (!loaded) {
      loaded = true;
      tag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      tag('js',new Date());
      const script=document.createElement('script');script.async=true;
      script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);
      document.head.appendChild(script);
    }
    view();
  }
  const button=document.createElement('button');button.type='button';button.textContent='Analytics preferences / 分析偏好';
  button.style.cssText='position:fixed;bottom:max(12px,env(safe-area-inset-bottom));right:12px;z-index:1000;max-width:calc(100vw - 24px);min-height:44px;padding:10px 14px;background:white;color:#173b36;border:1px solid #d1dcde;border-radius:10px;font:inherit;font-size:12px;box-shadow:0 2px 12px #102d3214';
  const dialog=document.createElement('dialog');
  dialog.ariaLabel='Analytics preferences / 分析偏好';
  // Explicitly restore dialog layout because the CSS reset removes native margins and padding.
  dialog.style.cssText='position:fixed;inset:0;margin:auto;box-sizing:border-box;width:calc(100% - 32px);max-width:480px;max-height:calc(100dvh - 32px);overflow:auto;padding:clamp(20px,5vw,32px);border:1px solid #dce4e6;border-radius:18px;background:#fff;color:#173b36;box-shadow:0 24px 80px #102d3238;font:inherit;text-align:left';
  const title=document.createElement('h2');title.textContent='Analytics preferences';
  title.style.cssText='margin:0 0 4px;font-size:22px;font-weight:650;line-height:1.35;letter-spacing:-.4px';
  const subtitle=document.createElement('p');subtitle.textContent='網站分析偏好';
  subtitle.style.cssText='margin:0 0 20px;font-size:15px;color:#65747c';
  const message=document.createElement('p');message.textContent='Help us improve QuantPath Labs with optional Google Analytics. It measures page use and active engagement without sending account details or financial records. You can decline and keep using the site.\n\n您可選擇同意網站分析，協助我們改善內容。分析記錄頁面使用與互動時間，不傳送帳號或個人財務紀錄。拒絕不影響使用，之後也可隨時撤回。';
  message.style.cssText='margin:0 0 20px;font-size:14px;line-height:1.75;color:#50646b;white-space:pre-line;overflow-wrap:anywhere';
  dialog.append(title,subtitle,message);
  function choose(value) {
    consent=value;try{localStorage.setItem(key,value?'yes':'no');}catch{}
    if (!value) {window['ga-disable-'+id]=true;if(loaded)tag('consent','update',{analytics_storage:'denied'});}
    dialog.close(); if(value) {window['ga-disable-'+id]=false;start();} else if(loaded) location.reload();
  }
  for(const [label,value] of [['Allow / 同意',true],['Decline or withdraw / 拒絕或撤回',false]]) {
    const b=document.createElement('button');b.type='button';b.textContent=label;
    b.style.cssText='display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;margin-top:10px;padding:12px 16px;border:1px solid #b8cbc4;border-radius:9px;background:#f4f8f6;color:#173b36;font:inherit;font-size:14px;font-weight:600;line-height:1.5;white-space:normal;cursor:pointer';
    b.onclick=()=>choose(value);dialog.append(b);
  }
  button.onclick=()=>dialog.showModal();document.body.append(button,dialog);
  window.addEventListener('hashchange',()=>{
    if(!safeView(location.hash, location.pathname)) {window['ga-disable-'+id]=true;previous=null;return;}
    window['ga-disable-'+id]=!consent;start();
  });
  // Auth/recovery/admin routes are not measured.
  if(safeView(location.hash, location.pathname)) start();
  // Browsing never requires a consent decision. Open preferences only on request.
}
