import {AI_SECTORS} from './ai-universe.mjs';

const metricKeys=['revenue','netIncome','operatingCashFlow','grossProfit','researchDevelopment','capitalExpenditure'];

function validNumber(v:any){return typeof v==='number'&&Number.isFinite(v)}
function metric(row:any,key:string){return validNumber(row?.[key]?.value)?row[key].value:null}
function margin(row:any,key:string){const rev=metric(row,'revenue'),n=metric(row,key);return rev&&rev>0&&n!==null?n/rev*100:null}
function cagr(start:number|null,end:number|null,years:number){return start!==null&&end!==null&&start>0&&end>=0&&years>0?(Math.pow(end/start,1/years)-1)*100:null}
function fmt(v:number|null,digits=1){return v===null?'—':new Intl.NumberFormat('en-US',{maximumFractionDigits:digits}).format(v)}
function periodsFor(company:any,yearFrom:string,yearTo:string){
 if(!company?.years?.length)return [];
 if(yearFrom==='latest')return company.years.slice(0,1);
 return company.years.filter((r:any)=>{const y=r.end.slice(0,4);return (yearFrom==='all'||y>=yearFrom)&&(yearTo==='latest'||y<=yearTo)});
}

export function ResearchToolbox({locale,companies,allCompanies,selectedFunds,yearFrom,yearTo,benchmark,onSelectStocks,maxStocks}:{locale:string;companies:any[];allCompanies:any[];selectedFunds:string[];yearFrom:string;yearTo:string;benchmark:string;onSelectStocks:(symbols:string[])=>void;maxStocks:number}){
 const zh=locale==='zh-hant',t=(en:string,cn:string)=>zh?cn:en;
 const analyses=companies.map(company=>{
  const periods=periodsFor(company,yearFrom,yearTo).sort((a:any,b:any)=>a.end.localeCompare(b.end)),first=periods[0],last=periods.at(-1);
  const span=first&&last?Math.max(0,(Date.parse(last.end)-Date.parse(first.end))/(365.25*86400000)):0;
  const revCagr=cagr(metric(first,'revenue'),metric(last,'revenue'),span),ocfCagr=cagr(metric(first,'operatingCashFlow'),metric(last,'operatingCashFlow'),span);
  const firstMargin=margin(first,'netIncome'),lastMargin=margin(last,'netIncome');
  const coverage=periods.length?metricKeys.reduce((sum,key)=>sum+periods.filter((r:any)=>metric(r,key)!==null).length,0)/(periods.length*metricKeys.length)*100:null;
  return {company,periods,first,last,span,revCagr,ocfCagr,marginDelta:firstMargin!==null&&lastMargin!==null?lastMargin-firstMargin:null,coverage};
 });
 const yearSets=companies.map(c=>new Set(periodsFor(c,yearFrom,yearTo).map((r:any)=>r.end.slice(0,4))));
 const commonYears=yearSets.length?[...yearSets[0]].filter(y=>yearSets.every(set=>set.has(y))).sort():[];
 const applySector=(sector:string)=>onSelectStocks(allCompanies.filter(c=>c.sector===sector).slice(0,Math.max(0,maxStocks)).map(c=>c.symbol));
 const exportCsv=()=>{
  const rows=[['symbol','company','period_start','period_end',...metricKeys],...companies.flatMap(c=>periodsFor(c,yearFrom,yearTo).map((r:any)=>[c.symbol,c.name,r.start,r.end,...metricKeys.map(k=>metric(r,k)??'')]))];
  const csv=rows.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='quantpath-research-scope.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
 };
 return <section id="research-overview" className="eq-section eq-toolbox">
  <div className="eq-section-heading"><div><p className="eyebrow">RESEARCH TOOLS</p><h2>{t('Quick analysis workspace','快速分析工作台')}</h2><p>{t('Use small tools to understand the selected scope before opening the detailed tables. These are descriptive research aids, not investment recommendations.','先用小工具理解目前比較範圍，再往下看完整表格。這些是描述性研究工具，不是投資建議。')}</p></div></div>
  <div className="eq-tool-summary">
   <article><span>{t('Companies','公司')}</span><strong>{companies.length}</strong></article>
   <article><span>ETF</span><strong>{selectedFunds.length}</strong></article>
   <article><span>{t('Common fiscal years','共同財報年度')}</span><strong>{commonYears.length}</strong><small>{commonYears.slice(-4).join(' · ')||'—'}</small></article>
   <article><span>{t('Benchmark','市場基準')}</span><strong>{benchmark}</strong></article>
  </div>
  <details className="eq-tool" open>
   <summary>{t('Period change analyzer','跨年度變化分析')}</summary>
   <p>{t('Compare the first and last available annual periods inside the selected range. CAGR uses the exact fiscal-period end dates.','比較所選範圍內第一個與最後一個可用年度；CAGR 使用實際會計期末日期計算。')}</p>
   <div className="eq-change-grid">{analyses.map(a=><article key={a.company.symbol}><div><strong>{a.company.symbol}</strong><small>{a.company.name}</small></div><dl><dt>{t('Revenue CAGR','營收 CAGR')}</dt><dd>{a.span>0?fmt(a.revCagr)+'%':'—'}</dd><dt>{t('Net margin change','淨利率變化')}</dt><dd>{a.span>0?fmt(a.marginDelta)+' pp':'—'}</dd><dt>{t('Operating cash flow CAGR','營業現金流 CAGR')}</dt><dd>{a.span>0?fmt(a.ocfCagr)+'%':'—'}</dd><dt>{t('Periods','期數')}</dt><dd>{a.periods.length}</dd></dl></article>)}</div>
   {!analyses.length&&<p>{t('Add at least one company to use this tool.','加入至少一家公司後即可使用。')}</p>}
  </details>
  <details className="eq-tool">
   <summary>{t('Data coverage checker','資料完整度檢查')}</summary>
   <p>{t('Coverage checks six operating fields across the selected fiscal periods: revenue, net income, operating cash flow, gross profit, R&D and capital expenditure.','完整度檢查六項營運欄位：營收、淨利、營業現金流、毛利、研發與資本支出。')}</p>
   <div className="eq-coverage-list">{analyses.map(a=><div key={a.company.symbol}><strong>{a.company.symbol}</strong><div><i style={{width:(a.coverage??0)+'%'}}/></div><span>{a.coverage===null?'—':fmt(a.coverage,0)+'%'}</span></div>)}</div>
  </details>
  <details className="eq-tool">
   <summary>{t('Quick company-set presets','公司組合快捷工具')}</summary>
   <p>{t('These presets only select covered companies by research category; they are not rankings or recommendations. Applying a preset replaces the current company selection and keeps your selected ETFs.','這些快捷選項只依研究分類選取已有資料的公司，不是排名或推薦。套用後會替換目前公司選擇，但保留已選 ETF。')}</p>
   <div className="eq-preset-grid">{Object.entries(AI_SECTORS).map(([key,label]:any)=><button className="btn" key={key} disabled={maxStocks<1} onClick={()=>applySector(key)}><strong>{label[zh?'zh-hant':'en']}</strong><small>{allCompanies.filter(c=>c.sector===key).length} {t('covered','家')}</small></button>)}</div>
  </details>
  <div className="eq-tool-actions"><button className="btn" disabled={!companies.length} onClick={exportCsv}>{t('Export full selected financials (CSV)','匯出目前全部財務資料（CSV）')}</button><a className="btn" href="#financials">{t('Financial table','財務表')}</a><a className="btn" href="#charts">{t('Charts','圖表')}</a><a className="btn" href="#market-context">{t('Market context','市場背景')}</a><a className="btn" href={'/'+locale+'/study/'}>{t('Guided research','引導式研究')}</a><a className="btn" href={'/'+locale+'/news/'}>{t('News & events','新聞與事件')}</a><a className="btn" href={'/'+locale+'/macro/'}>{t('Macro explorer','總經工具')}</a><a className="btn" href={'/'+locale+'/#dashboard'}>{t("Today's Actions",'今日 Actions')}</a></div>
 </section>;
}
