@tos
Feature: 服務條款查詢與版本管理 (US-TOS-01～03、US-COM-04，SRS 3.5～3.6、4.6)
  身為產品經理
  我想要輸入生效日期與條款內容並存檔
  以便發布商家的新條款版本

  Background:
    Given 我以 "sa" 身分登入 Portal
    And 我在服務條款設定頁

  @smoke
  Scenario: 條款頁初始只顯示商家代碼與查詢按鈕
    Then 商家代碼應為 "E000001"
    And 條款表單、版次、內容與訊息區應隱藏

  @mock
  Scenario: 查詢商家後檢視最新版本
    # Mockoon: routes/tos.json，merchantID=E000001 回 v2 與 v1
    When 我查詢商家 "E000001" 的服務條款
    Then 畫面應顯示最新版次 "2" 與最新版條款內容
    And 畫面應顯示新版條款網址
    And 編輯區與存檔按鈕應隱藏且建立新版次按鈕應顯示

  @mock
  Scenario: 查詢單一版本且保留內容換行
    # Mockoon: routes/tos.json，merchantID=E000003 回傳一版含換行內容
    When 我查詢商家 "E000003" 的服務條款
    Then 畫面應顯示版次 "1"
    And 條款內容應保留兩行文字

  @mock
  Scenario: 商家尚無條款時進入新增模式
    # Mockoon: routes/tos.json，merchantID=E000002 回傳 []
    When 我查詢商家 "E000002" 的服務條款
    Then 畫面應顯示版次 "1" 與 "(尚無服務條款)"
    And 編輯區與存檔按鈕應顯示
    And 建立新版次按鈕應隱藏

  @mock
  Scenario: 建立新版次後回到檢視狀態
    # Mockoon 無狀態：存檔回 OK version=3，但重查仍固定回 v2；只驗存檔訊息與頁面狀態轉換
    # 測試步驟需延遲第二次 /tos/data 回應，才能觀察短暫存檔訊息
    Given 我查詢商家 "E000001" 的服務條款
    When 我按下建立新版次
    Then 畫面應預覽版次 "3" 且編輯區應顯示
    When 我輸入生效日期 "20260916090000"、內容 "新條款 v3" 與註記 "BDD" 並存檔
    Then 訊息區應短暫顯示 "OK version=3"
    And 存檔後應自動重新查詢且回到條款檢視狀態

  @mock
  Scenario: 新商家第一筆條款存檔成功後自動重查
    # Mockoon: routes/tos.json，merchantID=E000002 回 OK version=1；重查仍回固定空陣列
    Given 我查詢商家 "E000002" 的服務條款
    When 我輸入生效日期 "20260916090000" 與內容 "第一版條款" 並存檔
    Then 訊息區應短暫顯示 "OK version=1"
    And 存檔後應自動重新查詢

  Scenario: 新版次清空內容與註記但保留生效日期
    # Mockoon 無狀態，存檔重查仍為 v2；用同一頁驗證欄位在 S3→S2→S3 轉換後的保留狀態
    Given 我查詢商家 "E000001" 的服務條款
    When 我建立新版次並輸入生效日期 "20260916090000"、內容 "測試條款" 與註記 "暫存" 後存檔
    And 自動重查回到檢視狀態後我再次建立新版次
    Then 條款內容與註記應為空白
    And 生效日期欄應保留 "20260916090000"
    And 舊版內容與網址仍應可見

  @mock
  Scenario Outline: 條款存檔失敗仍會自動重查
    # Mockoon: routes/tos.json，content=FAIL、空內容或超長 merchantID 分別觸發失敗
    # 測試步驟需延遲重查回應，才能觀察短暫 FAIL 訊息
    Given 我在新增服務條款模式
    When 我以商家 "<商家>"、生效日期 "<生效日期>" 與內容 "<內容>" 存檔
    Then 訊息區應短暫顯示 "FAIL"
    And 存檔失敗後仍應自動重新查詢

    Examples:
      | 商家         | 生效日期        | 內容     |
      | E000001      | 20260916090000 | FAIL     |
      | E000001      | 20260916090000 |          |
      | E00000000000 | 20260916090000 | 條款內容 |
      | E000001      | 202609160900001| 條款內容 |

  @mock
  Scenario: 條款內容含單引號時存檔失敗
    # Mockoon: routes/tos.json，content 含單引號
    Given 我在新增服務條款模式
    When 我輸入含單引號的內容並存檔
    Then 訊息區應短暫顯示 "FAIL"
    And 存檔失敗後仍應自動重新查詢

  @mock
  Scenario: 查詢回應不是 JSON 時不更新畫面
    # Mockoon: routes/tos.json，merchantID=E999JSON 回純文字
    When 我查詢商家 "E999JSON" 的服務條款
    Then 條款表單仍應隱藏
    And 畫面不應新增錯誤訊息

  @mock
  Scenario: 條款查詢後端回 HTTP 500 時畫面不變
    # Mockoon: routes/tos.json，merchantID=E500000
    When 我查詢商家 "E500000" 的服務條款
    Then 條款表單仍應隱藏
    And 畫面不應新增錯誤訊息

  @mock
  Scenario Outline: 直接開啟公開服務條款
    # Mockoon: routes/tos.json 的 /getToS.jsp，不經 Portal
    When 我直接開啟商家 "<商家>" 的條款頁並指定版次 "<版次>"
    Then 條款頁應顯示 "<預期內容>"

    Examples:
      | 商家    | 版次 | 預期內容 |
      | E000001 | 2    | 服務條款 v2 |
      | E000001 | 1    | 服務條款 v1 |
      | E000002 | 2    | NO ToS      |

  Scenario: 未指定商家與版次時顯示全域最新版條款
    # Mockoon: routes/tos.json，/getToS.jsp 不帶 merchantID 與 version
    When 我直接開啟未指定商家與版次的條款頁
    Then 條款頁應顯示全域預設條款

  Scenario: 未指定版次時顯示指定商家的最新條款
    # Mockoon: routes/tos.json，/getToS.jsp?merchantID=E000001 不帶 version
    When 我直接開啟商家 "E000001" 且不指定版次的條款頁
    Then 條款頁應顯示 "服務條款 v2"

  Scenario: 未登入查詢條款會進新增模式且存檔回覆未登入訊息
    When 我在目前條款頁清除登入狀態後重新查詢
    Then 畫面應顯示版次 "1" 與 "(尚無服務條款)"
    When 我以未登入狀態存檔服務條款
    Then 訊息區應短暫顯示 "please login"

  Scenario: 已建立的版本沒有修改入口
    Given 我查詢商家 "E000001" 的服務條款
    Then 編輯區應隱藏
    And 畫面只應提供建立新版次的操作