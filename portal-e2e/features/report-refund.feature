@report-refund
Feature: 退款交易報表查詢 (US-RFD-01〜03, SRS 4.4)
  身為 營運人員或商家，
  我想要 依退款時間查出退款明細，
  以便 核對每天退給用戶的款項。

  # 與交易報表共用 report.html，差別由網址的報表類型 refund 決定。
  # backend 回應見 mockoon/routes/report.json（GET /sa/report/refund）。
  # 觸發值：日期(起) 2099… 0 筆／2095… 後端 500／20260601 且 Portal 未帶商家與時間類型 → TXCHECKOK；其他 預設 2 筆。

  Background:
    Given 我以 "sa" 身分登入 Portal
    And 我在 "退款報表" 頁面

  # ---------- A／B／F 進入頁面與初始狀態 ----------

  @smoke
  Scenario: 退款報表標題與隱藏欄位
    Then 頁面標題應該是 "退款交易報表查詢"
    And 瀏覽器分頁標題應該是 "交易報表查詢"
    And "商家" 欄應該隱藏
    And "時間類型" 欄應該隱藏

  Scenario: 退款報表初始狀態與交易報表相同
    Then "日期(起)" 欄應該是今天的日期
    And "日期(迄)" 欄應該是今天的日期
    And "時(起)" 應該選擇 "00"
    And "時(迄)" 應該選擇 "23"
    And 結果區應該顯示 "請輸入條件查詢"
    And 頁面應該顯示提示 "畫面僅顯示10筆資料，其餘透過背景處理匯出CSV(匯出功能尚未提供)"

  Scenario: 商家身分從導覽列進入退款報表
    Given 我以 "cp" 身分登入 Portal
    When 我點選導覽列的 "退款報表"
    Then 頁面標題應該是 "退款交易報表查詢"

  Scenario: 從交易報表切換到退款報表時欄位隨之隱藏
    When 我點選導覽列的 "交易報表"
    Then "商家" 欄應該可見
    When 我點選導覽列的 "退款報表"
    Then "商家" 欄應該隱藏
    And 頁面標題應該是 "退款交易報表查詢"

  # ---------- E／G 查詢有資料 ----------

  @smoke
  Scenario: 查詢有資料時顯示 6 欄退款明細
    When 我按下 "查詢"
    Then 結果表格的表頭應該依序是:
      | TXID | AMOUNT | REFUND_STATUS | REFUND_DATE | MEMO | AUTH_DT |
    And 結果表格應該有 2 筆資料列
    And 結果區應該顯示 "total rows: 2"

  Scenario: 每筆退款都帶出原交易的 OLS 單號與授權時間
    When 我按下 "查詢"
    Then 結果表格應該包含以下資料:
      | TXID           | AMOUNT | REFUND_STATUS | REFUND_DATE    | MEMO | AUTH_DT        |
      | T1789000000001 | 100    | D             | 20260916100000 | C001 | 20260916000000 |
      | T1789000000003 | 300    | D             | 20260916200000 | C003 | 20260916180000 |

  Scenario: 結果依退款時間由舊到新排列
    When 我按下 "查詢"
    Then 結果表格的 "REFUND_DATE" 欄應該由小到大排列

  @mock
  Scenario: 退款報表不帶商家與時間類型條件給後端
    # 隱藏欄位的值（E000001、tx）仍送到 Portal，但 Portal 轉呼叫退款 API 時不帶；
    # mock 只在「from 為 20260601… 且沒有 merchantId、timeType」時回 TXCHECKOK
    When 我在 "日期(起)" 欄輸入 "20260601"
    And 我在 "日期(迄)" 欄輸入 "20260601"
    And 我按下 "查詢"
    Then 結果表格的 "TXID" 欄應該包含 "TXCHECKOK"

  # ---------- E 查無資料與錯誤 ----------

  Scenario: 查無資料時顯示空表格與 total rows: 0
    When 我在 "日期(起)" 欄輸入 "20990101"
    And 我在 "日期(迄)" 欄輸入 "20990101"
    And 我按下 "查詢"
    Then 結果表格應該沒有表頭也沒有資料列
    And 結果區應該顯示 "total rows: 0"

  Scenario: 後端錯誤時結果區顯示 backend error
    When 我在 "日期(起)" 欄輸入 "20950101"
    And 我按下 "查詢"
    Then 結果區應該顯示以 "backend error: " 開頭的訊息

  Scenario: 按下查詢後結果回來前顯示「查詢中...」
    Given 後端回應會延遲
    When 我按下 "查詢"
    Then 結果區應該顯示 "查詢中..."
    And 最後結果區應該顯示 "total rows: 2"
