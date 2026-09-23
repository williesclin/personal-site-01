import {membershipView,validateResearchState} from '../app/membership.mjs';
import equities from '../data/equities.json';
import lotto from '../data/lotto649.json';
import power from '../data/superlotto638.json';
import daily from '../data/daily539.json';
import researchFeed from '../data/research-feed.json';
import researchReadiness from '../data/research-model-readiness.json';
import {researchPublicStatus} from '../app/research-public-status.mjs';
import {GAMES,validateReport,emptyWorkspace,type Game,type Workspace,type Plan,type RecordItem,type Article} from '../app/domain';
type Env={ASSETS:{fetch:(r:Request)=>Promise<Response>};SUPABASE_URL?:string;SUPABASE_ANON_KEY?:string;LAB_SUPABASE_URL?:string;LAB_SUPABASE_SERVICE_KEY?:string;SITE_URL?:string};
type User={id:string;email:string;email_confirmed_at?:string};
class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
async function membership(e:Env,token:string,uid:string){const rows=await request(e,`/rest/v1/memberships?user_id=eq.${uid}&select=plan,status,period_start,period_end`,token);return membershipView(rows[0]);}
const tokenName='__Host-qpl_session';
function cookie(token:string,maxAge=3600){return `${tokenName}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;}
function json(body:unknown,status=200,extra:Record<string,string>={}){return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}})}
function configured(e:Env){return !!(e.SUPABASE_URL&&e.SUPABASE_ANON_KEY&&e.SITE_URL);}
function validInt(v:unknown,min:number,max:number){return typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max;}
function text(v:unknown,max:number){return typeof v==='string'&&v.length<=max;}
function id(v:unknown){return typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);}
async function request(e:Env,path:string,token?:string,method='GET',body?:unknown,lab=false){const url=lab?e.LAB_SUPABASE_URL:e.SUPABASE_URL;const key=lab?e.LAB_SUPABASE_SERVICE_KEY:e.SUPABASE_ANON_KEY;if(!url||!key)throw new HttpError(503,lab?'研究資料庫尚未連接。':'會員服务尚未連接。');if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))throw new HttpError(503,'資料庫網址設定不正確。');const response=await fetch(`${url}${path}`,{method,headers:{apikey:key,Authorization:`Bearer ${lab?key:(token||key)}`,'Content-Type':'application/json',Prefer:'return=representation,resolution=merge-duplicates'},body:body===undefined?undefined:JSON.stringify(body)});const data=await response.json().catch(()=>null);if(!response.ok){if(response.status===429)throw new HttpError(429,'請求過於頻繁，請稍後再試。');if(response.status===401||response.status===403)throw new HttpError(401,'請重新登入或確認帳號權限。');throw new HttpError(400,'操作未完成。請檢查輸入內容、驗證狀態或服務設定。');}return data;}
function getToken(r:Request){const val=r.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(tokenName+'='));return val?decodeURIComponent(val.slice(tokenName.length+1)):undefined;}
async function user(e:Env,r:Request){const token=getToken(r);if(!token)throw new HttpError(401,'請先登入。');const u=await request(e,'/auth/v1/user',token) as User;if(!u.id||!u.email_confirmed_at)throw new HttpError(403,'請先完成 Email 驗證。');const profiles=await request(e,`/rest/v1/profiles?id=eq.${u.id}&select=id,email,role,monthly_budget`,token) as {role:string;monthly_budget:number}[];if(!profiles[0])throw new HttpError(403,'會員資料尚未建立。');return {u,token,profile:profiles[0]};}
async function loadWorkspace(e:Env,token:string,uid:string,profile:{role:string;monthly_budget:number}):Promise<Workspace>{const [plans,records,articles]=await Promise.all([request(e,`/rest/v1/plans?user_id=eq.${uid}&select=payload&order=created_at.desc`,token),request(e,`/rest/v1/records?user_id=eq.${uid}&select=payload&order=created_at.desc`,token),request(e,'/rest/v1/articles?select=payload',token)]) as {payload:never}[][];let lab={runs:[],audit:[],activeRun:null,previousRun:null};if(profile.role==='admin'&&e.LAB_SUPABASE_URL&&e.LAB_SUPABASE_SERVICE_KEY){const result=await request(e,'/rest/v1/lab_state?id=eq.1&select=state',undefined,'GET',undefined,true) as {state:typeof lab}[];lab=result[0]?.state||lab;}return {...emptyWorkspace,plans:plans.map(p=>p.payload),records:records.map(p=>p.payload),articles:articles.map(p=>p.payload),monthlyBudget:profile.monthly_budget,...lab};}
async function body(r:Request){if(Number(r.headers.get('content-length')||0)>1048576)throw new HttpError(413,'內容超過 1 MB。');const raw=await r.text();if(raw.length>1048576)throw new HttpError(413,'內容超過 1 MB。');try{return JSON.parse(raw) as Record<string,unknown>}catch{throw new HttpError(400,'無效的 JSON。')}}
export async function handleApi(r:Request,e:Env):Promise<Response>{const url=new URL(r.url),path=url.pathname.slice(5);try{
 if(r.method!=='GET'&&r.method!=='POST')throw new HttpError(405,'不支援此方法。');
 if(r.method==='POST'&&r.headers.get('Origin')!==url.origin)throw new HttpError(403,'不允許跨來源操作。');
 if(path==='session'&&r.method==='GET'){
  if(!configured(e))return json({configured:false,user:null});
  if(!getToken(r))return json({configured:true,user:null});
  try{const {u,token,profile}=await user(e,r);return json({configured:true,user:{email:u.email,role:profile.role},workspace:await loadWorkspace(e,token,u.id,profile)});}catch(err){if(err instanceof HttpError&&(err.status===401||err.status===403))return json({configured:true,user:null},200,{'Set-Cookie':cookie('',0)});throw err;}
 }
 if(path==='data-status'&&r.method==='GET')return json({equities:{retrievedAt:equities.retrievedAt,hash:equities.hash,companies:equities.companies.length},research:researchPublicStatus(researchFeed,researchReadiness),lottery:[lotto,power,daily].map(d=>({game:d.game,count:d.count,retrievedAt:d.retrievedAt,coverageEnd:d.coverageEnd}))});
 if(path==='research-preview'&&r.method==='GET')return json({...equities,preview:true,companies:equities.companies.slice(0,1).map(c=>({...c,years:c.years.slice(0,3)}))});
 if(path==='checkout'&&r.method==='POST')throw new HttpError(503,'Subscriptions are not open yet / 訂閱尚未開放，不會扣款。');
 if(!configured(e))throw new HttpError(503,'會員服務尚未連接；請先使用示範工作台。');
 if(path==='logout'&&r.method==='POST'){const token=getToken(r);if(token)await request(e,'/auth/v1/logout',token,'POST');return json({ok:true},200,{'Set-Cookie':cookie('',0)});}
 if(['login','signup','reset'].includes(path)&&r.method==='POST'){
  const b=await body(r);if(!text(b.email,254)||!/^\S+@\S+\.\S+$/.test(b.email as string))throw new HttpError(400,'請輸入有效信箱。');
  if(path==='reset'){await request(e,`/auth/v1/recover?redirect_to=${encodeURIComponent(e.SITE_URL+'/reset-password.html')}`,undefined,'POST',{email:b.email});return json({ok:true});}
  if(!text(b.password,256)||(b.password as string).length<12)throw new HttpError(400,'密碼至少需要 12 個字元。');
  if(path==='signup'){await request(e,`/auth/v1/signup?redirect_to=${encodeURIComponent(e.SITE_URL!+'/#login')}`,undefined,'POST',{email:b.email,password:b.password});return json({ok:true});}
  const d=await request(e,'/auth/v1/token?grant_type=password',undefined,'POST',{email:b.email,password:b.password}) as {access_token:string;expires_in:number;user:User};
  if(!d.user.email_confirmed_at)throw new HttpError(403,'請先完成 Email 驗證。');
  return json({ok:true},200,{'Set-Cookie':cookie(d.access_token,Math.min(d.expires_in,3600))});
 }
 if(path==='password'&&r.method==='POST'){
  const b=await body(r);if(!text(b.access_token,8192)||!text(b.password,256)||(b.password as string).length<12)throw new HttpError(400,'重設資訊無效，密碼至少 12 個字元。');
  await request(e,'/auth/v1/user',b.access_token as string,'PUT',{password:b.password});return json({ok:true},200,{'Set-Cookie':cookie('',0)});
 }
 const {u,token,profile}=await user(e,r);
 if(path==='membership'&&r.method==='GET')return json(await membership(e,token,u.id));
 if(path.startsWith('lottery/')&&r.method==='GET'){const datasets:Record<string,unknown>={lotto649:lotto,superlotto638:power,daily539:daily};const d=datasets[path.slice(8)];if(!d)throw new HttpError(404,'找不到此彩種。');return json(d);}
 if(['research-data','research-state','research-evidence','pro-tools'].includes(path)){
  const access=await membership(e,token,u.id);
  if(access.plan==='free')throw new HttpError(403,'Research membership required / 此功能需 Research 會員。');
  if(path==='pro-tools'){if(access.plan!=='pro')throw new HttpError(403,'Pro membership required / 此功能需 Pro 會員。');throw new HttpError(503,'Pro tools are not released / 進階工具尚未發布。');}
  if(path==='research-evidence'&&r.method==='GET'){const [documents,ingestions,observations]=await Promise.all([request(e,'/rest/v1/research_documents?select=id,canonical_url,title,summary,kind,published_on,first_seen_at&order=published_on.desc&limit=12',token),request(e,'/rest/v1/research_ingestions?select=recorded_at,retrieved_at,company_count&order=recorded_at.desc&limit=1',token),request(e,'/rest/v1/research_filing_observations?select=document_id,symbol,form,category,first_observed_at,backfill&order=first_observed_at.desc&limit=30',token)]);return json({documents,observations,ingestion:ingestions[0]||null,socialStatus:'not_connected',sentimentStatus:'not_validated'});}
  if(path==='research-data'&&r.method==='GET')return json(equities);
  if(path==='research-state'&&r.method==='GET'){const rows=await request(e,`/rest/v1/research_state?user_id=eq.${u.id}&select=payload`,token);return json({state:rows[0]?.payload||{watchlist:[],saved:[]},access});}
  if(path==='research-state'&&r.method==='POST'){let value;try{value=validateResearchState(await body(r),access.plan);}catch{throw new HttpError(400,'Invalid research state or plan limit / 條件格式不正確或超過方案上限。');}await request(e,'/rest/v1/research_state',token,'POST',{user_id:u.id,payload:value});return json({state:value,access});}
  throw new HttpError(405,'不支援此方法。');
 }
 if(path==='members'&&r.method==='GET'){if(profile.role!=='admin')throw new HttpError(403,'此操作限管理員。');const members=await request(e,'/rest/v1/profiles?select=email,role,verified',token) as {email:string;role:string;verified:boolean}[];return json({members});}
 if(!path.startsWith('workspace/')||r.method!=='POST')throw new HttpError(404,'找不到此功能。');
 const action=path.slice(10),b=await body(r);
 if(action==='budget'){if(!validInt(b.budget,0,1000000))throw new HttpError(400,'預算必須為有效整數。');await request(e,`/rest/v1/profiles?id=eq.${u.id}`,token,'PATCH',{monthly_budget:b.budget});profile.monthly_budget=b.budget as number;}
 else if(action==='plan'){
  const g=GAMES[b.game as Game];const nums=b.numbers as number[][];
  if(!id(b.id)||!g||!validInt(b.budget,1,1000000)||!Array.isArray(nums)||nums.length<1||nums.length>100||nums.length*g.price>(b.budget as number)||!text(b.note,200))throw new HttpError(400,'規劃資料不正確。');
  const seen=new Set<string>();for(const ns of nums){if(!Array.isArray(ns)||ns.length!==g.count+(g.second?1:0)||!ns.slice(0,g.count).every(n=>validInt(n,1,g.max))||new Set(ns.slice(0,g.count)).size!==g.count||g.second&&!validInt(ns[g.count],1,g.second))throw new HttpError(400,'號碼組合不合法。');const key=[...ns.slice(0,g.count)].sort((a,b)=>a-b).join(',')+':'+(g.second?ns[g.count]:'');if(seen.has(key))throw new HttpError(400,'號碼組合重複。');seen.add(key);}
  const p:Plan={id:b.id as string,game:b.game as Game,budget:b.budget as number,numbers:nums,note:b.note as string,created:new Date().toISOString()};await request(e,'/rest/v1/plans',token,'POST',{id:p.id,user_id:u.id,payload:p});
 }
 else if(action==='record'){
  if(!id(b.id)||!GAMES[b.game as Game]||typeof b.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||new Date(b.date).toISOString().slice(0,10)!==b.date||!validInt(b.cost,1,1000000000)||!validInt(b.prize,0,1000000000)||!text(b.note,200))throw new HttpError(400,'紀錄資料不正確。');
  const p:RecordItem={id:b.id as string,date:b.date,game:b.game as Game,cost:b.cost as number,prize:b.prize as number,note:b.note as string};await request(e,'/rest/v1/records',token,'POST',{id:p.id,user_id:u.id,payload:p});
 }
 else if(action==='delete-record'){if(!id(b.id))throw new HttpError(400,'無效的紀錄。');await request(e,`/rest/v1/records?id=eq.${b.id}&user_id=eq.${u.id}`,token,'DELETE');}
 else if(['article','run','validate-run','publish-run'].includes(action)){
  if(profile.role!=='admin')throw new HttpError(403,'此操作限管理員。');
  if(action==='article'){if(!id(b.id)||!text(b.title,160)||!(b.title as string).trim()||!text(b.body,10000)||!(b.body as string).trim()||typeof b.published!=='boolean')throw new HttpError(400,'文章內容不正確。');const p:Article={id:b.id as string,title:b.title as string,body:b.body as string,published:b.published};await request(e,'/rest/v1/articles',token,'POST',{id:p.id,payload:p});}
  else if(action==='run'){const report=validateReport(b);if(text(b.filename,255))report.filename=b.filename as string;if(typeof b.sha256==='string'&&/^[0-9a-f]{64}$/.test(b.sha256))report.sha256=b.sha256;await request(e,'/rest/v1/rpc/mutate_lab',undefined,'POST',{action,payload:report,actor:u.id},true);}
  else {if(!id(b.id))throw new HttpError(400,'實驗版本不正確。');await request(e,'/rest/v1/rpc/mutate_lab',undefined,'POST',{action,payload:{id:b.id},actor:u.id},true);}
 }else throw new HttpError(404,'找不到此操作。');
 return json({workspace:await loadWorkspace(e,token,u.id,profile)});
 }catch(err){return json({error:err instanceof HttpError?err.message:'服務暫時無法完成操作。'},err instanceof HttpError?err.status:500);}}
export default {async fetch(r:Request,e:Env){const pathname=new URL(r.url).pathname;if(pathname.startsWith('/data/'))return json({error:'Use the authenticated API / 請使用會員工具。'},404);if(pathname.startsWith('/api/'))return handleApi(r,e);const res=await e.ASSETS.fetch(r);const h=new Headers(res.headers);h.set('X-Content-Type-Options','nosniff');h.set('Referrer-Policy','strict-origin-when-cross-origin');h.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');h.set('Content-Security-Policy',"default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.google-analytics.com; font-src 'self'; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");return new Response(res.body,{status:res.status,headers:h});}};
