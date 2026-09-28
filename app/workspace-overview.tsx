'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {findInstrument,instrumentHref} from './instrument-catalog.mjs';
import {PLANS} from './membership.mjs';
import {useMemberAccess} from './use-member-access';
import {workspaceText} from './workspace-i18n.mjs';

type DashboardTemplate='overview'|'portfolio'|'research';
const DASHBOARD_TEMPLATE_KEY='qpl-dashboard-template-v1';
const dashboardTemplates:DashboardTemplate[]=['overview','portfolio','research'];

function DashboardTemplatePicker({locale,value,onChange}:{locale:string;value:DashboardTemplate;onChange:(value:DashboardTemplate)=>void}){
 const zh=locale==='zh-hant',t=(en:string,zhText:string)=>zh?zhText:en;
 const choices=[
  {id:'overview' as const,title:t('Overview','總覽型'),desc:t('Balanced view of investments, research, data and membership.','投資、研究、資料與會員權益平均配置。')},
  {id:'portfolio' as const,title:t('Portfolio','投資型'),desc:t('Selected investments and portfolio readiness come first.','優先查看投資標的與持倉資料準備狀態。')},
  {id:'research' as const,title:t('Research','研究型'),desc:t('Saved work, evidence and research coverage come first.','優先查看已保存研究、證據與資料覆蓋。')}
 ];
 return <section className="dashboard-template-picker" aria-label={t('Dashboard layout','Dashboard 套版')}>
  <div className="template-picker-copy"><span className="eyebrow">DASHBOARD LAYOUT</span><strong>{t('Choose your dashboard','選擇你的 Dashboard 套版')}</strong><small>{t('Saved on this browser for this first release.','第一版先儲存在此瀏覽器，下次登入會保留。')}</small></div>
  <div className="template-options" role="radiogroup">{choices.map(choice=><button key={choice.id} type="button" className={'template-option '+(value===choice.id?'active':'')} role="radio" aria-checked={value===choice.id} onClick={()=>onChange(choice.id)}><strong>{choice.title}</strong><small>{choice.desc}</small></button>)}</div>
 </section>;
}

function DashboardGrid({className='',children}:{className?:string;children:ReactNode}){return <div className={'dashboard-layout-grid '+className}>{children}</div>}

export function WorkspaceOverview({locale,mode,go,budget,onBudget}:{locale:string;mode:string;budget:number;onBudget:()=>void;go:(v:any)=>void}){
 const t=(k:string)=>workspaceText(locale,k),copy=(en:string,zh:string)=>locale==='zh-hant'?zh:en;
 const member=useMemberAccess(mode==='member'),access=mode==='demo'?{plan:'demo',limits:{watch:0,saved:0},periodEnd:null}:member.access;
 const [status,setStatus]=useState<any>(null),[statusError,setStatusError]=useState(false),[statusAttempt,setStatusAttempt]=useState(0);
 const [researchState,setResearchState]=useState<any>(null),[researchError,setResearchError]=useState(false),[researchAttempt,setResearchAttempt]=useState(0);
 const [template,setTemplate]=useState<DashboardTemplate>('overview');
 const full=['research','pro'].includes(access?.plan);
 const limits=full?(access?.limits||PLANS[access.plan]):null;
 const watchlist:Array<string>=Array.isArray(researchState?.watchlist)?researchState.watchlist:[];
 const saved:Array<any>=Array.isArray(researchState?.saved)?researchState.saved:[];
 const date=(s:string)=>new Intl.DateTimeFormat(locale==='en'?'en-US':'zh-TW',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Taipei'}).format(new Date(s));
 const planLabel=access?.plan==='pro'?'Pro':access?.plan==='research'?'Research':access?.plan==='free'?'Free':access?.plan==='demo'?copy('Demo','示範'):member.status==='error'?t('status.unknown'):t('status.loading');
 const coverageCount=watchlist.filter(symbol=>!!findInstrument(symbol)).length;

 useEffect(()=>{try{const stored=localStorage.getItem(DASHBOARD_TEMPLATE_KEY) as DashboardTemplate|null;if(stored&&dashboardTemplates.includes(stored))setTemplate(stored)}catch{}},[]);
 useEffect(()=>{try{localStorage.setItem(DASHBOARD_TEMPLATE_KEY,template)}catch{}},[template]);
 useEffect(()=>{let live=true;setStatusError(false);setStatus(null);fetch('/api/data-status').then(r=>{if(!r.ok)throw Error();return r.json()}).then(s=>{if(live)setStatus(s)}).catch(()=>{if(live)setStatusError(true)});return()=>{live=false}},[statusAttempt]);
 useEffect(()=>{let live=true;setResearchError(false);setResearchState(null);if(!full)return()=>{live=false};fetch('/api/research-state',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{if(live)setResearchState(d.state)}).catch(()=>{if(live)setResearchError(true)});return()=>{live=false}},[full,researchAttempt]);

 const summary=<div className="stats-grid investment-summary" aria-label={copy('Investment dashboard summary','投資工作台摘要')}>
  <div className="stat-card highlight"><div className="stat-head">{copy('Membership','會員方案')}<span className="dashboard-status-dot"/></div><div className="stat-value">{planLabel}</div><div className="stat-foot">{access?.periodEnd?copy('Active through ','有效至 ')+date(access.periodEnd):copy('Current access level','目前可用權益')}</div></div>
  <div className="stat-card"><div className="stat-head">{copy('Selected investments','已選投資標的')}</div><div className="stat-value">{full?(researchState?watchlist.length:'—'):'—'}{limits&&<small> / {limits.watch}</small>}</div><div className="stat-foot">{researchError?copy('Could not load account research','帳號研究資料讀取失敗'):copy('Account watchlist, not brokerage positions','帳號觀察清單，不等於券商持倉')}</div></div>
  <div className="stat-card"><div className="stat-head">{copy('Saved research','已保存研究')}</div><div className="stat-value">{full?(researchState?saved.length:'—'):'—'}{limits&&<small> / {limits.saved}</small>}</div><div className="stat-foot">{copy('Reusable company / ETF research conditions','可重複使用的公司／ETF 研究條件')}</div></div>
  <div className="stat-card"><div className="stat-head">{copy('Coverage','研究覆蓋')}</div><div className="stat-value">{researchState?coverageCount:'—'}{researchState&&<small> / {watchlist.length}</small>}</div><div className="stat-foot">{copy('Selected symbols currently covered by QuantPath','你的標的中目前已納入 QuantPath 的數量')}</div></div>
 </div>;

 const investmentsPanel=<section className="panel investment-list-panel dashboard-card-investments">
  <div className="panel-head"><div><p className="eyebrow">{copy('MY INVESTMENTS','我的投資標的')}</p><h2>{copy('Research watchlist','研究觀察清單')}</h2><p>{copy('Your saved symbols appear first. Coverage gaps are shown explicitly instead of creating a false profile.','你保存的標的優先顯示；尚未納入的標的會明確標示，不建立假的資料頁。')}</p></div><button className="btn" onClick={()=>go('equities')}>{copy('Edit list','編輯清單')}</button></div>
  {researchError?<div className="dashboard-empty"><strong>{copy('Account research could not be loaded.','帳號研究資料目前無法讀取。')}</strong><button className="btn" onClick={()=>setResearchAttempt(x=>x+1)}>{t('status.retry')}</button></div>:!full?<div className="dashboard-empty"><strong>{copy('Research / Pro access is required for an account watchlist.','帳號投資觀察清單需 Research／Pro 權益。')}</strong><button className="btn" onClick={()=>go('account')}>{copy('Check membership','查看會員權益')}</button></div>:!researchState?<div className="dashboard-empty">{t('status.loading')}</div>:watchlist.length===0?<div className="dashboard-empty"><strong>{copy('No selected investments yet.','尚未選擇投資標的。')}</strong><p>{copy('Add symbols from Stocks & ETFs. They will appear here automatically.','到「股票與 ETF」加入標的後，會自動出現在這裡。')}</p><button className="btn primary" onClick={()=>go('equities')}>{copy('Choose investments','選擇投資標的')} →</button></div>:<div className="investment-table">{watchlist.slice(0,10).map(symbol=>{const asset=findInstrument(symbol);return <div className="investment-row" key={symbol}><div className="investment-symbol"><strong>{symbol}</strong><small>{asset?asset.type.toUpperCase():copy('WATCH','觀察')}</small></div><div className="investment-name"><strong>{asset?asset.name:copy('Not yet in current QuantPath coverage','尚未納入目前 QuantPath 研究範圍')}</strong><small>{asset?(asset.summary?.[locale]||asset.summary?.en||copy('Research profile available','已有研究資料')):copy('Keep it on your list; data will appear only after a verified source is added.','保留在你的清單中；完成可驗證資料來源後才會顯示研究資料。')}</small></div><span className={'badge '+(asset?'':'neutral')}>{asset?copy('Covered','已覆蓋'):copy('Coverage gap','待補資料')}</span>{asset?<a className="text-link" href={instrumentHref(locale,symbol)}>{copy('Open','開啟')} ↗</a>:<span className="investment-unavailable">—</span>}</div>})}{watchlist.length>10&&<button className="text-link investment-more" onClick={()=>go('equities')}>{copy('View all selected investments','查看全部標的')} ({watchlist.length}) →</button>}</div>}
 </section>;

 const portfolioPanel=<section className="panel panel-body portfolio-status-card dashboard-card-portfolio">
  <p className="eyebrow">{copy('PORTFOLIO STATUS','投資狀況')}</p><h2>{copy('Research view now; brokerage view next.','現在先做研究總覽；券商持倉再串接。')}</h2>
  <div className="portfolio-readiness">
   <p><span>{copy('Research watchlist','研究觀察清單')}</span><strong>{researchState?copy('Connected','已連接'):copy('Checking','確認中')}</strong></p>
   <p><span>{copy('Actual quantity / cost basis','實際股數／成本')}</span><strong>{copy('Not stored','尚未儲存')}</strong></p>
   <p><span>{copy('Live / delayed quotes','即時／延遲行情')}</span><strong>{copy('Not connected','尚未接入')}</strong></p>
   <p><span>{copy('Market value / unrealized P&L','市值／未實現損益')}</span><strong>{copy('Not calculated','不推算')}</strong></p>
  </div>
  <div className="callout">{copy('QuantPath will not infer a portfolio value from a watchlist. The next portfolio layer will add quantity, cost basis and currency before market value is shown.','QuantPath 不會把觀察清單推定成真實持倉。下一階段會先加入股數、成本與幣別，再顯示市值與損益。')}</div>
 </section>;

 const savedPanel=<section className="panel panel-body dashboard-card-saved">
  <span className="eyebrow">{copy('SAVED WORK','已保存研究')}</span><h2>{copy('Continue where you left off','接續上次的研究')}</h2>
  {researchState&&saved.length?<div className="saved-dashboard-list">{saved.slice(0,4).map((item:any)=><button className="saved-dashboard-item" key={item.id} onClick={()=>go('equities')}><span><strong>{item.name}</strong><small>{item.query||copy('Saved research condition','已保存研究條件')} · {item.year}</small></span><span aria-hidden="true">→</span></button>)}</div>:<p>{researchError?copy('Saved research is temporarily unavailable.','已保存研究目前無法讀取。'):copy('No saved research yet. Save a comparison or condition in Stocks & ETFs and it will appear here.','目前沒有已保存研究；在「股票與 ETF」保存比較或條件後，就會出現在這裡。')}</p>}
  <button className="btn" onClick={()=>go('equities')}>{copy('Open research tools','開啟研究工具')}</button>
 </section>;

 const membershipPanel=<section className="panel panel-body membership-dashboard-card dashboard-card-membership">
  <span className="eyebrow">{copy('MEMBERSHIP','會員')}</span><h2>{planLabel}</h2><p>{copy('Your access controls research depth and account-saving limits. It does not create missing market data.','會員權益決定研究深度與帳號儲存上限，不會補出不存在的市場資料。')}</p>
  {access?.periodEnd&&<p><strong>{copy('Access through','權益有效至')}</strong><br/>{date(access.periodEnd)} · Asia/Taipei</p>}
  {limits&&<div className="membership-mini-usage"><span>{copy('Watchlist','觀察標的')} {researchState?watchlist.length:'—'} / {limits.watch}</span><span>{copy('Saved research','保存研究')} {researchState?saved.length:'—'} / {limits.saved}</span></div>}
  <p className="small muted">{t('status.sales')}</p><button className="btn" onClick={()=>go('account')}>{copy('Membership details','會員詳情')}</button>
 </section>;

 const dataPanel=<section className="panel panel-body dashboard-card-data">
  <span className="eyebrow">{copy('DATA STATUS','資料狀態')}</span><h2>{copy('Freshness & evidence','資料新鮮度與證據')}</h2><p>{t('overview.sourceHint')}</p>
  {status?<dl className="source-status"><dt>{t('workspace.equities')}</dt><dd>{status.equities.companies} · {date(status.equities.retrievedAt)}</dd>{status.research&&<><dt>{t('overview.filingObservations')}</dt><dd>{status.research.filingObservations} · {status.research.observedIssuers} {t('overview.observedIssuers')}</dd><dt>{t('overview.news')}</dt><dd>{status.research.newsStatus==='connected'?t('overview.ready'):t('overview.rightsReview')}</dd><dt>{t('overview.aiSignals')}</dt><dd>{status.research.ai.releaseAllowed?t('overview.ready'):t('overview.blocked')}</dd></>}</dl>:<div role="status">{statusError?copy('Source status could not be loaded.','資料來源狀態無法讀取。'):t('status.loading')}{statusError&&<button className="btn" onClick={()=>setStatusAttempt(x=>x+1)}>{t('status.retry')}</button>}</div>}
 </section>;

 const lotteryPanel=<section className="panel panel-body lottery-secondary-card dashboard-card-lottery">
  <span className="eyebrow">{copy('SEPARATE WORKSPACE','獨立工具區')}</span><h2>{t('workspace.lottery')}</h2><p>{t('overview.lotterySub')}</p><button className="text-link" onClick={onBudget}>{copy('Entertainment budget','娛樂預算')} · {new Intl.NumberFormat(locale==='en'?'en-US':'zh-TW',{style:'currency',currency:'TWD',maximumFractionDigits:0}).format(budget)}</button><div className="actions"><button className="btn" onClick={()=>go('analysis')}>{t('workspace.analysis')}</button><button className="btn" onClick={()=>go('records')}>{t('overview.records')}</button></div>
 </section>;

 return <div className={'investment-dashboard template-'+template}>
  <div className="page-heading investment-heading">
   <div><div className="eyebrow">INVESTMENT RESEARCH DASHBOARD</div><h1>{copy('Your investments, research and access — in one view.','你的投資標的、研究與會員權益，一頁掌握。')}</h1><p>{copy('Start from the instruments you selected, then move into company facts, ETF research and saved work.','先看你選擇的投資標的，再進入公司資料、ETF 研究與已保存的分析。')}</p></div>
   <div className="actions"><button className="btn primary" onClick={()=>go('equities')}>{copy('Manage investments','管理投資標的')} →</button><button className="btn" onClick={()=>go('account')}>{copy('Membership','會員權益')}</button></div>
  </div>

  <DashboardTemplatePicker locale={locale} value={template} onChange={setTemplate}/>
  {summary}

  {template==='overview'&&<>
   <DashboardGrid className="overview-main-grid">{investmentsPanel}{portfolioPanel}</DashboardGrid>
   <DashboardGrid className="overview-secondary-grid">{savedPanel}{membershipPanel}{dataPanel}{lotteryPanel}</DashboardGrid>
  </>}

  {template==='portfolio'&&<>
   <DashboardGrid className="portfolio-main-grid">{investmentsPanel}{portfolioPanel}</DashboardGrid>
   <DashboardGrid className="portfolio-secondary-grid">{membershipPanel}{dataPanel}{savedPanel}{lotteryPanel}</DashboardGrid>
  </>}

  {template==='research'&&<>
   <DashboardGrid className="research-main-grid">{savedPanel}{dataPanel}</DashboardGrid>
   <DashboardGrid className="research-secondary-grid">{investmentsPanel}{membershipPanel}{portfolioPanel}{lotteryPanel}</DashboardGrid>
  </>}
 </div>;
}

export function LiveDataStatus({locale}:{locale:string}){
 const t=(k:string)=>workspaceText(locale,k);const [data,setData]=useState<any>(null),[error,setError]=useState(false);
 useEffect(()=>{fetch('/api/data-status').then(r=>{if(!r.ok)throw Error();return r.json()}).then(setData).catch(()=>setError(true))},[]);
 return <section className="panel panel-body"><h2>{t('overview.sources')}</h2><p>{t('overview.sourceHint')}</p>{data?<><p>{t('workspace.equities')}: {data.equities.companies} · {data.equities.retrievedAt}</p>{data.lottery.map((d:any)=><p key={d.game}>{d.game}: {d.count} · {d.coverageEnd} · {d.retrievedAt}</p>)}</>:<p>{t(error?'status.unknown':'status.loading')}</p>}</section>;
}
