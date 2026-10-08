---
name: gen-gherkin
description: 以 docs/user-stories.md 的 User Story／驗收條件為骨架，對照 portal 的 Thymeleaf 頁面、PortalController、backend controller 與 SRS，為 new-pay Portal 窮舉 BDD 測試情境並產生 Gherkin feature 到 portal-e2e/features，同時把每個情境需要的 backend 回應寫進 portal-e2e/mockoon（Mockoon 假後端）。用在「幫 portal 寫 e2e 情境」「產生 feature 檔」「補 Mockoon 情境」「列出所有測試案例」「把 User Story 變成測試情境」。
---

# gen-gherkin：從 User Story 與原始碼窮舉 Gherkin + Mockoon 情境

## 目標

前置：`docs/user-stories.md` 必須已存在（由 `/gen-user-story` 產生）；沒有就先請使用者跑那一步。

兩個輸入的分工：**User Story 決定「要測什麼」**（US／AC 是覆蓋的骨架與追溯的鍵），**原始碼決定「怎麼測＋現況實際長怎樣」**（selector、預設值、回應格式、以及 SRS/US 標了「現況如此」的技術債行為）。對 `portal/` 的每一個功能頁面，**盡可能把測試情境列到最多**，產出：

1. `portal-e2e/features/COVERAGE.md` —— 覆蓋矩陣：每個頁面 × 每個枚舉維度 列出了哪些情境、對應哪個 scenario
2. `portal-e2e/features/<page>.feature` —— 使用者看得懂的行為規格（Given/When/Then 英文關鍵字、中文句子）
3. `portal-e2e/mockoon/routes/<page>.json` + `mockoon/bodies/*` —— 該頁面打到的 backend 端點，每個情境一個 response，用 rule 依請求參數分流

只產 feature 與 mock，**不寫 steps／Page Object**，那是 `gen-test-code` 的工作。

## 心態：先窮舉，再刪減

這個 skill 的評量標準是「有沒有漏」，不是「精不精簡」。做法是：

1. 先用下面的 **枚舉維度** 對每個頁面機械式地掃一遍，每掃到一個可觀察的行為就記一條，不要在這個階段判斷「值不值得測」。
2. 掃完對照 `docs/user-stories.md`：**每個 US 的每一條驗收條件（AC）至少要有一個 scenario**，AC 括號內的 SRS 條文編號（P-xxx-nn）就是情境的依據；AC 是下限不是上限，程式碼裡看到 AC 沒寫的可觀察行為要再加（並在回報裡列出，供回饋給 US／SRS）。
3. 最後才合併：多個情境只差資料值的，合併成一個 `Scenario Outline` + `Examples`（每一列仍算一個情境）；行為路徑不同的**不要**合併。
4. user-stories.md 標「未實作」的 US 與 SRS 第 8 章範圍外事項（CSV 匯出、Finance 審核…），也要列進 COVERAGE.md 標記為「未實作／不測」，讓讀的人知道是刻意略過而不是漏掉。

## 枚舉維度（每個頁面都要逐項掃）

| 維度 | 掃什麼 | 產生什麼情境 |
|---|---|---|
| **A. 進入頁面** | 直接開 URL、從首頁選單點進、從導覽列點進、未登入開、不同角色開 | 未登入導回登入頁；各角色皆可進入（選單目前不分角色，這本身就是要被固定下來的行為）；頁面標題／說明文字正確 |
| **B. 初始狀態** | 每個 input 的預設值、select 預設選項、hidden 欄位、預設隱藏的區塊、結果區的提示文字 | 預設商家 E000001、日期預設今天、toHour 預設 23、`#form` 隱藏、`#result` 顯示「請輸入條件查詢」 |
| **C. 每個輸入欄位** | 空值、預設值、正常值、格式錯誤（長度、非數字）、邊界值、前後空白、特殊字元 | 注意 Portal **幾乎沒有前端驗證**：空值會原樣送到 backend。這種「沒有驗證」也是要固定下來的行為，情境寫成「輸入空門號查詢時仍會送出查詢並顯示 backend 回應」 |
| **D. 每個按鈕／動作** | 點一次、連點兩次、在結果出現前再點、按 Enter（表單頁）、reset | 「查詢中...」中間狀態；重複查詢結果被覆蓋；再次查詢前次結果消失 |
| **E. 每個 backend 回應** | 有資料（1 筆、多筆、剛好 10 筆、超過 10 筆）、0 筆、HTTP 500、HTTP 404、非預期格式（HTML 而非 JSON）、`FAIL …` 文字、`OK …` 文字 | 表格筆數、`total rows: N` 與畫面列數不同（>10 時）、`backend error:` 文字、JSON.parse 失敗時畫面無反應（這是 bug，但升級前後要一致） |
| **F. 頁面內狀態機** | 頁面有多步驟或條件顯示時，列出每個狀態與每條轉移 | tos：尚無條款→存檔→重查；已有條款→建立新版次→存檔；report：type=trans／refund 決定標題與欄位顯示 |
| **G. 資料呈現** | 表頭欄名、每格內容、排序、格式（日期 14 碼、金額）、HTML 是否被 escape | 欄名跟 backend SQL 一致；bankacc 的 IS_DOMESTIC 顯示成「國內／國外」 |
| **H. 導覽與 session** | 每條導覽列連結、登出後再按上一頁、登出後打 ajax、換角色重登 | ajax 在未登入時回 `please login` 或 `[]` 而非導轉 |
| **I. 跨頁流程** | 從 A 頁做完到 B 頁看結果 | 首頁選單 → 功能頁 → 查詢 → 回首頁再進另一頁 |
| **J. US／AC 對照** | user-stories.md 裡該頁面相關 US 的每一條 AC | 每條 AC 至少一個 scenario；AC 標「（現況如此）」的對應 `@legacy`；US 標「未實作」的列「未實作／不測」 |

每個頁面掃完，把結果填進 COVERAGE.md 的表格，再開始寫 feature。

## 讀哪些東西（依序）

| 來源 | 看什麼 |
|---|---|
| `docs/user-stories.md` | 每個 US 的驗收條件（覆蓋下限）、涵蓋條文編號（追溯用）、實作狀態（未實作→不測）、「（現況如此）」標記（→ `@legacy`） |
| `docs/new-pay_Portal_SRS.md` | AC 不夠細時查條文原文；各頁「畫面元素」表與附錄 A（元素 id 與預設值）、「後端介面」節（回應格式與參數）、第 6 章（欄位與代碼表，mock body 的欄名依據） |
| `portal-e2e/features/*.feature`、`COVERAGE.md` | 已有哪些，避免重複；沿用既有句型 |
| `portal-e2e/steps/*.ts` | 已有的步驟句型（`grep -h "^(Given\|When\|Then)(" portal-e2e/steps/*.ts`），能沿用就沿用 |
| `portal-e2e/mockoon/routes/*.json` | 已有哪些端點與觸發值，避免撞值 |
| `portal/src/main/resources/templates/<page>.html` | 每個 input 的 id／預設值、按鈕、結果區；`$.get/$.post` 的路徑與參數；成功後怎麼渲染；有沒有前端驗證（多半沒有） |
| `portal/src/main/java/.../PortalController.java` | Portal 路徑 → backend 路徑；未登入時頁面 redirect、ajax 回 `"please login"` 或 `"[]"`；`relay()` 例外回 `"backend error: ..."`；POST 例外回 `"FAIL ..."` |
| `backend/src/main/java/com/telco/mwp/servlet/ReportController.java`、`ToSController.java` | 回應格式：報表類 `<table border=1 cellspacing=0>…</table><p>total rows: N</p>`（最多 10 列但 total rows 是全部）；CSR 兩張表以 `<hr/>Refunds:` 相接；tos/bankacc query 是 JSON 陣列；save 回 `OK …` / `FAIL …` |

不要讀 `new-pay_OnlineStore_FSD.md`（已被 SRS 取代）。`references/scenario-catalog.md` 是講師評量用的對照答案，**產生時不要讀**——覆蓋下限以 user-stories.md 的 AC 為準。

## 產出規則

### COVERAGE.md

```markdown
## report（交易報表，US-RPT-01〜03／SRS 4.3）
| 維度 | US/AC | 情境 | Scenario | Mock 觸發 |
|---|---|---|---|---|
| A 進入 | US-COM-01 AC1 | 未登入開 /report → 導回登入頁 | report.feature: 未登入… | — |
| B 初始 | US-RPT-01 AC1 | fromHour 預設 00、toHour 預設 23 | report.feature: 初始狀態 | — |
| E 回應 | US-RPT-02 AC5 | merchantId=E000001 → 3 筆 | report.feature: 查詢有資料 | routes/report.json [有資料] |
| J US | US-RPT-02 AC3 之外 | 程式有但 AC 沒寫的行為（補列） | report.feature: … | — |
| J US | 範圍外（SRS 第 8 章） | 匯出 CSV | 未實作，不測 | — |
```

最後附一行統計：幾個頁面、幾個 scenario（Outline 的每列各算一個）、幾個標記未實作。

### Feature 檔

- 檔名 `<page>.feature`，對應 template 名稱。`login.feature`、`csr.feature` 已存在，當範本；要補情境就直接加在裡面。
- 第一行 tag `@<page>`；主要成功路徑加 `@smoke`；靠 Mockoon 特殊觸發值的加 `@mock`；固定「現況即使是 bug」的加 `@legacy` 並用 `#` 註解說明（US 的 AC 標「（現況如此）」的就是 `@legacy` 候選）。
- `Feature:` 底下三行「身為…／我想要…／以便…」直接沿用對應 US 的三段句，括號註明 US 編號與 SRS 章節，例：`Feature: 交易報表查詢 (US-RPT-01〜03, SRS 4.3)`。
- `Background:` 放登入與進入頁面：`Given 我以 "sa" 身分登入 Portal`（帳號即角色：sa／cp／csr，依 US 的「身為」角色）+ `And 我在<頁面名稱>頁`。角色相關的情境（其他角色也能進）另外寫在 Background 之外。
- 資料值不同、路徑相同 → `Scenario Outline` + `Examples`；表格內容驗證用 DataTable（`Then 結果表格應該包含以下資料:` + 表頭列）。
- 句子寫「使用者做什麼／看到什麼」，不寫 selector、不寫 backend 路徑。錯的：`When 我 GET /report/data`；對的：`When 我按下查詢`。
- 斷言要**可從畫面觀察**：表格筆數、某格文字、`total rows: N`、訊息文字、區塊顯示／隱藏、欄位值。不要斷言時間戳或今天日期（report 頁預設帶今天，mock 不看日期就好）。
- 每個 scenario 都要能獨立重跑：Mockoon 無狀態，「存檔後重查」要靠 rule 設計（存檔回 `OK version=3`、重查仍回 v2，就只斷言訊息），在 feature 用 `#` 註解說明。

### Mockoon 情境

- 一個 backend 端點一個 route，放在對應頁面的 `routes/<page>.json`；格式見 `mockoon/build.js` 檔頭註解。
- 每個 route **恰好一個** `default: true`（正常有資料）；其他情境用 rule 分流，觸發值要**一眼看得出是測試值**且互不衝突，沿用既有慣例：查無資料 `E000002`／`0900000000`／`from=20990101`，後端 500 `E500000`／`0950000000`，後端 FAIL `bankCode=999`、`content` 含 `FAIL`。新維度自訂觸發值時同樣用「明顯假」的值（`E404000` → 404、`E010000` → 剛好 10 筆、`E011000` → 11 筆但畫面 10 列、`E999JSON` → 回非 JSON）。
- GET 參數 `"target": "query"`；`$.post` 的 form 欄位 `"target": "body"`。
- 回應內容放 `bodies/`，HTML 表格照真後端格式：`<table border=1 cellspacing=0><tr><th>欄名</th>…</tr><tr><td>…</td></tr></table><p>total rows: N</p>`，欄名用 backend SQL 的實際欄位。空結果 `<tr></tr>` + `total rows: 0`（已有 `report-empty.html`）。
- feature 裡的觸發值必須跟 route 的 rule 完全一致；feature 用 `#` 註解標明「backend 回應見 mockoon/routes/<page>.json」。
- 更新 `portal-e2e/README.md` 的 Mockoon 情境表。

## 流程

1. 盤點：列出 templates 底下每個頁面 → Portal 路徑 → backend 端點 → 對應的 US（user-stories.md）→ 回應格式，整理成表給使用者看。沒有對應 US 的頁面、或沒有對應頁面的 US，都要在這一步指出來。
2. 對每個頁面用十個維度掃一遍，寫 `COVERAGE.md`。**先給使用者看統計數字**（幾個情境、AC 覆蓋了幾條），再進下一步；使用者若覺得少，回頭再掃。
3. 寫 feature；同時補 `routes/<page>.json` 與 `bodies/`。
4. 驗證 mock：
   ```bash
   cd portal-e2e
   npm run mock:build                 # 規格有錯會在這裡失敗
   npm run mock:start &               # 起在 8099
   npm run mock:check                 # 逐情境打一輪，全部 ✓
   ```
5. 驗證 Gherkin：`npx bddgen`。**預期出現 `Missing step definitions`**，這是正常的；parse error 才要修。
6. 回報：COVERAGE.md 的統計、**AC 覆蓋率（每個 US 的每條 AC 是否都有 scenario，沒有的列出原因）**、每個 feature 幾個 scenario、哪些標記未實作、程式有但 AC 沒寫的行為清單（回饋給 US／SRS）、`bddgen` 缺幾個步驟。建議接著執行 `/gen-test-code`。

## 不要做

- 不要改 `portal/` 或 `backend/`（連加 `data-testid` 都不要）。
- 不要改 `docs/user-stories.md` 或 SRS——發現 AC 寫錯或漏寫，回報給使用者，由 `/gen-user-story` 那一層修。
- 不要讀 `new-pay_OnlineStore_FSD.md` 與 `references/scenario-catalog.md`（前者已由 SRS 取代、後者是講師評量用）。
- 不要寫 steps／pages／fixtures。
- 不要手改 `mockoon/newpay-backend.json`。
- 不要因為「這個行為看起來是 bug」就不列；升級前後要一致的正是這些行為，用 `@legacy` 標記即可。
