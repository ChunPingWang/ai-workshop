---
name: gen-test-code
description: 把 portal-e2e/features 裡的 Gherkin 轉成可執行的 Playwright 測試碼（playwright-bdd 的 steps、Page Object、fixtures），直到 bddgen 沒有 missing step、tsc 通過。用在「補步驤定義」「把 feature 變成測試」「bddgen 說 Missing step definitions」。
---

# gen-test-code：Gherkin → Playwright 測試碼

## 目標

讓 `portal-e2e` 的每個 `.feature` 都有對應的步驟定義與 Page Object，`npx bddgen` 乾淨、`npx tsc --noEmit` 通過，
使用者接著跑 `npm test` 就能對真 Portal + Mockoon 執行。

## 架構（照著既有的做）

```
features/<page>.feature      Gherkin（gen-gherkin 產的，不要為了方便測而改句子）
steps/<page>.steps.ts        該頁面的步驟；跨頁共用的放 steps/common.steps.ts
pages/<Page>Page.ts          extends BasePage；所有 selector 集中在這裡
fixtures.ts                  每個 Page Object 一個 fixture；steps 從這裡 import { Given, When, Then }
```

先讀這四個現成範例再動手：`pages/BasePage.ts`、`pages/CsrPage.ts`、`steps/common.steps.ts`、`steps/csr.steps.ts`。

## 流程

1. 找出缺什麼：
   ```bash
   cd portal-e2e && npx bddgen
   ```
   輸出的 `Missing step definitions: N` 與底下的 snippet 就是待辦清單（snippet 已幫你把 `{string}`／`{int}`／`DataTable` 參數寫好）。若是 parse error，回頭用 gen-gherkin 修 feature。

2. 對每個涉及的頁面建 Page Object（沒有的話）：
   - 打開 `portal/src/main/resources/templates/<page>.html`，把輸入框、按鈕、結果區的 **id** 抄成 Locator（Portal 沒有 data-testid，別自己假設有）。
   - 提供動作方法（`query(...)`、`save(...)`）與結果讀取方法；ajax 查詢後一律 `await this.waitForResult(this.result)`（BasePage 提供，等「查詢中...」被換掉）。
   - 表格資料列用 `table.locator('tr').filter({ has: page.locator('td') })` 排除表頭列（backend 的 `html()` 表頭是第一個 `<tr>`，空結果是 `<tr></tr>`）。
   - 在 `fixtures.ts` 的 `Fixtures` 型別與 `test.extend` 各加一行。

3. 寫步驟定義：
   - 把 bddgen 的 snippet 貼到 `steps/<page>.steps.ts`，第一個參數解構需要的 fixtures（`{ reportPage }`），填入實作。
   - 同一句話只能有一個定義；先 `grep` 既有 steps 避免重複或 ambiguous。共用句型（登入、導覽、「應該顯示後端錯誤」）放 `common.steps.ts`。
   - 斷言一律用 `expect(locator).toHaveText / toContainText / toHaveCount / toBeVisible`（自帶等待），**不要** `waitForTimeout`。
   - DataTable：`table.hashes()` 拿表頭對應的物件陣列、`table.rowsHash()` 拿兩欄的 key/value；型別 `import { DataTable } from 'playwright-bdd'`。
   - backend 錯誤情境：Portal `relay()` 回純文字 `backend error: ...`，斷言 `toContainText('backend error')`。
   - 登入失敗停在 `/doLogin`（controller 直接 return view），URL 斷言用 `/\/(login|doLogin)$/`（common.steps.ts 已有）。

4. 反覆直到乾淨：
   ```bash
   npx bddgen && npx tsc --noEmit
   ```

5. 能跑就跑：先 `curl -s -o /dev/null -w "%{http_code}" http://localhost:8098/login`，回 200 代表 Portal 在跑，就執行
   ```bash
   npm test                    # 會自動起 Mockoon
   npx playwright test --grep @<page>   # 只跑剛加的
   ```
   Portal 沒在跑就停在這裡，告訴使用者用什麼指令啟動 Portal 後自己跑（README 有），不要假裝跑過。

6. 失敗時看 `test-results/**/error-context.md` 與 trace；**優先懷疑 selector 與 mock 觸發值對不上**，而不是改 feature 的句子。

## 慣例

- 檔名：`steps/<page>.steps.ts`、`pages/<Page>Page.ts`（PascalCase）。
- Locator 只出現在 `pages/`；steps 只呼叫 Page Object 的方法與 Locator 屬性。
- 不改 `portal/`、`backend/`、`mockoon/`；mock 對不上就回報，交給 gen-gherkin 調整。
- 不改 `.features-gen/`（bddgen 產物）。

## 完成回報

列出：新增／修改的檔案、每個 feature 現在幾個 scenario 有步驟、`bddgen` 與 `tsc` 結果、有沒有實際跑 `npm test` 與結果。提醒使用者這次結果就是 Spring Boot 升級前的基線，升級後要用同一套再跑一次。
