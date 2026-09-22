# 2026-09-22 approved expansion

Current scope: 50 AI-related US-listed companies, 14 financial dimensions, descriptive charts and a versioned evidence database. See [RESEARCH_DIMENSIONS_AND_AI.md](RESEARCH_DIMENSIONS_AND_AI.md) for actual coverage, membership visibility, ingestion limitations and next-week AI gates. This section supersedes older three-company and browser-only descriptions below; billing remains disabled.

# Membership release update

The membership implementation in `docs/MEMBERSHIP_PLANS.md` supersedes earlier public-data and browser-only watchlist descriptions below. Source snapshots are now under `data/`, outside static assets. Original facts remain in this public repository; they are not proprietary or secret. Lottery website access requires verified sign-in; complete stock research requires an active Research/Pro entitlement. Public research is a limited preview.

# Stocks & ETF research — release and 30-day execution

Decision approved 2026-09-20: make factual stock/ETF research the primary product. Preserve three-game lottery data and existing accounts. Pause sports expansion. No short-term price-prediction product, trading, advice subscription, gambling referrals or new paid connector. A notice is not worldwide legal clearance; review applicable regulation and data rights before adding regulated or commercial capabilities.

## First release

Public English `/en/research/` and Traditional Chinese `/zh-hant/research/`, also member `#equities`. Public homepage and tools lead to research; sign-in/sign-up preserved. Existing member shell remains Chinese; this is not a claim of full member localization.

- NVDA (CIK1045810), MSFT (789019), AMD (2488): eight annual revenue, net-income and operating-cash-flow observations per company from SEC Company Facts. USD billions, exact start/end, filing dates, per-metric original filing links. No quotes, quarterly/TTM values, target prices or rankings.
- Revenue uses explicit GAAP aliases, latest filing per exact start/end, 350–380-day 10-K/10-K/A periods. Date cutoff excludes future filings. Net-income/cash-flow require identical start/end; missing means null. Fiscal year labels in SEC comparative filings are not used to relabel prior years. Restated history is explicitly unsuitable for point-in-time backtests.
- Ratios: net income / revenue (positive revenue); revenue growth only across adjacent annual periods with positive prior revenue. All comparisons show different fiscal dates.
- Search by ticker/company name, selected metric columns, year-end-year selector, expandable eight-period history.
- Browser-only watchlist for six initial symbols; saving occurs on user action, storage failure is shown. Not account sync, holdings, notifications or transactions. No watchlist contents sent to GA4. Research page views follow existing opt-in policy.
- IVV, ITOT, IXUS: small editorial comparison of issuer name, benchmark, exposure and expense ratio, reviewed 2026-09-20. Factual extracts only, not downloaded holdings, price data or performance tables. Links to issuer details/prospectus. Review facts before expansion; do not assume issuer website access licenses a bulk data feed.
- ETF cost = hypothetical constant USD holding value × annual expense ratio, not billed separately or a return projection; excludes taxes/spread/commission/currency/value changes. Fees may change. No holdings-overlap calculation until compatible dated holdings and usage rights are obtained.

## Source and pipeline

https://www.sec.gov/search-filings/edgar-application-programming-interfaces
https://www.sec.gov/about/developer-resources

Public API without key; server-side requests because SEC does not support browser CORS. Identifiable QuantPathLabs user agent with project URL, optionally override SEC_USER_AGENT with a valid contact identity. Three sequential requests with at least 1.1s spacing, timeout; no bypass/proxy or retry flood on denial. Only normalized numerical facts and provenance persisted in public/data/equities.json, not complete filings.

`node scripts/sync-equities.mjs` validates all companies before atomic replacement; any failure retains the old snapshot. Hash identifies company data, not retrieval timestamp. Annual-coverage regression fails. Scheduled UTC22:15 / Asia/Taipei06:15 in `.github/workflows/equity-data.yml`; schedule can delay. GitHub writes only the public financial snapshot; Cloudflare deploy must then succeed. More than 72 hours since retrieval displays a stale notice (distinct from the much older fiscal period). Triggered workflow success is required before calling automatic refresh operational. ETF editorial facts are checked by the existing operations task, not this SEC job.

No GA4/GSC reporting authorization gained through this release. GA4 receipt is still unverified. No user metrics, members, secrets, watchlists or private reports in this public repository.

## Revised 30-day priorities (Sep 21–Oct 20; do not restart)

1. Website and usability: research is the main entry, bilingual parity, search/zero-state recovery, mobile tables, source links, data freshness, membership access retained. Complete member localization without changing account permissions.
2. Data and tools: verify daily SEC refresh, investigate changing tags and restatements, correct date/unit/null handling; maintain lottery jobs. Add quarterly data, holdings overlap and account watchlists only after source/mapping/storage tests. No empty features labelled as available.
3. Evidence and distribution: prioritize sourced company financial changes and meaningful ETF cost/exposure comparisons over daily generic lessons. Max three material items/day; no forced news. Draft English and full Traditional Chinese, link existing tools, no unsupported performance or growth claims. Member/social delivery remains unauthorized.
4. Review and correction: use verified analytics when connected; otherwise record unavailable rather than zero. Track real search/use/errors, data correctness, return visits and expressed payment demand. Do not treat missing analytics as evidence of success. Freeze any candidate predictive baseline, date cutoff and validation split before experimentation; no daily automatic model switching.

Days 1–3: verify this release and scheduled data update; browser acceptance and source audit. Days 4–10: strengthen fiscal-period comparison, bilingual member entry and actual analytics connection; validate the first useful comparison tasks. Days 11–20: prioritize observed user problems; evaluate legally usable holdings and quarterly sources, implement only validated additions. Days 21–30: review repeat use, costs, quality and demand; choose next month's focus from evidence.

Daily: read prior log, production/build/job status, data timestamp and official material news; deliver one concrete correction or sourced research item; update next three actions.
Every third day: compare available complete periods, select one meaningful usability/data/content change, verify and retain/revise/revert based on evidence. Low samples cannot establish an A/B winner.
Days 10/20/30: review product scope, bilingual usage, data rights/cost, activation/retention and model evidence; explicit keep/change/stop decisions. Day30 combines 3-day review and ends original schedule. No automatic extension.

Automated emails/push are not enabled. Price-triggered alerts need licensed prices, authenticated consent/preferences, delivery integration and explicit sending authorization. News is optional and relevant; no daily notification by default.
