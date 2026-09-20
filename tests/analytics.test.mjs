import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker,{periods,collect,shift} from '../cloudflare/analytics-collector.mjs';
import {safeView,installAnalytics} from '../cloudflare/analytics-browser.mjs';
test('Taipei yesterday and disjoint weeks across month boundary',()=>{
 assert.deepEqual(periods(new Date('2026-09-30T23:15:00Z'),'Asia/Taipei'),{yesterday:['2026-09-30','2026-09-30'],last7:['2026-09-24','2026-09-30'],previous7:['2026-09-17','2026-09-23']});
 assert.equal(shift('2024-03-01',-1),'2024-02-29');
});
test('private and arbitrary fragments never become analytics names',()=>{
 for(const value of ['#access_token=secret','#login','#admin','#lab','#records?email=a@b.com'])assert.equal(safeView(value),null);
 assert.equal(safeView('#analysis'),'analysis');assert.equal(safeView(''),'home');
});
test('missing measurement ID does not access browser or load analytics',()=>{installAnalytics(undefined);});
test('collector disabled by default; missing config never returns fake zeros',async()=>{
 assert.deepEqual(await collect({}),{status:'disabled'});
 await assert.rejects(collect({ANALYTICS_ENABLED:'true'}),/configuration_required/);
});
test('report endpoint denies anonymous, short secrets and other methods',async()=>{
 assert.equal((await worker.fetch(new Request('https://x/reports/latest'),{})).status,401);
 const token='a'.repeat(40),env={REPORT_READ_TOKEN:token};
 assert.equal((await worker.fetch(new Request('https://x/reports/latest',{headers:{Authorization:'Bearer wrong'}}),env)).status,401);
 assert.equal((await worker.fetch(new Request('https://x/reports/latest',{method:'POST',headers:{Authorization:'Bearer '+token}}),env)).status,405);
 assert.equal((await worker.fetch(new Request('https://x/reports/latest',{headers:{Authorization:'Bearer '+token}}),env)).status,503);
});
test('partial API failure is null, not zero; totals queried separately; GSC timezone preserved',async()=>{
 const calls=[],saved=new Map();
 const env={ANALYTICS_ENABLED:'true',GA4_PROPERTY_ID:'123',GA4_TIMEZONE:'Asia/Taipei',GSC_SITE_URL:'sc-domain:quantpathlabs.com',GOOGLE_SERVICE_ACCOUNT_JSON:'{}',REPORTS:{put:async(k,v)=>saved.set(k,v)}};
 const send=async(url,options)=>{const body=JSON.parse(options.body);calls.push({url,body});return url.includes('searchAnalytics')?new Response('{}',{status:403}):Response.json({rows:[],rowCount:0});};
 const result=await collect(env,new Date('2026-09-30T23:15:00Z'),send,async()=> 'test-token');
 assert.equal(result.status,'partial');assert.equal(calls.length,10);
 assert.deepEqual(calls[0].body.dimensions,[]);assert.deepEqual(calls[1].body.dimensions,[]);
 const report=JSON.parse(saved.get('latest.json'));
 assert.equal(report.sections.gsc_date.data,null);assert.equal(report.sections.ga4_yesterday.status,'ok');
 assert.deepEqual(report.gsc_requested_period,['2026-09-14','2026-09-27']);
 assert.equal(calls[4].body.dimensions[0].name,'pagePath');
 assert.equal(calls[0].body.dimensionFilter.filter.fieldName,'hostName');
});
test('auth failure never leaves yesterday success as latest',async()=>{
 let pending;const saved=new Map();const env={ANALYTICS_ENABLED:'true',REPORTS:{put:async(k,v)=>saved.set(k,v)}};
 await worker.scheduled({},env,{waitUntil:p=>pending=p});
 await assert.rejects(pending,/Analytics collection failed/);
 assert.equal(JSON.parse(saved.get('latest.json')).status,'failed');
});
test('consent defers Google script and sanitized pageview until allowed route',()=>{
 const original=Object.fromEntries(['window','document','location','localStorage'].map(k=>[k,globalThis[k]]));
 try {
  const listeners={},scripts=[],nodes=[],storage=new Map();
  const element=tag=>({tag,style:{},children:[],append(...items){this.children.push(...items);},showModal(){this.open=true;},close(){this.open=false;}});
  globalThis.window={addEventListener:(k,fn)=>listeners[k]=fn};
  globalThis.location={hostname:'quantpathlabs.com',origin:'https://quantpathlabs.com',hash:'#login',reload(){}};
  globalThis.localStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
  globalThis.document={createElement:element,head:{appendChild:x=>scripts.push(x)},body:{append:(...items)=>nodes.push(...items)}};
  installAnalytics('G-TEST');assert.equal(scripts.length,0);
  nodes[1].children[1].onclick(); // explicit opt-in while on login
  assert.equal(window.dataLayer.filter(x=>x[1]==='page_view').length,0);
  location.hash='#analysis';listeners.hashchange();
  assert.equal(scripts.length,1);
  const views=window.dataLayer.filter(x=>x[1]==='page_view');assert.equal(views.length,1);
  assert.equal(views[0][2].page_location,'https://quantpathlabs.com/analytics-view/analysis');
  listeners.hashchange();assert.equal(window.dataLayer.filter(x=>x[1]==='page_view').length,1);
  nodes[1].children[2].onclick();assert.equal(window['ga-disable-G-TEST'],true);
 } finally {for(const [k,v] of Object.entries(original)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});
