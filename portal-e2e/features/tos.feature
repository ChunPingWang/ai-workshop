@tos
Feature: 服務條款設定 (US-TOS-01〜04, SRS 4.6)
  身為 SA Portal 的 PM
  我想要查詢與建立商家的服務條款版次
  以便管理各商家的 ToS 內容

  # backend 回應見 mockoon/routes/tos.json：
  #   查詢 merchantID：E000001=已有 v2 / E000003=含換行內容 v1 / E500000=後端500 / E999JSON=非 JSON，其他 → []
  #   存檔：merchantID=E000001 → OK version=3；content 含 FAIL → FAIL Value too long；content 空值 → FAIL NULL not allowed；其他 → OK version=1
  # Mockoon 無狀態：存檔後的自動重查仍回存檔前的資料，情境只斷言訊息，不斷言重查後的版次變化。
  # US-TOS-05（getToS.jsp）在 backend、不經 Portal，不在本測試範圍（見 COVERAGE.md）。

  Background:
    Given 我以 "sa" 身分登入 Portal
    And 我在服務條款設定頁

  Scenario: 服務條款初始畫面
    # US-TOS-01 AC1（P-TOS-01）
    Then 商家代碼欄位值應該是 "E000001"
    And 服務條款表單應該隱藏
    And 頁面應該顯示按鈕 "查詢/新增服務條款"

  Scenario: 查詢尚無條款的商家顯示第一次建立表單
    # US-TOS-01 AC3（P-TOS-03 新增模式 S1）
    When 我查詢商家 "E000002" 的服務條款
    Then 服務條款表單應該顯示
    And 服務條款版次應該顯示 "1"
    And 目前內容應該包含 "(尚無服務條款)"
    And 編輯區應該顯示
    And "建立新版次" 按鈕應該隱藏

  @smoke
  Scenario: 查詢已有條款的商家顯示最新版次
    # US-TOS-01 AC2、AC4（P-TOS-02, P-TOS-04 檢視模式 S2）
    When 我查詢商家 "E000001" 的服務條款
    Then 服務條款表單應該顯示
    And 服務條款版次應該顯示 "2"
    And 目前內容應該包含 "第二版服務條款"
    And 目前內容應該包含 "(URL: http://localhost:8099/getToS.jsp?merchantID=E000001&version=2)"
    And 編輯區應該隱藏
    And "建立新版次" 按鈕應該顯示

  Scenario: 按建立新版次顯示空白表單且版次加一
    # US-TOS-02 AC1（P-TOS-05 新版次模式 S3）、AC2（P-TOS-06 生效日期保留、舊內容仍顯示）
    When 我查詢商家 "E000001" 的服務條款
    And 我按下 "建立新版次"
    Then 服務條款版次應該顯示 "3"
    And 服務條款內容欄位應該是空的
    And 註記欄位應該是空的
    And 編輯區應該顯示
    And "建立新版次" 按鈕應該隱藏
    And 目前內容應該包含 "第二版服務條款"

  Scenario: 第一次建立服務條款存檔成功
    # US-TOS-03 AC1、AC2（P-TOS-07, P-TOS-08）；步驟實作需延遲自動重查以觀察訊息（重查會清空訊息）
    When 我查詢商家 "E000002" 的服務條款
    And 我填入生效日期 "20260101000000" 內容 "第一版條款內容" 註記 "first"
    And 我按下 "存檔"
    Then 存檔訊息應該包含 "OK version=1"

  Scenario: 建立新版次存檔成功
    # US-TOS-03 AC1、AC2；mock 無狀態：E000001 存檔回 OK version=3，自動重查仍顯示 v2
    When 我查詢商家 "E000001" 的服務條款
    And 我按下 "建立新版次"
    And 我填入生效日期 "20270101000000" 內容 "第三版條款內容" 註記 "v3"
    And 我按下 "存檔"
    Then 存檔訊息應該包含 "OK version=3"

  @mock
  Scenario: 後端存檔失敗時原樣顯示 FAIL 訊息
    # US-TOS-03 AC4（P-TOS-12）＋ US-COM-05 AC3（P-COM-16）
    When 我查詢商家 "E000002" 的服務條款
    And 我填入生效日期 "20260101000000" 內容 "內容含 FAIL 觸發失敗" 註記 ""
    And 我按下 "存檔"
    Then 存檔訊息應該包含 "FAIL Value too long"

  @legacy
  Scenario: 存檔後的訊息會被自動重查清空
    # US-TOS-03 AC3（P-TOS-09，現況如此：訊息僅在存檔回應到重查回應之間可見）
    When 我查詢商家 "E000002" 的服務條款
    And 我填入生效日期 "20260101000000" 內容 "第一版條款內容" 註記 ""
    And 我按下 "存檔"
    And 自動重查完成
    Then 存檔訊息應該是空的

  @legacy @mock
  Scenario: 內容空白直接存檔仍會送出且後端回必填失敗
    # US-TOS-03 AC4（P-TOS-12）＋ US-COM-06 AC2（P-COM-32：必填空值 → FAIL NULL not allowed）
    When 我查詢商家 "E000002" 的服務條款
    And 我按下 "存檔"
    Then 存檔訊息應該包含 "FAIL NULL not allowed"

  @legacy
  Scenario: 生效日期非 14 碼仍會送出
    # US-TOS-03 AC4（P-TOS-12，現況如此）
    When 我查詢商家 "E000002" 的服務條款
    And 我填入生效日期 "2026/01/01" 內容 "任意內容" 註記 ""
    And 我按下 "存檔"
    Then 存檔訊息應該包含 "OK version=1"

  @legacy
  Scenario: 商家代碼空白查詢仍會送出並顯示尚無條款
    # US-TOS-03 AC4（P-TOS-13 不檢核商家）＋ US-COM-06 AC1；mock 回 [] → 新增模式
    When 我查詢商家 "" 的服務條款
    Then 服務條款表單應該顯示
    And 目前內容應該包含 "(尚無服務條款)"

  @legacy @mock
  Scenario: 查詢時後端 500 畫面沒有任何變化
    # US-TOS-04 AC1（P-TOS-15，現況如此：非 JSON → 頁面不更新、無錯誤訊息）
    When 我查詢商家 "E500000" 的服務條款
    Then 服務條款表單應該隱藏

  @legacy @mock
  Scenario: 後端回非 JSON 時畫面沒有反應
    # US-TOS-04 AC1（P-TOS-15，現況如此）
    When 我查詢商家 "E999JSON" 的服務條款
    Then 服務條款表單應該隱藏

  @legacy
  Scenario: session 逾期後查詢誤入新增模式
    # US-TOS-04 AC2（P-TOS-16，現況如此：未登入查詢回 [] → 畫面顯示尚無條款、版次 1）
    When 我在另一個分頁登出
    And 我查詢商家 "E000001" 的服務條款
    Then 服務條款表單應該顯示
    And 服務條款版次應該顯示 "1"
    And 目前內容應該包含 "(尚無服務條款)"

  @mock
  Scenario: 條款內容含換行會保留換行顯示
    # SRS 4.6.1 畫面元素（#curContent 為 <pre>）；程式有但 AC 沒寫的呈現細節
    When 我查詢商家 "E000003" 的服務條款
    Then 目前內容應該包含多行文字:
      | 第一行：條款前言 |
      | 第二行：條款本文 |

  Scenario: 頁面顯示版次控管說明
    # US-TOS-02 AC3（P-TOS-10 的畫面提示）
    Then 頁面應該顯示說明 "版次由系統控管；建立後該版次不可修改"
