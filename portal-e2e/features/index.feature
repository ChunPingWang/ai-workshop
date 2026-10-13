@index
Feature: 首頁功能選單與導覽列 (US-HOME-01〜02, US-COM-02, SRS 4.2、3.2)
  身為 Portal 使用者，
  我想要 在首頁看到依業務分類的功能清單，每一頁都有一致的導覽列並看得到目前登入的帳號，
  以便 一眼找到要用的功能、隨時切換頁面並確認自己的身分。

  # 本檔不打 backend；跨頁流程中的交易報表查詢用 Mockoon 預設回應（mockoon/routes/report.json）。

  Background:
    Given 我以 "sa" 身分登入 Portal
    And 我在 "首頁" 頁面

  # ---------- A／B 首頁內容 ----------

  @smoke
  Scenario: 首頁功能選單分三個區塊共 7 個連結
    Then 頁面標題應該是 "功能選單"
    And 功能選單應該包含以下連結:
      | 區塊                            | 連結                       |
      | SA Portal (BO / PM / Finance BO) | 交易報表查詢               |
      | SA Portal (BO / PM / Finance BO) | 退款交易報表查詢           |
      | SA Portal (BO / PM / Finance BO) | OLS 每日/每月對帳結果查詢  |
      | SA Portal (BO / PM / Finance BO) | 服務條款設定               |
      | Merchant Portal (CP)            | 交易報表查詢               |
      | Merchant Portal (CP)            | 商家銀行帳戶註冊           |
      | CSR Portal                      | 查詢 new-pay 交易紀錄      |

  Scenario Outline: 點「<區塊>」區塊的「<連結>」進入<頁面標題>
    When 我點選 "<區塊>" 區塊的 "<連結>"
    Then 頁面標題應該是 "<頁面標題>"

    Examples:
      | 區塊                            | 連結                      | 頁面標題                          |
      | SA Portal (BO / PM / Finance BO) | 交易報表查詢              | 交易報表查詢                      |
      | SA Portal (BO / PM / Finance BO) | 退款交易報表查詢          | 退款交易報表查詢                  |
      | SA Portal (BO / PM / Finance BO) | OLS 每日/每月對帳結果查詢 | OLS 對帳結果查詢 (SA Portal)      |
      | SA Portal (BO / PM / Finance BO) | 服務條款設定              | 服務條款設定 (SA Portal)          |
      | Merchant Portal (CP)            | 交易報表查詢              | 交易報表查詢                      |
      | Merchant Portal (CP)            | 商家銀行帳戶註冊          | 商家銀行帳戶註冊 (CP Portal)      |
      | CSR Portal                      | 查詢 new-pay 交易紀錄     | 查詢 new-pay 交易紀錄 (CSR Portal) |

  @legacy
  Scenario: 商家區塊沒有退款報表連結
    # 現況如此（P-HOME-04）：商家要看退款報表需從導覽列進入
    Then "Merchant Portal (CP)" 區塊不應該有 "退款交易報表查詢" 連結
    When 我點選導覽列的 "退款報表"
    Then 頁面標題應該是 "退款交易報表查詢"

  Scenario: 首頁沒有任何查詢或輸入欄位
    Then 頁面上不應該有任何輸入欄位或按鈕

  # ---------- B／G 標題列身分顯示 ----------

  Scenario Outline: 以 <帳號> 登入時首頁標題列顯示帳號與角色
    Given 我以 "<帳號>" 身分登入 Portal
    When 我開啟 "首頁" 頁面
    Then 標題列應該顯示 "new-pay Portal | <帳號> (<帳號>)"

    Examples:
      | 帳號 |
      | sa   |
      | cp   |
      | csr  |

  @legacy
  Scenario Outline: 以 <帳號> 登入時首頁內容與其他身分完全相同
    # 現況如此（P-HOME-02、P-COM-09）：選單不依角色過濾
    Given 我以 "<帳號>" 身分登入 Portal
    When 我開啟 "首頁" 頁面
    Then 功能選單應該有 3 個區塊共 7 個連結
    And 頁面應該顯示提示 "註: 選單沒有依角色過濾, 誰登入都看得到全部功能 (先求有)"

    Examples:
      | 帳號 |
      | cp   |
      | csr  |

  Scenario Outline: <頁面>的標題列只顯示帳號、不顯示角色
    When 我開啟 "<頁面>" 頁面
    Then 標題列應該顯示 "new-pay Portal | sa"
    And 標題列不應該顯示角色

    Examples:
      | 頁面     |
      | 交易報表 |
      | 退款報表 |
      | 對帳查詢 |
      | 服務條款 |
      | 銀行帳戶 |
      | CSR查詢  |

  # ---------- H 導覽列 ----------

  Scenario Outline: <頁面>的導覽列依序有 8 個連結
    When 我開啟 "<頁面>" 頁面
    Then 導覽列應該依序有以下連結:
      | 首頁 | 交易報表 | 退款報表 | 對帳查詢 | 服務條款 | 銀行帳戶 | CSR查詢 | 登出 |

    Examples:
      | 頁面     |
      | 首頁     |
      | 交易報表 |
      | 退款報表 |
      | 對帳查詢 |
      | 服務條款 |
      | 銀行帳戶 |
      | CSR查詢  |

  @legacy
  Scenario Outline: 以 <帳號> 登入時導覽列一樣有 8 個連結
    # 現況如此（P-COM-09）：導覽列不依角色顯示或隱藏
    Given 我以 "<帳號>" 身分登入 Portal
    When 我開啟 "首頁" 頁面
    Then 導覽列應該依序有以下連結:
      | 首頁 | 交易報表 | 退款報表 | 對帳查詢 | 服務條款 | 銀行帳戶 | CSR查詢 | 登出 |

    Examples:
      | 帳號 |
      | cp   |
      | csr  |

  Scenario Outline: 點導覽列的「<連結>」進入對應頁面
    When 我點選導覽列的 "<連結>"
    Then 頁面標題應該是 "<頁面標題>"

    Examples:
      | 連結     | 頁面標題                          |
      | 交易報表 | 交易報表查詢                      |
      | 退款報表 | 退款交易報表查詢                  |
      | 對帳查詢 | OLS 對帳結果查詢 (SA Portal)      |
      | 服務條款 | 服務條款設定 (SA Portal)          |
      | 銀行帳戶 | 商家銀行帳戶註冊 (CP Portal)      |
      | CSR查詢  | 查詢 new-pay 交易紀錄 (CSR Portal) |
      | 首頁     | 功能選單                          |

  Scenario Outline: <頁面>的瀏覽器分頁標題
    When 我開啟 "<頁面>" 頁面
    Then 瀏覽器分頁標題應該是 "<分頁標題>"

    Examples:
      | 頁面     | 分頁標題          |
      | 首頁     | new-pay Portal    |
      | 交易報表 | 交易報表查詢      |
      | 退款報表 | 交易報表查詢      |
      | 對帳查詢 | OLS 對帳結果查詢  |
      | 服務條款 | 服務條款設定      |
      | 銀行帳戶 | 商家銀行帳戶註冊  |
      | CSR查詢  | CSR 交易查詢      |

  # ---------- G 外觀與資源 ----------

  Scenario: 頁面外觀一致
    When 我開啟 "交易報表" 頁面
    Then 標題列應該是深藍底色
    And 頁面背景應該是淡灰藍色
    And 內容區塊應該是白底灰框
    And 提示文字應該是紅色小字
    And "查詢" 按鈕應該是深藍底白字
    And 中文字應該正常顯示

  Scenario Outline: <頁面>只載入站內資源、不依賴外部網路
    When 我開啟 "<頁面>" 頁面
    Then 頁面載入的資源都應該來自 Portal 本身

    Examples:
      | 頁面     |
      | 首頁     |
      | 交易報表 |
      | 對帳查詢 |
      | 服務條款 |
      | 銀行帳戶 |
      | CSR查詢  |

  # ---------- I 跨頁流程 ----------

  Scenario: 從首頁進入交易報表查詢後，回首頁再進入 CSR 查詢
    # backend 回應見 mockoon/routes/report.json（預設 3 筆）
    When 我點選 "SA Portal (BO / PM / Finance BO)" 區塊的 "交易報表查詢"
    And 我按下 "查詢"
    Then 結果表格應該有 3 筆資料列
    When 我點選導覽列的 "首頁"
    And 我點選 "CSR Portal" 區塊的 "查詢 new-pay 交易紀錄"
    Then 頁面標題應該是 "查詢 new-pay 交易紀錄 (CSR Portal)"
    And 結果區應該顯示 "請輸入門號查詢"
