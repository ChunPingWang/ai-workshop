# portal-e2e — new-pay Portal 的 BDD 端對端測試（骨架）

Playwright + [playwright-bdd](https://vitalets.github.io/playwright-bdd/) + TypeScript，
後端以 [Mockoon](https://mockoon.com/) 假資料取代，讓 Portal 的每個畫面情境都可重現、不依賴 H2 裡有什麼資料。

```
Playwright ──► Portal (8098, Spring Boot + Thymeleaf + jQuery) ──► Mockoon 假後端 (8099)
                 ▲ 你自己啟動（或 START_PORTAL=1 交給 Playwright）      ▲ Playwright 自動啟動
```

Portal 的 `PortalController.BACKEND` 寫死打 `http://localhost:8099`，所以 Mockoon 只要聽在 8099，Portal 一行都不用改。

> `features/`、`features/COVERAGE.md` 與 `mockoon/routes/`、`mockoon/bodies/` 由 `/gen-gherkin` 依 User Story 產生。
> `steps/` 與 `pages/` 的可執行測試碼由 `/gen-test-code` 接續產生；目前 feature 的 step definitions 尚未補齊。

## 快速開始

```bash
# 終端機 1：啟動 Portal（JDK 17+；backend 仍使用 JDK 8）
cd ../portal
JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn spring-boot:run

# 終端機 2：跑測試（第一次要 npm install + 下載瀏覽器）
cd portal-e2e
npm install
npx playwright install chromium
npm test            # = bddgen && playwright test；會自動起 Mockoon 在 8099
npm run report      # 開 HTML 報告（每個 test 都有 trace / screenshot / video）
```

> 跑測試前請**先關掉真的 backend**（它也用 8099），否則 Playwright 看到 8099 已有服務會直接沿用、不會起 Mockoon，情境資料就對不上。

## 目錄

```
portal-e2e/
├── features/            ← Gherkin（Given/When/Then 英文關鍵字 + 中文句子）／gen-gherkin 產生
├── steps/               ← 步驟定義／gen-test-code 產生
├── pages/               ← Page Object（Portal 沒有 data-testid，selector 用 id）
│   └── BasePage.ts          導覽列、waitForResult()（骨架，其餘由 gen-test-code 產生）
├── fixtures.ts          ← Page Object fixtures；新增頁面在這裡註冊
├── mockoon/
│   ├── routes/*.json        ★ 每個 backend 端點的情境（人／AI 可讀的簡化格式）／gen-gherkin 產生
│   ├── bodies/*             ★ 回應內容（HTML 表格與真後端 ReportController.html() 同格式、JSON）
│   ├── build.js             routes + bodies → newpay-backend.json
│   ├── check.js             對跑起來的 Mockoon 逐情境驗證
│   └── newpay-backend.json  build 產物（gitignore，勿手改）
├── playwright.config.ts
└── .features-gen/       ← bddgen 產物，勿手改、不進版控
```

## Mockoon 情境設計

每個 backend 端點一個 route，route 底下多個 response，用 **rule 依請求參數分流**，
沒命中任何 rule 就回 `default`。這樣所有情境同時存在、測試之間不用切換 mock 狀態。

| 端點 | 觸發值 | 情境 |
|---|---|---|
| `GET /sa/report/trans` | 不帶 merchantId / `E000001` / `E000002` / `E500000` / `E404000` / `E000SQL` / 單引號 | 全商家資料 / 3 筆 / 0 筆 / 500 / 404 / query error |
| `GET /sa/report/trans` | `E010000` / `E011000` / `E000BLD` / `timeType=auth` | 10 列 / 10 列但 total rows 11 / 未轉義 `<b>` / 授權時間結果 |
| `GET /sa/report/trans` | from/to=`2026091800`～`2026091823` / 起日反向 / from=`BADDATE00` / from=`00` | 最後一秒邊界 / 0 筆 / 格式錯誤仍送出 / 日期空白仍送出 |
| `GET /sa/report/refund` | 起日=`20990101` / `20999999` / `20880101` / `20880201` | 0 筆 / 500 / 404 / query error（其他：兩筆退款） |
| `GET /sa/report/reconDaily` | from=`20990101` / `20999999` / `20999888` | 0 筆 / 500 / 404（其他：R20260915 一致、R20260916 有差異） |
| `GET /sa/report/reconMonthly` | from=`20990101` / `20999999` | 0 筆 / 500（其他：M202608 一筆） |
| `GET /sa/report/reconDailyDetail` | reconId=`R20260916` / `R20260915` / `M202608` / `R5000000` / `R4040000` | 金額差異 / 0 筆 / 月批次 0 筆 / 500 / 404 |
| `GET /sa/tos/query` | merchantID=`E000001` / `E000003` / `E000002` / `E500000` / `E999JSON` | v2 兩版次 / 含換行 v1 / `[]` / 500 / 非 JSON |
| `POST /sa/tos/save` | merchantID=`E000002`；content 含 `FAIL`／單引號／空值；超長 merchantID；15 碼 startDate | version=1 / version=3 / FAIL 欄位長度、SQL 或 NULL |
| `GET /getToS.jsp` | merchantID=`E000001` + version=`1`/`2`；`E000002`；不帶 merchantID/version | 指定版本 / 最新版本 / `NO ToS` / 全域預設條款 |
| `GET /cp/bankacc/list` | merchantId=`E000001` / `E000002` / `E500000` / `E404000` / `E999JSON` | 兩筆帳戶 / `[]` / 500 / 404 / 非 JSON |
| `POST /cp/bankacc/save` | bankCode=`999` / `777`(+USD,N) / `776`(+NTD,Y) / 空值 | FAIL 長度 / FOREIGN-USD / DOMESTIC-NTD / FAIL NULL |
| `GET /csr/trans` | msisdn=`0900000000` / `0950000000` / `0910000010` / `0900000001` / `BADNUMBER` / 空值 / `090000000` | 零筆 / 500 / 11 筆但回傳 10 列 / query error / 格式錯誤空結果（預設：2 筆交易＋1 筆退款） |

改 `mockoon/routes/*.json` 或 `bodies/` 後：

```bash
npm run mock:build     # 重新產生 newpay-backend.json（npm test 會自動做）
npm run mock:start     # 手動起 Mockoon 看看
npm run mock:check     # 另開終端機，逐情境打一輪確認 rule 對
```

## 已知地雷（寫測試前先讀）

- **jsessionid**：全新瀏覽器第一個 redirect 會被 Tomcat 編碼成 `/login;jsessionid=XXXX`，
  斷言登入頁 URL 請用 `/\/(login|doLogin)(;jsessionid=[^/?#]+)?$/`。
- **welcome page 繞過**：`/;jsessionid=任意值` 比對不到 `@GetMapping("/")`（Spring Boot 2.6+ 的
  PathPatternParser），會由 welcome page 直接 render `index` 模板——沒登入檢查、沒 model，
  導覽列帳號/角色是空的。登入後第一頁就是這個 URL，斷言導覽列前先用乾淨 URL 重開一次。
- **tos 存檔訊息**：存檔成功後會自動重查，重查 callback 會把 `#msg` 清空，訊息只短暫顯示；
  要斷言存檔訊息需延遲一次 `/tos/data` 回應（`page.route`）。
- 後端 500 或回非 JSON 時，tos／bankacc 的 `$.get` callback 不會執行、畫面無變化——
  查詢動作請用 `waitForResponse` 等回應到達，不能等畫面變化。

## 常用指令

```bash
npm test                                 # 全部
npx playwright test --grep @smoke        # 只跑 smoke
npm run test:ui                          # UI mode 逐步看
npm run typecheck                        # tsc --noEmit
```

## 環境變數

| 變數 | 用途 |
|---|---|
| `BASE_URL` | Portal 位置，預設 `http://localhost:8098` |
| `START_PORTAL=1` | 由 Playwright 執行 `mvn -f ../portal/pom.xml spring-boot:run`（需 JAVA_HOME 正確） |
| `NO_MOCK=1` | 不啟動 Mockoon，例如要對真 backend 跑 |
| `MOCK_PORT` | Mockoon 埠號，預設 8099（改了 Portal 也要改 BACKEND） |
| `BROWSER_CHANNEL` | 用系統已安裝的瀏覽器跑：`msedge` 或 `chrome`（無法安裝 Playwright Chromium 時用；主版號需 ≥ 本版 Playwright 綁定的 Chromium） |
| `CHROMIUM_PATH` | 同上的後備方案：直接指向瀏覽器執行檔完整路徑 |

## 與 Spring Boot 升級的關係

這套測試的目的是替 Portal 升級 Spring Boot 4.x 當安全網：升級前跑一次全綠當基線，
升級後再跑一次，同一套 feature 通過就代表使用者看得到的行為沒變。
測試只依賴 Portal 對外的 HTML 與 ajax 路徑，不依賴任何 Spring 內部 API。
