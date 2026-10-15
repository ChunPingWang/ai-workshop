@csr
Feature: CSR 交易與退款查詢 (US-CSR-01～02、US-COM-02～03，SRS 3.1～3.4、4.8)
  身為客服人員
  我想要以門號查詢交易與退款紀錄
  以便回應客戶的交易問題

  Background:
    Given 我以 "csr" 身分登入 Portal
    And 我在 CSR 交易查詢頁

  @smoke @mock
  Scenario: 依門號顯示交易及退款表格
    # Mockoon: routes/csr.json，預設回兩筆交易與一筆退款
    Then 門號欄應為 "0912345678"
    And 結果區初始文字應為 "請輸入門號查詢"
    When 我按下查詢
    Then 交易結果表應依交易時間新到舊排列
    And 退款結果表應包含原交易的退款
    And 兩個表格應各自顯示總筆數

  @mock
  Scenario: 交易與退款表格欄位及狀態原樣呈現
    # Mockoon: routes/csr.json 預設資料包含 null、狀態碼與取消代碼
    When 我按下查詢
    Then 交易表格應有八個規定欄位
    And 退款表格應有八個規定欄位
    And 狀態與回應代碼應保留原代碼且空值顯示 "null"
    And 商品名稱與商家資訊應顯示於交易結果

  @mock
  Scenario: 門號沒有交易時兩張表格都顯示零筆
    # Mockoon: routes/csr.json，msisdn=0900000000
    When 我將門號設為 "0900000000" 並查詢
    Then 交易表格與退款表格都應顯示 "total rows: 0"
    And 兩張表格之間仍應顯示 "Refunds:"

  @mock
  Scenario: 有交易但沒有退款時只顯示空退款表格
    # Mockoon: routes/csr.json，msisdn=0910000010 回 11 筆交易與 0 筆退款
    When 我將門號設為 "0910000010" 並查詢
    Then 交易結果最多顯示十筆且總筆數為 "11"
    And 退款表格應顯示 "total rows: 0"

  @mock @legacy
  Scenario Outline: 空白或格式不符的門號仍送出查詢
    # 現況如此；Mockoon: routes/csr.json，空值、BADNUMBER 與 9 碼值皆回兩張空表
    When 我將門號設為 "<門號>" 並查詢
    Then 交易與退款結果都應顯示 "total rows: 0"
    And 畫面不應出現門號格式錯誤提示

    Examples:
      | 門號      |
      |           |
      | BADNUMBER |
      | 090000000 |

  @mock
  Scenario: CSR 後端無法連線時顯示錯誤
    # Mockoon: routes/csr.json，msisdn=0950000000 回 HTTP 500
    When 我將門號設為 "0950000000" 並查詢
    Then 結果區應包含 "backend error:"

  @mock
  Scenario: CSR 查詢 SQL 錯誤時顯示查詢錯誤
    # Mockoon: routes/csr.json，msisdn=0900000001
    When 我將門號設為 "0900000001" 並查詢
    Then 結果區應包含 "query error:"

  @legacy
  Scenario: CSR 頁面標題保留目前實作文字
    # User Story 記錄此處與 SRS 不符；目前 template title 為「CSR 交易查詢」
    Then 瀏覽器頁面標題應為 "CSR 交易查詢"

  Scenario: 其他登入角色也可開啟 CSR 查詢
    When 我以 "cp" 身分重新登入並開啟 CSR 交易查詢
    Then 我應看見 CSR 交易查詢頁面