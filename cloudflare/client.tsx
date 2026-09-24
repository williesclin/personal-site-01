import React from 'react';
import {isWorkspaceHash} from '../app/member-access.mjs';
import {createRoot} from 'react-dom/client';
import App from '../app/page';
import {PublicSite} from '../app/public-site';
import {publicRoute} from '../app/public-content.mjs';
import '../app/public-site.css';
import '../app/globals.css';
function Entry(){const [hash,setHash]=React.useState(location.hash);React.useEffect(()=>{const change=()=>setHash(location.hash);window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change)},[]);const route=publicRoute(location.pathname);const workspace=isWorkspaceHash(hash);React.useEffect(()=>{if(!workspace)document.documentElement.lang=route?.locale==='zh-hant'?'zh-Hant':'en';},[workspace,route?.locale]);return workspace?<App initialLocale={route?.locale||'en'}/>:route?<PublicSite path={location.pathname}/>:<main style={{padding:40}}><h1>Page not found / 找不到頁面</h1><a href='/en/'>Home / 首頁</a></main>;}
createRoot(document.getElementById('root')!).render(<Entry/>);

import {installAnalytics} from './analytics-browser.mjs';
installAnalytics(import.meta.env.VITE_GA4_MEASUREMENT_ID);
