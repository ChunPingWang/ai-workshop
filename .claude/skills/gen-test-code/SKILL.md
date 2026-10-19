---
name: gen-test-code
description: 把 portal-e2e/features 裡的 Gherkin 轉成可執行的 Playwright 測試碼（playwright-bdd 的 steps、Page Object、fixtures），並實際起 Portal + Mockoon 跑 `npx playwright test`，修到全綠才算完成。用在「補步驟定義」「把 feature 變成測試」「bddgen 說 Missing step definitions」「e2e 測試跑不過」。
---

# gen-test-code：Gherkin → 跑得過的 Playwright 測試碼

## 目標與完成定義

讓 `portal-e2e` 的每個 `.feature` 都有步驟定義與 Page Object，而且**實際對 Portal + Mockoon 執行全綠**。
`bddgen` 乾淨、`tsc` 通過只是中途檢查點，**不是**完成條件。完成條件是：

```bash
cd portal-e2e && npx bddgen && npx tsc --noEmit && npx playwright test   # 0 failed
```

而且連跑兩次都綠（排除時序不穩）。這次結果就是 Spring Boot 升級前的基線，紅的基線沒有意義。

## 第 0 步：先讀，再寫（跳過這步就是一次跑不過的主因）

依序讀完再動手，不要邊猜邊寫：

| 來源 | 看什麼 |
|---|---|
| `portal-e2e/README.md` 的「已知地雷」 | jsessionid、welcome page 繞過、tos 訊息被清空、500/非 JSON 時畫面不變——下面「Portal 地雷」一節是展開版 |
| `portal-e2e/pages/BasePage.ts`、`fixtures.ts` | 骨架只有這兩個；其餘 Page Object／steps 都要自己產生（**沒有**現成範例檔可抄） |
| `portal-e2e/features/*.feature` 全部 | 把所有句型整理成清單；找出跨頁共用的句型（輸入欄位、按按鈕、某區應該顯示…） |
| `portal-e2e/mockoon/routes/*.json` + `bodies/*` | 每個觸發值實際回什麼；feature 裡的期望文字、筆數、欄名要能在 body 裡找到 |
| `portal/src/main/resources/templates/<page>.html` | 每個元素的 id、預設值、`$.get/$.post` 的路徑、callback 怎麼改畫面（寫 `查詢中...`？清空 `#msg`？自動再查詢？） |
| `portal/.../PortalController.java` | 未登入時頁面 302 → `/login`、ajax 回 `please login`／`[]`；`relay()` 例外回 `backend error: ...`；登入失敗直接 return `login` view（網址停在 `/doLogin`） |

## 架構

```
features/<page>.feature      Gherkin（gen-gherkin 產的，不要為了方便測而改句子）
steps/common.steps.ts        跨頁共用句型（登入、開頁、輸入、按鈕、區域/表格斷言）
steps/<page>.steps.ts        只有該頁才有的句型
pages/<Page>Page.ts          extends BasePage；所有 selector 集中在這裡
pages/Portal.ts              跨頁協調者：依網址判斷目前頁面、登入、等 ajax、攔截請求
fixtures.ts                  portal + 每個 Page Object 一個 fixture；steps 從這裡 import { Given, When, Then }
```

### 建議的設計（減少步驟數、避免重複定義）

feature 裡大量句子是「我在 "商家代碼" 欄輸入 "E000001"」「我按下 "查詢"」「結果區應該顯示 "..."」這種**跨頁同句型**。
不要每頁各寫一份（會 ambiguous），而是：

1. 每個 Page Object 用對照表描述畫面，key 是 feature 裡使用者看得到的標籤：
   ```ts
   protected readonly fields  = { 商家代碼: '#merchantId', 外國銀行: '#foreign' };
   protected readonly buttons = { 註冊: { selector: '#btnSave', waitFor: /\/bankacc\/save/ } };
   protected readonly areas   = { 訊息區: '#msg', 帳戶清單區: '#list' };
   protected readonly tables  = { 帳戶清單: { selector: '#list table' } };
   ```
   BasePage 提供 `field(label)`／`button(label)`／`area(name)`／`table(name)`，查不到就 `throw new Error('XxxPage 沒有欄位「…」')`——錯誤訊息直接指出缺哪個對照。
2. `pages/Portal.ts` 持有所有 Page Object，`get current()` 依 `page.url()` 的 pathname（先去掉 `;jsessionid=...`）回傳目前頁面；共用步驟一律寫成 `portal.current.field(label)`。
3. fixtures：`portal: async ({ page, browser }, use) => use(new Portal(page, browser))`，各頁 fixture 回傳 `portal.xxx`（同一個實例）。

## Portal 地雷（每一條都曾讓測試第一次跑紅）

| # | 現象 | 正確寫法 |
|---|---|---|
| 1 | 全新瀏覽器第一次 redirect 網址是 `/login;jsessionid=XXXX` | 登入頁 URL 斷言用 `/\/(login\|doLogin)(;jsessionid=[^/?#]+)?$/`；判斷目前頁面前先 `.replace(/;jsessionid=.*$/i, '')` |
| 2 | 登入後落在 `/;jsessionid=...`，由 welcome page 直接 render `index`，**沒有 model**：導覽列帳號、角色是空的 | 登入步驟最後一律 `await expect(page).not.toHaveURL(/\/(login\|doLogin)/); await page.goto('/');` 用乾淨網址重開 |
| 3 | 登入失敗不 redirect，網址停在 `/doLogin` | 「仍在登入頁」斷言要接受 `/doLogin` |
| 4 | ajax 結果區先寫 `查詢中...` 再被覆蓋 | 按鈕要**先掛等待再點**：`await Promise.all([page.waitForResponse(r => /\/report\/data/.test(r.url())), btn.click()])`；之後再用 `expect(locator).toHaveText(...)` 斷言（自帶重試） |
| 5 | backend 500 或回非 JSON 時，tos／bankacc 的 `$.get` callback 不執行（JSON.parse 丟例外），畫面**完全不變** | 不能「等畫面變化」，只能等回應（同 #4）；斷言「畫面沒變」時要先確定回應已到 |
| 6 | tos 存檔成功會自動再查詢，重查 callback 把 `#msg` 清空，存檔訊息只閃一下 | 要看存檔訊息就用 `page.route(/\/tos\/data/, ...)` 只延遲**存檔之後**那次重查；要看最終狀態就等存檔後的 `/tos/data` 回應到達再斷言 |
| 7 | bankacc 註冊後會自動按「查詢已註冊帳戶」 | 斷言清單前等 `/bankacc/data` 回應；訊息區與清單區是兩個不同 callback 寫的 |
| 8 | 報表類 backend 表頭是第一個 `<tr>`（`<th>`），空結果是 `<tr></tr>` | 資料列一律 `table.locator('tr').filter({ has: page.locator('td') })`；`total rows: N` 是全部筆數，畫面最多 10 列 |
| 9 | 「尚未登入／登入失效」 | `page.context().clearCookies()`，不要去按登出（登出是另一個情境） |
| 10 | 「後端延遲／不回應」情境要先看到 `查詢中...` | 在 Given 裡 `page.route(DATA_ENDPOINT, ...)` 延遲或不 `continue()`；這時按鈕**不能**等回應（會 timeout），要有開關跳過 #4 的等待 |
| 11 | 日期欄預設今天 | 用 `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' })` 算，與 config 的 `timezoneId` 一致，不要用 `new Date().toISOString()`（UTC 會差一天） |
| 12 | 顏色、字級斷言 | `getComputedStyle` 回傳 `rgb(r, g, b)`／`12px`，期望值要先把 css 的 `#1f4e79` 換算成 rgb |

## playwright-bdd 步驟定義地雷

- **Cucumber Expression 的特殊字元**：步驟字串裡的 `(`…`)` 是「可省略文字」、`/` 是「二擇一」、`{`…`}` 是參數。feature 句子本身含這些字元時（例如固定文字 `查詢/新增服務條款`），要嘛用 `{string}` 參數吃掉、要嘛跳脫 `\\(`、`\\/`、要嘛改用 RegExp 定義。**用 `{string}` 傳進來的值**不受影響。
- 同一句只能匹配一個定義；寫 RegExp 一定加 `^…$`，否則會跟別的句子 ambiguous。寫之前先 `grep -rn "句子關鍵字" steps/`。
- 一組相似句型（`結果區／明細區／訊息區…應該顯示 "x"`）用一條 RegExp + 列舉群組，例如 `` new RegExp(`^(結果區|明細區|訊息區)應該顯示 "([^"]*)"$`) ``；RegExp 捕獲的數字是 string，要 `Number()`。
- DataTable：`table.hashes()`（有表頭）、`table.rowsHash()`（兩欄 key/value）、`table.raw()[0]`（單列清單）；`import { DataTable } from 'playwright-bdd'`。
- 第一個參數解構 fixtures（`{ portal, page }`），後面依序是步驟參數。`baseURL` 也可解構。

## 斷言規則

- 只用自帶重試的斷言：`expect(locator).toHaveText / toContainText / toHaveCount / toBeVisible / toHaveValue / toHaveURL`。
- 需要先讀值再算的（排序、某列某欄、表頭對應）用 `await expect(async () => { ... }).toPass({ timeout: 10_000 })` 或 `expect.poll(...)` 包起來；**不要** `const t = await locator.textContent(); expect(t)...`（沒有重試，ajax 還沒回來就判失敗）。
- 不要 `waitForTimeout` 當同步手段；唯一例外是「應該**持續**顯示 X」這種要觀察一段時間不變的斷言。
- 斷言 `toHaveCount(0)`／`not.toContainText` 這種「不存在」時，先斷言一個「存在」的東西（表頭、容器可見）證明畫面已渲染，不然空頁面也會誤判通過。
- 期望值從 feature 來，不要自己改寫；文字比對預設 `toContainText`，feature 明說「只有／完全是」才用 `toHaveText`。

## 流程

1. **盤點缺口**
   ```bash
   cd portal-e2e && npx bddgen 2>&1 | tail -50
   ```
   `Missing step definitions: N` 與 snippet 就是待辦清單。parse error → 回頭用 gen-gherkin 修 feature。
   用 `grep -rhoE '^\s*(Given|When|Then|And|But) .*' features/ | sed -E 's/^\s*\w+ //' | sort | uniq -c | sort -rn` 看出高頻句型，先寫共用步驟。

2. **Page Object + Portal + fixtures**（見上方「建議的設計」）。selector 一律從 template 的 id 抄，Portal 沒有 `data-testid`。

3. **步驟定義**：先 common，再各頁特有。每寫完一批跑一次 `npx bddgen && npx tsc --noEmit`，直到 0 missing、0 error。

4. **起環境**（自己起，不要停下來叫使用者起）：
   ```bash
   # 8099 不能是真 backend（Playwright 會沿用已在聽的服務、不起 Mockoon，資料就全錯）
   lsof -nP -iTCP:8099 -sTCP:LISTEN     # 有東西且不是 mockoon → 告訴使用者並停下，不要自己 kill
   # Portal：已在跑就沿用；沒有就用 JDK 8 在背景起
   curl -s -o /dev/null -w "%{http_code}" http://localhost:8098/login
   ls ~/.sdkman/candidates/java | grep '^8\.'      # 找實際裝的 JDK 8，README 寫的版本號不一定存在
   JAVA_HOME=~/.sdkman/candidates/java/<8.x> mvn -q -f ../portal/pom.xml spring-boot:run   # run_in_background
   ```
   輪詢到 `/login` 回 200 再往下（首次編譯可能要 1～2 分鐘）。真的起不來（沒有 JDK 8、mvn 失敗）才回報使用者，附上錯誤訊息。

5. **逐 feature 跑、修到綠**
   ```bash
   npx playwright test --grep @<page> --reporter=line
   ```
   一次一個 feature，比整套跑快得多。失敗時讀 `test-results/<test>/error-context.md`（含失敗當下的頁面 ARIA snapshot），依序判斷：
   1. **selector／標籤對照錯**（`沒有欄位「…」`、locator 找不到）→ 修 Page Object。
   2. **時序**（ajax 還沒回就斷言、等了不會來的回應而 timeout）→ 對照「Portal 地雷」#4～#7、#10 修。
   3. **期望值對不上**：對照 mock body 與 template 確認 Portal 實際會顯示什麼。
      - 測試碼解讀錯了（欄位對錯、取錯表格）→ 修測試碼。
      - feature 的期望值與 mock／Portal 實際行為真的不符 → **不要**偷改 feature 或放寬斷言讓它過；記下來回報（屬於 gen-gherkin 的問題），並在該 scenario 加 `@fixme` tag 隔離，讓其餘基線保持綠。
   不准用來「讓它過」的手段：拉長全域 timeout、加 `waitForTimeout`、`test.skip`、把 `toHaveText` 改成 `toContainText('')`、斷言改成永遠成立。

6. **整套跑兩次**
   ```bash
   npx playwright test --reporter=line && npx playwright test --reporter=line
   ```
   兩次都 0 failed（`@fixme` 以外）才算完成。第二次才失敗的就是時序不穩，回第 5 步修。

## 慣例

- 檔名：`steps/<page>.steps.ts`、`pages/<Page>Page.ts`（PascalCase）。
- Locator 只出現在 `pages/`；steps 只呼叫 Page Object／Portal 的方法與 Locator 屬性。
- 不改 `portal/`、`backend/`、`mockoon/`、`features/` 的句子；對不上就回報，交給 gen-gherkin。
- 不改 `.features-gen/`（bddgen 產物）、`mockoon/newpay-backend.json`（build 產物）。
- 測試結束後若 Portal 是你在背景起的，跑完保持執行或關掉都要在回報裡說明。

## 完成回報

列出：
- 新增／修改的檔案；每個 feature 的 scenario 數。
- `bddgen`、`tsc` 結果，以及**兩次** `npx playwright test` 的 passed／failed／skipped 數字（照實貼，不要只說「全綠」）。
- 標了 `@fixme` 的 scenario 與原因（feature 期望 vs Portal 實際），建議回 `/gen-gherkin` 修。
- 提醒：這次結果就是 Spring Boot 升級前的基線，升級後用同一套再跑一次。
