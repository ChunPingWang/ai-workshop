@recon
Feature: OLS 對帳結果查詢 (US-RCN-01〜04, SRS 4.5)
  身為 財務人員，
  我想要 依日期區間查出每天與每月與 OLS 的對帳結果，並針對有差異的對帳日查出不一致的明細，
  以便 確認帳是否一致，並找出是哪幾筆交易對不上、原因是什麼。

  # backend 回應見 mockoon/routes/recon.json。
  # 每日彙總：區間(起) 20990101 0 筆／20999999 後端 500／含非數字 0 筆／20250101 12 筆；其他 R20260915（一致）、R20260916（有差異）。
  # 每月彙總：區間(起) 20990101 0 筆；其他 M202608 一筆。
  # 差異明細：R20260916 1 筆（104）／R20260917 9 種代碼各一筆／R99999999 後端 500；其他（含 R20260915、M202608、空白）0 筆。

  Background:
    Given 我以 "sa" 身分登入 Portal
    And 我在 "對帳查詢" 頁面

  # ---------- A／B 進入頁面與初始狀態 ----------

  @smoke
  Scenario: 對帳查詢初始狀態
    Then 頁面標題應該是 "OLS 對帳結果查詢 (SA Portal)"
    And 瀏覽器分頁標題應該是 "OLS 對帳結果查詢"
    And "類型" 應該選擇 "每日對帳"
    And "區間(起)" 欄應該是 "20000101"
    And "區間(迄)" 欄應該是 "20991231"
    And 結果區應該顯示 "請輸入條件查詢"
    And "對帳批次編號" 欄應該是空的且提示 "R20260915"
    And 明細區應該是空白
    And 頁面應該顯示提示 "畫面註記：要看完整的交易資料，需在二天後，例如要看1/1的對帳資料，要在1/3才能查詢得到"

  Scenario: 類型有每日與每月兩個選項
    Then "類型" 的選項應該依序是:
      | 每日對帳 | 每月對帳 |

  # ---------- E／G 每日對帳彙總 ----------

  @smoke
  Scenario: 查詢每日對帳彙總
    When 我按下 "查詢"
    Then 結果表格的表頭應該依序是:
      | RECON_ID | MERCHANT_ID | RECON_RESULT_SUMMARY | DIFF_COUNT | CP_TX_DT | CP_TOTAL_CONUT | NEWPAY_TOTAL_COUNT | CP_FILE_NAME |
    And 結果表格應該有 2 筆資料列
    And 結果區應該顯示 "total rows: 2"

  Scenario: 每日對帳結果顯示一致與差異
    When 我按下 "查詢"
    Then 結果表格應該包含以下資料:
      | RECON_ID  | RECON_RESULT_SUMMARY | DIFF_COUNT | CP_TX_DT | CP_TOTAL_CONUT | NEWPAY_TOTAL_COUNT |
      | R20260915 | Y                    | 0          | 20260915 | 3              | 3                  |
      | R20260916 | N                    | 1          | 20260916 | 4              | 4                  |
    And 結果表格的 "CP_TX_DT" 欄應該由小到大排列

  @legacy
  Scenario: OLS 檔案筆數的表頭沿用資料表的拼字
    # 現況如此（P-RCN-02）：欄名 CP_TOTAL_CONUT 拼字依資料表
    When 我按下 "查詢"
    Then 結果表格的表頭應該包含 "CP_TOTAL_CONUT"

  Scenario: 每日對帳查無資料
    When 我在 "區間(起)" 欄輸入 "20990101"
    And 我按下 "查詢"
    Then 結果表格應該沒有表頭也沒有資料列
    And 結果區應該顯示 "total rows: 0"

  Scenario: 每日對帳超過 10 筆時畫面只顯示 10 列
    When 我在 "區間(起)" 欄輸入 "20250101"
    And 我按下 "查詢"
    Then 結果表格應該有 10 筆資料列
    And 結果區應該顯示 "total rows: 12"

  @legacy
  Scenario: 區間輸入非數字時不提示錯誤，照常查詢並查無資料
    # 現況如此（P-COM-30）
    When 我在 "區間(起)" 欄輸入 "abc"
    And 我按下 "查詢"
    Then 頁面不應該顯示任何錯誤提示
    And 結果區應該顯示 "total rows: 0"

  Scenario: 每日對帳後端錯誤時顯示 backend error
    When 我在 "區間(起)" 欄輸入 "20999999"
    And 我按下 "查詢"
    Then 結果區應該顯示以 "backend error: " 開頭的訊息

  Scenario: 按下查詢後結果回來前顯示「查詢中...」
    Given 後端回應會延遲
    When 我按下 "查詢"
    Then 結果區應該顯示 "查詢中..."
    And 最後結果區應該顯示 "total rows: 2"

  # ---------- E／G 每月對帳彙總 ----------

  @smoke
  Scenario: 查詢每月對帳彙總
    When 我在 "類型" 選擇 "每月對帳"
    And 我按下 "查詢"
    Then 結果表格的表頭應該依序是:
      | RECON_ID | MERCHANT_ID | CP_TX_DT | CP_TOTAL_CONUT | NEWPAY_TOTAL_COUNT | CP_DETAIL_FILE_NAME | CP_SUMMARY_FILE_NAME |
    And 結果表格應該包含以下資料:
      | RECON_ID | CP_TX_DT | CP_SUMMARY_FILE_NAME |
      | M202608  | 20260801 | null                 |
    And 結果區應該顯示 "total rows: 1"

  Scenario: 每月對帳沒有對帳結果與差異筆數欄
    When 我在 "類型" 選擇 "每月對帳"
    And 我按下 "查詢"
    Then 結果表格的表頭不應該包含 "RECON_RESULT_SUMMARY"
    And 結果表格的表頭不應該包含 "DIFF_COUNT"

  Scenario: 每月對帳查無資料
    When 我在 "類型" 選擇 "每月對帳"
    And 我在 "區間(起)" 欄輸入 "20990101"
    And 我按下 "查詢"
    Then 結果區應該顯示 "total rows: 0"

  # ---------- F 類型切換與兩個結果區 ----------

  Scenario: 切換類型不會清除區間、彙總結果與差異明細
    When 我在 "區間(起)" 欄輸入 "20260901"
    And 我按下 "查詢"
    And 我在 "對帳批次編號" 欄輸入 "R20260916"
    And 我按下 "查差異明細"
    And 我在 "類型" 選擇 "每月對帳"
    Then "區間(起)" 欄應該是 "20260901"
    And 結果區應該顯示 "total rows: 2"
    And 明細區應該顯示 "total rows: 1"

  Scenario: 查差異明細不會清除彙總結果
    When 我按下 "查詢"
    And 我在 "對帳批次編號" 欄輸入 "R20260916"
    And 我按下 "查差異明細"
    Then 結果區應該顯示 "total rows: 2"
    And 明細區應該顯示 "total rows: 1"

  Scenario: 重新查詢彙總不會清除差異明細
    When 我在 "對帳批次編號" 欄輸入 "R20260916"
    And 我按下 "查差異明細"
    And 我在 "類型" 選擇 "每月對帳"
    And 我按下 "查詢"
    Then 結果區應該顯示 "total rows: 1"
    And 明細區應該顯示 "total rows: 1"

  # ---------- E／G 差異明細 ----------

  @smoke
  Scenario: 查詢有差異的對帳日明細
    When 我在 "對帳批次編號" 欄輸入 "R20260916"
    And 我按下 "查差異明細"
    Then 明細表格的表頭應該依序是:
      | RECON_ID | RECON_SEQ_NUM | MERCHANT_ID | BILLING_AGREEMENT_ID | CORRELATION_ID | SQE_NUM | TXID | STATUS | ITEM_PRICE | TAX | TOTAL_AMOUNT | ROUND_AMOUNT | CURRENCY | LAST_EVENT | TIMESTAMP | EVENT_RESPONSE | EVENT_RESPONSE_DESCRIPTION | CREATE_TIME | RECON_RESULT | RECON_MESSAGE |
    And 明細表格應該包含以下資料:
      | RECON_ID  | TXID           | RECON_RESULT | RECON_MESSAGE    |
      | R20260916 | T1789000000002 | 104          | Amount not match |
    And 明細區應該顯示 "total rows: 1"

  Scenario: 按下查差異明細後結果回來前顯示「查詢中...」
    Given 後端回應會延遲
    When 我在 "對帳批次編號" 欄輸入 "R20260916"
    And 我按下 "查差異明細"
    Then 明細區應該顯示 "查詢中..."
    And 最後明細區應該顯示 "total rows: 1"

  Scenario: 對帳完全一致的日期沒有差異明細
    When 我在 "對帳批次編號" 欄輸入 "R20260915"
    And 我按下 "查差異明細"
    Then 明細表格應該沒有表頭也沒有資料列
    And 明細區應該顯示 "total rows: 0"

  Scenario Outline: 差異明細代碼 <代碼> 顯示訊息「<訊息>」
    When 我在 "對帳批次編號" 欄輸入 "R20260917"
    And 我按下 "查差異明細"
    Then 明細表格中 "RECON_RESULT" 為 "<代碼>" 的 "RECON_MESSAGE" 應該是 "<訊息>"

    Examples:
      | 代碼 | 訊息                    |
      | 101  | No new-pay mapping data |
      | 102  | No OLS data             |
      | 103  | Status not match        |
      | 104  | Amount not match        |
      | 105  | Timestamp not match     |
      | 201  | No new-pay mapping data |
      | 202  | No OLS data             |
      | 204  | Amount not match        |
      | 205  | Timestamp not match     |

  Scenario: 差異明細依序號排列
    When 我在 "對帳批次編號" 欄輸入 "R20260917"
    And 我按下 "查差異明細"
    Then 明細表格的 "SQE_NUM" 欄應該由小到大排列
    And 明細區應該顯示 "total rows: 9"

  @legacy
  Scenario: 輸入每月對帳批次編號查差異明細一定查無資料
    # 現況如此（P-RCN-08）：只查每日明細表，畫面沒有每月差異明細
    When 我在 "對帳批次編號" 欄輸入 "M202608"
    And 我按下 "查差異明細"
    Then 明細區應該顯示 "total rows: 0"

  @legacy
  Scenario: 對帳批次編號留空也會送出查詢，結果為 0 筆且不提示
    # 現況如此（P-RCN-09）
    When 我按下 "查差異明細"
    Then 頁面不應該顯示任何錯誤提示
    And 明細區應該顯示 "total rows: 0"

  Scenario: 差異明細後端錯誤時明細區顯示 backend error
    When 我在 "對帳批次編號" 欄輸入 "R99999999"
    And 我按下 "查差異明細"
    Then 明細區應該顯示以 "backend error: " 開頭的訊息
    And 結果區應該顯示 "請輸入條件查詢"
