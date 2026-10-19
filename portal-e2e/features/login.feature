@login
Feature: 登入後才能使用 Portal 功能 (US-COM-01, SRS 3.1)
  身為 Portal 使用者，
  我想要 只有登入後才能看到交易與帳務資料，
  以便 確保資料不被未登入的人看到。

  # 本檔只涵蓋 US-COM-01（P-COM-01、02、03、05、06）。
  # 登入後的查詢／存檔用 Mockoon 預設回應，backend 回應見 mockoon/routes/{report,recon,tos,bankacc,csr}.json；
  # 登入已失效／已登出時 Portal 不會呼叫 backend，畫面上的 please login、空清單都是 Portal 自己回的。
  # 「我的登入已失效」= 清掉瀏覽器的 session cookie，模擬閒置逾時（P-COM-06），不必真的等 30 分鐘。

  # ---------- AC1（P-COM-01）未登入開啟頁面 ----------

  @smoke
  Scenario Outline: 未登入直接開啟<頁面>會被帶回登入頁
    Given 我尚未登入 Portal
    When 我直接開啟 "<頁面>" 頁面
    Then 我應該在登入頁

    Examples:
      | 頁面     |
      | 首頁     |
      | 交易報表 |
      | 退款報表 |
      | 對帳查詢 |
      | 服務條款 |
      | 銀行帳戶 |
      | CSR查詢  |

  Scenario Outline: 未登入開啟交易報表時不論報表類型都會被帶回登入頁（<說明>）
    Given 我尚未登入 Portal
    When 我直接開啟網址 "<網址>"
    Then 我應該在登入頁

    Examples:
      | 說明         | 網址                 |
      | 未指定類型   | /report              |
      | 不存在的類型 | /report?type=unknown |

  @legacy
  Scenario: 未登入被帶回登入頁後，登入成功進入首頁而不是原本要開的頁面
    # 現況如此：Portal 不記住原本要開的頁面，登入後一律進首頁（P-LGN 登入成功導向 /）
    Given 我尚未登入 Portal
    When 我直接開啟 "CSR查詢" 頁面
    Then 我應該在登入頁
    When 我以帳號 "csr" 密碼 "csr" 登入
    Then 頁面標題應該是 "功能選單"

  Scenario: 登入失敗後仍無法開啟功能頁
    Given 我尚未登入 Portal
    When 我以帳號 "sa" 密碼 "wrong" 登入
    And 我直接開啟 "交易報表" 頁面
    Then 我應該在登入頁

  @legacy
  Scenario: 未登入開啟帶 jsessionid 的首頁網址會直接顯示首頁選單，但功能頁仍需登入
    # 現況如此（與 P-COM-01 不符，回報 US/SRS）：/;jsessionid=… 對不到 "/" 的登入檢查，
    # 由 welcome page 直接顯示首頁模板，標題列帳號與角色是空的；從這裡點功能頁仍會被帶回登入頁。
    Given 我尚未登入 Portal
    When 我直接開啟網址 "/;jsessionid=E2EFAKESESSION0000"
    Then 頁面標題應該是 "功能選單"
    And 標題列不應該顯示任何帳號
    When 我點選導覽列的 "交易報表"
    Then 我應該在登入頁

  # ---------- AC2（P-COM-02）頁面開著但登入已失效 ----------

  @smoke
  Scenario Outline: 登入失效後在<頁面>按「<按鈕>」，<區域>顯示 please login 而不是跳回登入頁
    Given 我以 "sa" 身分登入 Portal
    And 我在 "<頁面>" 頁面
    And 我的登入已失效
    When 我按下 "<按鈕>"
    Then "<區域>" 應該顯示 "please login"
    And 我應該仍在 "<頁面>" 頁面

    Examples:
      | 頁面     | 按鈕       | 區域       |
      | 交易報表 | 查詢       | 查詢結果區 |
      | 退款報表 | 查詢       | 查詢結果區 |
      | 對帳查詢 | 查詢       | 查詢結果區 |
      | 對帳查詢 | 查差異明細 | 差異明細區 |
      | CSR查詢  | 查詢       | 查詢結果區 |

  @legacy
  Scenario: 登入失效後查詢服務條款，畫面當成該商家尚無服務條款
    # 現況如此（P-COM-02）：未登入時服務條款資料回 []，畫面進入「第一次建立」狀態
    Given 我以 "sa" 身分登入 Portal
    And 我在 "服務條款" 頁面
    And 我的登入已失效
    When 我按下 "查詢/新增服務條款"
    Then 服務條款版次應該是 "1"
    And 服務條款目前內容應該是 "(尚無服務條款)"
    And 應該看得到 "存檔" 按鈕
    And 我應該仍在 "服務條款" 頁面

  @legacy
  Scenario: 登入失效後存檔服務條款，訊息區顯示 please login
    # 存檔後頁面會自動重查並清空訊息區，訊息只短暫出現（見 README「已知地雷」）
    # 重查同樣因未登入回 []，所以畫面仍是「尚無服務條款」
    Given 我以 "sa" 身分登入 Portal
    And 我在 "服務條款" 頁面
    And 我的登入已失效
    When 我按下 "查詢/新增服務條款"
    And 我輸入生效日期 "20261101000000"
    And 我輸入服務條款內容 "登入失效測試條款"
    And 我按下 "存檔"
    Then "訊息區" 應該顯示 "please login"
    And 服務條款目前內容應該是 "(尚無服務條款)"

  @legacy
  Scenario: 登入失效後查詢已註冊帳戶，清單只剩表頭
    # 現況如此（P-COM-02）：未登入時銀行帳戶資料回 []，畫面畫出只有表頭的空表格
    Given 我以 "sa" 身分登入 Portal
    And 我在 "銀行帳戶" 頁面
    And 我的登入已失效
    When 我按下 "查詢已註冊帳戶"
    Then 帳戶清單應該只有表頭 "商家、銀行代碼、帳號、幣別、國內外、狀態"
    And 我應該仍在 "銀行帳戶" 頁面

  @legacy
  Scenario: 登入失效後註冊銀行帳戶，訊息區顯示 please login 且清單只剩表頭
    # 註冊後頁面會自動查詢已註冊帳戶，同樣因未登入回 []
    Given 我以 "sa" 身分登入 Portal
    And 我在 "銀行帳戶" 頁面
    And 我的登入已失效
    When 我輸入銀行代碼 "812"
    And 我輸入銀行帳號 "00012345678901"
    And 我按下 "註冊"
    Then "訊息區" 應該顯示 "please login"
    And 帳戶清單應該只有表頭 "商家、銀行代碼、帳號、幣別、國內外、狀態"

  Scenario: 登入失效後重新整理功能頁會被帶回登入頁
    Given 我以 "sa" 身分登入 Portal
    And 我在 "交易報表" 頁面
    And 我的登入已失效
    When 我重新整理頁面
    Then 我應該在登入頁

  Scenario: 登入失效後從導覽列切換到其他功能頁會被帶回登入頁
    Given 我以 "sa" 身分登入 Portal
    And 我在 "交易報表" 頁面
    And 我的登入已失效
    When 我點選導覽列的 "CSR查詢"
    Then 我應該在登入頁

  # ---------- AC3（P-COM-03）不依身分限制功能 ----------

  Scenario Outline: 以 <帳號> 登入後可以開啟<頁面>
    Given 我以 "<帳號>" 身分登入 Portal
    When 我直接開啟 "<頁面>" 頁面
    Then 頁面標題應該是 "<頁面標題>"

    Examples:
      | 帳號 | 頁面     | 頁面標題                           |
      | sa   | 首頁     | 功能選單                           |
      | sa   | 交易報表 | 交易報表查詢                       |
      | sa   | 退款報表 | 退款交易報表查詢                   |
      | sa   | 對帳查詢 | OLS 對帳結果查詢 (SA Portal)       |
      | sa   | 服務條款 | 服務條款設定 (SA Portal)           |
      | sa   | 銀行帳戶 | 商家銀行帳戶註冊 (CP Portal)       |
      | sa   | CSR查詢  | 查詢 new-pay 交易紀錄 (CSR Portal) |
      | cp   | 首頁     | 功能選單                           |
      | cp   | 交易報表 | 交易報表查詢                       |
      | cp   | 退款報表 | 退款交易報表查詢                   |
      | cp   | 對帳查詢 | OLS 對帳結果查詢 (SA Portal)       |
      | cp   | 服務條款 | 服務條款設定 (SA Portal)           |
      | cp   | 銀行帳戶 | 商家銀行帳戶註冊 (CP Portal)       |
      | cp   | CSR查詢  | 查詢 new-pay 交易紀錄 (CSR Portal) |
      | csr  | 首頁     | 功能選單                           |
      | csr  | 交易報表 | 交易報表查詢                       |
      | csr  | 退款報表 | 退款交易報表查詢                   |
      | csr  | 對帳查詢 | OLS 對帳結果查詢 (SA Portal)       |
      | csr  | 服務條款 | 服務條款設定 (SA Portal)           |
      | csr  | 銀行帳戶 | 商家銀行帳戶註冊 (CP Portal)       |
      | csr  | CSR查詢  | 查詢 new-pay 交易紀錄 (CSR Portal) |

  @legacy
  Scenario Outline: 以 <帳號> 登入後在<頁面>按「<按鈕>」可以看到查詢結果
    # 現況如此（P-COM-03）：系統不依身分限制功能，商家與客服也能查 SA 的報表、對帳與條款
    # backend 回應見 mockoon/routes/*.json 的預設回應
    Given 我以 "<帳號>" 身分登入 Portal
    And 我在 "<頁面>" 頁面
    When 我按下 "<按鈕>"
    Then "<區域>" 應該包含 "<看到的內容>"

    Examples:
      | 帳號 | 頁面     | 按鈕              | 區域         | 看到的內容       |
      | sa   | 交易報表 | 查詢              | 查詢結果區   | total rows: 3    |
      | sa   | 退款報表 | 查詢              | 查詢結果區   | total rows: 2    |
      | sa   | 對帳查詢 | 查詢              | 查詢結果區   | total rows: 2    |
      | sa   | 對帳查詢 | 查差異明細        | 差異明細區   | Amount not match |
      | sa   | 服務條款 | 查詢/新增服務條款 | 服務條款版次 | 2                |
      | sa   | 銀行帳戶 | 查詢已註冊帳戶    | 帳戶清單     | 1234567890123456 |
      | sa   | CSR查詢  | 查詢              | 查詢結果區   | Refunds:         |
      | cp   | 交易報表 | 查詢              | 查詢結果區   | total rows: 3    |
      | cp   | 退款報表 | 查詢              | 查詢結果區   | total rows: 2    |
      | cp   | 對帳查詢 | 查詢              | 查詢結果區   | total rows: 2    |
      | cp   | 對帳查詢 | 查差異明細        | 差異明細區   | Amount not match |
      | cp   | 服務條款 | 查詢/新增服務條款 | 服務條款版次 | 2                |
      | cp   | 銀行帳戶 | 查詢已註冊帳戶    | 帳戶清單     | 1234567890123456 |
      | cp   | CSR查詢  | 查詢              | 查詢結果區   | Refunds:         |
      | csr  | 交易報表 | 查詢              | 查詢結果區   | total rows: 3    |
      | csr  | 退款報表 | 查詢              | 查詢結果區   | total rows: 2    |
      | csr  | 對帳查詢 | 查詢              | 查詢結果區   | total rows: 2    |
      | csr  | 對帳查詢 | 查差異明細        | 差異明細區   | Amount not match |
      | csr  | 服務條款 | 查詢/新增服務條款 | 服務條款版次 | 2                |
      | csr  | 銀行帳戶 | 查詢已註冊帳戶    | 帳戶清單     | 1234567890123456 |
      | csr  | CSR查詢  | 查詢              | 查詢結果區   | Refunds:         |

  @legacy
  Scenario Outline: 以 <帳號> 登入後可以存檔服務條款新版次
    # 現況如此（P-COM-03）。Mockoon 無狀態：存檔回 version=3，自動重查仍回 v2，所以只斷言訊息
    # 存檔後自動重查會清空訊息區，訊息只短暫出現（見 README「已知地雷」）
    Given 我以 "<帳號>" 身分登入 Portal
    And 我在 "服務條款" 頁面
    When 我按下 "查詢/新增服務條款"
    And 我按下 "建立新版次"
    And 我輸入生效日期 "20261101000000"
    And 我輸入服務條款內容 "角色測試條款 v3"
    And 我按下 "存檔"
    Then "訊息區" 應該包含 "OK version=3"

    Examples:
      | 帳號 |
      | sa   |
      | cp   |
      | csr  |

  @legacy
  Scenario Outline: 以 <帳號> 登入後可以註冊銀行帳戶
    # 現況如此（P-COM-03）。註冊後自動查詢清單，backend 回應見 mockoon/routes/bankacc.json
    Given 我以 "<帳號>" 身分登入 Portal
    And 我在 "銀行帳戶" 頁面
    When 我輸入銀行代碼 "812"
    And 我輸入銀行帳號 "00012345678901"
    And 我按下 "註冊"
    Then "訊息區" 應該顯示 "OK"
    And "帳戶清單" 應該包含 "00012345678901"

    Examples:
      | 帳號 |
      | sa   |
      | cp   |
      | csr  |

  # ---------- AC4（P-COM-05）登出 ----------

  @smoke
  Scenario Outline: 在<頁面>按登出回到登入頁
    Given 我以 "sa" 身分登入 Portal
    And 我在 "<頁面>" 頁面
    When 我點選導覽列的 "登出"
    Then 我應該在登入頁

    Examples:
      | 頁面     |
      | 首頁     |
      | 交易報表 |
      | 退款報表 |
      | 對帳查詢 |
      | 服務條款 |
      | 銀行帳戶 |
      | CSR查詢  |

  Scenario Outline: 登出後再開啟<頁面>會被帶回登入頁
    Given 我以 "sa" 身分登入 Portal
    And 我已登出 Portal
    When 我直接開啟 "<頁面>" 頁面
    Then 我應該在登入頁

    Examples:
      | 頁面     |
      | 首頁     |
      | 交易報表 |
      | 退款報表 |
      | 對帳查詢 |
      | 服務條款 |
      | 銀行帳戶 |
      | CSR查詢  |

  Scenario Outline: 在另一個分頁登出後，原本開著的<頁面>按「<按鈕>」顯示 please login
    Given 我以 "sa" 身分登入 Portal
    And 我在 "<頁面>" 頁面
    And 我在另一個分頁登出 Portal
    When 我按下 "<按鈕>"
    Then "<區域>" 應該顯示 "please login"

    Examples:
      | 頁面     | 按鈕 | 區域       |
      | 交易報表 | 查詢 | 查詢結果區 |
      | 對帳查詢 | 查詢 | 查詢結果區 |
      | CSR查詢  | 查詢 | 查詢結果區 |

  @legacy
  Scenario: 在另一個分頁登出後，原本開著的服務條款頁查詢會當成尚無服務條款
    Given 我以 "sa" 身分登入 Portal
    And 我在 "服務條款" 頁面
    And 我在另一個分頁登出 Portal
    When 我按下 "查詢/新增服務條款"
    Then 服務條款目前內容應該是 "(尚無服務條款)"

  @legacy
  Scenario: 在另一個分頁登出後，原本開著的銀行帳戶頁查詢清單只剩表頭
    Given 我以 "sa" 身分登入 Portal
    And 我在 "銀行帳戶" 頁面
    And 我在另一個分頁登出 Portal
    When 我按下 "查詢已註冊帳戶"
    Then 帳戶清單應該只有表頭 "商家、銀行代碼、帳號、幣別、國內外、狀態"

  Scenario: 沒有登入時按登出也會回到登入頁
    Given 我尚未登入 Portal
    When 我直接開啟網址 "/logout"
    Then 我應該在登入頁

  Scenario: 登出後換另一個帳號登入，標題列顯示新帳號
    Given 我以 "sa" 身分登入 Portal
    And 我已登出 Portal
    When 我以帳號 "cp" 密碼 "cp" 登入
    And 我直接開啟 "交易報表" 頁面
    Then 標題列應該顯示 "new-pay Portal | cp"

  # ---------- AC5（P-COM-06）session 與多瀏覽器 ----------
  # 「閒置 30 分鐘後失效」無法在 E2E 內等待，以上方「我的登入已失效」情境模擬（見 COVERAGE.md）

  Scenario: 同一帳號可以同時在兩個瀏覽器登入並查詢
    Given 我在瀏覽器 "A" 以 "sa" 身分登入 Portal
    And 我在瀏覽器 "B" 以 "sa" 身分登入 Portal
    When 我在瀏覽器 "A" 的 "交易報表" 頁面按下 "查詢"
    And 我在瀏覽器 "B" 的 "交易報表" 頁面按下 "查詢"
    Then 瀏覽器 "A" 的 "查詢結果區" 應該包含 "total rows: 3"
    And 瀏覽器 "B" 的 "查詢結果區" 應該包含 "total rows: 3"

  Scenario: 在一個瀏覽器登出不影響另一個瀏覽器的同一帳號
    Given 我在瀏覽器 "A" 以 "sa" 身分登入 Portal
    And 我在瀏覽器 "B" 以 "sa" 身分登入 Portal
    When 我在瀏覽器 "A" 登出 Portal
    And 我在瀏覽器 "B" 的 "交易報表" 頁面按下 "查詢"
    Then 瀏覽器 "B" 的 "查詢結果區" 應該包含 "total rows: 3"

  Scenario: 不同帳號同時在兩個瀏覽器登入，各自顯示自己的帳號
    Given 我在瀏覽器 "A" 以 "sa" 身分登入 Portal
    And 我在瀏覽器 "B" 以 "cp" 身分登入 Portal
    Then 瀏覽器 "A" 的 "交易報表" 頁面標題列應該顯示 "new-pay Portal | sa"
    And 瀏覽器 "B" 的 "交易報表" 頁面標題列應該顯示 "new-pay Portal | cp"
