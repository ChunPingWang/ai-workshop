@recon
Feature: OLS 對帳結果查詢 (US-RCN-01〜03, SRS 4.5)
  身為 SA 人員
  我想要查詢每日與每月對帳結果及差異明細
  以便確認與 OLS 的帳務一致

  # backend 回應見 mockoon/routes/recon.json：
  #   每日 from=20990101 → 0筆、from=20999999 → 後端500，其他 → 2筆（R20260915 一致、R20260916 有差異）
  #   每月 from=20990101 → 0筆，其他 → 1筆（M202608）
  #   明細 reconId=R20260916 → 1筆差異（RECON_RESULT 104），其他（含空值、M 開頭）→ 0筆

  Background:
    Given 我以 "sa" 身分登入 Portal
    And 我在對帳查詢頁

  Scenario: 對帳查詢初始畫面
    # US-RCN-01 AC1（P-RCN-01）
    Then 對帳類型應該選在 "每日對帳"
    And 對帳區間欄位值應該是 "20000101" 到 "20991231"
    And 結果區應該顯示 "請輸入條件查詢"
    And 差異明細區應該是空白

  Scenario: 對帳類型下拉有每日與每月兩個選項
    # US-RCN-01 AC1
    Then 對帳類型下拉應該恰好有選項:
      | 每日對帳 |
      | 每月對帳 |

  @smoke
  Scenario: 查詢每日對帳結果
    # US-RCN-02 AC1（P-RCN-02 八欄）、AC4（P-RCN-05 Y/N 與差異筆數）
    When 我按下查詢
    Then 結果表格應該有 2 筆資料
    And 結果區應該顯示 "total rows: 2"
    And 結果表格應該有 8 個欄位且第一欄是 "RECON_ID" 最後一欄是 "CP_FILE_NAME"
    And 結果表格應該包含以下資料:
      | RECON_ID  | RECON_RESULT_SUMMARY | DIFF_COUNT |
      | R20260915 | Y                    | 0          |
      | R20260916 | N                    | 1          |

  @mock
  Scenario: 每日對帳查未來區間查無資料
    # US-RCN-02 AC1（P-RCN-02 區間條件）
    When 我把對帳區間起改成 "20990101" 並按下查詢
    Then 結果表格應該有 0 筆資料
    And 結果區應該顯示 "total rows: 0"

  Scenario: 查詢每月對帳結果
    # US-RCN-02 AC2（P-RCN-03 七欄、無 Y/N 與差異欄）、AC3（P-RCN-04 M+yyyyMM）
    When 我把對帳類型改成 "每月對帳" 並按下查詢
    Then 結果表格應該有 1 筆資料
    And 結果表格應該有 7 個欄位且第一欄是 "RECON_ID" 最後一欄是 "CP_SUMMARY_FILE_NAME"
    And 結果表格應該包含以下資料:
      | RECON_ID | CP_TX_DT |
      | M202608  | 20260801 |

  @mock
  Scenario: 每月對帳查未來區間查無資料
    When 我把對帳類型改成 "每月對帳"
    And 我把對帳區間起改成 "20990101" 並按下查詢
    Then 結果表格應該有 0 筆資料

  Scenario: 切換對帳類型後再查詢結果被覆蓋
    # US-RCN-01 AC2（P-RCN-12：切換不清結果，但再查詢會覆蓋）
    When 我按下查詢
    Then 結果表格應該有 2 筆資料
    When 我把對帳類型改成 "每月對帳" 並按下查詢
    Then 結果表格應該有 1 筆資料
    And 結果區不應該包含 "R20260915"

  Scenario: 查詢對帳正常日期的差異明細為空
    # US-RCN-03 AC1（P-RCN-06：對帳一致 → 0 筆）
    When 我查詢差異明細 "R20260915"
    Then 差異明細表格應該有 0 筆資料

  Scenario: 查詢有差異日期的差異明細
    # US-RCN-03 AC1、AC2（P-RCN-07 二十欄）、AC6（P-RCN-11 代碼 104=Amount not match）
    When 我查詢差異明細 "R20260916"
    Then 差異明細表格應該有 1 筆資料
    And 差異明細表格應該有 20 個欄位且第一欄是 "RECON_ID" 最後一欄是 "RECON_MESSAGE"
    And 差異明細表格應該包含以下資料:
      | RECON_ID  | TOTAL_AMOUNT | ROUND_AMOUNT | RECON_RESULT | RECON_MESSAGE    |
      | R20260916 | 100          | 90           | 104          | Amount not match |

  Scenario: 每月對帳的 RECON_ID 查差異明細必為空
    # US-RCN-03 AC3（P-RCN-08：明細只查每日表）
    When 我查詢差異明細 "M202608"
    Then 差異明細表格應該有 0 筆資料

  @legacy
  Scenario: 差異明細 RECON_ID 空白仍會送出查詢
    # US-RCN-03 AC4（P-RCN-09，現況如此：不提示）
    When 我查詢差異明細 ""
    Then 差異明細表格應該有 0 筆資料

  Scenario: 差異明細與主查詢互相獨立
    # US-RCN-03 AC5（P-RCN-10）
    When 我查詢差異明細 "R20260916"
    And 我按下查詢
    Then 結果表格應該有 2 筆資料
    And 差異明細表格應該有 1 筆資料

  @mock
  Scenario: 主查詢後端錯誤不影響差異明細區
    # US-RCN-03 AC5 ＋ US-COM-05 AC2
    When 我查詢差異明細 "R20260916"
    And 我把對帳區間起改成 "20999999" 並按下查詢
    Then 查詢結果應該顯示後端錯誤
    And 差異明細表格應該有 1 筆資料

  Scenario: 頁面顯示對帳資料延遲兩天的註記
    # SRS 4.5.1 畫面元素（頁面說明文字）
    Then 頁面應該顯示說明 "要看完整的交易資料，需在二天後"
