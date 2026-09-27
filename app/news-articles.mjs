// Articles are authored with the owner in conversation, then published through GitHub.
// No administrative review UI; publishing an article is not a human AI annotation.
export const newsArticles=[{
  id:'marvell-dividend-2026-09-25',status:'published',published:'2026-09-27',updated:'2026-09-27',
  market:'U.S.-listed equities',category:'company-event',symbols:['MRVL'],
  cta:{path:'assets/MRVL',en:'Open the Marvell research profile','zh-hant':'開啟 Marvell 研究資料頁'},
  en:{
    title:"Marvell’s $0.06 dividend: a dated capital-allocation event, not an earnings signal",
    summary:'Marvell declared a quarterly dividend on September 25. The amount matches its June declaration, so the useful signal is continuity—not a dividend increase or a forecast of business performance.',
    sections:[
      ['What changed','On September 25, 2026, Marvell Technology announced a quarterly cash dividend of $0.06 per share of common stock. The company set October 9, 2026 as the record date and October 29, 2026 as the payment date. The announcement was also furnished to the U.S. Securities and Exchange Commission in an 8-K exhibit.\n\nThose dates describe different things. The release date is when the company made the decision public. The record date determines which holders are recorded for the payment, while the payment date is when the company says it will distribute the cash. They should not be collapsed into one generic “event date.”'],
      ['What did not change','Marvell’s June 25 declaration was also $0.06 per share. That earlier payment was scheduled for July 30 for holders of record on July 10. Comparing like with like, the September declaration continues the same per-share amount; it is not a dividend increase.\n\nThe release also does not provide new revenue, margin, cash-flow or guidance data. A dividend declaration is a capital-allocation event, but by itself it does not establish improving earnings, a higher fair value, or an expected share-price direction. QuantPath therefore does not convert this filing into a bullish or bearish signal.'],
      ['How QuantPath should classify it','The primary classification is “company event,” with a secondary tag for capital allocation and cash distribution. The record should retain the issuer, ticker, filing form, source URL, announcement date, record date, payment date and the time the system first observed it. The issuer release and SEC filing are evidence; commentary remains separate.\n\nQuantPath does not yet have a validated, cross-company dividend-history series for the full 50-company universe. As a result, this article does not calculate dividend yield, payout ratio, growth rank or peer comparison. Those metrics require consistent share-price, earnings and dividend histories with aligned dates and units. Missing inputs are not treated as zero.'],
      ['What a researcher can do next','Use this event as a dated checkpoint, then examine Marvell’s financial statements separately. Compare annual, quarterly and trailing-period facts on consistent bases, and read the original filing before drawing a conclusion. If a future dividend-analysis feature is released, it should show its source date, calculation formula and data coverage.\n\nThis article records a verified corporate action and its limits. It is not a recommendation to buy, sell or hold Marvell, and the unchanged dividend does not imply a guaranteed return.']
    ]
  },
  'zh-hant':{
    title:'Marvell 每股 0.06 美元股利：有日期的資本配置事件，不是獲利訊號',
    summary:'Marvell 於 9 月 25 日宣告季度股利，金額與 6 月宣告相同；可確認的是延續性，而不是調高股利或預測營運表現。',
    sections:[
      ['改變了什麼','Marvell Technology 於 2026 年 9 月 25 日宣布，每股普通股配發 0.06 美元季度現金股利；公司將 2026 年 10 月 9 日訂為股東名冊基準日，付款日為 2026 年 10 月 29 日。公司也把這項公告作為 8-K 附件提交給美國證券交易委員會。\n\n這些日期代表不同事項：發布日是公司對外公開決定的日期；股東名冊基準日用來判定名冊上的受款人；付款日則是公司預定發放現金的日期。三者不應被合併成一個籠統的「事件日」。'],
      ['沒有改變什麼','Marvell 在 2026 年 6 月 25 日宣告的每股金額同樣是 0.06 美元，當時預定於 7 月 30 日支付給 7 月 10 日名冊上的股東。以相同口徑比較，9 月公告延續原有每股金額，並非調高股利。\n\n這份公告也沒有提供新的營收、毛利率、現金流或財測資料。股利宣告屬於資本配置事件，但單憑這項事件不能證明獲利改善、合理價值提高，或預測股價方向。因此 QuantPath 不會把這份申報轉換成看多或看空訊號。'],
      ['QuantPath 應如何分類','主要分類為「公司事件」，次級標籤為資本配置與現金分配。資料紀錄應保留發行人、代號、申報表格、來源網址、公告日、股東名冊基準日、付款日，以及系統首次觀測時間。公司公告與 SEC 申報是事實證據；研究評論則分開保存。\n\nQuantPath 目前尚未建立涵蓋 50 家公司的已驗證一致股利歷史序列，因此本文不計算殖利率、股利支付率、成長排名或同業比較。這些指標需要日期與單位一致的股價、獲利及股利歷史；缺少的輸入不會填成 0。'],
      ['研究者接下來可以做什麼','可先把這項事件作為有日期的研究節點，再分開檢查 Marvell 的財務報表；年度、季度及過去十二個月資料必須用一致口徑比較，並在下結論前閱讀原始申報。若未來發布股利分析功能，應同時顯示來源日期、計算公式與資料涵蓋範圍。\n\n本文只記錄已核實的公司行動及其限制，不構成買進、賣出或持有 Marvell 的建議；股利金額維持不變也不代表保證報酬。']
    ]
  },
  sources:[
    {label:'Marvell investor relations — September 25, 2026 dividend declaration',url:'https://investor.marvell.com/news-events/press-releases/detail/1035/marvell-technology-inc-declares-quarterly-dividend-payment'},
    {label:'SEC exhibit 99.1 — September 25, 2026',url:'https://www.sec.gov/Archives/edgar/data/1835632/000162828026063592/a20260925dividendpressrele.htm'},
    {label:'Marvell investor relations — June 25, 2026 dividend declaration',url:'https://investor.marvell.com/news-events/press-releases/detail/1026/marvell-technology-inc-declares-quarterly-dividend-payment'}
  ]
}];
export function validateNewsArticles(items){const ids=new Set();for(const a of items){if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.id)||ids.has(a.id))throw Error('Invalid or duplicate article slug');ids.add(a.id);if(!['draft','published'].includes(a.status))throw Error('Invalid status');if(a.status!=='published')continue;for(const k of ['published','updated'])if(!/^\d{4}-\d{2}-\d{2}$/.test(a[k]||''))throw Error('Article dates required');if(!a.market||!a.category||!a.sources?.length)throw Error('Source and scope required');if(!Array.isArray(a.symbols)||!a.symbols.length||a.symbols.some(s=>!/^[A-Z0-9.-]+$/.test(s)))throw Error('Symbols required');if(!/^(?:assets\/[A-Z0-9.-]+|research|study)$/.test(a.cta?.path||'')||!a.cta?.en||!a.cta?.['zh-hant'])throw Error('Safe paired CTA required');for(const l of ['en','zh-hant'])if(!a[l]?.title||!a[l]?.summary||!a[l]?.sections?.length||a[l].sections.some(x=>x.length!==2||x.some(v=>typeof v!=='string'||!v.trim())))throw Error('Complete paired article required');if(a.en.sections.length!==a['zh-hant'].sections.length)throw Error('Unpaired sections');for(const s of a.sources)if(!s.label||!s.url?.startsWith('https://'))throw Error('HTTPS source required');}return items.filter(a=>a.status==='published');}
export const publishedNews=validateNewsArticles(newsArticles);
