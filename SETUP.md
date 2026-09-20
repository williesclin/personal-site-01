# QuantPath Labs — 第一版

這是可操作原型與可部署至自己 Cloudflare 帳號的第一版程式。
網站品牌：QuantPath Labs；預定網域：https://quantpathlabs.com。

## 本次交付狀態

- 已完成：公開首頁、註冊/登入/重設頁、會員概覽、樂透統計介面、隨機選號、規劃儲存、支出/獎金紀錄、CSV 匯出、文章編輯、會員唯讀名單、模型 JSON 報告匯入、同條件比較、手動驗證、版本指標發布與回復、操作紀錄。
- 示範模式：合成開獎與模型資料；僅存在使用者目前瀏覽器 localStorage。管理員示範入口公開可用，不構成正式管理權限。
- 已備妥但待接線：Cloudflare Worker API、Supabase Email 帳密流程、資料庫 RLS、獨立研究資料庫。正式 API 不信任瀏覽器示範狀態或傳來的角色。
- 尚未完成：使用者 Cloudflare 帳號的實際部署與網域綁定、Supabase 專案與寄信設定、真實開獎資料匯入、真實跨帳號與寄信端到端驗收。
- 模型上傳範圍：JSON 實驗報告與模型版本 metadata；不執行 Python，不上傳/執行任意模型權重，也不自動重跑驗證。發布切換報告版本指標，不等於部署推論引擎。
- 會員管理第一版為唯讀。管理員角色僅由專案擁有者在資料庫授予。

## 快速檢視

開啟另附的 `QuantPath_Labs_V1_Preview.html`，點「體驗會員工作台」。
本機預覽不會寄出任何驗證信，也不會建立真實會員。

## Cloudflare 上線步驟（由網站擁有者帳號進行）

1. 安裝 Node.js 22.13 以上與 package.json 指定版本的 pnpm，執行 `pnpm install --frozen-lockfile`。
2. `pnpm build:cloudflare`。程式輸出到 `cloudflare-dist/`。
3. 使用 `pnpm exec wrangler login` 登入你自己的 Cloudflare 帳號。
4. 若要先上線可操作示範，直接 `pnpm deploy:cloudflare`，此時沒有任何 Supabase 設定，所有正式會員 API 都會拒絕服務。
5. 在 Cloudflare Worker 的 Settings → Domains & Routes，新增 Custom Domain `quantpathlabs.com`。不要複製其他人帳號的 DNS 記錄。
6. 如需 www，另新增 `www.quantpathlabs.com` 或設定轉址。

## 接上正式會員（需新建或由你授權的 Supabase 專案）

1. 建立 MEMBER 專案，在 SQL Editor 執行一次 `database/members.sql`。
2. Auth → Email：啟用 Confirm Email；停用匿名使用者；Site URL 設成 `https://quantpathlabs.com`；允許 `/` 與 `/reset-password.html` 重導向。
3. 設定正式 SMTP 與寄件網域驗證、Auth rate limit。使用 Supabase 預設驗證/重設範本與 implicit redirect；重設頁會讀取 recovery fragment，立即移除網址中的 token。
4. 在 Cloudflare Worker 加入秘密：`SUPABASE_URL` 與 `SUPABASE_ANON_KEY`。`SITE_URL` 在 wrangler.jsonc，若先測 workers.dev，請改成實際來源網址並同步 Auth 的允許重導向。
5. 註冊你自己的帳號、完成驗證。由 Supabase SQL Editor 對此已驗證帳號的 UUID 授予 admin。範例在 members.sql 最後；不可用前端欄位或 signup metadata 設定管理員。
6. 會員登入後只會透過 HttpOnly、Secure、SameSite=Lax cookie 帶入 session；不把 bearer token 放在 localStorage。登入有效期最長一小時，到期重新登入。
7. 不要放 MEMBER 的 service-role key 到此應用程式。會員資料請求使用會員 JWT，仍受資料庫 RLS 檢查。

## 模型研究區獨立接線

1. 建立另一個 RESEARCH Supabase 專案，執行 `database/research.sql`。
2. 設定 Worker 秘密 `LAB_SUPABASE_URL`、`LAB_SUPABASE_SERVICE_KEY`。
3. 研究專案不開放 anon/authenticated 讀寫。後端先驗證 MEMBER 帳號及 admin 身分，才允許研究服務操作。
4. 實驗版本只新增不覆寫；發布/回復透過單一資料庫交易鎖定狀態，保留稽核紀錄。
5. 報告檔名與 SHA-256 為匯入資料的識別紀錄，不代表內容已被獨立驗證。正式發版前需人工作成檢核。

## 正式驗收必做

- 帳號 A 未驗證不能登入；驗證後可登入；錯誤/過期憑證被拒絕。
- 帳號 A 建立規劃與支出，B 即使知道其 UUID 也無法透過 API 或 Supabase REST 讀写。
- 一般會員不能讀研究資料、會員名單或發布模型；修改瀏覽器狀態不能提升權限。
- 註冊信、忘記密碼、重新登入、登出撤销都須使用實際寄信服務測試。
- 確認手機排版、實際資料來源、備份與帳單上限後，再邀請第一批正式會員。

## 已執行驗證

- TypeScript 型別檢查、前端與 Worker 正式編譯。
- 自動檢查彩種號碼範圍、每批不重複、無效輸入拒絕、不同測試條件不得比較。
- API 無設定拒絕、未登入拒絕、跨來源寫入拒絕、一般會員不得發布模型（使用 mock 身分回應）。
- 瀏覽器檢查主要桌面介面、預算超支阻擋、產生/儲存規劃、JSON 匯入、不同資料集比較阻擋、紀錄新增、版本發布與回復。
- 未用真實 Supabase 專案執行 SQL/RLS 或寄信驗收；此項不可宣稱已驗證。

## 開發

`pnpm dev` 啟動 Vinext 預覽。預覽 `/api/session` 固定未連接，避免誤收正式帳號。
正式 Cloudflare 使用獨立 Vite client + Worker 編譯路徑，共用同一組畫面與 domain.ts。
`node --experimental-strip-types tests/domain.test.mjs`；`node tests/security.test.mjs`（先 build:cloudflare）。

WebMCP 導覽工具已採功能偵測註冊；本次瀏覽器未提供 modelContext，因此未驗證該工具。一般點選操作不受影響。
