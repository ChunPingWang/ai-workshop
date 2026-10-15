# new-pay Portal 系統設計文件（SD）

需求依據：`new-pay_Portal_SRS.md`。本文件記錄 Portal 的目前介接與資料流；User Story 與可觀察驗收條件見 [user-stories.md](user-stories.md)。

## 1. 系統架構

```mermaid
flowchart LR
    U[使用者] --> B[瀏覽器]
    B -->|HTTP 8098| P[Portal Spring MVC 與 Thymeleaf]
    P -->|HTTP 8099| A[OnlineStore Backend API]
    A --> D[(H2 資料庫)]
    P -.->|不直接存取| D
```

瀏覽器透過 Portal 頁面與資料端點工作；Portal 以固定後端位址轉送查詢與存檔。Portal 不直接連線資料庫，登入狀態只保存在 Portal 的 HttpSession。
後端未啟動時 Portal 頁面仍可登入與開啟，資料操作則回傳錯誤文字。對應 P-COM-13～P-COM-16、P-NFR-03～P-NFR-05、P-NFR-10。

## 2. 循序圖 Sequence Diagram

### SD-01 登入、存取控制與登出

```mermaid
sequenceDiagram
    autonumber
    actor U as 使用者
    participant B as 瀏覽器
    participant P as Portal
    U->>B: 開啟登入頁
    B->>P: GET /login
    P-->>B: login.html
    U->>B: 輸入帳密並送出
    B->>P: POST /doLogin
    alt 帳密相符
        P->>P: 設定 loginUser 與 role
        P-->>B: 302 導向首頁
        B->>P: GET /
        P-->>B: index.html
    else 帳密不符
        P-->>B: 登入頁與錯誤訊息
    end
    opt 未登入開啟功能頁
        B->>P: GET 功能頁
        P-->>B: 302 導向 /login
    end
    U->>B: 按登出
    B->>P: GET /logout
    P->>P: invalidate session
    P-->>B: 302 導向 /login
```

Portal 對三組固定帳密驗證；角色值等於帳號，所有登入者可使用相同功能。已登入時重新登入會覆寫同一 session 的帳號與角色，不更換 session id。未登入頁面請求導向登入頁；未登入資料端點則依端點回 `please login` 或 `[]`，不導向頁面。對應 P-LGN-01～P-LGN-09、P-COM-01～P-COM-06、P-COM-02。

### SD-02 首頁與共用導覽

```mermaid
sequenceDiagram
    autonumber
    actor U as 使用者
    participant B as 瀏覽器
    participant P as Portal
    U->>B: 登入成功後開啟首頁
    B->>P: GET /
    P->>P: 檢查 loginUser
    P-->>B: index.html 與 user、role
    B-->>U: 顯示三組功能選單及共用導覽
    U->>B: 選擇功能連結
    B->>P: GET 對應功能頁
    P-->>B: 對應 Thymeleaf 頁面
```

首頁的 SA、Merchant、CSR 區塊與導覽列均由 Portal template 提供；不依登入角色過濾連結。各功能頁共用導覽項目，登入頁除外。對應 P-HOME-01～P-HOME-05、P-COM-07～P-COM-12。

### SD-03 交易報表查詢

```mermaid
sequenceDiagram
    autonumber
    actor U as 使用者
    participant B as 瀏覽器
    participant P as Portal
    participant A as 後端 API
    participant D as 資料庫
    U->>B: 開啟交易報表並設定條件
    B->>P: GET /report?type=trans
    P-->>B: report.html 與預設條件
    U->>B: 按查詢
    B->>B: 結果區顯示查詢中
    B->>P: GET /report/data?type=trans&from=...&to=...
    P->>P: 檢查登入狀態及必要參數
    P->>A: GET /sa/report/trans?from=...&to=...
    A->>D: 查詢交易並依 TX_DT 排序
    D-->>A: 交易資料
    alt 查詢成功
        A-->>P: HTML 表格片段
        P-->>B: 原樣回傳
        B-->>U: 顯示明細與總筆數
    else 查詢失敗或後端無法連線
        A-->>P: 錯誤回應或連線錯誤
        P-->>B: query error 或 backend error
        B-->>U: 結果區顯示錯誤文字
    end
```

頁面以瀏覽器本機日期初始化條件；Portal 只依 `type` 是否為 `refund` 選擇報表 API，交易報表另轉送商家及時間類型。後端以 TX_DT 或 AUTH_DT 篩選、依 TX_DT 升冪，最多輸出 10 列。對應 P-RPT-01～P-RPT-13、P-COM-15、P-COM-17～P-COM-29、P-COM-33～P-COM-35、P-API-01、P-API-02。

### SD-04 退款報表查詢

```mermaid
sequenceDiagram
    autonumber
    actor U as 使用者
    participant B as 瀏覽器
    participant P as Portal
    participant A as 後端 API
    participant D as 資料庫
    U->>B: 開啟退款報表並設定日期範圍
    B->>P: GET /report?type=refund
    P-->>B: report.html 與退款報表標題
    U->>B: 按查詢
    B->>P: GET /report/data?type=refund&from=...&to=...
    P->>A: GET /sa/report/refund?from=...&to=...
    A->>D: 以退款時間查詢並關聯原交易
    D-->>A: 退款與原交易資料
    A-->>P: HTML 表格片段
    P-->>B: 原樣回傳
    B-->>U: 顯示退款明細與總筆數
```

退款頁與交易報表共用 template，但隱藏商家與時間類型欄位。後端依 REFUND_DATE 篩選並排序，只輸出可對應原交易的退款。對應 P-RFD-01～P-RFD-07、P-COM-20～P-COM-29、P-API-01、P-API-02。

### SD-05 每日／每月對帳與差異明細

```mermaid
sequenceDiagram
    autonumber
    actor U as 使用者
    participant B as 瀏覽器
    participant P as Portal
    participant A as 後端 API
    participant D as 資料庫
    U->>B: 選擇每日或每月並輸入日期範圍
    B->>P: GET /recon/data?type=...&from=...&to=...
    alt type 為 monthly
        P->>A: GET /sa/report/reconMonthly
        A->>D: 查每月彙總
    else 其他 type
        P->>A: GET /sa/report/reconDaily
        A->>D: 查每日彙總
    end
    D-->>A: 彙總資料
    A-->>P: HTML 表格
    P-->>B: 原樣回傳
    U->>B: 輸入 RECON_ID 並查差異
    B->>P: GET /recon/detail?reconId=...
    P->>A: GET /sa/report/reconDailyDetail?reconId=...
    A->>D: 查詢非 000 的每日明細
    D-->>A: 差異明細
    A-->>P: HTML 表格
    P-->>B: 原樣回傳
    B-->>U: 顯示差異明細
```

彙總查詢與差異明細由兩個獨立結果區呈現。每月識別碼送至每日差異明細查詢時不會得到資料；空白識別碼仍會送出查詢。對應 P-RCN-01～P-RCN-12、P-COM-20～P-COM-29、P-API-01、P-API-02。

### SD-06 服務條款查詢、新版次與讀取

```mermaid
sequenceDiagram
    autonumber
    actor U as 使用者
    participant B as 瀏覽器
    participant P as Portal
    participant A as 後端 API
    participant D as 資料庫
    U->>B: 輸入商家並查詢條款
    B->>P: GET /tos/data?merchantID=...
    P->>A: GET /sa/tos/query?merchantID=...
    A->>D: 依版次遞減查條款
    D-->>A: 條款 JSON
    A-->>P: JSON 陣列
    P-->>B: 原樣回傳
    alt 尚無條款
        B-->>U: 顯示版次 1 與新增表單
    else 已有條款
        B-->>U: 顯示最新內容與建立新版次按鈕
        U->>B: 建立新版次並填寫內容
    end
    U->>B: 按存檔
    B->>P: POST /tos/save
    P->>A: POST /sa/tos/save
    A->>D: 新增 MAX(version)+1
    D-->>A: 存檔結果
    A-->>P: OK 或 FAIL
    P-->>B: 存檔結果
    B->>P: 自動重新查詢
```

Portal 顯示最新版本並以新增方式建立後續版本；既有版本不提供修改。存檔後自動重查，存檔訊息會在重查完成時清除。對外讀取條款的 `/getToS.jsp` 由後端直接提供，不經 Portal。對應 P-TOS-01～P-TOS-18、P-COM-16、P-COM-30～P-COM-32、P-API-01、P-API-02、P-API-04。

### SD-07 商家銀行帳戶註冊與清單

```mermaid
sequenceDiagram
    autonumber
    actor U as 使用者
    participant B as 瀏覽器
    participant P as Portal
    participant A as 後端 API
    participant D as 資料庫
    U->>B: 輸入帳戶資料並註冊
    B->>P: POST /bankacc/save
    P->>A: POST /cp/bankacc/save
    A->>D: 新增帳戶並設定狀態 W
    D-->>A: 存檔結果
    A-->>P: OK 或 FAIL
    P-->>B: 存檔結果
    B->>P: GET /bankacc/data?merchantId=...
    P->>A: GET /cp/bankacc/list?merchantId=...
    A->>D: 查詢商家帳戶
    D-->>A: 帳戶資料 JSON
    A-->>P: JSON 陣列
    P-->>B: 原樣回傳
    B-->>U: 顯示帳戶清單及狀態
```

註冊回應顯示於訊息區，隨後自動重查清單；清單依商家代碼完全相符查詢，不限制列數或排序。帳戶表沒有主鍵，重複資料可存在。對應 P-BNK-01～P-BNK-14、P-COM-16、P-COM-30～P-COM-32、P-API-01、P-API-02、P-API-04。

### SD-08 CSR 交易與退款查詢

```mermaid
sequenceDiagram
    autonumber
    actor U as 客服人員
    participant B as 瀏覽器
    participant P as Portal
    participant A as 後端 API
    participant D as 資料庫
    U->>B: 輸入門號並查詢
    B->>P: GET /csr/data?msisdn=...
    P->>A: GET /csr/trans?msisdn=...
    A->>D: 依 ACC_ID 查交易並依 TX_DT 遞減
    D-->>A: 交易資料
    A->>D: 依交易 TXID 查退款資料
    D-->>A: 退款資料
    A-->>P: 交易與退款 HTML 片段
    P-->>B: 原樣回傳
    B-->>U: 顯示交易表格、Refunds 與退款表格
```

CSR 查詢一次回傳交易及退款兩個表格，各自計算總筆數並最多列出 10 筆。兩段查詢可個別回傳查詢錯誤。對應 P-CSR-01～P-CSR-10、P-COM-15、P-COM-20～P-COM-29、P-API-01、P-API-02。

## 3. 活動圖 Activity Diagram

### AD-01 存取控制

```mermaid
flowchart TD
    S([收到請求]) --> L{已登入?}
    L -- 是 --> F[執行目標功能]
    L -- 否 --> K{請求類型}
    K -- 功能頁面 --> R[導向登入頁]
    K -- 報表資料 --> M[回傳文字 please login]
    K -- 條款或帳戶清單 --> E[回傳空陣列]
    F --> X([結束])
    R --> X
    M --> X
    E --> X
```

頁面請求與資料請求的未登入處理不同；登入後不再依角色授權。對應 P-COM-01～P-COM-06。

### AD-02 報表查詢與結果呈現

```mermaid
flowchart TD
    S([使用者送出查詢]) --> Q[結果區顯示查詢中]
    Q --> V{必要條件齊全?}
    V -- 否 --> H[回傳缺少參數錯誤]
    V -- 是 --> C[Portal 轉呼叫後端]
    C --> R{取得回應?}
    R -- 否 --> B[結果區顯示 backend error]
    R -- 是 --> T{回應為查詢錯誤?}
    T -- 是 --> E[結果區顯示 query error]
    T -- 否 --> D[結果區顯示表格與總筆數]
    H --> X([結束])
    B --> X
    E --> X
    D --> X
```

結果區在請求期間顯示等待文字，收到回應後整區取代。查詢可重複送出；回應以最後到達者為準。對應 P-COM-15、P-COM-17、P-COM-19～P-COM-28。

### AD-03 Portal 轉呼叫與錯誤處理

```mermaid
flowchart TD
    S([資料端點收到請求]) --> A{已登入?}
    A -- 否 --> U[依端點回傳 please login 或空陣列]
    A -- 是 --> P{GET 或 POST?}
    P -- GET --> G[串接查詢參數並呼叫後端]
    P -- POST --> F[以表單送出並呼叫後端]
    G --> R{呼叫成功?}
    F --> W{呼叫成功?}
    R -- 是 --> O[原樣回傳後端字串]
    R -- 否 --> E[回傳 backend error]
    W -- 是 --> O
    W -- 否 --> X1[回傳 FAIL]
    U --> Z([結束])
    O --> Z
    E --> Z
    X1 --> Z
```

GET 查詢回應由 Portal 原樣轉送；GET 連線失敗回 `backend error:`，POST 連線失敗回 `FAIL`。呼叫未設定逾時。對應 P-COM-13～P-COM-19、P-API-01、P-API-02。

### AD-04 服務條款狀態流程

```mermaid
flowchart TD
    S([開啟條款設定]) --> I[初始只顯示商家與查詢]
    I --> Q[查詢商家條款]
    Q --> R{回應為合法 JSON?}
    R -- 否 --> N[畫面維持原狀]
    R -- 是 --> D{有既有版本?}
    D -- 否 --> A[顯示版次 1 與新增表單]
    D -- 是 --> V[顯示最新內容與新版次按鈕]
    V --> C[建立新版次並填寫]
    A --> F[送出存檔]
    C --> F
    F --> M[顯示存檔結果並自動重查]
    M --> Q
    N --> E([結束])
```

既有版本只讀；存檔後重查，重查結果決定檢視或新增狀態，並清除短暫訊息。對應 P-TOS-01～P-TOS-16。

### AD-05 銀行帳戶新增與查詢

```mermaid
flowchart TD
    S([使用者輸入帳戶資料]) --> F[送出註冊]
    F --> R{後端存檔成功?}
    R -- 是 --> O[顯示 OK]
    R -- 否 --> E[顯示 FAIL 訊息]
    O --> Q[自動查詢商家帳戶清單]
    E --> Q
    Q --> J{清單為合法 JSON?}
    J -- 是 --> T[重繪完整帳戶表格]
    J -- 否 --> N[保留原清單且不顯示訊息]
    T --> X([結束])
    N --> X
```

註冊成功或失敗都會觸發清單查詢；註冊訊息不會被清單刷新清除。對應 P-BNK-01～P-BNK-14。

## 4. 資料模型 ER Model

```mermaid
erDiagram
    MWP_PAY_TRANS ||--o{ MWP_PAY_REFUND : "TXID 對應原交易"
    MWP_CP_RECON_DAILY_SUMMARY ||--o{ MWP_CP_RECON_DAILY_DETAIL : "RECON_ID 邏輯關聯"
    MWP_PAY_TRANS {
        VARCHAR2 TXID PK "交易序號"
        VARCHAR2 MERCHANT_ID "商家代碼"
        VARCHAR2 ACC_ID "門號"
        NUMBER AMOUNT "交易金額"
        VARCHAR2 TX_STATUS "交易狀態"
        VARCHAR2 TX_DT "交易時間"
        VARCHAR2 AUTH_DT "授權時間"
    }
    MWP_PAY_REFUND {
        VARCHAR2 TXID "原交易序號，可多筆"
        NUMBER AMOUNT "退款金額"
        VARCHAR2 REFUND_STATUS "退款狀態"
        VARCHAR2 REFUND_DATE "退款時間"
    }
    MWP_CP_RECON_DAILY_SUMMARY {
        VARCHAR RECON_ID PK "每日批次識別"
        VARCHAR2 MERCHANT_ID "商家代碼"
        VARCHAR2 RECON_RESULT_SUMMARY "對帳摘要"
        NUMBER DIFF_COUNT "差異筆數"
        VARCHAR2 CP_TX_DT "對帳日期"
    }
    MWP_CP_RECON_MONTHLY_SUMMARY {
        VARCHAR RECON_ID PK "每月批次識別"
        VARCHAR2 MERCHANT_ID "商家代碼"
        VARCHAR2 CP_TX_DT "月份首日"
        NUMBER CP_TOTAL_CONUT "商家端筆數"
        NUMBER NEWPAY_TOTAL_COUNT "new-pay 筆數"
    }
    MWP_CP_RECON_DAILY_DETAIL {
        VARCHAR RECON_ID "每日批次識別"
        NUMBER RECON_SEQ_NUM "明細序號"
        VARCHAR2 TXID "交易序號"
        VARCHAR2 RECON_RESULT "比對結果代碼"
        VARCHAR2 RECON_MESSAGE "比對訊息"
    }
    MWP_OLS_TOS {
        VARCHAR2 MERCHANT_ID "商家代碼，無 PK"
        NUMBER TOS_VERSION "條款版次"
        VARCHAR2 TOS_URL "條款網址"
        CLOB TOS_CONTENT "條款內容"
        VARCHAR2 TOS_START_DATE "生效日期"
    }
    MWP_MERCHANT_BANK_ACC {
        VARCHAR2 MERCHANT_ID "商家代碼，無 PK"
        VARCHAR2 BANK_CODE "銀行代碼"
        VARCHAR2 BANK_ACC "銀行帳號"
        VARCHAR2 CURRENCY "匯款幣別"
        VARCHAR2 STATUS "帳戶狀態"
    }
```

實體與欄位依 SRS 第 6.1 節；圖中 TXID 與 RECON_ID 關係用於說明查詢語意，並非所有資料表都有資料庫 FK 約束。MWP_OLS_TOS 與 MWP_MERCHANT_BANK_ACC 無主鍵；退款檔允許同一 TXID 多筆。

| 資料表 | 使用頁面 |
|---|---|
| MWP_PAY_TRANS | 交易報表、退款報表關聯、CSR 查詢 |
| MWP_PAY_REFUND | 退款報表、CSR 查詢 |
| MWP_CP_RECON_DAILY_SUMMARY | 對帳每日彙總 |
| MWP_CP_RECON_MONTHLY_SUMMARY | 對帳每月彙總 |
| MWP_CP_RECON_DAILY_DETAIL | 對帳差異明細 |
| MWP_OLS_TOS | 服務條款設定、用戶端條款讀取 |
| MWP_MERCHANT_BANK_ACC | 商家銀行帳戶註冊與清單 |

## 附錄 A 設計元素 ↔ SRS 條文 ↔ User Story 對照表

| 設計元素 | SRS 條文 | User Story |
|---|---|---|
| SD-01、AD-01 | P-COM-01～P-COM-06、P-LGN-01～P-LGN-09 | US-COM-01、US-LGN-01、US-LGN-02 |
| SD-02 | P-COM-07～P-COM-12、P-HOME-01～P-HOME-05 | US-COM-02、US-HOME-01 |
| SD-03 | P-RPT-01～P-RPT-13、P-COM-15～P-COM-29 | US-RPT-01～US-RPT-03 |
| SD-04 | P-RFD-01～P-RFD-07、P-COM-20～P-COM-29 | US-RFD-01、US-RFD-02 |
| SD-05 | P-RCN-01～P-RCN-12、P-COM-20～P-COM-29 | US-RCN-01～US-RCN-03 |
| SD-06、AD-04 | P-TOS-01～P-TOS-18、P-COM-30～P-COM-32 | US-TOS-01～US-TOS-03 |
| SD-07、AD-05 | P-BNK-01～P-BNK-14、P-COM-30～P-COM-32 | US-BNK-01、US-BNK-02 |
| SD-08 | P-CSR-01～P-CSR-10、P-COM-20～P-COM-29 | US-CSR-01、US-CSR-02 |
| ER Model | SRS 6.1～6.3 | US-RPT-02、US-RFD-02、US-RCN-01～US-RCN-03、US-TOS-01～US-TOS-03、US-BNK-01～US-BNK-02、US-CSR-01～US-CSR-02 |

## 附錄 B SRS 條文與系統設計對照

SRS 的 API 技術條文使用既有編號 P-API-01、P-API-02、P-API-04；原文件 API 條文編號有缺號。非功能需求 P-NFR-01～P-NFR-11 由部署、執行與測試環境承接，不另建立使用者流程圖。服務條款與銀行帳戶初始資料依 SRS 6.3，作為驗收環境資料，不另外建立系統實體。

| 條文 | 設計 |
|---|---|
| P-API-01、P-API-02、P-API-04 | SD-03～SD-08 |
| P-NFR-01～P-NFR-11 | SD-01、SD-02；測試條件見 user-stories.md |
| P-TOS-18、P-BNK-12 | SD-06、SD-07 |