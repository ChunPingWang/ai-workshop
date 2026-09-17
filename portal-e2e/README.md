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
觸發值慣例（沿用即可）：`E000001`／`0912345678` 有資料、`E000002`／`0900000000` 查無資料、
`E500000`／`0950000000` 後端 500、`bankCode=999`／`content` 含 `FAIL` → `FAIL …`。

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
| `CHROMIUM_PATH` | 公司環境無法 `playwright install` 時指向既有 Chrome |

## 與 Spring Boot 升級的關係

這套測試的目的是替 Portal 升級 Spring Boot 4.x 當安全網：升級前跑一次全綠當基線，
升級後再跑一次，同一套 feature 通過就代表使用者看得到的行為沒變。
測試只依賴 Portal 對外的 HTML 與 ajax 路徑，不依賴任何 Spring 內部 API。
