@bankacc
Feature: 商家銀行帳戶註冊 (US-BNK-01〜04, SRS 4.7)
  身為 商家，
  我想要 註冊收款銀行帳戶並查看已註冊的帳戶與審核狀態，
  以便 new-pay 日後撥款到這個帳戶，並確認帳戶資料正確、是否已核准。

  # backend 回應見 mockoon/routes/bankacc.json。
  # 清單：E000001 → 2 筆（007 USD 國外 A、012 NTD 國內 W）／E000012 → 12 筆／E000077 → 註冊後的新帳戶 1 筆（W）／
  #       E500000 → 後端 500；其他 → []。
  # 註冊：銀行代碼或帳號空白 → FAIL NULL not allowed；代碼超過 3 碼或帳號超過 16 碼 → FAIL Value too long；
  #       777＋USD＋外國銀行 → OK FOREIGN-USD；776＋NTD＋國內 → OK DOMESTIC-NTD（@mock 參數檢查用）；
  #       商家 E500000 → 後端 500；其他 → OK。
  # Mockoon 無狀態：用商家 E000077 的清單模擬「註冊後出現新帳戶」。

  Background:
    Given 我以 "cp" 身分登入 Portal
    And 我在 "銀行帳戶" 頁面

  # ---------- A／B 初始狀態 ----------

  @smoke
  Scenario: 銀行帳戶註冊初始狀態
    Then 頁面標題應該是 "商家銀行帳戶註冊 (CP Portal)"
    And 瀏覽器分頁標題應該是 "商家銀行帳戶註冊"
    And "商家代碼" 欄應該是 "E000001"
    And "銀行代碼" 欄應該是空的
    And "銀行帳號" 欄應該是空的
    And "匯款幣別" 應該選擇 "新台幣(NTD)"
    And "外國銀行" 應該未勾選
    And 訊息區應該是空的
    And 帳戶清單區應該是空白
    And 頁面應該顯示提示 "送出後由 Finance 於 SA Portal 審核 (審核作業尚未提供, 狀態先掛 W)"

  Scenario: 匯款幣別只有新台幣與美金兩個選項
    Then "匯款幣別" 的選項應該依序是:
      | 新台幣(NTD) | 美金(USD) |

  # ---------- E／G 查詢已註冊帳戶 ----------

  @smoke
  Scenario: 查詢已註冊帳戶時以中文表頭顯示 6 欄
    When 我按下 "查詢已註冊帳戶"
    Then 帳戶清單的表頭應該依序是:
      | 商家 | 銀行代碼 | 帳號 | 幣別 | 國內外 | 狀態 |
    And 帳戶清單應該包含以下資料:
      | 商家    | 銀行代碼 | 帳號             | 幣別 | 國內外 | 狀態 |
      | E000001 | 007      | 1234567890123456 | USD  | 國外   | A    |
      | E000001 | 012      | 9876543210       | NTD  | 國內   | W    |
    And 帳戶清單區不應該出現文字 "total rows"

  Scenario: 沒有帳戶時清單只有表頭
    When 我在 "商家代碼" 欄輸入 "E000002"
    And 我按下 "查詢已註冊帳戶"
    Then 帳戶清單應該只有表頭列
    And 帳戶清單區不應該出現文字 "total rows"

  Scenario: 清單列出全部帳戶，不限 10 筆
    When 我在 "商家代碼" 欄輸入 "E000012"
    And 我按下 "查詢已註冊帳戶"
    Then 帳戶清單應該有 12 筆資料列

  @legacy
  Scenario: 清單查詢後端錯誤時清單不更新也沒有訊息
    # 現況如此（P-BNK-11）：回應非 JSON，畫面無變化
    When 我按下 "查詢已註冊帳戶"
    And 我在 "商家代碼" 欄輸入 "E500000"
    And 我按下 "查詢已註冊帳戶" 並等待回應
    Then 帳戶清單應該有 2 筆資料列
    And 訊息區應該是空的

  Scenario: 畫面沒有審核、刪除、修改功能
    When 我按下 "查詢已註冊帳戶"
    Then 帳戶清單中不應該有任何按鈕或連結

  # ---------- D／E 註冊 ----------

  @smoke
  Scenario: 註冊成功後清單自動刷新並出現待審核的新帳戶
    When 我在 "商家代碼" 欄輸入 "E000077"
    And 我在 "銀行代碼" 欄輸入 "812"
    And 我在 "銀行帳號" 欄輸入 "5555666677778888"
    And 我按下 "註冊"
    Then 訊息區應該顯示 "OK"
    And 帳戶清單應該包含以下資料:
      | 商家    | 銀行代碼 | 帳號             | 幣別 | 國內外 | 狀態 |
      | E000077 | 812      | 5555666677778888 | NTD  | 國內   | W    |

  @mock
  Scenario: 勾選外國銀行並選美金時以國外、美金註冊
    # 參數檢查：mock 只在 bankCode=777、currency=USD、isDomestic=N 時回 OK FOREIGN-USD
    When 我在 "銀行代碼" 欄輸入 "777"
    And 我在 "銀行帳號" 欄輸入 "1234567890"
    And 我在 "匯款幣別" 選擇 "美金(USD)"
    And 我勾選 "外國銀行"
    And 我按下 "註冊"
    Then 訊息區應該顯示 "OK FOREIGN-USD"

  @mock
  Scenario: 未勾選外國銀行並選新台幣時以國內、新台幣註冊
    # 參數檢查：mock 只在 bankCode=776、currency=NTD、isDomestic=Y 時回 OK DOMESTIC-NTD
    When 我在 "銀行代碼" 欄輸入 "776"
    And 我在 "銀行帳號" 欄輸入 "1234567890"
    And 我按下 "註冊"
    Then 訊息區應該顯示 "OK DOMESTIC-NTD"

  @legacy
  Scenario: 銀行代碼與帳號不檢查是否為數字
    # 現況如此（P-BNK-08、P-COM-30）
    When 我在 "銀行代碼" 欄輸入 "ABC"
    And 我在 "銀行帳號" 欄輸入 "ACCOUNT-01"
    And 我按下 "註冊"
    Then 訊息區應該顯示 "OK"

  @legacy
  Scenario: 同樣的資料可以重複註冊
    # 現況如此（P-BNK-08）：不檢查重複
    When 我在 "銀行代碼" 欄輸入 "812"
    And 我在 "銀行帳號" 欄輸入 "5555666677778888"
    And 我按下 "註冊"
    Then 訊息區應該顯示 "OK"
    When 我按下 "註冊"
    Then 訊息區應該顯示 "OK"

  @legacy
  Scenario: 商家代碼可自由輸入，不限登入的商家
    # 現況如此（P-BNK-14）
    When 我在 "商家代碼" 欄輸入 "E000088"
    And 我在 "銀行代碼" 欄輸入 "812"
    And 我在 "銀行帳號" 欄輸入 "1234567890"
    And 我按下 "註冊"
    Then 訊息區應該顯示 "OK"

  Scenario: 註冊訊息不會因為查詢清單而消失
    When 我在 "銀行代碼" 欄輸入 "812"
    And 我在 "銀行帳號" 欄輸入 "1234567890"
    And 我按下 "註冊"
    Then 訊息區應該顯示 "OK"
    When 我按下 "查詢已註冊帳戶"
    Then 帳戶清單應該有 2 筆資料列
    And 訊息區應該顯示 "OK"

  Scenario: 再次註冊時訊息換成新的回應
    When 我在 "銀行代碼" 欄輸入 "812"
    And 我在 "銀行帳號" 欄輸入 "1234567890"
    And 我按下 "註冊"
    Then 訊息區應該顯示 "OK"
    When 我在 "銀行代碼" 欄輸入 "0071"
    And 我按下 "註冊"
    Then 訊息區應該顯示以 "FAIL " 開頭的訊息

  # ---------- C／E 註冊失敗 ----------

  Scenario Outline: 註冊失敗：<情況>
    When 我在 "銀行代碼" 欄輸入 "<銀行代碼>"
    And 我在 "銀行帳號" 欄輸入 "<銀行帳號>"
    And 我按下 "註冊"
    Then 訊息區應該顯示以 "FAIL " 開頭的訊息
    And 訊息區應該顯示 "<訊息片段>"
    And 帳戶清單應該有 2 筆資料列

    Examples:
      | 情況                 | 銀行代碼 | 銀行帳號          | 訊息片段         |
      | 銀行代碼超過 3 碼    | 0071     | 1234567890        | Value too long   |
      | 銀行帳號超過 16 碼   | 007      | 12345678901234567 | Value too long   |
      | 銀行代碼空白         |          | 1234567890        | NULL not allowed |
      | 銀行帳號空白         | 007      |                   | NULL not allowed |

  Scenario: 後端錯誤時註冊顯示 FAIL 訊息
    When 我在 "商家代碼" 欄輸入 "E500000"
    And 我在 "銀行代碼" 欄輸入 "812"
    And 我在 "銀行帳號" 欄輸入 "1234567890"
    And 我按下 "註冊"
    Then 訊息區應該顯示以 "FAIL " 開頭的訊息

  # ---------- H 登入失效 ----------

  @legacy
  Scenario: 登入失效時註冊顯示 please login，清單變成只有表頭
    # 現況如此（P-BNK-11、P-COM-02）
    When 我的登入已失效
    And 我在 "銀行代碼" 欄輸入 "812"
    And 我在 "銀行帳號" 欄輸入 "1234567890"
    And 我按下 "註冊"
    Then 訊息區應該顯示 "please login"
    And 帳戶清單應該只有表頭列
