@recon
Feature: OLS 對帳查詢 (US-RCN-01～03、US-COM-03～04，SRS 3.4～3.6、4.5)
  身為營運人員
  我想要選擇每日或每月對帳並設定日期範圍
  以便找到要核對的對帳批次

  Background:
    Given 我以 "sa" 身分登入 Portal
    And 我在對帳查詢頁

  @smoke
  Scenario: 對帳頁顯示預設查詢條件
    Then 對帳類型應為每日對帳
    And 起日與迄日應分別為 "20000101" 與 "20991231"
    And 彙總區應顯示 "請輸入條件查詢"
    And 批次識別欄應為空白且差異明細區應為空白

  @mock
  Scenario: 查詢每日對帳並閱讀一致與有差異的摘要
    # Mockoon: routes/recon.json，GET /sa/report/reconDaily 預設回兩筆
    When 我以每日對帳查詢預設日期範圍
    Then 彙總表應顯示每日批次 "R20260915" 與 "R20260916"
    And 每日批次應依日期由早到晚排列
    And 結果應顯示一致標記 "Y"、差異標記 "N" 與差異筆數 "1"

  @mock
  Scenario: 查詢每月對帳
    # Mockoon: routes/recon.json，GET /sa/report/reconMonthly 預設回 M202608
    When 我選擇每月對帳並查詢
    Then 彙總表應顯示批次 "M202608" 與日期 "20260801"
    And 每月彙總應顯示七個規定欄位

  @mock
  Scenario: 每日彙總查無資料
    # Mockoon: routes/recon.json，每日查詢起日設為 20990101
    When 我將起日設為 "20990101" 並查詢每日對帳
    Then 彙總區應顯示空表格與 "total rows: 0"

  @mock
  Scenario: 每月彙總查無資料
    # Mockoon: routes/recon.json，每月查詢起日設為 20990101
    When 我將起日設為 "20990101" 並查詢每月對帳
    Then 彙總區應顯示空表格與 "total rows: 0"

  @mock
  Scenario: 依每日批次識別查詢差異明細
    # Mockoon: routes/recon.json，reconId=R20260916
    When 我輸入批次識別 "R20260916" 並查差異明細
    Then 差異表應包含以下資料:
      | RECON_ID  | RECON_SEQ_NUM | MERCHANT_ID | BILLING_AGREEMENT_ID | CORRELATION_ID | SQE_NUM | TXID           | STATUS  | ITEM_PRICE | TAX | TOTAL_AMOUNT | ROUND_AMOUNT | CURRENCY | LAST_EVENT | TIMESTAMP      | EVENT_RESPONSE | EVENT_RESPONSE_DESCRIPTION | CREATE_TIME    | RECON_RESULT | RECON_MESSAGE       |
      | R20260916 | 1             | E000001     | TELCO_TW             | C002           | 1       | T202609160002  | Charged | 250000000  | 0   | 250          | 250          | TWD      | CHARGE     | 20260916110000 | OK             | Success                     | 20260916120000 | 104          | Amount not match    |
    And 差異結果應按明細序號排列

  @mock
  Scenario: 完全一致的每日批次沒有差異明細
    # Mockoon: routes/recon.json，預設空明細以 R20260915 觸發
    When 我輸入批次識別 "R20260915" 並查差異明細
    Then 差異區應顯示空表格與 "total rows: 0"

  @mock
  Scenario: 每月批次沒有每日差異明細
    # Mockoon: routes/recon.json，reconId=M202608
    When 我輸入批次識別 "M202608" 並查差異明細
    Then 差異區應顯示空表格與 "total rows: 0"

  @mock
  Scenario: 批次識別空白仍會送出查詢
    # Mockoon: routes/recon.json，空識別回預設空明細
    When 我清空批次識別並查差異明細
    Then 差異區應顯示 "total rows: 0"
    And 畫面不應出現批次識別必填提示

  Scenario: 彙總與差異明細查詢互不清除
    When 我先查每日彙總並查詢批次 "R20260916" 的差異
    Then 彙總結果與差異明細應同時保留
    When 我切換為每月對帳
    Then 日期、彙總結果與差異明細應仍保留

  @mock
  Scenario Outline: 對帳 API 錯誤顯示於對應結果區
    # Mockoon: routes/recon.json，依日期或批次識別觸發後端錯誤
    When 我以 "<觸發值>" 查詢 "<查詢種類>"
    Then "<結果區>" 應包含 "backend error:"

    Examples:
      | 觸發值   | 查詢種類 | 結果區   |
      | 20999999 | 每日彙總 | 彙總區   |
      | 20999999 | 每月彙總 | 彙總區   |
      | R5000000 | 差異明細 | 差異區   |
      | 20999888 | 每日彙總 | 彙總區   |
      | R4040000 | 差異明細 | 差異區   |

  Scenario: CP 帳號仍可進入對帳頁
    When 我以 "cp" 身分重新登入並開啟對帳查詢
    Then 我應看見 OLS 對帳結果查詢頁