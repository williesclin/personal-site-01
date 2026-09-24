# Membership site review — 2026-09-24

Scope: public bilingual pages, account entry, member workspace, pricing, research/news access, session expiry and existing database policies. Free / Research / Pro remain the only tiers; checkout stays disabled. No subscription grants, schema/permission changes, data-source activation or messages.

## Changes
- Add My membership / 我的會員方案: effective tier, paid-through cancellation, watchlist and condition usage, current tool availability, no-sales state and data-retention limitations.
- Public navigation distinguishes authenticated membership from sign-in; API failure is unknown, not Free. A shared read routine refreshes on focus, visible-page checks and paid expiry; protected APIs retain fresh server authorization.
- Preserve requested workspace destination after login. Recognize only explicit workspace hashes so ordinary public content anchors do not open an unintended login page.
- Signing out clears this browser cookie even after upstream expiry/failure. Remote revocation is separately reported; no claim of signing out every device.
- Research reads show a retryable membership error instead of silently classifying a failure as Free. Saving with a lost response is an unconfirmed outcome, not proof of no write.
- Keep research and sports inside the current workspace language; remove a research language link that left the current tool.
- Pricing distinguishes built factual tools from unreleased news/social/AI/Pro features; correct the claim that a final retention policy was already published.
- Separate source-health failures from entitlement failures. Update a stale test that assumed SEC event count would stay at 66; genuine new events must be accepted.

## Verification
- Production build: 26 prerendered EN / zh-hant pages, reciprocal language links and sitemap.
- Node regression tests include guest, Free, active/canceling/expired plans, forged metadata/admin bypass, quotas, blocked checkout, news pagination, static JSON denial, account-state parsing, logout after failure and public fragments.
- Existing live transaction-only research RLS suite completed and rolled back: client metadata does not grant access, Free and expired users cannot read protected evidence, active/canceling membership can, anonymous access and unreleased model access denied. No fixture user or paid entitlement persists.
- Synthetic 375/390 CSS-pixel presentation checks are separate from real signed-in acceptance. Temporary presentation assets are removed before merge.
- No claim of physical-device testing, payment flow acceptance or a live paid-member session without actual evidence. Final preview / production results appended after verification.

## Remaining release requirements
General news/social ingestion, model validation, 10 verified ETFs, full screening, payment/refund/cancellation acceptance and source/legal/retention review remain paid-launch gates. Real account saving/readback and full subscriber browsing need an eligible authorized session; no account is upgraded for this purpose. The current saved-condition format does not save chart layouts.
