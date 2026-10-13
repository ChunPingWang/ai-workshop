@report
Feature: 交易報表查詢 (US-RPT-01〜03, US-COM-03〜05, SRS 4.3、3.4〜3.6)
  身為 營運人員或商家，
  我想要 依日期、時段與商家查出交易明細，
  以便 掌握每天的收款狀況。

  # backend 回應見 mockoon/routes/report.json（GET /sa/report/trans）。
  # 觸發值：商家 E000002 0 筆／e000001 0 筆／E500000 後端 500／E404000 後端 404／E010000 剛好 10 筆／
  #        E011000 11 筆／E000BLD 含 <b>／含單引號 query error／清空商家 全部商家；
  #        日期清空 全部日期／日期 7 碼 0 筆／起日 20260917 迄日 20260916 0 筆／
  #        20260916 00〜23 整日區間；時間類型「授權時間」授權報表；其他 預設 3 筆。

  Background:
    Given 我以 "sa" 身分登入 Portal
    And 我在 "交易報表" 頁面

  # ---------- A 進入頁面 ----------

  Scenario: 頁面標題與分頁標題
    Then 頁面標題應該是 "交易報表查詢"
    And 瀏覽器分頁標題應該是 "交易報表查詢"
    And "商家" 欄應該可見
    And "時間類型" 欄應該可見

  Scenario Outline: 網址的報表類型為「<類型>」時顯示交易報表
    # P-RPT-12：只有剛好等於 refund 才是退款報表
    When 我以報表類型 "<類型>" 開啟報表頁
    Then 頁面標題應該是 "交易報表查詢"
    And "商家" 欄應該可見

    Examples:
      | 類型  |
      | trans |
      | TRANS |
      | abc   |

  @legacy
  Scenario: 網址的報表類型為大寫 REFUND 時仍顯示交易報表
    # 現況如此（P-RPT-12）：大小寫敏感，REFUND 不等於 refund
    When 我以報表類型 "REFUND" 開啟報表頁
    Then 頁面標題應該是 "交易報表查詢"
    And "商家" 欄應該可見

  Scenario: 網址未指定報表類型時顯示交易報表
    When 我以未指定報表類型的網址開啟報表頁
    Then 頁面標題應該是 "交易報表查詢"

  # ---------- B 初始狀態 ----------

  @smoke
  Scenario: 交易報表初始狀態
    Then "日期(起)" 欄應該是今天的日期
    And "日期(迄)" 欄應該是今天的日期
    And "時(起)" 應該選擇 "00"
    And "時(迄)" 應該選擇 "23"
    And "商家" 欄應該是 "E000001"
    And "時間類型" 應該選擇 "交易時間"
    And 結果區應該顯示 "請輸入條件查詢"
    And 頁面應該顯示提示 "畫面僅顯示10筆資料，其餘透過背景處理匯出CSV(匯出功能尚未提供)"

  Scenario: 日期欄是文字輸入框，提示輸入 8 碼日期
    Then "日期(起)" 欄應該是文字輸入框且提示 "yyyyMMdd"
    And "日期(迄)" 欄應該是文字輸入框且提示 "yyyyMMdd"

  Scenario Outline: 「<下拉>」有 24 個小時選項 00〜23
    Then "<下拉>" 的選項應該依序是 00 到 23 共 24 個

    Examples:
      | 下拉   |
      | 時(起) |
      | 時(迄) |

  Scenario: 時間類型有兩個選項
    Then "時間類型" 的選項應該依序是:
      | 交易時間 | 授權時間(只限OLS) |

  # ---------- E／G 查詢有資料 ----------

  @smoke
  Scenario: 查詢有資料時顯示交易明細表與總筆數
    When 我按下 "查詢"
    Then 結果表格的表頭應該依序是:
      | TXID | MERCHANT_ID | ACC_ID | AMOUNT | CURRENCY | TX_STATUS | TX_DT | AUTH_DT | BILL_CSPTIME | MEMO | MERCHANDIZE_NAME | REFERENCE |
    And 結果表格應該有 3 筆資料列
    And 結果區應該顯示 "total rows: 3"

  Scenario: 結果表格的內容原樣顯示代碼、14 碼時間與整數金額
    When 我按下 "查詢"
    Then 結果表格應該包含以下資料:
      | TXID           | MERCHANT_ID | AMOUNT | CURRENCY | TX_STATUS | TX_DT          | BILL_CSPTIME   |
      | T1789000000001 | E000001     | 100    | TWD      | D         | 20260916000000 | 20260917020000 |
      | T1789000000002 | E000001     | 200    | TWD      | A         | 20260916120000 | null           |
      | T1789000000003 | E000001     | 300    | TWD      | F         | 20260916180000 | null           |

  Scenario: 尚未請款的請款時間顯示 null
    When 我按下 "查詢"
    Then 結果表格中 TXID 為 "T1789000000002" 的 "BILL_CSPTIME" 應該是 "null"

  Scenario: 結果依交易時間由舊到新排列
    When 我按下 "查詢"
    Then 結果表格的 "TX_DT" 欄應該由小到大排列

  Scenario: 結果表格外觀
    When 我按下 "查詢"
    Then 結果表格的表頭應該是淡藍底色
    And 結果表格應該有灰色格線

  # ---------- E 筆數邊界 ----------

  Scenario Outline: 商家 <商家> 查出 <總筆數> 筆時畫面顯示 <畫面列數> 列
    When 我在 "商家" 欄輸入 "<商家>"
    And 我按下 "查詢"
    Then 結果表格應該有 <畫面列數> 筆資料列
    And 結果區應該顯示 "total rows: <總筆數>"

    Examples:
      | 商家    | 畫面列數 | 總筆數 |
      | E000001 | 3        | 3      |
      | E010000 | 10       | 10     |
      | E011000 | 10       | 11     |

  Scenario: 查無資料時顯示空表格與 total rows: 0
    When 我在 "商家" 欄輸入 "E000002"
    And 我按下 "查詢"
    Then 結果表格應該沒有表頭也沒有資料列
    And 結果區應該顯示 "total rows: 0"

  # ---------- C 商家欄 ----------

  Scenario: 清空商家欄時查出全部商家的交易
    # Portal 不帶 merchantId 給後端，mock 依此回傳含其他商家的資料
    When 我清空 "商家" 欄
    And 我按下 "查詢"
    Then 結果表格的 "MERCHANT_ID" 欄應該包含 "E000001" 與 "E000009"
    And 結果區應該顯示 "total rows: 4"

  Scenario: 商家代碼大小寫不符時查無資料
    When 我在 "商家" 欄輸入 "e000001"
    And 我按下 "查詢"
    Then 結果區應該顯示 "total rows: 0"

  @legacy
  Scenario: 商家欄含單引號時顯示 query error
    # 現況如此（P-COM-31、P-RPT-11）：後端以字串組 SQL，單引號造成語法錯誤
    When 我在 "商家" 欄輸入 "E000'SQL"
    And 我按下 "查詢"
    Then 結果區應該顯示以 "query error: " 開頭的訊息
    And 結果區應該顯示 "SQL="

  @legacy
  Scenario: 資料內容含網頁標記時會被當成格式呈現
    # 現況如此（P-COM-25）：欄位值不做 HTML 轉義
    When 我在 "商家" 欄輸入 "E000BLD"
    And 我按下 "查詢"
    Then 結果表格中的 "粗體商品" 應該以粗體呈現
    And 結果區不應該出現文字 "<b>"

  @legacy
  Scenario: 商家欄可以輸入任何商家代碼，商家身分也不受限制
    # 現況如此（P-RPT-13）：不依登入身分限制可查詢之商家
    Given 我以 "cp" 身分登入 Portal
    And 我在 "交易報表" 頁面
    When 我清空 "商家" 欄
    And 我按下 "查詢"
    Then 結果表格的 "MERCHANT_ID" 欄應該包含 "E000009"

  # ---------- C 日期與時段 ----------

  Scenario: 查 9/16 的 00 時到 23 時包含當天 23:59:59 的交易
    # mock 只在 from=2026091600、to=2026091623 時回此資料，順帶驗證 Portal 組出 10 碼區間
    When 我在 "日期(起)" 欄輸入 "20260916"
    And 我在 "日期(迄)" 欄輸入 "20260916"
    And 我在 "時(起)" 選擇 "00"
    And 我在 "時(迄)" 選擇 "23"
    And 我按下 "查詢"
    Then 結果表格的 "TX_DT" 欄應該包含 "20260916000000" 與 "20260916235959"

  @legacy
  Scenario: 起日晚於迄日時不提示錯誤，照常查詢並查無資料
    # 現況如此（P-RPT-09）
    When 我在 "日期(起)" 欄輸入 "20260917"
    And 我在 "日期(迄)" 欄輸入 "20260916"
    And 我按下 "查詢"
    Then 頁面不應該顯示任何錯誤提示
    And 結果區應該顯示 "total rows: 0"

  @legacy
  Scenario: 日期不是 8 碼時不提示錯誤，照常查詢並查無資料
    # 現況如此（P-RPT-09、P-COM-30）
    When 我在 "日期(起)" 欄輸入 "2026091"
    And 我按下 "查詢"
    Then 頁面不應該顯示任何錯誤提示
    And 結果區應該顯示 "total rows: 0"

  @legacy
  Scenario: 兩個日期欄都清空時查出全部日期的交易
    # 現況如此（P-RPT-09）：from=00、to=23 以字串比較涵蓋所有 14 碼時間
    When 我清空 "日期(起)" 欄
    And 我清空 "日期(迄)" 欄
    And 我按下 "查詢"
    Then 結果表格的 "TX_DT" 欄應該包含 "20260801100000" 與 "20261005090000"

  # ---------- C 時間類型 ----------

  Scenario: 時間類型選「授權時間」時改以授權時間篩選
    When 我在 "時間類型" 選擇 "授權時間(只限OLS)"
    And 我按下 "查詢"
    Then 結果表格的 "TXID" 欄應該包含 "T1789000000101" 與 "T1789000000102"

  @legacy
  Scenario: 選「授權時間」時結果仍依交易時間排序
    # 現況如此（P-RPT-07）：ORDER BY TX_DT，不改用 AUTH_DT
    When 我在 "時間類型" 選擇 "授權時間(只限OLS)"
    And 我按下 "查詢"
    Then 結果表格的 "TX_DT" 欄應該由小到大排列
    And 結果表格的 "AUTH_DT" 欄不是由小到大排列

  # ---------- D 按鈕與中間狀態 ----------

  Scenario: 按下查詢後結果回來前顯示「查詢中...」
    Given 後端回應會延遲
    When 我按下 "查詢"
    Then 結果區應該顯示 "查詢中..."
    And 最後結果區應該顯示 "total rows: 3"

  Scenario: 再次查詢時前次結果整個被取代
    When 我按下 "查詢"
    Then 結果表格應該有 3 筆資料列
    When 我在 "商家" 欄輸入 "E000002"
    And 我按下 "查詢"
    Then 結果區應該顯示 "total rows: 0"
    And 結果區不應該出現文字 "total rows: 3"

  @legacy
  Scenario: 連按兩次查詢時按鈕不停用，結果區只顯示最後一次的結果
    # 現況如此（P-COM-28）
    When 我連續按下 "查詢" 兩次
    Then 結果區應該只有 1 個結果表格
    And 結果區應該顯示 "total rows: 3"

  Scenario: 在商家欄按 Enter 不會送出查詢
    # 程式行為：查詢條件不在 form 內，Enter 沒有作用（AC 未寫，補列）
    When 我在 "商家" 欄按下 Enter
    Then 結果區應該顯示 "請輸入條件查詢"

  # ---------- E 錯誤回應 ----------

  Scenario Outline: 後端回 <狀態> 時結果區顯示 backend error
    When 我在 "商家" 欄輸入 "<商家>"
    And 我按下 "查詢"
    Then 結果區應該顯示以 "backend error: " 開頭的訊息
    And 結果區應該顯示 "<狀態>"

    Examples:
      | 商家    | 狀態 |
      | E500000 | 500  |
      | E404000 | 404  |

  @legacy
  Scenario: 後端遲遲沒有回應時結果區一直停在「查詢中...」
    # 現況如此（P-COM-17）：轉呼叫不設逾時
    Given 後端不會回應
    When 我按下 "查詢"
    Then 結果區應該持續顯示 "查詢中..."
