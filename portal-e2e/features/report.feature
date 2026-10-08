@report
Feature: 交易與退款報表查詢 (US-RPT-01〜03／US-RFD-01〜02, SRS 4.3／4.4)
  身為 SA / CP 人員
  我想要依日期區間與商家查詢交易與退款報表
  以便掌握交易與退款狀況

  # backend 回應見 mockoon/routes/report.json，merchantId 觸發值：
  #   E000001=3筆(預設) / E000002=0筆 / E500000=後端500 / E404000=後端404 / E000SQL=query error /
  #   E010000=剛好10筆 / E011000=11筆(畫面10列) / E000BLD=含<b>標記 / E777000=參數檢查(from 須為10碼)
  #   timeType=auth → 授權時間報表(TXAUTH0001)；refund from 以 2099 開頭 → 0筆、20260601 開頭且未帶 merchantId → TXCHECKOK

  Background:
    Given 我以 "sa" 身分登入 Portal
    And 我在交易報表頁

  Scenario: 交易報表初始畫面
    # US-RPT-01 AC1（P-RPT-01）；日期預設「瀏覽器當日」只斷言為 8 碼數字，不斷言確切日期
    Then 我應該看到頁面標題 "交易報表查詢"
    And 商家欄位應該顯示且值為 "E000001"
    And 時間類型應該選在 "交易時間"
    And 日期起訖欄位應該是 8 碼數字
    And 起始小時應該選在 "00"
    And 結束小時應該選在 "23"
    And 結果區應該顯示 "請輸入條件查詢"

  Scenario: 小時下拉有 00 到 23 共 24 個選項
    # US-RPT-01 AC2（P-RPT-02）
    Then 起始小時下拉應該有 24 個選項且第一個是 "00" 最後一個是 "23"
    And 結束小時下拉應該有 24 個選項且第一個是 "00" 最後一個是 "23"

  Scenario: 退款報表初始畫面隱藏商家與時間類型
    # US-RFD-01 AC1（P-RFD-01）
    When 我前往退款報表頁
    Then 我應該看到頁面標題 "退款交易報表查詢"
    And 商家與時間類型欄位應該隱藏

  Scenario: 不帶 type 開啟報表頁等同交易報表
    # US-RPT-01 AC4（P-RPT-12）
    When 我直接開啟 "/report" 頁面
    Then 我應該看到頁面標題 "交易報表查詢"

  @legacy
  Scenario: 帶未知 type 開啟報表頁仍當成交易報表
    # US-RPT-01 AC4（P-RPT-12，現況如此：只有 refund 會切換）
    When 我直接開啟 "/report?type=xxx" 頁面
    Then 我應該看到頁面標題 "交易報表查詢"
    When 我按下查詢
    Then 結果表格應該有 3 筆資料

  @smoke
  Scenario: 查詢有交易資料的商家
    # US-RPT-02 AC3（P-RPT-06 十二欄）、AC4（P-RPT-07 升冪）、AC5（P-RPT-08）＋ US-COM-04 AC1/AC2
    When 我按下查詢
    Then 結果表格應該有 3 筆資料
    And 結果區應該顯示 "total rows: 3"
    And 結果表格應該有 12 個欄位且第一欄是 "TXID" 最後一欄是 "REFERENCE"
    And 結果表格應該包含以下資料:
      | TXID             | MERCHANDIZE_NAME |
      | TX20260915000001 | GameCoin         |
      | TX20260915000002 | AppItem          |
      | TX20260915000003 | Book             |
    # P-RPT-07：一律依 TX_DT 升冪，最舊的在最上面
    And 結果表格第 1 筆的 TXID 應該是 "TX20260915000001"

  Scenario: 狀態碼與 NULL 原樣顯示
    # US-RPT-02 AC6（P-RPT-10：TX_STATUS 代碼不轉中文、NULL 顯示 null）＋ US-COM-04 AC4
    When 我按下查詢
    Then 結果表格應該包含以下資料:
      | TXID             | TX_STATUS | BILL_CSPTIME |
      | TX20260915000003 | A         | null         |

  @mock
  Scenario: 查無資料的商家顯示空表格
    # US-RPT-02 AC5＋US-COM-04 AC3（P-COM-23）
    When 我把商家欄位改成 "E000002" 並按下查詢
    Then 結果表格應該有 0 筆資料
    And 結果區應該顯示 "total rows: 0"

  @mock
  Scenario: 剛好 10 筆資料全部顯示
    # US-COM-04 AC2（P-COM-22 邊界）
    When 我把商家欄位改成 "E010000" 並按下查詢
    Then 結果表格應該有 10 筆資料
    And 結果區應該顯示 "total rows: 10"

  @mock
  Scenario: 超過 10 筆只顯示 10 筆但 total rows 是全部筆數
    # US-COM-04 AC2（P-COM-22）
    When 我把商家欄位改成 "E011000" 並按下查詢
    Then 結果表格應該有 10 筆資料
    And 結果區應該顯示 "total rows: 11"
    And 頁面應該顯示說明 "畫面僅顯示10筆資料"

  @mock
  Scenario: 後端回 500 時顯示 backend error
    # US-RPT-03 AC2（P-RPT-11）＋ US-COM-05 AC2（P-COM-15）
    When 我把商家欄位改成 "E500000" 並按下查詢
    Then 查詢結果應該顯示後端錯誤

  @mock
  Scenario: 後端回 404 時顯示 backend error
    # US-COM-05 AC2（P-COM-15：4xx 也是 backend error）
    When 我把商家欄位改成 "E404000" 並按下查詢
    Then 查詢結果應該顯示後端錯誤
    And 結果區應該顯示 "404"

  @legacy @mock
  Scenario: 後端 SQL 錯誤時原樣顯示 query error
    # US-COM-04 AC6（P-COM-26，現況如此：HTTP 200、訊息含 SQL 內文）
    When 我把商家欄位改成 "E000SQL" 並按下查詢
    Then 結果區應該顯示 "query error:"
    And 結果區應該顯示 "SQL="

  @legacy @mock
  Scenario: 後端回應含 HTML 標籤會被當成 HTML 插入
    # US-COM-04 AC5（P-COM-25，現況如此：不轉義；用 <b> 驗證即可，不要真的注入 script）
    When 我把商家欄位改成 "E000BLD" 並按下查詢
    Then 結果區應該出現粗體文字 "BOLD_MARKER"

  @mock
  Scenario: 切換時間類型為授權時間後查詢
    # US-RPT-02 AC1（P-RPT-04）：timeType=auth 時 mock 回不同資料，證明參數有送到 backend
    When 我把時間類型改成 "授權時間(只限OLS)" 並按下查詢
    Then 結果表格應該包含以下資料:
      | TXID       | MERCHANDIZE_NAME |
      | TXAUTH0001 | AuthOnly         |

  Scenario: 商家欄位清空仍會送出查詢
    # US-RPT-02 AC2（P-RPT-05：清空＝查全部商家）；mock 回預設資料
    When 我清空商家欄位並按下查詢
    Then 結果表格應該有 3 筆資料

  @legacy
  Scenario Outline: 日期異常仍會送出查詢
    # US-RPT-03 AC1（P-RPT-09，現況如此：不提示、照樣送出）；mock 不看日期回預設資料
    When 我把起始日期改成 "<起>" 且結束日期改成 "<迄>" 並按下查詢
    Then 結果表格應該有 3 筆資料

    Examples:
      | 起         | 迄       |
      | 2026-09-15 | 20991231 |
      | 20261231   | 20260101 |
      |            |          |

  @mock
  Scenario: 查詢送出的時間是日期加小時共 10 碼
    # US-RPT-01 AC3（P-RPT-03）：E777000 的 mock rule 要求 from 為 10 碼數字才回 TXPARAM10
    When 我把商家欄位改成 "E777000" 並按下查詢
    Then 結果表格應該包含以下資料:
      | TXID      |
      | TXPARAM10 |

  Scenario: 退款報表查詢有資料
    # US-RFD-02 AC2（P-RFD-03 六欄）
    When 我前往退款報表頁
    And 我按下查詢
    Then 結果表格應該有 1 筆資料
    And 結果表格應該有 6 個欄位且第一欄是 "TXID" 最後一欄是 "AUTH_DT"
    And 結果區應該顯示 "total rows: 1"

  @mock
  Scenario: 退款報表查未來日期區間查無資料
    # US-RFD-02 AC1（P-RFD-02 區間以 REFUND_DATE 為準）
    When 我前往退款報表頁
    And 我把起始日期改成 "20990101" 並按下查詢
    Then 結果表格應該有 0 筆資料

  @mock
  Scenario: 退款報表查詢不會帶商家與時間類型參數
    # US-RFD-02 AC1（P-RFD-02）：mock rule 要求 from 以 20260601 開頭「且 merchantId 不存在」才回 TXCHECKOK
    When 我前往退款報表頁
    And 我把起始日期改成 "20260601" 且結束日期改成 "20260601" 並按下查詢
    Then 結果表格應該包含以下資料:
      | TXID      |
      | TXCHECKOK |

  Scenario: 從交易報表切到退款報表標題會切換
    # US-RFD-01 AC1
    When 我點擊導覽列的 "退款報表"
    Then 我應該看到頁面標題 "退款交易報表查詢"

  Scenario: 查詢送出後結果區先顯示查詢中
    # US-COM-04 AC7（P-COM-27）；步驟實作會延遲 mock 回應以觀察中間狀態
    When 我按下查詢
    Then 結果區應該先顯示 "查詢中..." 再顯示查詢結果

  Scenario: 連續查詢第二次結果覆蓋第一次
    # US-COM-04 AC7（P-COM-27/28：回應到達後整個被取代）
    When 我按下查詢
    Then 結果表格應該有 3 筆資料
    When 我把商家欄位改成 "E000002" 並按下查詢
    Then 結果表格應該有 0 筆資料
    And 結果區不應該包含 "TX20260915000001"
