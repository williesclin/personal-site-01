# Workspace and evidence progress — 2026-09-22 UTC

## Delivered implementation / 已實作

- Bilingual member shell, research-first overview, tier lookup (failure remains unknown), locale-preserving navigation, source freshness. Grouped free lottery tools; sports methods remain secondary.
- Bilingual spending records and entry dialog, separate empty/filtered states, clear-filter recovery, compact summaries only when data exist. Original values, notes and account ownership unchanged. CSV formula protection retained.
- Session read failures show recovery instead of synthetic/zero balances. Administration source status reads actual snapshot metadata.
- `scripts/sync-research-feed.mjs` polls 50 SEC submissions every six hours using the official data endpoint, one request at a time, metadata only. First capture: 66 documents, 50/50 requests successful. Initial observations are backfill, not live alerts. Failed issuers retain previous records and are named in run metadata.
- `scripts/build-research-sync.mjs` writes a SHA-256 envelope. Private Supabase importer validates exact payload bytes, issuers and annual coverage before committing. The database polls a fixed GitHub main URL; it never accepts arbitrary client URLs or credentials. Financial and feed workflows refresh the envelope. This is periodic reconciliation, not an instantaneous GitHub webhook.
- SEC form classification is `sec-form-rule-v1` (annual/quarterly/current report), explicitly a deterministic baseline, not AI. Candidate new-filing alerts deduplicate by document; backfill creates no alert. Alerts remain draft/internal.
- Actual AI release gate executed: 66 observed documents, 0 independently reviewed labels; blocked. No training, sentiment accuracy, calibrated confidence or published AI signals claimed.

## Limits / 尚未完成

- Full member UI translation: lottery historical tools, planner, model/admin forms and password-setting page still Traditional Chinese. A clear notice remains in English workspace.
- Real subscribed member and physical mobile-device acceptance require an eligible authenticated test session; no paid entitlement is granted merely for tests.
- NVIDIA/AMD RSS transport reads succeeded, but commercial storage/display rights were not established. NVIDIA terms: https://www.nvidia.com/en-eu/about-nvidia/terms-of-service/ . Automatic issuer-news ingestion remains disabled; no full text copied.
- Bluesky public search returned HTTP 403. Social attention and sentiment remain unconnected, not zero.
- Research/Pro sales stay disabled; no emails/push/social messages are sent.
- Readiness gates: >=100 independently reviewed labels, >=30 chronological holdout documents with >=5/class, >=3 classes, grouped duplicates/events; majority and form-rule baselines; macro-F1 >=0.75 and >=baseline+0.05, ECE<=0.10 for probabilistic candidates. These are acceptance targets, not measured results. At least20% double-reviewed. Seven-day shadow alerts before release.

## Operations / 維運

After successful first import and unchanged replay, enable one private 15-minute `cron` reconciliation job. Check `quantpath_ops.sync_runs`, `quantpath_ops.feed_runs`, `cron.job_run_details`, latest GitHub Actions and production data status separately. Failures preserve previous complete snapshot. Rollback UI via GitHub revert; pause sync with `cron.unschedule` only, retain facts/history. New migrations match remote applied versions.

中英操作摘要：研究總覽、導覽與樂透收支已改版；SQL 同步只接受固定 GitHub 快照並核對雜湊，讀取失敗保留前版。申報事件分類是規則，不是已驗證 AI。新聞商業展示權、社群來源與人工標註仍未完成，因此不啟用情緒或 AI 警示。部署與操作驗收結果另記營運紀錄，不把此文件當成部署成功證據。

Browser verification: bilingual overview and route-preserving language switch passed on the branch preview. Demo protected-tool denial passed. A local 375/390 component fixture was built, but the cloud browser disallows file URLs; it has NOT been visually or interactively validated. No alternative browser mechanism was used.

## 2026-09-23 follow-up (PR #17)
Stable display keys now cover lottery historical analysis, multidimensional tools, planner, budget, model-review/admin labels and standalone password reset. Saved game/status enums, user notes, source names and historical audit text are retained. No role, subscription or data model was translated into different persisted values.

Reset page defaults to English, supports zh-hant, removes recovery token from URL, rejects missing/non-recovery links, suppresses provider details and guards duplicate submits. No real password reset was sent during testing.

Private human review table deployed with RLS, no anon/member access; actual human review count remains zero. Blank66-document queue is not labelled ground truth.47 behavioral/domain tests and build passed. No tsconfig exists; tsc help output is not a successful typecheck.

Preview b66fb27 / de61ef24 acceptance: real browser with synthetic 375/390 CSS-pixel frames; scrollbar-adjusted layout widths360/375, scrollWidth equals clientWidth after record entry, language switch and planner generation. Record dialog fits frame (left16/right359), main generate button45.09px high. Bilingual notes preserved. Test changes are in component memory only, not account storage. No real-device or authenticated-session claim. Temporary preview assets removed before merge.

Follow-up close control translated and enlarged to44px; generic save failure now says outcome cannot be confirmed (a lost response does not prove no server write). Final suite48/48, build24 public pages.
