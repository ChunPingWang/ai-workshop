@report
Feature: 交易與退款報表
  身為 Portal 使用者
  我想要操作 交易與退款報表
  以便驗證畫面行為與 backend 回應

  Background:
    Given 我以 "sa" 身分登入 Portal
    And 我在交易與退款報表頁

  Scenario: R-1 交易報表顯示標題、商家與時間類型
    Given 我已進入此功能頁
    When 我開啟頁面並查看欄位、按鈕與說明文字
    Then 畫面應該顯示：交易報表顯示標題、商家與時間類型

  Scenario: R-2 退款報表隱藏商家與時間類型
    Given 我已進入此功能頁
    When 我開啟頁面並查看使用者可見的內容
    Then 畫面應該顯示：退款報表隱藏商家與時間類型

  Scenario: R-3 不帶 type 等同交易報表
    Given 我已進入此功能頁
    When 我開啟頁面並查看使用者可見的內容
    Then 畫面應該顯示：不帶 type 等同交易報表

  @legacy
  Scenario: R-4 未知 type 仍走交易報表
    Given 我已進入此功能頁
    When 我開啟頁面並查看使用者可見的內容
    Then 畫面應該顯示：未知 type 仍走交易報表

  Scenario: R-5 交易報表初始欄位與提示正確
    Given 我已進入此功能頁
    When 我開啟頁面並查看欄位、按鈕與說明文字
    Then 畫面應該顯示：交易報表初始欄位與提示正確

  Scenario: R-6 小時下拉包含 00 到 23
    Given 我已進入此功能頁
    When 我展開畫面上的下拉選單
    Then 畫面應該顯示：小時下拉包含 00 到 23

  Scenario: R-7 查詢送出日期加小時的十碼區間
    Given 我已進入此功能頁
    When 我填寫查詢條件後按下查詢
    Then 畫面應該顯示：查詢送出日期加小時的十碼區間

  @mock
  Scenario: R-8 E000001 顯示三列十二欄
    Given 我已進入此功能頁
    When 我輸入情境值「E000001」後按下查詢
    Then 畫面應該顯示：E000001 顯示三列十二欄

  @mock
  Scenario: R-9 E000002 顯示零列
    Given 我已進入此功能頁
    When 我輸入情境值「E000002」後按下查詢
    Then 畫面應該顯示：E000002 顯示零列

  @mock
  Scenario: R-10 E010000 顯示十列
    Given 我已進入此功能頁
    When 我輸入情境值「E010000」後按下查詢
    Then 畫面應該顯示：E010000 顯示十列

  @mock
  Scenario: R-11 E011000 顯示十列且 total rows 11
    Given 我已進入此功能頁
    When 我輸入情境值「E011000」後按下查詢
    Then 畫面應該顯示：E011000 顯示十列且 total rows 11

  @mock
  Scenario: R-12 E500000 顯示 backend error
    Given 我已進入此功能頁
    When 我輸入情境值「E500000」後按下查詢
    Then 畫面應該顯示：E500000 顯示 backend error

  @mock
  Scenario: R-13 授權時間查詢顯示結果
    Given 我已進入此功能頁
    When 我填寫查詢條件後按下查詢
    Then 畫面應該顯示：授權時間查詢顯示結果

  Scenario: R-14 商家清空仍送出並回預設資料
    Given 我已進入此功能頁
    When 我清空商家欄位後按下查詢
    Then 畫面應該顯示：商家清空仍送出並回預設資料

  @legacy
  Scenario: R-15 日期非八碼仍送出
    Given 我已進入此功能頁
    When 我將日期輸入為 2026-09-15 後按下查詢
    Then 畫面應該顯示：日期非八碼仍送出

  @legacy
  Scenario: R-16 起日大於迄日仍送出
    Given 我已進入此功能頁
    When 我輸入起日大於迄日後按下查詢
    Then 畫面應該顯示：起日大於迄日仍送出

  @mock
  Scenario: R-17 退款報表顯示六欄一列
    Given 我已進入此功能頁
    When 我填寫查詢條件後按下查詢
    Then 畫面應該顯示：退款報表顯示六欄一列

  @mock
  Scenario: R-18 退款報表 2099 區間查無資料
    Given 我已進入此功能頁
    When 我填寫查詢條件後按下查詢
    Then 畫面應該顯示：退款報表 2099 區間查無資料

  Scenario: R-19 退款查詢不帶商家與時間類型
    Given 我已進入此功能頁
    When 我填寫查詢條件後按下查詢
    Then 畫面應該顯示：退款查詢不帶商家與時間類型

  Scenario: R-20 從交易報表點退款報表會切換標題
    Given 我已進入此功能頁
    When 我切換畫面上的選項後再次查詢
    Then 畫面應該顯示：從交易報表點退款報表會切換標題

  @unimplemented
  Scenario: R-21 匯出 CSV 未實作
    Given 我已進入此功能頁
    When 我開啟頁面並查看使用者可見的內容
    Then 畫面應該顯示：匯出 CSV 未實作
