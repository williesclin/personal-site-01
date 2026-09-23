# Human evidence workflow / 人工標註流程

> Owner update 2026-09-24: build News & events; articles authored in conversation, no administrator review console. See [NEWS_AND_EVENTS.md](NEWS_AND_EVENTS.md). Existing model-evaluation evidence requirements remain separate from publishing.
Updated: 2026-09-23

The private `quantpath_ops.document_reviews` table stores human-reviewed source versions. It is not an AI prediction table. No labels have been invented or imported. Members have no read/write policies. Existing memberships and research_state remain unchanged.

私人審閱表保存人工判讀的來源版本，不是 AI 預測。未編造或匯入標籤；一般會員無讀寫權限，既有會員資格及個人研究資料不變。

## Operations / 操作
1. `node scripts/prepare-human-review.mjs queue /private/path/queue.json` creates blank rows from the current real filing feed. Keep outside git.／依真實申報產生空白表，保存在公開 repo 外。
2. A human opens each original link, records a pseudonymous reviewer code, topic, sentiment, UTC review time, and 20–2000 characters of original evidence notes. Do not copy full documents. `not_assessable` is valid when metadata cannot support sentiment.／真人回查原文，填代碼、分類、情緒、時間及自行撰寫的依據；無法判讀時保留不可判定。
3. A different human independently reviews at least 20% without seeing the first labels. Register real reviewer ownership privately; a string claiming “human” proves nothing.／至少20%由另一真人盲審；代碼須由營運者私下確認。
4. `node scripts/prepare-human-review.mjs sql /private/path/labels.json /private/path/reviews.sql` validates known source/hash/URL/time/taxonomy and duplicate reviewer records. A trusted operator reviews and executes the transaction through the existing private database connection. It never automatically submits.／檢查後產生交易SQL，經可信任營運者核對才寫入。
5. Reviews are append-only. Preserve disagreements. Corrections require a versioned follow-up migration/process, never silently rewrite ground truth.／保留分歧，修訂須版本化，不直接覆蓋。

Taxonomy v1: financial_results 財務結果; financing 融資; governance 治理; business_update 業務更新; other 其他; uncertain 不確定. Sentiment: positive 正向; negative 負向; mixed 混合; neutral 中性; not_assessable 不可判定. Sentiment describes the source text, not expected stock returns.／情緒是文字判讀，不代表股價方向。

## Release gates / 上線門檻
At least100 unique source-linked reviewed documents; ≥20% independent double review; record disagreement rate; temporal holdout≥30, ≥3 classes and ≥5 per class. Group duplicate events and issuer records to avoid leakage. Compare a frozen candidate with majority and SEC form/item baselines; macro-F1≥0.75 and ≥baseline+0.05; report precision/recall and ECE≤0.10 if probabilistic. Readiness JSON remains blocked even with labels until actual reproducible evaluation runs.

至少100份唯一文件、20%獨立複核，時間切分保留30份以上且每類至少5份；同事件不得跨組洩漏。模型須與凍結基準實測比較並通過上述門檻，JSON核准不算驗證。站內警示另需20個不同事件、90%人工相關性、零重複及7天影子觀察；不啟用寄信或交易建議。
