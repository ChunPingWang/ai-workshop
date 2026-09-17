@index
Feature: 首頁功能選單
  身為已登入使用者
  我想要使用首頁功能選單
  以便進入各項 Portal 功能

  Background:
    Given 我以 "sa" 身分登入 Portal
    And 我在首頁頁

  Scenario: I-1 首頁顯示三個 Portal 區塊標題
    Given 我已進入此功能頁
    When 我開啟頁面並查看欄位、按鈕與說明文字
    Then 畫面應該顯示：首頁顯示三個 Portal 區塊標題

  Scenario: I-2 首頁顯示各區塊連結與 FSD 章節
    Given 我已進入此功能頁
    When 我開啟頁面並查看使用者可見的內容
    Then 畫面應該顯示：首頁顯示各區塊連結與 FSD 章節

  Scenario: I-3 首頁連結導到對應功能頁
    Given 我已進入此功能頁
    When 我點擊畫面上的導覽或功能連結
    Then 畫面應該顯示：首頁連結導到對應功能頁

  @legacy
  Scenario: I-4 首頁顯示未依角色過濾註記
    Given 我已進入此功能頁
    When 我開啟頁面並查看使用者可見的內容
    Then 畫面應該顯示：首頁顯示未依角色過濾註記

  @legacy
  Scenario: I-5 csr 也看得到並能進入 SA 連結
    Given 我已進入此功能頁
    When 我點擊畫面上的導覽或功能連結
    Then 畫面應該顯示：csr 也看得到並能進入 SA 連結
