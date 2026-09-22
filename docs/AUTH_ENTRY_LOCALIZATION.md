# Bilingual authentication entry — 2026-09-22

Scope: sign-in, free-account registration, and request-reset forms only. English is the default; /zh-hant/ inherits Traditional Chinese. Language switching preserves the originating public path, action hash and in-memory input. Returning to the public page removes the action hash. No credentials are persisted or sent to analytics.

Stable keys in app/auth-i18n.mjs cover headings, labels, hints, errors, unavailable/loading/busy states and accessible labels. HTTP failures map to safe localized categories; provider response text is not exposed. Duplicate submissions are suppressed; reset requests transmit email only. The existing worker endpoints, cookies, email verification, minimum password length, server entitlement checks, RLS and data model are unchanged.

The initial session check now shows a localized loading state rather than flashing the old lottery landing page. Public account links retain page and language context.

This is NOT complete member-workspace localization. The workspace, administration screens and new-password page opened from a reset email still use Traditional Chinese. Both form languages disclose this limitation. No checkout, paid access, model, user grant or message dispatch was added.

## Verification boundary

Automated coverage: translation-key parity, unavailable/unknown-action no-transmission, reset payload minimization, duplicate suppression/retry, safe errors, and no credential persistence. Existing data, membership and public-content tests remain required. Run `pnpm build` and `node --experimental-strip-types --test tests/*.test.mjs`.

Preview acceptance: switch language on all three forms, inspect labels and scope notice, preserve originating route/hash, return to the same public page, and verify initial loading has no old landing-page flash. No test account creation, reset-email sending or production entitlement mutation is part of this UI acceptance. Authenticated account isolation and mail delivery require separately authorized fixtures. Mobile CSS wraps long controls; a real narrow-viewport acceptance remains necessary before claiming mobile completion.

## Next slice

Translate new-password and member navigation/status first; then lottery forms/results, dates and currency formatting. Preserve persisted enum values and free-form user input. Full workspace remains pending until every route and error state is accepted in both languages.
