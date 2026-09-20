# QuantPath public architecture — 2026-09-20

## Public experience
English `/en/` and Traditional Chinese `/zh-hant/` have equivalent home, library, tools, methodology, about and guide pages. `/` renders the English homepage and canonicals to `/en/`. Language switching preserves the page. No automatic locale redirect. Market and language are separate dimensions.

The library supports keyword search, topic filtering, result counts and a resettable empty state. Three starter guides cover probability, budget records and model comparison. These are educational content, not news or measured model results.

`app/public-content.mjs` is the public editorial catalog: stable content ID, category, market, publication status, update date, version, paired complete translations and source links. Keep private member data and analytics out. Git history provides public revision history. This is a versioned content catalog, not a new hosted database.

`app/public-site.tsx` renders the catalog; build-time prerendering emits 16 real localized HTML pages plus sitemap and robots.txt. Each includes a title, description, canonical and reciprocal hreflang links. Keep both languages complete before publication. Adding markets requires source/rules/rights verification; adding a translation does not activate a market.

## Existing workspace and remaining work
Member, auth and administration routes retain existing behavior and Traditional Chinese UI. The tools page explicitly labels that scope. English member forms, server error codes with localized messages, status labels, date/currency formatting and accessibility labels are the next implementation milestone; do not claim they are complete. Preserve persisted enum values and user-entered text during localization. No account or database migration is part of this release.

Demo data stays synthetic. Live draw ingestion, independent execution of models and broader market support are not released. Report approval is an administrator decision, not an independently reproduced experiment.

## Analytics
Optional GA4 remains opt-in, with no first-visit modal. Measurement ID is G-N7Q9DKGRPL. Only allowlisted public paths and safe workspace views are measured, without query strings, search terms or member records. Public page identifiers include locale and content slug. Auth/admin routes remain excluded. Realtime receipt and private report access still require verification; collector is disabled pending credentials/configuration. Do not present consenting traffic as the full audience.

## Daily, three-day and ten-day operation
Start each run by reading this document, live source, deployed pages and the previous ledger. Foundation defects take priority over new promotion: language parity, broken links, discoverability, mobile layout, content accuracy, data boundaries and runtime errors.

Daily: verify yesterday's work, review 0–3 relevant source-backed developments, complete one useful paired English/Chinese update or fix, and record evidence and next steps. News is optional, not a daily quota. No unsupported figures or automatic subscriber messages.

Every third day: inspect the previous change; make one evidence-backed adjustment and revise the next three days. No automatic broad redesign or claims of an A/B winner with insufficient samples.

Every tenth day: review language/market/channel coverage, content discovery, model evidence, data quality and cost. Produce keep/change/stop decisions. Day 30 closes the period without extending it.

Priorities: (1) finish full member-workspace localization with preserved schemas, (2) verify GA4 receipt and connect private official-API reporting, (3) improve content using observed searches and engagement, (4) add markets only after verified data and rules. Missing metrics are unavailable, never zero. Traffic cannot establish model quality.
