# Phase 2: connected research, 2026-09-25

Expected outcome: a reader starts from a sourced economic event, examines an explicitly labelled transmission hypothesis and related companies/funds, compares reporting periods and exposures, records contrary evidence and saves or exports the research.

## Implemented scope

- Paired EN / zh-Hant macro, study, currency, digital-asset and lottery-directory routes; expanded navigation and search. Official feed headlines retain their original language and are labelled accordingly.
- 50 existing SEC issuers, up to 16 quarterly periods each, four-quarter TTM, seven raw metrics where disclosed. Derivations retain both YTD inputs; missing metrics stay null. These are latest-reported/restated figures, not point-in-time backtest data.
- Four event/framework paths: U.S. CPI, FOMC policy, Taiwan CPI and AI capital investment. Company/fund associations are editorial hypotheses, not holdings or recommendations.
- 14 public ETF / trust profiles: first ten IVV, ITOT, IXUS, QQQM, SMH, CIBR, 0050, 006208, EWJ, EZU; four extensions VTI, SGOV, BND, IAU. Taiwan tiered management/custody fees are not misrepresented as a verified total expense ratio. IAU is labelled a trust.
- Study comparison: up to six stocks/funds; annual/quarter/TTM; baseline selection; period, source, refresh and null-state disclosure. Fund exposure and company financials remain separate.
- Notes and conditions: transient tab continuity, explicit browser draft, source-bearing JSON export, and entitled account save/restore using existing research-state ownership and quotas. Old records remain readable. Login and language switch retain comparison context. No membership or billing changes.
- Official BLS/Federal Reserve metadata ingestion, URL+publication-time deduplication, source counts, explicit separation of filings/news/social/sentiment. This is not broad media coverage or a validated sentiment model.
- Federal Reserve H.10 observations for five FX pairs; JPY/TWD and EUR/TWD derived from the same source dates. ECB history separately labelled and attributed, including calculated USD/JPY and free source availability. No splicing between fixings, zero-filling or invented live quotes.
- BTC/ETH network-risk references, USDC/USDT reserve and redemption references; separate Taiwan/US lottery source directory and current Powerball/Mega Millions rule descriptions.

## Data delivery

Existing daily SEC workflow now also writes quarterly.json. New six-hour official-context workflow refreshes BLS/Fed headlines, H.10 and ECB observations. A failed source retains its prior snapshot and original successful retrieval time with an explicit stale/unavailable status. Macro editorial releases, ETF descriptions and selected calendar entries are manually reviewed snapshots; they are not described as a complete live service.

Data source rights: SEC/BLS/Federal Reserve official information; ECB reuse with attribution and explicit derived-calculation labels. Small issuer facts link the prospectus. No issuer price/holdings feed is assumed licensed. Coinbase market-data terms restrict public redistribution without consent; LBMA/IBA gold benchmarks require a licence. Those feeds are intentionally absent.

## Remaining Phase 2 acceptance gaps

| Area | Remaining work |
| --- | --- |
| Prices / returns / valuation | Contracted display rights, quotes/history, corporate actions, dividends, aligned calendars/currency, total-return benchmarks, P/E and drawdown |
| Macro | Deeper Taiwan growth/jobs/credit values, Japan/Europe numeric series, complete maintained economic calendar and release-revision handling |
| Industry KPIs | Segment-specific measures such as AI revenue, backlog, seats, utilization and industry-normalized definitions |
| News / attention | Broad sustainable licensed media coverage, cross-source event clustering, social interaction collection and separately validated sentiment |
| Gold / crypto / stablecoins | Licensed price histories, chain observations, live depeg monitoring, dated reserve figures and redemption-condition monitoring |
| Overseas lottery | Validated historical draw ingestion and versioned rule-bound analysis |

The connected research workflow can be completed using available fundamental/exposure evidence. This release does not complete every Phase 2 dataset and cannot substantiate market-beating performance. Phase 3 model claims remain gated on reliable point-in-time inputs, baselines and out-of-sample validation.

## Validation

70 domain, worker API/security and bilingual prerender tests passed before preview QA. Tests cover four-quarter arithmetic, gaps, original filing inputs, null handling, FX direction, comparison guards, guest/member boundaries, journey preservation and legacy state compatibility. Both ingestion workflows ran successfully on the branch. Browser acceptance and final production checks are recorded in PR #23; synthetic mobile fixtures are never enabled in the production build. A prior real-account sign-in attempt failed; this release does not claim a successful live-account browser round trip.
