# Research dimensions, evidence database and AI preparation

Approved expansion: 2026-09-22. Supersedes the earlier three-company coverage description. The universe has **50 distinct US-listed issuers (47 additions)**, one share class per issuer, identified by SEC CIK. AI categories are editorial supply-chain/application groupings, not recommendations, AI revenue estimates or rankings. Full bilingual definitions are in `app/ai-universe.mjs`; filing evidence is in `data/research-evidence.json`. Everpure uses current SEC ticker P, not historical PSTG. The first snapshot contains 395 company-years; unavailable older years are not fabricated.

## Membership visibility

| Dimension / function | Free | Research | Pro |
|---|---|---|---|
| Annual financials | NVDA latest 3 years, public preview | 50 companies, actual available annual history (up to 8) | Same factual foundation |
| Chart dimensions | Revenue, net income, operating cash flow | 14 dimensions below | Same; no invented precision premium |
| Charts | NVDA trend/bar preview | Up to 5 companies; category/period selection; trend, bar, two-axis scatter; primary-dimension comparison CSV | Same |
| Account saving | No complete stock research | 30 symbols, 5 existing research conditions | 200 symbols, 30 conditions |
| Source news / filings | Service description | Authenticated source metadata and original summaries | Same |
| AI classification / risk / alerts | Unavailable | Status and eventual basic source context | Future advanced outputs only after release gates |

EN: Subscriptions are not on sale. Charts are descriptive research, not personalized advice or a performance guarantee. Social attention, sentiment and advanced AI are not connected or released.

繁中：訂閱尚未銷售。圖表為描述性研究，不是個人化投資建議或績效保證；社群聲量、情緒及進階 AI 尚未接入或發布。

## Fourteen financial dimensions

Revenue／營收; net income／淨利; operating cash flow／營業現金流; gross profit／毛利; operating income／營業利益; R&D expense／研發費用; cash paid for PP&E／購置不動產廠房設備現金支出; operating cash flow less PP&E／營業現金流減設備支出（代理值）; revenue growth／營收年增率; net margin／淨利率; gross margin／毛利率; operating margin／營業利益率; operating cash flow/revenue／營業現金流率; R&D/revenue／研發費用率.

USD facts use exact annual start/end and individual filing provenance. Ratios require positive revenue; growth requires adjacent fiscal periods. Missing values remain null and chart gaps stay open. Cash flow less PP&E is a narrow proxy, not standardized issuer FCF. Revenue including/excluding assessed taxes retains its original tag; users must inspect comparability. Ambiguous duplicate starts are resolved only for identical amounts when a disclosed prior fiscal end identifies the contiguous start; otherwise ingestion fails. No market prices, valuation ratios, stock returns or correlations are inferred from financial statements.

The current saved-condition schema stores the existing table query/year/metrics, not a complete chart layout. Chart selection is session state. Do not call chart controls account-synced until a compatible saved-layout extension is validated.

## Actual database foundation

Existing `quantpath-members`, project ngmhqadvnjbhtlrrcxsb; no new paid service. Ten tables:

- research_issuers: identity, category, bilingual AI role, evidence URL.
- research_ingestions: content hash, source retrieval, first database recording, completion status.
- research_financial_periods: versioned exact periods and factual values/provenance; old versions retained.
- research_sources: source type, access state, usage scope, coverage and review date.
- research_documents: deduplicated canonical URL/hash, publication date/time precision, event date, first-seen/retrieval time, short original bilingual summary; no copied article bodies.
- research_document_entities: issuer CIK or human-reviewed symbol mapping; ambiguous mentions must not auto-link.
- research_attention_daily: source-bounded daily counts and evidence IDs; partial window is not complete market attention; social missing remains null.
- research_model_runs: task/version/cutoff/baseline/evaluation and release status.
- research_classifications: evidence-linked label/confidence/review status.
- research_alert_events: versioned rule, observed time, evidence, dedup key; in-app delivery only.

Read-only evidence RLS checks the existing effective Research/Pro membership, including paid-through cancellation and exact expiry. Anonymous users and client writes are denied. Unreleased model/classification/alert tables deliberately have no client privileges or read policies. Admin/client metadata does not create a paid entitlement. No real account was upgraded. Incomplete financial imports remain invisible until all rows validate and completion is recorded.

Initial actual data: 50 issuers, 395 annual periods, 50 annual-filing metadata records, one NVIDIA issuer announcement dated 2026-09-21 (linked to NVDA/VRT), 50 partial daily coverage rows with null counts. AI tables are intentionally empty. These counts describe stored evidence, not traffic, sentiment, complete news coverage or trained models.

## Ingestion and continuity

Existing `.github/workflows/equity-data.yml` fetches all 50 companies sequentially using SEC spacing, validation and atomic replacement; no duplicate SEC schedule. More than 72 hours old is P1. A workflow file is not proof of a successful run.

`node scripts/prepare-research-db-import.mjs` validates the public snapshot hash and generates credential-free, idempotent SQL batches in scratch. **The verified daily operations connection executes the batches**, then checks counts and completed_at. This run executed the first import through that connection. GitHub-to-database unattended writing is **not enabled**: no new service key or external bridge has been provisioned. If a subsequent task lacks the verified database connection, retain the old complete import, report the gap, and do not claim synchronization. Keep source retrieval and database recording timestamps distinct. Never commit private reports or credentials.

News initially uses manually verified official announcement metadata and original summaries. This does not imply permission for full-text copying or a continuous feed. SEC filings are stored as filings, not counted as media news. Social APIs, platform permissions and bot/dedup coverage are unconnected; no estimated users, reach or sentiment. News volumes may only be charted once source coverage and complete observation windows are established. Store corrections as reviewed versions; keep first-seen time immutable. Current importer is insert-only for documents; editorial corrections require an explicit reviewed change, not silent overwrite.

## Next-week AI gates (2026-09-28 onward)

1. Sep23–25: daily source metadata import and reconciliation; improve member workspace navigation/language; verify a consistent news source and retention/display scope; collect editorial event labels. Preserve the already scheduled workspace work, lottery maintenance and ETF review.
2. Sep26–27: freeze taxonomy (earnings, product, infrastructure, regulation, corporate action, other), evidence-backed entity labels, language, source and timestamps. Annotate at least 100 distinct documents, including both languages if bilingual evaluation is claimed. Double-review 20%; resolve disagreements. This is a readiness target, not data already collected.
3. Sep28: if sufficient labels exist, compare majority/keyword baseline against a candidate classifier using a chronological held-out set of at least 30 documents. Freeze dataset hash, cutoff, versions and source rights. Proposed release gate: macro-F1 >=0.75 and >=baseline+0.05, with per-class support disclosed; confidence is calibrated only if actually evaluated. Otherwise keep internal/pending and collect more evidence. Do not train price prediction on restated annual facts.
4. Alerts: first run in shadow mode. Only evidence-grounded source/data changes; distinguish rule-based from AI-derived signals. Dedup source URL+issuer+event+rule version. Target zero duplicate deliveries and at least 90% human-confirmed relevance over 20 distinct shadow alerts; fewer observations mean insufficient evidence. Do not activate member alerts merely to meet next week's date.
5. News attention: require seven complete observed days for week-over-week context, 14 for disjoint seven-day comparisons. Counts denominator = eligible deduplicated documents within specified monitored sources and time window, not users. Baseline zero/missing makes percentage change undefined; source outages invalidate comparisons. Social sentiment waits for verified platform access/rights and documented spam/language coverage.

No external sends, checkout, automatic paid grants or production model replacement. Original Sep21–Oct20 horizon remains. Charging also requires 10 verified ETFs, broader screening/export, payment/refund tests and jurisdiction/source-rights review; 50 companies alone do not open subscriptions.

## Verification

Run build, all node tests, public preview isolation, protected evidence endpoint, live transaction-only RLS tests (`tests/research-rls.sql`), Cloudflare branch preview then exact production build/site check. No fabricated paid account or production bypass for visual testing. Full subscriber UI needs an authorized test session before claiming end-to-end browser acceptance. Charts are testable on the NVDA public preview; 50-company calculations and API gates use real snapshot and controlled tests.

Security advisor's three no-policy INFO entries are the intentionally unreleased AI tables with privileges revoked. Existing leaked-password-protection warning remains outside this change: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . Do not change auth cost/settings silently.
