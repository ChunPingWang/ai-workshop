# Portal E2E 覆蓋矩陣

由 `/gen-gherkin` 依 `docs/user-stories.md`（31 個 US、111 條 AC）與 portal 原始碼產生。
維度代號：A 進入、B 初始、C 輸入、D 動作、E 回應、F 狀態機、G 呈現、H 導覽與 session、I 跨頁、J US/AC 對照。
AC 編號見 `docs/user-stories.md`；SRS 條文編號（P-xxx-nn）見 `docs/new-pay_Portal_SRS.md`。

## 統計

| | |
|---|---|
| Feature 檔 | 8 個 |
| Scenario | **144**（Outline 每列各算一個）；`@legacy` 35、`@smoke` 6、`@mock` 26 |
| AC 覆蓋 | 111 條中 **96 條有直接對應 scenario**；15 條未直接覆蓋（見文末清單，各附處置） |
| 未實作／範圍外 | SRS 第 8 章 6 項（見文末） |
| Mockoon | 11 routes／41 responses，`mock:check` 41/41 ✓ |

## common（共通行為，US-COM-01〜03）

| 維度 | US/AC | 情境 | Scenario | Mock 觸發 |
|---|---|---|---|---|
| A | US-COM-01 AC1 | 未登入開 6 個功能頁 → 302 登入頁 | common: 未登入直接開功能頁（Outline 6） | — |
| A | AC 沒寫（US-COM-01 備註） | `/;jsessionid=任意值` 繞過登入 render 選單 | common: 未登入用 jsessionid 網址… @legacy | — |
| H | US-COM-01 AC2 | 未登入 GET ajax 回 `please login`（4 端點） | common: 未登入直接打 ajax…（Outline 4）@legacy | — |
| H | US-COM-01 AC2 | 未登入 POST save 回 `please login`（2 端點） | common: 未登入直接送出…（2 個）@legacy | — |
| H | US-COM-01 AC2 | `/tos/data`、`/bankacc/data` 回 `[]` | common: 未登入直接打查詢 ajax…（Outline 2）@legacy | — |
| H | US-COM-05 AC5 | 資料端點缺必要參數 → 400 | common: 資料端點缺少必要參數時回 400 @legacy | — |
| A | US-COM-02 AC1 | sa/cp/csr 都能開全部功能頁 | common: 任何角色都能開啟所有功能頁（Outline 3）@legacy | — |
| H | US-COM-03 AC2 | 導覽列 7 連結導對頁 | common: 導覽列連結導到正確頁面（Outline 7） | — |
| G | US-COM-03 AC3 | 各頁 `<title>` | common: 各頁面的瀏覽器分頁標題正確（Outline 6） | — |
| G | US-COM-03 AC1 | 導覽列帳號＋首頁角色 | common: 首頁導覽列顯示登入者帳號與角色 | — |
| H | US-COM-01 AC3 | 登出後舊頁面打 ajax → please login | common: 登出後停在舊頁面再查詢… | — |
| H | US-COM-01 AC3 | 登出後重開 / → 登入頁 | common: 登出後 session 失效重開首頁… | — |

## login（US-LGN-01〜04）

| 維度 | US/AC | 情境 | Scenario | Mock 觸發 |
|---|---|---|---|---|
| B | US-LGN-01 AC3 | 標題、測試帳號提示、自動聚焦 | login: 登入頁顯示標題與測試帳號提示… | — |
| A | US-LGN-01 AC1/AC2 | 三組帳號登入成功 | login: 三種角色都能用預設帳號登入（Outline 3）@smoke | — |
| C | US-LGN-02 AC1 | 密碼錯／帳號不存在 → 錯誤訊息 | login: 密碼錯誤…、帳號不存在…（2 個） | — |
| C | US-LGN-02 AC2 | 失敗後欄位不回填 | login: 登入失敗後帳號欄位被清空 @legacy | — |
| C | US-LGN-02 AC1 | 空白帳密仍送出 | login: 帳號或密碼空白…（Outline 3）@legacy | — |
| C | US-LGN-01 AC1 | 大小寫敏感、不 trim | login: 帳號大小寫不同…、帳號前後有空白… @legacy | — |
| D | （操作慣例） | 密碼欄 Enter = 登入 | login: 在密碼欄按 Enter 等同按登入 | — |
| A | US-LGN-04 AC1 | 已登入再開 /login；重登覆蓋 session | login: 已登入再開登入頁… @legacy、已登入再用另一組帳號… | — |
| H | US-LGN-04 AC2 | GET /doLogin → 405；缺參數 → 400 | login: 用 GET 開啟 doLogin…、登入表單缺少參數…（2 個）@legacy | — |
| H | US-LGN-03 AC1 | 登出回登入頁、不顯示錯誤 | login: 登出後回到登入頁且不顯示錯誤訊息 | — |

## index（US-HOME-01〜02）

| 維度 | US/AC | 情境 | Scenario | Mock 觸發 |
|---|---|---|---|---|
| G | US-HOME-01 AC1 | 三區塊、7 連結、連結文字 | index: 首頁顯示三個 Portal 區塊、各區塊的選單連結數量與文字 | — |
| G | US-HOME-01 AC2 | Merchant 區無退款連結（連結數=2 隱含驗證） | index: 各區塊的選單連結數量與文字 | — |
| I | US-HOME-01 AC3 | 6 個選單連結導對頁 | index: 首頁選單連結導到對應功能頁（Outline 6） | — |
| G | SRS 4.2.1（AC 未單獨列） | 底部「選單沒有依角色過濾」註記 | index: 首頁底部顯示…註記 @legacy | — |
| A | US-HOME-02 AC1＋US-COM-02 AC1 | csr 首頁內容相同、點得進 SA 功能 | index: csr 登入看到的首頁與 sa 相同… @legacy | — |
| G | US-HOME-02 AC2 | 標題列帳號(角色) | index: 首頁標題列顯示帳號與角色 | — |

## report（交易＋退款報表，US-RPT-01〜03／US-RFD-01〜02）

| 維度 | US/AC | 情境 | Scenario | Mock 觸發 |
|---|---|---|---|---|
| B | US-RPT-01 AC1 | 初始值（日期 8 碼、00/23、E000001、tx、提示） | report: 交易報表初始畫面 | — |
| B | US-RPT-01 AC2 | 小時下拉 24 選項 | report: 小時下拉有 00 到 23… | — |
| B/F | US-RFD-01 AC1 | refund 標題切換、欄位隱藏 | report: 退款報表初始畫面…、從交易報表切到退款報表… | — |
| F | US-RPT-01 AC4 | 不帶 type／未知 type 都走 trans | report: 不帶 type…、帶未知 type… @legacy | 預設 3 筆 |
| E/G | US-RPT-02 AC3/AC4/AC5＋US-COM-04 AC1/AC2 | 3 筆、12 欄、total rows、升冪排序 | report: 查詢有交易資料的商家 @smoke | 預設 |
| G | US-RPT-02 AC6＋US-COM-04 AC4 | 代碼原樣、NULL 顯示 null | report: 狀態碼與 NULL 原樣顯示 | 預設 |
| E | US-COM-04 AC3 | 0 筆空表格 | report: 查無資料的商家顯示空表格 | E000002 |
| E | US-COM-04 AC2 | 剛好 10 筆／11 筆畫面 10 列 | report: 剛好 10 筆…、超過 10 筆…（2 個）@mock | E010000／E011000 |
| E | US-RPT-03 AC2＋US-COM-05 AC2 | 500／404 → backend error | report: 後端回 500…、後端回 404…（2 個）@mock | E500000／E404000 |
| E | US-COM-04 AC6 | SQL 錯誤 → query error: …SQL= | report: 後端 SQL 錯誤時原樣顯示 query error @legacy @mock | E000SQL |
| G | US-COM-04 AC5 | `<b>` 不轉義被 render | report: 後端回應含 HTML 標籤… @legacy @mock | E000BLD |
| C | US-RPT-02 AC1 | timeType=auth 有送到 backend | report: 切換時間類型為授權時間後查詢 @mock | timeType=auth |
| C | US-RPT-02 AC2 | 商家清空＝查全部 | report: 商家欄位清空仍會送出查詢 | 預設 |
| C | US-RPT-03 AC1 | 日期格式錯／起迄顛倒／清空仍送出 | report: 日期異常仍會送出查詢（Outline 3）@legacy | 預設 |
| C | US-RPT-01 AC3 | from/to 為 10 碼 | report: 查詢送出的時間是日期加小時共 10 碼 @mock | E777000＋from 10 碼 |
| E/G | US-RFD-02 AC2/AC5 | refund 6 欄 1 筆 | report: 退款報表查詢有資料 | 預設 |
| E | US-RFD-02 AC1 | 2099 區間 0 筆 | report: 退款報表查未來日期區間查無資料 @mock | from ^2099 |
| C | US-RFD-02 AC1 | refund 不帶商家/時間類型 | report: 退款報表查詢不會帶商家與時間類型參數 @mock | from ^20260601＋merchantId null |
| D | US-COM-04 AC7 | 查詢中…；重複查詢覆蓋 | report: 查詢送出後結果區先顯示查詢中、連續查詢第二次結果覆蓋第一次 | 延遲回應／E000001→E000002 |

## recon（US-RCN-01〜03）

| 維度 | US/AC | 情境 | Scenario | Mock 觸發 |
|---|---|---|---|---|
| B | US-RCN-01 AC1 | 初始值與兩個下拉選項 | recon: 對帳查詢初始畫面、對帳類型下拉有… | — |
| E/G | US-RCN-02 AC1/AC4 | 每日 2 筆、8 欄、Y/N、DIFF_COUNT | recon: 查詢每日對帳結果 @smoke | 預設 |
| E | US-RCN-02 AC1 | 每日未來區間 0 筆 | recon: 每日對帳查未來區間查無資料 @mock | from=20990101 |
| E/G | US-RCN-02 AC2/AC3 | 每月 1 筆、7 欄、M+yyyyMM、CP_TX_DT 月初 | recon: 查詢每月對帳結果 | 預設 |
| E | US-RCN-02 AC2 | 每月未來區間 0 筆 | recon: 每月對帳查未來區間查無資料 @mock | from=20990101 |
| D/F | US-RCN-01 AC2 | 切換類型再查詢覆蓋 | recon: 切換對帳類型後再查詢結果被覆蓋 | — |
| E | US-RCN-03 AC1 | 一致日明細 0 筆；差異日 1 筆 20 欄、代碼 104 | recon: 查詢對帳正常日期…、查詢有差異日期…（2 個） | reconId=R20260916 |
| E | US-RCN-03 AC3 | M 開頭 RECON_ID 必為 0 筆 | recon: 每月對帳的 RECON_ID 查差異明細必為空 | 預設（0 筆） |
| C | US-RCN-03 AC4 | RECON_ID 空白仍送出 | recon: 差異明細 RECON_ID 空白… @legacy | 預設 |
| F | US-RCN-03 AC5 | 明細與主查詢獨立；主查詢 500 不影響明細 | recon: 差異明細與主查詢互相獨立、主查詢後端錯誤不影響…（2 個） | from=20999999 |
| G | SRS 4.5.1 畫面說明 | 二天後查詢註記 | recon: 頁面顯示對帳資料延遲兩天的註記 | — |

## tos（US-TOS-01〜04；US-TOS-05 不在範圍）

| 維度 | US/AC | 情境 | Scenario | Mock 觸發 |
|---|---|---|---|---|
| B | US-TOS-01 AC1 | 初始：E000001、表單隱藏 | tos: 服務條款初始畫面 | — |
| F | US-TOS-01 AC3 | S1 新增模式（版次 1、尚無條款） | tos: 查詢尚無條款的商家… | 預設 [] |
| F | US-TOS-01 AC2/AC4 | S2 檢視模式（v2、URL、按鈕切換） | tos: 查詢已有條款的商家… @smoke | E000001 |
| F | US-TOS-02 AC1/AC2 | S3 新版次（版次+1、清空、舊內容保留） | tos: 按建立新版次顯示空白表單且版次加一 | E000001 |
| F | US-TOS-03 AC1/AC2 | 存檔成功 OK version=1／version=3 | tos: 第一次建立…、建立新版次存檔成功（2 個） | save 預設／E000001 |
| E | US-TOS-03 AC4＋US-COM-05 AC3 | FAIL 原樣顯示 | tos: 後端存檔失敗時原樣顯示 FAIL 訊息 @mock | content 含 FAIL |
| D | US-TOS-03 AC3 | 存檔訊息被自動重查清空 | tos: 存檔後的訊息會被自動重查清空 @legacy | save 預設 |
| C | US-TOS-03 AC4＋US-COM-06 AC2 | 內容空白 → FAIL NULL not allowed | tos: 內容空白直接存檔… @legacy @mock | content="" |
| C | US-TOS-03 AC4 | 生效日期非 14 碼仍送出 | tos: 生效日期非 14 碼仍會送出 @legacy | save 預設 |
| C | US-TOS-03 AC4 | 商家空白查詢 → 尚無條款 | tos: 商家代碼空白查詢… @legacy | 預設 [] |
| E | US-TOS-04 AC1 | 500／非 JSON → 畫面無變化 | tos: 查詢時後端 500…、後端回非 JSON…（2 個）@legacy @mock | E500000／E999JSON |
| H | US-TOS-04 AC2 | session 逾期誤入新增模式 | tos: session 逾期後查詢誤入新增模式 @legacy | 未登入回 [] |
| G | SRS 4.6.1 畫面元素（AC 未單獨列） | `<pre>` 保留換行 | tos: 條款內容含換行會保留換行顯示 @mock | E000003 |
| G | US-TOS-02 AC3 | 版次控管說明文字 | tos: 頁面顯示版次控管說明 | — |

## bankacc（US-BNK-01〜03）

| 維度 | US/AC | 情境 | Scenario | Mock 觸發 |
|---|---|---|---|---|
| B | US-BNK-01 AC1/AC2 | 初始值、幣別兩選項 | bankacc: 銀行帳戶初始畫面、幣別下拉有…（2 個） | — |
| E/G | US-BNK-03 AC1/AC3/AC5 | 2 筆、中文表頭、國內外轉換、W/A 原碼 | bankacc: 查詢已註冊帳戶 @smoke | E000001 |
| E | US-BNK-03 AC1 | 無資料只有表頭 | bankacc: 查詢沒有帳戶的商家列表為空 | 預設 [] |
| F | US-BNK-02 AC1 | 註冊 OK＋自動刷新清單 | bankacc: 註冊國內新台幣帳戶成功… | save 預設 |
| C | US-BNK-02 AC2 | USD+外國→N；未勾→Y | bankacc: 註冊美金外國銀行…、未勾外國銀行…（2 個）@mock | bankCode 777／776 |
| E | US-BNK-02 AC3 | 999 → FAIL Value too long | bankacc: 後端註冊失敗時原樣顯示 FAIL 訊息 @mock | bankCode=999 |
| C | US-BNK-02 AC3＋US-COM-06 AC2 | 空白 → FAIL NULL not allowed | bankacc: 銀行代碼與帳號空白… @legacy @mock | bankCode="" |
| C | US-BNK-02 AC4 | 非數字仍送出 | bankacc: 帳號含非數字仍會送出註冊 @legacy | save 預設 |
| D | US-BNK-02 AC5 | 訊息保留到下次註冊 | bankacc: 註冊訊息保留到下一次註冊才更新 | 999→822 |
| E | US-BNK-03 AC4 | 清單 500 → 不更新 | bankacc: 列表查詢後端 500 時… @legacy @mock | E500000 |
| H | US-BNK-03 AC4 | session 逾期：清單空表頭、註冊 please login | bankacc: session 逾期後查詢清單只剩空表頭 @legacy | 未登入 |
| G | US-BNK-02 AC6 | Finance 審核說明文字 | bankacc: 頁面顯示 Finance 審核說明 | — |

## csr（US-CSR-01〜03）

| 維度 | US/AC | 情境 | Scenario | Mock 觸發 |
|---|---|---|---|---|
| B | US-CSR-01 AC1 | 初始門號、提示、說明 | csr: CSR 查詢初始畫面 | — |
| E/G | US-CSR-02 AC2/AC3/AC4 | 交易 8 欄＋退款 8 欄＋Refunds: 分隔 | csr: 查詢有交易的門號… @smoke | 預設 |
| G | US-CSR-02 AC2 | TX_DT 降冪（最新在上） | csr: 交易表最新的交易排在最前面 | 預設 |
| J | US-CSR-02 AC2 | 商品名稱與商家資訊可見 | csr: 交易表看得到商品名稱與商家資訊 | 預設 |
| G | US-CSR-02 AC6 | RETURN_CODE null 原樣顯示 | csr: 未取消交易的 RETURN_CODE 顯示 null @legacy | 預設 |
| E | US-CSR-02 AC5 | 查無資料兩張空表、分隔線仍在 | csr: 查詢沒有交易的門號… | 0900000000 |
| E | US-CSR-03 AC2 | 後端錯誤 | csr: 後端發生錯誤時… | 0950000000 |
| C | US-CSR-03 AC1 | 門號空白／非數字仍送出 | csr: 門號空白或格式不符…（Outline 2）@legacy | 預設 |
| E | US-COM-04 AC2 | 11 筆畫面 10 列 | csr: 超過 10 筆交易… @mock | 0910000010 |

## 未直接覆蓋的 AC（15 條，各附處置）

| US/AC | 條文 | 處置與原因 |
|---|---|---|
| US-COM-01 AC4 | P-COM-06 | 不自動化：session 30 分逾時靠等待、多瀏覽器同登成本高 |
| US-COM-03 AC4 | P-COM-11, P-COM-12 | 不自動化：字型配色等外觀不斷言 |
| US-COM-04 AC8 | P-COM-29 | 不自動化：表格樣式屬外觀 |
| US-COM-05 AC1 | P-COM-13, P-COM-14 | 隱含驗證：整套測試打 8099 的 Mockoon 而非 DB，即證明轉呼叫架構 |
| US-COM-05 AC4 | P-COM-17 | 不自動化：無逾時會讓測試無限等待 |
| US-COM-06 AC4 | P-COM-34, P-COM-35 | 隱含：E 維度的區間情境（2099、20990101）即字串比較行為 |
| US-COM-06 AC5 | P-COM-36 | 隱含：金額與幣別由資料呈現情境帶出 |
| US-RPT-02 AC7 | P-RPT-13 | 隱含：US-COM-02 的角色情境已證明不依身分限制 |
| US-RFD-02 AC3 | P-RFD-04 | 不自動化：mock 僅 1 筆退款，無法驗排序 |
| US-RFD-02 AC4 | P-RFD-05 | 不可觀察：後端 JOIN 邏輯，畫面無法區分 |
| US-RCN-02 AC3（唯一性） | P-RCN-04 | 部分：RECON_ID 格式有驗；唯一性屬資料性質 |
| US-TOS-03 AC5 | P-TOS-14 | 部分：訊息清空已驗（成功路徑）；失敗後重查未獨立驗 |
| US-TOS-05 AC1 | P-TOS-17 | 不在範圍：getToS.jsp 在 backend、不經 Portal |
| US-TOS-05 AC2 | P-TOS-18 | 不在範圍：backend 初始資料 |
| US-BNK-03 AC2（不限 10 筆） | P-BNK-06 | 部分：完全相符與空清單有驗；>10 筆未驗（mock 2 筆） |

## 未實作／範圍外（SRS 第 8 章，不測）

| 項目 | 說明 |
|---|---|
| 角色授權 | 現況「不分角色」已以 @legacy 情境固定（US-COM-02） |
| 報表匯出 CSV | 畫面提示「匯出功能尚未提供」 |
| 退款報表之商家/時間類型條件 | 現況「欄位隱藏」已測（US-RFD-01） |
| 每月對帳差異明細 | 現況「M 開頭必為 0 筆」已測（US-RCN-03 AC3） |
| 服務條款之商家名稱顯示 | 畫面僅商家代碼 |
| 商家銀行帳戶審核 | 狀態維持 W，現況已測（US-BNK-03） |

## 程式有但 AC 沒寫的行為（回饋給 /gen-user-story）

1. `/;jsessionid=任意值` 的 welcome page 繞過——US-COM-01 備註已記載、SRS 未記載；已以 @legacy 情境固定。
2. 首頁底部「選單沒有依角色過濾」的註記文字——SRS 畫面元素表有、AC 未單獨列；已補情境。
3. tos 目前內容以 `<pre>` 呈現、保留換行——SRS 畫面元素表有、AC 未提；已補情境。
