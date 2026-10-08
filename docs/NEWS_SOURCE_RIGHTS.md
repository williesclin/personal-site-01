# Source decision / 新聞來源決策

> Owner update 2026-09-24: build News & events; articles authored in conversation, no administrator review console. See [NEWS_AND_EVENTS.md](NEWS_AND_EVENTS.md). Existing model-evaluation evidence requirements remain separate from publishing.
Checked: 2026-10-08. This is an implementation gate, not a global legal opinion.
查核日：2026-10-08。此為實作接入門檻，不是全球法律意見。

| Source / 來源 | Decision / 決策 | Evidence / 依據 |
|---|---|---|
| SEC EDGAR | Continue existing filing metadata and original links. It measures observed filings, not news popularity or market sentiment.／繼續既有申報中繼資料，不能稱為新聞聲量或市場情緒。 | https://www.sec.gov/about/webmaster-frequently-asked-questions |
| NVIDIA website | Continuous commercial collection/storage/display grant not verified; keep connector off.／未驗證可持續商業擷取、保存及展示的授權，維持停用。 | https://www.nvidia.com/en-eu/about-nvidia/terms-of-service/ |
| AMD website | Website access does not establish redistribution permission. Review specific terms and obtain rights before enabling.／網站可讀不代表可再散布，須確認具體授權後才接入。 | https://www.amd.com/en/legal/terms-and-conditions.html |
| General-news provider candidate (GDELT discovery) | **Blocked.** Public discovery and dataset pages do not by themselves complete QuantPath's required commercial collection, storage, display, retention, deletion and model-use contract. No recurring connector or database rows are enabled.／**阻擋。** 公開介紹與資料頁不等於已完成商業擷取、保存、展示、保留、刪除與模型使用契約；不啟用持續擷取，也不寫入資料列。 | https://www.gdeltproject.org/ and https://www.gdeltproject.org/data.html |
| Social platforms / 社群 | No verified API or display/retention rights; unavailable, never zero.／無已驗證API及保存展示授權，標示未接入，不填0。 | No connected source / 無接入來源 |

The warehouse must not collapse these decisions into a single `approved` flag. SEC observations can remain approved while a manually observed issuer-news item remains `review_required`; the combined evidence dataset is therefore `partial`, and its source list must name both inputs. General news remains a separate zero-row `blocked` dataset. Zero rows means no approved collection, not zero market attention.

倉庫不可把不同來源壓成單一 `approved`。SEC 觀測可維持核准，但人工核實的發行人新聞仍為 `review_required`；混合證據資料集因此標為 `partial`，並列出兩種來源。一般新聞另列為零資料列的 `blocked` 資料集；零資料列代表尚無核准擷取，不代表市場聲量為零。

Source register requirements: exact provider/endpoint, rights URL and verification date, commercial use, retention, redistribution, deletion obligations, rate limits, attribution, cost ceiling, credential owner; separate source permission from user account authorization. Do not scrape blocked pages, copy full news articles, or buy another connector.

來源登記必須包含：供應者與端點、授權網址與查核日、商業使用／保存／展示／刪除條件、流量限制、署名、費用上限與憑證管理者；來源使用權與帳號授權分別驗證。不繞過阻擋、不複製整篇新聞、不購買付費轉接器。

## Machine-enforced release gate / 可機讀發布門檻

`data/general-news-release-gate.json` is the versioned source of truth for the general-news candidate. `app/general-news-release.mjs` rejects release unless all six use-specific rights—collect, store, display, model, retention and commercial—are explicitly approved with HTTPS evidence. Public access, an API response or a single broad `approved` flag does not satisfy this contract.

`data/general-news-release-gate.json` 是一般新聞候選的版本化真實來源。`app/general-news-release.mjs` 只有在擷取、保存、展示、模型、保留及商業六項用途皆有明確核准與 HTTPS 證據時才允許發布；網站公開可讀、API 可回應或單一概括 `approved` 均不算通過。

Coverage is a denominator contract, not a document count. A completed window must name the issuer/source universe, query-set version, start/end, timezone and cutoff, then reconcile attempted = successful + failed queries and report retrieved versus deduplicated documents. A complete window may legitimately contain zero documents; an unexecuted or failed window remains unavailable rather than zero market attention.

涵蓋率是分母契約，不是文章筆數。完整窗口須列出公司／來源母體、查詢集版本、起訖、時區與截止時間，並核對嘗試查詢＝成功＋失敗，同時報告擷取及去重後文件數。完整執行的窗口可以合法為零篇；未執行或失敗的窗口仍是不可用，不能寫成市場聲量為零。

Release also requires public correction and deletion procedures with service windows, at least 100 source-linked human-reviewed documents, at least 20% independently double-reviewed, an agreement rate and resolved disagreements. The current file truthfully records every six-use right as `not_approved`, coverage/policy fields as unavailable and human review as 0/100, so the validator and warehouse status remain blocked. This contract does not enable a collector, copy article text, change database access or activate AI/member alerts.

發布另須公開更正與刪除程序及處理時限、至少 100 份可追溯來源的人工覆核文件、至少 20% 獨立雙人覆核、同意率與已解決分歧。現行檔案如實記錄六項用途皆為 `not_approved`、涵蓋與政策欄位尚不可用、人工覆核 0/100，因此驗證器及倉庫狀態維持阻擋；本契約不啟用擷取器、不複製文章全文、不改資料庫權限，也不開啟 AI／會員警示。

Next acceptance: a permitted feed must complete a real fetch and idempotent private database write, original link/time/entity mapping, duplicate handling, stale/error recovery and null coverage. Only then enable a recurring collector. Current SEC feed is not evidence of broad news/social coverage.

下一次驗收：合法來源須完成真實擷取、可重跑不重複的私人資料庫寫入、原文／時間／公司對應、去重與失敗保留；通過才啟用持續流程。SEC流程成功不代表一般新聞及社群已接入。
