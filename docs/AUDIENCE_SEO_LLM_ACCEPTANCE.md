# Audience, SEO and LLM measurement acceptance

Updated 2026-10-19. Evidence baseline: `c0993fc361606d2e43575dd12b4f8b24df26ba37`.
Status: implementation specification; NOT a new collector deployment, tracking consent change, model integration, or measured growth result.

## Why reporting access alone is insufficient

`cloudflare/analytics-browser.mjs` explicitly sends an empty `page_referrer` in configuration and manual page views. It replaces real URLs with a bounded `/analytics-view/…` route and omits query strings/fragments. This protects privacy but prevents assuming complete native acquisition attribution. Historical missing referrers cannot be recovered by granting reporting access later.

`cloudflare/analytics-collector.mjs` currently queries `totalUsers`, not `activeUsers`/`newUsers`; acquisition breakdown is only `sessionDefaultChannelGroup`. It has no tool completion, verified registration, saved research, or D7 measurement. GSC queries are separate date/page/query tables capped at 1,000 rows, not a query-to-canonical-page join or a complete site total. These are capability gaps, separate from missing Google authorization.

## Stage 1: report contract before collection changes

Every section must carry `status`, `reason`, requested/returned date range, timezone, source ID, generated time, data-through date, definitions, numerator/denominator, limitation flags and schema version. Missing data is null with a reason; only a successful, complete source result can establish zero. Keep reports and credentials private.

| Workstream | Required implementation | Acceptance |
|---|---|---|
| Audience | Query activeUsers, newUsers, totalUsers (separately named), sessions, screenPageViews and engagement duration at aggregate scope; compatible country/language/device/channel/landing-page tables separately | Google metric/dimension compatibility validated; source metadata retained; no summing distinct users across days/dimensions; engagement numerator and denominator explicit |
| Windows | Yesterday; last 7 vs previous 7; on review dates 3 vs previous 3 and completed 10 vs previous 10 | Common complete windows only; absolute difference; relative change null when previous=0; delayed data provisional; no cross-timezone daily equivalence |
| GSC | Site totals independently; date, page, country/device; query×page rows; paginated bounded extraction with row-count/truncation flags | clicks/impressions recomputed CTR; no summed average positions; retain API aggregate position; suppressed query rows acknowledged; join only to existing canonical map |
| Native acquisition | sessionSourceMedium and landingPage reports if actually available | Audit empty referrer impact; do not relabel Google organic as Gemini; unknown remains unknown; historical coverage limitations visible |
| Usage funnel | Bounded event taxonomy below | Each numerator/denominator sourced; no paid-conversion claim while checkout disabled; no inferred personal identity |

Reuse the existing SEO Loop keyword→intent→canonical map after obtaining its latest record; do not create a competing map or mutate target pages based on guessed search volumes. English/Traditional Chinese are content languages, not market segments.

## Stage 2: privacy-preserving observed entry classification (proposal v1)

Do not silently enable this proposal. First verify the existing property, official Google read access, consent behavior and event payload in an interactive session. Do not rebuild GA4 or buy a connector. The current collector uses service-account credentials; this is not proof that the requested owner OAuth/read bridge is connected. Choose and validate the approved official authentication path before implementation.

Proposed `qp_entry` event after explicit consent only: `source_class`, `source_rule_version`, `entry_page_id`, `content_language`. No raw referrer, URL, query, UTM, token, email, note, chosen security, or account identifier. Use a bounded route ID; stock-specific pages remain grouped. Before consent, do not persist or transmit attribution; a later consent event may leave original arrival unknown. Do not invent cross-page session identity to fill that gap.

Suggested exact HTTPS hostname rules: `chatgpt.com`/`chat.openai.com`→chatgpt; `perplexity.ai`/`www.perplexity.ai`→perplexity; `copilot.microsoft.com`→copilot; `gemini.google.com`→gemini. Host parsing must reject malformed URLs and credential-bearing URLs. Never use substring matching: `chatgpt.com.example.org` is not ChatGPT. Site host→internal; absent→unknown; other hosts→other. Whitelist additions require observed evidence and a new rule version; these domains are proposed classes, not evidence of visits. Strip paths, ports, queries and fragments from all telemetry. Do not use a browser referrer to establish actual person identity or endorsement.

The proposal is an EVENT-scoped observed-entry classification. It does not automatically populate GA4's native session acquisition dimensions. Until a consent-safe session association is separately implemented and validated, report only event counts; AI-attributed sessions, active users and completion rates stay unavailable. Do not sum per-source active users. Referrer suppression, app redirects and privacy controls mean observed AI traffic is a lower-coverage observation, not total AI audience.

## Stage 3: event and outcome gates

Proposed events: `qp_tool_start`, `qp_tool_complete`, `qp_save_confirmed`, `qp_registration_verified`, `qp_search_no_results`, `qp_error`. Allowed dimensions: versioned tool enum, language enum, success/error-code enum and bounded page group. Never send input values, search query text, portfolios, notes or emails. Registration verification and saves must reflect confirmed server outcomes; a click, generated number set, local browser watchlist, timeout or queued request is not success or purchase.

For completion rate, use confirmed completed tool attempts / eligible started attempts in a declared window. Define private, short-lived attempt matching and deduplication before activation; raw identifiers stay outside public reports/repository. No attempt identity implementation is authorized by this document. D7 means return on local calendar day +7 after a defined activation, using only a mature eligible cohort and a validated identity model. Until these dependencies exist, D7 is unavailable, not failed.

## LLM reporting: three independent evidence records

1. AI source traffic: source rules/version, observed sessions/users/landing pages only if validated; otherwise reasoned unavailable. Crawler requests are not people.
2. AI search visibility: fixed bilingual prompts; product/model (or unknown), run date, region, language, search toggle, preserved response and cited URL. Count answers with a verifiable QuantPath citation / successfully executed questions. Errors and unexecuted questions are separate. It is a sample citation rate, not platform reach/share. Do not subscribe or add a model dependency for testing.
3. Site LLM: provider/model/version, authorized source set, retrieval/tool path, source dates/citations, refusal cases, successful/total requests, p50/p95 latency, tokens and actual currency/window costs. Missing integration stays not connected. Keyword rules and this assistant's writing do not constitute site LLM inference/training. Keep the existing human 100 / double-review 20 gates; no self-judged scores replace signed review evidence.

Freeze this initial six-question visibility set (3 intents × 2 languages; not executed as of this document):
- How can I compare annual company results when fiscal year ends differ? / 財政年度截止日不同時，如何比較公司年度財報？
- What should I check before comparing a US large-cap ETF with a total-market ETF? / 比較美國大型股 ETF 與全市場 ETF 前應檢查什麼？
- How can I tell whether an AI-generated financial statement is supported by its source? / 如何判斷 AI 產生的財務敘述是否有原始來源支持？

Do not add the QuantPath brand to these non-brand discovery prompts. A source-validation exercise or ordinary web search is not an executed AI-platform visibility sample. Keep the next sample's wording unchanged for comparability.

## Release acceptance and rollback

- Before consent: 0 analytics requests; after decline/withdrawal: 0 subsequent analytics requests. Synthetic test counts are test outcomes, never real traffic.
- Payload audit: 0 raw sensitive values, query strings or private routes; spoofed domains never enter a trusted source class.
- Each eligible deliberate event emitted once; failed/unknown saves produce 0 confirmed-save events. Validate duplicate/reload/network-failure recovery.
- Compare private source report and rendered report for exact totals and metadata on one known completed window. No stale success on API failure. Do not announce growth from a technical pass or small sample.
- Roll back the added event collector if consent leakage, private data, duplicated events, misleading labels or broken member flows appear; retain existing access controls. Disable new collection and discard invalid conclusions; do not erase prior valid evidence.

Next checkpoint: 2026-10-20 D30 records these gates and missing dependencies. This document creates no schedule and does not extend the first month. Post-D30 implementation requires a separately authorized continuation.

## Reporting copy / 回報文案

EN: Audience and SEO outcomes remain unverified. The current tracking design limits acquisition attribution, and usage events are not yet implemented. Reporting authorization alone will not reconstruct missing historical sources. Technical checks demonstrate specific page behavior; they do not establish audience growth or AI referrals.

繁中：群眾與 SEO 成效仍未驗證。目前追蹤設計限制來源歸因，工具使用事件也尚未實作。僅補上報表授權，無法還原過去未記錄的來源。技術驗收只證明特定頁面行為，不能證明訪客增加或 AI 導流成長。

References (checked 2026-10-19):
- https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema
- https://developers.google.com/webmaster-tools/v1/searchanalytics/query
- https://developers.google.com/search/docs/appearance/ai-features
