# new-pay OnlineStore monorepo — 給 AI coding agent（Claude Code / Copilot）的說明

這是刻意保留技術債的 workshop 教材，詳見 `README.md` 與 `TECH_DEBT_NOTES.md`。

## 模組

- `backend/`：交易後端，Spring Boot 2.7.18 + JDK 8，port 8099。**課程中不動它。**
- `portal/`：SA/CP/CSR Portal，Thymeleaf + jQuery，port 8098，打 backend 的 URL 寫死在 `PortalController.BACKEND`。
- `portal-e2e/`：Portal 的 BDD 端對端測試（Playwright + playwright-bdd + TypeScript），
  backend 由 Mockoon 假後端（`portal-e2e/mockoon/`，同樣聽 8099）取代。說明見 `portal-e2e/README.md`。

## 課程流程對應的 skills（`.claude/skills/`）

1. `/gen-user-story` — 讀 `docs/new-pay_Portal_SRS.docx`（轉成 md），產 `docs/user-stories.md`（US／驗收條件 AC／需求追溯矩陣）與 Word 交付檔。SRS 是唯一需求來源，FSD 已降級不再讀。
2. `/gen-gherkin` — 以 user-stories.md 的 US/AC 為覆蓋骨架、對照 portal 原始碼，產 `portal-e2e/features/*.feature` 與 Mockoon 情境；每條 AC 至少一個 scenario。
3. `/gen-test-code` — 把 feature 轉成 steps / Page Object / fixtures，直到 `bddgen` 與 `tsc` 乾淨。
   → 跑 `npm test`，取得升級前基線（全綠）。
4. `/upgrade-springboot` — 只把 `portal/` 升到 Spring Boot 4.1.1 / JDK 17+。
   → 再跑同一套 `npm test`，全綠即升級成功（行為零差異）。

## 慣例

- Gherkin：英文關鍵字（Feature/Scenario/Given/When/Then）+ 中文句子。
- Portal 沒有 `data-testid`，Page Object 用 template 裡的 id；不要為了測試改 portal 的 HTML。
- `portal-e2e/mockoon/newpay-backend.json` 與 `.features-gen/` 是產物，改來源（`routes/`、`bodies/`、`features/`）再重新產生。
- 啟動 Portal 前先關掉真 backend（兩者搶 8099），或改用 `NO_MOCK=1` 對真後端跑。
