@common
Feature: Portal 共通行為 (US-COM-01〜03, SRS 第 3 章)
  身為 Portal 的任何使用者
  我想要每個功能頁都有一致的登入保護與導覽行為
  以便安全且方便地切換功能

  # 共通行為的「查詢中...」「覆蓋查詢」「backend 500/404」「HTML 不轉義」（US-COM-04/05）以 report 頁為代表，寫在 report.feature。

  Scenario Outline: 未登入直接開功能頁會被導回登入頁
    # US-COM-01 AC1（P-COM-01）
    When 我直接開啟 "<路徑>" 頁面
    Then 我應該停留在登入頁

    Examples:
      | 路徑                |
      | /                   |
      | /report?type=trans  |
      | /report?type=refund |
      | /recon              |
      | /tos                |
      | /bankacc            |

  @legacy
  Scenario: 未登入用 jsessionid 網址開首頁不會被導回登入頁
    # 程式有但 AC 沒寫的行為（US-COM-01 備註）：/;jsessionid=任意值 比對不到 controller，
    # 由 welcome page 直接 render index 模板——沒有登入檢查、導覽列帳號/角色空白。升級前後需一致。
    When 我直接開啟 "/;jsessionid=FAKE0000" 頁面
    Then 我應該看到頁面標題 "功能選單"
    And 導覽列的登入者應該是空白

  @legacy
  Scenario Outline: 未登入直接打 ajax 端點會回純文字 please login 而不是導轉
    # US-COM-01 AC2（P-COM-02，現況如此）
    When 我直接開啟 "<路徑>" 頁面
    Then 頁面內容應該是 "please login"

    Examples:
      | 路徑                                                   |
      | /report/data?type=trans&from=2026010100&to=2026010123 |
      | /recon/data?type=daily&from=20000101&to=20991231      |
      | /recon/detail?reconId=R20260915                        |
      | /csr/data?msisdn=0912345678                            |

  @legacy
  Scenario Outline: 未登入直接打查詢 ajax 會回空陣列
    # US-COM-01 AC2（P-COM-02，現況如此）：/tos/data、/bankacc/data 回 "[]"，與其他端點的回法不一致
    When 我直接開啟 "<路徑>" 頁面
    Then 頁面內容應該是 "[]"

    Examples:
      | 路徑                             |
      | /tos/data?merchantID=E000001     |
      | /bankacc/data?merchantId=E000001 |

  @legacy
  Scenario: 資料端點缺少必要參數時回 400
    # US-COM-05 AC5（P-COM-19：缺必要參數回 HTTP 400、不轉呼叫後端）
    When 我直接開啟 "/report/data" 頁面
    Then 回應狀態碼應該是 400

  @legacy
  Scenario: 未登入直接送出服務條款存檔會回 please login
    # US-COM-01 AC2（P-COM-02）
    When 我未登入直接以 POST 送出 "/tos/save" 並附上表單:
      | merchantID | E000001        |
      | startDate  | 20260101000000 |
      | content    | x              |
    Then 回應內容應該是 "please login"

  @legacy
  Scenario: 未登入直接送出銀行帳戶註冊會回 please login
    # US-COM-01 AC2（P-COM-02）
    When 我未登入直接以 POST 送出 "/bankacc/save" 並附上表單:
      | merchantId | E000001    |
      | bankCode   | 822        |
      | bankAcc    | 0011223344 |
      | currency   | NTD        |
    Then 回應內容應該是 "please login"

  @legacy
  Scenario Outline: 任何角色都能開啟所有功能頁
    # US-COM-02 AC1（P-COM-03，現況如此：本版次不實作角色授權）
    Given 我以 "<角色>" 身分登入 Portal
    Then 我可以依序開啟所有功能頁而不被導回登入頁

    Examples:
      | 角色 |
      | sa   |
      | cp   |
      | csr  |

  Scenario Outline: 導覽列連結導到正確頁面
    # US-COM-03 AC2（P-COM-08）
    Given 我以 "sa" 身分登入 Portal
    When 我點擊導覽列的 "<連結>"
    Then 我應該看到頁面標題 "<標題>"

    Examples:
      | 連結     | 標題                              |
      | 首頁     | 功能選單                          |
      | 交易報表 | 交易報表查詢                      |
      | 退款報表 | 退款交易報表查詢                  |
      | 對帳查詢 | OLS 對帳結果查詢 (SA Portal)      |
      | 服務條款 | 服務條款設定 (SA Portal)          |
      | 銀行帳戶 | 商家銀行帳戶註冊 (CP Portal)      |
      | CSR查詢  | 查詢 new-pay 交易紀錄 (CSR Portal) |

  Scenario Outline: 各頁面的瀏覽器分頁標題正確
    # US-COM-03 AC3（P-COM-10）
    Given 我以 "sa" 身分登入 Portal
    When 我直接開啟 "<路徑>" 頁面
    Then 瀏覽器分頁標題應該是 "<title>"

    Examples:
      | 路徑               | title            |
      | /                  | new-pay Portal   |
      | /report?type=trans | 交易報表查詢     |
      | /recon             | OLS 對帳結果查詢 |
      | /tos               | 服務條款設定     |
      | /bankacc           | 商家銀行帳戶註冊 |
      | /csr               | CSR 交易查詢     |

  Scenario: 首頁導覽列顯示登入者帳號與角色
    # US-COM-03 AC1（P-COM-04, P-COM-07）
    Given 我以 "sa" 身分登入 Portal
    Then 導覽列應該顯示登入者 "sa"
    And 導覽列應該顯示角色 "(sa)"

  Scenario: 登出後停在舊頁面再查詢會看到 please login
    # US-COM-01 AC3（P-COM-05）：以另一分頁登出讓 session 失效，原分頁舊畫面再打 ajax → please login
    Given 我以 "csr" 身分登入 Portal
    And 我在 CSR 交易查詢頁
    When 我在另一個分頁登出
    And 我查詢門號 "0912345678"
    Then 結果區應該顯示 "please login"

  Scenario: 登出後 session 失效重開首頁會回到登入頁
    # US-COM-01 AC3（P-COM-05）
    Given 我以 "sa" 身分登入 Portal
    When 我點擊導覽列的 "登出"
    And 我直接開啟 "/" 頁面
    Then 我應該停留在登入頁
