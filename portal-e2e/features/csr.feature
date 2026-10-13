@csr
Feature: CSR 交易查詢 (US-CSR-01〜03, SRS 4.8)
  身為 客服人員，
  我想要 輸入用戶的門號，就在同一畫面看到他的交易與退款紀錄，
  以便 在電話中立即回答用戶對扣款與退款的詢問。

  # backend 回應見 mockoon/routes/csr.json（GET /csr/trans）。
  # 觸發值：0900000000 查無資料／0950000000 後端 500／0910000010 11 筆交易／0922222222 有交易無退款／
  #        含單引號 query error／空白或不是 10 碼數字 0 筆；其他 2 筆交易＋1 筆退款。

  Background:
    Given 我以 "csr" 身分登入 Portal
    And 我在 "CSR查詢" 頁面

  # ---------- A／B 初始狀態 ----------

  @smoke
  Scenario: CSR 查詢初始狀態
    Then 頁面標題應該是 "查詢 new-pay 交易紀錄 (CSR Portal)"
    And 瀏覽器分頁標題應該是 "CSR 交易查詢"
    And "門號" 欄應該是 "0912345678"
    And 結果區應該顯示 "請輸入門號查詢"
    And 頁面應該顯示提示 "含退款紀錄與授權時間; OLS 交易可看到商品名稱(PaymentDescription)與商家資訊(MerchantContact)"

  # ---------- E／G 查詢有資料 ----------

  @smoke
  Scenario: 查詢門號時同時顯示交易表與退款表
    When 我按下 "查詢"
    Then 交易表格的表頭應該依序是:
      | TXID | AMOUNT | TX_STATUS | TX_DT | AUTH_DT | MERCHANDIZE_NAME | REFERENCE | RETURN_CODE |
    And 交易表格應該有 2 筆資料列
    And 結果區應該顯示文字 "Refunds:" 與分隔線
    And 退款表格的表頭應該依序是:
      | TXID | MERCHANT_ID | AMOUNT | REFUND_STATUS | REFUND_DATE | CREATE_TIME | RETURN_CODE | RETURN_MSG |
    And 退款表格應該有 1 筆資料列
    And 結果區應該有 2 個 total rows，依序是 "total rows: 2" 與 "total rows: 1"

  Scenario: 最新的交易排在最上面
    When 我按下 "查詢"
    Then 交易表格的 "TX_DT" 欄應該由大到小排列

  Scenario: 交易表顯示商品名稱與商家聯絡資訊
    When 我按下 "查詢"
    Then 交易表格應該包含以下資料:
      | TXID           | MERCHANDIZE_NAME | REFERENCE       |
      | T1789000000003 | 電子書           | dev@onlinestore |
      | T1789000000001 | 遊戲點數100點    | dev@onlinestore |

  Scenario: 狀態與回應代碼原樣顯示，沒有值時顯示 null
    When 我按下 "查詢"
    Then 交易表格應該包含以下資料:
      | TXID           | TX_STATUS | RETURN_CODE    |
      | T1789000000003 | F         | Request Cancel |
      | T1789000000001 | D         | null           |
    And 退款表格應該包含以下資料:
      | TXID           | REFUND_STATUS | RETURN_CODE | RETURN_MSG |
      | T1789000000001 | D             | 00000000    | null       |

  Scenario: 交易超過 10 筆時交易表只顯示 10 列
    When 我在 "門號" 欄輸入 "0910000010"
    And 我按下 "查詢"
    Then 交易表格應該有 10 筆資料列
    And 結果區應該有 2 個 total rows，依序是 "total rows: 11" 與 "total rows: 0"

  # ---------- E 查無資料 ----------

  Scenario: 門號查無交易時兩個表都是空表格
    When 我在 "門號" 欄輸入 "0900000000"
    And 我按下 "查詢"
    Then 交易表格應該沒有表頭也沒有資料列
    And 退款表格應該沒有表頭也沒有資料列
    And 結果區應該顯示文字 "Refunds:" 與分隔線
    And 結果區應該有 2 個 total rows，依序是 "total rows: 0" 與 "total rows: 0"

  Scenario: 有交易但沒有退款時只有退款表是空的
    When 我在 "門號" 欄輸入 "0922222222"
    And 我按下 "查詢"
    Then 交易表格應該有 1 筆資料列
    And 退款表格應該沒有表頭也沒有資料列

  # ---------- C 門號欄 ----------

  @legacy
  Scenario Outline: 門號<情況>時仍會送出查詢，結果 0 筆且不提示
    # 現況如此（P-CSR-08、P-COM-30）
    When 我在 "門號" 欄輸入 "<門號>"
    And 我按下 "查詢"
    Then 頁面不應該顯示任何錯誤提示
    And 結果區應該有 2 個 total rows，依序是 "total rows: 0" 與 "total rows: 0"

    Examples:
      | 情況         | 門號       |
      | 空白         |            |
      | 不足 10 碼   | 09123      |
      | 含英文       | 09ABCDEFGH |

  @legacy
  Scenario: 門號含單引號時顯示 query error
    # 現況如此（P-CSR-10、P-COM-31）：兩段 SQL 各自 try/catch
    When 我在 "門號" 欄輸入 "09'123"
    And 我按下 "查詢"
    Then 結果區應該顯示以 "query error: " 開頭的訊息
    And 結果區應該顯示文字 "Refunds:" 與分隔線

  # ---------- D 按鈕 ----------

  Scenario: 按下查詢後結果回來前顯示「查詢中...」
    Given 後端回應會延遲
    When 我按下 "查詢"
    Then 結果區應該顯示 "查詢中..."
    And 最後結果區應該顯示 "Refunds:"

  Scenario: 換門號再查詢時前次結果被取代
    When 我按下 "查詢"
    Then 交易表格應該有 2 筆資料列
    When 我在 "門號" 欄輸入 "0900000000"
    And 我按下 "查詢"
    Then 交易表格應該沒有表頭也沒有資料列

  # ---------- E 錯誤 ----------

  Scenario: 後端錯誤時結果區顯示 backend error
    When 我在 "門號" 欄輸入 "0950000000"
    And 我按下 "查詢"
    Then 結果區應該顯示以 "backend error: " 開頭的訊息
