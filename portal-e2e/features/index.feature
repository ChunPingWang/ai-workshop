@index
Feature: 首頁功能選單 (US-HOME-01、US-COM-01～02，SRS 3.1～3.2、4.2)
  身為 Portal 使用者
  我想要在首頁瀏覽各 Portal 的功能入口
  以便前往要處理的工作

  Background:
    Given 我以 "sa" 身分登入 Portal
    And 我在首頁

  @smoke
  Scenario: 首頁顯示三組功能與七個入口
    Then 我應看見 "SA Portal"、"Merchant Portal" 與 "CSR Portal" 三個區塊
    And 首頁應顯示七個功能入口
    And 首頁不應有查詢或輸入欄位

  Scenario Outline: 不同帳號看到相同選單並顯示目前身分
    When 我以 "<帳號>" 身分重新登入 Portal
    Then 三個功能區塊與七個入口應保持相同
    And 頁首應顯示帳號與角色 "<帳號>"

    Examples:
      | 帳號 |
      | sa   |
      | cp   |
      | csr  |

  Scenario: 首頁入口只出現在對應業務區塊
    Then SA Portal 區塊應有交易報表、退款報表、對帳查詢與服務條款入口
    And Merchant Portal 區塊應有交易報表與銀行帳戶入口
    And Merchant Portal 區塊不應有退款報表入口
    And CSR Portal 區塊應有 CSR 交易查詢入口
    And 頂端導覽仍應提供退款報表入口

  Scenario Outline: 從首頁功能入口前往對應頁面
    When 我從 "<區塊>" 區塊點選首頁功能 "<功能>"
    Then 我應看見 "<頁面標題>" 頁面

    Examples:
      | 區塊            | 功能                       | 頁面標題              |
      | SA Portal       | 交易報表查詢               | 交易報表查詢          |
      | SA Portal       | 退款交易報表查詢           | 退款交易報表查詢      |
      | SA Portal       | OLS 每日/每月對帳結果查詢  | OLS 對帳結果查詢      |
      | SA Portal       | 服務條款設定               | 服務條款設定          |
      | Merchant Portal | 交易報表查詢               | 交易報表查詢          |
      | Merchant Portal | 商家銀行帳戶註冊           | 商家銀行帳戶註冊      |
      | CSR Portal      | 查詢 new-pay 交易紀錄      | 查詢 new-pay 交易紀錄 |

  Scenario: 登入後各頁共用相同的八個導覽連結
    Then 頂端導覽列應依序顯示首頁、交易報表、退款報表、對帳查詢、服務條款、銀行帳戶、CSR查詢與登出

  Scenario: 共用頁面樣式符合 Portal 視覺規格
    Then 頁面背景應為淡灰色
    And 內容區塊應為白底灰框
    And 按鈕應為深藍底白字

  Scenario: 登出後再次開啟首頁需要重新登入
    When 我按下登出
    And 我再次開啟首頁
    Then 我應看見登入頁

  Scenario: 從首頁完成一項查詢後可返回並開始另一項工作
    When 我從首頁開啟交易報表並查詢
    And 我回到首頁並開啟 CSR 交易查詢
    Then 我應看見 CSR 交易查詢頁面