import {publicRoute} from './public-content.mjs';
// Only same-site known public pages can be post-login destinations.
export function safeReturnPath(value,locale='en'){
 if(typeof value!=='string'||value.length>600||!value.startsWith('/')||value.startsWith('//')||/[\\\u0000-\u0020]/.test(value))return null;
 const url=new URL(value,'https://quantpathlabs.com');const route=publicRoute(url.pathname);
 if(url.origin!=='https://quantpathlabs.com'||!route||url.hash)return null;
 const params=new URLSearchParams();for(const key of ['q','type','symbol','case','symbols','period','benchmark','saved'])if(url.searchParams.has(key))params.set(key,url.searchParams.get(key).slice(0,120));
 return `/${locale==='zh-hant'?'zh-hant':'en'}/${route.page}${route.page?'/':''}${params.size?'?'+params:''}`;
}
export function loginHref(locale,path,search='',view='login'){
 const destination=safeReturnPath(path+search,locale);
 return `/${locale}/${destination?'?return='+encodeURIComponent(destination):''}#${view==='signup'?'signup':'login'}`;
}
