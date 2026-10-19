# Portal E2E 覆蓋矩陣

> 本版次只產生 **US-COM-01 登入後才能使用 Portal 功能**（SRS 3.1）的情境；其他 US 待後續以 `/gen-gherkin` 補上。
> Scenario 欄的檔名皆為 `login.feature`。Outline 的每一列各算一個情境。

## US-COM-01（登入與存取控制，P-COM-01／02／03／05／06）

| 維度 | US/AC | 情境 | Scenario | Mock 觸發 |
|---|---|---|---|---|
| A 進入 | US-COM-01 AC1 | 未登入開 首頁／交易報表／退款報表／對帳查詢／服務條款／銀行帳戶／CSR查詢 → 登入頁（7） | 未登入直接開啟<頁面>會被帶回登入頁 | — |
| A 進入 | US-COM-01 AC1 | 未登入開 `/report`（未指定類型）、`/report?type=unknown` → 登入頁（2） | 未登入開啟交易報表時不論報表類型… | — |
| I 跨頁 | US-COM-01 AC1 之外 | 未登入被導回登入頁 → 登入 → 進首頁，不回原本頁面（@legacy） | 未登入被帶回登入頁後，登入成功進入首頁… | — |
| H session | US-COM-01 AC1 之外 | 登入失敗不建立 session，之後開功能頁仍導回登入頁 | 登入失敗後仍無法開啟功能頁 | — |
| A 進入 | US-COM-01 AC1 之外 | 未登入開 `/;jsessionid=…` 會直接顯示首頁（帳號空白），但點功能頁仍導回登入頁（@legacy，與 P-COM-01 不符） | 未登入開啟帶 jsessionid 的首頁網址… | — |
| E 回應 | US-COM-01 AC2 | 登入失效後按查詢：交易報表、退款報表、對帳查詢、差異明細、CSR → 結果區 `please login`，仍停在原頁（5） | 登入失效後在<頁面>按「<按鈕>」… | 不打 backend |
| F 狀態 | US-COM-01 AC2 | 登入失效後查服務條款 → 當成尚無條款（版次 1、`(尚無服務條款)`、顯示存檔）（@legacy） | 登入失效後查詢服務條款… | 不打 backend |
| E 回應 | US-COM-01 AC2 | 登入失效後存檔服務條款 → 訊息區 `please login`，重查仍是尚無條款（@legacy） | 登入失效後存檔服務條款… | 不打 backend |
| G 呈現 | US-COM-01 AC2 | 登入失效後查已註冊帳戶 → 只有表頭的空表格（@legacy） | 登入失效後查詢已註冊帳戶… | 不打 backend |
| E 回應 | US-COM-01 AC2 | 登入失效後註冊銀行帳戶 → 訊息 `please login`＋清單只剩表頭（@legacy） | 登入失效後註冊銀行帳戶… | 不打 backend |
| H session | US-COM-01 AC2 之外 | 登入失效後重新整理功能頁 → 登入頁 | 登入失效後重新整理功能頁… | — |
| H session | US-COM-01 AC2 之外 | 登入失效後點導覽列切頁 → 登入頁 | 登入失效後從導覽列切換… | — |
| A 進入 | US-COM-01 AC3 | sa／cp／csr × 7 頁皆可開啟，標題正確（21） | 以 <帳號> 登入後可以開啟<頁面> | — |
| E 回應 | US-COM-01 AC3 | sa／cp／csr × 7 種查詢（交易、退款、對帳、差異明細、條款、帳戶清單、CSR）皆看得到結果（21，@legacy） | 以 <帳號> 登入後在<頁面>按「<按鈕>」… | report／recon／tos／bankacc／csr 各端點 default |
| D 動作 | US-COM-01 AC3 | sa／cp／csr 皆可存檔服務條款新版次 → `OK version=3`（3，@legacy） | 以 <帳號> 登入後可以存檔服務條款新版次 | routes/tos.json [存檔成功 version=3] |
| D 動作 | US-COM-01 AC3 | sa／cp／csr 皆可註冊銀行帳戶 → `OK`、清單有帳號（3，@legacy） | 以 <帳號> 登入後可以註冊銀行帳戶 | routes/bankacc.json default |
| H 導覽 | US-COM-01 AC4 | 首頁與 6 個功能頁的導覽列「登出」→ 登入頁（7） | 在<頁面>按登出回到登入頁 | — |
| H 導覽 | US-COM-01 AC4 | 登出後再開 7 頁 → 登入頁（7） | 登出後再開啟<頁面>會被帶回登入頁 | — |
| H 導覽 | US-COM-01 AC4 | 另一分頁登出後，開著的頁面按查詢 → `please login`：交易報表、對帳、CSR（3） | 在另一個分頁登出後，原本開著的<頁面>… | 不打 backend |
| H 導覽 | US-COM-01 AC4 | 另一分頁登出後，服務條款查詢 → 尚無條款（@legacy） | …服務條款頁查詢會當成尚無服務條款 | 不打 backend |
| H 導覽 | US-COM-01 AC4 | 另一分頁登出後，帳戶清單 → 只剩表頭（@legacy） | …銀行帳戶頁查詢清單只剩表頭 | 不打 backend |
| H 導覽 | US-COM-01 AC4 之外 | 沒登入時開 `/logout` → 登入頁（不出錯） | 沒有登入時按登出也會回到登入頁 | — |
| H 導覽 | US-COM-01 AC4 之外 | 登出後換 cp 登入 → 標題列顯示 cp | 登出後換另一個帳號登入… | — |
| H session | US-COM-01 AC5 | 同一帳號兩個瀏覽器同時登入並查詢 | 同一帳號可以同時在兩個瀏覽器登入並查詢 | routes/report.json default |
| H session | US-COM-01 AC5 | 瀏覽器 A 登出不影響 B | 在一個瀏覽器登出不影響另一個瀏覽器… | routes/report.json default |
| H session | US-COM-01 AC5 之外 | 不同帳號同時登入，各自顯示自己的帳號 | 不同帳號同時在兩個瀏覽器登入… | — |
| H session | US-COM-01 AC5 | 閒置 30 分鐘後失效 | 不以 E2E 驗證（測試內無法等待 30 分鐘、伺服器時鐘無法快轉）；以「我的登入已失效」（清 session cookie）模擬，見 AC2 情境 | — |
| H session | US-COM-01 AC4 之外 | 登出後按瀏覽器「上一頁」 | 不測：結果取決於瀏覽器快取（可能顯示快取頁或重新請求），無法穩定斷言 | — |
| B／C／G | — | US-COM-01 不涉及欄位預設值、輸入驗證、資料格式 | 由各頁面 US 覆蓋（待產生） | — |

**統計**：1 個 feature（login.feature）、**95 個情境**（AC1 12、AC2 11、AC3 48、AC4 21、AC5 3；@smoke 19、@legacy 35）；US-COM-01 的 5 條 AC 全部有情境，AC5「閒置 30 分鐘」以模擬方式覆蓋、不實際等待；2 項標記不測。
