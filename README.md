# QuantPath Labs

Cloudflare Workers 網站第一版。

## Cloudflare 建置設定

- Worker 名稱：`quantpath-labs`
- 生產分支：`main`
- 根目錄：儲存庫根目錄
- 組建命令：`npm run build`
- 部署命令：`npx wrangler deploy --config wrangler.jsonc`
- Node.js：22.13 或以上

Cloudflare 自動安裝相依套件；本機可用 `corepack pnpm install --frozen-lockfile`。

建置後執行 `npm test`。完整會員與研究資料庫設定見 `SETUP.md`。尚未設定 Supabase 時只提供示範功能，不接受正式會員註冊。

模型功能管理 JSON 測試報告及版本比較，不執行上傳模型的訓練或推論。
