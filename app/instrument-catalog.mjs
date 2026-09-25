import {AI_COMPANIES,AI_SECTORS} from './ai-universe.mjs';
import {ETFS} from './etf-catalog.mjs';
// Public identity metadata only. Financial facts and member records stay behind the API.
const aliases={NVDA:'輝達 英偉達',MSFT:'微軟',AMD:'超微',INTC:'英特爾',AVGO:'博通',MU:'美光',AMZN:'亞馬遜',GOOGL:'谷歌 Google',META:'臉書 Facebook',ORCL:'甲骨文',ADBE:'奧多比',SMCI:'美超微',IVV:'標普500 S&P500 大盤',ITOT:'美國全市場',IXUS:'國際股票 海外 非美', '0050':'元大 台灣50 台灣五十 Taiwan', '006208':'富邦 台50 Taiwan',EWJ:'日本 Japan',EZU:'歐元區 Europe',IAU:'黃金 gold',QQQM:'納斯達克 Nasdaq',SMH:'半導體 semiconductor',CIBR:'資安 cybersecurity',SGOV:'短債 國庫券',BND:'債券 bonds',VTI:'美國全市場'};
export const instruments=[...AI_COMPANIES.map(c=>({symbol:c.symbol,name:c.name,type:'stock',sector:c.sector,summary:c.aiRole,market:'US-listed',aliases:aliases[c.symbol]||'',preview:c.symbol==='NVDA'})),...ETFS.map(f=>({symbol:f.symbol,name:f.name,type:'etf',sector:'funds',summary:f.scope,market:f.market,aliases:aliases[f.symbol]||'',preview:f.symbol==='IVV'}))];
export const instrumentPaths=instruments.map(x=>'assets/'+x.symbol);
export const findInstrument=symbol=>instruments.find(x=>x.symbol===symbol);
export const instrumentHref=(locale,symbol)=>`/${locale}/assets/${symbol}/`;
export const coverageTopics=[
 {id:'macro',en:'Macroeconomics & economic calendar',zh:'總體經濟與經濟日曆',keywords:'macro inflation CPI GDP rates 總經 通膨 利率 景氣 個經',enText:'Dated U.S. and Taiwan macro releases, selected calendar events and guided research are available. Japan/Europe macro values and a complete live calendar remain incomplete.',zhText:'已有美國與台灣具日期總經發布、精選經濟日曆與引導研究；日本／歐洲總經數值及完整即時日曆仍待補齊。'},
 {id:'fx-gold',en:'Gold & currencies',zh:'黃金與外匯',keywords:'gold XAU USD JPY EUR dollar yen euro 黃金 美元 美金 日圓 日元 歐元 匯率',enText:'Five currency pairs use Federal Reserve reference observations, with ECB history separately labelled. Licensed gold prices are not connected.',zhText:'五組匯率採聯準會參考觀測，ECB 歷史另外標示；黃金授權行情尚未接入。'},
 {id:'digital',en:'Crypto & stablecoins',zh:'加密資產與穩定幣',keywords:'crypto bitcoin ethereum BTC ETH USDT USDC stablecoin 比特幣 以太幣 虛擬幣 加密貨幣 穩定幣',enText:'BTC/ETH network research and USDC/USDT reserve/redemption sources are linked. Prices, on-chain values and depeg monitoring are not connected.',zhText:'已有 BTC／ETH 網路研究與 USDC／USDT 儲備、贖回來源；行情、鏈上數值及脫鉤監測尚未接入。'},
 {id:'attention',en:'News coverage & social attention',zh:'新聞覆蓋與社群聲量',keywords:'news sentiment volume social 新聞 情緒 聲量 輿情',enText:'SEC filing observations and scheduled BLS/Federal Reserve official-release feeds are available. Broad media, social interactions and sentiment are separate missing datasets.',zhText:'已有 SEC 申報觀測與定期更新的 BLS／聯準會官方發布；廣泛媒體、社群互動與情緒屬不同的待補資料。'},
 {id:'models',en:'Models & portfolio evaluation',zh:'模型與投資組合評估',keywords:'alpha beta model benchmark beat market strategy 模型 打贏大盤 策略 超額報酬',enText:'Annual financial comparisons are available. Validated rankings, out-of-sample returns and portfolio risk models are not released.',zhText:'已有年度財務比較；已驗證排名、樣本外報酬與投資組合風險模型尚未發布。'},
 {id:'global-lottery',en:'International lottery',zh:'海外樂透',keywords:'lottery Powerball Mega Millions EuroMillions 樂透 海外 美國 歐洲',enText:'Three Taiwan games have member analysis. Powerball and Mega Millions have official rules and source links; overseas analysis is not released.',zhText:'台灣三彩種已有會員分析；Powerball 與 Mega Millions 已有官方規則及來源，海外分析尚未發布。'}
];
export {AI_SECTORS};
