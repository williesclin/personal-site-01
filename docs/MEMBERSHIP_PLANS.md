# 2026-09-22 approved expansion

Current scope: 50 AI-related US-listed companies, 14 financial dimensions, descriptive charts and a versioned evidence database. See [RESEARCH_DIMENSIONS_AND_AI.md](RESEARCH_DIMENSIONS_AND_AI.md) for actual coverage, membership visibility, ingestion limitations and next-week AI gates. This section supersedes older three-company and browser-only descriptions below; billing remains disabled.

# QuantPath membership decision and release

Approved: 2026-09-20. Three tiers only. No separate charge by game, model or market.

| Tier | Planned USD monthly price | Stock watchlist / saved conditions | Scope |
|---|---:|---:|---|
| Free | 0 | No full stock tools | Verified sign-in unlocks three lottery games, analysis, number generation and personal plans/records. Limited public stock preview. |
| Research | 9 | 30 / 5 | Financial trends, comparison, ETF scope/fees, account research saving. Screening/export and broader coverage remain launch requirements. |
| Pro | 19 | 200 / 30 | Research plus validated multifactor, portfolio risk, scenarios and backtests. Advanced tools not yet released. |

English /en/pricing/ and Chinese /zh-hant/pricing/. Monthly-only launch proposal; no annual, lifetime or model add-ons. No checkout, payment collection, free-to-paid trial, automated email or paid assignment is activated. Prices are proposed launch prices, not current purchasable products. No existing user is silently converted or charged.

## Actual release

- Verified free members retain existing lottery tools, plans and records; demo mode cannot enter full lottery tools or authenticated data APIs.
- Public /research/ shows NVIDIA three annual periods and IVV. Full tools use /api/research-data and current server-validated membership, not URL, localStorage, editable metadata, admin role or client flags.
- /api/membership gives the current effective tier and limits. No row means Free. Only active/canceling within [period_start,period_end) grants Research/Pro. Pending, past_due, expired, revoked or invalid dates fail closed.
- Subscription truth is public.memberships in quantpath-members; RLS allows users SELECT of their own row only. No client mutation grants. Service-role key is not introduced into the web client or worker. Later billing integration must verify webhook signatures, deduplicate events and resolve out-of-order state; client success redirects must never grant membership.
- public.research_state isolates each user's watchlist and saved conditions. Worker validation enforces supported formats and quotas; DB policies independently enforce paid period, ownership and array caps. Own reads/deletes remain possible at DB level after expiry; saved data is not auto-deleted. Current UI requires paid entitlement to edit. Future deletion/retention policy and self-service export must be finalized before charging.
- User API token is validated against Supabase /auth/v1/user on protected requests. Database membership is queried fresh; no stale JWT plan claim and no reliance on user_metadata. Admin status does not bypass subscription.
- Public facts moved from public/data to data and bundled only in the server build; no complete raw data file in the static output. Legacy /data/* returns 404; lottery data uses /api/lottery/{lotto649,superlotto638,daily539}. Public /api/data-status exposes health timestamps/counts only. Public stock preview has explicitly reduced data.
- Data source facts and previous versions remain public in GitHub and previously published versions. Membership protects this website's services, not ownership of public facts. Do not put commercially restricted datasets in this repository.
- Stock and lottery refresh workflows now write data/*.json. Their actual post-merge jobs and Cloudflare builds must succeed before declaring the new path operational.

## Storage and migration

Remote Supabase migration membership_tiers version 20260920233427 applied to ngmhqadvnjbhtlrrcxsb. Local file initially scaffolded with pinned Supabase CLI 2.117.0, then aligned to the remote-recorded version to avoid duplicate application. Existing profile/plan/record tables and auth configuration unchanged.

Live rolled-back transaction tests verified own-row read, no self-upgrade, active Research save, no cross-user write, Research quota enforcement, no expired-member write, and retained own research reads. Test users and grants did not persist. Security advisor reported no new RLS issues; pre-existing leaked-password protection warning remains. Review availability/cost before changing auth configuration: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Paid launch gates

Research: at least 30 verified companies and 10 ETFs, usable multi-condition screening/export, source/period/unit/null checks, account saving, payment and cancellation/refund/failed-payment acceptance, finalized tax/retention terms, source use rights and jurisdiction-specific legal review.
Pro: all above plus actual advanced tools, versioned datasets/model assumptions, chronological holdouts, transaction costs where relevant and reproducible baseline comparisons. More expensive does not imply guaranteed accuracy or profit.
Common lottery ingestion, filtering, presentation and validation infrastructure may be reused; lottery independence/frequency assumptions are not stock prediction models. Do not advertise precise predictions, investment recommendations or model performance without the applicable legal review and evidence.

Taiwan Securities Investment Trust and Consulting Act Articles 4/6: https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=G0400121 . Fee-based securities analysis may be regulated even with a disclaimer. No worldwide legal clearance has been established.

## Operations through the existing 30-day window

Daily: prior actual log, auth/payment-gate health, data-status/job/build state, material official news (0–3), one useful correction/research output; no invented traffic. Keep anonymous/free/Research/Pro usage distinct when analytics is actually connected; never send watchlist or personal financial data to GA4.
Every 3 days: one evidence-driven usability, data or conversion-path improvement; verify free lottery remains usable and demo/API bypass stays denied. Membership funnel: visited pricing → free signup → verified lottery use versus stock-preview interest → paid checkout only after launch. Do not label preview interest as willingness to pay.
Every 10 days: review retention, support/data/compute cost, expressed payment demand, licensing and actual paid-launch gates. Never open billing automatically to meet a calendar milestone or publish unimplemented Pro tools.
Existing Sep21–Oct20 schedule and no-message/no-paid-connector constraints remain. GA4 realtime and reporting access still unverified. Update operations records against these actual states.
