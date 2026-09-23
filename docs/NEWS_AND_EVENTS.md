# News & events / 新聞與事件

Owner direction: 2026-09-24. This supersedes the proposal to build an administrator annotation/review console. Articles are written with the owner in the conversation and published through the existing GitHub workflow. No separate administrative review step is required. Article publication is not a human model-validation label.

使用者最新決定：文章在對話中撰寫並依指示發布，不另建管理員審閱台。文章發布與模型驗證分開；既有人工標註表保留，但不以標註數阻擋新聞頁或文章發布，不刪資料、不冒充人工標註。

## Delivered structure / 頁面結構
- `/en/news/`, `/zh-hant/news/`: paired public pages with original articles/commentary and official filing observations. English default, source-linked NVIDIA latest3 preview; no invented first article or fabricated author.／雙語公開入口，原創內容与官方申報分開，NVIDIA最多3筆預覽。
- `#news`: member workspace navigation. Effective Research/Pro receive paginated SEC source records from the existing database through `/api/news-events`; Free/demo retain the limited preview. No sales or entitlement changes.／會員來源資料沿用付費資格，未開賣，不改權益。
- Company filter uses server-side issuer relationships; local keyword search explicitly applies to the displayed page.20 records/page. Dates distinguish filing, reported date/period end and first observation.／公司篩選走伺服器，關鍵字只搜本頁；申報日、報告日期/期末、首次觀測分開。
- Public preview is generated during every build from a whitelisted subset. Full feed never enters client/static output. Snapshot updates continue on existing workflows; no new schedule.／每次建置產生有限預覽，不公開完整JSON，不新增重複排程。

## Article publication / 文章發布
`app/news-articles.mjs` is the versioned public article catalog, separate from private member notes and source documents. Each item requires stable slug, status, market/category, published/updated dates, HTTPS source list, and complete English/Traditional Chinese title, summary and sections. Published entries automatically appear at `/LANG/news/SLUG/`, in the news list, reciprocal language links and sitemap. Drafts are excluded. No raw HTML is accepted.

對話稿件完成後，我會依使用者發布指示轉入上述目錄，核對引用與兩語完整度、建置、分支驗收、合併及正式確認；不要求另登入後台審稿。既有自動資料库同步只涵蓋來源與財務快照，不能稱此公開文章目錄已是營運資料庫或文章自動入庫。

## Source and model limits / 資料與模型限制
SEC filings are official observations, not complete media coverage. General issuer-news collection and social APIs remain unconnected pending verified retention/display rights. No automatic copyright scraping or paid connector. Source categories are not AI sentiment; no member alerts or external sends are enabled. Future internal rule alerts can follow real newly observed events; backfills must never trigger them. Formal AI still requires independent validation; writing or publishing articles does not satisfy this evidence requirement.

官方申報不當全市場新聞或聲量。一般新聞／社群仍待使用權與接入驗證，無付費轉接器、無會員或外部訊息。回補不發新事件警示；正式AI須另有實測，不以文章數替代驗證。

## Acceptance / 驗收
Paired SSR pages, route-preserving language links, actual source URLs, guest/Free/expired/API isolation,20+1 pagination, unknown filters rejected, empty-result recovery, readable mobile layout and no new admin review screen. Retain the existing three membership tiers and public financial preview scope.
