import {instruments,AI_SECTORS,coverageTopics,instrumentHref} from './instrument-catalog.mjs';
import {articles} from './public-content.mjs';
import {publishedNews} from './news-articles.mjs';
import {newsPreview} from './news-preview.generated.mjs';
export const SEARCH_TYPES=['all','stock','etf','guide','article','event','coverage'];
export function searchCatalog(query='',type='all',locale='en'){
 const lang=locale==='zh-hant'?'zh-hant':'en';
 const rows=[...instruments.map(x=>({id:x.symbol,type:x.type,title:x.symbol+' · '+x.name,summary:x.summary[lang],href:instrumentHref(lang,x.symbol),status:x.preview?'preview':'member',search:[x.symbol,x.name,x.aliases,...Object.values(x.summary),...Object.values(AI_SECTORS[x.sector]||{})].join(' '),symbol:x.symbol})),...articles.map(a=>({id:a.id,type:'guide',title:a[lang].title,summary:a[lang].summary,href:`/${lang}/library/${a.id}/`,status:'public',search:[a.id,a.en.title,a.en.summary,a['zh-hant'].title,a['zh-hant'].summary].join(' ')})),...publishedNews.map(a=>({id:a.id,type:'article',title:a[lang].title,summary:a[lang].summary,href:`/${lang}/news/${a.id}/`,status:'public',search:[a.en.title,a['zh-hant'].title,a[lang].summary].join(' ')})),...newsPreview.documents.map(d=>({id:d.id,type:'event',title:d.title,summary:d.summary[lang]+' · '+d.publishedOn,href:`/${lang}/news/?symbol=${encodeURIComponent(d.symbols[0])}#event-${d.id}`,status:'public',search:[d.title,d.form,...d.symbols,...Object.values(d.summary)].join(' ')})),...coverageTopics.map(x=>({id:x.id,type:'coverage',title:lang==='en'?x.en:x.zh,summary:lang==='en'?x.enText:x.zhText,href:`/${lang}/coverage/#${x.id}`,status:'planned',search:x.en+' '+x.zh+' '+x.keywords}))];
 const q=String(query).trim().toLocaleLowerCase().slice(0,120),tokens=q.split(/\s+/).filter(Boolean);
 return rows.filter(r=>(type==='all'||r.type===type)&&tokens.every(k=>r.search.toLocaleLowerCase().includes(k))).sort((a,b)=>Number(b.symbol?.toLowerCase()===q)-Number(a.symbol?.toLowerCase()===q));
}
