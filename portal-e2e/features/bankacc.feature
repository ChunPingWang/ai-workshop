@bankacc
Feature: 銀行帳戶註冊
  身為 Portal 使用者
  我想要操作 銀行帳戶註冊
  以便驗證畫面行為與 backend 回應

  Background:
    Given 我以 "sa" 身分登入 Portal
    And 我在銀行帳戶註冊頁

  Scenario: K-1 銀行帳戶頁初始值正確
    Given 我已進入此功能頁
    When 我開啟頁面並查看欄位、按鈕與說明文字
    Then 畫面應該顯示：銀行帳戶頁初始值正確

  Scenario: K-2 幣別下拉有 NTD 與 USD
    Given 我已進入此功能頁
    When 我展開畫面上的下拉選單
    Then 畫面應該顯示：幣別下拉有 NTD 與 USD

  @mock
  Scenario: K-3 E000001 顯示兩筆帳戶與國內外狀態
    Given 我已進入此功能頁
    When 我輸入情境值「E000001」後按下查詢
    Then 畫面應該顯示：E000001 顯示兩筆帳戶與國內外狀態

  @mock
  Scenario: K-4 E000009 顯示空表頭
    Given 我已進入此功能頁
    When 我輸入情境值「E000009」後按下查詢
    Then 畫面應該顯示：E000009 顯示空表頭

  @mock
  Scenario: K-5 註冊 NTD 國內帳戶顯示 OK 並查詢列表
    Given 我已進入此功能頁
    When 我填寫表單後按下畫面上的送出或存檔按鈕
    Then 畫面應該顯示：註冊 NTD 國內帳戶顯示 OK 並查詢列表

  Scenario: K-6 註冊 USD 外國帳戶送出正確值
    Given 我已進入此功能頁
    When 我填寫表單後按下畫面上的送出或存檔按鈕
    Then 畫面應該顯示：註冊 USD 外國帳戶送出正確值

  Scenario: K-7 未勾外國銀行送出國內
    Given 我已進入此功能頁
    When 我開啟頁面並查看使用者可見的內容
    Then 畫面應該顯示：未勾外國銀行送出國內

  @mock
  Scenario: K-8 bankCode 999 顯示 FAIL
    Given 我已進入此功能頁
    When 我將銀行代碼輸入 999 後按下註冊
    Then 畫面應該顯示：bankCode 999 顯示 FAIL

  @legacy
  Scenario: K-9 銀行代碼與帳號空白仍送出
    Given 我已進入此功能頁
    When 我清空銀行代碼與帳號後按下註冊
    Then 畫面應該顯示：銀行代碼與帳號空白仍送出

  @legacy
  Scenario: K-10 帳號非數字仍送出
    Given 我已進入此功能頁
    When 我在帳號欄輸入非數字文字後按下註冊
    Then 畫面應該顯示：帳號非數字仍送出

  Scenario: K-11 註冊後訊息保留到下次註冊
    Given 我已進入此功能頁
    When 我完成一次註冊後再次註冊另一個帳戶
    Then 畫面應該顯示：註冊後訊息保留到下次註冊

  @mock @legacy
  Scenario: K-12 列表 500 時畫面不變
    Given 我已進入此功能頁
    When 我輸入會觸發列表 HTTP 500 的條件後按下查詢
    Then 畫面應該顯示：列表 500 時畫面不變

  Scenario: K-13 頁面顯示 Finance 審核說明
    Given 我已進入此功能頁
    When 我開啟頁面並查看欄位、按鈕與說明文字
    Then 畫面應該顯示：頁面顯示 Finance 審核說明

  @unimplemented
  Scenario: K-14 Finance 審核未實作
    Given 我已進入此功能頁
    When 我開啟頁面並查看使用者可見的內容
    Then 畫面應該顯示：Finance 審核未實作
