@tos
Feature: 服務條款設定
  身為 Portal 使用者
  我想要操作 服務條款設定
  以便驗證畫面行為與 backend 回應

  Background:
    Given 我以 "sa" 身分登入 Portal
    And 我在服務條款設定頁

  Scenario: T-1 條款頁初始值與按鈕正確
    Given 我已進入此功能頁
    When 我開啟頁面並查看欄位、按鈕與說明文字
    Then 畫面應該顯示：條款頁初始值與按鈕正確

  @mock
  Scenario: T-2 E000002 顯示空白條款表單
    Given 我已進入此功能頁
    When 我輸入情境值「E000002」後按下查詢
    Then 畫面應該顯示：E000002 顯示空白條款表單

  @mock
  Scenario: T-3 E000001 顯示第二版並隱藏編輯
    Given 我已進入此功能頁
    When 我輸入情境值「E000001」後按下查詢
    Then 畫面應該顯示：E000001 顯示第二版並隱藏編輯

  Scenario: T-4 建立新版次顯示第三版空表單
    Given 我已進入此功能頁
    When 我查詢商家代碼 "E000001" 後建立新版次
    Then 版次應該顯示 "3"
    And 條款編輯區應該顯示且內容與註記為空白

  @mock
  Scenario: T-5 首次填寫存檔顯示成功並重查
    Given 我已進入此功能頁
    When 我以商家代碼 "E000002" 填寫新條款後存檔
    Then 存檔回應應該包含 "OK version=1"
    And 存檔後條款表單仍然顯示

  @mock
  Scenario: T-6 已有條款建立新版次後存檔成功
    Given 我已進入此功能頁
    When 我以商家代碼 "E000001" 建立新版次並存檔
    Then 存檔回應應該包含 "OK version=3"

  @mock
  Scenario: T-7 內容含 FAIL 顯示後端失敗訊息
    Given 我已進入此功能頁
    When 我在條款內容輸入 FAIL 後按下存檔
    Then 存檔回應應該包含 "FAIL Value too long"

  Scenario: T-8 存檔訊息會被下一次查詢清空
    Given 我已進入此功能頁
    When 我存檔後再次按下查詢
    Then 訊息區應該為空白

  @legacy
  Scenario: T-9 內容空白仍可存檔
    Given 我已進入此功能頁
    When 我清空條款內容後按下存檔
    Then 存檔回應應該包含 "OK version=1"

  @legacy
  Scenario: T-10 生效日期非十四碼仍送出
    Given 我已進入此功能頁
    When 我輸入非十四碼生效日期後按下存檔
    Then 存檔回應應該包含 "OK version=1"

  @legacy
  Scenario: T-11 商家代碼空白查詢顯示無條款
    Given 我已進入此功能頁
    When 我清空商家代碼後按下查詢
    Then 畫面應該顯示：商家代碼空白查詢顯示無條款

  @mock @legacy
  Scenario: T-12 條款查詢 500 時畫面不變
    Given 我已進入此功能頁
    When 我輸入會觸發服務條款 HTTP 500 的條件後按下查詢
    Then 畫面應該顯示：條款查詢 500 時畫面不變

  @mock @legacy
  Scenario: T-13 條款查詢非 JSON 時畫面不變
    Given 我已進入此功能頁
    When 我以 E999JSON 作為商家代碼後按下查詢
    Then 畫面應該顯示：條款查詢非 JSON 時畫面不變

  Scenario: T-14 內容換行在 pre 中保留
    Given 我已進入此功能頁
    When 我開啟頁面並查看使用者可見的內容
    Then 畫面應該顯示：內容換行在 pre 中保留

  Scenario: T-15 頁面顯示版次不可修改說明
    Given 我已進入此功能頁
    When 我開啟頁面並查看欄位、按鈕與說明文字
    Then 畫面應該顯示：頁面顯示版次不可修改說明
