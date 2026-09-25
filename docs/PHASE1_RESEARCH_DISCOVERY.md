# Phase 1 — research discovery and continuity

The homepage now starts with a concrete research task: find an instrument, inspect source facts, compare and save. Financial research is the primary navigation; the existing Taiwan lottery workspace has a separate labelled entry. English and Traditional Chinese are paired.

## Implemented
- Shared public navigation and global search for 50 stock identities, 3 ETF identities, published guides/articles and the existing public NVIDIA filing subset. Stock symbols, company names, selected Chinese aliases and industry terms work. Full member filing history remains in the authorized news tool.
- 53 stable `/en/assets/{symbol}/` and `/zh-hant/assets/{symbol}/` profiles, with identity, market/category, access, source-event and comparison routes. Financial facts remain behind existing preview/member APIs. ETF-only profiles do not show empty company tools.
- Coverage map distinguishes existing, gated and unconnected content; unknown symbols do not imply an upgrade would unlock data. Macro, FX/gold, crypto/stablecoins, social attention, validated models and overseas lottery are explicitly marked as future coverage.
- Safe post-login return to known local asset/news/search/research routes. Search parameters survive language switching. Login explains its destination, and Back returns to that context.
- Versioned saved conditions include query/year/table metrics, watch-only filter, ETF amount, company selection, primary/secondary dimensions, chart type and industry. Legacy records remain readable with explicit default-chart labels. Existing Free/Research/Pro quotas are unchanged.
- Analytics omit raw queries and use a generic asset-profile label rather than an individual symbol.

## Verification
- Production build: 136 bilingual prerendered pages with canonical/hreflang and sitemap.
- 62 regression tests pass, including full layout API roundtrip, authorization, quota/malformed input rejection, legacy records, public search isolation and safe return paths.
- Focused TypeScript check passes for the research/navigation components and imports.
- Live Supabase transaction-only checks: saved chart roundtrip, cross-account isolation, owner reassignment denial, Free and expired write denial. All fixtures and writes rolled back. No schema, entitlement or billing changes.
- Cloudflare branch preview: homepage, Chinese alias search, Microsoft identity and gated-tool distinction, context-preserving login entry.
- Synthetic browser roundtrip passed: 2024 period, watch-only NVDA/AMD, chips category, gross-margin versus R&D-intensity scatter, and USD 25,000.50 amount survive component reload and Apply. This is controlled UI acceptance, not a live user-session write.
- Temporary synthetic browser fixture is used only for responsive/layout and component-state tests. It contains generated numbers and no actual member session or financial feed. Its build hook must be removed before merging.

## Scope limits
No new market feed, quarterly/TTM data, licensed general news, social feed, predictive ranking, out-of-sample model, payment flow or notification service is introduced. Live member-session browser acceptance is distinct from controlled component/API/database tests and must be reported separately. This phase improves findability; it does not claim market outperformance.
