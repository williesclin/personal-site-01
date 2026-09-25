import {AI_COMPANIES,AI_SECTORS} from './ai-universe.mjs';
import {ETFS} from './etf-catalog.mjs';
// Public identity metadata only. Financial facts and member records stay behind the API.
const aliases={NVDA:'輝達 英偉達',MSFT:'微軟',AMD:'超微',INTC:'英特爾',AVGO:'博通',MU:'美光',AMZN:'亞馬遜',GOOGL:'谷歌 Google',META:'臉書 Facebook',ORCL:'甲骨文',ADBE:'奧多比',SMCI:'美超微',IVV:'標普500 S&P500 大盤',ITOT:'美國全市場',IXUS:'國際股票 海外 非美'};
export const instruments=[...AI_COMPANIES.map(c=>({symbol:c.symbol,name:c.name,type:'stock',sector:c.sector,summary:c.aiRole,market:'US-listed',aliases:aliases[c.symbol]||'',preview:c.symbol==='NVDA'})),...ETFS.map(f=>({symbol:f.symbol,name:f.name,type:'etf',sector:'funds',summary:f.scope,market:'US-listed',aliases:aliases[f.symbol]||'',preview:f.symbol==='IVV'}))];
export const instrumentPaths=instruments.map(x=>'assets/'+x.symbol);
export const findInstrument=symbol=>instruments.find(x=>x.symbol===symbol);
export const instrumentHref=(locale,symbol)=>`/${locale}/assets/${symbol}/`;
export const coverageTopics=[
 {id:'macro',en:'Macroeconomics & economic calendar',zh:'總體經濟與經濟日曆',keywords:'macro inflation CPI GDP rates 總經 通膨 利率 景氣 個經',enText:'Economic releases, policy rates and scenario analysis are planned. No live calendar is connected.',zhText:'經濟數據、政策利率與情境分析待接入；目前沒有即時經濟日曆。'},
 {id:'fx-gold',en:'Gold & currencies',zh:'黃金與外匯',keywords:'gold XAU USD JPY EUR dollar yen euro 黃金 美元 美金 日圓 日元 歐元 匯率',enText:'Gold, USD, JPY and EUR prices and trend indicators are not connected yet.',zhText:'黃金、美金、日圓與歐元的報價及趨勢指標尚未接入。'},
 {id:'digital',en:'Crypto & stablecoins',zh:'加密資產與穩定幣',keywords:'crypto bitcoin ethereum BTC ETH USDT USDC stablecoin 比特幣 以太幣 虛擬幣 加密貨幣 穩定幣',enText:'Prices, on-chain measures, reserve sources and depeg monitoring are planned.',zhText:'行情、鏈上指標、儲備來源與脫鉤監測待建置。'},
 {id:'attention',en:'News coverage & social attention',zh:'新聞覆蓋與社群聲量',keywords:'news sentiment volume social 新聞 情緒 聲量 輿情',enText:'SEC filing observations are available. A broad licensed news and social feed is not connected.',zhText:'已有 SEC 申報觀測；完整授權新聞與社群聲量尚未接入。'},
 {id:'models',en:'Models & portfolio evaluation',zh:'模型與投資組合評估',keywords:'alpha beta model benchmark beat market strategy 模型 打贏大盤 策略 超額報酬',enText:'Annual financial comparisons are available. Validated rankings, out-of-sample returns and portfolio risk models are not released.',zhText:'已有年度財務比較；已驗證排名、樣本外報酬與投資組合風險模型尚未發布。'},
 {id:'global-lottery',en:'International lottery',zh:'海外樂透',keywords:'lottery Powerball Mega Millions EuroMillions 樂透 海外 美國 歐洲',enText:'The separate lottery workspace covers three Taiwan games. Overseas games are not connected.',zhText:'獨立樂透工作台已有台灣三彩種；海外彩種尚未接入。'}
];
export {AI_SECTORS};
