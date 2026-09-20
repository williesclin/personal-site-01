# Official lottery history and analysis

Three independent public snapshots: `lotto649.json` (555 draws from 2022-01-04), `superlotto638.json` (596 from 2021-01-04), `daily539.json` (1483 from 2022-01-01), as first retrieved 2026-09-20. Counts grow; do not hardcode them in operations. Each retains all fetched history, source URL, request URLs, retrieval time, coverage and SHA-256.

Sources: Taiwan Lottery public result pages `/lotto/result/lotto649/`, `/lotto/result/superlotto638/`, `/lotto/result/daily539/`; their observed public website endpoints under `https://api.taiwanlottery.com/TLCAPIWeB/Lottery/`: `Lotto649Result`, `SuperLotto638Result`, `Daily539Result`. These are not guaranteed supported developer APIs. No paid connector or new hosted database is required.

Shared rule configuration: `app/lottery-engine.mjs`. Lotto: 6 distinct main numbers 1–49 and a separate special number not among main numbers. Power: 6 distinct first-area numbers 1–38 and independently 1–8 second area (overlap allowed). Daily539: 5 distinct 1–39, no extra number. Ordinary prize counts and per-ticket awards are retained in explicitly named source-field order, including Power ninth and normal separately. Promotions and personal after-tax payments are excluded.

Sync validates schema, game rules, dates, prizes, duplicates, within-year period continuity, pagination completeness, >=500 draws and preservation of prior IDs. Atomic per-file replacement. If any game fails the workflow fails before committing; production retains the prior snapshots. Historical source corrections are versioned in git.

Workflow `.github/workflows/lottery-data.yml`: daily UTC 13:45/23:45 (Taipei 21:45/07:45), plus manual and ingestion-code changes. GitHub scheduling may delay. Check actual run success and production retrieval timestamps; >48h old displays a stale warning. A non-draw day is not a fetch failure. No member/analytics data may be committed.

UI uses same-origin snapshots for demo and members. Default 100 draws, choices 30/60/100/300/500; archive searches all data. Game switches reset selections and archive filters. Loading/error states do not fabricate zero results.

Dimensions: main frequency, trailing absence within selected sample (>=sample size if absent throughout), independent extra-area frequency, odd count, user-defined low/high split, sum in 20-wide bins, span, adjacent-number pair count, overlap between successive draws (N-1 comparisons), unit-digit totals, pair co-occurrence top15. All are descriptive, not predictive.

Number composer: fixed/excluded numbers, odd count, low count, sum bounds, adjacency condition, Power second area, 1/5/10 distinct combinations. Bounded random rejection sampling at 30000 trials, constraints never relaxed. Partial/no results explicitly say search not exhaustive. Lotto special numbers are not player-selected. Historic matching is in-sample description, not backtesting or prospective validation. Settings and generated rows are session-local; no purchase, saving to member accounts or automatic wagering.

Tests cover all snapshots, known toy statistics, rule separation, generated constraints, duplicates and impossible conditions. Public bilingual descriptions are updated; the member analysis UI remains Traditional Chinese.
