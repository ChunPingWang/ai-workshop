@login
Feature: 登入與登出 (US-LGN-01～02、US-COM-01，SRS 3.1、4.1)
  身為 Portal 使用者
  我想要使用測試帳號登入
  以便進入 Portal 工作頁面

  Scenario Outline: 使用畫面列出的測試帳密登入
    Given 我在登入頁
    When 我送出帳號 "<帳號>" 與密碼 "<密碼>"
    Then 我應進入首頁
    And 頁首應顯示帳號 "<帳號>"

    Examples:
      | 帳號 | 密碼 |
      | sa   | sa   |
      | cp   | cp   |
      | csr  | csr  |

  Scenario Outline: 錯誤帳密不建立登入狀態
    Given 我在登入頁
    When 我送出帳號 "<帳號>" 與密碼 "<密碼>"
    Then 我仍應看見登入頁
    And 登入錯誤訊息應為 "帳號或密碼錯誤"
    And 帳號與密碼欄位應為空白

    Examples:
      | 帳號   | 密碼   |
      | sa     | wrong  |
      | unknown| unknown|
      | SA     | sa     |
      | sa     | SA     |

  Scenario: 帳號欄空白時顯示登入錯誤
    Given 我在登入頁
    When 我只輸入密碼 "sa" 並送出
    Then 登入錯誤訊息應為 "帳號或密碼錯誤"
    And 帳號與密碼欄位應為空白

  Scenario: 密碼欄空白時顯示登入錯誤
    Given 我在登入頁
    When 我只輸入帳號 "sa" 並送出
    Then 登入錯誤訊息應為 "帳號或密碼錯誤"
    And 帳號與密碼欄位應為空白

  Scenario: 登入頁開啟後游標位於帳號欄
    Given 我開啟登入頁
    Then 輸入游標應位於帳號欄位

  Scenario: 在登入欄按 Enter 可登入
    Given 我在登入頁
    When 我輸入帳號 "sa" 與密碼 "sa" 並在密碼欄按 Enter
    Then 我應進入首頁

  Scenario: 已登入時以另一帳號重新登入
    Given 我以 "sa" 身分登入 Portal
    When 我以 "cp" 身分重新登入 Portal
    Then 頁首應顯示帳號 "cp"
    And 我仍處於已登入狀態

  Scenario: 登出後回登入頁且不保留錯誤訊息
    Given 我以 "sa" 身分登入 Portal
    When 我按下登出
    Then 我應看見登入頁
    And 登入錯誤訊息不應出現

  Scenario Outline: 未登入開啟受保護頁面會回到登入頁
    Given 我尚未登入 Portal
    When 我直接開啟 "<功能頁>"
    Then 我應看見登入頁

    Examples:
      | 功能頁       |
      | 首頁         |
      | 交易報表     |
      | 對帳查詢     |
      | 服務條款設定 |
      | 銀行帳戶註冊 |
      | CSR 交易查詢 |