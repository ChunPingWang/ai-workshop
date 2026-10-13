# portal-e2e — new-pay Portal 的 BDD 端對端測試（骨架）

Playwright + [playwright-bdd](https://vitalets.github.io/playwright-bdd/) + TypeScript，
後端以 [Mockoon](https://mockoon.com/) 假資料取代，讓 Portal 的每個畫面情境都可重現、不依賴 H2 裡有什麼資料。

```
Playwright ──► Portal (8098, Spring Boot + Thymeleaf + jQuery) ──► Mockoon 假後端 (8099)
                 ▲ 你自己啟動（或 START_PORTAL=1 交給 Playwright）      ▲ Playwright 自動啟動
```

Portal 的 `PortalController.BACKEND` 寫死打 `http://localhost:8099`，所以 Mockoon 只要聽在 8099，Portal 一行都不用改。

> 這個目錄目前只入版控**骨架**（設定檔、mockoon build/check 腳本、BasePage、fixtures 殼）。
> `features/`、`steps/`、`pages/` 的內容與 `mockoon/routes/`、`mockoon/bodies/` 由
> `/gen-gherkin` 與 `/gen-test-code` 兩個 skill 產生（見 `.claude/skills/`）。

## 快速開始

```bash
# 終端機 1：啟動 Portal（升級前 JDK 8；升級 Spring Boot 4 之後改 JDK 17+）
cd ../portal
JAVA_HOME=~/.sdkman/candidates/java/8.0.482-zulu mvn spring-boot:run

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
| `GET /sa/report/trans` | merchantId=`E000002`/`e000001`/`E500000`/`E404000`/含 `'` | 0 筆 / 0 筆（大小寫不符） / 500 / 404 / query error |
| `GET /sa/report/trans` | merchantId=`E010000`/`E011000`/`E000BLD`/未帶 | 剛好 10 筆 / 11 筆(畫面 10 列) / 含 `<b>` 標記 / 含 E000009 的全部商家 4 筆 |
| `GET /sa/report/trans` | from=`00`且to=`23`；from 9 碼；from `20260917…`且to `20260916…` | 全部日期 3 筆 / 0 筆 / 0 筆（起日晚於迄日） |
| `GET /sa/report/trans` | timeType=`auth`；from=`2026091600`且to=`2026091623` | 授權時間報表 2 筆 / 含 23:59:59 的整日區間 2 筆（其他：3 筆） |
| `GET /sa/report/refund` | from 以 `2099`/`2095` 開頭；以 `20260601` 開頭且未帶 merchantId、timeType | 0 筆 / 500 / 參數檢查 `TXCHECKOK`（其他：2 筆） |
| `GET /sa/report/reconDaily` | from=`20990101`/`20999999`/含非數字/`20250101` | 0 筆 / 500 / 0 筆 / 12 筆(畫面 10 列)（其他：R20260915 一致、R20260916 有差異） |
| `GET /sa/report/reconMonthly` | from=`20990101` | 0 筆（其他：M202608 一筆） |
| `GET /sa/report/reconDailyDetail` | reconId=`R20260916`/`R20260917`/`R99999999` | 1 筆差異 104 / 9 種差異代碼 / 500（其他：0 筆） |
| `GET /sa/tos/query` | merchantID=`E000001`/`E000003`/`E500000`/`E999JSON`/含 `'` | v2 兩版次 / 含換行與 `<b>` 的 v1 / 500 / 非 JSON / 500（其他：`[]`） |
| `POST /sa/tos/save` | merchantID=`E500000`/`E000001`；startDate 或 content 空；content 含 `'`；startDate >14 碼或 merchantID >10 碼 | 500 / `OK version=3` / `FAIL NULL not allowed` / `FAIL Syntax error` / `FAIL Value too long`（其他：`OK version=1`） |
| `GET /cp/bankacc/list` | merchantId=`E000001`/`E000012`/`E000077`/`E500000` | 2 筆帳戶 / 12 筆 / 註冊後的新帳戶 W / 500（其他：`[]`） |
| `POST /cp/bankacc/save` | bankCode 或 bankAcc 空；bankCode >3 碼或 bankAcc >16 碼；`777`+USD+N；`776`+NTD+Y；merchantId=`E500000` | `FAIL NULL not allowed` / `FAIL Value too long` / `OK FOREIGN-USD` / `OK DOMESTIC-NTD` / 500（其他：`OK`） |
| `GET /csr/trans` | msisdn=`0900000000`/`0950000000`/`0910000010`/`0922222222`/含 `'`/非 10 碼數字 | 0 筆 / 500 / 11 筆(畫面 10 列) / 有交易無退款 / query error / 0 筆（其他：2 筆交易＋1 筆退款） |

回應依 route 內的順序比對，第一個命中的生效；覆蓋矩陣見 `features/COVERAGE.md`。

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
