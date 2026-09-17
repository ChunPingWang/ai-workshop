@recon
Feature: OLS 對帳查詢
  身為 Portal 使用者
  我想要操作 OLS 對帳查詢
  以便驗證畫面行為與 backend 回應

  Background:
    Given 我以 "sa" 身分登入 Portal
    And 我在OLS 對帳查詢頁

  Scenario: N-1 對帳頁初始值與空結果正確
    Given 我已進入此功能頁
    When 我開啟頁面並查看欄位、按鈕與說明文字
    Then 畫面應該顯示：對帳頁初始值與空結果正確

  Scenario: N-2 類型下拉有每日與每月
    Given 我已進入此功能頁
    When 我展開畫面上的下拉選單
    Then 畫面應該顯示：類型下拉有每日與每月

  @mock
  Scenario: N-3 每日對帳顯示兩列
    Given 我已進入此功能頁
    When 我填寫查詢條件後按下查詢
    Then 畫面應該顯示：每日對帳顯示兩列

  @mock
  Scenario: N-4 每日對帳 20990101 查無資料
    Given 我已進入此功能頁
    When 我填寫查詢條件後按下查詢
    Then 畫面應該顯示：每日對帳 20990101 查無資料

  @mock
  Scenario: N-5 每月對帳顯示一列
    Given 我已進入此功能頁
    When 我填寫查詢條件後按下查詢
    Then 畫面應該顯示：每月對帳顯示一列

  @mock
  Scenario: N-6 每月對帳 20990101 查無資料
    Given 我已進入此功能頁
    When 我填寫查詢條件後按下查詢
    Then 畫面應該顯示：每月對帳 20990101 查無資料

  Scenario: N-7 切換類型後結果被覆蓋
    Given 我已進入此功能頁
    When 我切換畫面上的選項後再次查詢
    Then 畫面應該顯示：切換類型後結果被覆蓋

  @mock
  Scenario: N-8 R20260915 差異明細為零筆
    Given 我已進入此功能頁
    When 我開啟頁面並查看使用者可見的內容
    Then 畫面應該顯示：R20260915 差異明細為零筆

  @mock
  Scenario: N-9 R20260916 差異明細有一筆
    Given 我已進入此功能頁
    When 我開啟頁面並查看使用者可見的內容
    Then 畫面應該顯示：R20260916 差異明細有一筆

  Scenario: N-10 差異明細空白仍送出
    Given 我已進入此功能頁
    When 我清空差異明細欄位後按下查詢
    Then 畫面應該顯示：差異明細空白仍送出

  Scenario: N-11 明細與主查詢互相獨立
    Given 我已進入此功能頁
    When 我填寫查詢條件後按下查詢
    Then 畫面應該顯示：明細與主查詢互相獨立

  Scenario: N-12 主查詢 500 不影響明細區
    Given 我已進入此功能頁
    When 我填寫查詢條件後按下查詢
    Then 畫面應該顯示：主查詢 500 不影響明細區

  Scenario: N-13 頁面顯示二天後查詢說明
    Given 我已進入此功能頁
    When 我開啟頁面並查看欄位、按鈕與說明文字
    Then 畫面應該顯示：頁面顯示二天後查詢說明

  @unimplemented
  Scenario: N-14 多檔切分未實作
    Given 我已進入此功能頁
    When 我開啟頁面並查看使用者可見的內容
    Then 畫面應該顯示：多檔切分未實作
