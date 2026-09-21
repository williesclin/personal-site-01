# Public journey review — 2026-09-21

## Observed problems

Production desktop review found that the homepage promised a watchlist before identifying the limited preview; the generic research-cycle panel did not explain access. Sports education appeared beside the primary stock product. The preview offered an unusable watchlist filter and disabled stars, while its ETF empty state suggested symbols outside public coverage. The stock guide opening described three companies before explaining the one-company public limit.

## Changes

- Publish complete English and Traditional Chinese stock guide v2 under its existing ID and URLs. Preserve all substantive draft paragraphs; put verified source links in the common source list and localized preview/pricing actions at the end. Market is U.S.-listed securities, with fund exposure distinct from interface language.
- Homepage leads to the stock preview and free lottery entry; the side panel explains public preview, verified free lottery membership, and planned Research/Pro. Only research-relevant guides are featured; all guides remain in the library.
- Main navigation emphasizes Home, Stocks & ETF, Library, Tools, Pricing. Methodology and About remain in the footer. No new categories or deleted URLs.
- Tools separates public stock preview from verified free lottery access. Sports and synthetic model-report demos remain in a secondary disclosure with limits.
- Preview search hints reflect NVDA/IVV; watchlist-only filter and save stars are shown only in the full research interface. Backend authorization, quotas, database values and account records are unchanged. Add guide link at the point of use.
- English account links disclose the current Chinese workspace. Full member localization remains open; this release does not claim it is complete.
- Responsive two-column cards collapse at 760px, controls wrap, and long source/date text can wrap. Real mobile browser acceptance is recorded separately from CSS inspection.

## Validation / release gate

Run pnpm build and node --experimental-strip-types --test tests/*.test.mjs. Inspect Cloudflare branch preview: both homepages, stock guide, language preservation, search/reset, annual source disclosure, ETF amount errors, tools and disabled purchase buttons. Merge only after preview checks; read exact-merge Cloudflare build and verify production before marking published. Authentication tests in the suite are mocked; this change does not claim a new live two-account/RLS test.

No traffic/conversion effect is established. GA4 receipt and private reporting remain unverified. No checkout, new payment service, member notification or data source is enabled. Revert this UI/catalog commit if navigation or preview regressions appear; data snapshots and account state are independent.
