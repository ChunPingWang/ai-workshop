# Gherkin 覆蓋矩陣

本矩陣逐條對應 scenario catalog；L-2 拆成三個登入案例。

| 頁面 | ID | 情境 | Scenario | Mock 來源 | 狀態 |
|---|---|---|---|---|---|
| login | C-1 | 未登入直接開所有功能頁會導回登入頁 | login.feature: C-1 | — | 已列入情境 |
| login | C-2 | 未登入直接打查詢 ajax 會回 please login | login.feature: C-2 | — | 已列入情境 |
| login | C-3 | 未登入直接打條款或帳戶查詢會回空陣列 | login.feature: C-3 | — | 已列入情境 |
| login | C-4 | sa、cp、csr 都能開每個功能頁 | login.feature: C-4 | — | 已列入情境 |
| login | C-5 | 導覽列八個連結導到正確頁 | login.feature: C-5 | — | 已列入情境 |
| login | C-6 | 導覽列顯示登入者帳號與角色 | login.feature: C-6 | — | 已列入情境 |
| login | C-7 | 登出後按上一頁再打 ajax 仍回 please login | login.feature: C-7 | — | 已列入情境 |
| login | C-8 | 登出後重開首頁回登入頁 | login.feature: C-8 | — | 已列入情境 |
| login | C-9 | 查詢先顯示查詢中 | login.feature: C-9 | — | 已列入情境 |
| login | C-10 | 連續查詢第二次覆蓋第一次結果 | login.feature: C-10 | — | 已列入情境 |
| login | C-11 | backend 500 顯示 backend error | login.feature: C-11 | — | 已列入情境 |
| login | C-12 | backend 404 顯示 backend error | login.feature: C-12 | — | 已列入情境 |
| login | C-13 | 回應中的粗體 HTML 會被直接呈現 | login.feature: C-13 | — | 已列入情境 |
| login | L-1 | 開登入頁顯示標題、focus 與三組測試帳號 | login.feature: L-1 | — | 已列入情境 |
| login | L-2a | sa/sa 登入成功到功能選單 | login.feature: L-2a | — | 已列入情境 |
| login | L-2b | cp/cp 登入成功到功能選單 | login.feature: L-2b | — | 已列入情境 |
| login | L-2c | csr/csr 登入成功到功能選單 | login.feature: L-2c | — | 已列入情境 |
| login | L-3 | 密碼錯誤停在登入頁並清空帳號 | login.feature: L-3 | — | 已列入情境 |
| login | L-4 | 不存在帳號顯示登入錯誤 | login.feature: L-4 | — | 已列入情境 |
| login | L-5 | 帳號或密碼空白仍送出並顯示錯誤 | login.feature: L-5 | — | 已列入情境 |
| login | L-6 | 帳號大寫不同導致登入失敗 | login.feature: L-6 | — | 已列入情境 |
| login | L-7 | 帳號前後空白導致登入失敗 | login.feature: L-7 | — | 已列入情境 |
| login | L-8 | 密碼欄按 Enter 等同登入 | login.feature: L-8 | — | 已列入情境 |
| login | L-9 | 已登入再開登入頁仍顯示表單 | login.feature: L-9 | — | 已列入情境 |
| login | L-10 | 已登入再以另一帳號登入會覆蓋 session | login.feature: L-10 | — | 已列入情境 |
| login | L-11 | 登出導回登入且不再顯示帳號 | login.feature: L-11 | — | 已列入情境 |
| login | L-12 | GET doLogin 回 405 | login.feature: L-12 | — | 已列入情境 |
| index | I-1 | 首頁顯示三個 Portal 區塊標題 | index.feature: I-1 | — | 已列入情境 |
| index | I-2 | 首頁顯示各區塊連結與 FSD 章節 | index.feature: I-2 | — | 已列入情境 |
| index | I-3 | 首頁連結導到對應功能頁 | index.feature: I-3 | — | 已列入情境 |
| index | I-4 | 首頁顯示未依角色過濾註記 | index.feature: I-4 | — | 已列入情境 |
| index | I-5 | csr 也看得到並能進入 SA 連結 | index.feature: I-5 | — | 已列入情境 |
| report | R-1 | 交易報表顯示標題、商家與時間類型 | report.feature: R-1 | routes/report.json | 已列入情境 |
| report | R-2 | 退款報表隱藏商家與時間類型 | report.feature: R-2 | routes/report.json | 已列入情境 |
| report | R-3 | 不帶 type 等同交易報表 | report.feature: R-3 | routes/report.json | 已列入情境 |
| report | R-4 | 未知 type 仍走交易報表 | report.feature: R-4 | routes/report.json | 已列入情境 |
| report | R-5 | 交易報表初始欄位與提示正確 | report.feature: R-5 | routes/report.json | 已列入情境 |
| report | R-6 | 小時下拉包含 00 到 23 | report.feature: R-6 | routes/report.json | 已列入情境 |
| report | R-7 | 查詢送出日期加小時的十碼區間 | report.feature: R-7 | routes/report.json | 已列入情境 |
| report | R-8 | E000001 顯示三列十二欄 | report.feature: R-8 | routes/report.json | 已列入情境 |
| report | R-9 | E000002 顯示零列 | report.feature: R-9 | routes/report.json | 已列入情境 |
| report | R-10 | E010000 顯示十列 | report.feature: R-10 | routes/report.json | 已列入情境 |
| report | R-11 | E011000 顯示十列且 total rows 11 | report.feature: R-11 | routes/report.json | 已列入情境 |
| report | R-12 | E500000 顯示 backend error | report.feature: R-12 | routes/report.json | 已列入情境 |
| report | R-13 | 授權時間查詢顯示結果 | report.feature: R-13 | routes/report.json | 已列入情境 |
| report | R-14 | 商家清空仍送出並回預設資料 | report.feature: R-14 | routes/report.json | 已列入情境 |
| report | R-15 | 日期非八碼仍送出 | report.feature: R-15 | routes/report.json | 已列入情境 |
| report | R-16 | 起日大於迄日仍送出 | report.feature: R-16 | routes/report.json | 已列入情境 |
| report | R-17 | 退款報表顯示六欄一列 | report.feature: R-17 | routes/report.json | 已列入情境 |
| report | R-18 | 退款報表 2099 區間查無資料 | report.feature: R-18 | routes/report.json | 已列入情境 |
| report | R-19 | 退款查詢不帶商家與時間類型 | report.feature: R-19 | routes/report.json | 已列入情境 |
| report | R-20 | 從交易報表點退款報表會切換標題 | report.feature: R-20 | routes/report.json | 已列入情境 |
| report | R-21 | 匯出 CSV 未實作 | report.feature: R-21 | routes/report.json | 未實作／不測 |
| recon | N-1 | 對帳頁初始值與空結果正確 | recon.feature: N-1 | routes/recon.json | 已列入情境 |
| recon | N-2 | 類型下拉有每日與每月 | recon.feature: N-2 | routes/recon.json | 已列入情境 |
| recon | N-3 | 每日對帳顯示兩列 | recon.feature: N-3 | routes/recon.json | 已列入情境 |
| recon | N-4 | 每日對帳 20990101 查無資料 | recon.feature: N-4 | routes/recon.json | 已列入情境 |
| recon | N-5 | 每月對帳顯示一列 | recon.feature: N-5 | routes/recon.json | 已列入情境 |
| recon | N-6 | 每月對帳 20990101 查無資料 | recon.feature: N-6 | routes/recon.json | 已列入情境 |
| recon | N-7 | 切換類型後結果被覆蓋 | recon.feature: N-7 | routes/recon.json | 已列入情境 |
| recon | N-8 | R20260915 差異明細為零筆 | recon.feature: N-8 | routes/recon.json | 已列入情境 |
| recon | N-9 | R20260916 差異明細有一筆 | recon.feature: N-9 | routes/recon.json | 已列入情境 |
| recon | N-10 | 差異明細空白仍送出 | recon.feature: N-10 | routes/recon.json | 已列入情境 |
| recon | N-11 | 明細與主查詢互相獨立 | recon.feature: N-11 | routes/recon.json | 已列入情境 |
| recon | N-12 | 主查詢 500 不影響明細區 | recon.feature: N-12 | routes/recon.json | 已列入情境 |
| recon | N-13 | 頁面顯示二天後查詢說明 | recon.feature: N-13 | routes/recon.json | 已列入情境 |
| recon | N-14 | 多檔切分未實作 | recon.feature: N-14 | routes/recon.json | 未實作／不測 |
| tos | T-1 | 條款頁初始值與按鈕正確 | tos.feature: T-1 | routes/tos.json | 已列入情境 |
| tos | T-2 | E000002 顯示空白條款表單 | tos.feature: T-2 | routes/tos.json | 已列入情境 |
| tos | T-3 | E000001 顯示第二版並隱藏編輯 | tos.feature: T-3 | routes/tos.json | 已列入情境 |
| tos | T-4 | 建立新版次顯示第三版空表單 | tos.feature: T-4 | routes/tos.json | 已列入情境 |
| tos | T-5 | 首次填寫存檔顯示成功並重查 | tos.feature: T-5 | routes/tos.json | 已列入情境 |
| tos | T-6 | 已有條款建立新版次後存檔成功 | tos.feature: T-6 | routes/tos.json | 已列入情境 |
| tos | T-7 | 內容含 FAIL 顯示後端失敗訊息 | tos.feature: T-7 | routes/tos.json | 已列入情境 |
| tos | T-8 | 存檔訊息會被下一次查詢清空 | tos.feature: T-8 | routes/tos.json | 已列入情境 |
| tos | T-9 | 內容空白仍可存檔 | tos.feature: T-9 | routes/tos.json | 已列入情境 |
| tos | T-10 | 生效日期非十四碼仍送出 | tos.feature: T-10 | routes/tos.json | 已列入情境 |
| tos | T-11 | 商家代碼空白查詢顯示無條款 | tos.feature: T-11 | routes/tos.json | 已列入情境 |
| tos | T-12 | 條款查詢 500 時畫面不變 | tos.feature: T-12 | routes/tos.json | 已列入情境 |
| tos | T-13 | 條款查詢非 JSON 時畫面不變 | tos.feature: T-13 | routes/tos.json | 已列入情境 |
| tos | T-14 | 內容換行在 pre 中保留 | tos.feature: T-14 | routes/tos.json | 已列入情境 |
| tos | T-15 | 頁面顯示版次不可修改說明 | tos.feature: T-15 | routes/tos.json | 已列入情境 |
| bankacc | K-1 | 銀行帳戶頁初始值正確 | bankacc.feature: K-1 | routes/bankacc.json | 已列入情境 |
| bankacc | K-2 | 幣別下拉有 NTD 與 USD | bankacc.feature: K-2 | routes/bankacc.json | 已列入情境 |
| bankacc | K-3 | E000001 顯示兩筆帳戶與國內外狀態 | bankacc.feature: K-3 | routes/bankacc.json | 已列入情境 |
| bankacc | K-4 | E000009 顯示空表頭 | bankacc.feature: K-4 | routes/bankacc.json | 已列入情境 |
| bankacc | K-5 | 註冊 NTD 國內帳戶顯示 OK 並查詢列表 | bankacc.feature: K-5 | routes/bankacc.json | 已列入情境 |
| bankacc | K-6 | 註冊 USD 外國帳戶送出正確值 | bankacc.feature: K-6 | routes/bankacc.json | 已列入情境 |
| bankacc | K-7 | 未勾外國銀行送出國內 | bankacc.feature: K-7 | routes/bankacc.json | 已列入情境 |
| bankacc | K-8 | bankCode 999 顯示 FAIL | bankacc.feature: K-8 | routes/bankacc.json | 已列入情境 |
| bankacc | K-9 | 銀行代碼與帳號空白仍送出 | bankacc.feature: K-9 | routes/bankacc.json | 已列入情境 |
| bankacc | K-10 | 帳號非數字仍送出 | bankacc.feature: K-10 | routes/bankacc.json | 已列入情境 |
| bankacc | K-11 | 註冊後訊息保留到下次註冊 | bankacc.feature: K-11 | routes/bankacc.json | 已列入情境 |
| bankacc | K-12 | 列表 500 時畫面不變 | bankacc.feature: K-12 | routes/bankacc.json | 已列入情境 |
| bankacc | K-13 | 頁面顯示 Finance 審核說明 | bankacc.feature: K-13 | routes/bankacc.json | 已列入情境 |
| bankacc | K-14 | Finance 審核未實作 | bankacc.feature: K-14 | routes/bankacc.json | 未實作／不測 |
| csr | S-1 | CSR 頁初始門號與說明正確 | csr.feature: S-1 | routes/csr.json | 已列入情境 |
| csr | S-2 | 0912345678 顯示交易與退款表 | csr.feature: S-2 | routes/csr.json | 已列入情境 |
| csr | S-3 | 交易表依 TX_DT 降冪顯示最新列 | csr.feature: S-3 | routes/csr.json | 已列入情境 |
| csr | S-4 | 0900000000 兩張表皆零筆 | csr.feature: S-4 | routes/csr.json | 已列入情境 |
| csr | S-5 | 0950000000 顯示 backend error | csr.feature: S-5 | routes/csr.json | 已列入情境 |
| csr | S-6 | 門號空白仍送出並回預設 | csr.feature: S-6 | routes/csr.json | 已列入情境 |
| csr | S-7 | 門號非數字仍送出 | csr.feature: S-7 | routes/csr.json | 已列入情境 |
| csr | S-8 | 交易表顯示商品名稱與商家資訊 | csr.feature: S-8 | routes/csr.json | 已列入情境 |
| csr | S-9 | 退款表顯示狀態與日期欄 | csr.feature: S-9 | routes/csr.json | 已列入情境 |
| csr | S-10 | 0910000010 顯示十列且 total rows 11 | csr.feature: S-10 | routes/csr.json | 已列入情境 |

統計：7 個 feature、104 個 catalog entries、106 個可執行 scenario（L-2 的 sa/cp/csr 三個 examples 各計 1）、3 個未實作。

共通未登入 ajax、session、導覽與 legacy 行為集中在 login.feature；特殊 backend 觸發值詳見各 routes/*.json。