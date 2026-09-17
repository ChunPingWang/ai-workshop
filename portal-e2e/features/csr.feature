@csr
Feature: CSR 交易查詢
  身為 Portal 使用者
  我想要操作 CSR 交易查詢
  以便驗證畫面行為與 backend 回應

  Background:
    Given 我以 "sa" 身分登入 Portal
    And 我在CSR 交易查詢頁

  Scenario: S-1 CSR 頁初始門號與說明正確
    Given 我已進入此功能頁
    When 我開啟頁面並查看欄位、按鈕與說明文字
    Then 畫面應該顯示：CSR 頁初始門號與說明正確

  @mock
  Scenario: S-2 0912345678 顯示交易與退款表
    Given 我已進入此功能頁
    When 我輸入情境值「0912345678」後按下查詢
    Then 畫面應該顯示：0912345678 顯示交易與退款表

  Scenario: S-3 交易表依 TX_DT 降冪顯示最新列
    Given 我已進入此功能頁
    When 我填寫查詢條件後按下查詢
    Then 畫面應該顯示：交易表依 TX_DT 降冪顯示最新列

  @mock
  Scenario: S-4 0900000000 兩張表皆零筆
    Given 我已進入此功能頁
    When 我輸入情境值「0900000000」後按下查詢
    Then 畫面應該顯示：0900000000 兩張表皆零筆

  @mock
  Scenario: S-5 0950000000 顯示 backend error
    Given 我已進入此功能頁
    When 我輸入情境值「0950000000」後按下查詢
    Then 畫面應該顯示：0950000000 顯示 backend error

  @legacy
  Scenario: S-6 門號空白仍送出並回預設
    Given 我已進入此功能頁
    When 我清空門號欄位後按下查詢
    Then 畫面應該顯示：門號空白仍送出並回預設

  @legacy
  Scenario: S-7 門號非數字仍送出
    Given 我已進入此功能頁
    When 我在門號欄輸入 09abc 後按下查詢
    Then 畫面應該顯示：門號非數字仍送出

  Scenario: S-8 交易表顯示商品名稱與商家資訊
    Given 我已進入此功能頁
    When 我開啟頁面並查看使用者可見的內容
    Then 畫面應該顯示：交易表顯示商品名稱與商家資訊

  Scenario: S-9 退款表顯示狀態與日期欄
    Given 我已進入此功能頁
    When 我開啟頁面並查看使用者可見的內容
    Then 畫面應該顯示：退款表顯示狀態與日期欄

  @mock
  Scenario: S-10 0910000010 顯示十列且 total rows 11
    Given 我已進入此功能頁
    When 我輸入情境值「0910000010」後按下查詢
    Then 畫面應該顯示：0910000010 顯示十列且 total rows 11
