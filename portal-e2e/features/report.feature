@report
Feature: 交易與退款報表 (US-RPT-01～03、US-RFD-01～02、US-COM-03～04，SRS 3.3～3.6、4.3～4.4)
  身為營運人員或商家
  我想要依日期、時段與商家查出交易明細
  以便掌握每天的收款狀況

  Background:
    Given 我以 "sa" 身分登入 Portal
    And 我在交易報表頁

  @smoke
  Scenario: 交易報表載入初始條件
    Then 起日與迄日應為瀏覽器當日
    And 起始小時應為 "00" 且結束小時應為 "23"
    And 商家欄應為 "E000001" 且時間類型為交易時間
    And 兩個小時選單各應有 24 個從 "00" 到 "23" 的選項
    And 結果區應顯示 "請輸入條件查詢"

  Scenario: 查詢交易明細並保留指定欄位及排序
    When 我按下查詢
    Then 結果表格應該包含以下資料:
      | TXID           | MERCHANT_ID | ACC_ID     | AMOUNT | CURRENCY | TX_STATUS | TX_DT          | AUTH_DT        | BILL_CSPTIME   | MEMO | MERCHANDIZE_NAME | REFERENCE              |
      | T202609160001  | E000001     | 0912345678 | 100    | TWD      | D         | 20260916090000 | 20260916090002 | 20260916100000 | C001 | 線上商店商品     | support@example.test   |
      | T202609160002  | E000001     | 0912345678 | 250    | TWD      | A         | 20260916110000 | 20260916110003 | null           | C002 | 月租服務         | support@example.test   |
      | T202609160003  | E000001     | 0922222222 | 50     | TWD      | F         | 20260916120000 | null           | null           | C003 | 加值服務         | support@example.test   |
    And 結果區應顯示 "total rows: 3"
    And 交易時間應由早到晚排列且空值顯示 "null"

  Scenario: 交易時間類型以 TX_DT 篩選而商家條件可清空
    When 我清空商家欄並以交易時間查詢
    Then 查詢結果應包含不同商家的交易資料
    And 查詢結果仍依交易時間由早到晚排列

  @mock
  Scenario: 授權時間類型顯示 OLS 授權資料
    # Mockoon: routes/report.json，timeType=auth
    When 我選擇授權時間並按查詢
    Then 結果表格應顯示授權時間範例交易
    And 空的欄位應顯示 "null"

  @mock
  Scenario: 查詢範圍包含所選日期的最後一秒
    # Mockoon: routes/report.json，起日 20260918、迄日 20260918
    When 我將起日與迄日設為 "20260918" 並選擇 "00" 到 "23" 後查詢
    Then 結果應包含交易時間 "20260918235959"

  @mock
  Scenario: 清空商家代碼時查詢全部商家
    # Mockoon: routes/report.json，未帶 merchantId 觸發查全部商家的資料集
    When 我清空商家欄並按查詢
    Then 查詢結果應包含商家 "E000001" 與 "E000002" 的資料

  Scenario: 非退款類型值仍呈現交易報表
    When 我以未支援的報表類型開啟報表頁
    Then 頁面標題應為 "交易報表查詢"
    And 商家與時間類型欄位應顯示

  @mock
  Scenario: 顯示查無交易的空表格
    # Mockoon: routes/report.json，merchantId=E000002
    When 我將商家欄設為 "E000002" 並按查詢
    Then 結果應顯示空表格
    And 結果區應顯示 "total rows: 0"

  @mock
  Scenario Outline: 交易報表最多顯示十筆並保留總筆數
    # Mockoon: routes/report.json，merchantId 使用下列測試值
    When 我將商家欄設為 "<商家>" 並按查詢
    Then 結果表格應有 <畫面列數> 筆資料列
    And 結果區應顯示 "total rows: <總筆數>"

    Examples:
      | 商家    | 畫面列數 | 總筆數 |
      | E010000 | 10       | 10     |
      | E011000 | 10       | 11     |

  @mock
  Scenario Outline: 後端錯誤以結果文字呈現
    # Mockoon: routes/report.json，測試商家分別觸發 HTTP 錯誤或 SQL 錯誤
    When 我將商家欄設為 "<商家>" 並按查詢
    Then 結果區應包含 "<錯誤前綴>"

    Examples:
      | 商家    | 錯誤前綴       |
      | E500000 | backend error: |
      | E404000 | backend error: |
      | E000SQL | query error:   |

  @mock @legacy
  Scenario Outline: 日期格式錯誤或起日晚於迄日仍送出查詢
    # 現況如此；Mockoon: routes/report.json，日期條件會回空結果而不是前端驗證訊息
    When 我將起日設為 "<起日>" 並將迄日設為 "<迄日>" 後查詢
    Then 查詢結果應顯示 "<總筆數>"
    And 畫面不應出現日期格式錯誤提示

    Examples:
      | 起日     | 迄日     | 總筆數        |
      | 20260917 | 20260916 | total rows: 0 |
      | BADDATE  | 20260916 | total rows: 0 |

  @legacy
  Scenario: 日期欄清空仍會送出查詢
    # 現況如此；前端組出 from=00、to=23，Mockoon 回預設交易資料
    When 我清空起日與迄日並按查詢
    Then 結果區應顯示交易資料而不是格式錯誤提示

  @mock @legacy
  Scenario: 後端回傳的 HTML 欄位值直接顯示
    # 固定 SRS 記載的未轉義現況；Mockoon: routes/report.json，merchantId=E000BLD
    When 我將商家欄設為 "E000BLD" 並按查詢
    Then 商品名稱應以粗體顯示 "標記文字"

  @mock
  Scenario: 單引號查詢條件顯示 SQL 錯誤
    # Mockoon: routes/report.json，merchantId 為單引號
    When 我將商家欄設為單引號並按查詢
    Then 結果區應包含 "query error:"

  Scenario: 報表結果表格使用 Portal 指定樣式
    When 我按下查詢
    Then 結果表頭應為淡藍底且格線為灰色
    And 資料列背景應為白色

  Scenario: 後端沒有回應時結果區維持查詢中
    # 測試步驟暫停後端回應；此行為不由無狀態 Mockoon response 表達
    When 我送出查詢並暫停後端回應
    Then 結果區應持續顯示 "查詢中..."

  Scenario: 查詢等待期間可再次送出且結果以最後回應為準
    # 測試步驟應延遲第一次回應並以相反順序釋放兩次回應
    When 我在第一次查詢回應前連續按下查詢兩次
    Then 結果區應顯示最後到達的查詢回應

  Scenario: CP 帳號也能使用交易報表與輸入任意商家條件
    When 我以 "cp" 身分重新登入並開啟交易報表
    And 我將商家欄設為 "E010000" 並按查詢
    Then 我應看見交易報表結果

  Scenario: 登出後已開啟的報表資料查詢回覆未登入
    When 我登出後返回已開啟的交易報表並查詢
    Then 結果區應顯示 "please login"

  Scenario: 從交易報表導覽至退款報表
    When 我從頂端導覽開啟退款報表
    Then 頁面標題應為 "退款交易報表查詢"
    And 商家與時間類型欄位應隱藏
    And 日期、小時、查詢按鈕與結果區應可使用

  @smoke @mock
  Scenario: 查詢退款並顯示原交易資訊
    # Mockoon: routes/report.json 的 /sa/report/refund 預設回應
    When 我從頂端導覽開啟退款報表並按查詢
    Then 結果表格應該包含以下資料:
      | TXID          | AMOUNT | REFUND_STATUS | REFUND_DATE    | MEMO | AUTH_DT        |
      | T202609160001 | 100    | D             | 20260916130000 | C001 | 20260916090002 |
      | T202609160002 | 50     | D             | 20260916140000 | C002 | 20260916110003 |
    And 結果區應顯示 "total rows: 2"
    And 退款時間應由早到晚排列

  Scenario: 退款查詢只使用日期範圍而不使用商家或時間類型
    When 我從頂端導覽開啟退款報表並查詢
    Then 退款結果應依退款時間排序
    And 商家與時間類型不應影響退款結果

  @mock
  Scenario: 退款查無資料時顯示空表格
    # Mockoon: routes/report.json，退款起日設為 20990101
    When 我從頂端導覽開啟退款報表
    And 我將起日設為 "20990101" 並按查詢
    Then 結果應顯示空表格與 "total rows: 0"

  @mock
  Scenario Outline: 退款報表呈現後端失敗
    # Mockoon: routes/report.json，退款起日使用專用錯誤觸發值
    When 我從頂端導覽開啟退款報表
    And 我將起日設為 "<起日>" 並按查詢
    Then 結果區應包含 "<錯誤前綴>"

    Examples:
      | 起日     | 錯誤前綴       |
      | 20999999 | backend error: |
      | 20880101 | backend error: |
      | 20880201 | query error:   |