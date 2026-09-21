# Static-asset analytics policy correction — 2026-09-21

## Evidence and reason

The production HTML response had `script-src 'self'` and `connect-src 'self'` on 2026-09-21. `cloudflare/worker.ts` already had the explicitly limited Google Analytics destinations approved in PR #1, but `public/_headers` did not. `wrangler.jsonc` runs the Worker first only for `/api/*` and `/data/*`; public HTML is served asset-first. A successful Worker build therefore did not establish that opt-in analytics could load on public pages.

## Scope

Align only the static `_headers` CSP with the existing Worker policy. No new tracker, Measurement ID, collector, billing service, account permission or database change. No wildcard, script unsafe-inline or unsafe-eval permission. Framing, forms, base URI, camera, microphone and location restrictions remain unchanged. Existing opt-in, withdrawal, sanitized paths and excluded auth/admin routes remain unchanged.

## Acceptance

Run `pnpm build` followed by `node --experimental-strip-types --test tests/*.test.mjs`. The new regression test compares source and built static headers against the Worker policy and asserts the exact narrow script/connect destinations. Preview the built assets through local Wrangler and check actual HTTP response headers. After merge, require the Cloudflare build check for the exact merge SHA plus a production HTML header check and public/API smoke checks.

Google Analytics script loading is not proof of GA4 realtime receipt or authorized report reads. Both still require interactive verification. The collector remains disabled. Consenting traffic is a sample, not total website users. Test browsing is internal traffic and must not be counted as audience growth.

Rollback: revert this change if unexpected CSP or public-page regressions occur. Restoring the old policy would also restore the analytics load defect, so record that trade-off. Never relax to wildcard or unsafe-eval to repair a tracking error.

## References

- https://developers.cloudflare.com/workers/static-assets/headers/
- https://developers.google.com/tag-platform/security/guides/csp

These sources were checked 2026-09-21. This document describes the correction and acceptance procedure, not independent proof of production deployment.
