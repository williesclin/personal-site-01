# Source decision / 新聞來源決策
Checked: 2026-09-23. This is an implementation gate, not a global legal opinion.
查核日：2026-09-23。此為實作接入門檻，不是全球法律意見。

| Source / 來源 | Decision / 決策 | Evidence / 依據 |
|---|---|---|
| SEC EDGAR | Continue existing filing metadata and original links. It measures observed filings, not news popularity or market sentiment.／繼續既有申報中繼資料，不能稱為新聞聲量或市場情緒。 | https://www.sec.gov/about/webmaster-frequently-asked-questions |
| NVIDIA website | Continuous commercial collection/storage/display grant not verified; keep connector off.／未驗證可持續商業擷取、保存及展示的授權，維持停用。 | https://www.nvidia.com/en-eu/about-nvidia/terms-of-service/ |
| AMD website | Website access does not establish redistribution permission. Review specific terms and obtain rights before enabling.／網站可讀不代表可再散布，須確認具體授權後才接入。 | https://www.amd.com/en/legal/terms-and-conditions.html |
| Social platforms / 社群 | No verified API or display/retention rights; unavailable, never zero.／無已驗證API及保存展示授權，標示未接入，不填0。 | No connected source / 無接入來源 |

Source register requirements: exact provider/endpoint, rights URL and verification date, commercial use, retention, redistribution, deletion obligations, rate limits, attribution, cost ceiling, credential owner; separate source permission from user account authorization. Do not scrape blocked pages, copy full news articles, or buy another connector.

來源登記必須包含：供應者與端點、授權網址與查核日、商業使用／保存／展示／刪除條件、流量限制、署名、費用上限與憑證管理者；來源使用權與帳號授權分別驗證。不繞過阻擋、不複製整篇新聞、不購買付費轉接器。

Next acceptance: a permitted feed must complete a real fetch and idempotent private database write, original link/time/entity mapping, duplicate handling, stale/error recovery and null coverage. Only then enable a recurring collector. Current SEC feed is not evidence of broad news/social coverage.

下一次驗收：合法來源須完成真實擷取、可重跑不重複的私人資料庫寫入、原文／時間／公司對應、去重與失敗保留；通過才啟用持續流程。SEC流程成功不代表一般新聞及社群已接入。
