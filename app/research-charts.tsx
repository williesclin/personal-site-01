import {useState} from 'react';
import {DIMENSIONS,dimensionValue,chartRows} from './research-dimensions.mjs';
import {AI_SECTORS} from './ai-universe.mjs';
const colors=['#08775f','#2364aa','#a74715','#773a98','#525e10'];
export function ResearchCharts({companies,locale,full,year}:{companies:any[];locale:string;full:boolean;year:string}){
 const zh=locale==='zh-hant',t=(a:string,b:string)=>zh?b:a;
 const [metric,setMetric]=useState('revenue'),[second,setSecond]=useState('netMargin'),[mode,setMode]=useState('trend'),[sector,setSector]=useState('all'),[selected,setSelected]=useState<string[]>(['NVDA']);
 const eligible=companies.filter(c=>sector==='all'||c.sector===sector),chosen=eligible.filter(c=>selected.includes(c.symbol)).slice(0,5);
 const keys=full?Object.keys(DIMENSIONS):['revenue','netIncome','operatingCashFlow'];
 const label=(k:string)=>DIMENSIONS[k][zh?'zh':'en'],unit=(k:string)=>DIMENSIONS[k].unit==='USD'?t('USD billions','十億美元'):'%';
 const scale=(v:number,k:string)=>DIMENSIONS[k].unit==='USD'?v/1e9:v;
 const fmt=(v:number|null,k:string)=>v==null?'—':new Intl.NumberFormat(zh?'zh-TW':'en-US',{maximumFractionDigits:2}).format(scale(v,k));
 const rows=chartRows(chosen,metric,year),ys=rows.filter(r=>r.value!==null).map(r=>scale(r.value,metric));
 const histories=chosen.map(c=>({symbol:c.symbol,rows:[...c.years].reverse().map((r:any)=>({end:r.end,start:r.start,value:dimensionValue(r,metric,c.years[c.years.indexOf(r)+1])}))}));
 const values=mode==='trend'?histories.flatMap(c=>c.rows.filter((r:any)=>r.value!==null).map((r:any)=>scale(r.value,metric))):ys;
 const lo=Math.min(0,...values),hi=Math.max(0,...values),span=hi-lo||1;
 const y=(v:number)=>250-(v-lo)/span*210;
 const dates=histories.flatMap(c=>c.rows.map((r:any)=>Date.parse(r.end))),dlo=Math.min(...dates),dhi=Math.max(...dates);
 const x=(date:string)=>70+(Date.parse(date)-dlo)/(dhi-dlo||1)*590;
 const points=rows.map((r,i)=>({...r,other:chartRows(chosen,second,year)[i]?.value}));
 const otherValues=points.filter(r=>r.other!==null).map(r=>scale(r.other,second));
 const olo=Math.min(0,...otherValues),ohi=Math.max(0,...otherValues),oy=(v:number)=>250-(v-olo)/(ohi-olo||1)*210;
 const exportCsv=()=>{const lines=[['symbol','period_start','period_end',metric,DIMENSIONS[metric].unit],...rows.map(r=>[r.symbol,r.start,r.end,r.value??'',DIMENSIONS[metric].unit])];const csv=lines.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='quantpath-financial-comparison.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
 return <section className="eq-section"><h2>{t('Build a financial chart','建立多維財報圖表')}</h2><p>{t('Choose up to five companies, a dimension and a chart. Values are company-wide annual facts, not AI-only revenue.','選擇最多五家公司、分析維度與圖表。數字是公司整體年度財報，不是 AI 專屬營收。')}</p>
 <div className="eq-controls">{full&&<label>{t('AI research category','AI 研究分類')}<select value={sector} onChange={e=>setSector(e.target.value)}><option value="all">{t('All categories','全部分類')}</option>{Object.entries(AI_SECTORS).map(([k,v]:any)=><option key={k} value={k}>{v[zh?'zh-hant':'en']}</option>)}</select></label>}
 <label>{t('Dimension','分析維度')}<select value={metric} onChange={e=>setMetric(e.target.value)}>{keys.map(k=><option key={k} value={k}>{label(k)} · {unit(k)}</option>)}</select></label>
 <label>{t('Chart','圖表')}<select value={mode} onChange={e=>setMode(e.target.value)}><option value="trend">{t('Annual trend','年度折線圖')}</option><option value="bar">{t('Company comparison','公司長條比較')}</option>{full&&<option value="scatter">{t('Two-dimension scatter','雙維度散佈圖')}</option>}</select></label>
 {mode==='scatter'&&<label>{t('Vertical dimension','縱軸維度')}<select value={second} onChange={e=>setSecond(e.target.value)}>{keys.map(k=><option key={k} value={k}>{label(k)} · {unit(k)}</option>)}</select></label>}
 </div>
 <fieldset className="eq-metrics"><legend>{t('Companies (maximum 5)','比較公司（最多 5 家）')}</legend>{eligible.map(c=><label key={c.symbol}><input type="checkbox" checked={selected.includes(c.symbol)} disabled={!selected.includes(c.symbol)&&selected.length>=5} onChange={()=>setSelected(s=>s.includes(c.symbol)?s.filter(v=>v!==c.symbol):[...s,c.symbol])}/>{c.symbol}</label>)}<button className="btn" onClick={()=>setSelected([])}>{t('Clear selection','清除選取')}</button></fieldset>
 {chosen.length===0?<p role="status">{t('Select a company in this category.','請選擇此分類中的公司。')}</p>:<>
 <p className="eq-meta">{mode==='trend'?t('All available annual periods; exact fiscal dates on the horizontal axis.','全部可用年度；橫軸使用實際會計期末日。'):t('Uses the financial-period filter above. Fiscal periods can differ across companies.','使用上方年度篩選；各公司會計期間可能不同。')} {mode==='scatter'?`${label(metric)} (${unit(metric)}) × ${label(second)} (${unit(second)})`:`${label(metric)} (${unit(metric)})`}</p>
 {values.length===0?<p role="status">{t('This dimension is unavailable for the selection. No zero substitutes.','所選範圍沒有此維度資料，不以零替代。')}</p>:<svg viewBox="0 0 720 300" role="img" aria-label={t('Financial chart; exact values in the table below.','財報圖表；精確數值請見下方表格。')} style={{width:'100%',minHeight:180,background:'#fff'}}>
 <line x1="70" y1="40" x2="70" y2="250" stroke="#8ba9a2"/><line x1="70" y1="250" x2="680" y2="250" stroke="#8ba9a2"/>
 <text x="8" y="48" fontSize="12">{(mode==='scatter'?ohi:hi).toFixed(1)}</text><text x="8" y="250" fontSize="12">{(mode==='scatter'?olo:lo).toFixed(1)}</text>
 {mode==='trend'?histories.map((c,ci)=><g key={c.symbol}>{c.rows.map((r:any,i:number)=>{const prev=c.rows[i-1];if(r.value===null)return null;return <g key={r.end}>{prev?.value!==null&&prev&&<line x1={x(prev.end)} y1={y(scale(prev.value,metric))} x2={x(r.end)} y2={y(scale(r.value,metric))} stroke={colors[ci]} strokeWidth="2"/>}<circle cx={x(r.end)} cy={y(scale(r.value,metric))} r="4" fill={colors[ci]}><title>{c.symbol} {r.end}: {fmt(r.value,metric)} {unit(metric)}</title></circle></g>})}</g>):mode==='bar'?rows.map((r,i)=>r.value===null?null:<g key={r.symbol}><rect x={100+i*110} y={Math.min(y(0),y(scale(r.value,metric)))} width="60" height={Math.max(1,Math.abs(y(0)-y(scale(r.value,metric))))} fill={colors[i]}/><text x={100+i*110} y="275" fontSize="12">{r.symbol}</text></g>):points.map((r,i)=>r.value===null||r.other===null?null:<g key={r.symbol}><circle cx={70+(scale(r.value,metric)-lo)/span*590} cy={oy(scale(r.other,second))} r="6" fill={colors[i]}/><text x={76+(scale(r.value,metric)-lo)/span*590} y={oy(scale(r.other,second))-8} fontSize="12">{r.symbol}</text></g>)}
 {mode==='trend'&&<><text x="70" y="275" fontSize="12">{new Date(dlo).toISOString().slice(0,10)}</text><text x="580" y="275" fontSize="12">{new Date(dhi).toISOString().slice(0,10)}</text></>}
 {mode==='scatter'&&<><text x="70" y="275" fontSize="12">{lo.toFixed(1)}</text><text x="630" y="275" fontSize="12">{hi.toFixed(1)}</text></>}
 </svg>}
 <p>{chosen.map((c,i)=><span key={c.symbol} style={{color:colors[i],marginRight:20}}>● {c.symbol}</span>)}</p>
 <details><summary>{t('Chart values and fiscal dates','圖表數值及會計期間')}</summary><div className="eq-scroll" tabIndex={0}><table><thead><tr><th>{t('Company','公司')}</th><th>{t('Start → end','起日 → 迄日')}</th><th>{label(metric)} ({unit(metric)})</th>{mode==='scatter'&&<th>{label(second)} ({unit(second)})</th>}</tr></thead><tbody>{mode==='trend'?histories.flatMap(c=>c.rows.map((r:any)=><tr key={c.symbol+r.end}><th>{c.symbol}</th><td>{r.start} → {r.end}</td><td>{fmt(r.value,metric)}</td></tr>)):points.map(r=><tr key={r.symbol}><th>{r.symbol}</th><td>{r.start} → {r.end}</td><td>{fmt(r.value,metric)}</td>{mode==='scatter'&&<td>{fmt(r.other,second)}</td>}</tr>)}</tbody></table></div></details>
 {full&&mode!=='trend'&&<button className="btn" onClick={exportCsv}>{t('Export selected primary dimension (CSV)','匯出所選主要維度（CSV）')}</button>}
 </>}
 <p className="eq-meta">{t('Missing values stay blank; no interpolation. Ratios divide by positive revenue. Cash flow less PP&E is a limited proxy, not standardized free cash flow. Revenue tax treatment and fiscal calendars may differ; check the original filing tags. These charts do not measure correlation, predict returns or validate a model.','缺值保持空白，不內插；比率以正營收為分母。營業現金流減設備支出是有限代理值，不是統一定義的自由現金流。營收稅額口徑及會計曆可能不同，請核對申報標籤。圖表不代表相關性、報酬預測或模型驗證。')}</p>
 </section>;
}
