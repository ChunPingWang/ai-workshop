@login
Feature: 登入與共通行為
  身為 Portal 使用者
  我想要操作 登入與共通行為
  以便驗證畫面行為與 backend 回應

  Background:
    Given 我以 "sa" 身分登入 Portal
    And 我在登入與共通行為頁

  Scenario: C-1 未登入直接開所有功能頁會導回登入頁
    Given 我已進入此功能頁
    When 我在未登入狀態分別開啟 /report、/recon、/tos、/bankacc、/csr 與 /
    Then 畫面應該顯示：未登入直接開所有功能頁會導回登入頁

  @legacy
  Scenario: C-2 未登入直接打查詢 ajax 會回 please login
    Given 我已進入此功能頁
    When 我在未登入狀態請求 /report/data、/recon/data、/recon/detail 與 /csr/data
    Then 畫面應該顯示：未登入直接打查詢 ajax 會回 please login

  @legacy
  Scenario: C-3 未登入直接打條款或帳戶查詢會回空陣列
    Given 我已進入此功能頁
    When 我在未登入狀態請求 /tos/data 與 /bankacc/data
    Then 畫面應該顯示：未登入直接打條款或帳戶查詢會回空陣列

  @legacy
  Scenario: C-4 sa、cp、csr 都能開每個功能頁
    Given 我已進入此功能頁
    When 我分別以 sa、cp、csr 登入後開啟每個功能頁
    Then 畫面應該顯示：sa、cp、csr 都能開每個功能頁

  Scenario: C-5 導覽列八個連結導到正確頁
    Given 我已進入此功能頁
    When 我點擊畫面上的導覽或功能連結
    Then 畫面應該顯示：導覽列八個連結導到正確頁

  Scenario: C-6 導覽列顯示登入者帳號與角色
    Given 我已進入此功能頁
    When 我點擊畫面上的導覽或功能連結
    Then 畫面應該顯示：導覽列顯示登入者帳號與角色

  @legacy
  Scenario: C-7 登出後按上一頁再打 ajax 仍回 please login
    Given 我已進入此功能頁
    When 我點擊導覽列的「登出」並重新操作頁面
    Then 畫面應該顯示：登出後按上一頁再打 ajax 仍回 please login

  @legacy
  Scenario: C-8 登出後重開首頁回登入頁
    Given 我已進入此功能頁
    When 我點擊導覽列的「登出」並重新操作頁面
    Then 畫面應該顯示：登出後重開首頁回登入頁

  @legacy
  Scenario: C-9 查詢先顯示查詢中
    Given 我已進入此功能頁
    When 我在查詢頁按下查詢按鈕
    Then 畫面應該顯示：查詢先顯示查詢中

  @legacy
  Scenario: C-10 連續查詢第二次覆蓋第一次結果
    Given 我已進入此功能頁
    When 我用兩組不同條件連續按下查詢兩次
    Then 畫面應該顯示：連續查詢第二次覆蓋第一次結果

  @legacy
  Scenario: C-11 backend 500 顯示 backend error
    Given 我已進入此功能頁
    When 我輸入會觸發 HTTP 500 的條件後按下查詢
    Then 畫面應該顯示：backend 500 顯示 backend error

  @legacy
  Scenario: C-12 backend 404 顯示 backend error
    Given 我已進入此功能頁
    When 我輸入會觸發 HTTP 404 的條件後按下查詢
    Then 畫面應該顯示：backend 404 顯示 backend error

  @legacy
  Scenario: C-13 回應中的粗體 HTML 會被直接呈現
    Given 我已進入此功能頁
    When 我查詢會回傳 <b> 標記的資料
    Then 畫面應該顯示：回應中的粗體 HTML 會被直接呈現

  Scenario: L-1 開登入頁顯示標題、focus 與三組測試帳號
    Given 我已進入此功能頁
    When 我開啟頁面並查看欄位、按鈕與說明文字
    Then 畫面應該顯示：開登入頁顯示標題、focus 與三組測試帳號

  Scenario: L-2a sa/sa 登入成功到功能選單
    Given 我已進入此功能頁
    When 我在帳號與密碼欄輸入相同的測試帳號後按下登入
    Then 畫面應該顯示：sa/sa 登入成功到功能選單

  Scenario: L-2b cp/cp 登入成功到功能選單
    Given 我已進入此功能頁
    When 我在帳號與密碼欄輸入相同的測試帳號後按下登入
    Then 畫面應該顯示：cp/cp 登入成功到功能選單

  Scenario: L-2c csr/csr 登入成功到功能選單
    Given 我已進入此功能頁
    When 我在帳號與密碼欄輸入相同的測試帳號後按下登入
    Then 畫面應該顯示：csr/csr 登入成功到功能選單

  @legacy
  Scenario: L-3 密碼錯誤停在登入頁並清空帳號
    Given 我已進入此功能頁
    When 我填寫登入欄位後按下登入
    Then 畫面應該顯示：密碼錯誤停在登入頁並清空帳號

  Scenario: L-4 不存在帳號顯示登入錯誤
    Given 我已進入此功能頁
    When 我填寫登入欄位後按下登入
    Then 畫面應該顯示：不存在帳號顯示登入錯誤

  @legacy
  Scenario: L-5 帳號或密碼空白仍送出並顯示錯誤
    Given 我已進入此功能頁
    When 我填寫登入欄位後按下登入
    Then 畫面應該顯示：帳號或密碼空白仍送出並顯示錯誤

  Scenario: L-6 帳號大寫不同導致登入失敗
    Given 我已進入此功能頁
    When 我填寫登入欄位後按下登入
    Then 畫面應該顯示：帳號大寫不同導致登入失敗

  @legacy
  Scenario: L-7 帳號前後空白導致登入失敗
    Given 我已進入此功能頁
    When 我填寫登入欄位後按下登入
    Then 畫面應該顯示：帳號前後空白導致登入失敗

  Scenario: L-8 密碼欄按 Enter 等同登入
    Given 我已進入此功能頁
    When 我在密碼欄輸入密碼後按 Enter
    Then 畫面應該顯示：密碼欄按 Enter 等同登入

  @legacy
  Scenario: L-9 已登入再開登入頁仍顯示表單
    Given 我已進入此功能頁
    When 我開啟頁面並查看使用者可見的內容
    Then 畫面應該顯示：已登入再開登入頁仍顯示表單

  Scenario: L-10 已登入再以另一帳號登入會覆蓋 session
    Given 我已進入此功能頁
    When 我開啟頁面並查看使用者可見的內容
    Then 畫面應該顯示：已登入再以另一帳號登入會覆蓋 session

  Scenario: L-11 登出導回登入且不再顯示帳號
    Given 我已進入此功能頁
    When 我點擊導覽列的「登出」並重新操作頁面
    Then 畫面應該顯示：登出導回登入且不再顯示帳號

  @legacy
  Scenario: L-12 GET doLogin 回 405
    Given 我已進入此功能頁
    When 我用 GET 方法開啟 /doLogin
    Then 畫面應該顯示：GET doLogin 回 405
