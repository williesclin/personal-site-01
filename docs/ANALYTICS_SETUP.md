# QuantPath official analytics integration

Status: implementation prepared; real Google credentials, deployed collector, property validation and ChatGPT report access are NOT yet verified. No Windsor.ai or paid connector is required. Runtime/storage costs depend on Cloudflare usage; do not claim the whole pipeline is unconditionally free.

## Components

- `cloudflare/analytics-browser.mjs`: opt-in GA4 page measurement. Imported by Cloudflare client; inert until a valid build-time `VITE_GA4_MEASUREMENT_ID` is supplied. Production host allowlist; fixed virtual page names for the existing hash UI. Auth, recovery, admin and lab fragments are excluded. No raw URL query, fragment, account name, record values or email is sent. Withdrawal disables collection and reloads.
- Main Worker CSP allows only the additional GA script/collection origins; membership logic is unchanged.
- `cloudflare/analytics-collector.mjs`: separate scheduled Worker. Official GA4 Data API and Search Console API, private R2 reports, authenticated read-only endpoint. No public report links, credentials or reports in this PUBLIC repository.
- `wrangler.analytics.jsonc`: daily 23:15 UTC (07:15 Taipei) collection, disabled by default. This does not deploy with the website's existing config.
- `tests/analytics.test.mjs`: `node --test tests/analytics.test.mjs`.

## Confirmed web stream (owner screenshot, 2026-09-20)

- Stream: QuantPath Labs Web, https://quantpathlabs.com
- Measurement ID: `G-N7Q9DKGRPL`
- Stream ID: `15811469112` (NOT the numeric Property ID)
- Enhanced measurement shown disabled; no received data shown. This does not verify deployment.
- Website build setting: `VITE_GA4_MEASUREMENT_ID=G-N7Q9DKGRPL`.
- Numeric Property ID and authenticated reporting access remain unverified. Do not use Stream ID as GA4_PROPERTY_ID.

## One-time account setup

1. Create or select the GA4 property for quantpathlabs.com. Record the numeric Property ID and the web stream Measurement ID (`G-...`); these are different. Set/confirm the property's reporting timezone; configure `GA4_TIMEZONE` to exactly match it.
2. Set `VITE_GA4_MEASUREMENT_ID` in the WEBSITE Cloudflare build environment, then rebuild. This is a public identifier, never a service account key.
3. In the GA4 stream, disable enhanced automatic page changes, form interactions, site-search capture and other automatic enhanced events for this first release. This integration sends manual sanitized page views; leaving auto page tracking enabled can double-count or send raw URLs. Configure internal traffic filtering and confirm privacy/consent wording before enabling measurement. If attribution/UTM detail is needed, implement an allowlisted, reviewed campaign taxonomy; this first release intentionally omits raw URL campaign data and therefore has limited acquisition attribution.
4. Verify `quantpathlabs.com` in Search Console. Enable Google Analytics Data API and Search Console API in a Google Cloud project. Create a dedicated service account with no broad project owner role or domain-wide delegation. Grant the service-account email GA4 property Viewer access and Search Console permission sufficient to read Search Analytics. Validate both sources with a manual read.
5. Store the service account JSON ONLY as the collector's Cloudflare secret `GOOGLE_SERVICE_ACCOUNT_JSON`. Store a random token of at least 32 characters as `REPORT_READ_TOKEN`. Never paste secrets in chat, commit them or use `VITE_` secret variables. OAuth token requests use a fixed Google endpoint; credentials never select arbitrary destinations.
6. Create a PRIVATE R2 bucket `quantpath-analytics-private`; do not enable r2.dev or a public domain. Bind as `REPORTS`. Consider a 90-day lifecycle rule for reports. Set numeric `GA4_PROPERTY_ID`, exact `GA4_TIMEZONE`, and verified `GSC_SITE_URL` (default `sc-domain:quantpathlabs.com`).
7. Deploy the separate collector with the project's pinned Wrangler: `pnpm exec wrangler deploy --config wrangler.analytics.jsonc`. Keep `ANALYTICS_ENABLED=false` until all settings and permission checks pass. Enable true and redeploy for daily collection; test a scheduled event in the Worker test environment before relying on cron. Missing configuration must fail, not silently yield zero traffic.
8. Read `GET /reports/latest` with `Authorization: Bearer <REPORT_READ_TOKEN>` using an authorized server client. No tokens in URLs. Anonymous requests must return 401. There is no web-based login UI at this endpoint.

## Data interpretation

GA4: yesterday total, 7-day total, previous disjoint 7-day total, 14 daily rows, top 100 pages/countries/channels for yesterday. Total users queried at each aggregate scope, never summed across days. `userEngagementDuration` is total foreground engagement seconds; divide by the specified denominator only and label e.g. seconds/session (not GA4 average engagement per active user). Rows/metadata and quota metadata remain in the JSON. Empty successful results and unavailable results are distinct; API errors are null with status. Top breakdowns are bounded, not exhaustive. Recent data remains provisional and is re-fetched each run. Preserve reporting identity, sampling/thresholding metadata and actual source timezone.

Search Console: 14-day request ending three days before today in America/Los_Angeles, `dataState=final`, grouped separately by date, page and query. Up to 1000 top rows; absent/private queries cannot be reconstructed. Inspect actual returned dates: even final-data queries may have missing recent dates. Its dates are not Taipei dates and must not be forced into an identical-day GA4 comparison.

This release measures page engagement, NOT a complete conversion funnel. Tool start/complete/save and server-confirmed email verification need separate instrumentation and validation. Existing workflow must report those metrics as unavailable until implemented. Website users cannot be identified as exact real people; consent refusal, blocking and cross-device identity affect coverage.

## ChatGPT daily / 3-day / 10-day handoff

The ChatGPT content and staged review automation is separately enabled for Sep 21–Oct 20. It does not automatically inherit access to this Worker's bearer secret. After deployment, configure a supported authenticated data connection and successfully read a real report in the interactive session; then update the task to use that verified source. Until then, an owner-exported report can be saved to the existing project files and analyzed by the task. Never expose private reports publicly to avoid this connection step. Content research and review continue while analytics are unconnected.

## Release checks and rollback

Local tests cover date rollover, private-fragment filtering, disabled setup, anonymous denial, partial API errors and failure freshness. They do not establish successful Google authorization, browser behavior or deployment. Before merge/release, run the existing build/security tests, test accept/decline/withdraw in browser, verify no Google network before consent, no account data in GA DebugView, one event per view, CSP success and matching source metrics. Confirm no accidental production changes from missing configuration.

Rollback: unset `VITE_GA4_MEASUREMENT_ID` and rebuild, set collector `ANALYTICS_ENABLED=false`, revoke/rotate collector credentials if necessary. Prior reports remain private. API failures must not display an old report as today's success.

Sources: https://developers.google.com/analytics/devguides/reporting/data/v1/ ; https://developers.google.com/webmaster-tools/v1/searchanalytics/query ; https://developers.google.com/identity/protocols/oauth2/service-account ; https://developers.cloudflare.com/workers/configuration/cron-triggers/ ; https://developers.cloudflare.com/r2/api/workers/workers-api-usage/
