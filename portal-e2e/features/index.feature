@index
Feature: 首頁功能選單 (US-HOME-01〜02, SRS 4.2)
  身為已登入使用者
  我想要在首頁看到全部功能的連結
  以便進入各功能頁

  Background:
    Given 我以 "sa" 身分登入 Portal

  Scenario: 首頁顯示三個 Portal 區塊
    # US-HOME-01 AC1（P-HOME-01）
    Then 首頁應該顯示區塊 "SA Portal (BO / PM / Finance BO)"
    And 首頁應該顯示區塊 "Merchant Portal (CP)"
    And 首頁應該顯示區塊 "CSR Portal"

  Scenario: 各區塊的選單連結數量與文字
    # US-HOME-01 AC1（P-HOME-01：三區塊共 7 個連結）、AC2（P-HOME-04：Merchant 區無退款連結）
    Then "SA Portal (BO / PM / Finance BO)" 區塊應該有 4 個連結
    And "Merchant Portal (CP)" 區塊應該有 2 個連結
    And "CSR Portal" 區塊應該有 1 個連結
    And 首頁應該顯示連結 "退款交易報表查詢"
    And 首頁應該顯示連結 "OLS 每日/每月對帳結果查詢"
    And 首頁應該顯示連結 "服務條款設定"
    And 首頁應該顯示連結 "商家銀行帳戶註冊"
    And 首頁應該顯示連結 "查詢 new-pay 交易紀錄"

  Scenario Outline: 首頁選單連結導到對應功能頁
    # US-HOME-01 AC3（P-HOME-05：點連結即離開首頁）
    # 「交易報表查詢」在 SA 區與 Merchant 區各有一個、目標相同（/report?type=trans），點第一個即可
    When 我點擊首頁選單的 "<連結>"
    Then 我應該看到頁面標題 "<標題>"

    Examples:
      | 連結                       | 標題                               |
      | 交易報表查詢               | 交易報表查詢                       |
      | 退款交易報表查詢           | 退款交易報表查詢                   |
      | OLS 每日/每月對帳結果查詢  | OLS 對帳結果查詢 (SA Portal)       |
      | 服務條款設定               | 服務條款設定 (SA Portal)           |
      | 商家銀行帳戶註冊           | 商家銀行帳戶註冊 (CP Portal)       |
      | 查詢 new-pay 交易紀錄      | 查詢 new-pay 交易紀錄 (CSR Portal) |

  @legacy
  Scenario: 首頁底部顯示選單未依角色過濾的註記
    # SRS 4.2.1 畫面元素之註記；程式與 SRS 皆有、AC 未單獨列
    Then 頁面應該顯示說明 "選單沒有依角色過濾"

  @legacy
  Scenario: csr 登入看到的首頁與 sa 相同且點得進 SA 區功能
    # US-HOME-02 AC1（P-HOME-02）＋ US-COM-02 AC1（P-COM-03，現況如此）
    Given 我以 "csr" 身分登入 Portal
    Then 首頁應該顯示連結 "服務條款設定"
    When 我點擊首頁選單的 "服務條款設定"
    Then 我應該看到頁面標題 "服務條款設定 (SA Portal)"

  Scenario: 首頁標題列顯示帳號與角色
    # US-HOME-02 AC2（P-HOME-03）
    Then 導覽列應該顯示登入者 "sa"
    And 導覽列應該顯示角色 "(sa)"
