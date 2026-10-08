@login
Feature: Portal 登入 (US-LGN-01〜04, SRS 4.1)
  身為 SA / CP / CSR 使用者
  我想要以固定測試帳號登入 new-pay Portal
  以便進入對應的功能選單

  Background:
    Given 我在登入頁

  Scenario: 登入頁顯示標題與測試帳號提示且帳號欄位自動聚焦
    # US-LGN-01 AC3（P-LGN-05）；提示文字見 SRS 4.1.1 畫面元素
    Then 登入頁應該顯示標題 "登入"
    And 頁面應該顯示說明 "測試帳號: sa/sa (SA Portal), cp/cp (Merchant Portal), csr/csr (CSR Portal)"
    And 帳號欄位應該自動聚焦

  @smoke
  Scenario Outline: 三種角色都能用預設帳號登入
    # US-LGN-01 AC1、AC2（P-LGN-01, P-LGN-02）
    When 我輸入帳號 "<帳號>" 與密碼 "<密碼>" 並送出
    Then 我應該看到功能選單
    And 導覽列應該顯示登入者 "<帳號>"

    Examples:
      | 帳號 | 密碼 |
      | sa  | sa  |
      | cp  | cp  |
      | csr | csr |

  Scenario: 密碼錯誤時停留在登入頁並顯示錯誤
    # US-LGN-02 AC1（P-LGN-03）
    When 我輸入帳號 "sa" 與密碼 "wrong" 並送出
    Then 我應該停留在登入頁
    And 登入頁應該顯示錯誤訊息 "帳號或密碼錯誤"

  Scenario: 帳號不存在時停留在登入頁並顯示錯誤
    # US-LGN-02 AC1（P-LGN-03）
    When 我輸入帳號 "nobody" 與密碼 "sa" 並送出
    Then 我應該停留在登入頁
    And 登入頁應該顯示錯誤訊息 "帳號或密碼錯誤"

  @legacy
  Scenario: 登入失敗後帳號欄位被清空
    # US-LGN-02 AC2（P-LGN-04，現況如此：頁面重新渲染、欄位不回填）
    When 我輸入帳號 "sa" 與密碼 "wrong" 並送出
    Then 帳號欄位應該是空的

  @legacy
  Scenario Outline: 帳號或密碼空白仍會送出並顯示錯誤
    # US-LGN-02 AC1（P-LGN-03：任一欄為空也是登入失敗）＋ US-COM-06 AC1（無前端驗證）
    When 我輸入帳號 "<帳號>" 與密碼 "<密碼>" 並送出
    Then 我應該停留在登入頁
    And 登入頁應該顯示錯誤訊息 "帳號或密碼錯誤"

    Examples:
      | 帳號 | 密碼 |
      |      | sa   |
      | sa   |      |
      |      |      |

  Scenario: 帳號大小寫不同視為錯誤帳號
    # US-LGN-01 AC1（P-LGN-01：大小寫敏感，SA 失敗）
    When 我輸入帳號 "SA" 與密碼 "sa" 並送出
    Then 我應該停留在登入頁
    And 登入頁應該顯示錯誤訊息 "帳號或密碼錯誤"

  @legacy
  Scenario: 帳號前後有空白視為錯誤帳號
    # US-LGN-01 AC1（P-LGN-01：完全相符才成功，沒有 trim）
    When 我輸入帳號 " sa " 與密碼 "sa" 並送出
    Then 我應該停留在登入頁
    And 登入頁應該顯示錯誤訊息 "帳號或密碼錯誤"

  Scenario: 在密碼欄按 Enter 等同按登入
    When 我輸入帳號 "sa" 與密碼 "sa" 並在密碼欄按 Enter
    Then 我應該看到功能選單

  @legacy
  Scenario: 已登入再開登入頁仍顯示登入表單
    # US-LGN-04 AC1（P-LGN-06，現況如此：/login 不檢查 session）
    Given 我以 "sa" 身分登入 Portal
    When 我直接開啟 "/login" 頁面
    Then 我應該停留在登入頁

  Scenario: 已登入再用另一組帳號登入會覆蓋 session
    # US-LGN-04 AC1（P-LGN-06）
    Given 我以 "sa" 身分登入 Portal
    When 我直接開啟 "/login" 頁面
    And 我輸入帳號 "cp" 與密碼 "cp" 並送出
    Then 我應該看到功能選單
    And 導覽列應該顯示登入者 "cp"

  @legacy
  Scenario: 用 GET 開啟 doLogin 會得到 405 錯誤
    # US-LGN-04 AC2（P-LGN-07，現況如此：不是導回登入頁）
    When 我直接開啟 "/doLogin" 頁面
    Then 回應狀態碼應該是 405

  @legacy
  Scenario: 登入表單缺少參數時回 400
    # US-LGN-04 AC2（P-LGN-07：缺 username 或 password 參數回 HTTP 400）
    When 我未登入直接以 POST 送出 "/doLogin" 並附上表單:
      | username | sa |
    Then 回應狀態碼應該是 400

  Scenario: 登出後回到登入頁且不顯示錯誤訊息
    # US-LGN-03 AC1（P-LGN-09）
    When 我輸入帳號 "sa" 與密碼 "sa" 並送出
    And 我點擊導覽列的 "登出"
    Then 我應該停留在登入頁
    And 登入頁不應該顯示錯誤訊息
