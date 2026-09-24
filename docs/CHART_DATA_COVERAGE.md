# Chart coverage correction — 2026-09-24

One primary factor: accurate missing-data treatment in financial charts.

Before: scatter-axis bounds and empty-state eligibility were calculated from each metric separately. A company with only an X value could stretch the horizontal axis without producing a point. With no complete X/Y pairs, the screen could show an empty chart instead of explaining missing data.

After: `scatterRows` retains every selected company in the accessible data table, but only finite pairs from the same fiscal row define points and both axis ranges. Genuine zero and negative values remain valid. No complete pairs produces the existing bilingual unavailable state. All chart types now disclose the count of valid observations and its denominator: selected companies for comparison/scatter, selected company-period records for trend. This count is data coverage, not user activity or confidence.

Evidence: in the 2026-09-24 00:28 UTC snapshot, 13 of 50 companies have no normalized gross-profit fact in their latest annual row. This does not establish that those companies did not report the item; extraction tags and source context still require review. Missing facts must not be replaced with zero or inferred from another period.

Tests: paired missing dimensions, real zero, negative profit, unavailable fiscal year, non-finite inputs, and all existing regression tests. Browser preview checks the shared coverage display and bilingual interactions. A paid member's full scatter UI and real phone testing remain separate acceptance items; no entitlement is granted for testing.

繁中：修正散佈圖缺值與座標軸範圍，只用相同年度兩維度均有效的公司繪圖；保留表格中的缺值列，不以零代替。折線圖分母為所選公司年度觀測，長條／散佈圖分母為所選公司。資料覆蓋率不代表使用者人數、信心度、相關性或預測能力。完整會員操作與手機驗收不得以單元測試冒稱完成。
