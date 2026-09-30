export const WAREHOUSE_SOURCE_ROWS=[
 {source_key:'sec_companyfacts',name:'SEC EDGAR Companyfacts',category:'regulator',base_url:'https://data.sec.gov/api/xbrl/companyfacts/',rights_status:'approved',refresh_cadence:'daily'},
 {source_key:'bls_public_api',name:'U.S. Bureau of Labor Statistics Public Data API',category:'government',base_url:'https://api.bls.gov/publicAPI/v2/timeseries/data/',rights_status:'approved',refresh_cadence:'daily'},
 {source_key:'fed_h10',name:'Federal Reserve H.10',category:'government',base_url:'https://www.federalreserve.gov/releases/h10/current/',rights_status:'approved',refresh_cadence:'6h'},
 {source_key:'ecb_fx',name:'European Central Bank reference rates',category:'government',base_url:'https://www.ecb.europa.eu/stats/eurofxref/',rights_status:'approved',refresh_cadence:'6h'},
 {source_key:'circle_transparency',name:'Circle Transparency',category:'issuer',base_url:'https://www.circle.com/transparency',rights_status:'approved',refresh_cadence:'6h'},
 {source_key:'tether_transparency',name:'Tether Transparency',category:'issuer',base_url:'https://tether.to/en/transparency/',rights_status:'approved',refresh_cadence:'6h'},
 {source_key:'bitcoin_protocol',name:'Bitcoin.org protocol documentation',category:'protocol',base_url:'https://bitcoin.org/en/how-it-works',rights_status:'approved',refresh_cadence:'manual'},
 {source_key:'ethereum_protocol',name:'Ethereum.org protocol documentation',category:'protocol',base_url:'https://ethereum.org/en/staking/',rights_status:'approved',refresh_cadence:'manual'},
 {source_key:'market_price_provider',name:'Market price provider',category:'market',base_url:'https://quantpathlabs.com/',rights_status:'review_required',refresh_cadence:'pending'},
 {source_key:'taiwan_lottery',name:'Taiwan Lottery',category:'lottery',base_url:'https://www.taiwanlottery.com/',rights_status:'approved',refresh_cadence:'daily'},
 {source_key:'ny_open_data_lottery',name:'New York State Gaming Commission / NY Open Data',category:'lottery',base_url:'https://data.ny.gov/',rights_status:'approved',refresh_cadence:'daily'},
 {source_key:'etf_issuer_facts',name:'ETF issuer / prospectus facts',category:'issuer',base_url:'https://quantpathlabs.com/',rights_status:'approved',refresh_cadence:'manual'}
];

const METRICS=['revenue','netIncome','operatingCashFlow','grossProfit','operatingIncome','researchDevelopment','capitalExpenditure'];
const lotteryMeta={
 lotto:{game_key:'tw-lotto649',country:'TW',name:'Taiwan Lotto 6/49',source_key:'taiwan_lottery'},
 power:{game_key:'tw-superlotto638',country:'TW',name:'Taiwan Super Lotto 6/38',source_key:'taiwan_lottery'},
 daily:{game_key:'tw-daily539',country:'TW',name:'Taiwan Daily 539',source_key:'taiwan_lottery'},
 powerball:{game_key:'us-powerball',country:'US',name:'Powerball',source_key:'ny_open_data_lottery'},
 megamillions:{game_key:'us-megamillions',country:'US',name:'Mega Millions',source_key:'ny_open_data_lottery'}
};

const finite=v=>Number.isFinite(Number(v));
const isoMonth=date=>date?.length===7?date+'-01':date;
export const batchRows=(rows,size=500)=>Array.from({length:Math.ceil(rows.length/size)},(_,i)=>rows.slice(i*size,(i+1)*size));

function factsFromRow(symbol,periodType,row,retrievedAt){
 const out=[];
 for(const metric of METRICS){
  const f=row?.[metric];if(!f||!finite(f.value))continue;
  out.push({symbol,period_type:periodType,period_start:row.start,period_end:row.end,metric,value:Number(f.value),unit:'USD',filed_on:f.filed||null,accession:f.accession||null,source_tag:f.tag||null,source_form:f.form||null,source_key:'sec_companyfacts',is_derived:!!(f.method&&f.method!=='reported'),derivation:f.method||null,retrieved_at:retrievedAt});
 }
 return out;
}

export function buildResearchWarehouse({equities,quarterly,macro,context,digital,etfs,lotteries,researchFeed=null,researchReadiness=null}){
 const sources=WAREHOUSE_SOURCE_ROWS.map(x=>({...x,notes:{}}));
 const instruments=[
  ...equities.companies.map(c=>({symbol:c.symbol,name:c.name,asset_class:'stock',market:c.market||'US-listed',currency:'USD',sector:c.sector||null,instrument_group:'ai-company',source_key:'sec_companyfacts',metadata:{cik:c.cik,aiRole:c.aiRole,reviewedAt:c.reviewedAt}})),
  ...etfs.map(f=>({symbol:f.symbol,name:f.name,asset_class:'etf',market:f.market||null,currency:f.currency||null,sector:null,instrument_group:f.group||null,source_key:'etf_issuer_facts',metadata:{benchmark:f.benchmark,exposure:f.exposure,stage:f.stage,reviewed:f.reviewed}})),
  {symbol:'BTC',name:'Bitcoin',asset_class:'crypto',market:'global',currency:'USD',sector:null,instrument_group:'digital',source_key:'bitcoin_protocol',metadata:{}},
  {symbol:'ETH',name:'Ethereum',asset_class:'crypto',market:'global',currency:'USD',sector:null,instrument_group:'digital',source_key:'ethereum_protocol',metadata:{}},
  {symbol:'USDC',name:'USD Coin',asset_class:'stablecoin',market:'global',currency:'USD',sector:null,instrument_group:'stablecoin',source_key:'circle_transparency',metadata:{}},
  {symbol:'USDT',name:'Tether USD',asset_class:'stablecoin',market:'global',currency:'USD',sector:null,instrument_group:'stablecoin',source_key:'tether_transparency',metadata:{}}
 ];
 const fundProfiles=etfs.map(f=>({symbol:f.symbol,expense_ratio_pct:f.expense,benchmark:f.benchmark,exposure:f.exposure,currency:f.currency,market:f.market,fund_group:f.group,scope:f.scope,risk:f.risk,fee_note:f.feeNote,issuer_url:f.url,reviewed_on:f.reviewed,source_key:'etf_issuer_facts'}));
 const annualFacts=equities.companies.flatMap(c=>c.years.flatMap(row=>factsFromRow(c.symbol,'annual',row,equities.retrievedAt)));
 const quarterFacts=quarterly.companies.flatMap(c=>c.quarters.flatMap(row=>factsFromRow(c.symbol,'quarter',row,quarterly.retrievedAt)));
 const ttmFacts=quarterly.companies.flatMap(c=>c.ttm?factsFromRow(c.symbol,'ttm',c.ttm,quarterly.retrievedAt):[]);
 const macroSeries=macro.series.map(s=>({series_key:s.id,name_en:s.label.en,name_zh:s.label.zh,unit:s.unit,frequency:s.frequency,transformation:s.transformation||null,source_key:'bls_public_api',metadata:{seriesId:s.seriesId}}));
 const macroObservations=macro.series.flatMap(s=>s.rows.filter(r=>finite(r.value)).map(r=>({series_key:s.id,observation_date:isoMonth(r.date),value:Number(r.value),preliminary:!!r.preliminary,retrieved_at:macro.retrievedAt})));
 const fxObservations=[];
 for(const row of context.sources.h10?.rows||[]){
  for(const [field,pair] of [['usdTwd','USD/TWD'],['usdJpy','USD/JPY'],['eurUsd','EUR/USD']])if(finite(row[field]))fxObservations.push({source_key:'fed_h10',observation_date:row.date,pair,value:Number(row[field]),is_derived:false,derivation:null,retrieved_at:context.sources.h10.retrievedAt});
  if(finite(row.usdTwd)&&finite(row.usdJpy))fxObservations.push({source_key:'fed_h10',observation_date:row.date,pair:'JPY/TWD',value:Number(row.usdTwd)/Number(row.usdJpy),is_derived:true,derivation:'USD/TWD ÷ USD/JPY',retrieved_at:context.sources.h10.retrievedAt});
  if(finite(row.usdTwd)&&finite(row.eurUsd))fxObservations.push({source_key:'fed_h10',observation_date:row.date,pair:'EUR/TWD',value:Number(row.usdTwd)*Number(row.eurUsd),is_derived:true,derivation:'EUR/USD × USD/TWD',retrieved_at:context.sources.h10.retrievedAt});
 }
 for(const row of context.sources.ecb?.rows||[]){
  if(finite(row.eurUsd))fxObservations.push({source_key:'ecb_fx',observation_date:row.date,pair:'EUR/USD',value:Number(row.eurUsd),is_derived:false,derivation:null,retrieved_at:context.sources.ecb.retrievedAt});
  if(finite(row.usdJpy))fxObservations.push({source_key:'ecb_fx',observation_date:row.date,pair:'USD/JPY',value:Number(row.usdJpy),is_derived:true,derivation:'EUR/JPY ÷ EUR/USD',retrieved_at:context.sources.ecb.retrievedAt});
 }
 const digitalFacts=[];
 const pushDigital=(symbol,date,metric,value,unit,source_key,status,metadata={})=>{if(date&&finite(value))digitalFacts.push({symbol,observation_date:date,metric,value:Number(value),unit,source_key,status,retrieved_at:digital.stablecoins?.[symbol]?.retrievedAt||digital.reviewedAt+'T00:00:00Z',metadata})};
 const usdc=digital.stablecoins.USDC,usdt=digital.stablecoins.USDT;
 pushDigital('USDC',usdc.reserveAsOf,'peg_target',usdc.pegTarget,'USD','circle_transparency','verified');
 pushDigital('USDC',usdc.reserveAsOf,'circulation',usdc.circulationUsd,'USD','circle_transparency','verified');
 pushDigital('USDC',usdc.reserveAsOf,'reserves',usdc.reservesUsd,'USD','circle_transparency','verified');
 if(finite(usdc.reservesUsd)&&finite(usdc.circulationUsd)&&Number(usdc.circulationUsd)>0)pushDigital('USDC',usdc.reserveAsOf,'reserve_coverage_pct',Number(usdc.reservesUsd)/Number(usdc.circulationUsd)*100,'percent','circle_transparency','verified');
 pushDigital('USDT',digital.reviewedAt,'peg_target',usdt.pegTarget,'USD','tether_transparency','source_only');
 const evidenceSourceMap={
  'sec-edgar':{id:'sec-edgar',name:'SEC EDGAR',kind:'filing',url:'https://www.sec.gov/search-filings/edgar-application-programming-interfaces',status:'connected',rights_scope:'Public filing metadata and factual XBRL values; no full issuer-document republication'},
  'nvidia-blog':{id:'nvidia-blog',name:'NVIDIA Blog',kind:'news',url:'https://blogs.nvidia.com/',status:'manual_verified',rights_scope:'Canonical link, bibliographic metadata and original short summary only; no full-text republication or automated feed authorization'}
 };
 const feedDocs=Array.isArray(researchFeed?.documents)?researchFeed.documents:[];
 const evidenceSources=[...new Set(feedDocs.map(d=>d.sourceId))].map(id=>({...evidenceSourceMap[id],id,name:evidenceSourceMap[id]?.name||id,kind:evidenceSourceMap[id]?.kind||'news',url:evidenceSourceMap[id]?.url||'https://quantpathlabs.com/',status:evidenceSourceMap[id]?.status||'manual_verified',rights_scope:evidenceSourceMap[id]?.rights_scope||null,checked_at:researchFeed?.retrievedAt||new Date().toISOString(),coverage_note:{coverage:researchFeed?.coverage||null}}));
 const evidenceDocuments=feedDocs.map(d=>({id:d.id,source_id:d.sourceId,canonical_url:d.url,title:d.title,summary:d.summary||{},kind:d.kind,published_on:d.publishedOn,published_at:d.publishedAt||null,event_on:d.eventOn||null,first_seen_at:d.firstObservedAt||d.retrievedAt,retrieved_at:d.retrievedAt,language:d.language||'en',content_hash:d.contentHash||d.id,rights_scope:d.rightsScope||null}));
 const evidenceEntities=feedDocs.flatMap(d=>(d.symbols||[]).map(symbol=>({document_id:d.id,symbol,method:'issuer_cik'})));
 const evidenceFilings=feedDocs.filter(d=>d.kind==='filing'&&d.form&&d.accession&&(d.symbols||[]).length).map(d=>({document_id:d.id,symbol:d.symbols[0],form:d.form,accession:d.accession,items:d.items||'',first_observed_at:d.firstObservedAt||d.retrievedAt,backfill:!!d.backfill,category:d.form.startsWith('10-K')?'annual_filing':d.form.startsWith('10-Q')?'quarterly_filing':'current_report',classifier:'sec-form-rule-v1'}));
 const lotteryGames=lotteries.map(d=>{const m=lotteryMeta[d.game];return {game_key:m.game_key,country:m.country,name:m.name,source_key:m.source_key,source_url:d.sourceUrl,coverage_start:d.coverageStart,coverage_end:d.coverageEnd,retrieved_at:d.retrievedAt,metadata:{officialGameUrl:d.officialGameUrl||null,sha256:d.sha256,count:d.count}}});
 const lotteryDraws=lotteries.flatMap(d=>{const m=lotteryMeta[d.game];return d.draws.map(x=>({game_key:m.game_key,draw_id:String(x.id),draw_date:x.date,numbers:x.numbers,special:x.special??null,multiplier:x.multiplier??null,prizes:x.prizes||[],retrieved_at:d.retrievedAt}))});
 const statuses=[
  {dataset_key:'catalog_instruments',domain:'catalog',status:'ready',record_count:instruments.length,coverage_start:null,coverage_end:null,last_retrieved_at:equities.retrievedAt,rights_status:'approved',source_keys:['sec_companyfacts','etf_issuer_facts','bitcoin_protocol','ethereum_protocol','circle_transparency','tether_transparency'],notes:{}},
  {dataset_key:'fund_profiles',domain:'fund',status:'ready',record_count:fundProfiles.length,coverage_start:null,coverage_end:fundProfiles.map(x=>x.reviewed_on).sort().at(-1)||null,last_retrieved_at:equities.retrievedAt,rights_status:'approved',source_keys:['etf_issuer_facts'],notes:{}},
  {dataset_key:'fundamental_annual',domain:'fundamental',status:'ready',record_count:annualFacts.length,coverage_start:null,coverage_end:equities.asOf,last_retrieved_at:equities.retrievedAt,rights_status:'approved',source_keys:['sec_companyfacts'],notes:{period_type:'annual'}},
  {dataset_key:'fundamental_quarter',domain:'fundamental',status:'ready',record_count:quarterFacts.length,coverage_start:null,coverage_end:quarterly.asOf,last_retrieved_at:quarterly.retrievedAt,rights_status:'approved',source_keys:['sec_companyfacts'],notes:{period_type:'quarter'}},
  {dataset_key:'fundamental_ttm',domain:'fundamental',status:'ready',record_count:ttmFacts.length,coverage_start:null,coverage_end:quarterly.asOf,last_retrieved_at:quarterly.retrievedAt,rights_status:'approved',source_keys:['sec_companyfacts'],notes:{period_type:'ttm'}},
  {dataset_key:'macro_bls',domain:'macro',status:'ready',record_count:macroObservations.length,coverage_start:macroObservations[0]?.observation_date||null,coverage_end:macroObservations.at(-1)?.observation_date||null,last_retrieved_at:macro.retrievedAt,rights_status:'approved',source_keys:['bls_public_api'],notes:{}},
  {dataset_key:'fx_reference',domain:'fx',status:'ready',record_count:fxObservations.length,coverage_start:null,coverage_end:null,last_retrieved_at:context.attemptedAt,rights_status:'approved',source_keys:['fed_h10','ecb_fx'],notes:{}},
  {dataset_key:'evidence_documents',domain:'evidence',status:'ready',record_count:evidenceDocuments.length,coverage_start:null,coverage_end:feedDocs.map(d=>d.publishedOn).filter(Boolean).sort().at(-1)||null,last_retrieved_at:researchFeed?.retrievedAt||null,rights_status:'approved',source_keys:['sec_companyfacts'],notes:{newsStatus:researchFeed?.newsStatus||'unknown',socialStatus:researchFeed?.socialStatus||'unknown'}},
  {dataset_key:'model_readiness',domain:'model',status:researchReadiness?.releaseAllowed?'ready':'blocked',record_count:Number(researchReadiness?.observedDocuments)||0,coverage_start:null,coverage_end:null,last_retrieved_at:researchReadiness?.evaluatedAt||null,rights_status:'approved',source_keys:['sec_companyfacts'],notes:{task:researchReadiness?.task||null,reason:researchReadiness?.reason||null,requiredGates:researchReadiness?.requiredGates||{}}},
  {dataset_key:'digital_issuer_facts',domain:'digital',status:'partial',record_count:digitalFacts.length,coverage_start:null,coverage_end:digital.reviewedAt,last_retrieved_at:digital.reviewedAt+'T00:00:00Z',rights_status:'approved',source_keys:['circle_transparency','tether_transparency'],notes:{market_prices:'blocked_pending_rights'}},
  {dataset_key:'market_prices',domain:'market',status:'blocked',record_count:0,coverage_start:null,coverage_end:null,last_retrieved_at:null,rights_status:'review_required',source_keys:['market_price_provider'],notes:{reason:'No approved redistributable market-price provider is connected yet'}},
  ...lotteries.map(d=>{const m=lotteryMeta[d.game];return {dataset_key:'lottery_'+m.game_key,domain:'lottery',status:'ready',record_count:d.count,coverage_start:d.coverageStart,coverage_end:d.coverageEnd,last_retrieved_at:d.retrievedAt,rights_status:'approved',source_keys:[m.source_key],notes:{sha256:d.sha256}}})
 ];
 return {sources,instruments,fundProfiles,annualFacts,quarterFacts,ttmFacts,macroSeries,macroObservations,fxObservations,digitalFacts,evidenceSources,evidenceDocuments,evidenceEntities,evidenceFilings,lotteryGames,lotteryDraws,statuses};
}
