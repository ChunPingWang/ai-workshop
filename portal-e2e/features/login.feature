@login
Feature: 登入、登出與存取控制 (US-LGN-01〜03, US-COM-01, SRS 4.1、3.1)
  身為 Portal 使用者，
  我想要 用自己的帳號密碼登入，並且只有登入後才能看到交易與帳務資料，
  以便 開始使用我負責的功能，同時確保資料不被未登入的人看到。

  # 本檔不打 backend；「登入失效後查詢」的回應由 Portal 自己產生（please login／[]），不經 Mockoon。

  # ---------- A／B 登入頁本身 ----------

  Scenario: 登入頁初始狀態
    Given 我尚未登入 Portal
    When 我開啟登入頁
    Then 瀏覽器分頁標題應該是 "new-pay Portal 登入"
    And 頁面標題應該是 "登入"
    And 標題列應該只顯示 "new-pay Portal" 且沒有任何連結
    And 游標應該停在 "帳號" 欄
    And "帳號" 欄與 "密碼" 欄應該是空的
    And 頁面不應該顯示任何錯誤提示
    And 頁面應該顯示提示 "測試帳號: sa/sa (SA Portal), cp/cp (Merchant Portal), csr/csr (CSR Portal)"

  # ---------- C／D 登入成功 ----------

  @smoke
  Scenario Outline: 以 <帳號> 帳號登入成功後進入首頁
    Given 我尚未登入 Portal
    When 我開啟登入頁
    And 我輸入帳號 "<帳號>" 與密碼 "<密碼>"
    And 我按下 "登入"
    Then 我應該看到首頁功能選單
    And 標題列應該顯示帳號 "<帳號>"

    Examples:
      | 帳號 | 密碼 |
      | sa   | sa   |
      | cp   | cp   |
      | csr  | csr  |

  Scenario: 在密碼欄按 Enter 等同按下登入
    Given 我尚未登入 Portal
    When 我開啟登入頁
    And 我輸入帳號 "sa" 與密碼 "sa"
    And 我在 "密碼" 欄按下 Enter
    Then 我應該看到首頁功能選單

  # ---------- C／E 登入失敗 ----------

  Scenario Outline: 登入失敗：<情況>
    Given 我尚未登入 Portal
    When 我開啟登入頁
    And 我輸入帳號 "<帳號>" 與密碼 "<密碼>"
    And 我按下 "登入"
    Then 我應該看到登入頁
    And 頁面應該顯示錯誤訊息 "帳號或密碼錯誤"
    And "帳號" 欄與 "密碼" 欄應該是空的
    And 我應該仍是未登入狀態

    Examples:
      | 情況               | 帳號   | 密碼  |
      | 密碼錯誤           | sa     | wrong |
      | 帳號不存在         | nobody | sa    |
      | 帳號大小寫不符     | SA     | sa    |
      | 密碼大小寫不符     | sa     | SA    |
      | 帳號空白           |        | sa    |
      | 密碼空白           | sa     |       |
      | 帳號與密碼都空白   |        |       |

  Scenario: 登入失敗：帳號後多一個空白
    # Gherkin 表格會修剪空白，因此獨立成一個情境；帳號值為 "sa "（含尾端空白）
    Given 我尚未登入 Portal
    When 我開啟登入頁
    And 我輸入帳號 "sa " 與密碼 "sa"
    And 我按下 "登入"
    Then 我應該看到登入頁
    And 頁面應該顯示錯誤訊息 "帳號或密碼錯誤"

  Scenario: 錯誤訊息位於登入按鈕下方、測試帳號提示上方
    Given 我尚未登入 Portal
    When 我開啟登入頁
    And 我輸入帳號 "sa" 與密碼 "wrong"
    And 我按下 "登入"
    Then 錯誤訊息 "帳號或密碼錯誤" 應該位於 "登入" 按鈕之下、測試帳號提示之上

  @legacy
  Scenario: 連續輸錯多次也不會鎖定帳號
    # 現況如此（P-LGN-08）：無失敗次數限制、帳號鎖定與驗證碼
    Given 我尚未登入 Portal
    When 我以帳號 "sa" 密碼 "wrong" 連續登入失敗 5 次
    And 我輸入帳號 "sa" 與密碼 "sa"
    And 我按下 "登入"
    Then 我應該看到首頁功能選單
    And 頁面不應該顯示驗證碼欄位

  @legacy
  Scenario: 直接以網址開啟登入送出位址會顯示錯誤頁
    # 現況如此（P-LGN-07）：GET /doLogin 回 HTTP 405，由 Spring 預設錯誤頁呈現
    Given 我尚未登入 Portal
    When 我直接以網址開啟登入送出位址
    Then 頁面應該顯示方法不允許的錯誤頁

  # ---------- A／H 未登入的存取控制 ----------

  Scenario Outline: 未登入開啟<頁面>會被帶回登入頁
    Given 我尚未登入 Portal
    When 我直接以網址開啟 "<頁面>" 頁面
    Then 我應該看到登入頁

    Examples:
      | 頁面     |
      | 首頁     |
      | 交易報表 |
      | 退款報表 |
      | 對帳查詢 |
      | 服務條款 |
      | 銀行帳戶 |
      | CSR查詢  |

  @legacy
  Scenario Outline: 登入失效後在<頁面>按「<按鈕>」會顯示 please login 而不是跳回登入頁
    # 現況如此（P-COM-02）：資料端點未登入時回 200 純文字 please login，不導向登入頁
    Given 我以 "sa" 身分登入 Portal
    And 我在 "<頁面>" 頁面
    And 我的登入已失效
    When 我按下 "<按鈕>"
    Then <區域>應該顯示 "please login"
    And 我應該仍在 "<頁面>" 頁面

    Examples:
      | 頁面     | 按鈕       | 區域   |
      | 交易報表 | 查詢       | 結果區 |
      | 退款報表 | 查詢       | 結果區 |
      | 對帳查詢 | 查詢       | 結果區 |
      | 對帳查詢 | 查差異明細 | 明細區 |
      | CSR查詢  | 查詢       | 結果區 |

  @legacy
  Scenario: 登入失效後在服務條款頁查詢會被當成商家沒有條款
    # 現況如此（P-COM-02、P-TOS-16）：/tos/data 未登入回 []
    Given 我以 "sa" 身分登入 Portal
    And 我在 "服務條款" 頁面
    And 我的登入已失效
    When 我在 "商家代碼" 欄輸入 "E000001"
    And 我按下 "查詢/新增服務條款"
    Then 服務條款版次應該顯示 "1"
    And 目前內容應該顯示 "(尚無服務條款)"

  @legacy
  Scenario: 登入失效後在銀行帳戶頁查詢清單只會看到表頭
    # 現況如此（P-COM-02、P-BNK-11）：/bankacc/data 未登入回 []
    Given 我以 "cp" 身分登入 Portal
    And 我在 "銀行帳戶" 頁面
    And 我的登入已失效
    When 我按下 "查詢已註冊帳戶"
    Then 帳戶清單應該只有表頭列

  # ---------- A 角色：系統不依角色限制功能 ----------

  @legacy
  Scenario Outline: <帳號> 身分可以開啟<頁面>
    # 現況如此（P-COM-03）：本版次不實作角色授權
    Given 我以 "<帳號>" 身分登入 Portal
    When 我開啟 "<頁面>" 頁面
    Then 頁面標題應該是 "<頁面標題>"

    Examples:
      | 帳號 | 頁面     | 頁面標題                          |
      | sa   | 交易報表 | 交易報表查詢                      |
      | sa   | 退款報表 | 退款交易報表查詢                  |
      | sa   | 對帳查詢 | OLS 對帳結果查詢 (SA Portal)      |
      | sa   | 服務條款 | 服務條款設定 (SA Portal)          |
      | sa   | 銀行帳戶 | 商家銀行帳戶註冊 (CP Portal)      |
      | sa   | CSR查詢  | 查詢 new-pay 交易紀錄 (CSR Portal) |
      | cp   | 交易報表 | 交易報表查詢                      |
      | cp   | 退款報表 | 退款交易報表查詢                  |
      | cp   | 對帳查詢 | OLS 對帳結果查詢 (SA Portal)      |
      | cp   | 服務條款 | 服務條款設定 (SA Portal)          |
      | cp   | 銀行帳戶 | 商家銀行帳戶註冊 (CP Portal)      |
      | cp   | CSR查詢  | 查詢 new-pay 交易紀錄 (CSR Portal) |
      | csr  | 交易報表 | 交易報表查詢                      |
      | csr  | 退款報表 | 退款交易報表查詢                  |
      | csr  | 對帳查詢 | OLS 對帳結果查詢 (SA Portal)      |
      | csr  | 服務條款 | 服務條款設定 (SA Portal)          |
      | csr  | 銀行帳戶 | 商家銀行帳戶註冊 (CP Portal)      |
      | csr  | CSR查詢  | 查詢 new-pay 交易紀錄 (CSR Portal) |

  # ---------- H 登出、切換帳號、多瀏覽器 ----------

  @smoke
  Scenario: 登出後回到登入頁且不顯示錯誤訊息
    Given 我以 "sa" 身分登入 Portal
    When 我點選導覽列的 "登出"
    Then 我應該看到登入頁
    And 頁面不應該顯示任何錯誤提示

  Scenario Outline: 登出後再開啟<頁面>會被帶回登入頁
    Given 我以 "sa" 身分登入 Portal
    When 我點選導覽列的 "登出"
    And 我直接以網址開啟 "<頁面>" 頁面
    Then 我應該看到登入頁

    Examples:
      | 頁面     |
      | 首頁     |
      | 交易報表 |
      | CSR查詢  |

  @legacy
  Scenario: 登出後按上一頁回到功能頁再查詢會顯示 please login
    # 現況如此（P-COM-05、P-COM-02）：瀏覽器快取的舊頁面仍可操作，但資料端點回 please login
    Given 我以 "sa" 身分登入 Portal
    And 我在 "交易報表" 頁面
    When 我點選導覽列的 "登出"
    And 我按瀏覽器的上一頁
    And 我按下 "查詢"
    Then 結果區應該顯示 "please login"

  Scenario: 已登入時改用另一組帳號登入
    Given 我以 "sa" 身分登入 Portal
    When 我開啟登入頁
    And 我輸入帳號 "cp" 與密碼 "cp"
    And 我按下 "登入"
    Then 我應該看到首頁功能選單
    And 標題列應該顯示帳號 "cp"

  Scenario: 同一帳號可以同時在兩個瀏覽器登入使用
    Given 我以 "sa" 身分登入 Portal
    When 另一個瀏覽器也以 "sa" 身分登入 Portal
    And 我開啟 "首頁" 頁面
    Then 我應該看到首頁功能選單
    And 標題列應該顯示帳號 "sa"
