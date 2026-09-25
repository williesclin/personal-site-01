import {findInstrument} from '../app/instrument-catalog.mjs';
import {publishedNews} from '../app/news-articles.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {PublicSite} from '../cloudflare-dist/prerender/public-site.js';
import {pages,articles} from '../app/public-content.mjs';
const root='cloudflare-dist/client';
const template=await readFile(root+'/index.html','utf8');
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const urls=[];
for(const locale of ['en','zh-hant'])for(const page of pages){
 const path=`/${locale}/${page}${page?'/':''}`,zh=locale==='zh-hant';
 const item=articles.find(a=>'library/'+a.id===page)||publishedNews.find(a=>'news/'+a.id===page);
 const names=zh?{search:'全站搜尋',coverage:'資料範圍',news:'新聞與事件',pricing:'會員方案',research:'股票與 ETF 研究',library:'知識庫',tools:'工具',methodology:'研究方法',about:'關於'}:{search:'Site search',coverage:'Data coverage',news:'News & events',pricing:'Membership plans',research:'Stocks & ETF research',library:'Library',tools:'Tools',methodology:'Methodology',about:'About'};
 const instrument=page.startsWith('assets/')?findInstrument(page.split('/')[1]):null;
 const title=(instrument?instrument.symbol+' · '+instrument.name:(item?.[locale].title||names[page]||(zh?'股票、ETF 與財報研究':'Stocks, ETFs and financial research')))+' | QuantPath Labs';
 const description=(instrument?instrument.symbol+' · '+instrument.name+' · '+instrument.summary[locale]+' · '+(zh?'公開標的資料、財務工具資格與相關來源。':'Public instrument profile, research access and related sources.'):null)||item?.[locale].summary||(page==='news'?(zh?'原創文章與 SEC 官方公司申報事件，附來源、申報日期與觀測紀錄。':'Original articles and official SEC filing events with source links, filing dates and observation records.'):null)||(zh?'查看 NVIDIA／IVV 公開預覽；完整股票研究與帳號儲存需有效會員資格。中英雙語、原始來源與資料日期清楚標示。':'Compare annual company financials, fund scope and expenses. Bilingual research tools with membership plans, sources and reporting dates.');
 const alternates=['en','zh-hant'].map(l=>`<link rel="alternate" hreflang="${l==='en'?'en':'zh-Hant'}" href="https://quantpathlabs.com/${l}/${page}${page?'/':''}">`).join('');
 let html=template.replace(/<html lang="[^"]*">/,`<html lang="${zh?'zh-Hant':'en'}">`).replace(/<title>.*?<\/title>/,`<title>${esc(title)}</title>`).replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${esc(description)}">`).replace('</head>',`<link rel="canonical" href="https://quantpathlabs.com${path}">${alternates}<link rel="alternate" hreflang="x-default" href="https://quantpathlabs.com/en/${page}${page?'/':''}"></head>`).replace('<div id="root"></div>',`<div id="root">${renderToString(React.createElement(PublicSite,{path}))}</div>`);
 await mkdir(root+path,{recursive:true});await writeFile(root+path+'index.html',html);urls.push(path);
 if(locale==='en'&&page==='')await writeFile(root+'/index.html',html);
}
await writeFile(root+'/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(p=>`<url><loc>https://quantpathlabs.com${p}</loc></url>`).join('')+'</urlset>');
await writeFile(root+'/robots.txt','User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://quantpathlabs.com/sitemap.xml\n');
console.log(`Prerendered ${urls.length} bilingual public pages and sitemap.`);
