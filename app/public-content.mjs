import {instrumentPaths} from './instrument-catalog.mjs';
import {publishedNews} from './news-articles.mjs';
// Public editorial catalog. Never store member records or private analytics here.
export const categories = {
 investing: {en:'Stocks & ETF', 'zh-hant':'股票與 ETF'},
 probability: {en:'Probability', 'zh-hant':'機率入門'},
 planning: {en:'Planning', 'zh-hant':'預算規劃'},
 models: {en:'Model evaluation', 'zh-hant':'模型評估'}
};
export const catalog = [
 {id:'independent-draws',category:'probability',market:'global',updated:'2026-09-20',status:'published',version:1,
 en:{title:'What past draws can—and cannot—tell you',summary:'Separate historical frequency from the probability of the next independent draw.',sections:[['Start with the assumptions','If draws are fair and independent, a number being frequent or absent in past draws does not change its probability in the next draw. A frequency chart describes the sample you selected; it does not establish predictive advantage.'],['A small example','For a fair six-sided die, the probability of a six on the next roll is 1/6, even after five rolls without a six. Independence is the key assumption. This is a teaching example, not an audit of any lottery.'],['Read a chart carefully','Check the source, sample size, date range, rules and treatment of special numbers. Investigate missing or duplicate records before interpreting a pattern. QuantPath labels the official source and retrieval time of its draw history. Demo model results remain synthetic.']]},
 'zh-hant':{title:'歷史開獎能告訴你什麼？',summary:'區分歷史出現次數與下一次獨立開獎的機率。',sections:[['先確認前提','如果開獎公平且各次相互獨立，某個號碼過去經常出現或長期未出現，都不會改變下一次的機率。頻率圖描述的是你選定的樣本，不能單憑它證明預測優勢。'],['一個簡單例子','公平六面骰下一次擲出六的機率是 1/6，即使前五次都沒有出現六也一樣。關鍵前提是獨立性。這是教學例子，不是對任何彩券的稽核結果。'],['如何閱讀圖表','先看來源、樣本量、日期區間、規則與特別號的處理方式。解讀模式前先排查遺漏與重複紀錄。QuantPath 在開獎紀錄中標示官方來源與擷取時間；示範模型結果仍為合成資料。']]},sources:[{label:'OpenStax · Independent and mutually exclusive events',url:'https://openstax.org/books/introductory-statistics-2e/pages/3-2-independent-and-mutually-exclusive-events'}]},
 {id:'budget-before-results',category:'planning',market:'global',updated:'2026-09-20',status:'published',version:1,
 en:{title:'Record the budget before the outcome',summary:'Use a simple ledger to make costs and outcomes visible.',sections:[['Set a limit first','Choose a discretionary amount that does not compete with essential expenses. Record that limit before generating combinations. A budget is a spending constraint, not a target you must use up.'],['Keep the arithmetic visible','In an illustrative ledger, a budget of 100 units and spending of 30 leave 70 units. If the recorded prize is 5, the net result is 5 − 30 = −25 units. Remaining budget and profit are different quantities.'],['Review without chasing losses','Record the actual date, cost and prize in the same currency. Check duplicate entries and corrections. Review the total before deciding whether to continue; a loss does not make a future win more likely. Current workspace examples use TWD and Taiwan game rules.']]},
 'zh-hant':{title:'先記預算，再看結果',summary:'用簡單的紀錄，把成本與結果分清楚。',sections:[['先設定上限','選擇不影響必要生活支出的可支配金額，並在產生組合前記下上限。預算是支出的限制，不是必須花完的目標。'],['讓計算可以核對','假設預算 100 單位、已支出 30，剩餘預算為 70。若登錄獎金為 5，淨結果就是 5 − 30 = −25 單位。剩餘預算與獲利是不同概念。以上為教學示例。'],['定期檢查，不追逐損失','以相同幣別記錄實際日期、支出與獎金，排查重複紀錄並保留更正。決定是否繼續前先檢查總額；過去虧損不會提高未來中獎機率。目前工作台示例使用新台幣與台灣遊戲規則。']]},sources:[]},
 {id:'compare-models-fairly',category:'models',market:'global',updated:'2026-09-20',status:'published',version:1,
 en:{title:'Compare models under the same conditions',summary:'A report approval is not an independently reproduced experiment.',sections:[['Freeze the comparison','Record the task, dataset version, split dates, baseline, evaluation rules, budget and number of trials before comparing candidates. Keep a held-out set separate from model selection.'],['Make a result reproducible','Preserve code and model versions, random seeds, inputs, evaluation configuration and results. Report the metric definition and uncertainty. A favorable backtest can reflect chance, data leakage or repeated selection.'],['Understand the current lab','The workspace can import and compare JSON reports. Its verification action records an administrator’s review; it does not rerun a model. Publishing changes a version pointer, not a production inference service. Synthetic demo results are not measured model performance.']]},
 'zh-hant':{title:'在相同條件下比較模型',summary:'核准報告，不等於已獨立重現實驗。',sections:[['固定比較條件','比較候選模型前，先記錄任務、資料版本、切分日期、基準、評估規則、預算與試驗次數。保留未參與模型選擇的測試集。'],['讓結果能重現','保存程式與模型版本、隨機種子、輸入、評估設定及結果，說明指標定義與不確定性。看似較好的回測，可能來自隨機波動、資料洩漏或重複挑選。'],['理解目前實驗室','工作台可匯入並比較 JSON 報告。「確認驗證」記錄管理員審核，不會重新執行模型。「發布」切換版本指標，不會部署正式推論服務。合成示範結果不是真實模型績效。']]},sources:[{label:'scikit-learn · Common pitfalls and recommended practices',url:'https://scikit-learn.org/stable/common_pitfalls.html'}]}
];
catalog.push({id:'sports-research',category:'models',market:'global',updated:'2026-09-20',status:'published',version:1,
en:{title:'Sports research: assumptions, evidence and responsible use',summary:'Explore a football scenario calculator, its limits and the safeguards needed before live data.',sections:[['Available now','The sports workspace offers a Poisson football scenario calculator using user-entered hypothetical expected goals. It is not trained on real matches and does not provide validated forecasts, real fixtures or odds. Open the tools page to enter the workspace.'],['Scope and limits','QuantPath Labs is an independent education and research website, not an official lottery partner or betting operator. It does not accept bets or money, sell or purchase tickets, pay prizes or refer users to gambling platforms. Scenario probabilities are not betting advice and do not guarantee outcomes or profits.'],['Responsible use','Do not borrow, chase losses or use essential living funds to gamble. Minors must not purchase or redeem Taiwan sports lottery tickets. If gambling affects your finances or wellbeing, stop and seek qualified support. Local restrictions vary; this notice is not an operating licence or a worldwide legal clearance.'],['Data before forecasts','Live data remains disabled until source use and display rights are verified. Real predictions require timestamped features, chronological evaluation, calibration and reproducible evidence. Historical results alone do not establish future profitability.']]},
'zh-hant':{title:'運動分析：假設、證據與責任使用',summary:'了解足球情境計算器的用途、限制與接入真實資料前的要求。',sections:[['目前可用功能','運動工作台提供 Poisson 足球情境計算器，使用自行輸入的假設預期進球。模型尚未以真實比賽訓練，不提供已驗證預測、真實賽程或賠率。可從工具頁進入工作台。'],['服務範圍與限制','QuantPath Labs 為獨立教育與研究網站，非運彩官方合作平台或投注業者。不收受投注與款項、不銷售或代購彩券、不兌獎，也不導流至博彩平台。情境機率不是投注建議，不保證賽果或獲利。'],['責任使用','勿借貸、追損或挪用生活費投注。未成年人不得購買或兌領台灣運動彩券。若投注影響財務或身心，請停止並尋求合格專業協助。各地規範不同；本警語不是營運許可，也不是全球合法性的保證。'],['先有資料，再談預測','來源使用與公開展示權未確認前，不啟用真實資料。正式預測需要帶時間的特徵、時間順序驗證、機率校準及可重現證據。歷史結果不能單獨證明未來獲利。']]},sources:[{label:'運動彩券發行條例 / Taiwan Sports Lottery Issuance Act',url:'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=H0120050'}]});
catalog.unshift({
  "id": "stock-etf-research",
  "category": "investing",
  "market": "US-listed",
  "updated": "2026-09-21",
  "status": "published",
  "version": 2,
  "en": {
    "title": "Read the stock research preview: dates first, fees second",
    "summary": "Separate the public preview from paid-plan goals, distinguish financial periods from refresh dates, and interpret an ETF fee estimate without treating it as a return forecast.",
    "sections": [
      [
        "Know what is available before comparing",
        "QuantPath’s public stock research preview currently contains three annual periods for NVIDIA and one ETF, IVV. It is a limited way to inspect the research workflow, not the complete Research or Pro service. The underlying initial research universe includes NVIDIA, Microsoft and AMD, plus IVV, ITOT and IXUS; that wider universe is not fully available to anonymous visitors. Complete tools and account saving require an eligible paid membership. Research and Pro subscriptions are not on sale, and viewing this page does not enroll or charge you."
      ],
      [
        "Read the period, filing and retrieval dates separately",
        "A financial statement describes a reporting period. Its filing date tells you when that document was submitted; QuantPath’s retrieval timestamp records when the dataset was fetched. A fresh retrieval does not turn an annual figure into quarterly or trailing-twelve-month data. Before comparing growth, inspect the exact start and end dates. Companies can have different financial calendars, so matching the displayed year alone is insufficient. SEC’s data documentation specifically cautions users about differing reporting dates. \n\nThe preview labels financial amounts in USD billions. A dash means unavailable, not zero. Its historical figures can include later restatements. They therefore support examination of the currently available reporting history, not proof of information available to investors on a past trading date. This distinction matters before using any historical dataset in a backtest."
      ],
      [
        "Interpret the fee estimate as a limited calculation",
        "The issuer lists IVV as an S&P 500 fund with a 0.03% expense ratio, checked on September 21, 2026. For an illustrative, constant USD 10,000 holding, the tool’s calculation is 10,000 × 0.0003 = USD 3 per year. This is a simplified estimate, not a separate invoice, all-in ownership cost or expected return. Fund expenses affect net asset value; the estimate excludes trading spreads, commissions, taxes, currency effects and changing investment values. \n\nA low fee also does not make different exposures interchangeable. IVV’s large-cap U.S. exposure differs from ITOT’s broad U.S. market and IXUS’s developed and emerging markets outside the United States. This is a scope distinction, not a ranking or recommendation."
      ],
      [
        "Finish one useful research check",
        "Open the preview, inspect NVIDIA’s annual dates and original filing links, then change the hypothetical IVV holding value to see how the fee estimate responds. If a search returns nothing, reset the filters; searching an unsupported symbol does not activate coverage. Review the membership page for the boundary between available features and planned services. No trade, live-price alert or automatic member message is created. Investment values can fall, and these factual tools do not guarantee returns."
      ]
    ]
  },
  "zh-hant": {
    "title": "讀懂股票研究預覽：先看日期，再看費用",
    "summary": "分清公開預覽與付費方案目標、財報期間與擷取日期，正確解讀 ETF 費用估算，不把它當成報酬預測。",
    "sections": [
      [
        "比較之前，先知道目前能用什麼",
        "QuantPath 的股票公開預覽目前提供 NVIDIA 三個完整年度，以及一檔 ETF：IVV。這是有限範圍的研究流程展示，不是完整 Research 或 Pro 服務。底層初始研究範圍包含 NVIDIA、Microsoft、AMD，以及 IVV、ITOT、IXUS；匿名訪客並不能完整使用這個較大的範圍。完整工具與帳號儲存需要有效的付費會員資格。Research 與 Pro 尚未開放訂閱，瀏覽頁面不會建立訂閱或扣款。"
      ],
      [
        "分別看待財報期間、申報日與擷取日",
        "財務報表描述一段報告期間；申報日表示文件提交的時間；QuantPath 的擷取時間則記錄何時取得資料。剛更新的擷取時間，不會把年度數字變成季度或近十二個月資料。比較成長率之前，先核對完整起訖日。各公司的會計年度可能不同，不能只看畫面上的年份是否相同。SEC 的資料說明也特別提醒使用者留意不同的報告日期。\n\n預覽中的財務金額以十億美元表示。「—」代表無法取得，而不是零。歷史數字可能包含後來的重編，因此可用於檢視目前可取得的財報歷史，卻不能證明投資人在過去某個交易日已知哪些資訊。將歷史資料用於回測前，必須先分清這件事。"
      ],
      [
        "費用估算只是一項有範圍限制的計算",
        "依 2026 年 9 月 21 日核對的發行機構資料，IVV 為追蹤 S&P 500 的基金，費用率為 0.03%。若以全年固定持有 10,000 美元作為示例，工具的計算為 10,000 × 0.0003＝每年 3 美元。這是簡化估算，不是另行帳單、全部持有成本或預期報酬。基金費用反映於淨值；此估算不包含買賣價差、佣金、稅、匯率影響及投資市值變化。\n\n費用低，也不代表不同投資範圍可以互相取代。IVV 的美國大型股範圍，與 ITOT 的美國整體股票市場、IXUS 的美國以外已開發及新興市場不同。這是範圍說明，不是排名或投資推薦。"
      ],
      [
        "完成一次有用的研究核對",
        "開啟預覽，檢查 NVIDIA 的年度起訖日及原始申報連結，再調整 IVV 的假設持有金額，觀察費用估算如何改變。若搜尋沒有結果，先重設篩選；搜尋尚未支援的代號不會自動接入資料。再查看會員方案頁，分清已可使用的功能與規劃中的服務。這些操作不會建立交易、即時價格提醒或會員自動訊息。投資可能虧損，事實研究工具也不保證報酬。"
      ]
    ]
  },
  "sources": [
    {
      "label": "SEC · Company Facts API",
      "url": "https://www.sec.gov/search-filings/edgar-application-programming-interfaces"
    },
    {
      "label": "iShares · IVV",
      "url": "https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf"
    },
    {
      "label": "iShares · ITOT",
      "url": "https://www.ishares.com/us/products/239724/ishares-core-sp-total-us-stock-market-etf"
    },
    {
      "label": "iShares · IXUS",
      "url": "https://www.ishares.com/us/products/244048/ishares-core-msci-total-international-stock-etf"
    }
  ]
});
const investingGuide=catalog.find(a=>a.id==='stock-etf-research');
investingGuide.version=3;investingGuide.updated='2026-09-25';
investingGuide.en.sections[0][1]='The research universe contains 50 U.S.-listed companies and 14 ETF / trust profiles. The annual public preview shows three NVIDIA years and IVV costs. The connected research page adds a NVIDIA quarterly / TTM preview and public fund profiles for U.S., Taiwan, Japan and European exposures. Other company figures and account saving require effective Research or Pro access. Browser drafts and research exports are available without a paid plan. Subscriptions are not on sale.';
investingGuide['zh-hant'].sections[0][1]='研究範圍包含 50 家美國上市公司與 14 檔 ETF／信託資料。年度公開預覽提供 NVIDIA 三年度及 IVV 費用；完整研究路徑另提供 NVIDIA 季度／TTM 預覽，以及涵蓋美國、台灣、日本及歐洲曝險的公開基金資料。其他公司數字與帳號儲存需有效 Research 或 Pro；瀏覽器草稿及研究匯出不需付費方案。訂閱尚未開放銷售。';
investingGuide.en.sections.push(['Continue into quarterly research','Use the connected research page to choose a macro event, review its possible transmission mechanism, compare company periods and fund exposure, and save notes. TTM requires four consecutive quarters; derived quarters retain their filing inputs. Licensed prices, valuation and total-return comparisons remain unavailable. Related funds are thematic research routes, not verified holdings or buy recommendations.']);
investingGuide['zh-hant'].sections.push(['接續季度研究','在完整研究路徑選擇總經事件、檢視可能的影響機制、比較公司期間與基金曝險，最後保存筆記。TTM 需要四個連續季度；推算季度保留原始申報依據。具授權行情、估值及總報酬比較仍未提供。相關基金是主題研究入口，不是已核實的持股或買進推薦。']);
export const articles=catalog.filter(a=>a.status==='published');
export const pages=['','macro','study','markets','digital','lottery','search','coverage',...instrumentPaths,'research','news','pricing','library','tools','methodology','about',...articles.map(a=>'library/'+a.id),...publishedNews.map(a=>'news/'+a.id)];
export function publicRoute(path){const m=path.match(/^\/(en|zh-hant)(?:\/(.*?))?\/?$/);return m&&pages.includes(m[2]||'')?{locale:m[1],page:m[2]||''}:path==='/'?{locale:'en',page:''}:null;}
