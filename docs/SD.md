# new-pay Portal 系統設計文件（SD）

> 需求來源：`docs/new-pay_Portal_SRS.md`（SRS 1.0）；User Story：`docs/user-stories.md`。
> 端點與參數以 SRS 第 5 章與 `portal/.../PortalController.java` 為準；兩者若有不一致，以程式為準並在圖下說明。本版次對照結果：Portal 端點、參數、未登入回應與 SRS 5.1 完全一致。

## 1. 系統架構

```mermaid
flowchart LR
    U["使用者<br/>營運人員／產品經理／財務人員<br/>商家／客服人員"] --> B["瀏覽器<br/>HTML + jQuery 1.12.4"]
    B -->|"頁面 GET、ajax 資料端點"| P["Portal :8098<br/>Spring Boot 2.7.18 + Thymeleaf<br/>HttpSession 保存登入"]
    P -->|"RestTemplate 轉呼叫<br/>BACKEND 常數 http://localhost:8099"| A["後端 :8099<br/>Spring Boot 2.7.18 + JdbcTemplate"]
    A --> D[("H2 in-memory<br/>MODE=Oracle")]
    C["用戶端瀏覽器"] -->|"GET /getToS.jsp，不經 Portal"| A
```

- Portal 不存取資料庫（P-COM-13）；每個資料端點對應一個後端 API，回應字串原樣轉回瀏覽器。
- 後端位址寫死在 `PortalController.BACKEND`（P-COM-14）；`application.properties` 的 `newpay.backend.url` 保留未用（SRS 7.5）。
- Portal 啟動不依賴後端；後端未啟動時頁面可開、可登入，查詢回 `backend error:`（P-NFR-03）。
- 後端 API 不要求認證；Portal 的登入檢查只在 Portal 這一層（SRS 7.3）。

## 2. 循序圖 Sequence Diagram

### SD-01 登入與登出

```mermaid
sequenceDiagram
    autonumber
    actor U as 使用者
    participant B as 瀏覽器
    participant P as Portal

    U->>B: 開啟 Portal
    B->>P: GET /
    P-->>B: 302 → /login（session 無 loginUser）
    B->>P: GET /login
    P-->>B: login.html（游標停在帳號欄）
    U->>B: 輸入帳號密碼，按「登入」或 Enter
    B->>P: POST /doLogin（username、password 表單）
    alt 帳號存在且密碼完全相符（大小寫敏感）
        P->>P: session 設 loginUser、role = 帳號
        P-->>B: 302 → /
        B->>P: GET /
        P-->>B: index.html
    else 帳號不存在、密碼不符或空白
        P-->>B: 200 login.html，err = 帳號或密碼錯誤
        Note over B: URL 停在 /doLogin，帳密欄位清空，不建立登入
    end
    Note over B,P: 缺 username 或 password 參數 → 400，GET /doLogin → 405（P-LGN-07）
    U->>B: 按導覽列「登出」
    B->>P: GET /logout
    P->>P: session.invalidate()
    P-->>B: 302 → /login（無錯誤訊息）
```

- 帳號表為程式常數 `USERS`（sa/sa、cp/cp、csr/csr），密碼明碼比對（P-LGN-01）。
- 再次登入不換 session id，只覆寫 `loginUser`、`role`（P-LGN-06）；無失敗次數限制與驗證碼（P-LGN-08）。
- session 逾時為 Servlet 容器預設 30 分鐘，以 cookie `JSESSIONID` 識別（P-COM-06）。

### SD-02 首頁

```mermaid
sequenceDiagram
    autonumber
    actor U as 使用者
    participant B as 瀏覽器
    participant P as Portal

    U->>B: 點導覽列「首頁」
    B->>P: GET /
    alt 未登入
        P-->>B: 302 → /login
    else 已登入
        P-->>B: index.html（model：user、role）
        B-->>U: 標題列 new-pay Portal | sa (sa) 與三區塊 7 個連結
    end
    U->>B: 點任一功能連結
    B->>P: GET /report?type=trans、/recon、/tos、/bankacc、/csr
```

- 首頁是唯一在標題列顯示 `(role)` 的頁面（P-COM-07、P-HOME-03）；三個帳號看到的內容相同（P-HOME-02）。
- 選單不依角色過濾（P-COM-09）；Merchant 區塊沒有退款報表連結（P-HOME-04）。
- 各頁只載入 `/css/portal.css` 與 `/js/jquery.min.js`，不用外部 CDN（P-COM-12）。

### SD-03 交易報表查詢

```mermaid
sequenceDiagram
    autonumber
    actor U as 使用者
    participant B as 瀏覽器
    participant P as Portal
    participant A as 後端 API
    participant D as 資料庫

    U->>B: 開啟交易報表
    B->>P: GET /report?type=trans
    P-->>B: report.html（hidden type = trans）
    B->>B: JS 產生 00～23 小時選項，日期帶本機今天
    U->>B: 按「查詢」
    B->>B: 結果區顯示「查詢中...」
    B->>P: GET /report/data?type, from=日期+時, to=日期+時, merchantId, timeType
    P->>A: GET /sa/report/trans?from, to［, merchantId 非空才帶］, timeType
    A->>D: 查 MWP_PAY_TRANS，col 介於 from+0000 與 to+5959，ORDER BY TX_DT
    D-->>A: 資料列
    alt 查詢成功
        A-->>P: HTML 表格（最多 10 列）＋ total rows: N
        P-->>B: 原樣回傳
        B-->>U: 結果區顯示明細表與 total rows
    else SQL 錯誤
        A-->>P: 200 query error: 訊息 ＋ SQL
        P-->>B: 原樣回傳
        B-->>U: 結果區顯示 query error
    else 後端未啟動或回 4xx、5xx
        P-->>B: 200 backend error: 例外訊息
        B-->>U: 結果區顯示 backend error
    end
```

- `col` = `AUTH_DT`（timeType=auth）或 `TX_DT`（其他）；排序固定 `TX_DT`（P-RPT-04、P-RPT-07）。
- `type` 只判斷是否等於 `refund`，其他值一律走交易報表（P-RPT-12）；參數直接串入 URL、不做 URL 編碼（P-COM-18）。
- 缺 `type`、`from`、`to` → Portal 回 400，不轉呼叫（P-COM-19）。

結果欄位（P-RPT-06）——User Story 用中文名稱，畫面表頭顯示代號：

| 畫面表頭 | 中文名稱 | | 畫面表頭 | 中文名稱 |
|---|---|---|---|---|
| TXID | 交易序號 | | TX_DT | 交易時間 |
| MERCHANT_ID | 商家 | | AUTH_DT | 授權時間 |
| ACC_ID | 門號 | | BILL_CSPTIME | 請款時間 |
| AMOUNT | 金額 | | MEMO | OLS 單號（CorrelationId） |
| CURRENCY | 幣別 | | MERCHANDIZE_NAME | 商品名稱 |
| TX_STATUS | 交易狀態 | | REFERENCE | 商家聯絡資訊（MerchantContact） |

### SD-04 退款報表查詢

```mermaid
sequenceDiagram
    autonumber
    actor U as 使用者
    participant B as 瀏覽器
    participant P as Portal
    participant A as 後端 API
    participant D as 資料庫

    U->>B: 開啟退款報表
    B->>P: GET /report?type=refund
    P-->>B: report.html（hidden type = refund）
    B->>B: JS 改標題為「退款交易報表查詢」，隱藏商家與時間類型區塊
    U->>B: 按「查詢」
    B->>B: 結果區顯示「查詢中...」
    B->>P: GET /report/data?type=refund, from, to, merchantId, timeType
    Note over B,P: 隱藏欄位的值仍會送出
    P->>A: GET /sa/report/refund?from, to
    Note over P,A: Portal 不帶 merchantId、timeType
    A->>D: 查 MWP_PAY_REFUND R 內連結 MWP_PAY_TRANS T（R.TXID = T.TXID）
    D-->>A: 資料列，ORDER BY REFUND_DATE
    alt 查詢成功
        A-->>P: HTML 表格（最多 10 列）＋ total rows: N
        P-->>B: 原樣回傳
        B-->>U: 結果區顯示退款明細
    else 錯誤
        P-->>B: query error 或 backend error
        B-->>U: 結果區顯示錯誤訊息
    end
```

- 區間欄位為 `REFUND_DATE`（P-RFD-02）；內連結使找不到原交易的退款不出現（P-RFD-05）。
- 結果欄位（P-RFD-03）：TXID 交易序號、AMOUNT 退款金額、REFUND_STATUS 退款狀態、REFUND_DATE 退款時間、MEMO 原交易 OLS 單號、AUTH_DT 原交易授權時間。

### SD-05 對帳查詢（每日／每月／差異明細）

```mermaid
sequenceDiagram
    autonumber
    actor U as 使用者
    participant B as 瀏覽器
    participant P as Portal
    participant A as 後端 API
    participant D as 資料庫

    U->>B: 開啟對帳查詢
    B->>P: GET /recon
    P-->>B: recon.html（daily，20000101～20991231）
    U->>B: 選類型、輸入區間，按「查詢」
    B->>B: 彙總區顯示「查詢中...」
    B->>P: GET /recon/data?type, from, to
    alt type = monthly
        P->>A: GET /sa/report/reconMonthly?from, to
        A->>D: 查 MWP_CP_RECON_MONTHLY_SUMMARY，CP_TX_DT 介於 from 與 to
    else 其他值一律視為每日
        P->>A: GET /sa/report/reconDaily?from, to
        A->>D: 查 MWP_CP_RECON_DAILY_SUMMARY，CP_TX_DT 介於 from 與 to
    end
    D-->>A: 資料列，ORDER BY CP_TX_DT
    A-->>P: HTML 表格 ＋ total rows: N
    P-->>B: 原樣回傳
    B-->>U: 彙總區顯示結果
    U->>B: 輸入 RECON_ID，按「查差異明細」
    B->>B: 明細區顯示「查詢中...」
    B->>P: GET /recon/detail?reconId
    P->>A: GET /sa/report/reconDailyDetail?reconId
    A->>D: 查 MWP_CP_RECON_DAILY_DETAIL，RECON_ID 相符且 RECON_RESULT 不等於 000
    D-->>A: 資料列，ORDER BY SQE_NUM
    A-->>P: HTML 表格 ＋ total rows: N
    P-->>B: 原樣回傳
    B-->>U: 明細區顯示差異明細，彙總區不變
```

- 彙總區（`#result`）與明細區（`#detail`）各自更新、互不清除（P-RCN-10、P-RCN-12）。
- 明細只查每日明細表；`M` 開頭的 RECON_ID 必為 0 筆（P-RCN-08）；空 reconId 照送（P-RCN-09）。
- 差異明細 20 欄（P-RCN-07）：RECON_ID、RECON_SEQ_NUM、MERCHANT_ID、BILLING_AGREEMENT_ID、CORRELATION_ID、SQE_NUM、TXID、STATUS、ITEM_PRICE、TAX、TOTAL_AMOUNT、ROUND_AMOUNT、CURRENCY、LAST_EVENT、TIMESTAMP、EVENT_RESPONSE、EVENT_RESPONSE_DESCRIPTION、CREATE_TIME、RECON_RESULT、RECON_MESSAGE。
- 每日彙總 8 欄、每月彙總 7 欄，見第 4 章 ER Model（P-RCN-02、P-RCN-03）。

### SD-06 服務條款設定

```mermaid
sequenceDiagram
    autonumber
    actor U as 產品經理
    participant B as 瀏覽器
    participant P as Portal
    participant A as 後端 API
    participant D as 資料庫

    U->>B: 輸入商家代碼，按「查詢/新增服務條款」
    B->>P: GET /tos/data?merchantID
    alt 未登入
        P-->>B: []
    else 已登入
        P->>A: GET /sa/tos/query?merchantID
        A->>D: 查 MWP_OLS_TOS，ORDER BY TOS_VERSION DESC
        D-->>A: 全部版次
        A-->>P: JSON 陣列
        P-->>B: 原樣回傳
    end
    alt 空陣列
        B-->>U: S1 新增模式（版次 1、尚無服務條款、顯示存檔）
    else 非空陣列
        B-->>U: S2 檢視模式（第一筆的版次、內容與 URL，只顯示建立新版次）
    else 非 JSON，例如 backend error
        B-->>U: JSON.parse 失敗，畫面不更新
    end
    opt 按「建立新版次」
        B-->>U: S3 版次 = 最新 + 1，清空內容與註記（前端處理，不呼叫 Portal）
    end
    U->>B: 填生效日期、內容、註記，按「存檔」
    B->>P: POST /tos/save（merchantID、startDate、content、note）
    P->>A: POST /sa/tos/save（form urlencoded，note 為 null 時補空字串）
    A->>D: SELECT MAX(TOS_VERSION) ＋ 1，無資料為 1
    A->>D: INSERT MWP_OLS_TOS（TOS_URL、TOS_MODIFIED_DATE 由後端產生）
    alt 成功
        A-->>P: OK version=N url=…
    else 例外（欄位過長、NULL、單引號）
        A-->>P: FAIL 例外訊息
    end
    P-->>B: 原樣回傳（連線失敗時 Portal 回 FAIL 例外訊息）
    B->>B: 訊息區顯示回應，立即自動重查（回到步驟 2）
    Note over B: 重查回合法 JSON 時訊息區被清空（P-TOS-09）

    actor C as 用戶端
    C->>A: GET /getToS.jsp?merchantID, version
    A->>D: 查 MWP_OLS_TOS（缺 merchantID 用 I00000000，缺 version 取最新）
    A-->>C: 服務條款 v版次 ＋ 內容，查無為 NO ToS
```

- 後端 `/sa/tos/query` 沒有 try/catch：merchantID 含單引號時回 HTTP 500，Portal 轉成 `backend error:`，頁面因非 JSON 不更新——與 P-COM-31「查詢回 query error」不符（見 US-COM-05）。
- 後端未啟動時存檔回 `FAIL …`，重查回 `backend error:`，頁面不更新，因此 `FAIL` 訊息不會被清空——與 P-TOS-14 前半句不符（見 US-TOS-04）。
- JSON 鍵為欄位名，`TOS_VERSION` 為數字、`TOS_CONTENT`（CLOB）轉字串（P-API-04）。

### SD-07 商家銀行帳戶註冊

```mermaid
sequenceDiagram
    autonumber
    actor U as 商家
    participant B as 瀏覽器
    participant P as Portal
    participant A as 後端 API
    participant D as 資料庫

    U->>B: 填銀行代碼、帳號、幣別、外國銀行，按「註冊」
    B->>P: POST /bankacc/save（merchantId、bankCode、bankAcc、currency、isDomestic）
    alt 未登入
        P-->>B: please login
    else 已登入
        P->>A: POST /cp/bankacc/save（form urlencoded，isDomestic 預設 Y）
        A->>D: INSERT MWP_MERCHANT_BANK_ACC，STATUS = W
        alt 成功
            A-->>P: OK
        else 例外（Value too long、NULL not allowed）
            A-->>P: FAIL 例外訊息
        end
        P-->>B: 原樣回傳
    end
    B->>B: 訊息區顯示回應，自動觸發「查詢已註冊帳戶」
    B->>P: GET /bankacc/data?merchantId
    alt 未登入
        P-->>B: []
    else 已登入
        P->>A: GET /cp/bankacc/list?merchantId
        A->>D: 查 MWP_MERCHANT_BANK_ACC，MERCHANT_ID 相符，不排序
        A-->>P: JSON 陣列
        P-->>B: 原樣回傳
    end
    B->>B: 前端組 6 欄表格，IS_DOMESTIC Y 轉國內、其他轉國外
    B-->>U: 清單顯示全部帳戶，訊息區保留註冊回應
```

- 清單不限 10 筆、沒有 total rows、表格沒有 `border=1`（P-BNK-05、P-BNK-06）。
- 清單回應非 JSON 時 `JSON.parse` 失敗，清單不更新（P-BNK-11）。
- `/cp/bankacc/list` 同樣沒有 try/catch，merchantId 含單引號回 500 → `backend error:`（同 SD-06 的差異）。

### SD-08 CSR 交易查詢

```mermaid
sequenceDiagram
    autonumber
    actor U as 客服人員
    participant B as 瀏覽器
    participant P as Portal
    participant A as 後端 API
    participant D as 資料庫

    U->>B: 輸入門號，按「查詢」
    B->>B: 結果區顯示「查詢中...」
    B->>P: GET /csr/data?msisdn
    P->>A: GET /csr/trans?msisdn
    A->>D: 第一段：MWP_PAY_TRANS，ACC_ID = msisdn，ORDER BY TX_DT DESC
    D-->>A: 交易資料列
    A->>D: 第二段：MWP_PAY_REFUND，TXID 屬於該門號的交易
    D-->>A: 退款資料列
    A-->>P: 交易表格 ＋ total rows ＋ hr Refunds: ＋ 退款表格 ＋ total rows
    P-->>B: 原樣回傳
    B-->>U: 結果區顯示兩個表格
```

- 兩段 SQL 各自 try/catch，可能只有一段出現 `query error:`（P-CSR-10）。
- 交易表 8 欄（P-CSR-03）：TXID、AMOUNT、TX_STATUS、TX_DT、AUTH_DT、MERCHANDIZE_NAME、REFERENCE、RETURN_CODE；退款表為 MWP_PAY_REFUND 全部 8 欄（P-CSR-05）。

## 3. 活動圖 Activity Diagram

### AD-01 存取控制

```mermaid
flowchart TD
    S([請求進入 Portal]) --> T{請求類型}
    T -->|"/login、/doLogin"| PUB["不檢查登入，直接處理"]
    T -->|"/logout"| LO["session 失效，302 導向 /login"]
    T -->|"功能頁面"| C1{"session 有 loginUser?"}
    C1 -->|"否"| R["302 導向 /login"]
    C1 -->|"是"| PG["渲染頁面，帶入帳號"]
    T -->|"資料端點"| PRM{"必要參數齊全?"}
    PRM -->|"否"| E400["HTTP 400，不轉呼叫"]
    PRM -->|"是"| C2{"session 有 loginUser?"}
    C2 -->|"是"| ROLE["不檢查角色（P-COM-03，現況如此）"]
    ROLE --> RELAY["轉呼叫後端，見 AD-03"]
    C2 -->|"否"| K{"端點"}
    K -->|"/tos/data、/bankacc/data"| EMPTY["回 200 []"]
    K -->|"其他資料端點"| PL["回 200 please login"]
    PUB --> E([結束])
    LO --> E
    R --> E
    PG --> E
    E400 --> E
    RELAY --> E
    EMPTY --> E
    PL --> E
```

- 判斷依據：功能頁面 P-COM-01；資料端點未登入回應 P-COM-02；不檢查角色 P-COM-03；登出 P-COM-05；缺參數 P-COM-19。
- 參數綁定先於登入檢查：未登入且缺參數時回 400 而非 please login（程式行為，SRS 未明寫順序）。

### AD-02 報表查詢與結果呈現

```mermaid
flowchart TD
    S([按「查詢」]) --> L["結果區顯示「查詢中...」"]
    L --> F["組條件：from = 日期＋時，to = 日期＋時"]
    F --> NV["前端不檢核格式，原樣送出（P-COM-30）"]
    NV --> SEND["送 Portal 資料端點"]
    SEND --> W{"回應到達?"}
    W -->|"否"| WAIT["停在「查詢中...」，無逾時（P-COM-17）"]
    W -->|"是"| Q{"後端查詢成功?"}
    Q -->|"否"| QE["query error: 訊息與 SQL（P-COM-26）"]
    Q -->|"是"| N{"筆數為 0?"}
    N -->|"是"| EMPTY["空表格 ＋ total rows: 0（P-COM-23）"]
    N -->|"否"| TOP["輸出前 10 列 ＋ total rows: N（P-COM-22）"]
    QE --> REP["結果區整個被取代（P-COM-27）"]
    EMPTY --> REP
    TOP --> REP
    REP --> E([結束])
    WAIT --> E
```

- 時間區間：後端將 from 補 `0000`、to 補 `5959`，以字串比較，兩端包含（P-COM-35、P-RPT-03）。
- 查詢按鈕不停用；連按多次以最後到達的回應為準（P-COM-28）。
- 欄位值原樣輸出、不轉義；NULL 輸出 `null`（P-COM-24、P-COM-25）。

### AD-03 Portal 轉呼叫後端與錯誤處理

```mermaid
flowchart TD
    S([已通過 AD-01 登入檢查]) --> M{"資料端點方法"}
    M -->|"GET"| URL["查詢參數直接串入 URL，不做 URL 編碼（P-COM-18）"]
    URL --> G["RestTemplate GET，無逾時（P-COM-17）"]
    G --> GR{"連線成功且 HTTP 2xx?"}
    GR -->|"是"| RAW["回應字串原樣回傳（P-COM-13）"]
    GR -->|"否"| BE["回 200 backend error: 例外訊息（P-COM-15）"]
    M -->|"POST"| FORM["form urlencoded 送出，note 補空字串、isDomestic 預設 Y"]
    FORM --> PR{"連線成功且 HTTP 2xx?"}
    PR -->|"否"| FP["回 200 FAIL 例外訊息（P-COM-16）"]
    PR -->|"是"| BIZ{"後端寫入成功?"}
    BIZ -->|"是"| OK["回 OK 或 OK version=N url=…"]
    BIZ -->|"否"| FB["回 200 FAIL 例外訊息（P-API-02）"]
    RAW --> E([結束])
    BE --> E
    FP --> E
    OK --> E
    FB --> E
```

- 後端業務錯誤一律 HTTP 200（`query error:`／`FAIL`）；404／400／405 由 Portal 轉成 `backend error:`（P-API-02）。
- 回應 Content-Type：HTML 表格類 `text/html;charset=UTF-8`、JSON 類 `application/json`、OK／FAIL 依 Spring 預設，Portal 一律當字串轉送（P-API-01）。

### AD-04 服務條款狀態流程

```mermaid
flowchart TD
    S0(["S0 初始：條款區塊隱藏"]) --> Q["按「查詢/新增服務條款」"]
    Q --> J{"回應是合法 JSON?"}
    J -->|"否"| NC["畫面不更新、無訊息（P-TOS-15）"]
    J -->|"是"| EMP{"陣列為空?"}
    EMP -->|"是"| S1["S1 新增模式：版次 1、尚無服務條款、只顯示存檔、清空訊息"]
    EMP -->|"否"| S2["S2 檢視模式：最新版次與內容、只顯示建立新版次、清空訊息"]
    S2 -->|"按建立新版次"| S3["S3 新版次模式：版次 = 最新 + 1、清空內容與註記、保留生效日期"]
    S2 -->|"改商家代碼"| Q
    S1 -->|"按存檔"| SV["送出存檔"]
    S3 -->|"按存檔"| SV
    SV --> MSG["訊息區顯示 OK version=N url=… 或 FAIL …"]
    MSG --> AQ["自動重查（P-TOS-08、P-TOS-14）"]
    AQ --> J
    NC --> E([結束])
```

- 狀態定義依 SRS 4.6.2；畫面沒有存檔前的確認對話框，也沒有前端格式檢核（P-TOS-12）。
- S3 的「最新 + 1」只是預覽，實際版次由後端 `MAX(TOS_VERSION)+1` 決定（P-TOS-07、P-TOS-11）。
- 舊版次沒有修改入口（P-TOS-10）。

### AD-05 銀行帳戶新增與存檔

```mermaid
flowchart TD
    S([按「註冊」]) --> NV["不檢核數字、商家、重複（P-BNK-08）"]
    NV --> FG{"外國銀行勾選?"}
    FG -->|"是"| N1["isDomestic = N"]
    FG -->|"否"| Y1["isDomestic = Y"]
    N1 --> SEND["送出註冊"]
    Y1 --> SEND
    SEND --> LG{"已登入?"}
    LG -->|"否"| PL["訊息區顯示 please login"]
    LG -->|"是"| INS{"後端新增成功?"}
    INS -->|"是"| OK["訊息區顯示 OK，帳戶狀態 W（P-BNK-02）"]
    INS -->|"否"| FL["訊息區顯示 FAIL …（P-BNK-07、P-COM-32）"]
    PL --> LST["自動查詢已註冊帳戶"]
    OK --> LST
    FL --> LST
    LST --> JS{"清單回應是合法 JSON?"}
    JS -->|"否"| KEEP["清單不更新、無訊息（P-BNK-11）"]
    JS -->|"是"| TBL["組 6 欄表格，Y 顯示國內、其他顯示國外（P-BNK-04、P-BNK-05）"]
    KEEP --> E([結束])
    TBL --> E
```

- 清單查詢不會清除訊息區（P-BNK-10）；未登入時清單回 `[]`，顯示只有表頭的表格。
- 本版次無審核流程，狀態停在 W（P-BNK-13）。

## 4. 資料模型 ER Model

只畫 SRS 6.1 列出的 7 張資料表。為避免單張圖過寬，分成交易、對帳、設定三張。

### ER-1 交易與退款

```mermaid
erDiagram
    MWP_PAY_TRANS ||--o{ MWP_PAY_REFUND : "TXID 退款"
    MWP_PAY_TRANS {
        VARCHAR2 TXID PK "交易序號 T+毫秒，長度 15"
        VARCHAR2 MERCHANT_ID "商家，長度 20，NN"
        VARCHAR2 ACC_ID "門號，長度 60，NN"
        VARCHAR2 SERVICE_ID "長度 20，報表不顯示"
        VARCHAR2 CHANNEL "長度 10，OLS 為 0300"
        NUMBER AMOUNT "金額，NUMBER 8,0，NN"
        VARCHAR2 CURRENCY "TWD，長度 4"
        VARCHAR2 TX_STATUS "A／D／F，長度 2，NN"
        VARCHAR2 RETURN_CODE "長度 32"
        VARCHAR2 RETURN_MSG "長度 128"
        VARCHAR2 TX_DT "交易建立時間 14 碼，NN"
        VARCHAR2 AUTH_DT "OLS 授權時間 14 碼"
        VARCHAR2 BILL_CSPTIME "請款時間 14 碼"
        VARCHAR2 MEMO "OLS CorrelationId，長度 64"
        VARCHAR2 MERCHANDIZE_NAME "PaymentDescription，長度 60"
        VARCHAR2 REFERENCE "MerchantContact，長度 128"
        VARCHAR2 MODIFY_DATE "14 碼，報表不顯示"
    }
    MWP_PAY_REFUND {
        VARCHAR2 TXID "原交易序號，長度 15，NN，可多筆"
        VARCHAR2 MERCHANT_ID "長度 20"
        NUMBER AMOUNT "退款金額，NN"
        VARCHAR2 REFUND_STATUS "批次寫入 D，NN"
        VARCHAR2 REFUND_DATE "退款時間 14 碼"
        VARCHAR2 CREATE_TIME "寫入時間 14 碼，NN"
        VARCHAR2 RETURN_CODE "長度 32"
        VARCHAR2 RETURN_MSG "長度 128"
    }
```

- `MWP_PAY_REFUND` 無 PK、無 FK 約束；與交易主檔以 `TXID` 為**邏輯關聯**，一筆交易可有多筆退款。退款報表以內連結取原交易的 MEMO、AUTH_DT（P-RFD-03、P-RFD-05）。

### ER-2 對帳

```mermaid
erDiagram
    MWP_CP_RECON_DAILY_SUMMARY ||--o{ MWP_CP_RECON_DAILY_DETAIL : "RECON_ID 明細"
    MWP_PAY_TRANS |o--o{ MWP_CP_RECON_DAILY_DETAIL : "TXID 對應交易"
    MWP_CP_RECON_DAILY_SUMMARY {
        VARCHAR RECON_ID PK "R+yyyyMMdd，長度 20"
        VARCHAR2 MERCHANT_ID "長度 20，NN"
        VARCHAR2 RECON_RESULT_SUMMARY "Y 一致／N 有差異"
        NUMBER DIFF_COUNT "差異筆數"
        VARCHAR2 CP_TX_DT "對帳日 8 碼，NN"
        NUMBER CP_TOTAL_CONUT "OLS 檔筆數（拼字依資料表）"
        NUMBER NEWPAY_TOTAL_COUNT "new-pay 端筆數"
        VARCHAR2 CP_FILE_NAME "OLS 對帳檔名，長度 80"
    }
    MWP_CP_RECON_MONTHLY_SUMMARY {
        VARCHAR RECON_ID PK "M+yyyyMM，長度 20"
        VARCHAR2 MERCHANT_ID "長度 20，NN"
        VARCHAR2 CP_TX_DT "yyyyMM01，NN"
        NUMBER CP_TOTAL_CONUT "OLS 檔筆數"
        NUMBER NEWPAY_TOTAL_COUNT "new-pay 端筆數"
        VARCHAR2 CP_DETAIL_FILE_NAME "月對帳明細檔名，長度 80"
        VARCHAR2 CP_SUMMARY_FILE_NAME "月拆帳總表檔名，目前為 NULL"
    }
    MWP_CP_RECON_DAILY_DETAIL {
        VARCHAR2 RECON_ID "批次識別"
        VARCHAR RECON_SEQ_NUM "批次序號"
        VARCHAR2 MERCHANT_ID "商家"
        VARCHAR2 BILLING_AGREEMENT_ID "TELCO_TW"
        VARCHAR2 CORRELATION_ID "OLS 單號"
        NUMBER SQE_NUM "序號，明細排序鍵"
        VARCHAR2 TXID "new-pay 交易序號"
        VARCHAR2 STATUS "Charged／Refunded／D，長度 128"
        VARCHAR2 ITEM_PRICE "micros"
        VARCHAR2 TAX "micros"
        VARCHAR2 TOTAL_AMOUNT "micros"
        NUMBER ROUND_AMOUNT "四捨五入後元"
        VARCHAR2 CURRENCY "幣別"
        VARCHAR2 LAST_EVENT "OLS 事件"
        VARCHAR2 TIMESTAMP "OLS 事件時間"
        VARCHAR2 EVENT_RESPONSE "OLS 事件回應"
        VARCHAR2 EVENT_RESPONSE_DESCRIPTION "OLS 事件說明"
        VARCHAR2 CREATE_TIME "14 碼，NN"
        VARCHAR2 RECON_RESULT "000／101～105／201～205，長度 3"
        VARCHAR2 RECON_MESSAGE "比對訊息，長度 80"
    }
    MWP_PAY_TRANS {
        VARCHAR2 TXID PK "見 ER-1"
    }
```

- 彙總與明細以 `RECON_ID` 為**邏輯關聯**（差異明細查詢以 RECON_ID 篩選，P-RCN-06）；明細的 `TXID` 對應交易主檔，但 101／102 類差異代表一端沒有資料，因此為「零或一」。兩者皆無 FK 約束。
- `MWP_CP_RECON_MONTHLY_SUMMARY` 與其他表在 SRS 中沒有關聯依據，獨立呈現。
- SRS 6.1 未列明細表除 STATUS、CREATE_TIME、RECON_RESULT、RECON_MESSAGE 以外的型別，圖中型別取自 `backend/src/main/resources/schema.sql`（列入「SRS 可能缺漏」）。

### ER-3 設定

```mermaid
erDiagram
    MWP_OLS_TOS {
        VARCHAR2 MERCHANT_ID "商家代碼，長度 10，NN"
        NUMBER TOS_VERSION "版次，MAX+1，NN，DEFAULT 1"
        VARCHAR2 TOS_URL "系統產生，長度 256，NN"
        CLOB TOS_CONTENT "條款內容，NN"
        VARCHAR2 TOS_NOTE "註記，長度 1024"
        VARCHAR2 TOS_MODIFIED_DATE "存檔時間 14 碼，NN"
        VARCHAR2 TOS_START_DATE "生效日期 14 碼，NN"
    }
    MWP_MERCHANT_BANK_ACC {
        VARCHAR2 MERCHANT_ID "長度 20，NN"
        VARCHAR2 BANK_CODE "銀行代碼，長度 3，NN"
        VARCHAR2 BANK_ACC "帳號，長度 16，NN"
        VARCHAR2 CURRENCY "NTD／USD，長度 4"
        VARCHAR2 IS_DOMESTIC "Y 國內／N 國外，NN，DEFAULT Y"
        VARCHAR2 STATUS "W 待審／A 已核准，長度 2"
    }
```

- 兩表皆無 PK、無唯一鍵；同商家同版次條款、相同銀行帳戶可重複寫入（SRS 7.3）。SRS 沒有商家主檔，`MERCHANT_ID` 不畫關聯。
- 初始資料：`MWP_OLS_TOS` 有 I00000000 v1、E000001 v1；`MWP_MERCHANT_BANK_ACC` 有 E000001／007／1234567890123456／USD／N／A（P-TOS-18、P-BNK-12）。

### 資料表 ↔ 使用頁面

| 資料表 | 使用頁面 | 後端 API | 存取 |
|---|---|---|---|
| MWP_PAY_TRANS | 交易報表、退款報表、CSR 查詢 | /sa/report/trans、/sa/report/refund、/csr/trans | 讀 |
| MWP_PAY_REFUND | 退款報表、CSR 查詢 | /sa/report/refund、/csr/trans | 讀 |
| MWP_CP_RECON_DAILY_SUMMARY | 對帳查詢（每日） | /sa/report/reconDaily | 讀 |
| MWP_CP_RECON_MONTHLY_SUMMARY | 對帳查詢（每月） | /sa/report/reconMonthly | 讀 |
| MWP_CP_RECON_DAILY_DETAIL | 對帳查詢（差異明細） | /sa/report/reconDailyDetail | 讀 |
| MWP_OLS_TOS | 服務條款設定、用戶端條款頁 | /sa/tos/query、/sa/tos/save、/getToS.jsp | 讀、新增 |
| MWP_MERCHANT_BANK_ACC | 商家銀行帳戶註冊 | /cp/bankacc/list、/cp/bankacc/save | 讀、新增 |

## 附錄 A 設計元素 ↔ SRS 條文 ↔ User Story 對照表

| 設計元素 | SRS 條文 | User Story |
|---|---|---|
| 1 系統架構 | P-COM-13, P-COM-14, P-NFR-03, P-NFR-04, P-NFR-05, P-NFR-10 | US-COM-04 |
| SD-01 登入與登出 | P-LGN-01～P-LGN-09, P-COM-04, P-COM-05, P-COM-06 | US-LGN-01, US-LGN-02, US-LGN-03, US-COM-01 |
| SD-02 首頁 | P-HOME-01～P-HOME-05, P-COM-07～P-COM-12 | US-HOME-01, US-HOME-02, US-COM-02 |
| SD-03 交易報表查詢 | P-RPT-01～P-RPT-13, P-COM-15, P-COM-18, P-COM-19, P-COM-20～P-COM-26 | US-RPT-01, US-RPT-02, US-RPT-03, US-COM-03, US-COM-04 |
| SD-04 退款報表查詢 | P-RFD-01～P-RFD-07 | US-RFD-01, US-RFD-02, US-RFD-03 |
| SD-05 對帳查詢 | P-RCN-01～P-RCN-12 | US-RCN-01, US-RCN-02, US-RCN-03, US-RCN-04 |
| SD-06 服務條款設定 | P-TOS-01～P-TOS-18, P-API-04, P-COM-31 | US-TOS-01～US-TOS-05, US-COM-05 |
| SD-07 商家銀行帳戶註冊 | P-BNK-01～P-BNK-14, P-API-04 | US-BNK-01～US-BNK-04 |
| SD-08 CSR 交易查詢 | P-CSR-01～P-CSR-10 | US-CSR-01, US-CSR-02, US-CSR-03 |
| AD-01 存取控制 | P-COM-01, P-COM-02, P-COM-03, P-COM-05, P-COM-19 | US-COM-01 |
| AD-02 報表查詢與結果呈現 | P-COM-17, P-COM-22～P-COM-28, P-COM-30, P-COM-35 | US-COM-03, US-COM-05, US-RPT-02 |
| AD-03 轉呼叫與錯誤處理 | P-COM-13, P-COM-15～P-COM-18, P-API-01, P-API-02 | US-COM-04 |
| AD-04 服務條款狀態流程 | P-TOS-03～P-TOS-12, P-TOS-14, P-TOS-15 | US-TOS-01～US-TOS-04 |
| AD-05 銀行帳戶新增與存檔 | P-BNK-02, P-BNK-04, P-BNK-05, P-BNK-07, P-BNK-08, P-BNK-10, P-BNK-11, P-BNK-13, P-COM-32 | US-BNK-02, US-BNK-04 |
| 4 ER Model | SRS 6.1～6.3, P-COM-34, P-COM-36 | US-COM-03 |
