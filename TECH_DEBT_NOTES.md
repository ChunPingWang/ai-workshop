# 技術債清單（講師用 / 重構題目庫）

本系統「可以執行」但刻意埋了下列問題，供後續以 AI 輔助重構練習。
最大的結構性題目：**SD 文件描述了目標架構（shell/core 分層、OLSProcessor、State Pattern、Service/Command 三層），但程式碼完全沒有照做**——重構的終點可以直接拿 SD 4.1 的設計當驗收標準。

## A. 架構 / 分層

1. **沒有分層**：Controller 直接寫業務邏輯 + SQL（`OlsSoapController` 是 400+ 行 god class；`OlsBatchJobs` 700+ 行含九支批次）。無 Service、無 Repository、無 domain model（到處都是 `Map<String,Object>`）。
2. **SD 4.1 的 OLSProcessor / State Pattern 不存在**：交易狀態 A/D/F 的轉換散落在 `OlsSoapController`、`OlsBatchJobs.doCharge/doCancel/doRefund`、`CancelOLSTX` 四處，規則彼此重複又不完全一致。
3. **靜態可變全域狀態**：`DBUtil.jdbc`（public static）、`NewPayApplication.CONFIG`、`OlsBatchJobs.reqSeq`、`FakeOlsController.fileSeq`。
4. **設定四散且互相矛盾**：`application.properties` 有 `ols.*` 設定但程式沒讀；`TELCO_TW`、`E000001`、`0300`、路徑、URL 分別寫死在 `NewPayApplication`、`OlsSoapController`、`OlsBatchJobs`、`SMSPushMOOLS`、`CancelOLSTX`、`ToSController`（改 port 時就中過一次獎）。
5. **daily / monthly 對帳是整段複製貼上**（`reconOLSDaily` vs `reconOLSMonthly`），charge/cancel/refund 三個 do 方法也高度重複。
6. **模擬器（fake package）與正式碼同一個 application**，`SMSPushMOOLS` 用 HTTP 迴圈呼叫自己 process 內的 fake endpoint。

## B. 正確性（會咬人的 bug）

7. **共享 `SimpleDateFormat`**（`CommonUtil.SDF14`，非 thread-safe），且 `utcMillisToTwTime` 會**改掉共用實例的 TimeZone**——併發或呼叫順序不同時 `now14()` 會產出錯誤時間。
8. **金錢用 double 運算**（`CommonUtil.microsToAmount`），double 精度 + 兩段式 round。
9. **TXID 用 `"T"+System.currentTimeMillis()` 產生**：同毫秒併發即撞鍵（PK violation → Auth 失敗）。`MWP_SMS_OLS.ID`、REQ_ID 同病。
10. **Auth 冪等回放的是被截斷的 response**：`RESP_XML` 欄位只有 256、存檔時 `trunc(...,250)` 又把單引號拿掉，重送 CorrelationId 時回給 OLS 的是殘缺 XML。
11. **Auth 非原子**：先 insert `MWP_PAY_TRANS` 才 insert `MWP_OLS_SOAP_AUTH`，中間掛掉會出現「有交易但無冪等紀錄」；整個系統無 transaction 管理（每條 SQL 各自 commit）。
12. **Association 的 503 重試在 request thread 裡 `Thread.sleep(1000)` 重試 3 次**，会把 SMSC/MO 呼叫端拖住（FSD 要求 20~45 秒完成，這裡沒有總 timeout 控制）。
13. **對帳「跨天/跨月」情境**（FSD 4.2.5.3 明文要求 alert）：程式只會在雙向比對算出 102/202，沒有針對跨天檔案的特別判斷；`FILE_SEQ_NUM` 漏抓檔檢查（多檔 -of- 切分）完全沒做。
14. **Provision 寫入 `MWP_BATCH_PROVISION_POOL` 但沒有任何批次消化它**（SD 4.3.2 Step 6 的 batchProvisioning 不存在），表會無限長大。
15. **`GetOrderDetail(E0504)`（SD 4.4.11）、Merchant portal 銀行帳戶 USD 審核頁（FSD 4.6.6/4.6.7 只有查詢沒有維護）等規格項目缺漏**。
16. **buildDeductionCSPFile 先寫檔再逐筆 update status**：寫檔成功、update 失敗會重複請款；CSP 回覆處理直接混在同一個方法裡。

## C. 安全

17. **全面 SQL injection**：所有 SQL 都是字串串接（報表 `from/to/merchantId`、`msisdn`、XML 內容全部直接進 SQL）。試試 `curl "…/csr/trans?msisdn=x' OR '1'='1"`。
18. **商家密碼寫死在程式碼**（`CancelOLSTX`：`E000001/password1`），且以明文比對。
19. **`/batch/run`、`/sa/*`、`/fakeols/*` 全部無認證授權**，註解自己也承認「不要外開!!」。
20. **錯誤處理把 exception 細節吐給呼叫端**（`BatchTriggerController`、`ReportController` 直接回 `e.getMessage()` + SQL）。
21. XML 手刻解析（`CommonUtil.cut`）無 escape/注入防護；回應 XML 也是字串拼接。

## D. 可維運性

22. **`System.out.println` 當 logging**，告警（email/SMS）也是 println，無 log framework、無 log level。
23. **吞例外**：到處 `catch (Exception e) { e.printStackTrace(); }` 之後繼續走，部分失敗會靜默略過（例如寫 provisioning log 失敗「不影響交易」）。
24. **檔案 IO 無 try-with-resources**（JDK7 語法明明可用），例外路徑會漏 file handle；`renameTo` 回傳值沒檢查。
25. **排程與手動觸發共用同一批非同步不安全的方法**，`@Scheduled` 多執行緒下（reqSeq++ 等）會出事；批次沒有重入鎖。
26. **註解裡的口述歷史**：`<[人員A]>`、「先這樣」、「之後再說」、被註解掉的 CONFIG 值——典型的 tribal knowledge。
27. **無單元測試、無整合測試、無 CI**。`mvn test` 是空的。

## E. Portal（前端）追加

28. **PortalController 又是一支 god controller**：頁面路由、session 檢查、ajax proxy、RestTemplate 呼叫全部混在一起；每個 handler 複製貼上同一段 `if (session.getAttribute("loginUser") == null)`（沒有 interceptor/filter）。
29. **登入形同虛設**：帳號密碼寫死在 static Map（sa/sa、cp/cp、csr/csr）、明文比對、無 CSRF 防護；登入後**沒有角色授權**——csr 帳號可以直接開 SA 的服務條款設定頁去建新版次。
30. **XSS 大門敞開**：backend 把 DB 內容拼成 HTML 回傳（無 escape），portal 用 `$('#result').html(data)` 直接注入頁面；bankacc/tos 頁用 jQuery 字串串接組 HTML 也沒 escape。搭配 17 的 SQL injection 是完整的攻擊鏈。
31. **後端 CORS 全開**（backend `CorsConfig` allowedOrigins "*"）——「先全開比較省事」。
32. **前後端契約混亂**：報表走「backend 回 HTML、前端直接塞」，ToS/銀行帳戶走「backend 回 JSON、前端自己組」，兩種模式並存；DB 欄位名（大寫底線）直接外洩到前端 JS。
33. **設定重複第二輪**：`newpay.backend.url` 在 portal application.properties 有一份但程式沒讀，`http://localhost:8099` 寫死在 PortalController；每次 request `new RestTemplate()`、無 timeout 設定（backend 掛掉時 portal thread 會吊著）。
34. **模板複製貼上**：七個 template 的導覽列、CSS/JS 引用整段重複（沒有 layout/fragment）；行內 `<script>` 與 HTML 混雜；jQuery 1.12.4（2016 年、已 EOL 的版本）。
35. **銀行帳戶 API 塞在 backend 的 ReportController 裡**（職責錯置），且幣別存 `NTD`——與交易表用的 ISO 代碼 `TWD` 不一致（FSD 原文就這樣寫，拆帳報表對幣別時會踩到）。

## F. 建議的練習切入點（由小到大）

1. 加測試護網：先為 `CommonUtil`（時間/金額轉換）與 Auth 冪等行為補 characterization tests，馬上會踩到 7/8/10。
2. 參數化 SQL + 抽 Repository，消滅 injection（17）。
3. 抽出設定（4）與常數，導入 `@ConfigurationProperties`。
4. 依 SD 4.1 落地 OLSProcessor + State Pattern，收攏狀態轉換（2），四處重複的 charge/cancel/refund 規則歸一。
5. daily/monthly 對帳去重複（5），把「視窗計算/比對規則」抽成可測的純函式。
6. 補齊規格缺漏（13/14/15）並用 FSD 條文當驗收條件。
