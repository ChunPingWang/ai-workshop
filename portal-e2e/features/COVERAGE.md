# Portal BDD 覆蓋矩陣

來源：`docs/user-stories.md`、`docs/new-pay_Portal_SRS.md`、Portal templates/controllers 與 backend controllers。`Scenario Outline` 的每一列 Examples 均計為一個情境。

## 統計

| 項目 | 數量 |
|---|---:|
| Portal 頁面功能／Feature 檔 | 7 |
| Scenario 定義 | 89 |
| 展開後情境（含 Examples） | 127 |
| User Story AC | 85 |
| AC 已對應情境 | 85 / 85（100%） |
| Mockoon backend API | 11 |
| Mockoon response examples | 65 |
| Mockoon routes（含 health） | 12 |
| `@legacy` 情境（含 Outline Examples） | 8 |

`report.feature` 共用 report template，涵蓋交易與退款兩種頁面模式。login 與首頁不呼叫 backend，不需 Mockoon route。

## 十維度盤點

| 頁面／情境數 | 維度 | 覆蓋情境 | Mock 觸發 |
|---|---|---|---|
| login（19） | A 進入頁面 | 未登入開啟六種受保護頁面；登入頁可直接開啟 | — |
| login（19） | B 初始狀態 | 登入頁自動聚焦帳號欄；錯誤後欄位清空 | — |
| login（19） | C 輸入欄位 | 三組有效帳密、錯誤／大小寫不符帳密、帳號空白、密碼空白 | — |
| login（19） | D 按鈕／動作 | 按登入、密碼欄按 Enter、登出 | — |
| login（19） | E Backend 回應 | 登入由 Portal 本機驗證，沒有 backend 回應 | — |
| login（19） | F 頁面狀態 | 成功建立登入、失敗顯示錯誤、另一帳號重新登入 | — |
| login（19） | G 資料呈現 | 帳號或密碼錯誤訊息、錯誤後欄位不回填 | — |
| login（19） | H 導覽／Session | 登出清除登入狀態；未登入頁面回登入頁 | — |
| login（19） | I 跨頁流程 | 登入後進首頁；登出後再開受保護頁 | — |
| login（19） | J US／AC | US-LGN-01 AC1～3、US-LGN-02 AC1～2、US-COM-01 AC1／AC3 | — |
| index（16） | A 進入頁面 | 直接登入進首頁；首頁七個入口各自導向功能頁 | — |
| index（16） | B 初始狀態 | 三個功能區、七個入口、首頁無輸入欄位 | — |
| index（16） | C 輸入欄位 | 首頁沒有輸入欄位 | — |
| index（16） | D 按鈕／動作 | 從 SA、Merchant、CSR 區塊選取入口 | — |
| index（16） | E Backend 回應 | 首頁不呼叫 backend | — |
| index（16） | F 頁面狀態 | 三種帳號看到相同選單，頁首角色文字不同 | — |
| index（16） | G 資料呈現 | 區塊與入口名稱、八個導覽連結順序、Portal 共用樣式 | — |
| index（16） | H 導覽／Session | 登出後重新開首頁回登入頁 | — |
| index（16） | I 跨頁流程 | 首頁→交易報表→首頁→CSR 查詢 | — |
| index（16） | J US／AC | US-HOME-01 AC1～4、US-COM-01 AC2、US-COM-02 AC1／AC2／AC4 | — |
| report：交易（23） | A 進入頁面 | 從首頁、頂端導覽進入；未登入保護頁由 login.feature 驗證；SA／CP 可進入 | — |
| report：交易（23） | B 初始狀態 | 日期、00～23 小時、E000001、交易時間、提示文字 | — |
| report：交易（23） | C 輸入欄位 | 清空商家／日期、錯誤日期格式、起日較晚、單引號 | merchantId 空值／E000SQL／單引號；BADDATE；反向日期 |
| report：交易（23） | D 按鈕／動作 | 查詢、查詢等待、等待期間重複查詢 | 測試步驟延遲或攔截查詢回應 |
| report：交易（23） | E Backend 回應 | 3 筆、0 筆、10／11 筆、500、404、SQL error、HTML 欄位 | E000002／E010000／E011000／E500000／E404000／E000SQL／E000BLD |
| report：交易（23） | F 頁面狀態 | 交易／授權時間切換；未知類型回交易模式 | `timeType=auth`；未知 type 不需特殊 response |
| report：交易（23） | G 資料呈現 | 12 欄、TX_DT 排序、null、總筆數、未轉義 HTML、表格樣式 | 預設資料／E011000／E000BLD |
| report：交易（23） | H 導覽／Session | 導覽到退款；登出後已開頁面查詢回 please login | 未登入 ajax 由 Portal 回應，不經 Mockoon |
| report：交易（23） | I 跨頁流程 | 首頁進入報表、查詢後回首頁再進其他功能 | — |
| report：交易（23） | J US／AC | US-RPT-01 AC1～4、US-RPT-02 AC1～3、US-RPT-03 AC1、US-COM-03 AC1～7、US-COM-04 AC1～6 | 見上列 triggers |
| report：退款（7） | A 進入頁面 | 從頂端導覽進退款模式；CP 可由共用導覽進入 | — |
| report：退款（7） | B 初始狀態 | 退款標題、商家與時間類型隱藏、日期與結果區可用 | — |
| report：退款（7） | C 輸入欄位 | 日期範圍；隱藏商家與時間類型不得成為後端條件 | 起日 20990101／20999999／20880101／20880201 |
| report：退款（7） | D 按鈕／動作 | 送出退款查詢並以新回應取代結果區 | — |
| report：退款（7） | E Backend 回應 | 有資料、0 筆、500、404、SQL error | 預設／20990101／20999999／20880101／20880201 |
| report：退款（7） | F 頁面狀態 | 共用 report template 依 refund type 隱藏交易專屬條件 | `type=refund` |
| report：退款（7） | G 資料呈現 | 六欄、REFUND_DATE 排序、狀態代碼、原交易資料、總筆數 | default refund body |
| report：退款（7） | H 導覽／Session | 頂端退款連結；共用查詢等待／錯誤狀態 | — |
| report：退款（7） | I 跨頁流程 | 交易報表→退款報表 | — |
| report：退款（7） | J US／AC | US-RFD-01 AC1～2、US-RFD-02 AC1～4、US-COM-03 AC1～4 | 見上列 triggers |
| recon（16） | A 進入頁面 | 首頁入口進入；SA／CP 都可開啟 | — |
| recon（16） | B 初始狀態 | daily、20000101～20991231、初始提示與空明細 | — |
| recon（16） | C 輸入欄位 | 日期區間、daily/monthly、空 RECON_ID、每日／每月識別碼 | 20990101／R20260915／R20260916／M202608 |
| recon（16） | D 按鈕／動作 | 查彙總、查明細、切換類型及保留兩個結果區 | — |
| recon（16） | E Backend 回應 | 每日／每月資料、差異、0 筆、500、404 | routes/recon.json 各 response |
| recon（16） | F 頁面狀態 | daily/monthly 彙總與每日差異明細；月批次明細為空 | `type=monthly`／`reconId=M202608` |
| recon（16） | G 資料呈現 | 彙總欄位、日期排序、20 欄明細、結果碼與訊息 | R20260916 |
| recon（16） | H 導覽／Session | 共用導覽列及未授權角色仍可開頁 | — |
| recon（16） | I 跨頁流程 | 首頁→對帳查詢→首頁其他功能由 index.feature 驗證 | — |
| recon（16） | J US／AC | US-RCN-01 AC1～2、US-RCN-02 AC1～3、US-RCN-03 AC1～5、US-COM-03 AC1～4 | 見上列 triggers |
| tos（21） | A 進入頁面 | 首頁／導覽進入；公開條款由後端網址直接開啟 | `/getToS.jsp` |
| tos（21） | B 初始狀態 | E000001、表單與版次隱藏 | — |
| tos（21） | C 輸入欄位 | 商家、14 碼生效日期、空內容、單引號、超長值 | E000001／E000002／E00000000000／content=FAIL／空值／含單引號／15 碼日期 |
| tos（21） | D 按鈕／動作 | 查詢、建立新版次、存檔、自動重查 | POST `/sa/tos/save`、GET `/sa/tos/query` |
| tos（21） | E Backend 回應 | 多版本、單版本、空陣列、500、非 JSON、OK／FAIL | E000001／E000003／E000002／E500000／E999JSON |
| tos（21） | F 頁面狀態 | S0→無條款新增／有條款檢視→新版次；失敗仍重查 | 存檔 response 後 query 固定回應，不會持久化 |
| tos（21） | G 資料呈現 | 最新版、版本 URL、換行、短暫訊息；公開條款最新／指定／無資料 | `/getToS.jsp` 的 merchantID/version |
| tos（21） | H 導覽／Session | 未登入 query 回空陣列、存檔回 please login | Portal 本機 session，不走 Mockoon |
| tos（21） | I 跨頁流程 | 條款設定→公開條款頁；首頁導覽入口 | — |
| tos（21） | J US／AC | US-TOS-01 AC1～7、US-TOS-02 AC1～4、US-TOS-03 AC1、US-COM-04 AC1～4 | 見上列 triggers |
| bankacc（14） | A 進入頁面 | 首頁入口進入；CP／SA 均可使用 | — |
| bankacc（14） | B 初始狀態 | E000001、空銀行欄位、NTD、國內、空訊息及清單 | — |
| bankacc（14） | C 輸入欄位 | NTD/USD、國內外、空值、長度超限、非數字、重複資料 | bankCode=007／777／776／999／空白／ABC |
| bankacc（14） | D 按鈕／動作 | 註冊、清單查詢、自動刷新、訊息保留 | POST save 後 GET list |
| bankacc（14） | E Backend 回應 | 兩筆、空清單、500、404、非 JSON、OK／FAIL | E000001／E000002／E500000／E404000／E999JSON |
| bankacc（14） | F 頁面狀態 | 註冊成功／失敗後都查清單；清單解析失敗不重繪 | Mockoon save response 固定，不持久化 |
| bankacc（14） | G 資料呈現 | 六欄、國內外轉譯、A/W 狀態原碼、無 total rows | default list body |
| bankacc（14） | H 導覽／Session | 登出後清單回空表頭、註冊回 please login | Portal 本機 session，不走 Mockoon |
| bankacc（14） | I 跨頁流程 | 首頁→註冊帳戶→首頁其他功能 | — |
| bankacc（14） | J US／AC | US-BNK-01 AC1～6、US-BNK-02 AC1～4、US-COM-04 AC1～3 | 見上列 triggers |
| csr（11） | A 進入頁面 | 首頁 CSR 入口；其他角色也可開啟 | — |
| csr（11） | B 初始狀態 | 0912345678 與「請輸入門號查詢」 | — |
| csr（11） | C 輸入欄位 | 正常、空白、9 碼、英文字母門號 | 0912345678／空值／090000000／BADNUMBER |
| csr（11） | D 按鈕／動作 | 查詢後顯示兩張表格；查詢中狀態 | — |
| csr（11） | E Backend 回應 | 有資料、雙空表、11 筆/顯示 10 筆、500、SQL error | 0912345678／0900000000／0910000010／0950000000／0900000001 |
| csr（11） | F 頁面狀態 | 交易與退款結果一併更新；無交易仍保留 Refunds 標記 | csr/trans 回應片段 |
| csr（11） | G 資料呈現 | 八欄交易及八欄退款、排序、代碼、null、各自總筆數 | default／11 筆 fixture |
| csr（11） | H 導覽／Session | CSR 導覽、其他角色開頁；session 控制見 login.feature | — |
| csr（11） | I 跨頁流程 | 首頁→CSR 查詢；交易報表→首頁→CSR | — |
| csr（11） | J US／AC | US-CSR-01 AC1～4、US-CSR-02 AC1～5、US-COM-02 AC3、US-COM-03 AC1～4 | 見上列 triggers |

## US／AC 追溯

| US | AC | 對應 scenario（Outline 每列均覆蓋同一 AC） |
|---|---|---|
| US-COM-01 | AC1 | login.feature「未登入開啟受保護頁面會回到登入頁」 |
| US-COM-01 | AC2 | index.feature「不同帳號看到相同選單並顯示目前身分」 |
| US-COM-01 | AC3 | login.feature「登出後回登入頁且不保留錯誤訊息」 |
| US-COM-02 | AC1 | index.feature「不同帳號看到相同選單並顯示目前身分」 |
| US-COM-02 | AC2 | index.feature「登入後各頁共用相同的八個導覽連結」 |
| US-COM-02 | AC3 | csr.feature「CSR 頁面標題保留目前實作文字」 `@legacy` |
| US-COM-02 | AC4 | index.feature「共用頁面樣式符合 Portal 視覺規格」 |
| US-COM-03 | AC1 | report.feature 交易／退款查詢與 recon.feature 彙總結果 |
| US-COM-03 | AC2 | report.feature「最多顯示十筆」／「查無資料」；csr.feature「有交易但沒有退款」 |
| US-COM-03 | AC3 | report.feature「查詢交易明細」；csr.feature「狀態原樣呈現」 |
| US-COM-03 | AC4 | report.feature backend/query error、退款錯誤及查詢結果取代 |
| US-COM-03 | AC5 | report.feature「後端沒有回應時結果區維持查詢中」 |
| US-COM-03 | AC6 | report.feature「查詢等待期間可再次送出」 |
| US-COM-03 | AC7 | report.feature「報表結果表格使用 Portal 指定樣式」 |
| US-COM-04 | AC1 | report.feature 日期邊界／空白；csr.feature 格式錯誤門號；bankacc.feature 非數字與重複資料 |
| US-COM-04 | AC2 | report.feature 單引號 SQL error；tos.feature 單引號／超長欄位；bankacc.feature 超長欄位 |
| US-COM-04 | AC3 | tos.feature 空內容；bankacc.feature 空銀行代碼與帳號 |
| US-COM-04 | AC4 | report.feature 日期與小時；tos.feature 14 碼生效日期 |
| US-COM-04 | AC5 | report.feature 與 csr.feature 14 碼時間欄位 |
| US-COM-04 | AC6 | report.feature「查詢範圍包含所選日期的最後一秒」 |
| US-COM-04 | AC7 | report.feature TWD 欄位；bankacc.feature NTD/USD 選項 |
| US-LGN-01 | AC1 | login.feature「使用畫面列出的測試帳密登入」與 Enter 登入 |
| US-LGN-01 | AC2 | login.feature 錯誤帳密、帳號空白、密碼空白 |
| US-LGN-01 | AC3 | login.feature「登入頁開啟後游標位於帳號欄」 |
| US-LGN-02 | AC1 | login.feature「已登入時以另一帳號重新登入」 |
| US-LGN-02 | AC2 | login.feature「登出後回登入頁」 |
| US-HOME-01 | AC1 | index.feature「首頁顯示三組功能與七個入口」 |
| US-HOME-01 | AC2 | index.feature「不同帳號看到相同選單」 |
| US-HOME-01 | AC3 | index.feature「首頁入口只出現在對應業務區塊」 |
| US-HOME-01 | AC4 | index.feature「首頁顯示三組功能與七個入口」 |
| US-RPT-01 | AC1 | report.feature「交易報表載入初始條件」 |
| US-RPT-01 | AC2 | report.feature 日期格式錯誤／起日晚於迄日及日期空白 `@legacy` |
| US-RPT-01 | AC3 | report.feature「非退款類型值仍呈現交易報表」 |
| US-RPT-01 | AC4 | report.feature 清空商家及 CP 帳號查詢 |
| US-RPT-02 | AC1 | report.feature 交易時間、授權時間、商家條件與日期邊界 |
| US-RPT-02 | AC2 | report.feature「查詢交易明細並保留指定欄位及排序」 |
| US-RPT-02 | AC3 | report.feature「最多顯示十筆」、0 筆、狀態與 null |
| US-RPT-03 | AC1 | report.feature「後端錯誤以結果文字呈現」 |
| US-RFD-01 | AC1 | report.feature「從交易報表導覽至退款報表」 |
| US-RFD-01 | AC2 | report.feature「退款查詢只使用日期範圍」 |
| US-RFD-02 | AC1 | report.feature「查詢退款並顯示原交易資訊」 |
| US-RFD-02 | AC2 | report.feature default refund 資料列與原交易欄位 |
| US-RFD-02 | AC3 | report.feature 退款資料、空結果及錯誤情境 |
| US-RFD-02 | AC4 | report.feature 退款狀態碼與退款時間欄位 |
| US-RCN-01 | AC1 | recon.feature「對帳頁顯示預設查詢條件」 |
| US-RCN-01 | AC2 | recon.feature 每日／每月彙總查詢 |
| US-RCN-02 | AC1 | recon.feature 每日 R 與每月 M 批次識別 |
| US-RCN-02 | AC2 | recon.feature「查詢每日對帳並閱讀一致與有差異的摘要」 |
| US-RCN-02 | AC3 | recon.feature「彙總與差異明細查詢互不清除」 |
| US-RCN-03 | AC1 | recon.feature「依每日批次識別查詢差異明細」 |
| US-RCN-03 | AC2 | recon.feature「每月批次沒有每日差異明細」 |
| US-RCN-03 | AC3 | recon.feature「批次識別空白仍會送出查詢」 |
| US-RCN-03 | AC4 | recon.feature「彙總與差異明細查詢互不清除」 |
| US-RCN-03 | AC5 | recon.feature「依每日批次識別查詢差異明細」 |
| US-TOS-01 | AC1 | tos.feature 初始狀態與「查詢商家後檢視最新版本」 |
| US-TOS-01 | AC2 | tos.feature「商家尚無條款時進入新增模式」 |
| US-TOS-01 | AC3 | tos.feature「查詢商家後檢視最新版本」 |
| US-TOS-01 | AC4 | tos.feature「建立新版次後回到檢視狀態」及欄位保留 |
| US-TOS-01 | AC5 | tos.feature「已建立的版本沒有修改入口」 |
| US-TOS-01 | AC6 | tos.feature 非 JSON 與 HTTP 500 查詢回應 |
| US-TOS-01 | AC7 | tos.feature「未登入查詢條款會進新增模式」 |
| US-TOS-02 | AC1 | tos.feature 存檔成功、第一版存檔及自動重查 |
| US-TOS-02 | AC2 | tos.feature FAIL、空內容、長度與單引號錯誤後重查 |
| US-TOS-02 | AC3 | tos.feature 超長日期、商家代碼、空內容 |
| US-TOS-02 | AC4 | tos.feature 輸入空白／超長／單引號內容後由回應決定 |
| US-TOS-03 | AC1 | tos.feature 指定版本、最新版本、全域條款及查無資料 |
| US-BNK-01 | AC1 | bankacc.feature「銀行帳戶頁顯示預設輸入值」 |
| US-BNK-01 | AC2 | bankacc.feature「註冊成功後自動更新清單」 |
| US-BNK-01 | AC3 | bankacc.feature 必填／超長／非數字／重複資料情境 |
| US-BNK-01 | AC4 | bankacc.feature「註冊成功後自動更新清單且保留成功訊息」 |
| US-BNK-01 | AC5 | bankacc.feature NTD/USD、國內外與不同角色 |
| US-BNK-01 | AC6 | bankacc.feature「必填或欄位長度錯誤由後端回覆」 |
| US-BNK-02 | AC1 | bankacc.feature 兩筆、空清單與六欄表格 |
| US-BNK-02 | AC2 | bankacc.feature 非 JSON、500／404、未登入清單 |
| US-BNK-02 | AC3 | bankacc.feature default E000001 初始 A 帳戶資料 |
| US-BNK-02 | AC4 | bankacc.feature 原碼狀態且沒有審核／刪除／修改功能 |
| US-CSR-01 | AC1 | csr.feature「依門號顯示交易及退款表格」初始狀態 |
| US-CSR-01 | AC2 | csr.feature 預設交易資料以完整門號查詢 |
| US-CSR-01 | AC3 | csr.feature 空白、英文字母、9 碼門號 `@legacy` |
| US-CSR-01 | AC4 | csr.feature backend error 與 query error |
| US-CSR-02 | AC1 | csr.feature 交易欄位、排序、授權時間、商品及商家資訊 |
| US-CSR-02 | AC2 | csr.feature 退款資料表格 |
| US-CSR-02 | AC3 | csr.feature 兩表各自總筆數與 10 列上限 |
| US-CSR-02 | AC4 | csr.feature 零交易與無退款 |
| US-CSR-02 | AC5 | csr.feature 狀態碼及 null 顯示 |

## Mockoon 情境來源

每個 endpoint 各有一個 route，全部回應資料放在 `mockoon/bodies/`。查詢錯誤及 HTTP 錯誤會經 Portal 轉成畫面上的 `query error:`、`backend error:` 或 `FAIL`。

| Endpoint | 主要觸發值 | 回應 |
|---|---|---|
| GET `/sa/report/trans` | 未帶 merchantId／E000001、E000002、E500000、E404000、E000SQL、單引號、E010000、E011000、E000BLD；`timeType=auth`；日期 BADDATE00、2026091700～2026091623、2026091800～2026091823、from=00 | 多商家、3 筆、0 筆、500、404、SQL error、10/11 總筆數、未轉義 HTML、授權時間、日期邊界 |
| GET `/sa/report/refund` | from=2099010100／2099999900／2088010100／2088020100 | 2 筆、0 筆、500、404、SQL error |
| GET `/sa/report/reconDaily` | from=20990101／20999999／20999888 | 2 筆、0 筆、500、404 |
| GET `/sa/report/reconMonthly` | from=20990101／20999999 | 1 筆、0 筆、500 |
| GET `/sa/report/reconDailyDetail` | reconId=R20260916／R20260915／M202608／R5000000／R4040000 | 一筆差異、0 筆、500、404 |
| GET `/sa/tos/query` | merchantID=E000001／E000003／E000002／E500000／E999JSON | v2 與 v1、單一換行版本、空陣列、500、非 JSON |
| POST `/sa/tos/save` | merchantID=E000002；content 含 FAIL／單引號／空值；超長商家；15 碼 startDate | 新商家 version=1、version=3、FAIL 欄位長度／SQL／NULL |
| GET `/getToS.jsp` | E000001 + version 1/2；E000002；不帶 merchantID/version | 指定版次、最新版、NO ToS、全域預設條款 |
| GET `/cp/bankacc/list` | merchantId=E000001／E000002／E500000／E404000／E999JSON | 兩筆、空陣列、500、404、非 JSON |
| POST `/cp/bankacc/save` | bankCode=999／777／776／空值 | FAIL、FOREIGN-USD、DOMESTIC-NTD、NULL error |
| GET `/csr/trans` | msisdn=0912345678／0900000000／0910000010／0950000000／0900000001／BADNUMBER／空值／090000000 | 交易與退款、雙空表、11 總筆數但最多 10 列、500、SQL error、格式錯誤空結果 |

## 不測與限制

| 項目 | 狀態 | 原因 |
|---|---|---|
| 交易／退款 CSV 匯出 | 未實作／不測 | SRS 第 8 章明列本版未提供。 |
| Finance 銀行帳戶審核 | 未實作／不測 | 本版只註冊，帳戶狀態維持 W。 |
| 每月對帳差異明細 | 不支援／不測 | 目前差異查詢只查每日明細表。 |
| 登入失敗次數限制、鎖定、驗證碼 | 未提供／不測 | SRS P-LGN-08。 |
| 後端無限期不回應 | 以測試攔截模擬 | Mockoon response 規格不含延遲；report.feature 的測試步驟需暫停回應。 |
| ToS／銀行帳戶存檔後資料持久化 | Mockoon 不持久化 | 存檔成功後的重查固定回應原始樣本；情境只驗訊息、自動重查與畫面狀態，不宣稱資料已寫入清單。 |

程式有而 AC 未明列的可觀察行為已補入情境：登入頁 Enter 送出、錯誤後欄位清空、報表連續查詢、ToS 非 JSON 不更新、銀行帳戶清單非 JSON 不更新、CSR 無交易時仍保留 `Refunds:` 分隔文字。