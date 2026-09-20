// Optional GA4 measurement. No Google request until explicit opt-in.
const routes = new Set(['home','dashboard','analysis','planner','records']);
export function safeView(hash) {
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
    const route = safeView(location.hash);
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
  button.style.cssText='position:fixed;bottom:8px;right:8px;z-index:1000;padding:8px;background:white;color:#173b36;border:1px solid #ccc;border-radius:6px;font-size:12px';
  const dialog=document.createElement('dialog');
  const message=document.createElement('p');message.textContent='Optional Google Analytics measures page use and active engagement. It does not receive account details or financial records. / 可選擇同意 Google Analytics 記錄頁面使用與互動時間，不傳送帳號或個人財務紀錄。';
  dialog.append(message);
  function choose(value) {
    consent=value;try{localStorage.setItem(key,value?'yes':'no');}catch{}
    if (!value) {window['ga-disable-'+id]=true;if(loaded)tag('consent','update',{analytics_storage:'denied'});}
    dialog.close(); if(value) {window['ga-disable-'+id]=false;start();} else if(loaded) location.reload();
  }
  for(const [label,value] of [['Allow / 同意',true],['Decline or withdraw / 拒絕或撤回',false]]) {
    const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>choose(value);dialog.append(b);
  }
  button.onclick=()=>dialog.showModal();document.body.append(button,dialog);
  window.addEventListener('hashchange',()=>{
    if(!safeView(location.hash)) {window['ga-disable-'+id]=true;previous=null;return;}
    window['ga-disable-'+id]=!consent;start();
  });
  // Auth/recovery/admin routes are not measured.
  if(safeView(location.hash)) start();
  try{if(!localStorage.getItem(key))dialog.showModal();}catch{}
}
