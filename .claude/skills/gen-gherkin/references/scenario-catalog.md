# new-pay Portal 情境目錄（gen-gherkin 的下限）

依 `portal/src/main/resources/templates/*.html`、`PortalController.java`、backend `ReportController.java`／`ToSController.java` 逐行整理。
每一條都是畫面上可觀察的行為。標 **[legacy]** 的是現況（含疑似 bug），升級前後必須一致，feature 加 `@legacy`。
標 **[未實作]** 的列進 COVERAGE.md 但不寫 scenario。

觸發值慣例（Mockoon rule）：`E000001`／`0912345678` 預設有資料；`E000002`／`0900000000` 查無資料；`E500000`／`0950000000` HTTP 500；
`E404000` HTTP 404；`E010000` 剛好 10 筆；`E011000` 11 筆（畫面 10 列、total rows 11）；`E999JSON` 回非 JSON；`bankCode=999`、`content` 含 `FAIL` → `FAIL …`。

---

## 0. 共通（每個功能頁都套一次）

| # | 情境 | 維度 |
|---|---|---|
| C-1 | 未登入直接開 `/report`、`/recon`、`/tos`、`/bankacc`、`/csr`、`/` → 302 到 `/login` | A |
| C-2 | 未登入直接打 ajax `/report/data`、`/recon/data`、`/recon/detail`、`/csr/data`、`/tos/save`、`/bankacc/save` → 純文字 `please login`（不是導轉） **[legacy]** | H |
| C-3 | 未登入直接打 `/tos/data`、`/bankacc/data` → `[]` **[legacy]**（跟 C-2 回法不同） | H |
| C-4 | sa／cp／csr 三種角色都能開每一個功能頁（選單與頁面都不依角色過濾） **[legacy]** | A |
| C-5 | 導覽列 8 個連結（首頁／交易報表／退款報表／對帳查詢／服務條款／銀行帳戶／CSR查詢／登出）各自導到正確頁 | H |
| C-6 | 導覽列顯示登入者帳號；首頁多顯示 `(角色)` | G |
| C-7 | 登出後按瀏覽器上一頁再操作 ajax → `please login` | H |
| C-8 | 登出後 session 失效，重開 `/` 回登入頁 | H |
| C-9 | 每個查詢按鈕按下後結果區先顯示「查詢中...」再被回應覆蓋 | D |
| C-10 | 連續查詢兩次，第二次結果覆蓋第一次（不是累加） | D |
| C-11 | backend 回 500 → 結果區顯示 `backend error: 500 …` | E |
| C-12 | backend 回 404 → 結果區顯示 `backend error: 404 …` | E |
| C-13 | 回應 HTML 含 `<script>` 或 `<b>` → 被當 HTML 插入（`$('#result').html(data)`，無 escape） **[legacy]**（用 `<b>` 驗證即可，不要真的注入 script） | G |

## 1. login（`/login`、`/doLogin`、`/logout`）

| # | 情境 | 維度 |
|---|---|---|
| L-1 | 開 `/login`：標題「登入」、帳號欄位自動 focus、提示文字列出三組測試帳號 | B |
| L-2 | sa/sa、cp/cp、csr/csr 各自登入成功 → `/` 功能選單 | Outline |
| L-3 | 帳號正確密碼錯 → 停在 `/doLogin`，顯示「帳號或密碼錯誤」，帳號欄位被清空 **[legacy]**（頁面重新 render） | C |
| L-4 | 帳號不存在 → 同 L-3 | C |
| L-5 | 帳號空／密碼空／兩者皆空 → 同 L-3（無前端 required） **[legacy]** | C |
| L-6 | 帳號大小寫不同（`SA`）→ 失敗（Map 比對區分大小寫） | C |
| L-7 | 帳號前後空白（` sa `）→ 失敗（沒 trim） **[legacy]** | C |
| L-8 | 在密碼欄按 Enter 送出 = 按「登入」 | D |
| L-9 | 已登入狀態再開 `/login` → 仍顯示登入表單（沒有導回首頁） **[legacy]** | A |
| L-10 | 已登入再用另一組帳號登入 → session 被覆蓋，導覽列顯示新帳號 | H |
| L-11 | 登出 → `/login`；導覽列不再顯示帳號 | H |
| L-12 | 用 GET 打 `/doLogin` → 405（不是登入頁） **[legacy]** | H |

## 2. index（`/` 功能選單）

| # | 情境 | 維度 |
|---|---|---|
| I-1 | 三個區塊標題：SA Portal (BO / PM / Finance BO)、Merchant Portal (CP)、CSR Portal | G |
| I-2 | SA 區 4 個連結、CP 區 2 個、CSR 區 1 個，連結文字含 FSD 章節號 | G |
| I-3 | 每個選單連結導到對應頁（`/report?type=trans`、`/report?type=refund`、`/recon`、`/tos`、`/bankacc`、`/csr`） | I |
| I-4 | 頁面底部註記「選單沒有依角色過濾」存在 **[legacy]** | G |
| I-5 | csr 登入也看得到 SA 區的連結且點得進去 **[legacy]** | A |

## 3. report（`/report?type=trans|refund` → `/report/data` → `/sa/report/trans|refund`）FSD 4.6.1 / 4.6.2

| # | 情境 | 維度 |
|---|---|---|
| R-1 | `type=trans`：標題「交易報表查詢」，顯示商家、時間類型欄位 | B |
| R-2 | `type=refund`：標題「退款交易報表查詢」，商家／時間類型區塊隱藏 | B/F |
| R-3 | 不帶 type（`/report`）→ 等同 trans（controller defaultValue） | B |
| R-4 | 帶未知 type（`/report?type=xxx`）→ 標題仍「交易報表查詢」、查詢時走 trans 端點 **[legacy]** | F |
| R-5 | 初始：fromDate／toDate 預設今天 yyyyMMdd、fromHour 00、toHour 23、merchantId E000001、timeType 交易時間、結果區「請輸入條件查詢」 | B |
| R-6 | 小時下拉有 00～23 共 24 個選項 | B |
| R-7 | 查詢送出的 from/to = 日期 + 小時（10 碼）（可用 mock rule 驗證 from 為 10 碼，或以 E 維度回應驗證） | C |
| R-8 | 有資料（E000001）→ 表格 3 列、表頭 12 欄（TXID…REFERENCE）、`total rows: 3` | E/G |
| R-9 | 查無資料（E000002）→ 表格無資料列、`total rows: 0` | E |
| R-10 | 剛好 10 筆（E010000）→ 10 列、`total rows: 10` | E |
| R-11 | 超過 10 筆（E011000）→ 畫面 10 列、`total rows: 11`，說明文字「畫面僅顯示10筆」 | E |
| R-12 | backend 500（E500000）→ `backend error` | E |
| R-13 | timeType 切「授權時間(只限OLS)」後查詢 → 仍能得到結果（mock rule `timeType=auth` 可回不同資料以確認參數有送） | C |
| R-14 | 商家欄位清空後查詢 → 仍送出（Portal 只在有值時附加 merchantId）→ 回 default 資料 | C |
| R-15 | 日期欄輸入非 8 碼（`2026-09-15`）→ 仍送出，無前端驗證 **[legacy]** | C |
| R-16 | 起日大於迄日 → 仍送出 **[legacy]** | C |
| R-17 | refund：有資料 → 表頭 6 欄（TXID, AMOUNT, REFUND_STATUS, REFUND_DATE, MEMO, AUTH_DT）、1 列 | E/G |
| R-18 | refund：from 以 2099 開頭 → 查無資料 | E |
| R-19 | refund 查詢不會帶 merchantId／timeType 到 backend（mock rule 可用 `merchantId` 為 null 驗證） | C |
| R-20 | 導覽列在交易報表頁點「退款報表」→ 標題切換 | I |
| R-21 | 4.6.1「匯出 CSV」**[未實作]** | J |

## 4. recon（`/recon` → `/recon/data`、`/recon/detail`）FSD 4.6.3 / 4.6.4

| # | 情境 | 維度 |
|---|---|---|
| N-1 | 初始：類型預設「每日對帳 (4.6.3)」、from 20000101、to 20991231、結果區「請輸入條件查詢」、差異明細區空白 | B |
| N-2 | 類型下拉兩個選項：每日對帳 (4.6.3)、每月對帳 (4.6.4) | B |
| N-3 | 每日對帳有資料 → 2 列（R20260915 RECON_RESULT=Y DIFF_COUNT=0、R20260916 N/1）、`total rows: 2` | E/G |
| N-4 | 每日對帳 from=20990101 → 查無資料 | E |
| N-5 | 每月對帳有資料 → 1 列 M202608 | E |
| N-6 | 每月對帳 from=20990101 → 查無資料 | E |
| N-7 | 切換類型後再查 → 結果被覆蓋成另一種對帳 | D/F |
| N-8 | 差異明細 R20260915 → 0 筆（對帳正常） | E |
| N-9 | 差異明細 R20260916 → 1 筆（CP 100 / OLS 90 / RECON_RESULT 101） | E |
| N-10 | 差異明細 RECON_ID 空白 → 仍送出，回 default（0 筆） **[legacy]** | C |
| N-11 | 差異明細與主查詢互相獨立：先查明細再查主表，明細不被清掉 | F |
| N-12 | 主查詢 backend 500 → `#result` 顯示 backend error；明細區不受影響 | E |
| N-13 | 頁面說明文字「要看完整的交易資料，需在二天後…」存在 | G |
| N-14 | 4.6.3/4.6.4 的「多檔切分（-of-）」**[未實作]** | J |

## 5. tos（`/tos` → `/tos/data`、`/tos/save`）FSD 4.5.1

| # | 情境 | 維度 |
|---|---|---|
| T-1 | 初始：商家代碼預設 E000001、`#form` 隱藏、按鈕文字「查詢/新增服務條款」 | B |
| T-2 | 查 E000002（尚無條款）→ `#form` 顯示、版次顯示 1、目前內容「(尚無服務條款)」、編輯區顯示、「建立新版次」隱藏 | F |
| T-3 | 查 E000001（已有 v2）→ 版次顯示 2、目前內容含第二版文字與 `(URL: …version=2)`、編輯區隱藏、「建立新版次」顯示 | F |
| T-4 | 已有條款 → 按「建立新版次」→ 版次顯示 3、內容／註記清空、編輯區顯示、按鈕隱藏 | F |
| T-5 | 尚無條款 → 填生效日期、內容、註記 → 存檔 → `#msg` 顯示 `OK version=1 url=…` → 自動重查（仍顯示尚無條款，因 mock 無狀態，用 `#` 註解） | F |
| T-6 | 已有條款 → 建立新版次 → 存檔 → `#msg` 顯示 `OK version=3 url=…` | F |
| T-7 | 內容含 `FAIL` → 存檔 → `#msg` 顯示 `FAIL Value too long…`（後端失敗訊息原樣顯示） | E |
| T-8 | 存檔後 `#msg` 會被下一次查詢清空（`$('#msg').text('')`） | D |
| T-9 | 內容空白直接存檔 → 仍送出（無前端驗證） **[legacy]** | C |
| T-10 | 生效日期格式非 14 碼 → 仍送出 **[legacy]** | C |
| T-11 | 商家代碼空白查詢 → 送 `merchantID=` → 回 `[]` → 顯示尚無條款 **[legacy]** | C |
| T-12 | backend 500 → `$.get` 失敗、callback 不執行、畫面無變化（`#form` 仍隱藏） **[legacy]** | E |
| T-13 | backend 回非 JSON（E999JSON）→ `JSON.parse` 丟例外、畫面無變化 **[legacy]** | E |
| T-14 | 內容含換行 → `<pre>` 保留換行顯示 | G |
| T-15 | 頁面說明「版次由系統控管；建立後該版次不可修改」存在 | G |

## 6. bankacc（`/bankacc` → `/bankacc/data`、`/bankacc/save`）FSD 4.6.6

| # | 情境 | 維度 |
|---|---|---|
| K-1 | 初始：商家 E000001、銀行代碼／帳號空、幣別預設 NTD、外國銀行未勾、`#msg` 空、`#list` 空 | B |
| K-2 | 幣別下拉兩個選項：新台幣(NTD)、美金(USD) | B |
| K-3 | 查詢已註冊帳戶 E000001 → 表格 2 列、表頭「商家／銀行代碼／帳號／幣別／國內外／狀態」、IS_DOMESTIC Y→「國內」N→「國外」、狀態 W／A | E/G |
| K-4 | 查詢 E000009 → 表格只有表頭、0 列 | E |
| K-5 | 註冊 NTD 國內帳戶 → `#msg` 顯示 `OK` → 自動觸發查詢列表 | F |
| K-6 | 註冊 USD + 勾外國銀行 → 送 `isDomestic=N`、`currency=USD`（mock rule 驗證 body）→ `OK` | C |
| K-7 | 未勾外國銀行 → 送 `isDomestic=Y` | C |
| K-8 | bankCode=999 → `#msg` 顯示 `FAIL Unique index…` | E |
| K-9 | 銀行代碼／帳號空白直接註冊 → 仍送出 **[legacy]** | C |
| K-10 | 帳號含非數字 → 仍送出 **[legacy]** | C |
| K-11 | 註冊後 `#msg` 保留，直到下一次註冊才更新 | D |
| K-12 | list backend 500 → callback 不執行、`#list` 不變 **[legacy]** | E |
| K-13 | 說明文字「送出後由 Finance 於 SA Portal 審核 (4.6.7 審核作業尚未提供…)」存在 | G |
| K-14 | 4.6.7 Finance 審核 **[未實作]** | J |

## 7. csr（`/csr` → `/csr/data` → `/csr/trans`）FSD 4.6.5

| # | 情境 | 維度 |
|---|---|---|
| S-1 | 初始：門號預設 0912345678、結果區「請輸入門號查詢」、說明文字含 PaymentDescription／MerchantContact | B |
| S-2 | 0912345678 → 交易表 2 列（表頭 8 欄含 MERCHANDIZE_NAME、REFERENCE、RETURN_CODE）、`<hr/>Refunds:`、退款表 1 列 | E/G |
| S-3 | 交易表第一列是最新的（TX_DT DESC）：TX20260915000002 在 TX20260915000001 之前 | G |
| S-4 | 0900000000 → 兩張表都 0 列、兩個 `total rows: 0` | E |
| S-5 | 0950000000 → `backend error` | E |
| S-6 | 門號空白查詢 → 仍送出 → 回 default **[legacy]** | C |
| S-7 | 門號含非數字（`09abc`）→ 仍送出 **[legacy]** | C |
| S-8 | 商品名稱 GameCoin／AppItem、商家資訊 dev@onlinestore 出現在交易表（FSD：CSR 要看得到） | J |
| S-9 | 退款表 REFUND_STATUS、REFUND_DATE 欄位存在 | G |
| S-10 | 超過 10 筆交易的門號（0910000010）→ 畫面 10 列、`total rows: 11` | E |

---

## 統計下限

共通 13 + login 12 + index 5 + report 21 + recon 14 + tos 15 + bankacc 14 + csr 10 = **104 條**，其中未實作 4 條。
掃完程式碼若少於 100 個 scenario（Outline 每列算一個），代表有維度沒掃到。
