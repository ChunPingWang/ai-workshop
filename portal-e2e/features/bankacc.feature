@bankacc
Feature: 商家銀行帳戶註冊 (US-BNK-01〜03, SRS 4.7)
  身為 Merchant Portal 的 CP 使用者
  我想要註冊商家的匯款銀行帳戶並查詢已註冊帳戶
  以便接收撥款（支援 NTD/USD 與外國銀行）

  # backend 回應見 mockoon/routes/bankacc.json：
  #   list merchantId：E000001=2 筆（007/USD/國外/A、012/NTD/國內/W）/ E500000=後端500，其他 → []
  #   save bankCode：999=FAIL Value too long / 空值=FAIL NULL not allowed /
  #                  777(須 isDomestic=N 且 currency=USD)=OK FOREIGN-USD /
  #                  776(須 isDomestic=Y 且 currency=NTD)=OK DOMESTIC-NTD，其他 → OK
  # US-BNK-02 AC1 的「清單自動出現新資料列」在 Mockoon 無狀態下不驗列數變化，只驗 OK 與清單刷新。

  Background:
    Given 我以 "cp" 身分登入 Portal
    And 我在銀行帳戶頁

  Scenario: 銀行帳戶初始畫面
    # US-BNK-01 AC1（P-BNK-01）
    Then 商家代碼欄位值應該是 "E000001"
    And 銀行代碼欄位應該是空的
    And 銀行帳號欄位應該是空的
    And 幣別應該選在 "新台幣(NTD)"
    And 外國銀行應該未勾選
    And 註冊訊息應該是空的
    And 帳戶列表應該是空白

  Scenario: 幣別下拉有新台幣與美金兩個選項
    # US-BNK-01 AC2（P-BNK-03）
    Then 幣別下拉應該恰好有選項:
      | 新台幣(NTD) |
      | 美金(USD)   |

  @smoke
  Scenario: 查詢已註冊帳戶
    # US-BNK-03 AC1（P-BNK-05 六欄中文表頭、IS_DOMESTIC 轉國內/國外）、AC3（P-BNK-09 狀態原碼）、AC5（P-BNK-12 初始資料）
    When 我按下查詢已註冊帳戶
    Then 帳戶列表應該有 2 筆資料
    And 帳戶列表應該包含以下資料:
      | 商家    | 銀行代碼 | 帳號             | 幣別 | 國內外 | 狀態 |
      | E000001 | 007      | 1234567890123456 | USD  | 國外   | A    |
      | E000001 | 012      | 1234567890123    | NTD  | 國內   | W    |

  Scenario: 查詢沒有帳戶的商家列表為空
    # US-BNK-03 AC1（P-BNK-05 無資料時只有表頭列）
    When 我把商家代碼改成 "E000009"
    And 我按下查詢已註冊帳戶
    Then 帳戶列表應該有 0 筆資料

  Scenario: 註冊國內新台幣帳戶成功並自動列出帳戶
    # US-BNK-02 AC1（P-BNK-02）
    When 我填入銀行代碼 "822" 帳號 "0011223344"
    And 我按下註冊
    Then 註冊訊息應該包含 "OK"
    And 帳戶列表應該有 2 筆資料

  @mock
  Scenario: 註冊美金外國銀行會送出 USD 與 isDomestic=N
    # US-BNK-02 AC2（P-BNK-04）：mock rule 驗證 body 參數
    When 我填入銀行代碼 "777" 帳號 "US1122334455"
    And 我把幣別改成 "美金(USD)"
    And 我勾選外國銀行
    And 我按下註冊
    Then 註冊訊息應該包含 "OK FOREIGN-USD"

  @mock
  Scenario: 未勾外國銀行會送出 isDomestic=Y
    # US-BNK-02 AC2（P-BNK-04）
    When 我填入銀行代碼 "776" 帳號 "0099887766"
    And 我按下註冊
    Then 註冊訊息應該包含 "OK DOMESTIC-NTD"

  @mock
  Scenario: 後端註冊失敗時原樣顯示 FAIL 訊息
    # US-BNK-02 AC3（P-BNK-07）＋ US-COM-05 AC3（P-COM-16）
    When 我填入銀行代碼 "999" 帳號 "0011223344"
    And 我按下註冊
    Then 註冊訊息應該包含 "FAIL Value too long"

  @legacy @mock
  Scenario: 銀行代碼與帳號空白仍會送出註冊且後端回必填失敗
    # US-BNK-02 AC3（P-BNK-07 空值）＋ US-COM-06 AC2（P-COM-32：必填空值 → FAIL NULL not allowed）
    When 我按下註冊
    Then 註冊訊息應該包含 "FAIL NULL not allowed"

  @legacy
  Scenario: 帳號含非數字仍會送出註冊
    # US-BNK-02 AC4（P-BNK-08，現況如此）
    When 我填入銀行代碼 "822" 帳號 "abc-123"
    And 我按下註冊
    Then 註冊訊息應該包含 "OK"

  Scenario: 註冊訊息保留到下一次註冊才更新
    # US-BNK-02 AC5（P-BNK-10：清單查詢不清訊息、新回應才覆蓋）
    When 我填入銀行代碼 "999" 帳號 "0011223344"
    And 我按下註冊
    Then 註冊訊息應該包含 "FAIL"
    When 我按下查詢已註冊帳戶
    Then 註冊訊息應該包含 "FAIL"
    When 我填入銀行代碼 "822" 帳號 "0011223344"
    And 我按下註冊
    Then 註冊訊息應該包含 "OK"
    And 註冊訊息不應該包含 "FAIL"

  @legacy @mock
  Scenario: 列表查詢後端 500 時列表沒有任何變化
    # US-BNK-03 AC4（P-BNK-11，現況如此：非 JSON → 清單不更新、無訊息）
    When 我把商家代碼改成 "E500000"
    And 我按下查詢已註冊帳戶
    Then 帳戶列表應該是空白

  @legacy
  Scenario: session 逾期後查詢清單只剩空表頭
    # US-BNK-03 AC4（P-BNK-11，現況如此：未登入清單回 [] → 空表頭；註冊回 please login）
    When 我在另一個分頁登出
    And 我按下查詢已註冊帳戶
    Then 帳戶列表應該有 0 筆資料
    When 我填入銀行代碼 "822" 帳號 "0011223344"
    And 我按下註冊
    Then 註冊訊息應該包含 "please login"

  Scenario: 頁面顯示 Finance 審核說明
    # US-BNK-02 AC6（P-BNK-13 的畫面提示；審核功能見範圍外清單）
    Then 頁面應該顯示說明 "送出後由 Finance 於 SA Portal 審核"
