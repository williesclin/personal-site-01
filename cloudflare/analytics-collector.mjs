// Standalone Worker: official Google APIs -> private R2. Never logs credentials/report data.
const enc = new TextEncoder();
const response = (body,status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function dayAt(date, timezone) {return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function shift(day, offset) {return new Date(Date.parse(day+'T12:00:00Z')+offset*86400000).toISOString().slice(0,10);}
export function periods(now, timezone) {
  const today=dayAt(now,timezone), end=shift(today,-1);
  return {yesterday:[end,end],last7:[shift(end,-6),end],previous7:[shift(end,-13),shift(end,-7)]};
}
function b64(bytes) {return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');}
async function token(env, send) {
  const account=JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const now=Math.floor(Date.now()/1000);
  const header=b64(enc.encode(JSON.stringify({alg:'RS256',typ:'JWT'})));
  const claim=b64(enc.encode(JSON.stringify({iss:account.client_email,scope:'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600})));
  const pem=account.private_key.replace(/-----[^-]+-----|\s/g,'');
  const bytes=Uint8Array.from(atob(pem),c=>c.charCodeAt(0));
  const k=await crypto.subtle.importKey('pkcs8',bytes,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  const assertion=header+'.'+claim+'.'+b64(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',k,enc.encode(header+'.'+claim)));
  const r=await send('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw new Error('google_auth_failed');
  const data=await r.json();if(!data.access_token)throw new Error('google_auth_failed');return data.access_token;
}
async function query(url,body,bearer,send) {
  const r=await send(url,{method:'POST',headers:{Authorization:'Bearer '+bearer,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw new Error('google_api_http_'+r.status);
  return r.json();
}
export async function collect(env, now=new Date(), send=fetch, getToken=token) {
  if(env.ANALYTICS_ENABLED!=='true')return {status:'disabled'};
  if(!env.REPORTS || !env.GOOGLE_SERVICE_ACCOUNT_JSON || !/^\d+$/.test(env.GA4_PROPERTY_ID||'') || !env.GSC_SITE_URL || !env.GA4_TIMEZONE) throw new Error('configuration_required');
  const report={schema_version:1,site:'https://quantpathlabs.com',generated_at:now.toISOString(),ga4_timezone:env.GA4_TIMEZONE,gsc_timezone:'America/Los_Angeles',status:'ok',sections:{},limitations:['GA4 recent data is provisional; each run refreshes 14 days.','Engagement measures foreground use, not verified reading.','Search Console final data can lag; query/page detail is top rows, not total traffic.','Do not sum distinct users across days or breakdowns.','No conversion attribution or user-level records collected.']};
  const bearer=await getToken(env,send);
  const spans=periods(now,env.GA4_TIMEZONE);
  const metricNames=['totalUsers','sessions','screenPageViews','userEngagementDuration'];
  const base={metrics:metricNames.map(name=>({name})),dimensionFilter:{filter:{fieldName:'hostName',inListFilter:{values:['quantpathlabs.com','www.quantpathlabs.com']}}},limit:100,returnPropertyQuota:true};
  const jobs=[];
  const ga=(name,range,dimensions=[])=>jobs.push([name,()=>query('https://analyticsdata.googleapis.com/v1beta/properties/'+env.GA4_PROPERTY_ID+':runReport',{...base,dateRanges:[{startDate:range[0],endDate:range[1]}],dimensions:dimensions.map(name=>({name})),...(dimensions.length?{orderBys:[{metric:{metricName:'screenPageViews'},desc:true}]}:{})},bearer,send)]);
  for(const [name,span] of Object.entries(spans))ga('ga4_'+name,span);
  ga('ga4_daily_14d',[spans.previous7[0],spans.last7[1]],['date']);
  ga('ga4_pages_yesterday',spans.yesterday,['pagePath']);
  ga('ga4_countries_yesterday',spans.yesterday,['country']);
  ga('ga4_sources_yesterday',spans.yesterday,['sessionDefaultChannelGroup']);
  const scEnd=shift(dayAt(now,'America/Los_Angeles'),-3), scStart=shift(scEnd,-13);
  for(const dimensions of [['date'],['page'],['query']]) {
    jobs.push(['gsc_'+dimensions[0],()=>query('https://www.googleapis.com/webmasters/v3/sites/'+encodeURIComponent(env.GSC_SITE_URL)+'/searchAnalytics/query',{startDate:scStart,endDate:scEnd,dimensions,type:'web',dataState:'final',rowLimit:1000},bearer,send)]);
  }
  report.gsc_requested_period=[scStart,scEnd];
  // Sequential requests keep within per-property concurrency quotas.
  for(const [name,run] of jobs) {
    try {report.sections[name]={status:'ok',data:await run()};}
    catch(e) {report.status='partial';report.sections[name]={status:'unavailable',error:/^google_api_http_\d+$/.test(e.message)?e.message:'request_failed',data:null};}
  }
  const body=JSON.stringify(report);
  const key='reports/'+dayAt(now,'Asia/Taipei')+'.json';
  await env.REPORTS.put(key,body,{httpMetadata:{contentType:'application/json'}});
  await env.REPORTS.put('latest.json',body,{httpMetadata:{contentType:'application/json'}});
  return {status:report.status,key};
}
async function authorized(request,secret) {
  if(!secret || secret.length<32)return false;
  const received=request.headers.get('Authorization')||'';
  const digest=async s=>new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s)));
  const [a,b]=await Promise.all([digest(received),digest('Bearer '+secret)]);let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;
}
export default {
  async fetch(request,env) {
    if(!await authorized(request,env.REPORT_READ_TOKEN))return response({error:'unauthorized'},401);
    if(request.method!=='GET')return response({error:'method_not_allowed'},405);
    const path=new URL(request.url).pathname;
    if(path!=='/reports/latest')return response({error:'not_found'},404);
    if(!env.REPORTS)return response({error:'not_configured'},503);
    const object=await env.REPORTS.get('latest.json');
    return object?new Response(object.body,{headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}}):response({error:'no_report_yet'},404);
  },
  async scheduled(controller,env,ctx) {
    ctx.waitUntil(collect(env).catch(async()=>{
      // Overwrite the latest status on failure so an old success cannot masquerade as fresh data.
      if(env.REPORTS)await env.REPORTS.put('latest.json',JSON.stringify({status:'failed',generated_at:new Date().toISOString(),error:'collection_failed',sections:null}),{httpMetadata:{contentType:'application/json'}});
      throw new Error('Analytics collection failed; inspect configuration and Google permissions.');
    }));
  }
};
