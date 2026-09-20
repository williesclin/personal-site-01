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
 const item=articles.find(a=>'library/'+a.id===page);
 const names=zh?{library:'知識庫',tools:'工具',methodology:'研究方法',about:'關於'}:{library:'Library',tools:'Tools',methodology:'Methodology',about:'About'};
 const title=(item?.[locale].title||names[page]||(zh?'機率、證據與決策':'Probability, evidence and decisions'))+' | QuantPath Labs';
 const description=item?.[locale].summary||(zh?'機率入門、預算規劃與模型評估。以清楚的來源、限制與雙語指南，建立可檢視的研究流程。':'Explore probability, budget planning and model evaluation through bilingual guides with clear sources and limits.');
 const alternates=['en','zh-hant'].map(l=>`<link rel="alternate" hreflang="${l==='en'?'en':'zh-Hant'}" href="https://quantpathlabs.com/${l}/${page}${page?'/':''}">`).join('');
 let html=template.replace(/<html lang="[^"]*">/,`<html lang="${zh?'zh-Hant':'en'}">`).replace(/<title>.*?<\/title>/,`<title>${esc(title)}</title>`).replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${esc(description)}">`).replace('</head>',`<link rel="canonical" href="https://quantpathlabs.com${path}">${alternates}<link rel="alternate" hreflang="x-default" href="https://quantpathlabs.com/en/${page}${page?'/':''}"></head>`).replace('<div id="root"></div>',`<div id="root">${renderToString(React.createElement(PublicSite,{path}))}</div>`);
 await mkdir(root+path,{recursive:true});await writeFile(root+path+'index.html',html);urls.push(path);
 if(locale==='en'&&page==='')await writeFile(root+'/index.html',html);
}
await writeFile(root+'/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(p=>`<url><loc>https://quantpathlabs.com${p}</loc></url>`).join('')+'</urlset>');
await writeFile(root+'/robots.txt','User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://quantpathlabs.com/sitemap.xml\n');
console.log(`Prerendered ${urls.length} bilingual public pages and sitemap.`);
