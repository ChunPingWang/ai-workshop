@csr
Feature: CSR 交易查詢 (US-CSR-01〜03, SRS 4.8)
  身為客服人員
  我想要用門號查出交易與退款兩張表
  以便回覆客戶問題

  # backend 回應見 mockoon/routes/csr.json：
  #   0912345678（預設）→ 2 筆交易＋1 筆退款；0900000000 → 兩張都 0 筆；
  #   0950000000 → 後端 500；0910000010 → 11 筆交易（畫面 10 列）

  Background:
    Given 我以 "csr" 身分登入 Portal
    And 我在 CSR 交易查詢頁

  Scenario: CSR 查詢初始畫面
    # US-CSR-01 AC1（P-CSR-01）
    Then 門號欄位值應該是 "0912345678"
    And 結果區應該顯示 "請輸入門號查詢"
    And 頁面應該顯示說明 "商品名稱(PaymentDescription)與商家資訊(MerchantContact)"

  @smoke
  Scenario: 查詢有交易的門號會列出交易與退款
    # US-CSR-02 AC2（P-CSR-03 交易表 8 欄）、AC3（P-CSR-05 退款表 8 欄）、AC4（P-CSR-06 兩張表各自 total rows）
    When 我查詢門號 "0912345678"
    Then 交易表格應該有 2 筆資料
    And 交易表格應該有 8 個欄位且第一欄是 "TXID" 最後一欄是 "RETURN_CODE"
    And 退款表格應該有 1 筆資料
    And 退款表格應該有 8 個欄位且第一欄是 "TXID" 最後一欄是 "RETURN_MSG"
    And 結果區應該顯示 "Refunds:"

  Scenario: 交易表最新的交易排在最前面
    # US-CSR-02 AC2（P-CSR-03：TX_DT 降冪）
    When 我查詢門號 "0912345678"
    Then 交易表格第 1 筆的 TXID 應該是 "TX20260915000002"

  Scenario: 交易表看得到商品名稱與商家資訊
    # US-CSR-02 AC2（P-CSR-04：PaymentDescription=MERCHANDIZE_NAME、MerchantContact=REFERENCE）
    When 我查詢門號 "0912345678"
    Then 交易表格應該包含商品名稱 "GameCoin"
    And 交易表格應該包含商品名稱 "AppItem"
    And 結果區應該顯示 "dev@onlinestore"

  @legacy
  Scenario: 未取消交易的 RETURN_CODE 顯示 null
    # US-CSR-02 AC6（P-CSR-09，現況如此：NULL 顯示 null）
    When 我查詢門號 "0912345678"
    Then 交易表格應該包含以下資料:
      | TXID             | RETURN_CODE |
      | TX20260915000001 | null        |

  Scenario: 查詢沒有交易的門號會顯示空表格
    # US-CSR-02 AC5（P-CSR-07：兩張皆空表格、分隔線仍在）
    When 我查詢門號 "0900000000"
    Then 交易表格應該有 0 筆資料
    And 退款表格應該有 0 筆資料
    And 結果區應該顯示 "Refunds:"

  Scenario: 後端發生錯誤時畫面顯示後端錯誤訊息
    # US-CSR-03 AC2（P-CSR-10）＋ US-COM-05 AC2
    When 我查詢門號 "0950000000"
    Then 查詢結果應該顯示後端錯誤

  @legacy
  Scenario Outline: 門號空白或格式不符仍會送出查詢
    # US-CSR-03 AC1（P-CSR-08，現況如此：不提示）；mock 沒命中 rule 回預設資料
    When 我查詢門號 "<門號>"
    Then 交易表格應該有 2 筆資料

    Examples:
      | 門號  |
      |       |
      | 09abc |

  @mock
  Scenario: 超過 10 筆交易只顯示 10 筆但 total rows 是全部
    # US-COM-04 AC2（P-COM-22）＋ US-CSR-02 AC4（兩張表各自適用 10 筆上限）
    When 我查詢門號 "0910000010"
    Then 交易表格應該有 10 筆資料
    And 結果區應該顯示 "total rows: 11"
