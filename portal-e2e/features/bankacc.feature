@bankacc
Feature: 商家銀行帳戶註冊與查詢 (US-BNK-01～02、US-COM-04，SRS 3.5～3.6、4.7)
  身為商家
  我想要登記銀行帳戶與匯款幣別
  以便提供後續款項作業所需的帳戶資料

  Background:
    Given 我以 "cp" 身分登入 Portal
    And 我在商家銀行帳戶註冊頁

  @smoke
  Scenario: 銀行帳戶頁顯示預設輸入值
    Then 商家代碼應為 "E000001"
    And 銀行代碼與銀行帳號應為空白
    And 幣別應為 "NTD" 且外國銀行未勾選
    And 註冊訊息與帳戶清單應為空白

  @mock
  Scenario: 查詢並呈現商家所有銀行帳戶
    # Mockoon: routes/bankacc.json，merchantId=E000001 回傳兩筆
    When 我查詢已註冊帳戶
    Then 帳戶清單應顯示六個中文欄位
    And 清單應顯示國外帳戶 "USD" 狀態 "A" 與國內帳戶 "NTD" 狀態 "W"
    And 清單資料應依回應順序全部呈現

  @mock
  Scenario: 商家沒有銀行帳戶時仍顯示表頭
    # Mockoon: routes/bankacc.json，merchantId=E000002
    When 我將商家代碼設為 "E000002" 並查詢已註冊帳戶
    Then 清單應只有六個欄位表頭且沒有資料列

  @mock
  Scenario: 清單回非 JSON 時保留原畫面
    # Mockoon: routes/bankacc.json，merchantId=E999JSON
    Given 我先查詢已註冊帳戶
    When 我將商家代碼設為 "E999JSON" 並查詢已註冊帳戶
    Then 原有帳戶清單應保持不變
    And 畫面不應新增錯誤訊息

  @mock
  Scenario Outline: 帳戶清單後端錯誤時不重繪
    # Mockoon: routes/bankacc.json，商家代碼觸發 HTTP 錯誤
    Given 我先查詢已註冊帳戶
    When 我將商家代碼設為 "<商家>" 並查詢已註冊帳戶
    Then 原有帳戶清單應保持不變
    And 畫面不應新增錯誤訊息

    Examples:
      | 商家    |
      | E500000 |
      | E404000 |

  @mock
  Scenario: 註冊成功後自動更新清單且保留成功訊息
    # Mockoon: routes/bankacc.json，bankCode=007 回 OK；list 回應為固定樣本，不會持久化新資料
    When 我輸入銀行代碼 "007"、帳號 "1234567890123456" 並按註冊
    Then 註冊訊息應顯示 "OK"
    And 註冊完成後應自動查詢帳戶清單
    And 清單查詢完成後註冊訊息仍應保留

  @mock
  Scenario Outline: 不同幣別及國內外選項可送出
    # Mockoon: routes/bankacc.json，bankCode 777/776 觸發不同成功回應
    When 我選擇幣別 "<幣別>" 並設定國內外為 "<國內外>"
    And 我輸入銀行代碼 "<銀行代碼>" 與帳號 "987654321" 並註冊
    Then 註冊訊息應包含 "<回應>"

    Examples:
      | 幣別 | 國內外 | 銀行代碼 | 回應          |
      | USD  | 國外   | 777      | OK FOREIGN-USD|
      | NTD  | 國內   | 776      | OK DOMESTIC-NTD|

  @mock
  Scenario Outline: 必填或欄位長度錯誤由後端回覆
    # Mockoon: routes/bankacc.json，空值與 bankCode=999 觸發 FAIL
    When 我以銀行代碼 "<銀行代碼>" 與帳號 "<帳號>" 嘗試註冊
    Then 註冊訊息應包含 "FAIL"

    Examples:
      | 銀行代碼 | 帳號             |
      |          |                  |
      | 999      | 1234567890123456 |

  Scenario: 不因非數字或重複資料在畫面阻擋註冊
    When 我輸入非數字銀行代碼 "ABC" 與已使用帳號 "1234567890123456" 並註冊
    Then 畫面不應顯示格式或重複資料的前端驗證訊息

  Scenario: 未登入查詢銀行帳戶回空清單且存檔顯示未登入
    When 我在目前頁面登出後再次查詢清單
    Then 清單應只有六個欄位表頭
    When 我以未登入狀態送出帳戶註冊
    Then 註冊訊息應顯示 "please login"

  Scenario: 不同帳號均可使用銀行帳戶功能且狀態保持代碼
    When 我以 "sa" 身分重新登入並查詢已註冊帳戶
    Then 我應看見帳戶清單
    And 狀態欄應以 "A" 與 "W" 代碼顯示