new\-pay OnlineStore

__Portal 需求規格書__

Software Requirements Specification

範圍：SA / Merchant / CSR Portal 與其使用之後端 API

文件版本

1\.0

日期

2026\-10\-07

狀態

正式版

適用系統

new\-pay Portal（SA / Merchant / CSR Portal）及其使用之後端 API

# 修訂紀錄

__版本__

__日期__

__作者__

__說明__

1\.0

2026\-10\-07

new\-pay 專案團隊

初版發行，涵蓋 Portal 七個頁面與後端 11 個 API

# 目錄

# 1\. 文件說明

## 1\.1 目的

本文件為 new\-pay OnlineStore（OLS）系統 Portal 模組之需求規格書，定義 SA Portal、Merchant Portal 與 CSR Portal 各功能頁面的畫面、操作流程、業務規則、與後端之介面，以及相關資料需求，作為系統開發、測試與驗收之依據。

## 1\.2 範圍

本文件涵蓋：

- Portal 之七個頁面：登入、首頁、交易報表查詢、退款交易報表查詢、OLS 對帳結果查詢、服務條款設定、商家銀行帳戶註冊、CSR 交易查詢。
- Portal 之全部 HTTP 端點（頁面路由與資料端點）及其與後端之介接方式。
- 後端中供 Portal 使用之 API（報表、對帳、服務條款、商家銀行帳戶），含請求參數、回應格式與對應資料表。
- 上述功能所使用之資料表欄位、代碼值與初始資料。

本文件不涵蓋後端之 SOAP API（Association / Provision / Auth）、批次作業（Charge / Cancel / Refund）、日月對帳批次及 SFTP 檔案交換；該等功能另以文件定義。本版次範圍外之事項彙整於第 8 章。

## 1\.3 讀者

- 開發人員：功能實作與維護之依據。
- 測試人員：測試案例設計與驗收之依據；需求編號供追溯使用（附錄 B）。
- 專案管理與業務單位：確認 Portal 功能範圍。

## 1\.4 名詞定義

__名詞__

__說明__

Portal

new\-pay 後台網頁應用（port 8098）。SA Portal、Merchant Portal、CSR Portal 為同一應用、同一組頁面。

後端（Backend）

new\-pay 交易後端（port 8099），提供 Portal 所需之查詢與存檔 API；資料存於 H2 資料庫（Oracle 相容模式）。

SA / CP / CSR

三類使用者：SA Portal 供 BO、PM、Finance BO 使用；Merchant Portal 供 CP（商家）使用；CSR Portal 供客服使用。系統以帳號 sa、cp、csr 對應。

OLS

OnlineStore，電信帳單代收（DCB）之對接商店。OLS 交易於交易主檔中 CHANNEL=0300、MERCHANT\_ID=E000001。

TXID

交易序號（MWP\_PAY\_TRANS\.TXID），格式 T \+ 13 位毫秒時間戳。

MSISDN / ACC\_ID

門號。交易主檔以 ACC\_ID 存放門號；CSR 查詢以門號為條件。

ToS

Terms of Service，服務條款。每一商家可有多個版次（TOS\_VERSION）。

RECON\_ID

對帳批次識別碼。每日對帳為 R \+ yyyyMMdd（例 R20260915），每月對帳為 M \+ yyyyMM。

資料端點

Portal 中回傳純文字、HTML 片段或 JSON 之 HTTP 端點（如 /report/data），由頁面以 ajax 呼叫。

轉呼叫

Portal 收到資料端點請求後，向後端發出對應 HTTP 請求並將回應原樣回傳之行為。

14 碼時間

yyyyMMddHHmmss 格式之字串，台灣時間（GMT\+8）。資料庫時間欄位均採此格式。

## 1\.5 需求編號

需求條文以 P\-<模組>\-<流水號> 編號。模組代碼：COM 共用、LGN 登入、HOME 首頁、RPT 交易報表、RFD 退款報表、RCN 對帳查詢、TOS 服務條款、BNK 銀行帳戶、CSR 客服查詢、API 後端介面、NFR 非功能。需求描述中出現之 \#id 為畫面元素識別碼（見各頁面之畫面元素表），用於精確指明所述元素。

# 2\. 系統概述

## 2\.1 系統定位

new\-pay 為電信業者之帳單代收（Direct Carrier Billing）平台；OnlineStore 專案使用戶得以電信帳單購買 OLS 之數位商品。Portal 為此平台之後台網頁，供營運（SA）、商家（CP）與客服（CSR）查詢交易與對帳結果，並維護服務條款與商家銀行帳戶。Portal 本身不存取資料庫，所有資料均經由後端 API 取得。

## 2\.2 系統架構

__元件__

__技術__

__埠__

__說明__

瀏覽器

HTML \+ jQuery 1\.12\.4

—

頁面由 Portal 以 Thymeleaf 產生；查詢動作以 ajax 呼叫 Portal 資料端點，回應插入頁面。

Portal

JDK 8、Spring Boot 2\.7\.18、Spring MVC、Thymeleaf、RestTemplate

8098

7 個頁面、8 個資料端點及登入／登出；以 HttpSession 保存登入狀態。

後端

JDK 8、Spring Boot 2\.7\.18、JdbcTemplate

8099

Portal 使用其中 11 個 API（報表 6、服務條款 3、銀行帳戶 2）。

資料庫

H2 in\-memory，MODE=Oracle

（內嵌）

啟動時建表並載入初始資料；後端重啟即重置。

請求流向（以交易報表為例）：

瀏覽器  \-\-GET /report?type=trans\-\->  Portal  \(Thymeleaf 渲染 report\.html\)

瀏覽器  \-\-$\.get /report/data?type=trans&from=2026091600&to=2026091623&merchantId=E000001&timeType=tx\-\->  Portal

Portal  \-\-GET http://localhost:8099/sa/report/trans?from=\.\.\.&to=\.\.\.&merchantId=E000001&timeType=tx\-\->  後端

後端    \-\-text/html: <table border=1 cellspacing=0>\.\.\.</table><p>total rows: 3</p>\-\->  Portal  \-\-原樣\-\->  瀏覽器

## 2\.3 使用者角色

__帳號__

__密碼__

__對應 Portal__

__使用者__

__主要功能__

sa

sa

SA Portal

BO、PM、Finance BO

交易報表、退款報表、對帳查詢、服務條款設定（PM）

cp

cp

Merchant Portal

CP（商家）

交易報表、退款報表、商家銀行帳戶註冊

csr

csr

CSR Portal

客服

查詢 new\-pay 交易紀錄

本版次三個帳號登入後之功能選單相同，系統不依角色限制可使用之功能（P\-COM\-03）；上表「主要功能」為業務分工，非系統限制。

## 2\.4 功能總覽

__功能__

__Portal 頁面__

__角色__

__使用之後端 API__

登入／登出

/login、/doLogin、/logout

全部

（無，帳號由 Portal 管理）

首頁功能選單

/

全部

（無）

交易報表查詢

/report?type=trans

SA、CP

GET /sa/report/trans

退款交易報表查詢

/report?type=refund

SA、CP

GET /sa/report/refund

OLS 每日／每月對帳結果查詢

/recon

SA

GET /sa/report/reconDaily、/sa/report/reconMonthly、/sa/report/reconDailyDetail

服務條款設定

/tos

SA（PM）

GET /sa/tos/query、POST /sa/tos/save（用戶端另有 GET /getToS\.jsp）

商家銀行帳戶註冊

/bankacc

CP

POST /cp/bankacc/save、GET /cp/bankacc/list

CSR 交易查詢

/csr

CSR

GET /csr/trans

## 2\.5 整體操作流程

1. 使用者開啟 http://localhost:8098/，未登入者導向 /login。
2. 輸入帳號密碼登入，成功後進入首頁功能選單。
3. 由首頁選單或頂端導覽列進入功能頁；功能頁載入時帶入預設查詢條件。
4. 修改條件後按查詢（或存檔／註冊），頁面以 ajax 呼叫 Portal 資料端點，Portal 轉呼叫後端，結果顯示於同一頁之結果區。
5. 可於各功能頁間自由切換；按「登出」結束 session 並回到登入頁。

# 3\. 共用需求

本章需求適用於所有頁面與資料端點，第 4 章各頁面不再重複。

## 3\.1 登入狀態與存取控制

__編號__

__需求描述__

P\-COM\-01

功能頁面（/、/report、/recon、/tos、/bankacc、/csr）須登入後方可開啟。未登入（session 中無 loginUser）以 GET 開啟任一功能頁時，回應 HTTP 302 導向 /login。

P\-COM\-02

未登入呼叫資料端點時不導向登入頁，以 HTTP 200 回純文字：/report/data、/recon/data、/recon/detail、/tos/save、/bankacc/save、/csr/data 回 please login；/tos/data、/bankacc/data 回 \[\]。

P\-COM\-03

本版次不實作角色授權：sa、cp、csr 任一帳號登入後均可開啟全部頁面、呼叫全部資料端點並執行存檔。

P\-COM\-04

session 保存 loginUser（帳號）與 role（與帳號相同之字串）；頁面以 loginUser 顯示目前使用者，首頁另以 role 顯示角色。

P\-COM\-05

GET /logout 使 session 失效並 302 導向 /login。登出後再開啟功能頁或呼叫資料端點，適用 P\-COM\-01 / P\-COM\-02。

P\-COM\-06

session 逾時採 Servlet 容器預設（30 分鐘閒置），以 cookie JSESSIONID 識別。同一帳號可於多個瀏覽器同時登入。

## 3\.2 頁面框架與導覽列

__編號__

__需求描述__

P\-COM\-07

登入後每一頁面頂端有深藍色導覽列（\.topbar），左側文字為 new\-pay Portal | <帳號>；首頁另於帳號後加 \(<角色>\)。

P\-COM\-08

導覽列連結固定八個，依序：首頁 /、交易報表 /report?type=trans、退款報表 /report?type=refund、對帳查詢 /recon、服務條款 /tos、銀行帳戶 /bankacc、CSR查詢 /csr、登出 /logout。各頁面之導覽列內容相同；登入頁僅有 new\-pay Portal 文字、無連結。

P\-COM\-09

導覽列不依角色顯示或隱藏連結。

P\-COM\-10

各頁面 <title>：登入頁 new\-pay Portal 登入、首頁 new\-pay Portal、交易報表與退款報表 交易報表查詢、對帳 OLS 對帳結果查詢、服務條款 服務條款設定、銀行帳戶 商家銀行帳戶註冊、CSR CSR 交易查詢。

P\-COM\-11

頁面編碼 UTF\-8；字型依序 PingFang TC、Noto Sans TC、Arial；頁面背景 \#eef2f5；內容區塊為白底灰框（\.box）；提示文字為紅色 12px（\.note）；按鈕深藍底白字。

P\-COM\-12

頁面僅載入 /css/portal\.css 與 /js/jquery\.min\.js（jQuery 1\.12\.4）兩個靜態資源，不使用外部 CDN。

## 3\.3 Portal 與後端之介接

__編號__

__需求描述__

P\-COM\-13

Portal 不直接存取資料庫。每一資料端點對應一個後端 API，Portal 轉呼叫後端並將回應字串原樣回傳瀏覽器，不解析、不轉換。

P\-COM\-14

後端位址為 http://localhost:8099，以程式常數設定。

P\-COM\-15

GET 類資料端點轉呼叫失敗時（後端未啟動、連線被拒、後端回 HTTP 4xx/5xx），Portal 以 HTTP 200 回純文字 backend error: <錯誤訊息>，頁面將其顯示於結果區。例：後端未啟動時為 backend error: I/O error on GET request for "http://localhost:8099/sa/report/trans": Connection refused \.\.\.。

P\-COM\-16

POST 類資料端點（/tos/save、/bankacc/save）轉呼叫失敗時，Portal 以 HTTP 200 回 FAIL <錯誤訊息>；後端業務失敗亦回 FAIL \.\.\.，頁面一律顯示於訊息區。

P\-COM\-17

轉呼叫不設定連線與讀取逾時；後端未回應時頁面停留於「查詢中\.\.\.」。

P\-COM\-18

GET 轉呼叫之查詢參數直接串入 URL（不另做 URL 編碼）；POST 轉呼叫以 application/x\-www\-form\-urlencoded 表單送出。

P\-COM\-19

資料端點缺少必要參數時回 HTTP 400，不轉呼叫後端。

## 3\.4 查詢結果之呈現（報表類）

「報表類」指交易報表、退款報表、對帳查詢、對帳差異明細、CSR 交易查詢；其後端 API 回 HTML 片段，頁面直接插入結果區。

__編號__

__需求描述__

P\-COM\-20

後端回應格式：<table border=1 cellspacing=0><tr><th>欄名</th>…</tr><tr><td>值</td>…</tr>…</table><p>total rows: N</p>。表頭一列，資料每筆一列。Content\-Type 為 text/html;charset=UTF\-8。

P\-COM\-21

表頭欄名為資料庫欄位名稱（大寫、底線），順序同後端查詢之欄位順序。

P\-COM\-22

畫面最多顯示 10 筆資料列；total rows: N 之 N 為符合條件之總筆數，可大於 10。

P\-COM\-23

查無資料時回 <table border=1 cellspacing=0><tr></tr></table><p>total rows: 0</p>：無表頭、無資料列，僅一個空 <tr>。

P\-COM\-24

欄位無值（NULL）時顯示文字 null，例如尚未請款之交易其 BILL\_CSPTIME 欄。

P\-COM\-25

欄位值原樣輸出，不做 HTML 轉義。

P\-COM\-26

後端查詢發生錯誤時，以 HTTP 200 回 query error: <錯誤訊息><br/>SQL=<查詢語句>，頁面原樣顯示於結果區。

P\-COM\-27

按下查詢後、回應到達前，結果區顯示 查詢中\.\.\.；回應到達後結果區內容整個被取代。

P\-COM\-28

查詢按鈕於等待回應期間不停用；連續按下多次會送出多次請求，結果區以最後到達之回應為準。

P\-COM\-29

結果表格之樣式由 portal\.css 決定：表頭淡藍底、灰色格線、白底。

## 3\.5 輸入處理

__編號__

__需求描述__

P\-COM\-30

Portal 頁面不對輸入值做格式驗證；欄位可為空、長度與字元不限，按下查詢／存檔時原樣送出，結果由後端回應決定。例：交易報表日期欄清空時送出 from=00、to=23。

P\-COM\-31

後端 API 不對參數做格式驗證。輸入含單引號時查詢回 query error: \.\.\.、存檔回 FAIL \.\.\.；輸入超過資料表欄位長度時存檔回 FAIL \.\.\.。

P\-COM\-32

必填欄位（服務條款之生效日期與內容、銀行帳戶之銀行代碼與帳號）為空字串時存檔失敗，回 FAIL \.\.\.（訊息含 NULL not allowed）。

## 3\.6 日期、時間與金額格式

__編號__

__需求描述__

P\-COM\-33

畫面輸入之日期為 8 碼 yyyyMMdd；報表小時為 2 碼 HH（00～23）；服務條款生效日期為 14 碼 yyyyMMddHHmmss。均為文字輸入框，無日期選擇器。

P\-COM\-34

資料庫時間欄位（TX\_DT、AUTH\_DT、BILL\_CSPTIME、REFUND\_DATE、CREATE\_TIME、TOS\_MODIFIED\_DATE 等）為 14 碼字串、台灣時間；報表原樣顯示，不另格式化。

P\-COM\-35

報表時間區間以字串比較：後端將 from 補 0000、to 補 5959 後與 14 碼欄位比較；from=2026091600、to=2026091623 即 20260916000000～20260916235959，含兩端。

P\-COM\-36

金額（AMOUNT）為整數（新台幣元）；交易主檔幣別為 TWD；銀行帳戶幣別為 NTD 或 USD。

# 4\. 功能需求

每個頁面依固定結構描述：概述與路徑 → 畫面（截圖、元素表）→ 操作流程 → 需求條文 → 後端介面。元素表的「定位」欄是 HTML 的 id 或 name，Portal 沒有 data\-testid。

## 4\.1 登入（login）

路徑：GET /login 顯示登入頁；POST /doLogin 驗證帳密；GET /logout 登出。

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABQAAAAF1CAIAAAA4JtDBAAA8uUlEQVR4nO3deViU9f7/8ffAwAzbCOgAKi6AouKKS5BmmrhQ6klTc01psa/WqehYPzXLpY6mHTt5rHO0MlOzI5WmphXq0STTgxZCLoggiwKyKiPrDAzM749JQlwyTzrC/XxcXFf33Pfnvu/3fQ/XlS8\+n/tzq9r8aa4AAAAAANDY2dm6AAAAAAAA7gQCMAAAAABAEQjAAAAAAABFIAADAAAAABSBAAwAAAAAUAQCMAAAAABAEQjAAAAAAABFIAADAAAAABSBAAwAAAAAUAQC8P/GxW/xP1/7Zmorna0LAQAAAADcmNrWBdxGusBhUX8bEFT7ubIi9XTip1F7Pz1hMN3cETRefiOD1bH7UrKqblONAAAAAIA7pLH3AJcWbV6ypO3Dr7Qd\+3rYkq9jqvxnvzRqbMubjP1qfWC/yPBAX8fbWyMAAAAA4A743T3AGr\+\+UQtCUvcl67v4\+Xq5afLTVq3Z/mmyUUQdEBI2f\+o9ob5OUloQuyt63qYU3cin1oflPDdve6xB9CHjv3klMPVfq6btKjQ5NHtiwfTJ2ZsnrEopqD20u9/ixROCTx9L9es21N9Nis5tXrP59R8KTSKalp0ip4aN7NLC17Ei9cTRFWv27jA0n//XKUPTN49eeapAREQ7YObMdwOTn37169iya9VdZUyNP7rMoA3\+a9jQDu6bswvF3W/yU8NnhrTQO1YVpKVvjtq24rBB/O6PWtCr4GhRQEirmqRc795\+OpGofwd9unDVvGS3sVOHPRHiF\+QhBWkpazfsXBt/sz3JAAAAAACbu6UeYBf90C6ydvnqsOkfrijynz21Z4CD6LsMe/f5nprD2yc88/dpG9J0w8YuD9fnJ2cWuzQP9lCLaAO66KXIrO/aQu8gGo8WoV7mxOMFBXUPWyUibkEhfsVbNoZNX/XSYRn51IixLdXi0Gzk1FGTPdJff/WtsEW74t17Lp7ZM6gyZ8eBAl2XbsFeahER9\+ZDu7hmxScmXjP9Xs3BfehTY2cHGlYt\+ft9z2xca9A/MXPEyJZqEbM4uAf7lqxatOrxdzdN23K\+OOvghEl/mxdvDBo2fH6Iesc/Vt/3zMZV\+c0jX7C2BwAAAAA0DLcUgCsr4vcejs03S5Uh8XSReOh9XbRB/QN9848u23IsPrswdtfeFT\+UBvVv73UxLb7MLdjPVePgEewn8QeSi71a\+TqqdS39AqQgNr30qkNXFZz4ftXhzKz8zN1fHY2X5kM7uGuqCnes\+nD08r270w2pJ46uis4xefkHeJgT448lOvqP7eKqEdH5BoW6FMTE5hTfoGyX5iPH9Auqytx92iBe/mO7aON37P00vjArO2XthsOJDq1GdnB3FBExpx44tCO5MMtgrrOzOXHX5tHzotbG52Rlp2zecizVQR/spb2VuwcAAAAAsIVb68M0FhiMv4z\+rTKbHNQaB1edl6vOf8DWfw/4tVVec9\+qY7FZMrODXnfaLdilNPZoenCXnkFeWlPX5jpDYnyR69gFzy3v6SQiknVwwsJEEXNBfklxlYiIqaykuFLt6\+skotb5Bs6c0G9oBw\+d9XHc0kSNiCkreUf6gMj\+/r4HEvUhfrr8YzuyjfUrdfUY\+8orY2s/lqatXbltc7ZZ00WvdzDGZ5VYr8JUVpBVpg7wddKki4ixIL/k6rHNGhf90Ilhk4Nb\+7paVxQl8mwwAAAAADQctxSArz0lsrn4\+M4Jiw4lXrFVHXSiSNPfP8jP1bcqJz49Rwza0MDm4udWcDozq7w0a9Wa0e5qEZGyosRy/UgRzVXHdfQKmv/8sND8Q/PmxcWkG/SDpkRNtJZhiDmQOXNqt1C/koAubqn7UlKvHv9cWhG76\+u1pytEzMVFRYnphdZ0rRH11SeqvbprPNnr0GzszAmRLdNXrFy140ROccu\+6xeEXP8GAQAAAADuOn/QU6xVpQX5Rk1wc18XSTSIiOi8mukrDakGc9bpzILw5kNDXSVrb1ZZkSbLPLZn0AAvc2J0QbGYJT8nPv/yQVz0Imq9r17vkF5cJRoXN72juTirQuMVFOBi2L0lZkeyUcQ1tINeLzkiImIuOBEXXzlqZHhPnUvB5hMF15qSyph1Onn34fpjrU1FBQWiDfDVauJLTSI6d72vi7kgq\+K6k1q5eAS3lMQfYtYezjSJOsDXP8BRUv/3\+wYAAAAAuFP\+qNcgGRMPJKd6dIucek\+wl1bXstv8udOX/6mVTqQ4Py2xsvnQLk4FpwuKq4xZp4t0HYKCHM7HpF81XFlExEHXpV/kIL\+Aln5jJw4Ilpzdpw0lZSUmcQ3w1esctEGDwib7isnBVeciImLKz9wcbwwO6\+6bfSwmy3ytA16bKT9tR7I5eGT45OBmvn6dZk7sF1SWufm0ofKKVmYpNYuDq97LXe9gKa5S\+7bU\+zqo9YE9Zw5yNYla56K9bjcyAAAAAOAu84e9B7jgxK7nlh8q6DAs6sP5Py6\+X3/i65c2pReLSFlBbL7oXSpi00tNIgXZmVkubpr89MSia\+bVitTDaZo/Rez91/T5XUo2r9m5Odtsykpc9UNR8FMzj22eHxVuXLtq56fZ\+vl/nTK5pVqkND42LauyIj42LevaA7Ovo6pw8z\+iliW7z3zlLz\+sGDvSJXne8s07suuVZE49kZjo0v3dFdNn\+xd9uiXRFDp27\+bXf3wlKDFq\+\+sHSkJnTl8e6nrLdwwAAAAAcCep2vxprq1ruMzFb/FbU4IPr5uwIfNGkzlfQR00bMr6MRWvv7plR/7v6AEGAAAAACjNH9YDbAvagJCw\+RNbZUUfiiH9AgAAAABu6A\+aBMsGXIc\+/9wHYW5ZB7Y9vevme4wBAAAAAAp1Nw2BBgAAAADgtmnQQ6ABAAAAALhZBGAAAAAAgCIQgAEAAAAAikAABgAAAAAoAgEYAAAAAKAIBGAAAAAAgCIQgAEAAAAAiqC6WFxm6xoAAAAAALjt6AEGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIqhtXQAA4AppyadsXQKAP4x/YCdblwAA\+BUBGADuOr169bJ1CQD\+AHFxcbYuAQBwBYZAAwAAAAAUgQAMAAAAAFAEAjAAAAAAQBEIwAAAAAAARSAAAwAAAAAUgQAMAAAAAFAEAjAAAAAAQBEIwAAAAAAARSAAAwAAAAAUgQAMAAAAAFAEAjAAAAAAQBEIwAAAAAAARSAAAwAAAAAUgQAMAAAAAFAEAjAAAAAAQBEIwAAAAAAARSAAAwAAAAAUgQAMAAAAAFAEAjAAAAAAQBEIwAAAAAAARSAAAwAAAAAUgQAMAAAAAFAEAjAAAAAAQBEIwAAAAAAARSAAAwAAAAAUgQAMAAAAAFAEAjAAAAAAQBEIwAAAAAAARSAAAwAAAAAUQW3rAgAAt6q0KDG9qFjMlz\+rNS76AA9j4ukS357\+\+rK0HQeMoeFBvo5X75i27NWo3Q6txo4JfyJUr7mjRQMAANgMARgAGqri9JjnXj2SWmeN76Dxy30PTdtQNGBkNzlwaLdBPUCe\+\+BPV0XcKmNBUWmq4dSyN9NjHpny7jR//Z2sGwAAwEYYAg0ADZXOt\+fMJ6fs/WJJxvZFe59spRFtUJfWwSE9B7iU7t5xaLdBHTxo\+BMeyZuPl9Tf0yNo\+T9f3jqzW5CDMfbLjfOiz5tsUT8AAMAdRgAGgAaqJHZT1EsfbXx61c9ZRTm792WaHJoP7eCq8e32xH3uItoBU6dE\+h57afnX85Zv25FXVX9vV4/g8AnrX\+rpK8bdm76PKbLBBQAAANxhDIEGgAbKLSisW\+i\+72P3fTYt3T0rXXzvu2eAr4OIQ/CYsJGHt\+zYsC5GRByaPzFzxEhvh2sdoao4v6BARAyJnx4uGBDOw8AAAKCRowcYABoqXYewd1\+5J9hBUtMNJnEN7uCQejw59nhyfLZTaAd3ERGHVrMXPzU/1OM6BzAmnigwiYiY4w8kZ1XeqboBAABshB5gAGi4HHRefgEeR\+LzRaR0x0cbd9TbXpW5ecuxAc\+HBLlea\+\+izJjTRhHRiRSnpyUW9Qvwvu0VAwAA2BABGAAaqKrU2F2vrzoUYxB9l76zRwb6utTdKKayopjovWsPb38o4uDYqaNmh/vrr3wfUnF6YqxBpGXPmX5py37ISTRUjPR2uqNXAAAAcGcRgAGg4THlJa5YuW3ViVIR96GDmmftO/TSiUNXtVKHTp3ygd/eeTsyYw4njgxpNeCKJ4FLYvcmZ4kEh90z1L1k7Q/p8adLTR2ceAwYAAA0YgRgAGh4NN7tJ4/sluWiHjs1LNQl8bnDp1K9\+i6fGqi/nHALDu\+dt6NA564fOmZm6MjzxS4tfK8cBW06fXTV4VJx7/TEfc19y/x9HVISj6YVhOt9Ha8\+GwAAQCNBAAaAhsjBN3TEu6EiIlIkImIqyok9KrrLm4uzSoovL\+u8W\+jq7V15/tMNe\+Or1KF/Chvq7aApbRXsIfEnjsXk95zse835ogEAABoDAjAANGymMqOpUqQs/dMd6VduUZvKzCaRq0Y1V8Rv2r7shFnjd//sYS00IuLafGiw\+9pd6ZsPF4z1bcEoaAAA0FjxGiQAaNg0vj0Xz2yvF9H43f/Np0syti85/c7wUAcRr54zB139at\+K\+C0bn/4y0\+TQPHLmgOBfxkU7BYf3C3WQ\+E1b1p6uuNMXAAAAcKcQgAGgoXPw7T9sZqDalH507YkSkZLYHQdjq9QDxvQLrv/2o5LY9eumbUgvEO3Qp8Y80eHXOZ81/j0jw5tJVc6yRetWHS25s/UDAADcIaqLxWW2rgEA8Ku05FO9evW6iYZViVtWP7Qh52aOGTRyxtYJsnll1LzDBhHt0CefevdPVw11Lj23atGaZclmEdehU8cuHhmoZ0Is4H8TFxfnH9jJ1lUAAH7FM8AA0EA56APvmT2yoPi3W6p9g0rWL/psSbJZxH3k81OWh13rQV/X1jNfiZDlUctOlO7\+KibYT/9ETw\+eBwYAAI0JPcAAcHe56R7g38eUdnjehszQqcPH\+jvdsGFF6tHkLK\+gAUwHDfzP6AEGgLsNPcAAoAga/5DlC0NuoqFTQM/uAbe9HAAAABtgEiwAAAAAgCIQgAEAAAAAikAABgAAAAAoAgEYAAAAAKAIBGAAAAAAgCIQgAEAAAAAikAABgAAAAAoAgEYAAAAAKAIBGAAAAAAgCIQgAEAAAAAikAABgAAAAAoAgEYAAAAAKAIBGAAAAAAgCIQgAEAAAAAikAABgAAAAAoAgEYAAAAAKAIBGAAAAAAgCIQgAEAAAAAikAABgAAAAAoAgEYAAAAAKAIBGAAAAAAgCKobV0AAODulZeXt2DBgn379hUUFNi6FtyN9Hr9oEGDFi1a5O3tbetaAAD4bQRgAMB1zZ07d\+vWrbauAnevgoKCzz77rLKycu3atbauBQCA30YABgBc1759\+0Rk586d/fr1s3UtuBsdPHhwxIgRMTExti4EAICbwjPAANBwGXP3r1sXnWG8pZ0NsSsiZqxLuuHOly5dEhHSL67H\+rtx8eJFWxcCAMBNoQcYABqwjOjVq41tR4W31YoYk1aED1ya69PWXfvLVm3bUUtXzwnVJq0YNWqbT3gPbdL\+2LZLo1eH\+4iIiCEpNjph6ZwkdzFIxxkLZ/Rwt9l1AAAA3AkEYABowLTuWjFoawOve4/IpVFzQt2vbGTUurt3HBW5NNJnW0REQm1rEdG2nRC5NLKHVgAAAJSAAAwADZIhdsWMpbHG3KQM49KIJG2PyBWRPmLM2LZioaGtVkSMxlxj24iFkQN9RKR2mLNRjMbc6Dkz1hl8fAyx0QYxrJ4zx11ykzLcZ6xe8UvPMAAAQCNFAAaABsloSEgy9IgMzc2VUT2SViTkitFHtG1HRS68qgdYxN3duGLGwCgRbdsJ7kZDhqHtjBURSRGx7nNWrx4oGfu3rY716XjVXgAAAI0MARgAGo86PcAi4t5x1IyIUHfRtp2wOnpCbaOMKMndv3BUdFJCktYYEdGjbceO4TMiw9syEBoAADR2BGAAaDy0bQdGLlxarwc4d//qFeuiovYbQ0cNbKt192krRvceM5ZGGFZE7g\+NiOihTVq3dI6247oIIjAAAGjkCMAA0AgYEqIWLtyWkJAkSyPCxb1jRx\+tiBgNucYeM5bOmBFpSIiVgStWTPARkdyohG0Gn46h4QvnGLfFRkeLdIygAxgAACgBARgAGgH3HhPmzPFZkWDsOCciaen\+8Mil4drYqG3G0AkD22pFcn1Cw30Sls5YF53QccXqUKMYJTd23cIVURlGEXEPHRjJ9FcAAEAB7GxdAADglhlEjMbcpCSDUfvL2420PqGjOmZERa2ODB81Z1uSwdrOJzRiztKlK\+ZMuPyqX62IISnXJ3Lb/uilocbcXKPxWocHAABoXAjAANAgad079ujYVisihgxjxxkzBvpcnvoqdMYE44qFsaGr90fNuNYrfg0Go9ZdKyKiZdgzAABQFAIwADRI7qFz1q2O6Oij1faIXLcusnbiK6MhI9dnxpyBEhudkHtlv671kyEjweDeVpsRnSA\+Pr9EYGNGbNS2BMOdqx4AAMAWCMAA0EgYjYbc2BUzIrfl\+vSYsS4qUpYOHBixer81BRv2R3Z08puRoNXGRsWKcduMiCj3CRE93EVEK0ZjbnRUdAbDoAEAQCNHAAaABsxoMIrx8gO82o4DI1dERc0Z1dH67t/9\+xeGGg0GERFxH7giyWIxxi5sa2wbHiqGjgu3Rc3oqBVxb9ujrWHb6v0Gdx8GRAMAgEZOdbG4zNY1AAB\+lZZ8qlevXrau4hceHh4iUlRUZOtCcPfil\+QG4uLi/AM72boKAMCv6AEGAFyXp6eniBw8eNDWheAuFRMTI5d/TwAAuPvxHmAAwHUNGDBg69atI0aMsHUhuKsNHDjQ1iUAAHBTCMAAgOt688037e3tv/vuuwsXLti6FtyN9Hp9WFjYokWLbF0IAAA3hQAMALgub2/vDz/80NZVAAAA/DF4BhgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAgEYAAAAACAIhCAAQAAAACKQAAGAAAAACgCARgAAAAAoAhqWxcAALirzZ4929Yl4G63bNkyW5cAAMBNIQADAK5r9uzZZBv8Jn5PAAANBUOgAQAAAACKQAAGgMagoqJiwYIFVVVVti4EAADg7sUQaABoDFQq1enTp0ePHr1z587fbDxu3Dhvb29vb\+/Vq1dPnTrV2dn50qVLffr0GT9\+/B0oFQAAwFYIwADQIJnNZhcXl/vvv792TXFxsU6nGzJkiPVjdXV1bm5uYmLivn373nzzzezs7KqqqrZt2z7xxBMWi\+XJJ58MDg7eunXrrFmzmjVrZqOLAAAAuKMIwADQUHl6eu7Zs8e6nJKS0r9//7179wYGBh46dGjAgAEGg6Fv374iMmjQoEGDBk2bNm3cuHEjRowQkS\+//HLNmjU\+Pj55eXlvv/22s7OznZ3dvHnzbHkxAAAAtx8BGAAaJDs7u1mzZi1evHjy5MmPPPLI0aNHZ86c\+cgjj4SEhBQXF99///1lZWXPPPOMtXFlZeXevXvXrFlj/WixWB5//PHevXvTAwwAABSFSbAAoEGys7Pr2bPnxx9/7O3tnZmZKSLz58/38/NLSUnZuHHj3r17H3zwwUcffdTaeM\+ePcOGDXNwcLB\+VKlUzz333JAhQ1JTU8eNGzdkyJB169bZ6kIAAADuGAIwADRUf/nLX/71r385OTnZ29vn5ORMnTrV39//P//5z4ULFxYvXjxr1qyRI0eWlZWJyKeffrply5Y33nhDr9db93333Xf37NkTEBDwxRdf7NmzJyIiwpZXAgAAcEcwBBoAGqpvvvnm5MmTL730Unl5eadOnTQaTbdu3UaNGpWZmTl\+/Php06YVFRWlp6d7eHgcOnSoWbNmr7322ieffCIiQUFBn3/\+\+bffftu6deuVK1c6ODiUlZXV1NS89dZbtr4mAACA24gADAANUmZm5r333ltaWjp69OiYmJjg4OCff/5506ZNS5curW0TGRkpIq\+//vqYMWN27NhRu37RokUlJSV5eXmtW7f\+/PPPZ82a5eXl9fLLL9/5qwAAALiTGAINAA1Sq1atDh06tH379smTJwcHB4tIeXn56dOnrVuPHTt28eJF67KdnV3dEc5xcXHr1q0LDQ394YcfZs2a1b59\+8cee6ykpOSOXwEAAMCdRgAGgIaqdevWx48f//77760fVSpV7abXX389Pj7euvzqq6927dq1dtO\+ffsKCgpmzZoVFRW1fv36SZMmnTx50s3N7U5WDgAAYBMMgQaABszOzq5u7q2lVqtr53y2ys/PHzJkSHZ29vnz58eMGXPfffeNHDmydk6srKysO1EuAACATRGAAaABq6mpOXjw4BtvvCEi2dnZKSkpkZGRubm5Bw4cePbZZ\+u2HDx48ObNmx977LF33nnHuqY2/YpIenq6nR1jggAAQCNHAAaABqxPnz5VVVVNmjRxc3Pr16/fE0880bRp06ZNm7711ltOTk51W27evFlErLNA12U0Grt16xYQEPDCCy/cuboBAABsgQAMAA1YSEhISEjI1euXLFlyk0fQarXJycl/aFEAAAB3KQa8AQAAAAAUgQAMAAAAAFAEhkADAK5r2bJls2fPtnUVuNstW7bM1iUAAHBTCMAAgBsh2wAAgEaDIdAAAAAAAEUgAAMAAAAAFIEADAAAAABQBAIwAAAAAEARCMAAAAAAAEUgAAMAAAAAFIEADAAAAABQBAIwAAAAAEARCMAAAAAAAEUgAAMAAAAAFIEADAAAAABQBAIwAAAAAEARCMAAAAAAAEUgAAMAAAAAFIEADAAAAABQBLWtCwAA3Iq2D79i6xKuLWP7EluXAAAAcG30AAMAAAAAFIEADAAAAABQBAIwAAAAAEARCMAAAAAAAEUgAAMAAAAAFIEADABKpHFQu7s5X71\+3hMPrZo9qZ2v/s6XBAAAcLvxGiQAaMzu7eo/LqxXUUm5s9YxtIvfAzP//u5LE77974lnxz6wLSbhw20H6rV/97N9D/Xr\+tGr015\+d/ORkxm2KBkAAOB2oQcYABqzpk1cfjp19o2Pvk7LKthz\+JSI/POL/UuffWTZhugfEzPemPFwvfbFZcao3T\+\+uf7btyPHOajtbVEyAADA7UIPMAA0Zj/8nPrRvMeC/Jr3Dmrz6NwPRCTpbO6u2JOPPRTazlc/b9X2a\+41LDSoedMmQ0OCvj54/M7WCwAAcBsRgAGgMTOUlD\+3PGrPey\+eysh5afLQqupq6/ogv\+ZLPv720LHUa\+7VvX2rjd/Ght/bmQAMAAAaEwIwADRmTVyd3o4ct/Hb2DfXR9dd37Z50zXzHvPydNvwdWx1TU3dTcGBrfQebv/aErP1rZl3tlgAAIDbiwAMAI3W6IHBL04M\+2JvXFlF5TsvjrtYXG5dr1KJt6du7NwPFj09UiWqtTsO1t1rwrA\+X\+z9Kf9iianS3LZ504ycC7aoHQAA4I9HAAaARus/RxIPHjuTf7HkpSlDfzp19tPoI9b1Gkf1l8tmGErKX3j7s3q7aBzUD/TsMPwv74lIYnpOWJ\+OH311sP5xAQAAGiYCMAA0WiXlppJyk4g4aRyeHnX/uLBe1vUqlUrj6HDNXZb\+efT2Az8XFJWIyK7Yk1MeDCEAAwCARoMADACN3xsffd3Jr/ncf355NueiiEx9KPRMVsHVzf786AOd/VuMmb3a\+nHHgWMvThz86OBen/8n7o6WCwAAcHvwHmAAUITTGbnPjn1ARDQO6qdH359xvrBeg\+kP3xcx4t7pSz6xdhpbrfv60Bv/93Dfrv53tFYAAIDbgx5gAGjMJg27p2u7luXGyiauTg/27VJSbmypdxeRJx\+\+T0R0Ltp9P53e92PSgukj\+ge3n7bwY2sXca1Pvjns5aH7eH7Eqi9jVmzaa5NLAAAA\+KMQgAGgMfv3riOy65flv6z44ppt/tS/W2Br79EvrSq8VFpvk8ViWb5x9\+ETaV3btbytdQIAANwBBGAAULqvDhz76sCxGzQ4kHDmQMKZO1YPAADAbcIzwAAAAAAARSAAAwAAAAAUgQAMAAAAAFAEAjAAAAAAQBEIwAAAAAAARSAAAwAAAAAUgdcgAUCDlLF9ia1LAAAAaGDoAQYAAAAAKAIBGAAAAACgCARgAAAAAIAiEIABAAAAAIpAAAYAAAAAKAIBGAAAAACgCARgAAAAAIAiEIABAAAAAIpAAAYAAAAAKAIBGAAAAACgCARgAAAAAIAiEIABAAAAAIpAAAYAAAAAKAIBGAAAAACgCARgAAAAAIAiEIABoKEyFxZeb1PB\+\+9bqqosZvP5hQtrysuv2GaxZEybVn3xYu0KU0rKxY0bf\+/ZS3/4oeLYsd\+7FwAAgA0RgAGgocqeOzfr5ZfFYjnVu/f5BQuyZs9OCQ\+3bir86CNRqVR2diq1umD16it2U6nK4\+PPPf/8hQ0brCsqMzOLtm2zLqeNH5/5wgvnFyyw/pTGxFgbJPbocX7BguP\+/lJdbW1ZduRIzhtvnF\+woOD99//3a8l98828d965lT0tlpRhw4qjo0WkcM2a5AceiG/S5GTnzmenTzedOVPbqrqo6Gcfn7NPP331AZLuuy9OpbL\+nOzcOf\+9927yzIVr115vU3l8/In27S1mc1K/fqU//PA7L\+naUsLDy\+Pjb2FHc2HhyS5dqrKysufNi1OpKjMzazdV5ebG2dllz5t3C4etOH78mK/vLexodfXdK96zp/aLiNfpUkePrvsN3oApJaX0wIHrbU0dPfrChg1Zs2blLllyy9UCABoNAjAANFRtPvhA5ehYmZmpUqtbLFrUfM4cEbmwYUPFsWMqOzsRyX/3XUtVVfWlS\+cXLDClpZV89531x1JV5TFu3IX16yvPni1cs\+bC\+vXGxMTzCxbUjUYiorKzcx0wQETsHB2du3dvsWiRU6dOYmdnzcbFu3eLSiUiVefPV50//z9ey6Vdu9wGDryFHQvXrHFo0UIXHm5KScl84YXmr77aPSur/c6dIpI6blxts4ubNvnMmlXy/fcWo/Hqg7Rdv76XxdLTaGyxcGH23LnFe/bczKmz58y5cQOVWu23bl36lCkWs/n3XNM1WEym8p9/du7R4xb2zXzhBZ\+XXnLw9RURR3//2j98iEhRVJRj69b/Y2235pp3TxMQ0Mti6WWxBMXFqTSa9IiImzmUYceO3/wrQ8tlywo//th46tQtlAoAaEwIwADQIGXPmVO0ZUvLxYsdW7e2mM3nFyzIWbpURKpyc2vKyqxtNAEB1gXnXr2skdhK5ehor9M1f/VVEbmwfr1uyBCnzp2Np09XZWWJxeIdGdli0aIWixY1X7DA2t5isZjOnj09cGB1WZmIlMTEtFi0qNpg8P/8c/3TT1uqq9VeXiLys49PvY4405kz6ZMmpQwdmvLQQxc\+\+cS6MnfJklMhISc7d8544glLZaWIWEwm4\+nTzj163GT7unKXL/d\+8UURMZ4549imjVtYmJ2bm6OfX6sVK9pd7tYWkcJ16zwmTNANGVK0dev1bqlKo/EYN67JQw8V79olIpUZGclhYUmhoaf69LkYFSUiFQkJiT17ZkyblhQamj51qrmw8PTAgVVZWcbExDMPP5wYHJzUr9\+lb7\+te0xN\+/ZO3bsXffbZ9U5amZFxeuDAeJ3uzPDhprQ0EYnX6bLnzUsJDz/epk3uW29Zm5UeOuQaEiIqlcVoTJ86NV6nS7r33uLdu0XkzJ/\+dO6ZZ1LCw0907JgxbVpNRcUVxz93riQmxnPyZOvHJuHhF//979qtF6Oi3MLCrMuWyspzM2cmBgcndut24eOP612viBTv3n2yc\+ef9fqz06dbI71Kozm/cGGCp2di9\+6Xvv76et9X6iOPZL/ySvKQISc7dUqbONFSVVX37l3ztmjat28xf37ZwYMWk0lE8v72t8QePU716pU\+aZI5L09EUkePzp4372cfn9ylS/Pefrvgww9z/vrXa579ly9XrdbPnHmLowwAAI2I2tYFAABuRbMnn0x58EHHli2dg4OtPcDVRUVpEyeqVKraNk1GjGgyYkTtR8e2ba0Lak9PtwcesC5bLBZLTY3FYvllNzu7vBUr7N3drZ\+az5uncnS8tHOn24AB1jWGHTtqyssLP/xQ1OrzCxbYu7vrBg1SqdUiErBli1PnznWLzPv7313uuccrMtJiNqdPnuwxapQxJSV/9eqg\+Hg7Z\+ekvn2LvvjCc/Lk4r173QYMEJXqJtvXHr/i\+HGLyeTUrZuIuIaGWqqrz/35zx5jxmgCAhxbt3Z0cbE2M546Zefs7NiqVdNJk3L\+\+lfPiRNvdGcv38Azo0f7vPyy56RJFceOnerTx7VvX7G3r0xL00\+f3vbjj80XLhR9/nmH/ftF5OzDD7v17\+/90ksXP/00MzKyyYMP1j2e\+4gRhq\+\+qlt2XanjxjV97LF2W7fmvPlm5osvttu\+XWVnZ\+/m1j462nTmzMmgII/RozXt21\+KjtYNGyYi2a\+9plKpuqamlnz/ffrkyd2ys1V2dqa0tPbR0TUVFad69bq4cWOz6dNrj2/Yvl0XFqZycLBemkPz5vbu7hUJCU49elSeO2eprnb09bWm2ezXXqvKzQ06erQqOzsxONi1f/8rrjcvL33qVL\+NG527d0\+bMCF/5UrdkCFV2dlisXQ7d67oyy9zFi9uMnx4\+dGj1/i\+7OzKjx5tv3On2Nuf7NKlZO/eVm\+/XXv3bvxFWMzmS998c2HTpo4HD9o5O6c9\+mj2q6\+2\+fBDsbcvO3So05Ejjq1bV2ZmOvr6\+syde\+2z134RI0eeWry4zQcf3OikAIDGjgAMAA2Spn37jrGxJTExYm9v7QGuuWpwb3F0dOl//ysiLn36iMWSs2SJKTXVc\+JElUZT20ZlfVS4Tmz2ev752q5jq2ZPPXV2\+nT9zJnOPXuKSN7f/tZs\+vSyuLiSmJiakpKasjK3QYNExLVfv3oF2Ot0RVu3utx7r0tIiP9nn4mIc8\+e3c6ds2516d3blJEhIsW7dumGDr359rXKjhxx7t37l3N5eHQ8dOjcs89mzZlTfuSIbsiQ5vPnu953n4gUfvxx00mTRMTl3nsrTp405\+dbu6zrsVRWXtq589K337bbts2UlmZKS/OcNElEnLp1cw4OLvvxR21goKW6Wj9zZr0d223fbl1wGziw8vHH62116dMn5803rz6diFSeO2dMTvZ6/nkR8b3c2SsiurAwEdG0a\+d8zz3l8fGa9u2Ld\+1qt3WriBR9\+WXAF1\+o9XqPMWM8xoyp297Oycl99OjyhIQrbtGPP7r06VN3jef48Rc\+/dS3R4\+LGzd6TphQXVxsXV\+0ebP/xo2iUjn4\+npMmFC0eXOT4cNrr/dSdLRLSIhu8GARCdy7V0Qqjh9XqdUt5s8Xe3vn7t2tw\+Cv933phg61/tY5BQVVnj/v3KvXNW9ILVNaWs4bb7jed5\+di0vR1q1Np0yxc3ERkaaPP549d661TZPhw\+uN377xb4umfXuprq48e9axTZsbnx0A0IgxBBoAGip1s2bFu3e79OnzyzPAc\+eKSvXLj4iI6MLDrYOZm4wY0WTkSP/PP3cbNKjVP/5RU1EhFou1TW0PsIgUrFlT\+v33OUuWnO7f//yCBeeeffb8ggXWSaTLjx2ryssr2b9fRCw1NSLSZvXqDvv3d4qLsw6lvqaWixd7jh\+fOWvWiQ4drKNqa8rKzj799M8\+PnEqVeGaNVJTIyIlMTG6Bx64\+fa1zIWFak/PX29I06b\+UVGdDh8OLi3VduyYMny4xWiUmpoL69ad/b//s86uVHn2bO3g6loZ06bFqVRHNZrs115ruXix2wMPmPPy1B4edW\+1dd5s\+yZNrr7M4j17ToWEHHV0PObra7myQhFR6/XWUbtXq3eWuqf7ZcHdvdpgqC4qqr50ydHP73q72Ddt\+mv7oqIb3CIR8Xj00YuffSYWy8XPPqvbQWrOy0vq29d6lwree886Hrv2es35\+erL4wJ\+Pa\+7u9jbi4jY2Vm7ka/3fdm7uf2yj51d7TxqVzOlploLSOzWrbqsrO3HH1tPXTskwUGvN1\+48Msxr/oubvzbIiJqL6\+q63wXAACFoAcYABqqaoPBUlUlKtWvPcAWi6WmpjbcZs\+ZY\+12s5hMLZcurd1RGxhYnpDgHBwsItbGNcXFNZWVrd99t\+Lnn9u8/37y4MGeEyemjhvXbvt2O2dnEWn9zjs1JlPm8893iouzDng\+3qZN04iI4r17O95g/iF7e/0zz\+ifeabixInkIUM07dtf\+vZbS3V195wcUanO/t//iUjddHcz7a\+n/McfLWazy733ioidi0urlSsL1683ZWSYUlOduncPvDyvVflPP2U89ZT3rFl19227fn3TqVPrrlF7e1cbDLUfzYWFam/va38LRUVpEyd2/OEHbceOVTk5x1q1ukGR9dQ9S015eUVCgkvfviJiNhgcrec1GNR6fcl337ndf3/tLrVbSw8etPbJV1\+6JLXtr9W5/QuLRSwWBx8fp44dL/773/Y6nYOPz6/FeHm127rVqXv32jUVx4/X3Vp7lqrs7NrlenKWLLnJ7\+uaNAEBXa6a\+fmKUxcU1K35jz07AEAJ6AEGgIbqwvr11rGvdWeBdg0JcWje3Nqg4sQJaw9wxYkT1jXm/PzCtWt1gwfnLV9unSvLqXNnlZ1djcnk0quXU9eu1qM1nTz5zKhR7b78UuPvb93RpW9ftwcesNPpTCkpjr6\+FpPJsU2bFosW1a2n9ODBuqFRRFLHji3Zt09EnLp0UXt42DdpYkxMdOnTR1SqquzsS998U2MyXfr2W\+v455tsX/f46mbNajs8LVVV6Y8/bkpOFhGpqbnwySdqDw9t\+/YXPvnEY/To2l2ce/c25\+f/5mzAGn9/x9atL27aJCLlR49WnDjh1r9/3QZ2Wq2luto6pNZOo9EGBopIwfvvS3V1vTmfzQUF1vBsvnDh/OV5xawcW7fWBAQUbd4sInnLl59//XXr\+gvr14uI6cyZ8iNHXEJDL\+3aZX0AWEQ8Ro2yvkCo9IcfUh580PrHiKItW2oqKmoqKgxbt7ree2\+9W2S\+sk9YRDwefTT7lVc8J0you9Jz/Pi8lSutfxDJevnl2t8Zqybh4aX//W9lerrFbM546inD5VHf9dz4\+7r67l1za/1qR426sGGDddhC4dq1tbfiiqNVVt7M2c35\+Q7e3iKS9/bblenpN3N2AEAjQwAGgIaq4P33deHhImLv7l525MiFjRvdR41yHTCgdrKrunKXLj07fbpLSIhuyBCP8eOrDYbzCxbkLF7c5oMPHFq2VOv1vm\+/bW1pSktTabXa9u0L16\+3VFVdcRSLpXjPnibDhxd88EHtA6im5OSyw4dFJHXMmLp9hiLSYuHCgg8/PPPwwye7dnUfNcqpa1fvyMic118/PXDguRdeaPnGGwWrV19Yt67J5UhzM\+3rvqPIpXfvsp9\+\+mW5b1/vF144\+\+yz8TrdcT\+/kn37Onz3XY3RaNi61X3UqLpVeYwbV7hmzW/e3nZffVX4wQen\+vRJ6tu31cqV9lcOPLZzc9MNHpyg11uqq517907s0SM5LEzbrp1T165pY8fWbVn7FG71xYs5b7xR7ywBW7bkv/denINDwZo1vn/7m3WltkOH5EGDksPCWr75pkPz5sW7dze5/IbnlosXVxsM8a6uyUOGtFm92jq7lftDD50ZMSIxONi5d\+96F\+vSq1f55Vv06x145JGq3Nx6k4G1WLTIztExsVevlGHDzAUF9eYzU3t7\+61fnzJixFEHh5rSUutzy1e78fd19d0rP3r0msepy/2RRzwnTEjq2/dY69aV5855/\+Uv9Rq4DR6c\+/e/Z0RE3PjsppQUUamsDwDnvfNO5eWnhQEAiqK6WFxm6xoAAL9KSz7V67emCBKRkr17M2fNCkpIuLBhg\+HLLwO2bbMYjaljx/pv2mTn5naqT59Ohw\+fGTnSOkdUeVxc248\+qjuItyonJ3nw4KbTpvn8v/9Xsm9f/r/\+FbB5s4gkdu/u2rdvq3feUTk4ZM2da9i\+Peinn\+zc3Kpyck4PGKAbMqT86FHn3r2du3WzTjWcNmGCqFRNH3usyUMP3bZbciMn2rVrt3279sq0dlc58/DDno8\+an3aNn3KFL\+NG2/cPsHdPej4ccebHkqdOmqU\+yOP1BvCXavy7Nmkvn27nj1r7StWsry//92YlGSdBTpn8WKPRx7Rdup0u08aFxfnH3jbzwIAuHlK/98hADRQrvfdF/DllyJStHmz9d/0Kq223c6dYrEca9nSpU8fsbOrqaxssWCB2NmdGTGi3iOsDs2bt//mG\+tLVh1btaodJNzmgw9cQkKsy75vveUze7adm5u1fRfr6OIr\+UdF3c6r/G3es2blrVjR5sMPbVvG9ZiSkysSEjy2bBERS2VlbUfuHePYpo1r//5FUVGeU6bc4VPfVSxmc8GqVe2\+\+sr60bFlS22HDrYtCQBgE/QAA8Dd5SZ7gPELiyU5LMzn//0/3R3Plr/JYjafvv/\+VsuXW6e2ukl/bA\+wiJgLC08PGBC4a5eDr\+/Nl9HIZM2apW7a1OeVV\+7weekBBoC7DQEYAO4uBGCg0SAAA8DdhkmwAAAAAACKQAAGAAAAACgCARgAAAAAoAgEYABQkJTw8PL4\+P/pEBZLyrBhxdHRImKprDz37LPH/fziXVxO339/7rJl1iZV2dkZ06ad6NAhvkmTlKFDC/75T\+v6pPvui1OprD8Jnp7pkyZVZWfXO3zdNic7d85/772brKtw7drrbSqPjz/Rvr3FbE7q16/0hx9\+9yUDAIDGggAMAEphMZnKf/7ZuUeP/\+UghWvWOLRoYZ1yOW38\+PKEhIAtW7plZjaNiMh7\+\+3ct94SkazZsy01Ne2/\+aZ7To7PnDnZ8\+YZtm\+37t52/fpeFksvi6VLSoq2Y8f0a72bx9qmp9HYYuHC7Llzi/fsuZnCsufMuXEDlVrtt25d\+pQpFrP5910zAABoLAjAANBQFe/efbJz55/1\+rPTp1vM5pqKiszIyOTBg1PCw8\+/9ppUV1ckJCT27JkxbVpSaKiIlB465BoSIipVZUbG6YED43W6M8OHm9LSRCR/5cqUoUNThg49\+9RT5rw8EUnw8MhdujTe1bWmtLTuSXOXL/d\+8UURKTt0qPTQocBdu5x79rT39Gz2xBOBu3c7de4sIqbU1CbDh2sCAuycnd0GDeoUF3f1\+2/VTZt6Tp5cEhNzvatTaTQe48Y1eeih4l27RKQyIyM5LCwpNPRUnz4Xo6JEpO7VpU\+dai4sPD1wYFVWljEx8czDDycGByf163fp22/rHlPTvr1T9\+5Fn332R9x\+AADQ8BCAAaBBMuflpU\+d2uof/\+icmGhKS8tfufLSV19Vnj0b\+J//tI\+OVqnVpbGxYm9fmZbmEhra8dAhEbkUHa0bNkxEUseN83jkkW5nz2o7d8588UVzfn7OG2\+0\+\+ab9rt3NxkxomjzZhERe/uq3NzueXl2rq61J604ftxiMjl16yYixf/5T5Pw8LpbnXr0aDJ8uIg0nTIle968os8\+Kz14UKqrNQEBKo2mXv2mlJScxYudg4N/4zpVKut/z4we3ezJJzvGxrb96KOMadMqz52re3Wt3n5b5ejYYf9\+B1/frLlz3fr3D4qP93rmmczIyHrHcx8xwvDVV7//fgMAgMZAbesCAAC34lJ0tEtIiG7wYBEJ3LtXRIqjo8uPHi3assVj1KjmCxaINa9WV\+tnzrTuUrxrV7utWyvPnTMmJ3s9/7yI\+L71lohUX7xYU1lZsGpVs8cfdx81qvYUTadMsXNxqXvSsiNHnHv3ti6bzp51aN78mrXpn33W3t29YPXqipMnLVVV\+mefbTF/vsrRUUQypk3LmDbtl\+NHRLS/soe2Lktl5aWdOy99\+227bdtMaWmmtDTPSZNExKlbN\+fg4LIff9QGBta9ulrtLg\+3dhs4sPLxx\+ttdenTJ\+fNN693UgAA0LjRAwwADZI5P1/t7l53jS48vPWqVRc2bPjZ1zdn0aKakhIRsW/SxLq1uqio\+tIlRz8/c16e2sOj7o72np6d/vvfip9/Pt6\+ffrUqZXnzv2y/vK\+v560sFDt6WldVnt6VuXnX688z8mTA7/7rnt\+fsDWrRf//e\+85cut62ufAXbq2tU5OFjt5XX1vhnTpsWpVEc1muzXXmu5eLHbAw/Uq1ndrFn1xYvXrFBEivfsORUSctTR8Zivr6Wmpt5WtV5vHeMNAAAUiAAMAA2S2sur\+tIl63JVdrYxMVFEmjz0ULvt2zsfP1783Xd5//hH3fYl333ndv/9IqL29q42GKwra8rLyw4dEhFtUFCbNWu6nTunbto048knb6YA13vvvbRjR3VRUe2a8h9/zH3zTYvJVPD\+\+7Ur3QYO9HruufJjx\+rt7rt8\+flFi6qLi68\+cm1I7nzypNef/1yvZrHmcG/va1ZVXVSUNnGi3/r1PSsru50/fzMXAgAAlIMADAANUpPw8NL//rcyPd1iNmc89ZRh\+/b8FSvOL1woIupmzZw6dbLX6eq2v7Rrl/UBYMfWrTUBAdYHffOWLz//\+utlsbEpw4aJiMrBwSUkpN6OdambNatNvE1GjrRv0iR56NCyI0eqDYaLGzcmP/igpaZGpdEYtmzJXbbMUlkpIlW5uUWffWYdql2XbuhQ5549cxYvvpmL1fj7O7ZufXHTJhEpP3q04sQJt/796zaw02ot1dVSXV159qydRqMNDBSRgvffl\+rqenM\+mwsKrheeAQBAo0cABoAGSe3t7bd\+fcqIEUcdHGpKS72ef75pRETV\+fNpjz6a1LevMSVF//TTddsX795dOxVzwJYt\+e\+9F\+fgULBmje/f/uYSEuI2cGDaxInJDzyQ89e/trx\+KHXp3bvsp5\+syyoHhw4xMdrAwKR7703w8Dj7zDM\+f/lL83nzRKTN\+\+8bExNP9e591Nk5dfToZk8/3eypp64\+Wqu3385fubIqK\+tmrrfdV18VfvDBqT59kvr2bbVypf2Vo7jt3Nx0gwcn6PWW6mrn3r0Te/RIDgvTtmvn1LVr2tixdVuW/fijS58\+N3NGAADQ\+KguFpfZugYAwK/Skk/16tXL1lVc14l27dpt367t3NnWhdyiMw8/7Pnoo56TJ9u6EChCXFycf2AnW1cBAPgVPcAAgN/Be9asvBUrbF3FLTIlJ1ckJHiMH2/rQgAAgG0QgAEAv4N\+xgxTampxdLStC/ndLGZzekSE/6ZNKjWvAAQAQKH4RwAA4PdQqQL37bN1EbdCpVZ3PHTI1lUAAABbogcYAAAAAKAIBGAAAAAAgCIQgAEAAAAAikAABgAAAAAoAgEYAAAAAKAIBGAAAAAAgCIQgAEAAAAAikAABgAAAAAoAgEYAAAAAKAIBGAAAAAAgCIQgAEAAAAAikAABgAAAAAoAgEYAAAAAKAIBGAAAAAAgCIQgAEAAAAAikAABgAAAAAoAgEYAAAAAKAIBGAAAAAAgCIQgAEAAAAAikAABgAAAAAoAgEYAAAAAKAIBGAAAAAAgCIQgAEAAAAAiqC2dQEAgPri4uJsXQIAAEAjpLpYXGbrGgAAAAAAuO0YAg0AAAAAUAQCMAAAAABAEQjAAAAAAABFIAADAAAAABSBAAwAAAAAUAQCMAAAAABAEQjAAAAAAABFIAADAAAAABSBAAwAAAAAUAQCMAAAAABAEQjAAAAAAABFIAADAAAAABSBAAwAAAAAUAQCMAAAAABAEQjAAAAAAABFIAADAAAAABSBAAwAAAAAUAQCMAAAAABAEQjAAAAAAABFIAADAAAAABSBAAwAAAAAUAQCMAAAAABAEf4/36wyf4RorPgAAAAASUVORK5CYII=)

*圖 4\-1 登入頁*

### 4\.1\.1 畫面元素

__畫面元素__

__定位（id / name）__

__型態__

__預設值 / 初始狀態__

__說明__

標題列

\.topbar

文字

new\-pay Portal

登入頁的標題列沒有導覽連結

區塊標題

h3

文字

登入

帳號

\#username / name=username

文字輸入

空，頁面載入後自動取得焦點

<form method="post" action="/doLogin"> 內

密碼

name=password（無 id）

密碼輸入

空

以 name 識別

登入

button\[type=submit\]

按鈕

文字 登入

送出表單；在輸入框按 Enter 等同按鈕

錯誤訊息

p\.note（第一個，th:if="$\{err\}"）

紅字

不存在

只有登入失敗後重新渲染時才出現在 DOM 中

測試帳號提示

p\.note（最後一個）

紅字

測試帳號: sa/sa \(SA Portal\), cp/cp \(Merchant Portal\), csr/csr \(CSR Portal\)

固定顯示

### 4\.1\.2 操作流程

1. 使用者開啟 /login（或因未登入被導向此頁）。
2. 輸入帳號、密碼，按「登入」或 Enter；瀏覽器以表單 POST 到 /doLogin。
3. 成功：302 導向 /，顯示首頁。
4. 失敗：/doLogin 直接回登入頁的 HTML（HTTP 200，網址列停在 /doLogin），在登入按鈕下方顯示紅字「帳號或密碼錯誤」，帳號與密碼欄位為空。

### 4\.1\.3 需求條文

__編號__

__需求描述__

P\-LGN\-01

本版次帳號由 Portal 管理，固定為三組：sa/sa、cp/cp、csr/csr。帳號與密碼皆大小寫敏感、完全相符才算成功（SA、sa  皆失敗）。

P\-LGN\-02

登入成功後建立 session（loginUser、role 皆為帳號），回應 302 導向 /。

P\-LGN\-03

登入失敗（帳號不存在、密碼不符、任一欄為空）時，回應為登入頁內容（HTTP 200，URL 為 /doLogin），顯示紅字訊息 帳號或密碼錯誤，不建立 session。

P\-LGN\-04

登入失敗後帳號、密碼欄位不回填（頁面重新渲染，欄位為空）；錯誤訊息位於登入按鈕之下、測試帳號提示之上。

P\-LGN\-05

登入頁載入後游標自動停在帳號欄位。

P\-LGN\-06

已登入狀態下仍可開啟 /login 並再次登入；再次登入成功會以新帳號覆蓋同一個 session 的 loginUser / role（不換 session id）。

P\-LGN\-07

表單缺少 username 或 password 參數（非一般操作，需直接送 POST）時回 HTTP 400。以 GET 開啟 /doLogin 回 HTTP 405。

P\-LGN\-08

本版次不提供登入失敗次數限制、帳號鎖定與驗證碼。

P\-LGN\-09

登出：GET /logout → session 失效 → 302 到 /login。登出後的登入頁不顯示錯誤訊息。

## 4\.2 首頁功能選單（index）

路徑：GET /。登入後的入口頁，列出三個 Portal 的功能連結。

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABQAAAAIDCAIAAADUtSSAAADCIElEQVR4nOz9f3gT550v/H9Gv2bkH2JIY5hQbxDxnlghaZAbzjJpm7Vor4LSXYiScoK69BQlm82K5yxb5VzsoiznoVq\+h43Y5fpG2XS/qDkpEfuUU5FDEwV2E0GfFLlJm6FLimCDI9M1EalDBKbxWLKtGWmk\+f5hG//AJjYhTYPeryu9Llu65557ZoDqrc899zALVz9OAAAAAAAAANc7wyc9AAAAAAAAAIDfBgRgAAAAAAAAqAkIwAAAAAAAAFATEIABAAAAAACgJiAAAwAAAAAAQE1AAAYAAAAAAICagAAMAAAAAAAANQEBGODjxZp09pMeAwAAAAAAEAIwzIC\+\+Gat2TTuBVO1yTRt62uLbSxvWK62cdekM32xOPD0lzTbbLZpulndsERrutpdsk3qM4/lN99SJSKi6qp1fV3/d9\+rfyW/\+lfyq3/V929/98GepZXx8Zjlqk2cPoOOP4FjISJbU\+nhpWVxibLm5ur415tvUR6\+fcKBEKet\+5IiNs6u/yuM0Naktc0df2Z027X5U3EVqm2t5bbGqS\+TjauyE36d9uuPGV/rmTFVbdf2b\+VVXcFJmhaU25uu3TFeK6bKKlFZMXeqgZmqbTdXxv8JZE3VWf0tmzl2\+j8bxFXabq781v6ZBQAAqCn4P9iPpn7R9r//ZtvRmPeff50fe5Vr37Bh57yfef/uF93la7Qjc0P7I77tnz258YmfHh\+c4Sb8qg0Pba7/2aM7f9H5EYbBNmoPry2I5\+rX72O7NSKqrlid39poXb93\+FciqrbfO7D5jkuf\+3Xb3GqTZuguMBM6KhsOH2jYcWa237nozUsGn2mtboxZJWXqBm3L83uWV3sn7Y50W6PefXjO\+teN6uhLtrmVFrN\+2VY626irxxrvP2DO02S2BeqaVvbwKVOvNsuBExGR2mve213c\+fUhKdpwuEBEzPEjjSNDMlXXrcu3TzqWFYWtVOcdHUnLksLTTsvGsVM9bmC/3WOxNZU23EEdH5TWLDHuV0rtZw1N9yi2N4YvqN60sLSq0bj/1NipZq3airtLHV2sVGCIqqvW9e\+8hXqU0WtUZjpfb9h0bKz98IE0TTtCvbml\+PRyfe\+exl3nGCJqumVoz2o98v3hs3oN2Bq1tgU6S8OnlMl/YJJ6GSJ98dKhQKueLzIqERWNh1/nJK60ebXasdd2/PJdmyqr1uXX9TYMX0G2SXnmEaV7n23LFH/sZ3GtZ0AXv1rYuYBdv4fr1vSW25WHW8e\+oehOW/eeMYydak7bvG6w6VjDlhOTzv8Es7qCtqayeMNYnrQ1VlsWaC0Lyu0t1d43bPe/YO69imP6\+JiqoqiqF9jDfZPfYa2VNasH2s7VP3rA0qMRmSpr1uVXddvG/zMyK7YFys4HlBYrEelNjXQwNmd349DmG9jdRWX7PbTr2Yb9fcwUW80rbV2r7Y42HrxGf7wBAADgkus5ANtuXRn/h/bFl34vFbu7OvfGX937ljzDjzLsvEWr2kzST37Vc61y7NVq\+vzKrW0Du5/4\+UzTLxGV5cPxZPt3/nir\+9frD75/dZ/eiEgtmHfssz6zfnDrUtOjktHWWtzcatj9rGXcx3RDxyu2jldGfmEbSzv9Q/kDti1d12B\+gVqwbPt\+Az2orFjAStOH5550g/eFSZGvuurBwpoJEb1ia6w208CLrUz\+HLf7A6b7WMP6A\+Y86W335reaR7czVR5eO7BuwUi2ZLlqs1Xb81jx0gnMn\+O27OM6Z5pSDIdfbtjWqnfO8INsmcZdKd12Q5WKTH7Cvj6ZY1E1vWXpUEu3kTQjlcnWoqybx0T6Rq/IFH9BJn/9Ib3S8OjkxFtdce/gmkamV2OIiLVqbbdoLdbK9rXl7uLI5qy1yp5j91yo3L\+A6eyrti8fbD5n2fuGqeXukq23fqZndQrVNevl7S1MT4Fsc6v512xbCsWdd5PUbcyT3nRzqeXdxvtfMOeJ6TxW/\+gxIqq2r84/fYcuSdX2e4riPL15Xf8aIiLKn7VuemE0tVqrbY2G40eMeSIyVVZ9bUi8gZq/nn91tOWWF9ixs/3h13rGGrU1d2jN8ypbRdNGydDSWmo\+1/CoZFRJF\+/NB1qr\+y8FYK7y8LrCukbLpjNGldM2rB1cM298IZTpfqNh0\+vGPNHMruDIyWy7Z\+BpJ3VfMOSLjKox\+aKht9d0\+DXL/sPG4\+8aZ5d\+TZVVXx0MLNWabTpbZrq7LXuP1F0K8Lam0rrlxTWtWouN1Lyh813L3pfr9vcyxJV3PpZfc8O4foqG411c5GWuo4\+xLVC2flWjAqMSEenNC8ptn62qqwu2dy8djt7UyPzsVYv2uRLbZ1TnqYHV5eNp62GttGaBQfqx4aP8\+7l7n0XqNbBNyjNrNanX0NNnoa/lnymyO/bWSVatTTMfLxCR3nK72k7mvcPfImlE5dHzz1XWLC33nmI7porKAAAAMFvXcwAmIhro2/\+PuzYdHSAz13LH4nWrv7J5U6O65Qd735vJx0xT061fDLj7Nr3\+SQdg802rVt1KbyUOvjO7T8fqhV/tfrVvj/sPxNde6pBnt0\+2sbx5tdJUNOSJiPSec8Ym50DcyeRJV/sMi\+8Z2k7EmnQbmXYf4MbVZqvil4ptH3CPdl9l\+mXnlrauHZpi4uXX\+183EWnDH2Gpt6tu0wFLz\+ibzc6BF1umqgCfG/55OKLrbcsLWxutI0FxeYnMNAXNuHvvnN2jv7UszT9zO/voVdbliIhIMe0/MTaqtuX5l\+9mRkY4V\+88RURkW6BsXa5RkWw3V1pI2WpVWSv1HOO6F\+j5s8aJwf6TORa1z7LrDXWrs8oWiUhvmqd3vtZ4eQGNiMhUWffA4KpGvWVuxba6sEKxbPuRhczVlqXF7Tcz6vAfG82062XuuGI4/ErjYSIiYpvUnT6VFEa1VcXWcv5I/Y7Xxr5kaWoqd2hGOkVEDJUN6gL14ZuZ7u7yhgcu/c3Um28u207YvEdmXqljOo80rn/N0L62fwMREfWe5Xa8YOkhXVxd2TrWrNp\+78CGBXrzAjr4fF13y\+Ceu6vqBXZbtEFqVJ5ZX\+w5Ze4ZHaetqdRcMB1uHXx6HrffVNx6h57vrtsYs3Y2KnseKfaeMndrs7rWM6S3LR0SC3WPvlzdsHpgc1\+jNE07ltMeXlt4uNGyZU/d4QIRmXbtmbPr8nazuIJjJ7P7WL13qnkHs8NpG3z5zS3UmWYjXeZeqi6\+Rd3g6xdftm2UjNRY2v5Iob3I7nqh/vC7THNr6eGvDu306flow\+EykcZ0/8R2/yumPBGZquLt6sNfG3p6LeN9lus8x23aM7yDavu9hZ2NTL5IzZ8ttyvGyMvW/e\+O5ltTtc1i6R2ZWMH0FvT2FUpTwdQkDm2/dA6tmrjAuCPaMMPabHPr0M57qwf3NnQsLNnOcVKBVDLvTpuaG0351oH48srxH9k2nTCqpDe3Kmu0CdMoRvZorrQvVXveZTum/OsGAAAAszTrAMwu\+kL8O8u6f3K66Y5FzfMa2Qtndj370t7TCpGpZdlXtn7rD8RmKw30SoeSW374K9uqR/Z85f2NW16SZGpatvblv7m1\+/\+3a/2hi6r5xoe/82fr3tvv3fWrseIAv2j7dm9b18nuRXeuuKWR\+t7d/\+z\+ba9fVInYz94W\+NZXVt2xoNlS7H7rl5FnXz0o37T1f35zxTv77//Ht3uJhmcdP33r6Uf/x79KU9ZIy0r38V/ukLm2//mVFa38/vcuEr9o3SN/tGHZgiZLuffMO/vjichRmRb9Yfw7d/X\+sq9l2e9VM7n5SxfZiOL/e/He0K4tpxvXfGvlw8sWLZ5LvWd\+tfuf/2X38ZlWkkdOHb/o4UdWrmm7qcWidb/zzuEDycjrF1Xi2lb\+0ebVt7Y1N1Lfu4d/dGhb8p3eiXnbtujOVc1KR/ydXiIi0\+Ivrdz89cXiLXOp75x09Be7fvhLSdamOEXvKURa99GTnavb19zBd7wuz\+pCqwXztr3jQpWpsm5dflW3bePr031Gr654oH/7AlPHOVNHX2Xd6kuXQW9pLedfnrPxxIyqKGqfZUvUMrzHh9cNiF0Nm6SRetqGR/JrCtaN\+9jLK5ZXrgCzXEVcWGVJb15QtZm09lZdJbI16uzIW5W2G3T6YCw/s43lresGxUa6vGqqnuO2/Gj85/4rGqmwVW2Nes/hOd7XmemmQOfPcZv2EpHedm\+libhtr5jzw7X0BbrNVNw6jyHSm\+dRx4H6vR9UP5Fjabq5tGKeoafPoBarLWSWzum0QNm6Xls8T2dJZxurzVR5sdXQ\+VrDpmN687xK/hTXeUO5s8uwYmnFZiYqGzqPWbdMWT80VcWlQ5vvqXQfsW0yDW1vtWx7jVm1fPBFsXjwx/WRY6ZeorxGtkbKF4jlqlSk9uUKpRs2vjL\+iuvtq/MbZnZZLrEt0NpbmbZGog/GBtPWorXPrdKFS\+fQ0H3G2HSPokq2yDlt859WpH02qXVg8\+ri8bnFpu6GTafG4tOKu8vsmfreuYOLFxQ3z9P3x2zqPQNP\+yrdjWWSGradMqhE6oyv9e5zM6r4sU1qQNQ7XmAPdzHdxXJTH2O7vdr21fzL94xMic\+/MTK8VV8fWEPWR6MWdmnhxYWW6Yv/s7yCxBDpLUsHXmy9fMC6ba7e\+2Ob94hpBtlYX\+wc2tDCHPzBcCYkIqJj7P4zg4EFlWaTsXduebHVcHBf3a4zBiLqPmY93m1c1Uq9l39BqRmkE9Zec/nF1ao4l\+3sZYjI1lQKrB5qJ3bLs6b2tUPqj\+uPL1A2rJcffte64wB3uI8hjchatRGTJ7KZKD9PeXiBKfJs4/5xyZOdqz6zbhZfiHYfa9jUmH/a17/qA8uOPZZeIiLm\+Ot1nf78zoXslmjj/pGrzNA0X0upRFddfwYAAIDLXVUFuL5pxR2nN\+6MdvTxazb92dZvfV7625/nW1c\+/Zd35g\+95P27c\+wdX9z8rTU7\+579i9O/zq/\+vba5Jkk2tdzRRH1a0\+cWNP3kYu/cBeI8rTPZO2FqXJmIGhcvW3R81w\+\+cpravv5H2x/54853frD3Ar/qW551c09u\+h8/6K6/dcOfrty\+oa/7b3958LXeNe472\+b96vAFjfibVtzR0HO0s3PG98eueGTN5lvf3/F38cMX5q56xBPY8MfdPfGDpJGZb2t\+d8ff7pIuKE2rfXuWvfPoX/\+rNGha/IB36zLa9VT00QsNK77l2fztP\+7dEt8vz/yscYtXr3x4Ud\+OJ\+IdPda2L6/c\+i139zvxw3O/sv1bt/TE4187qrS4V27/1prNF3ZtOjowbkNTU\+vvNZfO7epRiIidt3jDt\+5kX0/c/7e/zs\+7NbBh5dav93r/ubBiilP0884yqRd\+LV0wrflcU9Pr8lXdhjd6f6\+p2nKDnl\+Qf3Gkekk9b9VvemX8rX2Mqhm6T9VtmVSCM1XWrauI2iw/w5mqqx7IB\+aaN50azduace8B6\+J1g3seqW7aa\+2YWH5pXlr4Nyf1FsZn7LEKMNtYWbykuG6BcfeP63ZYyxseVNQT3HGOSCEyV1d8qdimsJFxwV4tmLdE\+eGfP1IFWBmusFVXPVhYNzqqcRVgorKhY/jWZVN1hVhsn0dEpk4qbX6gpF4wH29UWs7VbXnN0KQZOxuLT881HL/AsHM/mWPpfZfday3vuZd2fL/\+cLm8/ZEh9ljjppFZ7nrblwpbbxguRxOZpurdXF08Wj8kIuoz733N0m3S1qwYWnd7hd617ni2vqOPaRGJJab3XXbL9y27blE3r86/uKTu0T1cd9HQU6jaSFcVA81TVzWaJW3w5b8wSucY24Jyy7sN9x\+4ZpNZmloVkbiIZMoTsXNL29cOtTXqrEbNYuFVUc8fs91/zEwXuHX\+oTUF9tE946Yh3D602VnpPUcqMflz1o17Tb2a3jbXtOY\+tb1s3D86qXvm13pGwzVV1n19qP0G6lmdf5VILZgj\+0ykGY7/eNwU6OGWmmH/Xn4/UVPr4J7llc4DpsWr\+3e2XLYOU9nQ8a/cFH9bp7qC4/LzdBXg6pp1/esmvzjdsehtt2vse9bdXeP/DWE6jzU8SkREbMHUU1ZWLFcP93HD84HzfZa9w/XuKVdEMxERo2rU0loMLFfaGo0dhxvvP2HMc\+V2IioaDx5pOPhGZdXywa1/obY/b9vWxfT2GZoadSImr\+ntX9J63zKt8fet6rb0UEVsod1R2/4ZHsu48XefNfVShdUqGx6RA6Ov9l4wd99cbl9QPXzu6sr\+AAAAcJWu6lNjqXj81aPSBY1I7uzqo680NddzdM\+tzRd\+uf5HJ48PEr33auSWW56\+5z/Ne/PM8cHFbYsa2B5r2yI6/trpptbfa7Z0qp9d1EK9u98ZuKzrcu9bP9119Nc9Zeo98Ms1y0aqtQd3/a/jloHuCwrRL3cl72z/\+i0tc39x\+PhwbbOh4ycy27xYrO89LL1/pU8S9Tet\+voXF5d/va1Lpnl3rrmDO/6jV/cev6jSxd3/fHTF//ziqlb\+0DtEpHW/9vODpy\+qxI1bC1TrPLT//qNaz3sDKtH\+H51c853FbfO42QRgk41vtFFv/sJArywffiF2\+AUiIrrw6qN/fVS9cLG3TN0Hfta\+zNvWOtd2dGDcgZiam\+ey8ume4Wxf39BUb6I\+uUceyMu/3PTYL4cbTXmKOi9oVC50X9Bsn22ymX81RZ1kBmw36L2vNT4qjf9Iqi8WC5d/dFZJX7w8//LSy6cik3Rs5jvUmxaUH/7q4KpGy47XDeLt2nHJ1EtEjeXNq1X1SMP\+JQNP/2l14/frRzMw03uW7Xi32D53Uq1GX3y7urjAqERqr2X3j2nxI0OLydrZVGw6Z934Mkv3lFYtKW42GdU\+UydV22/XOiVzL1VX3DsQGLeg1\+X3zVKZ6ZQaNklXtShOmTn\+et2us8bOM8Ze0hcvHdy\+vCiere9QmLy50tYyut8y03nBbCPj7sNmumNgHdVt6zbvOmA6rhF9csfS023d3Vd4eGlZpaJYYDd2G8hUEW\+mzg9d2KxMVDZ0p61bJu\+I6TnLbTliUluHtq9Xtpp1trHabBodYZnplGzetLFHI3bcP1S9XfX3H6P21fm2c3VbjhgWf6mw9Qa6Ovlzpo4uAzlJJCKippbizkeY/AfG7qL28NeK\+R9ZpT7LpqiFuPJ2f36VZpGo2tOtr3mw/\+E7Kj1pbm9jaeuf5kWJ23/K3NOo7lxdUj8Y\+QqGteptzqE196iiyXjwJ3XdVFnx1f5/\+5rh\+Ft1W16wzPRazwBrrdLZOu9eS9O9hTXvDofe6goi24LyitaKStQyT2cvjLW3NSk7H1TpROO2E0b23YbjLxu6FYaouurB/LrexkePGNi5VVtZXzNpN9NewWtLb26kfK\+xZ5pZCWqfZcvzdVvvLe75myE1bzzexR48xu4/M/XUEnZuKXBPmc7VHy8weavx8GHbtt7qww8OvLhCJ9Kb51XVdXK7xhCR\+oF5W7RB6jOoNHY7tFo07vr\+HHWu\+kyLvv\+V\+oNU2rl\+hhM/xquK4tD2r5XybzSuf2XySmDNtw8\+/UB/vLVu2484SaH8B0a6e/DFvyIiIlO15QZ9q78cGL4Tu2jaVZz9zgEAAGAqV1c2UXplZeQzR1lTzSbW3GCb12C7pf3F/z1uUdvzNzWXT0o9tKG1ydbV2FY/IP3ynbY7Pr94Hqd\+7iab3Hm8r2HNdzbu/LyViKjnZ95QJ5HWe6GQLxMRqYOFfMnU3GwlMtmab93g/eKK1rk2CxERDXSyRGrP6YPvtAfuuaX5tc6mZYtsF04efO\+yDygNc9f8zd\+MfZgbOLP7HxP739PYO5qazMrxnsLIXNDB3p5BU0uzlX2HiJTeC4XLP1Gx9U0rvvGVdW03NzcMv9DXaZnVSRs4nvxZR\+vKp5\+8\+fjx04el09Jb73TKGlka2tx/vOGeRYvnjsw37jw6cTszZ\+NJHRw54WpP5\+6f3Ln9W/5X7/nVYamz460z0mk5P80pIiIiLT\+osZ9ttFmmXKloJqriyHTKS3SW09l3L2tYZjqPNK6fogI80DbzkmOjtuFepelUg/eYOT\+vuOdBpe1Uw\+ECNd\+stjfR7rPm3ek5HTfTuNWPdNsN5baWqq2obXhEvmwSrLLqrfpNr5hanEpbY6V5Xf8qs0756tYHaHeBVMXQdLPWK1mlucqG2yt7j5l7NcPhV2yHXyEiYrnyZt\+A2N2wxaSsGI4WpmrbAr373Y9UsWGbyg\+LAy0X2MOKtmIBc/BHDZJCRIx0xPa1I5PaWoj0NiKWo953Ld2jx9v2SRzL6FRqnb05v8fK9PRVn/Zre1\+2tKwornmtYe8VN3x4tW5rqTTfMLjHSb0Xhveo26xMx\+G6/SeMRHobV6Uz9RNXrtbbV\+c3WJleZbpCqN58\+9D2uYxtQcV2\+R/Fq5I/Z\+pp1PLHrLvMxT3LSR35Q6uLdw\+tmkdqtznyY33z2qHFZ9kdP6L2FsPePXV7W9Q1S0rtF0y7zrBbvm9aLA6uIyLSyVoWW/TOw7YtXQbx6/lVZxu9T9S13Kwtthp7NCY/02v94dSCSepTdvqLTXOrttb8y6Lh\+Ov1HSZirdrD91alI9xxqX7HyDkn2wJl57oh0UrHPzCoxOT7Ji9PNfLixBr\+h1zB3pEb2q80BfrcTA/nw9YAY3q6rI92WW2NWvsSdd09Q9v/89DWC\+ymZxsOFolMesuX\+09\+eVxv77E7fsR2akTnLAeJqLHSZGV2Pztn72VTmlnFMM2udWosr7l3UKRKWyMdn\+lxjGzbtrzwzHL98AHbXtPQy9sG1MJo/Zx0W6PeeWDO\+u9a1ogV1kykMMdfb/za6yNv2xYU9zxY2f39md5pDAAAADN3VQF46hyl5f/9X7x/\+/OJT9wxLX6rj73nlsWLGprL7x9/532SOfHWm2hRY2/Xr3uGBnp2PXs/byIiGuzrHGpaRXT5cxEt8xZv/cuV4oWfb9nyZsc7ctOXvxn/xvAw5I7Xfr3hW3eKiwotdzR2/\+RX3ZfPfx4oSof\+dXdXkUjL9/V1vnNxOF2zZJr2AYzlqSbrmm9cs8Eb\+Ow7kX/cdfCt9/Of/cKe7yyb/gRNLX/654/\+t180LfpPK\+65c80j39xcOrnxfxzq/dKa7W7r4X/\+wabX3umm39u6/ZttV\+6lLB/\+frQjfmNb262rvtK\+c/0fde6J/cXrc6c\+RdeGQRqZTnnJcAX4soZmffHdU1eAO6ZbludyBfO274/ee3zBcljJr7u90nGMEZ1lOlN/uJchMkpnRhubKiu\+Orh1qd4R4yMXyjsfKao/tm08xqxY1x8oNnhfMDWNVKoZ6YjtS0f0xWJh\+83co89beklvW15SL5gPWytiwdhtot5zxvGP3mEby4F1hTUm66Mvs5036CtWK\+3dlpavDWyYZ9kUrf8oj95Rz3EbX7FsWFfY4GD2x\+ZEzhhUInZueZ1YarGSrVFrNhm7\+xhVM0hvcAd7ieX05gVak8k0\+gH9kzmWS1OpW5YUdrayG58fmfpre7nyzANDq97Vp72DsWDe/QrXtq7S8oa1e2mRpLpdF6qrRK33BCuN7lrVqHlyfNLZRr3n8Ohv5rF/GViOqEBETM\+pj1gB1hcvL7y4dHgV6OFhGLsLZfEGvbmxQh\+MLG1lu1nZLNJhybx4LqnnLLuPaesWVMSlWvsChiWtlyh/yrp3\+JbUc4bmkZ4ZKhrVRnXFioEVK3Tb3KrtluF570z3Gw2pueWHZ3qtZ4LpPNbgPaa3P1BY02vde9Z4/F2m7Wbq7WYPLyi2FExSQdu6ttB2oHF3Qdv8YNF2rH5369CH/CMz0QyuoE5k6Hyjfv0rl9/oW22/d3DVWPC7Io3pLZCtqdzCWXqvWG3NF0wHXzcdfL2\+uXXwmfXqutbK4TSRRj1v1e\+QDCpR0\+3FzU7a\+0L93t5xf6jKDFm1gL/vYW3ci6Zqk2YZ/QZHH51roLMmspmolxgqmK\+2Aswcf832ldeYXo2alxh60tyjL1hGv3GornqwsKLM5PvMu18x03DiXaftnXi/8Sh9sVh45nbL\+j3c1S/FBwAAAKOu0Y1z5YHeCwrbdlNzPXXKRES2eTc2leRuWevp\+nWv\+6YVYgP1vNoz2Mf2aGs\+v7h9ntaZ7M2TRhfeP35pel59E5GpqbmpyfxOvkxsfWOTRcv3FNl5i1vq5cM/6jh4WiFqEFubmuh9IiLSet9683jJs8r9eVt97/63eqf6jKX0dJ0\+fHTyXGu1r7eXuJZmjj0\+oBLZ\+Kbmeq23pzjtp7T6uW2fpc7XO3Yf/bVKppbmW1osNPMqzbCRc/LO23vfeXv/a1/Y850vrvj9OVLrXPWtV3clf9VdJnbR7y2ed9kVKSv5QWLnciMBwNzQMs/U\+95F6fWL0usnO/5yw05x0aIz1mlOERGZbGaTOljIl2Y53NljadoKsHh1f9A048E3zOtWDK0pmFY1mXbtNfeMe5NtLG9dPyAWLTuidYcLlYfXFZu66zemjewCZd0Cw/69pl6i4UnsDU2lzXeXbSbdNq/S0qhsfqCsakSNOhWZzi7DunuGApx\+/IXhz\+568wKtfWlxw1KNLVP\+jLFHofw5y\+5zhacfU/JddZue5T7qg2fN1ZYFFfZs3bYLamBtP3vAtuWYMd9n3v1jQ3tL1daqbWg0dvcZO96wdCpEVG2\+oWqbV2qfy3aPLuSz4ZM5luqKe4dWNRLdoLU06psfLJFm2vsyJ71rfTRabVk60DYxhbJELOnNCyrspX9kFGPHKWarqDTNVdbcYN5yyjL\+QTs9I49xukRvX51/ePTnltsHN7eadx0z2lqHNmh16w\+YPmoF2ESXrwJNxBzvMq5ZWnyYq/QML9pkqqz7mkLphr3nlO1zicjQcaShg/TFXyq0Kdy2A2abWNh5e2XvqcmFdLVoirzA7Zhbbp/L2O4eXHW2LvKuoWfkiwnjDK/1zFTXrM2vK9TtN1cXiwPbb6l7dK\+FaHgVKOOqFQN75lZUqWHHOUYl87bv8kTVda0z6ndWV9Bm1dULU6ZcQ8crjR0zPRbD8VMm9YHSw3dwx8dW29LbvlTYfod5W4zrbR3a3GLcdYC7ND\+895y5p6A2zx2\+HYNRL5g6ukx5Iuo22ub1b1itdDw74fnhasEc2dd4eQV45Beu8vDqIZKsHeXKunuVw3ts\+z9SBZhIY0YSr8Lk55Y2P1AeVwFmehVixy1wpZYZdep8y2AdLAAAgGvoWq0co3S\+drr7y38Q\+Nave\+Mnu823bt30Ry3H4\+v/\+Z38hTOdpc\+vuEPr/GFvvqz0dPXZ7lncVDqz7Z0pv0032\+74YuDLvZG3SPxGexu9v61LLlgKKjW0NDfZ3uptvucr65pJNTfY6omI1Au/3n9ceca9RP1loqNnFt\+NqxfOHDytbV3lXteTPCw3rfvGFxcP/npTl1yaMKtZowGNzA1N8/imAT1fNjV/tqnZ/H5\+0ec3fLlBJZOtnpu2jDzFkd244k8f2lx/cuPOVyXZ1HLrLc3m4vGLSn5QszX/XsvcX/bQooe/fqttkFi\+YWK3Wu87feodI18u2Frbn950a\+c/x7f95H2Vv0lcxOXfk38zqE13isjc2NJsyr/Tm7/6JznNcAq0zpqqbVPeAzxXPz6Le4An6DlljTjzO9eVD78wZ//EVKAWzDue5VWFsd2s7FxXbHm3fuMBS7dJ23Bv0dbdsP8cQ6N39A30WnYcsAwXUppv5na8MFw1LbTNZXre4o4vz6/6oGHbOYaGH/60vtBeZHfF5hxfOLi1icikN8\+r9r5Wd/DmgeZ3zcev4lGcJt1mrbJmnTWRrbHa1joYOMHtP2Y5fI6VugefXl3Y/IFtyxlDi3No65cMe88QUXXxkuKapob1L1h6G8vtjeZd6Wr7HZX9R0x5ovwndiyGw680HCZqWVJobmV3PD\+2\+FN\+8ixlpueCyVakFpNuazRIr3OdRRouOXanuW6xsKpg3RidsIwZa718Aq3ONur5I/poQmDyfaaOU6bmRnXVvNG9fKQKsG6zklqelNmY3lPc8Xvya0zsxjMGlaj59uIak2XbEVPv\+NDIVVbdUelJG3s1sk3VNUs6S0Rc5eEHBtYUrHuJ2EZtw9pi01uNj75i7iWa4bWeGYN0zLThwaFVBd1mMu7\+seW4QiuIiKinmzso5tecbXj0yMg3C6rGzOyf/FleQa7a1sh0n5tZmfeKutP1u5b2b14rv3w7t/\+UuadITS3KhnvKva9ZuxVG7TM0OwefnlvZ9TrXcY6xNZXX3DPU3sjs7zLkqTKhI82494B1hb\+4dbnJO7paOGvWbXPLl1eAm8k8trSVZujsthwultvvHv4/lI9SAR7T02Xdf/vAinfrh5fRbrqluPMe496zY3cvf/ipQ\+0XAADgGrlmS6f2vnVo405t67dWxv\+Xh/rOSa/966YfvpMnosFe6QKtay5K7wyoRL3v/bqnfsninnc6\+6b8//Ni99Ez7Grfq/\+XWe17d/\+z/7L/PU01d\+56/fNPP7Lh5COU7\+rYuOtfujes2fo/v6n\+9Q/2vjdwXDrT8\+WGHunM7B7VW764/6k4\+8gfbfib/77VUuzp6tyy818Pvqexi8Y30rrf6uz8uvvpyM37/273rh91rvj2mlf3r6G\+09t2vtTx5fu2b/izncy/zPRzavniwe8nWv70Kzv/6f9ubjAT9XXs2b/79G9U\+pn0\+T9\+5n/dRaW\+g8/GN/17\+9OPeOPl2P273hntWevp\+nXP1xeLzdxhWcm/9eqWH5oCq3z/9u1Glih/5uiWH3aeudAw3SnaT78nztM6D/Re1RLQw2Y4Bdpw\+AX\+a6eUrcu1wz9qGJ55yDYpe/xD6qm6vTN7oMtl9JbW0poFVTLT4iUlsYsbWTN5RLXt7sHA0nKLybT3gG3TKSO7QN354KBYqNv48uT1Zi6Z\+OWC3nJHSeQM\+QXFgNO05ZgxX7BsefIGVWFU0tsWENtYfnhtsY3YHQe4HfvqdvryexbUbTvASoUZHo7e0qpsvldp7jV3tw4808R2nKnb\+AJ7eDR5dp5o\+FpXlRQDO7e04UuV4z\+u65w3oJJlx2HT5q\+r7fNMvUuVpq76/enq4nWDgbON2yYuN/XbPZbLmKrNVqbn8s01497nG9m56jP3GDoO2Hb3EpmGw4nePI86jrCLV5TFJlYaW7KbOX5kzp2T74m9Mub4a/U7yKAS032ifpvJMNu7stnGijiXevsm19zYuZUmjlSqtC2oHu4y9Jyov7\+L8grTPNZEF\+8eXMVZtqSN49dMGi/fZ\+qmyrq1Qw83WrY8b2FXq2qfZduP6Ol1hacLtr84Vb2Ka30FPV11m57XRHGwSWHEBwrbX2noICJTtX2pxqatPcuHtvc2bDk2mxvXZ3kFm1sUkSzbzl3lo78n7XpXbE7\+awOBu5XNdyhUZjq72ciuhpGVrt7lNu6jzfeoG9Yp262kFg2d3ZZtz1r3nzEQV5nUU/4ct\+1wac\+KwUCXbfhkqgXLxidm92WJWjDveMHUWyAi0\+4X6vMFossfUT4jBilt3PA1Reyq7yhW2\+9WbRfquycGavaG0lZ/38iqVxMWwdJZrsqem92aEwAAADCdWQdg9Z2f3\+/7\+ehvWufBZ//zwZGfu48eWn/00OQNyvLBJ544OG5z73/5\+eQ24/u/8MtNO1\+a8FmtLB/e9d3WXWMvdPz1/2fb6Pib58219Z3eP9UjefOnD31t3WXjubQj\+Z3dO7\+7\+0pHR/nTP/Wu\+\+nob/u\+9JN9Y03f\+u7BfyQiolf//QqHM6HzC7/a8cSvdkx69fTP1/vGn5AffOmyIeffOXmw5/Prvryo6a23e0k5fuil9YdemthkulNkWrzqzsWDpze9Jc9wkJdjZ1ABtjVW2m4ptzuVNa3V7mP1naOhSO3lHo0aNnxt6Om/KnZK9dsOD0/1nAFTta1VfXh5cdUCpuNl25dO0KoHBp55vNh5yrr3DcvhM8Of5pmec5b9hzmpy2hrUbf\+qbrKUe15o2H9AUu3RmSqijdri2\+\+7CkvY7lRb3YOPNNq2rVnzn5Sn17fv6ep8dFXzJdWXWIbq82OSstLjY\+\+buologK78Vlm8wODz/xV8fCP5myZyWONTdW2JeX86zbvMWPeVBVvVx9ePrT5a5NvVVffq9v4/xLbVb\+jy9B8M7FE\+V5247PmFV8rbF1g2RQz9SoUea30zNcH1\+1tmPRVwm/tWJpuVjc4NVtjpWWB1kL61gdLvQWTdMLSU2CI9KZ5OhWnDNL68ENibVyl/d5B9ph1h1S3UVGeXtsf76rb9hOjeN/gmnlTx8hL8me5XT3DJWJiOV09wRFRvs80PB81XzB2mnSWqzbP1cce53tlpsqqrw2KRcvGdxlbY6V5\+Ak6Zt22oLhzXTX/uu3\+C6XtD8rxUw2bDli6FSLSmxp10ogatXXLBzc7aX/MKmnV5ka9\+QadJpfvmONH6vNfGgj01a8/YLQtKK9qrKoa9Z6xbnyeWcUxN86rXN21nobeJg5tvafUwhmOn7LslyyHL9AqsdK\+tGA71rDlZcv\+Xtq5rv/lJdYtz4/UbCf9jbDN1doWVNpu0GnqpaqueAVfZnsXFHd\+rSL9qE66\+vroRIpx7wtz9r4w5XtM9ynro6esU21l3vQPk8Itc/z1OXe\+TkTUsmRg53LNZp5iuzFlw\+EkS43DJWJq4oydRKQZOkdOi6HznG4z6U1zNZtp5hOS9ZYlg6O71pvnVZ/5i1KPpjfP09UPBuJ3MDQ8K3tv/eFz1vu3TnVcRMNfOD59\+0x3CQAAAFd2zSrAnwSuZVn71m/8Xs\+BWMeF63p\+WPn9wwdPr/vTZSsW/WrvO7M4Upb/T\+u\+PLc7\+a\+SfLW7NhGZmONHGte/foUKcHXxlwa230HH3\+I2HmA7Jk6szfdaduyx7L1F2bxCaZ9n7nz3wz7TmyoPP9K/tUWnorEjXbd\+70iHu/bMPXizumF5ceuGoZ1EPf9mu/95c3cX201EVBXnVpoK7Lan2YPvjmY5q7ZubWFVo2nvHtNoNZjpPcfuL4yE596z7K4Dxo4uc2eBiKzrI5bFZBj/WONOqf7RY0apd9w0xT7Ltu9bdnBVmzaD9EtEmnH/86MPDtUM0gmrdGK6z7h0\+K3qqgf7N88z7T5gVE2Vh9fnN1gt2/Zyw7mi\+0T9JuvghiVax7nhG6F/68dCOpWNh1/jjk9cYYu48s7H8muspl3PTirD6qxpNNmamN5zll2v1\+0eLhJ2Wb3fNa35UqWpMvyc5A/f9eIvlXrSDY\+\+YGoSB7bOm/w2e/PQixuUlg/M2348w2Nheru5LYe5jmL14Ufym5tMO35s7CzUb/tAaypY9p8xqGT2vsuKcw092ugBNhr27zPRPGXVPGMkVrf3jIEaS1sDhRVm066YaexUa0y\+zBAxx19vXD9yf\+lA2wfcpm6jStTTxe0iIrJu7JrVtf6wY\+kzdh5r2PLGpW\+X9O5T1m2vsXuHq6bnuEefNIvjF043TcjA7Fx1u09pusBuOTXp7M3gCnKVFme550hDZMb16k9E94mG\+0/MoF1jeWfRtGtf4\+6Ctt13WaA36avWy9sd1PlaQ\+dMb55nZrrrK3bSKdm\+MvN1BAEAAOCKmIWrH/\+kxzCqftH2v/9m29GY959/PYPZeg0r/nLjM19p7Hkt8eiuX3Revv7zJ4lr37Bh57yfef/uF91Xf\+ftROaG9kd82z97cuMTPz0\+w4M186s2PLS5/meP7vxF57Uaxm9F09yKTTN0Tzs1V29uqjRpxqu5HffTg\+WqrDLrmb3waYRrDQAAAPBb87sUgAEAAAAAAAA\+Nr/T89YAAAAAAAAArhUEYAAAAAAAAKgJCMAAAAAAAABQExCAAQAAAAAAoCYgAAMAAAAAAEBNQAAGAAAAAACAmoAADAAAAAAAADUBARgAAAAAAABqAgIwAAAAAAAA1ATmg/zgJz0GAAAAAAAAgI8dKsAAAAAAAABQExCAAQAAAAAAoCYgAAMAAAAAAEBNQAAGAAAAAACAmoAADAAAAAAAADUBARgAAAAAAABqAgIwAAAAAAAA1AQEYAAAAAAAAKgJCMAAAAAAAABQExCAAQAAAAAAoCYgAAMAAAAAAEBNQAAGAAAAAACAmoAADAAAAAAAADUBARgAAAAAAABqAgIwAAAAAAAA1AQEYAAAAAAAAKgJCMAAAAAAAABQExCAAQAAAAAAoCYgAAMAAAAAAEBNQAAGAAAAAACAmoAADAAAAAAAADUBARgAAAAAAABqAgIwAAAAAAAA1AQEYAAAAAAAAKgJCMAAAAAAAABQExCAAQAAAAAAoCYgAAMAAAAAAEBNQAAGAAAAAACAmoAADAAAAAAAADUBARgAAAAAAABqAgIwAAAAAAAA1AQEYAAAAAAAAKgJv80ArKm/xZ0BAAAAAAAAjGe6dl0NHHly139/k1YFNmxb2nDZu0rXwf\+z9eT8v3zoy19cYCIitbf7wKvdhabF/\+UrzY2TG2sX/\+O9wk0LF9WT2tvz7xcvBWe2sa5SGNJGRm6ub/39G4e3LZzr6eofn69NjTd\+pnHoN\+dGGo9s/pmbhUX11/CQAQAAAAAA4FPjmqZBs4mIWPMUfRbe/un2F86eLg\+k3l54Y11LK2\+iodzBQ784d9t891eaG4nUc117D55d9MCXlzeZzr3xwrf\+6TTd\+dV/\+m9L1OSLf3aof7SbOZ\+7sf/fL47\+VnfLE3//J26eiJR3Xh3fjIjo1pX3r373wM63K\+Neq1/zVxu2LEEABgAAAAAAqEWzS4PDZdv3yxNfNdd/7g/vWr6ALGYiMlksl2916h\+\+94t/L89ZtfKzXT/4P4/8dPmzf/1FO5GFiMwmGhw4\+drL3/nB6SzRreaWpQ\+3LLjzC3/S0v30yR8HnzP9eR0R1bvWfqHx1R8fHI6\+5vkPPfQHavLl/30pCZOJNZss9Jl1oYf\+8ve5wokDa//hVCNvanzfRHUt/9\+/f3A5r3UdfO5b\+5TLxwYAAAAAAAA1YnYBuHSx\+3//yy\+yk1823lXmG\+\+krosakXbuP84eG\+mWXXBz84Ly2e89\+eLBi/UrH/3GX93ZHz158t\+7j2x9ofmf/tBERL85\+ZP/9lh/doiI2C\+sXL1lbUsjEdU3r/uL1ae3H744h2PJRNSf2vfjsb2Vzz/3zEEiorpLL2lqWStR///57nPH6kzq0MX3qXLjoFYoazTU/Q/bdz1npsLF35SovlSa9QkCAAAAAACA6wPzQX5wFs0H5ZPv9pdIK/zHz7fuO8veuXzLPXTguSOpoSlb16957Os3/eifn373snfM8x/65sKTP/jFm2Wius\+4xM\+vcS\+5k977WW/9F5cII7cElzSyUNfB5761T/7C2tVr6rr\+8bmTp4e3ffTLd5VP/eNzp\+jLf/Lsf13YSNq5E28mT/YPjO3AZL9zsb2/M3V23D3A5vrP/eGy5QswBRoAAAAAAKAWzTIN1vN33sYTUaF0qpGIvVFYeudnLA\+oi3o1IuWdkydT7xtvvWvJF2\+kcyd/eeh9IlP9Uvfyjf3UaObYOpPFzDXW0W/e/Ok/vmlSh7QSUcOd9\+4L3LXAQkTaO8mffucHF//gj3\+/519OZUf2N2fV2tbP1Z1P7fs/KSIiuummz5TeP//cP/3wOSKi\+jW3faaRiMi0YMldy9//f7w/eG\+sxHvo5xOHbnQ9uuEvkX4BAAAAAABq1UcOhPX8F91f/iIR0cDPvtedet\+01P3lv7yNfva9rkPvE1H9nXc1H/unwwflcZuUlQW3fXnNnUr2BSrJ50\+\+3X3OQlRSTp68WDLzovMPly75fKGkvPOTl//uTbrx9/9w23f/4Mgzz/13SfnC2j/Zcpf8D1sOpuYs/ttvLlnAz2n9/bHlplmzyULGz61c7V/K0eDFAz/48cGhhRsf\+sKdPF184yff\+Yk85epcAAAAAAAAUCOuZSYsDWlEHGue\+Gp54PR/nP/3IdZ\+E99oJioPdL0/SHUDdGPLytvYn5/85eP/8Muxxjcv/Nzvfaa1/jNEmuUkR6QVznXtPfHev59TiCoX/\+PU3nO/6SoTDfUfO9l9Y90cdQ7/xSbTyIGYjUSVNw\+9\+GeHLnV39ul/Ojv6M2uZNDAAAAAAAACoJdcgAKu9uWyZb71RuShrZOZuqjMRaeykRje2PPTNJQssRHL3Pz7ziy6i0rsn959ULTd//m/Xtt44vDhziRoXLmytH93ETESknjv13KEzvyEiotNv/vL08FtD7x38yXtE9YXblowG4BH2O\+9cfhNH5YFjUue/l\+e47mldZNYK73btf3v8A4EBAAAAAACg5nykAFx4/1T071/ef7LfvtL3rLv/zYsVmjN/0RwT0WVp82Lnd/6h89JvFiIys2SmxqbPLl3SciMpXT89vH3f2QXf/K9/ezc/Ep7LREQ3Ln3g//2vppP/z/9af0hZ81cbNi3s/s5fv3jkpuXxLV9cNOGZRhqVK0TGz9zU8oWlHA1evHiy89\+H\+M/d1nInTxfL7x14Wy5NenoTAAAAAAAA1JJZBuCS3NXdXxi8ePK1935DVHr75M9vu/Mv/9vnV94lXPzJkZ/10033tI6VcMe7cfHfPjShAkxEFiJVPv/zV18\+dPCXP79IREb6j98ULgVgMxH1P7d953Ojfez/h537h3/qPvLAw0eIqOHOVfv\+eskCIiJSy1rpSlOgjWoZRWAAAAAAAIDaNbsArPaffe67Bw/1E1H9Xfd81b9qydIFHBGpZ49\+54WzA/SZ//KHn22ccsvLK8BkIqKB7l98p5uIyH7b5x964Asrb\+Mnzp2uX/nNr626UT74gx8fukh28d5NIqX2vbL/ffpMy\+f/clWrfcH8z5QG3nn3N78pa7TwD/9py\+h2ExfBGvWbY2//hsxzWm\+\+sXFC9RgAAAAAAACuf7MLwGxTyyrxVou5dY379jv5kW3V3q6d3/3xz4fIfs\+X/\+Q2buot6z67SvzsjWaiofPJ187\+Zuz1z7jual35lT9w/37DxbeP7n2V/\+JdLa28iUryuYsKEam97x169eihi9TQsvxvH7rrznpauqCh8bmXn3v7l//wAoX/eiHbf2rn9oM/n3p68/gK8KU93vLE3/\+JGwEYAAAAAACgxsz2HuCGL/7XB7849qt27thPtj7zizeHyHLzH2xZ23qjnDt2dpBIOXlRG9\+55cZbH/rmFxdZiORT77x59tIjej9z2x9u\+fPbbyQi0n7zHye/t08\+za1d9YH0jy\+cPl2mBjOlDv2ciCw3Lfa7hdK73ceIiExfWPmHaumnR8hUOHv2GL8w/Nz/mFx2LuV2h559un/xd7c/8EV\+locIAAAAAAAA16OrXQSrNND19qkD//KL/W/3l4gsN90ZfuzLS3miEnfu0P/znZMqEVHdwrsWjPVfKss/e\+EnB9/v7xoispDFbGKJCr1nj53gbrQQlZSfH7tYMgu3Gd/73y\+czt64\+G/\+fMXqG3\+z/weHn5PO/\+b9zp3/1HnZIH7xeOS9jVu\+sfTy4ZW1ASx5BQAAAAAAAONc9SrQmnrxvZ\+/3V\+i\+i98\+cub1i5ZNLz2laXhc3e1uIgW3Nay/K7WpU0mkkklKpFKZn7pUv57oc73ie66c\+GCm0xTPQf4s22f\+89f3fJ7dHPzAgsRNaz7iz9b96h88mTXsf/ovzzTNjS1uG\+ectJ1RSUi0kpXe3gAAAAAAABwnWE\+yA9e7bbaxXMX6UbhxivfT1uSu7p/U6A5rbfdaJHPHjmpLLqzpXX4/uHSQNe7vymMLc7MfuZmYVH9NXg0MZUG3uk\+/xti7S3NHzI8AAAAAAAAqA0fJQADAAAAAAAAfGoYPukBAAAAAAAAAPw2IAADAAAAAABATUAABgAAAAAAgJqAAAwAAAAAAAA1AQEYAAAAAAAAagICMAAAAAAAANQEBGAAAAAAAACoCQjAAAAAAAAAUBMQgAEAAAAAAKAmIAADAAAAAABATUAABgAAAAAAgJqAAAwAAAAAAAA1AQEYAAAAAAAAagICMAAAAAAAANQEBGAAAAAAAACoCQjAAAAAAAAAUBMQgAEAAAAAAKAmIAADAAAAAABATUAABgAAAAAAgJpgmu0GZ06//XGMAwAAAAAAAGBWbrn1tlm1n3UAJqK77rrrKrYCAAAAAAAAuFbefPPN2W6CKdAAAAAAAABQExCAAQAAAAAAoCYgAAMAAAAAAEBNQAAGAAAAAACAmoAADAAAAAAAADUBARgAAAAAAABqAgIwAAAAAAAA1AQEYAAAAAAAAKgJCMAAAAAAAABQExCAAQAAAAAAoCYgAAMAAAAAAEBNQAAGAAAAAACAmoAADAAAAAAAADUBAXiYIgUcDMO5ohnl8vcyMTfPMA5/KndN95lLeAVG8MSz17TXcZR0WOQ4Z1CSZ9Q8G3fzDGP3J2fW/HebLIVFjuHEcPryCwoAAAAAALXp4wzAOSkW8IgOgWMYjreLbm8wMSFeKpmoi2cYZtoQmIt7BWYcTnC4vOHEFBn1ypRMxCXYfcmry69yKhI\+1D/nvmDQKUdd3FQDksftK5sMe0WHwI\+8L3rDyeyUA1aymYzMCg67MO7FKxyykhnZ\+/hUp2QiIy\+6o5ftRs6ksypvd9r5CYfjtzOXcQRSMu/whTY/EfQ4uKs6T9eckg47mcknwxcZfzqnP9u86At6F6pHI\+FE9pM6AAAAAAAA\+N1i\+rg6lqWwx/X4UXX\+spXeP7crWSl5aN/RQ2nliBRx8UREpGSTcamfiOi8FE9lPT77NMGLXbjEIXCUy5w429Wx7/GOdO6VVMQtTN14Cko2lZTOK/arOg4lm4gmuqj1zwMeOzeSoFvv\+3OPg1fkrJTY17Hv8Y6U9JwU99k5UtJRj3vDofNERPMXLqTc2a6j\+x6/N5l6MhUPOPmJPeeyUlbl3eJUhz3VIYdHD0BNJ1KZgNPJESnZVEJSpxm6nE1nzrN20cFP9e781iV2fnTXnN3Bc7zTG3DO4tT8lrBL1vrddk6RM6n4Sx17HutIpV\+RYm7hw8624PJ7l\+zZkYgm0p6A83ck1AMAAAAAwCfo46oAK1kpkVap9c/jyWQsGo0nU8kn19\+31mWnsdplMiGp81du/vYy9nwqnspNV9ed4wolJElKZ\+W\+N55sn0PUlUxmZCJSssmIV7TzDMNwgtPtj6ZlopGZxYzdFwl7nYL9gce/5bhtwyGVzu\+59ybBE8\+RLEX9btHOMwxvd/miV57XrORS8dR5anV7x/LrfKcvFA6HI9G4lDny7Vai8xkpqxApmVgweOg8zb/vyTfe13PZbE7pe2PXffOp/1AoEJtct1Zy6Ww/O6k8\+2GHzBHNmc\+q6UQqqxCRkpMSaXXOwvlTjl3OZrLE2x3CVOFvWSAujUnF/U5u3BTo4XPo8CdSsYDbwXOC0xsZnUgtZ\+IBj\+jgOYazX6q4KumwyDC8O5pKhL2iwPEOd\+BSqT4nRX0uO88wnOD0BC8VzOV0zO9y8AzD8A5XID6\+jj6e3eUfPt2JdObFtQuJzqbTOWUGZ5t3er3LWFWKJ2c9ZwAAAAAAAK5HH1cA5njBzhN1pWKJ4VjKi4FYIh4NuEYqt0omGZfUOaLX6/U62X7pCgn4Et7pcjuISFEUolzC77r3sX1HZfvKtfeJ3IlD39vg9sezChHHEdHZRDiSEdye5X\+w2n9fKxGxrfd9O\+hzUirk2/C9Q7IY3PWEm\+vYs8EbuNJNuEpGyvTTfOfUZVQ5m8nkiOY4RDtHSk5KSP3ELguG/OLIUfKiLxxqZ6lfGomsYx3nMpksCdPE06kPmUgh1i66Fo4m4JyUSCsLRVFgpxpcTspMl7A/FMcRUVfc74tkOLtA50/se8wflWQiJR31\+Z56KefwR5708ul9j3t9sczwSWepPxXyBZOKYBf6uw495Q8lciNTATbs6cjZV65123Mv7bjfHUjkSMlEva6HvpfmPU/sesLDSU99w\+1PfMgcdTmTyeaIFjodAjeTs80JTqdAalbKXNubtwEAAAAA4NPpY7sH2O4JhdcupK49D7XN5eyi2xuIxKWxjKtkkomjKiu6RYfT5XGy/VJsmltlL1GyqVg4dpSIdTjtlE3GEmeJXbI5mUrGE6nUD9fOp/OJ6FgnvCuaSMYiG\+9f4/M65xPxoj8Y8DiIc/o2P7ErGg74A\+Hgyjl0Pi1l5Wn3KeeyMhEvjJ\+nfH7f/TcN35Q6t23DIVr27VjEa\+eIcrlcP5HgmJBpOcHhEIjU3KSdKNl0pp8VppmfPNUhj3TK2V3O\+f3phJRVcumEJAuia8qIq8iZTI54h3PqhH004hXHuANT3iAteGOpZCKZiq2dT5RNZWSFFLJ7A5ufjIRD/kA45JlP/ZnUWO2Wc4YSyUQiGd\+8hOh8WsrIcjoeO6rSwvXxZDKeSMafuK/dLmcyuUwiluqnJf5IJOgPRqKBJXQ2FZemGkTXU8vnjpzu5Y8f5Vc\+EQt7hJmdbd7uEFiSc1kZJWAAAAAAAPj47gEmzuGLp0VfPJHKZDJSKvHUoX1PPda6/ofJqNfOyel4/Cix7R6XnePI5XHS41I8lfU5pliAqf/QQ4usD136lV0WCHodlIll\+4laXe7hBCk4nHbadzSbzikeIiKa43A7p7pNWHA4BTkY9jy\+oX/kFV5Wpo9HiiwrxPICN35cw/cAEylyNiMlDz3l9wtCPOjkiJuqEkvEjfxvfL\+5bCZHgujgp4qnUx4yl0sREXF20eOa/1IyIaX5lHReED1OITrVyLPpbD/rcAr81Ed2vuvE\+Uu/zOFziuKY3GSOY7h8zNvtAlFGlmUiu90pUDzsv\+2x\+0dbKWPxciSPcoLTPodOKLKiyLlsjmiO0\+UUiIh3BROpIBHlkrGcSnRix91zd1w6zGxWVuiyvD5yDzApSi6XlhKHHvcFhGTMO6OzzfE8R6qck5XLrgAAAAAAANScjy8AExHxDrc/6CYiolwq6HHvOBqPJoMev5BJJE8QUceG26wbRhtL8eTUCXh4RSiOOMHp9ni9XpedI/nDds1xHDdF5MklA56H9pxd8ufPveIV5ETI99TRWR/VfKcvFPaMpOtc3Ov8xr5wOOFNuB12no7mspmc4r4U45Tc8CxpwTEhjitXnp881SErI\+VRThA94vx96UQ8nsnNFz1OQZ6iByWXSWdJEKebYr3sieOp4MSlobLSpDYcjZzCsWayFPZ\+Y8eJhWuffNHvJCnse/zQhC244bbcDPNm6/rnIpcWP\+N4\+1QLgtld/lB4dOG0TNTj3LAvFPa5w7M42wAAAAAAAPSxTYFWMjGvg\+cdY7d18sJYsVNOxxMniBa2r//25s2bN2/e/O317fNputWKRlaEkqRUIhr0uYYzEi847XOIsunM8LTqXCadJZoz3YTf4UERKbl05ixRq9vncbtEO6dMt4LyqNES4nRF4pHXlZwsK4LT45pPakc4FB89DiWTCIU7\+mmO6BXHj2w4qE2av/shhzxGED3inLMvPbWvixM94tRdKNl0VmXt4lXdATyt4VhNC10\+r8clOrgr1M5HDFeP\+7OZnExEshTxukR3IKkIDoElUoh3ulwul9POc0TclOXwyUMgIjmXU/iZnG1FVhRieWEmHQMAAAAAwPXuY6oAc3bR7eD2vfS9\+29KLFnpcnK5VLLjrErz7/O57Eo6muwidpk/Eh2tQcopSi9/6mg8mfE7Z/bEGrs74F/y0o6OoM\+XEYWcFNt3nlq/HfQ6OCU7eTACzxN1JcKBoPzIfxLmE2WTsYSYSUcTOZYol06k0k771McxvJaXnMsqJI6\+eD4dCwUlnkjJpZOJQ139RK2i084R7wmGVqY2HHrpIacj4hQ4UnLpE2dVmrMyHPZOKG0rWSmrzrE7p6p4fjhOcHnEOS8d6p/j8ogCN1UIHUnYbvuV19ia/Z4FO090VoolErIci2WJqD\+dSkmutmm24EV/oD22oSPi88luIZv43qGz8\+/zOQSH3ecKHz20J\+B3yB45HtpxiNb\+MBWf4pbobCoaCiY5UuRsOpnoOKsSK7qdAmf/8LOtZDNZlXjBjgAMAAAAAAAf4yrQDl9cOrLr2/ct47KH9u15qSMntK994sVkzOdQpHiyi1inxz2WCXmn172E6Ghi5k\+s4V2hxCtPrHXkkk899VQy51j7xCvJ0Zmyk1o6/cH1S\+b0H90XT178z4FA\+xz1xPceuj\+UcUUSsT9fxp\+IhWMnC9Mdh\+iYM7yc09iLXS99b8eOHTt2PLXnUI5fdt\+3n3sjNbxnzulPSK88sXYJd/bE0aNHj544S633bX5RSvgnpnoll8leoQD8oThB9IpzaI7ocU3Tg5xNZ9U5jqtM2NPjXf7gffOpa9\+G\+wNJeyge37xy4dl4KPqL/LRjdfjjiV3rnUrqe09971Cude2TiajPznEOfzz53J\+3c6nHH/LHZdeTR1Ixr32qDtQT\+57asWPHjqe\+t09S7O1rN/9QSgSc3AzOtpLNpHPE2kVMiAYAAAAAACJiPsgPzmqDM6ffvuuuuz6m0fwOUjJRj7jhkP3bb6QiIv9JjwZmQUlH3OJjHc7L73YGAAAAAIBPvzfffPOWW2\+b1SYf22OQrhec3e1zzacTidiUz\+iB31lyOh7rUOe0e91TLKwGAAAAAAA1CAH4w3B2TyjUPudsLBhJyZ/0YGCmlHQsGD3BLvOHfaj\+AgAAAAAAEWEKNAAAAAAAAHwaYQo0AAAAAAAAwNQQgAEAAAAAAKAmIAADAAAAAABATUAABgAAAAAAgJqAAAwAAAAAAAA1AQEYAAAAAAAAagICMAAAAAAAANQEBGAAAAAAAACoCQjAAAAAAAAAUBMQgAEAAAAAAKAmIAADAAAAAABATUAABgAAAAAAgJqAAAwAAAAAAAA1AQEYAAAAAAAAasL1HYCrmcRQLFW5Np3JpbB/MJXTZ7GJUknFlBltcqWWlUxakyc0riqzGAQAAAAAAAAQXe8BmEiuhL0DgWRl2sSYK/kcfXZnvyhO\+M/pkHnnYEoe11LRM5lqbqTbkt8hj2zllHl7IT5ldlWqyVhJys4kAFeTsZI0ZSdyJRYYcAdKI7umStxX8EY1ZGAAAAAAAIBZMX3SA/hYGRy\+\+gQNBRNazmW0c1M34gRTONbgtTPjX1Qyitc/UjpWsmrQr0g5PXNCT7nzEd7gCVhIMIbjDV6BoVzJ71VH\+9ZzqSF/UBsJqwplT1TJV0jwl3Zm8ITrg6JBySjBsEYCwxGRomfTlZRU5QKDOdEw0pWi52TG89/Nyk/KisPIZUrhoCZ6WTepsTTjCRmmORoAAAAAAACY2nUWgKuZ6JA/dnm9t\+IVFVkhniciIs7oj9b5HCPVbyWnBT35yMRAqch6ljMHhpvb2UiSpVzJ7y254/UegSG55I8QTVGEZQRXfUIa/U0uBz1FPtwQFCdX2jkHF4mNjFmKDPiSJPB0okNLcJZw2Op1jrZXKpkhEpzkISJieF5PhctZuzETKwYv9SVXkxITTtW7eYYAAAAAAABgGtdZADY4/A0pPxHpcmrIG6ZgvM7FM8O/uvwVb6Q\+IBonbfNhFeBqLl3JyDrJWlauSqkyL1y6C1eXM1o6o2WV8dvqmfigP1JR6PIKsMEVrgu7xgagZEuRYDFB5mjCnAwUvUGrmFFDnnzEZQmHOZdgII4hWZeJ4TmSZZ3PliJpYzhR7xHG7TGnZr3la3QCAQAAAAAArlvXWQAeIadVr6/MhRrEkaIow4tcxDfk8wxkovURj2l8uVfJaX6nHBAMdn7ci2MVYD2XKcciZdnDBSOmbLzoSxsDPoOijOwoHNWdQat7LJEyDm9Dyjs8jukqwHoupYbCaipn8IXqUx4TJ5eTChFvdPkbUj4tGSkGxII71hB2GXi7gc/pRMTzlIpWBI8p5srH3SY7VVMpCiQbvNf\+/AEAAAAAAFyHPgUB\+Pnnn9\+6dSsRbdu27cEHH/yQ1kolnVCCIU0IWF25UipndAsMkZ6ND4XSxmjEEPIP\+pX6qHc0A/MGj8\+UiVY4f10yYB4LxnI5ntTtHBEZnV4uIGu\+pM57SEqTJ2z1OyqZaDkWLqZ5xikylCmlsga33aBk1EBAScuXBnPZPcBEnGAOx\+ocgsETagg7qjH/kCusk6JnTuicd6QlZzdHUnWi3UikXxoSxxv9cVsgp3qTVV\+ozk3lgFf9aKcWAAAAAACghnwKAvDWrVu7urqGf/iwAKxnE8VgwhBINrrtetKvRpMVl8/EKZVkvCI7WNFrTjq1LG8cC7qKnklVjp7VF8aGXPHL\+ouVAtF6L6fF4tVMR9ElUf95pjU4ZA9ZiGMEqqSypqDPmAqrKRe57cQ52GiSHR3JoCekh180J6O6P17v4knJlrO8yTFclOYtbiKSK1mZCSQavROnNHu9ZYWffpmrXCUWGkpRVcqROIsTCQAAAAAAUNOus8cgMXZvQzJe57YbiAxOjyEXU9OyrmRK8azB5zPxxPAOs3MkbepyWvW7B\+MCd7xvTtzN5DhzNDknFTPzisEft0nJOpdSzck6CZZIilf6GvxO066352SkxoDIEMeIbpNAZHcwxBnECbcQVzPxQY9fc4bqfB7W76jGklomOeh2DQYTkxboYihXCbrzEx7C5C6mZIaj0UEqI89GUhR9eN41CUZfqC4cYkXhYz\+hAAAAAAAA141PQQV427Ztl6ZAz2Y7RnBx3shgKFr25zTOZ/U5x6d9PRsb8IR1V7A\+5TMpySFvkgnGOCdfSYXKssvqsTMkD7esSjElkdFJqaYyFS48lBWI5ymnEGc3i3IxHNJydjY4HKqVSjqlRsOleIZ4ziA6GCKDGLBE3QWnYvRHGsITbz8m0jnBFI7VT64A\+7SRn\+VKNKiQj3NzWjRS8cQbvIQKMAAAAAAAwNX4FATgBx988MNv/Z0SZ/KFzAn3oM/JJhNmfsJ7jN1bn/IaeKokwwPBOAVi9T4nk0sWgymDf0Jjg\+irE4lILgczij1Y53cwJJf8SZV4o8/HOP3VQNIsEBFVM7FBd1AXg1YpxkR9KhGRrGUUUyhkzkQZt2icPKtZITmrBd0TH8Kk6BnF5FN0Gi4Ccwany\+zimGSsOtJAMOIeYAAAAAAAgNn6FATgqyeXEzEto5CS0eIpzTl58edyOKgmUlXBa42nLA6\+KkUGfRHdE6332a/wQN3RXEpEOS0Wq/KCHgsrrphV5A0OX0PGZ\+A5IrlEip5OFD2pqhioC3it0eyg1zXgj1gD7nHDECzRjGV2B8WbQlGjwDNEpkDEwPOXKtUAAAAAAABwJddlANaVrJaIK\+GwlnNaYpkGR6bo8xXsIZMvwPo85uFlqDje6PKw7pBZ5CuJ2GAgWk6RKZpo8DkNRLqc1dLpclYh\+4TQPO6HXCXkHbJ76lJxYzo04BGr0WS9x27gRxrocq6SSBrjsQa3nSEiMdiQEIYC/kLUySbiViE15Atp8pWPgzN4t1gopwXd\+QjpWdkYISLO6HAMv22wOxhF0eVsJUeX7hkGAAAAAACAqTEf5AdntcGZ02/fddddH9NoPjqG6fukh/CJ0fW5n/QQAAAAAAAAfkvefPPNW269bVabXG8VYL1oy\+aItxv5aRoociWb0wWHaboGAAAAAAAAcF263gIwcUa7/Yrv80YH/9sZCgAAAAAAAPwOuc6eAwwAAAAAAAAwtesyAFeVD28DAAAAAAAAteX6C8BVKTzg8qlZhYhIyQy5BNnh7BfFflHsdzpkXhxMT8jHVVmeVWCuZhJDsVTl2gxWLoX9g6mcPotNlEoqpsxokyu1rGTSE9egVvCtAQAAAAAAXOeuvwBscHotQqoYiGvDiY5zmKOpOZI0R5LmSDGLk5/4uKBc2e8eTFxKiUo57M6H09Ur7UGuhL0DgWRl2sSYK/kcffbR1H3pP6dD5p2DKXlcS0XPZKq5kW5Lfoc8spVT5u2F\+JTZVakmYyUpO5MAXE3GStKUnciVWGDAHSiN7JoqcV/BG9WQgQEAAAAA4Dp23S2CRcTZ2WiMSdsN3LgH916pPceMPetX1rMKI3JXeKauweGrT9BQMKHlXMYJTwke36dgCscavPYJ/SgZxesfKR0rWTXoV6Scnjmhp9z5CG/wBCwkGMPxBq/AUK7k96qjfeu51JA/qI2EVYWyJ6rkKyT4SzszeML1QdGgZJRgWCOB4YhI0bPpSkqqcoHBnGgY6UrRczLj\+e9m5SdlxWHkMqVwUBO9rJvUWJrxhAzTHA0AAAAAAMD14DoMwESM4GLdo78ombLf1c9zRESKrGd5MxERVVKRYizD8FRNZ6pyaEji9BxnDngqWTJ4hfHBtZqJDvljl9d7K15RkRXieSIi4oz\+aJ3PMVJRV3Ja0JOPTAyUiqxnOXNguLmdjSRZypX83pI7Xu8RGJJL/siUkZ0RXPUJafQ3uRz0FPlwQ1CcXL3nHFwkNjJmKTLgS5LA04kOLcFZwmGr1znaXqlkhkhwkoeIiOF5PRUuZ\+3GTKwYvNSXXE1KTDhV7\+av8F0AAAAAAADAp8l1FoD1XHLIF9Jysp7lzIlUnTg8BTpR7\+KJiBRpyB0abml0BRpcRJQr\+TMld6jOIzBE1UxEzchMPDyYJFJy1ZyDjQYtDn9Dyk9Eupwa8oYpGK9z8czwry5/xRupD4jGSeP4sApwNZeuZGSdZC0rV6VUmRcu3YWryxktndGyyvht9Ux80B\+pKHR5BdjgCteFXWMDULKlSLCYIHM0YU4Git6gVcyoIU8\+4rKEw5xLMBDHkKzLxPAcybLOZ0uRtDGcqPeMj/05Nestf6RLAQAAAAAA8DvmOgvAjOCuT7onTjYeVwEmIs7JDv8oZ9RYTMsR8SIjRYYkYpwuYypBgahVVHTByaQCQ2mnkR/tWk6rXl\+ZCzWII0VRhhe5iG/I5xnIROsjHtP4cq\+S0/xOOSAY7Py4F8cqwHouU45FyrKHC0ZM2XjRlzYGfAZFGdlROKo7g1b3WCJlHN6GlHd4HNNVgPVcSg2F1VTO4AvVpzwmTi4nFSLe6PI3pHxaMlIMiAV3rCHsMvB2A5/TiYjnKRWtCB5TzJWPu012qqZSFEg2eD/aZQAAAAAAAPgd9CkIwM8///zWrVuJaNu2bQ8\+\+OBsN\+cc5nDYYrebnAJDcjniL4YTpqjXxPNMNq1J8mgzwexy6bzX6rNXg/6yJ8I6fFb3cGVVqaQTSjCkCQGrK1dK5YxugSHSs/GhUNoYjRhC/kG/Uh/1jmZg3uDxmTLRCuevSwbM424wLseTup0jIqPTywVkzZfUeQ9JafKErX5HJRMtx8LFNM84RYYypVTW4LYblIwaCCjp0XFOcQ8wESeYw7E6h2DwhBrCjmrMP\+QK66TomRM65x1pydnNkVSdaDcS6ZeGxPFGf9wWyKneZNUXqnNTOeBVZ3uGAQAAAAAAPhU\+BQF469atXV1dwz/MPgAbiLRMvBhIkNtvlBNaTuRiw9VawRJJWia1dhNRrkSKrnBG0TVcgNWziWIwYQgkG912PelXo8mKy2filEoyXpEdrOg1J51aljeOBV1Fz6QqR8/qC2NDrvhlI4qVAtF6L6fF4tVMR9ElUf95pjU4ZA9ZiGMEqqSypqDPmAqrKRe57cQ52GiSHR3JoCekh180J6O6P17v4knJlrO8yTFclOYtbiKSK1mZCSQavROnNHu9ZYWffpmrXCUWGkpRVcqROMtTDAAAAAAA8KnwKQjAHxFHjBhs8LqKXl8p67KmwqydI6JqJqHEJJ0UPZPReYdB4Ih3WPw\+M0\+6kqtIWX30nljG7m1IjswJ1p0eQy6spj1GZ7YUzxp8YRNPDDnMzpG96XK6FPQXJQd3vM\+ihAe8kimRqHPkhjzeijfR4OO1oKeYk3VyWiIpS0QuB72KPdLgdzAkl/wcI7qNcpzsDoY4g2ifuBZXfMgb0JzRRp\+H7KmhWFITeNXvL/Ohhrhv/ARshnKVoHviElyKniWzn0YivayMPBtJUXRFIY6IBCMqwAAAAAAAcH37FATgbdu2XZoCfRWbK0SKXElnyRth05Gi21ONx60ib3B4rEFHOZ2r5kJlh4MRnKxPNBKRkqtkZT2T0GTRwk/ujBFcnDcyGIqW/TmN81l9zvE34urZ2IAnrLuC9SmfSUkOeZNMMMY5\+UoqVJZdVo\+dIXm4ZVWKKYmMTko1lalw4aGsQDxPOYU4u1mUi\+GQlrOzweEErlTSKTUaLsUzxHMG0cEQGcSAJeouOBWjP9IQnnj7MZHOCaZwrH5yBdinjfwsV6JBhXycm9OikYon3uAlVIABAAAAAOD69ykIwA8\+\+OBsZz4rclVWdEUhRa7k0qVgQPf5Wa/bHPCYI75Bn9\+YjLN2WYv6i2kPyxHJ2UosPKgkG/wOyqQqgp8T0mUpZ3YLlz0EiDP5QuaEe9DnZJMJMz/hPcburU95DTxVkuGBYJwCsXqfk8kli8GUwT\+hsUH01YlEJJeDGcUerBupACdV4o0\+H\+P0VwNJs0BEVM3EBt1BXQxapRgT9alERLKWUUyhkDkTZdyicfKsZoXkrHZ5BTijmHyKTsNFYM7gdJldHJOMVUcaoAIMAAAAAADXu09BAJ4dWYuHi5EUiSKFvYNur8kfa/R6TPzwu5w5kLD5FIanajquxHk25jFEE\+T013mEoXCi4vFUI0nGG7XYucFAqOSIDM\+XHt9/ORHTMgopGS2e0pyTF38uh4NqIlUVvNZ4yuLgq1Jk0BfRPdF6n/0KD9QdzaVElNNisSov6LGw4opZRd7g8DVkfAaeI5JLpOjpRNGTqoqBuoDXGs0Oel0D/og14B43DMESzUy\+t/lD8KZQ1CjwDJEpEDHw/KVKNQAAAAAAwPXjegvAcqaUyBkjCasoMEq2FI\+okWBxQ/\+kVsz6l\+rcWUMwbHFyZYWIOIMYaIxllIBP5YINbruB83Mez5A/wsSDwxOhdSWrJeJKOKzlnJZYpsGRKfp8BXvI5AuwPo95eBkqjje6PKw7ZBb5SiI2GIiWU2SKJhp8TgORLme1dLqcVWhCqFbG/ZCrhLxDdk9dKm5MhwY8YjWarPfYDfxIA13OVRJJYzzW4LYzRCQGGxLCUMBfiDrZRNwqpIZ8IU2\+8gniDN4tFsppQXc\+QnpWNkaIiDM6HMNvG\+wORlF0OVvJEcPRFUI7AAAAAADApwzzQX5wVhucOf32XXfd9TGN5qNjmL5PegjXFV2f\+0kPAQAAAAAAYApvvvnmLbfeNqtNrrcK8EcIbFVZYXhuqpqnUsnmiLcb\+Wm2VORKNqcLDtN0DQAAAAAAAOATd70F4I/AwE/3kFzOaLdfaUuONzr4az4eAAAAAAAAuJYMH94EAAAAAAAA4NMPARgAAAAAAABqAgLw1VI0SfqwJZc/Sve5cipduWbdyVoipkqSGktqyriXlVwpFi/nJjStSHElkanSJy5XjsdKWWWqt2QtnRl/cnRF\+R0YMAAAAAAA/G5DAL461XR0yBtQ0/IVW8klv6NPcPSL4sT/nP0C3x9Ijc9sei5ecLqHMsN5T9Hi/kF/RMtN3e/EkYTzPC87x/XvdMi8c1AaHpusxSNKKqvFY\+V0uhRLVFLhgi82GoOz5Xi8LE/IxHo6piYy\+vCosvGCXRjfed4dLF0alZIrJ1MTvwXIqUH/kDTptGRVj73P7hwZG8fJjtGfeXFwcuNxncdi5SkDsJIthTwDvvjoUeTKAddAWEIGBgAAAACAK7kuF8HS5bQaDKpJqXq2n\+a3GpyiyRe0eh0GIiK5HHQNprz1qaB50qJXSrYUCyvRZOXEWZqz0CC6zP4g53FM8R2Bki4FQ5WzVA24\+yevnMUZfJF6v3NkK443BqMNAefETpRy2D00MdxW06kq5\+QEjoj0bKIYfEmXFyoecXL\+4wRzOFYn8uNfIoevLhmxXHpNkQbdwbF3lZQayph4Io4YypUjqaojahgdNjP1lyDjjsrurUuM63zcUVQSgcEgWVOiaWz9MEXPZqqXDZo4uzkar3cLjJIe8gT1ULxe5ElJD3mCxI1sq2cTQ6GEzgsMR0SKnk5pqQzJ/gHRzgw3URRdJtOGh5g34rrdyWQSSihrcvss9pSaImNsqisFAAAAAABwyfUXgPVcYtB1fznbavKHWJedkTPlWLT0jUQll2wIiNNnpFwp4B5MCOZQ1OpxMlmpFAmqXq\+eTNW7\+Ikt5XIkoOS8de9HWeFajVqupjLkDBp4IiWt\+oMV13ONMZ9punWpZ4EzeYLmRFDLKgYiXc5UeRcXdE15HqqZ2FAwocuZai4y5IkafBGrkygnqaFgmSMihWSF3ME6j50hIllSIllTJG6xTxglQzTFo6S4nOZ35wWOFFnPZMnn6uc5UmQ9J1guRXG7pz7mISIiRYv5BhMcI1D1aELjfFw4xIrCaLeyprsZJ5mJiDjGrmjRSEVwGBLhwcTo7pSsliQuFb92FwgAAAAAAD79rrsAnCuHgmV5pVWKc05\+\+CXW5ysFPIOhUMmd4BzTbKfktLRs8MXq/KKBiASPKeY0JSQSSJ\+Q6GQt6huMKiZXdoryLHEGb6R\+cr13BpRcJS0bfA6DklX9PiUnmrjooCt6WTvBFI7VufjJCTMTG3JJxbEqrKxnOfPogMuJlG53GOw8k8kyLjejkBYJlCSpqtBIHPWIqt3FxSJmOVPJ2VmPUs14zEq0lFOIiASRDYUvqwDL5Wi4Iobq3Xw57FHJz4m5cjKjK3IlndGjocEkR0SM6BstoQumqSvAoUnnSs\+l1GBIzYnWRFALBvRoxJKLFX2i6vRbwwGLnSPiSJF1hWc4RZeJySXUpJ1LRLnxOVxODqTjs70IAAAAAABwnbveArCcKadyjCdqHk2/REQkmAN\+UzxYkrKsY5qaICcY7ZwajyieiHW42MjZLV775GZKVkvzlljIFPcr3liDX1E8Ps0dbQiIBpLLQU9RmXLRpg\+h59LlrGB0CpRLaIrbGndr/pApkrAKyUFP1BCJ17kERskMefzVKeurgssSCpguHbGSUYOx0V94s89X9XlUR6QhKOrJwGDEbk0ERqZ/K9KQJ2yIxDkHR0TV7FSDG6sAExFvdPtYl6BL4aFwmvEklUCknOK4hMvs4MwuIsqq3ozmD00um8u5SjQ0lOJJyVUyaT0SGrRzpOQqWdk0esIqUkwJR7UsbwpGGr1Og5LRFCLObvZFzN5gKRYsusRSJFnvEQyCUM0pRBzDUyWaILe77BHLosvAyZVkzpRI1KHwCwAAAAAAl/sUBODnn39\+69atRLRt27YHH3zwim11JVeVOYNon1RXZASHQSAtI\+s0XTYSLJGYHgwqd9\+kzmk1ulwmr4/1iMZJk5A5JxeNkZJRImTw8AwncCHvgC9ccsc5h6LnFMYhTAioilx5rK3/sSn2x3x77OdqJlXlnZzAMby3Pu7Vc4myIpgE3mD3WP3xwVBMSwbNiqwrnIGfalY0bze5XOPuAebKE5oJ5qCv5IuW3UolkjYEgiaOqlmpwjnN/GVdTXFinJdXgBkxPEcOVzPRQU/KFE6yjivP1eZN4Zh1uJ6sZPRUWne5zQ6OiMxe3ji6LSPYzYGY1UmlgL8QUUiR9RNdesalCRwRMYKLSyXNgsAQ6Zf2xtktsRQnJwekjDkUYXlpKBPGncAAAAAAADC1T0EA3rp1a1dX1/APHxaAiTiaOotxzIfdT8sILi4mcdGcJiXVSFj9xvdUdpklmahzjWXaSiIwGJZ0RdZPdFHGnec5IoVIUX0ulRQ9fUJPefJRjhGD9RGPkYg43vjk8Q9bBEuuJtPkDBl4uRT0KamcLmerXYrmEVWOSJF1JTvkSpCSq57IMV6xzPNGf7TON9M1n0bHrBRFN9kdTMhTSAWtYqoYTVHUNf12SjUeLkrZSkZW/R6VBIOdJyJSZF3wWoMuQy455A3rbi8T9ReFGEvRoWBiZPmroLufiDgHG42YMjFVGrfel5Kryjk9lSxnR65HOREn3mHx\+8x2l8VOpEjVHM/GRorSo2coOeCJEycYpruIcroUCmicXMkqn4I/0gAAAAAA8Im4ztICwwkGXilL2arPbhz3ui5nKzliHJfdPXs5TjC5fCaXr06Wim53KZKsuHyXzpLRE7F5SM/GBrwpSyJmlmODnpgxlqgTeZKlQU\+Qwon6CUs0z4CSLacVg99hIN4YTliIKgn/QEysj3uZpH8gzNclIxaB9Ex0wJdhk1MtyJyJT38P8MiYSckqPn8lEB8dnoskbzHMGS/r7NKJMHiDnDNRyRHrJzVmZ8NeQyZRyjgsHgcjS0Wvr0yimWRdSZf8IVMy0pgKXt5LhUQzP/JsJz0ZKcazDMdRJqFRgPM7Ry4Hx49LthwpacUjquOL2IqsK\+LoESm6fOkNWR/um3daUAEGAAAAAIAr\+xQE4G3btl2aAv2hjXmH2WUvxcNlv9M4dhtwrhwJa7LTKtoZmvoeXT2bHAonTYHwpdm8DG83OQQ1K5NCk6rKei6j804DTwbBa/XHBwJhczJsJllXeJMw64Wb9Vy6khOMzkt1ZkXPZhm718BxBneIi7uLoaQx6mbkrM4JU9Sx5azu8NYnI2PzmSc8Bon0bLIYTuicUkln9EhokFfIHbR67OZQ3ChnFF9qYncKEZGc0WSF4YjhiIhjHC6jElaj6Uo4Rv6EhZRqKlV1Bus8bpMo6ElnSXYY5HhBDFT4S48skvWcYEkl6xyi0UFEVE1HB1OcJR6lcEj3\+/RwrCx76jyTJ6sTEfFOLjpVBXhkgBk1GKx6gxYhVwolTNG4UUAFGAAAAAAAZuBTkBYefPDBD5/5fAlvDobNyXuLolgOhTivi8km1XCodEg2PpmyODiaJgAzgsBk4kPeXCXot7icjJzREhElnjUExMun3erZTFWKD7niRERKjnLZIXdqeIqy5nGpgmiNRSwzXoepmk5Vede4RYzlajpbSfoLEk9EJMu6EhwQQyRnqlluSEwwYqAu4h19QpJSTWdI8DL8tP0zdndd1E1KVsn5K4HQWIGa4w2TtuLsRofCUJbknC74WLedhicv807Wxw94k8ZIss7nNBCR228VFV2KKTGnUYqW\+QjrImb8E4MVadBzqRibK8fCxVjOEo2xjmyROBI8dQm74vcMJPxc2GcZ/62Boug5aYoKsOy4tFwWcYJJdFnsGS2aHHkFFWAAAAAAAPhQn4IAPEuM4K5PHSkGgqXHvzHwOBERLVxp\+WHE6h27aVY/\+viA9fGxbe77oS3htcZiFIpqIa/adZ7mLDQ4XaaYxHmneKaR0ZvgvZNfrKbDA37ZmgxPWFlKkSthbyHOT2yrUDZLIz3IlVSGnN5xMVuwxDKWyd0rWsw7mPI3xNwTJi3LkhrLGALi9DOZp1CVc8QLlx\+XwelviClaNEl2X13MbSSq5ohIITlb5bycN6Ok0lWv08BRVQoNBGTWJ2tx2Rx0MbF0VZky8cvleLgYiuvOYF08YhaGv39QiMgguOoSyXIkMOQMK95wXXg00vNi/fh7hmeCF7mInRGIyMlGwmTnpvmWAwAAAAAAatv1F4CJiBFcdXGpbuoHwfLmcHpueKp37O66mHv2e1Mq6XRFVnQppdsvr8TyxmD0iotg8ZaIdFncHd9W1tLpqiJrySwjTlhiWpfTqt9f5v31HsfYMl0ZqZKRqjIZueFAmSvHYqV0Ts\+mK\+ksRYKDdjvjFFmPQBzpuVxV4aZdWYqIFFlPJ4oBmQ0GLZE4E/QOiAlLeJsxKZEzZPYo1WyOcfltHtKzcSWXGntgkpKtZBWGODPvsEQki/vSVGdlXDoVzIG4zZcpZzgDR9VUeDA0uozWtATTtr9gZEnxiCqn6DnBQkTEm0amu3NGh6OqKNVsVkcGBgAAAACASZgP8oOz2uDM6bfvuuuuj2k0Hx3D9H3SQ4DfFUuXGv/t32yf9CgAAAAAAOBj8eabb95y622z2uR6qwDr\+txPegi/Nboi6xyPW14BAAAAAABm5HoLwLWE4WbwVCcAAAAAAAAYhvohAAAAAAAA1AQEYAAAAAAAAKgJCMATKLlySqpMs4BwVVb0cU2r8rQLDVdl\+cNWM1a0RGQokanOcoDVTGIolqrMcisAAAAAAACoiQBczaZLqdTof5I2ElzlcsQ/4A8MBoODweBgNKkpVJXCQ8HY1AFYlopu50AiN5yBq6lgQfSp2Smb5sp\+9\+Boy\+GHHuXD6YlZl2MErhLyDERHM7AiDYqC7HD2i05ZsBfGNp\+IIz0WLMazU78LAAAAAAAA07kOF8FS0kMul5qzG3hFzyrGWIJN\+Ytph0kUiORqIkWhVINXYIg3B6JmIlKyqs9dzNgt3kwpEq9muKJbLBIRcQZvuD4gDn9HoOcyVcVpGX4Sr5xWQrFqlle8LuWylkREHMeMPVxX1rMKI3LjFqzKlcKhUo4zuFx6Jlr0K4wnZHVxDO\+0RBN1TqUU8JXGbV7yi4MJMtj5sQ4i3nxk5GgpmyVfsjEs1sJ3GQAAAAAAAFfvOgzARMQ5zNFEvStX9PiqREScwRu0\+h0GyqlZT\+lSMyWrBgKlXK6ScVqTHop6iy/JzH3R\+riPkQIDvqzZ7byUKqvplC669LBvyB0wJf1qh2L4drQh4mZSwYIvbXQ7DUSVVKQYyzA8VdOZqhwakjg9x5kDnkqWDF5hXAAWLMGoZdKY5YyucMaR3Msx3LjAzAmmULTe75gq4irlsKcof\+QzBgAAAAAAcN27PgMwydW0VCa5mhv3mpIrp1KaTGO1WU4wilzFnzPG42YlOZjg2SMJCgeLoRwlk4ZQwuIYbaqk1VjW4PdTLKrFguWMw/pGsBIIDPpESmeMkbjVwRGR0RVocBFRruTPlNyhOo/AEFUzETUjM/HwYJJIyVVzDjYaNKUjQ7EMI/CkyDqJbNhnzEgVcpgFjogYO1WiwYEYGfzhOpEYh9MgcNM98YixO4wK/3GcRAAAAAAAgOvKdRqApyRXE/GqI2B1CwxRNR0dDMSqikLcWc0n9itkiklWl1CVxcL9j\+v3PdfovVRxVbRoQD2UNQeIOM7gjVrddgNlyy6htGMPtd5n4kknYohIzqixmJYj4kVGigxJxDhdxlSCAlGrqOiCk0kFhtJOI0\+Gkag8Qs\+lhkJJgz9m5omIMwfi5nHjNnu9ZZ8vHx6\+31ihbKaq2A0OfvR93hTCA4EBAAAAAAA\+zKcgAD///PNbt24lom3btj344IMz2oY3OEWzK6cJVCUiUiqxwECCNzgcBiVRDPF1YbfR6W9M\+fVsfMDlr4oeg0xmXip6w6UUZ9z8BCOFBz1p1u8zu50khQYjWUMrP9y1Lme1WFgNx6uCx7LLZ8wmVc8ilV9mCkTqAnYmm9YkeWQUnGB2uXTea/XZq0F/2RNhHT6r22UkqmYSSkwaWcjK7uZ8TtbvLo7d2UuMGKqPuI0jRyPWJVKjh6ZoEc9QLtgQduGmXwAAAAAAgFn4FATgrVu3dnV1Df8w0wA8CWcQXUw6Yw6GjEnfkHTp9VwpHNZyZHD6rGJiKBA1eIN17nRJdtUl/ZVkrJRMMk4H6wrWJzxaOKgNb5SRyjJviaUtTlnxBirBhC0UqUhShbcbSDBGkpNv7nUTUa5Eiq5wRtE1XKo1ODx1Yc\+EZh6fJZHSvLE6N1\+JeccNcnSokYgmBqwifzUnAAAAAAAAAD4FAfgqKJmy350fXgXaT0REgmDgUlo2x6RzjNM\+nEIryZAiOVi/oBEZRD/rzpVzUimV1HLZYs5OxBt9foudI\+JMTmHs0bsCz6QTajClKrKeyepZl8ZzRIIpLJoziWJM0knRMxmddxgEjniHxe8z86QruYqU1T3C9HOVBZPXriakqstZScmMe\+KSV3K2HE/pziBDRKRUY/5CiiciIt4YiNR5p1wfCwAAAAAAAMb5FATgbdu2XZoCPcNNJq8CTcTZzS5SopFqmow\+u4FIzyWVkGQMxc3ZgKYQcXY2HGNJLgXSVXfQGrBrAY\+a9ljEybfXMnZPXdKvZ6SKQuVgSA9GLDxndNoNREQea9BRTuequVDZ4WAEJ\+sTjUSk5CpZWc8kNFm08EQkl4OeIcluEgVSslpSYZNxzs4ZXX5TNKTExWrWybrt4/er59KVHF1aI9rgi2IKNAAAAAAAwOx8CkLUgw8\+mMlkMpnMDOc/K7KuEMNxE1/lTR4vk4xWBK/FwREplXhEcwS5yTlTKklkFO1TnxaFaHghqlyq6PMpqSyRomdiRY9nKJ6tEhHJWtRfjKaJiORsJewdjGaqRNVMqiL4OTFblnIj9/3ynMETsIbD9SG/SRgdKudk/YIWiJIvYOYn7LiaTulKTotLFQIAAAAAAICr8ikIwLNUzaYrMm\+87LlB1VymqpCekypZhYgzBRKNUa9pQkzOlcOhit3PTXefLccxDgcjp4Z8Ps0esvocRBzjDNRHxErAW0zlqum4EufZoMfAETn9dbEAk0xUcplyJMl4vRafWA2HSlllmoErlVR4KJDQHUI1mdTksTf0nKREZXM8aspElGRWv\+pTAwAAAAAAUMuuswCsy5ISjFSdPpOdqrmcLg\+/rOiJwKAvZYqnGwKkuMVCNF0lzsARkVzNKsRxejal\+NxDSQcX9hiUXCWX02WFOLqUonUiIsESDpszCd0Tb4g4dUmqygrD8UZPpD7qM3JUzWQNwbDFyekKEXEGMdAY81SCPoXzW912g9PPebKKP1KSiWS5EvYWRLHf5Suls1o0WBDt\+eVRCiRtqWSdmBwSxUIgomZknXLlUEATfKzLbY369ZBrIJiq5nLV6XI0AAAAAAAATIn5ID84qw3OnH77rrvu\+phG89ExTN8nPYRPjK7P/aSHAAAAAAAA8Fvy5ptv3nLrbbPa5FOwCNas/I6FwKqsMPzkydiz7kQhA/fhzQAAAAAAAOBKrrcA/DvGwF\+D5Ir0CwAAAAAAcA1cZ/cAAwAAAAAAAEwNARgAAAAAAABqAgIwAAAAAAAA1AQEYAAAAAAAAKgJCMAAAAAAAABQExCAAQAAAAAAoCYgAAMAAAAAAEBNQAAGAAAAAACAmoAADAAAAAAAADUBARgAAAAAAABqAgIwAAAAAAAA1AQEYAAAAAAAAKgJCMAAAAAAAABQExCAAQAAAAAAoCYgAAMAAAAAAEBNQAAGAAAAAACAmoAADAAAAAAAADUBARgAAAAAAABqAgIwAAAAAAAA1AQEYAAAAAAAAKgJCMAAAAAAAABQExCAAQAAAAAAoCYgAAMAAAAAAEBNQAAGAAAAAACAmoAADAAAAAAAADUBARgAAAAAAABqAgIwAAAAAAAA1ATTVWzz5ptvXvNxAAAAAAAAAHysmA/yg5/0GAAAAAAAAAA\+dpgCDQAAAAAAADUBARgAAAAAAABqAgIwAAAAAAAA1AQEYAAAAAAAAKgJCMAAAAAAAABQExCAAQAAAAAAoCYgAAMAAAAAAEBNQAAGAAAAAACAmoAADAAAAAAAADUBARgAAAAAAABqAgIwAAAAAAAA1ATTbDc4c/rtj2McAAAAAAAAALNyy623zar9rAMwEd11111XsRUAAAAAAADAtfLmm2/OdhNMgQYAAAAAAICagAAMAAAAAAAANQEBGAAAAAAAAGoCAjAAAAAAAADUBARgAAAAAAAAqAkIwAAAAAAAAFATEIABAAAAAACgJiAAAwAAAAAAQE1AAAYAAAAAAICagAAMAAAAAAAANQEBGAAAAAAAAGoCAjAAAAAAAADUBARgAAAAAAAAqAmf4gCcS/oEhhE88dwnPZJrIxt38wxj9yfly95S0mEXx3BiWLr8vRl2nvDaGcbuS1wnJwsAAAAAAGDWPq4ArGSiLo5hGIYTw2nl0ouRkRfd0axyxe1/y2Qp6OSdAWnSoC4dxShOcLr9kdSsBz9N/zOUTYQjHepCb9An8kSkZBJBj2gXOIZhOMHh8oUTGXl4Nym/ffxwGd4ueoPxtEx2d9Dfzp6Nh2NXnaEBAAAAAAA\+3T72CrCaTqQyw7lPyaYSkvpx7/BqKJlUMtM/fTplFy5ZtmzJkoWsev7Eoe895vZGZhcjP6z/K2\+cTkQT59klfr9LIJKlsFu8f8dLR8\+ep/kLWwWlq2PP4/c7XcHUuNru/NYly5YtaZ1P/WeP7tvxDY8/nuWcXr9nvno0GpVQBAYAAAAAgJr0cQZgjmjOfFZNJ4YrpkpOSqTVOQvnj2uSS0W8op1nGE5weIKJrEJEcsrvYBjBE474RUFwRzMKKdlkeKSdXfSGkxMqsLIU9bsdPCc4L\+VSJZsIe10OgWM4wekJJjIKDZdzeYYRg8lk1Oey87zd5Y\+lZcrGPcLdj59Qqeupu61TzkCe74kkJSmdzsrvv7J5GUtjh5RJBD1OO8cwDG93egLx8Tty\+iNBj0NwrNv6R5P6z6UiPrdT4BiOd7gDsfTlexxHySTjkso6vW4nT0omHgp39NPC\+3Yd71Ny2UxWLr793Nr56ol4bCzYLgvEJUlKZ3J9x5\+7bz7R2VQynSO7y\+uaT2eTcSRgAAAAAACoSR9nAFaItYuuhaNxMScl0spCURTYkfdlKexxP7Yva/c\+uSsgUnLH/e5gSibiOCI6n4qEU5zL47LzcirgvvfxfUcVx31r3Xxm3\+P3eoIpeaST81I4EM1wdoHOn9j3mD8qyaRk437f4/vSgjf8pN\+RfWnH/d6QJBPHcRwRHY36A7Ecb\+eVsx3f8wfiGc7p9a1cSERzlq3dHPQ4uOmPiBNEt1MgUhVZUZRMzOu6f8dLJxTnfWvvcygnXnrqG55AMje6o0w8HM863O4vtk3sX04EvI/tSZEnvCsgKoeeesgbTF4hkuYyUkYlwSnaOVJyUkLqJ7Y9EPY5\+ZExOXzR9PvFbMwjXLYt73C5nSyRIisKEe8QHSydT0u/W9PPAQAAAAAAfjs\+5inQnN3lnN\+fTkhZJZdOSLIguuz8yHtyOh47qrLtoWgk4A/HIr6F1JWMp\+XRAOoMJZLxaNBNUizRRbTk2/FkIp5Ixr69chmfy4yFODGcSCaSqdja\+UTZVEZWiHh3cPOT0UgoEAiFfK1E2XQmpxBxRESswx9PJRPJZKSdJTWTypDD4/c4WCJBDIT8bvv0AVjOJKPhxFmi\+Q6nncsmY8nzxLY/mUwl4olUalf7HOpKxFK5kR2pgjeWSsQi/9f9/2V8/wLHuwKbn4hGQwF/KOxfxlJXOp2bNpIqcjbXT6zg4DkiyuVy/USCffi3UbwgTDVoJSfFw9GUSmQXHQIRxzvsPFEum5NncOkAAAAAAACuM6aPt3vOLnpc819KJqQ0n5LOC6LHKURH3pOz2RyR2rHhNuuG0fZzslmZHERE5HCJdo6IFDmblYkWOl0OnogETyTpISKiXJKIaI7TLQocEW\+3C0QZWZaJczgdFA8Fxce\+MXLHMavIo/mXBIdT4IhIsNsF6pBl\+cPLoef33X/TvrFf56wMBj2CnEpnVWKXuV0Ojog4weEUqKMrk80pIhERzR8Z8eRTwjscXCwUcj/\+UP/IS8MF2qkpSk4m4nieJyLiiGOnaznm6ONt1sfHfm3985DPyRERx/E8UW4mhwwAAAAAAHDd\+ZgDMHGC6BHn70sn4vFMbr7ocQryxAbssm/HQp7RCiYnOATKEhGxHD\+pqjl1ZZYbmXA89raSjvo8j3fwK594MSZSJhrYsG/CDGNupCl3hbnOk7ALlzgFjjje7nR5vF6PaOfoQ2\+k5fgp95CN\+72PvaQs\+/YPox4\+Fw889L2uGY\+DExx2no7mshlZcV\+q\+ipZKZUTRr4vICKi\+a1L7DxHnOAQ3V6f131ZEFemO50AAAAAAADXrY//OcCC6BHnnH3pqX1dnOgRx83VHa7ZqgoJosvlcjkFjkZvnx2PG26Xy2ZkhYhyyaBHdHmu8ERcOStlVJojer0el8vJKwoRzbDkOU0hdngRLElKJeORoHckaPJ2p50lNZvO5IiIlFwmnSOa73BMOR35Uv9yNp05T6zT6/e4XU5heGRXGB7HCTyRIssyEZHg9IjzSe2IhOKjS2vnkiGv6967He5IZrSb4UWwJCmViIX949OvIstEHD91MgcAAAAAALi\+ffwBmBNcHnEOEc1xTci/xDu9niUsnYgG/OFYNOAR717uj2Yuz4KCy\+9dxqodIZ8vEPB5fTteOpodvpt1arxgF4j6pUQ8Ho8EI2mFSM2mUlJ22icwcbzA80Rd8VAwnJhiBFNv5PAGvAvp/L6AzxcI\+L3eQEc/uywQdF2\+FtX4/g8PtQgsqelELJGIhsJJmYiy6YQ08iTfKba1C3NIzWWGbxO2u0PBlXPo7L6HnA6nKIpOh/3eHUdVdok/6L3S8l1EREoum5WJBLvAz\+wQAQAAAAAAricffwAmThC94hyaI3pcE4ujvBhKJp9c65STjz8UTJL3uTdSUffl8ZF4MRRPPLHWnks89dSeDmXZ\+ucSkSmWPL60P6c/uL6Vzr/0\+Df8Md4fjz95X6v8UjiS6ilPt4ngCgTva2XPd3wvlszKMz0wwRNNvrj5PiETf\+qp76Vkcf2TyURgdHHm6fr/iaE96F/C9nfs\+IY3IntjiV3rl1BHNJzI5qfZi0N0sJRLp4eX/eKdgUT6lSfWLuHOnjh69GhGcaxc/\+QraSky1ZmbSM5IWZXmO8UrrPMFAAAAAABw3WI\+yA/OaoMzp9\+\+6667PqbRwBSUdNjV9nh62ZNSKuD8CNE1l/SJ9\+5R1r6Yjl/h6wMAAAAAAIBPhTfffPOWW2\+b1Sa/hQowfDScw\+NtZ9WjsXha/gjdZFPR5Fla6PaJSL8AAAAAAFCTEIB/93EOXziwjD0RDcbSV/sAo1wyHHrp/Pz7wqEp7lEGAAAAAACoBZgCDQAAAAAAAJ8\+mAINAAAAAAAAMDUEYAAAAAAAAKgJCMAAAAAAAABQExCAAQAAAAAAoCYgAAMAAAAAAEBNQAAGAAAAAACAmoAADAAAAAAAADUBARgAAAAAAABqAgIwAAAAAAAA1AQEYAAAAAAAAKgJCMAAAAAAAABQExCAAQAAAAAAoCYgAAMAAAAAAEBNQAAGAAAAAACAmnB9B\+BqJjEUS1WuTWdyKewfTOX0WWyiVFIxZUabXKllJZPW5AmNq8osBgEAAAAAAABE13sAJpIrYe9AIFmZNjHmSj5Hn93ZL4oT/nM6ZN45mJLHtVT0TKaaG\+m25HfII1s5Zd5eiE\+ZXZVqMlaSsjMJwNVkrCRN2YlciQUG3IHSyK6pEvcVvFENGRgAAAAAAGBWTJ/0AD5WBoevPkFDwYSWcxnt3NSNOMEUjjV47cz4F5WM4vWPlI6V/3979x7jRpXvi/5X5dfqV1yQEHv2uafb2tJ0e6STHm9xOvjqEMZn77TG5xA03jsJeEiOMBAN5nEZQ6RgQCQmI4jhKmAQkxjEw0jJjHnNeJRwjkfJPWPSXMmkL9qmc6VxG2muu\+fswU5IUu6Hvcp2Vd0/\+pHudOfFTIZJ/P0of/ixatWqslvK179Vq4pKOMizJT3/hZ7xTsQk0Rcyk90QTXb67QKV6kG/Mte3XspUg\+HmbFjlVPxCo8BkSprfmeiLdoTdIs/zcLRJdoEREdeLOTWT1VhouuQWZ7viekkWfI\+b\+P9scKeB5evRcNPtt3hJSeQEX0S8wNEAAAAAAADA8q6zAKzl49VgYmm9V/W7ucxJkoiIiBmC8faAc7b6zUvNsG8itjhQclkvMlNoprnDEktbqFQP\+uveZIfPLpBcD8aIlinCCnZPRyo790xuhH01KdoZdp9faWdOFkvMjjkbmwqkyS7RF580U8wcjbb5XXPtuZqvkt1FPiIiQZL0TLRRdBjyiVp4vi9ZS2eFaKbDKwkEAAAAAAAAF3CdBWDRGezMBIlIlzNVf5TCyXaPJMw89QRVf6wj5Dact82lKsBaKafmZZ3kZlHWspmGZJ\+/CleX881cvlnkC7fV88npYEzltLQCLHqi7VHPuQHwYj0WrqXIFE\+Z0qGaP9zmzisR30TMY45GmccuEhNI1mUSJEayrEvFeixniKY6fPYFeywpRX/jL3QCAQAAAAAArlvXWQCeJecUf6DBIp3u2aKoILlZLFAN\+Kby8Y6Yz7iw3MtLzaBLDtlFh7TgxXMVYL2UbyRiDdnHwjFjMVkL5AyhgMj57I6icd0VbvOeS6SC09\+Z8c\+M40IVYL2UUSJRJVMSA5GOjM/I5EaaE0kGT7AzE2imY7WQe9Kb6Ix6RMkhSiWdiCSJMnHV7jMmPBNJr9FBWiZDoXSn/y9//gAAAAAAAK5D10AAfv/993fu3ElEu3fvvvPOOy/Rmqu5FA9HmvZQm6dUz5QMXrtApBeT1UjOEI\+JkeB0kHfE/XMZWBJ9AWM\+rrJgezpkOheM5UYyrTsYERlcfhaSm4G0LvkomyNftC3oVPPxRiJay0mCyy1Qvp4pil6HyPNKKMRz8vxgllwDTMTspmii3WkXfZHOqFNLBKueqE5cz3\+hM/9sS\+YwxTLtboeBSJ8fEpMMweSKUEnxp7VApN1LjZBf\+fNOLQAAAAAAQAu5BgLwzp07R0dHZx5cKgDrxVQtnBJD6S6vQ08HlXha9QSMjKvppCo7LW6/Ke1qFiXDuaDL9XxG/WxM70lUPckl/SXqoXiHnzUTSS3/Sc2TpUpZ6AtXHREzMcFOaqZoDAcMmaiS8ZDXQcxpiactcyOZ9kX06K9N6bgeTHZ4JOLFRlEyOmeK0pLZS0SyWpSFUKrLv3hKs9/f4NKFl7kqqYlINUNatkTuKziRAAAAAAAALe06uw2S4PB3ppPtXodIJLp8Yimh5GSd5\+vJohgIGCUSJKfJNZs2dTmnBL3TSTv717PWpFcoMVM8bc0kTBIXg8kV2XS7h2slWSe7OZaR\+NnOoMu4//fWfLYr5BaICW6v0U7kcArERPeiS4i1fHLaF2y6Iu0BnyXo1BLpZj497fVMh1PnLdAlUEkNeycW3YTJW8vIAqO5QfLZeyNxrs/Muya7IRBpj0YsbvtVP6EAAAAAAADXjWugArx79\+75KdBXsp1g9zB/bDoSbwRLTRZoC7gWpn29mJjyRXVPuCMTMPJ01Z8WwgnmktRMpCF72nwOgeSZllo2wVN5nbiWyassWi3aSZKoxIk5TG65Fo00Sw5LeCZUczWXUeLRejJPEhPdToFIdIfMce\+kixuCsc7o4suPiXRmN0YTHedXgAPN2ceyGg9zCjAva8Zjqi/Z6SdUgAEAAAAAAL6JayAA33nnnZe\+9HdZzBiImFLe6YDLkk6ZpEXvCQ5/R8YvSqSmo1PhJIUSHQGXUErXwhkxuKix6A60u4lIboTz3BFuDzoFkuvBtEKSIRAQXEEtlDbZiYi0fGLaG9bd4bZsQogHFCIiuZnnxkjElI8LXrfh/FnNnORiM\+xdfBMmrue5McB1mikCM9HlMXmYkE5osw3sBlwDDAAAAAAAcKWugQD8zcmNVKKZ58TzzWSm6Tp/8edGNKykMprd35bMmJ2Slo1NB2K6L94RcFzkhrpzuZSISs1EQpPseiLKPYk2tyQ6A535gCgxIrlOXM\+lar6M5g61h/xt8eK03zMVjLWFvAuGYTfH8\+YrOyjJGIkb7JJAZAzFREmar1QDAAAAAADAxVyXAVjnxWYqyaPRZsllTuQ7nflaIDDpiBgDIUvAZ5pZhopJBo/P4o2Y3JKaSkyH4o0MGeOpzoBLJNLlYjOXaxQ5ORaF5gUPSmrEX3X42jNJQy4y5XNr8XSHzyFKsw10uaSm0oZkotPrEIjIHe5M2auh4GTcZUkl2\+yZaiDSlC9\+HEz0P22mUjPsnYiRXpQNMSJiBqdz5m3R4RQ41\+WiWqL5a4YBAAAAAABgecKZiekr2uAPhd/ffPPNV2k0fz5BOPttD\+Fbo\+s3fNtDAAAAAAAA\+Cv5/PPP/773e1e0yfVWAdZrK4olkhwG6QINuKwWS7rdabxQAwAAAAAAALguXW8BmJjB4bjo\+5LBKf11hgIAAAAAAAB/Q66z\+wADAAAAAAAALA8BGAAAAAAAAFrC9R2AdTlfzxa1Szck4sV6PF4v8os00bl8WV1dNr2U4Yl082L7vCSuZjNzq0lzNR2rJnOLBsmLStA/nSnpf85OAAAAAAAArgPX3TXAi8m5ejBWj6Y6vPZL3CWIy1omztNMTAYW3S74nFI96FXs8c6oWyS5kYzXc/LcW3ZjIGhxnttML6WmA0kxmmh3Ld/XbLNiWolz0eclRsTzVa\+nXrIL0twmzGGKxtvd0sz41HxOLZ27D5NeKqq5nJpNNz/hxneynQGHQEywS1rEN5VLdkbdsz9tMLvBzWvBcD2TsNgXnZp60D2dItFOen5Ud3xfZLL2RUnoc1KpJEYznUHn9f3jCAAAAAAAtJzrKwDLjViwlizqRCTntVESvu8UGFHENxHMa2Mkft9JjIiYGIh1BBg/L3ASEyg\+7YnPPeV6XjbEs51\+u0CkF9P19BcqD9W8qXY3V1MZCiU73BJRSQn4G0W/2TmbsfVSpuoLNh3RTifTS\+lqMNIsLRyk3RhNtHtm70UskCzM719ymaIzfS5VaoZ91ZzD4JQESRKYRJIkOj0Wr59JToPLLlCpHo3Ui0xwe0U5WQvGdXeozWsnyW4MxNt5Upc52ZlWKuqSwzC7R8kQjncGiftCejjV7spOe2JiMm6I\+pW/1AcCAAAAAADwt\+P6CsCSKZQ0hYiIiOeVYLDuinaE3CKVlKBPccQ6w\+5zVU2eFyWnKZLq8EgX6K2kBHz1uceNaFzz/brTk6oGQ0oyfKER6KV01R9sOqId8YCREdm9HSnvMu3kbDUYVXlJK3IeyHNXqD1kJ15UY5FpByMi4iXdEWgLeQzntrEbo6mZNL4cuzkcNy96havpBM8UiWQtldIyxaaDkeQw\+QMGx8Xq0gAAAAAAANen6ysAExFvxoPVRF4nIrmoveudSDgFXtRGZeH7ockUEdmN0Xi7xy4QE5wuA09Pe2NNmYjL\+hejuqVHdM1MFGaiL2R2ugx2RkRaJsYzDkvaa3J4Oux5srOmnG8EPBWJEXE9z41\+IiKSc7VgWHXHOyMuNeydtIc7wp7lJxJzWcvLYsitl8jkyiu5EnE7MYchFLlABZiISs2wdyK2JLtyWS\+SMZlpk5K1eF6wS8RlnTvMkbDZG\+zwElFJKeYbgUi7V7rEPHAAAAAAAIDr2PUXgPViSQgmuwIOyiemw3lzImLMx6ajsiUeMdvletCvzExIZg5LNEZE5PXrcq4eDla/6DEmM50\+h0BEcpaHYk1/rN0jkZyphWJqya74PQqR4Ay2x9wkOU2JBVOgZ3YuudpTOSLeTAZqKWZJsnrAo\+SXLHLFXOz//K/LjX1BBZhIcPosAffiCnB6mQowz1W9QY1IdIc63X/WuQMAAAAAALieXQMB\+P3339\+5cycR7d69\+84777ysbThRqR6NqVLEIDHR5TMxX9UvCanA0pZqNlENhFVH0PJErh4KKc6kmdK1QLAhhTvcdoFIk7kQTK3wOxqBkBpOdrgl4sUml7Vcps4lolKztCjiaplINZQV4xmL267ZEya7w8CIeJ77As1QusPLtGKJKN9YMhTxEhXgS9CLmXpWFuwSEddLZPB6jcv3xJvJUDWW1fJf6Mw/mSA9P6oXPc2ZRbB8Pip9oad9kwlJ9EXbwwvnYAMAAAAAAFzLroEAvHPnztHR0ZkHlxmAOW8mQjzvZimfgYiYk8WTmt9fjTgs57IqV1ORaiTRLNmNkWQ7S/GobHAR97t5vigEk11R78xiUaLDbZQD0568li/qeU/T7jRFQyIR5ZI85bCEvKZwTHTNFmbVTLQaTKjcbpYkgZjB4VgyOGZwOKiUX/iSnkvWIik1lxeigQmSDE47ERGXde6yRIMmiYjYJaZAE5HkEO1FnYiICQ67wEjLxadDCY1zPfeFnvVM2JngCrXH/EZ/fIVfrge93HmBRbDcCawCDQAAAAAA15trIABfOT2fVErMIKWrbiefqYjmZTESa3M79MR8Kya6fZZYoN1RVILBasnblkwIicB0TjJ6nOR0nFucmSRTKGkMFev\+kBoImxxOo1OuM0n0BYVEkpxuo5yYDqQs8aiJJ6qhtBiJmWKxKxqw4PK3he21HDeGA2o0YwpFTSxbT3Gj3zO3YjMn5jDFUh2\+pVOgi0o4qkpMlOyix7HoLVewKxMkKil\+fyOQ6sA1wAAAAAAA0MqugSrf7t27\+/r6\+vr6du/efXlbCK5ARzJmdjqM4dSKbNaaTbf7HYLdbXIvTI9cy\+ebieCk01eXwh3pEMUD1WRRkFyWkE9PJlR5vmGu5vNUU0WNFxuhQC2R02del5xmL6\+H/ZP\+hBgImuwkOAKd2XT7Je85vBAvqXmZ2FzatrtNzmI9Ga96fbVUXjvXTFZlJkhsmZ6ZwxKLt7tZI\+qRPYHpcHg6FJhwuqcz8tK2AAAAAAAAresaqADfeeedl3vp73m4lopWi3YiWcuWyHP\+27pc0p2B9lzSwNM1n091RTqSxVqUBHeAuQI8kTOEXCIRMafZb5\+KxAyspEv\+trDXQMUGEREz\+IKGREiIJttnls4iEhijJYteLYNJosspMlJJ1rjTFPKILEdERJIp6Fc8IdUX74z6jHO5WJeLGrebHNLFOxW9wbawW\+R5Xgyqlx7DZYwTAAAAAADgunENVIC/gdkIykRfuD0a7YhGLG77kkbM6A1YXLwR9k564xROdcX9opwnu0OU7OZI1JQJTAbi9RInYkZ/vCMWECWHwVlSfAGlyImI5Hw9mTOEfHo0VMuW9CsaoeRuT8TNTjsxF0sk2t1zk5O5rJbslrCHsmn13NpaXE0lNIff6PiG5\+OSrmzwAAAAAAAA16LrMwAT6SQZQ7G22cKs3RiOtXklgctaic9WPuVs1eOcDKV0T7Qzn\+30OUVebCaLgtctEpHkYskUs2cb2ZJOpXosVAuFGiW76Pa3peJmB9eK2Xog2CCX0Rdqj7qbfvdkKNU8l1gXDUYr5uqZbFMmgdEFZ0dzTqWsEgzVS3ZjMNERIu7xTMUzKufNVLiakCwR76UWZJbVWGDS7a64fTwjk5yZ9nkqbnfF7a2lPmkEPRNud8Xtngil1PlB8rldc06ciLieyzaLssCWm2sNAAAAAABwTRPOTExf0QZ/KPz\+5ptvvkqj\+fMJwtlvewjXFV2/4dseAgAAAAAAwDI\+//zzv\+/93hVtcg1cA3xFENgAAAAAAABgWdfrFGgAAAAAAACARRCAAQAAAAAAoCUgAAMAAAAAAEBLQAAGAAAAAACAloAADAAAAAAAAC0BARgAAAAAAABaAgIwAAAAAAAAtAQEYAAAAAAAAGgJCMAAAAAAAADQEhCAAQAAAAAAoCUgAAMAAAAAAEBLQAAGAAAAAACAloAADAAAAAAAAC0BARgAAAAAAABaAgIwAAAAAAAAtAQEYAAAAAAAAGgJCMAAAAAAAADQEhCAAQAAAAAAoCUgAAMAAAAAAEBLQAAGAAAAAACAloAADAAAAAAAAC0BARgAAAAAAABaAgIwAAAAAAAAtAQEYAAAAAAAAGgJCMAAAAAAAADQEhCAAQAAAAAAoCUgAAMAAAAAAEBLQAAGAAAAAACAlmD8Btt8/vnnf/FxAAAAAAAAAFxVwpmJ6W97DAAAAAAAAABXHaZAAwAAAAAAQEtAAAYAAAAAAICWgAAMAAAAAAAALQEBGAAAAAAAAFoCAjAAAAAAAAC0BARgAAAAAAAAaAkIwAAAAAAAANASEIABAAAAAACgJSAAAwAAAAAAQEtAAAYAAAAAAICWgAAMAAAAAAAALcF4pRv8ofD7qzEOAAAAAAAAgCvy973fu6L2VxyAiejmm2/\+BlsBAAAAAAAA/KV8/vnnV7oJpkADAAAAAABAS0AABgAAAAAAgJaAAAwAAAAAAAAtAQEYAAAAAAAAWgICMAAAAAAAALQEBGAAAAAAAABoCQjAAAAAAAAA0BIQgAEAAAAAAKAlIAADAAAAAABAS0AABgAAAAAAgJaAAAwAAAAAAAAtAQEYAAAAAAAAWgICMAAAAAAAALQEBODLw/MxNxMEVzjLv\+2hAAAAAAAAwDdxVQMwL6ajfrfTzgRBYHanxx9O5kpzb5ayiZBv5k0mOdxefziV50REciboEBZhdpc3GM\+Uzs\+eS1pKDrc/nMzJVzjOUjrgkDyxPLItAAAAAADA9ct41Xrm\+bjf8\+BvykREtp4\+Jo9\+8t4Ln7yXSv86HfdJuajP8\+Rniu2WH/ofcPBiNv3b9z77bY7/LhvzzHVg6/u\+Q2LE5VJ\+9Ivfvv5gJidnM2EXW7orW9/3HRLJxS9Gxz5774UfZ4uUSfodlz1SOZ/KjnHpzz1gAAAAAAAA\+Ft21SrAxVQk8psyWX\+453df1UrFfFGuffXrB/poNJ3IFOViNpVTqO\+BZDqdiMeT6Uz65Xt\+dJfHQeeKsLeEktlsNpvN5Yvy//fOj6ykfJZKL1uknWmZy5fO/us7P7IRjWXSuRIRyblkyDtfYvZF00VORDwXdQsC84RjIa/Dvvbxp2\+z/\+fXR0n57LHvtbnCWU5yPhnyuZ0SE5jD7Z/dCgAAAAAAAK5xVysAl3LpTJno\+8FI0GOfKdoyuy\+W\+epsKRVwSpLdIRGNZhKpmfnKkjuUSCXjIY/9In1aiC1T/l1Acnq8LgsRlznnuZjP8\+NXfjvK3Hfd5XHIn/3mSZ8vkpWJGCMLKdlENCW7vP9483/8b4EfWInI9oN7ngh6HTwXDwRe\+U3JGYy97Jdy7z3pDyQwNxoAAAAAAODad5UCMJdLJZnI6nDZpQUvM/vsU4cvEr2rh0bfvfcfbmAOt9cfiiWzi6/x/Szmd89wOV33/qZCVk/A67hIAualbDIazyhEDreT5RKJTypku\+uXmXQymc6mn/g\+KV\+kEll5rrkjlMykEtEt//zfAl4HkcXhC0eCHjuRwx964uVYNBIMRSM\+G1Xymbx8wZ0CAAAAAADANeLqXQNMF63WMmcgmXMHkqlMPp/PZlKv/Pa9Vx7ru\+eX6bhfmm1SHv2iPNfc\+oM9yUToAvn3syf/oe3Jc0/7HogEXDxdLBJZXV63nRERc7idNvqiWCzK3EFERA6327lcb5LDZadkNPi9x/55bt9cRgUYAAAAAADgmneVKsDM7nRIRJViriQveLmUSy8op0pObzAcjSVS2WLxd0/cYqHRZPzcFbe37PnXmq7rX/2PB/qIKsWcfOFEbev7/i233HLLD350zxP7/8fvs3HfxSZSz42QLTufWs5G/T9\+4Tey5\+Vf/\+53v97zQ\+vlHC0AAAAAAAD87bta1wBLTp\+3h\+iLeCQxd1ciORsLeP/Lf/6eJ/zJ8YTfKUnOYGrupkiS3Sktn2/tnnD4RzYaey8Sy5SWbTG/XFYmlYgGvU5pZv9OB1Eln529tVIxmy8TORwX2s0sXsrnikQ9noDf53E7GUftFwAAAAAA4Dpx1VaBtntCkbt6qPLbx/7B6XS53S6n439/7Ldl6rsnHLyl3\+11ssro6//8HbvL6w/4PE7Xvb\+tkM0b8CyZ5cwcvkjoFguNxsOJ3GXnUckVDP3IRmOvB/3BUCjoD8S\+IOsPQyG3tExbSbKS8lksFI5l6jc6JKKxbCKVSsbCiSIRVXKZTLak/BnnAgAAAAAAAL59Vy0AE3MGEtnf7b/nFlt59IvPPvuiZP/BXXt\+\+a/ZhN/BmDOQzP5u/09/dAsr/va9d3/zScn\+g7v2/DqdCCx3Xa7kCkQCfaR8Fg0nL3tBZuYIJNLv/PSHLJd45ZVEjtwPvJNJBpfrnjl94eAPeyxjv40nM9W1wfCPbDT63oP/HEo7IsnkEz/sGUtG4scn/qyTAQAAAAAAAN824czE9BVt8IfC72\+\+\+earNBoAAAAAAACAy/H555//fe/3rmiTq1cBBgAAAAAAAPgbggAMAAAAAAAALQEBGAAAAAAAAFoCAjAAAAAAAAC0BARgAAAAAAAAaAkIwAAAAAAAANASEIABAAAAAACgJSAAAwAAAAAAQEtAAAYAAAAAAICWgAAMAAAAAAAALQEBGAAAAAAAAFoCAjAAAAAAAAC0BARgAAAAAAAAaAkIwAAAAAAAANASEIABAAAAAACgJSAAAwAAAAAAQEtAAAYAAAAAAICWcL0HYK5mEjxT0pd7T83nmvKixhr/qwzqW8DVdJyni9pfpDM538jmv1FX1/EZBgAAAACAv3nXfQDW0ol6dtkALKuJ0JQ3VC/NPleTgUl/vHm9JjSeUwLeavLCwVXOTrvsstNVcbsX/XM5zjoDSulcQzUTnfZHGkUiIr2YnPIuaOwJ8PyCM8hz1cC5V7RcfMobrstX4/AAAAAAAAAuxfhtD\+AvjOd5ONoku8CIiOvFnJrJaiw0XXKLbLaFXpIF3\+Mm/j8b3Glg\+Xo03HT7LV5SEjnBF5lrdp1hBl\+sk8LVZEb1OS94jJLLHE\+1Oxe9rReTU4HMuec8p8RyhnDS5CAiEhz\+zrR//q2qL6zKnGi2BzUdq7\+bFJjPFPcZiKvplE6ORjTc4CWtaDfHoxb7X/YwAQAAAAAALux6C8DMyWKJmYdaNjYVSJNdoi8\+aaaYORpt87vmKt5czVfJ7iIfEZEgSXom2ig6DPlELTzfl6yls0I00\+GVhL/uQfwl8GYyVI3llpS\+s1V3nDiRxIiImMMUjbe7pdk35Vzd525Ii/MxL2ncY57vNhFpSMEOv6QmYg1XwOy68MmRMzyaEX8aFXPh6ai9I8DrGbslEWcOpqaC0ymXEekXAAAAAAD\+mq7PKdC8WI/6J0NZYzzV7nUZ9vyuM\+HT474Jd6CaKWlEREwgWZc5EZEs61RUYjlDNNERi3ZE5/9FzE5pac/c66yE4lW/Z8LllJ2eqblJxXopU/W7ZCacZY6KP1YvcT0fn3C4p3MyEZGcmXIy2ZdUiYhITfhkV7ghL\+xaboTdsidUDXpkSTgrOSfCaZUTEelylge9FQc7y\+wVX1jJc\+JF7nXIgZQ6N6xm3Cu7QgtmFzOjP74im7Vms11xvyi5WCprnXsqcMkYSa3IZq2Z5Ln0S0SSyzzXbP7filTUaJ\+JxFxNR6qxksHn0FLhaiSlXmy6OG8kIg3ys0ioI5lkXjsVcxqjZiwyHQpMR3Ki33N9fvcAAAAAAOBv1nUWQvRShge9FZdPIX9HJtnusRNxIsngCXZm8p0RpxpyT4YzKpEgOcSZUqckUSau2n1iwjPhD02HQ5Nu12Ry\+XWziIiopCWTFEp15fJdUUczHK4XieRszeev80B77qsVmaixFKsGk6rdbbSX1GxJJ9KKWY0cVMqoMhGV1ExRcHtEaWG3jCSuf5JsSuHO/FddyQAlgtV0USe5EQnynJOliytyCRNPVoOxBjlMATdlks2ZS3N5sZnKCx6fUTp/rFo\+Oe2P6d6Aaa7cKrqDbWF7M\+CZSuTOvx5Yziru8y8DnvCFm6WZpMs12W7weYRsrBrKGqKJNvcFy79aLlaLfKKX0jWve8IXbhRlnVyWUNDs85pcTCeHyPONTKZRlC98ngEAAAAAAP6iroEA/P777zudTqfT\+f7771\+qrcDsoi/Smc0wlqx63BW3Zzr\+iRrzT7rdFbdnOpozxDKdEY\+B5i9TJWKSIZhckQwYmN0QiLRHIxb3hefmMiJigidocUsCkeh0i1RUS7KWTzWKTnM0aHbaDW5/W9Qv5JLNkt3olvRsUSOu5bLkDphYsVnkulxs5LnocS45\+Yx6vCzkNdrtRm/A4iE1mdNIMkXSXamo2Wk3OL2WkFcsZrUSiR6/kWXr6aJOpBcz9bzdeG6CNxER8VIzHZ32RykQtVCmMbcSlZoK19IuFg/oEd90fEEGZg5TwGeQmOCLdS0sAmfS7WG/QSIiyeQPdUSDRuJiOM68dqKZpbOkuczsr2flmX3rsmRM/N6aCYvM3ZZOd/gc86NqJLJiwL80qwMAAAAAAFxd18A1wDt37hwdHZ15cOedd168seQ0e4lIVouyEEp1\+e0LSpQlxe9vcOnCy1yV1ESkmiEtWyL3RfbBBPtct4wJRMRJl4t6\+RPle23KuWZ9zRJr87gomtFkl5aRBY/HmE3Xc0Wd5VTZYXaxRsg5/cooEVHfTzuyUYFIsDsFaX4vEuVKOie9lOXhaCPzmV4hIiLrD3Uiwe4xe6RqMq36A5RJaXZfm0taOEo1E63FmTmZMTupGfbVUl5T2CVSsZnMaFLU6POZXB6VLQjhvKRlM\+pYWUiFJjNLzlEiaYnFmYua8bDCg23eYs0dFmOpdjeR5DbHUu0uRsTVfJEcEhEZ3G4KBCcjRe0LWfVkuSfInNk697cF3XrC3nS5RTlaTTrbE55r8PpqAAAAAAC4Nl0DAfgbEaikhr0TsYVBjutFMgVpJnHpMp\+dfMu5zjkxIrIbApF2LzVCfmVJh5dm\+2FbNsUc5y2h7BHlZCOf04vM4HYayK5n8irL6HaPwWE3hNNdQU5ExCRRInXZbuVsLRBoSMG2TNLkclAmOBmYmfcsGf1eIZCq591iqij6vIbFodXgjXV55x77vBSKNwJxM8/Uc5Ip4TEQkcM9n361YqoWCDWlUOdXASHln4o72zMxk5yc8iUMiVS7M1/1hVSZq5nodCRDzlLVXyLiajjaSPkW7JMZnM65h672ZGZmBWlzJGBwusQSV/z\+qXzYxGU1FpguSpZExHh9rrkNAAAAAAB/k66BKdC7d\+/u6\+vr6\+vbvXv3ZW\+kM7sxml6xaD2ndJtnfm6zrMbDPF0ikpvxcC09cyVqSU1EquGIki1duOPlCXaHwItqcW5VKC6rJVknEuwug6OkplIquYx2SXS5KJ\+qp/LkchsYiXaH0ek0Op1Gh10kIuJ6KafJsyPUizLZ7cTzWsluDIXNLodIXM3mND67F9HtN9nzzUSiXrQbvUsnVJ8juvwWR5ZHU41kUvdG2MKFr4jUVHDSG9X9ic5kSCzGa3EyxyMmSW4m45ozYHHNhdT6eDMtG0PRtliiK59fkc10pqMmafkIqxeTU75QvcSplKn5gzwnC65gVzbbHnARkeDwslSCLS5ZAwAAAAAAXF3XQAX4zjvvvOTM5/NxkovNpRXgPDcGuE4zRWAmujwmDxPSibnrYL95BVh0\+kzOuBKJGGMRk1Nuhv3VvL8jFTIxh8nF6sm04I4ZJBIdLpHHG1nJGHcuP/V3LM0jSTHioUyUZ8gQd4ksRyRr\+aLudWqZuJLhAufazL12mdPsdyiPvUI/2H/ezXvPxxymSKju8U/bgx1pr2HxmwZvtMsriVRqJPzVODfFk21uSc9GawlmSvrONTZ3WyJRo8z1bIqX3MZ0sCZHOmPSebvS5XyzZDc6XEaK8EiRSqO662WLxy4QaXJeTaXUYknLR2uZPKViFgdKwAAAAAAA8NdyDVSAvwm7OZ6XirnFd/TJSXK\+02u/wEWnkjESZ25JIMkYirVd6b1/JXdbKmWxZ2vuGyp2Ly/52uNBEyMiSfS4aKwkeJwCEUlOo13WucPkXHYYTLjFb\+TRqe98ZyqQEYLxdp9DtHtYyKU99g8VoW0iUjLH4sxbUjw\+nudEzOD1G6w2g99z4QubiYiI5xuJpCoTlbL19PmLP\+tylgc8FYermvW0Z1LtbmomApP\+pBiNM9eiftVUcNIXbWYS9VhW8Lopm2jOF73ne8vFa\+GkSk5zNGrxOgTnXZag1IhHp7zuqUjJEA6bnU5jLNMeKNW8/moOq0ADAAAAAMBfyzVQAb4SeildDUSa8sVbMdH/tJlKzbB3IkZ6UTbEaOH1q6LDKXCuy0W1RAKjxUnVwdLF\+VAoOAJdxcDsY7unPZltX7Izgzcu6fEFm8sXy6rMaYnHOxILX5JMobQUWvBCMj/fg1bM6XYPu/D8Z62UayRjSjSpOgLtuZKxlKgG3JWoxxwKWXyemRv8CpLT6Asawx6jo9RIhCYTiabssSTTbW67QKQVc818VpNJYBU1kxecfmPAIfozqiPanuCiQ24SXxBiuVYskdMvUrGZzTczGa1IatZjCfoFj9/gcohytipzkuzmUFJ0JJr8/PwMAAAAAABwtQhnJqavaIM/FH5/8803X6XR/PkE4ey3PYRvSK91Rj3TaX9nOmRsu4yj0GsrsolqIKIFUl1ht3iNHviGDaZDhzq/7VEAAAAAAMC15/PPP//73u9d0SbXWQWYdP2Gb3sI3xRvzD\+89FHwRtQz8eRnwl3vdIbc4vKbyGqRC3b7hWZH63JJLXHB4TBc/nW4nGuMXafT5gEAAAAA4Hp3vVWAAQAAAAAAoBV8gwowqnkAAAAAAADQEhCAAQAAAAAAoCUgAAMAAAAAAEBLQAAGAAAAAACAloAADAAAAAAAAC0BARgAAAAAAABaAgIwAAAAAAAAtAQEYAAAAAAAAGgJCMAAAAAAAADQEhCAAQAAAAAAoCUgAAMAAAAAAEBLQAAGAAAAAACAloAADAAAAAAAAC0BARgAAAAAAABaAgIwAAAAAAAAtAQEYAAAAAAAAGgJCMAAAAAAAADQEhCAAQAAAAAAoCUgAAMAAAAAAEBLQAAGAAAAAACAloAADAAAAAAAAC0BARgAAAAAAABaAgIwAAAAAAAAtAQEYAAAAAAAAGgJCMAAAAAAAADQEhCAAQAAAAAAoCUgAAMAAAAAAEBLMH6DbT7//PO/\+DgAAAAAAAAArirhzMT0tz0GAAAAAAAAgKsOU6ABAAAAAACgJSAAAwAAAAAAQEtAAAYAAAAAAICWgAAMAAAAAAAALQEBGAAAAAAAAFoCAjAAAAAAAAC0BARgAAAAAAAAaAkIwAAAAAAAANASEIABAAAAAACgJSAAAwAAAAAAQEtAAAYAAAAAAICWgAAMAAAAAAAALQEBGAAAAAAAAFrClQdgeWRi34Fqmc\+/oBYOlEMHFH6RbYiImkN7yy8da3J5\+gnv/7r30dJ/dX\+165k//eOPysG7/vjjNy\+5\+UKaLGuX25Y3Ro7x8gV7V8eO18Y4EWnlY5W3DtWXbcjHpt86UJMvOarR2kj5sge2ZPPySLWwYB/ySOWJZ6bKl9yON0aO188bG5eb8uWcUK4ubVY\+Uv5P//C/Qge4vMwGMyOrHTwwPXb5Hxhvjo3y4WPTQyPNxW8ss/fL0xwbPf\+QiTdGjtUuMKrG4Uf/FLzIES3BxyZ3PTO5pDetfORUcG91tp/y1EvLtLlwn1wlIpKnn/B\+dXDsIt8TbeS1P/34NaU8Iod2TBSW/0Ze/FsNAAAAAADLMl7xFsxm4Efkl2zmFwZnNjb0bljR/cCZt/tXP9RvuMieBgaN\+3acGXqxg9naHnq6fejRChH1bpYet8h7KrONykdO3rtXWzNgoHJ9mFbE7qiGf67PPbX\+8o1OGxEfq\+55QD65adXL25gkV5/wnhrub1tnE4iE3kHrxttMbMFeeWEisld/8l1mY8uMiWTl7b2TA6\+29TDRKulHd5xm/bYtPef9KtAc\+vnpyAH97TdFCxGRYcPu1Y/ftuTEyXzPA2foaXv/4NIfFdThvSffskjRR9okruzzlQ7a2tZ3C6RoJ46rt79uv79PJNIro5Oh52rPvr5yQJrpsD58pLFHqVktgrWv476tbdKy55U3h988\+/LIjfu3MUbq0DPlg/0rH6qc2TNm3f\+z9rlNtPKxyYNH6hVFO3Gseeurq9cXzh7kZuXQtOWR1S8Mmhb2Zxtc\+c6LlV07Tj5G9v1bzcuctkpj\+Jg\+sIlIVobHxTXdzcNvTZ2QiWxtW7Z19rLGkWdO7RlSiUipqIUCda8xWJnArIaBrTcO9BvnOmwc2VHeb7lx/3ba5z8z3m/pthARVQp8fO1Nv3hYOPjoqYMFXSk3TpQNa/pFCwm9W1fFtjFGRGVl347p9e\+uHjx3RrSxI6fvvqe\+/r3vxBYeDlc\+3Cl/SiKVm0efOx0eMVtJo9429uHZw7LIKipft\+q/v9FpW\+asqoUCVRa/Jh8/G3qNtjytf/Ta5LptXd2yemJc30Akj0zseW7K9rDt8dsWff/5qPzgT5XbX79pU49Icm2P/zTt/s6zvQKRYFn2o5zHBEZk7e96qP9U6FGKvbqid/HHcKFvtXz89IM71fveXTVow9QOAAAAAIClrjAAy6OTvzjAK90mduzsrlG28Q4LlZsVrnevM46P1IZkkUmmNf2mZcMm678h\+mKdrOrRcm3fXq17Leul6uEP5Lf6DbcOGpbdZNHm8w96Ol9ImoYKIiMiRVX6OmOvruxn2tgHJ8PDzdtvM9HYRPiByggnIjpZaJStRtn3xwU9ib3bVsW2WhiRXKiO2yy9h77eNabzSqNM\+tDPTxcsRETWvs4tW9tspJWPnNk/tuLjP0j9TB157WR4uG19/9Kzpg6/debjsmZ97qt/fI4qY40vFbb/d/YtfTM5xDBw/w2Ft5Qv5baB2cPQK\+N67/0reuX5Iqihd/PKZ5WpwpB8uCDeOiCOH\+DU33XrOgNVtJMjZ//lrnr8Xet5QYjk2sG3psZtpu6xyT17\+a0b2JcjzfFy5aBE5SNnHlOmu22WDVtXDNi08XG9d\+uN62kqVNbX95v6e9r23TXZv3vld4e/vndEenn7wnRt7B1cGXux\+S/PnB0atA0uTIe8fuTAxNGR\+vCw/tKO2vhQrdB9wy9/Rh8d09ffQR8fadI2IjKt27ZiXKqNy1QeqVWspvXrZkKvuKbvXPodeubknnJX7PV2G9Ws551Lq0DMcv8b/9v9cm3fTyuWh1euI9Xaz2yMqDy16zV9yzaRGC36mWN0MrJX3fhqx/hzp16yLPh5glk2bO9SjtD6F2\+KEZWPlB/8oGP/JuNHx9tjyRutB04d7GO28uQTP6kMl9UvC5q119jd1/7sKyvXEJ13pvnYZOS5xoYXV2/oaX74Zjm4U3znfuJj07t8EyfKhtufWnXf4vRLXDm4c8rysG1Tj0hE5eGJwyNa74dndlFzeKzx5d7TJ6xEil7mhi1Pr\+wdPb3ngGqxCTM7LQ/XR0jeNSYyhazl6r4dNertCt/RjF76Wy09OVgKPVfrf7VjmVQPAAAAANDqrjAASzbTaptSLutEQnc/6\+0xsR4zkTo8PDFstay7bbb4Jh8p376Dor\+zrZNmN\+Sjk28f4GUSewfb\+7v1fcd4QakVBs2sXP/0iP7puHn92hU9jGyDq96xTh08pFRs5nXEPzouDgwQEVG/Nbat00ZE5akndtTWv7hycK1IpI0dq/F159fHWM\+KWHoFzTT\+yVT/q6uXFHVnxlQ/\+ma9e6u05TYjkTry2ldHxzof3y0t6E0bO3Tq7numx3tMIe8kce3ECdXa2wz5JokZN\+1e/dDa2cwjHzu754gpmr5pQw\+Vj50JPW96aPdNc\+l35sSxLdsZEREnshhu3XrDhmOnD1f0/rkdFQ6cekleEX1E\+u7xr48eEsZJ/XRErdiU4SGBiMjW/tCm9u6lPxJIpl6bWJA1IrLaLL0Kf7tsvu\+N1ZustZfKkwNP3TR3/o3f7ad99/zbS8ywbretnxGxjie3V\+99oMzuWLl/99LacrNwRBkfp4\+ONwbvWFBQZebBbasGxyZDFWWNtV7oXfHOqyvWyJNMMlh5o3tTezcjLjcq1vb7t3cSV956oNn/s4XzAjS53CCb\+OVrX79c7nxhu3jwgVPlpzrJZr5vbqjlQ\+VdM9O\+OT\+4Qy5vXfVkv3740VO/6Fv19vY2JqvjBZ0vmrivlY\+dDe\+oWrbbntxs5v3yg/d8FXx41bPb2mYSILPoI2\+eLXRbnr1NHznStN5mtjKNiHilURgxrN9sJFvXC7/povJU6CfV299d2XP465Dvj5WKWhijEc8kU7SyrfNXKYmN1K39hsKB07uISDLbRqeHy2Yicf1Tq9\+5zcS4cvjA9JpNHT1zn5E8MvFRxfLsOhMREVcOH2iuT/7dC7cZSa4\+MToxsH3lpoXfSdsNEVu90sN6GBFpI68pd39o2PT0qgFGRBrnImNERJfzre7d1Gm7a\+LoWNvy33kAAAAAgJZ2pVOgJbbpEbbpkq0Gbtj/LnVL515hfV0P/axj7IOTkYK4/41/t/7I2YN8xUPr1I8sypqnrf0Lol2lUB3vXxnbbOKjlQf3UuRVaw/xfQ9MjG3u7GVEtrYtAxMP/mRCeqPru7y670Nh46uMUXNo78nwm43u7QsqyZy/9ZOvfzEifnrPv71FRERKWbVssv3qZzN5Ty18\+HXksPbQIyIRkVz/6MNmpcILFa2XqUNvTvPBrt6RU3fvVNdsstj6Vv5iu7l8oByWb3jnEcaoeWTHyY8r\+sx\+5OOn77tn4igZy/f8255ys1ARe3vFgzv\+tG9M63/x797ZbJopmxdG\+PgdN0V7Jo8WmuUDZ0\+O1QuFypeFBh2orn\+6s3uww3rP6T19qx\+yEEnmdfe3D1gbd/\+8Wekz20gbP163bpWWK5IbB7auHJh93Bx65utPx3V67tQJpg6NNE48f2q4f6aOTVJ/592D0y\+Pm\+jI2V1HZj4ky/0PCyM0G64W4Y3hUcPG7YbyUF2\+wzT3MarDb54\+WBCspBaO1Y72td/e3/xo75R1K5Hc\+HjIcPerZkZauVA7eEipkF4erh3llo0fnNn1wYKebW1btnUOPPKdX1HjyKOlYesNj9uEk1bto\+dPHbUQEfGybh0UiBofPlB68EONDv7xZRK/u0ZUhs7\+YtB833lTh2X\+4fOnI4fovtftD91mYkSsX3onZdrz6Ml/OmB57MVV9681ktR2/7aJ0Ie1AlPeHjE/9JSZESciZYyfkNo2nF8nNfRutf33rcRH5Qd30mPvSr1j8r07VSJD77qONYWpE7JORGQxrNvWtb5HOWoVmdIYPtbg5emDR8zPnvvDUL88pPD\+G78rEZFWPiJ/bFnx8tq5PzZl6eeofXn4dOh4x/7XpX6JiKhS4MMFdaC78dZPvz46sOqdR\+Y\+pUt8q4nZ2PqeiaPHVQRgAAAAAIAlrjQAc\+Xwm5PDMxXgQeuW25af7UySeeb/8cvRTnxw5uCB6pDSLA9pw0eaPUrj1sEVWwZnLze1kF748MwTIyKV6yPD9PLOupXU4bL45Gz4MfRvW/3OWmXowJTcrfdvv2HQRkTGNZtuiA0avts/d80qVz58tBw\+qg\+8YPvVIxZGRKSNHSiH5xaV4iNyaK\+2ZsBgISJqDu09M7x2ZZQmjx5v2Mqnw4cssU2Gnjtu\+nhQqHxYuv2Zk/90SKBys8BP/tOHgoWoMqavGyQibezQ1/furPfcZrl9YOU7j7DKoXJoqGv/i\+0SqUPPlD9iRETSTPg/cDLC9bEjje\+\+\+ncRPvnR8fZuybz\+acPh52rjvLPH1vlCihWGKh8Na0Ta8IGzhbJ544aZwYpr7ujsX35Ka3Pkg8pHIzMVYBMRu31A2/D0TRustZfKk2u23zhAOiOtPDJ98LWpgq1zY39jXJ7N7SQ3yn2dW7ob\+x79\+tbtNw4uyEu8oAwTe3zQuO85Ps475pK3YWDb6gGuHHy0/FHfineSs9cq89EKMeOta/UTI411gybb2hWPryU\+Wrn3w2lbv3ju6yFZNty/YvbyZtIKB75\+7JDhyUy7TRK3vGrfsuRLsn73d/6f3aK1Mh3eS0\+\+vmJ1oXbivPTLlbd\+euogmQZ6m4d3lg5zbWYO82pGzNb\+2B3CiQNTw5KlcGiqIBsHrLWDh6h3gI7u/Xq4x1RRqJuJNFYdGmvftGxQVFTOjItmWVeUoyOmx1\+39jKSj3/94IHG7ess6/v58LHpAhGRsP7\+BSV6rhYKWs/MbwdcHSnQalZ7\+zlORKQ0Px2tz06BnmFjW7Z2DWy3x14rh38qxl7vICZ\+t18/vPfU0Ghd2bxy/zZ2md9qIiJm7O8VDg435M3zv1wAAAAAAMCMKw3AzLLhEcuG\+ae8MXSgcnRMGx\+uF46f3XVc7B2cmVF8EeKazTc\+pjQrXHp2k7qnXF3/1Kr5mdJEpJDYu\+nGFzab\+Gjl5F56bPdMBXjy3JK3zNhtrVZsbN0d4tDO0n941LB\+0GhV1KFDjYHX/\+6F2wwk1/bdc/KlStuzD9df\+nl5JrLSbK1sro9\+6/5kZ\+GAPE7Nob0n732p0f\+KeV2/\+e0HyqHeFbF3pQGJiAwS0yoWcc0jq99ZWgEmIhJ71kmxlMiOnNp1BUvyqoUjddvWG1e/eWa4v3PBuaXyKHX3iifGGkOHG/0Pd1kOVT7tt95t428fVjZsaltuHS9j/\+aV/ZvnPw6\+74FzKzcxi0GSiEgrc3Hg6dUPWfmenzY3vLJqNoWWJ0PPNNir1mdvO394J45UrZtXrelW11DtRFnrn42IWvn4xK5Hz/yiYLx9m3b4\+fKe49rGd20biYiZ1m01H32mMjywap1E8kjlsZ\+cHSbLs7tXzc4D58rBB86MlDsHJHHmV4Pgc3UuWaxMG/ng7EyAJyI\+zo\+OGtcPtm94pMN6fOqjEY2X6yMj9NLOhs0irtnMaGEGZpb73/v3988/laefuGd6/RurBxf/UjDwsOHIgYlPx2Ziv2Dt77xvkH5xvG7t7Xzy4fqeQ8r6RxbMAFeaheN16mXWcpNsbPXiE37yuPxjz4SVkVJReb\+FyrWPC\+Yn35V6mVYeUSrdC38M0soVwWoTiIiYaXC7bXDmlB8q3Xtkxa9\+bxnZUf74NltscOFfimHgkdWxY0rhw8nxAtkGO2yHJvnT34nPT0G/jG/1zDFabIIyrC1TZgYAAAAAaHVXGID56ET4\+ZqlW6SKWulZ8ez29nXbVq0jdXjvyQ97b3j2DtOleyhMvb1XK4w0y1TZVdDHy83x508Nd7dt3NY5c/2ktbet\+5C8a4T4fAXYQjTQtn7BpbmFYYX1djBmGHxq5X3lim3rjbcr8olR46Z\+A5E2NjQ5ZLP\+8o0u66GTQw/f9M7ytTJjTx\+Nkz5\+vHL0uPnxh8VhJljXWh9aVx\+6o3OuUDm7uxOvXagCPFPr1gqkjx\+Wd5UNjMRey/TLz0wT6eNDqmXtBc5CpXn457J1TBsg4dyLZeVo2byxT/l4maArLH2JiIjzt3bIJ5jBStq4bHnoZ4zkxsHnTg0vngLds7ajh4jKemWstu/5UzPrLfNKY6TSvkyXo1P7jpsfet3MpOaaHvWj482NPWZGRLJycG\+VbV6x8Zh231M3rWPKWw\+cPbeZxbCaqePl\+tCB06G9zfUvrnrowNmPfn66MFPnVLQTo/rtsztQx3n7C\+\+1HdxR5WPK8PjSGwI1Thxr3r155bObiY/KJ5\+n\+Quz\+ej5TeVjXz\+4s1YmIq59WdA\+/tEfVzNatFI3bxw9om14ffU6ifio/ODzysnBmeQo2vo7uj9UxrmFysqnR6YL5QY/ML1hsH09ax7\+oNm92SIRLfxZY/VaKXquAiwQCcR0Xq7u2/n1vlHzk2\+Ye6XFq0CfP1h1vKDZ\+o3WCy34JjeG3jr7sW3FfTZiVvbQwzx0YHpkUOpndNnfagAAAAAAuIgrDcCVesXaEf1Zp3Xk9L2vqRdsJ9dHxqm73ywteYf1dt59R/Pln3DbZunZrYbhZ77aNW5\+7KnOHkbyyOQvPuDL/2e\+XDv4XM1qa9\+4raOH6sPHhTUbDEREUtt9D1cf3HHysKKteco2IBGR2HPH6l/eQURagbQTF6uVEZHQvW7ls9uo8GZ5mIi4eOvDXUPPy0P9q9bNFRIrFeHWn9ljW43LVYAX9LNBevaRRZfTymPKSaaPHFe611oWnwfTpnf//SYiPjZ98OcThyvGDURE2tjx6UqflfGaxdY20F3b9/PJnnKzrFQ/7RYGBs1WRkRa\+djU4Ypl4x1zHXK1UDZsfP2mdTT9xD3TMmckmbbMTYFesAgWERHZ2p98urZntPOxR9ok0saOTA7bOpcsK13dt2Nq9SMzZ9LYP2jcs3fixOCqAYlIanv8vTaSp0OHzrz9/KmjpJ0Y0zcuOAOMkaIQsbZoumuwp/nWgWU/SCJmWrfZROWpg0Ssp2ODTQ09yje\+sXrQRvKxUycPtz/5sw5pmc1UWSZmM2/cRDamzYdL6bZVv8zMjHz5CvDFKGq50lTKyts7zpbvkN7JtM/U2MtHTr5dYdF15/9tVEanXtpZt1mIjytli4VIrxyvhB61bNh60//1\+nn1edFqJWV\+tjkREfHR6beOiLe/bmK0MPOrYyMN6mXWscmX91a7H7b/aq048uY0kdB9x433HSmHHhXjr67oZZf/rdaVsm6xiZe40xIAAAAAQCu68vsAXw55\+OyDi1eBJlLHDp2NHFDLyqnb92rd21bFtpoZ0bqnVz/55sSJgtq/1iD1dz3U3zW/wbkp0Off7HTqU8Y2zPasKWSwlpWjirm3ospklBY2ZeKabSvf2c4up1ZWOT6x6zit237D41t5aIdsfUXql4h488RxYeARI1t26aJzO1qm3if1WNhY5cG9zcfeNSkjUx8dJ6pMfGwxrrHNlnOZVbR2mx/aZB2QiHj96IFm93YqHKiPj6nWPmP/2huja5WDx40b1zZffubswV7z42tpfHhi33Hrhju\+WboRrb3myt6JTze3bbDWPz5Qsz7Vtej9cvWlR08P33HT/rmpubZ10pbXSk883/7LF9vnc6XFZjm/AsyVoweUoVHxoW7zun4zERFvkmTauH3l7FJMXDn4wJllJ4mznvYtfRN79lYHXlxSjubN8fH62EhjzwO1ikxrtq58cnPbhs1E5ekrOmylrLz9/KmjFuLleoHPzjmvFCZCz013P7JqTY9p4L22ubba2JHTDz6nbnl95YKF2Wbruqyv8/HdiyrA1rXW6OtSLyOSqy/tbKzfPbecGzMsvhBXK49M7vpJpfKIbUOPSAsDsFz/6Dm58R/ok//X9NiLNw0ufJeZN726Wnm0/C\+e2pOvrtwyv4bWxb/VvDlS0Hs24QJgAAAAAIClrjwAl0cm9jxTs5SVccVYOCIfPNaoEFXG9fLo2V3HBSLTwNauDYO2//tfF23FRyZfPmJ66N0b1yjK4Q\+mT4xP7brrbKE893/9w0165aYtfYvvpEo6KcKS2Nk4\+maN37bCMjb10t7J4bLOejru\+013jGpv7zj1Tzv0/odXvTx3VaeFiEjnc/d0VZYNsQoR6ZWx5vCQcHdy9YYekXpufHK0HLpHfeFdyXL4zGGpK9YvEmnEF2zPyXIuhIqre02Ve8r/dEC0LMrq\+smC1r3dtrowseeAsGW3/XHiB58//ZJ3PGI1dNtmK3j0If/04ZsifVMflY2PWbWTPWygl21cq7z83NmXxgyMeOTDumWwjZWbnCxrNqxYT4uLe2X\+9vOnjlJzuCKuJyK5fvC5U8NWom7h6N5TRyXTrZtWDPaoR/ae/bgsWEkrj9X27Dg5ZKl/fJxufet0waJXKobbn5Z6R86Gn6kqm1ft38ak\+c6ZZcurNw77Tv7LPV2R3TcM9oik6MqYsrgCrBMJ1p72J19tW7Dyma7I9Y\+fO12Yyc0Lp0Cfz7hu93fWkEEiks8d1PQTd53cPyL\+xzvat\+y\+cf26th5p4Sa6wgQiKh859eBzXF7wxvBdf9wz\+9Cw7unVzw4aSdHJarn7qZsGZ6dAz4xHt/SuiP1mxcJO5dGJPTvkoxXL46\+v3tJnIGoc/smf7j5IG1\+x9878wMF1TsRHK4/tqNHWLqvNsKZ86l7PpIWRUtFoYOWWBZn5u4MW9vz0l3L7AONv3VPeUzBu2H5TdOvMF0TsWSsOPfqn/2QTqKJVeqVf/R\+dP5XmFzDXievEhNnz/8a/W3NocpifKyZf/FvNy8qnY8b1a8/7UwIAAAAAACISzkxcSTlNPn7qvjfZ/je6rCOn733NHHuj6/InnF4xuXZ4iG694/y71HK5UWEmG1PLZd1qW7RUL/FmmYs2aXbRprEPvt5T7oo\+0iZR4/BPSrvGzY\+/uGrLgtvSjh2rnuxrH7CJ8mjtS2YZOLcgsFo4Xmes8fPXGhteXDlTx\+ZlZZwbe63KLt\+poz3S/lesF17p\+htY7nCWkEemhqltcP4QytOhn0zf/u7qQZqZAGytHJiybV257oo/FbVwaHLY2rFx2WW95frQsNq9rq1n2cHxRmGMuvsusB74hZQng/dMb3jXPnsjIs733XXyLcV8/1OrHrrNSKSWxzRrzzJ98rHK3Z6z/BHbL7YvvX3xZVLLo6qlb8n8fN4YPq599zbL\+a9/M5zvu\+vrkW22\+GVcGL9gq9ouz1cvl9nLv7Hd379siL34t1od2VsKjUm/fLXjKv5hAgAAAABcq64wAAPAZeIj8oM7lI2v37Thr3VLXvn46Qd3qve9eyUXQgMAAAAAtBAEYAAAAAAAAGgJf6XSFAAAAAAAAMC3CwEYAAAAAAAAWgICMAAAAAAAALQEBGAAAAAAAABoCQjAAAAAAAAA0BIQgAEAAAAAAKAlIAADAAAAAABAS0AABgAAAAAAgJaAAAwAAAAAAAAtAQEYAAAAAAAAWgICMAAAAAAAALQEBGAAAAAAAABoCQjAAAAAAAAA0BIQgAEAAAAAAKAlIAADAAAAAABAS0AABgAAAAAAgJaAAAwAAAAAAAAtAQEYAAAAAAAAWgICMAAAAAAAALQEBGAAAAAAAABoCQjAAAAAAAAA0BIQgAEAAAAAAKAl/P/YVw9sbhqsjwAAAABJRU5ErkJggg==)

*圖 4\-2 首頁功能選單（以 sa 登入）*

### 4\.2\.1 畫面元素

__畫面元素__

__定位（id / name）__

__型態__

__預設值 / 初始狀態__

__說明__

標題列

\.topbar

文字 \+ 連結

new\-pay Portal | sa \(sa\) \+ 八個導覽連結

唯一顯示 \(角色\) 的頁面

區塊標題

h3

文字

功能選單

SA Portal 區塊

第 1 個 \.box

清單

標題 SA Portal \(BO / PM / Finance BO\)

4 個連結：交易報表查詢→/report?type=trans、退款交易報表查詢→/report?type=refund、OLS 每日/每月對帳結果查詢→/recon、服務條款設定→/tos

Merchant Portal 區塊

第 2 個 \.box

清單

標題 Merchant Portal \(CP\)

2 個連結：交易報表查詢→/report?type=trans、商家銀行帳戶註冊→/bankacc

CSR Portal 區塊

第 3 個 \.box

清單

標題 CSR Portal

1 個連結：查詢 new\-pay 交易紀錄→/csr

註記

p\.note

紅字

註: 選單沒有依角色過濾, 誰登入都看得到全部功能 \(先求有\)

固定顯示

### 4\.2\.2 需求條文

__編號__

__需求描述__

P\-HOME\-01

首頁顯示三個功能區塊共 7 個連結，文字與目標如 4\.2\.1 所列。

P\-HOME\-02

三個帳號登入後看到的首頁內容完全相同，只有標題列的帳號與角色不同。

P\-HOME\-03

標題列顯示 new\-pay Portal | <帳號> \(<角色>\)，例如 sa \(sa\)。

P\-HOME\-04

Merchant Portal 區塊無「退款交易報表」連結；CP 可由導覽列「退款報表」進入該頁。

P\-HOME\-05

首頁沒有任何查詢或輸入功能；點連結即離開首頁。

## 4\.3 交易報表查詢（report, type=trans）

路徑：GET /report?type=trans（type 省略時亦為交易報表）。資料端點：GET /report/data。後端：GET /sa/report/trans。使用者：SA、CP。

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABVwAAAFrCAIAAACi0tXsAAEAAElEQVR4nOz9fZgT130w/H\+llVZnXyQGjPCwXmBgHa\+MHVsb84vHdhyEfQXLbqGyQ2O1pPGEOu7wa51O7oeUabkfovLcJEPL1ahx\+kNxHTxOQzrOTRwVUlsmj42wHXucGwdB7LXW9sIsLMsY8TJI\+3K00kq/P7Tv7MKCX7Cz38/lK0Gj0cyZM0faOd/5njO2BSv/HhBCCCGEEEIIoT90B376P690ET5x7Fe6AAghhBBCCCGEELoyMCiAEEIIIYQQQghNUxgUQAghhBBCCCGEpikMCiCEEEIIIYQQQtMUBgUQQgghhBBCCKFpCoMCCCGEEEIIIYTQNIVBAYQQQgghhBBCaJrCoABCI1yOsutKlwEhhBBCCCGEPjYYFPgDU148v9joGLXAUfI6Jl37w\+VyF9Yuy7eQD2Vj5cV892NfKHou5TPe\+fm1Nxe9l7tLlzf/\+Ley6xeVAACgtGL12bb/\+\+wL37Ze\+Lb1wrfP/p/vnnlqycDokIGLlLykPIUNX4FjAQCPt3/NkgJ/M101vzR6eeMiuuaGMQcCpLj6C5R3X9r2L1BCj7fYMnN0zZQ9H06ruAylluZCi3vi0\+QhJdeYl5OGhKZ8rqfGUfJ8uN/KyzqD43gbCku9H94xflgcAyt4unzmRAVzlFrmD4xugS5H6ZK\+ZVPnmrxtABlomT/wsf3MIoQQQgh96PBC5oOpW7j5n77a8roa/smx7MhSsnTt2q1zfhP\+7m/bCx9rcVzu4poHc3xX3UNPu9qLAFBavjK70V3z0I7KSwAoLb23e/2Nw32hsmdmyVu0t\+dsYzZUsO/ZVb/l8KXGjMqNN/c83lx6VK3R6cQrtCzLPrWslBm3Oyh73OX2PTMeeqUqP7TIM3OgyVk\+71Nll7uc3\+\+\+f5czC\+N5GvKrml173nJkipdYcAAAyGecO9r7tn65V4/V78kBgO3AXvdgkRyl1auzS8cdy/LcRqgND5Wk6ebcY/7qR0eqelTBPt5j8Xj7194I\+870r7q5aiftX9ph995JPa9VTmjZu6B/hbtq51sjVe2qKS6/rX9fm0vP2QBKK1af27oIOunQOSrYWl\+pX7d/ZP3KgXgnLWG5sanvsWXlHU\+5t3XZAMC7qPepleXojyu1\+iHwuIstDWUXVKrUlj3j0DM2gPLiJb1ScznbZ8sDQF/VnleITvrXr8zv2\+E5cP6uHQMrVmdXZ\+orZ9DlpY8/TNuf9myYoNlfwrmegjL/pdzWBtdDT5H2YrnpBrqmeSRq056q2XHYPlLVpLh\+dY93f/2Gg\+Pqf4xLOoMeb4GfNdLH9rhLTQ3FpobC0qZS5jXP/c84M5dxTB8dR4nn8/mTrj1nx7/jqhlYtbK7pavukV3VnUUAx8Cq1dkV7Z7RPyOXxNNAtz5Am2oAoOx1w251xnZ37/pZru19dPOdsO2J\+p1nbRN8ak7/xgeL22Pu3R9S80YIIYQQ\+pj9IQcFPNfdo/3z0sXDr/v72ttad2gv7HjTmuIlo2vOwhUtDv3Fdzs/3r79ZcvnnFuernn8oZ6NSxyP6FWe5r71zfbtT1SP6rrY9z3n2ffc4AuXu3\+r2Jvd5dnQ9iHkjORz1Zt\+XA9focsbXPrkAYXOVH34mXHd4NKKr\+RWjQlbDHjcpUbo/mWzLdtFtp\+xte\+vf2iXMwvllnuzG51Dn3MMrHmwe3XDYH/bRUqNNcWnvtU3fH6zXWTD06R1qj03\+55n6zc1l1uneHFfgFENqeyZVYI\+W3bMvq7MseSL5aYlvU3tVVCsggJ4mujqObbo2aEzMkFjHh8S0p\+rf2R8FKC0/N6eVW5bpmgDAFdNsWVRsalmYPODhfa\+wY\+7akquLtdTJwfub7C1ni0tXdbT2FW94zVH0239nkzdVGt1AqVVD1mbm2ydOfDMLGVf9mzI9W29DfT2qiyUvfP7m46673/GmQVb6/66R/YDQGnpyuxjN5Z1vbT0zj5\+Trlx9blVAACQ7ahZ98xQT76m1OK2H9hblQUAx8CK\+3r5WdD45ewLQ2tueMY1UtsXP9dT5i6uurHYOGdgI\+94VLc3Nfc3dtU/olfloczfm5WaSzuHgwJkYM3q3Gp39brDVXlSXPtgz6o5o2\+Y29pfq1/3SlUWYGpncLAyW\+7sfswP7Sft2T5bvmjL9tkzGceel6t37qk6cLTq0iICjoEVX\+qRlhQbPWVXwdbeXr1jb\+1QUKPctCi/dhld2jTgdUL2jONAm2vbs0SnAKSw9VvZVbNGbafPfqCNRJ8l\+87aPA1045eKkLNVNtLYUGi5ppRfmfMcHT6cstdt\+80L1cXP9rvOVuXn5KWVhQOpmj3F/lUNdv3X9suLCABAPufc/nS1nrG7vPTxB4t6xt55thruyz7e59qyo1avKbYUnQdyAFBuuiG/FJw7KpG1IkBhqP7JwKolhcxbrn0ThQ8QQgghhD6Z/pCDAgAA3Wd3/mDbute7wUmably8euXd69e58xt\+uuP4VC7nHd7r7pCCZ9e98kkPCrjchfUrqbfPngUAKHd2VXn93ZrfloVy/qx98Z29mwFcjrIHHNt3kVH38Ev8F/pazpBH2i8zIuCa2b/xwd4Jkpa/fO4VB0CxclkPmbbadbuqO4febPR3/7JpokyBrsq/K2GLcsuy3EZ3zWDneVk/OGECxartO2ZsH3rVtCT7\+A2uRy7z/i0AAFDHzoMjpWpZln32NttgCWeWW98CAPA00I3LitAHnvkDTUA31uRdNdC5n7Q3lLMdVWODHVfmWPJnq7e9lt/oL7n6AKDsnVNufdl9/o1WAADHwOoHela4y00zBzwrc8tp9aZfVIOz1LSkb/N8W77SbIqObc\+SA9S\+5zn3HgAAcHnzW4U8UFveU\+KbC9m9dVteHgk8eb2FfcUqeAsAbFCw5xvya\+bb2tsLax8Y/haVG\+cXPAc94b1Tv6Nra93rfuhl\+9IHz60FAIBMB9nyTHUnlPmVAxtHVistvbd7bUO5sQF2/7y2vannqdtK\+ZOuTbF63U0ff6iv8y1n51A5Pd7\+xpxjT3PPY3PITkffxhvL2fbaR9WaVjd96uG\+zFvO9uIlnespKrcs6eVztY88W1q7snv9Wbc\+yXouUlzzYG6Nu3rDU7V7cgDg2PbUjG3nr3cJZ3CkMtv314Unyk\+5NKS4Vsiub4LWlCva5sxAafGi/FrhHP\+s51G9yrOo9/GHKbTVbnmiWj9bbvH3SV/qeazGfv/T1Z0AULS1v\+i5/zlHFgAcJf6G/Jr7eh970BZ\+grR2kXVPVXZQWnpvbqvblu2DxmsKS2lV9NmanUeH\+vyOUkt1dWYwAceWyZWXLqfenMPL924ersOaIt9QtSVWP8V7\+I3NvVvvLe3eUb9vQb\+ni\+g5yINze8rR6HZkm7u1ZQMHfuFZd7AqD\+XGZrqqOCbdZnCPzoGlS/KdR137Jvy6IYQQQgh9Il1yUMC18HbtO7e2v/iO98aFjXPcrpOHtz3xXzveoQCOplvv3vi1z/ONNdCd0Z9PbPjPdz0rHn7q7hOPbvgv3QLvrQ8\+\+w/Xtf//tj30/Km8c/aa73xj9fGd4W3vjtyYYhZu3hxuaTvUvvCm5YvccPbozid2bnrlVB7Adc310tfuXnFjQ2N1X/ubv4s\+8cJua\+7G//XV5Ud23v\+DtzMAlYz9x65755H/\+d96z0TlLtD2A7/bYpGW/3X38mZm5/FTwCxc/fAfrb21wVtdyBw\+slOLR1\+3YOEXte/ckvnd2aZb55XS5tVLFnoAtJ8t3hHZtuEd96qv3bPm1oWLZ0Lm8Lvbf/Kr7QemmnEwWHXMwjUP37OqZW5TdbH9yJE9uxLRV07lgbTc80frV17X0uiGs0f3/OL5TYkjmUuMQeRzzk07RnU0HQOrV2dXtHsefWWyfktp\+QPnNjc49nU59p0dWL1yuMrKTc2F7LMzHj04pbtt\+bPVG2LVlT2uWd3Nt9Wv0wfvu659OLsqV/Po067z72xfOFPARQb4BSUXlBsbSh5HcWlzOQ/gcZddg28NtMwqw5mRmILLXdi4uod3w/l31/NdZMMvRveFLmjwTmzJ4y537pkRfsU22fCBbBdZtwMAyi33DniBbHrOma3kXDSUPY6\+jXNsAOXGObBvV92OM6Urcize\+f3L59g7z9rzfaUmcOpdZWigGx8qLp5TdkHZ5S41wsAvm\+2tL9ev219unDOQfYu0ziq0ttmXLxnwOAEK9tb9NRsmvM/sKPFLetffOdC\+17PO0bu5uXrTy7YVy3p\+yfft/nVddL8jA5AtgscN2Ry4SAn6YOkyCqn6R58bfcbLS1dm107ttAzzNBSXNtta3ABnRgrT0lRcOrMEJ4fr0N5\+uMp7J83rnmhXcf1fDuhPe/Tm7vUr\+w7M7PO21697a6RLufy2gutwXWZmz\+KGvvVzyjtVT/7O7seEgXZ3AfT6TW/Z8wD5KZ/r7V1TujPs8uYlvrzvGdeeNlt7X8F71ua5odTypeyzdw4OJ8m\+Nli8FV/uXgU1j8SqXUtyv1xQPXmSyCWeQbABlJuWdP\+y\+fwClz0zy5lfe8J7HVOIF5QX\+3vXNtl2/7TSTwYAgP2unYd7pIaBRofd1VD05qo3PFNT6ZB37q0/0NG/3D1R/LFo1w/WZJyFX67M8zNdrRkbAHi8/dLK3qXg2vCEY\+mDvflf1x1ooGsfstYcrdmyi\+w5a4MiQE3JA7YsgMcB2Tl0TYMj\+oR756jeuGtm/vHVl/Bj2r6/fp07\+5hwbsWZ6i1PVWcAAGwHXqltFbNbF7g2xNw7B8\+yDSYJ1eUBLjtPASGEEELoSrmsTIE67/Ib33l0a2zfWWbVum9s/Nrn9H98Ndt8z2PfvCn7/H\+Fv9vluvGO9V9btfXsE3/zzrHsynktMx265Wi60Qtni97PNnhfPJWZ2cDPKbYmMmNSVQsA4F5868ID23569zvQ8uU/2vzwH7ce\+emOk8yKr4VWzzy07n/\+tL3uurV/ec/mtWfb//F3u1/OrAre1DLn3T0ni8DMXX5jfefrra0TRgTO52SWP7xq/XUntnxX23Ny5oqHQ9LaP27v1HZDEZxMS\+PRLf\+4TT9JvSuFp2498sjf/bfe41j8QHjjrbDtX2OPnKxf/rXQ\+r/948wGbac19Voji1fes2bh2S3f0/Z11rTcdc/GrwXbj2h7Zt69\+WuLOjXtvtdpU/CezV9btf7ktnWvd099u6MMzRfgKDXNKmcbsr8cvMsNnW/WrXtu9FBhW75ob3\+rdsO4W7WOgdWrB/jiJV7XOkorHshKM53r3hqKQRSrduyqWby656mHS\+t21Owbe5uucUnu//ghkxsddxjJFHC5Bxbf3Le6oWr7r2u31BTWfoXmD5IDBIACOEvLv9DXQl3RUcGOfM65IcZU/v2BMgVo5U5sacVXcquHSjUqUwCgYN9XmQrBUVrO9y2dAwCOVuhf/0B//qTzgJs2ddVueNnuLVa1uvsem2k/cNLmmnlljiVz1LWjpvDUvbDlx3V7CoXND/e69rvXDY4QKbd8IbdxViVtAcAx0dadpcVD95kBAM46d7xc3e4orlreu/qGAThas\+WJun1nbU08uMCWOera8OPqbYvy61dmf3lz7SNPkfY\+e2eu5IFyntphTn6F26kXe579myq9y\+ZpKDQdrb9/14eWoORtpjyQqO7IArhm9m9\+sLfFXXYVoZHPvcCXs/s99\+93wkmyWuxdlXM98tSodJUbetf7BzJdkAdbtqvm0R2OTLHcMtOx6k/ySwtVO4cGREz9XE\+puI6B1V/uXToLOldmXwDI55zRpx1QtB/49ajhA5U1i/adO5idAN7mnqeWDbTucixeeW5r03lz3RXs\+/6bTPBtnegMjoopTJYpUFq1\+tzq8QsnO5Zyyw1F1/Ga7W2jf0NsrfvrHwEAAG\+mKuvuX7Osv31PdSsFAFvnYddgIsyE598BALZ8EZqa\+6RltMVdtW\+P\+/6DVVlSWAoAfVW799bvfm1gxbKejX\+TX/pzz6Y2W\+as3esuA9iyxfLSLxQzbzpWiWdXtFd3wgDfBNtjnp1TPJZR5W/vcGRgwFUcWPuwJQ0tzZx0ts8vLG0o7em6vPQQhBBCCKFPtMu6Ou/vO/DC6/rJIoDV2nYW7vY21hG487rGk7976BeHDvQAHH8humjRY3d\+Zs4bhw/0LG5ZWO/qrGlZCAdefsfbPK\+xujV/zcImyGw/cn7Xt5B586Vtrx/rLEBm1\+9W3Tp4V3/3tn8/UN3dfpIC/G5b4qalX17UNPO3ew4cal25dNWN9ftetFyNi/m6zB79xIWu2OrmrvjyHYsLxza1WTDnplU3kgO/eGHHgVN5OLX9J68v/193rGhmnj8CAMX2l1/d/c6pPJBR81oXW5/fef/rxc7j3XmAnb84tOo7i1vmkEsJCjg8jNsDmezJ7oxl7XlG3fMMAACcfOGRv3s9f/JUpgDtu36z9NZwS/NMz\+vdl3fp6ZlVzrzsfkQffZleXsznzu9O5KG8eFn22SXnp/GDvn/qOyx7GwprvtSzwl295RU7f0PxgO7IAIC7sH5lPr\+3fufN3Y/9ZenRH9cNxQVsmQ7XvqN9S2eOu6dXXnxDfnHOlgfIZ6q3/xoWP9y7GGpavX3erppHn3XBnf0rbu5b76jKn3W0QmnpDcVW3ZmB0vJ7u6VRkyaePw4fCrZWvX6dflkTjxVsB16p3dZR1Xq4KgPlxUt6Ni/r4zvq9lFb1jnQ0jS034Kt9aTTA1Xb9zjhxu7VULup3bltl\+NAEeDKHUtne832s7k1Swp56ONzrkfb7eAY4OdD60UnjywAFOztqZoN43dk6\+wgG/Y68s29mx\+iG51ll7vU6BgqYcHWqnvCqarOIrhG/ahk2uru3w9LV2Zbumo37LUv/kJu4yy4PNkux742O/iBBwAAb1Pf1odt2TNV7X3FNff1ZX9Ro5\+tXherBlLYLGZXFKt1KHW2l1d95dyaGwc6U2SHu3/jX2Z5nex8y9npzm9d2Z8/MxiWctWUW/y9q\+7M846q3S/WtsPA8i\+d\+z/32Q\+8WbvhmeqpnuspcNWUoKM2vKPae29u1dFKIKC0HMDTUFjePJAHaJpTdp0cWd/jpVu/koeD7k0Hq1xH6w88a2\+nNoDSiq9kV2fcj\+y1u2aWPIXyqnG7mfQMfrjKjW7IZqo6J8leybTVrtsFG7\+Ue/ZOyJx0HGhz7XzNtSczcfTENbNfurMAXXUHcrZsTdWePZ5NmdKar3T/cnkZoNw4p5RfbS0t2gAgf8a5KVavn7XnYWR6hXxf1bYfz8jPzD/eVN75XN1u6N/60BQThEYr8Xzv5vv6s6\+5H3pu/GyLjTf0PPbAOa25dtMviE4he6YKbuv55bcBAMBRappV3igWpMrMDn2ObX2XvnOEEEIIoSvn8m7Z0YxFBy83C8W80\+Fy1nvm1HsWLf3lz0ZN0P7\+3MbCIb0T1jZ7PW3ulrpu/XdHWm783OI5JP/ZuR6r9cDZ\+lXfeXTr52oAADp/E460AhQzJ3PZAgBAvieX7Xc0NtYAODyN160N37G8eaanGgAAultdAPnOd3YfWSrduajx5VbvrQs9Jw/tPn7ehWD9zFX/8A8jF83dh7f/IL7zeNF1o9frpAc6c4O52T2Zzh5HU2ON6wgA0MzJ3PkX06467/I/u3t1y/zG\+sqCs63Vl1Rp3QcSv9nXfM9j359/4MA7e/R39DePtFpFqK5vCf7x2jsXLp45mP/f\+volbXacEj\+Yijys7CJl19HzVizYWve6H5ogU6C7Zeq3pt3FtfdS71v14f3O7Jy\+p75CW96q35ODxvn5pV7Y3uHcnpqxbz6MmmGu7JlVaGkqefqKax\+2zksgpyverFv3nKPJT1vcA42rz61wliFb2vgAbM9Bntq984sZvUafSdfeMLBjvzNTtO95zrPnOQAAFymsF7r59voNDrq80t1ylFoayu1HP9CdPZe3sIbvbjrp2kOLyxtsu39Rr1MAsOl7PfftHbduNUC5BcBFIHO0un3oeFuuxLEMDUMou\+Znn6qxdZ4tPSYWdzxb3bS8b9XL9Tsu\+ME1K8uepoHGWT1P\+SFzsrLHsqfGtm9P7c6DVQDlFlKCw3Vjn5hQXroyu7bGlqGT3TAvN97Qu3mmzdMw4Dm/KV6WbJej013M7q/Z5ux7ahnkBxttmb\+td8UcyLc7o78ur3\+wd3GHa8svYGmTfcdTtTua8qtu7l960rHtsGvDjx2L\+Z7VAABlqCnwTeXWPZ4NbXb\+y9kVHe7w92qb5hcX11R1Fm3ZqZ7ri8vnHPpZulXs884seZqzz/L2A6/U7XOAq6a45t6Svpcc0Ou2DNY5eBro1tW9fA0cOGPPgy17dvwUgIMLx\+Z6XOQMDvbJLzh8oGuqh3OxeRbtul5/n17n9RaX39a3hu95/M6ezlT9I0\+7WgHAUW6669yhu0Zt7bhryy9crUWArurdAOAe8NbYtj8xY8d5wwFc1D7JrsvgLqy6t4eHgRY3HJjqcQx\+tmVZ7vFl5T27PDscvc9u6s7nhvIsoOxxl1t3zXjoh9Wr\+AGXE4DaDrzivu\+Vwbc9DX1PfWVg\+4\+nOnMBQgghhNAnzWUFBSYepFnM/v5X4X98tXXMu47Fb5513blo8cL6xsKJA0dOgEX46\+bCQnem7Vhnb3fntifuZxwAAD1nW3u9KwDOfxZ09ZzFG795D3/y1Q0b3th3xPLe9VXtzyrFsPa9fGzt127iF\+aabnS3v/hu\+/ljB7r79Of/e3tbH0Axe/Zs65FTlYiDCxyTPnS6MFHyvHP2qrVh6Zoj0R9s2/3miew1tz/1nVsnr6CJZd959ZG//q134WeW33nTqoe/ur7/0KP/8/nMF1ZtDtbs\+clP1718pB3mbdz81ZZL3e4Ydn0wFXlYJVPg/CMqL75t4kyBfZNNfXa\+nHPTj4fmMjhZvYdmV98wsG\+/jfcX4HDdnowNoEo/PLSyY2D5l3o2LinvU5noycLWh/vyv/Y8ut\+2fPU5qa8\+/IzDO5jRYNP3er6wt7yYz22eTx75eXUGyi3L\+vMnnXtqBvhcVbsDMl1Vox\+D53IXpNW5VY6aR551tc4qL19Jl7ZXN93XvXZO9bpY3Qd5DF6\+izz6XPXa1bm1PttOdUb0sD0P4JpZWM33N9WAx11sdFS1n7Xli3b9NbI7Ay5Sbmwoeh2OoU7LlTmW4WEITTfntja7Hv35YNq859mBxx/oXXG0POmI6Jxz\+3OkZfVA02s17Uv6QK/ddrK0gi9mDrr0oV3ni9A4vktZdrnLnXuGXjlHvsUuApADAFvnWx8wU6C8eFnul0sqTx\+oFKOqPVfgZ5Ub3QNwZnD6QM98up6HPbpz8UzId1Vv319c3TDALykubbC5oJgByL5Vs\+OwHQDau\+yNg1u2QV9V3p1fvrx7\+fKyZ2bJs6gyZsTW/lp9cmZhzVTP9VTYWvfXh/eXlz6QW5Wp2dFRdeCorWU\+ZNpdexr6mnIOPVfc\+GCuZZd7e664/it9nv1125t7L\+kHYQpnsAxgb32t7qHnzp84oLT03p4VI53hCyraMjnweAtNpDpzobvytkzGuWOXc8euEr8s9/iX6IqG6taTAEXofLNui27PA3hv6Fvvhx3P1O0YnUdQsEFNURLPrimOWugoeYvVQ1Gt8lBOStnlAI8DMmCDnPNyMwVsB1723P2yLVOExpvtnSnyyDPVQ1GY0oqv5JYXbNmzzu3POaESBVhd3DF2/oIh5cV87vEbqh96ilz\+dKcIIYQQQh\+vD2lwb6E7c5K6WuY21kGrBQDgmTPb22\+1W8XOtmOZ4NzlfD10vtDZc9bVWVz1ucVL5xRbE5ksFOHkiQPD6bJ1XgCHt9HrdR7JFsBV5/ZWF7Odfa45i5vqrD2/2Lf7HQpQzzd7vXACAACKmTffONAfWhH8nKcus/PNzETXsrSz7Z095w3Rz5/NZIA0NRLXge48gIfxNtYVM519k14N181suQZaX9m3/fVjeXA0NS5qqoap3yGsGKyTI2/vOPL2zpdvf\+o7dyy/dobePDP/5gvbEu\+2F8C1cN7iOR/T8yBcMGmmAH95RShW7X7NuXp576qcY4XXsW2Hs3PUmy53YeND3Xxf9ZZY7Z7cwJrVfd72ukdTVa4GurrBvnOHIwNQGaxR7\+1ff1vB4yh75gw0uen6Bwr5IoC7DH221jb76jt7JVI\+8EylP1NubCguXdK3dknRVYDs4apOCtmu6u1duce\+RbNtteueIB8kIgAA4Cw1NQy4Omo3ncxLD55z7fJs2F\+VPevc/mv70qaSp7m41l3VfrZq32uVUdOlxlklz5z\+pTNd7UOTpa29MsdSWn5v7wo3wKxik7u8/iv9UHTseJboR2seiZWalnS3jO2ZuwBcUG5sGHAN/yDQqn1v2Tby1DuTrprl3PBW9eiH3nUOPlJxWHnpyuyaoX833dCzvtm5bX\+Vp7l3bbH2oV2OD5op4IDznz4AYDvQVrVqSd8aMtBZmRjPMbD6Pgqp\+h1ddPNMALDv21u/D8qLv5BroWTTLqeHz229YWDHW\+MTLvJ9jugzZMvMwtKZNs9tPSs6aqNH7Z2DwZqqKZ7rqSmtejC7Ole701lazHdvXlT7yI5qgMpMe1Urlnc/NXMgr9dv6bLlwbnphwxAaXXzlLZ7SWfQU1POn5yw52/f95x731SPxX7gLUf\+gf41N5IDIzMallu\+kNt8o3PTT12eO3tXUNemvcN5\+Pb2Dke22O9xDD4vIH/Ssa/NkQWA9irPnHNrV9J9T9SMejZKZc4F9/mZAoMvyMCalb2g1\+wrDKy\+l\+55yrPzA2UKABRtg0WltuzM/vUPFEZlCtgyFFyjJhHMF2z5ifv8NpxrECGEEEKfOh9WF5S2vvxO\+12fl752LKMdandet3HdHzUd0B76yZHsycOt/Z9bfmOx9T8z2QLtbDvruXOxt//wpiMT3slxem68Q7orE30T\+D9b2gInNrVZuepcHuqbGr2eNzONd969uhHyznpPHQBA/uSxnQfo48Gb87\+L7\+u8hPsy\+ZOHd79T3LgiuLozscfyrv6zOxb3HFvXZvWPGRFQhO4iOOu9cxhvdzlbcDRe4210nsgu/Nzau\+rz4PDUkUnTDSY4stnL//Lr6\+sOPbr1Bd1yNF23qNHZd\+AUzfYUPY3zmmb\+rhMWrvnydZ4ecDH1l7DZ8aY4fKDscpRaJpxTYGb5wCXMKTBG51s1UX926\+rCnmdm7BzbU8rnnFueYPLU5plPt67uazpa9\+iu6nZHce29fZ72\+p1dNhgaIdydqd6yq7pyw61xPtnyTOXueq5lpq3zTXJgWXbFmfpNXTaoPIjxodzSPtc2dcaBBT0bvQCOcuOcUubl2t3zuxuPOg9cxqPCHWVPTcnlLLsc4HGXWpp7pINk5/7qPV0uvb3nsZW59Wc8Gw7bm/y9G79g33EYAEqLb\+5b5a1/6JnqjLuw1O3cliotvXFg515HFiB7xY7Fvue5\+j0ATTfnGptdW34\+MsFednyGv63zpMPTB02Ossdt118hrX1QuTXdniLtfG5FrubR2JipIl015yefl13ucnZveajXZMuedex7y9Hozq\+YM7SXD5QpUPbUQL4wrh9ry7xFDtyZXeVwPXrYngdovKFvlaN6015HZnRHmgysuHGgM1WVKYJnok27oOwCADKw5oHuVbmaHQAud3Htg33eN92PPOfMAEzxXE\+NXd/vWPuV3hW5ssdRtf3X1QcoLAcAgM52spvPruqof2TvYLQlX7RN7ef5Es8gKbW4be1dU0sHuKD2VN22JefWP2g9ewPZ\+Zazsw\+8TXTtnYXMyzXt3TZvrrT0vtxjM2u373ceOAtNi/pXL6ONfS49YwcYGLOhYtWOXTXLxb6NyxzhoadUuJxlz8zC\+ZkCjeAcmT6waG9tr97TV1h6W\+XH/4NkCozobKvZeUP38qN1lcc3eBf1bb2zakfHyMSoF686zBFACCGE0KfKh3ZfOvPm849uLW782j3av4fgbJf\+8n\+v\+88jWQDoyegnYXVjn36kOw\+QOX6ss\+7mxZ1HWs9OeN3U1/76YddK4YX/rzN/9ujOJ36183gx72zd9srnHnt47aGHIdu279Ftv2pfu2rj//pq/u9\+uuN49wH9cOdd9Z364c5Leoxf4dTOf9VcD//R2n/4Hxur\+zrbWjds/e/dx4uuhaNXKra/2dr65eBj0fk7v7t92y9al//tqhd2roKz72za\+l/77vqTzWu/sdX2q6n2Bwqndv843vSXd2/9t/\+7sd4JcHbfUzu3v3M6D7/RP/fHj//7LdB/dvcT2rrfL33s4bBWUO/fduSyBsNPcfiAfc8zzH1v0Y3Lint\+UV/J2nV56VNib/6t2h1Te7jaecpNzf2rGkrghMU39/NtZHCu/kGlltt6pCWFJodjxy7PureqXA35rV/p4XO1jz47fk6vYWODI\+WmG/t5Ys829El\+x4b9Vdlc9Ybvz8pTWx7KLQ3gchfWPNjXAq4tu8iWp2u3CtmnGmo37XLpuSkeTrmpma6/lzZmnO3N3Y97XfsO1z76jGvPUG\+89WD9fW0loHbXzP61Xxg48Ova1jndeajessex/sv5pXMcmSXU21a3M1VavLpH6nBvGjul38d7LOdxlBprbJ3nf7xYtePnbtfM/ON32vft8mzPADgqHbZy4xzYt9e1eHmB97r0kUdF2A7snXHT\+DH2F2Y78HLdFrDnwdZ\+sG6Tw36pDdvlHuBnQubs\+HuzrpkDXgJ5GGhpKO1ps3cerLu/DbLU1jiySpm/rWcFqd6Qqho9L91o2bOOdhhY/WDvGnf1hp9Xu1bm82erN/0CHludeyzn\+Zu3Spdxri\+gs6123c\+LPN/jpTb\+gdzm5\+r3AYCjtHRJ0ZWq6VzWuzlTv2H/pUyEcYlnsLGJ8lC9qWuqBb7wrrepM7L3dUu30fU3UijYWttd0W31Ow/b8wAZvX6ds3fNzX2bl/R4nZA9U3Wgre6hva59OQAyfkvZLrJpT/9Ty3ukNk\+lMvO56ke/d2kBpHzOueUZRyYHAI7tz9RlcwDuyzswu56qWnsf5dvq9vWVlt6W95ysax8bZHDN6t8onh2cWXDMRINlFym5ui5tvhmEEEIIoSvrkoMC\+SOv3i\+8OvSq2Lr7if/P7sF/t7/\+/EOvPz/\+AwVr9/e\+t3vUx8N/\+ur4dUZv/\+Tv1m39rzHXxAVrz7YfNm8bWbDv7/6fTUPlb5wz03P2nZ0HrPPv3mTfef6\+1eeVZ3hH1pHtW3\+4/UJHB9l3Xgqvfmno1dNfePHpkVXf/OHuHwAAwAu/v8DhjNn4yXe3fO/dLeOWvvPqQ8LoCvnpFyYt8sW5ppAp4HEPtCwqLPXTVc2l9v11rUMdxXyGPBKzr72v97Fv97XqdZsGHyQ2BY5SS3N\+zbK\+FQ22fc96vnAQVjzQ/fjf97W\+VbPjteo9hys9HFtnV/XOPURvq/I05Tf\+ZX6Fr9T5Wv1Du6rbiwCOEj\+/uHj\+eU9cG\+lLlxv93Y83O7Y9NWMn5B976NxTXvcjzzmHZ7ZzuUuNvoGm/3I/8oojAwA516NP2NY/0PP4t/v2/GLGhoP2i9/cc5Rabi5kX/GE91dlHSX\+hvyaZb3r7xs/TUX\+eO2j/y\+42uq2tNkb54MLIJtxPfqEc/l9uY0N1etUR4ZC9OX\+x7/cs3pH/bjwysd2LN75\+bX\+osc90NRQbILyxq/0Z3IO/WB1Z84GUPbOKUPfhMGFcuUh9h4ysPTeHtf\+mi167aOUPvbgOa2tdtOLVfyf9KyaM3HXeli2g2zrrKQSgIuU8wcJAGTPOiq53NlcVauj7CKlxpllOHOxw6hwDKy4r4fvq370qM3jHmis9CedZU9D39bVpewrnvtP9m/\+iqW9Vb9uV3U7BYCy112GIoC7uHpZz3o/7FRr9GKp0V1unFWG8bd5bQf21mW/0C2drXtoV5WnobDCXcoXIXO45tGf21YQ2\+w5A5d3ridRbuF7N97Z30TsB96q3qlX7zkJK/iBpUtynv31G56t3pmBravPPXtzzYafD97bH/eN8MwstjQMtMwqw8TTAV7wDD7ryjT0bb1vQP9FrX7599HHolU7npmx45mJ3ira9\+yt3zNh/Ig61/3zuA6/7cArM256BQCg6eburcuKHudEHxxWsO9JuMBdSSUAL6lqBYCivXWwWuytXWWPo\+ydWfQ4pp7MX266uWdo1\+XGOaXH/6a/s1hunFPOn\+nWbrRBZUTDjro9XTX3b6yZbCOL\+dxjN0x1lwghhBBCnwQf0wj2jwZpunXpxj\+b17lL3XcS8zUBHAAO24G97odeuUCmQGnxF7o33wgH3iSP7nLtG5uUns1Ub3mqesciun45XTrH2Xr0Yv0cx8Cah89tbCpDX9W\+VO1DOwY3uO2pmbvn59cu69u4tncrQOf/8dz/c2d7m6sdAKDEzxzw5lybHnPtPjrUv60prn4wt8Lt2PGUYyhrwJbpcu3MDQYUMh2ubbuq9rU5W3MAUPNQtHox2EflF9ha9bpH9lfpmVEpvmerN/24egspeYpTiAgAQLFq58\+HHmxetOsHa/SDk133w543Syu\+cm79HMf2XVV5x8Cah7Jra6o37SCVvlb7wbp1NT1rby7u66pMrPCxHwuUoVC152VyYOwshkAKW7\+VXVXj2PbEuNv1ZZdjqLfvsGW6qre9Uru9cjO5rSb8Q8eqLwx4BxzbnpqxDS6qvPgL/Z2p\+keecXj57o1zxr/tmt/7y7W06Yxz06\+neCy2TDvZsIfs6yuteTi73uvY8uuq1lzdpjNFb65652F7Hpzhoy5\+pr2zOHSAbvvOpx0wh66YUxVVa3cctoO7f6OUW\+50bFMdI1VdtGULNgDbgVfcDw2OV\+9uOUPWtVflATrbyDYAgJpH2y7pXF/sWM5Wte6v3/DacMSt3P5WzaaXXTsO2/MA0EUe\+b6TH/3ADseYuIBrZn6zQL0nXRveGld7UziDZKDJX\+jcWx\+dcl7DFdF\+sP7\+g1NYz13Y2ufY9rR7e664WTgvyOEor3jI2uyD1pfrW6c6GYdtqru\+4EZadc/dU5\+rFSGEEELoE8C2YOXfX\+kyDKlbuPmfvtryuhr\+ybEpZM/WL//mo4/f7e58Of7Itt\+2nv/cgSuJLF27duuc34S/\+9v2SxrU8CnknTngKdrbJ01rLzd6B7zFqssZ3v/p4SIlF73krHj0aYTnGiGEEELoU\+3AT//nlS7CJ84nKSiAEEIIIYQQQgh9ZDAocL5PdB4pQgghhBBCCCGEPjoYFEAIIYQQQgghhKYpDAoghBBCCCGEEELTFAYFEEIIIYQQQgihaQqDAgghhBBCCCGE0DSFQQGEEEIIIYQQQmiawqAAQgghhBBCCCE0TWFQACGEEEIIIYQQmqYwKIAQQgghhBBCCE1TtjPZnitdBoQQQgghhBBCCF0BmCmAEEIIIYQQQghNUxgUQAghhBBCCCGEpikMCiCEEEIIIYQQQtMUBgUQQgghhBBCCKFpCoMCCCGEEEIIIYTQNIVBAYQQQgghhBBCaJrCoABCCCGEEEIIITRNYVAAIYQQQgghhBCapjAogBBCCCGEEEIITVMYFEAIIYQQQgghhKYpDAoghBBCCCGEEELTFAYFEEIIIYQQQgihaQqDAgghhBBCCCGE0DSFQQGEEEIIIYQQQmiawqAAQgghhBBCCCE0TWFQACGEEEIIIYQQmqYwKIAQQgghhBBCCE1TGBRACCGEEEIIIYSmKQwKIIQQQgghhBBC0xQGBRBCCCGEEEIIoWkKgwIIIYQQQgghhNA0hUEBhBBCCCGEEEJomsKgAEIIIYQQQgghNE1hUAAhhBBCCCGEEJqmMCiAEEIIIYQQQghNUxgUQAghhBBCCCGEpikMCiCEEEIIIYQQQtMUBgUQQgghhBBCCKFpCoMCCCGEEEIIIYTQNIVBAYQQQgghhBBCaJrCoABCCCGEEEIIITRNYVAAIYQQQgghhBCapj6EoEAuYx7p\+eCbOV\+xq6Nj/3uncv0fxcYvWb6/eKWLgBBCCCGEEEIIfZgcH/Dz\+a6Dmzfv3lv7uX/ZsPwO5oJb6zl16GhPP0zWtXa4Z1/d7CUjC/pPJX70H4\+dWPC9f/qLoBcAiqc6jhu9oz/uapjf2FA34dasxD/9\+98fIn\+\+4Rvfvp5MuMb4A\+n4zTc27G2bv0yL3LGwevy7ubf3/PUPOz771fu/edts11DxfvNyR/\+CptuvZVxT2QFCCCGEEEIIIfQJ80GDAq7ZC\+656aq9L//uf2yGf9lw3x3MpGvm3ntJ/ufWE5NvirvrL36yZoF79MYBwFk1\+KL/1K4f/cdjR0d/om7Vt9duuHnCPr/D5Rz\+36lxOqqdAE7HRD384qmMderc\+z/7t//o6v0z5W7WBZBr/\+0Pnvyd0bTsJxvuaD4viIAQQgghhBBCCH3yXWpQoHiq41SulmnwksHOczWz7Ot/phSe/B/6737wTPNNa5qGevXFXOZUV6Gea6gf3c2ee8uXNtw12zW2F53reH3zTw8Pv8x3te18qeN0b/ehUwC97z//zJ53aqGeqTtRAJix\+IebH7iDKR76j39/6Hk6XKqul37\+4OOHu8eXNv9kZOuTY5bM\+PMN3/j29TTxT//\+94fyExxf\+6//aM2vxy6y\+\+/iP\+usv2m\+68TRnjb91R90Xf3Z25pcL7S9A67A3TdgRAAhhBBCCCGE0KfUJQYF\+q3nf/TE1qMTv/nOi//5xRfHLKm//t6nv31Lw6hu84k3fv03b0z88eEcgf7MWzt\+NZxT0JN8\+bdJAJi9IDB67TEpAA73gpvFP559ujC8hB5541DyVNVn\+ZuXzBh1jM4Zt892AJCFd97\+9bmDEyHkTrTtOnRu9MQF1XMXrbxp9nB5yMDJ376d6wfms/MBek7//u2efubckTd6ACD5\+A9bHh93HFd9PfL1b147pTELCCGEEEIIIYTQFXSJQYFq8tng7V/vqAzsp21vHHr1VNV1t9xwx2wCAPlzx5/Xj592XnXPnU0NTgCA\+gVXu8feSK\+ff93K68cPws\+fat/5xunhl\+6bH3j2pw9A/6n/vTn23RPX/cs/fWUZA9Bvbo88kTw3tFJhzBbcC25YNeOqthP5wTkL\+mn90bbkKUfDtU23Lxg6RmcdN5\+dXQ0Ajubb7mi\+DQC6D73w4g/0c/0A9bNnwKlzlVyD/hOH99bWf/Mv7lp5bX3lo4\+M2Rvd/x9PfqMAn71rxV/dNioPor/Y9vyurYemXpsIIYQQQgghhNCVdKnDB\+pv\+uJdNwEAFI\+8tCvxPIBz9j3B5WuuJwCQe\+/FtjeOny6cPnTqc1//61ubJ5oC0O1dcPtN5w8fOPX8UFAgn3nrB4\+/\+vsegALtOgEA7/zz5m1POh2DL2cU2xLP/OzQ\+12nTgNcNbduuPzF04de/OvxIwjyz//0fz8//Mp5zT9s/os/bXAAFHNdHXtfeut5/a1XTw2A86oVX18hXnt8Y\+TXbdd\+6d8ecOzWXtzZfug7kUNP3vT5bz74xSW9Lz38/YO5GfWznZA/1230QnUhD85rllw/HBFwgLOuuake3sAEAYQQQgghhBBCnxqXN9EgbXthl/zkOyeg6rN3fTHYNNgTds\+96etfpfD079449OuHN5/7/t8tX8KM/\+RFhw\+4nDOa55K9L3acANdn\+c/dA8d36e\+fANcttyzgzp07DY6FN1/z6vOtRqHqs3d9MTh/uPyOq26669823DGcKXDoV88\+9rbjnq/et2p0psBsB0Cx67VdD/9bZXiC65Y7l3/zwZtvYhz5ruMA0A8wu\+mWDf9485/vf\+lHP339\+UNv7Lh\+8S1806q74MRgbkK3W2994xxA4fiT//afIxMW1C763uaVsy\+rNhFCCCGEEEIIoSviUoMCtG3/Gzt2/3Z3ew9AFTfb8fvnn41df82mJfUAcOrQi9958p3TzhnX1Z575\+hv/3pzcczzCOqubp7bfuJEHsAVePC\+1aNG3eczbTtfeN\+1wFUNAEzjyjV/2uB88hvPnz5VmHFVoa0bgOPv2/T1q/ZufueNo23//KP2EwWA2vr8e69ufLz721\+/lTv31s6Xjp8eM6CAHsnkAYpd77W/mhk5xldfOwTMNSvuvOvbdxX3em9YdT390ebnHnr5uZHPvT1qosEZi9b99R3Lbmn09HaMGu9Qf/uK\+8W5jrbnd219e/Y/bP6LP53dveuft32n4xIrEiGEEEIIIYQQutIudaJB2vbyq7vb8zB70aNfv29l3W//OvLb/frxU0uaZ0P37/WO0wDX3bXy3\+7u/tH3nz10fVMzM/JR99ymJcyryRMAQCBz/FVrTDEWXnsNdB360e7TK\+66YfbRFzc/fxoATryx9zEAADD0X/7Re4vuAQAYOHFqoHrudSsbTu964/1\+6AEn5DreevJX75yG8w38Xv/d78ctq73us3fesGzNV5YBgPVWtRNg9k3/\+NUbRs\+GCFbHk0\+\+\+uoMdsktCxqqIX/q1P63O4yhoEN179XL7lzQ8CJA4fh3/0757uBmL60iEUIIIYQQQgihK\+5SJxpk7nlwZfWdM\+5YwroBoGfxPfN/\+9jbb/3eal5WaN/1dh7g6pVfvGZ2g2PD5uZ8tWP4Bnuu663Yj579WXvlKYDnki/\+Njnh9msXXXfnDQ2zm//8jx0nCpWJDF238DfcNMNR751x4oXD4JxxnfNcl7fpnluKiTdOu71XX1UNs2/7yv97W\+XzxVMHX/rO46\+\+eg7mXv\+5oLPtyUOOP//21799fXHvT//35kMzvvmtlSsXjB7273A5JywHAEA1DE594Gq4ZdM/3jL2zW4DAOCqVY8sv2dG996nd//s1KVVJEIIIYQQQgghdMVd8pwCrobmYMPQizp22d0LnnyybcfLHVc5D\+3vhatu\+fyyuQ4AgMGIQPFUR/urL73x5POHDQCYsWjdI7fCr36\+9W245cG/\+P49ZO8/P/mdt\+Gev/6Gcktxx\+bY1hMAhe6u3hnLHlg\+u9pKnGp79dzsex5Y/qcNcKqj7UcJAGf9wrn0nfdadxVOdUPVTTddPfzgwLzV\+fwzv/7Bi8dPA1x3159\+/6vNV52YcejtvTuf/GVXrZk8mocZdblCcYJDOnHoO/88wTMDqgfjBcWul37\+4OgpDGuv\+5fNywEAnOS6axcsmd3dVVcFGBRACCGEEEIIIfRpc3kTDY58fCG/7OsvqI89/bO/hoFu5zXiA2Pz8AFy773xg\+cPnwbXLXd\+Ufxi/V7tmZ\+1D3D8/ZvuaYS3n33y7Xz1/M//\+U0MDPWqC6ff2rzl12\+MTBAwKkUfAGbUfXaJ4zdPd\+x\+G2DG4j\+/ZbYLIG91vpp4Nfb8O\+8Mfqqu\+ZYFDdUAC24W7zz0jRc7kgDcLcs2fP3WJcy44y3mCwBzJx4\+sL\+Q7x\+1jLvppmVzoe2NQ6/2Di3C4QMIIYQQQgghhD7NPmBQAKCuMbjiup/92zunAT57z5dWLhi3QUfD9bf81YNN7tmOrjcObdx8/ATUBR78yoYVC1wdB//5yd8ZcNXX/\+KLN9UBDPW/nVfd8O2/Y3NQhH766jO7nmxnVj2y/B4vQL\+168nndhccDTfdvCzRsftc3T1fvesOBsBq/8Hm//zZCQCAq5oW31PX8bPBu/7FI/vfalvw\+VVzn9t57ppVK245LyIAUChCYdJMASgU8wWAwWCB67N33fXNJcXEqbZX3x5eA4cPIIQQQgghhBD6FPtgQYF\+a/\+Lezb/dHCSv9//6pf/7L3/m3c2zh51172/9/jup1\+tzPZXP3/xP6y5645Cx89\+\+GJCP34C6u555E//6noyZpvO\+ubr6wEAwDr1omMwRb/BAf1mWy3sPkWPvPbGq\+cAoGfvMy8mGu4LLmj6\+lc/n9Mdt9/9uWXX1rdp//6zQ925t9/452de/Vl7vrpp2b999fNt0d9u3fwfXY\+sEG9j3QAAtOu997sKReiBJfd8fuGYxxaMwlx1\+r32/dW2c1YJoHj6vY79TnjHqgxAINydtz96bf0dtzQ111F3b/dVp5jmWphoskOEEEIIIYQQQugT6pKDArlMZ9upPPRYh95oe14//E4BwHnVqq\+vWAG/3fx46\+4n1d0/nXE7f0PgpqYl11/TUFusnnvdijutzzY033PLNf0v7d64\+YffrXTCa6/5\+iP3/9USBqz27U\+\+lOzq7joBUOtwjd7Z2O56HgB6Dz/2K4AZC1Zd273rjda/39Cx\+57l33zgrk03Vw6kCAUAyCd/tRfA9dlblv3VV29d4nX829/Vyd/f\+7N/e2Ln09esDN6\+6ibbzh/\+fOeU7\+03Xt8AMPDqr3756q8qJQdwkoVL7lg4\+D5pvu0WeO2N3c\+0Hzl0DpxXX\+X8wPkXCCGEEEIIIYTQR\+9Su6/FLv3Xf/308eHB9txNt6/7\+hfv8DoAGn9y/c07fvrsj9449\+rLr7768qsAUH/9l37y7Vv/9K8aKyvnrr/K9Xzn3LmNd3zx839\+V/PCOgAAYK5ZMrv7sTfOgXNGYMUtn2VGdtYPAFDsH3cnf/bi7/3dymBDcdULz278aeuRU935kRXo6XMUAObedPuGwVIBALivv\+NfIuzOZ158Uj\+eeOP4Pfznv/43f3HPhJMOTsCWbX35O2\+77pHWKkuKie//\+9\+/ff465Crn\+4nnW08A1F\+/eMlcDAoghBBCCCGEEPoUsJ3J9lzSB3Lv/Wbzf7R2FRxXLbhuVfCWOxaQcSvkLXP/G62vvnfKOJXn7lrx7duYi28zYx7pJQsXMO4xi4unOkyj18E1sbOrAaDY1XG8q9fVMJ9tqBvaV4\+VA2Z23chn8l1tuzpmBAeHCYyXt051FZiF3kvrtOfeO/i/93cvvO2WZQvgyGtv7D3FLLvnhoVj51OEnlOHjvZAbd3CubPd1RNvByGEEEIIIYQQ\+kS55KAAQgghhBBCCCGE/jDYr3QBEEIIIYQQQgghdGVgUAAhhBBCCCGEEJqmMCiAEEIIIYQQQghNUxgUQAghhBBCCCGEpikMCiCEEEIIIYQQQtMUBgUQQgghhBBCCKFpCoMCCCGEEEIIIYTQNIVBAYQQQgghhBBCaJrCoABCCCGEEEIIITRNYVAAIYQQQgghhBCapjAogBBCCCGEEEIITVMYFEAIIYQQQgghhKYpDAoghBBCCCGEEELTFAYFEEIIIYQQQgihaQqDAgghhBBCCCGE0DSFQQGEEEIIIYQQQmiawqAAQgghhBBCCCE0TWFQACGEEEIIIYQQmqYwKIAQQgghhBBCCE1Tjkv9wOF33v4oyoEQQgghhBBCCF2SRdddf6WL8Kl3yUEBALjllls\+9HIghBBCCCGEEEJT98Ybb1zpIvwhwOEDCCGEEEIIIYTQNIVBAYQQQgghhBBCaJrCoABCCCGEEEIIITRNYVAAIYQQQgghhBCapjAogBBCCCGEEEIITVMYFEAIIYQQQgghhKYpDAoghBBCCCGEEELTFAYFEEIIIYQQQgihaQqDAgghhBBCCCGE0DSFQQGEEEIIIYQQQmiawqAAQgghhBBCCCE0TTmudAEQQgghhD7FuD/5hytdhIkZ//XdK10EhBBCnwKYKYAQQgghhBBCCE1TmCkAALB\+/forXYQrb8uWLVe6CNMaNkLARvgBYPsBbD8IIYQQQpcFgwKwfv16vJSEj6YePraOyqf9DGIjrMBGeHmw/VT8gdUDBno\+mf6Q2hhCCCFUgUEB9FH5OC/Q/8A6A\+jDgo0QfUphc/rEwlODEELoD88nY04BaiRUTTcBAMBMalrSpJfwaTOpabr1kRQMTYKmNUmMpS7lNH3SfbBGiD5\+n8JGSA1dT1tTWtVMxmLxKa6LLoOVVEQ5YV7mpymlAJauRrW0ZaX11GX\+Wli6pibSn6YmjD5MDg/DeOvw3gxCCKEr76P8a2QlRT4UB45jyJjl1DIMCMf1aIAZWmIkVM3Hh3iWUFNXVfCFAqyZVNVE5aKY4QJhIciRyrqaEIqySjwaZAc/rKsa4w/xDKFpVRRjQ5dYDB9Ro0HW0pWQqIdVTfSPLQeagknOAlAznTYpBfiE1\+lH3QgDkNJNlvezg9WSVkVJD8ViIW7M3tKxcFjjY3GZZwBdqk97IxxhpTVJNqW4GuYuUmZqmSlV1iwuIePv1gdC0/GYOhjtY/whMTz4HaSWkTa40f1xKynyoQTxsaTyA0GEhK74kiIfHllocpFkXGT1SEg2BSWQTKQIk4zGSEQVaGIoqDiI4QLhIMTEiKa/bjI3\+xhqHDRIMx8QozEBEnHDH/KlNDXFhIK\+KZ5jS4/KcS6ihNjRR2iZRjqVNigXDPmZyjFrcoyKiuAjAGDq8RQTCPoYK5VIUn\+IZyfc9mAdSKGoL6aJUy0R\+gCc3lV/G2554clHX7HGveNt\+aOtd\+e2PfGqbhUBAOrmrf7y3PZdvxt8iRBCCH3YPtoQNWF4ORaXxl3U0pQSFIcunqihSaKS1A8aTIhXGUItI22AEDQkkdGSrBKX/JYWDsf94SBHKqtHjGAsFhy5riEApLIH4hPUpAAAAFZCDMZMSgEYXooKwbAU4xPjS4Iuhhp6TE2FFNlvqnIs7g9y6UQ8aVjU1NMGjUZkjgAwvpAgXOhC84r6aBuhldRkIRlQ40qABbBSaixJBXl8XRCfoEiJkBThEyNRCDRFn95GOBKlpJZxsM1acLOfJQSiYT6SPtgGC272sQQACBtSVJlNhAOSznDsSEtlIS4G4sNbM9MmpyQT2F\+7JFZKiyUYWQmRpBJRuSAPaS2essBK6\+m0oUgphgBwAVEIMkDYYETVBG7wB8ICACAjC62kHIoCADABWQlLMd2kVjoeZ8LRWNDHgM8fArASYkgLqGqYG9y/kuADYjDGa1rIkIc63NRQtViSCcgjf72meDTpVJqhFKxUVIwkLABqmRYlDMswbEAMDK1GzXSaWtRKaYqaBlNPcZQEGTMRjVlhMMEkASEACUlUUpVj9EtqdDBQRQgZWyKaUgLBmMWyDBmMlST1CBMPB6Q0wzGEWoblU5JxgYPzmAkhEE5WIioj27MMk5UTlT/Hg4EYjgUrdRBC/xnjooJqsRxTicFYvmgyHp5gy59SdfNWf/lzi\+uGXjrJ4oX13rvv3vzZ4a5\+sV3/zY4DVubN13fyf7z61ncPPH8iD46mL9wtfSG3YddvP8zC0HQmkqiWpRnMZW/C6k6mHX6\+2kpkkswsgXdSw4qnq0PBWgL5uHgkRmv8LACAZfSYAU4Taz/i366SmTwZh5lCwEUAAPLJaMYMNoR9wzmxxbTeR/xujgBY3Zra5xO8lUDa\+CNLva8ka2XJPfKmZSkRGoywE64/KatbU6lfnF351bZSGS1dEw7Xj9pG0dD7qM/tG1pEjVyKEt7nHNoC1dPg58d8K6nZm0oPMP6RT02dqb0nGlerwkBEOBNUFwXZkpnKpkl9wOcAADDPCMEuGnCPjltTsy9pMmqcHX8JTakWPcUKjYGP4U\+veUoId4fjXJD56Pd16aykEY7Vq9rsi9aEmTimmDMVoX5sXRaSSkfCN08JuQDATHZGjVkRYez3hZaA2AGApk\+puissuBkAoEVKHBN8rYxMWOgR49wEV5wWTVsOH3eR7h81cimo4TmHlTqTsOpC/kIiUfSHmIvd0ECfald8\+ADhwrFEMiYsDUYSuq7ruiYFApKaiIU55vy1rVQslvaJYuVej5lQRFGSlXhaV2UhLMWNidMwiT8s8aYaS04pVdRKqWLAx9hsjC8gqpVrJgBqxKWgj7HZbKw/pAxtyUprUsjPEhvD8UJ0JOHcTMhBH0MI4wuKscG7RxNvgabjcsjPEpuN8QUkbSSRlBpxOcASVoiPKrWVUgWeJTbC8WE5/vFknRLC\+flAwO9jCABh/UFBVhRFCvl9ISmiKEpEFgJT/MNE05oY4IjNRlh/ODZUtWAmlZCvUgVBOTHJSfwofYBGyAQisYjP0NMWAE3HFTUNlioE\+GFBMW5QAOILSUGaiCWMqRRoknY1cUVNsrKlR8N\+ltgYX0BQhla\+tEZIzaQS4ggTVEeX\+lPeCCeuLlOPCQGOsRHWF5SGv/UfuNg\+QU3quq7rqXTqub/luYAS13VdT0RD/qV/q\+kpXdd1XU8OZZBwoWilAU4oqQoTtcfxqC77befhlRSFyZrQpXwxJ25CYOmxMM8Sm41wAfFiTejjRlgfHwgG/CwBIIyPD8sRRYmIvM8vyFFFUSJS0M8MXrNriiTLsiwrw39O6PDCSKzSXqiZjCdNhuha0jCB48x4bPAdsNLJtDWlfj4BchkpLkMddsYXCIWEiCJwxC/HkwklSNNjvosEAIDxC0o0IoaDwWAwEAgGAsFgMBAMCWKQI2AZhuWPxPWEwlPDMPVoOMDzATGWjEdCgcpv19CJJAzHBwKBQCDg5xjCDC3zDy4adRiWHg3yYXW4KIQNROLj2/GYEC1hAxEtGRP9vntkOcAyjF/WBleMjUuoMfWYEPCxxGazMZw/GJa1kbaqhTmfcP5oECulyUKQ97HERhgfHxRkLWUBTathPqh8/KMOe47t\+Ml/bdj2Xxu2/fc2nS7\+3OLFM2sab5zvff/QticGl28/YLkW3rT\+4Tt4OJtd9PmNf3n70us\+s2blQg\+4l//Zn2xeO/jfxgeub3JefIfnK5nJ9xW5Q5Y7ZCWjxUxZ7pCl9wTZGrpOOSOLh6XKCnKHFH6T49KCNPhSljsk8bCSLFQ2lY6fkJX3Y8qxiGJGI8ckuUOWO2X5uBw9k6Z2Qqp8gRnBIBMMzgj6qxlSSmvHJMkI878PCIYkdcT0AgBQIyMG3uT58/4LdgyfT2qckfgUEzBHflnSGYFPEdsbLH9YS5cGl5pZJZKJyoYodcjyMUU\+rsR74soxNWEl4qcSqSJA2UweD4XNlFUykidk\+Vh41K4DYTNFgRqWquZMi6aNQjrxvpqkqbip6gVKi\+l03rrkCi/qiW5z5AexJ6GPSfag6VNi6N1g\+FjSrBxFPhExBCU30pQp1eTDokaplYuG08HQu\+HA732hLi3RY1ilofo5JYY64kYJAMzEYb9v8JRJ4VZerJzZYlrtEKUOWe6IaNQCGxAb0P64cjjoP\+QXMroxcFl/yotmMhuNVJqTmTBKAEDTGVl8L\+B/MyR0aMlTIt8aljokMe3zpQWpQxLSfOh9gwJNm0H/SNOSxPcE0ZDEw5VCSuJhJZEHKBmJTCJdqTE7Gf7JtHKadm5UFeUTyrt\+7nc22xusrzUsZYZ\+GPLJ6OGg/yBje4Ph3gyJnQmjRFOdAS4dHW4zAEB7Y8GDgWg3BQArpwTTciJvaO/6\+feGvwii8J4oGeLgV8MQhQ4tXQLIJ7VTQ/uyDf\+eW6kzWoJOUp8lauXT6fLYd4upWIdizAgx2aias6AEVn/aHKBQTMePhYNGwgSAvCa0BpWcBUCtvoReoAAAhYT8TkjpnmBfxEaIbcISmLopR7stAEs/FuTfFSsHGBrc\+JCCHu1SUwMAQNNnNL3fsmhcPTf4V9G0pGCbomPa0h\+eT8xgNprWFDnNEGrqBg1OspKlq3HTHxnKHmaDciwINKWkFTaqCheIX7GBcIBKatIIXuSmAzVUMRwlspaOczStSoIgs4lYkEmropxk5cSRIGtosijJvoQagrgUjlhiTFf9xIjLgiixCS3M0VRUkJKcnEgHWUOTJDnqjyt\+c6ItMKmYKGqMrKbCPisRESUhyiVlnli6Isg65\+e50Rc5ZkIWFCuspuJ\+mlSkSCTuv3ga8oeLMCwLAEDHLOKm9FkrFRUjab\+iawGSUiVJjPgS0QBjxmVRI6KWDnNmIiJKki\+hjTmX//Iv//Lnf/7nLDsSgDVNU9M0SZI\+jEMa5XIaIRC/oGoAQFNRKWKGNH10FssoDB8OMmE1kQ5d7E6vOXG7mriirAlXZg1VFFSQtHSIMxMRKaL4/ZM140kaIaRjghhneZ4b00X\+lDfCCes2RGOCoPqURDrO0tTwt370abzsRkgNTRKjKQuAUiN9MMgnfQxY6YMme7Mc4iMADC\+r0RALQFi/3we6EorGTVpJLXjfteBmH1vpBjK8JHJ\+H8tMpa4XLP1\+fILEqImbEL2ELyZrTNSEWCsZEaODrUJXJEmM\+RKSf5ImdIURhuPGL2I5FgAsAMYflqODmQKpSqYAEMYflhWBI2Al5VQUAAgbEGR/SgnG3n\+fGMArkRBHwNLlgJjy8f4Am4yEIjqrJGSqiIpumumDZiLER6lx0CChgOoLRc7LJroYIy4NbYoJBVS/IAf0qGzIoi8diyXA0mgoGmAHR0sk9aSegmgEAn4rHk2xfkiFQVVITEsyqWTEDGlxcWwlEMJLWlICKymHY76YNuq\+PwUgvrCsiD4CNKWkpMHlDC9GlABjJeV0bHCRlYxIKisnhEtLZrHSMTlGBVXwM\+mElVLCvDacKcAPrWTGxUA4zopKXA36GDB0TZGEgJ6Kx5VJs69oWpMlFSRVU3kfoUYqHhHFsMUkY0JU1oNShI9Hx93j/Bj\+3LjmLFz9tT\+SWpz7fqLt4e/mO9/N8uFf3nlsu5bY/vqpPED2yKEt2w4Nre5YvOKrfM\+rD333\+eEghmvh7Y//5XWNL77dbk24h0lQ01LVc8aoz1ROE7WKuv5\+hJ7jfDPCwiwlNmvo/XxCopayIBaeKMxFaTI\+wEsNcsCWIoUYd0005LL0Y6bmliWGhbwxZu0ypXafMC8azsfFoinOF/2Dt6QI540lvRcqdjojihbjJ\+zwFmlvTDLNEJeKE1PtkKST/jjrAxpXThF5oRLv1PxXy0GqiKfC0XmM2mUw9QI/eLEbkJvUeM5KZxQFZP2zIfN4SKmKxucSrVNjZ/oIEMaW1rrSIRdYuZjSw0Zmhf2OmGhYoudSKruYih2R1DylA\+n0QDzQXcmWoWZ/2joX0DsJIWJskeArJJSMwTdEQ70R4VhEncdbZzWzLsRZ8ZRH9DsAAFhG0Rwpq8oyKRueI1q9yTgFy875CaTPxI36YIAQbpYsFuOpfjr8t5gWDGAkAcxE5bXDJyyIDRUsYlUWlsDHKNJ8P\+ew0rm06fSzdgAgbL0QWTD6W0XTpiCPepl6X1J6CFcFFk0a4PMBAICVT0aPqiaElPlKtE6VTnPKvABYOlsnRhbwVsayBmSF5QxTiMDQqWdEoUqLlQRllqW0x7jZ/mSn5l\+gycMJGoV04nQ8yAR9Y5uE2aOpRV9oBkug0jEWEkSO\+cK83UhmFPlYyLQl1dmMfkKKFsKxz6h8NZg9mmwIoiOpzQr7TmvxXlEevFdP02c0g4SDtQSKeux4wjc3HnRamo0NeAXeihlMRKjShOM0zBiRk6B8RgkMheNov65aLD/Lz4y5v0rTZ1S9KhgkVrJDlHOGVUwbNp/fyQWuiSkzyHkDHs3EcTlZr8S8fmppcofEXBuhJTNhhrWeNOOJKPOCLAC4QvJsLdwh\+z4TGfp1snQzqtdK8aGkA/OMJJh6JVREB9LpAT2Qq1wxEI5RYo2Vmw9kKF5AiG1MUYht5BWlKYuEeNfImwCE2AdXYJmIbIXkE4H4PBwS\+4flExMUIKyPDwY5QtPm8LhMasSjssnSVNriAACsdDJFfcLkyVtWUhEi8cF7OWlz5HoCGH/QD3IybYa5C1\+MEV84EvWH/CwB8AeDXFRNmTRgJjTDL8cEngPgxIiYCGtJIxTkwnKUCwW4yrq\+iKIbVphJqZoZiKgCzwJwUjwlAQBNqRNsIcinEgYX1sSgjwAIESkeiMZTIs8TLhSNS0SXEolRqQOJWJIRNSnoIwDhaDJ8eTX9AVAzEVNShgVATT2VptGIVfkTxPhConCR3wYrpcatQEQO\+1mAoBgJxUVNN3lfQtU5IS4GOAJcOCLHQ2rcCEtDF5Xbtm37v/6v/2vbtm0vvfTS3LlzAeDEiRNf/OIX33vvvbq6um984xsf5vFdaiMczA63zLTBBAKgpwhJCXySZSv3s0OKOnoOAeIL8kRLpEzRx124GBO1qxBMXFHshCtbcTXlkxJigAPgBFUXAABoaqJmPGkjZINKXGDSEV1LDRft094IJ6lbzicqUT7kYwGADwa4aDxt0eBwzvMHaoSWaUIolpT9xIxLYiIQjQYtVZDT4ZgS4qguhxTTosASYANyNAAAoZBMjXhEEA\+a90QT8UoIiaZVSU6w0Wjowr9fF6w5Y8ImJJhT/2KGAhP\+EgbSapKEYmLQxwCEZDkRjGgpwT9hE7rCrJQWVdMmwNjhAwBsQAyTSqZAmiFAjaRBA0ABKLVSakROswSokTSpUNmOHpM1Erj1VoansVAgLqnREDCMX4jEwhyAGRcFnRAuGE2EwIwLIS0YV4Pp0cMHYpMXciJcKJoIVYb8\+9VK2DTM\+QzGx8bYdDquBiKVxk98ISnCRYOawUsR2W/GEpACgItMvEGpmdKTlIKVMkyT6omkQQCAMD6/nxkMlxrsYLWEKp8xk7GInCDUSBrUBwBA01o0QQRt4qjoBRHWFwxwlV36pVhcrgwtkEIj4QYlEmci8eFpWfxBSU2wQkCUY6GkzE\+8WWqlTfCJoUqSCPgCopoMWoRlASAoCtGwEk/zo4K0H/WfG8/Cz0lfu33Vjd5s2283/M8XdnfWr\+Eh2/abdT/Z13LXH23\+5qOrD/zXQ//6u/bquSu\+/Hm\+DgAg\+35x8d31rW9613/nW55qACh0/u75TS9f1u4Jy4iyx0xm1AS1xr7F\+GbJUS8HAAA0/b4U6SFcFRg9iZSdh/flBDWok\+OqwOyH0PxoyAVQMhKmShmVdwKUWN7NaccCMmWDMwLBSi6JK6jMZ1NljicMpSlmnuonxDwlCqepjzCxd4OE1aJTGrlAWHckPhMSR5Lq4BKaPpOw3LLI\+BjwiWwgYSbSc1h6zgg0RIK1hG/iSRXo7xv81bK/loleO3prNG3F4nlBaVCTXprqEuRu1udUImcjEU6plIZxC\+GMFKeGTklwfiLgJJSJRF2GRVOXUNkOv/iZpAhgWZJghdTBLG4zYYiJmerggZfMxAmVMiE4o8H8aKTMkP54NMfJXMTXG1PMhNQQ5ArJ2MmEUQLWLYpMwDwelizir2LJQDxmydr8EFvpjtq5ICsN15hvpiTZo5HiqMB5QVe7YvE\+E6o5UqD\+MhCXn7PH9Zxm5DQoG3rerzT5WTuwbkkeSMQ64um\+ZMrGBwhDABgiRJjhLwq1qMXOiikMSb8vWGVZnslYBdOghtlnxG3cuB6y2ROLdMRpn54CRc4zVp9BZw69WQR2tix2p9PntETB4s\+liD2tHpdMQqBGVK72EyBgm\+inyzYcpqKp95V4laQtlHgHALCheRrviet2AiXLyFNuRihQyxIAZoak\+UJWFcfYSZhEY2dTYj3PAEAxnciaPm\+Qs4NpqXFbKOZmACwAgDITaJBSPYZ\+Op4e4BI9wAwk5A7g7cBdFamMu5kw34sMJouxgQVxHaxkR1iti8XcKdkI8ceo2Z\+mfYGkDcwihBYmFVfKsPu5vKZ0aADgd5nxc0YAgCFSbGHQ56CGpcarw6Fa4mdV1RZL91OmchZyaqTHF2ka\+cFlZ0UTQxE985Qg9AjamOAOWN1a7LSeyulGfyRWFv0O1u\+NKAwLYCYM2Rg5cWbyjO6bFQZLDnUlUjRN\+wJayUiXk4FzrP/qWMzr42eHiKEmWT50WRlL6BPqow0KUOv5b7XUfGuCd5r/dvyqZlpPJNKEmoZFB4OChAtJiuS3NCOcBACwjLRJuKHxidSIy6KiW9Qy0pXbL4IcTFucHFcnuHBmOD9jJcZc6k\+EsHxoqJ9DzVTSYPx\+jlhJ3STcUDiBMBxLVd20wnxwuE9kppJp4gtxDDXTaROIKviF5EGLuTkkKYoUJMaEW/CP3TlDwDJMCsCwPm7wV2mkhgw9TYFEAlzy9Q5oXhqWo8oFAiQfGmpoYjDFUMOAIMP5ObZydoIhAcxEJKL7I3KIYy9\+r9gy0iYTHMp/ZlgfS9W0ZZGUAaxv8PYnYVgOjFTaAt9gVd1///3/9E//9N57733xi198\+eWXAaByiXbttdeuWLFiSuX/6Brh4BwWVkIMKiQkydEgX5lzIC4JMSKExp0dwvo5SKZMa8JRCSMY/0TtypikoiZa2dJ1E2hC4iOJ103SHBCVaCTksy6tEbIcN\+ZuPMCnvxFOXLeEC1QmhqRmKqlFNYMLB0Zv64M3QgCwkoqSAFFiCWGDYS4mhmSSiDDnr5dSJUFKMIL8PSamiFF/XOJSUUGI0rAa\+UApGRM3IdOypv7FPMpN1IRMXypN2SA7sgnGSqYt4LkJmtCVYCWVEK8RK21wPOvng5XpBYPBMNB0TI6CEBX9DMcQYyhTwNLVGBAO4ooMwARDIV4QQz4ylClA06okp4LRqE9XjYAcEg2DcAxJA02plSiDlU5ZvsGWZhm6QThu3L1WSimdLMH04geUUsLBqMmOnj81ybM0EEuqIZYaybj\+/uspKRKMR8VYRA/HQ5piKbIeVuPhoSt7CkBNPRaRElbShODgVhi/GPXTdEyKMlIkPHR7biRTIK1CDAgQwvoDQiAi8SOZAtRIxtNsKDI2S8BKD4ZZRo7cSBp0TDSR8YVFv6jEg2oYqJWKhvn4uEwBKxVPmr5xP6mECwpBVkimDGmSYCDjC4f9cUWUQAr5WM7v9zHscOv1BUNsNJ40BN9wiT\+Ub/oF5PuLcPLdTf/43/nrFvPBe3gnWbxwpjf4R5s/SwHozm1a\+8kTnQWAwondP/mv3ZXPOEnj6/XeW/94fX/8/h8fcX3hwcd5t\+vCu7kQWrAI4YOVSONAynQGgh4WmBDYLbMErB0AqNVvMkxMmQXae4afjcn1lvaeaHgjcp0Za4\+YAxSAmJYinzV5hiHFVOxoNFU1dGFVSsc7JYNVxForfjySsAfM2bxpRlNOPni1wDs4v1dQZjHpjJywA5TMxFEh0m0Nlc4y8gap9rPDac9OXuaiIcIBmKMOwjL7LaZ2cI/EyZFC2hxggldLUDISppbMWwBWOqeb/RHrDKH9ul4lJxYFGaDGKUk8x8c4LnUsHMmZrFtSm8N\+0KOHQ9xx4qsTowsFcjaedjBmt0mqgySnqsAkzAQ/Xw1NnIx98So3u2ORjgQBALDS3dbwn3/an4z3GqaT4ZyQOKGkPCHWUtJEpr16usz5BjT5cEqYJ4nzApYlhTMx83RCy/ORhRIxZcOr8NmIcDglsGLYmYqdTKRpUq\+KqF5D6zVS/VEF9FSJxkopsxDX60XexnIzxOg1POcAWrTAzhC7oF4bSPVUMkdImPj9ZV3tjKcHKqUjTDVjWXG9KhxwEosmNTOp2bngHCHgAgBqWrJwBqA/na5SNZufdbKMg5A6KebhoTuhWUmDsnGLDQCZPFMAjKwU7pfVeaz2btyqiUUWhGiGygOiMnrygoIeOy4nbWBRPVWwIh0JAtTsS1v1lfZmpHoM1hP0j3RmCDsjHAIAoPwsv9IlyjYpVOvz1flYV\+XbzwWv8itmPD2X5x1g9WnxAb/k4QiYKStF6kSfHaAEULaSXWHDq8bqUsLZNHeNGvWShCElZ0aUUcEsi6rKsRQD1MilUzQi9zAAVpqa3PhmQIgrFG0OVeZ0SF2tKm6qvSekAAgJBOrS6uCAEcLUCOFZPrOPYZzU7EmaZUvPxGFuQHs3FLMFeCcBGkuDj8nFFAB/DUkeDyvdIH5GC0/hZ4GpD8v1wWSHmWAi4gzQj6Xj7wf1TgJAzQFGnD24mnkmIp81BS/DupU4I1UmoQjnZalPUIdTA0ggYNcSPWaIufw7FegT56OeaPCe7x\+48Bxvw6v6KhmaNKWk5Ym3RqlpATM83QrhQormS5vEiosxNqYJHJhxfdT6ZlJNktDQXNMMQ8AyrakWnRoJWYiYoVg0yFDDsigZuawhDCHUGvUMKjOpCJLOK/EQB5CyLPOgaYWjiZgf9KgoiTL3/D/SibYAnD/AGWosLvrDrBlXookOKzDZhSI1LatDTweiqq6xZlwWJVHxJZSPPHeHcOFYIhYwlKBkEB8/OuxoWhxj8oHglCaZsUwLRs1gRQihlmGe40wKzPBiwrCEpq2RKmBZ9uWXXw4EAu\+9997tt98OAEeOHGlqanrppZdGZ3heqPwfZSMc9VF\+MCKQ1iQhCrIWHfsAAgAgDMMAnXobHNOurNSEFUWH7wCOWpkaCdNsS5vBqJbmSUqTRVHifFpwwmY8rRrhqI\+N/s4CAFBDDfm//vw5V/ODsfjYJ5V88EZI03FZTnKyVhlpwYWimiWEZNkvjz6SpCLJsUSaBGRV8\+lKxOD8jCoEYmaaCanJWNg3vtVNqmPf2ECYa\+m2VCJkTdSE8u9P/YuZyWYmakLnLJOetwnTGmmbVxoTkLW4xMTDQZWwPn5UPVJGZ1ngAwGeAFjG0FJT1xIQSSg8AQAzIYa1dDjkGz7VxBeOJgQGjHgCqC4FNSYSjwEAYfyCHB3MFBB1AgBAjWQsCcFoZcqLoTgA4cSEHkrpiZg1qpYvyjIM00jFRAHSaU6IJysFrDATohAHAKDpuJbKu672QVJRE5YZiZssiWmEWgkpLOhBFigXkiUegLC8GInyaUlXWNbPDzd6SnSWZfhAoJKlMlxZhhoOqSTIqxEZqGkkdS2oicO1YqWTBvH7xwWuCOsLBMeE4mna0ONjj4sw/lCASvFUMEgYXzjsN9KBaCzEmkktaZrAsZRalLDnjZ0hLMdAyprk1woAGF6OJ30ROarI6dTB9/MLlj4kyRExyJHKeB0mlkxb4vCZ/eDf9AvLHz\+0adshqFu4Puzt/MlPt70zPCaXLF0rrJn5ux2vWHkAqJu74p7P81cDAGR//9ttr2Q84Gi8cenGtTfBnAZP/7sfvCRTVE5Fj/BxG5hFEr56ZLF5ThFNw19fOdeWUfIJ82U/jVpn/ZF5/vQxKVmmxmk5kktDFeOzxWM9FuNkgjYCYKZOR\+QcsajBNQDY2SCXCAIAUFokBHSlPcouUIVqoPbJvxYlag3QkRvIdoaUTbMEVrcWO5uySud/gJq9auSYGWYFflZUq03GT0QN8AXcPoCU1pXSAKBWUq8J\+ezAORjilVlbWD19DqoC0jzRZ6cBSIum5p9xeZVI2HpxKBvfTBhiYii4QEhI9ibkASnG\+gxTkAskeHU0YLP0TEQnkuhVwtVkZA65EgUSCFaZ2vEIA5Z5IkKuiWpVhuEk4AyI8wLWOVk4S61enc5OJGtSmsWydpafKZknYumiwBMuwHCQT8ZOVEb\+D2O4GWGhMntcifPPCHIj7wZDV407FoarIpURRSwjCUXdcPDEjGmZypU34RglOAuIk\+VcDKEsW81A/4UyBTi3FCjEYyaxagNstxrpSALVU2Uq5338VWK4ngFnIHrj4GW9ecYysuGx4xoAStQcIIxrwmF1xOdVE1URyYwIxw92lBcsvSoSvUbwO4F1h/kTitZj8TMgdSZJ6\+SAC6Bopihws4Z\+rGwM7w3BuZjSQ7l6LnlGkXrB6E6ZhYic9QdZIeAE4paTN1auFa1kR1qtiygXnWiwRGkZGBsZ9ctqpS2d8cZkNwOldKw9khoIBjwBJptM5AkAgFsQCEnZuODVEbnG0EwtVQnc2Fn\+KjFUnVLaYwBAe1XRiA3OlVA2U/0deUjwuaEYlJ3h2Vh0Fjf47umYaheFeboxb3wBrVxU6Eqz5IL3TwHAwfoJTXSblLnYmuhT5BMzfOA8FCzL0Mdkbp/HSipSPCCx1DT1pG5xLIz\+nhkJVWX5ED/0azH1dmvpUUFUiRDTpAALAIRhCB25yKWWNXK9TNOqGFbMcDQuVaamJwxhbg5HpJCfAHCyHE/IiSMQmnALxC9GFUOK\+BmRDYSFYLDZJBP\+uFUKwSwIyhExwAH4xIighRK6SfnJ1v8IUDMuBWNJ06JAGEKAmumDVjLIx3xhJTbZzZohhGFg5NYYtagFhCOEYQlY1shik8K4I2psbNy7d\+/SpUuPHDkCAE1NTclkspLb\+VGbSiMcs74RlwTFEjV1qKtpJhUlHVQu/XGY49vVJBU1cSNkGIZpDsqRMM8AcKKc1IREygpN3IynUyMc3MS46gIAAMIJCTOYTiaiSiQkQFwdMy76gzVCIxlLUb8vJQX8Ua4yh7vJCjElxEF8ZC3WHxQiQcVHE7IQVv0RNe7XhZBOAgG/5eMu6e/uhHMKWOaETWjG1L\+Ybpd3oiY0g2EJGCNdM2pZMP5b/ElhpWJhUUubFiVM5UykDRD4OMfLscG8jcpxmMmoLHMEAKy0bpHg2M0QhgBQahoGhCKyoSRTZjAA1BqVKWD6KAA1EtEYDSuVaUn9UkxO66pmhcM8A2Cm4klGUKb2UJy0JoSlJLAA/khMEzhixkU/CVKfjyXUNCgfS2qJIABYSS1Bgg/yJhdRBSsqRA02IMvRMGclQEiGIkMj8OnomCg19EhYSqTMwUCPkTYgFND8ISUm\+6dWs9QyLcr4x5x3wvj4oG9cxI6yBm8MzlY4sibL\+yCaMgMAhPWH2GQsnrDSspz0Kf4QzzIMS6g\+ONBm1KZMwwLmwvNsEC6kaKHK2roqi3JYoMmE7CdAGI6h6XEb/Vj\+3BShbt7adY\+uKowscjGk/SdDr3tO7H5mKFMAAMABhWLnm/s2DWYKXO5uz5tToIr3l1KJodeJMwmOEYQZo2rT5pcWaoOZAqM2xNaFlUVh430pDgB2LlCfiB\+XtYKuUz1S4oidDzgZzh2LUSGaZxgmGgNFLVjJnOF3sP6rBGUWY2Qi8VEbtCw59D4X5XgLgC2Z8cPhqEuJz5tksgg7YWxAC0PlLlrUxjB2YOrDci2fOFnJFBiNsLVCZF5l1nrCDKQSA0F1zKzslt4pacXw4D3PUjpx1uBczVYhJh33qfMC3KxoYhaYp3QYMFNWAkggcAnPDJk0U6DybtqKynnG6ktThuUcYA4HigrptN0/NBUCEFdQXhAESwqf4iOsJbVHE5kouUoSJnigAzWyCcMdEXoiap/PP/qNfj1R4GOLRpJpzTOieM4IV4ICdtbvZqGUir4rJp28r2poy2UjSf2xa2X/6A5DQY\+aEaMmFGQikgeSp5MGsPwsPwMALj9f52cpx9eyMODnZ/ER1jdhpgA4feJcf/yU4fekZPBHFgRpRrRGZQqYZ2RlQFC85wXEi3q0U/dfIwWqGLaKWvnJYtCEm6XEZykA1DynSkfl8DFWXxRkXAHBHZFO6yYBLQf84NMTLLME7PBRAyEkHHEn1W6OH1Asu3xepoCV7IykmYg4\+lkSlXruVeXTrHxNkB1JyKcW1VNFH0\+MdInlnWMLW0rFjEDcRgAsc4CTS6Z\+RidXq4qbgUJKz7M\+x\+AoMDpgJPtYsUny2y39mKj1h0PVQ8WtFdTFQmWttBnij3fkbZywICGPfoJGd1w9HU/kTJgZ4EtxpSNtVSa/rAqECFOJMgRJIMIFjJNRa4L6HFO3TBWhxU9Q9B99CK54UMCMS4KiW9QyEyE\+Rgi1LEoYMZgKhQjhRSUaZs3BzG1CWAYs40LPJScE6NDdU2qYwAWG/9pblgXMUILrhVi6IkipQCw50sFgWI6xUoZV6a9aZtqgbJgjAFYqJkpxv5KMDd8KIQznY2DULVwCQGDGZFsgfiGWFGIAADQdC6lcaLLUcsL5WGKM3fDHjLChaCKkyyHREFRV8FlxIRwPamp4KvdQWI4jpj40MoAaugGswF7N\+liqpc3KdRk102mL8Z9XBfPmzXvppZduu\+02h8ORTCYbGxs/1OP6sBqhpUeVFK/ER7qT1EqnTAgNvbAsIFNJtp\+oXU1aUROtzPnY0b20ikmb8fRphDBhdVnpRMLggkEfw/qCgkJSAUHTTWHc1A8foBFywagspZWQ4Vfisp\+ApcshhfMFeDYVH16Jmul0Oq5KWpLyipYI0ZgQVtPABEMSr0VUXeAvY6z2aBM3oatZa\+pfzHkTNiGGsTjQUoYFlQaZTpnEx30yowKMX9SSIS0cinGKpgSYlBKSIRKXeQJgJUetyAYkZShTwAprYzZCzaSqJgzTTOopElN5liNp3fCzQMZkCgAAqUwFMLRzzu/TFUmlgRDPEOIXouqUC\+4LRZMhAvrgQxEB2FBUUyyFyLGQGZGSocplLU3HYzorSH4tZplJJZrmI7KhaoqUYsBIpgwzIic4f1gIj41EEI6PKEG/KMQDMVXgUkpIYaKaODZTAAAIF5QUmScANK0KkXG/MOfXNi9JpigIZjQm\+AgANTRJ0oNRRTlvIAwhLBmKTTH\+UAjCcjwY0VOhyppcgGdULZ4SRk/TYiTUhOWT/Oz4sXZDzFQ8afpCwcoPMmF5MaqkdFFPm\+DnJi31R/znBgAArGPbto3NFPjLr64eeuG57otP/e3iTNuJbN3clrrWR7/3Kjg/jEyBypwCw10\+GO4M0H49RZShOcOskU\+UjYQpW06appZv9JYcnM9hDUWVJsgrIzawzsWUXp84y4oel8DJh2tM7WzSmGmmzo7KFKgoptT3Uz6v7KsyGACws8EGQX1XFElC9U44YophXYzVb1oALIDVnzLtvsqIAzpAmRo\+WANQthiaTtUEgm4GIBh2jfm7a/UO99IHD8HsMxn34AIzq8ZtYbE\+maqX\+B41YsQrs7hTmkqXWRNC/qopVPaoypgsU2D0OozDx1YzZJKGPKhkpc\+lmRkSV8tEF/lSVlTNGuEZE8aLzVRGiQ4Y58UuLDMrBd9UhhfTAQNmhC9\+DDD2WWVlyzin6gVOusaXPmOY1UZigBertDgNh2qH/0xRq2CRKpYraEoHtQYzBVgoEG52pVwEAGh/ynT4GXvK6o5FOhKDmQIFPz9TCNcTWjCMwkQ/M2UrTdMcANgZfy1rWFqKHQmgmFZMLQZEhqSsNMNURhYQdoagzEkEz6bNUpCxM/6ZAXJMS2SJbg9Ez\+vVw\+CMetTsNQjhSTdNj84UyPlDVwu8k1r96aHRFmMNmGkKFACKRqo7Ge8z0/0xDUJBhljd8VRVQBw3Dt/uF7mRTAEChNiBASv1viyaSfYqVa3nRk7EcP3ChDMaUNOShQwNX3VPMmeoHRHfZ5SQa\+jS0M74Z0lcWdHdPp\+bYS3Tx4pcxoyS0TkOft5pmicBBvTouxEtTwEAOoJxAAApeA4IEaKc6L/ivUf0Ubjip5Udmj4pKNFIXGG1sJAMqZrIpaOhpH/sU8YYzsfQVNqkgcHrTUqpZaQthrB\+PsBzAJYQUuVwIDa4Pi8P984sI2UxnO9iF6rUUEUx4YvFx9xyJH5B9IdVLRWSecZMxjTKyyGOmAlJVJlIXB5zsc7y4SCIUS3lF/2Q0mIJ8Md8rJ\+baAvUUIWQyilaJMiYcSVm8pHQZDnChAuGuagaS4aUIGMmYlqaDfMfaIzx1Iwazh0CAGB4WREEUYz64sKlbIfhRYELq/FUUPRDOq7qTFAJcIQNiYGYEksKsSBr6apm\+MXoRP3mxsbGl156yeFwfASXaB\+oEY5CuICfRCqTyldQ04CQNjQLhpkygfNfNDJlJuTz2xXxTVxRE67M\+EMhJhxT9aDMk3Q8Frd8sp8l3ITNeDo1womry0qpsmSZcU3iGWrqCd3iQhM\+4PADNkJqJKKyNXbCuhEEqGkwISUZ40lKEYJJVlLjEJXTrD8sB\+ORaJKffJr1qZikCTF06l9MlmMmakIcKwajUixh8GGOpjQ1xQkq/8EiGB\+qUXMKBAAAuJASSYYlWYtHfZN95kKZAoQNiHKAGmo4njDAH5YFPwNg6daoTAHdYMMAMDQb6dB1LTVTB81kiFeHZmsYPx/ppAjDjOv7Er\+ohCQhqAIf0YaaBvEJkYCficcBWD4SD7OWJqhjtzR8jT34tbLSBisDEC4kC3FBVv0x/2SFqDRhjgBQM5UemnJwsHwsQ8aPGjHjETkBksQNHa0/QCKSwLFj/8JaRkKLqCYXZUmqchBhWdBEfWSMHhsQRV/gW8GgGY1KQR8Dpq5FJPlpIvxyXHxjDCMui2k9pkZCPgaAmilNTVqc6K8EUCzDIhPnGXyUf24AwOFiJsgU6NRGegrZk63RbS91LvziY38GAPDhZApUEHLek6gpwLh5yAfZuCCrnJ8pMIbdF2KVEADtrgwfGMpEsYejHMPaTY4AU82S/iTH8ByNDH9uMM\+/ZCaOS5pLjs9iSdEYLGGtGJuXCh6T1DpNnOBOOPFdFeYOa0kaCFebyTNp7qrBm9g0n9KzKbMEAFa6YJh9ycQAAQDWzfknzX8b2mjl/wrJqGkEG0XutJ5y\+MLzooECVLLTzVOC0RMMMud9W0tmMqMZJDy6f06pKhqxdBEAqDWQCLxZ2btllQnTHeSPAdjZ0DWxMBAfI0VmWvEsCc3y0TOS2hsMu9jUQFLNhZQxEzFSw1KihZA8kyN28LkDTF7T\+s4/DgrA8POSOgAUU9qJmJofPYMHw3qUKBfmhtqAeUYUc2M3YPdLzUmhCIwDUqYQrVJiV7EwejRHyTLyaZ36QgzVjqucN8oUkuAIkjLAQDp\+yri\+Ht7O6tYAbxQgUBuSakMA1BjMFBi5YzJ4UD0pQoLEBmy9EFkQGpspcKGo49B2GN9Vgv\+0FG5nYvOEAGGMM7LQGeeuCRIw9ZNivDuqNoZ8DoBCKn42TYhUuXvP1IVDdiGWIYw7NhRNYFg7jHk0Y8lM9VDOzUAP8c2SFS9Jjp9T4MIZIzR9So708iKnRysrFnXl/bSfjXDjvoMlI/F\+xDpDAEw9TwUAOpCOdQgpt6A0RwOEVObUsADAznC2VOyYzAC1CuS86xRqnJGFrnRovhouRAwQxCpVflcw5iniDI4AkNpAAKzkGQAA2q/Hc3roahHASp\+OSN0ANWLk6lGX31W89JmkBJb\+vmq4BZ5G5FwgMi/kGyw8tQYoqf5kRv/R5fqoJxrUh54uNGapYcDo0CRNx6NJIqgBloGQ4IvKsuoT03EaUMb2TRhfgCfxkTGA1DIMQ49LaTbgH1yj8lil81npRBr88sio0EkKbCTU\+MF9\+dtmbhladPWf/GcqHvYJqsYocoBNWlxIisbFAEdMTY2//vr798790dC6rqXbUgnRF4iosiSGuLUdsGBpSI4pQQ4ITLAFAC4UkVOy7GfutZibw5HKs8nASor\+ZT/qqGz0/rlPATT/7WupKC/EYoY0uHIwHFVF/qP\+OhKOF6NaIBzkLF1NWJXzwfCSlhSAYaz4pWyL8cuapkZkP6uDLyzF4iLPAgAbisVJVA5xYYMJSpGEFpqsk7lw4cLLOISPuBECTSc0PZ02k4Yg\+kKxZGjSgqR13fIJ/ot1lszkJO1qooqabGVeUhVTEri/b6NX3xqSYpUbdRM140kaIU3JfMuWg5Vtvr7Q9nW4\+qHnUmrQ96luhJNUl6DEUqJ428xvAcxYcGtQjKmTjkO4vEY4dCBBSRnMFEgp573NBgQR4qoSFhM0GNWSgh\+SksX4WML4pKggCoFQSImOGvEwufFzCgw1iwm/a\+RSvpgTNyESUOJRNSL4xDTDh2UtHvYzkzahjzlawPjDEVUKhXmSjmsptjJFKBeKJQMWYSp90PEI4fxBUVAqKT\+Wzkb08698rHQ8DqKqQFQIpRVNCbK8FIuZLO9nwUyqXCgw\+DQAQU0Kw58y40Iwxmvxiz2XdFJDt2WpmUpoUUXRTI5n9ZiighDgfRzD8UEOaAoAGMJyLKEWEH\+4MnyAGqOGDwDLi4rGh4OsmdD0yrBQn6AmQsCQVGKSvV8oU4DxBTiqpQwaGOylU0OT5SQ3\+gmFxBeOxYyQIEhsIjb8KFNKTcMKRFQxwKZTQI2kGk3x4aiUCodChhKVQz4GiF\+K65wiy\+Jt/5oHAICrl/5VdK8sDA1NoLTt6XvnPjVcnAV/tTcVC0XjVFFiYb\+Q7jgHVzfzQSGSECuzc1AzlbK48IThP/hg3/SL6Dmy6Vv/z6apr99fbH/9hS3OTBbA9eZLm47nOuGmy987Yat9TJkAUFLt89kJAJAqjnMyl7m9kqln1Di16ODwgQSp8ofZsC\+fiJywAk49XReiXSl\+FtVyEJsnRwjx11L9dIqpY6BkxI8Jcl9QvXb8zwI7K6JkQ9IxNdAUSL7jX9uXBwDIXl9z3LX0Gj3BiuoCkA/7pAIXYqPq1T4CYFpKxDKZiSarN3NRKecXrxH8DqAl6/wVaIlalUfHOwORa3nioMnTAABgZ9iLzt9WMvSMos3gQ6OCAoQIqk\+Awecp8tGFot8BlKrCe1HLLUevCfkcAECNDAAAHUjHTTXtjPpOp8hVIukBhvisjKzUJ6IMY56Lye\+nrEJSzAcjg3dozeQxMdLLCvMGu3BWb0I7a5KCppaYkSQtO8M4faGG4KgnSlpWr6YcSzHDr/tTZvWYTAFK47KhpOujWqO/ssDICMJZVpqvhGsJANDeeLwcii0KWacj8f4UPadIZU5ayPv7U7FjkkIijztMo0qIzufZ88JP4xVSWo4GOIZQy\+xWIx06AwwHWqRDY2rDotcHYKVOhXmLIVB5xl5i6OGOllHmA5WqrhW1a0nkqHzv238PAGC79a/mxRUvR4CTFkWhMxp\+SzhYpFdX80FvND576PfP4Q96WOUkROYPRRUdrJ/AqEHylPYltAKnVAEtW6nTEbmXJTYOLEW2GB8jCDMABtKqEUhWEQBq9acNK5g2CQDQsmFVKwDEx2rxkYNNKoflZF1UG3z2BIXyUP6FnQt6I7KbgVIq1q4AAKnyiQtU2c0AWClTTtatHfyCOAPytYExdTiYbkTNc2rkRDRRDCiL4uFaYp4CsLGBeYmkJyYd46PHQ5H5ilDPAFBaprRspU9p6bIZ61QFB/FdFYlOPBsCNU5J0mkmMovhqoXgaSHUbsWbBJ\+9MgUD8c1iJ/i\+oU\+vjzhTgPHLsfOGto6b481KxeQYkdTKsGsuHFVNORqRLb\+i8QQALNOwBsNxDC\+EGEFNGEGBI2ClE0kixpO\+uChJwaAuhMOhIO\+bqImaSTUJgWiAu0h5iU9MUnHiQ/GFlHho9JU8G9bMcWmlw4c99BS4C28BABhfOBoPR8ctDMSMcmyCDXNBJR48vzfxEWIDglD5Bz/4DwAAIAyxTNMwLHpJCeSMX4gmhOi4pYQLylpQ/mAFvdBOP7JGCGlNEmSdkzUlHQ0HU2JECgcmuci0dC1u\+cXgRTsDk7erCSpq8pV94WhifMO6hEZI/EqqPFFTI5/mRjhpdQWVhPERHhOlQHxCNAqVbhDjF6MK4QhYpkkHl9F0LBSQ0r6wKCeiQT9LAMxEPMUEBI4AgC\+sxtmorCWNwEUeAk/4Sc4cAABM/F27lC/mhE0ICBsQY0lx9K/WpE3o40V8IcEHAADD/6gsJ2CapmFQGF2flZxPLqREhxcxvBTlgVqj1rbS8ZgcTQWjsaCf8ROQVC1hmYoUM0NqIhrigKZUMZqKxqOThjgvGU2rohhNpiHIJyU\+kqA\+PhAQ1VQo6CNmUlWioqIEYvHhKQOGswqolYqPGT5AgPWHhbCfDwsAAMAFBW64Vir5CNb4SSEoABA2GIkOPQidcMFIBDhCTdO0wA8AhAuEfFEtmRb9fgJgJiJCxAip2rj4BxOQ1Gg6JIkxnyb5KxtmeEEJAABYlmHo8XhQ0/ws649pJBqJShGiRoPsZC2vgg3HzfBEb/jDihae6DM0nYibvrHPGfmoea67fevDtzbVXWCVQufrz0d08MxZLK2dma2b2\+hsBYD8yWMHAAAgb51ohdlNC90uKOYLF9jORGg6E4n2UMbGsjYAIIxz8I8VqWIJVWXDIvVSZDZLS6aeicg5Bpw\+OB2RTwM4fXBGkc\+Yet4aqeYyAFipM4n4uAccDqQSp2q7QQe3FCRWqpsLz6JWTVBx6tqxCMxS/HaWsyXk4yR6DQdE0q4JDaUiU6sM3OBW2OA10YhFGbtPXDzBVRlxi7HFY35wWEaOMcOvzIRhJsZOFD/IGQhVR7SBkDZ4w9xKHguJJVaAwWFxxEGg8jDS8\+csLE9Urw5/mJWIa/xffppPqsckhfLRzwiVAyRE0Hx\+rVMKpeMyFxXqCQBQqms0CVWm2iGytaLmYa0eICQUYVNCJm64mGjGCC1IhBxG4rQaPxqQevS2gTyAa4aNibybSrCqyqSVrnSgMaZVm4kuOXLUxx7lOMfwNzie6I2ojZUfBoYhYXneqEyBU6LYM1Jk04qEj\+n\+uWp8to8AhSJAFfFdrWpOWTgcMuapsht0y\+Bn88njslEjas2R9MlI1PrX\+9/Uml0cA4SUrFK9KFUSN3rjsdO6WQKAkeEDBCrZJQLnYOkZNVmCZBtf2X0qN3JNBj1pqFblqxPGqBkuRxSS8qgBIEy9EF183h8wAEJC8rWhSa4tib8xaY1JBGL9jI9mkumS328H1kn0U3EACLdGAYCApefSw6smqcmSaOgz6dBEm6a5qHh61A9LyUgcl\+Qzhu/qmMbyDIB1TuLf\+1er7nvxGgbApCVqAUDJiBtSbCAYq2aYWogMzjJAzTIXYS4UmrIqx2on3MxY0huonFw61FbZGaLmDqdzKepioKhHj0gxygo1sUi3L3qdxuWUiJmKn\+bixzmuiuPZWHT28G8iNa1I\+LgR4OJBJwD4hYWq1S7IJ/0a6weaTJb8Yt3HHORHH7GPMihAKaUTDTcbt5aZhtDgjUwAAGD5YJBL\+8ORIAs0HQ36v5Xy/61W\+b1l/ILoC6mxVEjhaVJN\+SQlwHNBPSho0ZgWk\+Mxapmm0fF\+fnBjN69/Lan4DS2ms4J2ifOTowug6ViI/3uD/572SUoTPt9H2wg5I0VDscp0dYFAUlViUlBMpdqG2x8AQPNfPZeMBWg8loBg7LxHEqDL9ylphLRyyUxY33CXlHB\+n5kQuHufggeflIeeb6mlBWboQo6mVVGI0XA0MhzOYgOSGvh4i/4HzUpK/vvjzEMxafgpfZROmrBqJkRe0H2SGmQJWJbFSppambKGDchRKgZF3R9JxCszCrLBaFxV47RzlyT\+i26N2gw1UwfNxMjwAQAAwglR9aJzkRIuKCucyPj8PpaMDo4BABsQo4FR/SbC8kK40n0nLC/IfCDkZwBGRTomZcbD/vvj7F\+p8eHwOrUoZStRgZEmDIT1\+WhKCQQUGorJLAAQX1gKqlI0EVaDVJMiqWBMkyf4q0u4UEy1RFlNhqMBlg8GRzL4GV7SdNnnr\+yb\+EKyNtkl/QdkJmMqDUYnHSn1kci\+8\+ojf/fqRVfzXLcof/bIth8/337N0PCBUVyNt2z9h9vhRa29/xJ3T3xeJea9\+HqBBXpqClvjmHComvPXSv7ZE71f/OKNdoax\+2MMAAQAaPqUxc2JhusZAOBmx9RZQOwQunqoSRUSQuu9cdf3k8NXpU4\+PIXSToLhmPDwUOqhIqViR2WtwAaviiVm\+ZnBjjETmJfUr4rHjotSIRYdnMWAcDPCoWpmzAHXhsKOiWJIJTNF2QAzZmUo6jEjotdG4lxozOhrhz/MJfynYskBCkDogJnuTQuLVK0qpb2f4mYHjc6Q3OtX5rDcjGiCIcQB0WtDAADgC16tBCfsIYNPubbyDy7YqAUvNOLFouWhn7iiLr9925bC0vVNQ\+GMYko7Q4WFcaGegWJSfkdMOkPybBaAcLOi8WotXqTUzgUaowEAmD0YHQrUJye\+kQZABscOTGJ2NDFhy5kKZ0AZd8P8w8B6xMBJWc0J0RlsYMGYp5ldEuKWVPeo13bOP1NS5/D\+oQbJzIimb4kO7zZ8bTwMAMCEFg3lmrLx1OifzpIZd4xrYQAA1jkpaCQZJiI6gXEJ8qidMjWhsHOoudoZ34wAAAD4w9doYcIxhVR6hs/vIuBStNkTRE2Zah8tpeLnWKkpHh6ec8HhFzmVH\+AIWMlTcTpDCTjP/yj6NLOdyfZcfK1RDr/z9i233PIRlWYqqKEJoSirxKNTTEO1dCUk6mFVm\+Sqa/369Vu2bJnonenlQ6\+Hj7NiP\+aTeKmNkKZj4bDGx\+KTDR7GRliBjfBTt\+tPlCtXD2OfOfth\+HSeU0uPhiU9rKoCB3TUYyo/WWhaFQTNH9WmNJvDeSY8Ndyf/MOHULKPgPFf373SRUCTKtELPXwRfeysnBI\+bslN2N29ENOShPfZSJPMX/F56Ya98cYbi667/kqX4lPvk3NCp4pwYS01YZ7gJBheTqY\+qtKgaelSGyHxifHUZNF0hNCn3YccEfjUYngpMXR/7ZNbI8QnaOcP8EPoY4cRgU8Yxi0nfBdfbZpjmWiCudKFQB\+FT19QAH1abNmyZf369R/bvj6eHaFPF2yE6FPq42y66JLgNx0hhNAfnk/f8IGPAl57AV7oXGnYCAEb4QeA7Qew/aArB4cPIITQlYLDBz4UGBRACCGEELp8GBRACKErBYMCH4qLPkYUIYQQQgghhBBCf5gwKIAQQgghhBBCCE1TONEgQgghhNDlwyx9hBBCn2qYKYAQQgghhBBCCE1TGBRACCGEEEIIIYSmKQwKIIQQQgghhBBC0xQGBRBCCCGEEEIIoWkKgwIIIYQQQgghhNA0hUEBhBBCCCGEEEJomsKgAEIIIYQQQgghNE1hUAAhhBBCCCGEEJqmMCiAEEIIIYQQQghNUxgUQAghhBBCCCGEpikMCiCEEEIIIYQQQtOU4zI\+88Ybb3zo5UAIIYQQQgghhNDHzHYm23Oly4AQQgghhBBCCKErAIcPIIQQQgghhBBC0xQGBRBCCCGEEEIIoWkKgwIIIYQQQgghhNA0hUGB/397dx/kRnUmjP5RvXvR8R\+2OlU26lw7VgMBtWFBDQTUJPGqQ5xIfCQSCckoF8JoITCKSWpk2KoRbNUitt6XUao2SKkNjHBekMLid5SNibR8jSBm1cS5dxqzWbWhFjVkQW1iSm1MrdqmttSTf3T/0MdoZtSaD88n8/yK2o01Uuv000\+fPv2ouw9CCCGEEEIIIbRJYVEAIYQQQgghhBDapLAogBBCCCGEEEIIbVJYFEAIIYQQQgghhDYpLAoghBBCCCGEEEKbFBYFEEIIIYQQQgihTQqLAgghhBBCCCGE0CaFRQGEEEIIIYQQQmiT\+ovFfuD9d8sr0Q6EEEIIIYQQQmhRLrxkz1o3YcNbdFEAAK6\+\+uplbwdCCCGEEEIIIbRwf/jDH9a6CZ8GePsAQgghhBBCCCG0SWFRACGEEEIIIYQQ2qSwKIAQQgghhBBCCG1SWBRACCGEEEIIIYQ2KSwKIIQQQgghhBBCmxQWBRBCCCGEEEIIoU0KiwIIIYQQQgghhNAmhUUBhBBCCCGEEEJok8KiAEIIIYQQQgghtElhUQAhhBBCCCGEENqksCiAEEIIIYQQQghtUn\+xQss9ePDgCi0ZIYQQQgghhBACgD/84Q9r3YQNb6WKAgAg3PD/rNzCUR/ixP/B4K80DHIfmyc4m2dNlwbjMy8M0VrByK8VjPxa2aCR36DNRucON/1qEif\+D94\+gBBCCCGEEEIIbVJYFEAIIYQQQgghhDYpLAoghBBCCCGEEEKbFBYFEEIIIYQQQgihTQqLAgghhBBCCCGE0CaFRQGEEEIIIYQQQmiT2hxFgTPH/sG31bl77n/bv/\+L5x//7nbn7ov2//rEFAAATP3p8IGrtzovvv7gv\+unnwt9affWL3z/mZMGNP9357NfuPqq79/76O/\+ZKzxqi1SZy18saNn2y\+e/HXwC7u3Ondv9T/\+5hTorz9wWY9Y/eUtL/5pdhCcu7d\+4Ytf3B97Rj7T\+QbjpPjoAf9VX7p4q3P39i995YYDo4fLHwEATP3nk9\+/eKvz6tCRj9rvbW2XL/7Dv\+tzWrj9\+8\+8OzW91DcP\+rY6d2\+9/LuPlY32F/36li/s3v79J/\+/V\+/r1eDdW7/0g8On\+8bhC99/5qQxa323f\+kr1\+8ffeH9MyafXHZn3jzo3\+rcvdX5xeHffTTrb6defyb8/a9c9oXdW527d13vD/6vXx89bSzwrz2s/7VeQH4CAEz96bcH773ed/Uu5\+6tzosv8vlDB8XW/gtnfvvQF7c6L77\+l//RiYUhx65y7t7qHz021S\+R3n2//UWz//vi8O\+WGBnz3eHf/86/e6vzKyOvd5ZsvPtL/3bn7suiot5J\+On/Lr7I991wazX7/3VBu/Bl0ZdPtbfF0f/1la3OL4bbG8Isr3T58esv3731\+ntf6OxWp18OX7976\+X\+v5MXHZ9TvzPfbZXmYn2dxeryaPOrD5/sk\+EfHftNLPjdr1x0\+e6tl//lZd/9fugfXn53qu8XnW6F6yrn7q6OqM/x4pn/L/\+Di5y7d/3g1yc6X3taDH9p99bLv/vY\+wYAGO\+//Gj0u1\+8/i\+3Ondvv/4rN\+x/4MnXZ\+/X60SfyDz9SuyLzt1bfQ\+0t7Xx7i\+/u8u5e9cPurvlmVo9fHshl//lZf7vhscnT01B/5CaLvBTYU52AUD/3f/FfzWP1R9\+/8Blzt1bv9vuCaHdPX7hB4dP9muDaW9/cvk7vWUzK6NaXejjrZZ3jyh6jC5aWuveHbEF6Hts7d3P9OiWW6Ojj/oG\+aPmp676X5N6Z30v9z/aPjzB1H8\+1nrx\+0/OHYi2/7soKp7qvSoLdo7fvpCPN7dI\+dcjP/Bd9oWLWyH6wQPPlJeeaZ3cvuhA54g23bNd9tBkr4Nps4PyP/b\+7IHQVufu7V/y3fLQMwsaaHWfILTW9z8e\+/7F3QfT6bfN6us64fKPdoY6p47ce1Gzo\+jXl0In02bkzIz/vjLy\+pmlpMoChgfzr9GaZO8c/bdsvzFS75D\+5S2/\+dOpJZ8c9V7m7q2\+2DyD0taI9z9f\+IcfXH/91dudu7defvVV37/v0SP/qZus5nSTluYvzjHwG4OVuvDSL7usUzClf/j2Hz8GOG/X5Xt2EAAbu/uK26MPigMPvZoYPcqn9n3u1NHEQy\+dBvbOh4NXUVNzD7PW3exFtqmzH1RO/vHY8w8de\+239z89fs9V1Oqv0zmqvPZC\+cxetw0ATh0X3/hk7jt2XMzuoqydf267fHvnH9bd7EV2qxWmzp54/723Xn3qh8feg3/\+xe0XEuP9Z0Lff/DFjwEAzt95ETn73u9fGvv9S68ceezp5N4FtevEseeOfgwAMCU/99sPb73kQjLjz3\+WHj34ys2Jbzq6XrNuu\+yaa9\+zT4Fx9r23KmcBtl3MXkRZAbZfZbfCgu24mN1BPjn51ofvvfHq2PeOvrb/sad/8lfnL/zzS3T2vcMvlgAA4OSRl94\+9Vfn21t/ME68\+OCN9x3\+AABg2\+4Lthkfll58uvTiqy\+P/e\+f334h9P0r6f1dPay3tW7rk59T//HkvXdEjp4GANi\+azec/qBSevandxw59tBLj951xbaFNaBXIoF1xyXXXvnRxwBTp99VTp4BOP\+CSx3brGDddcmOpazlue8OsPWiyy/cRmDK\+PjkWxXp0E\+lY6d/9a9/e2Xfv17X/nCfXRg\+ePHxQ0H\+Ps42q8n98oq79YFv/fpb2ecf\+eVdX/6bqyg4c\+yXicMfwu7ggXtnL2d\+/Xbb/9vzwP3fOHrf84//9NCt/3v/FfAfh3761Bt/3nHTjw7cvMsst88cO3j3jT8tTW2/ct9Nt\+2eOvnG0deePf7am1O/yt3Uv3/46I3ca38EAIC3jr787j1XXbutz/Fih/X/6rtWJ58L/\+BHz35ovfjar9\+216qXpRdfPfT7Y6et\+Z/fbtryNdNnE1zA3/qTO6Qbnz70yMFvfvlvryPvP/93B6Uz5/Hx\+2\+9ZL5O1brz0ku2Tp15/70PFOlQbOC3Rx\+ZSNzaL6SL6KU3nLnZNe9H/q9t5rE6r3/6zaNXb79nmTu9lXDxV2\+7\+cJtU5\+cfOPI879/Kf77Y/8\+9quf375Szet/5J0y62dmdctw9uS7lZPN0dFU6vv9gqzMacKf337h2Hv791xGAIwPpRfkufWM9his/c/z92xbtt3oHL\+978dP/e6BW\+4\+9BYAwLbdO3ec\+fDkW0cP/fCo9PvHnk7t\+9y5tPqj4y\+/cdp78w4AOPPuq6UP5r6jdbhs23ap/bzOP1rHSuPs6Xcrbx/JPni0fPZf/2n/Fda\+ybB1QQ2bZ0yrHHr0xe9c873P9zw89OpLb5/RA1utdpa/ZqpVVzDOnnyrchrO22HfNme43v7nQlLFZHiwsDVa2\+ydrfeW3T3zr23NMVKrwdadl14xPWTadsn2TosXf3K0E3otE6wXXkYBtCoBPQelAHD23x\+9946Hjp0FAOv2XRdbz/7x2OGHjj1/\+O6nc39z3QKatEiboyhALvnWoxPfAgDj3fE7vhiTbDc9lIt7O\+chdz545wvfHzv0D49/e6f3yD8c/gAuuvP\+/Xu3Acz9nXkr/8Bjv7h9F4Gpj4795sG/jr3y\+398\+Km9v7pvz7ob8PWzdYftk5NHj76nu6\+i4KM3jpY\+2rpr99TJGd2o667MP\+2/YlZeNQPSCQI0K6OB6PHSs/LJWy\+0vvCPiRc/Btve6PjonXt3EADj1JGHb7j30G9/I31w7ZUwr6k/HX1R\+ui8K/cPbjv8C\+nZo\+/ddeFl3ZG1bYWPXnr88aDnJ\+7p3mrrFXdl/ukuADDKo9cHxt664Naf/VNs7wJPDueu79n/eOaRH/0w9/bjjzx\+M7f45SySXn7uiAK7b/zh3vfHDh177o3Tws3Nsc5p6dF/PPwBWK\+54\+fpv/E6rADw0dF/uPuWX7z21JH3br3ldL\+/3nPZQtNxva11U7/8NN79Tfyho6dh\+9fjjz1yL3c\+AOjyM\+F7H3zxaGIk58kNLmio2DORYLvw948LAABnJ4cDA099eOW9iXPZtf/Ud3e4aCGLuPiWR1762\+soAAA4deS\+6\+89/MejL7919kpbv79ed3nzw3124fO2Wf9cevTgKzcnvjNjhNE/6\+65bO/d\+286cv\+L2cSz3/rFbfD8aPbtqe1ff\+BufnZNZwEoru9uuy/68I3SX7/0\+EO/4R\+AxOixKdveA39/U\+\+REwDA1Mk3jrw9BRfd\+ejTP3PbAECXn4we/HfrLiD9v\+h06dljJ4G99cCFUuKlV54t77/WbetzvDj14q/7rNSp98U3PgTr3oeyj91\+iRVg6k8v/EP8mU92kT8vPkArb55NcE/0zqN3PJWNP7Xvkd3ZxIsfW6\+5P3rb/LvDjpsffDqz73wA48TvnorcFz/yanzkRX687yH4U6tXds33mfM\+bx4r/XVx6Y3p2dv/c2xZO72VsOOKbx34\+33nAwDcf/vIdwcer7z3xodTK1UU6N8HDoJZP9M59el0y8bJl0d\+cPdTldILHzwy/vi/EOgZZOPNo91fbwWwnn/e2TePSB8EL7vEapySX37rz9t2bz/7wdmud3WPwZbTOXz71H/O//Gzk48\+cugtsF5\+x88zf\+Nt95A/Cj1dOvTI4992jX5tqdvUun3b1IfSC\+WPbt5xPpx9\+4XXT1p37oIPZ/yq13247NA/BIAZx0rj5K9DgftfPP7ykffvvGJ7/2HYAlo2z5jWaoOzR37x\+JF9j97cY93N\+tJdXe/53M1/\+083t7/rhYcGvlfZ9uW/eejOPaTHcH2BzIYH86/R2mZvLyZb9s45f53WqrB0gj9Nf938U/1PjlpFgR7LBDDeBACzQSkY776YePTYWdj59eRjP71rjw0AjPd/Hf7\+/c\+\+9Os3Bq/7cp8VWZrNcfvAPChu/8PBS6Fy6K9/8KPHK7D7luiD8/5Yaj3/2m899MBXdzSrYhvsJoLtl15zAbx7VHp3CuDs2789dvr8PVfuXnI\+tT5oJaffPnLsNMCld/7otr07mjs8se97aOL3b733eK/OZQ7jtPTssbNW7pvfvumbV2ydevPF12ZeWbrjmltuu\+a8t5/8\+eEVvOJ022W33//QbTtbP1av2Nc0nXnryGtvwa69N33ntmsvgg\+lw8db12jp74tHKwA7v/HAj5uHIgA4f\+\+Pn/6PN97613suM/r\+dSl97fpY65Y\+\+Tl1\+tirpTNgveaeA3dxrZ2U4m79\+x/xVjj7xhHpgwUlxqok0jnvDivowq/f9dUdZ159/LGZV7b3zzoCQHZ948F7eOsnrz168PChg48f\+cR6zeCBW1fi6G793M0/jt60/eyR2B3fi7125jz\+vv6/UVu32XduA3jvaO6VN88CAFDcXanHH/vZ4HX9zzxPHX/utx/Cxdd\+5/ab\+N3w3m\+PvK2fS6u3fd4OMCU/98zrfzKaa/G3j2XjD9y6iIt31o0dwoN/c\+vuP5ceuveO8Esngb3t4eCirokjjr\+68\+Ef81Y4\+8ZLpWW/OnRDWN7sWjar2tsvJ/3D9979GGDrRdfsXKkOdJ4\+cDH9DNl15df27ACYMqYWfpiZgvN2XePeNVV\+\+eiHBsDpN468bey88pol/\+63OOf47fN8XC\+//NsKwM5vPHyPt9WZWz938z0HbtsJ8KF0Lncv2i7kLz/v5NFX39YBjPfFox9ar3BddE41x/PAap3/gDiveca051162x287cPnH/ll171FPSykLzXe/c2Dw7mT59/40M\+Cl1ELWUczJsOD1tf0W6O1zd6FOQ9W79q0zsnR/G81GZS2R7xfHozetqdVLCAXfieZ/7fT/9qzkHTOsCgAAAC2vfdE79wJZz4\+C1s9993jWVBvYt1xxYU7AKZOvX92gxUFrLv2crum3n/59\+\+f0cvi0dPWK/ZeZpu1nxyPf\+mKrntUrr/vt53rJj6RRu8NXP9d//Xf9X3xhkD02BTs9Nx27Q7jk9OnzgJs3XXF9u5CF7Hv6P7n6Wfv/UJ7sZd/9Rdvd/3J\+ODoc298Yr1kL3/FhVd\+m9s2dfzlIzOPE1buO/fdtGvq2JOPHP0TrNyPb9t2XbPTCnD2xMcrfLfr2bdfOPoebL/yZteuy/d5LoaTR1\+UmvcqT318\+gyAdedlju7tYrXZt5F5/7pE62CtW/rl5\+mPTp8F2HHJBTu6VpWcf\+FFdoCp03/SF9aEVUikhe0O8/hj7sEbv\+u//rv\+6/1f\+eK9hz8A6zXf\+ubl2xb01367MOy4\+Z79Xz7vvUM/P3ysq4S/gLwiV9xy4C4WPsg9GMmdhAtuezi4pCLUApALv/H39/BWOPsRwMXBA3fO8\+vl527\+cfTbO\+GPufu/dM3Fl333\+6H/9eRh\+aP5euaP3nhR\+ggu2rvv0t0u7zXb4Y9Hn3vj7Dyf6YPibn34bt72iZS4\+0s7vvSVG/Y/8He/Ed89hwWuLfveAw9/dQd8cnoKdn37x/sXfwER2X3BRXaAM6f/88yn\+sEBJpY5u6Z179pfvf/FHnf/zWfVevtlMD1m\+FzgwSNw5f74QytSiASA\+fvABfczU2fefPHxx46eBth1yYU7FtNcq\+PaS8//5O0X5JPG6bdfOH7W7rpu96xd75PXfvjVS7puIfYt4akuK/Pt/T4\+HdvuBW7bdcVOK8DpUx8vfd8g26/ae6H1g9fFt86eefeY9C5cdA03\+4Tpj08PfK7rvutd\+7ueC3P8yVDzSPpd39WB\+1/8BGzu73xtJ1nQQKs7GlfcED3WvUPNO6a17r5p/50svJVNPDtPTWSevlR/PRF\+5LWP2DtTD878yWEpqdJ7eLDANVrT7J3DZMu2/9pnjHT6hUfuuL71Wf/137/vyc6DEhZ/ctRZZtfpz\+6tzotv6Hr0lcmgtDXidVwwY3BP7Th/RpfSb0UWaXPcPjA//X3xjeZ1RJ\+8d7R8\+rYLP7egTnyFr7JeMdsu38dfnDv822NvX3Na\+sB65b2uHUdnv2fGPSrWnZfZpu\+1mfpAebtzr8Hurz6Uevi2vTuI8X6nMNZP1001U/r7b/\+xM6CZOnn0pdIZuGjftbuI1XrtV6\+0HX3t8Ivv3bmn\+\+epHV\+\+Z/\+\+Iw8\+\+49P3vbw55ew5otCVrigqMvP/bYC59/ovXwHoazevRc89dSx5944\+U3HrvkiuZINW8u1bumTn1azMq8VFhWWVUmkc4/kJ\+\+9dbz9v8\+7cn/ipw/s\+zwFxgf9/gp666U\+uzDYLvzGg9965sbsk48e4e9aVIO3XXffj2994d7DH8Cub//4rmtWrg\+cOnns9fea7f3geOnds9f1vx\+bXPidTP7K21585ej7//nucemFp1979umHL77l57mHv\+kwW6\+T0uFjp2Hn12/eYyPbrrz12h3PvvTaC/JHX1v6YzXO3/s3T/9h3yuHj/z7ux\+\+ffToocSrhxKP8A//71\+Y3Z\+5rp19\+4jSHFycfPPo26f2zXn2x7xakd\+A637ulj\+7Orp27anTbyonl3xmv9K9/bJoPlMAYOrMh\+\+9cfS1xx960L795/ftWZkvmy8g5v3M15tv\+OPTA597evr9u2/cv8hHrlh3u7x7t79y5EjpzW2Tb3y845p9l9qzc97TfVe29aJLlu2m7HP89r4fX7lk23bRvr2XPvkL6QX57d1H34M9\+/ft/NMLs94z85kC58\+o1Jz\+o9I5i9r25ft/nhoUHFY4taAGd0Vj6uwJ5b3pn9cXMKYl2668656vP3vf848elC7v/6ShPn3pyZejD429YeUffvjAnFswlpIqvYcHC1qjtc3euXpvWb31Sq8xUtvUh2\+3zgoBAM5ec7bTyy765Kgz7pr9nIKd3WOanoNS0xHvTP1WZHGwKAAAcPbfH/3pobfgom/ffembv3j\+2X98/LZrF3J30\+l35dMA1t2LKwOvCzbWu3fnoWePPHfo7Htkz\+3X7LDOLgr0u23GM5b/xe274MSL919/3/MfvP8nw0oAgGy/aPc2gA9PvvnxmVt3dXquj9783XuEu65dvOy\+qebMsX8Y6FwsYHz42mH5LMDbiYHLE\+0Pz3k4k5W68BsPBJ858ovDj7546zIFY46zJ9/8cApgx\+6Vverpozdeeu2PAPDSj/7ypR\+1XywdPv6nm3d9zrbzMgc8/8aH/3HiLEw/8OnsfxwtWy93f77/X6mlNWcdrHVnPzLNT\+uOS3Zug\+OnT1ROG3/VqZUaH73/3kcAth2ftwNMgRVgyjg9ZQC07to8e3YKAKy27nv5VjqR5tsdrJTVCjB1ZvrK0in99NQUgHXrdPwvvuNX//q311Fn//3vvj\+QUN579zR0dzX9/9pvFwYA6/nXNB8QcPDJS7jWawvMKzsrXL718Adw0T7XwoqnS2GcOJJ46NXTtmvvvA0OP37s8YdyntzgfFclbPv81773\+a8BAMCp10e/94OxN1585sg9X7\+r99X7RvuBSYe\+dc2hzqu9n3zZYbUCgDF1dmqqPUqbOqtPAVitpPXYKmLnvnkv900AgKn/fCZ6xw9fkp7MvX0nN/t21nXvo9/\+PH7oQ\+s1wdvOP/rUi7\+JP3bLlX\+/uNMb4yPlvVMAtp07lj5G2aj6Z9eCdn9T3bv2yV8HA/e/uNjWrVJvvyy6nikAcOrFe7943/OPHnzl24kFPKVo8RbUB/buZzzXNP/aOvm02nZeuu\+m79y697LFPPAYAIDsuPJm145nlZefffG9U9uvvHnPjtk/pK7kXdlL/Pap\+T/eO7ZTzVTc5dh\+LgVm6yX7\+Et\+\+dQbrz73Znnqknv4S86b/fT13s8UaP4/V/T//af9V1g/\+u1DA9/KvvdB\+Wyzb19QMsy6jfwHgeix1hv7jWmnU8Lq2Ld//7WvRV9MHNre/bCAWWb0pTO2yNR/PvPIg4cqO24afWT/3P55aanSa3iwwDVa2\+ydzWTLtv/a85kCzf\+349uPTSz\+mQK9T47aej9ToP0/eg1Kp0e8Z7tHvCdk6dR2/tpODPGZAsvqzJvZ\+OPHp3bfEv3Jjx/6SfAiqBx66OCkPs\+njBNHHn/k1dNw3pU3X7v\+nis9H7Lt0puv3XXm2KFDCly\+j9993vwfmbsMx779911rhcqh0ey/6wCw7aKb9\+4CePupnx9\+s3XR0Zljv7z/lrsHrv7\+6JzLkGYx3j3y3Bt/Bpvr1v13//DA3T88cMdt\+3YCKK88O/umR9u1wf3f3n7299nDby3hssn5fXT0l4lDHwKwnq9duJI/cDWfQQUX3RS888DdPzxw9w/333ipFU7/PiedAiA7\+S\+zAB8\+P/rLydYtZGf/45mH7r7xjuu/9JB4pu9fl3T77rpY6w7z/Dz/8n38\+TD1\+4OJw\+\+3p295/5VHfiGdgW3X3Hil3Wq1szusAG8dfe6tZspN/elITvoAYPeFF80cnK1wIvXfHaa27d6\+DeDk0ZdKJ9qROXTkbYBtjj1z\+pNtV93742/shrNHfpE4MveqsP5/NUd2ff3BwSutleefOtJ6IFP/rFvV28JPvjb60\+c/Oo9/4MEDDz944Mtbz3Zv8bmM938d8v3lrukp9MC24/PznIhOnT76kvQRWC\+/sZWKB4Jfvxjgg2PPvWEeRtv2XXaAKfnl9h2wxrtHf/37TwC2X3TJtqmj//Ddy75w9fQ1gdYdjvZVUYtY9/VBf/3xh7LvAXvnw/dHf/Kjr5//57cf/\+nhRc3rZrz//CMHpSnY8eV9S3kU5cbWP7usi9n9l99q9fbLz2juWcbHZ1fohpT\+feAHC\+hnLr7lkZf\+\+V/\+9Z//OZeI3btv0RUBAADYcc2\+K20fvvL4S\+8Rl3fVb8k\+x283/Xgntg91YgtnjmYThz4EuMBz855zSUWr7ULvvgun3sge\+v0nF\+279qIlVSHP33v3/pu2wwcvJR5//SM41wPigse01stu\+9GtF//57aeyktnsteZ96Zljv7w/8urpi4M//dm3zB/Eu3hzhwcLXqO1zd6eZm/ZFTbn5Gih5g5Kz79835Xnw9Tvf9kZ/xinfpf46\+/f8dUb7njMfES0dHilgFE\+PHJQmtr\+jYd/5LFbyd67D3z7yI\+ezcafuunp\+3bOefcn0ui9gaes1vY1e9ZrfnxgAQ9kXn\+s51\+xj9\+dO/zBeVfefO0uyvr27DccfzL03Ze7priwnr/vQGrW01atl932o9uevOOpNw4mXtj3i9svPH/v4IFvH73/2aMPf\+mGZy7fuQ1aM11ddNs9t1\+xbeqtPu2Zeu/Ikben4KK77n\+o/exN481d7x19RPrtkbcfcM/8TWDX1\+\+7h3/hEenMMl6P1l7f9uxcF915/10r\+hD\+5jOobHv3/33nHrDTV505fvch\+bkjJ79x166r7v3xbS/ce\+iNXwx88ciljm3Qmp5q\+9fvG\+Tt20i/vy68EettracvQjTNT8e\+/Q/ulSJHX/mh//rH9\+wgMHWq/PYHfwbb3ujDN32eAOzee/utO6VDylM33vDa5Tu3wcdvv/XhFGz/evNZITMO5CuRSNP67w6fcwS/cfmrT72Vu/tL8qWXbIPmrTTWa/c/sO9zBGb39fa9\+x/Y\+8oPjz7/dwdv//Lfzv6JbOZf21MSzr8L2664Zf\+t2bsPfdgeX2/rm3XLGp2\+Wr9RX3539LY9NgK3Phx87sZfvDL6j6/snTthDwAAkJ1X7rvQ\+uyrh7735Vcu38tfcd7po0elD/4M53/1O3t39u6fjQ\+lZ\+WzsP0bDz4Yaz2wZ\+pPl5yWfvjqa4ePf3Tz7HJ\+\+4v2fOeurx6OvCo9FLj\+GXYXgZPvKqenYNdtf3PX3m02fe\+ltl9Kv3/khl3j/M3cjjNl6YhyGs679OYbr6SWJzKrpfWc8GaHQOCm6IMvSZGjiYd\+4xk3mT2r7fQLj9xx/UErTE2der\+5Yx548KaVu6JknZovuz63t9/uvzJWvbdfJqff/E3i7\+RtAFMfKa\+9cPS9MwAXuy7dbYU35ryzlXst2y4ffOjB7QAwuzO0bvc\+GDd5RkbfPnD3zpPm/Yx1\+UboVvu13mu2vnLkk21f3nel3Tqn/tEZiHY\+sPM7P4nfvjw/FS7t2x/m5//4tqvuvf\+2I3cfeusXA1cfufSSbdbWFHpw6Z0PLuGRJTNtu\+hr116UUN4Dlv/ahTYoz/77H3MP3ni8\+8bsbdf86KcPzIxY80z4yE9LT/708G3/tP\+KeQ6Ir/RrT/8x7cxHHlDcXfd99fkfvjqrGm3Wl04n2hn58chPS1MAZ16Pf\+\+7nR/vrZcEH2lNe7z0VJkzPFjoGq1t9vY2a8u2piTsOUaadwarJZwctc4lZ3VQANZL949GL\+n\+4JxBqWPvgfv2StGjz//QX3p8zw7SPve8/I79t17YnmOiZ5PuWdLFiZu9KDD1n4d\+mvj9J9v23d\+aAZvs\+vqDP/Icib326E8P74vPTY6uO0a283fe/9DD3zq353yuHbvLe832w6d2CnsvJNDjZ/zuW3EAAM7feXZqzhQsFHfXgzc\+/9cvvTZ68LWvxb32C7\+T\+tWuvT\+NP5IrvfUxwNaLvnzj/rvuue3WPTaY\+s8\+jTHKr71wfGpmtZhccq33mvOk3x99rjMHW\+dPV9y4/65x6fHKYle6j\+n1tblufeD\+6L3uc7/zs48/HX1R\+gi27buRn573YceV375216Fc6YWjJ2/73uft\+0b/NX/VQ48kDh17\+w0A284rb7r79vsGv9N8akn/vy7YOlvrfdNvNc1P62V3PZbf/cv4Qweff\+v4SQCA8y666e7o3/\+49UBjsuubyaet5z\+SOPTq2299DADbLt57670/it51IYHZJ9srkUhdS\+\+zOwCQv4rmnv7cQz998vDxt98AgPN2ffmWux68/7bed85bP3/zj2576vWxN7Lxp771i339/vp0a7qdhezCOzz33e15IfZap86/THl1Tk79LjGSew8uuPPhe5p3KtquHYzedWTg8ZcSj97C/6znLdnWz9\+eyDt\+8\+RjuVd\+f/T5twCsO/lvB\+\+6L\+g1mbPA\+OD15974BM7f981rpgczO/bu422vvnL0RenUvm/2LoJYP39X/GnbP8Yfzb32lnIaAM5nv37rPQce2Pc5AKDcsZf\+\+aqnDj5z\+Fjp2dwUwI7Lv3rnXYP7b5t/Irp15cyxbPxxZWr3jQfua0bb\+vlv/2j/odfjR36eeGHvT/s/5m36Vszzdu27I/qTv/nmGs\+1sQYWkF2L2v2Xxyr39svmj68eSrza/J/bdru\+fltw/303XUVBjxHFzNuArfDhFDSLArM6w\+27\+lxo0LcP7NPPtKYWWxZkx5Xf5rYdka\+8\+dodBE7O\+fuMW5cBAM5eeWZq2WrbS/p2fiEft//V6Ev5q0YfSTx57O1mTed8160PPhjtzCV0DmyX7/Nc/PR7cK338p47UfcjeAAAttk\+npqa/cuf7YpbDtz2mzueOv74Qy9\+ffxbfYdhfa/Lm2dMe8\+MW/XB\+rmb77nrqaPxN2Y\+9nj\+vvTs2eax\+6PK292/gBvXnoXWEwrOIVVmDg8WvkZrm70mZmzZVPssvccYCeYd6yz\+5Ojh1hTUMzsoAIAPPoEZRYG5g9Jtl9372MQlnRHveTsu33vrbXfsv\+uvPk\+mHyDVc0WWxPJfZ/97UR94/93y1VdfPe/bDh48KNzw/yytTegciRP/B4O/0jDIfWye4GyeNV0ajM\+8MERrBSO/VjDya2WDRn6DNhudO9z0q0mc\+D\+b/UoB9Gn20dHfHP7t3Iletn1u7423fm3jPQhigTbnWqPNwDjxu8PPHps78aTtkr233uo\+H5N75eEmWK/O/sfh7HNvzr3ob8dVt5teL7Np4VESbVqY/MgcFgXQp9f5e7\+1v/8kL59Gm3Ot0WZAHH91\+31/tdat2NRwE6xX2y679Z7LVmxKnk8ZPEqiTQuTH5nD2QcQQgghhBBCCKFNCosCCCGEEEIIIYTQJoVFAYQQQgghhBBCaJPCogBCCCGEEEIIIbRJreCUhEttEkIIIYQQQgghhFbDCs4\+cM8996zcwlEfBw8exOCvNAxyH5snOJtnTZcG4zMvDNFawcivFYz8Wtmgkd\+gzUbnDjf9ajp48CDePoAQQgghhBBCCG1SWBRACCGEEEIIIYQ2KSwKIIQQQgghhBBCmxQWBRBCCCGEEEIIoU0KiwIIIYQQQgghhNAmhUUBhBBCCCGEEFp2uhhmmUBWXet2fHoZSsrHcFFJX/ISdDkfDwosTSwWC2E4XyieV5a8NEOO87SQVIyNtulXvyigZnyUpQcmLOoAAIaajwiUhQkVNPNPUM0I60o\+GuBoYiE06wtnOtmgSamwj6WJxUKxvmhBMwCa24h0L4T4UorR1TJDTgqUhY1IrRd1JdteOueLZGUdALR8iJ7VFiKkFAPAUAvxIM8Qi4VihVBS1FpLMdRCcvr1VPt1Q8nHgzxDWSyE5kMZud10Xc5EfGzzSwPRbDslDbUQ9bEUsVgohg9nlpyphpwUiGUONiLqfb7F7HVNTAY4mlgshOaCyU74dTkV4hlisRCaDcTF9nY0lGxYYCiLxUKxQiSvTsdel1JBlhA\+OWN7bGS9I2O20QFAE\+M\+2kL5unuOGSkVTkla5\+VeGdX51Iw0NubsPVxcaqdgJswzlIXQnK\+VsItP7yWZu4\+DaXosV\+avOtOO7o7/\+W2G7u57tGyQJmyr/wMA0KUoT3ERUZuxtxKK4YTwnO29gWmFENOVaTTLB6LncBT\+VDLpBEz7XikT8bGUxUIYPhDPd5Ksx84OpjuXLmcjzYVTjBDJdvXUYCjZMEe6jpKtb00FW0fKQCTTNSqb263pYoSdsT/QwazWZ\+GGJqbCAktZLBTDB\+OFTr9gcjSZeQA9l2xai8j3HrqYBmdNIm92fMfIt1u52pHvhC0bpGcdVRdPlzNhH8dQzR5ZCCUL0wFd5PjQLHTLr5kxrbM5muUD4WRBXeGvVPLRAMdQpNkFBePZ7vHcXBQXzWbjAr2ijUJLpsupgBBKqXw4JSq1Wk3Jx0OcEvfxwYx8jpm0zJteV/JZcSWz\+7/O/vei/vu3f/u3xgI88cQTJn\+pV8uTxWKxWJxID7ttdu9orlgsFovFyUqt0agWR71Ol9frtDkGJ6o9P18tDrtdA\+OVeqM6MeRyeEYnytVarTI55nc4BsYr9Uajkhtw2FxD6clKtTwx6nXYvWPleqNRKw67HP7xilm7ymN\+OwC4RibrjUajUc0NOm3OgcREuVKeSAw4bc6hOS2qTY56nN6xUr1RmxxxO9zDuVK1VquW0oNOR/tLR1x2h380V6pUJtNDbnuzMfXJUbfN4R3NlaqVUnrIZW8uvF4ZH3A4/IlipVarlidGPQ5X8/VywmO3e0eLlWq1lB502lzDxdpSgt\+olxIeu8OfaAW9rVSpmX\+Lyev1yrjfYXcP58rVajk37LI7BnPVRqNRnRhy2lxD46VqtTIx4rE7vOlyvdGoTY64bc6BsclKtTKZ8DvsntFSvdFo1MvpQbfT43XbbZ5EuW6\+VutMvyD3jozJRm80aqUxv8vl8bps9q78rBWHXbZm6pSLY4MuWzO9TTKq892z0rheSngcvQJbzQ057a3NVEz4Xe7hJaT3EoJjso\+bpMciM3/1LaGjU46n/fauLV2bGHJaweYenWxFtF5OeOzOoYlavZTw2J2tvbBWKRfHR/wOq8PfN/brS79MaFQnBp12b7pSbzQa9WqlNDE25LbZXHMz8VOtX4hMOgGzHqac9tvt7qF0sVwp5Ua8dptrZLLWMNvZTXauWnHYZXMOJIrlaqU4NuC0u5sLadQruWGP0\+31OGyu4clOCtYr6enGTIx6XZ7RyVrDrFurTgw6nUMTtdlr2nvh9VLCY7d7RsYnK5XS\+IjHbnOPlsyPJq2mNAMwMep39O8v1lvkzYYu6ynyJsd3jPxaRb6jkht0WgFMR87zR77RqE4Mu6xgdfqHE\+lcLpceGxl02\+3NlVvk\+NAsdEvTr9mtMY/dMzg6Np7LjacTwwMuGzgGxysrdZysTY56bAAO71AincvlxsdGhzyOTXfkWh39M7ZLvTzmdbT2/kWqlcb8bv/o3I/WS2N\+p6fHHxbQnNKo274C5zS1yRG3e8WGwU888cTqFwU66pW01\+6c0YPVK8VcsVKrjPsdJl1brTjsdvrT5Xoz5o5Wd9lMCLtzqFhrVCcGndMn//XymNfhHpmsNWoTQ06nWYdZr6QHnE7/oMfROpuql8dHhkaLrXfXS6Nue\+e72p8pJTxOT6I1GPE6po\+C1dyAwzEwXm00qsV0Ij3Z/s5K2u9wDOaq9XLCY2\+ftjUateKQyzEwXmnWLTqnW60vnazXJkdcXd9eSfvtzuYJeG/zFQWcPTPK7FtMXm\+duUyv8qDD7k9X6pVxv8Mx0G5dbXLYZfckSvXqxJDT3rVqCY\+9NQQt5XKlam1yxLUSO9DK6XM22DsyNZON3mhUJ3MT5Vq1ONSVt416ZWJ0aCRXaad32mt3DRVrJhnV\+dCsNG7UJ0dcDn\+6vdSOStrv6H\+CvZD0XnxwTPZxk/RYbOavvqV0dPXymNfe2Wq14rDb6R3wODurX0n77Y6BXLXX3lovj3nt9pmjwfVswUWBzktD66/ys7L67iw9OwGzvrdWSg8PjbUHMLXisKu5T/Xe2U12rlldcXV8oH1CUy9P5IqVWnnMY\+8\+hyknPA7PaGnW0k26tUZl3N9z4NZ74bXSeGKs2E6Q6sSg0\+5PV8y6i0a9nBsby7Wb3lqTkumuss4ibzp0WUeRb5gc3zHyzWatfuTb35wbcjm9g17zMW5T33LM5IjLavMkZqxXrZgYGh4rmR6LTY/Rvdduifo0u5L2263OoVyl\+8VqMTE82s7HeiU3OuB22qxgc7gHx5qjp3pp1OPwjiSG/R6X3WZ3DSSKxfSQ1\+20253\+6ZF/JTfid9mtADaHZzDdjEy9lPDYrO6RYnega6X00FCiWG00U7j5Iavd5R0eL9cbjUatkxTV3IDTNZhIDHrdbqfD6R4cm5tIqGOeMlZx1O\+0AVgdnqHRYY\+9tZ/Vq8XEQHMTONwDiWK13qjmBh0Of2e0UZ8eO9eKIx7X4Hil3qiV0kNel91qtTn9o2MjHtdgrlxK\+D3DrYqeyZYddjn9icSw3\+N2ORyugVYWdIoCnU1v8s5Go1Erjw97nDYAsDnby21\+3YDHabNabU7PwMh4qVYrDjtbv\+c7BieqjXo5N\+x1NvPT7R\+dqNQbrQQbGBl0222u4clao1GbHBt0O2wAVrur/SbzaK\+vZwoQRggIDEXM/m4omXgeAtEAS5pvZjSxIOsAYKiSqFK8jyEAAF1XVhCKoUGVFR0MXTeaF5QRC6G5YHz6OlxDzUfjMh\+L\+uj2dxM2GE9F21d86KqiE5qhutui5uNJjY8GOQJAaD7AGlJe0pptySuEEzgKgBZCkRDfXIou5bMy4X1c92IAAAjNUoYiqTrF\+nhKLUiqDgC6LIoaw/MM0RVFpziOabWN5nhGV5Tlvn7E7FtMXtcUWSOcwLZWhuIEFhRJPaVKqsFMv8wILFElRdMURac7SyEMx9GaomgGUFwgwNHEdJtvPHrvyMzaXJ2NDkDzAR87O\+sJ44um4oFWwAxN1gjF0qRfRvVIYzAM3TDUfFRgKQuhWF\+0eaGtrkoq0JAPNS\+AnHUvAyw0vZeg5z5umKTHqVXJ/NVGGN7H6lJB0QHAUCVZY3xBH60WJM0AAE0uyIQLcD2vNiNsICQQOSt9em4imIEWwiFWLeT7X4q5WZh0AmY9DMWFkqkw33zZ0FVVpxiGIiY7u\+lhxZjZBJrosqIZAIT1BQRmdk\+ty5JGaC0VaF7ALUSyrcuNe3ZrhqEbhi4lm21h\+FCqdeF174VTXDASbr1sKIWMZHA\+jjbrLgzCBsLhANt8uypmCjrr4\+csdCHWJvImQ5f1E3nQex/fdYx8c4GrH3kAANAK8ZjIRKKBJYW83U5FFFU6EAnOOLRTQiSVDHPUIseHhsnaLTtNKkgGH474mO5XaSGSbJ4ngKFkw5GUEcrIaqUQY\+VoMJpv3mBhaGJe5pMFWRGjdOFAICIHMpKi5ENaKpqRDQBdjAbCBSqclauVQoxVosFIXgNDlQoyEcJhvvsQTXGhVCoi0GAomVAoqftScrUqp3xGNhxOzroAnejH81k1mBElRU7xciyS\+dTcOLu6tEI0FFf5ZKmq5sMkn3ntFAAA6FIyEEwaoYxcrYhxQUuGwlmV4gMCkQvtm5E0KS8TIcjToElZEUKRAK3lI6GkEUxJmiZnAnIyKdM8y7A8C6qqGdBnyxrvFFIyHy9IspIPqvFI0vTBBj3fqeXDvojExgqVajkfocVIMCrqAJoYj6SMQErWNCUbYaRoJKXyyULa73AOF2tqxkekWCiUJ\+GsUq2KcU6Nh1o9ETFUSSLhglyIcURJBQNxVUiKlYqUCUIqFEr1vSFifRUF5qFJyYzChUOtPoviw/EwJK/7jMVi2bInrPqSMR9DgGJ9PIjJlKg1b\+KOF07ouq7rhqHrmg5CNJUfjwdoKRYItmKjFWJxmYvGZnYrXd9biMdFOhz1dfVwupxNSkwo0iobEDYUjzD5Gz5rsVi2XHCLxEXjIbb9bkNJCcRi\+cx1SQinUkGGEJrnGTWbzCoGGJqUiaWkU7quG0D7YnGfFtnzGYvF8pnrYkY4HhNoQ9d1g1BU57sJTYGuGUvtRvR3fvaVz8y4xY2Py4bZt\+gmr59tvtwpohCKIoaunzGaL3dep2hi6PrZM6oO1HRVhVA0AV3/VPaERu/IgNlGn58upWJ5CMSC7ZSak1EAJmls6Lqh6wYXTmbHkyFWS4UCMVEHQ9O0E2JBE5KiWinEGDEcjOS7bkVcTHovA8PomR5nljnz1wvC8DzTrAoYqiSqjCDwPEcUUdYBdLkgG6yvd00AACiGoUBTzum\+0XWM0AxDGdqntOZxDro6AZMepjtkhpqPxWUuEhFok53drMMnjI\+n5FSyoBpgqGIqlj9\+ylBN\+ylD1zX1nbwIoYxcLefDJBtujmjM32/oOuWLZ7LpmEDESCCUma/Kp2UDtMWyZU9UC6QyYY6YdBedO68LYcZi2XJBUOLjqQhP9VzmIqxW5A2ToYtJdNYi8mD0Pr63umSMvNn7VzTyupiM5elwLNiuGCyNoSsaYfjeC1ns\+HC1\+m9D1zSDZlnadDhC2GBWFDMhnqEZPhgNcyA3f3YDIIwv5GMIUAzH0jY2GBJoAIrlWKLLqg66lC3ofCQWElia4UOxWADErKiBrmpAc3OKP60GKfmMQofi0QBL02wgGgvScr4w66Sf2LlQWKAJAMUKLNHkVoPQouhyVjT4cDTI0TQXjEYDDisAgKHk8yobiYd9LM3wwWg8SMvZgkrxAZ5IeVkDaNUE\+CBHg64UZCogsKDkkzIbjYd4hqIYXgiwDMtxDAFCE0M3\+m9ZGxeKtH6r5jlaV8yfqNLjnaqYkYgvFgvyDM0K4ViU1wtZSQdD1wwAiqYpiuYCcVEVo1x3zulyJq9ykVhYYGiaC8ZiPiJl2z8/MoFwkGNoClQxK9OBeDTAMQzni8QjrJrN9qsKbKSigCZlREMI\+1pnI4aaDYeSejA9WalWJscjVL5ZASFMIJ6JMWKIsVi28HGdE5wUAUKYUEE3lGwk4PMFI6lsJszI2YJigFaIxUQ6EgvOuBCgTZczIV\+owMw6xulyNqtxoc5ZmlaIhGKKMFYsVyul3CgnRbuOEoQJJAvjYyMDjBILBOKSDhQfTSUDepzfYtnChAq0wNsJEGIoqVA4T4XHJyvVcjEdgmQotPw1RGr2MwUmU8t6hod6M9no83zKUPKRQDBFRTOx6SeVzM0oszSmA1nVUAvRoM8XDCezmRin5bOybgCAjQ/HwgJLM0IoHvcZYrbzQKfFpTdaNIr1CbQmiqquyQWV5gWGZn0ckQuKpiui1PdXNgMAgJhfTrXRzfqlGoFJJ2BOk5IhX0QWUskQS5oZ02dnn432xTJxXomwWyxbuIjMCi479Ms2A4jdF42GeIZmfZFklNP6XOhBuKik63Iq7PMFQtFMNhkkUna\+Z4LRvng2NzY6yGrJoC8yb8dD8dHsRHp0SIBsKBDOq/O8va9VjbzJ0MW8cRj5js0beV1KRbMkHAtx53pQIBv/gs3WzyVNVCCjAgDoSiHefEKlZcueH752wmiVLAihW9csEkIIodqlDULAMAwwNFXVTvzLX1\+wpbm4z97wxDuaqmoGATDPDV1TdMKwdHtZNMsQXdH0me8iNN1V4DI2/O8ca0PXdKDa2xAohmsOfnVNVU\+9dmBPa7t95rqfvH5ClTWD5gM8kfOSBqCKeZkIQY4G0DUNaIYGTRY1unMBrK6pOmEFhoChqwahSd8tSwjVfhmg2f2YbNEe79R1VdPe\+eUNn22l7QXf\+5cTmqpqBiNEwqwc4TkhFE3lRXn2LyW6qhkU06mHUQxHg6Y0S5kUzTRfNzRFO3X8Z9e1fgfesufAaydUdXY\+dttARQFNykvEF\+pcsqNJeQl8sWi7AhgL0kpeVAwAwgiRrKQajUZDl\+ICGN17YAvFcDTRFe2EGI8V6EjvHz41MR7wRRUhVcgEZ/xdl/OiwQc7lw7ocl7slBS5QCQWZjVx\+vm7hOaEYDieLWQjrJzNKzoAxYWSBUVvNBqGkg0xBlBss6ZDBaLRZsUoFI0GiJyXdKr1U3OboelAzVmjhSMMJ3TjOZoAMfkWyuT1bRRFDK1TSzd0XTcoirIRquuXAwBD1wxC0dtsDAW6qne/DNSn88yG9I4M6b3R\+4ZAl1NBX1hkYvlMeMY1fbMzqm8ad3\+MYYihqTqhKIp0ziwJRTMU6J02LzK9zx0hPdPDttyZv25QrI\+jVFGSpYJCOB9LAc35WEOWFFkUNZrvc\+Wtrsga0H1ustrYdFVSdYpZ\+ctON4y5nYB5D9Oc2SMQSOqhbCHZ2oF77\+zGFtOdi\+bDGbF5/JRTAcoAyjzdCGkuvLN0hqG62jaP5jjG/DqE9ttYIRCOZgr5JKflM5Leu7voNJFieF8omirkUwGjkBHVhbVlrtWP/EKGLm1rEXmN9D6\+txuBkZ/f8kYelEw0BcFY\+NyvyyAUSxmdOxLm/HFx48PV6r8JxdCUJsutGgthAkmxWCwWcwm/gwIAAC0bCUYlJpKVq/VGvTzmcSyibWTWw80MKcpRFEsTVVZMtqBhGH1qBmi59SzekVnPKmooKYECmg/wIBVkTZULrXsHwADDAEIADF0H0q6LaVImo1AcTYGhSgrwLE36btmFb\+/e76RmPf9EL4RZArQQLaiako0KIMaDPBec8ROxYcwqJpn2KDb3zOe7aNlAnzrrxikK6EpBhul7ygBgZkAIACHN2osqZvPTd45kJYP18ZShZKPheGe2Fl2VNYPQ/\+ODgvj6iZcPXLnFYrFYPvu9X71z/CfXbWEjog6GkgmHUlRcFJOz79QyFEnSGd90N2y0ft/qvK1VS9TFqMAGprckoVqZpcn5bPuSIkMp5FWK51kyq15IWv\+XZllal\+X22zVZVCmWM79eamnMvsXkdZrlaUMRO7NYKaJCGIFxsDxLVFHuetlgeJZmOJbS5Haty1AlSaO5ZV\+HdYHqHRnKZKObL0jNR4JxPZIXM6FORaB3Rn38rkkaa2o\+Ho5Oz\+\+nqapOaJqiGJ4BVWovRtdUHTqDoAWn97IhJunhWJXMXws0F\+CIWsgXZGB9LAUAFCcwupjPixot\+EyvA9UK8bhEBcICs2pNXU2GnIlltelbxFCvTsC0hwFdTobCBTYl5qNCZzcx2dnNdi5Dk6anPNLlvKgz/W4PpzmeaT0cBdp3dZufE\+hSKhLumk1OlbU\+JQddTvpYId651pEQAmAYZt0FKJkgx0//rEoItAZ9S7H6kTcZupg1cA0iD1Tv4zvByK9N5C84I\+alE6//pHlD6Ge\+8sTxd355w2fpYPe9gAtFGCHAavlk9/yKAJoY9QnhvLrI8eGqHaNpPshTcirZGuQQmuMFQRAErvWDrK5KisGFoyGBpQnoiqgu9NY0QjMMpSvTP9AaWvOzNB/gDDGZnHHliS4lA0IwoxCaoXRVbv8Ua2iyalDs9K/DaPlQNAWG1g61rrbuwqBohjLUdp2oeYtJ8z3NqkC\+UMhKRGg\+O4MQmgZN1YHmOCJns6KiytloKCYZhBBDyUcjWRIMcFRzsSuxZQnF0ERTuorcWqvCqGuabhCa84Xi2UI2TEvZ7gmpm/mpdopTuiprQM\+\+kYbQLA1au69qL7Rvg9bV7AMt1R6zD9TLCY9jxvP/6\+W032H3NmeLqJfTA05783mwtckRl83hHS2WS7kRj83afsZ7bqg1x2C1Mpkectns3tmPx62ODzg7sw\+k/U6zJ53PfbJtNTfotLuHJ6r1RqNeyQ25Ws/Wr4wPOKwOf2KiXK2WJkb9DmvzSc6VtN9ucw2NT5aLYwNOq9U9Wqo1H4hqdww0H0ZaKyX8jtZ8P81Hjo8WK9XqZLprkqjeljb7gOm3mLxer4wPtGflKY1Pz7BXnRhy2pyD6VK1Wp4Y8dhbE0XWJkfcNod/bLJSrRQT03P\+tNv16Zl9wDQyvTd6W23WI4uruUGXwz/nMfNmGdWlK40bteKI2\+bwjuRK1WopN\+Kx29wjxVqjk7HjpWplcmzmjJsLT\+8lBKfTxpn7uEl6LDLzV9\+SO7p6Je132Gy26akh6qVRt91u69oSM/bWWmUylxh026wbauKjRUxJWC6mR7wOq90/Zv7U8k\+jvvN39u4ETHqYeinhcfSaraj3zm7WsbemRMuVyhOjfgfYZk4/Wp/9OPF6Oe13OLyjE\+VqeWLUa7fN2EdrsydVSfsdNtfgWLHSnPDQ5hjo\+kln9sJrE8Muq907kitVquXW28crpt1FbXLUbbO5h8cnK52DfJ/5O9db5M2GLusp8ibHd4z8WkW\+W6045DqH2QfaUxKCwzucSOcmihO5sSF3Mxjmo9D\+x\+g5oVua/lMSpv12AJtrMJErVaqVydzY8IDLZnX4x0r1Rr006rY5B3PVeqNWGh/2e5w2x2Cu2hxst6dvqE\+OuOzesUprzDTkdPjHq63ZMe3e0YlyrV4vjw\+6nK0NV5sc9VgB7J6h0XRuoljMpYc9dqu9NX/zqLv5oWq1lBt2222eRKk\+Y/aBwa5pJKq5Qef0v9Ac8/QVjtYsnaXxYY/DanWNTNZavZFnOFeq1euViWG3s3OuV80NOh0uV/cAtzI\+4PanK/V6dWLE67RZ7e6B0YlSqTnPpXso3Rmlm27ZYZejc2FC518msw/0eGejmhtwWJ0DY8VKvV4rjQ04XUMTzQx1uIZznYyzO4cmao3q\+IDDMTBertbq1Ykhp80xkChWqpXJ9KDL1pxdYWaC1ctjXrvNNZSerNbr1clRr7N1CmAW7XVVFKiXEm7rzJpF98RdcydHrxbHhjrzMQyMds2Ik/A6AACs9u75PurlXGs\+CZvT07Wtp5fXOZuqV9Je26z6ia3dzfecoLBWSg\+3JqtwuPzD4\+2l18q5Eb/b0Xp9pP16vTI\+5LICANic3pGJ6XkyJhKDHqcNwGpzegYT7Zlp6tWJEY\+92Qz30Dzzr85TFJgVYgAAcI2U6ubfYvZ6bTLhdwAAgNU50LXvlNIDzua3OPyJzgGiXhkfcjeDaveMTFTrjUajUZ0YdMxsitXdZyqj9aN/hveOTO\+NPjfVbN50pZobsM/aSFZPc\+TbO6OmdRcFWinVnI\+kOTlLp42l9KC7tTd0JkFpLDK9Fxsc8328Z3osMvNX39Krn/XymMfa3qaNRqPZxwHYpwcIc/dWR1dfsSHMVxSYufPbXINj66voswr6hMi8E\+jVw9RLo\+7ZHbujVTHsvbOb7Fz1UnrACdCawagza9L0bEht7YJVtZhoH1g7Cdq7W2s0GrXS\+LDXZbeC1e70Do\+Xa30XXq9MjHamU/IOdWZjNe0uimNDHqfdOusAukEi33vosr4ib3J8x8ivVeSnnXNRoNFoVItjg\+5mfKx2l3coMTHvOLDn631CtwTzNLtemWjOTNdstWdgKJGbHnXlWqMucA6kS\+WJYY/d6hx6\+XfzFwUajXplojklodXu9AwmJqdDWyulhzytw5fd6RkczU2faHQmruuaAhGLAkvUd9O3TuQBwOoaTIx2Zs6uV4uJAbejufMPdM/C1xx0zEjF6sSQyzWY69Fh1Wu1GS\+abNlzLQo0pyT0Om3W5lSH7TOGejk3MuB2Th/mKvVGo1HJDToAoDlrdTnX/BzYHJ1z2pkJ1mg0apNjQx6HrTlv4UjOvFjbaDzxxBOW/zr737P71L7ef7d89dVXz/u2gwcP3nPPPYtaMlouGPxVgEHuY/MEZ/Os6dJgfOaFIVorGPm1gpFfKxs08hu02ejcrcam1wqRQLhAh5PxcPPWTUOV8tlkPCkxcTEfYlb229eTgwcPbpxnCiCEEEIIIYQQQueO9iVFKRXQM2GeJhYLxQjhpAhCLC9lN1NFoOkv1roBCCGEEEIIIYTQ6iK0EIoLofhat2Pt4ZUCCCGEEEIIIYTQJoVFAYQQQgghhBBCaJPCogBCCCGEEEIIIbRJYVEAIYQQQgghhBDapFZwSsKlNgkhhBBCCCGEEEKrYQVnH8BpRdcKzum6CjDIfWye4GyeNV0ajM\+8MERrBSO/VjDya2WDRn6DNhudO9z0q\+ngwYN4\+wBCCCGEEEIIIbRJYVEAIYQQQgghhBDapLAogBBCCCGEEEIIbVJYFEAIIYQQQgghhDYpLAoghBBCCCGEEEKbFBYFEEIIIYQQQghtOIaS8jFcVNKXvARdzseDAksTi8VCGM4XiueVJS/NkOM8LSQVA3QxzDKBrLrkdq2u1S8KqBkfZemBCYs6AICh5iMCZWFCBc38E1QzwrqSjwY4mlgIzfrCmU42aFIq7GNpYrFQrC9a0AyA5jYi3QshvpRidLXMkJMCZWEjUutFXcm2l875IllZBwAtH6JntYUIKcUAMNRCPMgzxGKhWCGUFLXuRQOALkV5Qvhk\+yt1ORXiGWKxEJoNxMX2yhpKNiwwlMVioVghkleNrgWkgmz3EpbCkJMCsczBRkQdAAy1EPWxFLFYKIYPZzr7g9nrmpgMcDSxWAjNBZOd8K/Nqq0rvSNjKPl4kGcoi4XQfCgj690fiPtoC\+Xr7jlmpFQ4JWmdl5PTmZaanWkz09iYs/dw8VaCG0omzDOUhdCcr5WwS0/vhTJvj3l6bEymHd0d//PbDN3d92jZIE3YVv8H0OwrKC4iajP2VkIxnBCes703MK0QYroyjWb5QPQcjsKfSiadgGnfK2UiPpayWAjDB\+L5TpL12NnBtGPX5WykuXCKESLZ7l3RULJhjnQdJVvfmgq2jpSBSKZrVDa3W9PFCDtjf6CDWa3Pwg1NTIUFlrJYKIYPxgvtxszTXRhqNkh3jyIWby0i33voYhqcNYm82fFdlzMRH9tqyzntxxj5xUW\+E7ZzznkA0OVM2McxVLNHFkLJwnRAFzc\+NDQxFWqvRigpruwh3VCSArEQPi4v/Wt0McI2z\+MAdCWfXeEmo3VEl1MBIZRS\+XBKVGq1mpKPhzgl7uODmXPIKAAAoLhoNhsX6OVp6Mpn5n\+d/e9F/fdv//ZvjQV44oknTP5Sr5Yni8VisTiRHnbb7N7RXLFYLBaLk5Vao1EtjnqdLq/XaXMMTlR7fr5aHHa7BsYr9UZ1Ysjl8IxOlKu1WmVyzO9wDIxX6o1GJTfgsLmG0pOVanli1Ouwe8fK9UajVhx2OfzjFbN2lcf8dgBwjUzWG41Go5obdNqcA4mJcqU8kRhw2pxDc1pUmxz1OL1jpXqjNjnidriHc6VqrVYtpQedjuaXdr/TBmD1JJqvVieGnDbX0HipWq1MjHjsDm\+6XG80apMjbptzYGyyUq1MJvwOu2e0VG80GvVyetDt9Hjddlt7CUsKfqNeSnjsDn\+iFfS2UqXWaNTLCY/d7h0tVqrVUnrQaXMNF2sN09frlXG/w\+4ezpWr1XJu2GV3DOaqK71q60e/IPeOTH1y1G1zeEdzpWqllB5y2dsZVSuN\+V0uj9dls3flZ6047LI5/KO5UqVcHBt02ZrpXSuOuOzNlyuT6SG33T4j02ancb2U8Dh6BbaaG3LaW5upmPC73MPnkN4LD45Ze8zSY71bQkenHE/77V1bujYx5LSCzT062VrhejnhsTuHJmr1UsJjd7b2wlqlXBwf8TusDn/f2K8vfXaTRqM6Mei0e9OVeqPRqFcrpYmxIbfN5pqbiZ9q/UJk0gmY9TDltN9udw\+li\+VKKTfitdtcI5O1htnObtKx14rDLptzIFEsVyvFsQGn3d1cSKNeyQ17nG6vx2FzDU92UrBeSU83ZmLU6/KMTtYaZt1adWLQ6RyaqM1e094Lr5cSHrvdMzI\+WamUxkc8dpt7tNTnaNJWyQ06rQCmo4j1GXmzoct6irzJ8b3VlGYAJkb9jvYqYeRXOPId557zjUZ1YthlBavTP5xI53K59NjIoNtub67cYseHzdUYHp\+sVCbHh89xfNe/2Y1Go14adTucHrfD3S/v5lErDjvtzWbWJkfc57IotFzm3fRt9fKY19Ha\+xepVhrzu/2jcz9aL435nZ4ef1hAc0qjbvsKnNOsbGY\+8cQTq18U6KhX0l67c0YPVq8Uc8VKrTLud5h0bbXisNvpT5frrV7A3R4L1MtjXrtzqFhrVCcGndMn//XymNfhHpmsNWoTQ06nWYdZr6QHnE7/oMfROpuql8dHhkaLrXfXS6Nuu3vWaUq9lPA4PYlSvbkujumjYDU34HAMjFe73ul1ugYG3O3Tocq43\+EYyLXeUJscdtk9iVK9OjHknD7Hq5cSHntrnFbK5UrV2uSIayFZNl9RwNkzo2qTI66udayk/XbnYK5q9nrrzGV6lQcddn\+6Ul/ZVVs/\+pwN9o5MrZzw2Nvn6o1GrTjkcgyMVxqNRnUyN1GuVYtDXXnbqFcmRodGcpV2eqe9dtdQsdaoFtOJ9GQ7tSppv6NVjGl\+aFYaN\+qTIy6HP91eakcl7Xf0HbYtIr0XFZze7TFNj/VuKR1dvTzmtXe2Wq047HZ6BzzOzupX0n67YyBX7bW31stjXrt95mhwPVtwUaDz0pCz//nEp07f8mLPTsCs762V0sNDY\+0BTK047GruU713dpOOfVZXXB0faJ/Q1MsTuWKlVh7z2LvPYcoJj8MzWpq1dJNurVEZ9/ccuPVeeK00nhgrthOkOjHotPvTlfm6i2puyOX0DnrNj/dN6yzypkOXdRR5s6FLvZwbG8u1k6aVQ\+ZlXYx8czHLEPn2N597zjdqkyMuq82TmLFetWJiaHisVFvk\+LBRLSaGhjvHqeaYIdevZX3Nd5ytFYddDu9YMT3gcE3/elcvj3kc7qHRYa/TBmB1eIbGW\+PvAYdzYHTE77JbwWp3D6abq9wuClSLw87Wr6bNE5FaeXzY47QBgM3pHR5v1YvSXqd7ODEy4HE5bDand3RicnzY73Y57E7vyETFNPnRosxTxiqO\+tsbd3TYY2/tZ/VqMTHgslsBrA73QKJYrTequUGHw98ZbdSnx8614ojHNTheqTdqpfSQ12W3Wm1O/\+jYiMc1mCuXEn7PcKuiV69MjPqbi7W72olQKw67nP5EYtjvcbscDtdAolhtdBcFau3\+wOSdjd4J1vy6AY/TZrXanJ6BkfFSrTYrM\+vl3LDXabcC2Bxu/2gz66q5AadrYGTQbbe5hidrjUZtcmzQ7bABWO2u9pvMo72\+nilAGCEgMBQx\+7uhZOJ5CEQDLGm\+mdHEgqwDgKFKokrxPoYAAHRdWUEohgZVVnQwdN1oXlBGLITmgvHp63ANNR\+Ny3ws6qPb303YYDwVbV/xoauKTmiG6m6Lmo8nNT4a5AgAofkAa0h5SWu2Ja8QTuCoTqtjSc0XDwvtz\+uqpBqMwLb\+TTECS1RJ0TRF0WmOa64EEIbjaE1RNAMoLhDgaGIamOWgK4pOdb4caI5ndEVRDZPXNUXWCDe9DpzAgiKpp9bjqq0uvXdkZl3uQ2iWMhRJ1QFoPuBjZ2c9YXzRVDzQCpihyRqhWJoALYQiIb6Zl7qUz8qE97UyrUcag2HohqHmowJLWQjF\+qLNC211VVKBhnyoeQHkrHsZYDHpvTi922OYpsenEWF4H6tLBUUHAEOVZI3xBX20WpA0AwA0uSATLsD1vNqMsIGQQOSs9CmNDS2EQ6xayM9Kx03KpBMw62EoLpRMhfnmy4auqjrFMBQx2dnNOnwwZjaBJrqsaAYAYX0BgZndU\+uypBFaSwWaF3ALkWzrcuOe3Zph6IahS8lmWxg\+lGpdeN174RQXjIRbLxtKISMZnI\+j\+3cXWiEeE5lINDBnaYuwNpE3Gbqsn8ibDV10wgbC4QDbfLsqZgo66\+OXtAEw8ouLPAAsU84biiiqdCASnHFop4RIKhnmqEWODw1aiKSSIba9GVXNoBn6HFrXlyZlCzof8vG\+IG\+Imc4NJwCgv57NG\+GsUq0UIlQhEskoBhAA4518RgukJK0ixlk5Gk513xtCCclC2u9wDhdrasZHa/mwLyKxsUKlWs5HaDESjLbu9dNez4tMrCArUopTHgiECnxSlJVCBLLR5Dnc244WSCtEQ3GVT5aqaj5M8pnXTgEAgC4lA8GkEcrI1YoYF7RkKJxVKT4gELnQzg1NystECPI0aFJWhFAkQGv5SChpBFOSpsmZgJxMyjTPMizPgqpqBoChZEKhpO5LydWqnPIZ2XA42by1wHinkJL5eEGSlXxQjUfMN37Pd5okmCbGIykjkJI1TclGGCkaSal8d2YSKRYK5Uk4q1SrYpxT46FWT0QMVZJIuCAXYhxRUsFAXBWSYqUiZYKQCoVSfW\+IWF9FgXloUjKjcOFQq8\+i\+HA8DMnrPmOxWLbsCau\+ZMzHEKBYHw9iMiVqzZu444UTuq7rumHouqaDEE3lx\+MBWooFgq3YaIVYXOaiMR9j8r2FeFykw1FfV4\+ry9mkxIQirbIBYUPxCJO/4bMWi2XLBbdIXDTe6g8NJRtNqr54tOuWEsPQDUJRnTNhQtHE0PWzZ1QdqOnSA6FoArq\+3KN//Z2ffeUzM25x4\+OyYei6bhCq8\+VAaAp0zdBNXj/bfLmzCoSiiKHrZ9Z01dYFo3dkgOZ5Rs0ms4oBhiZlYinplL6wEOhSKpaHQCzYOsSCoaQEYrF85rokhFOpYDMve6axoeuGrhtcOJkdT4ZYLRUKxEQdDE3TTogFTUiKaqUQY8RwMJLvPpIuNL2XEpy57TGMzZMeAEAYnmeaVQFDlUSVEQSe54giyjqALhdkg/X1rgkAAMUwFGjKOd03uo4RmmEoQ/uU1jzOQVcnYNLDdIfMUPOxuMxFIgJtsrObdfiE8fGUnEoWVAMMVUzF8sdPGarpvmjouqa\+kxchlJGr5XyYZMOdIbPJ\+w1dp3zxTDYdE4gYCYQy890fqWUDtMWyZU9UC6QyYY706y50MRnL0\+FYkKXMFrdYqxV5w2ToYhKdtYi82dDFaC5HL4QZi2XLBUGJj6ciPGW63AXCyC8o8suU84auaIThey9ksePDGRtGycSSmhANn3tG9KaKmQLwQYEhNB8SQMoUusJrF8LRAEfTjBCK\+Cg53/p9xsaHI0GeoRg\+GA4yal40faCVKmYk4ovFgjxDs0I4FuX1QlbSCQAQBx8KsAQIw/G0jRFCPoYAYTmO0hXzPhMtE13OigYfjgY5muaC0WjAYQUAMJR8XmUj8bCPpRk\+GI0HaTlbUCk\+wBMpL2sArZoAH\+Ro0JWCTAUEFpR8Umaj8RDPUBTDCwGWYTmOIUBoYugGgKHkMwodikcDLE2zgWgsSMv51hM3bFwo0vqtmudoXTF/okqPd5okGBi6ZgBQNE1RNBeIi6oY5bpH3bqcyatcJBYWGJrmgrGYj0jZ9s\+PTCAc5BiaAlXMynQgHg1wDMP5IvEIq2az/aoCG6kooEkZ0RDCvnbxUc2GQ0k9mJ6sVCuT4xEq36yAECYQz8QYMcRYLFv4uM4JTooAIUyooBtKNhLw\+YKRVDYTZuRsQTFAK8RiIh2JBWdcCNCmy5mQL1RgZh3jdDmb1bhQ5yxNK0RCMUUYK5arlVJulJOizaOEoeZjcYWLRn1mY/zVR81\+psBkaolneGgxKD6aSgb0OL/FsoUJFWiBtxOY9xIJQ8lHAsEUFc3EpstKhAkkC\+NjIwOMEgsE4pIOZmlMB7KqoRaiQZ8vGE5mMzFOy2dl3QAAGx\+OhQWWZoRQPO4zxOx0fX2h6b14vdtzZimL2sAo1ifQmiiquiYXVJoXGJr1cUQuKJquiFLfX9kMAABifjnVRjfrl2oEJp2AOU1KhnwRWWj9UjfPzj4b7Ytl4rwSYbdYtnARmRVcduiXbQYQuy8aDfEMzfoiySin9bnQg3BRSdflVNjnC4SimWwySKRsYZ4zJNoXz\+bGRgdZLRn0Rfp1PLqUimZJOBbilmkHWdXImwxdzBu3jiIPAAAUH81OpEeHBMiGAuG8Os/b\+8LIr3rOkxW4YNPQCtGAL66HU6kAs\+xLb36FKmYkIoQEGgBoPuij5K6qAKGY9pCIUAwFWvN8jVDTFy5QFAW6alaHNnRV09755Q2fbf2EdsH3/uWE1vzpGAhFd9ep2lc5EwDDMPA4ttJ0TQeKbkedYrjmltY1VT312oE9W5ob7DPX/eT1E6qsGTQf4ImclzQAVczLRAhyNICuaUAzNGiyqNGdC2B1TdUJKzAEDF01CE0AdE3RCcPSrXcQmmWIrmg6ABBCtV9ubn0wG8X0eKdulmCMEAmzcoTnhFA0lRflOQ\+vVzWDYthOGjMcDZrSrEV10tvQFO3U8Z9d1/odeMueA6\+dUFVNN4/qBioKaFJeIr72ldPNf4MvFg3xDM3wwWgsSCvNch9hhEhWUo1Go6FLcQEMQtOz\+0uK4WiiK9oJMR4r0JHeP3xqYjzgiypCqpAJzvi7LudFgw92Lh3Q5byo85FYSGBphgtEYmFWE/OKrhViMZmLxmd1h4RQXeV1AEPXDELR22wMBfp0gdHQNQOo5R/\+E4YTuvEcTYBQrR\+02wxNB4qmKJPXt1EUMbSutuq6QVGUbW1XbT0gvSNDACgulCwoeqPRMJRsiDGAmnOp4Uy6nAr6wiITy2fCM67pIzQnBMPxbCEbYeVsXumbxt0fYxhiaKpOKIoinTNLQtEMBXqnzQtN78XHxqQ9Btk86QEAABTr4yhVlGSpoBDOx1JAcz7WkCVFFkWN5vtceasrsgZ0n5usNjZdlVSdYs7lMthPmbmdgHkPA2Co\+UggkNRD2UKytQP33tmNLb07dgJA8\+GM2Dx\+yqkAZQBlnm6ENBfeWTrDUF1tm0dzHDPvb2oUKwTC0Uwhn\+S0fEbSTboLQ85EUxCMLdcvkqsf\+YUMXdrWIvKaydCl3QiK4X2haKqQTwWMQkZUF9aWuTDyC408KMuW84RiKaNzR8KcPy5ufNjcMEomLATzJJLNRzs3zy43Q8lnxBPvPHFD87TnM1/52fETUiZv\+sP/UlCzHk\+hF8L4O9o60bN4R2Y9q6ihpAQKaD7Ag1SQNVUutO4dAAMMAwgBMHQdSLsupkmZjEJxNAWGKinAs3Sz0AMmlcKFJ0Pvd/ZOMFqIFlRNyUYFEONBngtmurPamF14Ms14m3vm8120bKBPnXXjFAV0pSDD9D1lADAzIASAkGbtRRWz\+ek7R7KSwfp4ylCy0XC8M1uLrsqaQej/8UFBfP3Eyweu3GKxWCyf/d6v3jn\+k\+u2sBFRB0PJhEMpKi6Kydl3ahmKJOmMb7obNlq/b3XeRgCAwCk5L77zzq/\+\+oItFotly54fvnzitQN7KD6uMjxLVLFdWtYVUTEYnqUZjqU0uV0QMlRJ0miOW7EbsWaiWZbWZbmVdYYmiyrFcjQxeZ1medpQxM4sVoqoEEZgHOw6XLXVRfWODAWanM\+25/cxlEJepXi\+36FFzUeCcT2SFzOhTkVAF6MCG5juGwgFYBgfv2uSxpqaj4ejnQm7DE1VdULTFMXwDKhSZ35MTdWhMwhaaHovgdG7PfZNlB5NNBfgiFrIF2RgfSwFABQnMLqYz4saLfhMrwPVCvG4RAXCArNqTV1NhpyJZbXpW8RQr07AtIcBXU6GwgU2JeajQmfvMdnZHSYdvqFJ01Me6XJe1Jl\+t4fTHM\+0Ho4C7bu6TU\+nQJdSkXDXbHKqrPUpOehy0scK05OMEUIADIP07i4oTcxLJ17/SfPmuM985Ynj7/zyhs/Swe77ohZh9SNvMnQxa\+AaRB6o3sd3omSCHD/9gzYh0BpuLwVGfsGRv\+DM8uU8YYQAq\+WTmRk3RGti1CeE8\+oix4cEQBejwajiy4v5ZbiTxJQuZ7MyPTA2ffHrxNgAo2SzrUgZ008bMTRVB7p5bDV0tfPMIl3VgDJ94AGhGJpoXXcDGNqCC0BoRVE0BYbW/tVbV\+XmHknRDGWocudiEUNvv6dZFcgXClmJCM1nZxBC06CpOtAcR\+RsVlRUORsNxSSDEGIo\+WgkS4IBjmouVlfl9tcZmqwaFDv9u/9SmSeYrmm6QWjOF4pnC9kwLWW7J6QmNMNQuqp0fstTZQ1odlYeE5qlQWv3Ve2F9m3Qupp9oKXaY/aBejnhccx4/n\+9nPY77N7mbBH1cnrAaW8\+D7Y2OeKyObyjxXIpN\+KxWdvPeM8NteYYrFYm00Mum907\+/G41fEBZ2f2gbTf6Rzs/bjUuU\+2reYGnXb38ES13mjUK7kh19yHp9fLY17HjCkJnYPpUrVanhjx2FuzKdYmR9w2h39sslKtFBPTE\+O0llBaydkH2g82Hy1WqtXJ9PRUVCav1yvjA\+1ZeUrj0zPsreiqrR/9pyTsGZlK2m\+3uYbGJ8vFsQGn1eqe8fji2qxHFldzgy6Hf85j5ivjAw6rw5\+YKFerpYlRv8M6Z7KjrjRu1IojbpvDO5IrVaul3IjHbnOPFGuNTsaOl6qVybGZM24uKb0XGByz9vRPj/VryR1dvZL2O2w22/RUDPXSqNtut3VtiRl7a60ymUsMum3WDTVl3yKmJCwX0yNeh9XuH9sQk1Eum34hMukETHqYeinh6TklV\+\+d3axjb02JliuVJ0b9DrDN3BXrsx6W3jwQO7yjE\+VqeWLUa7e5ux\+0Xps9qUra77C5BseKleaEhzbHQNdPOrMXXpsYdlnt3pFcqVItt94\+XllQd1ErDrnO4UnsaxF5s6GLSXDWJPImx/fa5KjbZnMPj09WOsOrPj04Rn7ZIt/tHHO\+PSUhOLzDiXRuojiRGxtyN4NRX\+z4sFYccTtmzWSwdKbNrhWHnV3T\+TYajdaR1Dk0UauXxzw2sDbnLi1PjHhaWVkdH7ADOPzNaVcTXntrCV1TElbHBxyOgfFytVZvVHMDDqtzYKxYqddrpbEBZ3OCg\+45merlhKczB0NzNLsxBjDr3zx9haM1S2dpfNjjsFpdI5O1Vm/kGc6VavV6ZWLY7eyc61Vzg06Hy9U9wK2MD7j96Uq9Xp0Y8TptVrt7YHSiVBrz2wHs7qF0J4Vrk6Num907OlGuVku55iybpXpr5ov2Ht35l8nsAz3eaZJg9dKox\+Eabk7EUpscbc5T3Z2Z1Ykhp80xkChWqpXJ9KDL1pxdoZob7Jrqo14e89ptrqH0ZLVer06Oep2tUwCzaK\+rokC9lHBbZ9Ysuifumjs5erU4NtSZj2FgtGtGnITXAQBgtbsHxzrbtF7OteaTsDk9Xdt6enmds6l6Je21zaqf2NrdfM8JCmul9HBrsgqHyz88PmfpM4oCjUatlB5wNtfW4U90jij1yviQu/nNds/IRLVVQhh0zGyL1b3E\+X5KCc\+sEAMAgGukVG806tWJEY\+9ubLuoekjjtnrtcmEv9kwq3Oga99ZuVVbP/pneO/I1CvjQy4rAICta9Kaualm86Yr1dyAfdZGsjaPM7VybsTvdrQybWRupnUXBRqNemUi0ZqPpDk5S6eNpfSgu7U3dCZBaSw1vRccHLP29EyPdW/p1c96ecxjbW/TRqPR7OMA7NMTN83dWx0bba6j\+YoCM3d\+m2twbClTAm9ofUJk3gn06mHqpVH37I7d0aoY9t7ZTTr2eik94ARozWDUmTVpejaktnbBqlpMtA\+snQTt3a01Go1aaXzY25wLzOkdHi/X\+i68XpkY7Uyn5B3qzMY6b3dxbidIaxT53kOX9RV5k\+N7vVocG/I47Vaw2pyewUSxXz\+FkV/GyE8756JAo9GoFscG3c34WO0u71BiYt5xYK/Xe6wcLG0O\+b7NruYGHXPPv9uT/lbKY16Hc3BkyGOH7ikJq\+MDDqd/ZLi5wae3d1dRoFHJDToAoHlyVSuPD3udNmtzJrrWgA6LAquib8a2TuQBwOoaTIx2Nki9WkwMuB3NnX\+gexa\+5qBjxg\+j1Ykhl2sw16PDqtdqM16cnpLQ5nAPjjV3zHMvCpgkWKNezo0MuJ3Th7nK7MxsTkloswLYHJ1z2plFgUajUZscG/I4bM15C0dy/RJzbYsCaKVg8FcBBrmPzROczbOmS4PxmReGaK1g5NcKRn6tbNDIL63Z9fKY19GjFFEdH3DMUzxB68VqZGx1YtjtcPpHJ5rlukajXpkcHx1w2acv5NwknnjiiY3zTAGEEEIIIYQQQujc0b6kKKUCeibM08RioRghnBRBiOWlbIhZ68attr9Y6wYghBBCCCGEEEKri9BCKC6E4mvdjrWHRQGEEEIIIYTQpwRhwwU1PPd1OphVg6vfHIQ2ALx9ACGEEEIIIYQQ2qSwKIAQQgghhBBCCG1SWBRACCGEEEIIIYQ2Kct/nf3vRX3g/XfLV1999bxvO3jw4FKbhBBCCCGEEEIIodWwgg8avOeee1Zu4aiPgwcPYvBXGga5j80TnM2zpkuD8ZkXhmitYOTXCkZ\+rWzQyG/QZqNzh5t\+NR08eBBvH0AIIYQQQgghhDYpLAoghBBCCCGEEEKbFBYFEEIIIYQQQgihTQqLAgghhBBCCCGE0CaFRQGEEEIIIYQQQmiTwqIAQgghhBDaWHQxzDKBrAqgZYMMGypoa90itFFN5xLagAwl5WO4qKQveQm6nI8HBZYmFouFMJwvFM8rS16aIcd5WkgqxkbLq9UvCqgZH2XpgQmLOgCAoeYjAmVhpnv3Hp\+gmhHWlXw0wNHEQmjWF850skGTUmEfSxOLhWJ90YJmADS3EeleCPGlFKOrZYacFCgLG5FaL\+pKtr10zhfJyjoAaPkQPastREgpBoChFuJBniEWC8UKoaSodS8aAHQpyhPCJ9tfqcupEM8Qi4XQbCAudh3KNDHuoy2UrzuJzNZ0sQw5KRDLHGxE1AHAUAtRH0sRi4Vi\+HCmsz\+Yva6JyQBHE4uF0Fww2WmUyaoZSjYsMJTFYqFYIZJXpwOkS6kg2x2cDa93ZAwlHw/yDGWxEJoPZWS9\+wNzN/qMlAqnJK3zcnI601KzM21mGhtz9h4u3kpwQ8mEeYayEJrztRJ26em9KHP3ceiXHhuTaUd3x//8NkN39z1aNkgTttX/ATT7CoqLiNqMvZVQDCeE52zvDUwrhBjTAwECANNOwLTvlTIRH0tZLIThA/F8J8l67Oxg2rHrcjbSXDjFCJFs965oKNkwR7qOkq1vTQVbR8pApPvoNLdb08UIO2N708Gs1mfhhiamwgJLWSwUwwfjhXZj5ukuDDUbpGf1MIu0FpHvPXQxDc6aRN7s\+K7LmYiPbbUleg6jabSWdDkT9nEMZbFYCM0KoWRhOpUXNz6cZ6CyXNRMoOtASzGcEIxv/OEDWmW6nAoIoZTKh1OiUqvVlHw8xClxHx/MyOeYTBQXzWbjAr08DQVdyWfFlUzw/zr734v679/\+7d8aC/DEE0\+Y/KVeLU8Wi8VicSI97LbZvaO5YrFYLBYnK7VGo1oc9TpdXq/T5hicqPb8fLU47HYNjFfqjerEkMvhGZ0oV2u1yuSY3\+EYGK/UG41KbsBhcw2lJyvV8sSo12H3jpXrjUatOOxy\+McrZu0qj/ntAOAamaw3Go1GNTfotDkHEhPlSnkiMeC0OYfmtKg2OepxesdK9UZtcsTtcA/nStVarVpKDzodzS/tfqcNwOpJNF\+tTgw5ba6h8VK1WpkY8dgd3nS53mg0aqUxv8vl8bps9q6mmq3pooPfqJcSHrvDn2gFva1UqTUa9XLCY7d7R4uVarWUHnTaXMPFWsP09Xpl3O\+wu4dz5Wq1nBt22R2Duar5qtUmR9w258DYZKVamUz4HXbPaKneaDTq5fSg2\+nxuu22dnA2hH5B7h2Z\+uSo2\+bwjuZK1UopPeSytzOq90avFYddNod/NFeqlItjgy5bc6PXiiMue/PlymR6yG23z8i02WlcLyU8jl6BreaGnPbWZiom/C738Dmk9yKCY7KPm6XHereEjk45nvbbu7Z0bWLIaQWbe3SytcL1csJjdw5N1OqlhMfubO2FtUq5OD7id1gd/r6xX1/6ZUKjOjHosLmHxye6\+6LJSm3VWrcu9AuRSSdg1sOU03673T2ULpYrpdyI125zjUzWGmY7u0nHXisOu2zOgUSxXK0UxwacdndzIY16JTfscbq9HofNNTzZScF6JT3dmIlRr8szOllrmB/LBp3OoYna7DXtvfB6KeGx2z0j45OVSml8xGO3uUdLfY4mbZXcoNMKYDqKWJ\+RNxu6rKfImxzfW01pBmBi1O9or9LiI784teKQszmsq44POJz9NziaJ/LViWGXFaxO/3Aincvl0mMjg267vZlWixwfzjNQWb5mV9J\+u2MgV200Go16ZXJ8xGsHmzfdZ4BsZjqX0Pqx4L6iXh7zOlr97iLVSmN\+t3907kfrpTG/09PjDwtoTmnUbV\+Bc5ra5Ijb3a9zPSdPPPHE6hcFOuqVtNc\+sxOvV4q5YqVWGfc7TA7nteKw2\+lPl\+vNmDvc7bFAvTzmtTuHirVGdWKwa8\+ul8e8DvfIZK1Rmxhymh4z6pX0gNPpH/Q4WmdT9fL4yNBosfXuemnUbXfPOk2plxIepydRqjfXxTF9FKzmBhyOgfFq1zu9TtfAgLt9elYZ9zva/VijUZscdtmbC6pO5ibKterMzslsTc3MVxRw9syo2uSIq2sdK2m/3TmYq5q93jpzmV7lQYfdn67UTVatOjHknD4q1EsJj7117CjlcqVqbXLEtRI70MrpczbYOzK1csJjb5\+rNxq14pDLMTBeaZht9MrE6NBIrtLe6Gmv3TVUrDWqxXQiPdlOrUra72gVY5ofmpXGjfrkiMvhT7eX2lFJ\+x19h22LSO/FBMdkHzdNj/VuKR1dvTzmtXe2Wq047HZ6BzzOzup3Rjk99tZ6ecxrt7dKiBvAfEUBp31Jw7dPk747S89OwKzvrZXSw0Nj7QFMrTjsau5TvXd2k459VldcHR9on0rWyxO5YqVWHvPYu88eywmPwzNamrV0k26tURn39xy49V54rTSeGCu2E6Q6Mei0\+9OV\+bqLam7I5fQOes2P903rLPKmQ5d1FHmzoUu9nBsby7WTppVD5mXdvpFPe53u4bHRAY/b5XQ4PcPjzTFT2u9wdSJfGfc7nEPFGhYFFqlvIWxyxGW1eRIzMqpWTAwNj5Vqixwf9h\+oLGezu4sCrbVw2zoDrXo5N\+x12q0ANofbPzrR3qMrE6N\+l90KYLW7vK0U6y4K1IojHrtrMLfJD07rwDxlrOKo32kDsDo8Q6PDHnurh6tXi4mB5vZ1uAcSxWq9Uc0NOhz\+zmijPp2SteKIxzU4Xqk3aqX0kNdlt1ptTv/o2IjHNZgrlxJ\+z3CrlmqSNsMupz\+RGPZ73C6HwzWQKFYb3UWBTl6ZvLPRaNTK48Mepw0AbM72cptfN\+Bx2qxWm9MzMDJeqtWKw87W7/mOwYlq7/Su5gacroGRQbfd5hqerDUatcmxQbfDBmC1u6b3AbNor69nChBGCAgMRcz\+biiZeB4C0QBLmm9mNLEg6wBgqJKoUryPIQAAXVdWEIqhQZUVHQxdN5qX8hELoblgfPpyJkPNR\+MyH4v66PZ3EzYYT0XbV3zoqqITmqG626Lm40mNjwY5AkBoPsAaUl7Smm3JK4QTOKrT6lhS88XDQvvzuiqpBiOwrX9TjMASVVJ0AJoP\+NjZAeizpstIVxSd4rj2cmmOZ3RFUQ2T1zVF1gg3vQ6cwIIiqad6r5qmKYpOd5ZCGI6jNUXRDKC4QICjyXKvzRrSe0dm1uU\+hGYpQ5FU3XSj\+6KpeKAVMEOTNUKxNAFaCEVCfDMvdSmflQnva2VajzQGw9ANQ81HBZayEIr1RZsX1umqpAIN\+VDz0tNZ9zLAYtJ7kXru44ZpenwaEYb3sbpUUHQAMFRJ1hhf0EerBUkzAECTCzLhAlzPq80IGwgJRM5Kn9LYoG4mnYBZD0NxoWQqzDdfNnRV1SmGoYjJzm7W4YMxswk00WVFMwAI6wsIc447uixphNZSgeal80Ik27rcuGe3Zhi6YehSstkWhg\+lWpe89144xQUj4dbLhlLISAbn4\+j\+3YVWiMdEJhINnMshcm0ibzJ0WT\+RNx26EDYQDgfY5ttVMVPQWR\+/5A2gvZ7NQiQvyYoUZ/LR6Ia5HXdDMxRRVOlAJDjj0E4JkVQyzFGLHB8afQYqK7oSmpyXNNbnYwkA6FIsFMqTcFapVsU4p8ZDkaxigKFkQqGk7kvJ1aqc8hnZcDjZdY24YajZSDhLopnkOXUiaKVphWgorvLJUlXNh0k\+89opAADQpWQgmDRCGblaEeOClgyFsyrFBwQiF9q3gWlSXiZCkKdBk7IihCIBWstHQkkjmJI0Tc4E5GRSpnmWYXkWVFUzoE/aGO8UUjIfL0iykg\+q8UjS9Abvnu/U8mFfRGJjhUq1nI/QYiQYFXUATYxHUkYgJWuako0wUjSSUvlkIe13OIeLNTXjI73TG4AYqiSRcEEuxDiipIKBuCokxUpFygQhFQql\+t4Qsb6KAvPQpGRG4cKhVtdC8eF4GJLXfcZisWzZE1Z9yZiPIUCxPh7EZErUmjdxxwsndF3XdcPQdU0HIZrKj8cDtBQLBFux0QqxuMxFYz7G5HsL8bhIh6PdJ\+K6nE1KTCjSKhsQNhSPMPkbPmuxWLZccIvEReOh1hFSyUaTqi8e7bqlxDB0g1BU50yYUDQxdN0w21Ima7pE\+js/\+8pnZtxcyMdlw9B13SAU1XkboSnQNUM3ef1s8\+XOKhCKIoaun\+m9amfPqDpQ01UVQtEEdP1TeWJj9I4M0DzPqNlkVjHA0KRMLCWd0hcWAl1KxfIQiAXZ1kINJSUQi\+Uz1yUhnEoFm7nQM40NXTd03eDCyex4MsRqqVAgJupgaJp2QixoQlJUK4UYI4aDkXzX7bcLTu/lYRibJz0AgDA8zzSrAoYqiSojCDzPEUWUdQBdLsgG6\+tdEwAAimEo0JSl3yuNNqSuTsCkh\+neXQw1H4vLXCQi0CY7u1mHTxgfT8mpZEE1wFDFVCx//JShmu6Lhq5r6jt5EUIZuVrOh0k23BzRmL/f0HXKF89k0zGBiJFAKDPf/ZFaNkBbLFv2RLVAKhPmSL/uQheTsTwdjgVZymxxi7VakTdMhi4m0VmLyM8zdNELYcZi2XJBUOLjqQhPmS63DwIAxC6EQzwFABTLs6AqmvlqoeVi6IpGGL73jrPY8WHr0Rm9Bior0PITv7rls82x7JbPfiVDwvGIQAGALmfyKheJhQWGprlgLOYjUlZSdSWfUehQPBpgaZoNRGNBWs53Hp1g6FIyFFN8qUxkFYoY6BzoclY0\+HA0yNE0F4xGAw4rAICh5PMqG4mHfSzN8MFoPEjL2YJK8QGeSHlZA2jVBPggR4OuFGQqILCg5JMyG42HeIaiGF4IsAzLcQwBQhNDNwCMPmlj40KR1m/VPEfrivkTVXq8UxUzEvHFYkGeoVkhHIvyeiEr6WDomgFA0TRF0VwgLqpilOveg0zSu5nHTCAc5BiaAlXMynQgHg1wDMP5IvEIq2az/aoCG6kooEkZ0RDCvtbZiKFmw6GkHkxPVqqVyfEIlW9WQAgTiGdijBhiLJYtfFznBCdFgBAmVNANJRsJ\+HzBSCqbCTNytqAYoBViMZGOxIIzLgRo0\+VMyBcqMLOOcbqczWpcqHOWphUioZgijBXL1UopN8pJ0ebx2VDzsbjCRaO\+c3jKhNmaLhE1\+5kCk6llPcNDvVF8NJUM6HF\+i2ULEyrQAm8nMO8lEoaSjwSCKSqaiU2XlQgTSBbGx0YGGCUWCMQlHczSmA5kVUMtRIM\+XzCczGZinJbPyroBADY\+HAsLLM0IoXjcZ4jZzqO0FpzeaGko1ifQmiiquiYXVJoXGJr1cUQuKJquiFLfX9kMAABifjnVxmKcevmvL9gy98GWqFvPTsCcJiVDvogspJIhljQzps/OPhvti2XivBJht1i2cBGZFVx26JdtBhC7LxoN8QzN\+iLJKKcV8rOuO5pGuKik63Iq7PMFQtFMNhkkUrYwz7kp7Ytnc2Ojg6yWDPoi/ToeXUpFsyQcC3HLtIOsauRNhi7mjVtHkQcAAIqPZifSo0MCZEOBcF6d5\+2mCEW3LnYjhBAA059L0HIiy37BZo\+Bykogdk/zkT0TufToEKfGg6GkbADoqmZQDNu\+cJJiOBo0RT\+lKTphWJpqfZpmGaK3Ck\+Gmo\+E4poQj53LkB2tCl3TgaLb151SDNcc/Oqaqp567cCe1rjiM9f95PUTqqwZNB/giZyXNABVzMtECHI0gK5pQDM0aLKo0Z0LYHVN1QkrMAQMXTUITQB087QhhGq/DNDs\+E26rB7v1HVV09755Q2tspblgu/9ywlNVTWDESJhVo7wnBCKpvKiPOfh9b3T2wAAoGim\+bqhKdqp4z\+7rvU78JY9B147oar9qqwbqCigSXmJ\+NoXJDX/Db5YNMQzNMMHo7EgreRFxQAgjBDJSqrRaDR0KS6AQWh69hiBYjia6Ip2QozHCnSk9w\+fmhgP\+KKKkCpkgjP\+rst50eCDnZ/rdTkv6nwkFhJYmuECkViY1cS8omuFWEzmovEAM2O5hFAzrgwwdM0glOk19OZrujSE4YRuPEcTIFTrB\+02Q9OBoinK5PVtFEUMTZ9eBV03KIqy9V61bTaGAl3Vu18G6tNyZjMT6R0ZAkBxoWRB0RuNhqFkQ4wB1JyLPGfS5VTQFxaZWD4TnlG1JjQnBMPxbCEbYeVsXumbxt0fYxhiaKpOKIoinTNLQtEMBXqnzQtN78XHxqxdZPOkBwAAUKyPo1RRkqWCQjgfSwHN\+VhDlhRZFDWa73Plra7IGtB9brLaWGY/aFDEKzZnmdsJmPcwzUFtIJDUQ9lCsrUD997ZjS29O3YCQPPhjNg8fsqpAGUAZZ5uhDQX3lk6w1BdbZtHcxxjfh1C\+22sEAhHM4V8ktPyGUk36S4MORNNQTAWXtpv1HOsfuQXMnRpW4vIa/MMXSiG94WiqUI\+FTAKGVFdWFuWAssEy45QLGU0b2Pt9cfFjQ/bWTlroNJz2cvQdJrlBUEQfIFQNFUoJHk5GS9ohmHMLCd1stYwoHexzTh1XAKOMwrxvj\+movWjZ9mUzH5WkZISKKD5AA9SQdZUudC6dwAMMAwgBMDQ9VYNEgA0KZNRKI6mwFAlBXiWJv3Spm/VfCHvpGY9eUYvhFkCtBAtqJqSjQogxoM8F8x0n/WZpvccNvfM57to2UCfitfGKQroSkGG6bv5YHb5mAAQ0qy9qGI2P33nSFYyWB9PGUo2Go53ZijSVVkzCP0/PiiIr594\+cCVWywWi\+Wz3/vVO8d/ct0WNiLqYCiZcChFxcW5w1RDkSSd8U0PPQxo3onZeRsBAAKn5Lz4zju/av4UtmXPD18\+8dqBPRQfVxmeJarYLurriqgYZpdt9VvTZUWzLK3LcivrDE0WVYrlaGLyOs3ytKGInVmsFFEhjMA42J6rRjMcS2lyu9ZlqJKk0RxHL/dKrAdU78hQoMn5bPsiNUMp5FWK5/udxKv5SDCuR/JiJtSpCOhiVGAD030DoQAM4\+N3TdJYU/PxcLQzQY\+hqapOaJqiGJ4BVerMj6mpOnSGnwtN7\+VDNlF6NNFcgCNqIV\+QgfWxFABQnMDoYj4varTgM\+0LtEI8LlGBsMCsWlNXFCEUx8\+pUKKOXp2AaQ8DupwMhQtsSsxHhU4cTXZ2h0mHb2jS9JRHupwXdabf7eE0xzOth6NA\+3560xNZ0KVUJNw1j58qa31KDrqc9LFCvDM8b/1sbNJdUJqYl068/pPmzXGf\+coTx9/55Q2fpYPd90UtwupH3mToYtbANYg8UL2P70TJBDl\+\+lICQqA13F42hBDojIINXcM7CpYbYYQAq\+WTM2e81sSoTwjn1UWOD42eA5VVOs8mBAxd14FmGEpXlc6PHaqsAc3SdpqhdFVuZ5ChyapBNX8BJg5vPJPJJgU1FkmZXnWD1geKpsDo9AS6Kjf7QopmKEOVO1dBTfcWzapAvlDISkRoPjuDEJoGTdWB5jgiZ7OiosrZaCgmGYQQQ8lHI1kSDHBUc7EmaXNOCMXQRFO6itxaq7ara5puEJrzheLZQjZMS9nueT2JSXrP7NIJzdKgtY8S7YX2a8\+GKQoYmqzoFNt1bTTNBzij0OrBDCWbzKuMT6AJGFohHgqG4qIi56PBUB6EkMAQQhFdjEciyYKiqVImGslofCi492txuetJluMDTtfIZF1JCkTJRuOKkOx5Zb2mSBrFdh1QaS7AU1IqWdAMAEMtJFMKLfhYpy\+jdhZeL495HZ5EWZeiHCOEfKQQi2ZkTVMK8VhWF8LmP5CZrumyIlwoxKnJWFJUNU3KRuMyEwjztNnrhPGFBSMfjeUVTZOzsViB\+MICA3TvVaO4UICR4tGMpGqqmIqm1OmHQ3zKmEUGDDkTCQYjWUkRU6FgTGZC/SKg5WMxkY2lZv7sRTEcbRRi0VRB0TS5kIylZFrwfdksjWmK0uVUJBzLy5om52ORuMwGgjxF2EDYB/lYLCtrqpSKxkTiC7Yvwlloepu3fdE2UXq0UJyPM8RMXm8/PoAwvEDJ2YxE\+J6h1VUpnwwFghkSSuKljZtE707ArIcx5EwkZQRTs6rYJju7WYcPmpSMBEOxvKwU4qHQz1QuFOhTuyRsIMxr2ViqoGhKIRmJy4wvaLrrEpqohVg4khJVTRVTkWgehJDpA3IohmWJlIzG8rKqKWImGpcIH\+Do3t0FzUZEo9ML1opDLufgRLX/ryKm1iTyvYcuZk1ci8ibHN8pmuWIkonGspKqqVImFisYXGDpTxrs2SKO1hVR1QEMtZDKyGeWb9kIAAAoLhQLM9ID13G\+SDKTL4iFfCocCCQVWuBMk9bk9d4DlRU/pBuaUkjF4gXggzxDKC4gUHIylhJVTZUy0XgB\+KBAU2wgyKqZWLNt\+Vg0r3HB9m3JhABFB\+LxgBaPpFbqfge0LCguIICYjGdlTZOz8aTYrKcSNhBktUwslpd1w1ALUZ8QyjTrmzQf4I1CMiURIdBKRpoVGK0gaYSPxoOQCXB8OE9FUpkoJ//wOl/cCGUyYZa0F2uWNueCEUI8EePRjKgahi6nQoIvKmpgyKkgL7QfDa5IskYxDEUIIWBomqbppHd6zyoKMEKQNwqxWEbSDEOT4kFhvvt41tOUhPVSwm2d2bzuibvmTo5eLY4NdeZjGBjtmhEn4XUAAFjt7sGxzgQr9XKuNZ\+EzekZSveYyqd1NtVsnG1WqGzt6X16TlBYK6WHW5NVOFz\+4fE5S28XBeqd9w84m2vr8CdaEwXN/VabN13ps6Y9zTMl4awQAwCAa6RUbzTq1YkRj735ve6h8c7lN2av1yYTfgcAAFidA9Px7LlqjUa9Mj7kbq6e3TMyUa03Gs2pymc2xeruM5XR\+tE/w3tHpl4ZH3JZAQBsTu9Ie2aQ3hu9mhuwz9pIVs9Yud5o1Mq5Eb/b0cq0kbmZNp3GzS\+dSLTmI2lOztJpYyk96G7tDZ1JUBpLTe8FBsd8H\+\+ZHuve0uZebTQajXp5zGNtb9NGo9HsmhQtuAAACq1JREFU4wDs07Mrzd1bHdNpszHglITz6hMi806gVw9TL426Z3fsjtbE9L13dpOOvV5KDzgBWjMYdWZNmp4Nqa09XWa1mGgfWDsJanosq5XGh70uuxWsdqd3eLxc67vwemVitDOdkneoM8nZvN1FuyiwoSLfe\+iyviJvcnyvV4tjQx6n3QpWm9MzmCjOM/GV6d8qaa9jeh7Wrkkda5OJAbfL5XI63f7hYX9zpkycknBx5j1gVYtjg\+5mZlrtLu9QYmLecaDJ6/MOVJan2ZW0vzvdbQ6Xf3g6WZtzttmsADZH16B/em45m8M9ONZ8e/eUhI1qbshpd49shHmRP936Zmy9OjHiddoAwOoaTIx2Zs6uV4uJAbej2e0OdM/C1zzjmDHRc3ViyNV79sl6rTZzGvreaTPscnSGMZ1/mUxJ2OOdjeaUhF6nzdqc6rCdpvVybmTA7Zw\+zFXqjUajkht0AEBz1upe6V3NDTq6J\+ls1CbHhjwOW3PewpG\+Z49PPPGE5b/O/vfso1lf779bvvrqq\+d928GDB\+\+5555FLRktFwz\+KsAg97F5grN51nRpMD7zwhCtFYz8WsHIr5UNGvkN2mx07lZj02uFSCBcoMPJeLh5maahSvlsMp6UmLiYDzEr\+\+3rycGDBzfM7QMIIYQQQgghhNAyoH1JUUoF9EyYp4nFQjFCOCmCEMtL2c1UEWj6i7VuAEIIIYQQQgghtLoILYTiQii\+1u1Ye3ilAEIIIYQQQgghtElhUQAhhBBCCCGEENqksCiAEEIIIYQQQghtUlgUQAghhBBCCCGENqkVnJJwqU1CCCGEEEIIIYTQalip2QdwTlGEEEIIIYQQQivnD3/4w4WX7FnrVmx4ePsAQgghhBBCCCG0SWFRACGEEEIIIYQQ2qSwKIAQQgghhBBCCG1SWBRACCGEEEIIIYQ2KSwKIIQQQgghhBBCmxQWBRBCCCGEEEIIoU0KiwIIIYQQQgghhNAmhUUBhBBCCCGEEEJok8KiAEIIIYQQQgghtElhUQAhhBBCCCGEENqksCiAEEIIIYQQQghtUlgUQAghhBBCCCGENiksCiCEEEIIIYQQQpsUFgUQQgghhBBCCKFNCosCCCGEEEIIIYTQJrW\+iwKGHOdpIakYa90QhBBCCCGEEELo02fligKGWsgW\+p/OG5qYzcv6ijVh2RhqIRnkGWKxUKwQSokaVikQQgghhBBCCG18K1YUMNR8Mp5V9H7v0cRkPCXr6/0MWxdjgVDSCCSlSqUQZZVYMJTBixcQQgghhBBCCG14K1MUMOS4sOfAy8d/ectnqUBWBTCUfMTH0sRioRg\+EC\+oBqgZH/e9fzn\+8l9fQAlJxTDUfDzIsxSxUAwfSklav4XzjBCJBFiKCWR6LtyQ4zzjSzXP3LV8kLYw4YLe/HBSYISkYmhiMiRwNCEUwwcize8z1JSPZkL5Wd9tABuKZ1PRAMcwfCga5oki9a92IIQQQgghhBBCG8DKFAUIF81PDDodA7mqng8yuhQLhfIknFWqVTHOqfFQJKvQoWx\+2OXwpiu6GGHUbDiSMkIZWa0UYqwcDUZnn5rPoMuiyiclKdN74SrN85QqKjoA6IqoUk6iyIoOAJoiajTPU3IymlR9cVHTlEKMV5LhuKgDofhQNBpgqZlfRguhSIinm18s5bMy4X3crPcghBBCCCGEEEIbzmo8aFCXM3mVi8TCAkPTXDAW8xEpK6ndF\+ATNpgVxUyIZ2iGD0bDHMiSqvdZJsWFQz6WpkjvheuMwIEqqjoYqqQQIcSDJGsGaIqoEk5gQdc0AwhNUxTN\+qIFRU4KFADFBSPhAEt6fKGhpARisXzmuiSEU6kg0\+s9CCGEEEIIIYTQRrIqRQFVMyiGpVvn0RTD0aApsx4loCuFeICjicVi2bLnh6\+dMIx\+d\+0TmqWpfgunOIHVFUnTNVnSWZ/PR\+uSouuqKBusj6NoPhIVtJjACcFIMivK6ryPCCBMIFkYHxsZYJRYIBCX9CUEAiGEEEIIIYQQWk9WoShgGLNO8HucgGvZSDAqMZGsXK036uUxj2OBv8SbLpzmBFqTZEUSNYbnGJYnqiQrkqyzPo4CoLhwVtGUQixAy6kQz/ni882CQGhOCIbj2UI2wsrZPD5UACGEEEIIIYTQRrcKRQFCMwylq51LA3RV1oDu/LbffElSDC4cDQksTUBXRHWhk/6ZLpwwPE/UQr6gUDxHUwzHGlIhL2q0wNEEwNBUzSA0KwSjmUIhzin5gtnVAroYFdjA9HwDhALofx0DQgghhBBCCCG0EaxYUYAQAoauaZquEy4gUHIylhJVTZUy0XgB\+KBAk\+ZbFFXXDQtNDE1SdAN0ORvPaIQY\+sKmKqRMFg4UI3CGmBUNlmMIUAzPaIW8THieIWAo2bAghLOKAQCGIokqoRmKgC5nk6n8rOkGKYajjUIsmioomiYXkrGUTAv4pEGEEEIIIYQQQhveihUFKC7oo1/\+4ZVsMKtSvmQ\+E9BTAfazF/hiKp/MZ0IMAcIGg6zyk68wvgzcEg2S7C2f3WL5TDDPxVLJEFMICuHffTL/F9G9Fw5AswKjnzAYnqEAgOZ4Sn0HOIGhAAgbTKZCRirAEItly5URzRePBxgwdCkTj8\+5M4AJpgrZIGTD3Gc/y4ezEMxk4z5quQOGEEIIIYQQQgitMst/nf3vRX3g/XfLV1999Qq1BiGEEEIIIYQQWog//OEPF16yZ61bseGtxuwDCCGEEEIIIYQQWoewKIAQQgghhBBCCG1SWBRACCGEEEIIIYQ2KSwKIIQQQgghhBBCmxQWBRBCCCGEEEIIoU0KiwIIIYQQQgghhNAmhUUBhBBCCCGEEEJok8KiAEIIIYQQQgghtElhUQAhhBBCCCGEENqksCiAEEIIIYQQQghtUlgUQAghhBBCCCGENiksCiCEEEIIIYQQQpsUFgUQQgghhBBCCKFNCosCCCGEEEIIIYTQJoVFAYQQQgghhBBCaJPCogBCCCGEEEIIIbRJYVEAIYQQQgghhBDapLAogBBCCCGEEEIIbVJYFEAIIYQQQgghhDYpLAoghBBCCCGEEEKbFBYFEEIIIYQQQgihTQqLAgghhBBCCCGE0CaFRQGEEEIIIYQQQmiTwqIAQgghhBBCCCG0SWFRACGEEEIIIYQQ2qSwKIAQQgghhBBCCG1SWBRACCGEEEIIIYQ2KSwKIIQQQgghhBBCm9RfLOEzf/jDH5a9HQghhBBCCCGEEFpllv86\+99r3QaEEEIIIYQQQgitAbx9ACGEEEIIIYQQ2qSwKIAQQgghhBBCCG1SWBRACCGEEEIIIYQ2KSwKIIQQQgghhBBCmxQWBRBCCCGEEEIIoU0KiwIIIYQQQgghhNAmhUUBhBBCCCGEEEJok8KiAEIIIYQQQgghtElhUQAhhBBCCCGEENqksCiAEEIIIYQQQghtUlgUQAghhBBCCCGENiksCiCEEEIIIYQQQpsUFgUQQgghhBBCCKFNCosCCCGEEEIIIYTQJoVFAYQQQgghhBBCaJPCogBCCCGEEEIIIbRJYVEAIYQQQgghhBDapLAogBBCCCGEEEIIbVJYFEAIIYQQQgghhDYpLAoghBBCCCGEEEKbFBYFEEIIIYQQQgihTQqLAgghhBBCCCGE0Cb1/wO1da9bAQ/T3AAAAABJRU5ErkJggg==)

*圖 4\-3 交易報表查詢（已查出 3 筆；注意 BILL\_CSPTIME 為空時顯示 null）*

### 4\.3\.1 畫面元素

__畫面元素__

__定位（id / name）__

__型態__

__預設值 / 初始狀態__

__說明__

頁面標題

\#title

文字

交易報表查詢

type=refund 時改為 退款交易報表查詢

報表類型

\#type

hidden

trans（由 URL type 帶入）

每次查詢隨請求送出

日期\(起\)

\#fromDate

文字輸入

瀏覽器當日 yyyyMMdd

placeholder yyyyMMdd，寬度 8

時\(起\)

\#fromHour

下拉

00

選項 00～23 共 24 個，由 JS 產生

日期\(迄\)

\#toDate

文字輸入

瀏覽器當日

同上

時\(迄\)

\#toHour

下拉

23

選項 00～23

商家

\#merchantId

文字輸入

E000001

位於 \#transOnly 區塊，退款報表時整塊隱藏

時間類型

\#timeType

下拉

tx（交易時間）

另一選項 auth（授權時間\(只限OLS\)）；位於 \#transOnly

查詢

\#btnQuery

按鈕

文字 查詢

提示

\.note

紅字

畫面僅顯示10筆資料，其餘透過背景處理匯出CSV\(匯出功能尚未提供\)

固定顯示

結果區

\#result

區塊

請輸入條件查詢

查詢後被後端 HTML 取代

### 4\.3\.2 操作流程

1. 進入頁面，日期預設今天、小時 00～23、商家 E000001、時間類型「交易時間」。
2. 按「查詢」：結果區顯示 查詢中\.\.\.，頁面組出 from = fromDate \+ fromHour、to = toDate \+ toHour（各 10 碼），以 $\.get\('/report/data', \{type, from, to, merchantId, timeType\}\) 送出。
3. Portal 檢查登入後轉呼叫後端 /sa/report/trans?from=…&to=…\[&merchantId=…\]\[&timeType=…\]：merchantId 為空字串時不帶；timeType 一律帶（頁面永遠有值）。
4. 後端回 HTML 表格，Portal 原樣回傳，頁面插入 \#result。

### 4\.3\.3 需求條文

__編號__

__需求描述__

P\-RPT\-01

頁面初始狀態：\#fromDate、\#toDate 為瀏覽器當日（client 端 JS 以本機時間計算，與伺服器時區無關），\#fromHour=00，\#toHour=23，\#merchantId=E000001，\#timeType=tx，\#result 顯示 請輸入條件查詢，\#transOnly 區塊可見。

P\-RPT\-02

兩個小時下拉各有 24 個選項 00～23，選項文字與值相同（補零兩碼）。

P\-RPT\-03

查詢條件組合：from = 日期\(起\) \+ 時\(起\)，to = 日期\(迄\) \+ 時\(迄\)；後端再各補 0000 / 5959 形成 14 碼區間，兩端包含。選 00～23 即代表整日。

P\-RPT\-04

時間類型 tx 以 TX\_DT（交易建立時間）為區間欄位；auth 以 AUTH\_DT（OLS 授權時間）為區間欄位。非 OLS 交易 AUTH\_DT 為 NULL，選「授權時間」時不會被查出，符合「只限 OLS」。

P\-RPT\-05

商家代碼非空時加上 MERCHANT\_ID = <輸入值> 條件（完全相符，大小寫敏感）；清空商家代碼則查全部商家。

P\-RPT\-06

結果欄位固定 12 欄，依序：TXID、MERCHANT\_ID、ACC\_ID、AMOUNT、CURRENCY、TX\_STATUS、TX\_DT、AUTH\_DT、BILL\_CSPTIME、MEMO、MERCHANDIZE\_NAME、REFERENCE。

P\-RPT\-07

結果一律依 TX\_DT 升冪排序，即使時間類型選「授權時間」也不改以 AUTH\_DT 排序。

P\-RPT\-08

顯示筆數上限 10 筆、total rows: N 為全部筆數、查無資料為空表格加 total rows: 0（適用 P\-COM\-22 ～ P\-COM\-24）。

P\-RPT\-09

起日晚於迄日、或日期格式不是 8 碼時，不提示錯誤，仍送出查詢；結果依字串比較決定，通常為 0 筆。日期欄清空時 from=00、to=23，條件變成 TX\_DT >= '000000' AND TX\_DT <= '235959'；以字串比較，20260916… 介於兩者之間，因此會查出全部交易（受商家條件限制）。

P\-RPT\-10

TX\_STATUS 以代碼原樣顯示（A 授權／D 已請款／F 已取消），不轉中文；BILL\_CSPTIME、AUTH\_DT 等為 NULL 時顯示 null。

P\-RPT\-11

後端無法連線或回錯誤時，結果區顯示 backend error: …（P\-COM\-15）；SQL 錯誤顯示 query error: …（P\-COM\-26）。

P\-RPT\-12

頁面 URL 的 type 參數任何非 refund 的值（含省略、TRANS、亂碼）都視為交易報表；資料端點同樣只判斷是否等於 refund。

P\-RPT\-13

SA 與 CP 共用同一頁面與同一後端 API；商家代碼由使用者輸入，不依登入身分限制可查詢之商家。

### 4\.3\.4 後端介面

端點

GET /sa/report/trans?from=<10碼>&to=<10碼>\[&merchantId=<商家>\]\[&timeType=tx|auth\]

查詢語意

SELECT TXID, MERCHANT\_ID, ACC\_ID, AMOUNT, CURRENCY, TX\_STATUS, TX\_DT, AUTH\_DT, BILL\_CSPTIME, MEMO, MERCHANDIZE\_NAME, REFERENCE FROM MWP\_PAY\_TRANS WHERE <col> >= from||'0000' AND <col> <= to||'5959' \[AND MERCHANT\_ID=merchantId\] ORDER BY TX\_DT，<col> = AUTH\_DT（timeType=auth）或 TX\_DT（其他）

回應

text/html;charset=UTF\-8，格式見 P\-COM\-20；最多 10 列

錯誤

query error: <msg><br/>SQL=<sql>（HTTP 200）；缺 from/to → HTTP 400

## 4\.4 退款交易報表查詢（report, type=refund）

路徑：GET /report?type=refund。與交易報表共用 report\.html 與 /report/data，差別由 type 決定。後端：GET /sa/report/refund。使用者：SA、CP。

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABQAAAAE5CAIAAABAvBrWAACk1klEQVR4nOz9f3xT5d04/r/SJjmnP5IeoCmhhBKI0lgQUmEaUdags0RnWcROs7vbjAxZ2GSLG7vJxvuDke\+bGe6be8t7zpExxbDbzrhVzUAx1B8E6/CIYANKSdGUFNoSmkJPk/44adLk\+0eS/i60CKLr6/nw8ZAk17nOda5zJT2vc/04nNkrfw0IIYQQQgghhNC/u7TrXQCEEEIIIYQQQujLgAEwQgghhBBCCKFJAQNghBBCCCGEEEKTAgbACCGEEEIIIYQmBQyAEUIIIYQQQghNChgAI4QQQgghhBCaFDAARgghhBBCCCE0KWAAjNAAghsnrncZEEIIIYQQQtcIBsD/ZuJFBVEJd9Ab3JiIO2bqq4sQRNYtDxeTVyWzeJGy85k7o8KJbCMqCK9bFBVd6S4JUXjnE8GNc2MAABArq2iv///a3/kV886vmHd\+1f7Rby/uXtI3ODwmyJiIjI8j4\+twLAAgFPWuXhJRLmLLC2KD35fMZVfPH3IgQEYr7mSVgonlf4kSCkXR4imDayYuvDqt4grEigsjxYLRT5OQjBFDXo55\+2Pc53p8uDHh1f1WXtEZHEaUHykRXb1jvFq4fWVKtnTKaAXjxooL\+ga3QIIbm9C3bPyIsdsGkH3FBX1f2s8sQgghhL4g/KP9xWTN2fpf3y/\+0Kb969ngwLtkybp12/P\+pf3tYW/kSy0OIYiufjikbMl65GXCGwWAWOnK4GZBxiOViZcAECu5t3Pjgv7r/rhwSkwUTfOGOEMyiqRV78ne1jDR\+yNxyaKunYWx9bYMmh09QfHy4O7lscCw3UFcKIh7q3MeeT89nHpLOKVPxouP2CpOCOLhI4IH9vCCMJwwP1xeSFSf4AaiEyw4AACEA7xKb8/2B7tpa3Z1CAA4tQcEySJxYxUVwZJhx1Ia2gyZ2lRJZItCzyj46weqelDBvtxjEYp61y2Agxd7yxelV7G9JY1pomWs8IPECY2LZveWCdKrTgxUNZERLb2992A9QYc4ALGyio7tc6GJTZ2jCKfu/ewNRwbSJw5ENGYJ4xJZzzPL45W7BTtaOAAgmtu9e2Xc8nyiVq8CoSBanB8nIFGlnOBFLh3gAMSLlnQbCuPBHk4YAHrSq98nabJ348rwwUph7chdc/vKKoIVgezEGSRE7M41rPdl4aZRmv0EzvU4xJX3hLbnE4/sJr3RuGw\+u7pw4A6F151R2ZA2UNVkdGNFl\+hI9qZjw\+p/iAmdQaEoopw6EE8KBTFZflSWHymRxQIfCB94lRe4gmO6drgxpTIcbiWq24d/QmT0la/sLG7JWruH3xQF4PaVVwTLvMLBPyMTIsxnt69iZRkAEBcJYK8tZ5ege\+NUYlcPu3UZ7Hguu6qdM8pWeb2bH47usgr2XqXmjRBCCKFr6t85ABbOW2H/75Ki/te9Pd76ukr7O5WfMuO8PCLy5pQVc\+l3P2v6cuPYKxYO8ba9nLHzka7NS7hr6XRhYc/GwrRdz/EHXaanHXxTePDN5AtC0Ltd3x3cI9xUfxXGAoRD/C3PZ8NDbGk\+QY8dPDe5s7WvDgv5YmUPhcqHhOh9QkFMAp2vFXKCLeSuixzvkexH9vCCEC\+\+N7iZl9qO27f64c6K/GRsSZAxSUZ09xM9/ec32EJuepmsG2\+Ukla9L3tLYbxunBeyERjUkOLCqTHo4QSH7Ov6HEs4Gpct6ZZ50yGaDhEQytiKPI6lPXVGRmnMw29/0G9mrx0e8cZK7\+0qF3ACUQ4AEBnR4rlRWUbf1ocj3p7k5kRGjGghdrf2PZDPqWuPlSzvkrTwKz/gym7vFQayxluro4iVP8JslXGaQiCcEgvWCDeFerbfDrQ3PQhxUUGv7IzggVd5QeDUHclaewQAYiUrg88siNN0rGRZjzIvLqnoKAcAgGBjxoZXU1FrRqxYkFZ7ID0IANy\+svu6lVNB8mDwnVTKTa8SA7V9\+XM9boJo\+YKoJK9vs5K7nk6TFfZKWrLX0ulhiCvvDRoKY1X9ATDZt7oiVCHgb2hID5PRdQ93lecN7gjleD/I3vB\+ehBgfGcwWZnFyzqfUYC3NS3YwwlHOcGetECAW13Dr6pOrz2TPrHol9tXdk\+XYUlUIowTEY7Xy688kJkK4OOyueF1y9kSWZ\+IB8GL3Np6Ysc\+kmYByMj2J4LlUwfl05NWW09a9pEH2znCfHbzPVEIcRKZSPIjxTNj4ZUh4Zn\+w4mLBJx/vcOP3txLtKeH88KGlZFad0Z1tLc8P41\+K\+3Kol8ACId4u17m04E0QsTufDhKB9Ka2vlwX3BnD7GtMpPOiBZHebUhAIjL5odLgFeZuIsUBYik6p/sK18SCZwgDo4WKiOEEELoq\+DfOQAGAOhsr/rDjg0fdgKPlC0oqlh598YNgvCmFyubx3PpyhXNu8Ogbt/w/lc9ACYEkY0rWVFPWhAAIN7Uki5SdNoVnCDEw\+1pRcu6twIQ3LgQuLv2kIP6ZmPKO3uKL5JrvVcY/RJTejc/3D3KwMsHO97nAkQTl7AQqM/csIfflPpQouh8TTZaD3BL4t\+JED1evDy0WZCRDBSX9wIPRhFN31WZsyv1SrYkuHM\+sfYK\+\+UAAIDlVh0bKFXx8uC\+2znJEk6J150AABDms5uXR6EHhAV9MmA3Z4SJDGg6Qnrz48HG9KGB/fU5lnA7f8cH4c2KGNEDAHFRXryuRjCyAw0AgNtXsaqrTBCXTekTrgyVsvwtr/CBF5Mt6dlawAknmk2Uu2MfWcumVb8pqAYAAEIU3q4LA8sJC2PKwkjwQNa2moGbLCJR5GA0HU4AAAciaeH88OoCjtcbWbeq/1sUlxREhMeE2gPj76nj1B0QPFKTVvJwxzoAAAg0ktte5TdBXLmyb/NAsljJvZ3r8uOSfNj790yvrGv37bFwK7HFmk0L2J2P9DSd4DWlyikU9UpC3OrCrmfyyCpuz\+YF8aA3c70to07A7l7TEzjB80YndK7HKV68pFsZyly7L7ZuZefGdgE9RjqCjK5\+OLRawN\+0O7M6BADcHbtzdoxMN4EzOFCZ3iNZ2tHGHUwMGV2nC26UQZ2bsNTzAhArmhtep\+tQ7hOup9OFc7t3rmGhPnPbc3y6PV6s6DHc0/VMRtoDL/ObACDK8b4rfOBNbhAAuDHl/PDq\+7qfeZijfY6sayE37E7sIFZyb2i7gBPsAcnMSAmbbtmXUXUmFd9yY8V8fiA5sIITCMVLSllRiCtSdm/tr8OMqDI/fZs1e5x9s5LC7u33xvZWZh\+c3StsIekQhIG3y82VCLjBwk778r7aV4QbjqWHIS4pZMujQ4ZRJPfI6ytZEm46Qxwc9euGEEIIoa\+ACQfAxJyl9idv8757SrRgjiRPQLQ27Hjun5WnWACu7La7N//wVqUkAzoD9H7nppc\+E5at2X33ufWb/kkzILrt4X2/mef9045H9reFebmrn3ysorlKu\+OzgQ4Has7Wrdri\+uPeOQtL5wqg/UzVc1Vb3m8LAxAzbzL88O6yBfkSfo/3048tz72zl5mx\+f9\+v/R01QN/OBkASIw6fmbeqbX/5w26a7RyR1hv7cfbGLL4/95dWkhVNbcBNadizbfX3ZYv4kcCDaer7A7LhwzM\+ab9ycWBj9tlt82KefzTl8wRAtj/VlRp2rHplKD8hytW3zanaAoEGj7b9dfXd9WOtyc5WXXUnNVrVpQXz5Dxo97Tp6v3OC3vt4WBLF7x7Y0r5xVLBNB\+pvqV/VucpwMTjLfDId6WykFBFbevoiJY5hWuf3\+sa/RY6aqOrfncgy3cg\+19FSv7qywuK4wE9\+WsPzauXpRwO3\+TlZ/Y4\+qKTmV99gY62Z\+2bk2wPJSx/mViZI/lpXuACbJPOTtGQFySHxNyoyWF8TCAUBAnkh/1FU\+Nw8WB\+JkQRDZXdCkFMLLXNNxCbnpl8HX/JSV72GJCQbypOkf7PmesIdDBFnJDJQDEi\+/tEwG55U1eMNGXnh8Xcns253EA4pI8OLgnq/Ji7Loci6igtzQvrak9LdwTkwGPbolDPrv5kWhRXpyAOCGISaDvtcK0uprsDUfikry\+4Amybmqkrj6tdEmfkAcQSas7krFp1P5Dbky5pHvjsj7vAeEGbvfWQv6WGk7Z8q7XlD1738qyHOEGAIJREAogGAKCjEEPlCxnwZ29/s3BZzxesjK4bnynpZ8wP1pSyCkWAFwcKEyxLFoyJQat/XWY5m1IFy1jw7TQ0hLd\+KM\+\+mUhXdi5cWVP7ZQekTd7w4mB8Kn09gjRkBWY0lWU37MxL15lE4aXdT6j6/MKIkBnbzmRFgYIj/tc72oZV48fIQoblPGDrxLV9RxvT0TUzhHOjxXfE9y3LDkkPvhBsnhlD3aWQ8ZaK59YEnptNn/szv8JnkHgAMRlSzpfKxxZ4LhwSjzwllB7gDuO2DhepOheJ\+PsfTEREwIAwBGiqqHLkN8n4aYR\+VFRiL/p1YxE8Nl0ILu2sbdUMNq9tmgafSwjwIu8tjKsnELUBTgAIBT1GlZ2lwCx6TluycPd4beyavPZdY8wq89kbNtDVrdzIAqQERMCJwgg5EIwj12dz7U8J6gaFHkSU8I7KybwY\+o9kr1BEHxG11F2kb9tNz8AAMCpfT\+zTh/cPpvYZBVUJc8yB8a4LRUGuOL\+Z4QQQgh9Oa6oBzhLVLrg1Prt1oPtVPmGxzb/8Bb6qUPBwhXP/GxhcP8/tb9tIRbcsfGH5dvbn3v81NngylnFU7g0w5UtEEF7VHRzvujdtsCUfGVetM4ZGDLcLgIAgqLb5tTuePHuU1D84Le3rrm/7vSLla1U2Q81FVOOb/g/L3qz5q370Yqt69q9T328tyZQrl5YnPdZdWsUqBmlC7KbPqyrGzX6HYlHla4p3zjv3Lbf2qtbp5St0RjW3e9tsu\+FKPCoYsmZbU/toFtZ0Urd7ttOr/3PN\+gubtEq7ebbYMf/s65tzS79oWbjz\+8PbLJXMeOvNbJo5YrVc9q3PW0/2JRRfNeKzT9Ue0/bq6fcvfWHc5vs9vs\+ZGXqFVt/WL6xdceGDzvHn\+8gqfm93JhsajyYH3wt2XsJTZ9mbXhz8NQ\+Tjia5j2RuWlYFxy3r6KiTxmd4DUcN1a2KmiYwttwIhVvR9Mr92QUVXTtXhPbUJlxcGj3i2RJ6CMFBEKDY\+yBHmBC0Fe0qKciP33XW5nbMiLrHmLDx8haEoAF4MVK7\+wpZgnLoMA\+HOJtslKJf3\+hHmA20cMWK3soVJEq1aAeYIBI2sHE1GVurFTZU5IHANw66N24qjfcyqsVsLKWzE01aaJoep2g55kpabWtHGLK9TmWwBmiMiOy\+17Y9nxWdSSydU03cUSwITnKPV58Z2jz1ER3NAB3tNx5saJU/yEAQDuvsobv5UbLS7sr5vfBmYxtz2UdbOfIlEAAJ3CG2PQ8f8fc8MaVwdcWZa7dTXp70ppCMSHEw2wa5IXLBDw62rXv8XS6hSPMj8jOZD\+w56oNPBEVskogLTQ3CEBM6d36cHexIE5EQaIMvaOMB48IHzjCg1ayQt9dHiLW7h40DGF\+90ZFX6AFwsAJtmSsr\+QGovHiKdzy74RLIulVqUHd4z/X4yout6/iwe6SqdC0MvgOQDjEs7zMhWha7VuDhkAnUkbTqiqpKgBRYdfu5X11e7hFKzu2y0aswxRJO/gGOcq3dbQzOCh\+HqsHOFZe0VEx/M2xjiVePD9KNGfsqh/8G8KpO5K9FgAARIH0oKB39fJebzW/jgUATlMDkRzgMOr55wIAJxwFWWGPYTlbLEg/WC144Fh6kIyUAEBP\+t4D2Xs/6Ctb3rX58XDJ34Vb6jmB9jSRIA7ACUbjJXdGA59yy/XtZV5\+E/QpZbDLKqwa57EMKr\+3kRuAPiLat24NY0i9G2jleQsiJfmx6pYr6/ZHCCGE0FfIFV2J9vbUvvMh3RoFYOrq2\+FukSSLhGXzJK0fP/LK8dougOZ3LHPnPrPsxryjDbVdRcVzsommjOI5UFtzSlQ4S8KvC8\+cI4PArtMjw7xI4NP3dnx4tikCgT0fl9\+W7K3du\+MvtfxObysL8PEO58KSB\+fKphyurj1et7KkfEH2wXcZQlKkzApU0\+cudXWSNaPswTuKIme31DOQt7B8AVn7yjuVtW1haNv11w9L/\+8dZYXU/tMAEPXWHNp7qi0M5KD1RaN1\+6se\+DDa1NwZBqh65Xj5k0XFeeREAmCukBIIIRBs7QwwTPWrtupXAQCg9Z21//lhuLUtEAHvnn\+V3KYtLpwi/LDzyi6zhFPjgRrBWnrwJWm8SBkaeekchnjR8uC\+JSOHIgN9ZPw7jIvyI6vv6SoT8Le9n6acH62luQEAEEQ2rgyHD2RXLep85kex9c9npWJgTqCROHimp2TKsL6aeNH8cFGIEwYIB/i73oKiNd1FkFEn6hG1ZKzfR8Cy3rJFPRu56eF2bh3ESuZH62heAGKl93YaBi3oNXLeLEQ4dXT2BvqKFsWJcGrfz9zRmF7XkB6AeNGSrq3Le5SNWQdZTpDXVyxL7TfCqWvlCSF9VzUPFnRWQOYWL2/HHm5tFOD6HUuTN2NXe2j1kkgYepQhYr03Dbh9ygKou\+zCZhGASJrXnbFp\+I44TY3kpgPccGH31kfYzbw4IYhJuKkSRjh1tFDrTm\+KAjHoRyVQn/XAEShZGSxuydx0IK3oztDmqXBlgi3cg/VpoAAlAACIZD3b13CCF9O9PdHV9/UEX8mg2/kbrHwgI1v1wbIon4ZYkzde/lDH6gV9TW6yUtC7\+UdBJU1WneA1CcLbV/aGLyZvwRAZ8WJFd/mysJKbvvfdTC/0ld7T8dF9abWfZm56lT/ecz0OREYMGjO1lXzRvaHyM4mgN1YKIMyPlBb2hQFkeXGidSC9UMRufygMxwRbjqUTZ7Jr96V5WQ5ArOyhYEVAsPZAGjElJozEy4ftZswzeHXFJQIIBtKbxhiVEKjP3LAHNt8T2rcMAq3c2nqi6gOiOjD6nQJiSq9hWQRasmpDnGBGenW1cEsgtvqhztdK4wBxSV4sXMGURDkAEL7I22LNptvTwjAwHTrck77j\+ZzwlPBOWbzqzay90Lv9kXEO/BgsplR2b72vN/iB4JE3h68EJpnf9cyqDnth5pZXSJqF4MV0uL3rtV8BAAA3Jpsa36yPGBIzsXu4O3omvnOEEEIIfVmurCuGDTBs8tIqEg3zuAQvW5iXLZxb8trfBi2Ue36GJHKcboJ1hSJhvaA4q5P\+\+HTxgluK8sjwzTOETF1te3b5k\+u335IBAND0L62pDiAaaA0FIwAA4a5QsJcrkWQAcIWSeeu0d5QWThHyAQCgs44ACDed2nu6xLBsrqSmTnTbHGHr8b3NIy56sqeU/\+Y3AxeInQ27/uCoao4SC0QiHlvbFEqOL\+0KNHVxZZIM4jQAsIHW0MgLRyJLVPq9uyuKCyTZiTfa6/gTqrTOWue/DhaueOb3BbW1p6rpU/Snp\+uYKPCzi9X3r1s2p2hKcgxz3YcTynaYmDI5nLJfnCDjxJkRCSOcugOCR0bpAe4sHn\+XoyC67l5WdCJbe4QXzOvZ/RBbfCK7OgSSgnCJCHY18na5cw4WwKDVj\+LCqZFiWUzYE123hhkxCJYt\+zRrw5tcmYItFvRJKjrKeHEIxjavgl0hCLNpooJogM6gp7Dr5vdVHuEFomnVbwqr3wQAIMjIRl2n0pu9icuWJkILbqw4P\+4984V6bAhRZLWyU9ZKVLPR0nzO3leyaRYAOPQB4X0HhqXlA8SLAQgSAmf43tTxFl\+PY0kNpY4TBcHdGZym9tgz\+mjlPr6stKe8JrvykhuuXhkXyvokU7t2KyDQmthjXJjBOVidWXUsHSBeTMagIWvoytXxkpXBdRmcADtWR2hcMr976xSOML9POLIpXpFgC7dJEA0eydjB69m9HMLJRhtX3t5dlgdhL8/yVnzjw91FjcS2V6BElla5O7NSFi5f1FvSyt3RQGx6nluk7KoAAIhDRkQpi9dVCzfVpykfDJY1CrRPZ8oKokUZ6U1RTnC85/rywiEu3c5u1/eIpsSEhcF9yrTa97MOcoHIiK6\+N0YfIGvprG3JOgdhPru9oluZAbUX08LACbYPX54q\+ebQPvzLnMFk/HnJIdAt4z2cy60BlkbT2ffRWSJRtPT2ntXKrp3Luprc2WtfJuoAgBuX3dVx/K5BuTUT214h6qIALfy9ACDoE2Vwdj2XUzliSDPBpo2x6zgIIuX3dimhr1gAteM9juS2xctDO5fHq/cIK7nd\+7Z0hkOp/nOICwXxuj05j/yRX67sI3gALKf2fcF97yc/Fub37H6ob9fz451pjBBCCKHr64oC4NEnVUWDn7yufepQ3ZBPuUWfthPL5hbNyZZEztWePgcMqZw3A\+YIAvVnm7o7m3Y89wDFBQDoaq/rFpUBjHzWIj\+vaPPPVihbD23adPTgaUZ01/ft30sUgzlYc3bdDxcq54RkCwTedz/zjhz/3NlD739jV30PQDTY3l53ui0RXRPAHfOhjpHRBgDzcsvXaQ0zT1v\+sGPvp\+eCM5fufvK2sStodMFTh9b\+9LBozo2lyxaWr/n\+xt7j6//P/sCd5VvVGdV/fXFDzWkvzNq89fvFE813iDQ6OZyyX6IHeOQRxYtuH70H\+OBYy/KMFOJteT4197iVX80GK\+b3HTzCUSoi0JBVHeAApNMNqcTcvtJ7ujYviR\+0UZbWyPY1PeG3hOuPcEorOgw92dpXuaJkTzWHPiC880C8SBnaWkCu/Ts/APHi5b3hVl51Rp8ylO7lQqAlffCjdwhBxFARKudmrN1H1E2Nl65kS7x82X2d6/L4G6xZX\+TRO\+EWcv2b/HUVoXVyTpUtx9KQFgYgpkQqlL2yDBAKohJuuredE46m0R\+QewNAkHFJflTE5aYu0K/PsfQPpZYtCm0vJNb/PTn0V7ivb\+eq7rIz8TFnMIZ4u94kiyv6ZB9keJf0AJ25ozVWpowGjhF0atfhKEiGh09xQhBvqk694g18iwkSIAQAnKYTX7AHOF60PPTaksQq0IlipHtDEeXUuETQBxeTS1sJC9iNSqimeUVTINzC33UkWpHfp1wSLcnnEBANAARPZFQ2pAGAtyVNksyZAz3pYUG4tLSztDQunBITzk2Me\+d4P8h2TYmsHu\+5Hg9O3ZFs7ZF4yapQeSCjsjG99gynuAACXqI6v0cW4tKh6OaHQ8V7BLtC0Y0P9QiPZO0q7J7QD8I4zmAcIK3ug6xH3hw50TdWcm9X2UDgd0lRTiAEQlFERvIDl\+pt5QQCvMo9vMo9MeXy0M572LJ8fl0rQBSaPs3aRqeFAUTzezYqoPLVrMrB/cMRDmREDfr21dFBb3Jjoig/dQcnnhprECe4IORCADgQ4l1pDzCntkZ4dw0nEAXJorQmN7n2VX7qjkOs7KFQaYQTbOftepMHiYi3Ilo5dL5xSrxIGdo5n//IbvLKl\+JDCCGE0LV0lSbjRToDrSxRPEOSBXUMAIAwL1fUy3iZaFP92YB6RqkyG5reaepqJ5qi5bcUleRF65yBIESh9Vxt/5C/LBEAVyQRiXingxEgsgQifjTY1EPkFcmymOpXDu49xQJkKwtFIjgHAADRwKdHa3s1ZepbhFmBqk8Do123sU31p6pHTKkNtwcCQMokJFHbGQYQUiJJVjTQ1DPmlV/WlOKZUPf\+wV0fng0DVyaZK\+PD\+Ht\+EpJ1cvpk5emTVTVLdz95R\+kNOXThlPCn7\+xwfuaNADFnVlHel7QuNwFj9gArr6wI0fS9H/AqSrvLQ9wyEXdHJa9p0IeEILL5kU5lD3\+bNbM61Le6okfkzVrvTify2Yr8tKpKbgAgMeA8W9S78faIkBsX5vXJBOzGVZFwFEAQhx5OXX1axbJuAxmvfTVx7R6X5EdLlvSsWxIlIhBsSG9iIdjC39USeuYJNlifueE58os\+eJYXk\+X3EY2ZW1rDhoc7iD3CTUfSg\+28XW\+llchiwsLoOkG6tz394AeJWY4xydSYMK\+3ZArhTS3ks\+76HEus9N7uMgHA1KhMEN/4UC9EuZX7SPpMxlprTLaks3hoFEoAEBCX5PcR/T8IbPrBE5zNSlY0hS2fytt0gj/4QTtNycc49YuXrAyuTv1bNr9rYyFvx5F0YWH3umjmI3u4X7QHmAsjV4EG4NTWp5cv6VlN9jUlFm3i9lXcx4I7u7KF3ToFANIOHsg\+CPGiO0PFLLllD0\+oDG2f31d5YnhHeriHa3mV3DYlUjKFI7y9q6wx03ImrSl5YyJ9nOd6fGLlDwcrQplVvFiRsnPr3My1lXyAxCpQ6WWlnbun9IXp7G0tnDDwtvyRAohVFI4r3wmdQWFGPNw6apSbdvBNwcHxHkta7QlueFXv6gVk7cBqW/HiO0NbF/C2vEgIl3WXscSWA/1jidO8jdxgtFfITa7bHG7lHqznBgHAmy7M61i3kj343JDnh4dDPMvLgpE9wMkXZN/qld1AZxyM9FXcy1bvFlZ9oR5ggCgnWVSWE5zSu3FVZFAPMCfAAjFogatwhBMePb7l4DpYCCGE0Ffc1Qq32LqaU967bjX88GzAftzLm7d5w7dltfZH/no62NpQ13tL6YJo3UuBYIRtqm8XLisS9TZsOT3qHXqecMEdhrsClk9B\+b2SYji3pZ4J8UNhyJZJRMJPA5Jld1dIIMzLFmYBAIRbz1bVsjvVi8IfOw42TeB\+e7i1Ye\+p6OYydUWTs5oRVXzvjqKusxvqmd4ho5qj0BkFXrYojxJ1xoMRrmSmSMI7F5xzy7q7ssPAFWaRY3Yjj3JkuaU/enRj1vH129\+hGa5s3lwJr6e2jQ12RYWSWbIpHzfBnNUPzhN2AUFlTyDb4cY5BDpOcGPFo84BnhKvncAc4CGaTmRYFMHtFZHqV3OqhkYF4RBv23NUmOUIC9jtFT2yM1nr9/C93Oi6e3uE3uyqFg6kZvR1Bvjb9vATHSmSAnLbq4le01DxFE7Tp2Tt8mDZxewtLRxIPPzpkVBJD7HDllM7u2uzCIAbl\+TFAjWZews6JWd4tVfwKE5uXJgRI3hxggtCQay4sMtwjKw6wq9uIWhv1zMrQxsvCjc1pMkU3ZvvTKtsAIBY0aKeclH2I6/yA4JIiYC3wx0rWdBXdYAbBAhet2NJq34zuxpAtigkKSS2/X1g8afg8FHKnKZWrrAHZNy4UJBGv0/W9UCiy9HrJr3KUFkoY711yDJmRMbIAbRxQhAPHoinIgROsJ178ARXIgiX5aX28oV6gOPCDAhHhsVsnMAJsnZZsJxLrG9ICwNI5veUc/lbDnADg4NGsq9sQV\+TOz0QBeFoWRMQJwCA7Fu9qrM8lFEJQAii6x7uEX0qWPsmLwAwznM9Pmn0Ee66h7rLQnEhN33XW/xaFkoBAKDJS\+5VBssbs9ceSN5ZCEc54/t5nuAZJGPFAo63ZXzdvJfkdWftWNKx8WFm33yy6gSvqQdEMnbdskigJsPbyRGFYiX3hZ6ZkrnrCK\+2HWRzeyuWs5Iegg6kAfQNySiaXrkno1Tfs3k5V5taLZzgxYVTIiN7gCXAG1jaKppW5\+VX90RKbk/8\+H\+RHuABTfUZVfM7S89kJZbRFs3t2b4svbJxYNG\+y1cd9v0ihBBCX2FXrb8x8On\+9dujm3\+4wv4XDbS30DVvbHjpdBAAugJ0K1RIeujTnWGAQPPZpqxFRU2n69pHvUbo8X7YQKzUvfMTXrj9TNVzr1c1R8O8uh3v3/LMmnXH10Cw/uD6Ha9715Vv/r/fD//ni5XNnbV0Q9Nd2U10w8Qe1Rtpq/p/dmLNt9f95heb\+T1N9XWbtr\+xtzlKzBmcKOr9tK7uQfUzloKq3\+7a8Upd6c/L36kqh/ZTW7b/8\+Bd39m67rHtnNfHe\+0badv7vEP2o7u3P/v/SbJ5AO0Hd1ftOnUhDP\+ib7l/518WQ2/73ufsGz4peWaN1h6xPbDj9BVNXh3nEOi06lep\+06wm5dHq1/JTow8JETsbn13\+ERm5fge6DJCXFbYW54fAx4ULepV1pPJNZOTYsW3dxmWRGRcbuUe4YYT6UR\+ePtDXcpQ5vp9w9eb6Tf0RkBctqBXSaYF83sMCu6mI\+nBEH/T76eGWU4Y4sX5QAgiqx/uKQZi2x5y28uZ23XB3fmZW/YQdGichxOXFbIb72UlAZ63sHOniDjYkLn\+VaI6FXnWHcu\+rz4GbBoxpXfdnX21b2XW5XWGgb\+tmrvxwXBJHjewhBXVZ1W5Y0UVXYZGwZahy019uccyAjcmyeA0jdw8ml75dwExJbxzWdrBPcJdAQBuIjiJS/Lg4AGiqDSiFBH0wJLdnNoDOQuHz4m9NE5tTdY2SAsDx3ssaws3baINmxD0KadAoH14nxsxpU9EQhj6ivNj1fVpTceyHqiHIMuRDCSJK2/vKiP5m9zpg9dMGizYzvVCX8XD3asF/E1/5xMrw\+F2/pZX4JmK0DMh4eMnYldwri\+hqT5zw9\+jSmWXiOUoV4W2vpl9EAC4sZIlUcKd0bS8e2sge9ORiUxcn\+AZlMhYJfC3tFzho7\+H7XqHLSd4X6fhdnbjAhYinDovYdmRXdWQFgYI0NkbeN2rF/VsXdIl4kHwYnptfdYjB4iDIQByeE7BFnJLde/u0i5DvTBRmeEQf/3TE7tZEg7xtr3KDYQAgLvr1axgCGDkI8rHJY12p6\+7j1XWZx3siZXcHha2ZnmHBtTE1N7N\+vbkqldDFsGKE2SMaJnY\+hAIIYQQ\+jJNOAAOnz70gO5Q6lW0bu9z39ib/Lf3w/2PfLh/\+AYRZu/TT\+8dtLn2u4eGpxmcf\+vHG7b/c8j1X4Sp3vHHwh0Dbxz8z//fllT5JXlThO2nqkZ7JG/w1P77KkaUp39HzOld2/\+461JHB8FT72kr3ku9evnOd18eSPrpH/f\+AQAA3vnkEoczJPPWz7Y9/dm2Ye\+eOvSIbnCFvHjnmEW\+PGIcPcBCQV/x3EiJgi0vjHmPZNWlgqJwgFxrTVt3X/czv\+qpo7O2JB9eMg7cWHFhePXynrJ8zsF9wjuPQdmqzp2/7qk7kVH5Ab\+6IXE1z2lq4VdVk3R9ulAW3vyjcJk81vRB9iN7\+N4oADemLIgWFYx4ystA3BiXKDp3FnJ37M6pgvAzj3TsFgnWvsnrX3WJEMQk8j7ZPwVr3\+cGACBErH\+Os3FV185f9VS/krNpPI815saKF0WC7wu1R9KD3Jhyfnj18u6N9w2fVh5uzlz/NhD1Wdvq0yQFQAAEA8T653il94U25/M32LgBFiw1vTsf7KqozB52K\+FLOxZRQXidIioU9MnyozKIb36oNxDi0sf4TSEOQFyUF4eeUQPpeOIhsUKyr\+TeLuJIxjY6cz3LPvNwh70\+c8u76crvdJXnjR5G9gs2kjuaEl3EQJDx8DESAILt3MR41GAovY4bJ8iYZEp84HG\+l8btK7uvS9nDX3\+GIxT0SRKxEy8uzO/ZXhELvi98oLV360OM/UT2hj18LwsAcZEgDlEAQbRieddGBVTZMuhoTCKIS6bGYXj3Haf2QFbwzk5De9Yje9KF\+ZEyQSwchUBDxvq/c8pITm5e35Wd6zHEi5Xdm5f1ysi02hP8Kppf3Qplyr6SJSHhkexN\+/hVAdhe0bFvUcamvyf7bId9I4RTosX5fcVT4zD6UlWXPIP7iEB\+z/b7\+uhXMukr7x8dik2vfDWn8tXRPoqmVR/Irh71XgnL2/Dfw4JbTu37OQvfBwCQLercvjwq5I22Yb9IWrWTAEGiixhEZHodAETT6pLVklbXEhdy46IpUSF3/AOS47JFXaldxyV5sZ2P9zZF45K8ePhip30BBxKjsiuzqlsyHticMVYmRcrQM/PHu0uEEEIIffm\+pBmn1wYpu61k8/dmNe2xHWzFMWcAXAAup/aA4JH3L9EDHCu6s3PrAqj9lFy/hzg4dGBtMMDftptfOZfdWMqW5PHqzlzump7bt3pNx2ZZHHrSD7ozH6lMZrhj95S9BeF1y3s2r\+veDtD0kfCBv/O89YQXACCmnNInChFbniH2nknFchnRiodDZQJu5W5uqjeYE2ghqkLJ4DnQSOzYk36wnlcXAoCMRyz8Ikgb/FjjOjpr7ZF0OjBomGI7f8vz/G1kTBgdR/QLANH0qr\+nHhwaTaOPZdDHxrrGhepPY2UPdWzM4\+7akx7m9q1\+JLgug7\+lkkzEFd5jWRsyutYtih5sSUyE/tKPBeIQSa\+uIWuHrrAFZGT7E8HyDO6O54Z1w8YJbiqy5XICLfwd72fuSnQS1mdo/8gtv7NP1Jd4TvLld110Z2\+TO3vtq1yRsnNz3vCPiYLu19axsou8LW\+N81g4AS\+5qZo82BNbvSa4UcTd9lZ6XShry8WoKMSvakgLA097hlBOSWuKpg5QkFb1Mhfy2LK8dIsts7IhDQS9mw2hUh53h407UNVRTjDCAeDUvi94JDm/tLP4IrnBmx4GaKondwAAZKyvn9C5vtyxtKfXHcne9EH/3aW490TGlhqisiEtDAAt5Nrf85SDF07nDomBiSnhrTpW1EpsOjGs9sZxBsk\+mSLSdCDbMu7\+6uvCeyz7gWPjSCeIbO/h7nhZsCsU3aobEdBz42WPMFvlUFeTXTfeyfOc8e76kpnU0cK7x7\+OIEIIIYS\+dJzZK399vcuQkjVn6399v/hDm/avZ8cxAjC79Gfrd94taKpxrN1xuG7k\+s/XE1mybt32vH9pf3vYO6GB2V9Doil9wmiad8yhuXGJqE8UTb\+S6bhfHwQZI9gJj\+xFX0d4rhFCCCGEvta\+SgEwQgghhBBCCCF0zXylx8IhhBBCCCGEEEJXCwbACCGEEEIIIYQmBQyAEUIIIYQQQghNChgAI4QQQgghhBCaFDAARgghhBBCCCE0KWAAjBBCCCGEEEJoUsAAGCGEEEIIIYTQpIABMEIIIYQQQgihSQEDYIQQQgghhBBCkwLnYrDrepcBIYQQQgghhBC65rAHGCGEEEIIIYTQpIABMEIIIYQQQgihSQEDYIQQQgghhBBCkwIGwAghhBBCCCGEJgUMgBFCCCGEEEIITQoYACOEEEIIIYQQmhQwAEYIIYQQQgghNClgAIwQQgghhBBCaFLAABghhBBCCCGE0KSAATBCCCGEEEIIoUkBA2CEEEIIIYQQQpMCBsAIIYQQQgghhCYFDIARQgghhBBCCE0KGAAjhBBCCCGEEJoUMABGCCGEEEIIITQpYACMEEIIIYQQQmhSwAAYIYQQQgghhNCkgAEwQgghhBBCCKFJAQNghBBCCCGEEEKTAgbACCGEEEIIIYQmBQyAEUIIIYQQQghNChgAI4QQQgghhBCaFDAARgghhBBCCCE0KWAAjBBCCCGEEEJoUsAAGCGEEEIIIYTQpIABMEIIIYQQQgihSQEDYIQQQgghhBBCkwIGwAghhBBCCCGEJgUMgBFCCCGEEEIITQoYACOEEEIIIYQQmhQwAEYIIYQQQgghNClgAIwQQgghhBBCaFL4WgTA0ZZGf1vvNci4t/P0543HGzvD1yDviYuGr8UxIoQQQgghhBACAADuxDeJthz58ECksPz2XAIAupj6Mx0hiA7LVpA7s1A0JPNwy4mq987zF9363Zuyk\+8wjQeOs/k3yRaKLlWMtiP7fmo5DsqyZ9cuyudfqmThQNMnbZcIZolpBZI5WYPSt9Vv3/rmkRnL7aY75vABejtPn7lwIdJ/LFzgZRXekCsYNTPGu3nTS3uh6I9bV91BXapUKdGW9156eGdj7gqd/QcSYsSn9c6XnniH0D\+\+cuVssn8Xe2g2f6FsST45PDlCCCGEEEIIoQmacAAcbjn23zsPuLrfO9D4kFkrI84cMm792Dci2bwVur8ODfNCjSdeeP3UNJi38qbsxPu9jcf\+sPO44H7dX7UjA8IBghvmL5edeIHe\+1PgPrt2/tgxcLTe\+dpj\+zvGzolYYVhnXpI98JrHBQDgJSsh3FG/feubhyKDtsic97v/emg5NVpmPK6ABxOpQC6fl04A8HmjftrZ0sicO9fx5NaXQv/5vYobSIBofc17W19ulq74wXM/mD16EI4QQgghhBBCaNwmHAAT\+Ys3/fRCyHL4aM2Hh745ezkAAPBnzCtfSCWC2PC5\+qrjA1FoOOCvbwv3QjTU2BUG6G1rPnIsTPC5/Mwsoq0zBOlzREO7N3s7T5/rJHJy86lk2QhK9rMnHgpvfelvdLVVOXPLEiqVkm1pY0K83KFdzcTSh1c\+esPQ4\+qNttRUP0mzqdfRtmNH9xzvuNB9/nQEes/V/e3lDgFANhUNA0xbWPbX/1yU39v2j63W357rz6LzX3/8y\+N014j6OP7448eHvJFT9Metq\+6A\+s2b/rF3tGD8wus25evD3st9YOUNFG/m4pyOox1tB5zvXsidvvR26sB7zb28mSu/OROjX4QQQgghhBD64q5gCDTkLip9dmtRPU\+8UMQNdQAA9J479bdzo6aNthx987EXm/snt3bSbz1OAwDwC27dMPtCJ2RLc7OHdP92eP9g2uuKDM8IAAC69lr\+uHfoWzffv\+YvWvGgHMKHXv7HodELPpCq5fjhZ/r7irubq/Y3A8A02dxpo28IAGS\+cumjOYMi2ghzpObUJzBtxTJZ/uBOXdHs/EwAmLa87NbcQOKtaMvJY/vP9A3ObsZNRcsLUgeexos3nT7S1gc502/Ogd6W5iMdbDbU7T8HAM3bN5m3DytLzvjHXSOEEEIIIYQQSppgANzVVLnzrf2BxCxZrvTue3\+WDwAwbeHyTSvEAj4AQOjzQ5tfbuzPP3/xPb\+bESb4yfdzlfduWEYREA0D1L98GAD2v/DCJ5ncZOJv3vPUsukrVt06hwEAgEjbv2oaTkVyVMtkczK5ANHQGW/VyQ5\+7tyVixNTc7nSRdnDhk/PW3jLHTOGHVe07fMTe70DR73wB\+trfwAQOPHEptcOzbjntU235fMhHDj6i/9saBmjouYsWfxovr\+\+IzXHuKut5eipTyLZN98kK6SSafiZOYWzEz3hucvVpcsBoMvvfPmtA\+f6AGBGLnEuNUX53Mn6T3Lu\+tnDi5cku6\+XD9lbr79y6wsXIKfs0dKV\+YOOpattz4tv7R397gBCCCGEEEIIoUu5kh5gAAh3t51q6wu3RHvzL5c0cv5vloGJtZ30m4/TAJC14uHClnPAz5mWn8kViKYLmPr93nDb510hdaG6TKwGgN7Of734v5URgBmzyx\+\+7w4KAKKn3/n7gZMdF9oaT/NuM2tluaPsj8i9SbZ05BDoDu9eb3IIdNux6q0vN14AgEhnfTf0et/76abjAh5ApLM\+AvzI\+QN//t/9jUzLGYBcUjDQu8sef/UfI0ZBN25/tnHgVcFSu\+muQj4AsC0nvQc\+OLanpuFUBPi5czc8et/y7uofPnsq//7vbZjt/fOLhw/Rbz1Gv7f4rrt\+tmq\+gH7psVcZQU62gBcNtTEtwIXuPv6M2Uty\+w\+Ey8\+cVliQdTwT4BLTnBFCCCGEEEIIjWGCAXCWpOKJRysAQsf2PPzfA3NfLxw/8Ivjo29B5Bb\+bFPuo5Ghy0T3ssdf37c/krNicc7xdxtg4S2FgeOQOVu/KhXT9rY5X/jHkzUXeiGnvGxpatovN3/hHT9bAdb9DUdff\+mnHQ/8/tGRa2Jdfgg0Qc2cI6o/dLSjlzdtxV2FgnP1VSfPA2/aisW5bee6QrxpN9/EvFDTcQFyylYtvXlg1Why4arv/uXugR7gqhfe2h\+ZveHRpYN7gKV8AOg8sut/H3v3AgAAb1rZ9\+/72V2zc/nQ8kE0DBAGovD20mcX33rk3Xf/8HLd0XcPu24vfPSGW/5j2fnOxAF0tx2qafABwLnjTw6qZL7sHvsTM0c/MoQQQgghhBBCl3OFPcDD8HNyBBFYUnZX\+Q1kmGmsevGQ6903/7zkez\+7KRsgWv/y3548OWQGLPBypBCetvCu/1jYXP9uOh\+4M2bPVi385vJ8LnS1/avm0N\+cxw\+1AfCypLyOqherb77poZUiLgD7yd49T77bwc\+dNqPtwqma19ZEos8NejaSIH/mzTkdn3QA8GY\+uvabS6mBHbYdO1p1MjoviwsAgtnzf7Z22rT/emG7tzOUmcMPdAEQqu8/sOmmZuPRxkPH33uysesCQHYu1\+d8zdhSukU7M3TsqPN4R\+fgQ4gwLd0A0PnJSe\+FQXOAXQDZs4u\+u6r00Y5jsHjxCt7Rnz77v3tfHEhwatAiWNNuuvXp\+29ZflN27\+cDCYjM3PK1txVmMntefHMv71a7qbQwUr950z/2f8GThBBCCCGEEEKT29UJgHs7Oi4A7H/53fCymaHjdUc7YMbiW8pk2QAAfLJw2W2PFgzpAc7OL1ypnAZAEp83h6GvN2v6Su0Pvpv4LHLB5Tx\+qA2m3XTrpkeXSo//Q/ti4/7jnSvvpqCref/xDoCsFd//3s94h40763MXzpw20APMzb9Jls\+r\+wQAMrmhz71D\+4GphTdA55H3dgWKvvtNccu7e7d7\+wD6Dr1\+AAAAwq4Xnnv4pnm5AABdvg6QLiy6ucu71xuWzo4CRFuOHn7m3VFHHl/Yn\+jpHYR/U45aedvPnpABQOjYMT7ADOU9m5blEoM6q8ONR7e\+eIqYIbtjUS4B0QtM89GTzaH\+AxEVrVxICQDg3GHtjw8nsx1twDdCCCGEEEIIoXG6OgHwDOU9\+szj//3ueVdNB0DOiu\+v3HDX7Fw\+AERPO1/64aBVoFMO//m9e\+ybboNItBeg5eT5UFlqJWdK9uijZUuzZEtvyCYAwlB0M6/5OO1tWbaY//mJf7UB5BauvInKzSp97vd3Ab\+//NGWI\+9tfeHQoUSU2tFYtb9x\+D4BAIAvy1mulEy74Zb1Ky50Rph/1Zw6BdPLls3O5XGniaIHPgd\+7rRpbYzgpkXLWxr3eqP5N\+TwgVyyen3t6kQG7HHnnidfPOWD9MXLFueePLw/Mu93plVLeY1//v0eZ9at5rV3LKQG749LAIRHKwkAAC8RFHPzl9z37JKhH3V5AQBy5v3m0cVzIo3WnYc\+ucxJQAghhBBCCCF0KVcnAAZe7tKyUv25v28/GQbo\+NcH9WWLZ\+aKuADcfOW9z\+Z69\+xv7OVdOHC8o5dHTMuZ/ej3F98smp7Pj/rOXQgB9H5efyQwXy1KrQW9aFH/0lpEfmHF4kO/oA9XHp9\+c039OUhfqr4lOS83Gf2yp4/VH6g59Gf6Qi/AtJuWPrUqZ\+8f39zfMe3RTT/48YzGrZte29s9\+6mt31vJO/HEpr2HAHo72i7kFH73B9mCLm/o\+KlTvNkVD5cW8jpPnzy0H4CfOW1OzoXjHxzb090FMH3xDVT/KtOhxhMvvFj9wskugJyytd/b9E3qwntt/9p56r//\+Pf8toajHZAt6\+qF6MhaPZd6\+NMw0uT/hz9kmH/TPfaf5gIAZFILb5IVRqL5mYABMEIIIYQQQgh9EVcnAD5X8/dv1/T1QvrNylukLcf2eg8/bmr7zROrvnsDSVBiKRw6crIh\+ZzgSPhC26lKuvC5tTKit\+3IkbZeAOj2Vh1tW64WE6PkTS1dtXTp0bf\+9uxL/EgYZtz66LKhyXpZH/3eM3QH8KatWHXXf8xo/vMf3zzUQagefeDHN3F9ew/t7wDpsqXL87mQfCovMJ9Ub9jVMGhC78AwYwDIzspV5TcfoutcANMW3qqewQWAUGP9nr3vWenkOlXAm7b0plwCIH/xNx\+VNT7jbTgHWUvvv2/TqsLhi3L1RsNjD4GGSF/vwOOJs5YuKyzkdf6r5pRvoGZxCDRCCCGEEEIIXR1XFAB3\+f91tPkCQOjzuiMUEwIA6OPPKNr0\+H0rZ5PQe\+vSF/7xZE3DC07vHWvn54N//976c0AsXiz2HW0ULL5F2vixi963OZfadMOxKm/ftJsWLgkc3//qu/sXPjTkmbcpRP78R5cdPvRuRy/k/Mf3ly7JGvoxP/tm5dINs7nTMjuP1lQ/9nJHb\+bMRw0P/HhJ9oUPqje/er43d\+GGh2WCQVtQN5c\+u6mrF6LA\+F944cAh3rzfPLp4ThaEA/V/fuHj07ychcvmz6MPn8qc/ePvz8/nQ\+jzfz2x9cDRCACkz1u8aE7jx/sTA617mSN0o\+Cbi28\+c7h\+xvxH1SOiX4DEGO8LY/QAzxi8ODYvd8Wq0pWZjaHjpwaeRYxDoBFCCCGEEELoKploANx5/J13t798/JNu4POg03v4SS8A5Cy9a2n5YkrQ3XzkJABArvKbG3LOEzeQLWcajrn2/8HbN21h6c\+WNRuPAj934a/U3At/rBd0HN26s86XOfepR0uXNEaPP1v3339\+T/qfdy0cGt\+Gmab9L7/53zXJqb1/27kn//H7ym\+iBncCh87VWV9s7AQASJcuXr7p4fn8xhPbt36852RHb\+bs3zxeegc1JE9\+Tm6hKLHcFezPBOBRC2\+SFWYB5Hb\+DT6Grgv/qqk/BQDdjX97\+Wjh2tsW3rD4Z6vOVzGzV949f0lu5z\+2fry/I3zqaPV\+52FXG8xb8b1fPXze\+OLhn27t3PTj0pU3ZAMAdDH1ZzpCEA1HZv7Hiuwhy0cPkp3PHj/mJfix870AwNafbDzC87d0Qy8A8KYtVS\+dxpMtXzI7tzen4mE4nTkzlzdGRgghhBBCCCGELmeCAXAXc\+S9E59EcsoefeBXy7KPv7p36\+uN56Dj0LtvHnp3ZOpjZWvuV7DA52VN66r727udFwByKe402a0/Vnf\+\+dW6T2D6o4aVK/NJyC/ddLz58ZpDP93a\+asff3MpdPi6o\+GA/9DRuv1Hz18AgNx5v/nx0twP3tz8bsP2rX/8Q87MFcqipQtnL7whdxpEpy1cuFKZM23h/OU3EUdefO2J/zyQCDizCxY\+9XipOp8Mff7hf//vcV93Z313clWqpEjy/6lFqqIA0Ok9/IwXpsmKlka8e4\+\+9cgTx8sfvvfHK1ZtSfTu9nYCAESaX3ixGXg5qhV3/WyVbE7WzGd5e554oe5JU51VVlSuvlVNndq89dCp8VYrXzGPC5Hzf9v50t8SrwEIHnWH\+q47kp/nLl\+2EGqOv/By25FzALmkACNhhBBCCCGEEJqgCQbAWZKKx39wB4gLRVwAuEP7g9fUTUeON9e3dHRGRiSmZq74xo2Fqjnf7uo88uILj9d0QebsspvI\+pp3//Bq3anMuYlJwgAAkH3Ho997OvLS1pOd4Z6uQ3v\+/uTx/oWTs5auKN2wav6cLICbHn3t9qN/\+N93955p3ru/ee9\+AICb7//Bs9pFv3p8EQAARHtnkMBj590gW3HXrd\+9XZIY\+SwomF0YeWvvOYCc2Y\+ukA16clI0HAHgJcchhyPJSHjGwnt\+/9PbCqFt6ct7t7/b1tI9aBXnSJevAwCIxXfdt\+nh\+XOS/dVk4d2r/pp/9M\+vHqo6We/6fL667JYtm2QhGPLwp7HFPn/d4ebNfmrr91bmNG7d9JJzlJrPnhY48cK7HQBw88L\+/SKEEEIIIYQQGi/OxWDX5VN9YaFAU30bTCsQz8niAkRPH/OGZssWUsPCb7aN4eZScPq9PVudF3p5pPSmWyrUhYXDk0XbGhuPHPce/bytpZtc8ejKUWcOj9jEfyEzVyoih66zxZ7\+/PwFyCm8gRIAQG9n/ZkLIcgqLMgVpILkEMMARQ2aQhxtOXbsSFZhcqjzKEfqD2WK8ycWoLKnPzh6oC17yV2LFvKYf737cX3mvO9\+UyIYmigcaPqkrY\+fM60wP3u01cIQQgghhBBCCF3KlxQAI4QQQgghhBBC11fa9S4AQgghhBBCCCH0ZcAAGCGEEEIIIYTQpIABMEIIIYQQQgihSQEDYIQQQgghhBBCkwIGwAghhBBCCCGEJgUMgBFCCCGEEEIITQoYACOEEEIIIYQQmhQwAEYIIYQQQgghNClgAIwQQgghhBBCaFLAABghhBBCCCGE0KSAATBCCCGEEEIIoUkBA2CEEEIIIYQQQpMCBsAIIYQQQgghhCYFDIARQgghhBBCCE0KGAAjhBBCCCGEEJoUMABGCCGEEEIIITQpYACMEEIIIYQQQmhSwAAYIYQQQgghhNCkgAEwQgghhBBCCKFJgTvRDRpOnbwW5UAIIYQQQgghhCZk7rybJpR\+wgEwACxevPgKtkIIIYQQQgghhK6Wo0ePTnQTHAKNEEIIIYQQQmhSwAAYIYQQQgghhNCkgAEwQgghhBBCCKFJAQNghBBCCCGEEEKTAgbACCGEEEIIIYQmBQyAEUIIIYQQQghNChgAI4QQQgghhBCaFDAARgghhBBCCCE0KWAAjBBCCCGEEEJoUsAAGCGEEEIIIYTQpIABMEIIIYQQQgihSYF7vQuAEEL/tqTf\+c31LsIofP/87fUuAkIIIYTQ9YE9wAghhBBCCCGEJgXsAQYA2Lhx4/UuwvW3bdu2612ESQ0bIWAjRAghhBBC1xgGwLBx40a87IZrUw9fWlD3dT\+D2AgTsBEihBBCCKFrCgNgdK18mUEdBpBoVNgIEUIIIYTQYF\+NOcCsz2mz034AAPC77HaXn53A1n6X3U4z16RgaAysx27QW90TOU1fdV\+sEaIv379hI0zgZUsokrjepUAIIYQQ\+rd0LXuAGZdeqXGAVEqRQ95nGZ8PtA7aoqJS7/icNrtcqVGKSdZP22wg16jEfpfN5vQwAACUVKXVqaVkIq1dp7GIzQ6LWpzcmLbZKYVGSZGsx6bXWz3JK2JKabJZ1GKGNmv0tNZm1yuGlgONwxhnAVi/x\+NnWYCveJ1e60aoAjftFysV4mS1eGx6A62xWjXSIXvzWLVau9LqMCopQBP1dW\+EEyS6ZcXOBzs3PbW/tmvI\+8TMhVvX3Fj70huVp1gAAF52ifoOUf3BqlP/fvcAEEIIIYSulWs7BJqklEarwzAs8GTdZrXen3rhsxv0Zhd9zEdplDaKZBmfxwc6tc\+gp\+wusdlhUDB2rdah0KqlZCK5yae2WpPRLwAACUAm9kDKdTaXDgAAGKdebfWzLAClNFh0aq3BqnQOLwm6HNZHW21ujdmo8NuMVodCLfU4HS4fw/ppj4\+1mIxSEoCSa3Q6pfjyuV0X17YRMi67UedS2RxmlRiAcdusLlZnHF4XpFxnNjg1BpPSORBxo3H6N2iEl8SV3ba04pYp/V2\+RF6BJC\+y7kdkIJJ6q\+ts1Ssf1zafqqRvNKjnHTx9vCkCwjl3GB68sXb7wataGCZkNXcpjWIFdaU5sGE33UspBWJfm82dqdVmUmy30xGRa3KkZMxn8\+oc6Qp5OgnAMqybmWaz50qvXvFHx3Tabaxcl5s4KNYTsLj4On1Of2th/Z20n1ApeAAxv7PVAVN0amK0vxVhh7mV1c7USvuHTsU8trM2SmzWTKjHPuZztjrJaXoVL5Gt08qQGpFKPDAii/V30n6eUtFfjIiHZkmFIHnvB2J\+dxcjzZJTgwdxRX3uHh/wB201bmzIrD0vtUgVztNGdobdkE2yLE1HpEqBmASAmNtySufgq5Tpg3KO\+1ydlKnQquYNy4yh/Vaf0KDNvPZ/b6O0\+XMzVWDXfwn7mjh/m07bqXVI1dRlErK\+NpMV9KZc6ZDDiPmdZ41uymLMoQDAf9FsiWlHpGEhjYRkI1foc\+UkAMRYNo0cWSNsp0XTxJrnGRUjxv6xEY8vJpVfruUw3bQvXaEgSCZkd4JKQ/ocHaCaqhR/NQYTIoTQeF33Xy1SqrU6XVZdidrkpGmapu0Glcpgc1q1UmpkasZttXrken2iH83vNOv1BqPZ4aFtRp3W4PCN3hNCKrQGpd9mdflH/XjEPmx6lZzicCi5Sm9zM4l3WZ/DoJZTHA5HrNCYUzkxHrtBoxCTHEqq1FkGBs36nUa1nCJJSq7WW5PDakfPgfU4jBqFmORwKLnKYPf0HwHrcxhVYlKscwwqNeO26ZRikkNKlVqjwzP64V5lJClVKFUqhZwiAUixQq0zms1mg0Yh1xhMZrPZZNSp5NS4smI9dr1KSnI4pFihtaaqFvwus0aeqAK10TnGSbyWvkAjpFQmq0nuoz0MAOtxmG0eYGw6lbKfWu/wsQCkXGNQs06r0zeeAo3RrkavqDESM7RFqxCTHEqu0plTiSfWCFm/y6yRkpTaNrjUX/NGOHp1\+WmrTiWlOKRYrjb0f\+u/HFHvh\+9t2fHPTTv\+uemvh\+uy5pYuoIRT8oslQDv3b0q\+/3Etb1bFD1eUz402ReasW7OiYsGs0pW3FPNActeKreu\+k/zvR0uVeVd0T5P1XbSaG43GRqPJb7O3mU2NRoNPp2tKTi1hu\+2GBr2h0WhsNBobjYbPFOJP1PrUS2OjwdBgsIaSaT0Bo/G83XLWaPJbzM0mY6PRcNZobDaa/C5fDMh0sVKoUVNqNaVWkWIKWPq80eDTaz5VqBsMBp/R3s0CANtp1dYplZ8O/0/1mZlO3RZgum26TyjxZ3ZfLHUcYZe5Xk4d5VDH1OaO1A9n1GM/Z7b6DboGg7HRaDxrNAZczlaTpc3pYhyODh8LwPTY9J/pHWGW6bKZWgz6U4N2Wm9whgGibvt5pyfCeFi/v8tubXP7OmzWiz42xvhZHxOf6LeA9YVcnr7kVmyfzxVMjHBIibhMpzWqz/S27uQX131erz3r8ERTCWJ\+2q/TttBM1OfwaVT1Gm29QnrSYL1IeyKpwkRp82c6S4gBALbbojqm0PqMxkajoUGtrLd6YgAAfsasT1TLeacPSBKABIZuM2rrpNJ6o529snkgrL/bYW0xGhuNxrNmW6JhhF0Wn07zqUL1ucHCuCz1SnWDwejTKo8pND6j0adV1hlcUYCIU/\+pUuNLNS2fTtdgMPj0\+kTJfXrDeTcLwITs9lDi/JIkh0xex8R8zoBzoIqAcQf0qk/E5FEOdUyhbrA4w2wy2Vmt6hMpeZSkPlFpfFZXmGU6DMpjWnt40EFEaXOdXBPwsQAQdho8GnPI7/GrFR5d6otg0H\+u0/sM\+uRXw6BvMDvDQ4uRRpKp8SlMyG7vGPTHfFiVRT2eKDP0PYZu0VtAo4rbLW0eFlgm4vZFWQDGHTBo6s2uKEDMY/1MpTnvYQHYXtrV5WcBIOazN6i050f7aU4jSc7oIa6/w2wMuFkAhjGo6rTJI6pXagbnE/O7/GY7ywKw/i6HvcvPRtyOC6krHNau92itnTgeBSH0dfCVWQSL9djNRg9Fsn7ax6rHSMTQNodfYUqNgBSrjVY1sG6zxyy22HTS0X/YAQDEKq2KNdhcPrVWeuli\+Gx6rYU02j0OKeuxGXQ6o9hpVVMem97oEhudp9Vin92oNxjlTpsGHAatidFbaZuC9DmMOr1B7LRrpazbojO4pEanRy322Q0Go0XhMCv8o\+VAua16vZ0y2txaOeM06Q06i9RlVJIMbdYZaalCKR38B9PvNOrMjNbmdihYl9lgMjkUNu0ljvoaICmxGACAHfKWdFzbMm6L3uRRmGm7inTbDAa9Se60qCi/w6i3k3q7Ryv1O016g0HutA85l7/73e/\+4z/\+Qywe6N3z\+/12u91gMFyNQxrkShohkAqdzQ4ArNtiMPk1dnrw6IRBKKVWTWltTo9GL7/0OfOP3q5Gryhm1MRin02vs4HB7tFI/U6TwWRWKMZqxmM0QvBYdXqHWKmUDgkHv\+aNcNS61bBWnc4mNzs9DjHr7v/WDz6N174RkkV33r35h7fKWg9t2pG9Tg0H66cYnlxf8eE72146XstEgTlb\+dez/amFC1bsnnNuy1P2Xf3jn7PmbP713cXUx3RrdPQ9jI5lndaAyx8b8UHU4\+o0G/vk0kyNTqS1zNUm34/57A1umGWzUKO186jb2QkaicGYzbrA7xSazDmU/yLLdGmNYiUV87mGb0App5uVMY\+twULmm7WpXisyW28v0l\+q2J0WXRMtzZBT8f73/M5mo4NndC5Qk0GT/qxJkWlV8xh3m9kttNriZlNEa5xB2n0myLdoOs02kOupZMuVi6x2ntPT6zI3O5VSj4l06hpc2httyi6TJaJVEgAxkg2aLXE1G/PZW\+x\+yqbLkbM\+vbFPRwKMf\+CB/6JB56eZGOPr9cFnShuHBAA27vNESHedjUoTq2ZazTmk2292cnRWsdju04PUquO5bF1iTabH3ulXJKqdq9DPsSl6SOjzQ7bOkOWjO\+w0AEXKqajLflGqnqqguEr9DI\+1y8MIlKl\+Y8YHcr1Iy6QCWzFltFIAwPouGlMhOMumKw1Soy1TDGG3h2UUJAUAwJFr8836wd2KEaehwTHwMuw0nrWzPDEZ99NdLJmV3KPnoknnZxRii0FqUZw1\+kRmHd9nDci1\+WYdlzZGHKqZZjU4DQ2uZD5chS5P7fHTipl6OaPX96g06RZzxGCXalId76yvy24HuUYgHvLD0\+dxXnCohGo5FwBYj1\+r9jOamQ4bJWW7HJYWk9bLOucZpYzRwIChwGXPoqCXtp3R6c5QrtlaDU9nZ3ya6ckmwXQ5HH0Kg1BKgt95zuzJtpgFlK\+LlFJ6XbrdGtOZpzJmr1Waq3A12RWz7UYBlaoWj/OCQ02p5UPOPOvvstuick2OmGkz6Fppf8Tj6aPkfKmcMlslihHzOFhfm9HEaixzNdJeu/VznZFr1wPrY4zqgNvP05gK9CouAMi1\+Rp7g85EOgyp3gx/0GKJaizTkn9mWNZu8FncUUi2tF7w1NkTZSVJvXWuTp4GAEBCKlYfEiGTZNqgl30eOqbUZFGJH18SSAAS0thUUq0p16lptqlu1Muve9cKQghd2lcmACbFcqVaLSVZj58eGJnqsBj9YtbtYaQAAIzH5WblurEH5zEus87k8LMAwPo9frmy/xNKoVaA0eXxa6WXvlgh5VqTRaFRiEkAhVottdjcflbld9p9CqNVp5QCSPUmvVNrd/k0aqnWaJFqVNJEWrnJTPsYLeW22f0qk02nFANIDQ63AQBYt22UHNRKt9Mn1dr1ajkJoDMZHCqLw61XKkmpxuIwkLTB6RzUJey0uii93aCWkwBai0s71jFcM6zfaTW7fQwA66fdHtZiYhJXC5Rco9ddZnor47Y5GJXJqFWIAdR6k8aht9N\+pdxpo6U6h14lJUGqNRkdGpvDpzWkYsQdO3b88pe/3LFjx3vvvTdjxgwAOHfu3De/\+c3PP/88Kyvrscceu5rHN9FGmJxzzvg9PkqlAtpNkm6d0iUWJ/opNWbb4Dm/pFytJO1Ot18vl166GKO1Kw2MXlHiURMzDptbbnDqVVIAqc5G6wAAWPdozXjMRihWmx06ymOi7e7\+on3dG\+EYdSuV680WpUYuBgClWiW1ODwMq\+6/ur62jZBHlZTdbVAvLM4K7LXbNjhPhxd8Z11v\+96/vmJx3mRYc7/92Vt3PW3b9im3eMUd5XNJAICudphXBPUNJWvWVWQBAISbjm4ZFB5PBEmqDbNUPsZm7/AxQz8RZ\+pMszWJH0wmZDGc91A8iu11OlmxusNsaPP5QCrnARPxS0UWY44YgPVcsDi4OnsmCQBSgYpq1yvP\+OVCtSoRaqZJdQVmmgVFtpSMeuh0iyVbzHbbdGccFCklmzR20myXjG\+iCqGx3KBn2zSuUOqdiNvBinVSrZIgYZpBf1HvCPlVmbSLozOJlGKw2WIk2Wun07QmoVxK2ZSDcwvT9jaXVGIy3eCEqNPQYGUIqe2sVTzLZEkMCk2Ta0RKx3naz9I0YXRMk5NpjG6W2R3xOydS2\+KpFudUgJjH6jXBLFsinmS7rboW0pQKRdhOq7lboc90W7uM1llKNp2hz9sYymSdBo5mi41r1GWTnjarrcsP6XLNdJ0606bzWnx8uTgd3Bfs0gKrPptK7I7K1hmzAQBYAJKn0uVrXGcdTEyRKg7ruWi1XnR6\+igpj2FiSjZNLCUphqWdAbcTWD/rhmk2G0lBmlybr3W0mYxRjyvESAVKKQcgTawUG5Tpqbzifj8ojbP08j6XocGhzjfKwe8P\+3y9PhfrkfIpAGagImIee4vRk\+Z3dXs8zUYX\+Og\+sab/0zSFPh/cvW5Hu5tJF7tiFBsyGc\+4qJhYM9OoJgA4JMRHNhMSOKlRbRGXOeBTSZzWxAB7Sm/NVmoYPwUsw/qB1KkFUnEaAFdtvMGtjVNSHqiFYlu70ydKBG\+Mu93JZplUBADrtHWKtTek/iRFQZxr1Hd6PB12Z4RRdrjJNI\+t2eAnScjQm6crSCBh1F5WTvLmgTjX4swF/0W9LqixS6SOM3r1pwwT9fjArWwj2T6/eJrTKSbdLKXgeWxnjQBAZYo9DO0nAdLVpjl2FUGy3Q4bo9BSUkpgsM\+mbBE/m2g8YafZ79HMNClT13YkqbXKk7/TbLdVd5Y13mgYMgQ67LK1Oulu2t3Hms7rdAQlFhhMs5QUsL6AwTyQjvV12P3ZennUrv/c4mLdPnB7AownAu46uzTbaC3QSHN0ylaTLaQ151Cj1ABCCH11XNsAmGX2P1Gc8cQonxT\+fHhSv4d2Oj0k6/cxbPLWKSnVGMwGBWP3aV0AAIzP4yel8tR6Qz6HUW\+mGZbxeXykRmWT64xqDyM1OmyakUEuJVVQjHPIZe1oSLFSk7qmZ/1ul49SKKQk46L9pDQVOpOUVMzaaD\+jVar7r//9bpeHlGukFOv3ePxA2nQKnesYQy3SGMxmg5r0jZqDYujOKRIYn58FoMRy6ZDLBQBgfbSHBdKkkro\+bITCEq3RYr7EzYCrhvXZ9Wo3xfp8oKakCqk4cXbUGh34nSYTrTAZNVLx5fsAGZ/HT6lTY4opsVzM2jwMQ7p9IJYnl6giKbEUfG4PA/JkVT3wwAP/9V//9fnnn3/zm9\+sqakBgETgccMNN5SVlY2r/NeuESbnnDNOvdpMagxGi1qZmCPsMOispE4z7OyQYoUUXG4/M\+rI6gGUYrR25RujokZLzNC0H1inQWlyfugnC1V6s8WkkTMTa4RiqXRILyvA178Rjl63pFSVWLSM9btddovdJ9WqBuf1xRvhpUSi4Ui0dq99W5OgRLlw3ZqFRN5ciSRiWDclEAE4fXC9s917mgWA2v37a5PbcIV5daKZt21deXT9pve8ebc\+8/MZQriyABgAIOpnOHIlJQcAJuSjQanKUVActQZIJsKKeSQAsH0\+hqe1zFb6/T5GaLJMl/r8OhPoTWKx\+6zOGgEAYFm78ZyDmaKngHGdNdj6Uh3mccZzwWiMGM25Ut8Fk7mLUkd18k6zNSpVRfVakhRnGUyzVGSn1dgFAKwvYNCd71/dm/X3eph0ubx/9mmaWDPTZsyRSoH1DDoINuzxxcQaXiJepcQ81tfth6kaAwlMp93c7mZiwEZouoc0n3VTwLhDPs1chz6ThCht9pmZ6TZ11KFvsLjTFLp8h4US\+9sM2pNSP1ehybeaMj32EEvFPa64WMn12dscvrDV0qe3zRJTV1bnMY\+jxehLT9St29OnSX3A0IzTE2FJnlTcazOdV2gENgsD2nw/3QVUJuU4p3cLjabpBvNUj81rsJ\+njRdc5DSbTUAbA1KzmLU06/Q5BmOegr1os3V53CGfRmqRXnB6ev22Fr\+v2\+Np9XhYsDFq01QpxVdo8nXKTIqMsUwMqDRSOsth73Ynx1GnGRQCse\+i1R5K3RzhiKUc2hmitEI5FfO7GZubAXGWVperIAGgj7b63Gwa4\+71MwGHihSLeSQJYu0snZLndwUcTtbnb3PIc\+WQJh2zBzjmNn\+u80mtmrBRz1K6G8xG0m0\+bVfMtAxMNo6zPsZsDIvJuJ9maUjUZNxHR0hVohK7nW5QmATSgQrnKtS5AAAspZFeMOvPgoGSSzMVcl5y8Ih8qlZ6we5kdfJMEiK0PQTKWSoxgC/k9PDUZj6Z\+DX0BQ3aXqNtltj\+mYPJsJpma9gAa\+zTm8WDbtxEaGuz0cUBhqXdEcbU6CSB9fd4mOwRzYAr18116YD1\+HVGMNrFcp9fa4wCcOUqSuFpdzMxAACSp9JPU0u7nFQ6ybK0i2X9jM1JPlXsVz/CiFUZYhJ8ViDl4LT4gcxQMBdN2kaakjisow7TGIZQ6Wap1G2MgdWbpitYxu65qFN1UCSwbB8jFhsSqVjWYWx2sjNNFKmwyjUev84EJquQ1jczRlkqok5TaDJZI\+NhcnC5R4TQV9u1XgRrxe9rL73\+UH9SudZo1klJ1m32GEfPjWX9DFDK/kFyUo3ZLvf4Scaht4qtdp0U/A56UHq/y\+YiNdrkDzFFkcD4mfEWnfU5jTqTX2O1qCnWxzAsObCMMEmRJMsMmh3ld5l1BlppdmikAG6G8R/zM1qL06oA2qI36I3S/U\+xo\+UAUoVK6rNZHXqFVux3mC3ORkbFDos5\+kvkZ5hG2qOy2Gi72O8w6g16s9xpvuZ/Z0ip1uq0qnxmtcFHypWD13DyM1LKr1SpVeMZAsj4GSAHBtCRJMkyPn\+H1M8C1f82SYlJ1sMMVIFYLK6pqVGpVJ9//vnSpUsB4PTp0zKZ7L333hs8HvVS5b\+WjXDQpspk9OuxG3QWMNotQxeCBgCSoihgx98Gh7Qrxj1qRbH9Q\+cGJWZ9Tr\+/3uNXW\+weJem2G/V6g1RuV4/ajCdVIxy02eDvLAAA67NpFI/u7yAKH7Y6hq4Y/8Ub4SV10nv/SQNXdteDSt7xtX84GUh9QMy89Zmfz4I9h71dAEAW31VSXkgCQPj8qcq9JwN5IJxZZFg3JcgXFfHav3Axxs1P\+zXKAMn2MdLpA\+\+yrNPks0GWSppGArBMHyjzTHoebWx0ayUGcdBg7GXZTpvB7/KlScV8q\+2Cm03zS6cYSACm22pqdELE489WAZBSkdUlAgBgoyzJZZw\+nUNos06l2BhJXmJoZdzPAElyEi9IMg2YPpaN\+VytdleYGS29z\+43sZROP1VpmGt1MzZzByPOUqsB/B1WUwcAUJoZdk2OGNLFFE\+qn0Exnv/X0bdInms0U2KISv2nTdaQnrqyWkyTa1IjihM9wKkPKJXYoO5yqGZZ1OA0NDhYQmueTQFrN7eCVqwzSg0Uh\+zfKdNHKXJUTJfZ2EMyEaehzWCVWZgeEKdRZK7BPNVnazCycZ\+TlVvlZrbNTlNSilSbpjlMIR87VSrOVomB8bRZbF1Dfw3TFVqxVpG4PshUKNPlAx9RWv3QQyF5qbvK6UqdWO7pZtVcm4WxWTsAAICrNAo0ZBpISbEYSJaQitMv2QOcptCLKFebxRejVCTr9BsZrt/V7aGbjW5Spc1TS9NIudjhTnzxom5LmCWHjc0GYPsYliOm0mEkMttgl1GmZqvR5z4WhcJsg2mWUZtJkaRaS1psFz36TAUTstMctSWbAmB8XT6SHFhsTCowqCIOq59kMlXiTpup0QUs7Y6zxrBcOU2vzaaAp7IsSF6I\+C8yvqDWNPvyKx\+yUZbkDT4ElulyuvlG23Q5CQx9VmdjNaostaKLdjEeAIA0tZ6aTbRTcspozqPcF2yObiZxeqQ5Wh1F0T6dAwCitOW00Z6Y/AysP3ysEQj6hF2c/JqAOMdsm5UoHuvvslra9Ppcq3tkcSMuk8/CkJcZQAdASbPE7EWPP6akcBQ0Quir7CszBHoEFhjGRw8ZfToC4zIbHCqDmPX7aRfNSMUwqMuK8TltNrFSo0xd8o9rYF1iU9qi09tIndVuUIkBgKQokvUzqWCDZZiBWIT12PRas19rcRgSSwSTFEkt0poMGgUJIDUaHU6j8zRoRs2BVOgtZp/BpKD0YpVWp1YX\+gdFKEORFEXNVhtNepUUQK436ewaJ\+1nlWOlvwZYv8Ogtrr8DAskRZLA\+j3HGJdaaZVrzVbDZaIgkqKA7Q\+sWIZlgJSSJCUmgWEG3vazMOyIJBLJgQMHSkpKTp8\+DQAymczlciVGol5r42mEQ9L7HAadmdHbbamwyu8ymz1q88QfwTW8XY1RUaM3QoqiqEK10aRVUgBSvdFl1zndjGb0ZjyZGmEyi2HVBQAApFTn9Ks9LqfFbNLowGHTDZ6qfe0bYTTcyxPdpnntWfXASjw8UhSpq0yVuvbd/bXvDmwgBAg211l2JHuAr3S/I\+YAS1V8P92RGtjLOKhMjV40eLywWCm22pI9wANIvlJXYINus7EHII2UZyvogMkY97l6/P4mv5gjVlFiKltvm\+XRXWAoQmfNBxPD\+Bi3fzqIs/RGSX8PcErYrvc6VFKzGACA9ZzXahmVTWZQjPVHiyMmwc3GU4cVA5JPkmlStdio7LRbU51pg9JLtWJTcvXgdPB1uKX5tiGLCYft\+rMeEKkSI5OZLocTblvEZ11NRhvfqstU6G90QNRtDrB\+lnaylJKayFiIMXuAAQCgj7YmwsIIpeZLyUj/bTPGx3rkWYpUOkopMulJn9VrYMQW5QWNrttu8YNOrBnlCxnxOHvEupliazOtmDK4JIybcVFiuzE7tVHMbfFa3FGNgksCAEUqVST4L\+o1fkaZ1f\+FYf09NOQ6bLnJmIiNAcRZzwWTkaHUQpV\+tknKOhzdDEWqlXwSgJQKVArGSQkU0nS/OFOrzzNq0l0je4BJADFlMvNsznQlGfDL88wG0m2O2BUzzcke4Kjb2uSSzzSohq8\+nVhLWWfKlZPpFBn3M32jX\+JQ2TpLoQ4AWNZpadQbGiip3KjkStXTFOZWuztC\+S64qRyrkgsALBNlyexB4TVPrp\+hcLT5FEK3ERSm2Wo2oGcG9QD7LxrNfTqzaMRKD1Ha0kQrhhabjXjobpALKH8viLOHjU5L3GmiSGCZKKvIAH/Q4SFNdrGcTKwBTpD\+5AUP4\+nwyCVWHUn6LxoMIb9WSCXz4CoNN7oMAADAdBjVnx9rBEqeZ3NMHygeG6btAbujk/anG9WZfvtZoy8GbK/LEZZqBFIyEVEL5dqZNm232TpKdQ5BplPQd2VrpyGE0JfougfAfodBZ6YZlvE7NUorSbIMw5KUXu3WaEhSqTdbtGJ/cvQpSYopYHyXeu4nSQKb6hVjfX6Qqvr/pDAMA9R4hqsxtFlncKusroGLaUospRi3j0nEZozf42PFWikJwLiteoNDYXZZ\+0dWk5RUTsGgrjkSgIScsXIgFTqrS2cFAGA9Vo1NqhlreCwplYtJ39CMv2SkWGNxamijRu/T2Ww6OePQaR1qu007nl4wsVRK\+unU6GbWR/tArBNPF8vFrN3jZ0FMArB\+j4ehFCOqYNasWe\+9997tt9/O5XJdLpdEIrmqx3W1GiFDW8xupdkxEDqxjMftB03qBcMAOZ6L5NHa1ZgVNVpiqVwMPmbYVciYzXjyNEIYtboYj9Ppk6rVckosV\+vMpFuls9N\+3bCp2te4EQJApOlDx/phPcDrRMkX1I1bn7xf1nzG2ysoLoTK3764F65KDzBJqg2zlHSjxtArV/Gp/gtf6PPQEZXtRkMi/BvUP8h42s1GlmJ6PAw1KKM0Sp5J\+bsBACA2fOw8AEAaQNhpbvWr81Ruv9GQJlZTUpqx02GVv6u/B7g/0va7/Da/wKghSRoAgJROM2rbtbomuVM6\+ipzJE8sjvs9EVbNIyHm9/SyYmHiDDMMiJVCNQCwLOOOksoctZQD6qmUvD\+uSSNJ8Dn8yYg0ge3zeOKa5IuYxxHwKERafxD0IrD7De50EoCEuI9mfVKWUWZPcCW4MXuAB\+FQ0kzFZXvS2F7aFVPoSalyhs3eRVtbHZ4\+zai3CZiww\+KnfH3K4Y9/iLstp5WOgZmrjL9Pbrr8MZBD82HZGG1n3JBhUac5XREF0\+GW5qrpgNsvGjQ\+I8YwfaSYBIffSMd9yR5gDuPnpf7ecgBijIcF6RTKH/M5/EZ/fw9whlonUonjjCfsEY9ctg0SaymzAECRSnnMaA/61KLUeYm67X5aLNKIe2gfqVaTJCQa/0yD87TL1wdKLogFWuU5s71D6mfFmhmDbloOLCtHAgDb6/ZzFVSam\+m0mhqdyR7giEI5RafNJtmIzxcZpflDnPGwHikAxBhfl8vJePys3XZRo6bUZK/D3ivVphaXShErxZaBHuA0AA6QcdbfYTGesXgyTLaMgbt3Q3bEgZEDJVjWbjjrEE/7cUnI5WvVm0hH/zRdMo0UC3RGgjWHFfJMKQSdbIZRB\+BrV5lmDzzASSGgPN0Acb\+zUW9KLsGtU7cBAOjr7MBVGKQWLfnl/0FACKErct0DYLHG4tQA4zKoDazJYRbbtTqXxmbXSz0WjUsx9MkmlFROsW6Pn1UlO5xYlmV8HoYixQqlSikFYHQam1GrSt6lpJTG/kiE8bkZSpqaQjkm1mfT651yq2NIVxKp0OkVWpvdrTEqKb/LameVRo2U9DsNehtlchiHXJCJlVo16C12t0KvALfd6gSFVS5WSEfLgfXZdBqb1Gw3qSm/w2z1K02asZYIJqVqrdRis7o0ZjXld1rtHrFW\+SUsvzto\+qUGAIBSGs06nV5vkTt0E8mHUup1Uq3N4VbrFeBx2GhKbVZJSbFGr7KarS6dVS1maJvdp9BbRosRJRLJe\+\+9x\+Vyr0Hg8YUa4SCkVKUgTUaN0pR6h/X7QGNPzVr3u/0gVVz2LozfaRzZrkj56BU1amJKodFQWquNVhuVpMdhdTByo0JMSkdtxpOpEY5eXYzbZjQwfofdoKRYP\+2kGalm1IcqXctGyCWyMmSj9ACfqkq9CncFql76Z1XXnM0bbkukuRo9wACQWOt1lLOYNuqZpeRTjOYRPcBDN6QUuQZFLkDEZWx0awtSUwRjCoPUQnHBz1MCXyyOe\+SkWMmjHf3dtslIg/W1GY09CvMNKiotGXqTXKVBanJ/ZjC2Oa25o7U5QqUTWM0XaF2mCkJ2R0xlTDzpN8b4OmlnmAEANuLxR0i6w\+kBgHQ5SSou\+/zSxGgJT8Bk5\+qtAr8pyIqFekuWn\+GIxVyAqNscNosptWpE/bHdDlsQlLmDY1HGdVZn7PADABv3s5\+rbImjjrMsh9LVWQGAzDRYJVLgKfUzjNIuhy9Tq\+R6rC0OappCnO72XHSA2KwaVGa2z23zO8Uii4oHAAplOuu64B7jSLT2BVoA1sfYLAEHw9cMfMRRGKS2gXWMY26L1zJsa/FUq0vIAJciI059g1snMygASO6g\+wURn6/HxWZpFazF1KsyTWNdfZQynQRg/UGHk6sQR13OMEuxfpZUKEVGJQBEUz3A/Z2iicnkfR5PRKxJJ5k0qWZkD/Booe9whEqfQ6nPagxgNU5RiONua4PW3Kd1iMHPmPSsxzbHoCJIiPlcFxy\+dLU8PbmVTmDWt9pIvs6UHAtAUlyS7Rt8x5P1dblJUk1yQJytM83WDO0BvlTfZyIHpstqaPFrxHY6J/GXwe/0WZlsy4gO7cSdJjEJrK/LT2YAxBn6vF6fpdFJaY1ATA6aA0/xWIff5OEA2\+ensqjhGXXaDGcsbK7dKqQNYalhmt9yRqPPM5tESnEaAE\+hygF/GwAAG/W5GNrNBzad9XfaTI1OFpSGWdqBVZ05YvVshxpYP2Ozx9Q60mVs8WtmGfqfm832MZB\+yYVWEELoq\+BaL4JFm7VK\+7BIgWV8PtAOfsPjsLhInU0lpkCjk1uMRptc73GwKvPQ63BKrlKSDpeH0SeWSGIZn89HOwwesUqRTKE02JPjfYZiPE4PKIxy8SifDS6Jz2lzHDsYvn3KttRb07/zktuhletsdspsVIldjFRjsDj0Kinpt9scH354/t4Zf06lJUp2uJ16ucpkMxr0Gum6RphdojFazWopkDBKDgBSjcnoNhoV1L0MtUhrslk0YgBgXHrF8j83JjJ9YMZugMKff\+C2KHVWq8\+QTKzWWmx65bX\+O0NKlXqLXaVVSxna5mQS54NSGuwuHVAU45hIXpTCaLfbTEaFmAa51mB16JViABBrrA7SYtRItT5KbTA57ZqxAqo5c\+ZcwSFc40YIrMdppz0ev8un08s1VpdmzIJ4aJqR6xSX66n0u8ZoV6NV1FiJlQab2W/QSX9dz06/TWOwWnVyEmC0ZjxGI2TdRmXxtmOJPD\+cw3kUpj/yptumln\+tG\+EY1aUzW916/e1TngDImX2bWm\+1jTmW\+soa4ThEvftt39g/gQ2Cpz/c9lK0KQLh1lOW5xoCXQLl5TcaC8mXiiMkAEC6VEFQAECmUdIrv5Blk8tKJ4ZAn/GL08XKaXoN32dttIpzwBVRq8NmH6XyX3BSUoNppoLKkjOM3ZcpJ4HxBIw6P6uTmVRD/z6RpNY8w6U\+Z3RkW6Tn1be3JZrn/jm138vJfsF9o05dYGObDSq3FrIM5rkGNQ8g6rY1W93Dp1UAAECfx95soCmjgRJDjGXiI1MAG0tM2iDlIpsDSOi1JUvCu/zcb6bbbj7PmqcMDoAp1SwHPQsg4jI3mPzT7RZKDMC4zmr0IaluplmXiIiidLIOg1bDBbCJ3PaI1JIOLo5UwXOYz9qVN\+rkMY\+j2WSL\+JhGo0JksU4VAwDbbdOfsbHZJh0BAAAxP33BTgMwAQdJKFLTPkkqnZJmGLTTU008jYS4z3nexFxMVVLcT4cZ3dCjof16w0XKMNeiTQcAYKO0yWf0UWZLnkqcBhDz0\+1uqdhu4LstzbZjvZTtjJukLOosiuTZTGdd2oJtTCerkljVl\+0kjLO\+izaaZ9CnAdvncfiNfh4JfNLVYnSlSVUinZoL0OswfOY2AwAwvnD/A6VYps8vnpbIRawqcDi4RuPZ2\+ecAQBidrbJJjMouSRIbOZms\+mUlO49D\+mLVJTBJkvNdgZKMUVJXrBLC9SpRy6R0iwpe9HD9E9qjbjtIVYlpUiW8XfaTI00BZQU7KZGO5Wp1YvkAIy7TatkKDIRyfc5VZ3JkQi\+uFIFQAmMjsLUwcZ8zrM6U0RnG7z4ebIwpHyK0TykB5hSTrfYxHISgOkwG9nljybPoFQz264Zer4S/2NZp7XJZOkitbMdJkoK3TQAKZ1qcWY7LY06hV\+qnWkx58pJABZYAJbpctjDDOs3OaayVLZucA/wYGy3Td9kV87WUpkaHanVfeYz32jVEADA\+Lr8JCm/7H0lhBC6zq5xDzClMFqdl1l/iHFbjVbSYEtMk5RqLTa/0WIyMgqzXUkCAOP3MUAmL3p1Gkpnc/rUOikJjMfpIvUOl9yhNxjUalqn1WrUSvlo12x\+l80FKotKepnyknK9i9WPfihyjdmhMQ96R6y1\+7X20Q879eSZS\+cAAJRca3FoLcPeVFl9cesoGUvVZofaPMoH14xYpdMl/qFM/gMAAEiKZPx\+n49hJzQIllLoLE6dZdi7pFRttKuNX6ygl9rpNWuE4LEbdEZaarSbPRat2q03GbSqUfsOARja7mAUiYcNXdLY7WqUiho7sVxrcQ5vWBNohKTC7I6P1tTIr3MjHLO61Gan70s9pgE8qnRNuWGBgLhEmq6WXS8eI7JE5d/7TnGvoHgKeAGgq632FAAARJi605RMQhJ8gMiEHgIMAEzIagp4yHRKmg4AQKZLk71hHLEUaOtZJ5OuMeWrIcb4QlZTo5MEqRRspkaA5D9YX5cPMvrzY9kYy4Tswx\+qFPPTF\+yZ2QEfT60Tgs/PKnLVAEpdvo/2G22E3pxFSvms\+ayVmqMjOUrTjdqBSGmgx4\+UTjVb4y4yXayc7Y7PHnk0Us0sh2bWoDe4Ct3sgZ9SttPi91OGWboRzykl5UIlBDxU6oGubLdN1\+Aksyk2BpCWGCMNbAxYGLZAHAtj9PqJKYOxx6cc2a3XZjI0O2C6w55coZdSzXK6GKv\+jMpBWWwz1WIAiPnd7TZfhCK7TDpWqp5llHNdkEYpxGZdg9EaUut6zE7S4JilYLsc9gtmzac0HW7sAABOznRWp\+rUWmQm8QWTjaMz32CETpupyaw6bqR4UnFqnLO90zUwZpUjVU83DfQAR4f2AEfdNp/OEtdZbzQoeclOWpKrMsssVp9B022wSbVS1unkaLVgNbSS2pkuQ8xh9tsczcXO84uk6SSZLvbHpxskegCAmN8VsDlZBgBgYAg0AIBYoNMLKWm6z86wAHpVGwCQALRrUP3SEUoq1Vpu9g8q38C58Jw3mPt/DNKkaoldLRnxdecqtLPt2uHvJlE5FvfiwXmTYoFaet5J92qlJElxxexFmysGrvrk3SZ3aOCvCHR5gG8zTnf6psMoIi5jo3PQLxXjCZgMfieTZbTN0cm5AGGHzvPAbnh4x42JiBTYOAvAes7rDR2gm0aJeQq/T6tsI8nEInOztEQvjNH6kq2UTCdJ0mCfrVEm1nJPpSZJtbHQreukPWliEvyus3rDRZ98usfi92jmunQcp7nZ4u7cLWZmS7liucBknd0/ZIZlWLuhwcLm2vUCCgCUEru1T2M4a1fM1Upjbmc3qZo5xt9AhBD66riWATDLsiOuFkZJ5feAJtlBBQAAYqVaLfUotCa1GFiPRa14wq34uT3xi0opdHq5xmZ1a8xK1mVzyw1mlVKqptU6u8VqtxodVpbx\+32N51OjCBdt/MBlVvjsVlqss09wnVh0CazHqlH\+2qd82q78StfqtW2EUp\+b1VgTSympVC6b2WpQ693u\+vPhQZkX/vhNl1XFOqxOUFtHLA2NrtzXpRFeWoSp3vFc9WWTUTdu7Wrf\+9I/KwcNgR6QJVr3a20pc2ht60QDYEqgtwjGkW6qzT318qlIUqPjSsUClXHUPGPsrdlA8UjLXAAAJQDT6WYFRutUOQkA2XrrHJbkkpCrS6X32T5TPtqjeimfSr6TJlaJxgpexlE8QqmdSg7tnmL9F02GVjeQGuMN5v6RzGSmzl6kdgVMptM\+4xxj4qmqJE\+hncIOaWtpUuVUDTlo5nA/psfNCjTSofvytRn1F0ArdelyBg90IcWUwZGhsLUzTAzEcYaJeHxgsMgMDGNzxpRarkP3uZXNtUl5CoPMyXJJMseWDOsFWoNAaxj1aMXWZJpsnUU\+4r5jvxgLwKZWCGN9Aa3yzD9J4QtOPpl8h7G5SIszXyVOY30BncbvV\+SZ5VwAUOpldmmAZvqAzNRZZgOALvUIQqUjd4wbSmli1XSjaqzCAPQv2jRxpHy61XaF246dKanWZ1otbR6NRJF4hO8V4qnMN6gGvaakQq0xy6TKpJJvEBrborgt9bF8ut2R\+gedjKiNrpsH3/9kPQGKio1oe2GH7pTBTeotGWLgifWDZmuQPIV2KqQaMCnOTl4TKURmh1gq5fjd2Wp5tpgEnaVwZIMhKZ5cDgzNuOX5juR3FgCAUs20WXtYKg38F22udK2t/04KQgh9ZXEuBrsun2qQhlMnFy9efI1KMx6sz67TWMRmh2X0pVBGYGizRk9rbfYxVuLduHHjtm3bRvtkcrnq9fBlVuyXfBIn2ghZj1WrtSutDuMYI2uxESb8\+zVC6Xd\+8\+XsfUJ8//zt9S4CugQ2yg6eXouus7DTcNoqnWkzYGg3Npa1G3wORcHQpdQRQuhLcPTo0bnzbprQJtd9EawJI6Vau3siXQCU0uhyX6vSoElpoo2QlOsd7tGH1iOE0FAY/X61EGqLXH29C/FVR5Jaq/zKR2cghNCX6usXAKOvi23btm3cuPFL29eXsyP09YKNECGEEEIIDfb1GwJ9LXxpl8hfZXj5fn1hI4R/x0aIQ6ARQgghhK6dSTEE\+lr497vsRl872AgRQgghhBC61vBpbQghhBBCCCGEJgUMgBFCCCGEEEIITQo4BBohhK4VnG2LEEIIIfSVgj3ACCGEEEIIIYQmBQyAEUIIIYQQQghNChgAI4QQQgghhBCaFDAARgghhBBCCCE0KWAAjBBCCCGEEEJoUsAAGCGEEEIIIYTQpIABMEIIIYQQQgihSQEDYIQQQgghhBBCkwIGwAghhBBCCCGEJgUMgBFCCCGEEEIITQoYACOEEEIIIYQQmhS4V7DN0aNHr3o5EEIIIYQQQgiha4pzMdh1vcuAEEIIIYQQQghdczgEGiGEEEIIIYTQpIABMEIIIYQQQgihSQEDYIQQQgghhBBCkwIGwAghhBBCCCGEJgUMgBFCCCGEEEIITQoYACOEEEIIIYQQmhQwAEYIIYQQQgghNClgAIwQQgghhBBCaFLAABghhBBCCCGE0KSAATBCCCGEEEIIoUkBA2CEEEIIIYQQQpMCd6IbNJw6eS3KgRBCCCGEEEIITcjceTdNKP2EA2AAWLx48RVshRBCCCGEEEIIXS1Hjx6d6CY4BBohhBBCCCGE0KSAATBCCCGEEEIIoUkBA2CEEEIIIYQQQpMCBsAIIYQQQgghhCYFDIARQgghhBBCCE0KGAAjhBBCCCGEEJoUMABGCCGEEEIIITQpYACMEEIIIYQQQmhSwAAYIYQQQgghhNCkgAEwQgghhBBCCKFJAQNghBBCCCGEEEKTAvca5btz585rlDNCCCGErpa1a9de7yIghBBCX55rFQADgOre/7h2maNLcL35t0lS\+ZPnSL928NRcL1/Tmv\+aFvvfgOvNv13vIiCEEEJfKhwCjRBCCCGEEEJoUsAAGCGEEEIIIYTQpIABMEIIIYQQQgihSQEDYIQQQgghhBBCkwIGwAghhBBCCCGEJgUMgBFCCCGEEEIITQqTIwDuOLxdLSgsGPlf7g/\+svdPD\+UWFsh\+8o/GMAAAhM9WPbFYUHjjXTs/ZgJ7dHcUCJb84MUmFhL/7t92yeJbfvDT3713lr3Oh3aFmA9/fUthgaCwYOn2j5n\+d8OfP/\+DGwWFBYKbv/O7k2z/m88m3/zB802JN9lTbz\+tfWip7OYCQWGB5I7l9xpfrAkk059/Y42ssECy5h\+N/dkGXPo7CgQ3P/RsA8t8\+Ov5hQWCwsXaV1NVFz7xu4duFCxZU9VwIrmjEf8t3f7xxOuZPb5z2Em/UaZ\+SL/T1Rge9dOCxIE/2zDiXCf/\+87vTra\+9eRSQeGNd\+0\+0V8e1m26pbBA8J2nD4dTed780LOp2mOb/vHAkoLcHzx/KgypY0\+1vTuW3/WTp19v6LjsgTR\+\+PzP16jnL0kcwnceMD7/VhML4ctVV/jz53\+wQFBYILhjTVUTAMD5934xf7T0gjvWvHTkxXtvLhDc9YvXA/37PVu1ZoGgcIH2jVYAAGg9/KpJ\+9By2c0FgpsXzH/oB7rt\+0\+FJ3xWrtY5GlaZyf/Upppgx5d\+joaV80bZXeoHtv7jeHBYso7jO78jKCwQFC79\+XutAABN/9AuGe10FC79\+Tvu50c9uWrT4S9U5/1FXfDAq5\+n6qf/53Gx7u3WgR\+BUXY9js0TAh8/b3zolrsWCAoLBDcvnv/Qms1vfM58kYJfJaP\+7rENl2j83rH/drx49P1fzy8sEDz0p\+P9JyVxTpckv3GjuWRruUSTeO\+yPxQIIYQQGp9r\+BzgrxCCmlt05yIiDGGmue6zNgC\+5OabRCRAjrxg4feNv3E9/OQ7v3\+6Rmn91qzzNb9/cl8A5Kuf0t5ChUdexRAFcllOOHjmdNNnh/c\+efjgW7/860trb6G\+/GP6Qlo/eu3gZwAA8EnN/lNrb7lVOPTz3rrXD3t/ctN8EoBtpl93D77o7ji8/Yf3/aU2DAB8UcHM8Jlm7/uv/ea\+wx/seO5/vj\+XHF8BAm/s/FPNt56\+Z8h\+hbPnKr8RDgKEz5\+sO9MLxMyihbkEADFvrnCsjC5PILt5rpCEMNvW9MlpuvJ/6MOBl9/dVDz00/4iFE3n978gCuSy6QSRelVUIBjfHnvp3\+2svv/3K2eP/rHoRrmIDDV90uz96J0d36s5\+JNn/7rtm3ljZca8Z37gsV2fgeQbd5d/Sxg\+5a5\+\+7XammZ499nSS1cX23ywyh0EAGirrTp89n7JLEI4/xu3eqeHgQ16PzkdBBDeKJdRBEDuLXn8sfaf0HF452P3/U9tOLf4W9\+uKAg3fVRz8JVjB4\+HX3530\+3U\+GrlUq78HIlulEuo/lM084YcAsZ1r\+SqnqOBcs4k2DbvZ811b//1l2/XfPDCc78tl6QKHvRWvVELAABNb\+\+rO//NvOmEaN6txa1tAOHAKU9TB0DenKLZQgIIybzc/iNKnNPUy7nzqfEc3eUFP9pXe37VDbMBIOx9v6ZuZIpRd82OY3O2aY/\+h4\+/0gwAkDNTQgSazhyr/v0vDr5/8q\+vbrgareXKXe53bxT8sf92iPi8L1CWUVvLJZqE6AvsCyGEEEKDTY4AmJy36ndvrgIA9tRLP1xqonO\+/eRr5hXTUx\+v/s3q13\+wo3L7nx6cueLt7VVnQLb6lz9ZJgQIjMhJoPz1s3/5voSEcOvhV3/zqKn6/Wee2rXs5V/cNM7A76shUPvK4SaQlz8xl/79vupXTv7k1ttyUp8RAEQeP3j8bfqMdv48gj3v3v9Jr7AgN3gmCADAnqw07q4Ng6zi6T\+aV82nANjAB3/6xWNPHt775PYVy/60clwVISDgdNXTr31/2SPzB9LzZ93/1P/eDwDQWvWTex99J7zs8b\+8tmrWFzzWGx/47b5UkHb\+7V/c9dOqz2r2fxIszhnx6YDEee8/1wM63hrHHnME0LrvT3/SlmwbqNVBFv3I9r8/WUgABE\+8\+NvH171W96ff/ul\+hWnZ6NfiHadq6M8Abv7lX/atnU8CQOCD3/32\+eO5QhYuXV3s8Zr9H/WKvvVYWcfuXe/vo89/e9ZsxY9s//sjAGBPPn2XZscnc8r/3/8m98s2vLj9EocUbvro7bowyFb/7q//77YcAGDczxt3fkxI4Iv2AQPAFZ0jphkABlXmgC//HA0/CrZh/5PGx/90rOrJP65YlvqdYU7uedsDBfetW9awo/Lwno8CqvtFqi1/UgEABD/4uebhXc3FP/196pck/PnzAACi\+3/zV9u3Lhd4T1xeLtF6cv9HTd\+dLQG2gX69gcibSbQ2D04y6q7Z45ffvPXt/zG/0gw5t6574XdP3CMiATpOvfqU9tdVH/3lqd996\+UtitEq/Mtxqd\+9sRCX\+NvBfOi64rKM1VrGbBIIIYQQulomxxDoy6AUP3lKWwSnKx9d8/ifTkPBA8bfXLa3h8i7ddWTv75blOgs/XoNhD5/bM9bzXDjrd/9/reVBeB96\+06ZuDDMPAl37hNEj65v6aZBQh89HYdO7P4G8m\+oPCpmv3HeyHn7p/8elWyM4oU3b76lxU3A7Qe2//RyFsGoylYVvHgnPBHO//0etPXq\+bGQ/SNByq\+wa97/o9VlxkhLJz//V8\+WTET4PTB10\+ONb6RoOaKcgBOvfGPtxtYAADR7b/4/XO2Td\+9TOdV2Pv2G7VhQfGD31754E1Eh3tP/xj1K0EIp88UAnhrXqtOjNWkFD\+y/unZ//fI7dMvt\+lX0tU9R8ORc1f8\+perbwY4c7j/G9HxydsHPwHJsm9/t\+JWGTTTVcdaL53JtSScvagop6329WNnAdgzbtcpkH1DPv4exktuHqh9/XATQFHFL39yjygRueXMW/XEb\+4WAdS9fV1/Ki/5u3fdjNZaEEIIIXQtYQAMAAA5y9YaV8\+EjrYgCEp\+sbZkXJf1hGjhXBFA\+HxD8GsVxrV\+9AbdCrJl3yoqWLTiG7nwWc2ej4bMVyRm31qUF6p73d3EBupePxacvuj2gmS4Fe5oDoYBCubKBnedUDPnz8sFCAbOh8ZXE8Lbf7K2NK9t7293156/Kn2IY/vstd/c99B37nroO3d9Z/nSn1adAeIbq1benIoeP/vrw7MGzbWT/GTQ1OUQ/fRPNXcltn3oO/f\+5E81w2d1jo5QfPcX35aEDz//25qz0HvJpELJN2YSAMHGtrFqgZz37Sd\+vUwU9uz63r3zJOrvaI1PP//2ifOXKwPbcPD1Y2FCobp1btGybxURodrKmi9ys2HW/euND86Ez1775R3fuHH\+Qz/QbX2\+yt16tZr9lZ\+jY8/rUiforoe\+88BW12VrJuGqnqNRUHPnz8sFCDQlvxHButdrvJBbfP8iyc3fKrkRmmreoBsvlwlA4JWfLhk8X/TeQRObv4gchfJmQaDm7brz4abD79SxM4uXiYihSS6160tszoYC54MAAsk3cgf/QojmKUQAcF1/Ki/7u3eljpnvWJiqqLt/\+UZowhkMby0IIYQQuqYmxxDoy2MaXB8lhvCFvDUnAxVzZ41r2NkXmJp63TTRVYcDMLP0/ptySGFx\+a2iV/YdfN3des9ApzdRsGjFstzqt9\+uPS784KM20Te\+VTTdfnULIZz3rZ/81H7wSfvvq779xNXNeriQ95NjqX/zi3/y\+//59bduoIA9k3hn6PzSvLmiQec9fMZTd6b/Va6kIwzDooQxiO5c\+5Nvvf2bV555vuKpG8azAXmJfIW3/PS5d5e9vfdt94lTntq3Xtvxxms7Ni5a/dKzpnvG7LTrOP7Gno\+AuPNuZQFBwq0rFoL5o330mVU3zBvfAYxSwrnftTmKK96ormn4/NQx\+vW/Hnzlr0/d\+MAfX3tq5ewrzXPAlZ\+jwGeegV6zHGGAHW\+UelXP0SXwAQAY9563TkPefStuFpEUsWLZnF27Du/5qGnlbMllth46EVc4b\+ZV\+cUhiNzbv3VTpfHY/o9O3v66O1zwbdU8Qe24d325zceuqOs5lvfyv3tXbNBE9HDguKfpyu/pXWYqPkIIIYSuBgyAAQCCH//ufyo/AdmDjxUd/8veV575U8WtT48dXfQLnHIHAIiCIVfkX3Fs4\+E9NW0AULnqG5X97yZX5Um9JEXF9y8SveLZ/8ob3vO5xfffJEqN/iSmyyU54D3T4O2AgaW/2OYTp9oAZkpmC0ggCABgw8FwOHUpHA4yYQCCIAdf3glvqXi87PnHqn63c//91/B44cYfvvzuptup4Mebf/Dw7z3eU4EhV\+GjzwFOEJTscAyfA1wDBECYDYTZ1NU8GwyGAYDIGZSOoOaW/Vr74tt/qfrdG\+WXKlyw6XhzGEBUkHvp6Cpn4be\+v/BbAABs0/6Nax7bdWxv5bGf3DPW7NCg9/WaOgB433SXyJR6073nrebyeWOvUkYSAMEg03/xHg6fD4cBhAOBn/CGe753wz0AAHD\+w6e/t2bHR2\+8\+Pba0h\+Nd\+WzMV3BOWIS/1tk/NeIOcBnrs85Glq81DeigCABWj/ad/AzANj3\+IJ9j6eS1FYdO3u/5NI32q7VHGAgJMvuK8r5bW3VG4GPwpL77y7K8Yxn1\+xlNydzZQVCgOamj9o6yiX9ncCBUycDAMT06/ZTeanfvZzxNP5LGDwRvekfWs0v35hg4Ya2FoQQQghdYzgEGqDjuN38p2PhggeM29Y/uU0rg9OVT\+78gLnMVmzj23/67TsB4Bfff6vka3PZEg7U7KNbgbj5vtVPPLbuicfWPaEtvRHgzOE9Q6efib7xreKc5uo/7fOSi1Z8Y\+DSnyi4bcXNfOh4509Pv516jlHwROUfqz4BKLh1xTdEkJMrmQ4Qdu9PPTyGPVXzj/dDALmyecIh9TT9tp/8Ypmw9Z3KV05e42HQACC85afrywog\+PZffv/2lU\+0I6bLRQTAJzV7PkkMngyfffs1\+gxAwVzZ9CHXyjm3an/yYG7wfXvVJ2MOiWyt2f37ymYAeck9c8dYjCd84tk1SyVLvrP5w\+QtCFIomS0kAMJseMxKY07ued0DMFNZ8cN1Tzy27onHVlfcKoLe2ldqxpyBSeZKCoQAodrXDycfb8OcrH7FHQa\+ZOFMIdvwD516gUT96/7nxPz/27vfGEfOOsHjj3UrXPOCcXEiuKKMcJFksSenxDWXS9pIjNq7zGInJGmzgWtziWiTiLQJWbVDkNrJi03nXtBGutA\+nfbaDCJt0M620Sa0b4FtJwpnZwddG8isPRcJF9kDV7IgVwiiiyDkmn3je\+E/3dPt8sx00jPT8fejeTPu8lNPPfV7Htev/j2ea270vP0Lvzsc0H2021v/fOrpU68I8cHb77nlmv67l8QNn4j3Ot3Dd97kFm/\+aK16kTds7wP3B7XIzeIXz337pd9cc\+yuo4cvcQRz/vrhG\+46foMQPzv19LM/6d1gbL/xT9/82j\+\+Kd5z013Hb7gyQ\+XIcW908O973XZECwAA2G9cAbYbz86frJ57/91PPTLpdUvHP//ovS8\+8lwh88wnvv2l63Yt/Yfq4hdjz7jd/Vvd3Lf91aP3HZy3dNq/rj5Xf0u8/\+4nnli4q3uwde5fP/xm9Qs/fOnZs7\+56/hgQbf39sht733hxT8c/uiJY173Vq4lXX/3UzN/f\+c3aqe\+eMfpwA1ed392kOvufuqRSa8Q4uinH/zYs6kfVp\+M/fnfBo5I4lev6m\+eE0fu\+/KDxw/3L9z1VnLjvZ\+/75unl1/5t1G3Tb5TvMcffvz4C184/b2/Pnn/R/tT7PzL2hN3nt1\+9H/4tkee/upRpzKkDx6//1PXVU/pz9x5x0s3X3dY/PZnr/z6nHj/x7vPjZ\+Xzxz5\+JceCn3/K9Xf79i4s99M/OfnZfdgLqIbHnjsQcfXC7uPHL/9yOLp6tJn/9Nzwcnj14lXf/LCT38rxIfuvv92p/dj//6VF1/6F\+G\+Lf5k9qHeS7atH4v/\+9lnfvqDl16N/4dbhjb14WP3xUPPPV39weN33Pqtm7zirdf0X/xGiJs/m77vqCSdO3bievdzPzz1mY\+\+cPPx0C3vefP06err/yY\+8LFPH7/unQz\+i99HjzsGzGXfR339em7vESFv/91LnuMP/9cnPt27Bf3N//j7s58/Vf\+HF39194Ojzp69\+f2vfPbPT26rmvumhxef/NQ7cMLNLV8fuuuo\+0dnz33w9sgt17h3peJDV53\+8IW//oHjn3/03tOPPPeTpz52x9/efN1hqTejj/u2v0o/cIWGyguMeydGBf8\+VckpWgAAwL4b9wT43P879fTSj/5w\+MRjj951RBJCSEc\+/sQjky8uvPS1p589kdl9Qn7bc6HvDz3w2JNP/eU7NTPnZWC//uN/\+OkfxAdO3HPbYMvc1xw/EfL88IXTP6i\+cfymwaLSNcfu1Q6/WD921\+3XSGL7fMie27/8nf\+jLf31fzv1A732uhBCHL75zkefeuy\+v\+gel7tvfDDzbc//yHxt7aVX9DeFEB8IfPxTDz36\+IkhCZs8cf\+X7vze5/5x93zL\+8B9412P3PfMj5d/Wsg885ffONH9cPvTp0IIcdjz23MjXkQjHbkn\+233B76ydOqHP3vlt0KIw396/FNffCT94PWS2DkBrXTLnQ8/uFr9n80dZWw9tuoJfurxx9JfnBhxj6vnloe\+8b\+vf/ZvCn//Yv2FU2eFeO8NJ\+L3P/z5\+xxv0X\+r9uzpX4j3HNt\+tU0\+es\+JwDOvnH3\+xV8\+cMvwY3rP7Q9947vvzTz5rWd/pNdeF8J93bF74w8/1X3Ps/vG\+5eKvu9\+82/WXvjR6e\+9IoT7utC98Qe/FI/s\+aHi4S56H53bfXKq77Lvo76terr/9GOPfvWJB/7iiCTEv57\+QfU34vCJO0MfHLTVNcfuvf3IqbXa90//6r7P3Dgixzr365/99LzZicTrl/6OpeHcNxw/cZP77K9uO3Fs53kB51V/ePAf569LR\+7Jf\+fI8aef\+spa7ZXfCiGEuC708GNPPv6JKzVUXmjcO3HPqODfJ8OjBQAA7D/X79764yV94ZevNm699dYLLnby5MnwHf9lr7XC21JZ/7sxafzx2dIDh11zpRzQlj\+g1X4XqKz/3UMPPXSlawEAwB6dOXPm\+g873r451LhfAQauAvYvn//md/9591U4\+WjkgU9svWwMVxD7CBePaAEA4OpFAgxccdL1kS9\+OXKla4FR2Ee4eEQLAABXL94CDQAAAAAYCyTAAAAAAICxQAIMAAAAABgLJMAAAAAAgLGwj9Mg7bVKAADgMmEaJADAwXV1TYPEb\+qVcvLkyTFp/PHZ0gOHXXOlHNCWP6DVfhfgbDUAYNxwCzQAAAAAYCyQAAMAAAAAxgIJMAAAAABgLJAAAwAAAADGAgkwAAAAAGAskAADAAAAAMbC5U\+AjXxUdg2hJiuWEELYRjEVll1qomQ6f0OOFQwhhKUX0zFNkVySEogm81Wr9w2zmktGA4rkcsmBaLpk2kIIYdczIWl7IVI0p9vbambXs2HZFUhVex9aeqFfuhZNFeqWEMIsJpQddZHCOd0WwjZKmXhIlVwuORBOZCvm9qKFEFY1HZKkULa/SqueS4RUyeWSlEAsU\+lvrK0XkmFVdrlcciCcKhr2tgJy8cD2EvbCuREc6nOAmaWEum1DlUAoli7q1pWuFoQY3rmEELZRSkcDsuRyyWoome/vLdus5BLhgOxyyWooka0MuoVVzcV7pcRSWwPA8GC2jUq2W4qkaPHsYGnh1LnMSiYWUCSXpIbi6UEdh41RwizGzx8YAr3xrFdOVHHJ0YKxVba9fexK5QeFm5VsTFOkIXUUYvcYtSe91lRkl8slKVo0mdtq0Escl84b9ZK56n4NG44B4NBcVjWfigZkl0tSQ7FMcbBXbT2fDKmyS1K06NYg7RB1Vr2Q6hYuq\+FUYdtYPCQAHAvv1nJnAFiVVOC8eFHihe1trUnn72XbrOSS/QaIZ0qDHeCwXxyiCwAACCHE79764yX9e/nllzsX4etf/7rDX9qtxka5XC6X11fmJjzeyOJauVwul8sbzc1Op1VejPiDkYjf45tZbw39fqs8NxGcXm22O6312aBvcnG90drcbG4sT/l806vNdqfTXJv2eYKzKxvNVmN9MeLzRpYb7U5nszwX9E2tNp3q1Vie8gohgvMb7U6n02mtzfg9/uml9Uazsb407ff4Z3fVaHNjcdIfWa61O5sb8xO\+ibm1Wmtzs1VbmfH7uivdvqRHCPfkUvfT1vqs3xOcXa21Ws31\+UmvL7LSaHc6mxvzEx7/9PJGs9XcWJryeScXa\+1Op9NurMxM\+CcjE15Pv4Q9Nb5jIzjU52o3Yks7ndb6jN8bWWm2O51Ou9WsrS/PTng8wTmHwMI7avSuGd652o2lSa83slhutlq1lRm/JzhX3ux02rWlSa93cm51o9ncWJ0bdIJ2c2XK552YW2u0Wo31xUhwcnFjs\+MUzO3GcqRXSqu2Njfp7Q0XTp2rXVua9Pp6lVmdmwxOdXv08DGquTLl6w8d59msLU8Fg5ORoMe7rd\+11rsNUG40G\+XlmaDHN73W6nTazdWtLVqbC3p9M2vbonXnGLWHlu\+0m6szPiE8wen55dW1tdWVpfnpoNc3tVxrOzad07i0WZ4LenxTi2u1wVZ0m3QvRlTbOQCGNle7sTLl9U7MrpQbzdrafMTrCc53A2Nt1u/tbV15aSo4MTci6jbLc8HuLmo1y8vTfu9EtxCnH6nhhY8KAP/s\+ubu3bM2N\+mfiEz6PMG5wV7uNcD86kazWVudn/R6Jro7YPh\+cYiuPbQ8AABXv5dffvlS89nLnwAPtJsrEa//vDy33SyvlZubzdUpn0MCvFmem/BPrTTanU67tjjh6x4HdDrdw1v/bHmz01qf8W/leO3GcsQ3Mb\+x2dlcn/X7ndLqdnNl2u\+fmpnsH8W2G6vzs4vl3tLt2uKEd7Cu/ndqS5P\+yaVa91A84useN3U6nU5rbdrnm15tbVsy4g9OT0/4ekfYzdUp39ZByebGXNA7uVRrt9Zn/d5B5tyuLU16ewdjtbW1WmtzYz7ofZsJ8PBGcKjPBdZz5V10Ajz4aLZ/fIv9NWrXOHSuzY354LZe1lyZ8vpn1lqdVnlpdm5wQqbbudZanXZjadI3uVjb3FG6QzA3V6d8WyexNjcWJ3yT3TNjQzvX5sZ8cMdZrG5th45R3boM65qtjbX1xmarPLttUOq0m\+vLS6v9mrcbS5Pe4NzGZruxNNkdxHpbOuPzTg0CeNcY5eBCncLn9k2dd3qr3VpfnJ1bbbQvcVxqN9cXZ\+fXmv0ReCXiDc7uuW\+NqPaIABjWXJu1lbnZ5Y3ex5vluWC38s2VKd/uzu8QdTviobU63UtYHX6khhfecQiATnN1ytdLy8/TbqyvlZubjeVJ77YEeLO2urRc7gdCa33G751aaXac98uw6HJqXRJgAMDBtocE\+Op6BlhSw7GwKktOf7f1fKYoYulYQOourJqVUt0SQthGtWLIoagqCSHEtvsDJVlVhFHXLWFblt29SU1ySYoWz2zdo2YbxXSmHlpIR5X\+uqVAPJNLh5Xu/yxDtyRFlbfXxShmsmYoHdckISQlFAvY1WLV7NalqEtaWJMHtV7ImtFMMtz/vmVUDVsNB3r/l9VwQDKqumnquqVoWncjhKRqmmLqumkLWYvFNEVybJiLNrwRHOpjve3VXW2UcDIRMEpFbgm8ohw6l6XrljwIf6FoIdXSdcNWwqlcNhHofmybhmkrqiIJq141JcXMxbq3uoZTBd0WI4LZFttGBllRZLsb40M7l23W65as6Jmw2n\+Sont7qcMYZdu2bZYWYpoiuWQ1nCz0e48SikUDOxeX1GgyFe8OELZZzRd0JRxVZUuvm5K2VXUtHBB6tbveIWPUHlh6sWoFYqlYYFshkhJN57LxgHSJ45JQo\+lcJqb2d0zdlOTA26mdE6cAcGguWUtkc8lQ92PbMgxLVlVZsoyqIRRRTHRvDQ4luncGO0Xd9l8RISRVkay6btoOAeBQuHAIANu2bNuqZruLq6FErnf3thSIxsLqzjaUtXgq2fvY1kv5qq1FNcV23i/DousSGx0AgHevqysBvgCzms3rWjLRyyzlUDKTFNmPvM/lch06mjSi2YWoKgk5EA2JSjZXMYWw9WImU3rNsizLsm3LMi0RTueKq5mYUl2IxXN1WwghzNJCpq6lF6Kqw3pLmUxFSaaj2w5MrHohW1UTqd5RvBRIZFJq8Y5rXS7XoQ99sqqlM70DNlsvpLNGNDM43hfdwx9JlgfH3JKsSLZlvfV7wxLy1pGKJCuSsKy387jfDvbwRnCoj/0OrvkqISmqKtvmzge0ccVsdS5hWZYtyfLgT5IiC8s8Lwq7J5PC6WRIti3LNH5erIhEvt5qFJNSIRlPVyynzmXLoXDAKmULdUsIq57PZKtvWCM6l2WYr50t1uVUUW/V8lErF0/0hothbMu0LNNW4pl8YSUZsouJWKp4oQdi7Wpac7kOXftnRXUhvxBVhN1tgEHNJVmW7G4dLzRGXSTLNC0pEHLIht7GuGRVcwtFEVuIB/YhAd5exa0AGNVcg8WN4kKmrqVSYUXYpmm\+VimZ4WzFaJYW1EoyniqatkPUSWo0JNdz2ZJhC9uo5BaKZ9\+wDcd4GV74iO2wLNuy5GgmX1hZCEuVVCyRNy4wKpmFmOJyHTqaNmO5fFKTbHvUftkVXQAAoOcgJcBmNV\+xw8lo/0qAUUgmslZ8ZaPZam6spuRiIpGr20JSY5n8glpJqC7XoVDG0sJ\+WRKSpCZKlq0XUrFoNJ7KFfJJtV4o6bYwSwsLFSW1EB96VGjV84looqRmcqmQvP3jQsHUEoPDPbOUSizo4eVyo9WsrS1q1XQ8XbF6B2C6lk5fHQcgjo0wNnZc2MGV5NC5HNhmKR2LZqxkLhdThRDCFpI3mk4nQqoSiKayac0cdW1fCiSzuYSUj77P5XpfNC/CIZ8sRmVrttsfT6fjmqposYVsUtVH9BQ5nNVtq5JNRKOxRCZfyEStSuFCb5KTtGRufXVpblqupKKJ/IhuOHqMugSSGLnJe2PrxVQsnpPT\+YXwfg5zuwLgAsxqNhFN1cO9q8e2EMITSi4kwwFFDScymahdKTi/tkuJLuQzIT0VOOQ6pKXqgXDQO6LtLrFwSUtXLaueS0ajsUQ6X8jGpWqhdIEMWIlmCmvLizMBMxuPprbesea0iouNLgAAxs0BSoDNarEqRRMhZdv/RXQhnQipihqKpxfiil6s6LYQkhpOFaqG3el0rGomLGxJUXbegyarmiJZuvlaJbNQUlL967U7VlnJxKJpPZwr5c\+/smHVixU7FB9cErbqxYoVSi0kwgFF1WKphWTArBR1yywtLNS1dGbH8ZokyeddYbUt05Zk5bBHlYW1dZXBtkxbyM53hL9t/UY4N7w\+78At11cby6galqzuuscQl92uziXJ3St4gyVs0xJyr\+faej4ZjhelVKGY7j5KIEmyLEmDy5WSrKqybVq2Q\+eSJCEFYpli3ex0Oh2zlNK644JT9SRFkSWpX7qsBFRpxAXAHd\+VVVWxTfNCi0tqKBpPZQulfEKu5ku6kGXJNrf1f8uyZVk\+N2qMujSSosp2vWpYw/\+6h3HJqufi0WRFXSjmk/2HPvbD7gAQ0vDm6saLUUzFYlkrUShle8O0JHcDpretsqLKwjLtQ45Rp4SS\+Ur3Z6Sei8m2kJ0fzxle\+MXevSOrmiLMC4aXHAjHkul8qZjVzGK\+akkjfy92RhcZMAAAPQcnAbb0Ul1sPfAlhDj/Dl1JCKl7fcM2KoVi/\+S7WS1U7UA0JNt6IZ3MDKatsIy6aUvKv3u9VPnxa88/euyQy\+VyXfuZ7/z87Fc/ciiQqljC1vPJRE7OVCrZ2I6EydarVUuNbl21sntXFgeLSUIISbxRL1Z\+/vPvfO5Dh1wu16GjX3j\+tZcePSqHMoYaCkhGpX\+1ytIruq2GAoqqBWSzXh9MzlGtmoqmvYNP1Q1vBNkbGFof2aGUA8uu5xcK5tZN9LhShnYuJRBQrHq9d6Rum/WKIQc0RRLCqqTjaT1arBS3XSpWtJBq6/1krvuspyJLslMwW3qp0L9CbBuVQl3Soo4xLqlaQLZ0vdcXLVM3bMk5/zEr2WRqcJXNtgzDFCPOIJnFpKYltm6RlSQhbFvIgZBi65XBNDx6RZfU8L9vOY5Rl0zWYiHFKGSL29Mh2ygmw9F0xXJouhHjklFMxTNWqljJ72\+fGhoAw5tLlYWw6tlEshTIVYrp8GD4lNWQKozqYB4607CEosg\+h6izzWqx0J9vyaoXK5YaDTmeOXMo3Glxq5pLJbfN2mTUzRHptVXPRgPhzOAOfKkbL5LDfrGGRxcAAOi7qt4C3dMa8hbodmNp0nfee5jbjZUpnzfSnfmk3ViZ9nu7r4Td3JgPenyRxXKjtjY/6XH7plebne40Fd2pV1rNjZXZoMcb2fmi49bqtH/wFuiVKb9/ZvjsEbvf\+Nlam/F7J\+bWW\+1Op91cmw16d70RtN1YjvjOmwbJP7NSa7Ua6/ODKVk2N\+YnPL6p5Y1mq1leGszg1C\+h9rbfAu3UCA71udpdwjRIjfLKfMTn9vbme8E\+G/0W6OGdqztTUXdCmo2Vwcwzm\+X5Cd/k0q7XPbcbK1M\+X2RxvdFqrC9GvJ7eRDUOwdybHGa53NhYnQ163P7zeuiuzrVZW5z0\+qeWys1WY21\+wuuNbI\+cHWNUd56aibnV/txrO2ZN29zxFujGcsTrDs70HpnozmuzsdlpN1en\+/P61FZng97dc69tG6McXGgapLUZnxBu/9T80uraenl9dWk66Hb3VnRp41JrbSa4443Sezdy8jaHABjeXO3a0qRvYsgbmXuj9Gqt1dxY3jb51tCo6089tFZrrC9O\+YTn/FeC7/qRGl741ibseA34ypTPE5xZLje7kyx5fNPb3lff3vkW6PW5oNsbmV\+rNVuN3uKrTaf94hRde2h5AACufgd9GqR2bWnCfX5\+PpgHc7M8t3Nu3U6nVV6ejfi9biE8vonpxbX\+Xzc3liI\+IYRweydmlgfHTe3G2uJU0OsWwuOfnF3ZdTy17eCy3VyJeHacK/D0j1\+GToq0WVuZ6xbu9gWn5laHHK5vS4A7nc3ayrS/u7W\+qaXB4Um7uTo70V2zd3J\+vdVLl2d859fFPTFilqKRje/UCA71ubpdcMaX83dgcGb5gGzYwTdqWlfnztVurc9PerufTMx2T8Jsluf8O8/bBQdzsi71gzkyvz7IIByCubU\+P\+kRQgiPb3J2tdcTnTtXu7k\+H/F7hHB7g9NL5Va7M2qMam0sz072lp5a7Ndl96Z6IivNbhXnIsHB2LW\+beya6tbH7Z8eOUbtoeX77b\+\+OBXsVsvtm5iaWylv5V6XMC611qa9O/aLe3L3xFEXybnaowJgSHO1a4sTOxf39abc3aytzEz0Br\+5fgQMjbpOp9OurUz7hejt0d6sXSN\+pIYWPiIAVrsB4Pb6I3OrjU2HTe2ep2k31xdnJnzd8IrMrmz05xAb9nvhHF2X2PIAABwAe0iAXb976487DxZG\+uWrjVtvvfWCi508efKhhx66pJLxThmfxh\+fLT1w2DVXygFt\+QNa7XcBWh4AcKCdOXPm\+g8fvaSvHJxngAEAAAAAeBtIgAEAAAAAY4EEGAAAAAAwFkiAAQAAAABjgQQYAAAAADAWSIABAAAAAGNhH6dB2muVAADAZcI0SACAg2sP0yD9yT5VhR9UAAAAAMBVhVugAQAAAABjgQQYAAAAADAWSIABAAAAAGOBBBgAAAAAMBZIgAEAAAAAY4EEGAAAAAAwFkiAAQAAAABjgQQYAAAAADAWSIABAAAAAGOBBBgAAAAAMBZIgAEAAAAAY4EEGAAAAAAwFkiAAQAAAABjgQQYAAAAADAWSIABAAAAAGPh6k6A7XompISzun2lKwIAAAAAOOj2LwG2jVKhNDp1tc1KoVi39q0K7yRbLyQ1yRVIVcnGAQAAAOAg2rcE2DaK2UxBt0YtY1aymVzduuozStsopqKxrCErHulK1wUAAAAAsDf7kwDb9Uz46KPPn/3WJ6\+VYwVDCFsvpqIBRXK5ZDUUy5QMWxj5qPaZ/3X2\+c99SA5ndds2ipl4KCBLLlkNJXJVc1ThITWcSsUCshrLDy3crmdCajTXvf5sFuOKS02WrO6Xs2E1nNVts5JNhDVFkmQ1FEt112cbuaiiJoq71m1L4YVSKRtXyX8BAAAA4KDanwRY0tLF9Rm/b3qtZRXjqlVdSCSKUrKgt1qVjGZkEqmCriQKxbmgL7LStCop1SgkUzk7ka8bzdJCoJ6Op3enodtY9YoRylar\+eGFG0ooJBsV3RJCWHrFkP2SXtctIYSpV0wlFJLr2XTWiGYqpqmXFkJ6NpmpWEKSQ4l0OhaQd25OIBoLk/wCAAAAwIF2OV6CZdXzRUNLLSTDqqJo8YWFqFQtVI3tdz5LgXihUsknQqqihuLppCbqVcMaUaasJRPRgCJLwwu31LAmjIphCduo6lI4ERLVumkLU68YkhYOCMs0bSEpiiwrgWi6pNezYVkIWYunkrEAqS4AAAAAvPtclgTYMG1ZDSi9vFJWNUWY\+o5Hfy29lIlpiuRyuQ4d/cJLr9n2qEeDJSWgyKMKl7VwwNKrpmXWq1YgGo0qVlW3LKNStwNRTVZCqXTYXAhr4XgqW6jUjav\+OWQAAAAAwNtzGRJg296RzA5JNs1CKp6uqqlCvdXutBvLk76LvArrWLiihRWzWterFVMNaWogJBnVul6tW4GoJgsha8mCbuqlhZhSzyVCWjRzQN5GDQAAAADYm8uQAEuKqsqWMbjkaxl1UyiDa7bdj6q6rSXTiXBAkYSlVwzzIi/JOhYuqaGQZJSKJV0OaYqsagG7WipWTCWsKZIQtmmYtqQEwvF0vlTKaHqxxFVgAAAAAHg327cEWJIkYVumaVqWpMXCcj27kKsYplHNpzMlEYqHFam7iG5Ylu1SJNus6pYtrHohkzclybYubnok2aFwIathza4UKnZAUyUhqyHVLBXrUiikSsLWC8lwOFnQbSGErVcrhqSosiSseiGbK46evBgAAAAAcCDtWwIsa/Go8vwXjgXiBUOOZov5mJWLBa79UHTBCGWL\+YQqCSkQjwf0r/6ZGs2LT6bjUuGT1x5yvS9e1BZy2YRaioeT//SHC69IGV64EEogrFqv2WpIlYUQihaSjZ8LLazKQkiBeDaXsHMxVXK5Dh1LmdFMJqYK26rmM5nizsmLrUoq0Hs0\+Y2z//0jh1wuVyBVsXZWBAAAAABwNXP97q0/XtIXfvlq49Zbb92n2gAAAAAAcDHOnDlz/YePXtJXLsdboAEAAAAAuOJIgAEAAAAAY4EEGAAAAAAwFkiAAQAAAABjgQQYAAAAADAWSIABAAAAAGOBBBgAAAAAMBZIgAEAAAAAY4EEGAAAAAAwFkiAAQAAAABjgQQYAAAAADAWSIABAAAAAGOBBBgAAAAAMBZIgAEAAAAAY4EEGAAAAAAwFkiAAQAAAABjgQQYAAAAADAWSIABAAAAAGOBBBgAAAAAMBZIgAEAAAAAY4EEGAAAAAAwFkiAAQAAAABjgQQYAAAAADAWSIABAAAAAGOBBBgAAAAAMBZIgAEAAAAAY4EEGAAAAAAwFkiAAQAAAABj4U/28J0zZ8684/UAAAAAAGBfuX731h\+vdB0AAAAAANh33AINAAAAABgLJMAAAAAAgLFAAgwAAAAAGAskwAAAAACAsUACDAAAAAAYCyTAAAAAAICxQAIMAAAAABgLJMAAAAAAgLFAAgwAAAAAGAskwAAAAACAsUACDAAAAAAYCyTAAAAAAICxQAIMAAAAABgLJMAAAAAAgLFAAgwAAAAAGAskwAAAAACAsUACDAAAAAAYCyTAAAAAAICxQAIMAAAAABgLJMAAAAAAgLFAAgwAAAAAGAskwAAAAACAsfD/AeuDXzjL3spsAAAAAElFTkSuQmCC)

*圖 4\-4 退款交易報表查詢（商家與時間類型欄位已隱藏）*

### 4\.4\.1 畫面元素

與 4\.3\.1 相同，差異如下：

__畫面元素__

__定位（id / name）__

__型態__

__預設值 / 初始狀態__

__說明__

頁面標題

\#title

文字

退款交易報表查詢

由 JS 在載入時改寫

報表類型

\#type

hidden

refund

商家 / 時間類型

\#transOnly

區塊

隱藏（display:none）

元素仍在 DOM 中，值（E000001、tx）仍會隨查詢送到 Portal，但 Portal 轉呼叫退款 API 時不帶這兩個參數

### 4\.4\.2 需求條文

__編號__

__需求描述__

P\-RFD\-01

type=refund 時頁面標題為 退款交易報表查詢，商家與時間類型欄位隱藏；日期、小時、查詢按鈕、提示文字、結果區與交易報表相同。

P\-RFD\-02

查詢區間以退款時間 REFUND\_DATE 為準（from\+0000 ～ to\+5959）；無商家條件、無時間類型切換。

P\-RFD\-03

結果欄位固定 6 欄，依序：TXID、AMOUNT（退款金額）、REFUND\_STATUS、REFUND\_DATE、MEMO（原交易的 OLS CorrelationId）、AUTH\_DT（原交易授權時間）。後兩欄來自交易主檔。

P\-RFD\-04

結果依 REFUND\_DATE 升冪排序。

P\-RFD\-05

只列出能對應到交易主檔（MWP\_PAY\_TRANS\.TXID）的退款；退款表中若有找不到原交易的資料不會出現。

P\-RFD\-06

10 筆上限、total rows、查無資料、查詢中\.\.\.、錯誤顯示皆同交易報表（P\-COM\-20 ～ P\-COM\-28）。

P\-RFD\-07

REFUND\_STATUS 以代碼顯示（批次退款寫入為 D）；REFUND\_DATE 為 OLS 退款請求檔的時間戳轉成台灣時間 14 碼。

### 4\.4\.3 後端介面

端點

GET /sa/report/refund?from=<10碼>&to=<10碼>（多餘參數被忽略）

查詢語意

SELECT R\.TXID, R\.AMOUNT, R\.REFUND\_STATUS, R\.REFUND\_DATE, T\.MEMO, T\.AUTH\_DT FROM MWP\_PAY\_REFUND R, MWP\_PAY\_TRANS T WHERE R\.TXID=T\.TXID AND R\.REFUND\_DATE >= from||'0000' AND R\.REFUND\_DATE <= to||'5959' ORDER BY R\.REFUND\_DATE

回應 / 錯誤

同 4\.3\.4

## 4\.5 OLS 對帳結果查詢（recon）

路徑：GET /recon。資料端點：GET /recon/data（彙總）、GET /recon/detail（差異明細）。後端：/sa/report/reconDaily、/sa/report/reconMonthly、/sa/report/reconDailyDetail。使用者：SA。

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABQAAAAHdCAIAAADNaUNCAADn1klEQVR4nOz9fXgT15kw/t96H79IHsCCwRgQOI0VSEEuPI2SlFokV0HJrqmSukFdt0Fhk1R8W7rqPnTRLs\+XqvweWtFy7Wqb5oeaZoloQ6t0aaJCmwjnFxAhIZMsxIIEIxMEYzD2gGw8lvxy9P77Q/K7DTYNIYnvz5XrKhqdmTkzZ\+TOPfc5Z0Tz1/wrIIQQQgghhBBCn3fi210BhBBCCCGEEELok4ABMEIIIYQQQgihKQEDYIQQQgghhBBCUwIGwAghhBBCCCGEpgQMgBFCCCGEEEIITQkYACOEEEIIIYQQmhIwAEYIIYQQQgghNCVgAIzQIIU0q7jddUAIIYQQQgjdIhgAf85kF81LlUuHLJBm1NJxS3\+8FMrkhpXxKupj2Vh2kb77ma\+kVJNZRz0vvmFpSn2zu1So48/9MLp5YQYAADI1dZ1N/2/nGz8S3viR8MaPOv/np9f2LE8PDY8VVEZNZSew4dtwLACgUifWL0/ql5LaeZmhy8sXkvWLhx0IUKm6rxC9cnLbv04NVepU1bShZyar\+niuipuQqapMVinHbiYVlVEM\+zju448Jt/XESDOqj/dXeVMtOIK6LFmt/viO8eMiTdfoyappY1VMmqmalx56BSqkmUn9yiZOMf61AVS6al76E/szixBCCKG/Ef6f9t\+maMH2n3\+76l2P\+beXooNLqeoNG3bOfNv80/fCyU\+0Ogplav3amL61aN1LinAKADKr1kS3KgvW7c19BIBM9UPdm\+8euO/PqqZl1ClxOCYatqGkuH5/8Y7zk30\+ki1f2vNcZWajp4AlYxeoWhndszITGbE7yKqU2XB9ybq3JPH\+Rapp6QpZdtRaWYUyGz\+ufGS/LAojqcritZWK\+tPSSGqSFQcAgHhEtjfct/Mbvay7uD4GAKKGw8p8laSZurpo9YhjWRXbCoXm/ppULI09o5NvHDzVQyr2yR6LSp3YcDccuZaoXSrZRxLVzWL1CqJ6J9egWfX8RI1Ssu/04KlWFKRW3Zs40qRgYyKATE1d186F0EL62ygpanyreNPxwfK5A1GPW8NseUXfMyuze/cod7WKAEC9sHfPmqzrv3Jn9WOgUqaqyrIKyJ1SUfSalI2IALKLlvfaKrPRPlEcAPok9W9RLJXYvCZ\+ZK\+qYfSupemaumhdpDjXggo1ee5JEn5JtWWMy34SbT0BWf3XYjvLFOv2UOFUtmIxWV85\+IQiHCzYe148eKqp1Oa6HvXx4i0nR5z/YSbVgip1Uj99MJ5UKTMVZamKsmR1RSbyjuqRl2WRmzimW0ea0evj8auK\+s6R3ygK0rVruqtai57eL29JAUjTtXXRmrBq6J\+RSVGVkZ2PkooCAMiqlXDAU7Jb2bt5umJ3H9m\+AnY9X7yvUzTGWjMTW9emdruVBz6myxshhBBCt9TnOQBW3bna\+4vqRQOfE33hpsa93jf2fihM8PZIMXNBTZWUPfRRyycbx960eEy246WC59b1bF0ufZqVqCr7NleKdz8vH3KbLj7ymurIa/kPCmVip7U3ul\+1pelj6AsQj8m3/VcxPEZWlSnY8YPnlmCx\+eURIV\+m5rFY7bAQPa1SZsqh\+5VKUbSV2n1NFD5evG6/LArZqoeiW2X960nT69d215XlY0sFlSkvSO35Yd9A\+0ZbqS0vUY0TjVLE9a8Wb6vMNk7wRjYJQy6krGp6BvpE0WH7uj3HEk9lK5b3VoQlkJJAElQVpG6myNXZ3yJjXMwjH3\+wrxU/PTLizax6qKdWKYqkRACgKEhVLUxVFKS3r02G\+/KrKwoyilbFnqvpR8pEjZ2Z6pU95a3yve9IK\+5NqCJFEz2rY8jUrhO2V4haYqCalokeVW2J9e28F9iwJApZ9bxExUXlIy/LoiBqPF709HEAyFSviT5zd5ZlM9Ur\+vQzs\+V1XbUAABBtLtj0cn/UWpCpUoobDkuiACBN1zzcq58O5d\+IvtFfcsvLisGzfeO2njBlqvbuVPnM9Fa9dCMrrqhMlLcWP81K4pDVPxS1VWb2DQTAVHp9XaxOKd90XhKnUhvW9tTOHJoIFYXfKd70liQKMLEWzJ/MqhXdz\+ggfFUc7RPFU6JonzgSkdYfle\+rlzRclEwu\+pWma77WY1ueKldlFUlROCzfe7iwP4DPViyMb1hJqivSahlEr0kbmhS7XqVYAkAld/4wWjt9yHb6xA1NlOtV6kinSFVGtn4tBTFRbiPlZcmqOZn4mpjq4sDhZNVK0dtvyFNfTCg6JfGZcduaZEOwoD6VqC0Ts6\+Lby76BYB4TLb7JTkbESvU5Lm1KTYibumUw8PR5/oUO/YWsgWpqpSsIQYA2YrF8WqQ7c09RUoBJPvPP5WuXZ6MnFYcGStURgghhNCnwec5AAYA6O7c98tdm97tBhlVcfeiujUPbt6kjG95ce/lidy6StV33m8zdm5669MeACuUyc1riLpPHAUAyLa0StS6bq9OFIVsvFO8aEXvdgCFNKsC6e791JDcbEb/lb6qa9TT4ZuMfhXTElvX9o7R8fIbXW9JAVK5W1iINBVu2i9v6f\+yXNf9SsVYGeDW3L9zIXq2amVsq7IgHyiuTIAMxpCS7N5bsrv/U8Xy6HOLFU/fZF4OAACIdN/JwVpVrYy\+eq8oX8Np2cbTAACqMrJ1ZQr6QDUvXQFka0FcUQAtx6lwWTbaLBke2N\+eY4l3yne9E9\+qyyj6ACCrnpltPKocnUADAJCm6x7tqVFmK6alVWtiq4h825/kIMtULO/bPk8Uz102KemuV6kGIq5/TVkPAAAKdXynJQ5EFFdl9JXJ6OGiHUcHH7Ko1ckjKQmcBgARJMXxsvj6eaJwOLnh0YFfUbZ8XlJ1UmU\+PPFMnajxsHLdUXH12q4NAAAQaaZ2vCxvgax\+TXrrYLFM9UPdG8qy5WVw4I\+F4YqePfdm4lcV29zFrJI8t66v5bSspb\+eKnWiPCatr\+x5Zia1T9q39e5sNFy40VPQqCR7nuyLnJaFU5Nq6wnKVi3v1ccKn341s2FN9\+ZOJTtOOQWVWr82tl4p37KnsD4GANJde0p2jS43iRYcPJnh40XmsfodTA6V2mCJbq6AxqDC1SSLQGbRwvgGS5f\+VdVGVqJa2PvckwSaCnc8L2c7s1W6PtvXep4pED/ykrwFAFKi8CHVI69JowAgzegXx9c/3PvMWpH5eaqxldq0J7eDTPVDsZ1KUbQPyuckq4nE9WrBvov98a00UyWXR/IdK0SRWLZ6FVHHpGp97/aBc1iQ0pdJdriLJ5ibLa/s3flQ5sDe4iPzE6pWio1BHGS7g9JypTRa2e1dmW74k2rTSUkcsuWVpDY1rBtFfo\+ydPXyeMtFxZExf24IIYQQ\+hSYdACsWHCf98f3hA\+dVd\+9oHymUnH1/K7n/7z3LAGQVtzz4NbHv6wvL4DuCHvQv\+UPH6lqntzzYNvGLX9mBVDfs/bVf7sz/P/dte5ge1xWuv7HT9Vd3mfe9dFgwoFesH27uarpVHjBklULldB5cd/z\+7a91R4HUMy5y/b4gzV3l5XL\+8Ifvu96/o0Dwuyt//fbqy7se\+SXZyIAuV7Hz9x59un/81e2Z6x6J0m44f0dAlX1fx9cVUnvu9wO9IK6J/9uwz1lankycv7CPq/P9a4AC77q/fGyyPudFffMzYT4WcsXqAC8v1\+017Fry1ll7eOr19\+zYNE0iJz/aPdv/7K7YaKZ5Pypoxesf3J1bdXsCnkqfOFC/X6/6632OFBVq/9u85o7q8qV0Hmx/k8Ht/kvRCYZb8djsm17hwRV0nRdXbQmrNr41nj36JlVj3ZtL5MeaZUe6UzXrRk4ZdmKymT01ZKNJyeURYl3yre45bk9rq/r1jcVb2Lz\+bQNT0ZrYwUbX1KMzlhePwOsoNL6\+RkFZMvLMippqroyGwdQKbOK/FfpqulZuDYYPyuUya11PXoljM6axlupLX8aet9/XfkMW0alzLbUl5jfEo3XBTraSm3aCwDZqofSaqC2vSaL5nLpZVmVtG/rTBFAtnwmHNlftPda5rYci3peYtVMcUunON6XqQAZ25qFMrJ1XWrRzKwCsgplphzSr1SKG48WbzqeLZ\+Zjp6mGqcnG5vEq5anVTKApLjxeMGWMfOH0ox\+ee/mFenwYdUmae/2Svm2o6KalT2v6PsOvF7kOi6NAERToFJCNAYKKgN9UL2SQLB442tDWzxbvSa6YWLNMkBVlqquFFUpAa4NVqaqIlU9LQNXB86hOHxeol5B4qzK1Zra/I9p9iUVW9m9eU1fw7Q\+dbh40\+nB8GnVvUnF\+aLItJ5FZX2bZ2b3eVTxFd3PWNJhZRLY4m2nxXGA\+ITbenfrhDJ\+CnXcps8eeVlR3yQK9yXVnSLV4kzV16Kvrsh3iY\+\+k69ezTe6a6HgabdcsTz2ynz5\+Mn/SbYgiACyFcu7X6kcXeGsalo28rrKfFg6gdg4u0jXu6FCdODFXEwIAADHFfvO99jK0uVSsaIspY7Jt7xckAs\+Ww4XNzQnVinHetaWErMnCyKy5Ctr4vppisaICABU6oRtTW81KLY8L61e2xt/vaihjGxYJ6y/WLBjP1XfKYIUQEFGBaIogEoK0ZlkfZnU9bxy35DIUzEt/lzdJP6Yho8Xb1JGn7F01VyT79gjjwAAiBreKmy0RnfOV2xxK/flW1kE4zyWigPcdP4ZIYQQQp\+Mm8oAF6lX3X124073kU66dtNTWx//EvuTY9HK1c/8YEn04J/NP21V3H3/5sdrd3Y\+//2zl6Jr5lZNk7KCtOJuNXSm1F8sUx9qj0wr089MNfojw7rbJQFAueieBQ27XnzwLFR94\+\+2P/n3jRde3HuVrnncVDft1Kb/82K46M4N/7h6\+4bO8E/eP3A0UmtcUjXzo/qrKaBnr7q7uOXdxsYxo9/RZPSqJ2s339m246fe\+qvTap402Tb8fbjFewBSIKOryi/u\+Mku9ipRr7HsuefC0//yV7ZHuuhR89Z7YNd/up\+\+WrzqcdPmf/r7yBbvPmHiZ41atGb1\+gWdO37mPdJSUPXA6q2PG8MXvPXTHtz\+\+MIWr/fhd0mFcfX2x2s3X9216d3uiW93iP7xvdJMxfRstCz6Sj57CS0fFm16bejQPlE8JQ6fLtwyIgUnTdfVpfWpSd7DSTM1j0Zt02SbTvfH2ynJ3v0Fi\+p69jyZ2bS34Mjw9Ev58tj/6CASGxpjD2aAFcr0oqV9dWWS3a8X7ihIbniMxE9SDRQAAZBlVn2lr4ooXEMC\+3hMtsVN5/79N2WASS7Dlql5LFbXX6shGWCApPhIbuiyNLNK31c9EwCkjZDY/GgiflXWoCQVrYVbjorVKUmjsu\+ZaeKGqyLFtNtzLJGLir0FyT0PwY7/KqpPJrc/2as4rtyU7\+WerfpKbOv0XDoaQDrW1mWZRf35QwCATtneo/KwNFW7qrducRouFux4vuhIp6hCDwoQRS4qtvyXfNfC\+OY10VeWFj69hwr3iVtiGRVk40QMM\+M1Shmb6nn1\+xK2VaQqS1ZcLH5k/8fW8URdSfRAuVhpFEAxLbF9bW\+VMqtIQbk\+9oY\+Gz2ueuS4DK5Sddbe2pji6T1DuiEs7t2sS0daIQ6iaGvBxr3SSCpbNU1a\+/V4dVKyr79T98TbekLVlabrvtFbPR1a1kTfAIjHZK6XpJASN7w\+pAt0rmRKvG8vvQ9AXdmzZ2W6cb900ZqunRWj5mFKio/8lRrj1zpWCw6Jn8fLAGdq67rqRi4c71iyVYtTissFu5uG/g0RNR4vfhoAANQRSVSZWL8yEa6XNxIAELWcV\+Q7OIzZ/lIAEMVTUFHZZ1tJqpSSI/XKR05KolSyGgD6JAcOFx94J12zsmfr9\+PVf1RtaxJFOsVqZRZAFE1lq7\+SinworbV21oTlLZDWV8But2rfBI9lSP3DzdIIpBWp9IYnBVv/0shVWXhesrosU996c2l/hBBCCH2K3NSdaKKv4Y132aspAKGxqRMeVJcXUbDizvKr76/706mGHoDLb7gWLnxmxRdmnjjf0LOoakGxoqWgagE0HD2rrpxbLm\+Mz1lQAZHdF0aHecnIh2/uevdSSxIi\+9\+vvSefrT2w6zcN8u7wVQLw/i7/kupvLKyY9l59w6nGNdW1dxcfOSQoyhfpiyL1bNv17k6KZtd84/5FyUvbmgSYuaT2bqrhT2/sbWiPQ/vu37676v/eX1NJH7wAAKnw0WMHzrbHgRoyv2iq8eC\+R95NtVzujgPs\+9Op2h8vqppJTSYAlqpopQoi0avdEUGof9lT/zIAAFx94\+l/eTd\+tT2ShPD\+t6vvMVdVTlO9231zt1mq6dnIUeXT7NBb0uwifWz0rXMcsotWRl9dProrMrDHJ77DrLosuf5rPTVK\+Y63xPrFqQZWGgEAZXLzmnj8cPG\+pd3P/GNm438V9cfAokiz4sjFvuppI3I12UWL44tiojhAPCLf/ToserJ3ERQ0qvvUrQUbX1XAikTN0r7NUkm8U9oImerFqUZWFoHMqoe6bUMm9Bo9bhaSoka2eBN7U5PiJEUNbxXuapY0npdEILtoec/2lX365qIjRBSVpasq\+vebFDVelalAsrteBnd310HhtrBs135pQwrg9h1LS7hgd2ds/fJkHPr0McXGsBikaf08aLzhxGZJgKQ4HCzYMnJHopZmasthabyyd/s6slWWVSgz5dL\+GiZFjazKHJS0pEAx5I9KpKnokeNQvSZa1Vq45bB40VdiW6fDzYm2So80iUEHegAAUFf07XxSFL0mCfel1j/cF/1TAdsp3\+SWA5Xcbo3WpOQsZFrC2drHutbfnW4JUnuVia3/GNWz1L7TshZlfOeaRPxa/hGMoiBbpeutXRHXSyUHDhWGIb3qa13/87C44cPCLS/LJ9rWE6AoyEBzoXmvXP1QrPZiLujNrAJQlSVXVabjABUzs4qrg\+VVarLzsTicVG47KVFcLG54VRwmIoBMzWPRuojy6cNixbSMKpmtHbGbcVvw45UtV0I0ImkZp1dCpKlw037Y\+rXYqysgclXa0KTY946iPjL2kwLFtIRtRRJaixpiomiBpL5etS2SWf9Y9yursgDZ8pmZeJ1QnRIBQPyabJu7mO0Ux2FwOHS8T7Lrv0ri0\+LPVWT3vVZ0ABI7102w48dQGb2\+d/vDieg7ynWvjZwJrHxxzzOPdnkrC7f9iWIJRK9J4N6eV34EAADSTMX07FZr0pYbid0n3dU3\+Z0jhBBC6JNyc6kYEhFI/tYqmYrLpApZsWpmsWph9Su/HzJR7pXZ5clTbAtsqFSrmpRVRd3s\+xeq7v7SoplU/IuzVUJjQ2dx7Y837vxSAQBAy9tmRyNAKnI1Fk0CAMR7YtGEtLy8AECqKr9zg/n\+VZXTVHIAAOhuVADEW84euFBtW7Gw/Gij\+p4FqqunDlweddNTPK323/5t8Aax\+/zuX/r2XU4p7larZaShJZbvX9oTaemRVpQXKC4AAIlcjY2\+cVQUqVd968G6qnnlxbkFnY3ySZ207gb/20cqVz/zH/MaGs7Ws2fZDy80CimQF1cZ/37DigWLpuX7MDe\+O6nNjpDR57tTDsgqqKzi4qiCSVHjYeW6MTLA3VUTTzkqUxseIurTxebjsujMvj2PkarTxfUxKJ8Xr1bD7mbZ7mDJkXkwZPajrGp6sqoio\+pLbXhSGNUJltR8WLTpNWmFjlQp0\+V1XTWyLEQzWx\+F3TGIE7F6XirCFrDTyIbF6b3HZZGUuP41Vf1rAAAKKrnZ0q0PF2\+RklW50EKaqSrLhi/\+TRkbhTq5Xt9dcVVRT1KrykQH/lTMEgAQsYdVDx8eUVYOkK0CUFAQuSgP9x9v1e04lv6u1FnFvOieAlFLZ\+YZa2rvq/KKVX21R4v3XnfF9Wuyqop0\+fSePTqIXM3tMasqEB2pL9x3UgKQraIycL5o\+MzV2eo10Q0FoggZLxGaLV/cu32aSFWWVo2\+FG9KtFXaokxFjxfskvXtWQnx/EWb1d/bWzMT4mGZ6/Xs5rW9i5oVO/4E1RXivXsK91bEa5cmqq9Kd51XbPkv6SJ9Tx0AQBYKkvqKbGO9akuTWP\+NaE2z0vyzwop5qUUFkpaUKDrRtr6xeEzKdpKd1j71tIyqMvqqXtzwVtERKSgKUusfyrCHqQa2aEf\+nIOqjOys69UXQMM1cRxE0c6R01PlFw7P4d\+gBfPx53W7QLdO9HBuNAeYmGWLH2aL1OrUqnv71ut7nlvR0xIsfvolRSMASLMVD3SdemDI1i4rdvxJ0ZgCaJUfAABlWl0g2v18yd5RXZoVRDzOrrOgTNY\+1KOHdJUSGiZ6HPl1q1bGnluZrd\+v2ivtfXVbdzzWnz\+HrEqZbdxfsu5X8lp9WiEDIKKGt5QPv5X/WlXWt\+ex9O7/muhIY4QQQgjdXjcVAI89qCoV/eAv5p8caxz2rXTRh52KFQsXLSguT7Y1XGgDgdLfORsWKCNNl1p6u1t2Pf8ILQUA6Ols7FXXAIx\+16J85qKtP1itv3psy5YTRy4I6ge\+7f1WrhrCkaOXNjy\+RL8gVnG3Mnzoo/Do/s/dfezBv\+5u6gNIRTs7Gy\+056JrBUjHfaljcqwOwLLS2g1m25wLrl/uOvBhW3TOfXt\+fM/4J2hs0bPHnv7ee\+oFX1i1Ykntk9/enDi18f8cjHyldruxoP63L246eiEMc7du/3bVZLc7jJjNd6cckMsAjz6i7KJ7x84AHxlvWp7RYrJt/9U/9viqvJ5E6xanjxwX6XVJOF9UHxEBSNjz/YWl6VVf69m6PHvEQ7uuJnc\+2Rd/XbXxuGhVXZetr9j8slSdz1SL2MOqrxzOLtLHts\+jnv6jPALZqpWJ\+FVZfUFaH5OEpRBplQx99Y5CmbTVxWqlBU\+/qmicnl21hlSH5RUPd2\+YKd/kLvpbXr0Tb6U2vibfUBfboBXt85S4zovjAIppyTp9oqIAVMpUuVQS7hTFU2L2HepABBRUtrwspZZK\+2/Qb8\+xDHSlrlga21mp2PjHfNdf1avp5x7trbmYHXcEY0y2\+zWqqi5d8U5BeHkfsIW7rmZq9KnISQXbv\+t4CspHhk9ZhTLbUt//STb4K1ZQADEAELWc/hszwNlFK2OvLM/NAp2rhiQcS\+qnZ8uVabiWn9pKNY9s1kM9K1s0DeKt8t3HU3Vlaf3yVHWZSAGpCED0dMHe82IACLeKy/NbFkGfJK6Mr1rVvWpVVjUto1qY6/cuCr9THJiWXD/Rtp4IUePxYvPxbPWjsdpIwd5mScNFUdU8iIQV9WV9FTEpG0ttXRur2q/cHUttfqxPdbxod2XvpP4gTKAFswDixneK1r02eqBvpvqhnprBwO\+6UqJIDFTqZAUlj1wv2yqKRGR798v27s/oV8ae\+xqpKZM3XgVIQcuHRTtYcRxAvbhvsw72vly0d2h\+OCmCgpTN2rk\+NWShNKNOyfuf4GT7\+xpkFVJQSSECIojJbjYDLGo4qnrwqCiSgvKl4pYg9fTL8v4nDpmax2KrkqJop2z3azLIRbx1qb3Dxxv3yy7Sx55bLF\+3h7r5qfgQQgghdCt9TIPxkt2Rq0RRNbu8CBoFAADVzFJ1QggLqZamSxHj7FX6Ymh5o6WnU9GSqv3SouqZqUZ/JAopuNrWMNDlr0gNIFWXq9WyC9EkKIqUankq2tKnmLmookio/9ORA2cJQLG\+Uq2GNgAASEU\+PNGQMNUYv6Qqiuz7MDLWfRtpaTpbP2pIbbwzEgGqopxSNHTHAVS0urwoFWnpG/fOr2ha1RxofOvI7ncvxUFaUb6wQg4Tz/zk5M/JhTN7L5zZd/S\+PT\+\+f9UdJWzltPiHb\+zyfxROgmLB3EUzP6F5uRUwbgZYf3NVSEkOvCOrW9VbG5PWqKW79spahnypUCa3ruvW98l3uAvrY\+n1dX3qcNHGoERRRurKxPv2SiMAuQ7nxerE5nuTKmlWNTNdoSSbH03GUwDKLPSJGpvEdSt6bVS24eXcvXu2vCxVvbxvw/KUIgnR85IWAtFW\+e7W2DM/JNGmwk3PU3/ri2dlmYqytKK5cNvVuG1tl2K/astxSbRTtvt1cXVFRlWZ2qCUhDslR97JjXLMlE/PqGYmqqcpwv0T\+Wy4PceSWfVQb40SYHqqQpnd/FgCUtK9r1LsxYKn3ZmK5d1Vw6NQBYACsuVlacXAHwQiOXJatFVP1NNI7XTZltPyoS/aacm/xmlAtnpNdH3/vysW92yulO06LlFV9m5IFa7bL/1bM8BSGD0LNICooUlSu7xvPZVuyU3aJE3XPUwgWLy3lWyfBgDiI4eLj0B20VdiVYTatl\+m0sd2Lk7vPT0ykR7vk7pepnZMS1ZPE6nu7alpLnRdFLfkH0xIJtjWE5OpXRutixXuk2UW6bu3Lyx8eq8cIDcLlKRmVfeeaek4W7yjVRQH2bZf0QCZusoJbXdSLagqyMavjhnlio\+8pjwy0WMRN5yWxh9NrL\+bahicbStb9ZXY9rtl215UqFb01hDFtsMDfYnF4WZpNJVQSfPzNsevSo80SaMAEJaoZnZtWEOOPD/s/eHxmMz1knJ0Bjj/gUqvX9MLbMGRZLruIVK/R7Xvb8oAA6RE\+aoSUXRaYvOjySEZYFGEgGLIBFfxpCg\+dnwrwnmwEEIIoU\+5jyvcIo1Hz4Yf\+LLt8UsR76mw7M6tm/6uosG77rcXolfPNya\+tOruVOMfItEkaWnqVK1YpE6c33ZhzCf0MtXd99seiLg\+BP23qqugbVuTEJPH4lBcUa5WfRgpX/FgXTnEZcWqIgCA\+NVL\+xrIc8al8fd9R1om8bw9fvX8gbOprTXGuhZ/vaCu\+9b9i3oubWoSEsN6NaegOwWyYvVMWt2djSal5XPU5bK26IIvbXigOA5SVRE1bhp5jCMrXfWPT2wuOrVx5xusIK24c2G5rK\+hnUR7UqryuRXT3m\+BBeu/caeqBxR08SQ2O9IEu0BnFdJM1ZhjgKdlGyYxBniYltMFLl10Z12y/uWSfcOjgnhMtuN5Ok5EqnlkZ11fxcWijfvlYWlqw0N9qnDxvlYR9I/o647Id\+yX5xIp5fOoHS/nsqaxqmmilg\+phpXRmmvF21pFkHv507pYdZ9il6ekYX7PVjWANFs\+MxM5WnhgXnf5RVnDTbyKU5pVFWQUsqxCCiplpqqyx3aS2ndcXt\+qYMM9z6yJbb6m2nJeXKHr3foV8d7zAJBZtLSvVl287mV5RJmsVsp2BTPVd6f3HZZGAaK37VjE9a8V1wNULI2VVyp2/HFw8qfoyF7KoparUlUfVEizKqWYfYtq7INcyjEcpML6WE2sYKN72DRmioLRHWizCmU2ejjbHyGIop3SI6el5cp4zcz\+vfxNGeCsqgDiyRExmyhymmpYEa2VKjaeF8cByhf31Url2w5LI0ODRipdc3e6JSiJpEA11qYVkFUAAJVe/2h3baxgL4BCmdqwtk/9ofLp12QRgAm29cSI2ePSDY/11sSyKqlk9\+vyBgKrAACgJUwd0Edrm4ufPpx/shBPiSb253mSLUhlqpSicOvE0rzXFQ4W7VretXmt8Opiat9pWUsfqCvIhhXJyNGCcLdIHctUPxx7Zlrh7uOyhk6oWJioW0nK\+xRsRAyQHrahlGTv/oJV1r6tK6Xm/tnCFbKsalpydAa4HGSDU1ulxI1heX1fsvre3B//vyUDPKilqWDf4u5VF4ty02irF/btXCHZ2zw4ad\+NTx3mfhFCCKFPsY8t3xj58ODGnamtj6/2/sYEna3s0b9u\+sOFKAD0RNirUFfex17ojgNELl9qKVq6qOVCY\+eY9wh94XfPK9ZY3vh/ZPHOi/ue/8u\+y6m4rHHXW1965skNp56EaNORjbv\+Et5Qu/X/fjv\+Ly/uvdzdwJ5veaC4hT0/uVf1Jtv3/adX8eTfbfi3f94q72tpatyy868HLqcUC4YWSoU/bGz8hvEZ17x9P92960\+Nq/6p9o19tdB5dtvOPx954OvbNzy1U/SXid77JtsP/Jev4h8f3Pns/1teLAPoPLJn3\+6zHXF4m/3S3z/3m2WQ6DzwvHfTB9XPPGn2Jj2P7LpwU4NXJ9gFWlz/Mv3wabJ1Zar\+T8W5nocKNdlj7Y2fLtw7sRe6jJKtqEzUlmVABouWJvRNVH7O5LxM1b09tuXJCql0737VptMSRVl852M9\+ljhxldHzjczYPiDgGzF3Qk9JY6W9dl00i3HJdGYfMt/TI8TURyyVWWgUCbXr\+2rAsWO/dSOlwp3WqJ7ygq37VewsQkeTraikmx\+iJRHZOHK7ufUiiPnCze\+rKjvjzwbTxY/3JQBIlZMS2z4Srrh9cLGmd1xkO\+ol27\+Rrx6pjSynKibivYFM4vqemzNym3Dp5v6ZI9lFGmmvEDUMnr1lGTvH5WKafHnVoiP7FftjgBIc8FJtnwmHDmsWLQqqVcr2MEpu0UNh0uWjBwTe32ihqNFO0AcB1H4ZNE2qXiyF7ZCmdZPg0jnyJybYlpaTUEc0lVlmfomccvJokeaIEpE5YNFsvp7e2oo\+ZagZOicSUNFO6VhSNet7V2vlG/5o1yxJh7vlG/7EzxTF3smpvr\+6cxNtPV1tDQVbvpjSq/vUROR/tHY9teKjwCANFO9PKUIFrSs7N0eKd5yfDID1yfZguUVRA/yba03\+ervEbve5SmJPtxtu5dsvptAUtQYVrh2Fe87L44DRNjiTbLe9Uv7ti/vUcsgek3S0FS07rDiSAyAGrmlaCu1rT6xZ1WPrUmVO5nxmHzjzyb3sCQek\+14WRqJAYB098tF0RjA6FeUT4iYDUo2PEz0TUVH\+jLV98ZVV4vCwwNqxfTEVmtnftarYZNgZRVURtE6ufkhEEIIIfRJmnQAHL9w7BHLsf5PqcYDz/\+vA/l/h989uO7dgyNXSAoHfvazA0NWN3/z2MgyQ7d/9f1NO/887P4vKdTv\+lXlrsEFR/7l/7Otv/7lM6epOs/uG\+uVvNGzBx\+uG1WfgR0JF3bv/NXu6x0dRM\+\+aa57s//TS1859NJg0Q9/deCXAADwxgfXOZxhG7/60Y6ffbRjxNKzx9ZZhp6QF78ybpVvTDGBDLBKma5amKzWkdrKTPh4UWN/UBSPUE\+7xRse7n3mR32NbNG2/MtLJkCaqaqMr1/ZV1MmOvKq6isnoebR7uf\+ta/xdMHed\+T153N386KWVvm\+eoptkqgq4lv/MV6jzbS8U7xuvzycApBm9PNSi\+aNesvLYNyYLdd1P1cp3bWnZB/En1nXtUetfPo12cCsSwplplybrviz8um3pBEAiCk2Pi/a/GjPcz/qq/9TyZaJvNZYmqlamoy\+pTIfl0SlGf3i\+PqVvZsfHjmsPH65cOP/DxRNRTuaxOXzQAEQjSg2Pi9b9XBsa5l8k0caIeA6mnjuGz11e4tHPEr4xI5FPS\+\+QZdSKdMVZakKyG59LBGJSdmT8paYCCCrnpmFvjED6WzuJbEqKl39UI/ieMEOtnAjIc\+s7fI2FW47JNF/vad25thh5IBoM7WrJZciBgWVjZ\+kACDaKc31R43GJI3SrILKlE/LDr7O9/qk6ZqHe/R98o0XRSplujwXO8myqrK\+nXWZ6FuqR64mtj8meE8Xb9ovDxMAyKqVWUgBKFN1K3s262Cfp4BNZcqV2fLpWRiZvhM1HC6KfqXb1lm0br9EVZasUWbiKYicL9j4R1ENJSqdmb65th5Htkrfu3VFooISN5yW72Pl9VehRp\+uXh5THS/e8qp8XwR21nW9urRgyx/zOdsRvwjVtFRVWbpqehbGnqrqui34qiJS1rfz4TT7p0L25vOjwxHJ3pdL9r481lcpcf3h4voxn5UQ2aZfjAhuRQ1vlSx5CwCgYmn3zpUplWysFQckxfV\+BShzKWJQU5JGAEiJG/OnRdzYmlVJs\+ppKZV04h2SsxVLe/p3nS2fmXnu\+4mWVLZ8ZjZ\+rdt7twhyvbL3FtW3FjyytWC8jSzSx55ZPNFdIoQQQuiT9wmNOL01qIp7qrd\+a27Lfs\+Rq9jnDEAKIBU1HFaue\+s6GeDMoq90b78bGj6kNu5XHBnesTYake/YI9\+7kGxeRapnyhov3uieXppe/2TX1oos9EmOBAvX7c1vcNeeaQfmxTes7Nu6oXcnQMv/qB75oyzcpAgDAGT009LqmGLbM4oDF/tjuYJU3dpYjVK6d4\+0PxssirQq9sXywXOkWbFrv\+RIk6wxBgAF61zyRSAe\+lrjRrbo6eMSNjKkm2KnfNt/yXdQGVVqAtEvAKQk\+/7Y/\+LQlJg9WcCeHO8eF\+o/zNQ81rV5pnT3fklcml6/LrqhQL5tL5WLK8InizYV9GxYmjrSmhsI/YkfC2QhKak/SjUMn2ELqOTOH0ZrC6S7nh\+Rhs0qpP2RrVQUaZXveqtwdy5J2FRg/pW09itpdTr3nuQb73rRVxItweKnX5aq9d1bZ478WjGv95UNpOKabNvrEzwWUSRMbamnjvRl1j8Z3ayW7nhd0hgr2nYtpY7J950Xx0FmvqjQTxO3pPoPUCne95IUZpKamRKXp3DveTEoE1ttsVUy6S6PdPBUp0TRpAhA1PCWcl1\+fGl31TVqU1gSB2hponYBABRsbJpUW9/oWDoljceLt7wz8HQpGz5dsO2oYu95cRwAWqmn/0OmHzpxunRYDKyYFt9uIeqrii2nR5y9CbQgla7QJVsOF7smnK\+\+LcInix85OYFyyuTOPumul5S7Y6ntllEBvTRbs07YroXGo8WNEx08L5rorq\+7kUZW9eDE5xFECCGE0CdONH/Nv97uOvQrWrD959\+uetdj/u2lCfQALF71g43PPahsOep7etd7jaPnf76dqOoNG3bOfNv80/fCk\+qY/RmknpZWpcThcbvmZsvVaXVKcjPDcT87FFRGQSbdsxd9FmFbI4QQQgh9pn2aAmCEEEIIIYQQQuiW\+VT3hUMIIYQQQgghhD4uGAAjhBBCCCGEEJoSMABGCCGEEEIIITQlYACMEEIIIYQQQmhKwAAYIYQQQgghhNCUgAEwQgghhBBCCKEpAQNghBBCCCGEEEJTAgbACCGEEEIIIYSmBAyAEUIIIYQQQghNCaJr0Z7bXQeEEEIIIYQQQuiWwwwwQgghhBBCCKEpAQNghBBCCCGEEEJTAgbACCGEEEIIIYSmBAyAEUIIIYQQQghNCRgAI4QQQgghhBCaEjAARgghhBBCCCE0JWAAjBBCCCGEEEJoSsAAGCGEEEIIIYTQlIABMEIIIYQQQgihKQEDYIQQQgghhBBCUwIGwAghhBBCCCGEpgQMgBFCCCGEEEIITQkYACOEEEIIIYQQmhIwAEYIIYQQQgghNCVgAIwQQgghhBBCaErAABghhBBCCCGE0JSAATBCCCGEEEIIoSkBA2CEEEIIIYQQQlMCBsAIIYQQQgghhKYEDIARQgghhBBCCE0JGAAjhBBCCCGEEJoSMABGCCGEEEIIITQlYACMEEIIIYQQQmhKwAAYIYQQQgghhNCUgAEwQgghhBBCCKEpAQNghBBCCCGEEEJTAgbACCGEEEIIIYSmBAyAEUIIIYQQQghNCRgAI4QQQgghhBCaEjAARgghhBBCCCE0JWAAjBBCCCGEEEJoSsAAGCGEEEIIIYTQlIAB8KdYInW7a4AQQgghhBBCnx/S212BiYo3v/vj3Y0xugiEnhlffehHK0qV8v7KC\+FfPnuoqfS\+LU8sLpMPlH/7ez8/1lq6zPkvDywpAgBy4dyVjuSIkFIqL5xROb9Ykf\+YiiekCjmMEIu0NLVD2bzysqLhX/S0n7rYk4DxwlSpvLCkcj6tGOfrePPbT2053DRvpddx/4JROwWhafv2Vy8sW\+N8tKI0/y1peudkk2zOfUvKS0eXRwghhBBCCCF0XZ/\+ADh14Z1Dv/S3f/He4qbw5fbZM6Cto6ys8Rf\+061LVm1bW1kmB0h2X2i\+cjzRHR\+xam\+8LQkKGQAACOFf//yVg70jty6v\+NorW\+7Jh81C03ZHPXfHfZueuGfJYKxLmg688tShVM2PNmxbSg1dN3bxvR9vf58bv\+ry8YLbHJlULgOQSceMkGNd7a1dPSf\+8oenuh55NhfYC817X3z9QHLhTxyPrSn79DccQgghhBBCCH263HQclWo9eWLvobMfnGv5oAtmzy5fctedNcal95flQ8T4ufrHHe\+dhZJ/2PLUj\+6ixthAD\+8/cOzAictN7V0dSSgumbHkrsraR\+9bWTaqcO\+V4\+Hm410lAJCLFVvPnOTaezRLKGUutpRJFQBy\+fBIUiYFADkMJHSlACCv\+Jp3yz0DEWlMaG/tpWbkP6YusO8dbO\+Rl0lLZUM3JJXLYGDXw0kBYMaSlVtWM0o5tL5Z/\+OjHV98oOa79xYrhPAvn3uvSTZwegX/z3/zr6dGRugAAOHX/27968MXSb68ZuV9mZ6yO2bIT3W0njn5wkuXNXctWd713uEumL1i2X0Tjn5j5w59b/uxD2DWxi3fWX\+HtPXkib0HG48181xXGmQKzew59z14/xMr5g/PJ6cu\+H9nfvFyAqD4rq/99kf3jB3AC\+HtW/6wr2vYshmls7647Ms/eHTpgqKxVvn45JLnH8CMjY4n7j/zh8dfugzzvvybLauW3OL9IoQQQgghhD7TbioAFpr3PvfyzlM9Awva2prb2poPHnrzvr9/7Cfm\+aU33EIPv/fnL\+wMpwFAXlikKUy1dnUcY48dO8P/ZMuI9KZ0gf6r3/T/7oW2LgBQyKQA0N3eA4Xz6x6coxxz4wmhKdzVHrkSS0Kit\+ODM\+EYPWNBIQBAouvKB2fCHXIAgHhPd2u7dMmKxYr\+g/q9/3JCNuu7jw72ox6oA4zVz1kug\+v3RB4Sk1MLVtz3xOz8GYu1Ne0/1ZUYWnL2wjVLSvsPRzpbde3Ym5c7QFo5bxZAT9OZnvZkEXemuRug\+\+h/f\+3oyB0t\+7b1WWPpyBA9wftfeveDJNy5etU376Daj7/8pKuxDQBAMru0BLq6uIvnuRfOf9D6rWe/UzF4JhPCsXf4XN26zzUeb1\+2YMLxdkf7lcDBAx\+0pX5jWzZu3vs6elp\+6fDslV03bT6StPKBr9W943nh4olfHlrybA0zXodzhBBCCCGEELqJALj77Zf27zzVAyC5U//Ajx5dXFkC7RebXthdf6AtfuwvL//yjqe2LS\+\+/ibibaf2h9MAJbW2J7bkCgvh7Y4/7Gs//4K/eeX6IfEYkOMH3n67P9PYcfFK/l/J9n0vHpKvriiVAwiX25OQEK6cOhNuLSoqSzZu337sg1yx9lM//sUpmP3lPT\+cA7L\+jwNkc36ypLKySApATvkP7W\+HO1c/sLLn0OPfu6zRz2g62Hh2SJ33/WLnvty/Cu/8958/tpLOn72OU4f/ecgmPzh04PuH8v8echaoynvvr7wXALpPvXHol2xXAqC4tATau7oBACDRdv5wYfEPvvPAmjvyK33TOOyMtR9/\+fFDUFzx5W2PVijlQ5e/uf0gP\+ZJjoXf//2ZdP\+TAuHtQ\+E2gOKKlb/dkgsvU03\+Pzz5YvMHh44dfnD\+wEOHeFvTwYtpAMlsWbotyQdOCWvKRoXWQ3xx7ZO/qWEUkGpvDu9/6dVnTvV0nHrv8MXFC\+4YK\+1/XbG2xrfbAOZNcrUipta4cP9z50\+88d7xFWvupye7W4QQQgghhNBUMfkAWLh88FQXAGhWPPrsdytzyV7lXcu2bSlWOP57X3vPsaPN7csXj52b7ZfoITEAAKmyqL8CdMUPtlj/AajSkuIR6yrLmCXzO7gzXWVLlqycTcW7mvezV7plVPzce/966r3Bcm3v/\+sv3gfZ/G3/z2wAgJKS2V1dbSUzNL0d3ECZ0iU/eWJogreorFQKALFzx3558Epi9pd\+8KDi8K9PftAlnaF\+YMuWZQlIQSJ14dCrPz2RMqxdU3eHFEAKsqJKGgAgN/3VdbpAXxisXCrW2nz4zdMH2dPH2tMgm1HzRI31jstbHa833fG1Zx\+VHvAe2hc\+9WPHqReWfPkHa7\+6sqR5q2P/MSguK5TGe7tbu4gC0h2gMCyfMyT6VZTNYzRCkeLgmOe4\+/gbTRzA7CVfuq9MColUrCcFAIoiqj\+alVY\+8MhvlxBlCV060AqQ4k6dbUqCfN4y613hHx/sOP5OuPWB0gnkY6Wl8yvr1rYHTh3\+ALrPRgjcQeXHb798\+nhbTzdIZs8uX/no135wL6MAgJ7w9i1/2NdeVPP0w5VsvfuM/GtViVfe6wIAuHj40fVvLvv2U88aSyHSvP/lN/edaDnbCzNml6988KvffWD\+qAnApGVLlt1Xcv5Ae9OBM8L999I3rCtCCCGEEEJoapp0ABxrC3/QBQAl9\+mHd3Wm569eUrLvUFfHuXCTsHj5dTciV88qk0FbsuOF7b9pWrF49bKKyvmzKtWlY4XNVOVXv/oPvZf9Z7rak7NqHl0aO/C7fQB36h9\+fv38fHnhtP1fXnl7/kMv/WhZmRzi5w7993gHOCIDDLM2bn9ifell96\+OnUgCtL3//X95HwA0Kx7dYqzoP7qU/AwFQErnzV8\+YjBzMpWA60nk32OUan1n/5PP5rofK5atWPWDtUuX0NJ462UASACUVizb8pOl/3D8zV\+/\+O7BUyf23rXovtUzVhuXlUbyq7efOX3gYhogHnjplcDg5otqf/TUE\+Ptu6fj\+LkeAEnlkjmlACCnysqKIdzVceq1xx3h1V\+tvO\+OOZXzSheUDc/VJ9qPv3M5AbDs3iX33QV3Huw4e7HxWNuyBfMndp3kpvVK5j6kLrzxx6deON8BEs1dd94PHW\+faf79s7/jur7z70ZGAVI5AEDPBwdePdiWmlFaUnrXotoOdl84DoVzalbMv\+8OSiGEt//8D/vaYMa8hauLOg6fad734u9bZU/9\+4OjutjTs\+6brzhwKn7qVEfsXvr6D18QQgghhBBCU9akA\+C40B0DAFmxRj1iXemM\+bQcuhLJ7ljyBhtRlC390bcv219s5JJdx44eO3b0GADIZy/87qMPfPNeZmQA09MNdywxljbvO/PmL1/uiB29kpDNun\+JpLW5pemNN5vuevgHd11nV8PG7g6bljnR3drWLS\+FuGxG3Q\+/s1Igreyh7Uc7EqV31n51TimkWpsvt/amIJG60EYAUu0Xm4/LpQBSZemcytyxJ1Lx63aBlgPEAQCkZcse\+NEDqcPqxbV3kV9vf23d0dcGVzgzZBKskoWbvnf/ymXlChCGntjSJQ/8\+1oazry59S/t93/vKee9xU0HXnj8pe7rHHa8i2/qAgB6QX5SseLljz78RPvLL5yJd1w8\+/sXz/4eAECxbMVXf7B22RJ6oP9z48GLADBr5ZLS0tJF989\+72zb5cNn2mvnT2BsbaL98IH3TiQBZPQXy4pBaPr1y\+c7AJat/c6zNeUKSDUd\+N3jL10\+duDNY/rHVvZPM8b1zv/3/1izUi0FSDWR0L7wFXnpnU\+svX\+BHGLnTsYKZ33xrvnf/d6q\+\+nuw7/a9c9s/BTb3LGidMbIfRcvmEfDqSsdrXx7YlgXcYQQQgghhBAaMPku0LIbF5lAGarywUe9y758\+Oj7gePNh8NdCYBE2/lnnr38Qe8TzgeHDTqNXTz2z/m3DcUDB98HAIArL7g8e0tKlF1dHeyrlT9cPP6OpAAAbe\+t\+xcAAOg6/Oj6wyNKaB74zm/Xz9f0Hvol25EAgPazO38FM/7lntZf/e6ZtsFigZf\+OwAAAHf\+veXZB4Frj4N88bYtg7se1gW6f2FHONwhK6mcV7py/WMrAUA4LZcBlC75ybeHT7UlNL/wwrFjJczyZfPL5AA93dyZ5uOR/ui9KLXswcVl7VKA\+MFnf3Xw2fzS653gZE8iCSCTzuifiVqhrvjBlo01J08fONr49qnms70AED9x9PWnznU8u\+Xh5TQApLh3wk0A8nkVy2dLQc4Yls164S9XPngn3PoAM14v6A8O/Pfj71CKJGlv72pLAoBk2aMPrZkvbT/edKoLAGatXJILnqWaJXdWvnT5g67Lh891r\+x/ZqFZtmz5yCcpeco77nf\+5P7\+T9SMEgognkikxppKG\+S0VA6Q6O2JJeEGU5MhhBBCCCGEpqpJB8AKmp4B0JHs5iIpGDY/cKqjWUgAQCFdOpEgGUBBlxtryo01AD1C05mmvS8dOtAWDxx47wP9w8uHBHfKeV/\+yZbFCUjFI6d/\+dyp1vxEUFJ5SUnizf/\+3l/O//J36RnXzzmX3LnRCAdeOts\+b2Fl\+/kPSpZsWVsJp97cfqh75dpVtUtmxE/W/7PrvQ\+SoLlrobL5/AddZ7e/WOr87pN/LS0to4cdY3ukPQbFrf4XnjrYNeauhmaA82QLf/bzfzCqcx\+kivFPzuBLm4rK6374RN2wL1MXAAAky1avsS6Rth6t/zE7xsTUAxLJXKBIKYftjlqwdNkPli77AaTaWy8ff\+PNnQebO9pOvnDiy198sFTRw7996koCANpObnWEFQDxrnYASIQbj7XdM24v6N6usxf7T4VsRs3amh8Zy5WQivWSGADIKGVh/ktFYbFSBpAksd6BmktmlBWNG64mhLcPHXrBH/6gPX79ruYAoChUyAESN\+qUjhBCCCGEEJrKJh0AK0vnV5a8d7ar6zDb/MTSysHhmP2TY82\+o0Jzg9explrPhU81C4nSitVLSxUAUERXLr/nB8nmY8\+e7egS2nuHZzeLiktlPa0DIa48V2eJsrB4waM1m8K/\+\+mZ5o5hUy4P0dsdSwIU0kvmSQNwNl5WWTu/4wR7pekcfHD0SgIk7VCikZ22u977IAkAEIv0zCidMftiR1tzeN/vTgbCPaO2KLnviaecxkd\+s7w/E5noPvzyq78Pp4fW2LB2Vd3ANMiyksqS4dtoGzEUuf/I\+oPVePPbTzkOfzAY1RfV/uipfwAAkJbeMWf50uKmi5ScvV4XaLks9wYmku\+O3sMfP3X5Qpe0Ur90CQ0A0tKy\+ca1X2s98/wzF9PtrQQA4m1nD14EAIBkz9mLQw/8ysFT4/aC7p8FegSpvJBSAHQnSay3/6BybQFSZeHgVTd\+z2py/KU/fP9gB5Qs3PS9eyoLc1ORjW6OgY3HEwAgk2L2FyGEEEIIITSeyXeBpufXrph18C9X2o7\+9/eSXxt4DdLvf1e/rx0AZtUa55fmx76OJ9X6Zv2/HuoC2Snue498d3muwzPhznV0AEAJXVY4vHjPlb2//t3vB3ojnzn2z2eOAShWf\+8p573Mmu99Z0n7FffPDxwfsv04ACQhAQDJng6AGWWzZhR1AABA8RLjl5exr//\+L1cAigzf/uY2Y7kyUWx9morTdKI1fPxMe9OZs21QUvu9b9ac\+kMgPDD5MwBA\+/FDPz7YDgBKdfnyXEa3h9//4qH94TQUzq9dQvaz7ZX6iviJs4ED7y//4SN1d42OylPxJMDssbtAH08OS3UWz7tzzV3FsXOnD4QHlk24C7SsRC4DSKY6kikAabzr8gvPvXYsCbPPEOcT\+UG/8fYrH7QDgKRsfrECyKnjTWcBYPaX9jgeXpLfNjm\+\+zdPHepqeqeRW81UTia4VJbNr5Q1Hku2H84HzynuVGMTAMiY5WXXe0NSAuIJAEh0XzgnAMDsu5atubdCmeCbXiYAAMmx894JgSQA5IVFyon1PkAIIYQQQghNQTfxHmBqSc1D3z3zu2fC6bPs60\+xrw/5qsjw7Ye\+OewFsF37f/3CB0MyfiArWf2dNbU1D6w\+9crB9isvuNwvgEIzu1jeK5ztSgOU1Kz9cuWIyK5o/o9\+8X9\+BBBvffd7W15vXfbN335/MPOsoJlK6BiWSCycv\+bvobWr/djRrg7ZjJpHH3jigcqytny/ZPnsxXX6904c7fri3z\+6zViuBAA5Befe23kqFW/raAPFsooS6Op6\+2jzfSUAIB06\+XNr5F05tPfvhlw4fuLXLx4\+2A5QeudPfvjwF8/8934WlHd99SfLqH9\+9tTO7b85vvbRLTXD58pOpiA5bgYYkqn4kCGspXfdY/3OnHb/lcNhob/ERLtAK0roBSVwor37QiuBOyhF2eLvrj516i\+X2068vu7E68UlJWWF0NHW1QFQXHHPE8to6GkJnOgAgDuXLF4weP6pynsrNIfe5y6G37741co7JnG1KMoWf/fRU6deunzipRceP1WxAK4cPtOVAMV9j65cWSaFsVK5ypKiYoDuiyd\+8Vz3fcuW3XUHDeGOthOHtv\+6CVqbm5L0DOjouPj\+r1\+mnxg5yThpbesGgBllpaNekoQQQgghhBBCeTcRAAMUla//lyfKXj70wtHzZ3sBAGaUzvriXYtqjcvunz8yudfd3vHB8AWVPaC4Y/FPHMX3HXh3/4nwifY41xYvLin54pL5NTUPfHOMrOkwsa7mY292x5ovf9BO1Tyx6n56ZAFFWWWduTLe\+m4Te7513peeWF25QJ7PSMeaT\+x07H\+7i/5iSdcHf3l5K/3NbcZyZc\+VwyeucO1F91UUtYV7Oorm3AldZ880XVgyXoTZ2/TOoRdefvdgWxoAZlR8\+Sfff\+B\+NVw4k/tWWnbvw8/KqK3Pvhd46XfH/HPW1Nz3DyvmK9qutCZT0APLV395wXgjlukZHefCx\+VS6EkBQLyNP3Uy1dFMcmnh0juWWP9\+YdlXK5aXUe1F3RtLU5VlUvm5cTZVNOu\+O4r2tfc0nbrS/lW6FKgl5m/99o4Tvz906vCpjo6urrO9itmz56xe9uXv1ixeUASxM41vtwFAyfLls4bOwq2ct/i\+0ve59iuB43zdHeU3ngt6ELWk5ju/LT208\+XTp86cPQuS2bMX1q59uG45Pc5GpGVL7vnmvOYXLsZPsKcVd3y57tFHftL7mpu9/PYp6f3GVc\+umHHq5QM7D10\+fOry13XDn5EIV46diwMoliyZhe9AQgghhBBCCI1HdC067rjKT4UEv3f7CzuHjbAFAMnseeXL71pS99XiU\+\+Eua4rh482J/SPeL\+/eCDdmksXfzBvpXdL7p069U863jsLAKWLfvbDh1eWXP71z//4wsW0vHTOA5VU6O0wN/tL/15DfvFcY\+yu\+7asnr/gjlnxAy\+sG2OmK8l9Tzz\+3cirT/3lSkI2o2btwz8w5nK8qQv\+35lf5Jc/8dS/P1iqAIhHmn793KsvnOmZsWTlv39bfeDnf9zXPmpj45j/v6qK/qehcXBBUe2PNmxZOvThQqr9zMn9x6\+0XWzad4YYnt7wH1\+lR2wkdvLVx3/xPlc4/yeOb60pu6knHZ8Rre/88fFnz3aULvmVY83oByIIIYQQQgghlPOpj4vkdOX8YvnFlGbenOXLK\+\+7a9aCUrqMHggFhQsvv/z7E3EonLPxwZGdjRMAicFRtVKFDGbMu8/5wweW0wBQ8QPHhvuOvuk\+cFmqnq0pLVIuWbxcP\+P5u1bNUOdeYkROAQBI7lu75on\+Tt39Y4AVS2pqnPN7KpdUlA3JRCaSKQCI92d3FerKH2ypqD3TdKGkYkkZlH7/O6vHGb86ilTR0/SL/8m9n2lOu/93j78ojC6jLJV\+cPT9QC9AycLVd4yRNlfe9aV/uOvkT880733j8srvzP/cpkZ7WvwHznaAZNmDX15O3\+7KIIQQQgghhD7FPvUZ4BuJtfLtMnqBetS8SkLzfn9Tu7pizYqKUjkApFqbBeX80lFxYGqcpwCp9ubLnADK\+XMq\+9\+EFBfam9qIcjazgB5jlfZzp4\+1EmVZ5cqxwtHJEZr3\+8PxO760ZjmdOHfyv4\+TygeX3T/yfbndF851dICibDZTNs58WLFzh763/dgHMGvjlu\+sv\+N6U099ZqWa/L978sXLiXlf/s2WVUtuMP04QgghhBBCaEr7zAfACCGEEEIIIYTQRIhvdwUQQgghhBBCCKFPAgbACCGEEEIIIYSmBAyAEUIIIYQQQghNCRgAI4QQQgghhBCaEjAARgghhBBCCCE0JWAAjBBCCCGEEEJoSsAAGCGEEEIIIYTQlIABMEIIIYQQQgihKQEDYIQQQgghhBBCUwIGwAghhBBCCCGEpgQMgBFCCCGEEEIITQkYACOEEEIIIYQQmhIwAEYIIYQQQgghNCVgAIwQQgghhBBCaErAABghhBBCCCGE0JSAATBCCCGEEEIIoSkBA2CEEEIIIYQQQlMCBsAIIYQQQgghhKYEDIARQgghhBBCCE0J0smucP7smVtRD4QQQgghhBBCaFIW3nnXpMpPOgAGgGXLlt3EWgghhBBCCCGE0MflxIkTk10Fu0AjhBBCCCGEEJoSMABGCCGEEEIIITQlYACMEEIIIYQQQmhKwAAYIYQQQgghhNCUgAEwQgghhBBCCKEpAQNghBBCCCGEEEJTAgbACCGEEEIIIYSmBAyAEUIIIYQQQghNCRgAI4QQQgghhBCaEjAARgghhBBCCCE0JWAAjBBCCCGEEEJoSpDe7goghNBnmObr/3a7qzA27s8/vd1VQAghhBD61MEMMEIIIYQQQgihKQEzwOjW2rx58\+2uwu23Y8eO212FvxW2I3wu2hEhhBBCaIr7zAfAn\+/78s/6DffmzZs/64fwsfisn4fPev0/LngeEEIIIYQ\+6z7bAfDn/n70c3\+ACCGEEEIIIfSJuYVjgAkhQDifyx3gBT7IhoSb2wrn93hZ/uOt2mT2z4dCHM\+HgpwwfLkgCOT2VOkTJLBeb4D//B8nQp8oGaWeWayS3e5qIIQQQghNPbcqA0w4j8Xk0TntQiDAMILTyZo8Tj7o8w\+Pg2md2aJl7Ta3nz1JNEs1lBA6KWju0Rvtbocu5AvQRiPxe7xavUnPUBPfO\+\+zWQMGt8vE/C3HIHAsB1TQYQ8ajZyXt7nNwNM6vYYGABJ0ml1at8eiyVdLYL0\+Xmc2aSdRzZvEec0GK0trr3dGKI3J6bZrAma9laU1DAVA\+BCncbB\+G\+UzG2yDCwW9m/WacyeK99tMdsHmc5tzh0X4oNcjaE0GBgjns1udrJDfvM7mcZk1EHKbzV6922fX07f4oD\+HSMhtNNg55voNqbW43BbKYzI4OEZD59qM17lZn4m4jQYHP7CQGL2s20gDABDOazG5GKfPZYAgyzN6XX4XJOSx2liT223SjKgJtuMnSTFt0fZ/XXJk54t7L6eGfSGbXfdPqxexf9n2VnscAEBacc99q2SNu/MfEUIIIYTQ3\+pWBcCUxux0BO3\+IEP4gJfVOlwWnYbS2Q25u22bYPcO3GzrPH6D22QN2X1Ojc9sYa0\+t5EGIeByezU6g27S\+\+b9DruHZQSnnR0RWTB6izUfovJes36MKJIIHAdmH\+sy0ITzOayswQRAUUABCbntHsHm02tyJWkACgZWJnzI62Zpo0nLAAgBm8HsA83AtimtxeW26j6\+2JgxOr1es\+ZGxXigNCaX121iAISA1egEAKCA0pjcXreRAeB9FrN3oLTPbg/oHH6zZkhFKSr3gdKYXH4TAAAQ1m50cELuuJw2v8nm0PtdBvpjO7qpg9KY3T638UbPaUgIKJ3F7XUaaADeazbm24zWWZxep54G4DxmC9tfmvPaHJzR7TYyIAS8dkvA4PE5DQyAEPS4A8RiH7k/bMdbTbVgyQbjAlX/R0WRetFMtepbX1/UMxAAd7L7jx243FbvP1/9jXv0H/71iABAL1j/\+P2L3vho922pNEIIIYTQ59Gt6gIthPw\+lmIEv4/lCKOhWLfbGxQAAAjPBjjSH1ddD0XBRIoNR0Iemz2od3ocFpNxJP3QeJdiTE4/O5LP0R8BUDqLwyT4fBwBAMIHPCxjsxuGxA79mxKCXqfD5Q1yrNthd/lCAgBQjFavN\+SZbXbLxxj9DiEEbDpGo9Pn6bSMxuThhp4OnvU47Ha73e5wsf19mQnPuvMLPcH\+3uUk6HUFaIs1F40JrMtqsdqdXjbodVjMVk9w7H7QlNZkMxK/28\+N\+fXI6oa8NpOOoUS0Rm9xDfSt5gNOk5ahRCJaa7T7udxSwvlsRi0tEokYnckZ6K\+mwLrNeoYSiSiNweoN9R/R2IVBCHqtOprS2gLCYC3G3N14hT8hvM\+sGdqQGkZr8Q3t\+E\+4wGCbCYMLXQ673W63Ob0DC4Wg2x3SWq16GgBog8Pt0HJsSAAgIZ/TEwLBYzHoBxitPo7c2nYMuMx6DS0SURq9tb/uJOSzm3S5sgbbQDsCEM5nNzAUM\+zohaDHatDSIhGtNQxugvM7zXoNJaIYncnuC30q2nE80Qunduz685Zdf97y/BsHrkzTV81VFyv1dyqj77\+9Lbd815sHrlLVNX9nWzEtclW66ltf3/zA3KoV99eUS6Hyvq0bvr49/9/q2juLb/fRIIQQQgh9ht2qDDCtNdmcep9F/59dzSBoHU5rLk9lMrkpvc6g4z1Wg583\+zw6v83uDfFcqIlwhgAlhE4KQUNQo7c6TQQmHTTyfrvVRfQ64nXYR0ZstMHhcdKT2ZbT4eMEgaIDLi8AEfigy2plc71JCRcIBWmnndMZHlnJeX28waTThAyakNcXMutpitZa7K7rp2j//d///R/\+4R8YZjCk5nne6/XabLYJ15GiKMbgdPcng4WA3eyhh541itGbHc5cBlhgnf0LdfmFvI/PZ4CFoNfLaS3GfBduWm9z64GE3LxA7B7bdcJ3Wm820maPP2Sy3qD7N\+\+zmR2C1c16dBTns1usNsbvNWt4n93qpazekFnD\+x1Wm03r91oYzmO1Bxi7/4KR4bx2q82u9XtMjBBwWF2C2RP06QjrtNmsbq3fpoPQmIV5v83s5PUGHRMYVosxdqehxi78iaEoWmtye/qTwbzPagkMbUiK0hisjnwGmGPzGWCK0ecXDmaABdbj43UOY38an9JZPF4AIEGXzcGbvOw4Cedb1I6812ZxCmZ3wKsD1mW1WxyagEvPua1WL233BM1awe\+w2iwuTcCupwTWabGzGp1eMyT6JZzHanZRdm/IpyEhj81isTN\+t55zWGxBo9vv1tE867JaLQ7G79TTt7kdr0uqvnPJ5idX19CXXLv\+WvWNJZGGzqp/fOpV4ynXb984cIFAsvvIgb8eGShOf2H7j6ex/7lr46GB/s/Fq37w7doFJw6c7cYe0QghhBBCN\+fWzQJNOK/dEdJW36PRMgGbwWdyeWwaitYYrE6nngYSdHFOiqL1Nm/ARoJOkw0cPhsztAu0Dcjkpl8SWI9HMLsdlMtGOf1Oxms2B0xej0VLAec1WwKT2xpjdHoIb/IavB6LRvBZTG6d29cfChLWGXJr7E6zBgjnHn3wfMBu0rvygQStd3hcw8OOXbt2/e///b937dr15ptvzp49GwDa2tq\+\+tWvnjt3rqio6KmnnppYHQkZticicIJWO/QwcxlglgYgIZYnWgAguQywjaUpEEJBnjLmyrE8Y9Rrxot9SNBtsXly2XCB42jbwDeU1qinvP4gb9VqrltZSmO2uzQmg4YC0BmNWoeT5QQT\+D2sxuKzGjQUaMwOu8/k8XEmg9/L6exui14DoLE6rH6zN8CZDCFPgDK5rUYtDWCy2/1Ghzdo0VJjFjYzOqvHr6F8Fm9g8DC4sXZntmnpMQp/gggRQj6rMdg/VpfniME0rCG5gNth91MAQjAoUKbhC4kQDAoaAAAhFAgSrUVHQ27Er9UdEvgQRxsMwAYpKmjRBxiGpnIdIDxDx/zeinY0m0P\+EG1y2U06GkBjt/v9dg/LaXg/pzF7rUYtBWBx2HwGly9o1espjcnls1Gsze8fcuyU1uxw6Uw6Jrc/jcsT5ImBNtpcZoNBSwPQepOe9oZCAujp29yO45BW3PPg5m98qXoBNB59w/zT9xvli3ZCqvGNv27503s1j399689/WPtbz9MHIuqqL6/XqxUAkCAtRQv0PRcbVphf/YYMAKCndfeuNyK3\+UAQQgghhD7zblUAzPsdVg9ldzuIx0fbbHYLJzA0BRThWJfDrqGA8CwHllxhwgeDAmNiKBgeohJCJhUC03q7Vw9CwM7TWoaitGab0Wtz\+AxeM0N4AWiGHrZ13mc3DgSp/QsFjgOzLf\+JMVgNLpsroDcHXUGNxaGlcpNb37Bj9rC87FgeeeSRn//85\+fOnfvqV7969OhRAMhFv3fccUdNTc3Ej9jgCvKu61ZEb3Y4TTQf8HjALPAehx1AY7JoDGaLUUMNZIAJF\+RAM9BDnA/YrfYATwQuxEFQ79OZ7Waepy1er3V0iEwxOg0Egrxg1tDXrazOaO7/Nx8MhCitSUMTLsgBo81nOyma0QAXDF3UsDyl0eSfGVC0hiEelue1wRBhjP3NSDNaWgiEBIEeq7Bg1jBaDcDwCcTH3p0AWmaMwp8gxuTlTNcrkM8AU5zf4wVaCLrtQQCd2aw1WiwGZjADLHAhnso3JKW1eAIWEPxWo5My2eyu3AMOwvlsFjdlMeno4bv4\+NtRMMPQ3zRF0yCE\+HjX8P3SFAgcTwBoRqsBEEYcOaM39e\+P8MEAR\+t0GoqiDSZtfpHf4/QRXW54AnV723E8cYBI0xtP/zZWcc\+dtd/6O0WRumqmujw3BjjRuGNnpKUlEodUS8OxbQ35VRQ0XV80e8M/Fez\+qXfvVfWGH/9deRFgAIwQQggh9De6VQEwY7B7DTRNWBcAcZtNIZPHowcCtMZocdhzGWCzK1dWCHq9Ia3FoKEgRAjJ3zLTBhfr49iAjyOUfmJDgX02o5MVCB86KdBmg4cCIIJAnGa9iwjcSQ44fYBmdDa3y6zJp8B8HvPw/qAk5DZbQvl6sS67m2cY3mWxcKDVs06bYDKD2x4wut26satAhKDH4aCCoWDQaQv2d2IlAg8Gu9M82LeUYZijR48aDIZz587dd999AHDhwoWKioo333xzaKfoMeUmaCYhr9Xmyo2HpDRmp13jtffP0jwq5Uw4v5fVuL253q2cx2zx683GIbGsIAhAMQOdbhmD0\+MN8gABm4M4vDYdJQRsQ6ogsF4/MZhzI6IpmqaB8ML1az0EH3BabKze6TNpQAjyBOiB9qVohiKhSDQiEGqwCzBFUxQR\+C6BJ0OHhVMURQT\+SheMVXjsJydEGGN3AiGDI7o/cULQbbd5ckNYKa3VaQO3zZ3/ODJLC0LI5w0avLlpu0nQZbKzRrNhcGQ7IbwA9OjfC6XV56PfkNdmcYHd6xo\+ETTcinYUCKU3agWH2xs0WLVCwO30NQkaITvfYNBwHrfPqjMzvM/p8jcLhhs/6iKc325x8Ca3y5g/IyToNFT967tQcs93PV7zuL0Xbr9Uy7sHt7wLigX3rV\+Q2vWzv7I9/d/IZm/48d9VvPvevsspAKn67i9tWDFbAQCJSP2B99gegKLZNd/6\+qJEwaKZUvY2HgFCCCGE0OfFLesCTdE0AAgCFxIMLqfF6WY5omNA4Pwuh5DPABMLAAisx8VqHblXFmlMTpeW87n9RotRQwEJBXwhg90x6l59bCaX3wQk6DTZKafPSvssJrfO67PraeB9FrPP5PVM6r1IuXGwQIIus4Ny5oNHIBprwGx3WbUAY9SKonUWu53YOcZspDwBg9tlpFivjxiGRik55eXlhw8frq6uvnDhAgBUVFQEAoFcd\+gJIQJPmd0Bm473mq1BQmieMrn8dj0EbGaPMLp4yOu0cwwFQIRgSNDeYOtC0GVzaWwGEELBQACG94olPOtx8xqjYXhOfUK1DnmsZidvdvlsRg2Vi5Rg8JXKuQBVqVDTFOGF/riUCAIBmiqhGQq4wdcvE0EAoEsU9FiFx46Gxtwddfui31wlBMbq9VqYkNtsFwgBgbZ4vFat4LMO7bbf/y8h5HHYgzRA7jdknMyeOJ/N4hSsXk//L4oPOJ0ho3PyM5RPqB0poLVmlytksxtpO603WYyGpSGBpmid1eXkbA4dbWUMZovRWMkPeYIxJoF1WaweyuL22gYnoqN0drbPEgx4XXaryQo\+t\+lTHAQDACRSivIv7fz5nUNG8EpVRbHdidy/U5EP39v24ZDyNEBP24E//DmXAVYBQgghhBD6W92qAFgIej3eIC\+E/EGOc9FahqGDQd5AKI3e6siPATY7AQBovc3r61\+NYnQ63m93cxqzUUMBY7R7JnODDwAgcCHCmBiKYkwOm9dsdxt9di3hBaBvcIs95kG4vUGeZ4NBcNo5htGarBa91uz2aDneFxyRkCGED4UEQlG5nty0zqT3egO\+kMfmoh1\+M4wRe8\+dO/fNN9\+89957pVJpIBAoLy\+fZA3HNfpQKa3Z7hzMAAeHf0vTdC5yHG8rFFC5gBMgf44Hol8iCAJQI/rTjkkIuq02n84ZcBv7HwdQjJYh3hBPIP9e4pBA6zRzGQ0tBDmBAE0BCHyII4xZQ9OCBrxBTgANDZAbwKzV0Aw9VuFxAuAxdzeBqt8aY1Ry6CIy1r9prcXh7M8Ah0bM9UZRDA0CN3ZKW2BdzqDe6bMM9EQgQijIg6n/w8fejjQApTU5/SYnAABwXrNHo9cxAJTO4g5Y3AAAJOQ2eTSm6zWCwDottqDBHbD1Z8MJH/QHBJ3JoKEYndHmJKzB5gsJJs0Yv7JPlWjL\+5tGZID/bXX/v\+maf3rCVnSR7ZSWV5ZFf/ubTU2YAUYIIYQQ\+pjdslmgdWabziywdr8vSGiDzWFkKAAuJHCBwTHAgpkAAAgBp8U\+8NYTInAnmwhnCA7cWutsHteE\+zcSPhQK\+u1GvZMCIDzPhyxGHwhciIOQgdXo7W7XhNNEtM5s15lJ0MUJVH/wCAAUo9PTbKC/FEUxGq2WBh4EXtBa7Hoa/Pm1TW6jzWt0BZzj77K8vPzNN9\+USqWTjn4pmiEuq8ELAJTGQlE0Q9w2ow8AgDGYBk9I//9eNwNMaXQaGIhfAAAIEfgQT4DW6gwGHQWC2aKxWw2\+fHmt1dYfaxA\+yINGd8NsMO\+3Wz20w2cf2jmb0pqsBrfTHbC4jYzAeryczurSMRraqjN7vEGTXU/zAbeX6O0mDaVhrEaXze3n9GYNCXo9QY3Fo2coyjJW4bFP2pi7u1HNby2Kpnm3We8GAEpnpSigBbfF4AEAijGPEcZeNwNMa7Q0CYZ4Yhj9vIfSGHSUw27SO/qXEJ4Dk3dg5q2PvR1p4H1WkzPX41rwu1xBrdWhpQjnsZg8GqfXYaR5n9PN6x2mcaeeJpzHavVr3T7bsL7grMvmZIjPbdHRhGP9IaK13r4HGRMlp9QLRmaA1XTfPnn/p0Ss4ejBLe9LazbUVueWYAYYIYQQQuhjdetmgQYAPuAJ6pweQ8ButPJel0WrMbvcWtDpNRQJ\+Tx6TW5QLG2w\+1h7/0ok6DRaOEfA3f8\+3smhdHZWsI9YyPutZo/BM3xWqglMgjUSEXhCjwoQGJPLQzgP69ZZ3W4j0z8Fj8DzjMVutHsCQd6ouU7QvWDBghsf10gUpTW7/eahi/R\+07ilaa3epLc7c13Aeb/TyQ2PjyhGr2dcAZaz6bQUABCB5/hgwM4xuvzJpHUWt98yxrZJiGUFrUV3o9wbH/D43n33ykOzf92/RFG9K\+i3ak1uH\+WymzRmjjbaHH6vSUMBaC0eL\+20G5iAoDHZXLnZhYEyOH0uj8OitYZovdnu9Zl1NIxTmPeadN/685XcrlZO\+09Q3PMfwYBt7N2NV/gT6FFL66yegHXoEk/AMqLMkAHOWoPZbM9N\+EQ4H\+Ui9PCtaQ16yhcICVZtrkFIyO9lQyE\+wFmsWpM7YBqvHremHRmj3RGyOwz0Izy91Gh3uy1aCkBjctiDdruOfkigl5odntwACCFg1a38dXNuo4/M3gNQ\+U/vsNagx3fySPzeaTv69zfr638I\+ixuV9BirZr2BEBJZbXJ5vFYtOM3\+qejZ3T8wpuP1L05ifI9l3Y/L0SvpiDZeeC3BxVXUxW3rnIIIYQQQlPDrQqACc96HA4fZXWbDRqzB2wOt5/R\+m12P\+Pw\+Wx6Cni/3ebjvd5heZ2Pvx4CAYoPBkKgsQzbDwFgjE7vyJmah0yClesALQDh2VAIHLYQQ2v0JpOJoSkgPB8iMPS2ekhPVEIICfntNrA6HBaXl7KZDXqP2eFyfEwjFClGx3Aus9513UJaq8ttHPxkcTkHvmOMdhcAEQSe53iSGy1L68xmjdfrD1m0OgoI5/cRkzdgDNitDpMxaLaYzUaDbuQwZgAAgfX6BJ3VeMMYgzF7\+186PLKuGqPdaxz51ILWmpw\+k3NkWcZgdQes7hsXZsw\+3gxjGGt34xa\+hSiK0dBBx5CE7Fhonc3t1A180ttc\+oENaExOF4AgCAIX4vNzk9N6i4m2ePyc0aKBkNdmsbMau9cZcpmNQavDZjZo6TH3c6vacbzGNbt8/bPgDSw0uLnsyJYF0AeIddRCAMbsZs0jS9\+OdpwAacUDX9/5jXnXS\+EmYqyv/rhcWWVcvf0eaXmlMvouQLK78Ww3AACQlrOR8jlqlRwg\+cnUGSGEEELo8\+mWZYAFnjI6vfk3rWgtLofbZHSC2cs6cpMPa61eP\+MJJv/HZd7u5YaGjwJ3solYBrtAA4z5Jt2J1SLoNNy746Ri6T95/cMDbY3Zy45xp0xprb7\+oXaEAKMzGg06p2vYqrzPrHvER6/zOodWiJD\+1xZTFKM324323MtYabM7oPN7g8ykhyCPZ3jG/Hq40PgvkiKcx6S3c3qHJz\+Xs85sM3gc7oDZbaRYX4CxOIx6rSlgsHjdLq/HYXUTgef55iv977CZ/93Xgm6D4HP7weie4DRlaCiNyTV\+0n4oEiIExmlHICGnweAiJpc392OjdRar1uRxB01ODRckJndumiqDIeBxum1GazDYdGVIF1yo/O5rAbeBYDveQqnwoT89cuhGpWR0zf/qa3zjjS3vwmAX6MFvKf3j395e2bbjT93xMVdHCCGEEEITILoW7blxqSHOnz2zbNmym9gTIQLcaKrXydq8efOOHTtuXO4z6xM\+QN5vM9kF\+4Rn0yUht9ns1bt99nHS\+J/7BpqgT/g8EM5rMbkYp2\+CD42wHSdozPOg\+fq/3ZbK3BD355/e7ioghBBCCN1aJ06cWHjnXZNa5ZaOAR6GouhPbF/o5jBGFzuZWbcprdUXHKt7KrqtKI3ZG5xET2BsR4QQQgghNEV8cgHwrbBjx47Nmzff7lrcQph2QwghhBBCCKGPyyfXBRpNTZ/vJxQT9Dl4kIHtCOO0I3aBRgghhBC6XT7VXaDR1PQ5iP0QYDsihBBCCKHPBfHtrgBCCCGEEEIIIfRJwAAYIYQQQgghhNCUgF2gEULo5uFQW4QQQgihzxDMACOEEEIIIYQQmhIwAL7lMoR8UrsiqU9sVwghhBBCCCH0WfOJBMAkFLG7uoSbWlcIRlyeLn4wsEuFPOetnl4yooxb4G5T8EeEeCgYC/gFls\+M/lZgLxv1H7mDqbFXFnr9vhif/5DhAu0BboyNDJHi\+XE2BcRrPWt2dQsTrfiIteNsoDe3Lgldc3u6\+LHLZULeZqc/PnSREORtzpts34kQghGX92aPa6JSIW\+LO5A/LoHlzUbOP84puK6MEIoFR18JAgmFkrf0Cr3\+dXjzhDgvDN1ghgjJkPeS0xtxOttDwsAzl1TQ3Tx4nZN4wBO5fk0I3x0IJnPb5P282x8f5/zEfc5L3mG/i0zI02z3xccu/jFIhbwtHjZ5S7bNC25Xe2jkoWZ4f7Nl4EfEX3Pa26/zB00INBvNEW74QsK12ywtgfxFm\+H8V7zj/dmBlHCT12KSCxHh5lZFCCGEEPpUuIVjgDN8IOLxEwGA8D0\+ViLwAk2SPFXqdNIMAOGuOZwCoSUUAAAQLuZjpQZTAUPl1ydCmjHPtWllxM87mUKXUZarsdak1lguu3ULbLp87WlGDgHeSVMuM0WReMBz1d9/uyxwSY11vt0gm0CFkwHXJS8noSkgXI8vKDEaFSTYxVJKo05CkaxAKKuT0UHMZc3fjhM\+cVKQLNVKKBDTTKHZUaxnxAAgBC5Z7IMBJM8lHOaQh859EjOGOW5nIe\+94g2miUACgbQuUMRQEq2xMOQUtO7pI05jyB12wByPtZACENg2sy3j8M830KPrT5ldc4Lmiw7dF1xjHG8q6DxnDcj1Okn/CQYi9AU42utjtBQASQZdnN0/1\+soDLkv2zwZt3ugpJgxzfHYlYSN\+IlSyydCJBHwdBK9CgIxyqTWCSQUkk/ujprE/Z6ruWhfCAo\+vtBslFMAQFNGi9rADH0wkwx6In5mnnVS2x9y4Kzrgt0bJwBESIU40GilNAUAUr19gcukyBUSgu12Z5/RKwFIBj3NVmfK4JqnYZvN/kKHS62lrruHYZJ\+Z2tAS/H\+GE8AQEzrGbdzOh26YnMVur1qTa6MtcmlW\+izFo614Y/tOgQAwl2zmy96KIb1M/1HkeF9583\+6V73dHqMbwEg7rVwnLXCrpcCZEJezsKqfZ7pTG6DoYjF1qPXpUOMCIJpn709qNd4LBQFWYFLcNqBjST8nmuMfoaeAd5/3uRM6/Xy3B5opsRspTUUgNDnsV702itchoTH0ergI25G1F8Lmd6hcRklQW8HrysSQkTge7z\+uNYoC/rTBotK4AkHWQIwoZYRuj2OqyxIaAp4VmBBadRByB8jelrPACFpopnhsJUwA\+VJn88d5R2zxtpWhg9ctpgjvOULAaeSzpePOU2tlPMLFojY7Vd9gQTRFFucc52mMdqXCMTvS\+osw6ousK1WF1gcWa\+r3WAt1QjJIJc1AQjBiMNxjbFV2JhOhzNGmMG/lqEgcdp76fw207Bs\+hNfFGupHpczQsxKvTbpdXWCY8ZYhxD328Iuao7HDi7TZU5XpKEAAIRQjNNrfDaxx8p5QhnCx0/y0qU6CQVirWWe21pMAQDf47IJRq/GSE/kvCOEEEIIfQrdmgCY8ILH08UJg0vy921CimWvOEiXRltitkx3DgZ7cb\+NCM75bjM19JZRCLW7XT2ChqICrfZQkdlUDHxcIFmNQc4FowFBQtGUBqJeby\+voejgFQdHGS1qg3WuIb\+BFOu84BEmmBCTGWxzae8VbzA9\+jtaS1sttIYCgCKzdQbxE4GkQ4E06JQGrSQXuWkGog4hCYb5/oH746FHxF6yuJMAMp1pOsd3sPlTJGZ0tJ5cdYUSnDPs9hPapLbbZxoYMZAef0BkdOROS4ZjewSmWAh2BQAoplDHELd1WHKMCGlia9L3n0SKoZ2ecn2\+Hhk\+1MMKoqGFBQbygStdbPUs1ASSnO\+SI0T7QwzlCds4xueS\+\+0RyqSkQUyopM9x1agDwnU42YzVOFOviVitl83miZ3ggf0GW0zWHo2BGn1\+QOhzm86yrjusVLvV1s4RAJLlQgmi4Qy\+wVKUhna6y/V0Kui\+YPOMzhyKKa3a7c4FrlK97QsBW36/ZqfM6Zk1IqAloSs2q6B1LrBo0j7rWfOvk9q104nvkpkFs6tsMtEvgNAXFCizda6GCVt5xmtX0iQZ4ohAxBQ1EN2leUGs0cgoAIBUyMd72NwlJ9YYZ1oMio/tOgxFrFaB1lEMN3Qb6WAgxegLqbG/BRIS/KSk/\+lSgg0kaE0mFOgKgZjWFum00626TgcLGhMQLuZjSt2m3MU5eF0JwXaPRwiECOW8BCa1adgJlDD6fMRFadVur8wfSgScl/16TchB\+S3nA\+YvePQ9DlfSrFcAZCgSdbqyRpLhvK1envZYSrSEs9rTFgqAgYmiiy1OMe3uGCsjLdYYZllNFAWZkIezunsJACGp0MkMY2tiB2uee26lBN9Fiwe0Opkw9IxxPSxQdqbXY\+ZD\+vkBbxEVvGK1XnRr7hh4SDeECKhh0S/h2u0OYnItNGkSXvc5i13qtQLhBLsxEuRlJsc8q0FKgdrpUQMAkLjf/pHFn7jSFfcHKaezzKyTAQAQEvD3asyMDbICHw/xHT5epPVetvty\+0hzQqHdxejoeMB\+wcHPcHtKGIjRI0\+UGKhCq2eRVYi5rFco21wDJGldMUMB8NfsrozFKgVqYg8dEEIIIYQ\+pW5NAEwxtNWuGsgAD0Vrp9tduTwYkNAVm6OH0kiA6/EHxXq4YvcTjsg0GgnwCTDNcxkohunj\+QyAWKNTajUKSkMBpFg2wtJFBoMCAEAo0DAkV4bRKvXM39KrOx0KEI1NYxbaOHeBwzWdd4VddJnT2Gu3dQsWGiAj8ElKP8tuAODbLZzE5RmajE3xfJpmZLSWNlMQcJ738xJ6MN\+aFYjUZFGaTXIKAEiCDcpM9hmCQCwWmdvVwZEEo5XrjcWUoLQ5GR0FvPcjvY3QGhGYPnAws3zeIr9fZLQU0wAkFHG4aa\+31OZdZAMgoStWR9LqLtfTAKTbbW0TzPNsRsXwW1WZwVnhMSsGPhPuisWe7S\+T4QIRL1vidMzzmyDk5SxekVZzxe4pc7rm52INSqe2aDhPMMkGe/XOSiMjBn2Zi\+7l\+c5JnmcprS0xalNsKE1rS4yaRChAaegML4g1elpP\+BAArWO8AQYgw3nPWwJzvO7pjEBCvESjlQ05KKnO\+oXAzaaG\+89Ct8fZo3MuMAltZluxy/VF4or7XZwzWOR0F3LBXt5QMuFQK8MHBE4/Q0en2WA6H\+ELXU5bj8kGAABCt9vBB0k2yCYp6rLVm9FZZtK\+HrBWOPVS3nfO6idmg4L6mK5DilE6fNPAfyHgGVJHgQRCIoNVTo/xbTJgDZn9Ig0DFi1PmSt85h6/oDQbZABZznvZp5vnMZIgUFqdiObToC\+mIe51nHcRMUMDF\+jluItWX\+GaZd1\+Qum0KVqX9vt6DWaxRj/D4SyhYYQ4620PaModjjv8kPLbzrsFhcZzyc3Mdbhyl65Ya1LrfVdYnrCswu6boaXEgmWuM5jk/RNu3/xRJwIsmN1zaG/CAWVOC3iFS4JtjkVos/rjFhNFgVhrWRiwAEDSbwt7bBqPhQK\+lwNKO\+RPCtEzHqMkZGtihzZ6sFvQlGpoGdjnGnS0lgbQ0wamM8ilCdVptV4Z7PBMsqGTiS6QhPRduW4IOtvcDRShdbKQ55IdAOhCJiSwPAUgMToWeA0KivT6PILOTGsoEIIRu40PaWZ6PMTllVgMKY\+50aWf5XTONDByrTYZ4jMAIkYDrDNt9lQMht9Cl93SyUOKdV108tNcdonH0mx0TAem0OrIXzm877w912uFdHtsPG\+Z59BlfVbOo53vtSspIcmFsgRfG4AQQgihz7xbdz9DkgJF6Y0UAJBQOsjLDEYVA7QJxAKfAUYMAERI8DTtdk4H7zlOx7jtxYL3nJVTO\+xFvDvs4NOELjbbim\+QX6SLTbZi02SqJgTO603EEtDadaOiZZIOst0MifM8BPxREkpyVCxAEY7kElwZLhDxBtNA0kF/lNfSfmfzkFtxMa2bZjXLaO10sxbAqLxerSi5Xtfltl3ZczAdEGijFkBX7tEJVks74/iCLhfkURKdReNxKqnQFYs9EfS0\+rWzvGaaARCoKN1/D05CEZvlKrFW6OjcWoUmC2WxnA06FrgtxfTgLpN\+62nGIdf0LyJCWmBmEQCADO\+/ZPVIHJ4izn3B5onTerXbr9ZTvR7rBZ0DNHra6Z7NsBGWkgihHkqjpIMRr49iXR20o8JGTy4AppgisylDCVEAMYAIIEMgn4gmBDTGaYxmoAev4HKnTS4VAyAEr9jcRR5v6cQzf0P7P0N/F\+iQPtL/VEKqs2lc5mKrp5iEIhZrN\+OcCcGIzcH7QWk1SYPeiNeXCDJ3uk2K6\+xjEC84HDGwz6aE3kAwI8Blsyuus08fTJnRxVbXHSTYYuYKHK5ZvP0jD5c2jrmpj\+M6pGhKAzBiIDPhukJQaNKIgRrjW6DkZvdCl1HG\+85bA71e5zXKUmE2KijIhEIRPwClmW7WCxafyu2eDt7z1mCp10XTAACpgD3pN85zGsSct3vkiWGvOuxCPqY1MhaDDCDFOjmnMMtjTPms511Bsc5S5nPRDN9uM5/R8FKdqcztKAx5Y4TOhgJZRi/lvO0\+Lu52pa2euQw9oQYZRogHA91UMMlDLBCAIJcUgtGAEB8\+GjbDB3hXsMDuoChIBb2XHNRc75Ce6hRDMZAMDdtuOhRIaAwFDKVgjLlHciTg5X1CgU0nozRqT0A9WAX2ktEUCWlmeAJzB7ppgJA9E\+oM5jqqUDKDdYZR0\+OnJRQhbIAQXvD4qf9d1mL7l44gVWR3ad16mcA2A0UZrKVmS6/XzllNSY9/jqZ/e4SLBSmZYD3L6osYQli\+xO0uAIBcbwg/xP3Wj1i6zM6IeDrldTT7KQAAwmdooxgg7rWce\+KlNOz5cAdIKpdKSKDVY6ywYtoXIYQQQp8Tn5YH\+tmg64LeJwI\+RZmHDL0jvb58x8V879AxbsOGljGoLUZK6E\+cUgBAKUz6kVEurSvz\+lOMdnSuWG6wlzF8BkixluNdfsphnuMAAJDbHVSuP63OXK4zZzjveaNHpDEMdvukNbTFUsJM/DaRkmuZNMfDrFkSEowFDRqvWRZ09QiUWPAJQcOsfDTbf36EYMQeKtRrIh622K7vbzYS97s4mzttdM41srw3pLFoxcBfc7iSZrfab\+fsTKU7P3ZaTDESCsQay3yfvb9vNi84PRkaAEDMGOd4tT0\+d2tIkBuMcgDic13yAYBmmstXqqOBYaS0qdxOn9f/Z1bQFFgd5XoajDSxuq4ELRM\+6hxGaTIBQEku9iO8zG2U6zQD16Ky/\+iI33E5oJnj709kUZO\+Cx/s/wwAvP\+8wZK0eb9gHdH0QsxlvczqylmjnPfHKEqk0dJGY5HGOtNqumxjCQ\+KG0fdhHjtrQGQ6KksH4j4OInNVUq7rxIKuGHlMlywj\+gYDZVkebFGIxnrmG7ddZjhgn2CdiKjmtMhT1tQV6Dz8gHDfOOQ42eMaoOH97Fi3ps1OVU0JENsktFdZ5i9iNHPHJUBluptC91BwePsEpgioxGA73I7ugCANs32mkoYkDC0TGOdTQuh/\+xKL9WW2p00AykNf8HhjlnpsfZzHUyR1SHiCRB9IbHzXt1ci2MOAACoHaaiwY3xUaddoKxf6B81ANQN5wkUev0hid6WP3wSvKSvunpSIV/n\+YJJM3xd0u11xrT2GfTw9DURevxBud0zS0uBwF6yeIjJUGTU9bABIQQAIDZa6S9qkzZ3qZYSHM5LNo0EhAQISae9B4QkT5f5/SoNnQkFuvxsOven0u3qc1hERsd8vRCx2kfMH3bR6pM5WJqhxRb3HZaRx5MxOu8845TQQqfNCQ7PTCYUDWL0ixBCCKHPj09oDLBEr8sE/f2f/df8GtpiKRlyWyXS2RZ48xngIRuiCk22QtPgdnMTXKU5tjfEttlZidbIWAzDywzZ2ri3bTSl04\+q85BJuQjf4\+dEOtIb8PcOFPC604xprt0oCnkvWuzdRFfqdJXnU7V8u9Ua5cz5wIOEIvl\+jyQdOpmml8ppIREiMq1GRIGY1s10O4uDjmYPzHB5lW5H3OKkeX\+HzUQoU5k3QPGeS3Zri8NdroEMF7jisF8Dvo/XzPB45uhCLWZbi843L199SqI1MD6rUktDSGh3BIhZS/H\+DpaU2AyMhS0lVH8D8zGflwi0RHB/NM0hrtRKCRfnabmWzrh9Pd7AXD0lpUifP1Tk8gxNsWZCnvMuTmTOd5yOB7yEvkcOgmC3F3pc0zWGuT4DCAEOSDIYuEYxKoP2hpdUZmjfeMLFvAEwmJWawdaS6MyMWZvy2c7ZfGnaAkHXR05vXBBSIU4whngqn7mdbDicDAUIrcn4/b0W7ZBrQ4i5LJyXSBlaDJRUq4VQMMVTgsfdBSCmdbTLPsZY7rGIGGOZSx/1C91uTx\+tAaflso6hrLRoWCmSYP0Zg62A4jsDAmXRSoXhWyHcNfvHdB2OeRKCgaTGVDD\+ESVZ92V7QCSE4rS53OMsEdxhm719cG42QvxuQdBIgrZLREeDt9UrlBD3Jb9hjmWMrWX4YIeTSwSBGLWXGINSS2UFItGZZ1oMCoqSANcV1JR5hk0GFvdaL4VAbcg9pBB6fH64Z6mcBFrsHrnbUqizfsEHqaAzQnjC\+gmtp4c/KhoDH2hxeFMULaIAhGBXEGTaUJefG/i\+0yOIjPa5RirqMDd7Q2IjFfdaOHcoJXBxDj7Se0QURVncC0c\+NwEAACEUDVFFlv5Yl9LNDXaqAz7eYT9npyv7p\+4DgBTrvuzTlLmNcZs/MbKGLG/SR2gKiJAiugLgo74Q5fAyWirDB3sEjYKmFQYGBDbOg9xiHLwgSajDxaYoWgwg1prKnaaBavURvsftaPYREiIlA83B\+S5aHL2ELqKpdNDbOjDOnHAxf0hhNKpMtmk0e80bTBO\+LxgEpz3OUBKduRgH/iKEEELo8\+JWjgEOuj6yBmR6rQT4Hj8rMZgomiTYIOX0zc0lWITBNbKcn7cLMhIiwuBEskBCEZsjRmkkICQFjdppLzFY5xogxTqTXu1sp0kB\+YHEMUojAyHJU7TTOf3mbtUoTX5SLhK6YrEmnUGtRSsmId5siZk8FZb87Xi3x8I5gpTDPdvv6HTZm/MRr0CCQuHgprT5fo8k2GJ2SJ3embTvvJWb5RkSSjGOhbrgNa\+H0BrwuTsInyCMQsNdczkAQG6xM3oaeBBrDGpHvgt0VsNIGc0cR4DzsQldPkiVavT5u1utaTpjiwQM04OehDY3yy5I\+6dZumy1dvCGOQFWGbJfDBg1LmPSYW5lnBVWRrBZB/qAikiow2HvGagkAPDBBNU/yFZgIx5BaTWQgHamie9w2GM0AFBAuO4Ql\+HJDB09kQHYYsYwy8q0ezw9PGR5LiVQQ2fDkugtjEmT8FjCTqJ2ubrdIUkuiyuwzRZ3kdszqS7QgwgneIJFDrfSZ7/qNxeaBgZ2UjK9bYFRaLf5gfCC3cKHKKneNNthBp8l7CPqiV5OlMJglnFewct2C4za7VIFrR/ZhRLHiAm3\+Jg/lBC8HQwlCHpGT4tGjGb9GK/DMQh9AU5muF62Vqa3znHmukCzCoaWaa1zzNZIgCvpf\+ZCGW1zjRD3Wi/y1rk2nRgAiGZm0N45JE\+YBQCADBdK03q1VXfNDbOswhWfhtb6L3uZOc58Vw4xRQHn4\+3ckDQ4SYdCWVP\+Qybki4R0ajMfBasavLwtKKEAKMhyLOE0RNAXaybQPIyh3G0AgAzn5SyhWWyI0dEZznve4qVcnvJc/Ey4dpvxcsg816W9GqAKLR6tBTJB10dOar7Hep1HLRk\+2Eu0jIbKTUNFGAOtpSmDZY6dDTkCRDDKaACAVMjD2QMlLg/N8FfGqKGecQ1mgMUAIqCyhO9y2S\+6QgUOT4E23wlirN8XlVsYD7hzs9\+LGf0MiwEopsg6IgNMkhxRuXzFHluUcD0sN3qWtUQwkLCYy51mICGed4DdmZ8enIRGlUUIIYQQ\+ky6lV2gKWr0CFsASjRWMkGkMTLOURlgIhCBpl3O6XSwxewa\+7WcREhwUOJ2qplgi9mREkbNDku47hBQQ3rYAggkGEoxudlNR8rwgkSvlwYcYT8AH0obXf1RBwBAFnSMz1WqFSITmIUnFfT3gHGuhhILQ7YvhHp4ukjLyDSGWTZNlz\+kMBopwXveJsx0jP1enKFkBucXDAACO\+obhraZrplN58Ew1zs0O0rSHCc2exaZdUmf45JfN8dtlobczQF6ulcrpYRR2xkP6fY4e/R2jZa9GKAoo32ens/SjIwCEAIc51EZjaMni0oGvVdYutRiHBlCkFB3SMe49DEbXxAMqGk/Z\+NmemyFIfd5dzBt0lImxwKjphD83e4JV/B6hJjbfo22aYw6mdYiWO0dWnd/N2CK0huA97cDAMWoHP7FTkGwWS5Y/cCB2j12nnnc4wIQ04bZHpMCICloFQaNSkP1kiGjTCmN2suq/PaPTDvS5leo8UOrj/E6HHIaQl0hSmmd1ERxtNLmVQJkQoHc51TQy3uDiSDbS8glXksZLWqDptTlpQP2C7nKUDSl1UhJMCOQIqtNyQSvAZHozLTHxHnNC70Tyaj396RweKVWt5J3RAmjsrqKeEHEMFKAVNAZdzK00TDq/JFenycK\+lLTGNMvpwWq0KjpdVo\+Aiod4iinr2wge0xpaLunmNZJgrbIJE4OJNhAWmsppAGAEK\+jmbdKPdZiiu/xB0Fjk9MAAEnWdd7qo1zemToayMhR1wAAQqjTaScMBYTr4akCgKzAXrFai0wWDWtSDv6ZImmBSwb86cEFPBFIBgCAJNhAxuier\+evWF1E0IvHyABTCoNZAfw1DwCloS3mpNXaY/ZojAwIgWbeV\+Jw0jSMlhIEoJhCsxkYKg1kjBIIIYQQQp8dtzQAZuRaOksBEEqu1YopAKAkGk0uJXKrZfv/kQr52tzMPPeQAFgItprHmQSLCElCyTRMxu/rCVIFejruNDcFLYzdNl3HiIFWWmxKAAABKE2xzTm062nf8C1lOP9lu19h846IaZMBVytrrnDmpgHjo16/0mCkANL9qTCJ1jTLop/Ii4uH15yP\+X19IQ70I84wJdPqqKCX01uSOmeF2yLnvRetHpndO2NU9iw55s1tfpYgqtjq/QJFZYIsAAAFUuaGqViSZD3tLk2xeYxA8frEtLYYAPjrvOiVF\+yW1sB13nHFlDjdcw1MRgh22G0RwTzPbVQAgMY81x4Mm40xq3OORT9iVLmYpoHngKbiHh/orBIgY9XgxseV4f2X7X653V9IM4Uef6nAXvIMrM33\+INg\+qcSwRG2kzk6kmRdLXaNSAgRXtNf5mO4DjMhd0i3oS8OABC9q\+Cyonr2nr8jlG66hhrz2zmsf8zXxo6QG34c9wqDGeDhxIxxrssQs/u7jPa5Zi1wwVx4ljZaily\+iM9YYMlHpxkiZEetDkAyuUcGlFbt8QEFifypo2Q3vuSEXq/zCnFOGxUAZwQ\+DYychq4Q2we6AloQLIa42V5mN\+ciTKlGJwUY\+ylbv7jXdOZbf84lTs9O2wFLv8d8iZev0koAAGiVwzXdYm6atgEU8wvMtnkus4Lwgtt6yU2muX3lY727O4/STrM7h2WAaf0sl4fRUgBCl9NOjM5ZOgpogyYw\+snXmBuki22ehbSWokkyxGU01Bi/bEpDW7QRh7NL7yoZ\+R1JchzhgsRhiQkC6CxzHWalyQzACxPaPUIIIYTQp9ctGgMcijhcPYQWMYwIAChapqUBAICSMBTx2DmBKrY5ShmS4dmIwx6jQaaFDoe9A0CmhWtO\+zWejQtmAAA\+GHHYYxTfwxFZyM97AnEBQOAyfKjNzooAFF/UpYVQh9PWSwk9ITI9Hzs5Ob0v/9pVgSjsvmHxJG1YGBLGqjd/zWrgfIKE0RZanHd6TYU0AOEEt73FaIh6AgsHpgIiAEIo6rQ3a8boeprhfJfsrhhHK23uchMDAEBri4njvMEnoUiWJ5TTDjx7xeMjPNcT5IjD3kVCRCBFAACQDvla7QHKaFFrSTroOW8ISGBwumYASIU8Fy2OGG2roAAI1\+Xzdvr8Mf\+RJLN2ToBThhwXjUapwVxqMaq0jBggQ3giaGd6WJUWerxWzh0qtHvm5WfoIdnBW2Oq2KSLekKUx5t7U24q6ApbeImRSufCQIoSA2SAwJDnCwPGCkSpQpOtVIBxR5yOuivPTYQ7rITAddqMl0P5QDdm0vO5Lds8Gqd/vA0PrE681nOOULHddadlMCKSGZx3\+vytDvtHPv1cb35ypgyQhM/6odObonQqm0PL6YF1X7ToLvKaaR7f/GHRyw2OKxvyXbRYu3XuOwbnjiIZAgCE\+F2XHN6MyfkFp1EBXIwVgAOp3lruNEh53zlrLrz5eK5Dsda6iFhhhLXX\+zbpJwmvtYllgPApytw/fTEhPjtn92VMHhnw3X62j\+N6/SwR4DLRAKWZZjEX05AlYz4sACAkxbojerfGZlDrtZdtljN\+W4XHUkgBUFqVHiIhen4\+LUx6PZbzfqqYJhkAca6PNJAMECDDrxUCY1w9AAAMbbP3caOeHwnsJYOxg6NlWp3K7l9o1skAMjwbcdjCet\+cgFc98DCIQJYPXDK5evn89s8ZPAAAlKbU5WHMPp15rN3mTiljmOvn5w49nwFnq4ea6fUMmdOOJAmIhp0nkv8ZktAVq60LLDNoRqbjObO\+naKACGnQz32EbbH2D2Me6wynyZzCWbmUr9DHwUygpJrcaHxKptVmCN831tmSGZx3\+kBKDx2Nwgs20/n/DEruMdEW5xyjQTkwaTwAAGQINXxMO0IIIYTQZ821aM\+k/jt\+/Hj2E9P5Drd6XaQtm\+1ruPT1dZG2Mcsc5qq/zp/py/Y1XPr619sa\+m5JTfr60pMo3Unabk01Rkkc/lmo\+p4zazfzhy8kB5b2tUX/8LOPVlefrl7HD56Qvr4/bA5vfiHaX7f0hT\+EZsGJ6p9FO/t6/vBPoerVHw35tn\+lC53/sS60dlesf3G67XDklYbkiDJ/eKWnc4zqkdf\+o\+2dMb5It73CbX6lr/MCv25t25m\+dNsr4a9v5jevPnXP1y\+\+dmHwVHc2dPzhcN/fdC77khNZva8tevidvs420jmydLqzLTFqC\+Me14UXwt99ofMPP\+NeeCfRvzDZ8LMPFBBc\+0JfXzbd1hC9MMaKEzW56/AW6Gu4\+k/fvfCzXZHDDWTwtHRGNy89rlh64bWBn2gfOfzC1Xfa0tlstq\+t50zb0GonO/uyfW0dm9eeWb32wq6R7ZtuO8x/9\+tnf/bOwDWWaHgl8s6wLaTbDl/9w\+AZHqIzuus/Osf8QzGO9PBTmr7w2tXXziTHLT5ZfekhR5c4/E\+nABpW/yza\+bHtYGBH0Z99/cLhzmzfGX7ddzuGnYG2yNr5JyrXXr3Ql/\+4rvqjVwZbKvYfq09VVn/0H4dz5zPZdoGM\+ZPpu8CvntVQfSsqjxBCCCF0k44fPz7ZeFZ0LdozqYD5/Nkzy5Ytu0XROEIIIYQQQgghNBEnTpxYeOddk1plMrPhIIQQQgghhBBCn1kYACOEEEIIIYQQmhIwAEYIIYQQQgghNCVgAIwQQgghhBBCaErAABghhBBCCCGE0JSAATBCCCGEEEIIoSkBA2CEEEIIIYQQQlMCBsAIIYQQQgghhKYEDIARQgghhBBCCE0JGAAjhBBCCCGEEJoSMABGCCGEEEIIITQlYACMEEIIIYQQQmhKwAAYIYQQQgj9/9u7\+\+goqrxf9L/cpXS5nCTlWoSUl5iUoKRAIY0MUL5kKJWRFlCakZHyoNLjCzaoh0Zdh4K5d2hnXaU9S6XnGZV\+cJSWkUM5A9IqSKOozcTzWMCDKWBMShxIieGmIK6hiI\+Xap21cv/o7ryR7ryQ8GJ/P4s1Y7rrZdeu3XvvX\+1dVQAAeQEBMAAAAAAAAOSFi/qxzt69ewc8HQAAAAAAAACDquCfLd\+f6zQAAAAAAAAADDpMgQYAAAAAAIC8gAAYAAAAAAAA8gICYAAAAAAAAMgLCIABAAAAAAAgLyAABgAAAAAAgLyAABgAAAAAAADyAgJgAAAAAAAAyAsIgAEAAAAAACAvIAAGAAAAAACAvIAAGAAAAAAAAPICAmAAAAAAAADICxf1dYXDB\+sHIx0AAAAAAAAAfTJi1Og\+Ld/nAJiIJkyY0I\+1AAAAAAAAAAbK3r17\+7oKpkADAAAAAABAXkAADAAAAAAAAHkBATAAAAAAAADkBQTAAAAAAAAAkBcQAAMAAAAAAEBeQAAMAAAAAAAAeQEBMAAAAAAAAOQFBMAAAAAAAACQFxAAAwAAAAAAQF5AAAwAAAAAAAB5AQEwAAAAAAAA5IWLBmm7a9asGaQtAwAAAAAAwE/JggULzs6OBisAJiLp9v82eBu/gCS2/S9kxWBDJsPZh1J3JpB7KciHCxfOHfQeSgtAjxLb/tdZ2xemQAMAAAAAAEBeQAAMAAAAAAAAeQEBMAAAAAAAAOQFBMAAAAAAAACQFxAAAwAAAAAAQF5AAAwAAAAAAAB54RwEwMl/vHbf1YWV5R3\+XXvN3Y/\+busXNhGRs3\+Np/O35YWV5YVjZ7182CEiopP73w7OnnVD2djywsprr5l13\+I3El8n27buHNyxUr77hpFjywsry8tuvPl25c2a5tSKZO9adk1leWHlBPntb9IfJb948e6rC3/\+0MbGbMlNp\+e6Zz6zu6bt6pG3eGY/89f9Lf3PjEySykcu2X4s8\+Gxvz2R\+vCaFZ/Z3WRXeWFleaEnuDvZvnrbv6E3emavaD/kXNnV/K7vxvLCn9/3ZmNm4eQXL993dWHlDf6/He\+Ywusqywsry294/nO77dPUupXl1yhtyT5Z88zNhZU3\+P92aPfz3Z3ByvKh9715sP1MnbVMPr1EXT3Sc7d/TTofTs/DVJmcvfWb9OnY9ab/vpuv\+Xl5YWV52S2z5Gf\+2iF7ya7/69KHPNf8/OrCyvLCn99ww0PL3qw/2YtcOk7ZZNZq//fzG25YFHxTP9n9t6nyoySOEREd3/12UL775pFjywvHXnvN3ff5nt\+eyvNjWx8aWVle9tBfv27fUcJ/Y3nh2LtfPuykM\+HuV/a3n6CTfT\+PRETO4e0vKnffcMu1hZXlQ2\+5\+fZFy17bdZyInMNv3j62vPCWJ7Y0ty37zcaHri2svFbeerz9uDzBmrZz3fhX\+eflhZXlhbNe2Z/sxY\+lbcPJf7x237WFleWFN3b8aecoCc7BDfeVVZaXPdR\+aPau4A2V5YWeZR\+2J7j3chfjHAU\+c0KXbD/W/bme9WK9k2vHjYkXl8y67sarCyvLh9548\+1LVm6s71DYkt98uObRWzwTytKHP8uX\+SFQ8vPfzSovrLx56a6TbRs7\+MasoZXl1yiJ9nSOvfvlTAKcxr/O/nn50Pte\+4\+PnujuR1ReeONDG/uTezkP5LQqceiNntkrXqtpzJYtuUry3k/TZzlTLJ2Db9zdpSR01eW8/HzCdfc9\+uLfUm1KP381OWWtw0\+ruzq2pN1J1/DdJO\+G5z93iKj589eUu6\+75drCyvLCsROuufuh3239h92r4zq5f82swsrywsobFnduPk6rWHqWu8rNnsieqtxcJXzrxwN64nrobGStxre\+\+8zNhR1a22M7Ur\+stjQf37LkhsLKq2/fULenS72RbibaMv\+0M5L8ZuOSCYWVV9\+ypq0pd/avuXtoZfnIJe9\+3e0xttXAXf/dsPhvJylH89djSctZRV/3TIfKvBf63Ub3slUaoH5O/sp6gvpcmXcbQZQXVl47\+\+1vjnWobbLWPDl71Fnkavvaz3X3RfpMO/kwiAbxPcA9cQ0fM26oi5LJY9/WHdn33qonao\+43opOLUl/XThy7Igipm3pojGlQ4joeM0z989eV5ckoiElVw\+nI8bO15/duWnHirdffnBS0cndz98//dXa1Lflw5NHjh76dPPy6bs/W/2nF\+4d0bax5q1rXqmZuvKXRf1NeuHIscNdzreHvjpat2PdkztqPlv7p2fnlDE9r5jd8X3b9zRPm1lCRCcPflR75LQF0tnV9ueIa9j2L0uuFspYFzktzQcb6naoy2vqWz7\+86JxrpzZ1bt07dm88ysiIjpQs/3ggusmdc60I1tfWS\+LT7iLO3w2hB0x5qYqV5KS9tG6r74lGlI2dnQJQ1QslLhc1FsDnsnpEpV0vm080KCtf0Hb3fzWx7\+9PvN1Og8zisYOdRE5X29dPv2JjUeIiIrKryxyjtZuXVe79aPtq//00r0jmGN/Wzb74fUHUt8OLzl5tPFAzfqFNdqnL6\+LTL0iZy71yFUujCx1uSjZ8vXhQwc\+en3h7kP0l1fvLez8bWbhYaOLXHRy95qHp79Qmxw6fuqMeeXJxj01Ozft27k/2fEw\+5CA/pzHxnf9Dz226ajr6km3zat22fXa1o/Wf7q72RV7aU4vd9uwc0v9yerJxUR0bF9iz3fdLNLjj8U5unOj3kJE9G3txt3fzCy7olO56bYkPL7kAVVbVfPay7tu\+8MvhlHyi00vbTxAJTMWLKouOW0Hvdd9Mc6yZHuNlzqhqU5Z53PtGlNemHVvzuE3ffct3/otEdGw4SOZlkOfvr/60/c/2PHyuvDUK5jkF689en\+gppmIaGhZOTUfaajd9ML9O3aveP/FB8f18rf5g/bimg9mrrqzosNnrqJrJk46VJokp\+XQgYYWoqKrhZGsi2jodaW9/8n38kCqMzsdPmbcUHK\+PXTgaN0O9ema\+uT7f1o0qZtaPVdJHnrTbc/dr01ft/7ZNXfe9NvrmcPv/W6NdnKIGHpyzqgeUu4qF0YWJ1uONDR\+tfu9Fbt3fvjkug0LxgxM7dcuVx0\+Kr1MydVCGUstXxuH0i0pvRWdcUV3WyuqGCFOTLYQJY/V1x35oa1ZcY0aUeQ0vuu//7FNR4mIioeXuZobj\+z7YNUTOz\+tX/f2U\+N7OK6WQxu31hIRUeOO9\+uO/WJYaT\+OlajHKjdnIq9nM1vpe5V7cdEAn7iU3J2N06vxy4Xh48vXHTpi1B1PXse6Tn6t1x0hImrcYzQ6k4uZlsbdhxuJxkwcPdS1m4jS9Qa1NB5saEw1E8m/vPrgCKabM\+K6YubjS6bWLN/xxitbpr90bxnjNH7w4htaslB8YsFtFd0eo6tk1KTxx78lSjYfNBpPEg27ckxFkYtcZaNKKFfzV52rpFGPVXQfDEwbndsg9nN\+\+nKeoOHphXpdmbfr3CUuGjW0b7mes0edRXdtX5sei/SZdfJhEJy7ALhk5vJ10anDiIjoZM0z3unrDtVsrTs2dUrq66tnP/v\+b9vbsxRbf32FWpekkfNefDU04yqWiFq\+ePnRucruv26qnzOuaL3yRm2SRs5b\+VLoV9ewRE7zZ6888fCK3e\+teH5a9St3pmuvQhc1bFy5\+d7q\+df0r85tS5tzePsK5bFX9m1c8dK06tC0/jb55BpalDyqbak/PrNkGLXUbdnV6BpeRkc7jkp3zK52dur/qh6M/nlRqv/qNP7V531y677tOw4/UJ7cmCO7Jo3oRcqaazftbiRhzpIR2qr3P9hUv2jS5A5twJAi1w\+1L675YOaqX3foLLpG/erFbb8iIufghvtvCGrFM1Zs7nvmDHgmdyxRx3Y8ccujG7\+q2X6g5fqxqa875GG75sSLf9x4hFwT739p7VPTKlxEdLzm\+Ydnv7rz9R2H5sgtLz67/gC5xt7/UvSpaaNcRMlvtjz/mG9d7fpnX7mrauUvUxvpPpd6Uigue/nVe1MBf/KLl\+/zKvtqN\+mNc6pP\+7ZN8os9O\+qSNPKBF9f9YXIxEdn6a8qaz11l1K/LiEw/zuOxw4k9R8lVvUJ9\+d5MhoTe/K6M\+aF3\+ywsKf6usabmkD35OpaO76mpPV5YVp5s7NhU9OLH4hys2b7nh5KpD99x8o3XP31fOzbjio7du\+5LwuPBR5\+cs\+Xh9etf2vjg5AdKa155cXeLa9KK5TP63TPrtK/OxXhKjiXbNb9LlOVcd\+\+bLX9ctfVbKq5WNqx8oLqEIXKO7Xj69kfXf/i2dqS6hN4OrahppqG3hV5\+9lH3MCKy9Tf9jy7fWrNq6eYpm\+VeHVFxIR1//5VX5CnPdagKCsc9GP3zg0Tk1K\+8xbv6wJVz/vDnYHW/rzDmPpBJ44moQ5XoHPvbqnseXb2nfvunRx\+YVHR6RvVQkisWKA/U3P\+6Gnp96rPl6qqt37omPqnMG91Thredl\+Tx3W8v/03wg0//\+PTr1W89MRC1Xxtbz1WHL0st1FZ3tXzxpnL/wo8aa2rqjs24opuduq6Y\+fSfZxIRHd\+46PbffJSsfuzVzb9KhQHHtywJbTpKxZMWrn1xyS9LGKKTB99\+Wl62cc\+rT7849a3f5zwuu/7dHQaVT19YfXj1\+t3v7mmWZvbvslGzlqvKXVCy44WciUz1p/tT5Q65akBPXFruzka3P\+3GQ6MKN\+44/PnXLfeOKmo\+sK\+RCsuGJRsP7jp0bP41pS2HDhwlGj6\+ekQR7SbqWMM0bl/60MOvN9Ru0ZvnjbjC6e6MMCPuWCa/WfPqBy\+\+UTvzqTEH3li16Vsa\+/CSrKW9RPr9KxIRUctni71zXz86/tFVbz2RWrjls6VLsjd/b63MXtKIyNmfs4rug9wFpqc2urrH7dPg9nN\+\+nKfoPmpDO19Zd6mmy6xvav3yeq\+R51bt21fRg\+9jn538mEQnTf3ALva/ic758ju7ft/oOJblyxLdQWIqOiaB1/\+\+Jv98ecmuw7WpL5dtOxX6QsnTMn1Dzw5b2z60kt6K\+XV8\+66MrlnzStbcsyy6B1mxLRlTz4wlujI7vbt90PxCHHskMaaj\+psIudwouaoa1zVyDOqSYeQy5XMmV29ujR\+bN\+7Hx6lqyf9\+t4ZYjkd\+nBHnd3x6xG3PXhrycmPXnl5V/YJvWdsoDK5H\+zDiZoGouF3LHt8WqYuG1b9\+Lov9hz4eME1Tv32DxuIht/x9IJp6XbRdcXMBUvmDSc6qm05nJllNyC5lN67K1ev3FVUOryI6FDN5g9SU21Z94ORV17\+w/zrz1qr7Cq6qpQoqb/75q5vHCJyXTHzty\+roWVzRvQuihw6ZuKVdLBGO5gkaqn7cHfzsNHjyztXCz3/WJKHdmytTRaOv2vGnXeNdp3U3\+00fzK70smLnri1JLnvtWfV917843tHaMyDj83p7bhoT85GMW6u27G7mWjMA4/Nqy5JZThTOnXFtk8PHHrl16OoefdHtSfJNXHBkgfd6VaWdc/5/WOii1r27NCO9OoyScnE2fMmDql77aWNgzjNL/eBdD0jTKlbGltC9EPSTvYrTSXS8qfmlP9Qu\+LR\+/3vN5Iw72n5Orb3q7uGTfrVimW3ltAPdVt2HzrTRqWT3E3eaXV40cjq6jEuomRLss/JaK7dsruRaMy8Jxf9Mp3nxaN\+tWT5rSVEdTt6OK6TB3bsPEBl1TN\+PW/SSDqqbdzXz7oud5XL9DKRZ6Vh6o3\+dDZKxkwd4aKjdQe\+dailcc/RlmL3bTNHuE4anx1scZzDnx/8joqF60eddnWJKRv/y9ElREknmcx\+RoonzV8yZzh9tXnV61tfeVY9RMPnLJ/fdaShN\+xeNn/d6m8V3U0yBqSNzu28KU4Xoh5\+0V0XP\+PKfBDlbPt6KtID38mHM3fuAuDmLc/ef8vds265e9YNnlumr6sjGjlz\+vi2AvHVurlXdJgNX7bor19T8uTRliRR\+Yiyji0/UzSMdRG1fzuy47fs8GtGDSVqaT72XaY4Fl2/aMFtw75979k3ao\+d8U\+MHXHNqKFEzY3t2\+87Zuh11SNcR3YlDrScPLhbO0gjJ7q7XD9v3vTozzvcHnD17W980b6/fa/57p51y92zbrnbM8H75NbvqHjyr385nHJmV8Z3OxfeOiq92XG3K53uOTi\+Z6t2nEZWTx1TXjVt4lD6qubdPZ3uxS2ZuWDRTUMOrX9p4\+4zuBG6RwOSyV9tXj49lUuzbr7h0Y1HyDXxV3eObetG7AvdOK7D3Re3PPFhMyW/bT5J5Bp\+TaeL067i0iKGqMO3HfsiRWXjhruImo9925Yj/cql77SVj3pT5/SG273K7iQNnzJvUqZUdDxrleWFlZ7f6SeJrpj5uHLXcPpq85M3Trz6mrvv8z3z2kb9\+ID2yHvAuuc8/bBY/J226uEbS268\+fZFy373duJg74/aVVbtLkse3v7p4ZN2faKm2TWu\+prizgFPjz8W5/DOLfuSLrc0acSY6qljXN/Vru98R1HWkuC6Ys7jD940pHnrs0\+\+YlD59CVP9O46US91KMbd1Dvtqbp71i1337d46z/SaW4vCbNuuXvW7YteqcmSn853zcdaiArLxg3t9IsvLUn92Xy8uYWoZNSVJR26HcywESNLiZLN39i9OwqX\+9dPzChL7n7t2ZpvqJcD\+33U04F01vKPD9VXthwlGjpy3PB\+nq/S6iVP31pC3zUnqeyuxxf1eezaVTJuRAlR8tjhlgH9ueVu8rpwjunvvahqSaJyd5\+7Vm15PrFTnpeMcpcQUQ/H1VK3peYQDR0/s6ps7NQpV1NjzVbt6xzLZ5e7yu11Is9Sw9Sz3J2NbqtxV9m4qjKixpr6ZvvoZ/ubXWOrperRJdRcd\+BoyxGj7hi5xk4e0/X8Jk/u3/rKyzXNRGWjRpQwOc5IyZRlj91W/J22YtnqT38omvrYoqn9GqvvdfPXjR6r6P4k44za6NzOm\+J0Acp9grrqQ2XeHkHccvesW\+574rWcj8Y4ffVcPeoscrR9PRbpM\+3kw2A4h/cAJ4/W7Tma\+ePKOatXrbh3dDFR5ox3vgd42IiS7n4u/VM0auqiR9WdK9RVG2csGbCtDjmTFI2cWj3mtVe1LXpdec0hGr1o6vBvtnRepOsND8M71ujNXxltg0pFNz35UmS\+VOE6eYx6o8NtSMmWr41D7Rc5G7WNu5tp\+G0zRxczRePnTCrZ9P7OLfrxX/6ifZJG8Yg7lv/qzenqay/uEB/s2zH3y5lk8neHDuxr2874RateWDb1KrZtGnnne4Bdw68pdvU0JaHXY4P9yqXkEaOubepv\+a0rIk/Pqy5h0reFdr0vdOSoIhcRMSN\+HY2Nn7f1g5rD/zi4T9uybuemdU9fPfulzU/fOXA/n9yGVT\+1bu/UDzbu\+Pzg0bqamvWrPlq/6lnx6T\+9uqhXQUXR2Kni1Zs3fri7bmKzdsQ1/tGqkpqui\+T\+sZzcv/XdPeS66Vax3MXQpGnjKLTnfe3Ir65qHznMUhKIiBk9b7n87vR1dVQ45YnHpwzWBdpui3HHVJGLjrY/W6NjSaChZSdzXLbLVSZdlOUmKVcPK3ZRctOCRVN3LN/0x9fmPX1V71frm57T07zp0Z9vav\+zaOqCRf2cdktELXU70lVo4/6aumNT\+34La//ne5\+xfaEbx4Xa/7xy3vLZ/bq7J3ue596arb/7YQMNmz5tbAnDuqZVX/n667vf3dN4Z0W397r3Nw19SuTZbpiyyt3Z6LYaZ0ZNHjNs3XsH99UdTNYd\+aFsnjBmXOHI4s21NfWHhumNSRo5saq9O/TVurlXrGvfYvn0RY\+6i\+1dOc4IUzFjyRPqzhX7kq6qRcumXtXPpqH/U2N6UUUPVDIGaP7OeVOcLkC9OgX9qcw7RRDUMrGlb8NZOXvU2WRr\+3pRpM\+0kw\+D4BzeA3zXy9uiU4c59W/Ovm/5p0cPHe9ceru7B9g5KZQV06EjhxtPUvsUNefwZ3uSIyeOLipNf3uo07dHvzj4LdHwsorCtuCBqOi6eY/d8drDG19cs33mmR2Gndl\+ec7ZqT1xjZoqjnrj9T0fvbu/PjlqgThqyDedF\+j\+9oD01YIq5X//edE41/EPV8z9lXroSH1Lqktbmiu7hqWT2\+Ve04e8yu70gl/vfrfmWyJa/6uJ69v22PUBJ65hEx9eNGPHk1vXvDbKfQYZkNOAZPLV97/18W\+vZ1s\+/919c1cZhw42d\+7VdXcPsDP8mgp6b8/RL75uoVFt1XHLFzX1rrGTryru9ttk4/6jSaKyiqEdKq9\+5FLhlNWxV\+8to6\+3PnnLE\+8dOfyN0/HYc9wXWnTVL\+\+5KnX78bFdK\+95aPWerW/uWHDbTJeLiJxkSzKZaZOSLXaSyOVizuSyQjeYUvedj7rvJCJK/uNN5f6F72uvba77b/OJcRG1tNjtkV3yWDJJVMR0yPZiYVr18PWbdry7vuUQM/reiSWurgFw7h9Ly6EtNXVE9GnwlpJg5kP93Q\+PzhmVuek9Z0koHls9vnxd3bER0sThA3zRoEMx7qZTkE5Vx4\+aDxG1lYSeE8MMHVleRHS0cf\+3J\+e0Dxke3/\+3Q4z7\+lFFJaOGF9G\+5q8bmp1fZH7\+5Bw/fOg4UXHJVaXkYl0uouTJ9rlnSbs5mSRyFXa6es\+OuGOZ/OaOVze\+uLW3jzbrkx4OpP0q1ZhxQ13kKioXrp85446Z7n7frX38w5dC64\+6JsrzhtW8vvXt0Muzx/\+\+b4\+saz6oNxO5ygfyQi31WIdnPkhfvHMNHTmx\+s57Z0inz4/tUVue7\+mU580H65uJXKW5juv4nvd3fkVE7z927fuPZT6s3bjvm5llvX3IUJvuK9VMlcv2nMjMCF33VW4vS/iAytHZyFKNFwvSuML3auo/\+7Tl0Mmh4yeOKCovur6cdh6sSewwmmn4lOoRpw8VuIqHj5k649dzqq8pdR3/MPsZYYjIVXbTpJG0r668anw/iko6kb1v/rroRRV9psnoSxvdm1bp7PRzfpJ6\+EVnPuh7ZZ6OIDp\+NNj3AGdt\+3IV6bbj6GcnHwbROb8HmBl9x/LZY\+iH2hdfeq\+nm8qY8snTxg6hkx\+tenFH\+tUCTuO7S5fcP917u29r87D0t6\+szHxLLV\+sf2njAaLySdMmdr6eVDp50RPVRcc/Wr\+p/gymQbd8vv6F9QeIyifdOe5MHhVLruIR06aOSO5R13/63cipk0YW96c5Hlb98KIZQ\+nI\+6te2XW8p\+zKZFE2yeaa97Xj5Bo7/YElDy9c8vDCJfJtVxMd2f1ulzsYmbLbls8f72p47/UdWd8ldUYGLJOJiKjoukcfv6OcWna8umpHT7diMsPFmwSio\+\+tfOOz9HB6yxdvrnh4\+v233LgicTLz7Yq2b\+lkjbpq/VGiK6fMHN2pA93fXGIqpi56YpKLGtavVDu8hqo7zuG/\+jzXlrW/0IWKS65qK0jFQ8tKiZL69syNT87Bmr9\+\+h3R0JGjcj1qok9O1jx/9zU/n9A\+dcdVUpG\+oplkhpaVFxF9V7tld3pyr13/wSY9SUPKxnW40skUjZk5qezk7vXrDRo7VSzvJjjP9WOx69/dYhANF\+fdv3DJwwuXPPzAvEkl9EPtpprTbmLsS0kYAANbjLtVNHJmdRlR3esvbcy8b\+nk7jeenP3w3An3rdzdMmzsVHEYJT9ds2rj4cy7HA5/8Oyr2kkqmjh9fGlRUfnQIqLGmvdr07Mlm2vX76gjKqoY3aWTXjxJXnTX0JZP1Y0HuntM9yAfSOqTkpnL1338l3c\+/vOfo79dNKf/0S/Zu15ZoR4i4YGnn1See\+y2YT/UvfLCxr68tsf5escrz37UTEPGz5x0Zi8D6KqHOjydxqoHo3955\+O/vLPtlRd/f09/ol\+iVJ6PJKpb/0LbPE/n2N9ee/H9ZhoyZmb1yKzHlXpQIo2cIadbikXTx7io\+dPNWu\+mIHWSu8o91pdEdlPlunpfwgdSXzsbTMmY6hGuZP0Hb\+5udI24blwRwwwdM244Hdn93o6jVCx0OsVXz372/b\+88/Ff/rJ5VfDRqdeUugb4jGRNZF\+av476UEX3JRn9a6N72SrRWejn/ET18ItOLzVglfng66bt612RHpBOPgyoczgFOqO4ev6SeR89vL7mlWdrbotOTVc6X21ePn1fx4550cTHXnjuF3csn//X2a/Wvv7o7TuEkaWUnrJbPOnBJ6qvYIvueHr\+X6e/Wrv\+0dtrhJGlrszj6Yff8fRjU0rbJ7sSEZHrqrsenvdazeoDP/R5nkwmbR23L57pbMmikb\+cNHKVcYgE8Zcjiqm\+y9fNW569/5Y1HR8qN2bRyhVTOy\+UqqN3vFD72gsb5/150bgRubKLSdbmSI5zVNukt9DQO5YvD6bnoiS/GdWsLfxo58Z9x2dWdVy2eNzsRXPUh9cfPYNLCacZlEwmIqLS6kXLqj9YWPPe79bce1Pb\+4H2vea7e3uHO\+tcw6YuiSy4/tHH5215dP2eV\+fesGNMRRGlEzP0tifmi6VFzKNPztvx8PoDr86dsGPMqCKX09J4oKGZaMwDyxdVFxF1Cqv6m0uua\+Y9Nu\+1\+1/fs2bVlqmZ1yB9p6181Pt6h4FE1/BfP/e0OHWEa9NH6\+\+56YOx1eK4Ic01NdqRH2jYrb\+uHs4ww3/94K0bAx9pK7y3vCmUMdR40GhOUtm8px6sLsr8NDpngmvotOWhPt0PWTy2ekzxG9qnz95etkGc6S45Wa/tMJppyJiZ08ezRTRPFje9oG1ddvuEN8a0lcax9yvzRneYneEaNm6qWL5545Eh42dOKmNddd3sJ\+uP5eSBHTu/ItdEeUU484ANexftv//1PVt3HpRHdtlMl5LA9v5Aey1bMR7AnmgHw6rnL7mr5slNNU/fePubY4cXUfqlRCPnLbh3XBExUxctr9YCNR8snHXLK6NLmMwbSoqrladnXMUQVct3jP3o9QObH75RHzOqiOzDdV99R65Ji5ZNvYKhzr3TstueWCBueVY7OWDTDHt/IMkDA7irls9efHb9ARr5wJMPVhcxNENZ/r4WqFm14u0pG\+7JOTu07TeYbN5vNCbJNfHx7E/T7S8mZx3u6tpMnIlh1Q8vuavmsU27n7719jfHDi9i0m\+\+cU18XHkg\+3GlHpRYXL3o98szzydrvu7kvofX6\+/uaLzjrtRCva9Yiq7LVeUS00Mie6hyr8hZwgdNts5Gt9V46N5xrrKJVWW079BX39LV08cMcxEVjbxpRNH6msaT5Lrp9BuAO8t9Rh4cqEi/6Loemr/u9aqK7tL9K65aEvmt1P1R5y4wPbbRNL5XrRLRIPVzfvp6\+EUP8tWE02uep28jomw96l69aLNr25e7SF9T3rZivzr5Z/iCVcjlnI8AExGVTXni4SnF1Ljpjx2e7/LdoQP7avd0\+Hfw26RDxdVPrfuPFxdOvZKOGLV7jEZGmPJA8K3/nX5jWPGkp976j5cXzkh9u6/uq2\+Lxk5f8fa6F7otQ\+zke5\+Y3o\+7lNrSVvfVt66rb1Wybb\+PisdOnXI10dWTpo3trvFIHq3rmBt7dtcd6WbspXjc7CXzrqTkvldWbP1HT9mVQ/LIrnf3fEfDqu9sHzl3lVRPFYupuWbraReSS1JncEANSiYTEZHrqpmPzZs4hL5SQ6/Xtz0Hsvkro2N50/bUtySJSqeu/Dj2wgOTyk421O3ZV3fcNX7Gwy98FPvTgyMYIir9xcr3Yy8smlTmNNTt2Vd7oKF5WNWc8Fvr/vCL7uax9DeXWPeDy6eX0Hc7V67Zmcn55BGjU3n4tP4fJ\+mqe1fF3g8\+MKPKdaTmvfUfacdKxLuefHVz6NejXESuqx4MrVt7/5Sxhc1fGbUHjOZi4bZFL74a6vQuxE6Z8Om\+L3LdbtptUicH3//LS09PF0d9V7tp83s7DBp76wPhP617enIxUfGkBa\+\+HZx3U7o0Hjo5fPxdT7664amuD6kurZo2cSi5RkvVWZ8dneXH0lK7seZQl7EgdvSdUwWifdt3HD7tYLovCQNq8Ipxd5gRv4689VZ49vhh3x46sK/2wLclN01X1sZikdTLnFzXPPhy7O0n7xjrakyl6giNnPHwqx\+/fG9q8n/pL5TN61bMq0qV57qvkmU3zV6x\+cUHuqsumHHTFz145Tk6kAFzcrcaesVIlk9f8kTqN\+u66q7HFk0c0rLjpVU9Pbk38xs0GpNDxQdWxt5eMBjXUPpdh/cZU3Zn9K1YW57vMRpPDhcXvZj7uL6p2aodp6KJ08X2p7WXjL9rUhl9V7ulpjHzk\+tDxZK7yu1bIk\+rcvtSwgdSls5Gd9V4koiKR00eM4yIqGSUu4wlIlfJuEmp4LDTDcDd6eGMDOBjdfrW/KX0soru0v1raHb6W2B6SmRvWyWiwenn5IHcJ2iQZa15etej7lbntq\+HIt3xBzcgnXwYOAX/bPm\+TyscPlg/YcKEHhdbs2aNdPt/62\+qflIS2/4XsmKwIZPh7EOpOxPIvRTkw4UL5w56D6UFoEeJbf9rwYIF/Vhx7969I0aN7tMq58EU6POCc3j7a29/fvq8RHb0tAdm9OWdkJAdMrldyxcb1Xf3n/5OhZLr7pWn9edhmGcRzuM55Xz9t42bdp/\+1qLiUdVz5kwelsfzpQY2Z47XvL3xw9PfFFp0RfX0Ob8836elneeJP8\+Tl3/O9/YIBSbfnINmDh2bvIMAOIUZMe3Rp6ad61T8xCGT2xVdM2fBNYPyCN3Bh/N4TjEVv7j3iV\+c61ScjwY2Z4ZV/2pR9UBt7Gw7zxN/nicv/5zv7REKTL45B80cOjZ557y4BxgAAAAAAABgsCEABgAAAAAAgLyAABgAAAAAAADyAgJgAAAAAAAAyAuD\+Bqk/iYJAAAAAAAA8shP4TVI/TuGn541a9YgKwYbMhnOPpS6M4HcS0E\+XLhw7qD3UFoAenQ2R08xBRoAAAAAAADyAgJgAAAAAAAAyAsIgAEAAAAAACAvIAAGAAAAAACAvIAAGAAAAAAAAPICAmAAAAAAAADIC\+ciALY1xV3QEcO5Pf6IZjmp7x0zHpJFnikoYAXJH9Esavtc8QgsU1DA8qI/atjpj61ExCcJbEEBy4u\+cMJ02vYTkd0cU8Bwbm8gqmUWN1S/xLMFBQWsIAVimaUtLeL3CBxTUMAKHiWeSUt6BTdTIAQ0py0hUQ/b6QjcIa19hT4xo97OmyooKCgo4OSYRURkJcJeN8cUFDCcWw5nDoFsPeITeaaggOEEbyjRlkHdH1qWfMv6eXeHfAGztZDE8bJqdv5M5ARfzMyyDsCZy/J7hN7I1gpkqxK1aMAjsAUFDC96QzGjra42on6RZwsYzu3xhRPpej1L1WfraiC1cZaXAmqHE\+aYsYDEFvC\+uNX\+0cC1AjkzwkpE/Jn2TQ7FUYwuEDhxcMFw9LDInN4RLShwK7qth6VuvhMCCZvIivsEzhPttnDbetTvcfNsQUEBwwmSLxw3nNO/ZQoKCjhB9PgUtUMftBtW3Md3l0Ruxu8WCKwY0ts2bif8ApPpRBMROUZE4nhf\+wc5N81wguhVYp1Tk2qQBI4pKChgedEbiGbapM59eJZ3S3Kox9Y\+W4OVpW9vG6riTUcznoCqZ5LmmLGAJLBMASt03Gv3raRjxEKyyLMFBQwn\+qJtGyEiKxHycAWsp72bbCcCQpegRM2WfReuczUCXDp5Ze2p1tbW1tbWU01axMdpitcXNRwiO6F45YjjDWsN9bEArylyqifiGBGfL0q\+mNHUlAgKiYAcTNhEjh6R5aDpDsYbGuIh0Qh5fRHDIXLMqE8OmlJEbzITIdEIKxHNJrK1oM\+f4JR4Q1ND3M/G/L6w7hCZsYCsaLwSM5rqVR\+pvlRayDFjAY83bLJcMdMh9bbtsFNW1acPoLW1VVdEpvsD7QWmdMrKzZ90EgtKHDmm6veFLCmiNzXpEckIyYGYRURWXJEV3R3SmpqMqNcOpxOb5dCy5Fv2z7s/5AsXK/pDAS4RDLX1XR09GgxbUjDo4c9lwuAnLcvvEXojSyuQpUp0jKjPq2i8Eqtv0MKSE/bJQc0mIisW8CqaO5RoMrWwx44qoYSVteqzE0GfP874VL2pIaZw8UB6I2QlQl5P0GC44s5pHNBWIItU\+2aIwXhDQyIkWWFZRjG6EODEwQWEEeRI4pNPPvnkk22r51cWV8xdtS3VFY36BYaI2IpZq7p0UtWAm82xRSsekMTfRE3eG1y7ebMaCoik\+iRPKF2nxvzi\+NS3kc2bN4R8bifx3D2it/2S5uk4UVFTu968dEpp8eTFG1JpjL0w71cia8bbxr5sI65ZSVuPt4WwlhY3GLfHzeXIgdJpaxtOtba2nmoy4mEfl/CJUiDTZ3SMiCzevizBiIHIhs2bI0GZN0JeyZe5SMpUzN3c1Nra2nqqIR7yMIllPr\+aIwTO3mB137e3YgGvP8b4onqDHvWxcb\+sxC0ishNB2RfnAnHjhB71MbFgMJajldTCPl/E9oYTTQ1ayK0r6Y2QrUe8nkCcuGKmQ/vlODZVPrLtRFvzZqlyjuy7UP2z5fs\+/fvP//zP1l7493//96zfnfhsaVWHALi1tbW1tWnz3NLSaWsbTp1q2LbykaWbG1JfnqpfO6206pFPTnRdqWHtrNLK\+ZubWps\+WfXI4rWZXkjT5rkVFXM3N7Weql81pWLKytoTnfbc2rTtkcrSaavTi5\+qXTWltGrxJyeats2vrJi1oSEdkdevnlYxeelnJ1pbT9Vv2/xJw4n61VNKqxZ/lknwqc\+WVlXMWtvQm4zInRWpA8n8eDo7Vb9qSmnlI5\+cyBza/IrSWWsbTjVsmFXRvsaJzxZXlU5ZVXsqy6Fly7dsn2c55PNd7kxuPfHZ0smlVYs/OdHa2nqqfu2sioq5axsulGOD81WuUpfl93iWUnYhyJF7WVqBbFXiidq1ix9Z/Vn64xOfLK5K5XzD2lkVp2d6lqrvxGdLq0rbA9qmDXMrU\+3/qYZPNn/ScKJhw6yKivnb2mrqvrUC/cuH1tYTtRtWrf4kU1c1bZtfWToQ\+4SBkf3c4cRBV7l/6Z8srqqctXjxtIriyvnbmlpPNWxeOquq1EVUXDFl/tq2ruyJ\+g2Lp1QWu6i4ctriDZn2pX7z4mmVqYUnz1q5reFUa2tr0\+a5lVXzV62aP23y5MqKysnzV3ftD3fnVO3KyaVVSzO1aWu68arM0ng1bZtfmQkdOx7NZ0urXMVTVnXa44lPVj2yeHXtidamTx6pdJVO65yepk8WTy4ubmsyc2naPLeivcPe2tratGFuRVsqTtWumlI5Ze60qsmZo2jaPL\+idNrq7F2\+bo6iadsjlcXp1qNh7axSV\+Ujmzt\+f6p\+w\+JHVm5uOHVaH/7EZ0snF1ctzdF5ztpgdd\+3P1W/YekjKz9Jf3yqduXkVPvVtG1\+ZeVpwUOWVvJE/aoppe2pOvHJI1UVczc0tLa2Nn22eVv9iaZPHqnsmKcNG2ZVdCoG3TnVsC1VSF0VUx5Jl9ETtWsfmVZV4SJXadW0R1Z90nCiYe20isr2pvNUfe7OUA\+d\+ez\+8z//s6/x7PlyD7DjOEQMQwzDe5RIyMunLkU4lm4xrMAxZBuGzbrd6c\+Jc4u8bRimw0mBSNgnZBY3LYfjOYZsXbMYzop4U5MMpIBqOESOZRg217YVhne7OcswLIeow9UahuU5MnXDJmIEj1fiu17WdxzbccyYIglsAcMKHmVQZjfahm4xbklgU3\+ybkkgQzOPmZrp8O0f85LAmJphZTm0Y1nyLVt\+ZjnkCxwrKiEfE1NCmmXGgiHdHQzKP7VjhPNJjqoGepSlFchSJTqs2xeO\+MXUx45tmjbL8yxjm5pJHMV8qaljmUlfWas\+p3MSOMbWDcshhpe8Es\+em1aAdcsBf7o\+dox4VHNyj2PAeQInDvrKsbSE5Y3qibDEJBSvP876Vb2pIR4UDCU9/c/WQr5AnFPiRkNc4RIBWYlbZGtBny/G\+FWjqSkRcpshX6q/S4y9L6aacjShGXpE1IOBqHF2GiDHSCRMzhuQOw0Ss1IgEva7WduIJSzeq3T\+lpMCfonRY1o/6lFW9LjJiGs2ETmWHjdZUfbytpbalm0kNEfwSFxfunyc5PcJZjym22Rpcc0R/X5Pxz4jI8jhiOI9PTqw9JhmCR6PkH1vORqsbvr2NiPIoYgipWsP2zRshuNZckzdcDg2EUhPjZbDCYuyBg5dMpXhBNYxNNMm4kSvR\+javjmO7Ti2Fk41nrzoi5w\+Nu/oEZ9PJZ9qpIeU/appG2ogqAvBmHnC0sJeO\+IPJkiSBUeLpadcO2Y8ZnKSN\+f8gbPlvAiAHTMeDsVJ9IqdGwhbiwRj5A3KAuPYtu0wLNv2HcOxZFtOx7PqGNFg2JIUv8g6tm2ZX8YS5IvqTfUxP6P6ZSVhO45pE8u3bYVhOYZs22EFj0iJcCQ1Py4WCsW/tm3bzvY7dGzbsW3H7Q\+rG8I\+wYr4vKnpw/08/K/fmn356XdXOKkjzpRLhmFZxrHtk07q47bPWY5xbLvlZLeHdjJLvtm9yM\+fFFZSQl4n6pNlRROUkJyjdgI4Y9mqmnOYpAtU51aguyqxUyOQusAVCEgcOZZlfZ2IW1I4YTbEg3zCLwdiVramhOE9IqtHwnHTIcdMRIKxfcccM/sZG\+BWICdL9XIFBZeMVixvJOp3o\+66UODEQV9wUkCWeI51NDVui4GgTxI4XvQFg15KqAmLbD0aM4VAUBZ5XvSFoxHFwzO2Ho2Z7kDQL/Ec55aDQQ\+jqamIhyl1\+/wSxxCxgiQwlm7a/UuY/eUfbr6sUye14z23p3Fsw2J4MROEdf3WsmyGF/mu33KCwJFl9KOVZDhREhw9rltEthY3WdEjihJnJXTLIduIJ2zeI/ZxyIPheJ51LMtxbMtyOEHIsX6HPvwll98cZfyhgNT16LKs2bHB6r5v36lXbsVDoQTnVzw849im9fXOuOEOxc2GRMhtBGV/1HSytJLEiSJvqmHVcMixtGgwoh3LEeSk2zfWE4qqa4MSkwh4fV3u9HaMuGrwsuKTeN4tB6PRoCwwZJu2TQzLcyzLS37VMKJenpNkt6PFdZuIHDMRNzmPfF7Ev3TROdrvsV3Lxl\+yrP3v0smPhEMdB\+UcI6b4AzFWiQUljqinn4RjxYM\+v\+r4ozEvT\+SQQ0ypR1F8Ik/EB8JKXIrE9CVy92szvDcUtRTFxxd8nSyePN8nVRoWZS3unLfD/H6PV\+Q9noiqK1Ivi/xpey\+dokSCYoeVWd7Nkt2vjUE2rKSEPPHbY/yqqA/hL8D5r0srYPawuKWFA76QIUVjPoFJNRrFoj/olwSGBF8oFJcUVbOULGtznmA0pCgB4ZLZyeKquT6pStdz1BMD3ArkxHlC6maPFlOjYdnjxBLhwdgJDDycOOg9huEEjiEixzJN6\+vtv7nykt\+0femabFqObVoOy2emo7Bur0xEpmY5LC9kxjdZ3s2RatiOh4gYjusQCjn9HuFgK2Yp4Y43/TKskKsXxTC5ulhMls41c9o8m95ieMnDh6Jxw3Y7CZ1xhwWOZ0Q2EtctL69pFidKfe70OeQQMZSamtrD7jN9eMc29bgaDck\+Jh4L9HTFq0uD1RNbjwZ8iiaEYwGRJbLJoeIqOej3uFkiXyiU0Hxqwro\+y9qsqETCjhISL/nNSVflLL8kliYo62li3IpmZ5pKj9cjkOhX46bsb0\+obRk2w7k5NrV5wSMLROT4FG/C7xESHlmWPaIoijzLcJLXHQzHdFsSrUTM4KRglmsjZ9u5GgEurpy/OnUH\+4alU0pLpwUj4Q6DcrYekT3\+BB\+MRf2p3xzDpi9jZDiWTWz6t\+0YUb8kx5iAGlNSDQzDsCzDtF1KYVieZx3LbmV4luz2q/qObTnEsgwRw0sBVTOd1tZWWwtJ5HSsOHJjOJ5nHKu/l9aIiOEEUerIzbNEDMsyjtUhrbbtsCxbzLCdrgo5tuUwLFdU3O2hFWfJNzZXfv5UsbzIlXKCu08zYQD6gcla1UAvddsKdFclphoBMxbwesO2T42H01PVGDbVCqSWZliOZ8m2nEuyVn2c6I8mUo2AHvGyDrGnz3zO4sxbgZxYQfL6lWg8FnZbsbbHj8J5DycOeq9joMV0fOBAa2uroyndx1OO0yWuHZRpRgzv7tRHFXN2oxhWYB1Ty/JUZ4bjWcfUTqssbVO3iDttNm4v0ydJnK1puh7XSPC4OWIFyc0YccPQ4gYrevoccdmmZtoszzMMw/GMpeu5pmZn\+vAer0\+JxONhUQ\+3P3W1W901WN337VNhjJUIeT2KIUXi0UyoxHaKcljOzTG2ZbuytpKs2xeOG3Zra6tjqD7eIbbXec3ybo6sHBOi2nNCkKOabSVCMm9EA5IgBRI2MZzkddta3LBMLWZy3vNj/jOduwCYYTMxnxyMBN16MBBpm1BhxgJyyA7EElFfezZxgsDZup6\+hcGx9ITJpkIZO6HIiuGJJVKXRdKLu0U\+PcOdMrPsOZbl3QJr6XrbyzA0zeLcbo5xzIQay7ROlqZqjuDpOCTbiWPGQv72O74cyzRthuOyLd5frCByjpFoe0WHkTAYXuIrBFFgzITe4WOHFwUuy6FVZMm37PkJAGeKyVbVnON0XTC6awWyVIkska2Hff64EEnElPY7vVhe5MnUMre92ZZpE8ex2apEx9JiauZJorYeyz1t7uy0ArYe9ghS\+2RDhmGIfro3qvx04MRB/zEcz7O2obc9MsKxTMshIpbnGNvMTBK29VgkErdYnmfbP8yEkee0qWF4yStYsXC0042jVkLxSP6YyQoeiTdjIVXv/G04FLfd3r5OVU5jBY/IWvFYTHN4yc1S6u5XR4/F4ibr9vQ14nL0aFC13H6fmyVO9IiMHg13epOZY0Rl0RvudAhtGCYVeGbdfPcNVvd9ezY1xueLsKFEItx\+1zHLSwJj6UY6brEtwyKWY7O2kpYeUzMvonKMeMxkRTHrwLOtRQL\+Dq8ZNHWr6/VglhNYx9St1DKOGY9EYobj2JZlEytIciASi0c8djym28TwktdtJ9REXDU4r\+e8uRnkPLgHmBF84aDbCAZSbwmwYsFgQgi23SKeWcrt87nNcDCcMC1LU5WQznv9Ikd2IqTEWCUSzNwintmo1y9aajASNywjHg6EdN4ju1nW7fPyWkiJaqZlJiJKxEyVcMeKh3yyL5Qw9Jgi\+2Ik\+bI/CIphWVuPBPzBmG5ZeiwYCOmCV84aL/c7X3iPX3JiSjBmWJauBoNxxuOXeOIkn4eJB5WobllGPBRUbcnv5Zksh5Yt37J9DgADIFtVA73RfSuQrUp09Ggg4siRcOdHkjCC1\+\+hWDCo6papRZRggvHIIpe16rO0cED2BWO6EQ/5fH8w3T5v9olpZ6cVYHlBYLSwEozppmUkokpIY0QvHqZ03sOJgzPAirKHN8JKOG7YjmOofo8noJoOsW6fl9Mjwahmmpoa9AfCmsNwbq/E6uFgJGFaphZVQnES5b498WngD8DtC/p5bdn1bk8gHI3FE/FYxO/1hg1OcnPESkrIx25fKIpySNVMy0hEAx7x5ucMd7D/j2dhBY9IelQ1ucx1S9Yt8WYsmnCEvvzyHMtIRBWvVzHEYPr5upw3GPTYb8x2S7ISUeOJRDyqyB5/nITTbmR2LCMeCYbiJMo5rp5232Bl69s7hqqEDCkc6TJRmpP8XjYRCkY109TVoKI6ok/i2CytJDl6NCDLAVUzEhGfHNR5X44OCcMxZjzoD0QSpmUmIgElRpLPwzOp0FhRdYcYwSMLqSDL1GNBvz8UtxkrHpBEXyR1u6\+lJYzUU4mJOMkr2PFQxOBzPh/sbDs/XoN0qn71tNLiKSs/O9G0eW5plyS6pqSejH6qadvSKakviyc/sqHhVGtr64lPFld2PaTMs7ubPlmVfox85bSl2zJPMD/VsOGRyakXOpZOWbqtKfNU8M9WTasgInKVtj8uvputp54Gf6ph26r5kyuKiVwVk\+eu\+qTLg8h7nRWtrQ1rZxV3PQAiqkg9xfzEZ6tmVaQyoXJuhyfh166dW\+lKLThrVduTyrMcWnf5lvXzrId8fuvVk9NP1a/u\+Hx4gDPTQ6nL8nuElBy5l6MV6KZKPFW7cvLpFWjqDYYnatfOn5xqBKa0vTQkW5V4qnbt3MpUI1A1K/PaiVO1qya7umx8/uam1r61Av3Lh9bUXlam91JaNe2RtZ/1czcwCHKdO5w46KzH1yBVdHgTT/sbZkorp8xf1VZ6TtRvWDwt9RqkKYszfcLUa5CKU\+9MyryPpmnz/A4v1WnaPL\+y\+xdudtb9a5BcXStYIqpamnoVT0WWure16ZPV8yenqtnUK3G2dXrP0Cer5k5ur\+Yrpi3eUH\+itVdOew1SSsOGWaXt/f/WTN3di1crnXYUxVXzV3d\+BdCp\+s1Lp1Wk8qG4YvLcpRsyp6RLH764omrW4py/9h4arK59\+1MNa6d1DRKK00d/qn7DI1PSTVCH11x1HzicatjwSJWLqHNIdPrWi6etbWhtbT1Ru2HxtHQJbD85pxpWTytNt4AdX4M0ef7q1DE3fbY69Rqk1N5Xt\+997axick1eVdvDyTibr0Eq\+GfL990U7ewOH6yfMGFCj4utWbNmwYIFfdryTxWy4ixAJsPZh1J3JpB7KciHCxfOHfQeSgtAj/r9M9m7d\+\+IUaP7tMp5MAUaAAAAAAAAYPAhAAYAAAAA\+OlyzIiHKegGI4ZzvNb3rLITfr67JBbwvtzPVe7B2T52Rw\+5uz0O1hs1B3530B/n6j3AAAAAAAAw\+BjeH3f85zoVubFSxGyNDPx2z/axM25Fb8320nk4P2AEGAAAAAAAAPICAmAAAAAAAADICwiAAQAAAAAAIC8M4muQ\+pskAAAAAAAAyCNn7TVIg/UQLLzuDAAAAAAAAM4rmAINAAAAAAAAeQEBMAAAAAAAAOQFBMAAAAAAAACQFxAAAwAAAAAAQF5AAAwAAAAAAAB5AQEwAAAAAAAA5AUEwAAAAAAAAJAXEAADAAAAAABAXkAADAAAAAAAAHkBATAAAAAAAADkBQTAAAAAAAAAkBcQAAMAAAAAAEBeQAAMAAAAAAAAeQEBMAAAAAAAAOQFBMAAAAAAAACQF87vANjRQyInhQ3nXCcEAAAAAAAALnSDFwA7ZlyN5w5dHSuhxnR70JIwkBxD9buZAiGgIRoHAAAAAAC4EA1aAOyYsXBINexcy1iJcCii2\+d9ROmYsYDHGzZZrpg512kBAAAAAACA/hmcANjRQ9LoJdv3vTH7ctarmkSOEQt4BI4pKGB50RuKmw6ZUY/7nnf2bf/NlawUNhzHjIVkUWCZApYXfRHNyrVxkZcCAa/A8t5otxt39JDIeyKp8WcrJnMFvD9up1YOS7wUNhwrEfZJbo5hWF70BlL7c8yIh\+N9sdP27TBSMB4PyzziXwAAAAAAgAvV4ATAjFuJbZtfWTF3c5Mdk3lbC/p8McavGk1NiZDbDPkCqsH51NjiqoppaxvsRIA3VX8g4viiutkQDwq6Iiunh6Ed2HrCFMOaFu1\+4yYniqyZMGwiso2EyVYyhm7YRGQZCYsTRVYPK2HTE0pYlhEPikbYH0rYxLCiT1G8Atv1cASPV0LwCwAAAAAAcEE7Gw/BsvVozHQHgn6J5zi3HAx6GE3VzI4znxlBVhOJqE/kOV6UFb\+bdM20c2yTdft9HoFjme43bvOSm8yEaZNjagYj\+UTSdMshy0iYjFsSyLYshxiOY1lO8ChxQw9LLBHrlgN\+r4BQFwAAAAAA4KfnrATApuWwvMCl40qWd3NkGV1u/bWNeMjr5piCgoJLRi/c\+bXj5Lo1mOEEjs21cdYtCbahWbala7bg8Xg4WzNs20zojuBxs5wYUCQrKLklORBWE7p53t\+HDAAAAAAAAGfmLATAjtMlmO0m2LTUgKxofEDVm061nqpfPaWil6OwWTfOuSXO0nRDS1i86OYFkTE13dB0W/C4WSLW7VcNy4gHvZwe8YluT\+gCeRo1AAAAAAAA9M9ZCIAZjudZ22wb8rVN3SKubcw29ZFmOG6/4pMEjiHbSJhWL4dks26c4UWRMeOxuMGKbo7l3YKjxWMJi5PcHEPkWKblMJwgyUo0Hg\+5jVgco8AAAAAAAAA/ZYMWADMMQ45tWZZtM26vxOrhYCRhWqYWVUJxEmWJY1KLGKZtOwUc41iaYTtk62ooajGMY/fu9Uhslo0Ty0tuJ6EmHMHNM8TyIm/FYzojijxDjqH6JcmvGg4ROYaWMBmOZxmydTUcieV\+eTEAAAAAAABckAYtAGbdsofbvnC8IKsm6wnHol474hUuv9ITNMVwLOrjGWIEWRaM527mPVGarciMOvvySwouk2PuYCTs4\+Oy5P/bdz3viOt\+40ScIPH21w4v8iwRcW6RNb8kt8SzRIwghyM\+J\+LlmYKCS8YHLE8o5OXJsbVoKBTr\+vJiOxEQ0rcmH9v3h\+svKSgoEAIJu2tCAAAAAAAA4HxW8M\+W7/u0wuGD9RMmTBik1AAAAAAAAAD0xt69e0eMGt2nVc7GU6ABAAAAAAAAzjkEwAAAAAAAAJAXEAADAAAAAABAXkAADAAAAAAAAHkBATAAAAAAAADkBQTAAAAAAAAAkBcQAAMAAAAAAEBeQAAMAAAAAAAAeQEBMAAAAAAAAOQFBMAAAAAAAACQFxAAAwAAAAAAQF5AAAwAAAAAAAB5AQEwAAAAAAAA5AUEwAAAAAAAAJAXEAADAAAAAABAXkAADAAAAAAAAHkBATAAAAAAAADkBQTAAAAAAAAAkBcQAAMAAAAAAEBeQAAMAAAAAAAAeQEBMAAAAAAAAOQFBMAAAAAAAACQFxAAAwAAAAAAQF5AAAwAAAAAAAB5AQEwAAAAAAAA5AUEwAAAAAAAAJAXEAADAAAAAABAXkAADAAAAAAAAHnhon6ss3fv3gFPBwAAAAAAAMCgKvhny/fnOg0AAAAAAAAAgw5ToAEAAAAAACAvIAAGAAAAAACAvIAAGAAAAAAAAPICAmAAAAAAAADICwiAAQAAAAAAIC8gAAYAAAAAAIC8gAAYAAAAAAAA8gICYAAAAAAAAMgLCIABAAAAAAAgLyAABgAAAAAAgLyAABgAAAAAAADywkV9XeHwwfrBSAcAAAAAAABAn4wYNbpPy/c5ACaiCRMm9GMtAAAAAAAAgIGyd\+/evq6CKdAAAAAAAACQFxAAAwAAAAAAQF5AAAwAAAAAAAB5AQEwAAAAAAAA5AUEwAAAAAAAAJAXEAADAAAAAABAXkAADAAAAAAAAHkBATAAAAAAAADkBQTAAAAAAAAAkBcQAAMAAAAAAEBeQAAMAAAAAAAAeeGic50AADhT/Kzl5zoJ5xfznWfPdRIAAAAA4HyEEWAAAAAAAADICxgBhgGzdOnSc52En77nnnvuXCcBAAAAAOBChQAYBsbSpUsRm50FyGcAAAAAgH7DFGgAAAAAAADIC2cjAHZsp8vfXT44jzhmIhpNWN2mzzZ00\+60sHPeHgdADy5mSob9rOjic50MAAAAAICzaPADYCuheCW/aqZjRcdUfZI3qNmdlon7BY53i6Ioim6eLWDS/y2Kbp4TfDErvWos4BHbeAJx00r43SwvpJd2CxwrKm2bthKRsGr0LUZ1rHg0qlndfWXr0YDHE4hnvrRUnyhH\+rh9gPOD67Ixzyybc8ewrDdBlFw7bc2yaSKbWX74dX9ccdcdwwf5polLL59y7eUIywEAAABgkAz\+PcCcFAzLsuyLCPGAm/RoIGR5wpG2fjURETEMw0uhqCpzRFbcL0clVZU5IiIr5vMlWCa1mGOZjhiKhyWW7LjfEzEdEhhWUiKqX2CIyNFDXsVOb9PRo8GIEfAwRGTH/aIcZwSOLH2fzVUJHFmGI6mJqGRHlZBGHMsQkWObupbQDCbgs0Q\+s1PbslnvE7Odj\+OOIDCGGlJ0UfZ7SI3qnDeYWSwbW1Ok65/b1/6Bq7RK8vqDQZ/IMad/mzJ5ZW1CcTNEjpWIKsFwXP/y2MnUiorik9r26ZjxsBKMJvQvjyVdFVWiW5IDik/iGCKy4j7x9jeYR7YlIh4uvbwVkyWFjWgRie26y7ZcC0keVYolQiJ1SpurtEJwewOhoM\+dbV04rxVdOW6h58qizJ\+uS0vGDCspumfWmO//lfnshPbuf7x3NP1nc0Nd7aXy8wtPLPi33XV0\+byHpow8vkU7\+q\+O2yy76d7NC69I2k6SyHUpW3ap03g89d8/o7\+/M/sP\+5t/JNfwSW88M23kD//V8uNFJey/Nq5c/dyJcZlPiC5mSoY0P/fb6Pqj/yK6aORN057xnPjt0\+/s/P5n4i1T7hjRuYL6/puNmz6v/X5Q8wkAAAAAfsoGMQA2YwF/KDMcyzgh8RKFq3JzDEOW4hGJiBjOG4oqqVjYSigeMcwQOZaxz4qn/pvIsUzy\+vqxdysejrH\+qMTZDrFExHmCUdXHxHxyzKtGvY4q\+xJExAi\+cDS1fVsLy744w7HJfTtjMSYQCilyW7DnWMb/5\+HcHi8REcOydiIUNXnRiAaVtl3aelzjQ4mIh6XOSievjKcCWnIsPa6Gg4rXR4mYXyAiKq6cHwr7hA6BNMMKAkPkmKpfuucNu2quPxQUObJNPR6RpXgwpvrdDNl6WJaWbGemzA\+EgwJHlhaLhBfeHNc2JyJeLr25L9VgWBZDWQPeHmRS7timoSeiQUUSE5F4RO4p7CdL9brveedY29\+uiiqPrATTOZoK3MOxXTY72RsIhgIeniEiW4v4A8HYrmNUMcUXioRlIXUNIKIo4dgui6mSZCUclAU2ldvRgF9Rd9ncZK\+sBINegSEiKxHy\+8PxL48xldP84UjQwzNElhYJKmF155dOaZVXCYcDUvqKgK1F/L5AjA1q6dNz2hUJ15TVetwv9HS4F4KWhv3Prd5PRHTxz8Q75jx/1xUlP7u4bFRh7Wtbwru\+TbYvyIi/kn9362UuIrqYKSud8caVN7bQz0aWXtJybKb6MhH92Lhr\+1PrvmomSv54qsVurvuyueVHcg0bddvwE7VfNrf8eFHR8PKRP/xIP6a3mDxx8PcrN733/eVLV8xwpT45fvD3z2967/i/XMPGPb/suvRyl14x79bLat/botlEFxeOF69Ivhv9/d8vW7hiRon65nPHr3zmqQljPtpf\+32nIBwAAAAAoPcGMQDmveG4N/OHnQh4gkw4Fuo89JvhOKwUUrsfAZYTOWcZO0YspJhcKrrUTFtM7S4cseWQzGoBSaFQ1JtrC5mALEZyJCbGA0FZCYlGJOh1hyUlFPJJHEMMQ7ZtE8syjm0Ta0bCujsUi3i5DluxVFNO9JApDOf2BkKkxf0xzfIJLBExrCBKkvu0GMtKBBWVZq3V1LboWJZlKRyMG6bj5k1VCSb4xdvi4cwAr1f2\+Tyy5FdCPiksERFTOXexW48GI964Ip5RDMewvFvyhWMC5/EoildSOx1496swlfO3JaKpxDmWkYgG/HKASUS9TCIoB3RvOBERWSsR8vl9TCwecDuJoD9sy1E95na0UCDgjwjxgGBEfH5VCMUNibO1iN/vC/HxkMhaccUXSi\+cCAWCwZg7KvN2TPGrjF81ZN6KB/2BgBBXfUxc8QUNKRyPSqwRDfj9AT6uenkyVb8vSqLo5swOybZtp\+qRTxLZx8gvbBeVjBq39KFpd7DfhFdvHX/XuObaE\+MffPh9z/7wuo/ea0j90Bzt7ej0t9MrFF07Q32Qee7pTTvt7rfY/OXu51bvb/yRSm6aO1L86rnVnzf\+eNHIW\+56pjJnmHpp4fhrr05\+T3TpFSVD0mkbedON44/vfOrvly1d4Wnc9L8H6JABAAAAANoN6hRox1AD/rDukGObxpc2VxXwJNq\+ZHhfOOpPx32swFlhD\+/fZ7FVbo4h3SuGLGOfxVa5eUFm21ayDdUvaSxDjmVYgpuIiDhe8qRGEB3D0kwisrVIMGoy3qjiTyR4f0zizFiWFFqJaDAUSVi8LxhNeAXG1uKOQ6wg\+SMJnxkPKwEx6onGQxLD8hxrOUQMyzqJiMZ5PVHJrXo8PJmJBAXiqtz7fHEcIoahnDGpbcQ0W/AGvJ3GhjmPEvEQkWNqMZ2koF/qGIkygleRw554TLclgYgY1qMEbVkJRj0x/\+khdp\+xbq/PHQ7FNMvbcwTcEcMJktfLhyOaaXsFTgqEZY9HYIlYyetmY5ppE6dHE4w34vcILJFXUeKeoKr7gpzbHxJFr8ARcZLk4SIJw3LcdjySYP1qwCMwRHI4IRMROWY8qvG\+mF/iGeLloBLzRmOmx53QHUkJyiJHxPsVr\+qLJkyvj2fFgOrl7ahHNdsT6tg2MTz7Uxjx7eKikZNvXXrXdVOupLqaj\+RnP68bMuZ5\+lfdR1t/u2n3HffP\+t3/XDJnXXTBe01JIrr4Z7fdLweuK3QRuVi2bIjzzDNLMkPE7cO/ROS6\+KKSyklLF17Z8iO5hpWPHF64dOEVLT9eVDT8/yw5vr9t367LRv3u/3k8kJoCnfro4sKR141xff8v16WXlVxMROQaPi5wZ0nzRyTeMUX8Yf9Tjc6Us5k9AAAAAJAfBjUAZgQ5kpBTD76SVSmqZptLyooBNRGw4n456lHTo4t2IuCNuKOqj\+\+4oCAHY233AKd2wrpFSUrdA8xqbMwmYkUlYSm2FvL6hWDMJzCOmS2FDCd4g7GQYEX9finkkGMb\+75kZDHGMkTE8N5wIiLyLJHTlnKGFfxqImCpclz0BUMeSgTkSO8zxTHj4VCcxIjIETlEdGzXsvGXLOuwRPG0tXrMR5ZlM4LIs91vxrZshxPdXJcMZXlRYFXTsklIJZb3BhVVCgZVT\+ec7B\+G4wXWMSzboa57zsWx9IQajuiM4OdYYlmPLGQOw9B0R/AJrGPphsN5ODZ9HJzA2gnDZkTJm0m2Y\+oJi3MLHOPomuEQE5T4xK6vqXKKrIRDPjeZukmckI5eGZbjydSNk\+5OB8ByjKNZtkPE8gKRY3dOqG3bthkPSDFdN4kXZSUU8nU/aeGCkyRq/vKjBeu\+Gzl51Jx7ZrguLRk/rKQsdQ/wD3XPPd/c2NicjnJ//K8PXvvTB68RsVc/s/zW5IY3f1/7X91us/HTt279lEpumvtGdcPjz77z1I9UdO2MNfKJ3z\+9qe7HDrs\+bQo02f/vxnXvdJoC/X3T\+nXxkuETAtc5q5/9vO77EgTAAAAAADDgBi8AtmIBX0iziRzb3PelXVFl\+qRol2VSo8C8HvYrqulk7v4Npe/\+NfZZrFeMMMSKSiTcFgd14Vi6lkhYqRFgw3Yyt3cmQsE45xFUJSpEvES2roYCBpmaYdhBJUG6bvNExAqSh4hs07S5QCw97zpzBKosJxw2\+3CgpUWDSoJMzSIxV1Z0DXFLJz8SDsk8kwqAT7sHmOEEjiGbco8Q59BpPYaXg4GoNxSMS5GcqewVh5xepstxvnzr9svfyPxZXDVXicb9nc6irUf8/iivxHwC4yQshxim/TIDwzi2ZbftzTHUgBymQFQRWbIs2/5aM6RwVFM5K6b4A/6QEA/YlkNs2yYYlmMcw3bxkpv8kajmUUTSoqGofoyRsk2qZ1i3rCgkyrKbsTQ1GFB8CtfhKWIXsH817tr\+213kuvKGB6781\+qVW7W2R0ldfPnCFTNG7tq9MfWAq0uveOC/z5pXdjER0cU/G1l6UfNDD3eJRZONe3//b3/T6PI77pokXkquYeVlwwsDCy9v\+ZFc7BUjyyiw8LLmH526mv\+9/u/dR86nT4FO2k3al8zSO3526MsTc\+65ru5P39DFheKdM56pvmR8WQndMeOZHwvHs1Q7OLkDAAAAAHli8AJgLn0LsJUIeAPuQEyV\+WyLigE1EUjf/Zt7BLgbjm0m4vH0PcBmKgB2TDUQiJHkIysaCyqS4CfWLSthHxOzjJg3GGp7CFYG0/4UrvYtWyZ5/Zm/7MxLfx3HcRxiiIjr5Qhwe4hrxYOBKBNMP98pvevu7wFmOJ514pppy90NAjMsxzGWoVuOyHZJs2kzItdxFcbtC/lVbzAUj3r6H1WnN28YFuPuzRzhDvcAWzGf5DfdHkloT5ZjxhRZ0cVgLJTKC5ZjyGx/QbRj20SZ3VgJRfYneEVVU8\+gZliWrfAoQb/EEwn\+oE/1xjWL3BxD7e\+YdlLxMPGeUCQQULxckHF7Zdkjanqn7OmEE32B9GUCXvIHA3EpHDdsT/YVLjg//MtVdt3z/3NUh6deXVR06Xev/5D56/tvXl/50uup9x4tv0ELRn\+bZfiXqOm9de\+8R1Ry09wx1Q3h1bsPpUaAL/0uvPpvHUeAu3HaFGi6mL3j/hlTvt\+/3i5feMetgQOx2h\+/097dmn4I1ntbUw/BOuPjBwAAAIC8NsivQXJMVfH9YZddEZLFcJfvWDEYDfdxbK3rPcC2ZTFuXzCcCq4dPWQoNpGlxTTG4/dJolvwiKpq2dlG/NoTynCeUDTadQTYp2V2rEeUEPkUD2NEwhGvqsrU\+xHgDiGuGLF1KRiIiPFAD/fksm6vyEXUcMwvtg8PO2Ys4IuwQTUkSl6R8UciCW\+HPHQMNRTROW/IzVLHQ2ZFX0hW5WCI4c8kAnZMNRQ2BDks9u2scZ6gIkmKonpj6fdVmWrAF2WUeNybeZ40w/I8qbppE88SkW3oFiPwLEOOFQ/6QpZPjbe/gInhBY4xbadtfJghSo2cO6phpaZnO5Zh2KybZ4lhPYrqST2t24r7Paz7tJnjbUdoGbrFCO4O1xycHsvOhaal8fOnuowAL5/WdaFLr5j30LTbyi5qfOjhj7qs/uXOp1Z/fih3fNtZ13uAh1xExw\+//qd3dtrUNgW6pHLMlCHf7Py73fjlV789MWnKkEvwNmAAAAAAGHCDGQA7VjzoC5ryJ00hqW1QN\+yOqr4Ob9FpmylN5DiW7WheMdS2vql63JHU3bicNxgNeCNxD5eKTmxTt4gxQiYnubuGY5zoUwTbjEUSmqmHE1JUZvUekurYZvz0EWDDkXxt8Q/DuSVJYph4NBMV93YEuANG8IWDMUkJhKW4kjsEZkUlJMdn/8btjgX8sihwjK1HQ0rM8cUElhhWDiqqtOR2t/5IMBjw8o4WCweVN/bx8zcrIktkdc4SSQl6YvIf3qHKR3qb1g4c29DjsXAwGOeDcaXPN8UyvBxUVCkUVD1RH\+8kgr6Q7Y9FvR3KAfEevycciMRNUeYdXY3qvC8qco4e9im6JxrzdcwshvfIfDgaSXhDHtaKR1SDk0WeFbx\+KRKKJHwRD2drUdV0\+8Nu1k4oXsX0RSI\+N2nRUIKV1eyvMrbiiifCh2MRWSAzHo5ojBQVsi59IRrClFzZdQS4hD21cUiHZS694oGn5Hk/fDT9v\+2u\+57o4qHznpLFmujjn7YPBbuGjf7df79VvCw1U5opGlK\+JnxjamtFLPPGyxNafiSiHw/F33mqpmnjhnfqPt1f9wM75ZZRdIJKrrzcdbSurvPrfJv//h9P/Z0Zf9N1Y8ouv\+OWy977t8\+LrqOSQcsGAAAAAMhPgxYA23rEL4csb1QNSbnGCzMzpckxVL8cYkKxzB2XthbyeMKMGIqE2p6EzLoz67G824kHQpqgBE97spatBb2KI7v1GPn9bltNmH7KjfNEDKuHZbpgPcFIaqqxOxAOsiyR3av1OoTAMUWgbh6C1fb2Wd4bSWwTAkrouSXvELkqJnu8gbghS6m4kXEHVI0LBpTIwpv/fSERUXHV3FWfhP1St\+ObnCcY8sbveatPA5qd0uaqnBWKRQL9eiYUI2TuRPaEWVXdue/rnVe\+dU/m26qltVrILYVi4WjQJ/gNVpQVNSa7WUdXo9v37ds\+/pIlmWUrHvlEj0iCLxIxA4qbvd1mqzxyOOoXGSLOG4kxYcXLyybrCQTjqpdniMRAUFaCMv8bkyolfzgacLNEjhHxuBfuTIWBO8dfsoyKp23Q47I/EtJl3\+hL7km9ujisKj\+FG4DbJRv\+Nnve33Is4Bp29dL/Pue2H3c\+/m\+7u8SonbZzvP63/1c9EdGlV8z773Me\+PGj\+X/Y3/gj0cVD5yy\+LzD8yOurt64/mC5sG7d/Q0RE9s7tu13Drg5UX/SB2tDceQy5aNS0P97PaEcvv\+Pi/TvtMbdd\+7O6MztSAAAAAIDTFfyzJXsntzuHD9ZPmNDznXhWIhSIMv6gaChK1MzcPZt6s5HAZR5UxHDeUFQRWduIhQJKnA1EI/6Oo3O2FvH7lASnqKrSOYy2dVXxK7oUjaXia8cydMPQIsG4qKpSzOs3lYgnpsTEcMjDMqQrnoApetyZm0odW49rfDgecesBXzA1AJ0dw8u/fdD6v\+9THZ4j27SFsBaTO4dFjuM4etirWKmHVOehpUuXPvfcc\+c6FT993eYzP2t5T\+tdNPKWWc/fVV6UY5EfvtM2bf7zEGnZdU2r33XmPDRl/KXpdYuGXVb0/YnG79Ov9k0er3vuD9t3fs9O8dwauGtMScPOp/7wH5qdefHvxT8T75jz/J2XaevU33/c1NIhDSWjxi29/7rkext/v8tOXXsoGvWLNYtHbHxWrbtO/l3Zrt/XXDZv1InXP21O/nDJvOX33vb9Qe14ZrOXXiaOoteffnP90ZxvGCYiIvOdZ3tcBgAAAAAudHv37h0xanSfVhmsEWBOUlSJiEhSE7mHX614QPTHGG9ITchdp6ayol/V3JFAMBqXxQ4Tpx0jFo46PjXubxuOtGIBz7Jd3Ny1QZ4cTpRFt1vypMaWiSxyGEEOhNpvpjXTD8HiPOG4pxfHYycUVgpFVJnVFN/pE56tuM89\+y1nytJY9tm1AOfQvw59vGn2x71ZctP8j4mItP/xea6lLv7ZbQ/JgeHNG1f/aeOujlEu0Y//pb39ptwwaV4Z47qYKDPSW3LtDc/LJTtVdf3f/ytJRHTRmDt8mx8a0azF6o47de9FZSIi\+u3f08s/9z9W4oIKAAAAAAyswRoB7gPHtinHu4ZgoDlmxCss3J487QvX5FVaoqeHc2WDEeCzo78jwPkFI8AAAAAA\+eA8GgHuA4Zlz3US8gvD\+\+NOT3dFAwAAAAAA/NT8H\+c6AQAAAAAAAABnw3kwAgw/Cc8999zSpUvPdSp\+\+jDPHAAAAACg3xAAw4BBbAYAAAAAAOczTIEGAAAAAACAvIAAGAAAAAAAAPICpkADXPDw1h8AAAAAgN7ACDAAAAAAAADkBQTAAAAAAAAAkBcQAAMAAAAAAEBeQAAMAAAAAAAAeQEBMAAAAAAAAOQFBMAAAAAAAACQFxAAAwAAAAAAQF5AAAwAAAAAAAB5AQEwAAAAAAAA5AUEwAAAAAAAAJAXEAADAAAAAABAXrioH\+vs3bt3wNMBAAAAAAAAMKgK/tny/blOAwAAAAAAAMCgwxRoAAAAAAAAyAsIgAEAAAAAACAvIAAGAAAAAACAvIAAGAAAAAAAAPICAmAAAAAAAADICwiAAQAAAAAAIC8gAAYAAAAAAIC8gAAYAAAAAAAA8gICYAAAAAAAAMgLCIABAAAAAAAgLyAABgAAAAAAgLxwUV9XOHywfjDSAQAAAAAAANAnI0aN7tPyfQ6AiWjChAn9WAsAAAAAAABgoOzdu7evq2AKNAAAAAAAAOQFBMAAAAAAAACQFxAAAwAAAAAAQF5AAAwAAAAAAAB5AQEwAAAAAAAA5AUEwAAAAAAAAJAXEAADAAAAAABAXkAADAAAAAAAAHkBATAAAAAAAADkBQTAAAAAAAAAkBcQAAMAAAAAAEBeQAAMAAAAAAAAeQEBMAAAAAAAAOQFBMAAAAAAAACQFxAAAwAAAAAAQF5AAAwAAAAAAAB5AQEwAAAAAAAA5AUEwAAAAAAAAJAXEAADAAAAAABAXkAADAAAAAAAAHkBATAAAAAAAADkBQTAAAAAAAAAkBcQAAMAAAAAAEBeQAAMAAAAAAAAeQEBMAAAAAAAAOQFBMAAAAAAAACQFxAAAwAAAAAAQF44vwNgRw\+JnBQ2nHOdEAAAAAAAALjQDV4A7JhxNZ47dHWshBrT7UFLwsCxEmGvm2MKChjOLYc1\+1ynBwAAAAAAAPpq0AJgx4yFQ6ph51rGSoRDEd0\+38d3HVP1\+0KWFNGbmvSIZITkQMw614kCAAAAAACAvhmcANjRQ9LoJdv3vTH7ctarmkSOEQt4BI4pKGB50RuKmw6ZUY/7nnf2bf/NlawUNhzHjIVkUWCZApYXfREte4Tp6CGRlwIBr8Dy3mi3G3f0kMh7IqnxZysmcwW8P26nVg5LvBQ2HCsR9klujmFYXvQGUvtzzIiH431dolvHjEU0xhsKegWOE7xK0EPxaNw838N2AAAAAAAA6GRwAmDGrcS2za\+smLu5yY7JvK0Ffb4Y41eNpqZEyG2GfAHV4HxqbHFVxbS1DXYiwJuqPxBxfFHdbIgHBV2RlZyDrLaeMMWwpkW737jJiSJrJgybiGwjYbKVjKEbNhFZRsLiRJHVw0rY9IQSlmXEg6IR9ocSNjGs6FMUr8B23pehW4xbynzKuiWBDA0BMAAAAAAAwIXlbDwEy9ajMdMdCPolnuPccjDoYTS1cwTJCLKaSER9Is/xoqz43aRrpp1jm6zb7/MIHMt0v3Gbl9xkJkybHFMzGMknkqZbDllGwmTckkC2ZTnEcBzLcoJHiRt6WGKJWLcc8HsFptOuHNt2GJbNfMgwLMs49nk/cRsAAAAAAAA6OSsBsGk5LC9w6RCS5d0cWUaXCNI24qHUc6YKLhm9cOfXjpMrwmQ4gWNzbZx1S4JtaJZt6ZoteDweztYM2zYTuiN43CwnBhTJCkpuSQ6E1YSO8VwAAAAAAICfurMQADtOl2C2m2DTUgOyovEBVW861XqqfvWUCub0hfq0cc4tcZamG1rC4kU3L4iMqemGptuCx80SsW6/alhGPOjl9IhPdHtCWZ9GzbAs41ht8bpj27bDto8IAwAAAAAAwAXhLATADMfzrG22Dfnapm4R1zZmm/pIMxy3X/FJAseQbSRMq5dDslk3zvCiyJjxWNxgRTfH8m7B0eKxhMVJbo4hcizTchhOkGQlGo\+H3EYs62OtWEHkHCOReaC1bSQMhpd4tj95AQAAAAAAAOfKoAXADMOQY1uWZduM2yuxejgYSZiWqUWVUJxEWeKY1CKGadtOAcc4lmbYDtm6GopaTK/vsmWzbJxYXnI7CTXhCG6eIZYXeSse0xlR5BlyDNUvSX7VcIjIMbSEyXA8y5Ctq\+FIrMvLixne45ecmBKMGZalq8FgnPH4JX4Q8gwAAAAAAAAGz6AFwKxb9nDbF44XZNVkPeFY1GtHvMLlV3qCphiORX08Q4wgy4Lx3M28J0qzFZlRZ19\+ScFlcswdjIR9fFyW/H/7rucdcd1vnIgTJN7\+2uFFniUizi2y5pfklniWiBHkcMTnRLw8U1BwyfiA5QmFvDw5thYNhWJdX17M8HJEVbjY7NGXXz7elxBCasjDDXiGAQAAAAAAwKAq\+GfL931a4fDB\+gkTJgxSagAAAAAAAAB6Y\+/evSNGje7TKmfjKdAAAAAAAAAA5xwCYAAAAAAAAMgLCIABAAAAAAAgLyAABgAAAAAAgLyAABgAAAAAAADyAgJgAAAAAAAAyAsIgAEAAAAAACAvIAAGAAAAAACAvIAAGAAAAAAAAPICAmAAAAAAAADICwiAAQAAAAAAIC8gAAYAAAAAAIC8gAAYAAAAAAAA8gICYAAAAAAAAMgLCIABAAAAAAAgLyAABgAAAAAAgLyAABgAAAAAAADyAgJgAAAAAAAAyAsIgAEAAAAAACAvIAAGAAAAAACAvIAAGAAAAAAAAPICAmAAAAAAAADICwiAAQAAAAAAIC8gAAYAAAAAAIC8gAAYAAAAAAAA8gICYAAAAAAAAMgLCIABAAAAAAAgLyAABgAAAAAAgLxwUT/W2bt374CnAwAAAAAAAGBQFfyz5ftznQYAAAAAAACAQYcp0AAAAAAAAJAXEAADAAAAAABAXkAADAAAAAAAAHkBATAAAAAAAADkBQTAAAAAAAAAkBcQAAMAAAAAAEBeQAAMAAAAAAAAeQEBMAAAAAAAAOQFBMAAAAAAAACQFxAAAwAAAAAAQF5AAAwAAAAAAAB5AQEwAAAAAAAA5AUEwAAAAAAAAJAXEAADAAAAAABAXkAADAAAAAAAAHkBATAAAAAAAADkBQTAAAAAAAAAkBcQAAMAAAAAAEBeQAAMAAAAAAAAeQEBMAAAAAAAAOQFBMAAAAAAAACQFxAAAwAAAAAAQF74/wEAKWRac6hKugAAAABJRU5ErkJggg==)

*圖 4\-5 OLS 對帳結果查詢（上：每日對帳彙總 1 筆；下：差異明細 0 筆）*

### 4\.5\.1 畫面元素

__畫面元素__

__定位（id / name）__

__型態__

__預設值 / 初始狀態__

__說明__

頁面標題

h3

文字

OLS 對帳結果查詢 \(SA Portal\)

類型

\#type

下拉

daily（每日對帳）

另一選項 monthly（每月對帳）

區間\(起\)

\#from

文字輸入

20000101

8 碼日期；預設值刻意涵蓋全部

區間\(迄\)

\#to

文字輸入

20991231

8 碼日期

查詢

\#btnQuery

按鈕

查詢

查彙總

提示

\.note

紅字

畫面註記：要看完整的交易資料，需在二天後，例如要看1/1的對帳資料，要在1/3才能查詢得到

固定顯示

彙總結果區

\#result

區塊

請輸入條件查詢

RECON\_ID

\#reconId

文字輸入

空；placeholder R20260915

第三個 \.box 內

查差異明細

\#btnDetail

按鈕

查差異明細

明細結果區

\#detail

區塊

空白（無提示文字）

第四個 \.box

### 4\.5\.2 操作流程

1. 選類型（每日／每月）、輸入區間，按「查詢」：\#result 顯示 查詢中\.\.\.，$\.get\('/recon/data', \{type, from, to\}\)。
2. Portal 依 type 轉呼叫 /sa/report/reconDaily 或 /sa/report/reconMonthly（type 非 monthly 者一律視為每日）。
3. 從彙總結果抄下 RECON\_ID，輸入後按「查差異明細」：\#detail 顯示 查詢中\.\.\.，$\.get\('/recon/detail', \{reconId\}\) → /sa/report/reconDailyDetail。
4. 兩個結果區各自獨立：查彙總不清除明細、查明細不清除彙總。

### 4\.5\.3 需求條文

__編號__

__需求描述__

P\-RCN\-01

頁面初始狀態：類型 daily，區間 20000101～20991231，\#result 顯示 請輸入條件查詢，\#reconId 空，\#detail 空白。

P\-RCN\-02

每日對帳：以 CP\_TX\_DT（8 碼對帳日）落在區間內（含兩端）查 MWP\_CP\_RECON\_DAILY\_SUMMARY，依 CP\_TX\_DT 升冪。結果欄位 8 欄：RECON\_ID、MERCHANT\_ID、RECON\_RESULT\_SUMMARY、DIFF\_COUNT、CP\_TX\_DT、CP\_TOTAL\_CONUT（拼字依資料表）、NEWPAY\_TOTAL\_COUNT、CP\_FILE\_NAME。

P\-RCN\-03

每月對帳：同樣以 CP\_TX\_DT 區間查 MWP\_CP\_RECON\_MONTHLY\_SUMMARY。月對帳的 CP\_TX\_DT 固定為該月 1 日（yyyyMM01），區間仍以 8 碼日期比較。結果欄位 7 欄：RECON\_ID、MERCHANT\_ID、CP\_TX\_DT、CP\_TOTAL\_CONUT、NEWPAY\_TOTAL\_COUNT、CP\_DETAIL\_FILE\_NAME、CP\_SUMMARY\_FILE\_NAME。月彙總沒有 RECON\_RESULT\_SUMMARY 與 DIFF\_COUNT 欄。

P\-RCN\-04

RECON\_ID 格式：每日 R \+ yyyyMMdd（例 R20260915），每月 M \+ yyyyMM（例 M202609）。每個 RECON\_ID 在彙總表中只有一筆（重跑對帳會先刪再插）。

P\-RCN\-05

RECON\_RESULT\_SUMMARY：Y 表示該日所有明細比對一致，N 表示至少一筆有差異；DIFF\_COUNT 為差異筆數（RECON\_RESULT <> '000' 的筆數）；CP\_TOTAL\_CONUT 為 OLS 檔案筆數、NEWPAY\_TOTAL\_COUNT 為 new\-pay 端筆數（請款 \+ 退款）。

P\-RCN\-06

差異明細：以 RECON\_ID 完全相符查 MWP\_CP\_RECON\_DAILY\_DETAIL，只列 RECON\_RESULT <> '000'（有差異）的明細，依 SQE\_NUM 升冪。對帳完全一致時明細為 0 筆（空表格 \+ total rows: 0）。

P\-RCN\-07

差異明細欄位為資料表全部 20 欄，依序：RECON\_ID、RECON\_SEQ\_NUM、MERCHANT\_ID、BILLING\_AGREEMENT\_ID、CORRELATION\_ID、SQE\_NUM、TXID、STATUS、ITEM\_PRICE、TAX、TOTAL\_AMOUNT、ROUND\_AMOUNT、CURRENCY、LAST\_EVENT、TIMESTAMP、EVENT\_RESPONSE、EVENT\_RESPONSE\_DESCRIPTION、CREATE\_TIME、RECON\_RESULT、RECON\_MESSAGE。

P\-RCN\-08

差異明細只查每日對帳明細表；輸入每月的 RECON\_ID（M…）必為 0 筆，畫面沒有每月差異明細的查詢。

P\-RCN\-09

\#reconId 為空時仍送出查詢（reconId=），結果 0 筆；不提示。

P\-RCN\-10

彙總與明細兩個查詢互不影響：各自有 查詢中\.\.\. 與結果區，前者結果不因後者查詢而消失。

P\-RCN\-11

RECON\_RESULT 代碼意義（顯示於明細）：000 Success；請款比對 101 No new\-pay mapping data、102 No OLS data、103 Status not match、104 Amount not match、105 Timestamp not match；退款比對 201 No new\-pay mapping data、202 No OLS data、204 Amount not match、205 Timestamp not match。RECON\_MESSAGE 為對應英文訊息。

P\-RCN\-12

切換類型下拉不會清除區間、結果或明細；10 筆上限、total rows、錯誤顯示適用 P\-COM\-20 ～ P\-COM\-28。

### 4\.5\.4 後端介面

每日彙總

GET /sa/report/reconDaily?from=<8碼>&to=<8碼> → SELECT \* FROM MWP\_CP\_RECON\_DAILY\_SUMMARY WHERE CP\_TX\_DT >= from AND CP\_TX\_DT <= to ORDER BY CP\_TX\_DT

每月彙總

GET /sa/report/reconMonthly?from=<8碼>&to=<8碼> → SELECT \* FROM MWP\_CP\_RECON\_MONTHLY\_SUMMARY WHERE CP\_TX\_DT >= from AND CP\_TX\_DT <= to ORDER BY CP\_TX\_DT

差異明細

GET /sa/report/reconDailyDetail?reconId=<RECON\_ID> → SELECT \* FROM MWP\_CP\_RECON\_DAILY\_DETAIL WHERE RECON\_ID=reconId AND RECON\_RESULT <> '000' ORDER BY SQE\_NUM

回應 / 錯誤

同 4\.3\.4（HTML 表格、10 列、query error:）

## 4\.6 服務條款設定（tos）

路徑：GET /tos。資料端點：GET /tos/data（查詢，回 JSON）、POST /tos/save（存檔）。後端：GET /sa/tos/query、POST /sa/tos/save；用戶端另可由 GET /getToS\.jsp 取得條款內容。使用者：SA（PM）。

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABQAAAAGSCAIAAAAzZ/v7AADMVklEQVR4nOz9f3xT9d0//j/b5sfpj6Sn0GAoFVLiaKgKqfDR\+IM16G0Q3cqi9prZVSeROa/0s\+GVXTc2sov3GzM\+b7Zwje97ucb2JXMOgrNb3CpG2DR0HyUVxaNvsBGlpsxAiqUcSaGnSX\+cNGnz\+aM/aKFoYaBufdxv/kFOXud3E/M4z9d5nax5q35EAAAAAAAAAP/ssj/vDQAAAAAAAAD4LCAAAwAAAAAAwLSAAAwAAAAAAADTAgIwAAAAAAAATAsIwAAAAAAAADAtIAADAAAAAADAtIAADAAAAAAAANMCAjDAeXJJRv55bwMAAAAAAFwjCMD/ZDIVc9OlknETJEMqySVbX11yRapuebKSuSoLy1QYerbdlVZezjyqucm6xWnVla5Srko\+9f34\+vlDREQ0VF3b1fo/u175gfDKD4RXftD1f35ybtfSwfHxWM4MqZjMFBb8OewLESlVA2uWpgyLxZq5Q\+Onl84X19w4YUeISdfeJRoUl7f8T9hCpSpdWTT\+yGSUV\+ev4goMVZanKhWTnyYlMySf8PKSlz\+mfK6nRjKkvLqfyis6gxdQlaSqVFdvH68WyWC1QVxRNNmGSYYq5w6O/wuUS4Yu61M2dfJL/20QM1g5d/Az\+5oFAACAvxP\+p/33yS/b/F8PV77ltTzzUfz8VKaqrm7rrDcsP3k7kvpMN0euSK95KGHoyF/9nDySJqKhFaviGxW5q\+uHXxLRUNW9PetvGvvdn1EWDanS2ZFE1oQFpbIb9xRsOX6510cypYt7nyofWuvN5cTJG1Quj\+9aPhS7YHWUUSoykcbC1a/nJEcnKYsGtdLMRXNl5IpM8pDi/j3SOF1IWZKsKZc3HpXE0pe54URElIxJ6yP9Wx/s4zwFjQkiymrerxjZJMlQbW286oJ9WZHYSHmW0S3RLk5s08vWnj/U4zbss90XpWqg7iZqOjdQszinQRyoastWLROVbw6f0Ixq3kC1Iqfh6PlDLc9Nr7h9oKlVziWyiIaqa7u3zqd2cfQcpbJaXi9Yd\+h8\+\+EdUV1yCzOl2v5tyzP1uxTbO7KISDW/b9eqjPu3w0f1KlAq0pUlGTkNH9Ks\+DkJF8siylQs7bOXZ\+L9WUki6s9pfJ3hmIH1q5JN9crmi1ctGayujdfGCobPoFwlPvWYGHlOuWGSP/vLONdTkDF8JbG1RL56FxNJZ7Q3imvKz1\+hiIRy649nnz/UTHp9ba/qUMGGdy84/hNc1hlUqlKGGefzpFIxpC1Ja0tSVdqh2JvK\+3dLY1ewT9eOZMhgSCbPyBu7LnxHnjtYs6qnsiP/8T2y9jSRZLCmNl4dUY7/GrksyhJx6wOiNpeIMioF7fUW7lD0rZ8h39Evbl5G258uaOjKmmSuWQMbH0rv8Cj2XqU/bwAAALim/pkDsHLBSt/PqirGXg/0R1pb6n2v1L8vTPHnkXxWWXWlhHv1b\+2fbY69YsmEdMtzuU\+t7t24VPI4l6Ms719fnr3jadm4n\+nZTS8rm14eeSFXDGy19cX3KDe0XoW\+AMmEbNNvC\+gb4ooSOXfp8NweKrDsviDyDVV/I1EzIaIPKhVDpdTzQnlWvIPZcS4rcqhg9R5pnDKV98Y3SkfnkwyueaintmQkW8qZodLc9K7v94\+d33gHs\+E5pmWqKSW78aWCTeWZlin\+kE3RuD\+kjHLGEPVnxSes6/PZl2Q6o13ap43kUDqHUqTUirWzstxdo2dkkj/mCy9/cC8XPH5h4h1acW9vjSIrls4iInluunJ\+Wps7uPmhVKR/ZHZ57pC8Q77rzOD9JVktXUNVy3tLO2T1b0q0tw8oY/lTPaqTGKpZLWzWZrUnSFk0FD\+g3JDo33o7cZGcOGVUcwe0JxX375bGKavlUP7jh4hoqGpVfNtNGY4bqlrWb5iVKa3triEionhb7rrdo6k1d6hSkd28PydORJLB6vv6DDOo9MH4K6MtN\+yWnz/an36up0yRrrkpXTprcKNBspbL1pYPlHYUPM7lJCljuDduLx9qGAvAzOCa2kStQrbueE6SSdc91Fsza3whNCvyZsG613PiRFM7gyMHs3JZzzY9Rc5kx/uzkumseH92LCZpPCBraMxpPplzeelXMlj9lV770nSpMiNPZUUisvr9eaMBPqOdn6xbLlZpB1VSip\+TNLfKt7/EcCIRk9r6/XjNjHHL6c9ubmXcLzFNXVnKEnHjV9KUyBpeSGlJqnLOUHJVQnlybHcyKkXWG6/I0jcPyLtykrOS9lWp5lBuY3qgpiSb\+2v2laVfIkompDuek3GxbLlKfOqhNBfLbu\+S0X3xp/rlW\+rzuNx0ZVranCCijPbGZBVJ64evIqWJUqPHnxmsWZqKHZU3TRaVAQAA4IvgnzkAExH1dDX8Yvu6t3pIymhvqqhddc/6dYrkhmfrT03lp6tEteBOu6lr3etf9AAsV6TWrxJV/dlxIqJMe0eOSt/j02fFKZPsyq5Y1reZSC7JKEmyYw8zrjY7ZLirv/Ic83jkCtOvvGhg40N9k3S8fLD7dQlRevgnLMVa89btkbWPvlmq73lBO1kFuGP438MRPVO5PLFRkTsSFJcPkJQmkc7ZUV\+4Y/SVdmn8qRvlj19hXY6IiERJw7vnt6pyefyl27NGtrAo03KUiEhZIm5cnqZ\+Us4d1JK4MTcpz6X2Q0ykJBNvy5kY7D\+ffUl2yba/mdyoH5L3E1FGNSvTckBxcQGNiEgyWPtAb7Uioy0aVK5KrBBlm56XkXRIu7R/89ys5PCfTVqy/SWmWcxufFnRSEREclVyqzVJYlZSOWQoT8X35285cP4ii0qVakrn0FEiyqJUdrIkuWZuViSSqntg7FOUKZ2bUr6rtOyfeqUuq2W/YvWB7KqHuuuIiCjWxmzZLWunjGHV4MbzzYaq7u2pK8mUltDeP\+ZFtL27bh9KnpFv8hRwCvGp1f3tR6Xto9upVA2UJiSN5b3bZjENkv6NN2Xikby13twWhbjrsf7YUWkkfVnneooylUv7DIm8x18aqlvVs75LwV2inZxJr3kosUYh27ArrzFBRJLtuwq3X9zuMs7g\+YMZOZRvmazfweVh0nXW\+HottYTk7lZpjIYq5ifrrN2Gl5RruRzl/L6nHhOpNW/L0zKuK1Op77d/pXdbbvb9z8naiSidFXlVef/LkjgRSYYMNybX3Ne37aEsy9NMSwezbtfwCoaq7k1sVWTF\+6l0TqpKzHG/lNtwcjTfSoYqZbLYSMeKrFgiU7VCVCUkKkPf5rFjmJs2lORs8RRMsTZbWt639d6hvfUFTfMGlB0Ml6AkSXeEJKUKSby8x7d8sPl55bp3c5KUKS0Xa9ITulGMrFE6WLU02X5S3jTpxw0AAAC\+AC47AMvL7vA9eVvk1WOqm8pKZynkZ45vf/rF\+mMikUR72z0bH7nVUJpLPTFuX2DDH/6mrH5s1z2n1254kRNIddtDL/3ngsj/f/vqfZ1JafGaJ79Te6rBsv1v5wsObNnmzZbK1iORskUr5iuo62TD0w2bXu9MEsnnLLQ/ck/1TSWlsv7I\+\+\+4n35lrzB74/96eMWJhvt/8UGMaLjX8bYFxx7/H3/heifb7pQYaX5ni8BU/q97VpSzDac6iS2rfeyrdbeVqGSp2PETDT6/\+y2Byr7se3JJ7J0u7W3XD4X565aWKYl8v6\+od27fcExR88jKNbeVVRRR7Pjfdjzz5x3NU60kjxw6tmzNYytrKmdrZenIiRONewLu1zuTxFSu/Or6VQsqSxXUdbLx\+X2bAidil5m3kwnppvpxoUoyWFsbr44o175\+qd/oQyse6N5cImnqkDR1DdauGjtkGW15Kv5S4dp3p1RFSXbJNnhkw2tcU9tjaC1Yx43U0\+oei9ckctc\+J7\+4YvnJFWA5M2iYNySnTGnJkFKSrirPJImUiox85K3ByhkZOnc\+P8sVqY21vQYFXVw1TXYwG54f/7v/E41U2IaUikx7Y6Hl9axLdYGOdzDr6okoU3nvoIqYTS9L48O19JKMUtK/cVYWUaZ0FjXtya8/N/S57Itq7sCKWdntXdnJ/iEtSbmODJWIG1enK2Zl5JSRK4ZKafCF8uyWAwXrDmVKZw3GjzItM1Itrdkrlg4qpUSp7JZDuRsmrR9KhgxL\+9YvG4zsV66T9G0ul206kFW9vPcFQ//ev\+a7D0liRPE0KRUUT5CcGaJ\+qlouUqhg7cvjz3imalW8bmqnZYyyJF1VnlWpIDp3fmMqtemqoiE6M3YMsyPHc1TLxCSndHek1397kHtOyZX3rF/V31zUr4oUrDt6Pj6tuD0lP54fK\+qtKOlfPyvT4FUml/Vssw5GFCniCjYdzU4SJad8rnd0TKniJ1cl7YZM0255Y2tWpD\+l6spS3jhU\+ZX4S8tGusTH3xzZvOoHe2oo93GPTL408cI82aWL/5d5BimLKKNd2vNC\+cUbnFEWZWJ/VVr2S6aQjTMV\+r46bdbeZ4czIRERHZI3HO\+1lwyWSrLlJWlVQrZhd\+5w\+GzfX9DcNrBCMdm1tnQ2925uTJp6YVXSUCRviWURkVI1YF/VV0XyDU9Lqh7qS/41v7lErFstrDmZu2UP09iVRWmi3CElZcWJlBKKzxLXlEjcTysaxiVPeVHyqdrL\+DKNHCpYp4hvs3ZXn5Nt2SWLERFlNb\+e12KLb50n3\+BRNIyc5Sy6xGWpJNEV158BAADgs3FFFeB81Yqbjq3d6mnqYmvWfWfjI7dwPz4YL1\+57YlF8X0vWn7SIb/pzvWP1Gztevp7xz6Kr7q\+skjCCRLtTSrqSqtuLlG92hkrKjHMSrcEYhO626WISFFxW1nz9mfvOUaVD35182NfaznxbP0ZtvoRc23RkXX/49lI/oK6b6/cXNcV\+fE7ew/EakyLKmf9rfFMmtjZK24qaH\+rpWXS9HsxKbvisZr1C05v\+Ymv8UxR9WNme93XIu2\+vZQmKVtZenLLj7dzZ0TVKuuu2048/sO/cL2SigcsG2\+j7f/tefxMwYpHzOv//WuxDb4GYepHjalYtXJNWdeWn/qa2nMr71658RFT5ISvseiezY/Mb/f57ntL1JpWbn6kZv2Z7eve6pn6cscZvb9XMqSdkYmXxF8YqV5S\+/v5614ef2tfVjKdHTmat\+GCEpxksLZ20JC\+zN9wkqHqB\+L2Ium6o6N5O51Tvye3orZ312ND6\+pzmyaWX0qXJv6PnmKJ8Rn7fAVYrhisWNxfW5Kz4695W3JTdd8Qk\+8yzQyRSCQdWnFXf6Uod48L9smEdIOHHf7331UBFocrbEPV30jUjm7VuAowUSq7afjWZcnQCkN/1SwikrTQwPoHBpJnpM0KUduRt\+FAtiqd06Lo31aU3XwmS170\+exL7KS8Pje1617a8tv8xlRq82N98kOKdSO93DOVdyU2zhguRxNJJlu6dKhitH5IRNQlrT8gi0jSNSv6am8cpJO5W57Ob\+rK0hpITlmxk/INv5Vtn59cvyr\+wuK8x3cxkf7s9sSQkjJJMZtmJasVUi7d\+9L3criOLGVJSnuy4P49V63jiapcNBDj5iRxInnRwOaH\+ioVGXmaSg2JVwyZ\+CHl/YekdIaptfXVJOSP7xrXDeHGvvX6wVgHJSkr3pG7tl4SS2cqiyQ1X09WpXIaRjt1T/1cT2lzJYO1D/ZVzaD2VfFXiJIJqfs5CaWzm/86rgv0cMt0dkM920CkKu/dtXywZY\+kYlX3Vu1F4zClspv\+wkzyaZ3sDI7Lz5eqAA/V1HbXXjjxUvuSqbwxLT\+Vu6N1/HdIVsuhgseJiEgVy4krBtYsH4g0ylpEIspqPy4f6eAw6fmXEFFWMk3a8n77crFSkdPUqLj/3Zw4k6oiov6cvfsL9r45WL28d\+P3klV/VG5qzYp1ZasUGaKseDpTdVc69r6kxtZVHZG106BBSzs8yoYp7su47Y\+0SWI0KE8P1j0m2Eenxs5II3NTVSVDjR1XVvYHAACAL5Ar\+iU60N/8ylvcmTSR0NLaRfeoSvMZWrag9Mw7q58/0txLdOoV9/z525Z9adbh4829FZVlBfL23Moyaj5wTFV\+famsJTmnTEuxHScujnmp2PuvbX/ro/YUxfa8U3PbSLV27/bfNMt6ImdEone2BxZVPThfW/R2Y/ORllVVNTcVNL0qyEsrDPmxRu70J/06yZ9d/eCdFamPNrUKNGtRzU1M8/Ov1Dd3JqlzxzNvrfhfd1aXs/tOEFE6cuDg3mOdSWLGjS\+abtnXcP9b6fZTPUmihueP1DxZUTmLuZwALFGyCiXF4md6YoLQuNvbuJuIiM688vgP30qe6YylKLLnjarbLJXlRcq3eq7sZ5ZyRiZ2QPE4N/4naabCkLj4p3OSMhXL4y8tvbgrMnGHpr7CjKokteYrvdUK2ZbXsw03pps5SYyIFKn1q5LJ/QUNi3u2fXto7W/zRzNwVqxN3nSyv6roglpNpuLGZEUiK0mUjMl2/JUqHuuroNwWVb\+qI3ftS3JaNlC9uH\+9JCfZJWmhoaob0y2cNEZDK\+7tsY8b0Ovi\+2YpldXCFazjrmhQnFRW8\+t529tyWo7nxChTsbR38/J\+Q1t\+k5gVlw5WakfXm8pqOSNVUs6ORind1FNLeZsi0u17JM1pos9vX9ojuTu6EmuWppLUb0jI10aySTJomEstnzqwWYoolR0J5W64cEVZ7W3Mhv2SZHnf5tXiRmlGrhgqlYxuYSqrhVNaQjntaZKP\+1KJtebff4iqVsUrO/I27M\+uuCuxcQZdmXiHpKk1m/RkICIilbZ/62NZ8XM5kf70mvv648/ncl2ydR4ZManNtnh1WsbRUHskU/ON7jU3DbaHmHrFwMZvxw0c03BU2q5Ibl01kDw3cglGnpup1PfVLEsaJDl7X82L0OCKr3T/n/uym9/P27BbNtVzPQXy3CFqy7PUy1T3JmpODofeoRVEypLUivLBJJF2VkZ\+5nx7pUrc\+o0kvavY9G6O/GRB80vZETGLaKj6G/HamOLx/dnyoiFlKlNzwWoueQavrkypguKxnPZL9EqIteat20Mbv5J4aRnFzkiaW\+UNb8obY5NfKZAXDdiXpagjvzmRFc/NaWxUbooNrflGzwsrMkSZ0llDyVqhKp1FRMlz0k2eAq4rO0nnb4dO9uds/21hsij5lDbT8HL\+XhrYunqKHT/GGzIY\+jbfNxB/U7H65QtHAiu9sXfbA92\+8rxNzzOcSPFzOXR77ws/ICIiyZB2RmajLWUfvhO7X7K9//JXDgAAAJ\+VKyvFiDFBHPlplUonpRK5tEA5q0A5v\+qF348bKPfj2aWpI1w71ZWrlK2Kyvwe7p0TlTfdUjGLSd48Wym0NHcV1Dy5dustuURE7W9YnC1E6diZRDxFRJTsTcQHJKWluUQSZemCOsudK8qLlDIiIuppkRMl24/tPVFlXza/9ECL6rYy5Zkje09d9KOnoKjmP//z/A/EnuM7fuFvOJWW36RSScXm9sRI/9LeWHuvRFuaKz9BRGLsTOLiH47yfNWKb95TWzm3tGB4QleL7LIOWk9z4I2m8pXbfj63uflYI3eMe/9Ei5AmWUGl6Wt1y8oqikb6MLe8dVmLvcCQYaQ75ZiMnMnIT17UMJXVsl\+xepIKcE/l1EuOinTdvaLqaIHlkDQ\+q3/XN8TKowWNCSqdm6xS0Y426Y5QYdNcGjf6UUY5I1WpHVL2p\+seEy7qBCtWv5\+/7mWJVi9WKgZLa7urpRmKD218gHYkKClmq\+amY1wuVyTW3ThYf0gaS2c3vqxsfJmISM6k1lt7DJGCDRJxxXC0kAxVlmQiJ/\+uio1clVpj6NGekTeK6RUlWXufL\+BEIsri9ivv239BWxlRppJIzlDspCwyur\+Vn8e\+jHalzsjnxnflZrV3DW2zpetfkmlX9NccKKj/xBnXrMootYOlM3p36Sl2ZniNGWVuVlNjXsO7OUSZSmaIjudPHLk6U7UqXpebFRMvVQjNlN7Yt7koS1kyqLz4T/GKxDsk7Yp0/FDudmn/ruWUHPmjzRhu76ueRcmI1P3XzPqH\+ira5Fuepyptdv2uvHptsmbxQNUZyfbj8g2/lVQYemuJiDKUmzJoMy2Nyg2t2YYH49VtCstP87Rz0xW5Oe3prPhUz/WnSyYkXJe41davKhpSlsdfMmQ3v57fJCF5bnrNvUPcfqaZy98ycsxJWSJure0z5FLzuewkZcW7LhyeamTixBr\+p5zBkfz5iV2gO6a6O582Blg2xxXcx\+WrVOkVt/evMfQ\+tay3PVTw\+HPyFiKSZLR3dx\+5e9zSTsm3PC9vSRN1yPYSkWJQlZu14\+nC\+ou6NMvF7EusOkOKVM29vQYarFRQ81T3Y2TeyuWJp5ZnGvco6yV9L23qSSZG6\+eUUSoyLXsKV/9SVmMYlEuJxKzm1xX3vT7ytrKkf9c3Bnf8dqp3GgMAAMDn64oC8OQ3VaXj7/3Z8uODLRPelVS83yVfNr\+irKA0dbr5xGkSGMOC2VSmiLV\+1N7X07796ftZCRFRb1dLn6qa6OJnLcpmVWx8YqXhzMENGw43nRBUdz/s\+\+bwZghNBz6qe2SRoSyhvUkRefVvkYv7P/f0c/v\+sqO1nygd7\+pqOdE5nK7lJLnkQx1Tk3UAlhbX1Fnsc064f7F97/un43Pu2PXkbZc\+QJOLHzv4\+HffVpV9acWyRTWPPbx\+4Mja/7EvdlfNZlNu4zPPrjtwIkLXb9z8cOXlLneCbG6kO\+WY4QrwxXuUqbh98gpw06WG5blYQrrpt6P3Hp\+RNYrx2hsHmw5lGfQpOp7fGMsiyuGOjzaWDK74Su/GpZkmL\+s\+k9r6WH/yr8q1h7JW1Hbb\+wssuyWqkUp1Frdfedf\+TIUhsXku8/gfZTHKVC4fSJ6RNuYOGhI5EQnFOnLGP3pHrkjZaxM1ktzHX5K3zMisWCVWRWTa\+3rqZsnWefL/nkfvJDuYtS/L6moTdbqsBm\+h\+3h2kkhelKo1DGhzSalIl0pyIl1ZyXQ29yazN0ZyJlNaklZJJKM/0D\+ffRnrSq1dnNhaLl/7x5Guv8qXBp96oK/6ZOaSdzAmpDteZiprB7Vv5kaW9hOXt/3MULUhHXtXzo2uOpmm0gvjU0auyLQ3jr6Snv8UyxmiBBFltR/9OyvAmYrliReWDo8CPbwZOZFEyjAjU6oYpHMjQ1sp54rrDdTISSuKKNkh23EoXVsyaFiarirJklM6RhQ/mlt/PJuIIh3ZpSNLzqL\+nKQiuWJFz4oVGWXRkHL\+cL/3rMibBcGi1JqpnuupyGo5VGA5lKl6IFETy61vy2k\+mVU5l2IReWNJvzYh4RLpjQ8lKvcodiTS67/RrzyUv6O877K\+EKZwBjNE2S1v5q9\+\+eIbfYeq7u2tPh/8PlE6K5YgpSqlZWSxT6q2ZsVi0vo90vo9Q4bliae\+IlaXyFrOEKWp/f38LVx2kkh1Y/96PdXvzq8fXx9OZVFu2m7rWpMeN1EypErLRq/gZEb7GmTkElJKKEZZlJBeaQU4q/mA8p4DWbE0lS7Obg8xj\+\+WjV5xGKr\+RmJFKiveJd3xspSGE29tun7i/cajMhWGxFM3ylbvYq58KD4AAAC4lq7SzXipntgZUV45uzSfWgQiIuWsYtWAEBHS7a0fxUyzVxgKqP2V9t4ueXu65paKqlnplkAsTmk6c7p5rMtfvopIoipVqaQn4imS5ytUsnS8vV8\+q0KbLzQ\+37T3mEhUYChXqeg0ERGlY\+8fbh4wV5tuUebHGt6PTfa7TWxvPdZ40S21ya5YjBhtKSNv7kkSKVlVaX461t5/yV9\+\+UWVc6jl9aYdb32UJIm2dL5WRlOv/AwbOSYnPqg/8UHDgTt2PXnnihsKufKi5PuvbA/8LZIiedn1FbM\+o3G55XTJCrDhyjYhnbP3TWntir6ahKRaJdleL20f96Zckdq4usfQL9viyWtMDK6p7VdF8teGcuQlYm1JdkO9JEY03OG8QDWw/vaUUpJRzhrUKsT1D6SSaSJFhvqzWlqza5f12ZlM8\+7h3\+6Z0pJ01dL\+uqVpeYrix3PaRYp3yHZ0JLZ9X4y35q17mvl7HzwrHdKWDMrb8jadSdof6pbvUW44lBPvku74a3aVdkhZnq5T5ES6cpreHL7Lcah0xpBy1kBVkTwyOpBP3eezL0Mr7u2rVhDNSGsVmfXfGKC0pP4lhjuZ\+7hnSLu0p3JiCpUTySlTWjIoH/tCEHOajmZtNIiqIrFmhnTDUdn4B\+20jzzGaUymalV8zei/tTf2ri\+Xbj\+Uoyzvq0vnrd4j\+XsrwBK6eBRooqzm1pyapf1rmMH24UGbJIO194kUKqjvEDcXEVF20/6CJspU3JWoFJlNe6RKQ2LrjYP1Ry8spCf7Je7dzJaiVFVRlvL23uq2PPfJ7PaRCxM5UzzXUzNU81C8NpHXIB2qMPRsnp/3eL2MaHgUqJzqFT27igaTXMGWjqwkSTf9kiUaqi2f0nIv6wwqczPJM5Om3OymlxVNU92X7OajkuQDA2tuYprPj7aVqbwrsfkm6aZn5cplfdWifNP\+sb7E2ZE2STw9oJSMjNucPCNpapXEiSiSo5zVXbdKbHp6wvPDkwmp\+znFxRXgkRfM4JpVfcTlNqUGa\+8VG3cpG/6uCjBROmtkU8WseNHA\+gdS4yrAWTGR5OMGuEqmspKT59ssjIMFAADwBXe14pbYcuBY5O5b7Y98FPMdiUgXbFz3VW2zb/UzJ\+JnjrcM3LLipnTLH2LxlNje2qVcVqEaOL7pxKRX6KXKm\+603x1zv0\+Gb1ZV0ulNrUJClkhSgbZUpXw/VrrsntpSSkoLlPlERMkzHzU0i0\+ZFiff8Te1X8b19uSZ43uPpTdWm2rbA42Cqvabd1b0frSuVRiY0Ks5TT1pkhaoZrGqnkw8JSmdoyqVno6X3VJ3d0GSJMp85pJl5En2rHjFtx9dn39k7dZXOEGiXTC/VNrf3CnGe9PK0uu1Re\+0U9maBxcoe0nOFlzGYi80xS7QGblkqHLSe4CLMs2XcQ/wBO1Hc936\+NbaVOPuwoaJqSCZkG55mk2KWcq54tbafu3J/LV7ZBFJuu7efmWkoKEji0bv6OuJybbskQ0XUkrnMlt2D1dNE5VFWe3vM83L49XnCjZ1ZNHww59WJ6r65du9hc3zejeqiCSZ0llDsQN5e\+f2lJ6UNl/BozglGWXukFyakUtIqRiqLO\+1v8s0HJI1dsi5SO\+2VYn155Qbjmdr9X0b78quP05EQxWL\+2tUBat3y2KKVJVCuj00VHXTYMN\+SZwo/rntS3bjywWNRNrFidJy\+ZY/nh/8KX5hL\+Ws9jMSZT9pJRmlIpt7nWnpp\+GSYyTERAyJ6kTuWs\+EYczkuRd3oM3IFZn4/sxoQsiKd0majkpKFcnqWaNr\+bsqwBllLiVTF2S2rNhRpnlZvEYiX3s8O0lUemN/jUS2ab8kNj40MoPVNw22h3JiaVJOtmg5ZeRExAyueaCnJpFbTyRXpOse6le9r3j8ZWmMaIrnemqyuUOSum/0VScySknOjr/KmkVaQURE7RFmryFe01bw\+P6RKwvJdNbUvp4v8wwyQ5WKrEjH1Mq8nygSyt\+\+tHv9Q8JLNzINR6Xt/aTSinXLUrEDuZGeLFViqOq\+xLaivB2HpM1dpJ0/ULtcLO2Xc7FsosEJC0rn1O/JXWHr37hcYhkdLVwuzSiLUhdXgEtJen5oq3R2S0TW2J\+qun34y//vqQCf196a23Bjz4qT\+cPDaKvm929dllPfdn7Qvk8/dKj9AgAAfIFdtXpj7P19a7emNz6y0vcbM3V1cAf\+su4PJ\+JE1BvjzlBtaT93oidJFDv1UXv\+4or2Ey1dk/5G6I\+8dVy\+yvrK/y1Ndp1sePrPDafSSWnL9tdv2fZY3ZHHKN7atHb7nyN1NRv/18PJHz5bf6qnmTvefndBO3f88h7Vm\+ps\+G\+f/LGv1v3nf2yU9be3tmzY\+pe9p9LysvGN0pH3W1oeNG1zz234yY7tz7es\+PeaVxpqqOvYpq0vNt399c1139ma9eep/vZNde79rV/77Xu2/up/lhZIibqadjXsOHY2SW9wt3ztqd8soYGuvU/71r1Xte0xiy/lvX/7iSu6eXWKXaCzG3ez9x0VNy5PNz5fMNzzUK4Sd9n6kkfz6qf2QJeLZLTlAzUlQySlisUDhlZmZMzkEUOVt/fal6a0Ekn9HuW6oznykuTWb/QaEnlrX7pwvJkxEy8EZLQ3DRiY7HhJv10v2XAoJ56Qbfj5jKSYlaRMZQnJFak1D/VXknzLHmbLc3lbrfFdJXmb9si5xBR3J6MtF9ffK5bGpJHynqdU8qbjeWt3yxtHk2fLuwX3tQ6RmC0vGqi7a7D5r3kts3qSJNvSKFn/YLJqliS2VFS15jeEhipqe\+1tik0Th5v6bPflIpKh0tys9otnT\+fU/1EhL0o\+tSy7aY9yR4xIMhxOMqWzqGm/vGJFyqCSc\+eH7M5q3l\+46MJ7Yj9ZVvOB/C2UnaSsyLv5myTZl/uHLVcMGooo1nVhzU1eNKhiKEmDlSVDja3Z7e/m399KcTGr9HyTjOH23mpGtiGUM37MpPHiXZIIDdY\+1LdGIdvwR5l8VTLZJdv0PG2rTWxLKL93dOgKzvUnaG/NW/fHtMHQqxKzDA8kNr9c0EREkqGqpWl5KLd9ed/mWMGGQ5dz4/plnsFSrWgg2aaOK3z09wWr3u4tjN/XY79dXH\+TSKmslojcvb2g4Xh2kijGFayT9q1Z3L95aa9KSvFzOc2t\+av3y5sSRMyFS4p3MJsaB3at6LW3KocPZjIhW/vTy7tYkkxIt\+yWxBJEJNmxOz\+eILr4EeVTks2FcuruEw2t\+U39Q1W3J5Vn8iMTA7V8xsBGW9fIqFcTBsHKyJkhecfljQ8BAAAAn6XLDsDJEwfvtx4cfZVu2fv0/7V35N\+Rt/atfmvfhTOkhL0//enecbNb/uXghW3GL//MO\+u2vjjh919KaNz\+y/Lt5yc0/fD/2TS6/aWzipRdxxomeyRv/Ni\+\+2ov2p6xFQkndmz95Y5P2juKH3vNUvva6Kvn7nr1ufNN3//l3l8QEdEr733C7kxY\+Jm/bfnp37ZcMPXYwdXW8Qfk2bsuucmfTj6FCrBSMVg5P1WlF2vKhyKH8ltGQ1Eyxjzuya67r2/bD/pbuPxNIw8vmQLJUGV5cs3y/uqSrKaXlHe9S9UP9Dz1o/6Wo7n1b8oajw//ms9q75A1NDJca45Sm9z47WS1bqj9zYLVe2SRNJFkyDA3XTH3oqe8nM\+NmVJ9z1Plku27ChsouW119y6V4vGXpWOjLskVQ6W6Qe2Lisdfl8SIKCFf\+3TW\+gd6n/pBf\+PzhRum8lhjyVDl4lT8daXlUE5cMmS4Mblmed/6\+y68rTx5Km/t/0vy1vwtrdmlc0lOFI/J1z4tXXFfYmOJbJ1XEhPJfWDgqQd7a\+sLLriU8Jnti2pusk6fVioGtSVpLWU2fmMglpBw78raE1lEGdWsDPVPGqQzww\+JVTKDVff2yg/lbuHy1oritoe6fa15m17NMXy9t2bW5DFyTLyN2d4\+XCImOZNJvssQUbxLMtwfNZ7IaZFk5MxQaVHm/ON8P5lksPq\+XkO/bO3JLKVisHQ4O0kzypL\+rbVD8deV958Z2PwNwXe0YN0eWUQkooxKkaE0kSJdu7x3vZ4avLlceqhUkSmdkaELy3dZzfvz43f12LvyV\+/JUZakqhVDyTTFjueu/WNWNZNVPGvwys71JWQqDX0blw1omezmo7IGTtZ4hqoNg1VLE8pDBRtekjXEaGtt90uLczf8caRme8EnQlmUriwZrJyRocmHqvrEM/iSPFbSv/W\+Qe75PO7K66MTiTn1uwvrd0/2Vjq7cX9B46TXSkTpup9dEG6zml8vXPQ6EZF2cc/W5WmldLIZx6SyGwNyUgyXiEnF5LQQUTq7ZeSwZLd0ZJSSjKoorZRMvUNyRru4d3TVmdJZQ099b6A9nSmdlUme6/HdlEXDvbLr8xs7cu/fmHuphVQYEttunOoqAQAA4LP3Gd1xem0w2tuqNn7z\+vY93qYz6HNGJCGSZDXvV6x\+/RMqwEMVd/Vsvoma32fW7pE3TexYG4/JtuyS1c8X168Qq2ZJW05\+2m96yeCax7o3ajPUn9MUyltdP7LA7buK9s5N1i3v31jXt5Wo/f8o7/\+jNNIqjxARDRmKBlUJ\+aZt8r0nR7Ncbrr2oUS1QlK/SzJaDc6KdcgbEiPhOdYm374np6lV2pIgotzVblkFZY9/rHELl//4oRwuNq6bYpds029lW5ghZXoK6ZeI0jkNfxx9cGg6m3s3l3v3Ur9xqfH9oepvdK\+fJdmxJycpGVyzOl6XK9tUzwznisi7\+etye\+sWp5s6hm\+E/sz3hTKUymk8wDRPHGGLmNTW78drciXbn76gDJuRS0aTrSQr1iHb/nrejuEiYWuu5ZeSmrsGVYPDz0n\+9FVX3DXQHip4fLdEZejZOOvCt\+Vz\+16oE7XnpJv\+OsV9yYpFmA2NTFP/0JrH4utVki1/zWlJ5G86l1YlZA3Hs5MktZyUG4qy29OjO6jIbnhOQrPE6lk5bm9e/fFsUgxstCdWSCXbvZLzhzqdFU9lEWU1v65YPXJ/aU/lOWZdJCdJ1N7KbCciyl3belnn\+tP2pSun5VDBhjfHri5lIkdzNx2Q1x/PThJRB/P4z6WG8QOnSyZkYHlRcrNVVJ2Rbzh6wdGbwhlkBrX6VPv\+AveU69Wfi8i7Bfe/O4V2itTWfsn25xQ7EunN1osCvSRTvVrYrKOWAwUtU715Pmuqq/7EhbRwynumPo4gAAAAfOay5q360ee9DaPyyzb/18OVb3ktz3w0hR6ABSueWPvUPYr2A/7Ht7/dcvH4z58npqqubuusNyw/eTtyWR2z/wGpigaV6ezIJbvmZkpVg6p0zpXcjvuPQ84MycXL7tkL/4hwrgEAAAD\+oX2RAjAAAAAAAADANfOF7gsHAAAAAAAAcLUgAAMAAAAAAMC0gAAMAAAAAAAA0wICMAAAAAAAAEwLCMAAAAAAAAAwLSAAAwAAAAAAwLSAAAwAAAAAAADTAgIwAAAAAAAATAsIwAAAAAAAADAtZJ2L937e2wAAAAAAAABwzaECDAAAAAAAANMCAjAAAAAAAABMCwjAAAAAAAAAMC0gAAMAAAAAAMC0gAAMAAAAAAAA0wICMAAAAAAAAEwLCMAAAAAAAAAwLSAAAwAAAAAAwLSAAAwAAAAAAADTAgIwAAAAAAAATAsIwAAAAAAAADAtIAADAAAAAADAtIAADAAAAAAAANMCAjAAAAAAAABMCwjAAAAAAAAAMC0gAAMAAAAAAMC0gAAMAAAAAAAA0wICMAAAAAAAAEwLCMAAAAAAAAAwLSAAAwAAAAAAwLSAAAwAAAAAAADTAgIwAAAAAAAATAsIwAAAAAAAADAtIAADAAAAAADAtIAADAAAAAAAANMCAjAAAAAAAABMCwjAAAAAAAAAMC0gAAMAAAAAAMC0gAAMAAAAAAAA0wICMAAAAAAAAEwLCMAAAAAAAAAwLSAAAwAAAAAAwLQwXQPwgNDa1pO88vl7TnzYmbh6mwMAAAAAAADX2ucYgNMdHxzd/\+ElU2ii7eie1yKtQnrkdS\+/Z8fuX7zWfunYme54960dvjfeiKXHJiU\+PBp4s\+1E7wUtxSO7//TYhp2bX\+s8v/aBnhMfth36IDL6X9uRNuES2yYe\+t0fLM7ffP93kc5P300AAAAAAAD4QpBcyUy9nUdO9g7QWM6UKwbadu5u6UiNayMtXPmtVbU3METpE4fe2vvBuAwqzb/59iXLiz\+u//ULv\+\+cudb56JobmIvWke488vbm5zpX2us2LS0goo7Dr/3i1WNnP2CMS0oX5U\+6WemOw29vezVds3DJnSrJyJRDr/3oz2LND\+o2LB6/ColCVaigj/c\+9bsBevTHX2blRNQd\+cXmvcHxuzB3uc95Z7mMiCgp8K2dabmUkeVJFFLJzIXzyl/9\+PC\+3Vtv\+I7rdvYyDx8AAAAAAAB8Dq4kACc\+fM3xs5bT5yfkr1w550jk49PSwgWzGTmlE51no3095SOZV4xyb\+/kJhRhb86fpyl8a18nUWGhXDh16IPhyfKZs9VlrGRkrg87B6TFN5cwRERCpH7vsbNEs0tmJj6MHJKNb0\+dbXy0L0kD6dbONFG682TbIZmESCIrzD/bKRIxs/PH76bY0fbx2eIba5ec2no4neg49d4H3YriORqphKQkm/uVFzbcVpKKbN7whz1Sych6KB0N7F39548vOhLJfb/65b5fjZ\+SX/2Duk2LL87zRJQ\+8cofHtnZ1jP7lt9suG8pm\+5493D9vpaDbXy0e5Ckcs3sOXfcc\+ejy\+YVy8bPJQR\+/psfHU4S0c1fs/7GUiqfbNHJDxsfcb59bMI0\+ezZ6jtNy5\+4p1Qx2SxXUbLtje9s2P8ezVzrfPTOD/7wyHOnaO6tv9mw4hLXKQAAAAAAAD4fV1QBJiKiAu0dmx647sTuPdsiI1M0y1Y9vWaegsQjv/vN6n1j9eGC5d/7fvPDbXsO98xMvfvks8eT2jueWNTb8MtjZ4mo\+/hW9/GRhnnzf\+z8RhlLRETCqf0fJikvnzpOtUoLE4HGhtNERKcP//V7h2li\+55Dz/3hR0fO91YOPven4Mj2fGV5Ry/lzSkrHrebvZ0Nv/zdztH4fvDPLxz8M9380GO/MqSJSCY731Imk0xMmzlLVq6yLZ003BINpE\+8\+tJPDk/\+JhElY0d/vbuth/JrHvryUpY6D\+15zD18ESFndnEhdXdHTx6P7jz\+Xsc3f/Ut7fnIGmvb98HIrr135Fi0urR8qqkyefp0W8PO353o\+9avqiePzZ8yf8db393w17N3f8v3rXlTnl1SfvdXat/07jx5\+BevLvpVtfoK1gsAAAAAAHCNXHkAVqjm3LxwDqkYitCnjCY10LnnV79/8oNBIqLCBT\+2zDvy7O7fD0fQvPk//uGdnb/7/bYILam\+e2XJyPZ0HHn3YDcRHfuJ\+5hm4ZzEB2cHiIhIs\+x\+15c//tl/HTyckt/x0IqVJRKigqUPPPDLlSSn4QiaNj60qvYGCQ2kiYSdh4n62n6x\+Tc7pUREJM03WlY9sdnxxLigSwNpkkmSbS1n\+0iex8hkRCkiIrlUIpMRUXp07yTFN8xburDgEjuZlh1hiEQ63zN8wrtR7u393STT3lqzqIBIOPRq5DRRgXb5MxvuLJMRUbo18IfHnm1779WD\+\+\+Zt6pktAv3B0cP9RFJ82emes\+ebH3j9B3lk3QXH1P4rxu\+84OFDJF44t13f73zr/s6Bw\+/8s57d5cuvexibLrjSMt7KSq53Pny1TWm\+XueOn74lbcPLVt1J3u58wMAAAAAAFwrVx6AT3N/\+go3/M/80UJfuvPQnkfcR6JERDMVw6Grt/PIyW6FtnTmB21niRYsmpd45aVff5CcveiO2sLWXxw4/uTm45SimYu\+8oO7RwuGvXwgcOws5SzQFhyLdEc/OEWUc/OyJSUfvL3vwAuWA0REGsOKDcuK5cO7EDv85K\+OnR3dsJEKcN68tXfTkT6aOZtVSCUl8woTR1oOdstnxnpaO154bGdbz9iezL51l/PL9Frre5Rzx6LrFEQkzdcU5pw9svcrD\+8lum7d5kdXLl5Uc/IYdZ869MElj1gnFS7RzryZnSyg9p7a89rHA5Rzx5fLNTKigXSiN01E8nxm9NBJyu\+\+/5lFoqKQLR7rsD3Qc4g71UOkMXy5uqNxW\+TsvkOdtTdMpZzLlC1e8kT1sTd2tvV0nz3RnV6aL6EB4Y19jb8OtLV2Jwekcs3c8ke/tWLVDQwRJT989RHnwWPSef/53QXvPffavkzZ1yTh3e1ERNF9vzPsm/mo89EnbmA6Pzy8c/fb\+z84ezol12i1NQ/cXbOYvWhjJCWLltxReHxvZ\+veD4Q7cYM0AAAAAAB8YVx5AJYVz1\+1qKDzyJHg6FDIiU4\+miqYKaVoKmfBkkU3UzpJlPjgtf9wt4yl02MH/rqViIoXbfru3Td3Fx46/HKwj6i44seP3zbauVc88urLvz5JRCSXkYxIY7hl5aJF/2JgW3efeuPPp3qIqLji3x4oLxm9V7Z40d3/e8NtAxeUXnv5hmf39\+TNXzXv7O85uvmeBYnDLTLtHTaDWtP3lV\+VJEfbS0gqp8MvOfadpbz5KxeyciKSqWu\+/52bTw8P9JWvmS0pJu2C3ld/8mxbw6ccleuWTzY12dn\+3mkiafEdNwwvnykpKaBI99kjLz/ijKz8cvkdN8wpn1tcVlIwca7Ivg\+TRIXLv1y\+vO3IryOnjh1uaa2\+1BhgF5CQNOf8qwEh8NTOH3G9RPlLlmgVsUgwcuTJzR93bvjWmhsYksrlRJTq3Pts\+3vdEs1c5sbbbuH/8s7BbiqYu2DVIu0dxZLEh6/\+x\+aD76VyFixcUCZEDkZatrrPJodnvwB73R3z5HuPJI8cOZu4nb3WdyADAAAAAABM0ZUH4Jk3LPm3h\+e891RkLACfPbL/P44M/3Pw2OH9G/uY536wpGThl3/1X3eXFEtan935nVe7h9\+eraKDz/1\+86vHo0SyvJyBzpb/2Jz\+t\+olyxfNK257dfNzpwbOrydHUTinuOPt73\+/5XA3EeXMLqTTnS0/\+mHLk3kzb144Z/ndX66Zd/b3P//Tvr4JmycrLFR05yx56M7lvS81EJGU0dwwT3P34nIZJSe0TJMgHOJOnSaS5dF7r7waHXtneLTqecMBj12\+5l/L\+kYz9kC6g2t88kDPRXcF55fMnuSQJjpOdRBR3kxN4fC7BUsfuO/Rzt07P0iePXns988e\+z0RkXzJsi8/8dCSRSPDgKXPftBypI\+oWGucW1BSWHGz9NTh05HgaXHRJ/WCHpGMReoDx3uIqPi68kJJInLw11zv\+T7SA5173DufPPLxzueOmn6wZObITL0dJffu/q8lZTKiAUHS/O7B7sHihbc9YZknp/SJw4Js9nV3zLtjw6M3lqTafrbhd7/v/Dj4gVB7g/qilReUzWXpyMdnO/jOAa1CdtH7AAAAAAAAn4crD8CJ2Kn3PkifiIlEE/LYzXdXP1oS\+dmzLVTMKmREsuLyfEp80PiLV7uJSFY4s6TvbPSDIztHRn7O0Sy627bwlOfZlm1PHdtWOO\+xL\+dRXs5MGjw7ElMHD\+/bOzy21GztgvK\+Y8HT\+ca7tQMftB48ffbwkYJVDxXI89Irq28tESbs1\+xFt5jmUTKPObubBihNqht/8MMlRESUPnvk1e8\+dfx8F\+i5y30//GbJs3/4EXe8Yd/xcQvJr1m4ZPm8kQUWz5uniEX2HRFmztMuXVgw82SBjMTiG\+YsXch\+2qFKD/Qlk0SUV6CQjkySq7RPbFhb/e7RvQda3jjSdqyPiJKHD/z1Ox\+e/dWG\+5ayRAPCIa69h0iz6MayfJJLtStvePXwB2ffePPjR2\+Yd4myaveeX\+98L09CqZ4Tp3t7iIhm/uvDX16ULx45FIkSUbF25VyGiEjGLjWoC4609bS1HulePFq1li9dVl42eV6VlN3zwNP3nD8yJYVEnZQUJr3hmWSsREY00NebSBEhAAMAAAAAwBfDlQfgnsjB//jZhCkFxYXU2Z2UsprC9ADllN9QOJJ9evk/\+Q6/R0REinm3bjC0bX6qpXP2/FVLCg79\+cixto8TyxY/8Si77wBf/LVV311c8N37e47s/sPqP49UlmcXyxN9zKJF2vLC9InDRJQ\+2ydZumix5oaeszTv5mIx8Kudww8KmmDfwYavWZ\+xMB2pNFFPa1tPcuHwDbeSki//64EvX9i8/HvfotRvfnSkeJ3zW7XFp3624Xe/7y6\+WTXh\+CQ\+fOsXO4/LDP/yzPeG\+yqnOz88dYgd7d8tzdfMVRdPlveSqfQAEUklcun4yUzZ4iVPLF7yBKU7O04deuW1rfvazp5\+d\+fhW2\+\+p5g62/Z9OEhEHYdf\+u6HEqJ0onOQiI4dPtr6wLxLDWrV03n2vdF/y4rn/9ujq9YsLiDqSXSniUiWVziawCWyvHw5UU8qefZ8PbygRHXJv4ek0LZv92v1h9uPdQ9eqs0YeZ5cRjQwvNcAAAAAAABfDFfzMUiKknllfUcOHnnr9x\+2nZWqR\+53pXTrgZd3RgZlhYWK7m4iScmixUuLWxpOH//9n4mI6PSRJ392hIhk2q/4hsdYljHjh1ZK9CV7\+pIHuXcOjkxIvse9MxLzZrOPppg7H/rmLxe903BYlAuRfScHC/LkinlLnviatqxELR/oiZ7uIRpsPRzpuLu4TEZE4qFfb//OgXHPJc5b8L//6xvLWfZO042aw\+/U7z5csvDYnk6SaRfcPP75SSRGPzh7luTGRdcVEyWIiAYP73vhO/tG35fO\+c/N3/qXkkkOqVwqkRENpMTkcEW0lz905NSJbkm5YfEilogkxSXzTA99peODp7edHOzsEInSHUeOHEoREQ10n32ve9yyOiP7T4pLF07aC3psFOgLSBSFEiIa6OseLcmmB7p7k8Nv5RGNZuCCS/09DPANP//91sjgzIW3/vRxbTEJ\+3a\+3NA5eVsiSvYlhwM/qr8AAAAAAPDFcSUBOJmiASJFyfnHIA2TF85buShykDvWQCTTLrhjtoSIEh\+\+9rPnTvXkzVv38Pz9T\+2PElHenH/93rdWptKdh157ct8p2cI7NixL/37n262Try1n6cN1LgPt/9XOzW0FZamP3\+uWL5gtOUvz1n1/lWk4beYXywNtwSMjMbGnL9nzweF9SypciyUUa9v/4SAR9Xzwzt7I4ifOh8PC6kdXrCoW9z27t2E0Xiq0dzxhaP0P7q//cZiICv/1gRsn9Afu7Tz4QTcRRT88m/jycAV44pOBpfma4kmPp0SWJ5cT9fSJiRQRUbL71M6nXj6YotkfiK5HR276TXZ\+/F4nEeWUzCuQDwiH3uQHiGYb/uWZ75UXDy9mgN/hfHrbye6Db36cWHipXtCTYkpuuG7mvu6znW3Bk\+KihQwNCIcO8z1Estlzygsl1HfpWfvSA0TyvrOHTg8S5dy87FbTYjbZ8W59HxHRQGpwYLI\+zgOCOEAky8tXSC96DwAAAAAA4HOSffmzpBPdvUkiRWH\+heMbSQuWmm69WUpEOUu/XF4iIxroDOw\+fDiVX/1o9ap5I3VdmYwpu2He0rn5Zz/kB0h\+57Jbli\+cM3PSpDRARDSQ6j60\+4XNh3t7utOKvJGRjc\+ebvnR5t2BjjQRJWOt9Vw3Sa9buaiQSG68u2IBJYPP/ukXh/hDgYMH\+3KWLKtYID37J9/h1vN1X0YzT7t04ZwFeeNWJ2NvXqbVEBGRZtmKRxdPGJO588N39p8mIooeeG3Ph\+IAEZGk\+IY5SxdqR/67YfL\+z0SkUBXPJKK\+7o7uNBHJS278t5VzCohOH/7r6u\+5ln1320M/2PbVH\+4N9lGB9rZHl7DJ05F9JweJ8pca5hSf37ziO2\+/TkYUPfLuuB2ZkuIlX/63RXKiszv/6zff/fkfv79h55NHkiS9rvahW8sn3WaZZGYhQ0TRw69u/nXjnk7F0tk5RIPB3Xs379j9H//12tnifCKKHn7N8xqfuHBmseN0DxHNLCm\+1AEBAAAAAAD47F1\+AB4Q3uP4HspftPD8M2CTKSKixOmjnh2vvZciosGDO//w5N5IBxX/yw/rfM5v/eB2dkIUEtr/9NSftkYGZdo7Hl3Cyi9RJ0ySZGYeHdr5u\+/9\+VRP3py19urqEgkRu/Lfvvm/lxVS97Enf954qKOt/pcvBftyljywomauhEhSvOTuTQ/Pm13MDhz\+68Z9Z0l72w8eXvGDZTN7Ivs3Ptc62m9XjLZFDn1w6thI8TOdFPj9vt898rPhhxhT9MCfvvvLt46MDfIkRHY\+eyRKM2u\+VrEgdWrrf/3Jc6hz6je4ymdrlxYTpfjgh0KSiIhZZPnmM/blNYtmziTq6e4\+1inKZs9Z\+bX7n/nh3Yvy0x1HWt5LERXOW3nD\+BAu0SzSlhNRZ9v\+D8Upr5yIiGTqf7F/55dfW3BzXs/Bw8eCnZIFC2/5qfNbT0wM\+eMULDLdekceUd/H\+7hIlGbV/NuqRxcWFnS2v/GhWP7Qv/zv79/36MJ8WXfbwQ\+6LzwOwscHP0wSyRcNP1QZAAAAAADgiyHrXPwyiomJtqM7n3u1/ki3THvHhtt79h0RBzqOHewsrF553aF9x04TEZHGcO\+6hW2/2NlyjIhmL/rf379vaap1z5unOk637Tn8Mc2tMKnOvnH449NENLvipw9r33v1aEI6eIhrSyy897kfLCmREVG61fcby597qu3fsUnfdrjf7py7qGYh05MSTxw\+Euyes875rdrZPfuf3dtAtzxRRXt\+\+1JDJ1M\+77qZvW3Bk8y/bvjOE7M/3vPcq78\+cCoxe5Hrh/ctV0mot\+0Xm3\+38yRpDF9\+MHP4//fW\+L3OmZlHZ/uGx3YqND503xMLhZ2/fnnvaSKi2doFNXffIOzb97uTg7MN//LM49qBw3u\+\+6uW6PDOLly0fO7Ee26lM\+8wLV7KXtAXOt26d\+cjz31M2uXPbLhz8qLrP4uON//4yK\+OnS1e9EvnqjvZz3trAAAAAAAARl3ePcCKwpk3L5yzVHrjo49\+eSlFDu79095uks0tX3X7vHIpG\+0UaOEdT9xTqqAlSxcubggcpdtXLC\+RUG9BB/f27zuJaOa/PnTH8iMv7KGcBUu\+vOHROxexPfJXG/\+DSxLlr1ymnTmSDNPJVJqIBlJUsvTuX/3XHTJVQeLNP1p\+dews0cxFFUtnS0jGLl/zreHn9/zgJ\+U2gd\+52bvzNMnmLlleLOzf3fiLAx/LF97xq\+/evZQlIqL8ef/2/X9J/nz3vu6\+/lwimvmo89En5vb8abPnJ5HBs31UUHjd0iWLaquXLFVJiGiTc94q7p2GV44e6k53vcv98eSgbPaiDQ9ri2USuv2BZ\+Yt3rP3tXru1LjnOY0o0H6l\+oGLj6pEY7h1eWDvvsg7DUcWb1h6qbrrP77e9sDeY2cpZ8k9t44ceQAAAAAAgC\+Gy6sATyR2fPhxB8kv9eyfCS3bPu7oy5k5W13GSqi380QfWzb6xJ1ER3tr96Ci\+Lpy1flSaiLW3tpJI\+2H9XYeOdlLhTPLSwrkF6\+B0h1tpzpSoxszIBw60l2yaF7JBRs20NOZYqjzVFSgmTfMK8tPd7adiqbyy28ovmRn3YE0ydKtrx3tXLj4zgufEpTu7Ojs6E4OUJp6xc4\+MdEt0uzyVUuLJ93CE6/84ZGdbT2zb/nN8JN\+/wmlWwO/e\+zZUwNzb/3NhhWLLvGsJgAAAAAAgM/F3xOAAQAAAAAAAP5hXMEo0AAAAAAAAAD/eBCAAQAAAAAAYFpAAAYAAAAAAIBpAQEYAAAAAAAApgUEYAAAAAAAAJgWEIABAAAAAABgWkAABgAAAAAAgGkBARgAAAAAAACmBQRgAAAAAAAAmBYQgAEAAAAAAGBaQAAGAAAAAACAaQEBGAAAAAAAAKYFBGAAAAAAAACYFhCAAQAAAAAAYFpAAAYAAAAAAIBpAQEYAAAAAAAApgUEYAAAAAAAAJgWEIABAAAAAABgWkAABgAAAAAAgGlBcrkzHD/2wbXYDgAAAAAAAIDLMn/Bwstqf9kBmIiWLFlyBXMBAAAAAAAAXC2HDx\+\+3FnQBRoAAAAAAACmBQRgAAAAAAAAmBYQgAEAAAAAAGBaQAAGAAAAAACAaQEBGAAAAAAAAKYFBGAAAAAAAACYFhCAAQAAAAAAYFpAAAYAAAAAAIBpAQEYAAAAAAAApgUEYAAAAAAAAJgWEIABAAAAAABgWpB83hsA/8w0X//Pz3sTYILoiz/5vDcBAAAAAOBzgwowAAAAAAAATAuoAE9i/fr1n/cm/OPZsmXL570JAAAAAAAAnwQB\+ELr169HlrsCOG4AAAAAAPAFhy7QAAAAAAAAMC18RgFYCAe5qDiVlmI04PEEptYW/hlJC0pZRn6Vl8kopVd3iQAAAAAA8I/nswnAohDy2iz2AD\+VptGgx2b3hT8pAosht9lo80WJSAx7TDqzNyry4dAlY7MY9Zp1BovdYbcYNBqj1e5w2O02q92HoP2Fo7pl5VP/WVWRf\+F0\+ZxFW598sHYBM/JaWlBVvbJm7OUnYSq/aX3pyZUG9qJ38osNlderpEQkqVj59a0rZ8uJiCTau768ppKVj653/SOLLt6ey1RgqP5q3W3sZMFeosw/H/jl\+QWXzOrX4tIAXE1iGl8o09Enn3dx6DPbEAAAAJiCa3MPsMC5bQ5fVCQShfC7rTRvsU7NEDnNelv43TYqX6xjGSJiNFa318p4TUYnr9awY1mGUZPHavSMvhT5sKD3cH6LenRCOOgPkdk5/Johhhgx5LVZ/AZfwGVgifiAw\+oMRKPhVlGzWKfW2xwGRmO0OV36sCvsYh0um24qwQk\+AxLtbXfU3lJ0PgHOmls6K1X3bSaWGp3U\+1HD8\+80nzpWz33JblrQdOJIe4qUZXfaH/xS89amT1646qZb6pbNlkt72mVldY89WN2bbm89pjSZa/O7Ws70xLoSsfYTDcc\+iqUk8nxVaQEjJ0pSOnaGquq\+lhR89WdUNY/cUyUE6gdGFlh611e3PjhfJSOiVOz919yti7Z9\+/qkICaJ5CxLbz173y/\+Fme/tHHdyqoiKRFTWspEnn969YHZddUL2n/blLx4G/Nn1z1ZU7pn57rXhWT\+9Wt\+9PXKV31rX\+28uKXqlpXbTKc3/ORgS4qIJKV3W7bdcmTtfx9pT1280KkRo4I/JDFoet0BucPBjny\+BJHjElywVzTOtpvkl/tBEUIfO8cvbRJDAj8QjSYFMSMKKZ5PhsMZg32OWZNNRGL0nDeYY7YWqolI7PPaTvFWjcM44ZqAGBb8fK7ZOLxtKc57ljfOGp79GhviA6fc/EynNW\+SwyL2eSzHAyaNz1Yw2UFLh318UK2yGeVEJHC8zSlavRrT6GESQjFvSGaxFKpHZk4GHB8Fjde7TOcveVyL8/X3E6OJkJhr0EmISAgnomy\+Xv3FvbVGCMW84VyrpYAdnSJGO50\+if0T/2Kv/LyLfV5rNGia77Ey495N8\+F\+nsnVayRfzHMKAADwT\+3aBGDWYPcF7UREJIZ9NptX7/LZDSzxfpvZo3H7HOOKcWKYWJ3V6XcZ2UmXRcT7rWbfuNcC5/PxBrt5OMQyxBBDrMHutgfMdpcp4DKyapMrYLL7rJaAyee1qEmMev3RoMfpUPPBcIhxOaJqhtQGq838KUFYCNj09/66beLEwpU7Q36rhqJ\+h83h3dfafd3ir9vdHodRPbx1Hpvd6X/rY5pXZXV53BYdQ0R80GWzuQOtHzPlK21uj9OkYYYPjt3m8Da10XWLzU6vx6Zn6ZKNSYz6nVabO2zyhbzmS/9Y\+weTjrz12qa3iIgof3ZtnWX9TaxSJq0s/WjT9n17T4wWVtjrax\+5pSI/3Z4qq3tsdsuBlqTplkppInb3ys3LRpc0ENu7923uTJqI5HNufeo/F3H//ez21mPcskU1J/Y9vj2mra6poze2vCXWLOva\+4dnNzT3jN\+M0f\+Yiuqvr7\+Jkr0FNXWP1UolckpEehdt/M\+KxmdebDhByqIilfDG4z95h\+5\+\+ClDgbw11d78l7X/faQ9Jal8wLr5OiIiEv626cexynKFcsE9G285vSXQX/VIVdV1BbFvf8fwiEQ5q0jZ/sbjP/5Lk0BEpJxTVimNNaWKSlmRbrtnTXlRsuhbLz0oUc0qotbA6p\+\+1jxQUGWqWlEqkc\+aWzpHVVeniqfSLQfeipQyyTNd8StOv0Qk8t1ef57OOhAO5xANRb1/M3uzDfpcvVFhtCo1uuFf3kOCmD1ydUrscZtP8s4FLsOlvzgEMRzKvrggJkbPOe1nQmIOy2YxohgMSYzmfJ1ayqrlepNMxw5HpmTQdSaon2sdnodhTBap2f6RLqAxj8tUQlTwh3JMIwE4R830OOxZOt914z/MQqjd5hzQG/N1OinD5EQ9p3xCNsPIdLoctY61DgfsTzs8fnvUxaWJJHp7qY3p8XFJIRQPCEkxLNfoZ1oteez45kyexcH6re0eww12/YXHRwh1Olz9Jl8OUSrkbbO50kb3XA3XZgnkOd0qHUOMWioGeJeacY8kXrnRxgacMc5QOvZteXXOlyj67FF3KD36MhMND4hquW7kiEh0trkek\+iw8pxwYelSFNLhKOl0EkZT6PJcb1QTUYrzdHj18/Q6CSP2eG1Rzvol74Swd8EiEg7TKbV7gV1/WSE5FXR/5IvmsAyJ0V5/KMdkkouhbo5RmPQ5jJgRRMbmUuvZiTNNti5GLRVdp72aMrshEwokeCaHonEumBM0ZKnFQYHJMxkpcHXO\+xAfjLl9vQKTw/vbbZxErSswMl12V1JjyNNppHqTTKeRXJPPIAAAAHySa/b/UDHssdm8YZFIFKLv7jLpvTpWjL7bKsxbbDf5iUhtdHlcRjURo9bpSQzYTW5OGG7d\+rF83mL9cCWEUZvtVp1eP1oXITHsdwcYm9esGcm/wxmYGI3J4WAEMRwWDDqWiOcCUY3JMPo7l1EbrqwCzMz7\+s6g36qZZP8cQbUjcMKkjvocNrtDF/Ca1ULQaXMLFm/Irxc5l91u8\+gCdr3gd9h8jM0Xtmj4gNNmt\+sCPqtGDLltzrDexfmMTMhrt9ucuoDbyPKTN\+ZcVgen0Rs0U\+hH/o\+Hqbjrno2P3Ko9c3DD9oI6EzW1FtmfXFv71itb/nCkWUiT8FH9Mx\+NtVbetHJX2elNP/btODaatPLLNv7onkr2He5MmkiiKl9Q2vsRd0qklMi90lL771\+197aULpNwv/goPqC6YN1ytrhUJhIRSQtKyyTaUgWdeqeBO9le/rXNpW\+sfvp06S2L1jy4QCWVEKXpE42VbZVlFevXfa1yoGXDT9\+iaot9TqzxvX75sX3u4xWbv6na8dtXhtMvUUHlsgr5sSOq6pX28tOq25iWE13E/cUt3LL5QUX9bw829xJRT9PevzQRqSq/rl0Vc28/GEkRSYtrH1RVlFleuC1NRMmuY\+6tf2kULvu4Zw9/DkY/DTk6S4nbNqHMJQQ/MjvJ4bvepM4mIR2lPJPmSr41GM0Ml38GEYnhj63mXp3tepejkOW7fQEyGkfKnkLwjEcschoHvJ4\+lvpDYTHg7WXNRZz7I46y1fqiCYW7cMzuTJAmhxElGrbf42xjxMGoqHC6VZpozOnO2Nyzwo72oFptiJ7lDNf7zINuOy/o59otk9XxJttks1tn5s/ZLOcMBkZDGRPL8NQf4gsMmh6Pv89iySNKhzxRu1ccC/yCOOi1hn0jK5Do7Rq3haHwx3aboHOVWTWDftsxy69TuodmiP6PLBxZ3CU6hoRQp9fXK2gYJsg7QnINk4ryg9GAEFIrydXmJyJ1vtVarL4q54thLB6d5fxh5C2WhMWvtUwooee5AzMuPiJiqN3ikrq912nGVin0BcJSs03G0FDYd9rVlGKEDw3udDgqcwYWOPTpsbAt8mnGog3YUwIjM152iVhqtF/P\+j72hQYvfo/VsTYrqyHRZ/uUdYnRcx5fQtDIyH/aFVaa9FJGGDp/sYbJUaslDEmu1nlXG/LV7i6ya/0awWrtNTpn6IKC3q7x2s/XisXP8DMIAAAARHQtA7AQ5dU2n9eqobDX5ghbvU592G11CTaP06QWAjaLdzjJMRqzy01EZLKQEPI5bLZ35z3kC/rMGiIigfPY3ZzFPVof5gMOqz1ANjsFPa5gmOf5EBd4K8oZNDaRWLVGowtb1DqdnuU5f1RjNmrGtifqsxk5RoyGo2Q2eFlWZ/N4rFfcE1oMB3xRvcNjNWiINDanLWDxBaNmY9gbZMwem0nHEpkdjoDJ6QtZ2LCX01j9NqOGIY3F6fCbvf6oxcp7/YLR6bDo1UQmm9Pst/k43qALTNbYrtGY3X47w9kDgX\+q2wylbFX1PXbTosr82F6fd13gRPKmr9cNdO195nl3YKH9sa/5fnXrjp96t7wvqVx5Z818hoiot4sWVFDr8arH6mrziYiS7Yc3jYvHJC2ovEUVb30j0stU3l1VU14QO9Gjra6qzP8oXv3VzYIoz1dUrFq52TCcZtN8e4\+itFhTNlsrXbKGYjEpyWdV2P\+9oukdIiJl\+Z0bv10h7000p4bbS1Q33bPLfSfls8r2YyNrzC/b\+KR1TdFH27eejhNTWV2z2aRSSkleVGZf92i8/fDa//Fai3Thxs0Pv1Adq/\+Jd/v74siibrtno0kVe6YrNouUXR/t2PpKU\+/1m5\+0vjArtuMn3voTI2usWPng5lUlSiKi\+U\+5b0t2HdvuixnoyLqfHGkXYrE592xblY5dUSl4iA90WLhMNJploUG7fjDs5x3RHIaIWLnRMsukyWaNc9yWE053XO9imWg3F04Eze87iYhIiA6IRg3nm0H\+vxltfYwmhxkpEgpmw8cj9arhKOJSsMOrC3bYHHG1Q\+PQZ4e8UbenT22dYxpuGe202c7yeqXbflY0a7y2YmMgGuJnuz0qdbSXV\+fr2GwSenyes0GuJ8SnXXwmxBR57Uw0KjXoKRzN1rHddrsoiMlgIGl0zDZqJEbvDXyIt7lSJl\+\+WpPt8uT4AimBaMr9J9KcNxY1qMz\+E2ZfUiQS\+YGwmHJxg2G\+12xJe7xqve2GoI1ITIuM5Py3yfiXYo/H1at3lZmF0xZ7gdt9s\+hOBtxRVyjf5cmLhvp4Y6Faw6jV/Tw/RJSt0bNWE8Pw5\+zhLLfnen34jF9krSaGIRKu0vkat/upoKczrFEbJutAzgfbbI4ET0SUrTbO8bgK2Yv\+fsL\+MyFNkcEftUeHuMCg8et5ZJxljsYCuuvtBgmRZCxs874PbaEhIdobDicc5vft0WSUZAbTLI/nuql9DQ\+Gg6LGrrEIp6OeXKd7Bu\+OuNkSl6nPYe8RrOz4YH/JdbkVGqaXpyGiLJ0hX8cOhCYGYM1IsLwa552ImAKLPdfq6vBo\+sk616jOFibZr6t\+TgEAAOCTXePryCIRH3C5Q6xTxzKs3mxmzFYL6/dbL27Jc1671cFpbK71IZfd7tH5rBRwWG1\+1uEbruOKfMBhtnjCxOiIGIZV600GncYaZmw\+g9c3oagrRoPeQFMgZCMfHyK730mMxuLxu/Vhl8XFun1/9z3AQpTjGY1m5FcHw2rUopfjeV0oLKpNanZ4MqvWsUIwfCYaipJaN9KDjWHVGoqGwrwghHnWpDnfVi16w4LATNZYIJ1apyES/r6t/gJKpZOpdPNe35Z2RZVhUd1ji\+Sz5peWpux1RbEU0YmmtYGuyAmRiJr37WsemUeinNWimnPb5lWH1254LTLr1m3/PltJ4wJw/uyqOamWV2JxSre3Hna/1Rmj2XU/\+mrLb31bWqm09PraBWXNe/ZtOrVg67qyxq1/2XsmTSSpfODh9QVNm56JVXz7Ye2JN7a3VlSVzSZSGJbNjr3eFClbJB\+pAKdj778y2gWaiKTKslvXPxKLH3unnki5YL72xJHmvc/et1dSeteDvsdUze2kFWIx6ezqR\+6pZnsivarqR1Y2C39pOCHK5yza/O1bSklsJyJKx8\+cbs9fYH/kjsozR3a0Fq2oe1j5\+jtN733EvX\+6Zd9z9\+8bf9QKqr5tUb7XlDSstHe90lA6O875W3qv5PBnq01z/N5iNRHRUNQb1\+hzeJ5xutmo86OwMMtERCTR277k43uifDLqE/XuLzmYmJuf6TQNOC282q5UE/GUo7HM87lZlkgItlk8eR6fSkNEI1FkdG183O3uJbVUCJy22HqjuiKv70smTc7wHzujKfaFZ0T9Jx1BtduWxwjdXu\+Q1aXSMUOhYIctOMPnVWnYAoujwBiI2kMzHVbiuMGgI\+rVzfOxott6lrWrTZZCDSMndb/ZFg0apMOfIp2JiXo/chARkSiIbr/ondhfmsQ\+j\+mYW6MJeifcCCpGu9z\+HKuPNWlmmOyjuxO9zmPstnkYz8hxG\+6V2h51aN0j9yqnOecxhzjH7y5kiYgpsHkLxHDMautRu2ZRKGZ38gFS2MySkC/m8w\+E1As85gKLvcByfs3JgOssWeca2T6PW\+DtxaMbe3XO16ghPnDK6U\+LBqJoT4gY/QV1RT5FxnkBl4KCbRbvJBdYBO6UzZ4QnbMo3McJhQ6/xsQINuMJm2ZO0DVpmX2Q83YLpnkBj1LwROyC2ucYvjIyNeJgiOtRi0mep2AgLoZTUSYRZMSomDVZ68nXpbPnmYcXxnf7vEJYIBKHWIa4gMAQBbgBm22Gmr8a551SId/HvlBGw4qewJCeiTkdOWoaDHO8I5yJCjk6A2u1zVBf5XMKAAAAn\+qaBmBRFMNeuzNscPrNaiJidFaPT7BY7E6N7fxldzHqd9qd3gCvNjt9XsbvdAl6PbktBlc4qrb5gq6xW2AD/rDOFXCEHW5i1EaLdXh20jF8mBdp3C9aMez3hMTrdAabwxKwe4gYtUbN\+5wOvxglYjzOKEOiEOUZi9v9aXfTim0vPlqW9ej5Cdd9/Q8hn0EQRGbcsF0sw4gC3y3wIjHn739jGEYU\+DNneJHYsakMq2bEsJD8mBcuahvluzWTNRbF813k/sn0cHtf5EiivftBg/TI47/4IDb6hnzOrdv\+/Xra83akl4iGa7kMESU/Pla/94PYLFLOqbDXFcVlqgpp1/glqsoWVMhOu0/0EFHsVCcR0dgYSimxvb0nliLlpTcoeSYhv\+mWFUJank8k\+1Llma4YW6alRFNq0v7PqeSZfnmpouW/fXvz73nqm6xyOKmyZXXfXFyaf3zHq2\+33Hbbrl\+VKU\+11P/27Yb3acW3aza7f7Bmj2\+172T9M883Ge6oIiKSqG65Z2sZNe35y6b596zPf2P1T9OGuxdV3Zxofv\+0fM7CNaYFpbKRVcbfe2fvgVe2nDmtXJWmAZF7\+lmOxEmG17oSjJwVB3gxFeazNef7jqZDvs4gQ4EQ43TKyC9G\+UFic60ujeaybkRUsy6/kufOupwxnb3M75yhiX5sMcRYu8ZtLWCJxHDM5csxm\+J2x6BZPOsXJHr3qSj1BaI5av5jh08xdnOpEDzr083U8zEXz7rdCjWr8Piy7NZY1FVmZoinHI15ltOc9vm6o8LY6rPV\+pkWQ6/DedGovAxj9mgNTO4F3wWiQHqjxGc\+6rdfbwrynnBa5AfCYr/Jn6MxKsbNnmexySweIWpQaRgicSAUztbb89mxBkLCbTvF6Us5k4wPJBgmS6NjTaZ8jW2WzXzKzom8OMh5znLDFWCTysi32/0pA/EOvxhWF7t11\+R8idFzTs\+Q1an0BzN8qNPhEE0e7QXjjX0S/pzDJpAxT0NEjNRgnakJnzI7BMEw0yx02ixJm11lNuZR8LjRkiBNDvFpUTPo4pK8KSWKQ4IwyLA5l/OlJjM6StT8EIkFuijvDjBOyxwnEZHM4WR0I13oP21dohjwxIL8EJHcYC22WLP9gSSrkQ73QWBYRq\+XM0TC1TnvUr2lVG8hMcRb3RK3u1hNxPs\+5NRqu77L4Vc47Cw76TXNa/oZBAAAgGscgMM\+N88Y2IDVoNOoWYZEPizonG6XQSN4x1oxaoPZ5rZ6NFGvzWbhTW6fl/VaLSHWZNSJOs3Yzb\+MzuoJWEkYGV1rbHaNQU/OQFgwjo0VI4R8PkFv1gtjs2pMLp9JFPhw0M8J0aCfrG4H67G4eEEk9Sf/CJv8HmCeZRmRF0ZzqSgIIrFMIatmKCqMhXtREIhYJatmSBibKgq8SCxDhSxLonh\+qigQo2GYyRv/k6bfMenkgFR1m/mFX5nOBzkpo0q11I\+8EJtf3df86vkZlETxUy3u7SMV4HGLYrS3XC8/8VpLLxFJSm\+7Y80tRXKporJURdVfVS5LJ9tPJ8fdrDuRRJ4vibz6Sr30tqrrJEkh1jI8OSU2Pd/UcCJNJLm4C3RyoCcyUKSdxaiKVPKuI7EBImIMq\+5ZIT3ZciadPNMRaS9rfGffjhOzN//7rZXvP7/9pz/bwbIq6on1ppteF1fccsfIEejtj0vnrvimuZpVlVLRUzeliVKRV96OU/EK06KKfHFsvCuV4Y7qA/vcx6hSypTOL5DvOx2bbGemYogPnraYO4WozBWYqxGJUTMGoSfE9YQoz8SOthL6uXAOww6anSVGlsLiEB8dFBm53jC2nMGor83ItV\+iC/R1I\+cwes5hPfnfTYPXLc7Xh87YzGfVzJColvLuqE2Y57aknJbTnFpJ3JAY7RbdNwTFTqs7x2hKhTSzPBYKCxJG6PF7O32\+7qhGbdSIXn\+uyzsyRhSjKXZ75SEiIlJb5vuIBO6jIF/ocbPD\+yGGeKu7z2JReb0XH4dstU5x0ZWwISEqMsaZ5qjIsSRc9DCbcZ/JbLVxhs79cSA606bLFvlEUGBsY\+MhCQm3NeoTJWo2mxiJTkfhUJpnBK\+nmyib1bNuh4IlMo9WJomI6IawhYRQzOmRO2wZp\+lDg3d4gKWrdb5I4Hi7I6F3acziKT9lacwav\+Zju\+1vNrvGPcV7pNVKpy9PCHe4eCLKhL0f2XipxXU94zvlUavd5sGA/1xIx\+gpW2O\+3uOZwfIJn\+uUT1OsF/rCfD4fIp1dNsXvNTF6zukSRDaHIRL53kA0Sy/2BQN9Yw18nkG1\+Xob82nrYhiT/XrT2GJD3X4uzz08Ihp/zm7vYrxqPXOVzjsNRQNnfMEkz/eGuByno5dlGT1DF93BctXOKQAAAEzNNQ3AjN7qsao5u5k3e3w2HUN8wGbxqg1GAwW8Y61EPhwOeb02H8eY3QGvMey0Wv1RRm2x2tVulzdkcU3yANdxWL3FSHYvxxtGHikiCgJrtFl1nCc03ELgPK6oGPX5BKOe9wVEnUawOzSOv6ffGKvWsEIoKojEMkQCH46KaouGZQUN\+UJRgTQsEQnhEM/oNLPmklr0hfnhrC3y4bDA6jXXqQUNw3NhgXRqIhKjXJTUVvV1at0kjT/xAPyTSLW/5V97QQW4bnTAKvZLm5/8mvbUyciAorKc6n/y7F66RAU4X1VVLo0EOmIpIkq3v3WwPv/rG2862XxGVVlUpHznLxtel9Tdlk72XlzOZbR3mX0Ljm955ljVzQy3/cW9Z4bbMIZvP1y3oKjh/eFRoy/oAk2U6mo\+PrvunluIZWOvdsRSpLypav1t6R2/fUf74CIa6ImcStdZLL58pvQ6pvJ/ldRRgar37dX/Y1/7xNXH3vnLuj8whpuK5DffY89/Y9OBnljrR8OPONr72xdbbrpexVasNxF3LMY9/3bTmTRJi0tLi0rZ\+aX5f4tdUf9nIiK1cbbble2yCkQkCMRoZAY1WZ2datv8sYGO\+NC5kG6m2z48AFUyzInhUHdYYEe7\+hNNrQs0o863uctM4UHWqFAH2\+whlcuWIzB5Our1B4aIzXf4b2RZEgUx4BcNGokYShErG523wKAmEjK8yJgsaRLzNHqF0x7zuNv8fG\+AyzGaGVatsNrGFehoiOdiTkf3SBQXUozuwgHQPlE2q8kK2k/xgsSuV1rMrH2kK6za57jogTdsrkkz6OMGbDpZNBjn9arzIxIzUoO9zCR02gMk8oLDyocZicE822khvzXiF1UMkRj\+2O7sZTQ5JKQEjcplk3KeDm\+00Okq4h0RwTTHOhqrrsL5EpMBd9Thy7Z6NHaDVAiO7oH\+Oo9P6rBEzFHNaM/kTMgbNQazSEgLuoufhC1R6yQUHi5RZumsGrs64XF2cGyRTd3t5dUedwFDJIRHD4NaYXXdYGEyQftxv/8sL\+Y7dFP93w\+jmeHyjI6gZku5QjqrLlsM8xZrwuzVWnUjZdKxfbnUusRop8MRJ00OCSkyljp1JIRiTkeCJSJhICTkXs3zTtka0ywLxYI8haMpRsPabQrRm/CL2Rcs5Cp9BgEAAGCKPpPnNYphv8vhcDgcTg/HT/K\+wPM6qycUDToYj9nsJrvfZ9er1WqD1a4Pubwh4ZMXz\+ptVnXQ6QoKRHzQ4/YLBofLdj41i2G/LyjqrVZ1OKRxuB02p4/jvJa/6zZgRm\+16XmvLyQQER/0\+ESDzaxhNCabiQl6AlGRSAj5vCGN1WrQ6Mw2o\+D3BHkiEjivL6q3WfUsa7BZNSGvPyQSiWG/l2NNNqOGmbzx37Gp/xAk8vxc7W3mF371/VdG/3vpyXsMRczYQ1CTvbGGP7y44Zk3uK70cP02fqrFvf3FDX840jKuc7J8TlllfldTqzBS482fveLu\+fL2nvhAf\+REuvKbX61ZoCqViZHzAViiWrBo/RMPb15GXODPq3/8YuOZNLFzax75\+ua64f\+\+uuam848pJqmEBtITC8jpyFvvtC8w1RZ9VP9OZ1I6u6a6LPK8v/5E//C77W/9xfL9n1t\+29Lyzr7V3/35/b94J3JhXpUSkZwk2ttWbn7klgopkXRu7bcf3lW3qFQ6vFMV6\+u\+VlvOEEmUZXdufeKOinySz5q7Iv904ylV9YKCKz3sIhE7NlbTQDg0qNbI1Do58aTTj1XnxKBXVOsZloiIBC7mFViXUfT6\+y6qZX0aRsryZ52uc6M3bWZ4jrca/\+YOMxZroZoGfI6o03Hc6hEF7qyXE8OcyBrOP3JGCPeExXybQ20aDU6sXuVwzXPZlXrDTKdrnss\+4xM\+1AwrVdPAuB7R46VCvnZPQLxgj1h9sZkVo2qG/MeNhvcNhvdNjnjAfcJgeN9gaHUEx98WK9UZcvhQUhAHOH9KZxrX/5lhDMaCkfuc1Upn4MZQQM14TtisJzykcloYhkgUBnhG6XDNc9kYIdwf9HQE2Ou8npls8JQzrHA6RkefujrnK0Ms6w5o7YYLezszmhnugNZpzh2el9HPdPkWcNxNXKDMNekjcMcT\+oMBUWMu1gs9QWItzBmro5snIsoiGhJC59y2VpOVDwk5Rlth1H2OzKpLfK1Nfi6IiGiIF3IMBknQGbFY/mayCAaXZiz90lTWJaZ5VulwzXOYsnk\+LRIx6jyjiTWZWJOJGesLdHXOOxEJCY9b4JlsRi0l/ymHry/KZ1h1zoQOPZ/xZxAAAACu8SBYI/93ZnTm4ScP8QHB4r2wEaMxWa2M3\+swWTnG7PEHzTrBbxXVJjWr1jtdUavVFLK5XFbjJfsqMxqLy\+E3Wy0uj4PxewKM2axnhx9BbA6IAmswqPUGvcHoC1rP37crTHUfLrwHmOi6h/4Q8lmsXh/rchjVQUFjtruHh20mxujyu71Oq84WZg0Wh89v0bNEZPb4GbfDrLFEWZPdGfCZNQwRo3f4fF6nQ6/mSGexe/w2g5qI1JM1FoI2/fLRBxLfP3sXUfm/vxlyG/5ZukanI/u8/9e\+T283Jn7irS1/SLenKHnmmPvp47FehYGIKEdbPl/Vdax5pHgr0d5WVZN/bMtbMe0t6fYDf25ov63qlkXa3mPbz6SpaGTVJGPoxBtrt/8tMvbDVjjZ8MzECvDwdClTWqoYfvru\+FqivIgtLSI5Xb\+inOXeOr3jpx4iolnnm8hnLbRXq1r2NkVSJKeLpeJnupQL7tlsKml\+5nfcLPMK2XH3L7o2rlu5tTrx\+O5Y5ao7KroOr3u/aH1pV8PTR5KP3Vld1sLddqvqRNOWgKLuwTsNJ/ZxwmUcvWFDfHiA0cmGe2UK4XM\+nrGJXQ5Hr87CcI52v3euWZMthjq9Yal9tIDmdIkmp8aqjocsp3yGseLbVLpAD/HBjyz2AYv3BotGwnNElKOzzA\+oT1ltrWGHxmXo5XiZzaHQcNkmu0YM8o5grtMrYwIjxyjkOR0wl7ku4wk62WqDyuEaG9dK9Nnaw/xMA3vREsQU5\+10awospgkPsOWDMZ\+Qb9b0uP1ZevN1FgurCZ1yRotHC3ET1qWzlQeJxFC7j2fs\+kvdSZvNssRHiWWSXj/pbTk0yd39EqPjBgulOE/UGRjS0Dm7I9fnLtYwV\+l8MYzJdunvDTZv7NIhq5thGb79WFNo0RDRxd13R3ZKY5phUufw/i53NNfmmKULxDxhldtZqCbixVTIe9IcnelyawM6CYnJgEfg1VI1l4hamEkuWFziXBCRKKRERqpRDwX8vSEm18AmXZbWkFXtsM/Qq7OJSLzcdZGEaJLBva7SeR8K\+85wGpVH1xdi8q1Oudt71s\+T3pzDCOfbXL3PIAAAAEzRtR8\+g9Xb3S5muCuX2uBwa1iWxCjPiyO/\+wTOZTK5BIPF5gp6TTqWSIwGfVG12cASEau3\+fxqp9PPmQzmsf5gF/0OY3RWr0\+0mi1mkViDhRgihtWbHXa7MewOaBwOo5qI6PyoVSQKUV4kzacESNbkiWY8l3pTZ3b5za4LN0VttHmCtgtmYjQmh8/kuPjgWN0Bq/vCRVzcmDV\+wob8I5OyKx6rsd\+kmCwWjurt2PHsu/J8Vc03v145oKgsoggR9XY2Dz\+EKCW0nGC1pYxcRpRKtuz13rN3ZD552a0bH2S5Z/7cJCgqiYh6uAMthnVfbQm0RFJE0pEsGnv/7S3vj1\+fRM7OrX3k64be0eceLSiSHyAipmLZSvtN/U2/iBFbUHodI6d0kqTKsju2/UglfyewQahY/59rKwIvrnv6SDtJ5GyRSpomGWtYedsaQ1Fkb4O7tWj9z\+uqZbGmPfsmFIEHYg3PvL2m7o6m7b/be4oqbpbQQDp\+4u11P\+kyFHVlZl2/YtZp92/fjrAridLJM3/b9JPTVd\+sWV92YtPWv0UESX1rzca6L2/ZfpATPuUxxROJvYFgjsnFsCSS0OdxxEOCjPExdu8Co4Z47ozTcVJwztYH4rxGpebPuV0xH5dj9WhsegkR63QkLNbjonuezSAlMUttnuf3jNxtO95oF\+hkwBV1\+HNsXq3NICEae/ZMttp4vd/P2K3RH2RKbE7WqGdM\+lTQFbEH813eEgObLepkgvOEwUuiyDjsxIeFQEAUNVliqNPt6\+WJRL43xPU6Hb0sEasptFjZkY\+1ONIFemSrxMFwaNB00RYSETF5ZnuxQLnjt18Mf\+xwpSyeMqtOIoQFv1/w2D4OhQeibWd3fZ8Kr5PozHN2fZ9\+/u9nQsKFt4k6R59SQwxj88y36rKJhkgc8Nved/nSjF5pd\+qiBuI8J636k7ym6JcbSAiddTp6Gb43KkqjwZjL1eEXZ/j81xuo22WOWhwSvyvnqp2vKyWKGZGyJyb2IaIcnUmlF5Mhq9oeFHyumME5zzcaX9UGtTdYatBLhGiv333W7ellrXMDnEIMfOQw/401FtlsxRNKwZOdCyIi/pzNGPULOWpdntW1wGfOY4nEqOBxtJuMcW9wvkn96et69M60EOp2OnopLApGIiJGnW80FqppSIymfEz6Kp73b/9P5Rt\+qcPLavg\+ImL1xTZdxC7MsGskFBo7oFfvMwgAAABTlXUufnm3Dx4/9sGSJUs\+vZ0QtJtdGrffrr8wY0a9Zv2jAc2/\+fzu4UgrCgKxo9lUCHmsVi9r93isF8050sBt9zB2t22St4Wwz\+UKauwu2yd2Gub9FsP9fqqyuTyui3pCr1\+/fsuWLZ\+\+gzDRpMdN8/X/vDpLZ7\+0ed2dLdufre8t27jutpbtvoZT6fHvbv2vh1cIBx//8T5uwp\+zRMlKkrKyjT/6WuWpNzY9/U5y2dfrZh3Z9MwH7SmSz7l127qyvT99frTS\+6kkpZW3VuefqH\+9S/vIw9tuo8Zn/Nvbi6puma3sOrH3rY9iKYlqwZcMstON7/eUrrS\+8H9fHz/w4uNPH6ciaj8hxCddpLRgxWM11cf/vG5fZ5KIpGzNurrN5TH31mdHnxU8uuq7Htz1zaLmPS9uerW/qu5he9GRDf/92kjVV8qu\+ObXVrS/suHV0586FnT0xZ9MbWfPGxIEYkkMcoMao2L8JSMhFPN4RZ19jnmyp8hesBA\+1CfqCjQMESV91mPOaL7DPXfs1tZPeZ7quOVEA2d84RyjVfXJIwMQEQliWMjRaaaSDZIBdxdrVX/6Mq\+UyCe4qFSvySJWzk4MkAI/KIY7rJ58r6\+YDbVbXBkD0xvSqV32kSQvhmMOb47dOePTrteNLvByzpcYFXwhmdl8vqv5JaSC9vDy/x56aOeXvOO6Q4vhcwFBYTbk8MEOp58MJtZkLJikr47Y53fzAVJYLEXGsYctiUmOG9AYFBPbX/a5EMUhhhn3F3jpdalzux3bGbe3mPzH7dFZbqNgczMeb7E6GjMbO8ih9dkuusv3ioliKJqjET\+22no1jnlOfY/D3mv2XG9SZwvBNqu/0OOe8MytT3RVPoMAAAD/lA4fPjx/wcLLmuWaBeB/WAjAV\+baBmAYR57P0ICYnKTv5qe7ggAMAAAAAPDFdAUBGE8QBPgHk\+zF0DcAAAAAAFcC3aYAAAAAAABgWkAF\+EJbtmxZv379570V/3jQbxwAAAAAAL7gEIAngSwHAAAAAADwzwddoAEAAAAAAGBaQAAGAAAAAACAaQFdoOEawkN3AAAAAADgiwMVYAAAAAAAAJgWEIABAAAAAABgWkAABgAAAAAAgGkBARgAAAAAAACmBQRgAAAAAAAAmBYQgAEAAAAAAGBaQAAGAAAAAACAaQEBGAAAAAAAAKYFBGAAAAAAAACYFhCAAQAAAAAAYFpAAAYAAAAAAIBpQXIF8xw\+fPiqbwcAAAAAAADANZV1Lt77eW8DAAAAAAAAwDWHLtAAAAAAAAAwLSAAAwAAAAAAwLSAAAwAAAAAAADTAgIwAAAAAAAATAsIwAAAAAAAADAtIAADAAAAAADAtIAADAAAAAAAANMCAjAAAAAAAABMCwjAAAAAAAAAMC0gAAMAAAAAAMC0gAAMAAAAAAAA04Lkcmc4fuyDa7EdAAAAAAAAAJdl/oKFl9X\+sgMwES1ZsuQK5gIAAAAAAAC4Wg4fPny5s6ALNAAAAAAAAEwLCMAAAAAAAAAwLSAAAwAAAAAAwLSAAAwAAAAAAADTAgIwAAAAAAAATAsIwAAAAAAAADAtIAADAAAAAADAtIAADAAAAAAAANMCAjAAAAAAAABMCwjAAAAAAAAAMC0gAAMAAAAAAMC0gAAMAAAAAAAA0wICMAAAAAAAAEwLCMAAAAAAAAAwLSAAAwAAAAAAwLSAAAwAAAAAAADTAgIwAAAAAAAATAsIwAAAAAAAADAtIAADAAAAAADAtIAADAAAAAAAANMCAjAAAAAAAABMCwjAAAAAAAAAMC0gAAMAAAAAAMC0gAAMAAAAAAAA0wICMAAAAAAAAEwLCMAAAAAAAAAwLXxBA7DIc0EuKl7iTUGc8Eq4RDsiUfiENy9YYTgUFSZ5Q\+D5ySYDAAAAAADAP5jPMgAL0VDwPC48kk0Fzm2z2uwOh8PhcLg8gahIAueyO7zhSbOrwDlNeoufH3kVdJgMVt/kWZkP2Ey20ZZEYshlMrlCE5sKQZvB6AqGfHarixOIRD4UDPg8DpvFZNCpmawivc0/6YaIYY9RY3RPvpEAAAAAAADwRXMNA7AYchlYVqM36HVqVmPxh0Jum83p9QcCgYDPbbM6AgIREbEGu8frcbucNn3U7wlEBTHsd/veCgccJoPBYDAYjBY3J4wtlQ\+HRb3ZoCYiEkJep/etKOeyGC9uSUTEMAwz9kLgoyKjZugCDDPciiGGSIz6HTZnUNSbbU5vIMT3Z3i/VccQEfEBu8XmGwu8ohAWWZ3u4uV98kEJ\+\+wGNisrS2MN8J/eHAAAAAAAAK4WyTVdOqOzePweI\+82W0Mjrx0um44h3h81\+8aaiVGf3e7j\+VBY7wqYRY/F/qJw3dc9Pp9VzdlN1qjRpGdH2wqhoGgwii6ry2TXB2zOJnHxv3sCbhMTdJisoeGWQtDt8IYZlqKhcFhw2jlG5Bmj3cxHSWO5KLFelGDVBovVYmQvnMzq9BSw2zy6gF3PkCiEo6LGrLuM/CtG/Xaz5dfvJqc\+CwAAAAAAAFwt1zYAkxANcUESwuOLnSIfCgY5gc7XZhm1wcA4bLzB5zOJAaufde73iy6Hw8kzgYDaOVqCJSIx5PNGNTYbeT0Br8MX1rnfdITsdovVwITCerdvuCVrtHuMRMQHbGGfyek2q4lIDLvNYYHxuRwBIpEP8zq7x2FkiUSBc1ktFG0Vo2ZyOHRilPM4HYGRVbIak9VqVDNEjMbq9nAmu8tv9lk0PBcIRUNRi9EzsmViNPwua9vPuY2sGPWYDS61h/Oa1eMPRigQVtv\+4NL7LI\+\+eK2OOAAAAAAAAEzuGgfgSQlhvy\+ss7tMaiISQx6r3RsVRWLanrMaAiIZvZzdqOYFg/f\+H/Ff38lZxsVfj925L2qxEzGMxuJxmzQsRQNGtXfLru7yr/\+cHbcGr5fjiViDmnM7OFLrjeqgn\+wel0EU1Hp10G4L6XXD7RnW4HD77XqGiEgMe3ysWkOhQMjodOh5nysQMluNIzlWbXIHOZFIFKNBf1jnCvhMUa\+PN9qsOt5rsfhMNgM7vESrw8HoxrZnbO6AmWF4n\+/yuk0DAAAAAADAVXCNB8FiNXqD0ajXjQRIMey1m83OIKPTiH6nM8ATMXqbL8hxPoeBLVxsMhuNZjPLuSwGvS2kX/9Ti\+CymO0ef4gXSQg6be6oupwdWZYQDXptRp3eGtTYtu/cbma85jJWY7C4OYFlmfEDbnFhkSWBtTitmqjX7QsLpLO6HCb1JTfaYNSrWbXOoNcQo9aw4/Iqw0R9Dpff53KHdFaThhHCAT/HiyIf5hiTYzSrs3qL3XZx9\+jxNyQDAAAAAADAZ\+uzrQAzGoORDYWNDqchYLVwY9P5gMsV4Emnt7oNfqvdo7E4vKaQXzC6ArZowOsNBDi9zmx0\+PzmoMsxPJ8Y5oICa/WGLHrBY7GHHf6Q0x3muDCrYUltcgdMF6zcRER8gERRZDQG4/nposC5LAYfy\+qsbo\+VEYmI1ehYngtHNcEw6WzsuIWI4SBHRG4/Y/WbNAyFRHF4x8wen/nqHzAAAAAAAAC4Wq5tABbDPpspxIrRqGi0ERGRWq1hgtEoz4Z4tV7DEhERH3A6OZ3Dpg4SqQ02u4kP8Jw/GPDzUYbXMMTqrTazhiFiNHr1uBuHWQr5PY6gRxSi4agYNXIsQ6Q2ugymsN/j5XgShXCYHx6pmdWZbVYDS6LIh7ioYFazYxvJsAaH22cMWuxhQRRZkUjNqA1G1uN181FR79Ew43coGGJNDpvFRHoDS8RHw9FwKBQVTZc5GjQAAAAAAAB8xj7bUaCJGI3JSE6POxQig1XDEBEfcDk5ndNnitqDIhGjMbu8ZhKC9lDU5HDZNZzd7A6ZLQb2goTJaMzugE0Ic2GROIeTd7gtLKPTD8dVs92hC4Z4nnf6dDq1Wm\+xGtREJPLRqMCH/SHBcH6U5wkP8hX5qMAa1KzGZNG4vhnQ/Nx5fgBqIiEU4BijRadT64iIiOf8nECC3x\+yGQwsAQAAAAAAwBfXtXwOsMCLF9/2yurNFjbgCaotZh1DJIZ9bk7ncJo0E1rxnI8jvUEzeVlVHEmtIh90Wq2uYFQkUQx7HWazzRcViYiEkMdm94QEIhKiQZfF6gmLRGI4GFTbHIaonxsblloUBJEdqwcL4WCINDqWhDAX5olRs\+y49QohX5AxGkbvHRaCbndI5/I51UG3PypObOj2\+MMTojWREPK5HA6H0xf6mIjnPE6Hw\+UN4mnAAAAAAAAAn4lrF4DFaCgksLqLugYLfJgXSeS5UFQkYnR2f8BjmZh0\+YDLGdTYbJcqqjIMq9OphaDTag1onC6rjiGG0ds9bkPIbnEEeTHkc/pYm8OsYYjR27xeOxvwh/iw3x1QWywWqyHqco4m5XAwzGhGx7niA54AYzRTwG6y\+NTOnXbBZXUG\+NEdCniCjHFkowTObbH61XaX1WSxG6Muu/d83hUFzuty\+cPCxAMihLyuLVu2/PrFNiJKtr746y1bfuTmohfEZAAAAAAAALgmrlUAFjiPw83rrSYNCTwfFYiIRBKjfrvZGjT4QkE7uUwGiyckEMMyRCQIUZEYRogGPVaTNaBzucwaked5nhdEGn8XLhGR2uxyGcN\+wewLuvUCx4UEkWVYjdnt81j1DEXDUY3DZdUzJBIRwxrsPq857LC6GZvDpGH1Nqc56rK5g4IYDXqDpDfpWCISw36H47koH7Aav\+ljHT6fw\+rwunUBi95oD0RFIeRxBVmjXs2I0YDbYjB7WIfPY9UxxBodLrPgNJkcI3VgRmML8NGJDwEmYjTWgJC5QMhhwM3DAAAAAAAAn4VrdQ8ww2rMLq/FohE5h9nsZWw\+g86gd7u5KOlNJh1L5OWMXIh0LBFFvWb9oy\+yX9/uVwtBt1\+weAN2k4YRQz6z4fsh3b/5nKMVYpEYlmUZIlKbXD4TkRhy2cxO0exx6Bgi0pltOiIyuNxi2GM2ecniNLAkBB0ma0Dj9HrMGoaIGL3d6xYdvkDUZbA6nJqRoi6rMRgtaiHE29xum1E9vBZPIGDwCzo1w6ptHp9ZreEDDquTN7iCHvPYg35Zo8sf0DlsNqOZ9/ttemRaAAAAAACAL5ysc/Hey5rh\+LEPlixZco225poRBZG5cBSta7IagdjPYD0AAAAAAADT3eHDh\+cvWHhZs3y2zwH\+3HwW6ZeImAljZgEAAAAAAMAXyDUcBRoAAAAAAADgiwMBGAAAAAAAAKYFBGAAAAAAAACYFhCAAQAAAAAAYFpAAAYAAAAAAIBpAQEYAAAAAAAApgUEYAAAAAAAAJgWEIABAAAAAABgWkAABgAAAAAAgGkBARgAAAAAAACmBQRgAAAAAAAAmBYQgAEAAAAAAGBaQAAGAAAAAACAaQEBGAAAAAAAAKYFBGAAAAAAAACYFhCAAQAAAAAAYFr4AgVgkQ9xUXHCFEG4dOtowOvl\+Cktmee8vik2BQAAAAAAgH9S1zIAC0GX2TA5k90/MesSCZzbajKYPaGR6WLIYzaYHEFh8oUzLMt77Q7/FHKtyIcCTqvdF/17dgYAAAAAAAD\+sUmu4bJFIcSr7T6/RTNxOh\+wmd38BfmXWKPT546anQ6v0W/T8H67zcPYPA4je4mls3qLVW0JhHizSX3Rm0LQbjT7RI2GZUZas\+S2GNyjGxbl1c5gwKZjrnzvAAAAAAAA4B/KtQzAUyIEXVanfywOs2ryWo1eEkWRGMZnN/mGpzM6m8djFr02u3esdCzy4Xd5zsiNpVxiNFa316ZniIhhjU6Pz8qEOFFn1LE03BE6qrda9KwQtJvdn\+E\+AgAAAAAAwOfvcw/ArNHhDzo\+oYEQDvGsTqdmiIRgOCrorC7rcOVWCLntzqjR7rRoGCISw16HJyyIRAyxepvHxbBRr9Xi1niCHpOaRJHnvDab2\+v0eqx2t4vRMEREYtRjNrjUHs5rvriQDAAAAAAAAP80rnEA5oMOs8F9QUdjkQ/zGv34CVGv2WAPq3VqhkQhGmXtwYCNjfKMTqcWgk6b13y\+HzWrMxiNeoaIxBDH893RqKgzGDUMkchyrHf0lmBWoxMDdrOTN3s9upDdYAtqHF4PFzK7bTazkXP6vPbhrWJYg9XhYHTsNT0OAAAAAAAA8Hm7xgFYbXRd4h7gCxoyOovH7zGxJHIuk5NEgXPZ3Hqv38YSwzA0yb26Auf1i6aH9GGvJ2RxGdgL33VZbAGNy\+/UR53mgNpm1/htVtHtdQRCJp8nKIgiDS\+V1Vvs\+qu0uwAAAAAAAPCF9bl3gR4hhn02Y2isAkzEMMwnjVAlhv3uIGv1ug0\+s9Xps/ptugnvswa7P2RnGd5vd3A6p89u0dgMHpvNbLU6nVaHHaNfAQAAAAAATDNfiC7QdFEF\+FMInNvmjBo8Vr2aVTuNJpvda/RbLlgi8T67zRnSu3xus4YhYvQ2r1/nttn0TtIbTWaL1WrWs3/X7gEAAAAAAMA/jC9KF2iR57xOR5Ahked40fRJyxRCXpvFJZh9ThNLRGqT02U2WS121smOtfDY7S5fk6C\+TuSjTjPnGo3gohCNktntMvLB0EUPYgIAAAAAAIB/Yl\+ULtCM2mB1uoYrwCEnEYkiTRpQxZDXwYUNbq9r7PG/apPL53F7w1FBHLmtV2Mw29w2r150W916r8\+qGQvAYbfZxmuMVqt5dIFCyOflGJPVjIcCw//X3v3GNnLeeYL/zcIePoITsxrYdrGTTle3g2E5RpZMHIA0dlelIIEo386RyiFNdQYRtblEFGIc2ZtDk87OiMzMDqm9GZONzTaJ9UHkDmZJBUmrOrfT5OUwom4GEbV3sOrg2CQCj4uLuF2yE7PSg3HRk0Y/jP3iXpD6/7fbbsttfT8vgjRVf56q56ly/er31PMAAAAAAMBH2YelC/R27OxXvvENwcF2RMHsc9/\+0V9\+zrH1A2H22Ff\+7Z/xl/7sr3/UGwVa\+NxXvvY5IuunB5eQW8//5Z/9mePsV77yGKZBAgAAAAAA\+Ai7512g/\+RHf/WNs1t/3NkFmq//r9W2XuP0GBMee\+objxERf6nd5hvRLiciJuwcHst65fmXXnvpJYvObvuT9dM/eerJ/13Y3AWabflYmJ399l\+3v303xwYAAAAAAAD3k3sZAHPOOaf1\+Yb2xpjw2GOPCYz4a3/17W//9LE/\+c5jjIisn37nqW/8VHjq23/yZD85y3qL7dxT\+6d/8tTTC47R5/7t5gl9OefsyX/7o7/69mNbu0C/D8cGAAAAAAAA95nf\+Ye3b93RCq\+2/u4LX/jCPSoNAAAAAAAAwGG88MILjzo/c0er/JN7VBQAAAAAAACADxUEwAAAAAAAAHAsIAAGAAAAAACAYwEBMAAAAAAAABwLCIABAAAAAADgWEAADAAAAAAAAMcCAmAAAAAAAAA4FhAAAwAAAAAAwLGAABgAAAAAAACOBQTAAAAAAAAAcCwgAAYAAAAAAIBjAQEwAAAAAAAAHAsIgAEAAAAAAOBYQAAMAAAAAAAAxwICYAAAAAAAADgWEAADAAAAAADAsfDAPdruq6\+\+eo\+2DAAAAAAAAB9tjz766L3Y7L0KgInoE5/4xL3bOAAAAAAAAHwk/epXv7pHW0YXaAAAAAAAADgWEAADAAAAAADAsYAAGAAAAAAAAI4FBMAAAAAAAABwLCAABgAAAAAAgGMBATAAAAAAAAAcCwiAAQAAAAAA4FhAAAwAAAAAAADHAgLgjz7O\+e6/67VCeaX9AZdmC8toNIxe6bjVblu7F/SucWOl3mjvcfTWlr3xffbNLev9Ltn9hjcK0WhZf1/PAjcquax6pw2QG7VyuW68byU5oquDt/WGvkfT3Fhoe7s71FpwN3ZrB9yoldUVa4812vVsNFe3iLhRSUQLjb2WAwAAgA\+Z\+yMA5isJ78DAwMDAgDCUbez2/GeUA7I7Wrc\+6JJ9YIxKPDDU43WfFYSzbm//n0NjiXp727LRQFTtxwiGGh4Zy\+32dMaNarGsdXqLWSuJobPyxkaHhnzhQoMTkaGG5P7evPJZd7RmrCS8Z2Wvt1cUOVDeHo1Y9UQgkKi1iYg3skPecK3N241dIlGrmb8Y7z05cr14YWSqahx8Jix9pb5hxegfWbuWjYbj8UQikUgksoV6m1O7lr6YXtw9VmrXkyND8bUG065ER4aitV3DHW6Up0aT2voJtOpx39j7HAu\+L7heyRVqa4fLjXJ4LLHLFdFWQ7JDXqtor\+wYWG9MXtlxdqy8Wx1wbui6vh6OtVfK5fU9bd3gdl7ZcXZTE7Hq2TFf/0\+Bi88kJ0aGNtb0RdX\+eW1Xwl5f/1LfGppwY7FYrG1rS/fT1dHburmYnEoumrv8aVNJq1Ne75ZWaS6mp5KL5j1oe1wv\+ITePdYd3/U\+2q6EZTlUOdIXZvcKN9Sw1z2W6wW77Xqhdx1xo1pUmx1OVj0bipZ7P6nRfvsdDaeLM\+GRoaGhQDxfTE6MbG0ZAAAA8GH1wNHslhuVZDRZXmx17Gc8/sSVTMgt7LM486ZXbqf5SnbkQnX3JWyiy\+OR7Oy9FqtWSGeLVa3FBZcyPBycjIW8/YJxvRAYybtLSxllv6LeA9yoldW6YXMNDhIRUdcgk9s8ike09ZeozRUoGFKk3uG3NVXjnkmx9y/JHxtXp5JFZT7m3nZ6GLHNv9g9sdlSWN5\+Dm02QQ7mShlFIEMNRxvMRoI4mMgVQhKz6omJMrNtXcXSq4s6i8iO/vrEqKNdngrr45X56NbN22w2EogRkdVqWKLHKe44eqseHxlTuSQxbhgUnJ8fLE8lTcXnstu6nWatLmWWcj6ByOGL5XxExPXCWCBvuoP\+RiVfbTa1i6NVRkRkc03mMqH\+/rnZ1Jkn4RJ6u7g8ozYNKXlhaIaIyOaczORCG2eL2TYfYcdsd\+2D77WpEZHVKCeTxZqmrXbsw7MrlZD0njbHjfrcNW08GF77NzfNzu6LOpREab63u3YteqHo6td7Ww1dqGw6sHYtPjWjdYiIW0azRVMjywIj4pahm1J4ftgn9evYMZwulYO7lr9dCV\+Y2/inoMTmaxG9MBFtTi4s\+RxERLyRG5vSQvObt8AYkY2I\+Eo2MKUF5zc3TJttY3v33dWxvnEb2Xb5wyaGpuoO/yWPY9PeGDEb0aHaXruevRjP15omiS7/pSu56NqdbFdMDtesMNcLYyPFPZYQZY\+HhPd6i23XyzPZfLXesgSnZ9AXDF8KKY7\+RttqaChBmaVywLH/Vt5vTApmMtqFiQsTdL0UFnlrbipfT81nJGYj4taKmq0Kk1clRkRSMFcLEhGRoYbD9WAp53MY5VC4GZ7PKAI3yuGw3uGHrCMAAAA4CkcSAFsr\+YmJQtsXuZKQO5V8NjrBpIWc8l4eehy\+dNn3nouVnpiYswUvZSKyJJCl11tmh7/nR773jBuLao3CMX//oZ3rRn1VUIZ90lowV80Wqp5g7xGf69XyqjOcYNWoL9/sEvW68OpTI7040O65lMt4jMTFvMF1vamnw8tMmc4EiTq6mk0aoo2Iuh2TXJPTYa9AxKThYa2WTdSIiGS/IjEH\+d21QjpBRETDPufWE9SuF\+vkSw33gxkbMWKiMp0JjoajBaUSdTOuq/mqzR8JbIS7VktrMSkk7nqumTx\+5Xpa1hOjz3SJiARXKJYJSsSNgtFsbpynRiE6U\+8Yy6ZvNufRL48ll7lzPHU9F\+jWwoEkV5T18IUbWoN5fHoy3AhGHOVoockGU7PzMS\+vREeTlk\+RGVG7lp2pmoxxvdkyCzOJKnW46J/0aKZNloS7rs4N3CJpMKK45rLq\+7AxvVY1XSGmhnzXVru9KLXF9ZFmL7oQ/anZ2J2\+unH4MpXeVWWtJMaSQqoSc5tqNBBu\+3Ozqbu/YJnsn3TPJZMVOReQSFdn5mh81r8tfu7VFfOORxQ1Hs275mMbEZywEV/cH1eHVQt7R\+dWt52Ha49dm9r0T5vn2aWFaD8Q541K2XBNZna\+GTzM/YjrhamxZNMVyZRcvF68/MxE1FHb4xXFIQneWNn7HtYnIuKNwsTE5e5wJFVwSSKzDE0zTKIPONzdlcOXub503rC7BUa\+TGmW4mq95SeiTnOuqPuv5PpBOdcLY2Nzdt\+go7282CK6nKhTp9m7Q9RsROQOrjU9AAAA\+HA6igDYas6VG1JofjbtE4j8ThoazReWY0pQslYSIxcWnX5ptVbXTObyT1/JhfdNXBC11bHPTVQ7RHRmcmElt/6M366FR6ZanmF7c7HetMTBUCKTWsszc6OWjyfztaZJZzyhxJVUyC0Q16uLujR\+PbWWKlH6ETVv5EaGntG6RETLI6fyRGQbvLJS6aWDrJVC/JlsVVvlossfyWQia/kM3siOjKqeK9Ni9XJB1Va7zsnrCzmfY/e974\+JZ8ioqi1iROLgoGS3mc1yurjaJbJ7IjGXyPR\+Wdu1bLHjyQzLsrCWqdiFobUMGpz0rHLZJ9WKrQ6RjexyMJbameMS3IEQdYtqwyIiy6gXsvWNP4qKz7\+l9FZjLq9JkfmN6IgRIyLBFbwUk6jTMCyv3WrUajQ4uREAW81qrdk0oqNNgRvNFp1xuTzjmcJ6MGBoWt00DM7Xt8q50ajXm9amNB2TPS4\+k\+TByrSnPTehOXML0830TDyvdcuaJ1XZePy3tLJquhJOns0vFuLGqq\+04KrGpyZ0D28aw7lSUGK0kVM2ym29GZ5OKwIRWSuJGaN7Zi6dUKnbMQzumc5E966/Xk4rvVQO9kpu1aNDE3pkoRKWmeCN5rxEbXU5X33PfSat\+tw17n/W7/MGfVGi3oP6VDN2PbdL1Nuup8eGioyIiLf1plkdG5oTGBFv66Z7v/dIRi09FdfkzHwutL2d8EYhFJ9b7W750e6JTHvWi9jIRePX\+ktwy9CNi4HmZcaNZss6Y1wcudZbzHZmPJPzb2zDEZhOLY5EZ1T//M7GSUT3xdUh\+Ar67cLmfaihsUpgfq\+YlOvqTNFUMh4jHwpX188qbzeapjY2lGd2z/RsxrdX5Mgb1aLGzudKmaCDyO9hxlCyUNP9YZn0XGCkKPhdVn1Ra5Hkj\+WurN\+y9rARvYvnrz6/kZ7d73ZtrZSTyayqtThz\+SZTmYRPYsSNerVp95cyMV9vKVIC/dNRDninFnsdFi6cu0ZE5Eo9v9RLy1sNdSaeLi\+3uOhUxlO5RGAtwjTKgaGsmEp5tHxeXW51zpwv1cpBiXi7Xogn84u9u/KlTCa6z9sarpej0aorNRv19gpvrWTjWc3savG43jSZaUgCuzjWjOQyQYkx1rvjdHmnze1uZiPa2uYto6aqNB56Ty90AQAA4B46ggCYG42mKcgeWSAiIia5XHZL09pW71nQampmMFfJSIYan0omy55KdHvnxC0cwfl2kIxywJfdsSezofFMbiEn6vmpqeSMRymFJEaGGvbFV33TpRW/xDV1JjkxRfOlkCRIdjKbTYN7tyZ9mTu6ZEV37QLN9fLEhaQ5nFkoDVPj8sWpsQt0/fpGqspqlpPFycSztYxkaYuGyGivve/\+aN8/Q/5Q0OaSPKLcJbKJUrdMTB6OhPxdIiK7JJEtJEmMiOvqxYtzhuuKyIjIqiemkstbPjO0OSdzO2OX9YNZz3ERkegJhQL9Ouo0K3UKl9KKQLyRG0t2U/MxN6N2JTyxaIR8mxKranwi3RRTTquWS2irHdPQ63XNbHorRGR3SNIZYzLhVoi2JfHqBbVF9uHE/LzfSI7EKbNwYEdzbjVV1fJMpz0CEVkr2alk1exyG7UKE0\+WLZt/fimkCHpIHZm6bBu/uhTYCH9Xssm8xiNEREwOFUqKJHC9qwjh/By5xoO2jQXLxapuEUkeWy2bqAmixyOoy2cSVxLODpdcpE7NdD37JoMdg0EPxSvLRjAoEZHVVOsdZ0Q5RIqIrySGvnjZ2vJSZ0/t2kyy3HaVZMYb2ZHRvCVKjK9lgMkyTCm1ML9W7zYmuAKxfsrU0rLJqhSbDkqMuFnLZo21LSamZpbXu1Bzy2i2\+MRIZ9W0nXHNXRydIyKyuyK5TP98MXe4XAvTDu1Krf//BHe0XIseeOD93W/6h0OZnJTG5sqNYHrn27D75\+ogIstYaRpdIuKmZlqmptVEgxHZ7E63eyMI5Y3yxNhUddWVsktKrFyLbZwWNXShEtirt/kGs6UZJI07ewVkosslcVUzrLAsEJHVquv\+2dKKm9cSE8l4fnBhl/O6SS96b1fCQ/FdPuPf5XZtrWTHLhTYeOZ6wSMY1XwyOpEuXE8rgt0hMLPZ1C3fth1KoUo7tHsXaKMSHQtrnsz8K35Rn4tPTQS68wsbsT9vVdN5lkhUpp28tdy02YisWnJ0qua8lFsoyUyvpJPhCZrf\+z8jTA7GQrWxC6Ors6VpRRIYN3VLjFxde2lFvQ4QM/3vzqXQfCOol8MTdV9pIedz0JZXZJZer2aTZW04eMBbBQAAADgyRxEA81WLk9O\+FmcwuyAQt8z\+d1PMGYhM\+mSB5PHQYCHRNCxy3\+27dLs7FAspMiNpctyjFpsGJ4n0WnmZ\+WdTYUUgokBkulUdLdeMYFT2J2LqxMUnT8x4/MHxycmgr/\+Eu/ehGPWyZhvOJUJuiUianl6sTahVfdK7/nhnc02mEkE3I5J8ITcR19Xd9y7vHQEzSQlK68/rdk8kRN2Ovpivaavdtaf2ICOul6MTSV10reVVBSU9v3T4kyWw3XNcRGRjZC73uvh1TU3Xu/mkJdq6nVazK4U2ToYaDYRVkwkiEWMO2S07nRLz0MX6\+NUtj7TWypatd5tqXhPPj4sdvW0pZptEZVtXaCZ5PIpsr11mXSIiq1mIj5VtkuxymOVEnuViiuCNzddiXC\+MjSQdw367yXy0nBhLFxtiMJXi1eTomBaZDA4r7m4teVG1pLWwlXeMej59OV9tO4OJK5O2VjU/ci4pDQZjmUzQwQxtubmW4LGdOa84Lfdkwi804zPG5BW/OzLtOqCDgsMT9FC8orWDkoOspqp1XJOHiX/vANfL8Zk6ib3XNswuuiLPzsfcxloGmOrxsTLb/EErE1wen9L7Bpirguby9LqHt81y3ugt5/ClKxu54F4OriZMXl\+Kerdfje1\+MXgjPzKStySpn0y2PLlaObjzQ1ejHBorkjIobfpT19RqZnB\+jxwvc4dyBQ9bS7R3N3cDvk\+uDiIisvTK5WiyagguWWLMQVp\+ps4NvWkPXV/K9eMlayU3cSHZlPyDzCIionYlHl8ezuyd7t2JW5bJyS6svchjTLSzbsfst2R2ZjgSCbgdRMGwLx9utjrb3/kd3m63a9acK7ecsYVEQGZEUng6Uh9Kq1pM8TmGp6eVsYtfPJV3DfvHJydDgQM7v7Q1dbnjmU6EFImRNDk9ro6q1ea0z7G2ok0KJFIhRSAiR1AmonalXLEG05moz0FEUjhhLAaKaiPs9u51jEwOFRZcDZPXkmlpOuHapzjcatSL2Xj6WksYHF/MJ\+pE1N3oAt01m/UWG74U3OeFJgAAAByxIxoEax9MPNMfYIjZBUZmp3vACvtsiolrUQETmI1bnBOR2TLM1uLoqc1jvbg8FidyKLHaa5NGQ6svqmp8ZGYmeKWUCuwTrXCzZZLDtzZ0E5NcEtWMTYO0Msnt3rI\+33vvBz0xCWQj6lKnno42Dburv4JNUjxrexA9kVJErMb727ZWcslii4nrrxq6HZOUWGr7w1m3XS8kOWlN3Z6eqHbtsnP9S0dPLBWSGXWJiYOh6X6OSze7kVQ/xzW1vLYVq1GrdJRcxVOLq0yQfV537\+eORGrL5LRXPqTbKKe1ji\+XC9bj\+aZhGCaT5d2/BV4/E7LHSVo3OJ2wl8fi5trhcUNNZ\+sWUzyTGbE4lSy7xlOl4eUq8\+cWxhtV9dpiXXK5Fd90SQpWk2mrVz6jtmjIkaspv9xKj2XFzHwjZTXqmilJjAnBnR1lfURkNDm3ukxWlP2K2dOPgJfbwSBrVuuW61D537WB3w6xoNWoaY5IJlBLa73TsGMJvtuPh2TptWIynqy2yCY65WvPXLhGtHeu1O4aT82nFaGfq9x9kzY7s59xDfo2xz5cNxv1LUH6lgNom1xy93bXMQ0uuHbEax/yq6NfSG90vuIIT6jKbL/PB9fLE2Nlz7hn/Vwwh9t/qZDy2YtTvS4tguzqxqMXXbXSnY\+StvtthQmOtQvMZhe63LKI7vbr4F1u17xjGKa5fPFzJy5uLGf3mx0iQXCH5/VQW9eWq6o6M3p5ZjhV2jPpTkTETWOVi661O4IguZ32omFsjM3AROdgP9O9tkZr1VzVJs5dm9j48YzYsfb91pg53G6zkOdyWmBEZCwmRofyGzl5yzDFS0TEzfpcWRc8Ho8SK\+U23klkckREbTU81c1c/8CHSQQAAIA7cgQBMGNnBEad9cCWdyyLmLB/zHN39hpm1e5JLSzsGPa1R5DcvpDbF4qsZEcuzOT9ynt5nGHMtnO44P32viduGdw9fTXjc1j1\+FjBVSiHJOJ6YSJuWv19yb6wTFZ9fZzs/jemB7I5lPB0xIzrLBDx1S4b52MxL6\+Xl22RYC/bx4l39LnoyLLAemMr0cRQVWDE2wZX1gJEwRsuzxO1K/UtGxecg85OUTMi7m1PuRaZurbcNElJlXKyIAicJCt/TeVdV2zLAy0R1\+emRpZ7o0D3SizKDqrqhiE0O6Kvl8zlRjWRX/UlgrpGTPJFJpez2uqy2qgsdttMl2wkDk72vstzyHKntlYYwS5y41r\+mWqeW7pusImhawIj25nzKcXTUItqw6Ku2dI7ouy020h0h0JBmRHvGk3d5Mph8mYOT1Bh8YpmDArVOpff7/xvv5o39TQWefGZkeqWQbDsg8Mb10KXH/wNMG836tW5YlGtm3bJxv2zr5RCa\+XmjexYXD/MO5s97P1Ka7dtWo1C9KLqmC7JkoORoVUMadizbbTwD/3VsUHyR86XL\+brwzmfg9r1YtFUpsc3dSNgkhKOElnrfcCZHMwkar50vOyZPeQ4f0wQREbmemDLudnhNml9XOyDxp9\+jxgRO3N\+ds/BnJlDVoKyEoxECmMj6WxtuPBeRn1mws6rkDknK0uH\+HRgM25odfIkREYWkTScLm3vAk1ExKRAphxoV8KjM8WZRN2\+ZQvdTrPZke/qIAAAAOADdBQBsOR2iVZd062QJBBxo9nsCC6PQyCyDljTZrPR\+lykd717p8TUetOMuPePRByinaz2\+u4YY8y2LZPGRKdIlUbLJLdERNxoGiT49wvlD733nWtyQ42Oag7GLb1p2MeGioy41TaFPcfyaVdCQ1OaIK/lXnnbsDyZ3liw/ePgXV03OutDS9kcg0FJnVMLxeKM5soofm\+vV7oUmtf7nTk3f\+V4KA5P0HM5u\+X7Td7pmFpxxD0nyXbOiARBYETMM\+7jF/Ld8ZJn2\+Pw9lGgiQTnsNvKFousKQZjAhGRUU1kV5VUwlOPakTE5FCmEKJ2JaxxJZ0K2WrhC2ozENjRqZ3JoVw42m7UDaJqMitOZxTBLvfPWTAiOrVWRze0utMpOjyhoFsgIstomh29WtND8mHOgsPj97C4WlsU6tb7H//uOJ5gLOWyud2s0R\+3eVvHT97lXYc/c7UfdOw\+DRI3l/NZlXzT16/4xGZ8NK5mk/parrRrakbXs33HRETUafYjwV4X6MDuZbSLwuq1y8lr2371\+HdEv7xdS08kNU\+qlPA5GFG7ls9Wm6ZZawTlLX3P76Org7lDqfNTF\+NlMcJn4ponc/Wgzs1MCqZzvM4OP/WW6PRIlNf6NyZuNpsGkyYPHrqcMcZs/L3eYe2SbO/Ul1tWYL2f8h4LinZb1zS76\+89bGx7ZwUmSmeYqa\+9bbKMRqtjd\+034R0TnWfsZlMzDvd\+ag03aotdz3T/6twrA3wAtm2OLiLiVtviTHDsLMuef9l7FQAAAHg/HEUXaME1HnKr2ZkZD/klrmXzuuhPDR7cB4\+JssT0xWu1sHu/fskHbUUKxoLFsWQ0bU9FfDIzatnkHEVm0x5TTeYNl98jMSJuauVsnUupjYjJLslCp6EZliII69tSQp6ZeDZddiaGqXF5RjXlmH\+/L4f33PvB2Qom\+XOzuZ05rj3meiUiYo7h9MZYLu1KdKI/345NdLokgVnEOwZ5IuMewVYlIrI5lMnh/MgMj5QWIoqDWSu5aPLa5qF9N\+e41tmc45lceI\+HfocyeT47kSz652PuTqVQo0BImczMj8ser11PjCU3lVYSbWQKW58gObe4Td7WOZY5PON\+GknqwwVFYkTWSqGwqkxnFLG1KQHNjWW1ZVdivaTOnrhRSU7NUCQmcDKbxYtZzZO7mvE5iCzt8sUkHz9PRF1jMZHXqFIISrxZM5zTMba4qIXch8kyOTx\+D01l09SVM5vjX240GkZntWFyi5parW6Ikmf9vcgdDYK1mdmYu5i/Nhmi5a47tbNzKW/rFokH9LdgUrCw1vnbahITZc/6vELEdVNr7bIOCZInmBrPhNyMyKpnk5q4a6bR4UukuNoUh/2yWc0uUmgyuNslw7tacWpOo8kr82Gv0KumcFzzZK5QMTkVdVQKwU3n8n66OgR3ODW5HBj6YteTujp7mG97meQLh2j9c\+uDl3f7Jz35eDZdtock3ijk6/bhgk/aEV7uYHc6BbNarjZcBw9NvyfBMxnxqMl43JmJBT0Sb5STlzUlkwtJVi0xU5eHe502rEZ5ZtEUJ13r0awgyY6uutxqBxzrJ8UxGBy2T2TTZTntF/W5mTld9Kdc\+5XN4YuEXaP5i0nx2YjfLXbq\+UTeDM5m9k0zc722yNfj3z0zwH1dsnsmp9Pbq85QQ1Ft25jQ9eTQaFFYH9F60w7LY96LLX/p\+U372X8VAAAAeH8cyTfAgjdSmjUnpqZG80Q213iulDrUCC8OJZWJXYxPPZa/sDZJhlWPD43k1x7HR04ViWzDVxrz4X3iaUFJzZfExEx85PKFjv2MS5aViMiI2UXRKhTjBb212rGf8SjB3PXIpi8CBc9kZDAw9eSp5MY0SEwOla7y\+DPpkcemuOjyxUpXIgeMirTH3g/ELVMrziTq9q6htZp6Nq7bbdQ1bZIicKOSzJrjmb1C0J0cvnTBZ9WjRdGVKERltvZo3W3rphy55Eku1lrjisMheLcP3HvHGeBeyiu0ODEVtedCxrWiIfkDAZ\+PaEvGn7dr6Wi2G055tIsTiVQu0Y\+3rFa9xUXftmQI5x2jZRJ1VzXd9EuS4E1UFogxZm1EZtyoJrItVyq35xeGzCE7u2Y1mUw3Pbnrw/a8SqJnejYRDUQnxNL8JBXTmjMyq1BaFVyRTIEuFmr6oEcrNJ3hiJ\+MqeyMx5k5xHQnDk9Qsc/NdYYTW\+LfRmHqi5f78xjnJ0bz5Lr0/FL6vT70SoHUs8bY6NSyffyqc8e2uKE1O85DJAM3swkuRVkvOrdredXauRSTgr1PIYmIBCWWU4i2xWzWSmFmWYwE2WJRdXn8XtnjLk5MRHmpEJIZteu5fEMOh30S63ZMU6vVJwvzmaDMyGqUkxeTKvfPzmcCEiksHIhPJO1X10eGuo\+uDq7X8sl4ts48g0K3oTUN9z3oFMDk8GzJmApPjc4R2Zz\+VCkXPMxeBG/sSsq4mHzy1NTatHK8kR15Mqn1F\+jNUdS7\+\+6399J1NpPMTngvmiQ6ZacrKNkYEbNLXCvOqLq\+2qEzLsWXqsRCGzdMJgcjfjU8ci5PG9MgOQKZ\+cJMPD322EUuOpXx0nzigP9aMG\+kNG9PprOj7qkOO\+OUJc/4AQfPG4vVjpw4aNTDNaIoNOOfEybW\+4r0hkk37a7z0/YD1gUAAICjdkSDYDEpkFkKZLb/LHjTK69t/MuXa\+hbV3P4YvO\+2OY1lEzj9o7tEBE5fIVNa0vBeX2jNySTfLHylu0QETm2Tjmys9ByqKyHyjvKHC4s7TL9CzF3bOm13Ta3\+94P4AiUV3o9Sq2VROOyHEltDB1j1cu6tWsSrb25Jx9vG5Znr2Gburxr1GeiyfFYIhydnWXRqRGfJ5ZKhXbE890Dskh8Z5pJ8MZmCzQxMTZFZB/e\+ZWnXpuLx1V75Mps2CtYztzU1JC3eCl3JexsZdMqV3KDIrcM0\+QkEHW51SpHAyaF5lcGG8kp30g1PZvpvangHdPskkyWXptLxvOmr5RRmNVuc9PsENvcO5ET2aRgKqEmE2Zk/rqHWlrd6DCJMTmUm2eqIXSMuum5lPBLpFKXiDmU9LxrpRCdUh2ZkuJwUCxWG4tfLMzOhg9Mljm2TwNLdNAwV4ceBGvzMXX0WjmbzavLpERSrnZ\+NKAGw2H/oGftOd3S5q6ZnuntncyJyNJXmk3N5GxHH07iZj0dGCquvYTglmGw8Y0F9vykl7cbjVZr2eA2ZmPUm3\+q2A7PizadiBgjYlIwd32wTQIjq56Il8lhFseanfmc3zV\+aTYSGLY3yomsqqrLHXk8dT3Tn2VWDuXmrYnRqakz1\+ejbnZ/XB283ahV59Q59VrD5k\+UViI\+ievqTDTg7kjKsN/v87idsrTeI3u3k9lsaat8RyfbPTiUdEXf0YCYHK29th60C9700mtbFxC84fJKeNNdjrljS7d3vVuxfW7XgjuUqYS235kFb7iw21xZ61uUgrmVYG7br4I7mKkFd7vLS6HKa6FdfmcOZf8dbdPW5lTTmdoYe6C70ay51ebmqtnZGCeMd0kWbapdiRVmY/33X7xdL89ki7XWsrqoiMH1iQsEX06/vf2AiIiYHK5Zu5Zwz1UAAADg/fHhGwUaDiDIwaA9PjWyPo40twxLvDTfTyNz3l17eO6SoKTn59cmDd3UybO/4sbCnOySL3Yp1Y8w3OHyglIp1zsbo62uYZLs5vt8gSe4XdIuIz47lFjtpcHyTLG5eeLcbrfb0fIXCq0zkdnr/Ql2BG90fklRyxoRY3Z3MB0M\+hxWLRyYWJQTV52SlJi1N1eZx69IjJT5Jd\+KYZcYEW/kRoaeaUjjhZjdrJfr9snSlbDiYFb98shI3hy8NL8p7GN2UaBe0rIcJLLq0eiEykKzaYkRMXcw7CYiOeO2VrKBi1VxPOUSeLsSH403PelSqvfQKyiJwnQ6MVf3u9/LID7vE0GWnXa7nZjgiZQyvfllYjG9Vi4W4vlo02D\+2YVpmonX7JOlzUlrzjnnRNysX44WuRJJ7choc2KeWGljhiLeyI7FrY2/2\+ySU7LvEpVxQ30mumhXIqlhBxG1teWuP5MJSoxzzxmznEjq0sYQzC2taZucTflDWpPsjEmBqExEbb3TEfzphYLfuyWHJ7ijpQWPKe7ItH5Ir452LT4ymjedg35/aqEU7Od8mRzM1PyXVqpzc\+rl6IwhBEvrQwhzzrvWplHBeGvumXjdrkzu9vYC3guuL\+arlpyR108sp/Vmws3qlHeqLp7PxSRGZFTCgYt1wRMYLyyFN10qzKGEc0rYapTjU2MXGqXr\+0\+tDAAAAEfod/7h7Vt3tMKrrb/7whe\+cPBir776iU984m5LBXfPMhqmbb1n3v2Ac77nBDgfLtzi7P4emYZbFm0dNdfSG4Zddt9H7eW9OLqrg7fb5DgmZ/m\+wy3D5OJuL\+52WXT7FbRzkfvmhgYAAPBh9qtf/erRRx89cLEXXnjhUedn7mjLyAB/1AjS3Y9eczTun4fF\+zz6JSK2PoDbGkG\+39rLe3F0VwdzIHH7ocUE6bATIe\+8gnYuct/c0AAAAI6nf3LUBQAAAAAAAAD4ICAABgAAAAAAgGMBATAAAAAAAAAcC0cbAHOjHPL6so3959X5oFgrCe9ZX\+5DUpqDcb3gEwYGBgYGBtzxunWP9tJWx872dnI2VNkyqWu7FnbLY2XjHu0Y7gmrHvXe37V2v12ncFd4Izt0duho/uPQroS9Q4l7dk8FAACAI3WkAXC7ns03XZHxtblM\+ErCK7ija88dvJEdcsjhWpvatXA/CBsYEGTvWLy8shaKtSth2TH0ATwNc73gO7troGnVo\+6zgbLxfhaB64XAWW\+03t7xl3Yt6pYDBZ33ZpK8/dZLV4bFezjoiiM4/9rt2zdK588cbvrRu7f3Gd5jeaOWDQ3JwsCAQ/aFc/WNCuBGJe5zOwYGhLPusezGSeTteiHsczsGBgYcsi\+q6utrWLqaGPOeFQYGhLPesdwu552IG2pIlkPqbn87rLYakuXNLxK4nlt7i7GFI7B/jMrb9UI04D4rDAhn3b5QvFBvH7L92V0uj1N8b5XJ9Uo27Ovt3TuWrb2vbf8Dt6NSiIgb5YBjS4303v9Y9ajcvxE5ZG8grjasA7fPVxLebdUrR2u99ayVXKjX7uShaHmjQe7Zhu9mFatRDg/JvcYdKqxYm36PBoZkxy7tzVpZu1IGzgYK\+lHUryC5PC7pnt3arJVcOOCVhYGBATm8tfLJ4YuM26rpMl6yAAAAfBQdZQBsLJfr5AvtmHd0Vzabc3z2\+sL1q4WIwivRCxff34DzQ8bSisWmc3xyx5SfXF/M10iJ\+OV7GPPeF6yV9MREdtWTXnjlpfmE3JwZCxd6z6vWSn5iqkyh0is3Vq74zOzEVC9K4Eb1YjjZlGPXX7nxUilM1ehEuhdtWyvZqajKg1eWbryykHLpMxO7NC\+uq3lNCEaG39fRfJkUzCwsLCwsLFx91i/azpx/9vrCwsLCwvXMsLj3WrxRmJiYaYqhVOF6pZSL\+ETDMA\+3Q8EdLpTTvvd0ENzUNcsVzpTmr\+YiTj09sXbqPzqYOJy5vrBwNTUs2s6cv3J9YeFqon\+nYrYz558tXc1NB50ddWJkLHeIGJhs4nDq6sK6\+ZhHoN7kw8mmK7V045WFmFiLTyT7r3/2asN3s4pVn5mK1sXIwis3llKuZnIivh7ucYukwUhs0mXfWlqul5MzTTmxdOPNV356ZdJlP4K7DZOCuflc8J7d6Hiny6ThSOK8c5eXQUz2\+UXj2uJHrVkDAAAAHWkA3NYqGnmGXcLhFmeCy6UovkAwmkqF3ZZW1Q75xH9nuq3FuE92bM6V8EZuSBg48bmLy2YrP3JqYGBgQPAVdN5LPw8MnBoptszFqcdO9FI7dYuI2pWQfHYoFPK5HQMDDncgXrmDJAo3qvkKH44E3dsf/qxGudiUQpGDXxpwo5IIuM8KAwMOty\+6JU\+1lgcVBoSz3kC8f5TtlXI85OutIXvHEpVDvWDoWs1CeEgWBgTZFy1v7MVqqOvJqMDmbbXrubDP20sdBqK5Xt5y7zO89/GZTc1gw5FLQa8kK8FYxMNayy2TiKzmtbIuhhKTPskhBy5dGrZpxarOiaxGpdH1RGJBr\+SQfZHctMeslrU2ETeWl3UxEJsMuB2SN5TJBe1aeXuFtev5ctsdCa1Po9NeKYS8Z4UBQfaFE2Hvpt6alq7G1859IN7PM/cyiucmrq2uXrtwbmBgYGDAm21wYg63V1EURVHcop0JksejKIqieHtz1fJ2PdtL9znkofBa8o4b9WrT7p/OxEJBn6IogVAsHdrRWLafsY0e89vTfbtWyj5tmEmBdDoa9Cm\+QCiSiHiopbWsXqbzrHtoSHY43GPxRHjorEP2JdYykdyoZcc2MpebWqRRDpx1h8uVQrSXc5RDqrF2Jiv9xLxD9oWym9rRLtfp3m2Y6znfWfdYNORzO4QBh3ss2z/EvSqFiJhD9iqK4pFsTJBciqJ45bWaZ4LkGQ6Eouny9VJE1C7PLB58rTCb1KvYfl1LAhHXF4vLHSWWCLodkjc0HZaNSqHepn3a8F2s0q4XKoY7PB32Sg53MBHzdBeL1V6BBW80l0tHxxVp28Q93DK7NsnjkR2C5A0EvI61FhQ4u9FDh8hQQ7I81q\+sveuXN7JDZ73xSiXby0MPuKO1NhGRtVKIBryyMCA43L7wekeCTb0ivNu6QO9xW7NWEt6z3lB0bGh7k9ibwxfL5dJhv2fX/jNMUnwOo7p8JLlvAAAAuKeOLgC2WvVmV7qLLm5Wo17Tu2SzHaYXp1WLyjsfo/ZZXquqpjuWuRLxWNVkstzgRMwdXbJuv/XSlUHRGVl48/bt27etWlhmRI5AQb99\+82FSac4PPvKW7dv376t5xSht6muqS2bvszSjZdKfq5ORTcnyXrByNndu9NaDbWoOfyTO6NcYzGvtgfDOwPjHZuoJ8cm5ig0u3LjlesRsRYei67FFO1afCSQbLlj1xtvvrZ0JXSGmx1OxLsdS/TFSkuv3HhpPuEx5\+Lp2sF9fbmpqct8MJZ7Niy1ismZ/oO1UYmOhStiZP6VGyuzIZqbCCT7T7z1y/HLLff09VfefG3pyqSL8S7Rfmd4bT8rCe/6ywUiImKi7BZ5s64ZnIgb9Zph8wy7RCJuNhomc3mcvWoQZEUiQ2utvS3hfL0WGHGj1TT5\+l9o4y9WSzPW90VEXK/m6\+SbHF4rVLuWnEo2ndMLr7wyH2aLatNaX7IwEYg35NjVlRuvXE/IjcREtNImkkKVdq8r\+ZnzV2/cvn379u2V2AEVaTXyF8ayq8qVpRuvXE84m/ELEwWdEzG7Q2Bms6lb\+66\+Va/H/O03F7Yn9PaoFKL923DvaI1aNt8Uh4NrfRUsfmYyl/NTNV\+lyGzGY6r5ZYOIDDXsm6qKk6WVG68sZfybc5pERLxVTeebnkTlpRsvLaQDZ2z9MzkyUaXx2ZUbb75UiSnUsdbW2O063b8NW626LkVKK42fplyNbDzfsOjuKmUzweX3SVajpltcLwR26cruTewTiXFD07nkcvYiMCZ5XPZOSzOsfdrwna/CDa3VEV39Gy0TXS6R69oBLUeQ/YMOrVjY\+jkCkxS/i9dVrf9r7xVm0CPRgfVLVrOcLFq\+Z2uv3Xj\+emxYZES8UU7O1MVI6ZU3X1spxRR7Z\+39ihytWbffej61PTbd57ZGZDU10zNdWXlpPiIu95pEWw2d3Vkn693P98Ukl8tu1LSPckcjAACAY\+qBI9tzxzA6Nrt42M513Y72zJMnnun/SxxOHSILehfYmeHUlYzPQVxhzaF007DIfZf7sdmcgcSkTxZIjiWC1bFri42w23vw4bbrxXLbEwuvpxrX8IZaWBaCpWHpoE1YTbVmyONXIj6ZEYUSMXVkRtWMoCSRsVyume5YKdXLGHqDUW9vHckXjfVXd4RikVotXW22A44DDt4mjz\+bS3sF4q6uNqo2DU4Sa2vqcscznQgpEiNpcnpcHVWrzWmfQ\+BW27Kd8bjdDoHIGwh7DzwbexKU6dlUe2LisRNdIrJ7IqVSSGZElmV2yCbbTDU6mmgO567IAuOWxTmJbp\+b4sWi5s8ojna9mK93upLZ4cQkz6CUVYtVXQnJ1FDzaqvLpU6XE/Wry9KKxaY0mVpvc22tXO94YomQV2IkxSKqGu\+F2FyvzjUd49ene6ni4HSiXgvPLRuB4IG1tgPXVVUXg6XpgFsgCiVitcWoWjNCsuwYnp5Wxi5\+8VTeNewfn5wMBXa0ljvYzd6Vsn8b5oYaHYtrnsx8LrB2dKLbpyiDdpdTY/5Bxc1lVjYsznmtvMz8s6mwIhBRIDLdqo6Wa0ZQXnuhYJMCiVRIEYjIEZSJiHijOqfZgrNXoj4HETl8YXmjYLtep2y/NszODEciAbeDKBj25cPNVod7hffcvZbZzwjUMc0uKf7Mgmx2t/7ZZpf6FdNZLY6cKq79bh\+eXZkPUcfqkl0kLRcIF\+2J2bBdIKvTIeJ7tuE7X4V3OpyYnenlsak0nyxMi3bqdjr7HhXXq/lq205z0bi7kgtKjHhb1zt2WVL8cjZf1SyfT\+jHv\+lBiYjrB9Uv2VyTqUTQzYgkX8hNRGR1Vk0Sgx63Q2Ak9H/czz63NSJizkCk11THQ4OFRNOwyD2cuLoQ3lYnZJMO1euIiZJA9ZbJ6dh/bgIAAPARc2QBMOecEx1\+9CabzTmeyQSlTrNarrPJXMQrHGY1wZfTb\+cOXywmuUSBiIjZRclOZmf709MdEGSXJKxtVWIVvWMR9T8jlMM1K7zbSlxXi4vkm/XvSI2368Wy4YrkPMJBO\+Ydw\+gwp7u/CSbKsp03DYuTRG1jtSO6PDsT77xdVy9n82q92X\+KF/0H5z6YIMkOof//RBu3OCfiprHKRZfcr1xBcjvtRcPocBIcnqBCFyaGWuVhRfEMDvsDh3u9wLzpldvpLT9ZDXUmu0hK5Nmgq6uVC4WpuGuhFFoLkhgTJdFhSfaNzp1MCmZKViI\+dm6gQzbX\+XDQZWi9Iiqx2Uw3mfaemOqSODgZHBbVzafGWCxUrMF0YD03yE3D7NrltUO0S5LEegGwZTQMU9OePHV5Y32bp21xuou\+DqZhMXG9k4R4xi1SufdELrjD83qorWvLVVWdGb08M5wq5UJ396S\+X6Xs04bJqmfTi/bI9cym/TJmYzZiTCBGjJGN2ahjceKdlmG2Fkc3QkAicnms9VcMTHQO9pOX60e/2mgzeXz3yH7363S/NswEx9rdxmYXutyyiO78ncTemEP2OuRd/8SJyCYOJ67E1q5dm\+gUGa31SrA7RIcoiALp2za5sw3TXa8iiJLosBx2dmC/Dq4X4lkzVFoKmvGxeDh/Zj7mNqvxqXpovuz3BeVsvtq0fArXVI086UEHEXHzgPolJrnd264Awen3iYWLQ97qsOLyKP6g3\+vYrwHvd1sjIiae6b9NZXaB9ZqEQ/Yqu9fJITCbbXO3EAAAAPioOLIu0MwuCLZuZ2vKhAm0/QmIsf6jHBNcHsXnC8ZS0y4tvmX0048QSyvO6c7JybV\+1Ou4vli8h6Nf8UZhYixeF8dnl268tTbo8yGC/zsdTNgRyC299NPZiEKNQvzC0Ej8EP2sd2VpxWzdESvNZ6KhUCw3Xwjb6/lywyImiHbqWh27EqsslcNusizOBIExImKSEi2vtN985ZUb7ZXMMLNI6HdBENyhTEVv33jlxpuvVSJnOLfZ7bb\+mea6Wlh2BCMHZ957bOLwlV5/\+D5rKXoH3WoPjzlkJRjLzS8tTIuL6ezdnsq7rBTeMY2OfS0Q3VE22n4p2z2p5zefldsrmU0vsZjwntOxB7XhezGKOe\+sWmQXRRsd0AV66zfAvS\+87XbBRh2T5GBhqZbxidSxSLDbaZ82fOerMLudEe\+Q6MvUlgpBmcwO2ez2fQ7J0BZ1wTfsFqRAKhPo5KeSFcM0OHOIdmKiEpStutpsG5qqkSc4uP6u5ID6ZbYdnX0cSmZh5aelxLBgVGcmvjgUVt/n/sbvpQt0L6curN8FAAAA4CPj6L4BFpweBxn6lslbeg9r62/ducWJ2bc/twru0LjczGd3narm3mGMMRvt/oDGGO3yF8to9r8j5UbT4A7ZLhywj97oV8ruo1/lG47dRr9ijDHb1kQFs0uSnbcaa2PKmLreYaIkMCImOc/YzeaOL9uslmbYh6dTUZ/bwYibxuq23pw2xugwETERMVE6w0xd739daxmNVscuSmvpGYfs9YVihdrKwiXZrG\+avGi/M7wD71jbS8Mts0PERLdb5E2tZfX2rtcNkjzOzUMqC5Lk6PUFFz1bcuHMITkEq1G91iTZtzbmUbueLxuuydDmVCQTJdHWMdYOsWMYa4chSG4H17U9Bwa\+k\+dpQZQEbjbXNm2uNkwSnTt7TTC7aLd1TbO7ce6sdrvd3qsMO\+1ZKfu0YSYOZ66WEjsGKt91\+5JTYkZ944PrQxDO7H8mdziwDe/proMcq6nWDMHtkwUm\+TMLO/x0dueXDBuY5JGZ2Wz1zgo3tGbH7vRIwj5t\+M5XYZLHuXHFc7PZNJmsrA/otRvOu5ZhciJyKNNXIqI6EQirHdewUyBiohJ0c01drKlN8qx9\+n039UtERILs9QWjucrK0pXBrlbb963mPre1PTiGE1d3VkopdnAnGiLqrLYs2259ZQAAAOA\+d3QBMJMH/ZK19ijX\+0l0\+SRDTSYLtXq9piaTRV30KP0umJvX9E8O8sWsujYiD7eazfqGlU1R9Z0OgrUPuyQLHX3r2EhrxRbJ0Brbnv663aaaLdb0tl7LplXTdX54I6zdfRAsq6EWG7uOftVezKuWJ7LrnCB2p1Mw6\+XqpkhBcAV9kj43k6/pbWOlnM5qtsGgRyQiciiRsKznLybLK4bFrYYaj6sGJ8Hplrqt5Wabel8AlrWtsYMgucSOplZXthR4D47B4LBdy6bLdaOt14ozc7roC7oEImrXC9lCpdHmllGvzi2aWztj73mGdxkES3B6JK4VZgo1vd1uVLJZtSXIisSIBNf5kGyq6WLdaOuVy5cXu57Jft7caqgFtVavVcqJ8Fj4WtcXm\+w9C3OjVi5XavWamouOXUg2pFCsP9xVf/SryPDWU\+/whBS7lk\+XV4x2Q83ma\+sD\+LiDl4apmryYreltzq1GOT4W2pimWpBkR7e13DrUyxsmB4Oyqc7MVBq9aqxyT9AnMaJ2LRFNlCu99l7JJWcWTdG1MbYVX8mOnjs3lDzclMr7VMp\+bZhMrXg5uzH6175HIgVjQVFLRtOVRptzS68kxsYS\+xePuYORYVKTF3M13eK8Xc/Fc/uO7XtQG957xd0qhbf1lXq9rhldbhnNer2\+sj5wVO\+HWjkbGh0rmp5L08MSWxs1eivverdf3jW07fcoJg\+HBm31bFpttI2V8kxBlwJhxUH7tOG7WMXhCQekRmGmsGK0G2o6q9mGJ4f7xeJGY6VeX26Y3Oo0tVq93jA4k5Sgq6POzNQMTiS4/SFFWF1lSj/YZZLid5tqOrvI1\+Pfu6pfslbK2Zy60ua83agW1ZbNrezfvWWf29pea\+xSJ4q3/18Uy2jU63WtZfKO0dLq9ZXG5rex7UZNJ4/vUO93AAAA4L5yhNMgMbd/XDbV2qZkpOCNlOYTzmZydGRkNFxjoUIptduMpQ4lHBCbxWIvCdzttuamRkfWjcYX78UMSYJnMjJoJJ88tX2SHiYPx4JC9cJjJwY2B2k2cTAo16c\+d\+5zY1UWnM2FD\+oG264Xy2335O6jX2lCIDy8azZC8MaupFzN5JOnNvYuKKn50jgrT3nPPTaaN325\+Vywv7LgjVydn3Y2sqPuU47PTeQNm2hjxNyRXEbR40OyLLunanLIf2ZL5p25Q5mMz8qOnBvYa/DqTRyBzHwhYObHHjvnnSrTeGk\+06tGZuto\+Yknz5049dhE3lAypUxgU/XueYZ3wdzhq5UrPj435T13biS\+zMZL13ujYJHgjZRmg93syGPnPndBtcVKs\+sfqfJ2NT46Mnph6vIiBWevb/yBuJafGB0ZnXimaLguzc\+vDXfVH/1q5zsJhy81m3K1Zr742LmhrKX4ncLaqORSIFeZ9ZMa9Z474fjcRF4jSV5/SGdyMOKnwsi53eZ42UFwR67Ox87ULw6de2wk3XJlrs/2xsZmdolrxZnwWGBkJBCfMz2pynzicF/F73Iq966U/dow50ajrjWs/Q9h/VCU1HwpYl\+Oj5w7ceKxwMwyl9wHjADApGCuUvLT3JT31AnHULxq7d9N\+qA2vPeKu1QKNxfjoyMjF5KLZnf12sXRkZEL6X6fE95dvXbxwsjoVFqzhUoL89HDDEDWNReTF3bcoxzBXCkla1NPnnvsi3FDyZRS/W8f9m7Dd76KQ5mezSlG8ouPnXtyqi5Pb9QvbxSmvjgyMnFZ63S1/MToyMhUQedMDs\+WYvbK6GOOs2fPuidUcTwyzNV0sf/6QVT8HlpdtW/Ev3RX9UuMN\+aiXzx34sS5kXRDni5dCUmMiNqV8NmBgYETTyY1U0s\+eWJgYOBsqNKmfW9rd87SsmMjI6NTxVa3s5y8MDIyEq9u/LfIWFY1Fgi/v5N\+AwAAwIfC7/zD27fuaIVXW3/3hS984eDFXn31E5/4xEFLWbX4aNaWmk/v\+OT1fteuhIbilF4qBw/7BMX1QiBQdBcWMttPRrsWHYkakcp8GMORfsAMNeRLU6ZSDuz7/W\+7EhqKd9NL84eu7aPTroVHojy1VA4cVNY7b8MAHwm8kRubWPTP45YLAABwdH71q189\+uijBy72wgsvPOr8zB1t\+QgzwEQkKJdSIZl3DpdE\+mizLOaPZSI7P0/jXXJNplO7dn\+Ge8qyyBNLJXy7Rb9Wo9zrOExcr85pTBkfvA/iRKuxWNY6kmffb0ABjjfOHf4UbrkAAAAfUUc3DzARETGHEgodbRE\+LBzeUHTXaXGZ5AtHP\+jSABGR4A5G95qdlJta\+WIxeZHIfmYwmCilDsyoHimuFwLei8tdEj3j01fucsIkgGNB8AZ3naQOAAAAPgqOtgs0AAAAAAAAwBYf1S7QAAAAAAAAAB8QBMAAAAAAAABwLCAABgAAAAAAgGMBATAAAAAAAAAcCwiAAQAAAAAA4FhAAAwAAAAAAADHAgJgAAAAAAAAOBYeuHeb/tWvfnXvNg4AAAAAAABwR\+5VAHyYaYsBAAAAAAAAPjDoAg0AAAAAAADHAgJgAAAAAAAAOBYQAAMAAAAAAMCxgAAYAAAAAAAAjgUEwAAAAAAAAHAsIAAGAAAAAACAYwEBMAAAAAAAABwLCIABAAAAAADgWEAADAAAAAAAAMcCAmAAAAAAAAA4FhAAAwAAAAAAwLGAABgAAAAAAACOBQTAAAAAAAAAcCw8cI\+2e3b0j\+7Rlu9Tr13/90ddBAAAAAAAgGMNGWAAAAAAAAA4FhAAAwAAAAAAwLGAABgAAAAAAACOBQTAAAAAAAAAcCx8yALgB9mnnZ/69EP7LXLy3LnPP3LA2F22h5jt/SwWAAAAAAAA3Pc\+ZAHwQ5/65uTvnz/H9lzgQWHoq\+f/yx/\+/pCwZwxse8SVffbp7Jf\+6Y4Y\+IHTzt978pOMHvzY45/91KcfOeX3e4a2xtIPP3Jq6F8\+4Xd\+DPEzAAAAAADAR8y9mgbpMLt\+3P\+17FMnbUTdW6t/8cMbT371n3/\+xMDJ0yfo4tO\+d6j71qvfv/KT2q/f3bLSO9a14rXH/\+hr3/1q88X/fOPtbZt86J/6R/7Fk\+ID9Ovbp7/01Iz8j93f3ly68anvfevRt3/55hu//se3b/EXn7/54q1T3/zW0M0f/b8nv/TEzRvNpVsn/V/1\+J2fevzcyZO/\+\+7NX7\+59OPVWus3RA88LDzQtXiXiIhs55Qf/aGz\+r/95V/ceJcAAAAAAADgfnOEAfC7L1fn/lWVPTkx/j3hvz//8\+a1F39GD5373h9/uVuc\+77lzP7hEycfJCIi4dzT/\+b3zz/y4MaqD9LD3q/81yfW/vnbt2r/\+Ud//nNOt/5\+6ec3/f/s5LXnikv0\+MzTv/d8UXvx9KmbP/\+bWFb7xTtrywun6J136bfvdN95l35LtodO\+ryn3ij9KPazv3/7nY2d2D75RPaP/kX3x\+XY3/59l\+jhR07YrNdf/DWiXwAAAAAAgPvSEQbARES2c66nP//utRJ9848jQyceJHrg5OkTFHvaR\+y0yJ78o8nHf/ijP/1vN577d/nndq78IDv5u\+/evLUlIn37xsvXfj3\+3QnPw7dcn/710p//8l06vduOH2Sn/9mjDwsff1s\+97j\+AP2W/\+INa3P0S0TdX2rTxZP/5emvfPONueda75785KnT507knn28u77AW63vZxdqFkJiAAAAAACA\+8CRBsAPCj6/5\+Gf/\+TaizfefrFJRNsywM9n537wy354aXvk9777rSd\+8aMf/2CtB7Lt9BO5P37i5WzxT3/O\+7988jPffMp5\+sGbv3jw8e/8yxM3f/74d55\+9O3fDjx87onvPH2qH9/eev0H//dt\+t2B059kL7/4Kp0\+8\+k3btoeOve97//p93771hsWPSy8W8sWpl/8DRHdfHHha88wG5HtoVND/4yq2ef\+gh4fotYPfsafnPjG9x558xe3EP0CAAAAAADcH44yALY9cmboEXr4kfH/b/DGnxZv\+r76\+Onf3ZQB/t2bz29auHuLd084n/7q40v/sfnGO0T0wMlzj55\+6/Xvv8E3lrHerFVvvPFr/vC/vDD7zs\+i//FnNx/6p59/4stPPvKz7z/XPPkH40//ZmHq/3i9K3yGbr1V\+/FPnmtxIrI94hq69fq1F\+lxWpoq8W/\+4ZdvWuvbfLf7kPO7X2VLN5xfF16P6fzkHzxxnt6s6h9/8rT1gx\+\+/IutSWMAAAAAAAD40DrKALj769b3r7zafWRo9lvs5s8X/vV/W1jPAP95i29f\+tabP6jc8E\+4nnzk5Wu/fJeIfVoW3r7xwi\+szctYv7i1dRfW3\+\+epH3oU0/Hnj5/6/aLP772py0ievftN/6RPnvi5CPvfpreevGt9VUeOC2fO/nOu9/0n/zFjxdetOjzREQPdK3//uf/7sb7chIAAAAAAADgg3GUAfDD8pdz32I/\+NsB263Vrvz7P/qa8\+R6BniXUaDffePnLzz/zv/okz9W/aXVfejk0Dl6\+cev39y8xYc\+df6rT3z\+IbI9cubTn/z4d5/\+1Nvv8Jff2O0Yb73\+XPGv3njqa18/8SA9\+ICN3n3jxo03vvTE15\+i05b28noU/aDw\+c8OvPi3Sy//rPmLn73ZfVA4LXz89IlTpx/67y/f2mWrAAAAAAAA8KF1lPMAv33j5RffcX73q5/qtl5/ceUnX/tf/8OXn7l2TX/1B9nnvvy//Id/lbi\+fQ6kW28\+/wZ9\+rMnHyZ6\+Nzjn3/wZu3Gb7Yu8Pq1HzffFj5\+88abN9954PQJXvvh3yy9RfQO79J267/YHjr58Dv/\+MYbrWutj5//Env\+r199Y61js\+2003fi5os3Xl9aufHGO2Q77fSfe4AecQ59cu\+ZigEAAAAAAOBD6UgHwbr1\+g/\+\+vXzT3/q7d\+c\+s4f//7QI5tGgX6HiOhtfSn23M82vrN95zcv//zm2/LHbQ9\+7PHBcw//sv7yW9u2\+MDpzz/he\+T2cz974O1fv/mG8MT3Jt78c\+vj3bf\+ccv8Rg99/GH6x5vWu10ievCB0/Kph3/dfINODD3yMdvv8pOPMBv9pktExB4ffPzkr5f63aofOvX1iaGTP//J9Duep7987tqNv7uJD4ABAAAAAADuH0c7CNbvffOpky\+vtGxPffk8vbm00nz\+Bn3\+S2deLl37i53fABMRvfty9S//pyrZHvnMdz878PIPV7eHoMKnvhl49I2//dGLt/7512\+9/twPX/cPnvJ9lv3ixzff3rTUyXOfOvnWjZdvvftpIvrYqfOfPfHG8ru\+p7/29Qd/Nl382Dcnvva93/7oT//b33eFT53//Mff\+PHNm0T00KmvXxx/\+qFm9D/\+7MWH3vX90VPZp34Trb7\+NgEAAAAAAMD94cgCYNsjv/fdi18\+\+fxfRas3btLCk1/68tNfdn3ziYGHhY\+dz3zve/2lbv7gT0rXTv8PM0\+dtG3fwLv0B//z//UH/X9033r1uStL3a/\+/tCt/yf6t292P09E9PaN5rXTX82da07//DdEjIh6Exr5v3zq5vLSG7\+lT//uwOMjI4\+/w29\+ydNd/j//9cLf/eLWA8\+/9eXvffX8DKn/iZ4Yeuit53454PMPfd3v\+vSvtVj2b563iKzmnxZP5f7NN/7rZ/9m\+jntecwDDAAAAAAAcD/4nX94\+85Gc3q19Xdf\+MIXDlzs7Ogf3W2R7p7toY/Zfvvu6ae\+lnvqgaUf/tX3Wye/8y3XL358/QctTsSe/NY3vvvOT/516fBp2wceFlj3Fn3\+qaGht5p/sfL65oTzw\+dc35lQPn3jJ9HSjcNs8LXr//4ujggAAAAAAAB29cILLzzq/MwdrfKRCoA/zBAAAwAAAAAAvI/uIgA\+ylGgAQAAAAAAAD4wCIABAAAAAADgWEAADAAAAAAAAMcCAmAAAAAAAAA4FhAAAwAAAAAAwLGAABgAAAAAAACOhQfu0XYx6w8AAAAAAAB8qCADDAAAAAAAAMcCAmAAAAAAAAA4FhAAAwAAAAAAwLGAABgAAAAAAACOBQTAAAAAAAAAcCwgAAYAAAAAAIBjAQEwAAAAAAAAHAsIgAEAAAAAAOBYQAAMAAAAAAAAxwICYAAAAAAAADgWEAADAAAAAADAsYAAGAAAAAAAAI4FBMAAAAAAAABwLCAABgAAAAAAgGMBATAAAAAAAAAcCwiAAQAAAAAA4FhAAAwAAAAAAADHAgJgAAAAAAAAOBYQAAMAAAAAAMCxgAAYAAAAAAAAjgUEwAAAAAAAAHAsIAAGAAAAAACAYwEBMAAAAAAAABwLCIABAAAAAADgWEAADAAAAAAAAMfCA3exzgsvvPC\+lwMAAAAAAADgnvqdf3j71lGXAQAAAAAAAOCeQxdoAAAAAAAAOBYQAAMAAAAAAMCxgAAYAAAAAAAAjgUEwAAAAAAAAHAsIAAGAAAAAACAYwEBMAAAAAAAABwLCIABAAAAAADgWEAADAAAAAAAAMcCAmAAAAAAAAA4FhAAAwAAAAAAwLGAABgAAAAAAACOBQTAAAAAAAAAcCwgAAYAAAAAAIBjAQEwAAAAAAAAHAsIgAEAAAAAAOBYQAAMAAAAAAAAxwICYAAAAAAAADgWEAADAAAAAADAsYAAGAAAAAAAAI4FBMAAAAAAAABwLCAABgAAAAAAgGMBATAAAAAAAAAcC/8/u9YA4CIywJEAAAAASUVORK5CYII=)

*圖 4\-6 服務條款設定（商家已有條款 → 檢視模式，只顯示「建立新版次」）*

### 4\.6\.1 畫面元素

__畫面元素__

__定位（id / name）__

__型態__

__預設值 / 初始狀態__

__說明__

頁面標題

h3

文字

服務條款設定 \(SA Portal\)

商家代碼

\#merchantID

文字輸入

E000001

注意大小寫：此頁用 merchantID，銀行帳戶頁用 merchantId

查詢/新增服務條款

\#btnQuery

按鈕

查詢/新增服務條款

提示

\.note

紅字

版次由系統控管；建立後該版次不可修改，要改請建立新版次

條款區塊

\#form

區塊

隱藏

查詢成功後顯示

版次

\#verShow

粗體文字

1

顯示目前版次或將建立的版次

目前內容

\#curContent

<pre>

空

以 \.text\(\) 設定（會 escape）

編輯區

\#editArea

區塊

（隨 \#form 隱藏）

含生效日期、內容、註記、存檔

生效日期

\#startDate

文字輸入

空；placeholder yyyyMMddHHmmss

建立新版次時不清空

服務條款內容

\#content

textarea 5×70

空

註記

\#note

文字輸入

空

可空

存檔

\#btnSave

按鈕

存檔

在 \#editArea 內

建立新版次

\#btnNewVer

按鈕

隱藏

只在檢視模式顯示

訊息

\#msg

紅字

空

顯示存檔回應

### 4\.6\.2 狀態與流程

頁面有四個可觀察狀態：

__狀態__

__進入條件__

__畫面__

__可做的動作__

S0 初始

頁面載入

\#form 隱藏，只有商家代碼與查詢按鈕

按查詢 → 依回應進 S1 或 S2

S1 新增模式

查詢回空陣列（該商家無條款）

\#form 顯示；版次 1；目前內容 \(尚無服務條款\)；\#editArea 顯示；\#btnNewVer 隱藏；\#msg 清空

填生效日期、內容、註記後按存檔 → 存檔流程

S2 檢視模式

查詢回非空陣列

\#form 顯示；版次 = 最新版次；目前內容 = <TOS\_CONTENT> 換行 \(URL: <TOS\_URL>\)；\#editArea 隱藏；\#btnNewVer 顯示；\#msg 清空

按建立新版次 → S3；或改商家代碼重新查詢

S3 新版次模式

S2 按「建立新版次」

版次 = 最新版次 \+ 1；內容與註記清空（生效日期保留）；\#editArea 顯示；\#btnNewVer 隱藏；目前內容仍顯示舊版

填寫後按存檔 → 存檔流程

存檔流程：$\.post\('/tos/save', \{merchantID, startDate, content, note\}\) → Portal 轉 POST 後端 /sa/tos/save → 回應字串寫入 \#msg → 立即自動觸發一次查詢（等同按「查詢/新增服務條款」）→ 查詢回應到達後進入 S2（或 S1）且 \*\*\#msg 被清空\*\*。

存檔回應訊息（OK version=N url=… 或 FAIL …）於自動重查完成後即清除，僅於存檔回應到達至重查回應到達之間可見。

### 4\.6\.3 需求條文

__編號__

__需求描述__

P\-TOS\-01

初始狀態：商家代碼 E000001，\#form 隱藏（版次、內容、編輯區、按鈕、訊息全部不可見）。

P\-TOS\-02

查詢：後端回該商家全部版次的 JSON 陣列，依 TOS\_VERSION 降冪（第一筆為最新）。頁面只使用第一筆的 TOS\_VERSION、TOS\_CONTENT、TOS\_URL。

P\-TOS\-03

商家無條款時進入新增模式 S1：版次顯示 1，目前內容顯示 \(尚無服務條款\)，只有「存檔」按鈕可見。

P\-TOS\-04

商家已有條款時進入檢視模式 S2：版次顯示最新版次，目前內容顯示最新版次的內容，下一行 \(URL: http://localhost:8099/getToS\.jsp?merchantID=<商家>&version=<版次>\)；只有「建立新版次」按鈕可見。

P\-TOS\-05

按「建立新版次」進入 S3：版次顯示最新版次 \+ 1（例最新為 2 則顯示 3），內容與註記清空，只有「存檔」按鈕可見。

P\-TOS\-06

建立新版次時生效日期欄位不清空；目前內容區仍顯示舊版內容與 URL。

P\-TOS\-07

存檔：後端以 MAX\(TOS\_VERSION\)\+1（無資料為 1）決定版次——版次由系統控管，畫面不可輸入；TOS\_URL 由系統產生為 http://localhost:8099/getToS\.jsp?merchantID=<商家>&version=<版次>；TOS\_MODIFIED\_DATE 為後端當下 14 碼時間；TOS\_START\_DATE 為輸入值；註記為空時存空字串。

P\-TOS\-08

存檔成功回 OK version=<版次> url=<TOS\_URL>，例 OK version=2 url=http://localhost:8099/getToS\.jsp?merchantID=E000001&version=2；存檔後自動重查，畫面進入檢視模式並顯示剛存的版次與內容。

P\-TOS\-09

存檔回應（成功或失敗）寫入 \#msg 後，自動重查完成時 \#msg 被清空；訊息只短暫可見（見 4\.6\.2 註）。

P\-TOS\-10

已存在之版次不提供修改：畫面無編輯舊版之入口，後端僅提供新增 API。

P\-TOS\-11

版次由後端於存檔當下計算；畫面顯示之「最新版次 \+ 1」為預覽，實際版次以存檔回應為準。

P\-TOS\-12

生效日期不檢核格式：14 碼以內任意字串均可存檔；超過 14 碼存檔失敗回 FAIL …；空值依 P\-COM\-32 失敗。內容為空同樣失敗；內容含單引號會造成 SQL 錯誤回 FAIL …。

P\-TOS\-13

商家代碼由使用者輸入，不檢核是否存在；長度超過 10 碼時存檔失敗回 FAIL …。

P\-TOS\-14

存檔失敗（FAIL …、後端未啟動）時仍會自動重查；畫面依重查結果決定狀態，失敗訊息被清空。後端未啟動時重查回 backend error: …（非 JSON）→ 適用 P\-TOS\-15。

P\-TOS\-15

查詢回應非合法 JSON 時（例 backend error: …），頁面不更新：\#form 不顯示、不出現訊息。

P\-TOS\-16

未登入（session 逾期）時查詢回 \[\]，畫面進入新增模式顯示 \(尚無服務條款\)、版次 1；此時存檔回 please login 短暫顯示於 \#msg，重查再回 \[\]。

P\-TOS\-17

用戶端取條款：GET /getToS\.jsp?merchantID=<商家>&version=<版次> 回 HTML <html><body><h3>服務條款 v<版次></h3><pre><內容></pre></body></html>；未給 version 回該商家最新版次；未給 merchantID 使用預設商家 I00000000；查無資料回 <html><body>NO ToS</body></html>。此端點不經 Portal。

P\-TOS\-18

初始資料：I00000000 版次 1（global 預設條款）、E000001 版次 1（OLS 商家條款，內容 OnlineStore 電信帳單代收服務條款 v1: …）。後端重啟後資料還原。

### 4\.6\.4 後端介面

查詢

GET /sa/tos/query?merchantID=<商家> → JSON 陣列，每筆鍵為資料表欄位：MERCHANT\_ID、TOS\_VERSION（數字）、TOS\_URL、TOS\_CONTENT（字串）、TOS\_NOTE、TOS\_MODIFIED\_DATE、TOS\_START\_DATE；ORDER BY TOS\_VERSION DESC。無資料回 \[\]。

存檔

POST /sa/tos/save（form：merchantID、startDate、content、note 可省略）→ 純文字 OK version=<n> url=<url> 或 FAIL <例外訊息>（皆 HTTP 200）

用戶端

GET /getToS\.jsp?merchantID=&version= → text/html，見 P\-TOS\-17；例外回 <html><body>error:<msg></body></html>

查詢回應範例：

\[\{"MERCHANT\_ID":"E000001","TOS\_VERSION":1,"TOS\_URL":"http://localhost:8099/getToS\.jsp?merchantID=E000001&version=1","TOS\_CONTENT":"OnlineStore 電信帳單代收服務條款 v1: \.\.\.","TOS\_NOTE":"OLS merchant tos","TOS\_MODIFIED\_DATE":"20130301000000","TOS\_START\_DATE":"20130301000000"\}\]

## 4\.7 商家銀行帳戶註冊（bankacc）

路徑：GET /bankacc。資料端點：POST /bankacc/save（註冊）、GET /bankacc/data（清單，回 JSON）。後端：POST /cp/bankacc/save、GET /cp/bankacc/list。使用者：CP。審核作業本版次未提供。

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABQAAAAE9CAIAAADbLVjAAADEWklEQVR4nOz9fXgT17kofN\+y9TH\+kDwEGwbjwBCnWCEpyA2nmSRNEMlTouTUVElpo5a0mbDTdHhbeqb7YW9mb85DVZ5NK7q5dnWa9kVNUzJ0h3bSQxMVuhNB3wQREjLpgSBI4owJhjExZsAGxpY/lixZev\+Qv7GJISFfvn9XrwZJa2bWrBnJc697zRrL7KX/AgghhBBCCCGE0GddwcddAYQQQgghhBBC6KOAATBCCCGEEEIIoUkBA2CEEEIIIYQQQpMCBsAIIYQQQgghhCYFDIARQgghhBBCCE0KGAAjhBBCCCGEEJoUMABGCCGEEEIIITQpYACM0BCHNef4uOuAEEIIIYQQukowAP6Myc2blamyDnvDmq2wjlv6w\+VwplcuTtVSH8rKcvO4zse/lHFdzjIVs1IrF2QqrnSTjorUEz/qWHNdFgAAsnXLLzT8Pxde/CfzxX8yX/ynC//np\+e3LuwbHh47qGwFlZvAij\+GfQEAV0XvioVpbgFZNis7/P2q68iKG0fsCFCZ5V8inPPy1n\+JGroqMrVThrdMzvXhnBVXIFtbk651jn2YXFTWMeLluN0fEz7WE2PNuj7cb\+UVHcFRKirTiyo\+vH38sFj76jiyZMpYFbNma2f1DT8DHdbsZX3LJs4x/rkBVF/trL6P7GcWIYQQQh8Q/tH\+YErmbPj5Q7Wvy4Hfv9cx9C61aOXKTdNeDfz0743pj7Q6DmdmxYNJrqXk4WccjRkAyC5Z2rHOWfTwtvxLAMguurdzzU2D1/0515RsRaagMWkZsaJ0we4dpRuPX27/SK5qQdcTNdlVcpFKxi5Qu7hj6\+Js66jNQc7lzDXuLnv4lcLUwFuuKX3VttxFS\+UczlzqgPP\+HbYOGM1VmVpW49j9trU1c5kVBwCAVKttW2PPpq91q5HS3UkAsBza4\+yvkjW7fHnHolH7siS5DooDAzWpXpB83GNfNdTUwyr20e6Lq6J35U2w93zvsgWF20nvoqaCijuI67X8Ac1VzO6tcxZuf3uoqR1FmSW39u5tcKhJC0C2bnn7puugmQwco7Sl/pXS1QeGyud3pGLcGuaqqnseX5zbttW5ucUCABXXdW9dmgv/Lt\+qHwKXM1NbmXNAvkktHeetaqsFIDdvYbdYk\+vosaQAoKdw9yuUSvWuWZrau8116OJNW/vqlncsby3NH0FHBXniUdL4jGvtGKf9ZRzrCchxX05uqnQ8vJVqzOSqbyQraoZ6KBoTRduOFww1NZVZs7yr4kDp2sOj2n\+EyzqCroo0d81QPOlyZqsrM9WV6UXV2dbXXPc/a2u9gn26eqxZjkulzjp2Xxj9iaOob9nSztqWksd22JszANa\+Zcs76hpdw39GLourkmx6gFQXAUCuwgk75bItzu411zi29JANd8DmJ0u3X7CMsdS03nUPZrZEnDs/pNMbIYQQQlfVZzkAds29R/n3RfMGX/f2NDbUb1Ne3PaWOcHLI8e0OXW1VvWld5s/2jj2iqWSto3PFD3xcNe6hdbH1EJXTc\+amoItT9qHXaYX7H3BtfeF/hcOZ\+8mobtjh2ttw4cwFiCVtK//XSl8gyypdKjjB8/NidLAs6NCvmzdN5LLRoTofS5ntgo6n6uxdLRQW85bGg\+UPrzD1gG52ns71tkGlrP2rXiwc3llf2zpoLJVRZmtP\+oZPL4dLdTaZ6j6iUYpBbufL11fk6uf4IVsGoadSDnXNVnosXSM2NbHsy\+pTK56YXd1YyFkCiENrmqyfJolfGHgiIxxMo/u/lBfKH1sdMSbXXJv1zKnpTVjAQBHUab2ukx1Ud\+GB9ONPf2LO4qyjhbH1rN991da6i9kFy3uqmqxb3vNWn1rr6u1ZKKtOobssofNDdWW5iS4pmQ79rnWJns23QpqY2EH5Cpm9VafdN7/rK0DLPUHSh47AADZRUs7Hr8pp6rZRXf0cNNyVcvblwEAQEdT0epnB6LWomyts\+DQnsIOALD21d3XzV0DVV/reHGg5NpnHUOt/f7HesKcmWU3Zaqm9a3jrKvUguqa3qqW0sfUwhTkuHs7xJrs9sEAmOpbsTy53GlffbwwRWVWPti1bNrwRKil8bXS1a8UdgBM7Aj2N2btHZ2Pe6DxbEFHjyWVsXT0FLS2Wnfvs2/fXXjoZOHlRb/Wvrovd4kLM1WunCNtaWy0b9tTPBDA56qvS61cTBZV91XYoOO89VCDY/PzlEoAqPSmH3Usu2bYenoKDjVQ4eepvRcsrkqy7ssZSFryK6mqTNfOzKaWJl0nB3cnV\+G0vPqiPfP5XseFwtS0lLg0fShRtDvTu6yyQP1bwZVFvwCQStq2PGNXWwscFeSJBzNqa0HzBTvc1/FEj2PjtmK1KFObsR1KAkCu\+sbUIrBty/ciZQDSA\+1P9S1bmG5927F3rFAZIYQQQp8En\+UAGACg88L2X25e/Xon2Kjqm\+YtX3r3mtXO1Nqnt52ayKWrtWLu7aLvwupXPukBsMOZXrOUVPQUdAAA5JpbCis8nYrH0gG51IWCeXd0bwBwWHMusG7ZQQ3LzWa5L/XUnqcea7zC6NcxpXfdg91jDLz8WvsrVoBM/hIWWhuKV\+\+wNw98WOXpfK56rAxwS/7f\+RA9V7s4uc5Z1B8oLu4FG4whU7hlW9mWgVfVCzueuNHx2BXm5QAAgFi3Hx6qVe3ijudvtfTXcEqu/m0AAFclWbc4Az3gmtVXDWRdUcpRBM0HqMbKXEdT4cjA/uPZl9QF\+\+bXUus8WUcPAOQqpuXq9zkvTqABAFj7lj/QVefMVU/pcy1NLiH29X\+2gy1bvbBnwyxLKn/aZKybn6cOkYLdLzh3AwCAoyK1iU8BsaRcWa4m3bGnZOO\+oU6Wior03kwhvA0AFkgXpCpTK2ZZGhvTKx8Y/BblqmalXYddgT0Tz9RZ6vc4H95XsOjB9pUAANDaRG181t4MOW5p37qhYtlF93aurMxVVcLOPxU3VndtvTWbOutYHylVneSJh3ua37Y1D9TTVdFblbTurul6fBq13dqz7qZcR2PxKrmo3km2PtrT\+ratMXNZx3qCcrULu7lk8WPPZ1cu7VxzwamOU85BZVY8mFzhtK/dWrw7CQDWzVvLNl9c7jKO4FBjNh4oCYw17uDyUJmVfMeaaqhPOMINtlbIzrsutZJv5553rVILXdd1P/EogYbijU/a1Qu5Wk\+P\+OWux4sK7n/G3gwAGUvjS677X7B2AIA1y92YWnFf9\+MPWgJPUvUt1Oqt\+Q1kF92b3OS0dPRA1cz0IlIYfr5o\+8mB\+NaarbXbW/sHVlhak7lFS0hF0lrBdW8YbMOiDFdZuDFSOsHcbFVN96Z7szu3le6d3etqodQkpMC2JWGtclo7ajqVxX2H/uxafbgwBbmqGrIsM2IYRf8WbX2LFqaaTzr2jvl1QwghhNAnwGUHwI45tyk/vqXxpaMVN82pmuZ0nD2\+\+cm/bDtKAKzVt9y97jtf5KqKoLNV3RVb\+8d3XXWPbr379Kq1f1FNqLjlwef/dW7j/3fzw7vaUrbyFT/\+7vJT2wOb3x1KONBzNmwI1DYcaZwzf8l1TrhwcvuT29e/0pYCcMy8QfzO3XU3VVbZexrfeiP85Is7zRnr/u2hJSe23//Ld1oB8qOOH5979LH/\+V9q11j1TpPGQ29sNKnaf7t7SQ29/VQb0HOWP/rfV95SWWFPtx4/sV2Jhl83Yc6dyo9vbn3jQvUt12Y1Y/rCOS4A5Q/ztgU3rz3qXPade1bcMmfeFGg9/u6W3/91y6GJZpL7m46es\+LRe5bVzqi2ZxpPnNi9IxZ\+pS0FVO09/33N0rm1VU64cHL3n3etj51ovcx4O5W0rd82LKiy9i1f3lHX6Fr1ynjX6NklD7RvqLTubbHuvdC3fOlgk\+Wqa9Idz5etOjyhLErqgn1txJ7f4orlnVxD6Wq1P5\+28tGOZcmiVc84Ls5YXjoD7KD6uNlZB\+SqKrMua2ZRTS4F4HLmHP0f9dVek4PzQ/Gzw5let7yLc8LFWdNUC7X2z8Ov\+y\+pP8OWdTlzzbvLAq9YxhsC3dFCrd4GALnae/sqgFr/gq0jn0uvzLmsPeumWQByVdNg746SbeezH8u\+VMzqXTKtoPlCQaonWw02tSUHlWTdw5l503IOyDmc2Sroe66moH5f6eoDuappfR1vU/XXpOsbCpYs7HPZANIF9QeK1o6ZP7RmuYXda\+7oa9zjWm3t3lBjX7/PUre46zmuZ\+ffSsIHrK0AHRlwOaEjCQ4qCz2waDGBROmqF4Yf8dyipR0rJ3ZYBrkqM4tqLLVOgPNDlamtziyakoWzg21Y0Hi8sOIOklJd4ZbMmn/oU59xqTWda5b2HJrSU9FYuvrtofBpya1px/GS1ild8yp71kzLbZddqTs6H\+f7Gp1pUEvXv12QAkhN\+FhvaZlQxs9RkRK53N5nHbsbLI096YoLFteN2dovdzx/R/\+Q\+I7X\+qtX97XOZVD0WMTuWJh8brZ9/OT/ZR5BsADkqhd2PldzcYVzrim51r\+5AnusE4iNc/M83SurLTufzseEAABwwLH9eJdY2VdlLXBUZiqS9rXPFuWDz\+Y9pYeaepc4x\+pryxSoh4tabennlqa4KY76VgsAuCp6xaXdi8Cx9knroge7U38rOVRJVj5srjhZtHEHtfuCBTIARVkXWDoAXFbomEZWVFrDTzq3D4s8HVNSTyy/jB/TxgOlq50dj/PtdeftG7faWwEALIdeKa4XOjbNdqyNOLf3H2ULjNMtlQK44vwzQgghhD4aV5QBLqlYctPRVZsiey/Qy1Z/d913vqD\+ZH9HzT2P/3B\+x66/BH7a4rjp9jXfWbbpwpM/OPpex9Jra6dYVdNafVMFXMhUfL6y4qW21imV3LRMfax1xHC7NAA4590y59Dmp\+8\+CrVf\+\+8bHv1K/Ymnt52l677jXz7lyOr/\+XRjydyV/3DPhpUXGn/yxs59rct882unvbv7bAboGUtuKm1\+vb5\+zOj3YjZ6yaPL1sw9vfGnyu6zU\+oe9Ysrv9LYrOyEDNjo2qqTG3\+yWT1LKpbyW2858dg//5faZZ33QGDdLbD5f0UeO1u65Dv\+Nf/jK61rle3mxFuNmrf0nhVzLmz8mbK3uaj2rnvWfcfXeELZPeXuDd\+5rllR7nudVPvu2fCdZWvObl79eufE1zvMwP291mz1NbmOyo7n\+rOX0PxWyeoXht/aZ0llChrfLl47KgVn7Vu\+vI/LXOY1nDVb90CHOMW2\+u2BeDtTuG1H0bzlXVsfza7eVrR3ZPqlamHy/3igNTk8xh7KADucffMW9CyvLNzyt\+KNRemV3yCpw9QhCoAA2LJLvtRTSxzhYYF9KmlbG6Hz//5AGWCSz7Bl676RXD5Qq2EZYIB0wd78rcvW7BKuZ9E0ALDWQ\+\+aB3pTZ22HnKS6pXjtvoKKTGG9s\+fxKQWHzlocUz6efWk96dhWlN56L2z8XcnudHrDo92OA87V/aPcc7VfSq67Jp\+OBrCOtXZbdt5A/hAA4IJt2z57ozWzbEn38hv74GTRxidL9l6wVHPgAEvrScfa39k3X5das7TjuQXFj22lGnsKmpNZF\+RSpACmpeqcNjXT9fwPCtUWi6syXX2y9P4dH9rAk4oawgEVVq0dAI4pvRse7K515hwZqOKSL3K5jgOu\+w/Y4Cy1XOhelnQ8tnXYMIQbu9d4\+lpbIAWWjpaiVdusrZlc7RTrsq\+mFqULtw8M6p74sZ5Qda19y7/WvegaaF7a8SJAKmkLP2OFTMGhvw0bAp0vmSnYvo3eDlBR07V1cV/9Duu8pe2bqi\+ahyldsPe/qDG\+rWMdwWHx83gZ4Oyy5e3LR7853r7kam/MOE4VbWkY/htiqT9Q\+hgAAFS0FnY4e1cs7m3cba8nAGBpPu7oH\+Aw5vG3AoAllYHqmh5xMal1Fu7d7bz/cGEHlV4EAD2FO/eU7nytr25x17ofpBb9ybW\+wdJ6oaDCmQOwdGRyi76UaX3Luky4UNdob4Y\+rhq2RFzbJ7gvw\+rf2GRthT5Hpm/lo6Y48G7rWVvjrPSiyuzulitL\+yOEEELoE\+SKrkR7ew69\+Lp6NgNg1jdcgLsrqkoouGNu1dk3Hv7zkUNdAKdeDF933eN3fG7aweOHuubVzil1NBfVzoFD\+45W1FxbZa9PzZxTDa1bTlwc5qVb33p58\+vvNaehdccby27pz9bu3PzbQ/bOxrME4I3NsfmLvnZd9ZS/7z50pH7pomU3le59yXRUzeNKWnerpy91dVIyo\+5rt89Lv7e\+wYRp85fdRB3684vbDrWloG3L719f8m\+319XQu04AQKZx3/6dR9tSQA2bXzRTv2v7/a9nmk91pgC2//nIsh/Pq51GXU4AbHXRThe0dpztbDXN3c/Ku58FAICzLz72z6\+nzra1pqFxx6uLbgnU1kxxvd55ZZdZrmtyrfucj6nDL0lz87jkxZfOKcjNW9zx/MKLhyKDemDiG8xVVKZXfLmrzmnf\+EoBd2PmkGptBQBnes3SVGpP6fYFnY//Q3bV70oGYmBLa5Nj78meRVNG5Wpy825MzUtaUgCpVvuWv8G8R7vnQVF9RU9FS9Gq5x1wR2/dgp411sLUBWs9ZBfdmKlXba2QXXJvpzhsQq\+L75uFtKVeLV2tXtGkOGnLoVeKNzcV1h8vbIXcvIVdGxb3cE0le4mlw9ZXWz2w3bSl/qzNBYVbdtvgps7lULy\+0bZ5h/VQBuDj25fmxqItF5IrFqZT0MMlHasaC8Dax82C\+ved2CwNkC5oTBStHb0hS3MTtXaPNVXTveFhss6WczizVdaBGqYt9aorkChszoBj2I9Ka0PJ/Qdg0dKO2pbitXsK5n0pue4auDIdLda9DQXgAQ4AACqqezY9auk4X9jYk1lxX0/Hn4vUC/bVETtQ6Q1CR13GrkK2uTG37BvtK27qa05Q25y96/6hg1Op7W/bmp2pTUt7U\+f7u2AcRblaT/eyO1KctXDnS8WN0Lfky\+3/576CQ28Vr33WPtFjPQGOoiw0FQe22SvuTS47mQ96s0sAXJXpJTV9KYDqaTnH2aHyrgqy6RspOOxcf7jQcbL00PMFjcQCkK37RsfyVudjewocU7KudG7ZqM2MewQ/XLkqJ3S0FjaPMyqhtaF49Q5Y9\+Xk83dA61nroQbH9tccu1vH7ilwTOkV70hDS8mhpKWjqHD3btf61uyKb3Q\+tyQHkKualk0tNxdlLACQOm9bHylVLxSkYOh26FRP4ebflaWmpJ6ozm1/oWQn9G56eIIDP4bLclz3hvt6O15zPvzC6JnAqm7sevyBdqWmeP2fKZVAx/lCuLXruX8CAABrtvqa3DohLebvxO6xbu65/I0jhBBC6KNyZakY0mqS/kurdCZlszpspa5ppa7rFj33h2ET5Z6ZUZU\+ojbDypoKV4OztqRTfeNE7U1fmDeNSn1\+hsusP3ShdNmPV236QhEAQPOrgWA9QKb1bLIjDQCQ6kp29FqrqooArK6quSsDty\+pmeKyAwBAZ70DINV8dOeJReId11Xtq6\+4ZY7r7JGdpy666Cmdsuxf/3XoArHz\+JZfRrefyjhuqqiwkUPNyf7xpV2tzV3W6qoixwkAIK1nkxdfODpKKpZ88\+7ltbOqSvNvXKi3X1ajdR6Kvbq35p7HfzHr0KGju9Wj6lsn6s0M2EtrfV9ZececeVP6xzDXv35Zqx0ly/UPpxyUc1A5x8mLCqYt9XucD4\+RAe6snXjK0ZlZeS\+peLs0cMDWMa1n6zdI7dulu5NQNSu1qAK2NNm2JMr2zoJhsx/lXNeka6uzrp7MykfNiwbBkrq3Sla/YK32kFpnX9Xy9jpbDjqy6x6ALUlIkYKKWZlWtUidQlbe2LftgK01U7D7BdfuFwAAHFR6Dd/JNZautZIl\+dDCmq2tzDWe/EAZG0dFegXXWX3WsZtkllRadv65VCUAYFH3uO7bM6qsHSBXC\+CgoPWkvXFgf2s/jn0ZGEqdc8zq2Fpkab6QfVzIbHveXr2kZ9m\+0m2XXHDF0pyruq/qmq6tHmg9m99izlVk2bu7ePvhQoBcLZWF4yUjZ67OLVrasbLI0krGS4Tmqm7s3jDF4qrsc118Kl6RjhZrszPTcaBos61n62JI9Z\+0Oe7W7rppkGq0hf\+WW/Ng97wmx8Y/w6Lqgm1bi7dVp5Yt6F101rr5uGPt76zzuK7lAAA5KEpz1bn63a61DQXc1zrqmpyBnxVXz8rMKypszlg6Jnqs318qaVUvkE1CT8WUrKum43mu4NArJXut4CjKrLg3q\+6hDqklG/vbHFyVZNPybq4IDp0vSIGl48Lo6an63xyZw3\+fI9gff15yCHTLRHfn/eYAK1DV0vvUkoqKzJJbe1ZwXU/c0dWcKH3sGUc9AFhz1Xe1H7lr2NpOOTb\+2VGfAWix7wQAZ19FkWXLk2XbLhrS7CAF42w6B870snu7OOirdcKhie5H/7K1i5NPLM7t3uHaZu1\+fn1nKjmQP4ecy5mr31H28K/sy7g\+hw2AWA694rzvlf6PXZU9W7/Rt\+V3E73TGCGEEEIfrysKgMe\+qSrT8eZfAz/ZXz/iU\+u8ty447rhu3pzSqvTpQydOg0lxc2fAHGdrw3vN3Z3Nm5\+8n7YCAHRdqO\+uqAO4\+FmL9mnz1v3wHu7s/rVrD\+49YVbc9ZDyzXw1zL373lv5nfncnGT1Tc7Gl95tvHj8c2ePuuu/tjT0AGQ6LlyoP9GWj64dYB33oY7psQYA28qXrQyIM0\+Ef7l551unO2betvXHt4zfQGPrOLr/se//vWLO55bcMX/Zow\+t6T2y6n/uav3Ssg2\+ot2/f3r1vhONcO26DQ/VXu56RyhQ\+4dTDspngC/eo9y8W8fOAO8db1qeiyVt6383cO/xWftu0rH8xr69ByycJw3HS3a3WgAK1eMDha19S77ctW5hbq9Mh8\+mNz3ak/qba9UBy5Ll7WJPaeBZa0V/ptqi7nF9aU9uHpfcMIt67E/2VsjVLu5NnbXtLurjkoWNVmhtKRz\+6B2HMy0uTy6zFj32vKP\+mtySpWRRo736vs6V0\+yrIyUf5NE7qRZq1Qv2lcuTK92W7XJZ\+HhBCsAxJb2c660uApczU2UtbLxgSWUK1Neona3goHJVlZkKq3XgAv3j2ZfBodTVC5Kbahyr/tQ/9Nf1fN8TD3TXncyNewdj0rblBap2eV/1a0WNC3tALd58NlvHZVoPO9SBTacyUDU6fMo5nLnm3QOvbEPfYgcFkAQAS/PbHzADnJu3OPncwvws0PlqFDYm09w1uSpnH5zvn9rKNYus4WC3aps3BVIt9i0HMssr\+7iFmUWVFgdkWgE63i7adrwAABpbCqr612yBnsKUM7VkSeeSJTnXlKzruvy4d0vja6XxKekVEz3WE2GpP1AaOJBb9EByWWvRtqbCQycttbOgtdGxu7KnOmlVk5l1DyZrdzi3JDNrvtHjOlCypab7sn4QJnAEcwAF9a\+VPPzCxTf6Zhfd21U3FPhdUsbSmgRXRbqasrdeKttqaW21bdth27Yjyy1OPvFlUldprz8LkIHmt0o2qgUpgIobe9Z4YNuzJduG54fTFijKiMKFFZlhb1qzFRn7QA9ObmCsQc5hBZcVWsECSduVZoAth/a57t5nac1A1YKC5gT12LP2gR6HbN03kkvSlo4Lti0v2CAf8S7PbBt5v/GA3Dwu\+cSN9oe3Ulc\+FR9CCCGErqYP6Wa8dGfrWeKonVFVAvUmAIBrWnlFr9loZpob3mv1zVjClULzi81dFxzNmWVfmLdoWqY\+1toBGTh7\+tDgkL\+SCgBrRVVFhe1ERxocJc4Ke6ajuccxbV51ibn7z3t3HiUApVxNRQWcBgCATOtbBw/1\+ut8X3CVtG5/q3Ws6zbS3HB090W31KYutLYCVV1FOQ51pgBcdEVVSaa1uWfcK7\+SKbUzof6VvVtefy8F1uqq66rtMPHMT15/m5x4Z9uJd7bvu23rj29fcn2ZWjMl9daLm2PvNqbBMefaedM\+onm5HTBuBpi7sipkCne\+Zlu\+pHtZ0lpXYd28zdY87EOHM73u4U6ux74xUrw72bdieU9FY8mqRKGjkiyvLNi\+zdoKkB9wXlrRu\+bWtMuac03rq3aSNQ\+kUxkAZw56LPUNBcvv6Bap3KFn89fuuarKzKKFPSsXZhxp6Dhe2Eygo8W\+pSX5\+I9IR0Px6iepD/rgWVu2urLP0VS8/mxKfLDdscO19kBhxwXblr8VLKrOumoyK52FjRcK976Wv8sxW3VN1jWtd9EUR\+PARD4rP559yS65t7vOCXBNptqZW/ONXshYtz1PqSeLHotkqxd21o6MQh0ADshVVfY5Bn8QSOHety3rOFIxhSy7xrb2bfvwB\+009z/GaVBu0dKOFQP/rr6xa02NbfOBQldN98pM8cM7rB80A2yFi2eBBrAcaihctrBnBdXXnJ\+0ydq3/D4CidJtLWTDFAAo2LundC/k5n0pWUuo9TtsLi656ca\+bW\+PTqSneqzhZ6mNU9KLplhct3bVNRWHTxY093dMFE7wWE9MdtmDHcuTxdtt2Xlc54brih/bZgfIzwJVWLekc\+uUvpRaurHFkgLb\+l/RANnlNRNa72UdQVdRLnV2zCi3YO8Lzr0T3ZeCQ29bUw/0rriJOjQ021au9kvJDTfZ1j/tcN3RXUcc6/cMjiUuaGyydmR6Xdb\+eZtTZ617G6wdANBY6JrWvnIp2fvkiOeHp5K28DPOizPA/S\+ovhVLu0Et2pvuW34v2b3Vtf0DZYABMpb\+qhJLx5TeNQ\+kh2WALa0EHMMmuEqlLamx41sLzoOFEEIIfcJ9WOEWqd93tPGuL4rfea9VOdJom7tu9X\+vPqQ8/PsTHWeP1/d\+YclNmfo/tnakSXPDBdcd8yp6j68/MWYPvc110\+3iXa3ht4D75qJaOL2\+wUzakykora6qcL3VWnXH3curIGUrdZUAAKTOvrf9EHnCtyD1RnRv82X0t6fOHt95NLOuzre8ObbbrFj\+zdvndb23usHsHTGqOQOdGbCVVkyjKzpzHWlr1cyKKtvpjjlfWHlXaQqsrhJq3DTyGHtWvuQfHllTcmTVphdV01o997oqW8\+hNtLRlXFVXVs95Y1mmLPia3NdXeCgSy9jtaNNcAh0zmHN1o55D/CU3KHLuAd4hOa3i8Kejk3L07ufLds\+MipIJW0bn6RTxOKaRTYt76k\+WbJqh73Rmll5b4\+rsXR7iwUG7ujrbLVv3GHPJ1KqZlEbn81nTZO1UyzNb1GHFnfUnS9d32KB/MOfHk4u6nFslssOze5aVwFgzVVNy7buK945q7PqpO3QFTyK05pzFWUdtpzDCi5ntramSzxMbT9g393iUBu7Hl\+aXHPetfZ4QbWne92XCrYdB4DsvAU9yypKH37W3upML3LaNieyi27q277H2gHQ8bHtS8HuF0p3A1QvSFbVODb\+aWjyp47Ro5QtzWetrh6otuZczgL1Faq\+B/Ipx8YE1cgl65JFqyIjpjFzFF08gDbncOY69uQGIgRLxwXr3retVc5U3bSBrXygDHDOVQSp9KiYzdL6NnXojo5lVseq4wUpgKobe5ZZ7ev3WFuHB41UX91Nfc2JwtYMuMZatQNyDgCg\+lY80LksWbQNwOHMrHywp\+It52Mv2FoBJnisJ6ZAPWBd\+Y3uumTOZS3c8jf7IQJLAACguZHayXUsayp9bE9/z0IqY5nYz/NlHkEqW\+u0NLZMLM17SY2Jks0L29c8aD5/I7X9bVtzD1RUk5V3pFv3FTV2WiqS2UX3JR\+fUrzlgO3QBai\+rnf5YlLV41BbCwD6RqwoU7htR9ESoWfdYmtgYLZwhy3nmpK\+OANcBbahqa0yBfWN9t096UW35n/8P0gGeEhzQ9H2GzuXnCzJT6NdcV3PpjsKtzUNTdr3/k2HuV\+EEELoE\+xDyze2vrVr1abMuu/co/zWDxda1H3/tfqPJzoAoKtVPQvLq3rUE50pgNZT7zWXLJjXfKL\+wpjXCD2Nrx93LOVf/P/YUhdObn/yr9tPZVK2\+s2vfOHxR1ceeRQ6Gvau2vzXxpXL1v3bQ6l/fnrbqc5D6vHmu0qb1eOX96jedNv2/6U4Hv3vK//1H9fZe5ob6tdu\+q\+dpzKOOcMLZRrfqq//mu/x8KztP92y\+c/1S/7Hshe3L4MLR9dv\+sveu766YeV3N1n\+OtFr33Tbzt9Fq//h7k2//n\+qSm0AF/Zu3b7l6LkUvKp\+4StP/PZm6L2w80ll9ZuLHn80oKTl\+zefuKKbVyc4BLpg97P0fW\+TdYszu/9cmh956KggW4Xu1NvF2yb2QJeL5KprepdVZsEG8xb0cg1U/5zJ/bK1t3aJC9PVVuu2Ha7Vbxc6KlObvtHFJYtXPT96vplBIzsCctU39XJUQUdlj\+ixrj1Q2JG0r/3FNSliSUGuthIczvSKB3tqwbFxB7XxmeJNfMfWyuL1OxxqcoK7k6uuIWvuJVWttsaazicqHHuPF6961rF7IPKsP1x6X0MWSIFjSu/KL/Ud\+ltx/bTOFNg37rau\+Vpq0TRr60JS0VCyPZGdt7xLbHKuHznd1Ee7LxexZquKLM0XL54p3PYnp2NK6ok7CvbucG1pBbDmg5Nc1TTYu8cxb0maq3CoQ1N2Ww7tKZs/\+p7YS7Mc2leyEQpSYGk8XLLeWnC5J7bD2cdNgdYLo3Nujil9FRSkoK\+2Mru7oaD5cMn9DdBBLFVDRXLcrV11lH1tonD4nEnDdVywNkLf8ge7Vzjta/9kdyxNpS7Y1/8ZHl\+efDzp\+sHb2Ss41pfQ3FC8\+k8ZjuuqIBbugeSGF0r3AoA1u2hhxpEoal7cvaG1dO2By7lx/TKPYFU14cC\+vuUKH/09atOb5bKO\+zrFW8mamwikLfWNjvDm0u3HC1IArWrpalv3igU9GxZ2Vdig43zhoYaSh/c49iYBqNFr6mih1u/u3bqkS2xw5RszlbSv\+tnldZakkraNz1pbkwBg3fJsSUcS4OJHlE9IgZooXHkf4RpK9vZkF92acp0taRwZUDuu6V0nXOif9WrEJFg5B5V1tFze/BAIIYQQ\+ihddgCcOrH/fn7/wKtM/c4n/9vO/n83vr7r4dd3jV4gbe782c92Dls88PX9o8sMX//ZN1Zv\+suI67\+0uXvzr2o2D72x95//3/UD9a\+aNsV14ej2sR7J23F0133LL6rP4IbME1s2/WrLpfYOOo6\+HFj\+8sCrZ7700jNDRd/61c5fAgDAi29eYndGrPzsuxt/9u7GUe8e3f8wP7xBnv7SuFV\+f44JZIBdzr7a69KLPGRZTbbxQEn9QFCUaqUeixSsvK/78X/qqVdL1vc/vGQCrNnamtSKxT11lZa9z7u\+dBjqHuh84l966t8u2vaafffx/NW8pbnFvn03pTYUuqpT6/4hVefONr9W\+vAOe2MGwJrlZmXmzbroKS9DcWOuytP5RI1189ay7ZB6/OH2rRXOx16wDc665HBmq9x91X9xPvaKtRUAko5VT1rWPND1xD/17P5z2dqJPNbYmq1dkO54xRU4UNhhzXI3plYs7l5z3\+jbylOnilf9/8DRULKxoaBqFjgAOlodq560Lbkvua7Svlq2thII7\+t94mtdy7eVjupK\+Mj2pWJWaqUn43L2VVdmqiG37hu9rUmretjenLQA5Cqm5aBnzEA6l39IrIvqW3Rvl\+NA0Ua1eBUhjz/YrjQUr3\+pkPtq17JpY4eRgzqaqM3N\+RQxOKhc6jAFAB0XrPnxqB3JwnprzkFlq6bkhh7ne2nWvrr7urge\+6qTFpezryofO9lyrsqeTcuzHa\+47j/bu\+EbpvJ26eod9kYCALkKZw4yAM7M8sVdazywXS5SM9kqZ67qmhyMTt9ZDu0p6fhSp3ih5OEdha7KdJ0zm8pA6/GiVX\+y1FGW8ml9V3asx5Gr5brX3dFbTRUcetu\+XbXvPgt1XN\+ihUnXgdK1z9u3t8Km5e3PLyha\+6f\+nO2ob4RrSqa2sq/2mhyMPVXVJY/g847Wyp5N9/Wpfy5Wrzw/OhIp3PZs2bZnx/ooU7B7T\+nuMftKiG31v48Kbi2HXimb/woAQPWCzk2LMy7bWAsOShfsjjnAmU8RQwVVWA8AmYL6/mYpqG/Juay5iikZl3XiA5Jz1Qu6Bjadq5qWfeIHvc2ZXNW0XOp8p3KTBfKjsreV7G4pun9d0XgrmcclH79xoptECCGE0EfvI7rj9Oqgqm9ZtO6b1zbvkPeexTFnAFYAq\+XQHufDr1wiA5yd96XODTfBobeoVTsce0cOrO1otW/cat92HVmzhCyaZqs/\+X7X9Na\+FY\+2r6vOQU/h3kTxw9v6V7h565Sds1IrF/esW9m9CaD5/7ju/5OtscHRCACQ5ab0VSQd6x937Dw5EMsVZZY/mKxzWrdttQ5kgy2tLY7tyf7gubXJsXlH4d4GW30SAIoeDtvnQcHwxxrXqyWPHShUW4cNU7xgX/87\+0Yq68pMIPoFgEzh9j8NPDg0U6AeLlIPj3eNC7vfytZ9o33NNOuWHYUpa9\+KhztWFtnXb6PycUXj4ZLVRV0rF2T2tuRvhP7I9wVykC7cvY86NHKGLaDSm37UsazIuvnJUWnYnMM6ENlaLa0t9s2vFG/JJwkbigK/si77Ul9FX/45ye\+/6Xlf6m1OlD72rLWC61w3bfTHjlndz60k1edt6/82wX2xtDZSa3dTe3uyKx7tWFNh3fi3wvpkyfrzmYqkffvxghTYAicd3JSC5szADjoLtj9jhWmkblphWC7edrwAnL3rxOQSm3WzbB1q6oylI20BsBx6xflw//2lnbXnqdWNhSmA5gZqMwBA0aqGyzrW77cvFwrrD5SufW2wdynX\+HbR\+n2ObccLUgDQQj32Cxs3fOJ064gY2DEltYEnFWcda98e1XoTOIJUX7Un3bynNDzhfPXHovFw6f2HJ1DOmd7UY938jHNLMrOBvyigt\+bqHjY3uKF\+X2n9RG\+et0x005dcSb3qunvi8wgihBBC6CNnmb30Xz7uOgwombPh5w/Vvi4Hfv/eBEYAli754aon7nY274s\+tvnv9RfP//xxohatXLlp2quBn/698bIGZn8KVUzpc2UKGscdmpurquiryBReye24nx4OKusglz2yF30a4bFGCCGEEPpU\+yQFwAghhBBCCCGE0FXziR4LhxBCCCGEEEIIfVgwAEYIIYQQQgghNClgAIwQQgghhBBCaFLAABghhBBCCCGE0KSAATBCCCGEEEIIoUkBA2CEEEIIIYQQQpMCBsAIIYQQQgghhCYFDIARQgghhBBCCE0KGAAjhBBCCCGEEJoULOc7uj7uOiCEEEIIIYQQQlcdZoARQgghhBBCCE0KGAAjhBBCCCGEEJoUMABGCCGEEEIIITQpYACMEEIIIYQQQmhSwAAYIYQQQgghhNCkgAEwQgghhBBCCKFJAQNghBBCCCGEEEKTAgbACCGEEEIIIYQmBQyAEUIIIYQQQghNChgAI4QQQgghhBCaFDAARgghhBBCCCE0KWAAjBBCCCGEEEJoUsAAGCGEEEIIIYTQpIABMEIIIYQQQgihSQEDYIQQQgghhBBCkwIGwAghhBBCCCGEJgUMgBFCCCGEEEIITQoYACOEEEIIIYQQmhQwAEYIIYQQQgghNClgAIwQQgghhBBCaFLAABghhBBCCCGE0KSAATBCCCGEEEIIoUkBA2CEEEIIIYQQQpMCBsAIIYQQQgghhCYFDIARQgghhBBCCE0KGAAjhBBCCCGEEJoUMABGCCGEEEIIITQpYACMEEIIIYQQQmhSwAAYIYQQQgghhNCkgAEwQgghhBBCCKFJAQNghBBCCCGEEEKTAgbACCGEEEIIIYQmhQ8lAM6kejOXVT7Z\+2Fs9hNoZDuM3Sy9nQ3HzNRHVCGEEEIIIYQQQv2sH3gNnQeU/y29BN/652\+uuJ6aQPnMiRf/9P1n2m9/6P4f3sk4L1ky1Wt12C\+nLr2dJ06S8uvLL7nafqmmV7//8/0t5TeH/vmu\+SUAQE4cO3MuPSpktdqLp9bMLnW87\+q6jFdfevmXL3Yt/dG3l8\+2AkCq6fV//Pl\+uGPpTx6oLh/ai85Xn3rqH/dlFj/27Z/cWT56tb2dDY3nkjB\+b4KtrGZWufOy2gQhhBBCCCGEEABcfgCcaWk61dI9LELr7dzzTtu57tTjG/547pE7F1eMLG4rqym3tpxuHwrqesl\+9dTp7tT2J/6zrf2\+5SNiZquzfHpNRf87qaaD//iLN5y\+urW\+KufF2wUr2EpqRsS6mRP7nvvuU03JWV/87T/f5mw7d1E0e1EA2Z06nQaHDQAAzMbf/Py5Xd2jl7BXf/m5tbdU5hfpNXY88cL2lpGrTWeS7abe3QcAAI4Dx8xls8sdkEm2nkt2d7351z9\+5/S9v/7\+zXP6N0rNmT996r6ju57a\+fnZ31w\+e0SXQer04Q0/3/NmenQdhtV/9k9\+/s2lFR\+82wIhhBBCCCGEJp3LDKV622K/\+c/HT471UfrUH5744x9GvVl83brvlv/\+f/1dH2OBVPyZ5\+Ij32Lv\+ubvV1Q7AQDImy/\+fX9bu/3FI3Vc1e02Y/uv/vOp0yNLl8//7YalC0v6XyXfeenHTzedg5J7fF\+ogTObfvHH7e0XbbP4up/9/Fu\+fCxqswKAHQZzzFYAsFd/WVl7y0CwCkmzraWbmjoYMKdTDcdOvdmWf1FYWmx12ihHMTV1dvXCGeVzr585/4bqmgorADmgPBs50p4qBmiH0wdf\+se1b0ytqBa\+f9fCEmvlrfetP3bu\+7tO7Xjx1NL\+nR3BPusLa33Ujqf2Hyy\+bvVDNQ3PvLCzbeqyR76Q2vm3nRfv0Qjmnl899Y9q1wzu/icfu7HSDqmWxl0vv72/8dSRY\+dOpwtnzGDmz5//rboF82krAKSO7f5O8O9HR6zBMWMGc7tv8Q/vrhpVscsq/KFLNb363bV73oSpq4KP3P7OH7/zzCmY9cXfrl0yv\+T9l0UIIYQQQgihvMsMgO3lvu99e34\+E9tr7nr6he2ngeW\+vPqOcocd2g6/vOGvp3pnzF/70I39KVNbWWX3G78HmHrD4rVfYS4xdjfVdHDD00PhVarl7afUdgDoPf2G9AvrL743DwCg/Au/3XDfwhKAXmNL8MnHh2Vrk8delX7x9zfThTd/5YG1d5Y7esH7wJfn2kory6j\+ALcXku1mSzc1xwbQazY0tre1nkmmobf73JvvNCbpqXOKAQB628\+8\+U7jOTsAQKqrs6XNOv\+OG0cPVLbNfOSxO2\+jx9iLZFvTgTbH1Bn5z6yOsumfL\+v/qDdt7vj5z77b2DdY\+OhLf7zzJQAAKJ77Hz//xuKBFdpLpn/\+htL9xQA2uub6mVAMO23U3Nkzk8UAlwyA2w6//Eu1C4qvEx6oqbRD8p2XfvTz/QeH8sl9p0\+fOn361C618SdrH1haOeahT50\+3bT9qf880f3tX9dVvd/A78sqPNbyLa9/f\+3fzt31beXbsye8uLXmri8vf01\+6uTBX740/9d1zBVsFyGEEEIIITQ5Xe5gWmvl7NnO1uaGthTY6dvuvO7VZ47rB4/sn3/X4rLON4\+c6gSYe/3MqQAAVnvZ9PmVVPKd/ILtb77TBZcY3Dt8uHKvueeZl/d3O7xfuc15cM/Oxr\+vezqzMA3Q3rT9md37bQDpziNtAMX50p0Hdu5Y98zx01Difei\+pa2vrvuNsfyBm2\+/\+5bxNpU69saGDfvfzL9oO/Ljfz8CM7649UczwTbwcpBt5k/m19SUjGyl9Kmnfv3Hp8bdE4f3se/\+IvCtJwOj3s\+0tRhL21MAkDz2\+oZnjttv/vLau8oddivYSmro8Vtmgnrb9v/1bR1g7h23L660QldTZEs\+\+i2re\+i\+R7iZ5em2AwffeOrZI2\+2H40803Dbj24cSNuWfWvtd//pBgqAnDh8\+DdP/W1XW9/BF994866qhWPkVy\+r8KVlWo7Uv5mGystdroRZ5rtuxxPHD7749wN3LL2dvtzlEUIIIYQQQpPUFdxNShp2Pvfdl4blItNnhg9\+PrrvhR/sAwCYccfXn/lejb28\+ltfgWS6bftfj5\+\+eGUDpt4wf\+lXbptxw1Q7ZE6ouzcd7ILyebddz1RWfjH5Yufiuhp9yxuQNhveaWqxAaRJS/dAAGyeazh2Llk2c9VjdYu7X/7\+08dPwxnH7PKp3Mw59OhJuVJmm94OU/MvyspmtLefLpvKdp/TB0uUz//JIwPpawCAksryi5uozHtHzZzii3ci0/LO4V0nAQCSx3Y/OmLAsMP72Hd/cWdVeSUAQBIanAD2GTMXLriSxOmYUqcbth/rA5h\+z50znQDJY2/vPw0Ajnu\+/\+31t9IAAFC12Fe1cPbUX77czs4vG2u71JwFN/\+w7uirTzV1tp870Z5ZWHKJ02Oswr3mq7t2/ybW1NCe6rU52Fk1j3x7ydLrKQBIHXvpO8H9R22z//X7c9985uVduTlfsWrPNgMA6Lv\+k9s19ZHgIz\+8nmo7dvCpZ/\+\+551zp9MOtrp62QN3LVtAX1RVa\+X8m28rO76zrWHnO\+bt/XuHEEIIIYQQQu/jiqdTKrnnofuWzcjsf3bHU419c\+/48vLi\+n/fdaqzeOYjD915c/rwpqfq80/6cVRUfz1QDQArvg0AnQd2PrfumabTACx3/68f6w812w7v/scnGpN3ff17C\+jeY69ueOroOQBoq/9puB4AAKZ\+Pv/YpPIFa4MXDYGmZy//0cplvdB7\+qD06/rTUPj5uxbAzj8\+8PQ4FS\+b94tH6XFbYFQGGKav2vDIitkjyxRPX/rgksERy8Nkjvxn066TnQDgnPHF9Wtrhs3n7Jg6o/QSrfmBZc4dO34iDTBj5sJyK0Cm5Z1TOgCUzb7nhhEVdd5w\+9ob\+v891qOYrGArnPBGRxbuNWNPPPUvahdAyc03VztbG\+ONR3684Uzb2m\+vuJ4Cm8MBAOm2nU83v9luZWdRN97yBeO/3tjfDqWz5i6dX31buTV57KV/3LD/zXTh3BvmzjEb9zfWbwqfS\+UXH4Wefttsx84jqSNHziVvpa/2HcgIIYQQQgihz4YrDoCtlbNnVpq7Y419UD7/hw/efDswbcf\+8Hjjqf/9YtNtD9DOUfFVr3lg3/5tOw/H2/rAVmhP9\+nq8xtumBq6ObPnmRd\+ue/MOSip7M4AZNpa2h0zZn/L9wX24O6fHsx4H1y6/PqyyhmZ7QDQdnhD8JQznwE\+DVA\+VBlHd8OmX/1tfzeU3nDXTx6obqmEytb\+4DN1umH7kXaYMXfZfNoBUFoxm6VODavZiCmd7bMWK8Hb\+yfB6u1sOd1pL4dUb8ZhH2goG0C66813Gp30RU3SmznRRvo32t60/dm/N3QNfGQr8QYemEOP29otL//hwSeOd\+ZfvPPCAz/K/\+uN7/7oDQAAOPXToAwAAE0//lHoxwBTb75f\+dGNQw0AmZZjZifA1IqZlSUAkEl2EwCAYnqqbbxtjiHV2rgtdrwTAMqn15S9z7kxqnCycf9v1K6hMdK9bTvCT/34yJmnnnnb908392fdoaul8t5nf37zHDtAr2k9dHh/e1/5Dbf8MDDbAZkTB037jOm3zb5t7SM3Vqab/n3tf/6h7Uz8HXP59cxFGy\+dM4uGI2fOtRhtvdX4XCiEEEIIIYTQRFxxAJxpObD7Ry/Vn4YS793VjtNNBwBq7r755tN/P9i4/0dPlQFAPi\+Xam3Y9vTLfzh45hwAQOHcm7\+4MN3whyPtAKn9T//xwae7TqcBbNO/9dj9P7y13AEwh/uid99vf/pEU34z8Wf\+dxxgxvwvLgQAsLadPqMXz6zjahbOzyS7ral0BsAKZuMvf/Hs9tMAAM7y8nK6fI7vrtsHKpo8TPYcOeK44Rbh27P7q3RseABsBQA4/feH/xkAANr3PLBiz6hdZe/69u9XzB5KM77fPcAAALbSudWznUP3PFsrizNth5/9zr/XD40D/6vM/RUAYO5X\+F/fukD4SnlL26ld6qlzZTPr5jve3Hdct029h5vedrD\+YHfJzdzM3iNH3\+wuue2Omppi69Trp45Me/ZHvPbiiTyKeZT2Hb956s1iK6Q7T5zu6gQAmPqth\+4cZ4Ll8QqTIwcadQAor75nFgUAYKcXckzpkabOpoYj7QsWDzTOwjtq5owdr1rn3P3Ak3cPviypLANog5Q59lOR7bTVDtDb3ZVMA2AAjBBCCCGEEJqAKw6Au3btyo9P7rr4aUbOYqp3YMJiR3EJtLadg8K58xcsvXlqy8sv/6ExNbV63m3php0nu04DgG3m6uC3lw8OM7aXzr/jzlU3U453Xt50kLDVzNSSqbdx08/tBCifvbTy1B\+OOW6ru2thy0v/GP77jiYIf2/2K7959g8n\+\+CDKJu7ygc7nznaNuu6mrbjb5bNX/tgDRx5ecNLnYsfXLJs/mC0mYE0AJR576qZM0Zmdege4MGB38OlbDc\+8tDs8nIaTg9OgkUn28zeSrp8dtXy2Temml5tOHgqVTn/kQdKf3PkuG6bveyBLzQ01R88Td/juy3ZcvTN0\+X3PLBkrOcAZ1LpfGtbHQAA1qkVpXZo7203z11i4rEBnW3n3hz4t738uu89snTFgnEHbI9TuDPZngEAe3GZs79lrPbiEgdAZzp1bmi\+7tLK8R9inDKbdj378raDzUfb3/9oOooddoDedKb3fYsihBBCCCGEEABcWQBsBwAoue2OG28ra3vqr4OzGUPbgZd/vMv4/IPfXn/DUSl4pv9xuSVVX//BNyrfaTqovv3Lp97oBcfN99Qtsx3Z9Nc\+AJgxo\+Tc6bYDx8xls8v75zoyT726b/8fem/8XqUVoE9vPKVDZ81dNQ4AgNKFd1TvP3Jk089/az997jQU3jy/5nNlhe03zL5tds0j1zdITx2/7J3p7kymAYrp\+bOscTiaqqxZNvvcQfVMwzF4c9\+ZXihsg7Ka2QPRYDdp6QYor37kwfGeQHtfCAAg0/Lifz74VFPnsA/mfoX/faDm6/lJsN750CfBsjqKAQBS3ZkUgBOs5dfPZOHU0e6mXUfMxXfSg\+WS7\+z\+0ZZTlXfeJtxTMzAseXBi54kYr7DVWWYFgN7u9oGUbKa3vSuV/6gYYCAGLh3vlOs1tv/iD5sa\+6be8MWfPVZdDuaup17Y3jZuPVLdqV4AsFkx\+4sQQgghhBCaoIIrXdDK3nnn0htKxwg/bNTw0bnJd176UfCP//LU/u3vdFbO/\+JPvr9k/umX/uWvTfkR0ZXzF9xWnIrv3H/AHFiguMQJmXONb2xS\+3PIc\+\+675Eb\+sNN5/Vf/NYNjnOnz52Gsnse\+tYvArPL6Srft7/16\+/dzBZPPJjPpAAgDb0AkO46BzC1cvrU/i2Uzvd98WY484e/HnkzXeJ96Nu/qKsa3J1kW5PeDVMr8/fZvr/P31X3q7Xf/I8HZ1/V\+a8AAMDqLKYAINlN8hlRZ/UXlt1QCJDa9cR/SjsbGkwCAMmWt3\+55e8HT5/ac6RzrBmwPgiq8vrpUwGgrSl\+kgAA9JoHDhqdAPYZM9/nduLuTC8AdJ87cLoPoPDzd3zRt6D68xXWtm4AgN5035g53l6T9ALYi0ucl3OTM0IIIYQQQmgyu6Ih0CNDjtMH//aDg4OvRs8h7Kyed9vst3vLvvBI3Y1Tm17e8MTOo2mYWv2Fb1We\+s0\+s/z6\+d\+im/Y/c2TDUzN//djNc0oA7MzSh\+6Kb/jb/nzOsGxmja1p/zszBzZNL7yrhn3nSEv51Juvn36F0/8Wz176FWhpb9u/r/2cbWrdA3c9cldN5emX8h/aZ9y4nPv7wX3tn//KA\+t9VcM2QRpea9Sh8LabZ05su4XO2TMX3lDe23vYCTDGM5DHGJx85XOSTZ1daof2ztYzbV1QWQJgLx9oxvZdz/zvXc8MK1s2958eWjDHPuYs0Feu/OY7vze/6adHzj318982zJ9ub2mKn06BbfryB79YM\+a27NapZRRAl37wpQ2/abztbvfCGYXxxr74szs3HCtpOXIqWV4CJ7v0gy9Hrv/yI7NHLUxaTncCwNTK8nJMASOEEEIIIYQm5oozwENm3PzlX/3TN3\+79ps/u2fmGMGIvfzrj339h/NTu361\+eEnjhxNO277yjeVtXfWQGcvlFZWlM6/694fznecPvhCYO2ftr1jpgAc5dXfeuALdTc4AADaT\+3cdXBPG0kBQFvDhuAvHvj121O5uWz78Z9ueGpdrLHl8u8BdVTWLA8s\+WFd9VQb2Gd94ZF7auYMZHSTTQc3BTevO0J9vgze/Ouz62LNyYGlksf2/3JfO5RV52eTnoC\+ZNOpA\+80HjjZlYTRvQYw5jtXzlp5/dwaADjd9GZb/6xRjtm3/Efw66tunj4w1LlwxoyZdV\+p27rhgaWzrzjSHp\+d\+br43V99Ze7nizv3Hzwab7POveELPwt\+\+4fj3k5cOt/3xduKAbrP7FIbdZi27HtLH7mhrLSt\+dVjpObBr//Hj\+575IYSe3vT/nfaRx9k88z\+YykAx/z5V9oJghBCCCGEEJp8riQQ6h1IXTqvvy20doGjfGZNfmajWWXl1x/ZHnthwxFyAqDcRgF0Htjy1Hdfyg9mdnyeu/N7D9x8eyWVan1755EuKJt9czkFJczy73/b\+dT/3qAe/eUWqvJR9/7Nf\+q/\+bN45rIHvljH1cyHxnU7AaBLT89\+5PtffuTW8tThl6Rf/33n03/c9fIX/\+Of77qdtvamM6kR8wGThpd3/zJ2pq277TTA3OLCcTKF/eFiL2RSAJ2nj\+8qn/ezf75vcdmp3/z8T089Lf9fsZn3/Lcb/xulP/3Xo0fTZXUPLVk8/jROo7z50s4f9OeVIfnO3\+5/6NTp4R8PzAINADPu\+OYz36u2Q6YX8gOzM5AGsGUGRmuf\+s2vnoM2gGKH0zb21h0zapbd8PKb75zZ8fKppQPzXTsqa1b8qGbFONVzXL/kmaeXTHBfJlTYTt8e\+MbtgbEWn33775\+\+fdSbzutv//UTw9\+88Ydrb/zh0Evmh2trBl7WDF\+85Z2De9oBymvqRj7lGCGEEEIIIYQu4cofg9TbC1BSPv\+GYQ\+jLSlfeOttcOS3393XDsUzH7l1uhOoz/u\+eNuRN\+w33/ZI3Y3zaSsAOaA89aO/nuoE\+Pw9N8\+n8wsyS3\+wcuHdDSfKam6vzDjnTz9yevYjD93pmz0w2VJvWU1lyZuzF6x97M6FtBUAnAuWPPnzeTue/Xvy1jtvp60AGUj3AQCk87NAAQBVc8NMeOpIfsS1cDczOm2bzvQC9KZTA9lFq8MGU2fdFvrRXQtpAKj\+YXDlbftejuw85aiePbvXcBRPXfbQ11ffSk\+kdVLpTC8U3vzQd3/tK\+89/OyD/17vmP3FtYHSUY8dHmC1l013AqTSqVQaoJeAja68fvrNtql2G1U\+e\+bn0\+aJ0\+2dUOJ94LaF423fXn7bV25k3zlydN\+rr94901d5FXK8nxBdzbGdR89B4c13f3Hc1kAIIYQQQgihi1jOd3Rd7jLJluaGdqicVTXmXFDJ1uaGNpg6q2rOODNFpZpe/f4vjpT77lvtm10\+ZoneDNgvit96Mym79RJjj1Om0XA6BWVT51cOjLnt7Txx8lxv8fSayrGmODabdsQa2iqql95RXW4HgExLk\+mcXX7RkNpMvpsg1ZtxXFyrcSRbmhtaU/aKmfMrKehqO3KyayhPfgldZsPJ9lRxWc3sUaOsSUtLp738fe93Nff86ql/VLtmcPf//gc3jt22n3qZhth/Pvr0qd5ZX/zt2vHm4kYIIYQQQgihMVxJAIwQQgghhBBCCH3qfAiTYCGEEEIIIYQQQp98GAAjhBBCCCGEEJoUMABGCCGEEEIIITQpYACMEEIIIYQQQmhSwAAYIYQQQgghhNCkgAEwQgghhBBCCKFJAQNghBBCCCGEEEKTAgbACCGEEEIIIYQmBQyAEUIIIYQQQghNChgAI4QQQgghhBCaFDAARgghhBBCCCE0KWAAjBBCCCGEEEJoUsAAGCGEEEIIIYTQpIABMEIIIYQQQgihSQEDYIQQQgghhBBCkwIGwAghhBBCCCGEJgUMgBFCCCGEEEIITQoYACOEEEIIIYQQmhQwAEYIIYQQQgghNClYL3eB40ffuRr1QAghhBBCCCGELst1c2\+4rPKXHQADwM0333wFSyGEEEIIIYQQQh\+WgwcPXu4iOAQaIYQQQgghhNCkgAEwQgghhBBCCKFJAQNghBBCCCGEEEKTAgbACCGEEEIIIYQmBQyAEUIIIYQQQghNChgAI4QQQgghhBCaFDAARgghhBBCCCE0KWAAjBBCCCGEEEJoUsAAGCGEEEIIIYTQpIABMEIIIYQQQgihSQEDYIQQQgghhBBCk4L1464AQgghhNCnHvvVf/24qzA2/S8//birgBBCnyCYAUYIIYQQQgghNClgBngMa9as\+bir8OmzcePGj7sKH7JPxWnwGWv2T0Wbo0v7jJ2TCCGEEPqMwQB4tDVr1uAF3BX4jLXbp2V3Pi31nIjP0r5MZp\+944j9Mu/rM3bEEUIIfbZhAIwQQgiN7bMXz18Nl26lp59\+uru7u7Gx8eKPqquri4uLH3rooatZO4QQQmiEjygANrW4RnEcS71vSaLH5Bj4eN8EyqJPC2ISisYD\+hEjJgGa\+hCb3UwoiuYOBDz0FVRGV6Sg7g9L3itYGE1GxDQJRU/gd4MYmkYYD0sPvkEIdbknPjE1zaDdbmbiy13JZiahp59\+uqys7BIh7s6dO59\+\+ulLxcCj/oAQ0yQwoVNjfJ\+0v0mOEgq6SOrjrgZCCE0SH80kWMRMyEJAjBkTKarHI4KoaORShRJhv1dQdAAgWsTn9ss6MbSEPt4yRJf9bi4gSmKAY1kvL0qSKAq8qIy7BPoQmXHJxwn5o0\+0aFgaElYS5kVl/aG4OcZqRiO6HPAGZI0AgKEE3N6wZppaQht3WSPKezx\+QRJ5L8tyAVGSJFHgBTnxmTwLSCLi53hFBwAgeiwSGmr1kKyO/CqaiXDAJ0bf7/tJtGhk8IAZMcFNsx5uiE9QdAJgxgSPxy\+IYoBz\+yKDX2RiJGJyWJIkURBCMfzmTTamKnE04x5\+wlys/xQCACC6zPsk1RxcPi56/fLIvwtmPMQLSkKLSmJYTUQFv6DoBIyo4A3IF51hpip5BivgYRlm2MkJAGYsJATjE/gT1Y9oET8XCI/6/crXPKFe9CtkqvJFP3aDCxACQLSoEtMJIYQAABAjEU8Yn4lvSXd3d11d3SUK1NXVdXd3j/\+5GRc5tz//UwaQb3qfNOJYGTF\+1K\+Rx01bLIzb42ZZt4fzuBmGG3Y2GVHB6\+1/bSaU0PC/SdFRFx9GVPQFwh/iXwkHfcOGH/NrbqEdg2/Rn1v3byufuGeG4xKLIYQQ\+vBcnQywqYYFSdEJADG1ww0we4GboQCCfo\+gHW6CmgVumgIAiuXDMk/JPm/QYNih3liKgQjvjQy8JIZmeiJqNMAMvKHFownwB/OvKaCAIglZCEQ5JRbiaAAjJvHBmK5rDYRd4GY8gsRRrFcIhjxaSAvRUkhwf4K6fj/rjLgcTRw2pKDPHfZTWjRqBpSIjwEw46I/kvAPJRRNNRzgFRCjHD3sHBpEc5Ic9jND642qxC3mMzYUUBQQPRoMhJlwLL96NSxIiqYnDpvMAjfrDkh\+oDk\+GPKZEd0wxaDE0fCZZaqyrB7WdEn2yDyjx6IJLqIEWACSCPkl1RfgBlJdRJOFQEj3K14GiCYLwoi4ACi3EInwQ18Yaui/jC8kKwF21JYJRTEcHwz7jJAWGpYgy78dGjqAaJKhPHxE4U0lTgcEL0MSYT4MAS6hmHxkrIEB1Ij0qmkYhB6V9KM9XndIkGQvEF0WJY0NSQxlxKMJQns1Na4DAFCMh3PTA\+XFcEzyUABmTPDl/8IQPaGB28MCNWqD4zMTSkRJmIRhzVhI0lmaYTkOInzIYD1ulmEY1u0NeNxDdSVahA9EmHDs4p3M9/lJphDyxmWVUPFIyBCjEZ8hi0EjGA1fRkL6k2rMkc\+XUYboqkbcAc\+wHw5q8P\+GML6QogxeJICpSn4JRNEMSjofkb1xXhr8WSN6TI4dfp2IQV80zJFENA6ikr90iPKBmB7wuwfWY8QlvxBlQ3E3BUZMGt1HwnhDcuhyB7WkzHe3vDh3g\+\+W2rd2qV352p7YsrN163f\+\+/KjT285Mezn11a\+4scrxSrS2mutmu5MnbmQmjLF1XWhuddaUZLc9pMnNx79TPSRIITQR\+7qBMA0JypxEQAAiKYIguwJKSJHgxEV/BE2rAyPPIgGtJsPRsf/K2JEeb8y7LWpKorBiX73QOQDFNCcGBZjfjHki4W8NOMLxXyiwgdiPkUOMEB0OarHI0GJMeJaggpJOkMBw/GC/30CYTMmeO79TdPIN8vueSoR5VnQo5Igybsa2qcv\+KoYjkheJl\+7iCAGo6\+fgdmL\+FAkHHBTAGDEQ4IQjjWcoWruEcKRYH6EN9EUUZDkvU0wfYE/KEeEfCg4dmEgejTIC2HNpyTkT08UYapyOMFF9gQSkiREmDA7fsFwIBABUVFEDwVADZ1DYyKJqKy5A8GB6JkCoCh3ICxFvaIUi8s\+huZEJc7HRX/YHVEENwVGlDdVOSjFiZrQSDhoshTQbr/Af/YCYaIpoRgT2hMiQZEPsrJvvIJmQhYCQcMvR4NeGgDcvBznx1ifrkiiYpCErhmSX6H9oZAPwNTkkJigKQAgpgFeKRQY/oUiAACmJguhOMWAFtMIGw1JKpi6RryhiOD59F/bo8tEUQxDFEGg5Ig7FtUpycNRET6k\+LnBTkkjFgpGDYoiWkIzIkEpCiZh/AKnGpR7aJQzAIARj8ZNN8eYCVU3WQ/rplRFIVQ0dlhnE7oWj4SNQCjoH775iypENEUUIRST2InvBO3xcYoie0JKmNUiQhj4oI9WFHcgmI\+iRjFiYiBkCnL\+V9vUEyY9bLg20F4p6BUV1SDEiMq6Wwz7GJIIK2rCFH0qBQBAc1Ik7GcBgOhRkQ/TQSVIhTnvRjPwnDr4x8BUJR9vSDFRC9T\+y\+uja\+FYtDkR9cb9npV7\+8fZlk2v8Xh5KST6WArMuBSQDF6JBD5pNx8RPRHXaQZ0NW4AAMW43WMdSAAwVSWsJvoDVGLEdQ2UuIeBhByOMe6hckY8FNH9z73mjQqCKCvSuFs2YsGAEGVD0QjP5jv8ouP\+kk4YPWf51\+bPs0PjWaruO1\+tffMNFeYt\+zwFtnTzWYqru6c6DdD13rY/v1Gfj43TF/Y\+\+fTqozM2/Mvt9Zv/K/XNwCL1P1cdqtjwL7d3fOC6IITQpHXV7gEmWkQQZI0AEFM/vNXnkd000Q83mLMXiL4oADDeUCTkZQAoxu0BEhN9YdXMl24445i9wNOf2WP8Iu/2eAY7wokWDccoQfazg73AFFAAFOuTJMokmmZybhrAUGM66\+MGAkWK4a4sA0zN/upT8SjPjrF/UpyRYid8jK5Igii5Y7KfMeNBIWwG5ETUQ9SQKAoRd0z0mFFJUChB0QKsEQsKouiOKTxLEmEhqHlCquKlErIoCkF3LOyljbELqyFeUlkPx058kN4nAEnIQZnilYDXE1AYlbCURvSo4EswFAAxddPtyZfTZEGMusOxkNcI\+32GIId9l4zxjVhYJr4wPxREURRFAcV4xSDRQdcM2s1QYCaiCdon9F/TURTtmQwZYKJHgxHTH\+a9XkqROYOlTTDikp8L51vdYPqv\+YyoJEQoKRr1g8J7Vb887uUvMRI6HRA4Lcb5GEXOj82kPbwUvigDDBRLaSE/FwKgOQlMVQdvWGLDquEPRwTWTMQUxZzIfADos4UGMIkJnKjIqkElZEXVTCmQAEM7LPk4maH6Bxv4pIgPAHQ5oCWEYL5n1FSloE5YOShRQExdJ1wwLICqqExQpCXfVtPt5cNBVvYHRIMN/ILXVV0zaZ8k\+Id/yU01HOCiNAVADN3o/\+0BGCeeutSucLw/wothOqApxCu7KRjvZ5kkIoKkB5Ro/6\+NEQ8GJFOKKv2DKogW8QcUhmNioWc05qu8j4oGPBE3a4LH4xXDAVWM9PffQT5alzS/EvMyoAJFT4dYMBjjIiN\+KymPpOYkAAAjGuAkKhKXBz4nWhzoBWui8RBHE0NLJOJySPSpoqIIHm8wFPAHRNmjXPTX8T/\+4z\+\+9a1vMczQVgzDUBRFFMXLbLcrQLSYrJomKwel/JH3yXFh7KI0Fwj4AwPLJcKabojBEBeOAJBEWMn3yIEZDwfjrBjzcaxXYTRgKNXUZN4bz58XGvHmV2EmIoKU4CLxoCch\+fyMJH848xeYJ7b97sSw11bXtJ7Nh8xmmLHmX\+6Bl3ZtbICqaaUdvR/CphBCCI3n6gXApm4wgiLzLGiyIGm8HPRoYT5kCpGgjzFjQkDOXzJQrD8UBgDwBcBMKJIgHJ79oBJX/CwAgKlGxLAaCA/kh42YxIsxEESIR0JxzTCMhBp7XVc5ViBAMyzr1gKM2\+2hDTWqs34vO1gfXRG8KkV0TQc/J9P0qIGdl7t7WkzRPVKE51gAVggKsYAS1/1eTY5T/ojgc9MAfkmK\+YJKIkBrssryUcHLUsAGglLUL0f1AG/IUdMblAIeBsAnBP1RQVENzh0bq7DIsv5wVKRUMRb79Ix5IomIGNyl04bgVQAoJhCS3UCx/siwIdD5kpSbV1QewIgJQsQMyExc8I1xex3l5sMRwUPUcEDYavqfoxNyKKYZpq6psde1qNctEaAZhmU9RAq6GcZMRBO0XxgMtogRE30cTXRNB80bpWkmEJLFz1gcTDRFFJ/RoEb0xal8T5M7/5\+hIdD9RRl/RPXnB2GGNC7i1oL\+wMW3QVKM/yf/OtY3xUwMZoABaNYb4H0sBTQnRody90RViRYR/GYiYaoin3CzLBeQ\+CuZRwt92hlxyRdzh6IRL0T8ssb4lZjsJ0qAj/PRiI/uL2WqciSqmQAsR8VCUoxmOI5W4mwwEnSbhPWAwgcJx9KgA9FkgTfBPZsyYqJP83GUW5RlkTPlmDdIpNjwrzZFu72BgJHQuEhUZBMRKdp/281lT5elRSOyqjMeJhEOxk2OjgRDDGuaejwclPp/a2i3n\+c5KhERxBgXliWOBiCmYRgG4/czgsgH2WgoP2YIaNbjodRoO6Ta4wlviPfEQwlKjEQYWRKDJiuKA79fphoJ61ww4KHywysYr8hDJBiKe8Leyx4SRDFuzufmOI/k44OKV\+HdnoDAycGwGogMD/Q2b978f//f//fmzZtffvnlGTNmAMDp06fvvPPOY8eOlZSUfPe7373cDV8eIx6OaJ5gLCZ6KDBigj/icdOUbmpKMOhzh/wjOtKMeEiQogYAzUlhgaKIaRItGoqCf7AH24wHxfDrBkMC3kj\+/o4wB7Sbl4cNgc6XpD1iNCEC0RVejFKiQim8V754bhLKI8rhy0qbl9bec/uy6ygAgN7WnTv/rp5t6wCAkoHP06T51KfnjzxCCH06XeVZoAmAEQuFE3TQTVO0x\+\+n/HyAjkb5i0saqizyksoKoTWJkChG3AoPMYkXorSk5PO4xIhJ/kBEA8oNQFE04/FxbpbXKEHh5JHd1kSPy7G9sYQAipEAMRoEig1EomGPFgqE6PDFfdyXy9RVg2LZ/qsOimYZIquG4U5ohPExdP5tmnHTZlw7qyd0YAbuCKNohgU9oRmmqRm0jx0qyxBZM01qrMImuBk3C2B\+sFp/xIhpUn75nagnIfBxPh/0GlEgRkKNUzSAmdAJeIbKm4kwz0eZYFz0siYb8TIsQwGArgQCUX9UCdCmbhCGqCG/P5ggZUz/WcBxbp7xM3yIieTv7xtkqHJ071\+iohAjqhmIRliK8YUV2WdGAqIpKZ/RDDAxwRs\+JHuNYEDm8vfomnEghqrGGJ0Comnm8FYnmiLwERBiIZ\+buMNRiWHo/pskwx45KrDEMEwg0Ys3RNHuizPApqZEIoqiaIzf56EpmmVNYP3BoDsqRoDn/YwZC0tBRgnjbNCTD8OJvBkOh2XNjLMBrx4VfVwIjMRhU/UmGJoNhCIiR1MMpavxwUmHKDbgdZseIeinE2JQFyJ\+jxj0cHQ\+oUdzwYhAQmKCD/mJKofjNE0ScjCisywdjchuwcf1jzem3Hw4PND7Q3NChAPoH6d/eSiGC0g\+hgYtEjC5sCx6wNATSpz1isEQGxf4uF\+RfDTR5IBfilMeM8THQwAAFE3TNENTHr83FhFET0wOsABgqpGgHgj\+jI0mWB9r6gnaF4wIbl02NVX38IOjn8yEEieeEDcU61KsX5LifikUj13p94l2\+71UQFGNgJtluIAHJEU1vYOdEQD333//z3/\+82PHjt1555379u0DgHz0e/311196aqsPgxELSkrDmVRQDHNRkdViCYoTWAqAoihdCXi1oCyL3sHZDIihU/6w4o0KIYNQLAPRRDwal\+N\+v8D2FzEJK0RPBNgYL\+qSEuJoILpKTD0RjxMawFANMvyUMOPBgKh6InGeY0xG9uf/JhEt4ucTYiziowzdgMu8T7vz0K5dhz6M1kEIIXTFrmoATAjRZDGoccGonwEAys1HFDMQEIOsMPRHhujRoBiUYwbjDyoyFQ2GTI8HwgEupOmMoMRDg7fAxqKaOxSTNCkMFOMN8PnFwU0ZmkFgWExLtGgkQaa7OUEKxMQIAMWwjKEEpSjRAahIUKeAmLpBBcLh97ubljT95ZE5lkeG3pj\+1T8mFM4c8RAFiqYoYhrtpkFg2EQqFEUR0zh71hj\+OBqKZiiimakzhnlRWd1oZ8cqTMjlj9L7\+FEMx1G84AvqicOm6kswrD8YZAGIHg3FqIAU8Ihh38BsI2YiIvAh1aT8DE0BxbDsxeujWZboUUVlxKgCoaBOMZyPz1/Gam6aqLoJw2dK0eNy3Cyb7eMlURdDABTtZkk0JKlgABA5KEWp/JC3UPjKxwJ88tAejo4IvpCuHTaifi7McFLIB/mhf6ZfFNx8OOTu31\+iKSIvxQzKyzAUUNSYrc6wNNGGv2Xq0XBQN2Karkl\+GRg3238fsEn5pGBA5I24xgXDEkcBEDUUjTOs2ycFTTkWjwGAVxA\+m10P6BIoCgAo1h\+JeWPBkBkM0hGeCMoYGWCKDUTigVGL\+wBATxBiEsrt9fYXZDw\+QQxwtBbgWcaISQr4BVPy8pQQicteKiEHg4LiDirD76cw1VCAUyii6xQfV0NuuHx0fjDw0N8wimEYevQwaMrNR3V\+7DUQ3SfHGYoCIEAojxhVgu5EWKfcrBEJaeCJi14hZnqDSoREAh7Z7RdDQZ\+paibLD0zoNbCRQEiM\+qVQPBbyXMGuAFAUTRHTMAEAaLeXNSMJnfiGOhIZhtm3b5/X6z127Nhtt90GACdOnKiurn755ZeHD4q\+Cogmi4JM\+Ode88Z4IcCbfhJn\+KibAg0o1h\+RBSMU8HNxSZalgcNoJiK8XzYNJkjRLMdoQUmjuJCPpcz\+vWU5j8kHvJqu6UTzxhl3ICRSACShBKOsIPp8UpgZ\+CNixEO8IGuE4ehx/yaN9eb7oGrvWrSsJp8BPr3zz2/Ul3yu7qaiji6qaorTMXdu3TTKceH4zkOd8\+qWbfDNqJo2xTHnu8/3WqumO5esfig1ZYprziPPf81aNd2ZWr1yWdeF7b9TNr\+FGWOEELo8VzcA1pSwQXF0jOfcLENTQAzNdAfDIY415cFSFMP5hTAfYXVZEAKGL6zItMwHErTP6yZudrB3lXLzkRgP5qiZkSiW80AwppnewYtqM6EopsfvMQcXZX0hxUdMQ4tHVVOPR4EPS3QkEDJM8n7dt2PfA2zQNEUMcyAuJaZJgKbKaIYC3Rz8Y0RME4B20QwF5uC7xDQI0BSU0TQQMvQuMYFiKWrswp/S8Izy8HKMN6I8H/cHAyzLeaiYQrE\+niMysBwHisjL3kgkQEUlIUKJEUEOjnczXf8aWX846geSCIVGvs15KTmWMPyDl7pEi8qa2\+8dujSgOVFWCDH1uBL3mPGo7g2F3DFe\+mw8bGQI5eYjsYAZlwKyOyh4GI\+HScQpxsv71bDOeDgmLgm8JyTzjBoUQkYgHKSD8cvZAM36Rcmv6pomiG45DEJQYI2YojL5Gb0Jxfo8alQKiDHCKyJAvs8jFEmYAECx/Cdunh300aFIIm66eZbS8zckDM8A82FZ8JD8HMtADE0zGbebpoDx8HzATQEhekIziLd/6LKbD4cBAMAT4AHAF2VCfskMqon\+nCDHh2P8yK0Tk\+KkaFRktZBPHHjvcr//RlyWY5pJDDWRgLBkMBTt9lAA9MUloyIfGnr4ziCaC8phjgEAig2EwsDSFOWVwl4ghpthwgrhpGjYxzEUgN8vGLpJsRSJGybFXPRgb8rNB4VoIBjxy97L3A8AADAN3aTyoz6AomiaIvrg37V\+VVVVe/bsWbRo0YkTJwCguro6Ho/nh0NfTcQENhCRJL\+H9iqG7pcitBDzs9RAzwPj4SNxJiwqmkHcAAAUG1C0QP\+yJgDnY804BCU/S0FiYK20V1Tioi4HRI2X/Kybc5sKRbv9AiMrlJvzmLLAR/lIyEtkUYy5g2G2/yT78Pbr0Eu7Dr009NoBZrMJDlt/k6e6kq1nO1NADu18\+r5Y\+Yp//Xbti0\+NOQlW4\+anN\+Ms0AghdEWuagBMefgIz6ii3/D3T8MbEwIyw3k5iMmDpYihaQlZFhSV8odjslcL8nxUp5gALzLhkJwIjDWx5jC0J\+AFUVYNrj/2IaZJewXerUYS\+RKmGgnpRFcU0\+sxlBhxs6YosdIH6b2mGZY2E7pJgKYATEPTCRNgadpkQUnoJrA0AJhawqDc7LRZwBBFM/KxNjE0zaQ97HTGZClD1UxwMwBAdFUHhmemM\+4xCl\+yAT65iC7z/qg35AcjHuRVLhzNDzuk3N4ALUq8rGmslL/b2x\+O\+yjQQvK4s8lcGuX2\+\+mAHNe9A9GVaYCHFzx6pP\+WLlNTQlHTiMk65yWKYrg9EBQjQe9n7wIiP9l6kCdmIswLbikqBwAAKMYb8Aghwa8nKEEJuikAbyimAhhyfELrJUAImHqCmMD2XyBTrNdHSRHZNMJhzSf78hty\+8WQH8y4lIhQACYAQ4hhgD8SF2mF5xOjL7DRJGKoMcPNsxTo\+RsSLsoAU56AyLhVzdR0Ke52MwzH55\+UZuoJw9SiMY13DyUozbjoE3WPz00DEEPVdZBDwRgFxNTiKhOKR4aN5gUwTRNoz\+Xe9Dsa4\+V5UxTjHOfWVEMjvojoJ5EoNeohTQDENHTChUaNTzZjgi9iDIzqoRi324yLnkCUcnsYhqZJIq4xQJmaGiVmIq555f4nNwGMPWKb8vAhPuqXwrTnsneFaLFIjHiC73cP8bXXXvvyyy/feuutVqs1Ho9XVVVNfBvV1dVXVIbm\+BDX/0\+W87JuWhg9XwPF\+CTFBwBGLH8bVUhN6LphAMV6fe54WG1vpxQ5YgC4\+zsoSCLsFxJ80EP0mMir/kg0xAIA0G6fj0hSIJQwuJDiZYACXlYDFFHF8MR3dSLoz23YEKizdbamrS4a9v5y8\+rXT\+99/TSUXFvrmwdHj\+7GdC5CCF19BR/FRogWzT9oPhhRxwpvTMNw85GEHpeoiN8fBjGqiB6GYThe9CRC8sVzIY1EewSeiQdDcRPAiEfCUZOTQsMGWRItqsSJh\+cZLcFKYUkIKqoqBz7QoFfKwwseQ1YSJgAY8YhCOMHPUqxP8FHxSEwnAGZCkRMsz3Os2y94zWgkbgCAqcqK7hF4D01zAs8m5GiC5LOVKu0TvCw1duEPUNWPEcX6Ah49HIrqpgGcKPkGM3\+sV/CBRkvK4ERkE3wE5/jbcgcEjxYKxnQCpiqHZd0thsSh6zqix5SY4Q4Ibj0OQjgkipG4GhXcH/Ri\+BOI8QY4Uw4qmmkQtxAMDA6apLlAgNYgoCjC4NOjJrj7FOPxePLTpBq0Txj89lBuv\+BWgxEiRGNjTdxNiEmAoqkrutkSfeaYWlTWGM5NUwDETMhBUQzJCU2Vg5IkSeGoRgDAVEOCpGgEAIgekwKCkv9BjenuoMTGY6NSqpQ7IIVCoVAoJPo8Hr8YCoVCoXBwjJ9NIxFNgMc9/DSlGI7nufcZBjQa0aJynLhZhqLdHjoWFJWEphOaGR0ATxxFeyQ5Fo0qcljyuTk\+GA6FQqGwNPTlBYpmaGKaY\+WraY8QEogSjOoT/5YRQ4vLUsAvqm4x2N9rSIhpEoodezeqqqpefvnll19\+\+bKiXwAoLi7euXPnJQrs3LmzuLh4/M/NREQQFDY4asqr0SiaZmjG7RODkp/RQkIIxPih5/xmRIrEEgPDfCi3L8CowXDcMAzaJ0k\+ZqAvz\+0XOMNwh5TwwGY\+6N\+kcXWd3rzp8bvFpzYfTV6dDSCEEHofV3cSrMG/Of78k4eMmBmQRxeiWB/PU1FZ8vEq5Y9E4363GeUJ42NoxhMM6TzvSwihEO8d9yKFYgMhKernA6GIREUjMcrv99D52X38MWLSHMd4OA/nVeL80H275kT3YfQ9wADTH/xjQgnwskKHJC8TN1m/GM5P2wyUNxQNy0HeLWg0F5CUaD534Y9EqbDkZwM67RODMcXPUgCUR1IUOSh5GBXcATESFTgGAJixCptxwbN44IHE98/YClDzP15LhLlPevTG\+MMyHY\+FgwYDMh8gkTADAKYeU1RaEOigGGQGn3P8gbflCwajfjEgQdgTi8iGN8Ax\+Stov0pMiqMYN\+/m/HLcB4OpGvJJb8ArQnuDciQejwQNmo4JARKKcABADFVRiV9kw6LIDjygeoIoNhCWwVACIcYfyk8mrQEAANF14pN4NRhXdZ4bmP5tECGGroObNtW4QfsHPjW1qEI8fi\+OhJ5siKElwO1jaQCT9nABT1DyMgCR4WVMNRJU3aLshaBCe8SwDEIkpnk5NZJwC6IfdD4U5NyXnPeY6AlVVY1R3TskoYTjtF9xj\+iOYbw8DwCXM/JEj4Uipi/sZ7UY5Q6EeLeixpUE7RPpDzJPIRn1ytTVRCJhwsC3hGI5Ny3HNZNnL951mhNCAWXx/3r/vTAPb7x1ysb\+F9MXfS8cCw0\+TM7U4jrtEcb9Xs6ZM2eCOzPcQw899PTTTz/xxBONjY0Xf1pdXV1cXPzQQw\+NV181HOBlWpIjlw5/AYBy\+3gvgJmQo\+CPqAGfmwbwRGVKVFiGMgYKBSIKE1dChskYYT9PZAkg/5uUcIt\+NSSGmYjIXeLs\+vg4AFIfdx0QQuiz4SrPAg0AtEcMh6j8ny6Gk8IsTQPRDYP0d7yaasjnC5lcQAjF5fxANj2u6Ez\+\+Y20R1CiTDAYVX3c0N\+/i7q5KTcvK4T3B/wEaC4AFABFe/ySKHq1cIyVpPzV0rCebWLqBoH3\+4tK\+yJ6LjLeh25/KOoPjXqXYrxCJC6MWohifZLiky5uHD4c48OjV3FxYdp7iYp8cpmJiCiGYxq4fbyPDwS8jCEbmizwRjASDnh9ERACXo4LKuM8kYroiYSuqQYZqyuejD4RKNYfUUzBz/sUoNz5zgHa4xP9ot\+MyJQYyk94RtNDqzB13SSfyGudD4BoSlAMRRMm4w14\+VDA5yZRWYsKAVMMR4L\+gBuEgM\+jiPLQE6BGNCQxtISmJcZu9WHFTC0qCUSQgoFQlA4FeC7mC4aDATcNRIv4uZW7qEXf46OKQbEhPm54ZR9LgQ4AYCaiMcL6vVdl79EnFMW4IRqJAEAiwPX/bCr\+6MhCjHf1D1iDk4J\+FhQgABTjDUU9akTgFSaseBkGJCnmF4WILOeHMdDu/NCEvPyJTPS4EqcDQX7YOCA9KvJh0y/zbtATcU1NjJgLHYCMmVu9GNFlKaj7wmEvbSQAABjO71X5mEcY1pE3tCZTUwSvOiKnSgzNcHMjmoZm3e7BTrmB\+uhxRWWF4OBPI\+0JeGlRUQ2fnwGKC6mJ4eugveFELjyiqoxf0f0jtuMW4kQYd9cMVUmAN3wVZqgbP769FKLHI0EponPhaGhULymBiy4DzIQcHHwoG0BcDsX7/0l73EZc1U0OAMCIh0VJjuvg8fsDfNjP0VpIV8O8EAhGQn4PR4f5AKf4w8pgvnnkdkw9kdASCfOyn541TMmMlatXLUtbXTSo6twN/3YbN8UGYK2omgLTVi5JA0BP/Y6/rN51OgU2AHAAANgcAGC3AoDDXlRFT6mwQ306c8VVQAihSe7qBcCEkPwUTzQ7NBSNZj20Lvs9j8TY7yn5t2lOjOniYErOTER4XqbFoe5eivWHZP/QimnW7RljbBLtEaIJrxIKxfPbo71S2AsAXNgzuqgRDXD3R2GREJIuc\+gbujwUzbh9Eq8EBtP3tCcQVEIBf/7gewQl4VO1wY4IYpKRD6HQwoF7t5qL1kRH98hTjNszxiUI5eblhDcWDingYSgAyiPkj//IObMAAMy4yPn\+l\+l5OBT5jGUiKZphPUIkwg9eNBK3X4oIfj7fim5eVn2JBBkYXUkIgfyXtf\+CT5eFxRu1Bd9TvKOvOkn//1GQP5RCqP/y3CvFVJ8iqwYBNwDlFmKmAESPBoOUl9E0NhIN\+RgAoN0eKiIrwAhXPlwUfRpRbj4S5ydUdNn/ZaohnxBl\+JCHJkZU9IkJLqT0PzeX9gblYFCS4/6wnwF64Bue30h\+FDLtFSPeEas0tZhicCE56KUpIx4K3P8M9dXNUn9oaUR57v6tTbMf/GOIfv/9YHk5HqBAlXyi6hbDLGhROcEFB28AGPYTRrmFuDF\+wDm0To8QCQ/8m2bdbhooivVJEd\+IYjQn8Kw/rCR8oufD//aQhBJRWSH6SZqhnYBHjIYDI2e\+BiDkopnLCFDugBQePVvl4MeJsCYRAACaYT3\+oCQEBi9LGE4IRTneN/hLlvCrOj30bKWREbCpBv3f/Av11V/ErvzOpK7T2558euOJ0hX/umyeeXTt/3xj/KLpVG\+yAwC6Wne/dKTjQjK17\+BumLfhf8yDt17c24wBMEIIXSHL\+Y6uy1rg\+NF3br755qtUm0\+CNWvWbNy48f3LoZE\+Y\+32admdT0s9J\+KztC\+T2Yd\+HMmIZ85dBURPJEzG4xmzP/QTdVrmE9l0cKA34ENjxqWAZPBK5AqnaP9EtdLHiP3qv37cVRib/pefftxVQAihq\+XgwYPXzb3hsha5\+kOgEUIIoSt1daNfAKBYD/f\+pT4JKNYfifuvworp/IzwCCGE0GSAATBCCCE0to0bN65Zs\+bjrsUnHaZ/EUIIfYrgEOgx4OXOFfjsXQB9Kk6Dz1izfyraHF3aZ\+ycRGjicAg0Qgh99K5gCDQGwAghhBBCHxQGwAgh9NG7ggC44CpVBSGEEEIIIYQQ\+kTBABghhBBCCCGE0KSAk2AhhBBCCH1QONIYIYQ\+FTADjBBCCCGEEEJoUsAAGF0VWZNkr\+LqSYZcxbUjhBBCCCGEPpOuXgBsdif0DAAAZI1EUicAAMToVBPpMUMXM677Am3G2OvKaEpzJJ7qL6kaAZ8eG6eomTgjhsxxPvzkIamESkY0iJk2zKsZOn4kiH5e9B2V4ukxPjM7o9HkwAHKGmqroo5V7FIyarjRG2jVxjiTska8LaZlBurRHZPP62OdcMTMDPxjjNYmuikrnSZJx8NNspYx4s2S0m2anUq4LWEObWvgyKXjshHTswNvjnn4Mqqk\+SNkrLpkDa3beP\+APp1QOw0CQFJx5XzCzBrx1mgic4kFzMR5JU4IgBFvluRuAgCQSchNodjIBjfaw/yxiJr/YmY15b1w/4HLjmic/k6HVJSvF6JjHDJTM2MD9cm3GAEgWqsUbjffd\+cQQgghhBD6KFytADhrxA0\+0BwzsgB9Cfk9MdJJIK2GT0W0vmHFUnFlMKKwANX/rpk4r8SGQgUz0SaFeoApBEgn5GM\+3mTFaazaFBDGCoFMoo0TY\+cRrZmjDlosQ/\+jvEbC7Ax53\+LHuqy/qoiRDPMNvlDS7H8jqynHffw5fczSZlIWGzh3grK8wXo0PtSmmYOfZTW5gaXfvHgXRu7vGyx3LBxPTSh9aiSjse5xSmZUqZ4TRwQ2hvIu5zsuSk2S1BSMdDFcEcRaJEkX/PVu\+g3afSyaj3pNElO6huI9IxkWT43XnQGQ1ZXj3sAZzUyGvPUBsUmSmiTpVNSkvGy3HGwSxWM\+T4KmEt5QZz5\+09ULMT031CzKKVG\+aC9It8xrfDRNzHbJ/254jDAyEw/pUpQYWq9hApi9ut6rhk4G433U4FmqnvJ5jyt6FqDPiLfnT2OinQ14j0eNsWJg2jK47MjKkGjwVFTPAqQUvt7HN0lSkyQe83HHFH1oPUQ7H\+rv2elV5fOa2aer55XEpTLhRDuvxNIEAAyiGX35ksQgmm5KAT2qZwHATJwJ\+N9TPeXuhO4NnEmYWWKQeMyMyu8FuLe90mD3QTomav5wvpELYKwdIZo51PVgEC3fCCR10fcxpQQOc9LAOU\+SkucNz\+BLMylxbz7w/zb5vXpszGZECCGEEELoyl2tSbAKGP8s2TQSRhYYm1eYqgQ71diFsF4WDA6LAkivKpsMd42HHhGIE\+28rBb6fBQFQLQzomC6Q3N4ti8qHA38Ju1\+8BoSfS\+gQiBc6R4zong/FFv6VOxzPDtio574TVe0px8IxZZHYhCJpk0CNAUAaU0lWqI9YVSwzKiyGTXyXjBRElZYr7vATJwP8s08OGKSkwYAQuIx8EtFWrRd95ezo7fSv7/ESEbDpyThPTZ\+vX/0\+kcz1NZwlOZ8xe9XcJCF8VwjBmkWUlqiJ5FIxmPJuEoMKGQ9xZ7BvhYKgAIKwNTaZLnLIMBQRA42xWkAuiQglHvooTUS/Xww3MfLFW6qC2i7j5/JewpMvTuR6FLjybjaldD6gLF7uIJhJ4IFAABS8cjZmJ4ljM2MGpJeSEEB653G\+xwUANE7YsQpeguNWGuCnSp6hn8NMgnFUBJ9FAtqxNDNbtNs1kmXqhPNSDO\+Hjn4Huut4H0UzU2TuHdFocWtlAMUUABASDTUBvx1Pqagf1WRE6Lc391g6imdepeLWCgAACsnzQn7HYN1ztefogAGg0WqgKIGT9GsqfVQvnJ3vsDA3lIwZig6tIax36eL/Nx5KdTBhe2xiGkyDjpxXqFtHjDD0RIB\+rS4GaNpXnZzQHQzC0wB0c1ILGOabUEpq6lEN09JcQtAzjTAI1QJ3GADWojZHuZPKQmikR5vnA4KF9fQ5vFRptyuE6eHAqJ3JcwCUx14abSrpp3/\+gyP7bgQ7PBE6AmffgghhBBCCL2vqxQAk7RhWjx8lQeyRqw5GM3QVDcvFnh9RbJ4HLhpQb6UzpekxrqCp6A/SiadcqjLE5rjN08HxNJw\+PMknIqF9VCiJBQp1hPdhreMATCi73qFbootpACImdF008\+d6V\+BkaEC1bGQk36fCneGfLom1oSo9/yhrIfJJLS0CXY\+fJ3ktYHZKQdPReK9JrGwvunhUIUbOsN\+Pc4Wg9at6TnGx0TCFW4qoyknBclUTZuXnxEOlbuprB59Twh26ARoz5RwuIobupxPxSNno2pXNJ71\+kuMYBfrqwiwyahRFhbSkZDJhUdd\+ucMrY/hrvF6HDQAzU2PxGmTsuX3i2jnY6QsGKBkvk3Vr2HZsSMfinEGJCYea45rGT9jNRNnRPGsagDQdr80O\+i3qtJRSaeYRMf5\+8qnP39hr54MQF8kMpWKtwRDpmr0AV0shFjRa7l45UzgetndJgtvhbXSULicNgkEqtWQKYVBCE/3UEC0M3ygNWH0HtYL4nqnGJzO\+SAePgu\+aQJnAwCgbMyIsyGjRds0z7SQuwDAKSm2uHLKH\+gA4dogV6AbVDA2m0SaYp7ZIZ8NIBWTGoLxXj3RS5gGzc8EAy4vdS6kUrw0haUAAGi2kMq3fNikAiwHyWCEEPOUz9fh8\+Q/KmB90/hAVSgAYJqS3yBBd8jvoCAdlxol81olcs2wg\+Lwha4PRdqM/kRlnx5tiZgVEb54YCesHuFzcaF/X9RQY5iZLfPD08BZPXZWiXXHEj1U\+BTFT6Uou1\+4VvAUAOmMCG3DuopINJr1BR2afEyM9GiJNOVvoIyUTr2rRez\+0HWS1zbWAc\+aelc83kcSfYQe/r7NI1ZHiZWmwB8ojst9NGOhIGeAzctRjGanzS41eiYRPUOITVA\+52EyCeU8CNUxyUlDKmr0xgIzQ75hWyQkJrdGY50qnJaZGWJ0Hq8cEw1GFksh0RyB3MgMcAHrKWGMroSR9bBgqEnC0ZzeM/Cyy2BKPKzdHZjC\+Ftjuosf52RGCCGEEELo8l2tAJjE5PMJrStOpsWUqogPSKLZCDmC4Qp2VEmTyKH3EjQQPaklSFDqogFMjRj5clSpIJcSrZUXOpnQNEi0ikEjBk7Bb00orUq0N8HMjfgdAIVsYLYSpmkAM94UiBRHlP4NGcoxIXF5dTcTvXT0c6rXkggfDYTPB7gKojQH40Vy7HMcmKLvVChGy74CIJmE6YzFrnOb53lvS0SdEqQNIZT2y/MUpjvEn5KUUtnTxks9fvkG0dMXFd4VgqWxoYyWwytcy3kNTT0PALTb5ecKE8Hzpu9aXihkpRMBPh0OVwxLhxZy/hIiNokMw3OU21PKMI6BVWUSsU7wzXKzNr/HiMR7/fzYg21H7qcZFFopaW7CbzNjuk9ocnvmuCGrJ/p4\+UaeK9Tndr4bL1fkcsY0BfGcKX0uwdu18LFA8Iw3NnZajvaUi2EH8E1KYqpEWYAkI9IFSpjjoQAAKPd0OV6hRY765BI5ei1HZ434\+QRdERJpIushwkTEYnr46khvPJZxCyX9G6MoL38tS\+t8yDS8LgpyevS9iFoaFvORmMMXqvGZpuB9z5SulwMURbrlSJ8veG3A3RUUTS48y8sUAGR15T0xmhX4bEw6pXKVQbpVYSrD/LAGM5Ny5LxmgkmnFeFdI\+5kSE9USbkDybCUBMbJC9e4ISn5mjS3000DyK3A2EFpiUAh5yYRsUHVisPRa7kROzOmAtbHSN5u2mihxJkBd1oJ94QC9TINQHIGKQoNHl/5ZEi1R2ibh78\+HkiGAmfY8GxWOR5hZsv8uIeadtN\+tkuNpUwtTdhumX9P0bKmnjKoo1rYApQjEJoTMFIG5Qz4KArSsVCbZva59T53cK4ccBCzU02Ax11A9HORuEOQx\+9FoiifcK2H6QuRGYLXMfKznBE1goozEhg6Jym2jKMvxBNpnoVEPM34pvlip\+KJNM8WaPFemqtkKaAYp49tjalpnnWM3hxCCCGEEEJX6CoFwLSTl5wk0RwI96mhd8PRlGlmNN2i5ROzTFkocq2XAaCcUvwmCQAAzHiTJpcEQ\+WjQyszGRZOqZ4q1Wc3YkmKsrBu2ucrYYVpgv\+UqBIDLvv6mOidj8w59MjAy\+kPzknI9sFPKbbE57EBAOOmqGjahAKP4Nb783jFHAtK/\+2UhR6fk6UAaMrDQMLs1ROdpmdawEsxQIXVawAyiXCn6SkPcFYAq1coowVTM2mGHlEZinXyvD0imXFoDcdtvNRnQrEvPIeKGPFEyu11DIQNBYyfjdEtYtAQQqmGM4W3PMyEQtO8TAGYXdFYoS9CUVDg8RcZYVMPMOMMDs8koq1xQoXcVjNhqlAa8jooAIab6qXfU7WsG4D2TPVzNgqG3X5J0xGtv9IsV0TLGZOMkbfvH9IMQKgCdeVR33QLkA5CU4GYIcUBmJIAX\+6huqJKd9PrXbxUEhXSEm\+a3lxEPB9XC0RlZPQLAGZ3wrB63Pn4tn9IMxCgzPP3cmYZBXI0y/pADjZR\+cyt12bE22Jab5Ogc27WLR\+XEjZ/9JSQSOrcLIkpAMhoykle6qFom5FoVc1rQiEXRIx48F0uYgEAiqVDkSqOdvKSM1\+FCGRU6VjYw2qRkX0KBGiaCkjX\+qkOWW7XzXxDUX6\+goPzvNADAEasiQ/239pKzMzhhj4oa9Aihf3roRyB8Jz\+0dekNxZpocXKgPL5wOh2zerRk4JscbMF79\+pMRLlLhdD5ZDvBtKL\+fB0ETJx8R1emyZHp\+fPEMMAU0vGYoQifZqRdQNQkNWUU0KszwTKL0yjIKsnCDAQCzfFAQD6hg2Bzu\+1wxuY5mMLAMDUk7F4Ule7EmpPwjQk4vR5gGIgLjVF3NVDQ81pyuuxBOPE8EJcL/RyxR6zUI4Tw1sQ1yyeAEUDAGX3uAtklZgBx\+gTAyGEEEIIoSt0te4BHlTISZ\+LS2DEjvnEHB9mRW5o5KQZbw5qdFAYGA49iHTL0jlGmumjusK8rhArQxcAZXW7QUtkDMqUI\+0ABbSHDktOGsCAPl1p8qrN4wyBnj5q9WPcA0w6h/5NFwyLdXIEgBjtEfFUONrTlAIAyyJffi0WirIMBDNACJh6hqILh0cppp4\+/EzTjGea\+l\+XlepmFuhRQzrzgUSfYVJCuJyNNwWidDg83SvM9o5uzALGW6XEqwDATLRKwiletMaVcko9p\+ztaLrh0Mp8KUdRVCuXht3XOizgt8y\+xSVGrvUxYKppQhXR/feeFjJ0LmFmAQpo\+uJAK6MpzWLw/K6GHADA7CmjP883m7tcEKxyyAjH\+7y/qBagTaHLvQkjpPb6\+Kl\+n9NNgxk/H6ec99xjobXWKKmO6tOJdoYPdHulCjPYGBLnSNywapM\+Ewr7awgOr8DQUSMUvKAx1/wxUqpGeny8TQ62aQzNB2gv56BId1zJeHwlHtoSDXfK8k0GpGJSo0RXhDwXeKE3HJ5KMU5RnmpEzgJ3bUgoAMgkoNAbvG5UHpUY7YpsaiYA5PQ4SSRaJK2QgoEwnh5esjOuO8ORaxggMt\+cMIeS9oxvdix/qkAqJhy9t6EP6BJJuS4wdOJl9fgZRemIalkPT7OJFinSB9CnxZKGu8zLWvIRtdtTEZGzsaA5ZrOPy2wPBU6G4mnabafNwW9Bn2n0GVqXTmCgi6SA9U8LiaUUpBReTwAAAMU4heBUDwN69FQkzoj\+a2U/AADRzwSEXkmdz8SOC4npyuCdBSQVl8/KSqfOlrJiuc9bbijHRWNaSCyFRLPMTRM9HbLSxXvKBtrG5vFRJNyhaRYdigOMjeUoiHZomiVBKMGT/4kooJgCovbh864QQgghhNCH56oHwAAAQDqVSC/LFcr\+Bi1yfdg/cIev2auNmBR6UJ\+hESAAtI0T5/jMNjEGxDAl3tAoK\+efEQxAlG\+MkoqBqOXDHAJ9kVRMei/KVKmEZoDI/neVccrRjJVoA3Pt6p0a2GjWdsvDM6Py8BtHRyIZoKw0AICNE6o4CoC7LhhqisTKwoFRKceUGusCjuaYAgCgPRVBqV0NdRmm01C6PZtv0IT8rafpuPhuMNYjeIYGrI456RdF2yjSZ\+ZnVCJ9BrEwTOHYdUwYYijtj86Pua2m2uQTxjxkqZikh9QcGITiaNZol9WeBHWe8lAeql2J9KlRk984DSI9rJ8GFYRQuZspMNVmnr9AS6wv8Z5IpkY9456OZuKMKJ0zSFYz7V6vJRG9oCbSRqyE9Thi0XNhrTPqm7GRMxVSGnD3JLzXBr0UTYgiHgtqZeGQRRY62dBMlioAbwVLuiMRGD\+symrRs7KaGvtDo0sJ9SR8DM8NNONQM418OSSTiJyUVOp/PGyJqT1B8axbZgaDZIp2cAJDm2cod7GH6YvFe3zBKbqpa3zVsL4Ap4d0xgGI3iZKZ9X8o4kCDQAAcIyLFNBcpTz6jnEAukxSrjUC530y644fF/V8OxLVpPyedDyR9nltAEDRdpYpAEjHQycjZnGQtbFUGRM9I/jPAAAhDkEZOitMrYcwpaOGMAAAUAWMmxb4PgVKGaNNCnUYepdqnuITJYFAjkAhJ37OP6p2HidrXIhGC013BUsDzTrdpDUaBYOlPRevHyGEEEIIoQ/H1Q\+ATb1dkd5TmEolfA2dMHjhuATVIb9jaNrbS6AozgtGrA0AKMYVjN0YMk2RPyHEQIeKSGACd7p\+cCSt6zlGKGIAzISpqGniHfPpLIWst4RWzsU0mmeSYV6PBz6neEtp\+Vw04RI8BUa8JaSWStKIQMU0MoQppqk0AADJaFFDZSoC0vXeMdbfl4i8F4n2yfkbg83OmNJD3NewZkc4YfVKg01h8/iLiXReE5yXvgeV9tAeaFbiKc5vM\+Ln4qQ46C6E2PAiFiA5AmAavQZFeRgrkFRc7tDMEjLGEGiHL1Tjg3SUbwjlQ0EqHxJaKLrQ7Z8VFSlDOR4wS8Neq6xmgMolIo1CqM8XmePTTgnx4vDAoNxBFFVIQ59J8rWdLsemk0Szn\+8aKJUFAKAsNOuUlOt8VDLkT7LidazWkgAL6G2icCrOMHK4UBZOE6F6xKRNIxt2cAg0UBQfZgU/E/IDQFaPnRLF8wkTgCUJ/ZpQeBrHDHQiENIfQ1M22jRDUpKCnEGs/tHtklYjuiAXSspMNqobXIVPbeEDKSk0M\+CxAhQwHpoh3RoAAJgJM6oCRwBIOhZuNugs458p\+YZG\+FNseThWDoREI\+104BpaaQrD9LCY7\+lIJ5RzGjs1wA2fm2p0nG9qHf//9u4\+uonr3hf\+zxQ8kxDk4RbZyrHAwk6M7DQgk4tRmvhYJyGg8tKI4BzEhYICIRWE3gjIWgjnrlruOjHiPgGrtwnohEAUig9qC0GJeREEqKjTIkzBAlpbMbEtjCmy5ZaxHA4zhobnD/kdm2DAsYO\+n9XVotGePXtGoy59vV/GLxtp0l2zOZuDmv8hI\+I0ciuREOCDykSXaYjX/je3Vub09PQXG\+Erp11QGhMVRIEudTYHuOEq9Yhg8O8kxHCKUVZ7aw9wZBGsHv9gxMpGaBRBu2uIyvKQjIhkD6sVLVbX1wrjiLaF0L4Wgl\+zsu99G99xAAAAAIgW/RaAhUCTw9nC0g2Xi\+V0SS7dCBlLpJY5XcO9Qvsg23/6HQGNJ7J6c4s/wGv9QZaIhJsBPtbavcohHEfBAHGs6HCRyvi9Ts\+D6dsQ6L5hH9YZH3KY/CrbMJlihM7wsMVaa0v/l1t/l3PqR\+3mWqO27JULlDAt0aV/mONYu\+Wi0VBhJ\+KFYTqblOuyx3WfW5BpZBxFUt4QTkYuo9\+hS3JYOEW3A7APGxxJgrneqLp44sLNuHEPaQ2JLiMnuM77uEfMnXp3ORWnEuqcvuvqnlcGbi/HWe2iyVSpMv0zEPye3vG4Vka\+jreHyJQsmWpVasH9m\+/r2YBO3aSQDVPrpTpP0Gz\+e96oXq4WO0xjkFs1QwKOaoH\+xWpgeWe1iSeiITKNzKZmVSxPRERfC6zE6nqYt9cafd9TcYLLI2i6/UWDYyPLcZOyIwRyyv9htkkVfJM5yGstSRq22ar/OxER95DOquBUsQF/a0mlQWFQNFv0DbwqlnX/w6t/WNP16re5dQj0jYDn7zZrg9Mfa3I8bnLX2pVyM9to1paTepTJ9H2tsuPCssoEe7eEF2ytxO\+6bLH83acYZXf9i0b2tZeI2If1DqXadcmo\+4tF9X2bLVHb8cG1eJzNPE9WK6MRhmlNnXuAO7vutQUsXs5pHKbQj5Lpq7VBhdsaxwnXvY56p06iUw9rPxOBF3k2Vsa1fUsEwW0XlAaZRi36HJccXolZPSTovmhyjzBrm53uERodp1TeMBhqWadCpyC/629uGmXUsWxkFoCx1sE96tIMo87zw\+m61/43tzbZpo2cyM1goNkf\+GfQ1\+L3NliEr5SyXsYws7Fq1ffMniGG1osZq1J/L\+CK0alj21rb4vN/rYjMBwYAAAAAuD/6KQDzTTYLrzCPcSrJ7260Oy5qTNe\+qCciiov7Hid7yOhIMauHynSP\+3U97S4024x/7/y0GBJaXMa/WJ03WJXEZFEG1OS11xpUtUHFSIcrSSnEyHRJLjvH3VLTrUOgWaXc47\+lHPuIufU5wMm\+1nmbJNO2/Vv/mK/T2kTGSDSf2vbcYPZhk7v130p9sqfLKkZDFLokd4/nSF8H3X\+z\+R/SsV/K5rUo30hWcENkGrnLG2c3XtAbRLs9odtYUFbGmRycqVs1hnF\+Q9ctHGf3dezZ8/lGCqoSHJ4ufx1QW9O97e9qknxCUut2zwRzeyFjpHswYXZPJyUI1z32OrM7Rgj\+k6egxR/D\+/\+b10Ta/4iaiAKRJ9kOUyium/RVftWjTneCiv1vhzFg5OW2zhPCWVajHep0Xwvq2te7pqD/H1bTf3P0z4DwT6flgpuue4NDVEREQ5XqR4huBOgm0RBWxnK\+Wp2ZdI5Uq5bhPReN\+guCfXRb4OyIcELbf7d3LAccVRpzi8ogczulKu6Gx00CDVXqFW6d4HWF7MbzTmOyXdfzJSUiEm4SEdEQlh2mtjxm10XOqP2IQ5W6JI9W5vUKMtkQIdBoNl5288NNnr/ZeanTy/HOS1b31YNPn7UlDZMpWIN1rEk9NDIXnYQbPnvA4BhqdsUrWSIZZ3V\+bdRdsrgftmlZnZELUKf\+UkFw2a6QdoySHcITEX/daw86OKlDM4xomN7I6M2XVP/J\+azNrClBxjZH2qzQjnGprpOMgq5as\+tr8lUHOIXOW2uwXVcZHnWaRylYav3jiLla7f4eRzeDwkM28/f4QLPHe4PUxHt5l2\+YWiN3mR9WcEN470WXp8fLNFRt/YHQ8VeuISpTumDqdBWDVz0BRqu\+7R9xAAAAAAD6JuYf4at92qG6suKpp57qp9b0TAg2ewPDVIoY4hiuc0cdfc0H/8nKhrG97Tmofc37m/3scLXi1j9C3PB7rpIqTsl9\+63qf/xXLs9NtfahoCvo5UYZtG29vsEmp2eIVt/lWTtCIGTQ81pHikF5hw\+D/Tro\+YdPxmm4rxzO6yr999sGLd/wu64EVN/XKoaQILgs9YJxtF4xhOjrgKvBzX3f2Lm3XLjB09C2O\+3roC/sZx/RKLt\+TMJXNmOjzDJG32Vm9dcBx3mt5Z9q82ibsdtDg74OeP7u40bqus9zvh7wf80ph5H/alA2XNl9gbT2w/230xaWaWO9zha1MV7T6aBtd9HXfneYV3Edg7Tpaz7QQgqWI\+K99XbPdZ5Yg2lU2zjzGz5H8CQ79O9B1mDiuEDIaPgHqdjW4cfCP/3eFoVlrFnREuSGq2TfePG/DrguWr0Pm8zSbjetEGxyeYdpdbcs8f0NbvisXxoDMpf9lrnNAAAAAACtTp06lZya1qddvgsBGKLY1wFnwOAabnd0nyEMDzDeW2cw3zA6FVrEXwAAAADo1V0E4G9nFWiAuzRE0X1UOTz4OLW8l4HTAAAAAAD34g4HlgIAAAAAAAB8tyEAAwAAAAAAQFRAAAYAAAAAAICogAAMAAAAAAAAUQEBGAAAAAAAAKICAjAAAAAAAABEBQRgAAAAAAAAiAoIwAAAAAAAABAVEIABAAAAAAAgKiAAAwAAAAAAQFRAAAYAAAAAAICogAAMAAAAAAAAUQEBGAAAAAAAAKLC0LvY59SpU/e9HQAAAAAAAAD9KuYf4asD3QYAAAAAAACAfoch0AAAAAAAABAVEIABAAAAAAAgKiAAAwAAAAAAQFRAAAYAAAAAAICogAAMAAAAAAAAUQEBGAAAAAAAAKICAjAAAAAAAABEBQRgAAAAAAAAiAoIwAAAAAAAABAVEIABAAAAAAAgKiAAAwAAAAAAQFQY2tcdqisr\+qMdAAAAAAAAAH2SnJrWp/J9DsBE9NRTT93FXgAAAAAAAAD3y6lTp/q6C4ZAAwAAAAAAQFRAAAYAAAAAAICogAAMAAAAAAAAUQEBGAAAAAAAAKICAjAAAAAAAABEBQRgAAAAAAAAiAoIwAAAAAAAABAVEIABAAAAAAAgKiAAAwAAAAAAQFRAAAYAAAAAAICogAAMAAAAAAAAUWFoP9WreDG3n2oGIgp8UjDQTQAAAAAAAPiOQQ8wAAAAAAAARAUEYAAAAAAAAIgKCMAAAAAAAAAQFRCAAQAAAAAAICoMpgA8jJXGPyIZNjAHZ4azzMAcGQAAAAAAAL4NgygAMyPT316bMyv\+loWphz06/03D28\+OaguoQ1Mm/\+uyjpd9PxCX9naeYc1krqMG7vGf/8ey96c9etd1SlMnLps2Vtr39M5wozIyxs9fOMdZaHx7Mne3xwcAAAAAAIBv0F\+PQboTkrHjl2nHStpeMsOl6fFSybwX06/eaNt2xfvpn4ovXT7krs6eM1n9l33HeCJu7OKFz6QfOb/tlgqlk\+c4/3c6c/Ur8Xr3txiOCx916LfWhIlE/vy2I6lvaydn/OWg9yoREfE124pDHy2cMb9yx7YaoWO3YaMW5y0zyYVQy1B5wgix/oo4cqTk6pW6lqHS4c1F\+R\+sr4wUHiqRp\+eoqw8drQkRSX4ww7l2ooT/Smyt5Xro9MGfbT8fuk5ExIz94Ud5z6dc/SpMxAwbSnQjzF\+pqrtSVVZaXPPVfbisAAAAAAAA0JOBDMDhmrPrN58lIhr2iHpWzjtzRksfGSZPHVG2da/tRGNrehz2SPas7KnyoaEGmjrvRfUXpw8Nf2aWfGjVuB/\+fFl7ThbKjvxxV\+VXoRO7n5\+/u6dDsdnLXjVF/smNnT9nfHosVTWwsxa\+mHHutJfSc55kadj1ugZWPWtaynWiqxeLdp8uj2Tj61eOfbDjzcpH3177TPnmfeI8fbb31z8rk7699plwpMLho3PmTMxOfVQqf8T06khvybFDRHT1SvkXFyOJl1ouF\+\+uCbVlcmbYULpS/ta63Yca7vP1BAAAAAAAgNsYyAAcaYA0dfyaV6fN4i7aNu/LmDM\+VHYlY8nS/dqztu1HimsEuv7VseJ9x9qLc4\+/nTfS\+8vNPzvalpDpkan/e0HO2FPFlV\+Jw0dljH0o9MXFult6gDvwNUVbazo3QBJ/bXMZX0ePrlk7jY4eXP8FyeMfCbfc6QkwnHTWZGn5iVCIQnVc6qzU04cqb4Qbzm/eerDsao97PCSJT3/7P8asubWRV0NFH\+zaVin0sBMAAAAAAADcmwEMwENTJj\+/Zs7E7LFUXnJEX3C6PDb9HbpRfmTfW7tLZy188ef/d2XOdsdrxSFpRuZitZQhohahbvhY9dXasiz9/jnDiIiu/m3b5iOhthqZ\+PQ1y8bsynfuarjR62HpkYxpz\+Qks0RELaHi4lJvQ2OYiIa3vX9dqLt0rxFUMjbzV/83vTWiX/3bts2fFHWMrL4Wbii33doDPHzsz/NmpAwnAAAAAAAA6A8D2QMsEoW\+OPLa9uaUyak582Yww6UZ8VJ5ZA5wS/n6d0J1dSGRbtSV/ekXZa27MBx3aPijy954aFuBs6hBuixvhnw4hTqqvMFwj6/5j58t63kOcOSfX5UdPFjW/f37LFxT\+ta63nqAAQAAAAAAYAAMYAC\+UXfi4FsniBn7w8Vjb2xet8/bHheHPbosb0bKidJdl24QDZX\+YOKyrEcZImoJHSou9V4lGv7orHkvprc8lB4/1Nu1UrGh/Bfrdhd37wHuNAeY2IznsnPGRXqALxfvPl0\+/PFZP3gofJWVjxzBpKbOimeZK9XFZV\+lz8p5W/uoPH4kM3bp/pah8oQRU99cII4cKRn7yv45Q\+UJI8Q3l\+VcvbLnk4qO48QOTVE/v2YclyKnZUvYtnm/QyXc0PLifZv/Elnjqrch0EOl8TeK7/GiAgAAAAAAQC8GfA4wUcsNRj7xnf\+bKnZsGioZ3rytdRbujdBfSn/xl07lOaKrl4t3fhLpAZbQnRCObX63bSKxUHb0YNnRjvcY4ut4YoaxkZfi1eZQw1ciCWXFO6a7Ry3O/UnGkQ97XASravOOzZUCkzhxUqdzqTp3bHPDD1PoYvHV1Fl1B3929Ep61kR5zeniTotLhy\+dXV/wyTG\+axuHP7p4yQ8JncYAAAAAAAD9YxAEYKJw3ek3u/UA505r\+zc3641XTMNrvVeGysf9S3j7lje/uF0P8G0NlQwfKg4b/fO39bOGfRW6PlTC0bH/t/nNE5ePnbhMw0dnaNOpsvLQX\+52AvDwR\+SxQ\+l6pPNZqDpRTbMenzo8ec2P2eJfnm3v2mWGs5IWIdzDCliXt/2/HpewBgAAAAAAgPtgEATgWFY6tnsPsJS7tiu27VVLc1nJwbdOD521LCc7sqXPPcBERDT80WV5L0rdfxCvXt78gWNzDbc4Nyf93tt//Vpd3ZUQjWBiR0r5yqLTIXEsEZFYc7b46itva0O2gh3bKtsf8MvKn5SKl47VoacXAAAAAADg2zXwAVis\+cPs\+X/oQ/mrF7d9wIcbbtD1K8XbDzINN1I6vx07jBnW844MJ00ZLngbW1J6fv\+bMUTiLRvFhoq31p1PeU4/f\+zZtwr\+VHWdpGOJiJj4keKJPx4a\+4x63MhdlV9FHhrMJKYvziDv1ouhW\+oBAAAAAACAfjWgj0F67sV35oy5XRduS7PXdejPsSMytNPenjxUPm5E\+ATR9a/KWztUhbrKkDxRKokluk5EJDbUFNc98/amX7zTS33hc\+7Njf9MGf7osjd/lnN9qIQjrzf17f/4oXrkMKKhUvlIil829ToRXSv/9JM3D14WaRgRMUREwxgiih1KREzsQ3JupDSWyq/3\+LCloUzsMOm47Lf15Zu3H3vrHeHtNxccyaq0fXCw\+HrymmXPS8t2vXXXo6wBAAAAAADgbg3kKtBVR3fPPvpNpYZxsyZdKz9y5K0T1DEEuuNdVr1wwdvjLq/f/ZVIRFcvF637/4puXyH3eM7Vy0Uf7Fhf88ji3Jx0vvKt/3O699LXxZbmMBFdDR06ejZ8pVksOXWI0t9\+I53\+cuRYXacAPGwoDYtE5Rvi1ZD36AnbzvN114no7Jv/529Tn0slXhCHXasq2bvNXRP\+ppMGAAAAAACA\+y7mH\+G\+zUatrqx46qmnvrGY4sXcu20SfLPAJwUD3QQAAAAAAICBdOrUqeTUtD7tMqSfmgIAAAAAAAAwqCAAAwAAAAAAQFRAAAYAAAAAAICogAAMAAAAAAAAUQEBGAAAAAAAAKICAjAAAAAAAABEhf56DnDuDEU/1QxE9P777w90EwDgnrz22msD3QQAAACAqNNfAZiIND/6X/1X\+QDyHPgvnBoMrMHzSQ2eltyhQdJgz4H/GugmAAAAAEQjDIEGAAAAAACAqIAADAAAAAAAAFEBARgAAAAAAACiAgIwAAwygjDQLbhjgiAOdBMAAAAA4M714yJY95lw4XDhmn3xq/KXZEq\+qWjdp2ssn8YtzMv919Hst9K4bse/cOJYbWJ2lvxODi7wIZGVxt1BUaG\+uo4SH0tgiMSGyooqXpKemRx3mx346tPnQrf8PGckqWlPJDB30LRBT6jYYSw4mLCoIH/KaJaE\+oryynDX85XIJ6WNprq/nr3U\+gYjkY9PG80SUeigQbf08IQNf9z0ctIAtL1fCYJIQkXxtlJ6dnY2JzKp8jgK//WzklBCpnq8tMu9xtf99dylcKcNzJi0iUltXzG\+4tOiknDq9JwX7uhm7q7nO7ArRpoyPjm\+U\+1C5c4Vhv0Tbe8tv903PfzXvSV1cWkZkyL7ig0lH\+86yajnvzQx4S4a2qrp7MdFuxrlOfqM2oKlayrS8z/YmCMlEr/cVZC/VfzxL/NfTu3yxWkoeX\+F8XDK\+o15M\+UsiRdLPi4\+SRnz5z2dQEQk8CLLPRBfNAAAAIAHxyAOwE0XfOW1HT\+ew5WHD\+3bX3WyWVy/NKPLb1yJfFIyU1tRVd9aWKwv\+d3ekmMNJeW1loIlyR2/QJnE9Ez57RLj/REu25S3dBMt3v9bS5Z4fGOedW9jRxPGzM6zz3ui/ec\+7yt86Sfb\+Jfe3bMipb66e1ZgpJ0irlhVZNblVWTYPtk\+P/bYz19dfTJrgyPr9NbGH9tee5ojovCXpRWdaxDPbllhLmEeV0qa/FUNsfIn06QUDtU2y9f\+evvryQPxl4H7TRC/PFtaljBdJCISq4ry5uad6XoJleY//nYx7c\+dvqE8QSmn6qr6tLyjv14yvu2maDqy\+gfjVhPRk6sPHH3tiQfhoogX9\+YtfaMiY1VmeYGTlpBn76/Kswq3r6VNJnP5zA9cXQNw07mPVkzfXtVpi3z\+Fpf9X\+Nb367\+dOOv6nIyZ91VAG74/FdL5\+0P3b5Q3PO3/A2CYZpKC83O7P29fyK8b8eaVUXMwt8cfSsSgOs\+cxZuYlZOmTHxHv64I9aW7Cg8o86crWYoXNssth1drK/wft4o/vz137HPt31/xYufvbNi3vayOKW48fWFexcVWGeIZ/ds2igxz5wiv3CmeOM7m07KzQfeW5CKDAwAAAAweAzeABwu37Rq7qZL3Tc3lFhfKem6SWn\+Y6G04NXV\+5q7la3bbVm4u9Pr\+NnbT1k13H1vahdC5b5NRTVEtO2NgonO16j0TDmflbd\+dgrbXLbRXHi2OiwQRX5YCxU7jK9vPslk2/Rq9kzuvNeLG7rWFT97y5\+s0yJpX6g\+trdCjMt6eUoyy9YxxBA1n976ftHumrKECdvXT46vLy3sWoN80lhilEscH2SXvD533aiVOx\+4rk6WGCJimfaEwcQ9X3BLj65QyTDsqKn5760ULHPNIjVVnC4RRWquqheJxk5dPCUljuISkqn9c/luY6RPZqWwe4rMfiKiTRvK4rLylmfSubyy2hamcn/hz0sYIuKSNfNfinRUEjNqqv03H\+TIqf7wqudWeolIqDtetL88LmvWpEiBe2nO2MV7fmvJau3LbSp9W/e8k6aoxMOl4Smr81L35RZ134NNnbF8ufNQ3uFjlYueGN/zsYVaf3k9yXOyUrjWwxB3ry0lImIYYtpqYTpqY4hhmBFSLnysaEP\+JNX2JSOOFVjyC0vqKDH7hWTxs/3ek2vn1levTCWxqST3qWeJiJjE9ClKKcIvAAAAwOAyeAOw5On1R2vXExGRULF13k/ySxIX7/zAkiV\+aly44nBywdHOXSt1vyNiHtcXrJ/eS0eVWPXe2txz30KzQ8c2bjnWNHbqHGnZ7j25b4zIYXsZAVrv2/rGqvx9Ysbi1UuyEuMSkjdUffFe90Id\+zad3PfpyZaUxfrsJCJiiCViR03LXTG69ifWTQVbZ/56bdaU96q\+MO9arnvFP/Vj17oXJA17V/5o3n7rM89aiYiotauzc6j\+DgsdNOiW7m4kIjq/9hnp2vSVW/I4Ett7dImIKGXxdtcvJzNEoiCGzp4pE8Mi0Zd7NxRuKm0b9Nt8aNsWIiJKvJiaue6FbxpdP/gJvsJ5q4prO21pKsl/ZlI\+ERExlRXHTp6pYjJz5id33a1rUBMaPe9tKEoalT2JudcEJ9YUzX5mV0KyPIFhiES\+uopamMpLEobChzesLiFiE4mo4TOz7qU9dV13tT4z3trxKlZt/aRt5IJYd7KkSiTJhSObfl7KEMUlpMn5e2zoN2ElExevnlj/\+tbDvqr5qrrK6hATy7BieckZSYIyharrLjSGU4loRPqM2S8veCnnWebQKz/JX5Oc4njpsQfhDysAAAAAD4bBG4CJSPzrxn//UZ6/7aV/20vPbmv996Xcp8bnUpc4JzaUWF9y9jLeMlY\+pr9bS0TU8Nm71qJLKYu3FKxPK0/I\+11C2uiSPeL5Pbkv7WktMYaISLiwL3f2ql3nx\+Zs3jjxsGXhUx8t/vjXlhekt9TXlj7q/2B9Y0t5/PMbVk2Ob3\+zqbG8MpwyZ0pKZUV5kfNgwqJpqaGyvWfCY6ZMG98e5BJn2XKfPvlO/i7JfPuKaQkSSWraE9/59NuGSZSzl\+rixkpra9q2TFhsXzGtbRAsE5fMEJEgimJzWeEqLxGRUhQYisvKs2d\+atgQzlmXN19S/l5eYeXzP5703U\+/bZgxSmmtv46IGOXUHElZUWmISBofG6qtqKPYjJWr836h6pgLIDYeeuXZMa\+0vpJH/oclYu45/RIRjcrOz18yfkTroSqduabD0pkrlk8ZJWFbyrcWWA93FJVP0U99cgRDYvjckaLDl\+jx5\+fPTJYQibWlu3ZXdJQTqg8V\+cJE4c\+d2z4nImImLcybdB/aSkQkXjpkerWcLtWJt9wPXNqSnUfnswxLJH89a8c\+Z2jMKDnHkBCua2hhJmWqJ4lSOlO\+b3v\+vu35RESxamvaXU2eBgAAAIB\+MqgDMBExTFzmYtvSp6mk0Li9PFW/Mqt60yaffHG\+OUdS9V5e/slIMfnLzj\+/TEREwoU/bDNZrIcv0ZjZW45apyUQCdWfrjFbT6Zt2ZPfv\+Of6/9QuMZZRUTblv7PbUREGStfepphJJNe\+83\+155gwx6jbmkpERGbNKPgwITlxIR3rV24\+1LKnKXhNc\+Oeamn83/WcmCnyvvG2qLzxDzJHF/z6o4GkUgMnW0kscQ6r3U0eKikNH2\+flrcmYMljUxqolh54vgFqUQgokvFpteLiYho2ytLtxFl5Lt\+syrtgf1NLp6JnGaEfM57LkdmWJiQt397e4nQ3g3FTf78yKUrKsgtTWTYzALHz57mBqC9/USMpF8iEv2HioiIUuZY8maeyX1lT92Y2ctfV906E17y7NKCJZLfmTZU3fLWPWEYOvfRUnOky33U1JXTJQwRQ6c3FhxLmLckYUSnoqMy5q\+w5EiJwsfXlBQdJqLEH69682mOmkrf8e5tD8DixV2/2nqyJTJXWXLh4xXPrC1PVcmZUlE8YzUWSB25P77babdMXFrGs9V1Ion1RBQu3zh3zLyOWRj5T42PdKSnLN\+\+fWbsrbuHai\+FGOV82\+pp3CXP1o\+K67NWzn9wv2sAAAAA30mDPQATw4x4YlKyuM5SJo6atWrp4imNdPZVa5Hz\+EyrJmkEc7KjZFPlH3ZtfHdT0ZkQMzb98djy83vy12RJlzRufeOd4vOUsfy19H5e/6rpwqVwQtbi16dTUV4RPyNv/eyMVGnVGgpfKNmaF5YyYtXZjjWq2AS55LO8FeaS8OMLt6xfRJ8lPs1KpQkjGKHx4Drztvopeetny4VLoaavd8z7ybbPI9ObGQk3QsomyxNiQ8Kluso08878WZMSR7euNCte3LHvWAOFG97PndccYqYX5IrEKM37P8g\+\+frcdaPyHsTljrth4rIK/vhB5DSF\+ro6QSIRag5t2rD18Jmqplj5k8lSlsT6apFGqeek1e09QVkzpqaK5bv2FW6cke2YEv9N9X93JM7Kf76uYHt5wlgpNdbVEiOUWE1H6oiodk\+\+cUTdnMnpmZlPp0rist76fWjGuh/OLSKihAnLd25nEtIkbPX9bQ0TN2H\+/FHHtvqZJLk8rsV72Bk6V8MsTpT22MfMVxz8rIaI6Pz\+HYcXZeTIu7xbX1K47kiIiIoKCmcmLxEOlzWNUs9Mk1QSEYnnnCueqz794TrzXazaJYRCpFyQqySi8MktuXkV8vmWvHyGSKwqsuQWXZLOyC14XSkhkoxJk9QeJoqVj89Uj2FIbCyrrymPzBoWL5UXvXvo8zMhImIkZZXhp79x1XoAAAAA\+PYM\+gAsio0H1606VnSJeVKvibtUdo7Sl7yWXblh87zl3tTGtjwZPr3x9YV5pWEi6aTpOWMaj\+2uIaK63at0u4kYZc5ma96CtP5e/zkuc8bLSe8uNEV6ZffkvrSHHp8\+P0GkBl/xJp98ykvZU/Tzm6SRib0NJe8snecsJyJWKomTPrFgXls1dXVbGYYflfHsv07kxIbPfvVppSifoc\+odB5i0162LYqsQPvle/5jeWGKa0\+/kXGhJWEienzG8ixfYWRkqei3Pt91DjCRZMbGA84Zo/v5anzLyguXziWiTqfZ6snVrqPvrTTqVpSkLchdmhEvoXMbVuSJP85dp87Zs2nr4bKTRKlTlizPfEDSryCKAkmmrFg5R7KjxC\+hcNnhZiIq33eE4iYs3pn/Y96Zn7c9v\+SMeX/m0532C3\+\+ZcX0LRS5PeyJ97dRYtOZok1ElKiOU05MjT30\+ZkwKZflKCUneyj75d4txedHqBfPEHc7iws\+ejnrrYyOs6vYYczbVTsiY7FefvKjIsNCb9yl0JjZL08axVQyDI2dulxVV7Rn20tzq/I3dpkvcAeE\+pL8l9Yea2rfkChJSHs6S0oUFncREYWbYlMmTY5M6G2qJaKWupOl3trIEGgiikxZaCz7vJGYRHXO9GmpUqkYbiJJ/688DwAAAAB3aNAHYGo6UxxZJ/acc/VLzratI\+STkuVMc1l95KUkfc6i\+RcmxI\+XnN76q127W6TPTs9hK4oP14hEFJeoyer39EtEREz6/NfMT9LF3e8UnSQmLnnqkimPlZRKnsyaypaWJWS9nHUid96G4tpRO3LFDYYt5WMyM5pKy29bYfwLb245MCMcJ\+6Y7ey8XTpeKRWdnpOXFme2PtCo6eTHv/u8pUuZmYWn5tedLjlTVvTRjpIzVQ2JU60rUnbn7eqHMx9w6cvfW95UsPqz5KlJvmPMz37jyCpf86q1MnPl\+unp1FjOJmckhX73xqvWprT5SxiR6Mu9eYV5R1pnjI9JM6c\+KN103GTzn74wN1WXV4amrVoh1lcfj9tTtPsMTZq9ctX09LiwGDe74OgKKYlM\+8N\+BVGkWPmcQpdt1Nbn5t6yKvM9ipXOXL19viiSGDpb\+tcmUT4pjfn8jOTZrCeYllsWiBObzjrzzSXhJ5euzF1ErG/upu25a9LeXdL6drjSd7qeUubkblj/krxSGppe4G2IzVipz0hg6oiIkUycn79hSVa\+ocB7tlHs47LebEKWeec66Rtri7mFeTNrCvPausGFxqrKEBGJ50rK6uc91j6MgkmcavvAnFC6q6jEU19TRcSwDEOJU/NXvzxpFCNc\+jQvb1PpCNck\+Z085RsAAAAAvhWDPgAz8Vlm\+4qUkrylRYkbjm76cVL4\+Jp/X7hLlbczV7Lx3w9VRkqFyvaWVJ0r2bbtkkgjMubr0y/sLzrcSEQpc6ZLDpfs2Fs99Vt48q1QsSvvHWv95KlxRNQiNjVT3CgJEbGJ0xZnepe9/qMiojHTN6yfoUpl3j2gCjHi7\+bNvW0AJiKKS02LEyq6Bfi4J6dkP75929aPvDn5mgRREMS6szVi/Fh1QmOZQEQk1pcWPvc/V9Q2d8oYlw6ZCyRMC025nyc9wAQi4VKISMrEEhGxozTzs8rW/GrFj35VdV7MWDl7apacJVpg//UCEr/c\+qour/V6MEREibOsq584XFBYOXDt7wcsSw0l76/ouqgyU1/x6cbqT4XG8nOhdOsnv\+n8dWhqrGsiJmHErcORe1nBvC/EmuKf55WzYqi2pq6JiJwSahaJQif35D6/RYyPFSmrvWz47P7cgg3HmpSL8xc9nSCltfl5Z1/N37124clRokgZRJLx8zb\+6SWBGJaoSRCJiMbMWP66Ko7E9pNlU2esOzpFYJk\+f99Z6ROT0h7jYiXxaempzQzTGoCF2hOecy3SSZnM2dJPD1fPWhK5dC1EJIoUn5pMJ81llDl/ZrJ0vD7n2YJteauKW2tMzMnNGo30CwAAADCIDBnoBnyzWGlqsoRIbDiy4gfjxoyYNHdTzS2/yyVS9lI5nzh1paXAOoP5bHvR56SekyWnWMl4/fI5o8rW5RWW9LI\+9H3EqnLWzkipLTl0roWI6MmsttWYJfIXFi2YFEtMZt5O68upDBHFpaY9lnAPi\+xyqgWrnpeed\+bnHf6yct\+K535SKK5wVf12\+XgJNV36a32zKF4qrxXT5\+vVccQ8nql\+Nmux7b3t\+zfOHx/7YDyaVCQiURSJSGyhMdOX5CRLiIgY6ZRFC8aLVefFjJUfbPlFD4NgxaYwMSPiGCImVj5pQvoYhkgMNYRvKfgdx4xdvP9kbfMX544sTWcSp67/4JOjv/1k5\+rsW65Iw7mS8gZJyqTETpFRMnp8ZkZSD5G470bIExiKk6c/\+3z2pFFEzeH4rMUrn5eLjWEisalzycZjhRuKzydOtRWaIyuic6olO98zPzuKmsKdvvIMSyRU7st9ZYO3aWzO\+hXZt65qfhfpt5XYJHR5sjRRuGyr0ytMWJK/eskk8VjBO8WVIhHFZa3e/qcP8p4lj\+lVa\+Vks0MfXjf3udkfP7beVdv8RW3zF7Whs5XNRzfOvHVpdwAAAAAYQN\+BANyKYSYs/nDLb/a/lzdj1K1vyqesMC9IDO0tyDU7vZRl3u96d34iw0jkqcnZuW/mxJdunq779zd2Hr/Qvzkn/oXVBfmz1ZFHLp1z5q7ZFxJJrC/dUfC\+R0iUiqVWY8GnlfelDcxjC3ILFivrilYuXXO4rtLvLb0UCQliQ8mufZGla5PVi1fk2XIL7Bt/e\+ADy5IpmknSB2U6ovTHjj/Wht7LGUOSKev\+eKrw5fESIhKFUPlup4eXSqilbO\+eY2dbL7VQX3G65ETZ2bAoNFaVXhLjJE3nqsOs/DGOYYhIqP6d8Sc/ec/XdLsjfscJjad3fbRu457ypq7P/BUqdr23ry5\+wrRJnVaN4pIX2H/96/X/ej96Lxn5zBXm3IU/zmwpP9koefL5ZfkLp73w0pI5iRTJsh1GqJevLvh4\+7tLOvVOc5OXHzh69ONF6R2NFhtK3l/6o1XFtbEZK/PzZt7Pxww1nS31VlLKpGRJ6\+HEi3sLcjf5pTMXzZqkmrXqpZSGI9af7/tSoIa9BXOf\+tGPjPvrmBEMEysdM8VsX6oWj\+QaNhy8EPrrrrf//ann5q75Q8P9axsAAAAA3A\+Dfgg0EYnEyF9YtDJBkj3lX5/gRDmtuLi19Piuw/EXmoklhiGqP5w7/fVdtcQ8/vzizYuW5EweLVTsMB6uYtOWPylhE6bkOTeSMW/X4ZKqJTOe/uYD3i2heodxef7uGpGIGTNh6pxFS5Yklxk/EmtLis9NX55fmNfkXG10rniq5Hf56zqv0NPWuxU6vWPPwXOXys81U1y3vrdIV1m3nm/5tPXvvUuvr9h2RCSSsgyRKJLIPD57ZVZF4W7Jyg9zc8ZL4zMXPUFEvO/T3RUUR1/yJD4gyz0RdbkioiiI1HDEWqDMWb/OzOxZvWzP6mf2bZqxyLz\+Z9PY6q2GVcUNRERl54no8LbzzSnL87NTmSoiEsN1Fxol4n157O3g0SIKnV6xIyR8SdG2EvHJhXkzE1tDY/2JTcZV1s\+lszYvkpe8v\+5chbeBmFSGISK\+\+vi5kFjvqxOJuHu5Mo2HzEsPtb86d2TzsiOb216JTS3U8ScZRjJp\+oIXuqz53FS5b9eOiou1pXUikxEXS0L1wYK83MLSEMVmLC98N3dy\+94iiUT39AE2VX6c\+8qGsoTp785MZiqJxFDZe2vnfl4amrR0u23GaJbohRV5y08s3JSXuz48\+pM9dXFZBbnTU4p2Rhofn/Xmlv2ZZUJyBnsmP2\+7tz6WNi2d27Rxi23GYxgFDQAAADBYDO4ALJIoii2iSPFZLy1vnSrIjM6aZ0mVrnru9W21sRnLZ6dzRJRltm\+cxmRmZ0pZIuJPWKYv3HYuNn3l0qlJDLVOC8xaWU/xCf251hGbmJGVllGfpnn9Z4tnRnqxQqGkNPWk1e\+2jsXNd016ftvGUvlMVTwRkSgKJLJhal2tRyplfbs2HQlRbMbKrBSuU82CKApEFO4\+9puVT/vlrw9kbVht2seMT5SQdJr9j\+eJiGj5L7uW5JKllea5m2qIEmflTnhAxmVGZoEKokhEJIYFkkxauOHDN6clMUSq7UlphQU7yxMyM5IYEiYsyLdoWObLXe9vO9zIiM3MlNwNayfHkxgen0jbSqtoRHb8iNsf7Tsk/gXrnxrbX4mRO\+2xBR/8ZUHnUuHTe52/O0nq/I0FC9LCO7YUbSoJx2Uue31CPBGxsXXvvb56XzNR4qzUUXeZ4ASRaOzi/b\+1ZPX4vRP/uvEnuo2Rf4oiiaJA3RauihuTLH6\+attJYh6f/XKWlKUQQ8SMyVycn7syp/PKdiLxrad61\+JSZ6zMr36C1U9NYsLnRJFa6k76pJOWbt/5ZtszoqWaVbmLS/K8pX/wXxs7y2rJGS8JnU2WbDqy4gfjVnSpbNSsDz9YIuzzsokPyupqAAAAAA\+GmH\+Er/Zph\+rKiqeeeuobi73//vuaH/2vu21VG\+FCRXk9ycenxXf/AR6\+eLY6RInp46U9/jRvqvSV85L0zOR\+GPHrOfBffTk1QSS2t46p8MWzFSFKTBkvb20nX336XIgSktNTu52X2HAhJBIjTer5fO\+oIRcqymtFZkzaE0m9taePpzbghNCXkdsgUx5HJNRX1zHJj3G336Xur7UtDMXKU9uHzoa/LK0IiRL5k2mjb7/vINKXT4qv\+2tlI5PU85zzpvoQkxD5s1H16XPhTreHePGzj4vPtcifnT418zZ33e1aIvDV5ZWiNLXXCytcqCivZ\+Tjk\+NZkYgRBGK7H0lsOFtRJTDy8Wm3H4/ddKGiqp6k31Ssjze5KNA3TicWGyorquq7Ru\+4xIzxtx\+b7TnwX6\+99todNgMAAAAAenTq1Knk1LQ\+7TK4e4DZpLSJST2\+Ixk9XnWbJ9nGpar6cahzn/SafolIMnr85C5nwSVPzEruqSQTnyTvaXtfGtLrxfzOYqWPZUofa3\+VkPzY7UpHCsmfSO22SfJY5uRv3vG7i5M/kdnrzROX0DYagEuemNX5HWb0C/OWv3BPR2a55ImZty3QcU8yRLemXyJi4ser7mTMfly/3N53spgWE5\+qiu9\+UwEAAADA4PTdWQQLAAAAAAAA4B4gAAMAAAAAAEBUQAAGAAAAAACAqIAADAAAAAAAAFEBARgAAAAAAACiQj8\+BulumwQA8ODDY5AAAAAA7tHgegzSg/rz7v3338epwcAaPJ/U4GnJHRokDcafCAEAAAAGBIZAAwAAAAAAQFRAAAYAAAAAAICogAAMAAAAAAAAUQEBGAAAAAAAAKICAjAADBoCzwvdXnfbAgAAAABw9xCAAaCfBBw6hUypUndQKbgYVqZUKmQKpUqtUspkGru/I\+AG3UaVyuAOtr3mvRat1urjB6LxAAAAAPAA6sfHIAFAtGNlOpvbruXaXvNuo9autOi8JiuZHDaFQ2/rVJr3e/ysyqySda6B/bbaCgAAAAAPvoHoAea9ZlXMrdRWn0BEgt9p1Ci4mJgYTqkxuQKtvUNCwG3WKjk2JoZTqI0OP0\+33x702HQqGRsTw8pUepu3bTPvsxvUCjYmhpUpdVZPsKNVQY9VK4vhtM7APZ1cX9rDe0zK7ldBZW5v6yDEe\+16JcuqbZ067YSgx27QKLmYGE6hNtg8nT4xm16tYGNiOKXGYPcEuw5kFXw2DRejNHkFIqKgSy/rch2URg/fWo3LpFFybAyn1OitroBwu\+vW0RZWodZb3a1tEQIeW\+vmLndDbzdb385UCHrsxrbNHQdt3yvg1MtiFK3dmre0XaZ3tt6FQY9Vp5SxMaxCrTc777rXk/eaVTK11du5FYLXpOJav2AkBDx2o1YVOW2FSmuwuiIn2fWLycoUKq3Jcc\+9r0LQ67Ca21gc3oDP5fSxMsFrt7u73hRCwOvlORn5PB6Px\+Px\+iNvc/StZ\+CAUyeLiVGaWm9CAAAAAHhQDNQQ6LhxizYf\+H1nx\+0GJUu812IwemRmd83lGreRcxkNNp9AJPjtBoODDC7/5csei9Jj0ls8PPW6XQg4jQZrUGP3Xb7ss2v8Vr3JFSSioNusN/tUVu/ly36HjrcZDA6/QES8z67Tmtwki7vH7qa\+tYfT2Pw3212r\+PDFcdlanZK714vbPwS/w6A1OHmO63yRBJ9dr7cEVBZ3TY3bqvZbdQa7XyDiPRadwSbobN6aGrdZ6bfoW691e2UW67Gm9u49gRfYCWuOX2u/Gn67hiMi3mPRG9wyk9t/xecwsC6LxRUQertugt9hMNjI4PBduRJwmWUuo97i5UnwO4x6a0Blcddc9to1Qave6AwIRL3dbH0708hmv9rirqnxWDVBm14fqaVVwG2xuOo7ahF4GvfTA1famx906mVEJPhser1dMDj9lwMuk8xrtTj9XYP0fRL0mLRai19htHsuX65x2/Sc16LXm9uSXsLkdWXXbt68ee2K3\+0wKX1mjdrgDNxLS1iZ2mC2trEYNUql3mx1eAIBr00n6/x9470Op1/gPTaL2Wwy6nVGe/9cgm8k\+N0OH5c9mdyOzn8jAwAAAIDvvoEKwCynVGu6UKtkLAW9DldAbbIY1AqZQm20mJR\+p8PL8z6Hw68wWU0ahUymMljMmqDb4QlSL9uFgMvuZXVWi04pkyl1ZouW3A53QAh47G5Ba7HoVTKZQmu26jmfw\+0XiARBZnR6nGa17N7ybx/b03lXwe80W4Nai1nN3VMT\+o8gcDq7x2XRdA0tPCn1VrtVr1Yo1HqzWcMFvH6eSCClweq0m3UqhUJtMBvVrN/bqdveabH51Yuyk9rr5nniZFz3Ywa9DhevtdqMagWnUBscXp9Dr\+jyGXW\+brzf6yeVTqtWcJxMpdGpuYDPFxSCPref05nNerVCptJZrCaZ1\+4OCL3dbH08U4FkOovTYdGrFQqV3mTWygJeX3tqCrqsFq9CP21cW00Czwssd8uJ8j6nI6Ay2yJ3jt7m8bmMyv7o9xSCXh\+vNFitRq1KJlOodWaH2\+0wa2XdyrGcQqUx2FwuM\+cym933FAMDLpNWrVar1Tqzm2dlJPA873NYbV2/AkLAZXPxGqvb6/V6vS6zRqlUK1gi3muz2L7VHCr4XU6/zGA2a1iP0xP4Fo8MAAAAAP1tcC2CJQT9fl6mUrVmHFahUsmCfn\+w3u/nufbNJFOpFbzfHxD4nrcH/b4gq9K0daVyKo2S/N5AfcAbEBQdmxUaJRtJazK1Tqvk7j1v9K09nX/9Bz02m09pNA3a\+EvEqXQ6lax7F7lMY7LbDK1ZTQgGgoJMIWOJZBqDyaCOxCre63L6WLVWxUVKBVxmq09tMWs7AqYgCELQbdGpZGwMp9AYnX6eiISAzy/IOI9JJWMjo5e7B6Eu102m0qpZvytyZYM\+t5dXalQylgQiar/YnEzGCQGvn\+/tZhP6dqacSm8yaiKVCH63wyuotG1zWINuq8WjMJl17aFdEHhB4L02gyoy1tlg9/JEJAR9Pp6T\+a2ayJBxrbn7QOr7hZUpFazfaXN620YfswqNXq/tZdwBp9IZVILX5b2HACoIPM8ZHU6Lig/wgkwhE3w\+j8Pu8HaLv2bLJxcufGI2OfyCEPR6AjJt5A9SHOu36jQ6\+7c1N4D3OZ0BhUGn0eg1nNfhGaBuaAAAAADoDwMVgOtPrM14qPNUSE7rCAiCEOCJU3BtpVhOxhLPN/Hdus1YGUd8MPKElB62hyOb20IHy3IcK/B8kxDZzHaqXeB54b79vhX61p7OA4JdNjfpTDrFvYfwgSP4HRZbUGM2tqd4wW/XsDExI5\+2kdFub\+27DbotVp/KbNEqOu3KB3k\+KMj0VofzQ6NacBl0JleQBD4QvHDM7VdZ3YEaj1Xlt\+iNjkDv102hs1pU3tljH4qJiXn035wys82o5kim1ih5t83p44l4n8Nq89bzPN/bzXYnd8OtZxp06mQxMQ\+lmYM6u8OoYomIeI/N4pIZLfrO4VLgeYHnOa3V4fzQomE9Jp3BERCIDwQvnHH5OJPLf7nMoeXteoPd1y/BS6azOWyagOXpRx/ilGqd0doRhXvCyhRKTggE7\+lRRELQa9HpjK4AEcspVazXanYKGoO6/XbnfXaDycWtOXB8s8Zn1httFrtfadAqWCLilHqHz20kq1at/zZCMO91uHilQatgOZVeK2sdJAIAAAAAD4ZBMwfYbdPe4/jj7y7B73L6FQbDIO7\+/SZC0G3Waa280W7XKdq3sgqdzb1z85q5Cr9Fp7N6eaKg22LxyEwWfUfypMhsaIH32Axarc5gdTitWt7j9ASJBIqboLcYtSqZQm2wWnWc19mxmlb368Z7bXqTV1l4oKzmcsWBzZqARW9yBYlVGm12A\+vQjoyJGal1kEaddA/LKvV8pjKt1bln87pFyqBNrzV5eCLeazc7WaPFoOo8tIBVmb0877MbtVqdwexw2vSs1\+kOCEQCM05vNutVCplKZ7EZFX5nfwUvmcbo8AavXa5wmTXkscx7\+lFObep1jLFAAt3bIlSs0ugOBPy\+QDDg0HKsQqPmgoLaZNZ0DLsWeFZlcjgtWrXR7jBybouTdKb2YdkcK1ObnB6HlnyBfn8mcNDj8Ahqg0bBEnEqvU7hd979gmQAAAAAMNgM1GOQInOAVd1\+WAusgiNPgG/7yS3wQYE4Lo5jOVbg\+Y5yQZ44GcdxXI/bJRzHCh19VgLP8wKn4OJYjhUCvNC5dpa7ZajrvZxUn9rTPizW73EHlXptv8z5/DYIfodRZ/IqLU5ntzHcrEyl0as0eoPOrNE6Xf55gtPilplchtueK8spFDLBF\+QFBcexbHufPSdTyVhnkG8/bNfrxvtdroDSaDdqVSyRwmjh3RqLyxvU6WRKndWls7Y1Vudyy2Qc2/PNdtsPofcz5ZQanVKjM\+jUWo3V4TVxfrOd9A6jmiPie6yLiIhTqGTkCPCCWibjWLbjRJUK1t3RtD5hWY4lge\+SWwWe54ntcqezMqXGYNUYrLzXqtXabG6TRtfTGQf9/iCrUtz9BAEh6LFbvX5/ICgQq9BqOZfTL9YHnXa7X2CVkTIyjdGmifyTU2pUCo/SbOj2fw6sQmdz9tTC\+yvgdri/uNA0b\+xv5rVv450\+s1rD9fuxAQAAAKD/Da45wKxCpeSCPl9rH58Q8HqDMpVKlqRUynifr7VHTAj6PAFOqZKxsp63y5RqmeD3tK25xPs9flahUSQp1Uo24PF12iwo1Pdz0eW\+taf1wELA6w7INOrv6vBn3mPWm/1al8fVKRPyHrNGqetY95nliAShsdLtOXHh4MrI6PdH5/3mizPrn35IafJ84bEZTe2lBT4QCBInY2UKjZIN\+vytvZN80B/sWCqrp\+vWpXuQJZaIZVni/W6nq/VjFwIep49VaZVcbzdb7x9DT2fK\+2xapcbaPlyZZVkiIXzR4/JeOLH\+30bGxMTEjPy3/zzzxUc/elSmd33htZuMnZ7KFfAFiVNwnEKl5Hh/62N/iA/6AwJ7l6GTlSkVbNDn79RXyvs9Pl6mVMlYIeC2Gk1dFpjmFCqlrJepAELAabX5lfq22dx31R6Wk3Eyld5sNmpZr9no5Kzesg/VPpvZ7vV179DlvTaDyau2WG5ZletbIfjdTi87bd2e9pEpBz786YSg23Evc6ABAAAAYBAZXAGYOJVBp/BazQ5vIBjw2M32gMpoUHGsymBQBWwWmycQDHqdZqtPoTOqZdTLdlahNWoEl9ni8geDPqfF4ma1Ro2CZBqDlnVbzA5fMOh3Wy1OXmO8r9Nu\+9ieCD7gDbAK5Xd0ADjvsZpdnNlu0XRJLJxCJRPcFrPd7Q8GfW6bxe6TabTPvmD1dTy/6PLOueMmrDl\+zW/TJHHkd5oNZqc3EPS7bUaLh9NFPjGjjvNYLQ5vIOBzWsxOQW1oW5v5luvGKbUamd9hizzVNuhx2D2RlbeEgNNi0BvtHr/XadKbPZzOqJH1erP17Uw5hVLJem1mi8sXCPo9DrPVy6p1mVkmj9B\+old\+/9MJ4xYduBx06pJkbMBtMZrsnkAw4LGbzC7SRKabGg0Kn81s9wSCfpfV5AiqDHc7JECmMekVXrPe7PAGeD7oc9uMBntQbTSqOWJlMtbvNOoNVqfHH\+SDfq/LajI7Awp1txXQBd7vdVoNWqNbYbbd29LknEpnNBm0CsHv4wxOn9ehV6kMDrdNr1Z0XXku6DHr9E6F1WkdmPhLgt/l8HE6k1HXvji9Vm8yqXmPA4tBAwAAADwg/hG\+2qf//PnPf755B/7zP/\+z1/euHF8zoYeWMNmbK67dvHmtZudPJ8cREVFC9poDl1sfDXvt8oE12QlERBQ3\+ac7a9qeGNvb9ivHC1\+MPGSHGTf3w7K2565eKftw7jiGiIiSXiw8Htlc8\+G0uK5tiZv2Yc3dnFqf23Pz5rWaD6cljPvp76/0VNu37HandvnAoqSuF4mZXFh2\+fdvjOv\+QU5Yc/zKzZs3r1TsWfPi5CSGiEma8OKanZ3OubXG1gDc\+ur45p9mj4sjYhImvLjuQMcHXLHzp9lJcURM0uRFmzsq6fG6XanYs2bu5KRILdN\+uvn45bbGr8mOIyKKS8r\+6c6Kax2V9HCz9fVMr9UcWLeo46Afth20o1WtAbj1VdnON6ZNSGCISRg37Y2dFVfa23JgzbTWCzC38PeXr928jdvfhDdvXjn\+4Zq52eMSGGKSJkxbtG5P\+2FuXqs5ULjoxcnjEhgiikuakL1o3c6yy5Gdun0xmXEvFv6\+\+9n0oSXXaj58cdyEF99Y05s35k4eN21zxbWbVyr2rHtxwrhp67od7srv35icveb4lZ7rvyu9N/jK79\+YkDD5lqNd3jM3KWHahzW3/UDuYzMAAAAA4E79\+c9/7muejflH\+GoPYbR31ZUVTz311DcWe//991977bU\+1fxdgVODATd4PqnbtUQIOPR6r9Fl761Hl/eYdTaF3WmUBVwON6szarsNyOA9Rq2Zs7mt92\+BuEFy6QZJMwAAAAC\+006dOpWcmtanXQZqESwAeNCxCoPLa7hNAU5j9WiIiEipMyl7LGD3evuhZQAAAAAQpQbZHGAAAAAAAACA/oEADAAAAAAAAFEBARgAAAAAAACiAgIwAAAAAAAARAUEYAAAAAAAAIgKCMAAAAAAAAAQFfrxOcB32yQAgAcfngMMAAAAcI8G0XOA8dsOAAAAAAAABhUMgQYAAAAAAICogAAMAAAAAAAAUQEBGAAAAAAAAKICAjAAAAAAAABEBQRgAAAAAAAAiAoIwAAAAAAAABAVEIABAAAAAAAgKiAAAwAAAAAAQFRAAAYAAAAAAICogAAMAAAAAAAAUQEBGAAAAAAAAKLC0LvY59SpU/e9HQAAAAAAAAD9KuYf4asD3QYAAAAAAACAfoch0AAAAAAAABAVEIABAAAAAAAgKiAAAwAAAAAAQFRAAAYAAAAAAICogAAMAAAAAAAAUQEBGAAAAAAAAKICAjAAAAAAAABEBQRgAAAAAAAAiAoIwAAAAAAAABAVEIABAAAAAAAgKiAAAwAAAAAAQFRAAAYAAAAAAICogAAMAAAAAAAAUQEBGAAAAAAAAKICAjAAAAAAAABEBQRgAAAAAAAAiAoIwAAAAAAAABAVEIABAAAAAAAgKiAAAwAAAAAAQFRAAAYAAAAAAICogAAMAAAAAAAAUQEBGAAAAAAAAKLC/w\+lEkc/SRzZzAAAAABJRU5ErkJggg==)

*圖 4\-7 商家銀行帳戶註冊（已查出初始資料 1 筆）*

### 4\.7\.1 畫面元素

__畫面元素__

__定位（id / name）__

__型態__

__預設值 / 初始狀態__

__說明__

頁面標題

h3

文字

商家銀行帳戶註冊 \(CP Portal\)

商家代碼

\#merchantId

文字輸入

E000001

註冊與查詢共用

銀行代碼

\#bankCode

文字輸入

空

寬度 4；資料表限 3 碼

銀行帳號

\#bankAcc

文字輸入

空

寬度 16；資料表限 16 碼

匯款幣別

\#currency

下拉

NTD（新台幣\(NTD\)）

另一選項 USD（美金\(USD\)）

外國銀行

\#foreign

核取方塊

未勾選

勾選 → isDomestic=N；未勾 → Y

註冊

\#btnSave

按鈕

註冊

訊息

\#msg

紅字（span）

空

顯示註冊回應，不會被清單查詢清掉

提示

\.note

紅字

送出後由 Finance 於 SA Portal 審核 \(審核作業尚未提供, 狀態先掛 W\)

查詢已註冊帳戶

\#btnList

按鈕

查詢已註冊帳戶

第二個 \.box

清單

\#list

區塊

空

前端以 JSON 組表格

### 4\.7\.2 操作流程

1. 填銀行代碼、帳號、選幣別、視需要勾外國銀行，按「註冊」：$\.post\('/bankacc/save', \{merchantId, bankCode, bankAcc, currency, isDomestic\}\)。
2. Portal 轉 POST 後端 /cp/bankacc/save，後端新增一筆 STATUS=W，回 OK 或 FAIL …；回應寫入 \#msg。
3. 註冊回應後自動觸發「查詢已註冊帳戶」。
4. 「查詢已註冊帳戶」：$\.get\('/bankacc/data', \{merchantId\}\) → 後端回 JSON 陣列 → 前端組成 6 欄表格放入 \#list。

### 4\.7\.3 需求條文

__編號__

__需求描述__

P\-BNK\-01

初始狀態：商家 E000001，銀行代碼與帳號空，幣別 NTD，外國銀行未勾，\#msg 與 \#list 空。

P\-BNK\-02

註冊成功：後端新增一筆帳戶，STATUS 固定 W（待 Finance 審核），回純文字 OK，\#msg 顯示 OK，清單自動刷新並出現新資料列、狀態欄 W。

P\-BNK\-03

幣別只有 NTD、USD 兩個選項，存入 CURRENCY 欄為所選的代碼字串。

P\-BNK\-04

外國銀行勾選對應 IS\_DOMESTIC=N，未勾選 Y；清單顯示時 Y → 國內，其他值 → 國外。

P\-BNK\-05

清單表格 6 欄中文表頭，依序：商家、銀行代碼、帳號、幣別、國內外、狀態；資料來自 JSON 的 MERCHANT\_ID、BANK\_CODE、BANK\_ACC、CURRENCY、IS\_DOMESTIC（轉中文）、STATUS（原碼）。無資料時只有表頭列、沒有「total rows」。表格由前端組成，沒有 border=1 屬性，樣式同 portal\.css。

P\-BNK\-06

清單以商家代碼完全相符查詢，不排序（依插入順序）、不限 10 筆（全部顯示）。

P\-BNK\-07

銀行代碼超過 3 碼或銀行帳號超過 16 碼時，後端 INSERT 失敗回 FAIL …（訊息含 Value too long）；\#msg 顯示該訊息，清單仍自動刷新。銀行代碼或帳號為空時依 P\-COM\-32 失敗。

P\-BNK\-08

不檢核銀行代碼與帳號是否為數字、不檢核商家是否存在、不檢核重複；相同資料可重複註冊為多筆。

P\-BNK\-09

狀態欄以代碼顯示（W 待審核、A 已核准），不轉中文；本版次不提供審核、刪除、修改功能。

P\-BNK\-10

\#msg 顯示註冊回應後不會被清單查詢清除；再次註冊時被新回應覆蓋。

P\-BNK\-11

清單回應非合法 JSON（backend error: …）時 \#list 不更新、無訊息。未登入時回 \[\] → 只有表頭的空表格；未登入註冊回 please login 顯示於 \#msg。

P\-BNK\-12

初始資料：E000001 / 銀行 007 / 帳號 1234567890123456 / USD / 國外 / 狀態 A。

P\-BNK\-13

銀行帳戶幣別代碼為 NTD / USD；交易主檔幣別為 TWD。本版次未提供 Finance 審核，帳戶狀態維持 W。

P\-BNK\-14

商家代碼由使用者輸入，不依登入身分限制可註冊之商家。

### 4\.7\.4 後端介面

註冊

POST /cp/bankacc/save（form：merchantId、bankCode、bankAcc、currency、isDomestic 可省略預設 Y）→ INSERT INTO MWP\_MERCHANT\_BANK\_ACC \(…, STATUS\) VALUES \(…, 'W'\) → 純文字 OK 或 FAIL <例外訊息>

清單

GET /cp/bankacc/list?merchantId=<商家> → JSON 陣列，鍵：MERCHANT\_ID、BANK\_CODE、BANK\_ACC、CURRENCY、IS\_DOMESTIC、STATUS；無資料 \[\]

\[\{"MERCHANT\_ID":"E000001","BANK\_CODE":"007","BANK\_ACC":"1234567890123456","CURRENCY":"USD","IS\_DOMESTIC":"N","STATUS":"A"\}\]

## 4\.8 CSR 交易查詢（csr）

路徑：GET /csr。資料端點：GET /csr/data。後端：GET /csr/trans。使用者：CSR。

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABQAAAAHjCAIAAADzGSWfAAEAAElEQVR4nOz9e3QT170w/H91nbEtyWOwYDDGFohgAYmRA2\+iXAiC/ApKnpoqqRvUOk0UTkrF29KjnkWLcngeqvI\+tKJhneo0zYuapCDa0Cqtm6hwTiKcN0GEhEzyABZOMDKJQAZfhGXwWLLs0f33h3y3AUOTkNTfz8pawaO57Jk9lue7v3vv4ZWvfQYQQgghhBBCCKF/dvxbXQCEEEIIIYQQQuiLgAEwQgghhBBCCKEpAQNghBBCCCGEEEJTAgbACCGEEEIIIYSmBAyAEUIIIYQQQghNCRgAI4QQQgghhBCaEjAARgghhBBCCCE0JWAAjNAwQpglbnUZEEIIIYQQQp8TDID/yWQXlaVKhSMWCDNy4VXX/mwR0uTGlfEq8jPZWXaRpve5\+1OyG9lGXhbfuCQlv9lDEvL4Cz\+ObJmXAQCATHVtd/P/6n7rJ\+xbP2Hf\+kn3//nFlX3L0iPDY4LMyMnsJHZ8C84FAGTyxPplSc0SrqYsM3J56Txu/eJRJwJkqvZ\+TiO9sf1fo4QyeaqqaOSVyco\+m7viJmSqKpJV0omrSUZmiFE/XrX5Y9J1PTnCjOyz/a28qRocQ16SXCH/7M7xsyJMV2u41UUTFUyYqSpLj7wDCWHmhn7LJo\+4\+r0BZLqqLP2Ffc0ihBBC6B\+Ef7T/MQVzd/zq8aoPnIY/XIwMLyVXbNy4a8Z7hl98GEh\+ocUhpKn166Ka9oInXyECKQDIrF4b2SbNe3J/7kcAyKx4qHfL7UPP/VlZUUae4geivFE7SvLrD0h2nrvR9pFs6ZLYCxWZTc48hpt4haqVkX0rM\+Exh4OsTJoN1Bc\+\+a4gPrhIVpRWirLjtsoS0mz8uPSRA6IIjCUriddUEPWnheHUDRYcAADiYdH\+QP\+ub/YxDkl9FAB4DYelA0USZmprIyvGnMvq6DbINwyWRLkk\+pxavGn4Uo8o2Bd7LjJ5YuPtcORKomaJoI5LrGjhy5dzsvdzFZqVlyeqpYK608OXmshLrb4ncaSZYKI8gEx1bc\+uedDKDdZRktf0rmTz8eH1cyciv2oJs6XK/udWZvfvk\+5u5wGAfF7fvrVZ\+\+9zV/UzIJOmqkqyBOQuKS9yRciEeQDZRcv6zBXZSD8vDgD9gvp3SYZMbFkbP7Jf1jD\+0MJ0dW2kNizJ1SAh5154mgu8Its6wW1/A3U9CVnN16K7Sogn95GBVFa5mFtfMdxCEfDl7T/HH77UZGpLbUx\+XLL11JjrP8oN1aBMntRMG44nZdKMsiSlLEmuUGbC78seeVUUvolz\+vwIMxpNPN5J1HeP/YTIS9es7a1qL9hwQNyaAhCma2oj1QHZyK\+RGyIr4XY9yinzACArl8JBZ\+Eead\+WacSefm7Hctj9kqSumzfBVjMS29al9jikBz\+j2xshhBBCn6t/5gBYtmCN69kVi4Z\+TvQHmpv2u97a/zE7yccjYsbc6ioh8/YnrV9sHHvT4lHRzlfyXngytm2ZcAMjkFX0b6ng73lJPOIxnX/kDdmRNwZ\+IKSJXaa\+yAHZ1ubPoC9APCre/nsJPMatLiGYqwfPrT6J4dUxIV\+m\+rFozagQPS2TZkqh97UKXqSd3HOFFzguefKAKALZqoci20SD2wnT69f11pYMxJYEmSnNS\+37cf9Q/Ubaya2vkE2TjVL49a9Ltldkmyb5IJuEETdSVjYtA/28yKhj3ZpziaeyymV9yoAAUgJIgkzJ1c7g2bsHa2SCm3ls8wfzhmTD2Ig3s/qhWI2UF07xAIDIS1XNSynz0jvWJQP9A5sTeRmindjXmX6khNfUnVmxMlbaLt7/vlB5T0IWLpjsVZ1ApuZJdoeS1xoFWVEmclS2Ndq/6x5gAoIIZOVlCeUF6SOviiLAazpesOE4AGRWrI08d3uWYTIrlvdrZmRLa3tqAAAg0pK3\+dXBqDUvUyXlNxwWRABAmK5\+uE8zDUq/GXlrcM2trxLDV/v6dT1p0lTN7anSGeltGuEmhq\+sSJS2SzYwgjhkNQ9FzBWZuqEAmEyvr43WSsWbzwniZGrjuljNjJGJUF7gfcnmdwURgMnV4MDFrFre\+5waAp38SD8vnuJF\+vnhsLD\+qLiuXtBwQXBj0a8wXf21mHlZqlSWJZK8QEC8/3D\+YACfVc6Lb1zJrVCm5SKIXBE2NBO7XycZDoBM7vpxpGbaiP308xuaSfvr5JFunqyE2/a1FER5uZ2UliSrZmfia6OyC0Onk5VLee\+9JU7dkSC6BfEZcfPaZIMvrz6VqCnhM2/yby76BYB4VLTnFTET5hNy7oV1KSbMb\+0Ww8ORF/qJnfvzmbxUVUrUEAWArHJxfAWI9udakVIAycHrT6ZrliXDp4kjE4XKCCGEEPoy\+GcOgAEAervrfrN78we9ICKVty\+qXfvgls3S\+NaX97dN5tFVKF9wn1nXvfndL3sATEiTW9Zy8n5\+BAAg29oukKt7XWpeBLLxbv6i5X07AAhhVgbCPQfIEbnZjOb\+/qor5IbATUa/RFFi27q\+CTpefrPnXSFAKvcIC\+Hm/M0HxK2DH5aqe19TTpQBbs/9OxeiZ6tWRrdJ8wYCxZUJEMEEUoI9\+wv3DP6kXBZ5YTGx4SbzcgAAwAnrTg2Xqmpl5PV7eAMlLMo2nQYAkJVw21amoB9kZWklcNvy4kQetB4nAyXZSItgdGB/a84l3i3e/X58mzpD9ANAVj4j23RUOj6BBgAgTNc\+GquWZpVFadna6GpOvP1vYhBllMv6d5Tx4rnbJiXc/TrZwPHr35DWAwAAIY/vMsaB48VlGU1FMnK4YOfR4UYWuTx5JCWA0wDAgyQ/XhJfX8YLBJIbHx36LcqWliVlp2SGw5PP1PGaDkufPMpfsa5nIwAAhFvIna\+KWyGrWZveNrxaZsVDvRtLsqUlcPAv\+QFlbN89mXgnsd0hYaTcC0/2t54WtQ6WUyZPlEaF9RWx52aQdcL\+bbdnI4H8Tc68Jim37\+n\+8GlRIHVDdT1J2aplfZpo/obXMxvX9m7pljJXWY8gU\+vXRddLxVv35ddHAUC4e1/h7vHr3UANDl/MwPECw0T9Dm4MmdpojGxRQpOPsDeLwpBZNC\+\+0dijeV22iRHI5vW98DQHzfk7XxIz3dkqdb/5a7Hn8viPvCJuBYAUL/C27JE3hBEAEGY0i\+PrH\+57bh3P8BLZ1E5u3pc7QGbFQ9FdUl6kH0pnJ1dwAvvreXUXBuNbYaZKLA4PdKzghaPZFas5eVQo1/TtGLqGeSlNiWCnQzLJ3GxpRd\+uhzIH90uOlCdk7SQThTiI9viEpVJhpKLXtTLd8DfZ5lOCOGRLK7ia1KhuFANHFKVXLIu3XiCOTPjrhhBCCKEvgRsOgIm597p\+dnfg7bPy2\+eWzpASned2v/T3/Wc5AKHy7ge3PXGXpjQPesPMIc/WP38iq35634Mdm7b\+nWFBfve61/99QeD/3f3koa64qHj9z75X21Zn2P3JcMKBmrtjh6GquTEwt3L1PCl0X6h7qW77u11xAGL2QvMTD1bfXlIq7g98fNL\+0lsH2Vnb/vfjq8/XPfKbM2GAXK/j5xac3fA//5uJTVTuJBdoOLmTJav\+94OrK6i6ti6g5tY\+/T823l0iFyfD587Xudz2D1iY\+4DrZ0vDJ7uVd8/J\+EMzl82VAbj\+tGi/dffWs9KaJ9asv3vuoiIIn/tkzx/\+a0/DZDPJA5eOmrv\+6TU1VbOU4lTg/Pn6Ax77u11xIKvW/I8taxdUlUqh\+0L93w5t95wP32C8HY\+Ktu8fEVQJ07W1keqAbNO7V3tGz6x\+tGdHifBIu/BId7p27dAlyyorkpHXCzedmlQWJd4t3uoQ5464vrZX0yzZzAzk0zY\+HamJ5m16hRifsbx2Bpgg05ryDAHZ0pKMTJhaUZGNA8ikWWLgo3TVtCxcGY6fCWlyW21MI4XxWdN4O7n1byOf\+69pIMOWkUmzrfWFhnd5V\+sCHWknN\+8HgGzVQ2k5kNvfEEVyufSSrEzYv20GDyBbOgOOHCjYfyVzS85FXpZYPYPf2s2P92eUIGLas1DCbXsytWhGloAsIc2UQvq1Cn7TUcnm49nSGenIabJpWrKpmb96WVomAkjym47nbZ0wfyjMaJb1bVmeDhyWbRb27agQbz/Kq14Ze03Tf/DNAvtxYRggkgKZFCJRIMgM9MOKlRz4JJveGFnj2RVrIxsnVy1DZCWpFRW8KinAleHCVClTK4oy0Dl0DfmBcwL5ci7OyOztqS3/kmZekTEVvVvW9jcU9csDks2nh8On1fckiXMF4aLYopL\+LTOydU5ZfHnvc8Z0QJoERrL9ND8OEJ90Xe9pn1TGj5DHzZrskVeJ\+mZeoD8p7\+bJFmeqvhZ5fflAl/jI\+wPFq/5mbw3kbXCIiWXR18rFV0/\+32ANAg8gq1zW\+1rF\+AJnZUXZ8Jsyw2HhJGLj7CJ130Yl7\+DLuZgQAACOE3XnYuaSdKmQT5Sk5FHx1lfzcsFn62FJQ0titXSitrYUnzmVFxYlX1sb1xQRTWEeAMjkCfPavhVAbH1JuGJdX/zNgoYSbuOT7PoLeTsPkPXdPEgB5GVkwIsAyIQQmcGtLxHaX5LWjYg8iaL4C7U38GUaOC7ZLI08Z\+ypviLeuU8cBgDgNbyb32SK7ContjqkdQO1zIOrNEvFAW46/4wQQgihL8ZNZYAL5KtvP7tpl\+NIN1Wz\+XvbnriT\+fmxSMWa535UGTn0d8Mv2onb79vyRM2u7pd\+ePZiZO2cqiIhwwqVt8uhOyW/o0T\+dle4qEQzI9XkCY/qbpcEAOmiu\+c27H75wbNQ9c3/sePprzedf3l/J1X9hL62qHHz/3w5ULBg47\+s2bGxO/DzkwePhmt0lVUzPqnvTAE1a/XtktYPmpomjH7HE1Grn67ZsqBj5y9c9Z1F1U/rzRu/Hmh1HYQUiKiq0gs7f76b6eTka4377j6/4af/zcSEix41bLsbdv\+nY0OnZPUT\+i3/\+vXwVlcdO/mrRi5au2b93O6dv3Qdac2rWrVm2xO6wHlXfdGDO56Y1\+pyPfwBp9St2fFEzZbO3Zs/6J38fkcYHN8rzCinZSMlkdcGspfQ\+nHB5jdGDu3jxVP8wOn8rWNScMJ0bW1ak7rBZzhhpvrRiLlItPn0YLydEuw/kLeoNrbv6czm/XlHRqdfSpdF/48awtGRMfZwBpiQphct6a8tEex5M39nXnLjY1z8FNlAAnAAoszq\+/urOMI\+IrCPR0VbHVTu3/9QBpjLZdgy1Y9FawdLNSIDDJDkH8kNXRZmVmv6V8wAAGETJLY8moh3ihqknLI9f\+tRvjwlaJL2P1fEb\+jkEUW35lzCF4j9ecl9D8HO3xfUJ5M7nu4jjks3D/Ryz1bdH902LZeOBhBOtHdRZtFg/hAAoFu0/6g4IEzVrO6rXZyGC3k7Xyo40s1TaoAAXvgCsfX34t3z4lvWRl5bkr9hHxno57dGMzLIxjk\+zIhXS0VMKvb6DwVMO09WklRekDxy4DPreCKv4DRA2hlhBIAoSuxY11clzRIpKNVE39JkI8dljxwXQSdZa\+qriRIb9o3ohrC4b4s6HW6HOPAi7Xmb9gvDqWxVkbDmG/EVSUHdYKfuydf1pIorTNd\+s2/FNGhdG3kLIB4V2V8RQorf8OaILtC5NVP8uv1UHYC8IrZvZbrpgHDR2p5dynHzMCX5R/6bnOC3daIaHBE/Xy0DnKmp7akdu/Bq55KtWpwi2vL2NI/8DuE1HZdsAAAAeVgQkSbWr0wE6sVNHADwWs8RAx0cJqx/IQDw4ilQVvSbV3JVUsGReukjpwQRMrkCAPoFBw9LDr6frl4Z2/bD\+Iq/yLY388LdfLk0C8CLpLIr7k\+FPxbWmLqrA\+JWSGuUsMchq5vkuYwof6BFGIY0kUpvfJo1Dy4Nd4oCZckVJZn69ptL\+yOEEELoS\+SmnkQT/Q1vfcB0pgDYpuZueFBeWkDC8gWlnSef/FtjQwyg7S37vHnPLb9txolzDbFFVXMlRGte1VxoOHpWXjGnVNwUnz1XCeE958eHecnwx\+/s/uBiaxLCB07W3D2QrT24\+8UGcW\+gkwM4udtTueKb85RFH9Y3NDatXVFzu\+TI2yxRukhTEK5nOq71dFIwq/qb9y1KXtzezMKMyprbyYa/vbW/oSsOXXv\+8MHq/31fdQV16DwApAJHjx082xUHcsT8oqmmQ3WPfJBqbeuNA9T9rbHmZ4uqZpA3EgALZZRUBuFIZ2\+YZetfdda/CgAAnW9t\+OkH8c6ucBICB95bcbehqqJI9kHvzT1myaZlw0elG5iRj6TZRZro\+EfnOGQXrYy8vmx8V2Rgjk/\+gFl5SXL912LVUvHOd/maxakGRhgGAGlyy9p4/LCkbknvc/\+S2fT7gsEYmBduIY5c6F9RNCZXk120OL4oyosDxMPiPW/Coqf7FkFek7xf3p636XUClieql/RvEQri3cImyKxYnGpiRGHIrH6o1zxiQq/x42YhyWtiJJuZm5oUJ8lreDd/d4ug6ZwgDNlFy2I7VvZrWgqOcLyIKF2lHDxuktfUKZKBYE\+9CG7vrYX87QHR7gPChhTArTuX1kDenu7o\+mXJOPRrosSmAB\+EaU0ZNF13YrMkQJIf8OVtHXsgXmsLufWwMF7Rt\+NJbpsoS0gzpcLBEiZ5TYzM4BO0poAY8aUSbi545DisWBupas/fepi/6P7otmlwcyLtwiPNfFCDBgAA5Mr\+XU/zIlcEgf7U\+of7I3/LY7rFmx1iIJM7TJHqlJiBTGsgW/NYz/rb060\+cr80se1fIhqGrDstapXGd61NxK8MNMEQedkqdV/N8rhGKDj4dn4A0qu/1vN/HuY3fJy/9VXxZOt6Eoi8DLTkG/aL5Q9Fay7kgt7MagBZSXJ1RToOoJyRJTqH15fJuV2PxeGUdPspAXFB0vA6P8DxADLVj0Vqw9INh/lEUUaWzNaMOcxVa/CzlS2VQiQsaL1Kr4Rwc/7mA7Dta9HXl0O4U9jQTNS9T9SHJ24pIIoS5uVJaC9oiPIieYL6etn2cGb9Y72vrc4CZEtnZOK17IoUDwDiV0TbHRKmmx\+H4eHQ8X7B7t8XxoviLyizdW8UHITEricn2fFjpIxG07fj4UTkfemTb4ydCax0cey5R3tcFfnb/0YyHESuCOCe2Gs/AQAAYUY5LbvNlDTnRmL3C3f33/jBEUIIIfRFublUDBdmuYFHq2QqLhISIolshkQ2b8VrfxoxUe6lWaXJRqYVNlbIZc3SqoJe5uT5qtvvXDSDjN8xS8Y2NXRLan62adedeQAAre8ZrE0AqXBnNJIEAIjHopGEsLQ0D0AoK12w0XDf6ooimRgAAHqbCIB469mD51eYl88rPdokv3uurLPxYNu4hx5JUc2///vwA2LvuT2/cde1pYjb5XIR19AaHehfGgu3xoTK0jziPABw4c7o\+AdHokC\+\+tsP1laVlUpyC7qbxDd00XobPO8dqVjz3K/LGhrO1jNnmY/PN7EpEEuqdF/fuHzuoqKBPsxNH9zQbsfIaAa6Uw7JEmSWuDBuxSSv6bD0yQkywL1Vk085SlMbH\+LkpyWG46LIjP59j3FVpyX1USgti6\+Qw54W0R5f4ZEyGDH7UVY2LVmlzMj6UxufZsd1guWqPy7Y/IZQqeaqpOnS2p5qURYimW2Pwp4oxDm\+vCwVZvKYIm7j4vT\+46Jwil//hqz\+DQAAgkxuMfZqApKtQm51LrQQZqpKsoEL/1DGhpAn12t6lZ1EPZdaXcI7\+DcJwwEAjzkse/jwmHXFANkqAIKE8AVxYPB8q27FuQx2pc4SZZF9ebzW7sxzptT\+18XK1f01RyX7r7nh\+rVZmTJdOi22Tw3hztwRs7I83pH6/LpTAoBsFZmBcwWjZ67Orlgb2ZjHC3NXS4RmSxf37SjiyUrSsvG34k2JtAtbpanI8bzdov59KyE\+cNNmNff0Vc\+AeEBkfzO7ZV3fohZi599ghZK/f1/\+fmW8ZkliRadw9zli6\+\+FizSxWgCALOQlNcpsU71sazNf881IdYvU8Mt8ZVlqUZ6gNcWLTLaury8eFTLd3C5Tv7woI6uIvK7hN7xbcEQIRF5q/UMZ5jDZwBTsHLjmICvhdtX2afKg4Qo/DrxI99jpqQYWjs7hX6cGB\+LPa3aBbp/s6VxvDjA\+w0geZgrk8tTqe/rXa2IvLI\+1\+iQbXiGaAECYVa7qaVw1Ym9txM6/EU0pgHbxQQCQpuV5vD0vFe4f16WZ4PhXOXQWpMmah2IaSFdJoWGy5zGwbdXK6Asrs/UHZPuFfa9v741HB/PnkJVJs00HCp/8rbhGkyZEAByv4V3pw\+8OfCwr6d/3WHrP7yc70hghhBBCt9ZNBcATD6pKRT76L8PPjzWN\+lS46ONuYvm8RXMlpcmOhvMdwJKaBbNgrjTcfLG1r7d190uPUEIAgFh3U5\+8GmD8uxbFMxZt\+9EaTeexrVtPHDnPylc97vp2rhjskaMXNz5RqZkbVd4uDbz9SWB8/\+fefubQf\+9p7gdIRbq7m8535aJrAoRXfaljcqIOwKLimo0G8\+zz9t/sPvhxR2T2vft\+dvfVL9DEImePbfjBh/K5t61eXlnz9ONbEo2b/ueh8P01O3R59X94efPR8wGYs23H41U3ut9R\+MxAd8ohuQzw\+DPKLrpn4gzwkatNyzNeVLT994NjjzvF9VykdnH6yHGeRp2EcwX1YR6AgDk3uLIwvfprsW3LskeclL0zuevp/vibsk3Heatre8z9EsOrQvlApprHHJbdfzi7SBPdUUZu\+Is4DNmqlYl4p6g\+L62JCgJCCLcLRr56h5AmzbXRGmHehteJpmnZ1Wu5FQGx8uHejTPEmx0F/8ird\+Lt5KY3xBtroxtVvDpnof0cPw5AFCVrNQllHsikqVKhINDNi6f4zPvkwTAQZLa0JCUXCgcf0G/NuQx1pVYuie6qIDb9ZaDrr\+z19AuP9lVfyF51BGNUtOcNsqo2rXw/L7CsH5j83Z2Zak0qfIpgBg8dT0Hp2PApS0izrfWDP4mGf4sJEiAKALzW0/9gBji7aGX0tWW5WaBzxRAEoknNtGypNA1XBqa2kpVxWzRQz4gWFUG8XbzneKq2JK1ZllpRwiMgFQaInM7bf44PAIF2funAnnnQL4hL46tX965enZUVZWTzcv3eeYH3Jd6i5PrJ1vVk8JqOSwzHsysejdaE8/a3CBou8KrKIBwg6kv6lVEhE01tWxetOiDdE01teaxfdrxgT0XfDX0hTKIGswD8pvcLnnxj/EDfzIqHYtXDgd81pXjhKMjkSSUpDl8r28oLh0X7D4j2H8hoVkZf\+BpXXSJu6gRIQevHBTsZfhxAvrh/ixr2v1qwf2R\+OMmDvJTZ1L0\+NWKhMCNPiQdbcLKDfQ2yhBBkQggDD6Kim80A8xqOyh48ygunoHQJv9VHbnhVPNjikKl\+LLo6yYt0i/a8IYJcxFub2j96vPGg7CJN9IXF4if3kTc/FR9CCCGEPk\+f0WC8ZG\+4kyOqZpUWQBMLACCbUSxPsAE21dp8MaybtVojgda3WmPdRGuq5s5FK2akmjzhCKSgs6NhqMtfgRxAKC\+Vy0XnI0kgCqRycSrS2k/MWKQsYOv/duTgWQ5AoqmQy6EDAABS4Y9PNCT01bo7ZQXhuo/DEz23ca3NZ\+vHDamNd4fDQCpLSaKhNw4go\+SlBalwa/9Vn/wKiqpmQ9O7R/Z8cDEOQmXpPKUYJp/5yRm4JufP7D9/pu7ovft\+dt/q\+YVMRVH847d2ez4JJIGYO2fRjC9oXm4CrpoB1txcEVKCg\+\+Lalf31USF1XLh7v2i1hEfEtLktid7Nf3inY78\+mh6fW2/PFCwyScgSrjaEn7dfmEYINfhXCJPbLknKRNmZTPSSim35dFkPAUgzUI/r6mZX7u8z0xmG17NPbtnS0tSK5b1b1yWIpIQOSdo5SDSLt7THn3ux1ykOX/zS\+Q/\+uJZUUZZkiZa8rd3xs3reogDsq3HBZFu0Z43\+SuUGVlFaqNUEOgWHHk/N8oxUzotI5uRWFFEBAYn8tl4a84ls/qhvmopwLSUUprd8lgCUsL9r5PMhbwNjoxyWW/V6CiUACAgW1qSJoa\+EDjBkdO8bRpOXsTVTBNtPS0e\+aKd1oHXOA3JrlgbWT/4b\+Xi2JYK0e7jAllF38ZU/pMHhP9oBlgI42eBBuA1NAtqlvWvJ9OtuUmbhOnahznwSfa3czuKAIB/5LDkCGQX3R\+t4sjtB0QyTXTX4vT\+02MT6fF\+of1VcmdRckURT3ZPrLol336B3zrQMCGYZF1PTqZmXaQ2ml8nyizS9O6Yl79hvxggNwuUoHp1776idJyR7GznxUG0/bcUQKa2YlL7vaEalOVl450TRrn8I29Ij0z2XPgNp4XxRxPrbycbhmfbylbdH91xu2j7y4RseV81R2w/PNSXmB9oEUZSCZlwYN7meKfwSLMwAgABgWxGz8a13JGXRr0/PB4V2V\+Rjs8AD/xAptev7QMm70gyXfsQV79PVvcPZYABUryBonK8SFFiy6PJERlgXpgDYsQEV/EkLz5xfMvDebAQQgihL7nPKtzimo6eDay6y/zExbCrMSBasG3z/1A2uJ78w/lI57mmxJ2rb081/TkcSXKtzd2y5YvkiXPbz0/YQi\+S3X6feVXY/jFovr2iCjq2N7NRcTQOEmWpXPZxuHT5g7WlEBdJZAUAAPHOi3UN3Au6JfGT7iOtN9DeHu88d/Bsalu1rrbVU8/Ka79936LYxc3NbGJUr\+YU9KZAJJHPoOS92UhSWDpbXirqiMy9c\+MqSRyEsgLyqmnkCc6sePW/PLWloHHTrrcYVqhcMK9U1N/QxUViKVnpHGXRyVaYu/6bC2QxICjJDex2rEl2gc4SwkzVhGOAi7INNzAGeJTW03l2dWRXbbL\+1cK60VFBPCra\+RIV53iyMm5Xbb/yQsGmA\+KAMLXxoX5ZQFLXzoPBEX29YfHOA\+JcIqW0jNz5ai5rGq0q4rV\+TDasjFRfkWxv50Hu5U9PRlf0E7udhQ3lsW1yAGG2dEYmfDT/YFlv6QVRw028ilOYleVlCFGWEIJMmqmqiJlPkXXHxfXtBBOIPbc2uuWKbOs5vlLdt\+1\+/v5zAJBZtKS/Ri558lVxWJpcIRXt9mVW3J6uOyyMAERu2bnw69\+Q1AMol0RLK4idfxme/Ckytpcyr7VTKOsHpTArk/KZd8mmfsilHAM\+MqCJVkfzNjlGTWNG5I3vQJslpNnI4exghMCLdAuPnBaWSuPVMwaP8g9lgLOyPIgnx8RsvPBpsmF5pEZIbDrHjwOULu6vEYq3HxaGRwaNZLr69nSrTxBOgWyiXROQJQCATK9/tLcmmrcfgJCmNq7rl38s3fCGKAwwybqeHD5zXLjxsb7qaFYmFOx5U9zAwWoAAGgNkAc1kZoWyYbDAy0L8RRvcl/PN1iDZKZKygu0Ty7Ne00BX8HuZT1b1rGvLybrTota\+0Gu5DYuT4aP5gV6efJoZsXD0eeK8vccFzV0g3JeonYlV9pPMGE\+QHrUjlKC/QfyVpv6t60UGgZnCydEWVlRcnwGuBREw1NbpfhNAXF9f3LFPbkv/38kAzystTmvbnHv6gsFuWm05fP6dy0X7G8ZnrTv\+pcOc78IIYTQl9hnlm8Mf3xo067UtifWuF7UQ3c7c/S/N//5fAQAYmGmE2pL\+5nzvXGAcNvF1oIli1rPN3VP\+IzQH/jgHLHW\+Nb/LYp3X6h76b/q2lJxUdPud\+987umNjU9DpPnIpt3/FdhYs\+1/Px7/6cv723obmHOtqyStzLkbe1VvsqvuP13E0/9j47//2zZxf2tz09Zd/32wLUXMHblSKvBxU9M3dc/Zy\+p\+sWf335pW/2vNW3U10H12\+66/H1n1jR0bv7eL91\+TffZNdh38vVv5Lw/uev5/lUpEAN1H9tXtOXs5Du8xd379hReXQqL74EuuzR\+teO5pgyvpfGT3\+ZsavDrJLtD8\+leph09z21am6v8myfU8JOTcPlNf/HT\+/sm90GWcrLIiUVOSAREsWpLQNJMDcyYPyFTdEzMvSyqFwv0HZJtPC4iS\+K7HYppo/qbXx843M2R0Q0BWeXtCQ/IjJf1mtXDrcUEkKt7662lxjheHbFUJENLk\+nX9VUDsPEDufCV/lzGyryR/\+wGCiU7ydLLKCm7LQ1xpWBSo6H1BThw5l7/pVaJ\+MPJsOiV5uDkDHJ8oSmy8P93wZn7TjN44iHfWC7d8M75ihjC8jJM3F9T5MotqY\+YW6fbR0019secyjjBTmsdrHb95SrD/L1KiKP7Ccv6RA7I9YQBhLjjJls6AI4eJRauTGjnBDE/ZzWs4XFg5dkzstfEajhbsBH4ceIFTBduF/Bu9sQlpWlME4e6xOTeiKC0nIQ7pqpJMfTO/9VTBI80Q4Xilw6tkNffEqknxVp9g5JxJI0W6hQFI167rWy8Vb/2LmFgbj3eLt/8NnquNPheV/fB05ibq\+hpam/M3/yWl0cTkHE/zaHTHG5IjACDMrFiWInx5rSv7doQlW4/fyMD1G6zBUiWnAfH29pt89feYQ\+92FkYe7jXfw225nYMkrylA2HdL6s7x4wBhRrJZ1Ld\+Sf\+OZTG5CCJXBA3NBU8eJo5EAcixe4q0k9vrE/tWx8zNstzFjEfFm355Y40l8aho56vCcBQAhHteLYhEAca/onxS\+IxPsPFhTtNccKQ/s\+KeuKyzIDA6oCamJbaZugdmvRo1CVaWIDNE\+43ND4EQQgihL9INB8Dx88ceMR4b/CnVdPCl/\+vgwL8DHxx68oNDYzdIsgd/\+cuDIzY3fOvY2HVG7r/z5OZdfx/1/Jdk63f/tmL38IIjP/1/tg\+Wv3RGkaz7bN1Er\+SNnD30cO248gwdiD2/Z9dv91zr7CBy9h1D7TuDP71y/9uvDK/68W8P/gYAAN766BqnM2rnnZ/s/OUnO8csPXvsSePIC/Ly/Vct8vURk8gAy6TpqnnJFWqupiITOF7QNBgUxcPkBgd/48N9z/2kv4kp2D7w8pJJEGaqKuLrV/ZXl/COvC67/xRUP9r7wjP9Tafz9r8vrj\+Xe5rntbaL6\+pJplkgU8a3/Uu8WpVpfV/y5AFxIAUgzGjKUovKxr3lZThuzJaqe1\+oEO7eV1gH8eee7Nknl254QzQ06xIhzZSq0sq/Sze8KwwDQJTY9BJvy6OxF37SX/\+3wq2Tea2xMFO1JBl5V2Y4LogIM5rF8fUr\+7Y8PHZYebwtf9P/B0Rzwc5mfmkZEACRMLHpJdHqh6PbSsSbncIwB/ajiRe\+GavdLxnTlPCFnYu8LL5RnZJJ08qSlBKy2x5LhKNC5pS4NcoDyMpnZKF/wkA6m3tJrIxMr3goRhzP28nkb\+K459b1uJrzt78t0HwjVjNj4jBySKSF3N2aSxEDQWbjp0gAiHQLc/1RI1FBkzBLkJnSouzw63yvTZiufjim6RdvusCTSdOludhJlJWV9O\+qzUTelT3SmdjxGOs6Ldl8QBzgACArl2YhBSBN1a6MbVFDnTOPSWVKpdnSaVkYm77jNRwuiNzfa\+4uePKAQFaSrJZm4ikIn8vb9BdeNckrnpG\+ubq\+imyVpm/b8oSS5DecFtcx4vpOqNakVyyLyo5Ltr4urgvDrtqe15fkbf3LQM52zG\+ErChVVZKumpaFiaequmYNvk6ES/p3PZxm/pbP3Hx\+dDROsP/Vwv2vTvRRil9/WFI/YVsJJ9r87JjgltfwbmHluwAAyiW9u1amZKKJNhyS5Nd7CJDmUsQgJwVNAJDiNw1cFn5Te1YmzMqLUjLh5DskZ5VLYoOHzpbOyLzww0RrKls6Ixu/0uu6nQe5Xtn7C\+rb8x7Zlne1nSzSRJ9bPNlDIoQQQuiL9wWNOP18kMq7V2z79pzWA84jndjnDEAIIOQ1HJY\+\+e41MsCZRff37rgdGj4mNx0gjozuWBsJi3fuE\+\+fx21Zza2YIWq6cL1nemF6/dM925RZ6Bcc8eU/uX9gh7v3FR0si29c2b9tY98ugNb/I3vkL6JAMxEAAMhoitLyKLH9OeLghcFYLi9Vuy5aLRXu3ycczAbzwu1EXXQgeA63ELsPCI40i5qiAJD3pF28CPgjX2vcxBRsOC5gwiO6KXaLt/9evJPMyFKTiH4BICWo\+8vgi0NTfOZUHnPqas\+4UP9xpvqxni0zhHsOCOLC9PonIxvzxNv3k7m4InCqYHNebOOS1JH23EDoL/xcIAtJQf1RsmH0DFtAJnf9OFKTJ9z90pg0bJYQDka2Ql64Xbz73fw9uSRhc57ht8Ka\+9PydO49ydc/9KL7E60\+yYZXhXJN77YZYz8myvpe28gpr4i2vznJc\+GFA\+TWevJIf2b905EtcuHONwVN0YLtV1LyqLjuHD8OIsMFQlPEb00NnqCUX/eKEGZw1TMEdmf\+/nN8kCa2maOrRcLdTuHwpU7xIkkeAK/hXemTA\+NLe6uukJsDgjhAazO5GwAgb1PzDdX19c6lW9B0XLL1/aHWpWzgdN72o8T\+c/w4ALSTG34t0oycOF04KgYmiuI7jJy8k9h6eszVm0QNkmmlOtl6WGKfdL76lgickjxyahLrSZO7\+oW7X5HuiaZ2GMcF9MJs9ZPsDhU0HZU0TXbwPG\+yh77mTpoY2YOTn0cQIYQQQl84XvnaZ251GQYVzN3xq8erPnAa/nBxEj0AJat/tOmFB6WtR90bdn/YNH7\+51uJXLFx464Z7xl\+8WHghjpmfwXJi9KyFD9w1a652VJ5Wp4S3Mxw3K8OgswQ3A337EVfRVjXCCGEEEJfaV\+mABghhBBCCCGEEPrcfKn7wiGEEEIIIYQQQp8VDIARQgghhBBCCE0JGAAjhBBCCCGEEJoSMABGCCGEEEIIITQlYACMEEIIIYQQQmhKwAAYIYQQQgghhNCUgAEwQgghhBBCCKEpAQNghBBCCCGEEEJTAgbACCGEEEIIIYSmBN6VSOxWlwEhhBBCCCGEEPrcYQYYIYQQQgghhNCUgAEwQgghhBBCCKEpAQNghBBCCCGEEEJTAgbACCGEEEIIIYSmBAyAEUIIIYQQQghNCRgAI4QQQgghhBCaEjAARgghhBBCCCE0JWAAjBBCCCGEEEJoSsAAGCGEEEIIIYTQlIABMEIIIYQQQgihKQEDYIQQQgghhBBCUwIGwAghhBBCCCGEpgQMgBFCCCGEEEIITQkYACOEEEIIIYQQmhIwAEYIIYQQQgghNCVgAIwQQgghhBBCaErAABghhBBCCCGE0JSAATBCCCGEEEIIoSkBA2CEEEIIIYQQQlMCBsAIIYQQQgghhKYEDIARQgghhBBCCE0JGAAjhBBCCCGEEJoSMABGCCGEEEIIITQlYACMEEIIIYQQQmhKwAAYIYQQQgghhNCUgAEwQgghhBBCCKEpAQNghBBCCCGEEEJTAgbACCGEEEIIIYSmBAyAEUIIIYQQQghNCRgAI4QQQgghhBCaEjAARgghhBBCCCE0JWAAjBBCCCGEEEJoSvhCAuBEKv5FHOYrK9bVHOZudSEQQgghhBBC6J\+c8LPYSe/h3774b0yq2rxx\+zLJ2A8TrOf5P/4ueefPf3BfZcHAsuinpzztkmWV5XOpz6QAX2Wx0F/tf/zFp8Wbfvrt9QvJa62Z6D1/4fLlZOoqHwvF\+YUV5RQxvCQVTwgJ8Q2UJdre2lVYOrdgaAHX/M6p5sLyexfSxTeyH4QQQgghhBD6EvpM4k\+hWAQAQkI00d76es6Ge4MXDn9vR8/zP314GQWQYA\+/Wv\+LRmG1\+XsTBMxTTQFVqSlXnDn73K/\+DFu/vX7\+1WPgnsBvdhz0Jq\+\+q7J7XdZVFYORarzlnR/86lS0fMnWH6yqLIBoe2tzz5hMPDG9jJ5bMFhrsda9v3bu7Zi\+yfq99fOFAABsYO8rbx5KLvjljkd18infVIEQQgghhBD6irvhqCb6af3T1g/PTvRR3bO76sYsmlZhXFGYKC9VXGgJdrTUvVrfWKJcOT9UdyYOs5bULJyK0W80HGpPkiXFlHQgUiUrHnz0P\+Av39t77nd/PHHfT\+\+rGEzAxtmuYA\+UlBdLR24/q/Lnjy8uGZOPZVscLxz7aNQirvn9wEc9sZLC2SUFAMA1e1773ts9ozcj1vzge7Z7qIGCfdp4uAMALh98q1lXtrhEnGo/cfK9HgA4\+8yPbc8AAIC47N4/jIixR5ch8OyOP/\+pg7j3qaf\+48FiAiDeHjj0zuljgbbGTy93JAWzZtGVlZXfqV5SOZj2j7Y3Hzh44tCZtvNd8V7IrXDnU48uqSgAgNR5zx8NL7clRh9kevH0OyrvMq1bWlEw9vjxT\+ufGHtnErNm0ffpVv7owVLp2NU/W6n2t/68bm9Lb3Hlizselr79xydeaYOyu17curpyXDkRQgghhBBCt8oNB8DiQmXN16Ejl4dM9jYyTSf6Rn5OLNUsriwc2C2Zxws2BVv7QVo28w6A9k9bunoAzpz\+KAnQ8eGT3/9wzM6nV1a7frqk\+OZO5auBO\+/565OHeib\+MHDY8P3Do5bkL/iPXz22khqxpKPxZ882XvcwXafe3vFflxKFi75fXS5NAIjJCt0jL94zmAFOpNqP1v\+MGTHwOMEePnQ6CAAAwaMHthVKfl0t8LzV0iua\+dRTq\+4tTJ0/Wv8LpnfZg5WKiftCc42et\+s6QKK890fLiwmA6Jm3f/yrYyeG89Xpjo62jo62Q0zg51sfXVsijLef2GZ9w9sHACApLFQke4MdbR0dbe992vvSiFaAMS53Xfa\+/cbxDu6ln9w3cRw\+Sryjo6Vu7x/P9333\+epS4rqrj9\+\+/YMfbH3z8qrvur5bPunNhRWrvlb7vnPvhRO/ebvy\+Wr6Jo6LEEIIIYQQ\+jzccABMyJXfMigBIN7e/LuX327uAwBCURgPDsR08RMnAsVrVn\+/umLuRDFMvP2ExRqDwnmbn7p7ZJATD5/\+zQuNl2/qHL5ShCWVd22Cnl4AgFTXp6cPBuLTyxasWUgRAJBkjx89\+1FyRCMCNVshGr2D/NnVy2ePbSPo6zp89Fz74E/x8KldL5w8K5r51IYHit/a\+/9jhLrHH9l8T\+mykqENUs0XSPGIALir8Z29jXFx2b3Pf7dg76/fPPb223\+lCusuABSS0ZbAsWRv45keKFxQs7R44nCODfzp6KUEFKypXlIhBoi1OPbkot/C6scffkozuzjZdfzEyb2vNn7Uc9bxSvO9P66INjYe6wPIn/fLHY/l\+ldHP337B9ZjHwWO7W1cYrtnsCv4cBNAKtre4nnl9V\+c6Ok9c/JAYOlPJh4yXfidrd/7yUISgDt/6tTv9r55qCt94q2TH60qXXbDydhUe2PTR0kouf6aoxXQNbp5B144d\+KtD48vX3sfdaPbI4QQQgghhD4XNz6wM8Y2nmk\+dLTx0IlLlwFmLbxr\+1N3ST1//N7bUGN\+RNtxbNerZw/9118PvT2z\+tHVP1pVeMy\+99kWYUkhSSS59q6euEjQ2weKpcoRcZ1QWjz7jkK2WDRhANzr\+fXuZ07EFau\+bats2Xvw1HsBTrpwyU82rF45MCo11XXqg12vfPjehVgvEIqFi7//1GpdSe\+BX734s8b40seffl5HE4muvz774i/OpKFw0W93PHofNdiRu/jOF3c8PDouGux5O\+vOnz/I1XkCzV1xcfHsbz3\+yPeXDcwv1fXpib2vfnj4zOWOJKFQKmseXVWzhEqcqX96x4dnYfpT1qd\+lBvHGz71460HvX2EdsP3fv0ANXSyxUvuXr8EACDa8sG2o3EAouKBB36kowkAYAPPnjn7UUf8xKfc2p\+uXVsyUe0UTl9WqRzXBVrYyAwEwPFw865fvX6oB8SzCqNH39jGXO4VTZfmk9fKQ7KBva80BkGwdOFMSAi1mnnTy\+\+r6HuvpGxmMXDNZwLRnsvBHlCsWrqMmnD7VHvjqfd6AIor1i6UAED009PHOgCAWPOD724f6GJdulJXuqx8\+m/e6VFUFhIAl1kuAQAicmjouHT\+A//xq0WJfGo6RQKMn\+tLKC1Rrl1316HGN08ke4PtvfGF1zwpIOcuWfqj6rPv7W3p7bl8vie1rEAICfa9Q/W/87Q098QTIkJRVvHUd1evnU8CQPzTt5\+wHjsrKv/3Hyz46JV3DmXnfl3of7UVACB46I\+aQwM1O2HtjyuGsKRy6b2F5w52NR88w9432MkcIYQQQgghdGvdYAAca93zqz8\+F0gDgLh43qbHV9cuKyag973c1MSi4vuqH1u2vPXQq2/\+5u22g54TK5eurlh\+17dmxXJbx7sCdScuA0DwxJs/PDG81wVfN770wFWPSYiEAPH2E6//uJGsKC8uEbWcPXPS8tvCP/z0vooCiJ6q/8GzJ8\+CYMHCBSWxNu\+Zk8/s4Ajrw3dUFosb29o/vRwFmui5dKwlDQDQ03aig7uPEna1XAoCTJ9frhiXFSREQjFAouPkjlcK76gsXwaBY11te59/bbr1u7Xlwuinb//bjmMfJQULFi6YywaOBZp22S/Ht353vbJyrfLDXYHL771/6an55VKA9k\+bP\+oDKFSuraTGn1TXmfd\+9uvDx/pg\+sKlT2kG06rU7LXrvpZ49e26C00/s8aiP/1W7fg5sa7bBbqvN55ffEdZKt4TqGPSAMS96x75/hIJxLoaL8QSucAykWpv4QaH17KHX379Tx0AkD5x6LXvHQIAmK4kpfOLKxfmMs2p9kY22JMW9zTv/WMAAGZV3vWtJSNPimtuvNQLMGu\+UlEAAKn2M21BACgsX7Nw1LlLF963deHgv8unT4fLl3ua/m1rT7Vm0crK8or5xSUl9LVODYAQ5YJeoTRfOImuxUIQCYZ/SrCeF/Y\+w8QACpYuVUrDAW\+g8Wc7LnVt/e76\+SSICAIAkl0HX279qEeoKCMX331n6L9PHusBSdmCtZXKe4uvXvvzx/0eUTPvLScONsYbGy9H76E\+5xHICCGEEEIIoUm5wQC4oPRb330geLBn2ao7p5/46w/tjudGfDhiEizBHase\+vmDi\+\+Tw/lPh1cgZlVuNdPT\+5p/88LJ6PJvv/J9JZx5/YkdJydz5ESSMm399toSYfTUgSeebQwGmo533V0hYj3/deoswII133npu\+XSBHvA/uLPGpvrTjzw8/LZJdAWbLl0ObaYaA8098Es5fRo4HLjp2x8oaT9TFcCBBULZ159vHHBmh88tX2ZBNjADuuf67raDrzTtva7s7taWPGsmfeW37v1qcUlyZZnt/7xT12XvGfY2vnFKx8odwRazjaePh8rryzobWZaLgMoKpeMzpqmuj49feDgh3tPXOoFmF5cED1z7NmDype\+Wy4FiLef\+s3zbx5LEguK4WxXy64df4znYrMckWTu/MLjZ3p6ARSar21eXjz8iqNY16FDje3F06UARPnS7T9fConQX5/d\+4segHxKUUwSANFPj1mebewYdY4EAADb056ULNXcWVMZ\+9PeD5uL7/z54xXFfS37D54O9gml\+cJ4X9fZrjTkF0J74EBjr7iYvq88FR/YOFc37Pn2GICgZP50KQBAKtrHAQDkU9PH9N8eoWTpqs2rena8fam3p\+3gobaDhwAAZi2880frHtDNv8rsaIne9zwfHk8CiIqXll9/BrV4OLDfc64XAIpnVhQKo4Fjv2Niw32kE10H7Ht/1nhp7yundT9ZOn3wUraXPPTqr5bOFQMkWGHDqWM96eKFd//IUE5A6vyJq9b\+uINL5pZR0HjpcnuoK6GU4kukEEIIIYQQ\+hK44S7Q0vn3bf8xAKSazwgBCO26tbWj01/t79T/7GhvycKK\+8pJgN7LLS3HzwxkgEFUIFmyZCXVQgCcPfrnB44OLF4wieOKyxcsKxYCgFg\+e7qoMZjsDbIpyG/zfpoGIObOL5QCgFhSsZCCxkvNZy6BpvyOwg\+DXW3NPb3xxrYOKKx5oLL9wuHGM5cuL0\+daIkBzFw6n7rq8fJnr8yFYdTMe\+cX1HXFgp\+2diXK5z746EsPDq1UUFII0AVxNgUgLKm8877ClkMdgUMXuIpZLYc\+jQMU3vvA7DHZv8ufntx74lKvqHDNukc2a\+K/2/rnuhOnmx8tX1aQaj9ztjEJYuW923\+sbN7719\+w5ctmjcgAUzPvVUr\+eqYHQCBNXj7ROGomLWlZeQVcqnv1g6UPLr1Pzh1/5bVdZ9IAAH2X/vTC6xUlj60EAIBZS7\+2dVUxASMmwaLK1\+pm1u04/AwDAAAdJ5959iRA4dKyVFeSql5XvVZ87Hs7ToqXP7y15IRlb0\+i5M7hlHVOMn25DwBgclnZoRot1q3/3n0PNh9469ThxsCJrjQAdJw5\+cyOS5e3fnv4puo7\+28//N\+jtxQsXbNKN2H/cACAngO/2/tRvhCSvec7Yr0AANO/8/gDlQVc4/FAEACKlWvKSAAAMbVMQ0saW3pbmht7lqwc2JxYtrxi7sTxqvDqtT/R\+VFCMUCiLxZNAmAAjBBCCCGE0JfAP/By1wLhNZ7qxQOpP8kyw3f\+YBj1UfxTAIDpC1du/ToNHR/sePncZI4mzZeIxQAAhGg4yor39cYBAOKHnv/toeeHV46G2aho8bJywcHGro/aL0c/ZaFQee9CZfusw8daAo0dXHMXQPHsymJof\+uP6/a29OY2K7vXZX1gIF7NJ6UDpyCU5gsBINEXTyQh3tdy6NV39p9oPduTHltEeXl1ZeGhoz3H3m\+rqQw09oC4bPHasjF9mIUVyx/aXhhTVCrnFgAAt6aysO5o4PAFbpmSPfZOay8I7n2gQkEVV/x445qEcESOt/XA3oM7mMsJAID0RydOjn7p0ZCC6MLFc8\+8vu3Q5QRMr15XkXjr2KGuc8/u/aBkVQoApMWzly0pJQDi5YWKB1PSMgkAiIsrvvP1QkLeU/fyyY/yZy4tJovLZ98hCrUfOvfcs7\+tm1VwGSBx9NXv9cUThQt\+uW7cS5iSXDQJI14ELZwul4ihJ9HDXr7GW4sBAEBaXlG7vqIWIM6GPjpx8jcvn/wo2bbXE1jzw4qrbFFY84Pvbr5n/LDbYb1dl4cujrh43vefWrt\+iQSgN9qTAgBxfuFQzYrzCwiA3mT88vBM5pKSq7/xOM5evfbHIfIJMUAimUpcd1WEEEIIIYTQF\+IfCIABEhD3vvJX7wSfEJCLMWItz1r/\+KcR/W4XfN34/DIAAHExvWyJEsTN/9DwyIERoYKlX19rWjIUagrF\+YUlBRJYSIsb25pPnG7vSEvKlRXF1PSFhXCozfs\+15wcGLB61eCkLxfUAUAq2pcLnAgxhOp\+/addgfT0hXf9coOyGNhDe9\+o6xraRlL5YMWCox\+ebTx1ONnWAbD0gUXjxxhDAb3ynqEfyIoHF9/BHDt08PSa6p5DgTQUV35nYKblgeg3zrYeYxrrDp481gMAhdVPrV3TXv9vhy5JKx960bw4ceiPT7xyqWTVt/\+wvvz8H3c/eSjFnT/847qzHQAAlw\+\+ckxSWDhL1NMRbjvfM6quCYoeHJucaj9zqu7ttopH75wuAui5dKIHZlF3bv7xqrX3fLDjt\+80ikgxxBJ98ZLKlVufunvZ\+PhQlGssSMVzQ8FBWDx/tgLazva1HGpkVw5PAAbRM/U/3tNW8sC9plWzo58Gmjs46cIlK8vJXHmWPbjqRy2B773dEw33RocqZmgW6PBpi/W1Qz09751o\+/61AuChWaDHEEoLcw0ZPYMp2VSiJxbPfZQPMBgDS672S5G4du2PFe\+LJwBAdK12IoQQQgghhNAX6R8IgGOpa3SBToxM/eXPrtbMlva1HGAuDS3ruMEu0BMiCmdWFMOxjnQ0WVixsFQKqfZTp97rEpbMn06AsHj\+7BJoaz7RDH1QUTl7upgUL5w961DTeyd6e0Fw78KZxSCEB7979MGRu0wNvEyor\+3wp70rl0mAvXTs0xgATJcXS5OXj3ekAQR3LL9Lt4SKt5/a3wcAkEimEwAEgLSscq3yxK5A85\+YNIjK11Ze5aVBI0jn3/X95ad/\+PYbPzgDvUBoH713zEzLia6W/a\+cPJGEWQvvND26GN55/d\+OXoayO20bls7tOb3Ncykhmv2dB8uH2hFEBfJlmsr75pcvnT9zbiEZbz/9u5dPVlavWll4bO/4wydScbFQmg/Rvp6Dr3woydVafrlpXUUxAMxSrlnadPxQWy5D3t7edr6HWyYfN/hWREzPB4B0tI/LjQ2WKu\+sWXjiF2fih174I/Ssfmp5eQVFRttP/2bPhyc6oLmx96lVve\+9cvC5CyCedennP1ytKycBAGJsc0svAEyXU1IxRMccRV7xo8cXND5/toOp/83S2dtveGplsmT\+zOmHei53tXgvcJULSUiwx0\+EegHEs2ZXFAqh7\+qb9qUSAETftWp/gkvLcgkAcX6B9OoDoRFCCCGEEEJfpJsOgHPpvqtngJPDAyPFxQueevy\+kgtvHx8RAN9oF\+iJFdA1jy46/HzT2UN/tfRVlPS1HT5x6TIUfucnyvvKQTqr/I7CD4M9MYDCO\+ZTBACUK\+eKmo71pAFm3nu1mZYGxA49v7e9cibREjjWBSCaWaMrL85nl80SeANp76sHd3xa0N7YFi0ugAux4Il3HPO/ZnqAloqLVz5Y7gicu5yE6ZWVy646TnUkyTLdXfceffNYEiQLH/iRZmzMLJ2lrFkHa/Ml8Zbmul//8aM\+UGgesj21tAJa979Qf7BHcO/jD60tFw69N0gwQ7WW37m3sfn8O28f65CsXS58r6MHjga\+s2b8UNVU46t7LScKav/lwR8tDTxzIjdiVqCYX9j1zjvPdrUcZto6oGDpwunRM5cTAImus7\+wXjr7g29vvmd0IcWSEjkBF\+LtLT0JoAkAEBevfXyVd8ebx/p6Dr3y10OvjFi5cMFPHl8yt0AoXXfnoWdPnu1ofGZr4zP5hQsKhYmuy8EkQP68p6rLi2FcAAzCkqWrf7S07ZkTsYMv1987/1Hd1fsqT6h46QPfr2z5RePlvb96sblypri9xdsRB9HM2nV3VYghPn4DsXB6IQkQC554e8fvAvc\+qLp67a/8xtiNufaOXgCYXlJcjClghBBCCCGEvhxuOACOs6HmjngCUtGSO59aE7vKWsJZcOn4mcuQjvRnIdF36aMzgfaOriiAFIAoVtasg3jZ4nuXUFAC32dpYgkFcGmCCGQS5S\+5Z\+2LcuUBT\+OhEyePJQvuWLjoO2tW1S6RAADkz1xWIjjYk4bC2bnZpIjCmffOgmMXAIpn31F8zXMvXrT50ZkfHT15uCstKS5/6qlH1s8nAeia76\+9vPftv55pfe/Tct26b31nfs\+fXnh9/5mWY2d6nnqAloJw\+vyKCtG5E0li2XJlyfXLz50/fuw3e48dSwIA9J55\+2cvk1vXLakY2XE6GTvhOTzQ1TZ/9nc2PFQ7P/beq3/ZcfTsR32wYNW3tq6iR4Wj3JX33mo8dEGgKIZEMna8785lhW3eMycPKqfDWFx7B9vRJRTLpq9ct3bzrNMHDjWdTaaDjY3PNQIASMoqf/nD1ff1vP3EjsviNd/6EXVixyvn6p7/Yxye2jqqEzJZWUlLTrR0nAk0xypy71Umyu/\+Dyu1/5V3/nTi0mUAAMGsWfSypXfW6BZXUkIAKF7y8Es7yv968OTBxpZgX8/ZPsH04un3zq/8zrq775MLJ3oPMICYWrlulfbMQW/P2d\+8fLryB0vGjka\+NjH9LfP3Sl6t/93RwLETPSAqWLBw8VOPrxrIP09AUqm7697Gw8f6Lh1iUiUPPvD9q9Z\+5KH5ozdlLx37NA5AVFbOxHcgIYQQQggh9CXBuxK5WhA7odT5t/5o2Ns22Xl9hDM10ktM9/CCBV83/sFQOjJgi4cDB94KBLvaDjFtYs23/vDDiqu/mugLkGp/68/r9rb0Fle\+uGPtsvEjeK\+3ebPnj0\+/3NY7684XrQ9PvHnufbyJ3vNnmr1M87GuNIBg6ZpHf7KM3fu7Nw91AQCxoLJizdKKZQtnVxSTCeCaD9UfYGevvKdCwR7bsffkiYHpnwu06x7dWl1enGAPv/L63jM90a7Lwb6Cdf9y16d/OHwif8HPH6f2P/9hsOzOrQ8Im5OzV85q2WE/Ga1c\+fM19MDcWjH2wMtvHITbt69OvPzXs2eTACBYsPTup3SV983i3muMFeezjWd6LncF6k5cVnzd\+AcDHT31zq5DXPWG1fdRo5sP2NOWra8d6imoNn9v\+7Lrv6Don177\+3954vmzl4srf2tdex91q0uDEEIIIYQQAoAbzwALS5Y\+9GJJPDFhgm68dOT1F/9bXHbvH6yrFBfefsJ6bPwqRGFB4syHfwoAQGGNZvYtjX7/Eb3HXQd\+c\+JSc0csAcSa6rvuuErwHL1wcseOD88O/iiZtehH61evXSghAGw7lGtefePZQy1nGxvPNjYCAOQv\+OWOR3XVjy7Lrc2WF8MpSXHxssrK2uqlA/NRiak7FpLth85dBsECzd339wf\+OwmzFi65d\+nsiq2LpitLB7rgxgpXlp3c23j4h42jyjN96W1LF7N//2tAUbn0R\+seWDmYDtU9AMA2H9j75sEeANH0\+5ZQBAiJJatsSyY6K0r5neUzD//XpcMHTzVX3lcxxTv9xlo9B89eBsHSB\+8aM6IbIYQQQgghdAvdaAb4BiXY994\+2SxSrl1eXtzXcuBoAObftXbhmAxhqqulLdgnmD6Lnkv9Q7NSfxZuOgPMen714jONcUlx\+dp1X/vRPfRVp79iA7954e3jLIjls9esuku3pHhsF9kY23gmcLyx5WxHT1z5wFaD8vqNArGu5g6YPqu4uAAgFjp8tCk6/96188f17I2xzRd6osONF0IQEYoyuljMtYehRD6\+JzDX/uml9iRRUkaXXPdSsIFnd/z5Tx2E9qmnbA9ef/avf14DvQASZXe9uHV15Q13IkAIIYQQQgh9Xj7nABghhBBCCCGEEPpy4N/qAiCEEEIIIYQQQl8EDIARQgghhBBCCE0JGAAjhBBCCCGEEJoSMABGCCGEEEIIITQlYACMEEIIIYQQQmhKwAAYIYQQQgghhNCUgAEwQgghhBBCCKEpAQNghBBCCCGEEEJTAgbACCGEEEIIIYSmBAyAEUIIIYQQQghNCRgAI4QQQgghhBCaEjAARgghhBBCCCE0JWAAjBBCCCGEEEJoSsAAGCGEEEIIIYTQlIABMEIIIYQQQgihKQEDYIQQQgghhBBCUwIGwAghhBBCCCGEpgQMgBFCCCGEEEIITQkYACOEEEIIIYQQmhKEN7rBubNnPo9yIIQQQgghhBBCN2TegoU3tP4NB8AAsHTp0pvYCiGEEEIIIYQQ\+qycOHHiRjfBLtAIIYQQQgghhKYEDIARQgghhBBCCE0JGAAjhBBCCCGEEJoSMABGCCGEEEIIITQlYACMEEIIIYQQQmhKwAAYIYQQQgghhNCUgAEwQgghhBBCCKEpAQNghBBCCCGEEEJTAgbACCGEEEIIIYSmBAyAEUIIIYQQQghNCRgAI4QQQgghhBCaEoS3ugDoq0rxjX\+/1UWYQPDvv7jVRUAIIYQQQgh9SWEGGCGEEEIIIYTQlPCVzwBv2bLlVhfhn9/OnTtvdREQQgghhBBC6B/11Q6At2zZgrHZFwCvM0IIIYQQQuifAHaBRgghhBBCCCE0JXx5A2CWsRtNTj93q8uBPkMiSSlFEre6FAghhBBCCKGp6XMLgFmvSU0pVGqNRqNRKyha5wxynM\+upemBZSqa0th8HADnt\+tUWqPZbNKp1SZPaGgPfsbjsFksZrPJ7PCxn1dB0RdHfueaF/59xaKCscuJ2ZW7fvbN2gXkwM8iyYrqNTVDP37OMhyX\+WKOhD47ma9i0xjeaWiESdzDXOqreJ8jhBBCX26f4xhgktJaHC6TioSQx6h3DCxUGZ1um4YCjrHprIMrUiq92Wam3UajjxwR9ZAKg9lmVn9BcRD6zAmVd99be2fRUMqXmFFWOiO58V/IcHJwUexi3d9ONrSd3c/cZtYtOHK\+sTUJsrn3mb95W8OuI59taZKM6wqrkesUo1p9OH\+nwRjVO5VGBecwnHNTUjUNAMCF\+hm2yOWaqRi6/7gUy/Ep6lqNRqy/x08WaBTX\+L3KBJkYpypQUXwAYH1d7pDEoCNH3\+SpoJ8DEny\+rEYvpSc\+Uo/d2q\+x0hpqeM9ssM/n41hFoV4tAgAIdRmNvUaXQksBcH1Oa0RhoTVsl90tMpkLqQl3C8AyIZuvwGKSXm2FL4GM3/GJiZnmcMhVX9i3A5cMBuOhUIqjCrS5y3styaA/TalIauSyUJfJwGod84yqf6jdkfN3OX2kwSChrrsq\+mJxbJ8/JCBD0SBN6VTX/uOaYmwBK0u7bFf9TQRIeiyf2KDEZafGfAlwoV4mRGjVIoBMyNPphiKjjhjzHeJ3dzFUkUFL4B9QhBBCaLTPMQDmWK9Nr3FSJHAhf0ilzS30O41aL0UCxwaDlHlgzaFNgONCHovJydI0y3hYYB0WCwUhf5AyOey6iSOBEUf0u8wmi/NIC8xcorc6HSY1BcD53VaL1ek5dYmsWGG0OmyGgWdmLui2Gk12v87lc\+oHd836nBazzXWkGSpWGCx2m1FNAXBBj91idbg/CFFLdEarzaof\+djNes1anZOyMx6Tigw69eqn/t4z9GH59w/7HFoKgAu6LUaz80iIXKIzmK1Wo5r0O3TqjUfiI05g5jf\+7HMbqKDHbrE6fSwApdJbxhzuqyQV\+OCd7R8AAEDBrNqNhi23UzKxqKr04vbdhw6eH6x2ak7tE3cuKki1JudufHpW09GmuO7OKlE0vGrNjuWDe0qEDx78kOlM3XRRMkFXi9HYw6o5p3uOjh6OQEhVsdXYZ/f26Y18kiT0ljkmFR8AOH/IaB21C84fMtlJm7NYAQAc5zS1cpZ5ppHBDNfrtHSEzPM1CmB9IZO5K8gBAHChFOgUXgdFAUDoitXQGjQp3RYpBXGvvcMeKvB5BSQQGmOxXiUErs9hOOeiCk0GsceVVeikNJkJecNOd8TDCCyeeToqd6y038\+pIRV0tVpcKZLKspxAQQuAyyr0Ug6ABADgk8ADyLDBmM8f83p7VBqSYyMer0ihBpWiQMV1m609QPNZNt9sH4ylubjfT3Ijzlpv6FFoSYoE1h8Lasqc\+l6jgaW1eTQkGEZgcc\+76m9mqMdubrN7\+lt6eOV3F\+iMtNVYSJPA\+Vt1\+pjRc5txVGNE3GtvszmjzKkUlBNaHWWylIxprRjEV5kUZl/AbCddlgkCddYb1FuSKq14\+CMuyXizJrfSQCdc5qDdN\+5O4tJ\+f5pSiWmKMNjmmjVpjyVo9SYBgGNT/mZQLBFSJJ\+kRBqjWKMWkVyfwxR0\+jNcKH4qJFyiFpDAVxnLHCYJCQChmN3M6pyzSHenJ5gByAZ9HChIkkq7bRe8LMdSpIrmAfBpzXSTPp8cuM4src2jB3/ZQ74YmJRO/ZghA3GPrdOrURjHn3UwyjAxnzfqYeKktlDFJoESkCRwoYQ/mCZ1sxyWQjq3B/N5Bz3boe/Rqy99MPAFxCu/W2a2zTF9wfESF/d6OIWuUEEmPcbTD\+1L5wozs4LUmefYTFdp/blhKa/Zb4E5HvtE0eZQGaDXpgv6zRVO/XUbOAAAWKbVaEmZXGW575OQN2iwxNVGuTbY7dUW6lQAXJ/bEfZ4okH9PLcpn/N1OV2xEADHJvxBnkIhIENhiykcDGYVKjFFAlCk3ihj7W0uTjR4G5B06IrN0jPwNyuUAH2ZXU8A2\+80XXBZlHZtwmltt4bCDpo31IFGY1XYdQRNg9cWUqjKNcA6nT1\+PxcEQkVDKAhaa9lQKwznDxlNfXrnbMp65iE3uZtZMPSdxjIt2nu6yF8v9Jrzb/iuCIYN\+ita122mm2nuSfk9EVZNaehcK2HYYg65mcQlUrhEIzWaZ5vGRvvXwvquMCDTqSf7rDOwPt1rNl6irUqL5qs9UyhCCKGJfPEZYIPDbdeOygADRXF2k9YFQCoMFMcGWYXJbvQbGcricGgh6HU7GFpFXe94rM9usvrVNsalJX1Os9lkVXnsmqDDZHJRFqfPoGI9VpPZaFd4LRqSZWxGC6NQaxSh4T1wQafJYCctLr9bwfmdZqPRQnscmqDVaPbpHB6HmgoxdpPJaKU9tsHEW8hjtbiCAOrcHjiOo9fsZtym0TEry1gNFp/G7nVpSJ/dbLG61C6T2uTlTMNr2PQmn15DcT670eTROL0uLc0ydr1h1OG\+ishF9z\+47Ym7lJ3Htu6WbNTBkeYi88821X7w1s4/NzawKWAv7v/DxaG1Zbev2Te3Y/vPXXvODgZhBXO3PfNgFXXypgPgTMh70WhNaO1z9XDFZrjAOcv0w5GVUG2a5wQArg\+4uNt2MTiYAQ5yRbnNg542mztDcjEfE7OZY8DxdSapnxVqR2WDM0FPl08726YBDoBS0y7vwNN7yBM0eXgAAJBinJdD\+mKVp8VEz3Nooi5O7nTTaojajWGOzO0tw5ISi22Ojgu7g5ftljhN5\+tNMy1qkjV2j3vsE9LqPNKTNWh7bV6p2VrgNQW9HJCQYf0xnz8WYhM\+b5RSQNDHcRQ/xAkVlICGJMNwtErKhbggJ7GZBHZTjA1FHZawjxSQoajPn7BZeoBNKwxzTONCEHIgur4etseiP\+\+iptu9Sq0Cgt6QxRTQ\+ed57BQ14ereDrM9aXDc5tSIIRRzWYJGk9Drpgd/k5JeyzmLd6jrAHBclvO26NxDxSKNdoVp8DGXDfYx3vhwOblskCU5ACBJg0NlmODwrNlwReucN9gWJtSa5EYqGmQh5IuwFKnTikkAAIFaJSYBgMw3OReZ2KjddIk0z9FCklJLaBIgdMVizxhNQiCBJAmtaY4WACDJ2AImX4HbpVBwrNkQ1lrKxueBKVWRxTZz8HwzfmfQMa6YIW/IzqRZ/zmtE4DL\+k8lVb\+8zZNrBWCTITbpC4os3tt00McEBQq20\+QQWRxz1KGw0djp0UuNKn7I02HzS\+w2KRXsIRWSvZ7bjAo\+F4q67W0W00WFd77\+Mwo6J4MLsQ57v0lbqCABQHD3v8712AtJlvMzrN16Tu9XuO2Fn0VxhFr77cx1y0BJLN7bJ79TSkNbdZ\+arBG1g6IBgM3Qhtk2E\+mzdDLONotXoNDKjeY5auqchQMAoNTFZnUxAHDBsEkfpiy3ObQCvyNgpmbYhvLAHOcMZtWWOWb1\+Lgx43cGrKE0B0Cq5A6XyONPeG1tHo3CbyU9xnNew21OTcxqTxo0opD3ktMTp1XgsV8M6miTReZ3BqwcbTXxPKYLweH2rT6n5QppVhoUfA8IZpJxj5czqnLhbsrnjrGFAsXkr8hnheM89k7ORmlo4Pwhgy7E6me7nZSCi7nt7VZDgPMsmHRcmvK5Oh2qfK1aOLmYeXB9I2W1sHpLh9Y956v81xchhNCEvugMMOt3mrTMqAwwqTA4PMNPpEEXhLxWvcfv85Oc0ahWqFQ6k1mnuN5fL9bndLNaq8WgpgF0JqvebXIxQUXIE1QYXCadigQwWs1urd3tM2k0pEJvd5tJxuzxjBhjRaoMVrtar6ZJALVOp7A7fSFOS\+nMdoNWq6IAKI1eQ7n8fhZyfxNDHqvVp7FaKLt38KRZoChqTGFDXocH9A6rXk0B6Gwe3bjCMw6LkzS6DAqSdfmClNqmpgGAUmt0tN3rC3Gasbv8KhBRK6ofNOsqqwrCB13OzZ7z8du/sTHRffAPf7N7Fpqf/rrr\+bv2/NK582Nh1Zr7auaRAACxbliwCJrPrXh6Y20BAEC89cT2EeHxTUj6nC0mW9rgmEM5glZ6tt3SZ9Oftqmkeq1EqyP91gsOXzLISZ1eGibOAPMVujkOHXC\+UMgutNqLaQDW1\+oIxVlbi5fMhoKgs5Xp2LDVJTQ5xIz5rENR5rZIxtcY5\+\+yeURmV4kWKB8rCPn6ATJOawsEYwxFuwdi8iyE\+hy2i0ENb2AzkscxIZsnyoQEWgDgOI8z7PX1Mf4ka21lDYUars1NztAB63L0eLjpDh0BkAr5ezzuKOPPkN4IqQZvUGK1p232mF\+RVJhKtN52X2i6emThaKnJIQUA1tsSchdabQNhKucHSj3NYpcrAEKeoNkPADwyF6pxPRZjNwBAqMugDSmcKtvwU2nG7wq5uCKna46WAgBQ68tdVFZraHcaJeYJbuYMG4xzikK9Np8mAahCs0ulZwUjfu1FWlsFAwC5mNOSi3VTjO28g6Tt5jF5YJ7CUO4Y2XGU67UbQsM7C3WZjZ0MmwEAUkHZHKWaMTXFxlmKMlmmAdfnMCbUtrnm4QxShg3FgSYortdpDoWMZVZ11m0KOlXlLouUZJNBf5Yb\+mLNVVYwA5wAPG1GU0zFRj0hMee86Ac\+rZGb9OTkf7M5f9hsvMzqFB7HNBoyQdc5vV1qNQ6cO6WeZlSJQt7LJADHck5TO2eaY6BDDiePcofBNN\+g4gNwHmcvbZg/plMJSUsNFtrrafX6U3o663VctDljQRYoFWWxz9axbToDZ/IoDQo\+QNxtPGtXzdnKtv\+vYL6K7WV8KVIz3ayJO92xYEikt82zGUgS4l5b0OJMsMBT6UvtVkoBvXZ90KvIB3\+fP5ildbTDlucxhV45kvbpweaaNVQikiLVOtqhEpr0HS6f1KyGoPuiyRoJckCpi\+z2Ug0NrO\+S1drtC2WAEmtMJVZ9PslxHmvQ7IiFqDyDpcxmIn2Ws5YgSfsirHHuv4cuboM5HpvAqTvvVuSRQS44vgzO6X5ji99c4dTz/K5Wsy0a5IBUSM22UqMaGMtZczBfxfb5gklQUFbHHL1CqDIU0fqwJygzKvgAmaA7ZIVC1cBIbx4JnNt\+yevhWP3AnRNiLjvdfSwAUEmHOchqeX53H2i7bRYWqHy9Ua6hhWpDUSjUaTZxQAHr54IgVqsEJGRZVqjTFxloEQkAEGdcXV5FqdU63wMpj/mcgyUUzosOeo7VTpAAnIKgKI5lAShSrRYBjBx8zhu651hf2MUW2LQEQBJInkJLhtyRoDFfRQKwMQ/DV6sF7MCqUYfpot2XBlKksyhsBpIMhvX6y7Q642HEdu98beiS2dTh8oFKN91mn60DAMj6HAG1K\+IHQm8td5ikFNvrtLY5vAmW4yl0M\+02uWr8XWGnQtYLtkP9EPoE7HPUznBQW\+pxFCsAACiTQ6LRsyEqV/hLZnMnEwKgxHpLuVUv9I2to9lq3wWzI\+anPjVyCocB3GOOTgKEeuymC1ZPklLLzLY5erZteH1jsZ4MOr20ZnI9AhBCCH11fCEZ4CGcyeM3khRFwnAGOOR12J0ul5fT6LUKkqIVwFFqk83I2s1ejdGoJv1Om4VUOY3XCYHZoD9E6RRU7ieKVtGc09/TQ40uEglsMMQBULRKAcCOKTGt0Q9G4lzI5w1SarWCJCmtXjWwyOO0uTm1RZt7sA66LVa/1ubSBo32ga3YEBti7Aa1hTkVopbozTabWaeAkN/PAmvXqzxMM0ffbbDYbCbtiIdzv9PqAKPLqCYBKLVOzTndvpBGS7M\+xsuqdJrrRv9fTslUPJlqOOja2Spdoanc\+HQlMWNeaWnSvLEonAQ4f2STpztwngOAhkOHGga2EcpmNMln371j7YlNW98JzLjruX\+dJYObDICTjPOixRbl1DNt3hlamg\+qOX5jl980z80Ue5yXXExMpZtmdC4ysqzZyAIAcH02fZOTGtieVM3MtY5woR6Xk/WzoKDjdks/pSqgmX6VhdYBX6XibLaMmgbWn6UVKYf\+jAeKPbYJol/gep2WcIgkHaaAW5WnMxSTiiKTCQDSPkcsqMj4vT1BukCj4AGdb7LM0dFgMgCwPRZjN2dUWDR5AxlgktSZ5uhCV9hgxGAp5txhP02STJSlBSyTIMl\+p\+OKyTRNpS8xBiMOj1BjoI101O/uNJmAUlMhFoLuTjcn1JL84cEHkAl5QjZfnAXgglHGn7Dmel3S0m\+vBNZ3xWbuo0hg/X2sBgCA83fbLBwNiYGYnC60ukhy1KDHBOPhaF2JmhpeRGmm6\+gexpeCMeEmAACf1kxT29pNFp5Zn69SFahoQjE\+98f2OkxBFznLNXAsodownTKc0/lnO\+3FI75qskHnOZVLpFAM9gvlskGWtA1VBZsKkdMcXlrNXjEZI\+zYw2RYf8Tp7mMhG2J6PFyBwdVmcY34nJYaTeAxfvrUK2nY9/FOEFQsEXDedqdOaRpT8Szn8YLBUa6BKM2GaUup2nch5JWZrcW076LJ1WfQk0Nnyeau6nAXaA5MI3YVYq2mS2CerXVf1BmTNl2/zZoyOBUD/c8Hm0Xc3qTPejGon2FzzwuyaY9boDMVqjRShYYkASAY9fhFOpuYHDHyZOw1ZkIWW0LvWmhRJ5zGgM0u09qKdPR5lzehN5JkKOb2CXSmPKk7E/TzbJ5FDjZs0LY5FEo3o2AdAb2jy6gvIV1Bk5t0eCu0JGvRXbS481x6PnApHyv1eOap2CtGbbvDp7Jap7lDaatboaWSntHFIBUSraLDxXBGuGK09OudC83qtNv0ickq8TjyvLZwSD/fYyTJUI/NeoXRkLSnxcLk2Zi56lCnyXTBoVFqIRP0pY3OxUYNjzEP1X0yyM3yeovpYJdJ12b1qBxDZSB7bQNXoMNkSxpdi42qtNfyidEcUntogEzQl7F4VE464TR8Ynf16SwSkpbqFGEPkzQqCAC\+Qj/DapaQIDdCJug8ZwlOc5rnaAYzwADA\+nr86lKnQRx0Zzl/kdUEzmAWjLMtmrTTdNEXmq6hhWp9MQDotH0uS9D0d061ZZbVVkhByu\+8YPVK7DYRQIqxBW3sTKcu5Tads/v4amOJ207RoS6z4YwiJFTrSxy2aSYLNXEFk/zBWyzld8c49eyB7lUcUGpK5WE9/hkqNZ/1sT5KoqNYDwBA3G0OOsjZHt80yt9qMLQ41beZSACW81NlHt80FceaTWHOqPTreYzlvMVaoLYCF\+rzhmY7fXMV/ja96ZJXX6Byt1q9eU7PbRpgzbo2m4dy6sbdFUyR3VKi97QrnLdZFFGzD9RWqWK49EK1rhgAgGWtpjBpWeDTi1hPUGdqUannqsbW0XSPZbZFF3Nq5ztN4qDj7Nij6zNuy0UXTXuDMs59wWjuUHuH1idJSGm1fJcnFtKPHYONEELoK\+6LHd5CktS4fAetNZlZHwNau91AA0DI5XOztEqjs1o4N\+PxAKiMk0gAAxtigRzeO0mSHBvsnmnUKoJOh9ukNtAht83uaWG13NWe/IZwQY/FaA3pHfaBAZfA\+Wzaqmc\+gMK7v\+90GRQkABd0Wa1Brd2upVjn0FEVOrNFpdAbdArO57FbzEYT6XUb2SDb4mM1NjvjVLFeq8lisiq8jsGRkyzjcLE6qzGXVCZVBqvZrV85aycAwMwVv3Qbv7LTgPUyB//OgFC56psaUeOG35wJD35AzL7ruX\+dAwc\+DMQAgKxataKmggSA\+KWz\+w\+eCc8A2exF5o1FEbF8kaj7pg8voKh8k3OOXsG5nBctLAAAqEWM5bTZl\+fwznOaxnUypPIN5jwKpAZjAedpM9tYr79IpRaSFEFTfD87kNhRKAQkyE3qtMPaT1kKjJY8FckHHW1VhU1M0mySkABcMGw0XCY1eTQJrL83pKCAJLRWpUGRdhgvayylWjLu86Y5UgDBiJstMKmFHJslaRjKAId0eT5Hr85GAWRC3ks2b2Qg2hzCck5LC\+MT2b2DA4NhIGAOGqcpIOZ29fdcgh8b21Te2QZVp5\+aZVN3m2wiq6s81/zCMsD5WbuN52NFBh1tHGz9sQPnNLaw5tvMaj7nD1HqaRabXMF2mY0x8HVZQ0kWeFrjbLMiNpABBpFqzLxQXIZlgVKIRt\+6AgUFDDvx5LekSu70CKzmkNXYdqolW75iutU\+2zi825Tf3Wqy9JD6OVYFa/dI7XoCuD6XNUya5\+hdbSYr4bYN5oFJIUUCpZ7hcg/2KOY4l7WLJic5HJFPa\+QWDXD\+SwbXFXpk50kqX2\+SaygAyNC2BWdsAortNtvA6pxB\+yO\+q/yichzntrY42JkehVBBy7XOc3pj1mkcNSM0SYm1hhkGyzTFwIJM0NPuGSowx7msoaC\+3GGWUkbSpg889G3R919bYB5KuZOkzjRb4fzE6cyS6ul6db9V3x5SiUP\+fsp\+ScH1M/bpLpecCsaCJKmaYCK3lM8d9nKkTSWk6DlMcOA6qDUijklypFSnFzndPUEDSflYPyU1qQXgBlpdqKL5JJWvUogoXT4NQlJNUs40yyWC7oTCOEdDA4DMaBQZ3NGQPh9AoNZJFSQARapp8LFpuFZgwaNIYIOJj7heVl1s0AgBhFpTIWVi/WweSWZ9rktudYleXWhxFALHOd0JhbFcpyJI1RyPHwBSjAso9XS9RkTCiLETpEClk9AApKLQoOmw\+hI9ijHHTQe9UVZN61R8AL7GKFO4\+/2hjAKA1lAaBR9AqFIJuFxXZFKsVvGdDMcaiMEMMKWFbifMslAAbJ/bHh6RAQaALHAQYtpNlj61YzZNCQzGy3rjJ6xzjmrobgn1elyddkeEVRfbfilyONqsGtB4O2z\+PJtDRgMACDXmeQ4f67T1sHSBTgcQ6nFYewCA0s9y6QtpEFBsj9PJ\+lkAukCvzTotl7y\+RBA\+0brENCUYKA6X8vvTCv2IqdqofL2m2\+bpM6kJn7uf0s9WMCwAQCjm9gkMDpmCBFDLjepupzdh1AGQYp2RUpHAMiwDUptBqqBA4bzDAADBMFCk0TJdQwuBy6fJKywLKpMqONCmk69RgCuU5gAmuCuGcGmW49GUYPzNwfpYBiQ2LUEC0JrpWuoi48\+oJqijoS8Q/gRHD/W5fUKDc7qa5oPpNr8JAOIjWrqEtJrkPL0hjqK/qn\+DEUIITejLMb8DrdHRPpvJ6fGp7A4NBxyEGKfV7gpyAEBptOZJtL\+SFAXcUGzLsRwLpIIk1Sa7LWi2qikTrTUYdbqKEHmd3sS5FxCTRofLPJylJdUWpt/o87rsFpPeBG67ymuxBXV2u5YCjh0uhEJnsgz8W623WBmPwcuETCqKnKkxWnMdsQ1Ws0tr9wY5Xe6Pasjr9ILWoRk4VshjNjlIy/vnDSqK9butJqOJ9lw3//1lloonRPK79a89rxue8EtEypNN\+wd\+4BrePtTw9vAGMoBIW5N990AG\+KYPzFfpaRUAgMhokQ4sY6M2fcxgn2OYeHYloCiR3xZQmYFUyOzuuUaVEABYX9QXHApX0j4moTfJVdwVLsSxND0QfIZYq5mlTdNJV4vOxbmsAlIhMdtK1bk8CSukgM\+xVxzWqNvH\+awXfRop5Wl3krTdRNJeIINdVhdhd1MAgxlgssfiGDgRWjvTqB0cA8z1ua1tNlfMDxKHq9wairotnzg4kYrmsaEEqZtlstE0Baz3siskrlhC6g3CkKfN6uhjtd2OUIYMxayWFg0tUOln6gFIFWW2COymaMhz0eRNkxSPBAAu7WM4zhb0K2Q//vZgLbGpEC13OOUKSHktQebazUikgKaADSY5GNnklQ5yQNOCq93LpGKazT3NBsCFepzmCxbDRZoZiu2FtKrI5i7VqIQs0\+d0RIN6gvZfcTJ8k5UyGCgzN5jX4jivK\+LnBHQopM5ro5eIKTZxihUsUfBZV6/Fs2CSs/KwvksmYwcDBTbb4Hhdrs9pbPOFpmsoPkAmyFxx\+dJcqN/nA5slTpMCtUEywfBoLu42f\+JieBptn8PaAgCgLlT7o0yIn7uEIc85rTFKKgQkgMPerndV2OjLet2lICWgoNvGiq3e24yKoaHLKZ8r5AyS//qG0jZmKiA26nQlKBqCrpBHNW3Ck\+LYFEdKhqqEC/Y\+NbfhKYCBSbAcc3R0bgTmRYs9cuoSAMDMbxQD8FU6SuFgvUFK4eFInVxNgg/4A3cLAACPIgd77EMWuFQolDi08UzexoFFxN2SEJcPJI8kBzch4TotkVw6xGYohajfnzz1SsusV1oGlhdKgqzI6LiNdLTbjafNXJ7ROseiz4RYoIbLk8OnKP64ChHQA6vxSIrHjQy3BmTYUIakBu9SUkRBjOUAgE\+SI/bGZXOHIGk\+x\+QCuVwGOD/kZAfS61S\+3jRtZAYYAFhfu8ESCakKVJ52iwcABFqdKOjpo7ncvZMJeUJ2D19vLSWZLpe/yGaNmB751LlkuttbnhtNAABACiDY41OUOE0jp6eKu0wX/SDXqvgAhUZL4dAHGs90vzNg5eY4TQLG3OIbKE8qxPIoeuSvg0ClL\+As3T6D1O0T6ExikgEA4LhkKNi/755TzwyuV0HHOR2QpCD315RjUxw59i8rSQqowRacXI8DLtTjMLfZ3f0tcQDgrdDlPrv6XUEKKDIbYtPjn1Q4NsmReQNHJAU0lfWxmavU0eBP447OcUmW413jgYCkBCSXYrlJTnuAEELoq\+JLEQDTGqNFAxB0Gkw\+AAAgAVh/iDa7nTq/Re8IcZP4A0QrFGSI8bOgogGACzJBoI00BZTa6PAaHQAAnN\+hdyr0g92kJ8IyNqPZp3V4zYMTX3Ahn8fLqvVaBUmrdWYbx2jNbv8nWpfn1JGelUU7B7c8tJB2//kDh6qbo9WqEe3FHMcBrVZQ3hF/2MkRZxNi3D5S7xjsKsr6PUxIYdFpFBQApdEZ1DaT18caJ\+gO\+hWSbP3AvWlMBnijfOAH6rYdP/u6su1CICGtqoD9v3j5IHw2GWAAyE3EepkJDYavXNIHAtrbaYeJh19SarnDQ6rNF2y\+LMcOPD9RGrlFnWKDXSYrmMyUWkNSABBMh4J9vmBKpxYCJBn3lRAlUoWStKHEwolpMjFip6SKAoAMSefrzST4Q74gB4ZZRsc80tLm8IhDTMQaklkdszXU1XumDiFFCu0MhzHpMPfSlEihmGYiEz47z2CWMuY2TkWqVEKAuNvZpzAVUd60Vke6LZcVWpLTSHTqLOnnWK1US/FplQj8Qzvl07o5Dl2v09GrMM7Q0gmX8WLIrMhlgIeKNNgXOhtkUgr9tUspUmlFIecVn0U69NTOMle8IcIw8TuEUkEv66eo3GStJF1otM3w6Lr9oYxuMF1JqQo1A3VUrCcvurz5ajfLaUu1Cj7AQJzN\+i5ZTB0uTuZglCrvBYtf7rQV\+MyfODXznIaM09g2dLwQEzJouihIBznpuFOJe\+0XTLa4zl5mdra77Bf9uVPg0j5/ZnBlodpQqjYA5w\+FrGCxDUzWxfnH7gtApLfNMYfCFgdpthXTLGs29pic89T\+i4xv4OKrDOVOO0VB0mM65wUA4FGamW4nrYJeuyE0uJ9MiAlbLR2/OwIVS4SM9ROtFYBLBzmpk5mnozJ\+d9ivKtKRKb1ToYUeH1Vgskz3sZ0K6xwdGzbahi/10L\+GJsEaUdpM0HXR4s1z\+G/TUBmf/ayRya0p0yvCLme3iuHrHHnX\+TYmhTRNrNs732UcsSLX5732VqOxvssuP6HXiGZworufnO12Thv9FUjqzPN05kzI22YwBm2zylQUMGyWAyAhE/L3sbT4KjtOswOrZTk2S9Ljs4t8iuZz/vTAXc8lWRDQ13z52Q2h1DMcFtprbQsaZlvUfL8jYCPnOA3gMkVyUTStL7FwIZu1gzKWOYwJmzEG62bbqCjjS2m1Q3\+w\+SQJQXfIEhzRnMSl/f6sHgAAQt6LFmeapnlsKKuxlBmH8svAI\+lsMJQGGJwFesy5qygd2eZyJX00ZVbwc7czSYpoRcGvXQvMIxuPgkPf50BSQpJLDwSKLOcL8iaatTLusVx006UMR9HAOfWfuMavMvZikRpVxuKKBHXywSbglM8VYmi5nhINH5FLhzgePUFVXufoJCmiyCybuwRc0u9PUqpr7wQhhNA/h8/sz/pnhmW5gZbkG5gdBgAojcmo8DndPg6A87udDKUzaRVc0GlQay2eEAdc0G1zhDSmq79UiAs6TSaPyu4wj5z2kWXsZqPF5WMBgAsyHj\+n0ijuMHrY7ID\+83vXVKzZfSbkMRT67Eatwe4NAQDrc9lcIZVOqyAVGqOaddrdfg4gxDgcDKXRDZSC9Xt9nEI1lOClFBoV\+N1eP5c7nNvHqTTXnwL7y0xIFOQp79a/9vyP3xr87/WfPagpIofe7xKPhev\+/Petf3iP6U7lssSRtib77r9v/XNjU/LmX30EALlBmBmdpdxmK7fZym32\+R5vhV2f9nr62HHrciznNAeM1ghtWeCxCpyGZpMr126R9Fg\+NbnjHBu1mz7JLWSDHK3LD3r7WQAAkcY422IuUnBZkuLcrmhobByb9DOx/\+NsM9mj/lDMEyI1KiGQ\+QbrbB3bHwIeRQkoCoDtdTm6WQXPawuaLN2g4nmdPaDIOPTNRisLKp7HcckbEqh1heoRT\+SkutisjZp159zqGcbcXE1cmlNNN\+vzSciyIb7BrjBrRQqVVKeTqmmRWk3p9FSuyYVlQgZ9uzvXQECRKrLHpL/gCU58LSn1NIu93GYrNWmE1Jiz8/UGR50yX6WXa9gug\+Gi2xdn2bjPfdFg6AppivVXScCGmE6TqdXtz9V30ufu9pOkmp5oZZLUm2U\+c8Dsk9psI4fnZULBpMI01\+edTXsuWhiZzSojfSG7jzSOftMySReYHUqv73aGqXBap439RuAASKndq7KP7B16fSmWTQGdbzAU0OTIwIIPFEGT2ZDvstXSYrGGmVD2GnuZcM8\+56da1Uc6a7/KOH3dmulO7\+0MczvD3M545gzMZ85GHC7QG6U0CRwX9zrDXl/UYQu5fTGn9aLF1u1jrjjcfUAJSS59zdRrJuSPg0KioABCUZerL8RlOQAgSa1e5HeEPKTkem\+4BQCxRk/4XV0MCwBJxhG0uSc\+JkkCwLgu8SzndbYYDGFWTxvUYpVWQvkuu30pgEzI22q2sSGu165vtnlTAHxaVaCi\+XQhqdGJgy7Wz2ZYX6dRf8Htv9pFTjMu1s8CF\+xxMaDSkDPHlkGg0Eop32WPPwOQZJyRkKpw5FD2MZeLC2VImtfjveRkBIrQZYspaPeJFMHLLr\+IZi7o9EG7X6QIXna4\+wYPIaRoAcnFPbZWi\+WizR1nR\+0w5XeHvTDNwSy0qViLJaaxFKkpodaYx9hDDDv28BNd01ypkqClrbYSA50MsSM72/NpGvzuKy4nG\+SEFAXcqE8BqDydNuO2x2i9bLgdly7Qq1NuRyQEAFyfy9LiHP0iMUpNaSDq8sY5Lu6xfGqwRUMwTjwVDGZpTR4NwPpYF5PkuMz4tYawXAaA0JoKKfdFvTnMBFMcl2TsAb05EiQFtJpS544ImaD3spfL114jduUywCUnODpdoFOn3K4oC5mgu0Vv7PRzg\+vn/s\+mOVL4VZyBEiGE0DXdsgzw\+Meh3BI26GMpLRn0\+IA2Djy0ckHG5aN0\+qs/hQAAUGqLy\+W0WtQ0AyqD2eE2aWgA0FstPotFTT3EUksMVqddTwMA6zWpV/5uoE/dI7P2AVT86/uMyed0nzoSv2c4rTvzG3/2uY0Ou89oqip6CqCwYoXe7HQarxZD03qbw280rpz1zMC6LptJRQIo9HZH0GzWUt\+\+RFasMNgc1sG0GBsKsSQ94i\+sQm\+1eQymhXnm8gqaojWmaxzuqyEVOOT8vw7dwAaR8x/s/HOqNQnxzrP2l86FY1LN51Y44EI9DkvIx6YYU0ajKLKYaH3u\+V49z6uJ\+kFMAnD\+K05/nlFPOP2k2Sq127t82uKQJ6M1zSCdnW5/gVEFQfdFM0MZOdZF0UZtb4gbfY8HWZstbrbPUJvDPjLfaCSD3jDjZb0hsd4gUQdBr46Z9Rds7jKDWWKAlN8ZtPimWW3TaADgeh2G845godNJT/grwPojHjfHUnzSc9mpFhl1\+RSZb7DkQ\+iKi\+TRmmlaKuVzpxlnh9mb8TMcZ78YVJF6o1ytkJntlFYnYNwJFQkAQo1Z6dEmKBo8E12rq2aAQz1Ww5hZoIFUyB0ens3cZqjqjAMAIfyGea7HOk2R6ww53PkWAMT/enih3TzPDq12w2njqRQ3U6zRye3u4uE\+n6PqjPO6WSaYJHVjAlQ\+rZLQ7rBR3cvqSt2OaZS/02SOqW1KHT26OiipPld\+ktQZcqnbEZ\+ShDb39icuARRpsMwZyJFyfU5j26hvLi4ZDHJBH2c1RlkW1MY5VoNUbwAIsSNWGhg6TqunWwczwBOd1TUI1fpyl0FEkwDBsNE9USxJUTa3jISYDYAkCa1RrvWyOttAp1nOfylk45v0\+VSwQMFd8bMZzVVTmkK1oVhhCGrUQgWdrzdOU1jbzY48l0mi0BapoY3VUZP4OuKrjGX20AWz5iMOMiwltTnF5ER9G0i6QMGdf0jVvNurUED6g//8tOg/B4qxZovCbaVoAFCXOKwXTcYzDgCWE\+ntcooUGSyFVntAZ02HQmnaWGZVC2lVuTUY1NNtLXHeii1Ko0YQdE9YNpFaxVn1Hw/MOawTkexgGQ6VDFxLzSyHpdVkOG0NJUOk1O4uUpAwQUQHAFzC588oDPkV2iKLFiDUYzN1UtYyk1oIkAl5LujNfWBUWvW5zuoj4j2S0JlLBzLAY68/zblCFt1FVk073NMp7wWvgqA1hWbVJ0Z90OYo1auEAJmh/imjy5O53hQXfFojo\+ydVp/Uri8dGsBMjSiASidVODm9RkTCUP9wQm8vD5kv6lStAGlQ006FcNQckhRldXBm45m8R9JQUbjXPU0Bl8cemcjTm/KcZr/aLqIVUr0x32q7YF9UMsHdRJIaReKpe04H/6xyGcrcbqHFcvGeuRcAgCiXWJ1Ks0YIQNkccbP5rNqcDoYEBudtOhp8E5yvQKURMD/2a/yKF8cfXa202OYETRcUvEQPQXzfdZuGEvgH1p/ncUhCPo5UTcMBwAgh9E/nlgTAbJDx\+RgfC5rBPyys16xZ\+Z/Bim\+YaZcXKNZk9FJWr5oCDkjguJDH5dVo9err7ZhSG\+2ewRmZB5epDHa3wT5mRa0jmHWM214z4sW8I9AGB2MYv/YgUmH0\+I2D62otnqBlgn1ozS6fefxyhcEVNIzencrg9BmcVz3cV4eIWv10jfl2KXGNdWLte14\+RRTIa779jaqEtKoIAgAQ62o4CwAASbbpPKUsJQkxwE2ngrlg1GFt8YzsjBnsDZEyAACIe2zhkF7h0Qv8rjaLres///NSbh2C4FGUgFZPd7ho8MTUljla\+rIT\+LRG7nIlGUcbo6atKhIMpNHSRtuLWU9KYSjUawq1pIgmKeB6QxAyathcIw7HZim9QkGJDAbSZ\+72eji1qYBSz3AYCqlgyEMKNWbaSV1weDitPuOyXHCw0xyOwT6fpMTkuo22nDMaUg5XqYbKhDwXjRY2SE/TOM8ZmAxJExrTPK8uH/xdNmtQ55jmcNEDM6cNPg1zwKM1Ep2GrwDgNIUaOhPyc5y20GAAANAb8wevjVChFo5rn8oAAKmiPb7RvVBZGHilClVoMvYGx8VUlKrY5im2wVikqpThSsctFuot8/UT/O4MHa7P677scke93v6QqsjBLFZ5L5p1rEo/zaAv0uaaLdi4n5Va3HM0dJpxnLM6U1rbXKt2Em8x4WCicRYZju13Wy/6c\+c9sgt0iDXrz/2nT3C3njLaZuu00tEjKzLc8JhYAABSXepyAgAARdndFACwXIYb6IGTCTFhi6WHgqzfl1YYACDL\+q7YLHEakkwwawQASjR06VnfZaO2Z6DNjBvuwk2OmtZ7jCyQPBKApKU6xSUPkzAoSFJV6p2gwzaQatrtH65o89BXIiVSqPJVA7l0oca2iBnYQGpjBl6fS2nKmYGlhNZyGzOqNvPNnsG37JJD/yac/mm5CwNOddY5YeH5Cn25Rz9qEa2hHa4xfaJJvU2lH3G30UMlHHoPMNcLwKO1s532EbcEPW24DIPvAVYZFN7R38uaEXsb\+jcXinmDhE4jyr0t3GyNKSxDb8zi0zqFx9lqNH1ihvn2UQMuCL3jtoEDmW5zAgA3eP9xfQ5j0E3KTA6VTi2CIGt3cLSJpECktSmdzk7Gn\+JUQhKAVMk0EPZT5a7cW6C5PqfxnIeUUFwGgA\+Q9rvaLX5\+yJtW5y7d4L1BqqZbTKzeniFBqNIVkFbWzxZqKJHOebsut4Z6zuCNwdc5BhdSUpNz0ag/j5Tc5ZMP/6SmnT7aOfzxiE8Vg/9WzfeNuKqmXGWtHn9XgNGtNg6uptCVunSlLhiLUs90emeOXDJhHanNi1hzbuG0CY4OhRb3HSPv0\+H1uV6XN6M2FYy\+zxBCCP0T\+Fxfg3SVnkMc67XqnzpErdtrHez5S2nt/qwdWJ/D4tBpWF/I6rabVCQAqVArWIfDCxo9tsJ\+1STZ\+t0v1V93Neq2HbHug3/\+\+/7Y3G2b746P\+bRAvvEZw2r22IbOm\+4LTUmM1vLheZIBWG/QOPA8Rejt8/UAAKA2KDyGcdvmmOep/SGDkVWYFTTHua3tjJq2GkgSANQzbMY2uzdttSt1pIgkB\+e1JSUm9x2jm1NSPscFJyu1emiNeiAj5Hf4Vea4zlFBk0KFaZ6D41zmix5FictMjZr2jCT19tto5yW/P6XRCGmN3OqYRqukCgqMI4\+gKra5iod/pKVmez5NAQBfoZluoimdSqjTTjw90hAueEmvafVrZg\+\+lxi4cQFxbjWDrpMzllkoAC4DqiLtVeYV\+4xkgt5Om6MPVFKrR6nXECQAqOZ7jZzXdclhDlsg3\+woM2hm2jQAkPI5O9wc5fBOy/UV5/whnbotqBs\+qZF7DrkDmkci1Pfnjn1xDCkxe\+4wT1gcWmJxLbYpiPFfS1zwkl7TwZmVagogNGFGLuW1nNHZweiiaQDQzWN0Y/fu8V/lqVshdwflE38EACCgFblAi0/TA1lrh86/kRH/q/s2GnKTRec77F1\+femNTS7Pxb32EENPN1\+///PUkfK7Lgc1tE7BZ5mLZkda75hvVI\+6PpSm1OXOd7j7QhypIDMcB9y4y84FwwbNBUY920Pzgcw3uYbizJSf6WH1s626XLhOaIxzNABc6IrF3OkDUm\+Zb9MOxtVkvtG1SOcNW63ng5ZyA8dT6GmbScRYgrk4kKRJBeQaZYRq0zyPOklTQGmm68kLDm9co79WM\+XUxDJdbq7QNpnmM4QQQl8xvCuR2A1tcO7smaVLl35OpblRW7Zs2blz5/XXQ/\+YCa\+z4hv/fksKc23Bv//iVhcBoS\+1uMd83qGY7TQPvjXqukJXjJrzLlJmd801qb/KATDXa9cFfeYKp/4ziGpYptVoSZlcg69i/mrifCGjuc/gVOg/3wasr5oQazZeoq1Ki\+arfMMjhNCUcOLEiXkLFt7QJvjdjhBCUwihs6vGppyvjZ7mDA52Ev5KIyXmwU7O/zhKU\+r2flY7u2VINe3y3upCfAnRlN1D3epCIIQQ\+pxgmy9CCCGEEEIIoSnhq50B3rlz55YtW251Kf75YT9zhBBCCCGE0D\+Br3YADBibIYQQQgghhBCaHOwCjRBCCCGEEEJoSsAAGCGEEEIIIYTQlPCV7wKNbhV84RBCCCGEEELoqwUzwAghhBBCCCGEpgQMgBFCCCGEEEIITQkYACOEEEIIIYQQmhIwAEYIIYQQQgghNCVgAIwQQgghhBBCaErAABghhBBCCCGE0JSAATBCCCGEEEIIoSkBA2CEEEIIIYQQQlMCBsAIIYQQQgghhKYEDIARQgghhBBCCE0JGAAjhBBCCCGEEJoShDexzYkTJz7zciCEEEIIIYQQQp8r3pVI7FaXASGEEEIIIYQQ\+txhF2iEEEIIIYQQQlMCBsAIIYQQQgghhKYEDIARQgghhBBCCE0JGAAjhBBCCCGEEJoSMABGCCGEEEIIITQlYACMEEIIIYQQQmhKwAAYIYQQQgghhNCUgAEwQgghhBBCCKEpAQNghBBCCCGEEEJTAgbACCGEEEIIIYSmBAyAEUIIIYQQQghNCcIb3eDc2TOfRzkQQgghhBBCCKEbMm/Bwhta/4YDYABYunTpTWyFEEIIIYQQQgh9Vk6cOHGjm2AXaIQQQgghhBBCUwIGwAghhBBCCCGEpgQMgBFCCCGEEEIITQkYACOEEEIIIYQQmhIwAEYIIYQQQgghNCVgAIwQQgghhBBCaErAABghhBBCCCGE0JSAATBCCCGEEEIIoSkBA2CEEEIIIYQQQlMCBsAIIYQQQgghhKYEDIARQgghhBBCCE0Jws9pvy\+88MLntGeEEEIIIYSmmg0bNtzqIiD0z\+DzCoABQPvQdz6/naNr8L7xpyly8afOmd40vES3Cl75WwWv/JSFVf8Fwwv\+BfO\+8adbXQSE/klgF2iEEEIIIYQQQlMCBsAIIYQQQgghhKYEDIARQgghhBBCCE0JGAAjhBBCCCGEEJoSMABGCCGEEEIIITQlYACMEEIIIYQQQmhKmBoBcM\+Hu3TSirLx/xV/98WD/\+9jxRVlyv/7ry1xAACIX6z78VJpxW2rXjjJhg8Y7yuTLvvuy60c5P49tO2ypXd\+9wf/8c5F7haf2k1iP3jmzooyaUXZvbtOskNL45/\+/ru3SSvKpHd84z/OcEMLnx9Y\+N3ft\+YWcmf/v18aHrtXeUeZtKKs9L6VD1lePhoeWP/Sfz\+trCj7/7P3/8FRVPnC\+P9OfZ6vc/xWkfR\+voTpLdhMCyvTwGIaXUirm5tZZU2ruBmUNbMf1PTqKiO6lUG3itZbdRmfqmt6q9TMrVWYxasZvfLQ\+wibuQoyKG6ajZ\+HFnY3jZSkxYVpECoNsW6aWLdy4j/5/jE/MklmkhDCL/N\+lfcumek5ffrd53T36XO6z7xfv3syn2yvHr69atbSB187Qd1Pn1vir5rlvyX0p1zoBj9/5cEbZ/341ztOfJ5d0Zj/bnvp7xca57N/eWZJsaRm3f7rtz\+M3uavmiU9t6sXspvz1oPz/FXzfv3OscFxkjx38E/R0IM/XbC0atbSHy158GH5pb3HBsdb0Y7eYqEeHGczO3dvum2W/8Y73vo8v73UjN7sr5rV0HJwEACAntj7ivLgbXf8aJa/avYdP717/XNvfHruAmNzmUzzLhivAo5Twcffp9e8ohWZnnjn7qVVs\+54JhdeAPhqx69/NMv/o9Du4\+PE6m\+fPLfEXzXrwc2f5YN2\+t3Qj6tm/fjXO06XygL9bGthgjcuuENa/a/vftZf8PMiq7ut\+S/nL0lExpcvRVK0sz/3YT6TDZs/G4TcMWrUfz9avfur0YXQXzXrx7fdtj76jjm8LfS0/sqGhptvv3GWv2r27T\+9e0PLju5zAPmj6y3yvnyFzZbbMQfhH2UPIMMxzwV56YOv5Y7M9PS7q39cNfvhN46NyfPs2396x/qWXSeyucp\+\+2DJrZv363dP9ucO/qP\+k6IHS9Wg/PmioSUfzLP7nlpwQVvk/9HqP/0jd7jLV\+Rb5H3nhtOffJambPw9O15ORpX/7H8LNuw9OzbNzFeKfrZIgj9a8uBT/7L7c3dEcEb\+t7RhgnNoLrxnP30n/PBPl/y4apa/at4dDaF/fTd7gh4nS9Md0bElbfbt0upN70yUk92p0geo/5Mc7\+pigp2Y\+3aJsje3sec7//Wns/y3hf8ywTm0ZDwzW9r97sZfS0t\+fGN2jb9\+7p3u3AFh/OvGy7g7EEKjXcJ5gK8iHmb\+4p9UewZh0D1z9MuvAa6bt3RRJQGo4Ktuekh5Xm/c9HFrS6cYX/mDs52tmz7oBf7RF0I3M4NjL/o8VfyCisH\+U\+nTXx58f9PB/R89\+/b2J25mLv82XZRzh9r3fwkAAEc69x574uYV5SO///boroPH1y9aQgDoGWOXWXi5cf7gS4/c83rXIABcV1k1d/DUmeOftD9/z8EDW/795Yfmk8lloHf31s2dK1t\+NmK95b754vLBfoDBs91HT30LnrmLb5rtAfAsnF9eKqFSPOVLlq847h0E2n/8SLofoPxGfgHjAZh98w3imt89Ytzz9rYXt/78J/98Kznx/r9sNc5fJ6rPrlnoKZXe\+YNbH7/n5a7B2ctW3ru2avD0oc79Ow/v/2zwj\+33llyR1wNFQu0ZZzNnweFxt\+r0e\+FfP73zjOfGFXetrfW43cbuj7d9crDXk3z1oXmTjPzlM927IJtqsQq4uHQFr/RMkOA1baKKXMR148Tquv/PReRl1oKlcz306\+Nfnjm67\+1n93UeaPv3F9d4KheuWHbua4DB3mPW6fMAc25Y7Cv3gGfewsqLWNfFS\+/f1X2\+tqYCAM4e1g99M3aJyhv5ecxw4SlfOjv/h6eKX\+D1eGCw/\+SJ40c\+fvPJg8fhf7/\+0HxCT7wjP/z87q8BAObMXUD6j3/ywZZPPvhw32tvx2onlS96Zv8Osx8A4OuuHQe/WjXvByMq9rfGK1s/XNX6c1/xX1feyFeSb04fOXP80Mdbftm5f/1rb//un\+YULkHKlyxfscybPaJnD0EVs8tJbuNyh6Pcn/OXMBNm2tr2yu5fLP/lD4segybYIug/9EHX2ft/6AOAweOfdB4dm8JUsjRFJfbs3PFykm3MzFqwdH55btM8cxaVe6B3RJojvhqZ4ODg2a\+Pnjr8fuszXac8f0yszNWNEWkClC/2Xpf/o\+g5FADoyd3P3/PMjlMAAOVVN5TTM1273\+7a/fHeLf/\+6kOzRm5msSxNt2w9ov29x9JH92nPd3b3//k/1t\+UW/WYnPz/Zs8qfTCf1AGqxE7Mbjuc2r15W0h8RqiYXP7Hjed8cvYvz61\+fNuRzLdzK8\+fOX2kc9uTncYnr70dX/mDwiyVvm68nLsDIZQzMxrAZOH9r\+y5HwDose2P3BY1Ku7d1K7We3NfP/r8o7se3rLtpc0PzK3f99KOU7Dg0WfX15YD9I5JaZb43GuvPzSPwOC5g396/lfRDz/5/Qtv1v7xmUVXXfNjPL1dOw\+eBn7NhvlG6wcf7uxev6ImfzLwAHjmXNf/2T7jVGjJQg89a\+498m151ez\+U/0AALR7m/JW1yAsWNvyqnr/EgaA9h7Y/Mzjmw6\+v\+ml\+trNP59UIGZ5IL2jpf2h2qYlw8tf94NVL/zHKgCAczvW3/2rjwdrn369/f4flExkXIzwWOI/HgMA2t1yR3DLkRvW/Nt/RGvz1wpPKI92PvKmpr658sUqrXX3157lzyprx9mJg6cP7Ts6CAsefeXtf6upAADXfEPZ\+nfPPCDjr6hIqMfZzPMfjdsAPntCP3QGPLWbtNceWugBGPxq10vqO9/MI99OLUiX1jTvgoxSFXDcCv6dNV5FLsUzzsHQ/VSfcl5uXP3iB/98KwNAT\+zdpDy9\+fCOTa/W16r1/3NzAACg/0BzsPHNM8uear0KjpazKiu\+Od3ZedytuZmBc4c6u87Nmlc1ePpU4TLVjyX\+Y/1No65DM2eEfCGEzICOoHK4a6d5es18z67ft\+7\+Gipqle0tj9ZWEgB6dt8Ldz\+17aM/GadWLJtEzuixzr2Hvq1c\+fh9599685MPjLP3/sBXkIeKWXDug82bQ3W/K7qj83nu//ydF59\+sv3o5hc3rxKiSwsWIYseSvzHQ5l/u\+bmXz589NQNa373bJ0XMnd7K1c9/3Zi5ZyxaZfmqYD\+fa9v3rfylVVFbmpMsEVzZnvOde89dPoXvnlATxi7TnjmzPWcO1OYwhSyNFWl9uzccXJCPwOAgvI/rPe90WnmDf5jTILnO/81eM/bxzt3Hz27sg5KpQngZoJT9BwKAL3GK7/fcQo8yx95te239T4PAJzrfOnx1a/vf3Pf8TWrx2zmpVZQj\+jpd\+Xgs7sP79134tGbZo\+TE7HUAers7ncnXmOpnZi5A3Vduefbrle2friq9RcT3WwFgIniGep/5cVtR8Cz9JFXE7\+tz52Un5bf7tr24uYHqlt\+NipLo05b4wUBIXSJzYwh0BNghPUvhBZDetuvfv305jRUrVae/6eJTreeOSvu3/TcnZWZztJrayD02cPvfXQGblzxi4fuFavg\+Ef7jrrDXw7CdfOW18wb7N7beYYC9B7ad5TOXbY8e9t78Fjn3s\+\+hYo71z93f/Y2PKm89dFn1y4FOHd476GxtwyKqapd\+8ANg4e2bt51\+gpFrjLw/G/XVH3btempR8IfnAZ\+7QuhcbvxPeXeueUAxzvbP8yM7WSEx\+KbX/u3plvHb2WNG\+oL5in/oRdg0HzvnU\+/ogDg\+cGqf35NU59bM9mO96vJhe6CUa7lCjhdprd0TRcyv/65Zx9dCnDq4GQPCJfb7MXLb4BjncaxQYD\+ox8d7J2zaFnVlPtcsj/0kN6j\+w72Aix\+9Om1tZWZKkm8Kzft\+eTI8c2Tu9oePL5vd9fgrGUP3PvzBxZ5zpvvFY60BKhcvnrt8uuOvvHqjgkG9pcveejZTWvnZju6iy/Tq7co6iewbMMLm1ZVXsQB5LrFax8RK868/\+JbBcOe8ybYonJf9eKKr7t2Hf4KgJ4y9WOwYDl/ZccGFMjv2cu5vsmVw1LnUPeE3pkGmHvfc7\+pz91omFP7m7c/P3Tkz08suSrOE9fBZR2VM2onzr/rsTsrz3\+8\+bXJPTo0fjxp996P0gBz73vhifpsBff8YNUTG9bOBThj5J9BKMgMnrYQumpgAxgAACpqn1AenQvnv\+6HWXXPPFE3qb4jT\+VN8ysBBs\+e6L\+mDmTnDu02zsGC2pWLq6rrl8\+GLzvfO9RfuIDHt2LxnG\+O7jJP096juw73e6tvrcp23A2eP9M/CFA1f0FhBwQzd8nC2QD9vWe/mVwkym9d/8Rdc75\+/8W3us5eoUc0vbUbXrizEr7pHYR5D/xmfe0EY0d/sOo3ygNz4cv2Z29ffuOSBx\+W//WNHea5ibZ2wlBfGEZY88LjYsU3Ruvjt1fe/tO71z/3L3/Sj11EglfWBe6CMa7VCjhdprl0DTus3n5T7oG0O5/dXWR48ASY\+UsWzgboPT3ZA8Jl5plXK8wbPLH3kxPn3W69s9dzU\+2SilEX5YVB8FfNuuOZj/KN\+W\+MlqeCdzzYcMeD0m13B5WDgzC3bu2KSvpN79l\+gFnzbppdeHQk3srCP3t3PvXjXLJL73x9xIhfemL/rsODHiGwYv7i2pWLPd90besc0b7xCL945t55gwffeLHzKxh/3Ef5vOVzPQD9J78udoQd/MeOF5/fnK5c\+fyLz9eUyl7VLP\+Ndxe8j6AET9W96x/l4YjWunPMFf\+EW1QhiEtn9XbuO3p28PTBj4/SuctqK0d3u194lqaqxJ6dTE6\+bH/\+ngcb7sj\+93Dz7tyDzd/sf/LOhQW/kv5l\+Inx3l0vPpL5yW3SHfe8fRRgwap7luUvP758u/EHhY9qry949rXEOXTw697zAJ65Swq72cFT4S0YST1ulqbb4TfkbEykW4LP7v4GKmp\+8bO5ucxcipxMsBMrVz2x/ifXHd/26o6Dkzhajh/P4W8LT17l826a6wHoPft1sRWMPW1dzt2BEMqbGUOgJ\+ae0A9lRhZ9c7yzu3ft/B9M6l7pBT\+aehU4bew42Atz71q1qIKUL1uzonLnB/t3med\+Ntzp7amqrq\+d/eG\+fV2flR849HXl8pWLvdr0ZqJ84cr1T2n7N2mtO\+7dML1JT1b/0X1W5pL29GedR8\+unDP\+XQ8y/xeJ5LK1uz/sPPGPY4eNXW/v3/n2CzeufrX9hZ/7St3PnjjUF2pO7W/f/tvKD3fs\+/uxM0c7O7e1fryt9UXxhX9/fdJPNF1NLnAXFHEtVsDpMv2lK6/g8dfB3s\+s01O/SXXdxItcCeVLV4o3tu/46ODR5b3GKc\+yp6orO0cvM\+IZYM/cJRUegNyjs6eso/nx0lV3boq/sLa2ktATk\+q\+K3iOdNA9cfTL4fsL5z/b/d4h8PzkTrHKQ2BF/U2gHvrAOHX/Dwt6jyt/8sT6lfue3/n7N9a\+8MPJbCopkqXzn2nPRz44XbX69dj9o3sFRz7mWr5w7sR1jJQve\+yJu3Y\+8/4rW42lIx51nnCLPJ7Zt65ctE05vPdQ9627zMGqewMLZ3WNSn8KWZqq4ns2t9/Hzck3x48MP8DigTP5SjPyCU/PgoUFD3gOnjl6KD/e\+4Y1W1o3PbSoIv9Y8ahngOfML\+ypL3EOnVTn6nhZmm69X1r5W0flP3n21XhToOCMeSlyUmIn5nJRMf\+\+5\+9/5x7tjVf2iY9NmNj42ZlaZkeX38u5OxBCOdgABgDo//srL287AgseeHzxZ6\+/v/P3m9euaPnZxOOweo\+ZvQCeqvkXM4DsMqMnD77X\+TUAbLt/\+bb8p/s\+OHr2n4abH6Ry2arqyp3W3p27j5\+dvWzVosrcDUmPl59XAcdPnTh\+HoYHrNIznx/7GmDuPN8skhneRAf7Bwdzp4fBfncQwOMhhVfD5Tevffq\+Nx7f8crWvasu4faWcu6jV9VtZzzLQ2vndL65\+0/qa6uX/c8J25DlP/zZL3\+Yearn7Kctv/z1lkO739n3xF2PFR\+BPKlQj0LAAzBIewcpQCZR2t8/CACeitw6iFf4\+VPCzwEABv/xjvLIkx8Yb7QffVQY/ajYVW9Ku2CEa7ECTpfxSldFptnT3\+/mL8IHB88ODgKUF2sOjVH4\+Ovpd0PBZ3dfYObc3AGh6rKNHr1AFXx97dxtO/e9t63/OFn00PJKz\+gG8HjPANdtSb7\+0Dw4ufvZO555/9SJr6iHAACZvaCqHODM6c\+\+Pr9mXr4kn/vsL8eJcGuuyTfisc\+DLzUOdwL3H9/VeRQAPoneURnN/dp876MzaxbOz\+fAw8y/77nQO/te3/HK7jXjbWH/6c/ODAJUVs32wMgbGGf/0hp\+0aDVT25/vn7MzbupPXDr8a1cv37FfmV367bZ8wryMIkt8syrvWdxxYtdO3b3Hhqct\+rOxRXWtGRpSkrs2XFzkm2s3vjIH/88\+hng4wClngHOJvjAa3sSK\+fQ7ndWP/z8J2eOnxu5p4o/A5z/V7FzaMXcJT54/9CZz0/2w/B75vo/7\+z2LK35YTapy/oMsPL//sf6mzznPtrUeL92/FR3/4hG44XmZDJXFxPsRADPnOWPr79337O7t76xUJhghePHs/i3g5mqN883u\+idmsLTVu9UgoAQmhY4BBrg/GeauvnwYNVq5Xe/2fS70AJIb9u09YA7wa/oyX2bX/y4F65btmrFtXPoGuzt/MA4B56l9zy64fEnNzz\+5IbQXTcCnDr43sin9SqXr1xWcebDzR8cJ9X1ywtff1pTv/Q6OP/x5pZ9uVf593\+\+7dUdRwCqVtQvr4SK2fO8AIPm3twDMPRY57uffAMwe8HC8hFx8tasf6a2/NzH23Z2X\+5h0O6nmzdpx4F/9IVnld89fdecb49ufnnHZ6VzQU\+8K0s/mjc8bQ9UVP5w9JjJUSYb6kIeL1/pATjS\+d6RzOCpwa/2tRunAKrmL/B6zne\+9OCSH98yPO7OU\+nLdSVdwMZfHS50F4xxbVbA6TJu6SKz51WVA3zTtetgdhym2/3hTnMQrpt30yXsPcvp//u2l7cdAaha8fObrprHOUch5YtXrZh3/uC2bRYsXSlWTaWnmvhWrn9mhQfS21q0v7sAUL5gVe08gKNvvrojOwsUnD/41rOrH2\+85eGWCcdbut3v7bIA5oprH3lyw\+NPbnj80bUrKuHbrp2do54VrFgRWv/A7P5PtB1HSo5OP9f5Vuu2MwB83c/mj7ipRE\+/tzH65pFZdS\+8sOGCHzoYh2fJ2qfX3Pjt0Tc1I/9s5eS2yFMl1C\+F4zvf3n\+uctmqReVXQV0es2cv9foW3ff86sXwbdcrr75/QdO2jT2HkrniT3iAM\+\+3vHUgO5VO/\+fvbHr8nkfuuH3TFZxcZ07t4\+vvnQ2nPmjdfBHz9k3\+6mL8nUjm3fV80zJP\+v0395Wc3i275LjxPJ/7dlP\+WzjfqbVuOwNwQ92qRWPv587s0xZCVxXsAabdOzZuNQZn3/fC03VeD6l9fMMD\+57eqalv3vv2M3PHLP2N0fJU8E2PJzcy0LP8NxsmfnXtVYOeMXaa/TD7vuefj2bf2Dn41cJe48mP9\+84fG7V8Og1j3dF/fJZH\+77pvwnK5d5PcPnZDL/vhea3r3n9a5tT93dyS/wenJzFcy974Wn67wAsOgXj925I/KxsSl4xzv8PAKnj1m9gzBv7W8fqy0vuHsNAJ4fPvD42jc6txz5dqpDiaam/8ArL247Agseffax2nIC9yrPf2BEOls3/alue4mZPMjcZSvne3Z\+vO2XP/lwaa1403W9nZ3GqW9hzp2/qJ1bfO9PEOriHRqkqvahNXONbdab99y9f\+nccvj66JEzgzD7rmeeqPMC8dQurnjL\+OTFu\+dtF1cJlee7jX1WL1y3eNU9y5hpis1lcuG7IOsar4DTZaLStWxtSNz5srH7ubtveWuxF/pPWsfPASx9ZBLv2Z6qL9ufv\+dwOYHCA4J49b6I2zPnppViVfuOU9ctW7ViHuMZM/vO4TfkB/cWTIPkmbNyQ3z1qESWrH167RuPvHloa\+uula8/NH9ObdOGBzqf3dn5wu13v7N0bjlkJwBbsPaJh24qHzwyXobOH9m3/0vwLA9tiuVeVuR\+Cp898uah3fuPhRaMWHbeXc88Ie560Tg/6sCZy3Nu4rFM/So86n616\+UXdp4BmHV826bGnfmPZ9e/8MJdAJB9KnVrQaqexetbNq2ZxLU6Izz2zJ3vP/lx/vbeJLfIw8wXVy3yfHJ4sGpF/U2VnjGNtKlnaepG7dm54\+REWTh\+UvlDVv5Hc3/xuxfEkQtV1DZtWPvx49s6N7/YeVdiZfbORK5O5ZUvf/rl50Y8jDrmHFp\+81O/WbvrqW2HXm\+8bd9iXzlk6\+Psu55pEr3wYcksqQ\+NHu8wrTJtzn0vd73x8o61\+WmQLjAnZNyri9HTdozaibMKv6u4afX6Ndrj285MdL9h/HiWk6eeXbvv8W1HXm\+8Zd/iheUe2n/6SLoXYPGjzxfMJFLqtDXq28kFASE0PWZ6A3jwH9tebv3km/KVz25YNY9A5jD9dN2\+6P5XXt6xUh3bf1HweMls8dFnN71w/6Wbk3Da0VOfvnfoG5iz8ufL81vmqaxdKVZ8/GHnbuNs7eL8oqRy2QNC\+T5z2aoVlQQK75JWrPjtH/\+P0PovL23bbXVlJsdbes\+GF55d\+7PMFYnnh4\+pb1f8Xn2lff8RqxcA5vB3rXliw3Mri0xoxNQ89Mw97//qgwnuwk6r8wc1dbM1WHXPhmcyT0t6fvjA0\+u3farue7V1V\+3Lxa\+rPD98qDXp\+9Mbr7V/\+Enn\+0cAPHPFB0KPPROqL/Fy14lCvfLnRdsGZN7PY2975rzYuu3jo0e\+BoDyG2vXPPW0khllzdREP/jfN7\+59Z0dB7t2tg8CVC6989HHmtavnXjym6vKlHZB1jVdAafLxKVrxROv/2mWuumtHZ9YXacAPHOXPRBa/8JELy2/KMPPQHpuvHPD755/9GdXdw\+Ht7p\+\+ewdZ\+cGaucTKNI9W/jsIgDAnLn9g6tHL8QIjz1/z/u/\+mB/y9b9P1PrvfN/Ef/jvNqX1Rfbu458DTBrwU/uWf/YE2vXLKrIzXxTQn/Xjs7jcN2yVbUL8lFjFv18Jf/mkcN7951Yu3LE0uSme9Y/tt3YnC6Z54rqNc89qzxVM/JG2\+Dg\+cyLeb45feRwwVF3duXZwbuyixQ\+lQoAAKcm\+RY0zw9WPfHYm53qoW8vcIs8C2pXLvYcPr185TIvwNheyqln6SKM2LMvLBgnJxM0gEc\+kgoA0L/s/KA4eql5dc88Xrcrun/n7zc/tkLJHtBHPFcMAOUVXw8OjrwvP/Yc6l3Z8ufkzZtebN128OghgIq5y\+59/KFnmn6xojLfRCyapUt9G7riptUb1v7pkTcPb960\+67ttVPKyYVcXcConfjsyO8qswGf8H1T48UTwPtPLR8kb255sfWNg0cPAQDAnOo1zz\+vPCYUVr3xT1tXZHcgNOOV/Vf/f1/QD04c677lllsmXGzr1q2Bu/\+fqeYKXRR9z/\+aIcGfOVs6ZRiiKwUjf6Vg5Gcs3PWXGQb8MtP3/K8nnnjiSucCoavO3/72t/kLF13QT2Z6DzBCw851/mnHR2Pn7iv/Qe09a67y7qzvCtwFVyl6Yu8bf/r72N45ZlH9o/deyATO6BpDT/5lx86DX7mjP69YWLtmTc0crJPo2ofnHYRmHmwAI5Qzp/b\+9bUTL4YuHdwFVykyv/6p39Zf6Vygy4/4/umhZ/7pSucCoUsIzzsIzTz4FmiEEEIIIYQQQjMCNoARQgghhBBCCM0I2ABGCCGEEEIIITQjYAMYIYQQQgghhNCMcAmnQZpqlhBCCCGEEEIj4DRICI11dU2DhLX0Stm6desMCf7M2dIpwxBdKRj5KwUjP2Phrr/MMOCXGfYtITRdcAg0QgghhBBCCKEZARvACCGEEEIIIYRmBGwAI4QQQgghhBCaEbABjBBCCCGEEEJoRsAGMEIIIYQQQgihGQEbwAghhBCaQaihilwgZtKpp2Dr8YgkcExZWRlheTEUSejOlJNztBDHyyln\+B8zCzVVkQ3ELJr/x5XOEULou\+3yN4DthMSUFcGFdRcAgNrJSIAp44bPAEV\+wQQ1GwBcK6kEBZaUEZaXwgnDzf7CMeJhiWdJWRnDS0oqc1KipiqSwkSIFB9xkKVmLMCU8REj\+6FrabnUBSmimS4AOEmZHZUXEohbFIDaKTUkcqSsjOEDcmzMmdA1FJEQMX9cd824LHKkrIywfFDVcxtLLS0c4JiysjKGD0SSNi1IIB7iC1OYitJBKJGfa5iTkrmCDWV5MagkLfdKZ\+tqQh09Lgd4pqyM4UQ5ptvjF05wjURE4pmyMsKJQTWZL4nUSoRFjikjrCANl31qpxSJZ0hZGcOJ4UQu9K6pRYICS8rKGC4Q0QqK\+Ni6XzpxKFojXD3Cj6idbEgrrFoCKajg2QCEcwEIqalcZkpXQwAAcFJhvoyRNPvCQ16w4mKRB0ePZYJDWCEUyx/Srq7Ig6OrEjsiApc48rTwUB9JmC5cHNdQhLIyZtQp4MI4yRDHBhN2dnO05EXnCl0rqJ2MSJKik5CqmT19fbaeUAIkGRalyMU2XVkpqmlRkZ2ejIJrJjXjO3A6Rwih6XX5G8CsFEt1dHR0dOxpa66p8Na3tHd0dHR0dGiKwICjq0EpahG2ouAXnJxyh/J6OpprqqWQyIKTUkIRQ1R1u88xEkEnGgprNgWwk5GQYnBK0urp1mTQZDlhUQDqOpRt2J7Op0RTYZ7k10KtRFTdfx5I9iMnGQmGk0ROmGkzITOpcEhJOcAGE85wXvoOtNT5AyGRI64RDYWTrJK0\+/osTYZ4dqU5rhFX4p8OQm59TkoJKaagGj09ViLoxrKLu0ZUDuuskkr3pFNhJhmWM3eoqZWQJVlzGYYM53gqSgWhRH6udcRb35YeGBoaGuixUjGZ1WUxcNEXKN8Z1IyHQlFbiKbS6ZQqWmpQjlu0ZGGgVkIOKganJLvTRixAY3IoariQqSqKIah6j23EJDehqLoDQK24LCdATlo9PXqU1yOhqO4CuHpUDqeIrJk96aTCpiLZRIrX/VKJl6oRlLrgX7enL1\+\+HS3EQvZ6NRizGbaiYPFMACwxmkqndTXgxEKhmDlONcxlSVeVxBdwEVWxVOSprYVl1QnEzZ4eMx6w1FAk6VxlkQfXjAelSArYisIIXNLIO6lwUE4SWTPTphZh9UgwnLyoWuyaWsqtruMsLTU9xzlHj6lx0/0OHDPRxJyUIsdoOKlrqiyJHMswLC8Gw2pSjwuGErmIG2MAAAwvChwzLRkFcIx4NH4RHdMIIfRd9V/9/31B//31r38dmoQ//OEPEy0ykG6r9/qb9vQUftTR3pHuS29v8PlGfDHc5OxorvE3tHUPDA0NdLXU\+GpaugYyP\+3eUu/1r\+voG\+rZ0\+T35dt4A91b6n01Gw/0DfXtWef3F091aGgg3dbo9zc01fmqNx4YGBoaGujevnFdS0d26YGulhpvfl2533S11vnrWrsGMtviq27u6Mt809Pe6PM1bu8pWLLeX93YWOOra\+0eGBoaSm9v8Pka27ML9B1orvbWtXYN9OxZ5/fWb\+keyKfvzSTa19Xe3tXTd2BjtTebwnjGCX6JIJTIzwTrufLGLWY9e5r8uQZw/qN1/orh/TQTjBOino7Wdc1tueKUKbTtPSULQ19XW/O6LQf6sp93NFdnymq6rcE3NqZ9BzZWF1SZdFuD19/UProM92xv9GeaTSXqfvHES9aI9PYGX/XGA2MWH\+je096R7uveUuetbj4wkE9ke\+uWjlwB6dnT5Pc2tKWHSlbD7IZvrPHVNTZU\+wpvJBVx4ZEf6G6tyxzEsp83\+bwNbemBqyryQz0H2vd09/V0rPMXRuBSRn4gvWdL6/auvlyKrXXe6uaxq8qb8OzT097k9zdu39OaPTfkA1fjq2tuWVfnqwCo8Ndv3JMeGBoa6N5S56tZ19Jc768A8Pjq1m3PZLCnvdHnbWhLD6Xb6rP3Djx1rd0DQ30HtjTV\+CoAPN7qhpY9mVtwXS11vvqNrc0NddXeCm91Y2tHR9u6\+hq/1\+tvyJ9o0EUaf9cPpNub63wegAp/fXNLU7Uve5YbSLdvbKj2egAqfHVNbV19mf3lrS4sHM3V3rqWroGhgXRbY3Vdy4G\+oYH0npbGGl8FeHx167a0NlbXtXSl96yraciW4IHu9uZ6fybZmnxBSLfV\+2uat7Q01tVU\+33\+uuZMcerZ3ujzN\+3pGf5HqSWHhgZ6Olobq70eAI\+vprG1oye7uu3NDTW\+Co/H669ramnvHuhpb/JmL/SqNx7oG\+rrassUbqjI/G5oKHshVdfc3OCv8DW0pUskfuEB7\+torvY3tLY2N9TVVPt81bn19exp8g9fHeX/GuhqqfHWtXYP5P8x4c6ekSZxaY3QTPTXv/71QtuzV9czwIQLBAMcU7JnhVoJNQlBJciTzMKco6dMFwCobeg2I0ocAQAouN1JGI4F27RcoK5LM2P6SBlhhZA6fFuU2klFNcWoIrG5dRM\+pMaVQHYckmtbLmFH3JWldlKNOaISEggAYcUgT42k4WTykrSIEBCYfK6jMUdSw4Hc713bsCkX4LN/M1yAJ7ZhOY5luawgZDYCCCcIrGNZDgVGCAYF9iJ7fwGgRBBK5Me96NVdbdhAWObtFI5VBAAANhCJx\+TsKAjq2A5lOZaULAyMIMfiYTHzOXVt22U4jiGubdjAQlLODFAV5cz4VNeyXCZfloEVRM61LJvCiL4IwrHENS2Hlqj7JRKHEjWCUpdS14hlFudEOZ4dQ0x4KRjgRtcfRghFwtmPqZVKGFSQBJaWrIYA4BrxqEbCUZm/mNpYPPLgWqZDhOHQCwEeLMOmV1XkgRWDEj968UsaeeCkcCSUOZ5Sx0hoFhuQpt5HRm09oUNADgSkIO\+ktNyGEcJQZ7\+WYpSU1dOtyTQRVlJ2Jhqfakka1qyedCrCpCKRkeNjOFlLNlf76tvSrh7h7HgoqNqBmJ5OG4kQxGU5nhk/QB09aYqxlGnpCpvaEIyYwYRhWUnZiSuJi3gWFU0OtbVIOEGDWnePmQi5mnY4M4rA1ZVgOMWENbMnnYrylhKKJB3CSxLv6LlnZlwraTh8UOIJtZKaLURkgRgxOaIL0ZTVZ6cURosmKS9yLB/gXNN2M6MZ5CQJa1ZPj64KtipHtGyxcT7VNIgkDdMyVC6pKKW7jIst6RqxYChG5YTZkxk\+IYc1m4KdjCopJqxZjmNoYaJFFI1K8VRrnbempWvAVEWaUkIRg4um0j3plMKZUVnJjaNwTd0WY4aRCDHFE59ixL9IxU1RTRmmlQzZamT4kQ6EELrSrq4G8AQcI5awhLCcbVkyYlgNQ\+zW75WVlV2/KGxLsajEEWB4SQQ9Fs8MBkyqauqk67quS6nrOi4ElHhyuxpkjWgwlL0wcVJR1RSUqMSVWG9KVXU2rEgF13GuqcUMTo5km8iEl9UIl7z7\+2VlZdffsNoQFDV7fUstTYnZkppvTEPmapEUDN4kDEuo6/aft11ghi/sCMMScKdzWB0tHoQS\+aHfvWsywnIcQx0cETZK5iZNQAmLzGQKA7WTUdUUIpEAC9RxnJN6ygnEdDudinJ6OBRJOtR1XUoYJv8TwjLgOpRwksiY8VjKpkBtPR5NHj5L7ZJlvHji42yH61LXZSQ1obVFA0SPBOXERJdvjhZky8quX6Q4wXgiLBBKS1ZDaiaUOA1Fw0LBll2cgsgDzcQsH3nCMISOPADM1MgDADUUoazs\+u//NMlFE1Fpys9IUjuVMBkpJLKEl2TBTSWGH5EkxCcpEYlnWV6SwwEwNDPznTcQVoICy3IBOSIxZtIotW3U1jWTDapKUOA4QYqoEd7WtMyJhnCSLHEEGE7g2Qo\+JAdYAIYXeJJpMqFLyjGSJpEiSpBnOVGORiQvAQBwDS3lipGoHMh8Hg2CrukO4aUg7\+iZp/NdK6ln27\+Oqbt8UGRcPa6BHA1LPMuwvBgUeU4IcAwhDAFKAVwzkbSFSDQc4FhWCEWjEjE0w6YEAIg3EJZFBgAYXuTBthy3SH5LLEmtZNLmI2pY4llODClqiDW1lO1mTmsMxzIMJ4Tipp2UR9x4coxEyg1EorLIZbZfpHr\+6WBGCMsSzzJQPPGpni8rBDmS7a4QBda1voM31RFC16prqQHsGAmdBsJSruPE1sJyzA21HUj3pA9sjzDJzK12wgXVRJTTZa6s7HpRdYWAnyFACCenXGppkaAkhSJxLRHmTC1lUXBS0ajORqKhol0KrpmQJTnFqfGIyBR\+rGmOIIdyDxE7qYgctQJbOrp70l3tLYKhhBTdzV6vWoKiTP16bTqVDMKMMaofDAFQJ6UEJdUNx\+NBbhLLO0ZMliJmINuHSQGgQgxHwwGe5QKyqkoF11VjsVI0oYpWhL\+\+7HohYvKBai\+QUgtfaOJEUAzXNeNhSQrKSkKLhYgx4eUbK6la\+5aWJt6JhaRI5lV8xTNjJZSYG4xGAqUHqVwQjPwkI59dRTi\+Z3trcyOjR6Spv6OAWknNZKVMhzIXkEXQE7qdXwnLs0zunyxDHcelAEAYLnd6IAzHgFPySp46lnP28L/d\+r3Mq8CuX7Rh/0nbdlwAIITNdrQTQghhcjcpCAH6HbzZeLWhruNShss1ChmOYwkAUMe2nZP/\+asbrs/sse/f/YcvHNt2KOEDQc5J6RYFaum6w4ckjgB1HJfwHKFWygRezI3WcG2bsqLAAqWOCwxDwLUdynA8m1\+dwIJjZe7mEIbNfk4IIQCl936RJV3Hts/u37Aom9/v3fq7T0/apgNcMBJiUyFBkMJqImlYo\+5tZQaa8LkME5bnGOpk74Dli32JxKdYOglhcrUJIHPEwnKOELpKXEMNYMdIGkSS829HdIykAVJUydzQDCnREGsldYsCEC4Q0QybDg0NuYYaAEpYdvQlK8MJLHEt56SuRlNsJNdfO2qVuhqUFCsQTyVCI753zaROxVC\+S9g1k3r\+JrIQjETDmdFTTioaNQVFHXV5SwgzolONug4lDFtewTHgDnfKUNehwEzTxXYxuSAMFs/PNAy5vtq4tmG7wxdBiFqJcCCUJBEtqWSG6JconJnCQO1kJBiMubKWimVLP2GYTLcHZP5iOQZch16f6b0cXpHjAsMyBIAVwwk9UzvNeJChwJR\+6qF44pMdFJG56Czdy5lbjA8Ew0oilYwJTjJhuKRoNSz7QlNUR1Kn617W2MgDYRhCnYIVuy5lsgeAGRz5fI84J0qhSExLJWTGSEzxvp1rJrT9Zz/9XbaF\+v3Vf/ziZCqhT7mPq5iKmpEvUHC04FVx/xOVQEa9coQaikCA8IEgZyd127H0lMNnR/JTBwgBQikFkjtDUiuV0CnHMwRcU3dZkWcoHXVTYzoLGBn1boshKx5gCBeM6Y5jxMOCk4xKgjD6RXGTvMlSNPGpZnSKv0MIoUvu2mkAu1bKhOHn42D08ZwAEJK5zWjrWjLXV\+EYmkF5SWSopSlhNf8GYNc2HUrY/\+tUSv/05N4Ny64vKysr\+/4v//jF4d/dej0f0V2gViIsxxlV12PBUQ0mahmGy0nDXcI027OYX4wAAIGzZlL/4os/Zm4uX7/oyb0n929YxIiqzYk8sfXcs2eupVuUE3mWE3jGMXP3W6ltGA4rCOz0nUWKB4Hx8kXzw5RI5ZpFzURUc4YH0c94rq6EFEtK6snh8Q1M6cLgmjE5nOLjelIJ5Eslw4kc2EZ\+ei/HdoFlGR/Ps65pZj\+mjqnbDC\+whDpGUsu1N1wzqbucJJa8IVEi8VKLu0Y8Ei6YO8g2nXEaea4Zk/iAmn/6MtvFQopXw7LupH7y8B/u/n5ZWVnZ9bc\+9\+kX//nLGxhpwnG\+JdZdJPLA8CJLLT0/a5GlW4QLcMwMjzzrJsOCIA9fzo/faTYux0ik7Op1bXs6ctpbGoiZyE4sRV0nPxjZdWw3d\+uU5h8CB\+rYLrAlD46E5VlwjOERza4z6dsG6FIiDMuQ4Xs4rm07FLJPxbjWcC8ndezsv7N9wMmUNtz\+JSxHXNulDCdyrh5Pmralx8LhuE0IAUePR6IWLwfYbLK2Nbw60wGWn4aTOcNyDLXN/HGHuo7j5v6XMpwYDMeSqUQIRo7YIAzHEsfKFUzqWJn3mpBJJT6NMpU9e0OAUqweCKEr45ppAFPHtFyGLximzIpBgaZimdl/qaXFkjYnBVgC1EmpckhWdctMKiE5CQE5wBHCEFdXI5FYynJsI6FEEo4oh2p/pprDtzp7tjf6qzceGLBiAWJpimoFYvFiXcOOZTgMX3DuYIWgyBjxWMqhANROxeIWG5B4v5Sw84kPdG\+p99W1druGInABWSKpqJIwHcdKqVHNDYSDHGEEOcgZqpIwbMfW40rcnubGWvEgCAxbPD/Tt\+IrjTqWnlCCQcUSo7Givf0zkKurSpJR4tGCx9MBoFRhoGYiEqeh\+Kj7QYQPhiVIRqOa6dhGXInqRAqJLBFkWbBj0ZhuO46hKarJBcMiC\+AYsUhIjiZNK6XK8r/ZghwsvT9KJF5ycZbYqWg4Etdtx9bjESUJAVkqVZAZjueJEVOiSdN2LD2hqAYRgwJbvBreFEoOz8Y2cKClxt\+wPe2m5KlUkxKRJ5wUDtCkEk1ajmNq0WiKSOEAN9MjzzC8wDpaVInrlmObSTWqOVyRN2tNgmMkUq4YjoSkQE4wHAmxppbKtsZPptSoZjqOqamqDmJQyGzyeT0WTRi2Y6VUVXOF4Kg7B4QQoK5luy5lAyGRpqLRhOFQ6hhqKBBU8d0/VwNWDAo0GVWTlmMbCTX3mjZGDEmcFVNiKcul1NLCkpSbI5vwgSBrJWKazeeGexFWFIiZMikfjCqCpYhCULUCqhYLQuJuMZwSVC0msQDACMEAY8aicd12bCOhqCkQQ4FpaAATPhjinUQ0mjRdSu2UIgXkhEldIyqJwexs3Y6pW5kX6xEC4NqO47qMGBKJrkYzlSsRjZlMQB5do0skftGZLlwFK3DU0i0HABwjHjfOTmfqCCE0WVfTNEgDXa01npHZ8zVlp2Pp62j2\+/ITZOQarB1b1uWnGWhsac9923egtd4HAODx1jRtyU2fMTTQ3d6SnezAX7euLf/5mAZwJnMVo0JVkZv0o\+ikSH1dbc0N2ckDqhuat49JPdcAHsgv3\+jPbK2voTU/28JAevu6msyavXUb92SmIOjZ0\+QbmRdPzTizFI0b/FJBKJGfq9tE0yCNjFpFddOWa2TDps\+401T4Rx8OsvN\+FCsMA10tNaMX92Unfu3ramuqyZap/FwdQwM9ezbWZabhqKhZtz03rG6gq63Rn6md1fkJYMap\+8USL10j\+rq2N9dXez3g8frrm7d395XYVH9zR9/Q0EB6T0t\+xpr6dW0HcvOeFauGBXIN4GmP/FDfgdaGzKZ5/I2Z6nlVRX5o7JGxor4tfakj39fVlkk8c6jfM\+4kKaUiP5Bua/D5GkfvtoEDLTXe6uaOnq6WGm/Nuo1N1RUA4CmYBqne52/auK7OC8WnQRoaGurraqmrAPDUtHQNDPUd2JKdSslX07Axc1oa6Gqpy88tN3BgY7W3fktmv/RlJpTCiZCmwwTTIHVnp0ECb11za3Odr64lOw3Snsw0SB6vv66p9cCIa5I6D1QUDgoe6Gqt99cXPUUO9I2cKLG7vbneX5GZXSl/rk231fv8\+fnF8rONjZ0GqdSS2WmQajLzOdU1ZudXylyC1PgylcfXkJl1aKC7rcGbq3X5aZA8Xn99c/Z6afTlTPHELzzgfR2ZN6MPjPmrr6ttXV21v7raX12/bmNjZkI5nAZpcnAaJISKmsI0SGX/1f/fo6\+txnXiWPctt9wy4WJbt2594oknLihlNF1mTvBnzpZOGYboSsHIXylTjDw11YCUCumpyIiOcWrFg1Jc0HS18DWI6Kp0WSodNeNySHWkqKqERJYAUNfStZiqam4wpcdmVDHBo9xlhgFHqKi//e1v8xcuuqCfXDNDoBFCCCGErigihDUjFeGMqMQzZWWEFYKKZvPhhDHDWr8IIXTt\+h9XOgMIIYQQQtcMhg9G4sHIlc4GQgihqcEGMEIIoRmPCIrhKGM/5sMpO3wF8oMQQgihSwOHQCOEEEIIIYQQmhGwAYwQQgghhBBCaEbABjBCCCGEEEIIoRnhEk6DNNUsIYQQQgghhEbAaZAQGmsK0yBdwpdgYS29UmbOTHEzZ0unDEN0pWDkrxSM/IyFu/4yw4BfZti3hNB0wSHQCCGEEEIIIYRmBGwAI4QQQgghhBCaEbABjBBCCCGEEEJoRsAGMEIIIYQQQgihGQEbwAghhBBCCCGEZgRsACOEEEIXxtFCHC\+nnCudDzQl1FBFLhAz6dRTsPV4RBI4pqysjLC8GIokdGfKyeWLE5arGYJacYkTFMO90hlBaIa6/A1gOyExZUVwYd0FAKB2MhJgyrjhM0CRXzBBzQYA10oqQYElZYTlpXAifyRxjHhY4llSVsbwkpLKnJSoqYqkMBEixa3C0xU1YwGmjI8Y2Q9dS8ulLkgRzXQBwEnK7Ki8kEDcogDUTqkhkSNlZQwfkGNjzoSuoYiEiLHcKl0zLoscKSsjLB9U9YLTnaOrElvGSJpd8OsSWzol1NLCAinY0vHzc61yUjJXspghAADq6HE5wDNlZQwnyjHdnqBwukYiIvFMWRnhxKCazFcfaiXCIseUEVaQhss\+tVOKxDOkrIzhxHDCcnOJa5GgwJKyMoYLRDR7uBCOrfulEwcA14iH\+MI6BeDqEX7E/mZDmpNPZ2yxp44eD\+cCEFJTucxQSwsHOKasrIzhA5GkPaoyO6kwP6qGXqBSkQdHj2WCQ1ghFMtX9Ksr8kWOUZc48rTwABhJmC5MDTVjgYKzAMuLUpGDNULjo3YyIkmKTkKqZvb09dl6QgmQZFiUIhfbdGWlqKZFRXZ6MgqumdSMK3I6txPBkRduDCeGCo5dlx11dC1Z4tCROcBwDMkceUKqNuVjDELo2nD5G8CsFEt1dHR0dOxpa66p8Na3tHd0dHR0dGiKwICjq0EpahG2ouAXnJxyh/J6OpprqqWQyIKTUkIRQ1R1u88xEkEnGgprNgWwk5GQYnBK0urp1mTQZDlhUQDqOpRt2J7Op0RTYZ7k10KtRFTdfx5I9iMnGQmGk0ROmGkzITOpcEhJOcAGE85wXvoOtNT5AyGRI64RDYWTrJK0\+/osTYZ4dqU5rhFX4p8OQm59TkoJKaagGj09ViLoxnKLu2Y8KEVSwFaQ4ayV3NIpoHYyIgVjNsNWFKygZH6udRU1zdv3dBTQFIG50pm6WlAzHgpFbSGaSqdTqmipQTlu0ZKFgVoJOagYnJLsThuxAI3JoajhQqaqKIag6j22EZPchKLqDgC14rKcADlp9fToUV6PhKK6C\+DqUTmcIrJm9qSTCpuKZBMpXvdLJQ7USsiSrLkMU1hRgFIX/Ov29OWrqKOFWChV7DMBsMRoKp3W1YATC4ViJgVwjagc1lklle5Jp8JMMiyP6ChydFVJfAEjVjw9kae2FpZVJxA3e3rMeMBSQ5Gkc5VFvsQx6pJG3kmFg3KSyJqZNrUIq0eC4eTUr\+kZf3NH39DQ0FBft6YIbnKDrGB/G7oATkqRYzSc1DVVlkSOZRiWF4NhNanHBUOJXMSNMQAAhhcFjpmWjAI4Rjwav2J3eIivsb0nd7WUTkYDbkwOKlfqHrSjx9S46Y6NhWuokrj6dyYrRePt7e3xiMSklEDgou9lIISuav/V/98X9N9f//rXoUn4wx/\+MNEiA\+m2eq\+/aU9P4Ucd7R3pvvT2Bp9vxBfDTc6O5hp/Q1v3wNDQQFdLja\+mpWsg89PuLfVe/7qOvqGePU1\+X76hO9C9pd5Xs/FA31DfnnV\+f/FUh4YG0m2Nfn9DU52veuOBgaGhoYHu7RvXtXRklx7oaqnx5teV\+01Xa52/rrVrILMtvursZdXQUE97o8/XuL2nYMl6f3VjY42vrrV7YGhoKL29wTd8aug70FztzSTUc6B9T3dfT8e6gk0ouaWljBf8ge497R3pvu4tdd7q5gO57SmZn6vcuMWsZ0\+T31vflr76N\+NSGidEPR2t65rburPxyRTa9p6ShaGvq6153ZYDfdnPO5qrvfVbugeG0m0NBWU/p\+/AxuqCKpNua/D6m9p7\+g5srPZma8HQ0FDP9kZ/ptlUou4XT3xoqK\+rvb1rdGqZgly98cCYxYsX\+76u7a1bOnIFpGdPk9/b0JYe6tmzzp/ZtKGhTDX3FmShr2Njja\+usaHaV3g3rYgLj/xAd2tdQdXuaW/yeRva0gNXVeSLH6MuaeQH0nu2tG7v6sul2FrnrW4eu6q8cSI/0NVa5/UXbFbfnnV\+b11ulX1dbevqfBUAUOGraWzNH/\+725vr/V4PQIWvpqFlT3ogE0Ff7oTSs2ddta9mY0fPmBWiy2r8C4\+BdHtznc8DUOGvb25pqvZlz3ID6faNDdWZ/VvX1NbVNzQ00NVS5y0o0JnjYEvXwNBAuq2xuq7lQN/QQHpPS2ONrwI8vrp1W1obq\+tautJ71tU0ZItT0WIzkG6r99c0b2lprKup9vv8dc3bu0cUp/w/Si05NDTQ09HaWO31AHgyxTS7uu3NDTW\+Co/H669ramnvHuhpb/JmL/SqNx7oK168B7paanx1zc0N/gpfQ1u6ROJTCHi6rcFb0ADOrasiV/1KrKivu21djdcDHm91w8bWpmpfQ1t6oO/Axmpf/shQ\+FeRfTeUqcj11T4PeLzV9etaO9ID6bb67A0\+T\+EZYyhzTKjwjKq9fV1t69ZlIpSLK0CFv25ddg19Hc3V/obW1uaGuppqn696\+GDR17Wlqc5XAR5vdW6fDw31dW9vrvNXQKboZfbjQPeW\+qLHzHFN4tIaoZnor3/964W2Z6\+uZ4AJFwgGOKZkzwq1EmoSgkqQJ5mFOUdPmS4AUNvQbUaUOAIAUHCLjzAcC7ZpuUBdl2bG9JEywgohdfi2KLWTimqKUUVic\+smfEiNK4HsOCTXtlzCjrgrS\+2kGnNEJSQQAMKKQZ4aScPJ5CVpESGQ62qkViIacyQ1HMj93rUNm3IBPvs3wwV4YhuWC8CKQYkfHYBxtvSCEV4KBkb/tnR\+0HcYG4jEY3J2FAR1bIeyHEtKFgZGkGPxsJj5nLq27TIcxxDXNmxgISlnBqiKcmZ8qmtZLiMIuaLGCiLnWpZNYcT9d8KxxDUth5ao\+yUSB2CEYFBgR3fCUupS6hqxzOKcKMezY4iLFntghFAknP2YWqmEQQVJYKljWS6bzzrhBIF1LCtztHCNeFQj4ajMX0QHcInIg2uZDhGGQy8EeLAMm15VkS9\+jLqkkQdOCkdCmeMpdYyEZrEBaVr6yKitJw0qBEWOQG6kDRdNpXvSKYUzo7KSdDLd0nKShDWrp0dXBVuVI1rh\+BhqxsMRnY8mornzBboaUVuLhBM0qHX3mImQq2mHMx18rq4EwykmrJk96VSUt5RQJOkQXpJ4R09mz4KulTQcPijxhFpJzRYiskCMmBzRhWjK6rNTCqNFk5QXOZYPcK5pu\+MWG\+dTTYNI0jAtQ\+WSilK6y7jYkq4RC4ZiVE6YPZnhE3JYsynYyaiSYsKa5TiGFiZaRNGoFE\+11nlrWroGTFWkxYs3AIBr6rYYM4xEiCme\+HTtAupSIISQkltBzUQ4kmQiqbRtxAJ2XDvsAkDJY23RfQfU0iJRk48m7T7HiAXdeDiaIrKWbK721belXT1SMPQPqG2kTBIIh0eMOmcEOR6PBFigZkyOpJhI0upJJ8OsHpGj2R5s\+kUqbopqyjCtZMhWIzHDzRxDohav6mlTkyEuh2KGC04yLEUMPppK93QnI6weCV2xXnCEUN7V1QCegGPEEpYQlrMtS0YMq2GI3fq9srKy6xeFbSkWlTgCDC\+JoMfimcGASVVNnXRd13UpdV3HhYAST25Xg6wRDYbimYGNTiqqmoISlbgS602pqs6GlcJGp2tqMYOTI9lLHsLLaoRL3v39srKy629YbQiKmr2\+pZamxGxJVQoujih1KSkYvEkYllDXpaXOMyW2dNpcaH7Qd03mJk1ACYvMZAoDtZNR1RQikQAL1HGck3rKCcR0O52Kcno4FEk61HVdShgm/xPCMuA6lHCSyJjxWMqmQG09Hk0ePkvtIqPSsisqmvg42\+G61HUZSU1obdEA0SNBOTHR5ZujBdmysusXKU4wnggLhFLbBWa4fUUYloDrUgCgZkKJ01A0LBRs2cUpiDzQTMzykScMQ6jrYuQzazAUoazs\+u//NMlFE1Fp6m1N94t/\+\+n3Mk8lXn/D6hSnqLJAAMAxEik3EInKIsdyohyNiFTXDMc1E0lbiETDAY5lhVA0KhFDM/IPJzspJay6ciIu89N4SEbTzzGSJpEiSpDP7F7JSwAAXENLuWIkKgcyn0eDoGu6Q3gpyDt65ul810rq2favY\+ouHxQZV49rIEfDEs8yLC8GRZ4TAhxDCEOAUoBSxYYAAPEGwrLIAADDizzYluMWyW\+JJamVTNp8RA1LPMuJIUUNsaaWsl3qOBSA4ViG4YRQ3LST8oiLhBLFO/MlI4RliWcZKJ749FwJuKamJmwuIPEESm2FrSctNqiEAxzLBcJKWKgYr1aV2HfUtV0XSCYWgbBmWYlg6eOFazvACmPu6WURIZI09FhIYFkuIEeCvGOa2a6TCkGOZDtjRIF1LcsFx0ikaCCihASOD0TiWiwiMsTWEwaRotGQyLF8IBxVRDel4buvELrSrqUGsGMkdBoIS7mOE1sLyzE31HYg3ZM\+sD3CJGU5blIgXFBNRDld5srKrhdVVwj4GQKEcHLKpZYWCUpSKBLXEmHO1FIWBScVjepsJBoq2qXgmglZklOcGo\+ITOHHmuYIcih3zeOkInLUCmzp6O5Jd7W3CIaSucdH7WRUtQRFuYjrtZJbiiZCz\+791Q3Xj31jGSpAnZQSlFQ3HI8HuUks7xgxWYqYgWwfJgWACjEcDQd4lgvIqioVXFeNxUrRhCpaEf76suuFiMkHqr2l7\+9faOJEUAzXNeNhSQrKSkKLhYgx4eUbK6la\+5aWJt6JhaTIOHfmqZVQYm4wGgmUHqRyQTDyk4x8dhXh\+J7trc2NjB6RLuYdBYyvobW9o6OjY8/2LRubOFMJhhMWzfbE87n\+d8LyHEMd2z1rO5Th\+NzgIIYTWHCsTLPctRJhOQHhWLjw7ICuRtR1XMpwXH4/ciwBAOrYtnPyP/Pnie/f/YcvHNt2KOEDQc5J6RYFaum6w4ckjgB1HJfwHKFWygRezJUW17YpKwosUOq4wDAE3HGKDWHY7OeZ3tDSt5qLLOk6tn12/4ZF2fx\+79bffXrSNh3ggpEQmwoJghRWE0nDGnVvq1Txptm/WAYASiU\+1bpGT/5x9ffzZ9/vLYtYYjQeDTAlV3TetV1gc1EjLJ8PYNHkS\+w7IshKEOISLwYjMS1l2O54mSQwThczAHVMLRLkmVw23dxYGkKYTNCyiVAA17EdynC5S0lWDIUCPLi243zx1t25QNzwy/886dg2vnkPoSvsGmoAO0bSIJKcH6fiGEkDpKiSuaEZUqIh1krqFgUgXCCiGTYdGhpyDTUAlLDs6EtWhhNY4lrOSV2NptiIWvT2vaOrQUmxAvFUIjTie9dM6lQM5bthXTOp529ECsFINJwZPeWkolFTUNRRl7eEMCM61ajrUMKMGdBZuOXFt3SaXGB\+riGjX4Klx4LT2XV\+7aNWIhwIJUlESyqZIfrjFgZqJyPBYMyVtVQsW/oJw2S6PSDzF8sx4Dr0\+kzv5fCKHBcYliEArBhO6JnaacaDDAWm9FMPxRMv2W05Suais3QvZ24xPhAMK4lUMiY4yYThEo4Bd/hX1HUoMEzZF5qiOpJ6UfeyCoyNPBCGIdQpWLHrUibbIzyDI5/vEedEKRSJaamEzBiJ1NQPgIQTAoFAICCFwmoilYxyuhoz3BLtkEFKR35e8Ac9\+6lJRN5JqNPVSYauBDLqlSPUUAQChA8EOTup246lpxw\+O5KfOkAIEEopkNwZklqphE45niHgmrrLijxDxyk2F5/f0e\+2sOIBhnDBmO44RjwsOMmoJAijXxQ3yRFdRROfckbrsm853bOl0V/hl2MFHQnFVlSRaY9fyCqK7TvChxKG6\+hqiLMSkQAfGOf2GmF4ltjm6BsGWdRKhGXVFqKpdN/AUF/XxprhQ\+YFZJMZ9ToFd8QbWBFCV8K10wB2rZQJw8/HwejjOQEgJHMjzta1ZK6vwjE0g/KSyFBLU8Jq/rV\+rm06lLD/16mU/unJvRuWXV9WVlb2/V/\+8YvDv7v1ej6iu5kjX5xR9bGNJmoZhstJwzf9KWTuCo44NBI4ayb1L774Y\+YG5fWLntx7cv\+GRYyo2pzIE1vPPVTnWrpFObFg00YptaXTheEvLD/XDEIYQQwUEIXxbijPOK6uhBRLSurJ4cuScQqDa8bkcIqP60klkI8jw4kc2EZ\+ei/HdoFlGR/Ps65pZj\+mjqnbDC\+whDpGUsvN\+uOaSd3lJLHkTYkSiZda3DXikXDB3EG26YzTyHPNmMQH1PxYimwXC\+EEnhke50Ztw3BYQSjrTuonD/8hcx//\+luf\+/SL//zlDYw04TjfEusuEnlgeJGllp6ftcjSLcIFOGaGR551k2FBkIcv58fvNLtQhEB28DnHEsfK9RZRx7JcwnJeH8cxrp2/PnZt08n1URF/Y0zTElHeUEY\+FoyuPoRhGTJ8D8fN9sERluMY1xru5aROrnMu2wecTGnD7V/CcsS1XcpwIufq8aRpW3osHI7bhBBw9HgkavFygM0mW7zYXByG5Rhqm/njDnUdx839L2U4MRiOJVOJEIwcsVGieI\+qoqUSnyrC8pkTsBSOxWSiRaLZalxiRYTlGHBzUaP5dy/kR5ZnP3dcSsfZd5nUGD4QisSTqbjkpkpNfwQArBgUqB6LjRjf4hqxYCCUsBzLsIkUUUIixxDqmKY13pGHsCOC7BpaLGG4uciPyP4kA4gQumSumQYwdUzLZfiCYcqsGBRoKpaZE5daWixpc1KAJUCdlCqHZFW3zKQSkpMQkAMcIQxxdTUSiaUsxzYSSiThiHKo9meqOXxbrmd7o79644EBKxYglqaoViBW9MkuxzIchi84d7BCUGSMeCzlUABqp2Jxiw1IvF9K2PnEB7q31PvqWrtdQxG4gCyRVFRJmI5jpdSo5gbCpbsmS27ptGEvKD/ou8HVVSXJKPFR7\+4pVRiomYjEaSg\+6n4Q4YNhCZLRqGY6thFXojqRQiJLBFkW7Fg0ptuOY2iKanLBsMgCOEYsEpKjSdNKqbL8b7YgB0vfCy\+ReMnFWWKnouFIXLcdW49HlCQE5JKPyzMczxMjpkSTpu1YekJRDSIGBZYR5CBnqErCsB1bjytxWwjLwk2h5PBsbAMHWmr8DdvTbkqeSjUpEXnCSeEATSrRpOU4phaNpogUDnAzPfIMwwuso0WVuG45tplUo5rDFXmz1oWjjpmKK6pBAiGRBVYMiURXo5m1J6IxkwnIIssIwQBjxqJx3XZsI6GoKRBDgfzAVCB8KBYVzajy3Zg57ruLFYMCTUbVpOXYRkLNvaaNEUMSZ8WUWMpyKbW0sCTl5sgmfCDIWomYZvO54V6EFQVipkzKB6OKYCmiEFStgKrFgpC4WwynBFWLSSwAjFtsLgbhgyHeSUSjSdOl1E4pUkBOmNQ1opIYzM5p7Zi6lXmxHiEAru04rssUL96TSvyiMw0ArKSoMtEUJWmXXhHhAhJva9HscUTN1SnCchzYhulQANfQ4qmTFKDkvnNSkYAoxzNvDXWMbCwIIUBdy3ZHvlYBCB\+KKqL1bz8VAmE1kUzpejIRCQYVgwQEjmEYcC3DcgEcIxFLugyM8\+YEYEVZYnRV1Uzb1uORcESzKOECskh0VUnoNqWuGZcDkqI7pZJACF0uV9M0SANdrTWekdnzNWXfot/X0ewffg1\+rsHasWVdfpqBxpb23Ld9B1rrfQAAHm9N05bc9BlDA93tLdkX5g\+/zn5EetkGcCZzFaNCVZGb9KPopEh9XW3NDdl3\+lc3NG8fk3quATyQX77Rn9laX0Nr9lX4Y9daUd\+WHmdLixon\+H0dzf5Rm5WdlKBofq52OA3ShEqHqEhZgOykDMUKw0BXS83oxX3ZiV/7utqaarIVKz9Xx9BAz56NdZlpOCpq1m3P7YiBrrZGf6Z2VjfkZhobp\+4XS7xnT5Nv5NKemsyMJn1d25vrq70e8Hj99c3bu/tKbGqm2A\+k97Q01fgqIDNdRtuB3Lw36e3rajJV0Vu3cc\+YmUByDeBpj/xQ34HWhsymefyNmWPUVRX50seoSxr5vq62TOKZA\+CeqR4AB7pa6wq3tsJX07hx\+GCdnyfG4/XXN\+cPs5n5bCoyU63kzhyF0yANdLc1\+Lz118LUcd9tE0yD1J2dBgm8dc2tzXW\+upbsNEh7MlPpeLz\+uqbWAyOuSeo8UFF4Ghnoaq331xc9RQ70jZwosVixGUq31fuGJ\+LKzzY2dhqkUktmJxCqycznVNeYm2unr6stO10PAPgacnP4tDV4c7WuaPEefTlTPPEpBLzINEg9Hc3VFb6mzBGpxIoyRx0AAF99c0uj39fQls4Fs9pfXe2vrmtqbspPKVl83/Uc2JKZBilzIM1cBPZ1tdRVAHhGX7tl17quLntOycwild1dA91tjdkDcvW69u7u7euqKypqWj7cm3mldDbPHcN/9XW1NdVlJk1q2Jg7hPR1b88UBY\+3ur45e1zHaZAQmj5TmAap7L/6/3v0tdW4ThzrvuWWWyZcbOvWrU888cQFpYymy8wJ/szZ0inDEF0pGPkrBSM/Y12WXU/NuBxSHSmqKiGRJQDUtXQtpqqaG0zpsRn1PrRLG3BXDwdkJ6InZe5SreJagwc3hIr629/\+Nn/hogv6yTUzBBohhBBC6IoiQlgzUhHOiEo8U1ZGWCGoaDYfThgzrPWLEELXrv9xpTOAEEIIIXTNYPhgJB6MXOlsIIQQmhpsACOEEEIIoasJE4ib9pXOBELouwmHQCOEEEIIIYQQmhGwAYwQQgghhBBCaEbABjBCCCGEEEIIoRnhEk6DNNUsIYQQQgghhEbAaZAQGmsK0yBdwpdgYS29UmbOTHEzZ0unDEN0pWDkrxSM/IyFu/4yw4BfZti3hNB0wSHQCCGEEEIIIYRmBGwAI4QQQgghhBCaEbABjBBCCCGEEEJoRsAGMEIIIYQQQgihGQEbwAghhBBCCCGEZgRsACOEEEJXEWrFJU5QDPdKZ\+Q7ixqqyAViJp16CrYej0gCx5SVlRGWF0ORhO5MOTlHC3G8nHKG/zGzUFMV2UDMovl/XOkcIYS\+2y5/A9hOSExZEVxYdwEAqJ2MBJgybvgMUOQXTFCzAcC1kkpQYEkZYXkpnMhfLThGPCzxLCkrY3hJSWVOStRURVKYCJHiIw6y1IwFmDI\+YmQ/dC0tl7ogRTTTBQAnKbOj8kICcYsCUDulhkSOlJUxfECO5c\+E1E7Fhj\+P5z6nVlINiRxTVkZYUU6Yuay7ZiIi8ZmVBhXNcvOpKBLPkLIyhhPDidzHU0MtLSyQgi3NrDguixwpKyMsH1R1p2DZAMeUlZUxfCCStK\+hs5KTkrmC3cTyYlBJXlzkvmuoo8flAM\+UlTGcKMf03O4tURjANRIRiWfKyggnBtVkvvpQKxEWOaaMsII0XPZLFFrX1CJBgSVlZQwXiGgFRWps3S\+dOAC4RjzEEyIWXCu5eoQfUTvZkFZYlEcXe\+ro8XAuACE1lctMiWJPCw84keFaO32RB0ePZYJDWCEUyx/Srq7Ig6OrElvGSJqd\+\+SaiXwuMZFjSVlZGeGEQDAcv4iWy6S4ZiI83FYKyLHU\+Bf4hAvGtERYYC5prtBUUTsZkSRFJyFVM3v6\+mw9oQRIMixKkYtturJSVNOiIjs9GQXXTGrGTGtNI4TQhC5/A5iVYqmOjo6Ojj1tzTUV3vqW9o6Ojo6ODk0RGHB0NShFLcJWFPyCk1PuUF5PR3NNtRQSWXBSSihiiKpu9zlGIuhEQ2HNpgB2MhJSDE5JWj3dmgyaLCcsCkBdh7IN29P5lGgqzJP8WqiViKr7zwPJfuQkI8FwksgJM20mZCYVDikpB9hgwhnOS9\+Bljp/ICRyxDWioXCSVZJ2X5\+lyRDPrtTVo0E5RoMxI51OKbwVDckJiwI1YrIcd4MxvSdtqIKphJSUA0BtLRyM2lLccPpsXRWN3OdWXJYTICetnh49yuuRUDRzt\+DCUTsZkYIxm2ErSMHHTkoJKaagGj09ViLoxnLZN6JyWGeVVLonnQozybB8MXfMLz/irW9LDwwNDQ30WKmYzOqyGLjoC5TvDGrGQ6GoLURT6XRKFS01KMctWrIwUCshBxWDU5LdaSMWoDE5FDVcyFQVxRBUvcc2YpKbUFS9dKF19agcThFZM3vSSYVNRbKJFK/7pRIHaiVkSdZchiGF5ZhSF/zr9vTlq6ijhVgoVewzAbDEaCqd1tWAEwuFYmbpYu\+kwkE5SWTNTJtahNUjwXByamWpVOSprYVl1QnEzZ4eMx6w1FAk6VxlkQfXjAelSArYisLQXyORB3ANVRJX/85kJCW\+vb09EZUFqkckSdEv2XHBSUUC4q8SNheMtrW3a2pEBE0OSOp4/buE5UWBI6UXQFeOk1LkGA0ndU2VJZFjGYblxWBYTepxwVAiw7eFpoThRYFjpiWjAI4Rj17y2zsIIXQN\+q/\+/76g//76178OTcIf/vCHiRYZSLfVe/1Ne3oKP\+po70j3pbc3\+HwjvhhucnY01/gb2roHhoYGulpqfDUtXQOZn3Zvqff613X0DfXsafL78g3dge4t9b6ajQf6hvr2rPP7i6c6NDSQbmv0\+xua6nzVGw8MDA0NDXRv37iupSO79EBXS403v67cb7pa6/x1rV0DmW3xVTd39GW\+6Wlv9Pkat/cMDfV0tLW2HcitM93W4PM1tfcMdLfWebMrGhoa6utYV\+1r3J4e6utorvbVb\+keKFzpgYG\+AxurC9aebmvw\+pvai2/I0ND4wR/o3tPeke7r3lLnrW7OZWAovb3B52vMJdl3oLnaW9faNdCzZ53fW5Cf1jrv8EZeDcYtZj17mvy5BnD\+o3X\+iqtrEy61cULU09G6rrktu3ezhba9p1RhGOrramtet\+VAX/bzjubqTNlItzX4xsa0RKHtO7Cx2lvXml/p9kZ/ptlUou4XT3xoqK\+rvb1rdGqZgly98cCYxYsX\+76u7a1bOnIFpGdPk9/b0JYeKlHsB9J7trRu7\+rLpdha561uHruqvAuP/EB3a13mIJb9vMnnbWhLD1xVkR/qOdC\+p7uvp2NdwWH2mon8QFdrXYWnZuOI7RpIt7dsbN2Tzp1Ktjc31PgqACr8devaMqvt62iu9je0tK6rr/F7K7w1TW0HOlqb6mr8Xl9145Zc1vq6tzfX\+SsAoMJf37w9sx19BzZWeyrqWrsKV9nX0bquOfO7ge725nq/1wNQ4atpaMlkY6B7S72veuOBvoF0W72/pnlLS2NdTbXf56/LJYuKGf/CYyDd3lzn82R2T0tTtS9z\+h4aSLdvbKjO7IK6prauvqGhga6WOm9Bgc4cB1u6BoYG0m2N1XUtB/qGBtJ7WhprfBXg8dWt29LaWF3X0pXes66mIVuCi\+/ZEju0Z3ujz9\+0p2f4H6V3/UBPR2tjtdcD4PHVNLZ29GRXlym4Ho/XX9fU0t490NPe5M1e6FVvPNA31NfVtq7OVwEAFZnfDQ1lL6Tqmpsb/BW\+hrZ0icQvPOCZKtPa2txQV1Pt81Xn1tezp8mfuToa8ddAV0uNt661eyD/jwl39ow0iUtrhGaiv/71rxfanr26ngEmXCAY4JiSt72plVCTEFSCPMkszDl6ynQBgNqGbjOilLllXnC7kzAcC7ZpuUBdl2bG9JEywgohdfi2KLWTimqKUUVic\+smfEiNK4HsOCTXtlzCjrgrS\+2kGnNEJSQQAMKKQZ4aScPJ5CVpESEgMABsQI7I2dFMrpHUTCJKY4a1EZZnqGXYLsNLImOnDNsFANfUdYcTRY64luUyQr47gBVEzrWsqY1GJrwUDIzuWHBtw6ZcgM9mjOECPLENy3Esy2XzKyacILCOZV3Dd5PZQFjm7VTy4kZQflewgUg8JmdHQVDHdijLsaREYXCBEeRYPCxmPqeubbsMxzHEtQ0bWEjKmQGqufH8JQvtiNJDOJa4puXQEnW/ROIAjBAMCiwZtTilLqWuEcsszolyPNvJVrTYAyOEIuHsx9RKJQwqSAJLSxR74KRwJJSpvdQxEprFBqSp9dQUjzy4lukQYTj0QoAHy7DpVRV5YMWgxI9e/BqJPLWNpEmkcC6YuVgEFTWSOXlQMyZHUkwkafWkk2FWj8i50TbU1pN2MGFYVlIG7VdSlIaThmXGRUtVNIsCOMmwFDH4aCrd052MsHokpOguUEvXbTaYy38uAIFIPBYWGHCNqCwnSVizenp0VbBVOaKNHh3tfKppEEkapmWoXFJRLrKHcaaithYJJ2hQ6\+4xEyFX0w5n\+vxdXQmGU0xYM3vSqShvKaFI0iG8JPGOnntmxrWShsMHJZ5QK6nZQkQWiBGTI7oQTVl9dkphtGiS8iLH8gHONW0Xxtuzk9\+hxZZ0jVgwFKNywuzJDJ\+Qw5pNwU5GlRQT1izHMbQw0SKKRqV4qrXOW9PSNWCqIk0poYjBRVPpnnRK4cyorOTGUbimbosxw0iEmOKJTzHiX6TipqimDNNKhmw1EsNn2hFCV42rqwE8AceIJSwhLGevJBgxrIYhduv3ysrKrl8UtqVYVOIIMLwkgh6LZwYDJlU1ddJ1Xdel1HUdFwJKPLldDbJGNBiKZ8bzOqmoagpKVOJKrDelqjobVqSC6zjX1GIGJ0eyTWTCy2qES979/bKysutvWG0Iiirnx1dTKx4gZWXfuzUG4Xg8xBHCiiJnazHNokAdIxGNG2dd16XASlFVciKLvldWVva9W6M0rEYDLHVdlxKGya\+bsAy4Dp2\+diilLiUFg0kJwxLquv3nbReY4QtNwrAEXPfabf8CEJbjGOpcw234S4NaiWjMCShhkSlRGEYUN2ono6opRCIBFqjjOCf1lBOI6XY6FeX0cCiSdEoVWsJJImPGYymbArX1eDR5\+Cy1S5ap4omPsx2uS12XkdSE1hYNED0SlBMTXb45WpAtK7t\+keIE44mwQCgdr9hTQxHKyq7//k\+TXDQRlS76Sb2CyAPNxCwfecIwhI6scBj5i4u8a7nA8mPa78OIEEkaeiwksCwXkCNB3jHN7OGC8EE5wAIwvMizXiEUFBgAlg9wYFsOBVtPGESKRkMix/KBcFQR3ZRmuNS1HMKJubsao/NjJpK2EImGAxzLCqFoVCKGZhQEjgAA8QbCsshAZtVgW447pY2f4RwjaRIpogR5lhPlaETyEgAA19BSrhiJyoHM59Eg6JruEF4K8o6eeTrftZJ6tv3rmLrLB0XG1eMayNGwxLMMy4tBkeeEAMcQwhCgtPSenfwOLbEktZJJm4\+oYYlnOTGkqCHW1FK2mzmtMRzLMJwQipt2Uh5x48kxEik3EInKIpfZfpHq\+aeDGSEsSzzLQPHEp3q\+rBDkSLa7QhRY18JXcCCErhrXUgPYMRI6DYSlXMeJrYXlmBtqO5DuSR/YHmGSshw3KRAuqCainC5zZWXXi6orBPwMAUI4OeVSS4sEJSkUiWuJMGdqKYuCk4pGdTYSDRXtUnDNhCzJKU6NRwo7DVxT0xxBDuUauU4qIketwJaO7p50V3uLYCghJf\+YLuGCsdT2LRsbOSsaDKqGC4yoxGNBVxWvL7uek1NsQPQSIIRacTmcZMLbD6R7ujvaZMg9fommy6h\+MARAnZQSlFQ3HI8HuUks7xgxWYqYgWwfJgWACjEcDQd4lgvIqioVXFeNxUrRhCpaEf76suuFiMkHqr1Q\+knHC0ycCIrhumY8LElBWUlosRAxJrx8YyVVa9/S0sQ7sZAUmejheiKE43u2tzY3MnpEusjaiZG//JEfscXUVITh1zBm3gBGHVOLBHmmrKys7Hu3/u5TN3fIIAzLMpl/ESCEZTOt6NyYI\+rajvPFW3d/P5vcDb/8z5OObTuUjB6nUMi1HcpwfG7kEcMJLDjWqNsShGGzCxBCCMA03vucQajruJThuHyoOZYAAHVs2zn5n7\+64frMfvv\+3X/4IrPf\+ECQc1K6RYFauu7wIYkjQB3HJTxHqJUygc/f13Btm7KiwAKljgsMQ8bds5PfoUWWdB3bPrt/w6Jsfr936\+8\+PWmbDnDBSIhNhQRBCquJpDG6EGUGmvC5DBOW5xjqZO\+AEZbPlO0SiU\+xwBHCZKsMAGSOWFh0EUJXiWuoAewYSYNIcv7tiI6RNECKKpkbmiElGmKtpG5RAMIFIpph06GhIddQA0DzFyvDGE5giWs5J3U1mmIjBf21havU1aCkWIF4KhEa8b1rJnUqhvJdwq6Z1PM3kYVgJBouGD0FQFghEAqrWkqL8KaWtFwARpBjKcsdGhqiliZzFBieAVvXTCaoKJk\+BFlRgsRMGi6T6QjKr506LjBjtugiEMKM6OSjrkMJw5ZXcAy4w51E1HUoMNO43svPtQ3bHb4IQtRKhAOhJIloSSXAAJQsDJmreGonI8FgzJW1VCxb\+gnDZLo9IPMXyzHgOvT6koWWFcMJPVM7zXiQocCUfuqheOKTHYSQuegs3cuZW4wPBMNKIpWMCU4yYbhk3GJPOFEKRWJaKiEzRmKCl/mOY2zkgTAMoU7Bil2XMtk1Y\+SnJfIszxLHzDUOCB9OdHR0dHS0t9T7MmG2EmFZtYVoKt03MNTXtbFmZITGP3Awox6adlNhnmF4htpG8b4vSunIxg\+2D64EMuqVI9RQBAKEDwQ5O6nbjqWnHD47kp86QAgQSinkb21QK5XQKcczBFxTd1mRZy7pniWj3m0xZMUDDOGCMd1xjHhYcJJRSRBGvyhukvdNiiY\+1YxO8XcIIXTJXTsNYNdKmTD8fByMPp4TAEIytxltXUvm\+iocQzMoL4kMtTQlrObfAOzapkMJ\+3\+dSumfnty7Ydn1ZWVlZd//5R\+/OPy7W6/nI7qbuRSKM6qux4KjGkzUMgyXk4a7hGm2ZzG/GMn8n6srAT443FlBGABKKYBjJrXcFRy1UkmbEUWejDpDZe/8AsvzrGuaucUdU7cZXmCn7\+TC8CJPbD33kJ9r6RblRJ7lBJ4ZHgFIbcNwWGE6V3yZUTMR1ZzhQfQznqsrIcWSknpyeHxDicLAAIBrxuRwio/rSSWQLwUMJ3JgG7ky7jq2CyzL\+EoUWuoYSS03649rJnWXk8SSNyRKJF5qcdeIR8IFcwfZpjNOI881YxIfUPPvNc92sZASxd5NhgVBHr6ovKi\+uGKRB4YXWWrp\+VmLLN0iXIBjMPLTFXnCiiEB9Fgs\+8pnwgmBQCAQEHPDf1zLsIkUUUIixxDqmKY12RURhmOJYxU03x3HzdyODfJOMpYY8fyjoytSIJx0WI5jXDvfW\+fapgMsf\+0eYq9ihGEZMnwPx7Vth0L2qRjXGu7lpI6dH/MeCHJOKpnShtu/hOWIa7uU4UTO1eNJ07b0WDgctwkh4OjxSNTi5QCbTfZS7FmG5Rhqm/nRFdR1HDf3v5ThxGA4lkwlQjByxEa\+fOa20sq814RMKvFplKns2RsCNFtLEELocrtmGsDUMS2X4QuGKbNiUKCp7HUFtbRY0uakAEuAOilVDsmqbplJJSQnISAHOEIY4upqJBJLWY5tJJRIwhHlUO3PVHP4VmfP9kZ/9cYDA1YsQCxNUa1ALF6sa9ixDIfhC84drBAUGSMeSzkUgNqpWNxiAxLPMJzA0lRUiacsxzFTsWjcZAOSwAA1E5FQKKIZlh6XQ1GTk2WBIXxA4p1kPDPlsGsm4inKBwWWCLIs2LFoTLcdx9AU1eSC4WmbJxAAgA3IEklFlYTpOFZKjWpuIBzkCCPIQc5QlYRhO7YeV\+L2tdp4pI6lJ5RgULHEaKxob/8M5OqqkmSUeDQwoiyVKAxAzUQkTkPxUfeDCB8MS5CMRjXTsY24EtWJFBJLF1rHiEVCcjRpWilVlv/NFuRg6f1RIvGSi7PETkXDkbhuO7YejyhJCMhSqUYew/E8MWJKNGnajqUnFNUgYlBgSxR7hhdYR4sqcd1ybDOpRjWHK/J\+p8koEXnCSeEATSrRpOU4phaNpogUDnAY\+emLPOFDqiLa/3a3EAjHU6bjWLoWCwcD4SQRJZ4BwjDgWoblAjhGIpZ0GRjnQekRuIAsEl1VErpNqWvG5UBmaiVGkKNhznjuVkGKxBLJlJ5KxsPBYMxiAwLLCMEAY8aicd12bCOhqCkQQwFsAF8KrBgUaDKqJi3HNhJq7jVtjBiSOCumxFKWS6mlhSUpN0c24QNB1krENJvPDfcirCgQM2VSPhhVBEsRhaBqBVQtFoTE3WI4JahaTGIB4JLtWcIHQ7yTiEaTpkupnVKkgJwwqWtEJTGYna3bMXUr82I9QgBc23FclxFDItHVaKZyJaIxkwnIo2t0icQvOtOFq2AFjlq65QCAY8TjxtnpTB0hhCbrapoGaaCrtcYzMnu\+3HQ/fR3N/uEZgnIN1o4t6/LTDDS2tOe\+7TvQWu8DAPB4a5ryc1QMDXS3t2QnOxie32JEetkGcCZzFaNCVZGb9KPopEh9XW3NDdnJA6obmrcPz4zRvrGhxpf9fGPu84H09nXVHgCACn/9xtwMHEMD6T2tTXX\+CgBPhb\+uqTU3U8hAz56NdZkZDSpq1m1PT3FmgqG\+jmb/qM3yZ0bt9XW1Nfoz0fc1tOZnfxhIb19Xk4mEt27jnvGnRLjsJpoGyTdyB1Y3bRln8pTvpnGnqRhdFiA770exwjDQ1VIzenFfduLXvq62pppsxRqepqVEoR3oamv0Z2pndUNuprFx6n6xxMfsW/DUZGY06eva3lxf7fWAx\+uvb97e3VdiUzPFfiC9p6WpxlcB4PFW16/Lz1hWotj3dbVlEs8ccPaMO1XHlCI/1HegtSGzaR5/Y\+YYdVVFfmjskbGivi19jUQ\+m1j39uZ6X2ajK3zV9Y3NW/Zksjs0NNDd1piNf/W69u7u7euqKypqWj7c21zta2hLZ36/p8mfnyisZ3uDLzd1VV/39uZ6f4UHPN7q\+ubCM0xPx5ammswe8Xir69flJ13KTZZTkZmDJ3dayk\+DNJRuq/f58yOrS05OhYaGhiacBqk7Ow0SeOuaW5vrfHUt2WmQ9mSmQfJ4/XVNrQdGXJPUeaCicFDwQFdrvb\+\+tdiZZKBv5ESJxfZsqR06dhqk0rt\+oKejtbEmM59TXWN2fqXMJUiNL1N5fA2ZWYcGutsavLlal58GyeP11zdnr5dGX84UT/zCA56Z1DEXuMK/\+rra1tVV\+6ur/dX16zY2VvsatqdxGqRJwmmQECpqCtMglf1X/3\+PvrYa14lj3bfccsuEi23duvWJJ564oJTRdJk5wZ85WzplGKIrBSN/pWDkZ6zLsuupGZdDqiNFVSUksgSAupauxVRVc4MpPTZiiq3vOqxrlxkGHKGi/va3v81fuOiCfnLNDIFGCCGEELqiiBDWjFSEM6ISz5SVEVYIKprNhxPGDGv9IoTQtet/XOkMIIQQQghdMxg\+GIkHI1c6GwghhKYGe4ARQgghhBBCCM0I2ABGCCGEEEIIITQjYAMYIYQQQgghhNCMgA1ghBBCCCGEEEIzwiWcBmmqWUIIIYQQQgiNgNMgITTWFKZBulRvgcYqihBCCCGEEELoqoJDoBFCCCGEEEIIzQjYAEYIIYQQQgghNCNgAxghhBBCCCGE0IyADWCEEEIIIYQQQjMCNoARQgghhBBCCM0I2ABGCCGEEEIIITQjYAMYIYQQQgghhNCMgA1ghBBCCCGEEEIzAjaAEUIIIYQQQgjNCNgARgghhBBCCCE0I2ADGCGEEEIIIYTQjIANYIQQQgghhBBCMwI2gBFCCCGEEEIIzQjYAEYIIYQQQgghNCNgAxghhBBCCCGE0IxwdTeAqamKbCBm0SudEYQQQgghhBBC17pL1wCmdkpLjd90pY6uJU33kmVh2lA7FQuJHCkrY/iAHNcdbJEjhBBCCCGE0LXmkjWAqZ2MqZrljreMo8fUuOle7a1JV48G5RgNxox0OqXwVjQkJ7BTGiGEEEIIIYSuMZemAUxNNbBow97Db63\+PhPUbABqJSMSz5KyMoYTg2rKpmAnJOGX/3l4769uYAIxi1I7qYZEniFlDCfKccMZL3GRC0QiQZ7hgomiiVNTFTkpnmmlOskQW8aFU27mx7EAF4hZ1NFjckBgCWE4MRjJrI/acYnl5OSodVPgZVWLK0GB40RZCYvEMsZv2SOEEEIIIYQQuupcmgYwEZTknia/r7G9x02GONeIynKShDWrp0dXBVuVI5rFylqyudpX35Z29Qhna\+FInMoJ006noryphJTRzdARXFO3xZhhJIonbrOiyNi65QKAa\+k24yeWabkA4Fi6w4oiY8aUmC2puuNYqahoxcKq7gJhRFlRgjwzcmVsQI7IIptZsZHUTCJKwqhlEEIIIYQQQghd5S7HS7BcM5G0hUg0HOBYVghFoxIxNMMuHERM\+JCm6wlZ5FhODClhAUzDdsdJkxHCssSzDCmeuMsFBLB12wVqGxYJyCIYpkPBsXSbCAEeXMehQFiWYVheUlKWGQswAIwQioSDPCmyQmrFA6Ss7Hu3xiAcj4e4YssghBBCCCGEELp6XZYGsO1QhuPZbJuR4QQWHGvUo7\+ulVKDAkvKysquX/Tk/pOUjveULWF5lhkvcUYI8K5lOK5jGi4vSRLrGpbr2rpJeUlgWDGiBJxoQAiEIjFNN\+0JH\+klXDCW2r5lYyNnRYNB1XCnEAiEEEIIIYQQQlfOZWgAUzqqMVukselokZBicBHN7BkYGujeUuebZA9rycRZIcA6hmkZusOJAseLxDZMyzBdXhIYAEYIa5ZjpaJB1ozLoiCpE72NmrBCIBRWtZQW4U0tiQ8BI4QQQgghhNC15TI0gAnLcYxr57t8Xdt0gM332WY\+MiwqhBU5wLMEXEu3JzvRUMnECSeKxE4lUxYjCizDCTw1UkndYQMCSwCoYzuUsHwgpCRSKVWwkqlSvcCurgT44PB7nwkDMH7/NEIIIYQQQgihq88lawATQoC6juO4LhGCAcaMReO67dhGQlFTIIYCLMksYtmuS8tYQh3Dcim4pqYmHEKoO7npkZgSiQPDBQSqazrlBY4Aw4mck0qaRBQ5AtTSwoFAWLMoAFDL0G3CcgwB19Ri8eSoKY4YTmBpKqrEU5bjmKlYNG6yAXwLFkIIIYQQQghdYy5ZA5gRQhK798llfEizGSmWTATdeJD//g1S1BZjyYTMESB8KMRbv/spJyVgtRIi2urvX1/2vVBSiMZjMpcKBcJ/\+WbiFbHFEwdg\+QDnnqScyDEAwAoiY38BQoBjAAgfisVlGg9ypKzs\+mURR1LVIAfUNRKqOmZ0MxeKp7QQaGHh\+98XwxqEEpoqMdMdMIQQQgghhBBCl1TZf/X/9wX94MSx7ltuueUS5QYhhBBCCCGEEJqMv/3tb/MXLrqgn1yOt0AjhBBCCCGEEEJXHDaAEUIIIYQQQgjNCNgARgghhBBCCCE0I2ADGCGEEEIIIYTQjIANYIQQQgghhBBCMwI2gBFCCCGEEEIIzQjYAEYIIYQQQgghNCNgAxghhBBCCCGE0IyADWCEEEIIIYQQQjMCNoARQgghhBBCCM0I2ABGCCGEEEIIITQjYAMYIYQQQgghhNCMgA1ghBBCCCGEEEIzAjaAEUIIIYQQQgjNCNgARgghhBBCCCE0I2ADGCGEEEIIIYTQjPA/LlG6r7/\+\+iVKGSGEEEIIIYTQd9jixYtvv/32S5HypWoAL168ePHixZcocYQQQgghhBBC6EJdqgbwJWqvI4QQQgghhBBCU4PPACOEEEIIIYQQmhGwAYwQQgghhBBCaEbABjBCCCGEEEIIoRkBG8AIIYQQQgghhGYEbAAjhBBCCCGEEJoRsAGMEEIIIYQQQmhGwAYwQgghhBBCCKEZARvACCGEEEIIIYRmhKuuAezoqsQTwodT7tQToYYqcoGYSactWwghhBBCCCGErnGXrAHsGopQVoiwghSOG874jVI7FYtZQtw04xJzqbKGEEIIIYQQQmgGuqQ9wN6alq6BoaGhoaGhgR4jLrOGEpQT1jhNYEpdF1hB4MilzBdCCCGEEEIIoZnncg2BJqwQjKhRCcxkphOY2kklKLCkrIzhAnLCdAGoqQYWbdh/9tPnll3Phd/aHOSEsO5mfm9rQY4P6y64ekTgg7FYJBgQBY4TQjHdAcgkGAlwpKyM4SVFz7eyqZ1SQwGeIYThAyFFM10AoKYqMkIklzhCCCGEEEIIoe\+\+y/oMMKUUgBAg4OpKMJxiwprZk05FeUsJRZIOERS9u7XOW9PSNWDH6/6/JZP5IhU3RTVlmFYyZKuRmOECtbVIOEGDWnePmQi5mnY40yx2dDUSp8G46TiWFuEMJRI3KRBWDEfDQexnRgghhBBCCKGZ4/I1gKmdiqkpEIMiC66hpVwxEpUDPMuJcjQaBF3L9uROQoUgR4I8ASCcKLCuZbngGEmTSBElmEkwInkzjVvqOhSAYVmGYYWgqtu6IhAANiBHwgFsACOEEEIIIYTQzHFJG8BnP31u2fW5l2Bdf8PdGpFjaogj1LFt5\+R//uqG7Jffv/sPXzi2PcH7sfIIYVgm/wcABXBdx6UMl2vRMhzHZv7JBSJh3oyIQkBW4kndnOw6EEIIIYQQQgh9x1zSBnCFv2nLno6Ojo6O7RvrvN76aDwW4rNtVOJr2tMzNIwaijBeh2xhw/VCOm7ZgJKyHUtTAqCrIVEIjfsSLoQQQgghhBBC31WXtAFMGF4MBAKBQCAUjUcFMxqJmxQACMtxjGsNd8dSZ2z3LyEEKKWZj6nrOO64a2IZ4jpuNhF3uDvZdRyXElaQZFVLaWHW0HTsBUYIIYQQQgihGeiyvQWal2NRwYpGYiYFYMSQxFkxJZayXEotLSxJEc0e2S5lOIF1Ld12AaidiifM8\+Olz4pBgSajatJybCOhxg0XAACoGQ\+JASVpUwBwLcN0GI5jCDh6IhbXbWwJI4QQQgghhNCMcflegkV4ORYVrcxLm5mAmtRkosnC9xguGAc5EZNHvZKKiOGYwunhgMALoQSRJP/IcdCjUudCalwmydCi798QTJBQSGSAAhAhEo9JjiqxZWVl37s1BnJMCTBAHSMejSexAYwQQgghhBBCM0fZf/X/9wX94MSx7ltuueUS5QYhhBBCCCGEEJqMv/3tb/MXLrqgn1zWeYARQgghhBBCCKErBRvACCGEEEIIIYRmhP9xidLdunXrJUoZIYQQQgiha9oTTzxxpbOA0Ax1qRrAABC4\+/\+5dImjceh7/hcG/1KbOUGeOVt6zcFdc6Vg5K8UjPzlhzG/RPQ9/\+tKZwGhmQuHQCOEEEIIIYQQmhGwAYwQQgghhBBCaEbABjBCCCGEEEIIoRkBG8AIIYQQQgghhGYEbAAjhBBCCCGEEJoRsAGMEEIIIYQQQmhGmBkN4PMHX5Jm\+avG/jf74dff3/zgbH/VgvXvnhwEAIDBr3ZsuGWW/8Y7tv7d7X1Pvr1q1o8ffuc0hcy/87/98S03P/zUK3/5il7hTbtA\+a2Qop39uQ9Pvxv6cdUsf9Wshs2fDYL76XNLisTqR6t3fzU6CP6qWT\+\+7bb10XfM8/k10NP6Kxsabr79xln\+qtm3//TuDS07us8BAAz\+442Hb5zlv0Xedy63bHa/3PbS390xOZz98DvHBodT/WyrNMtfNWvpg69109yK3l3946rZD7/xfz5\+pliGq2bd/usdvePG4ccPv3Oajtre2bf/9I71LbtOnC/xywvgfvrczf6qUhs4zi7IbN\+xfS2hB29bsLRqlr9q3u0/vVt5p7M3s\+3nP9p02yz/jXe89Xm\+\+FEzerO/alZDy8HhPXhL6E\+58jn4\+SsP3jjrx7/e8dfcikb/d1vzXy58k7P7dEQ5WfLgU/\+y\+3MXYHivjfpvacNrJ0aHPfufFO3s/fu/NFTN8v9046f5/NBjbzXM9lctUXR33JJwbHDUGm9ccIe0\+l/f/ay/aO4L0ZOfvtH8a2nJj6tm\+W9cIDWsVt746DQd3i\+lwjWmuJ79S8nSuP2v79y9tGrWHc/sGi6WX\+349Y9m\+X8U2n0OAKD/8x0vPXW3dMvsTM16\+KmNf8pE8iJ8R/bR5H41\+I83Hv5Rtu6fnmB37Dg9NjLZDTw4WCwLF\+fsp\+\+EH/7pkh9XzfJXzbujIfSv72ar8/g7qMi3YzI5ZqvHK7cfmxe41eOcPd85dqbIgXTBhr1n81udi/\+STQfccQvbdMR4bPo3LpAeDG/VTw4W/Ta3dqvrtaIx8Vfd9lLn7vEOtuOvcdxD8elxN2XwH7te\+vUdd9wy2181a\+ktNz/8zCv7/uEWbGnps8MENWW88/sUjH9JULr0pkqftSc4Tk6yvjS05E\+vZ/c9tWDUWXhMtLO/WtrwSu6QBYP/yJaKpQ\+/cZoCAD2x9xXlwdvu\+NEsf9XsO3569/rn3vg0fzEDtPfAG8qDt93xo\+zR\+9fPvXbNXR8iNKNcwnmAryIeZv7in1R7BmHQPXP0y68Brpu3dFElAajgq256SHleb9z0cWtLpxhf\+YOzna2bPugF/tEXQjczg2PPUZ4qfkHFYP\+p9OkvD76/6eD\+j559e/sTNzOXf5suUnr/ru7ztTUVAHD2sH7om7FLVN7Iz2M8\+T/Ll87O/\+Gp4hd4PR4Y7D954viRj9988uBx\+N\+vPzSf0BPvyA8/v/trAIA5cxeQ/uOffLDlkw8\+3Pfa27HaSeXr5MH3Or8GABg03/vozJqF88mIr781Xtn64arWn/sKPvOUL1m\+4rh3EGj/8SPpfoDyG/kFjAdg9s1eD0xa5Y18Jfnm9JEzxw99vOWXnfvXv/b27/5pzuR/P8a5Q\+37vwQAgCOde489cfOK8pHfj7cLzh986ZF7Xu8aBIDrKqvmDp46c/yT9ufvOXhgy7\+//ND8SWagd/fWzZ0rW35WuN7rKheuWHbua4DB3mPW6fMAc25Y7Cv3gGfewsopbyl45i6\+abYHBgfPfn301OH3W5/pOuX5Y2JlLsVZC5bOLx/ekeWLvdfl/xhRzDxzf1gxyV1WrCQMm7Vg6VwP/fr4l2eO7nv72X2dB9r\+/cU180jRZQHA/Yu6\+vE3v4R5y\+9cs7J88Jj54b72rs4z8Gd1wfjhGltcxymNc64rtX4AABj8xxvPNEY6\+yv4ulWheaT36Ecfv7/5YNf52cn4RZXDrGt9H03mV/TM/h1mPwDA1107Dn61at4Pxj84nC\+MTD5Q85cwk9u\+SaMndz9/zzM7TgEAlFfdUE7PdO1\+u2v3x3u3/PurD83NrbfoDqod\+W2xTI7dauIpXc1nT5zgSOOcPSs91xVpNJ87vPdQb/2qSgA4f\+zjrlNjlxivsE2HbPqD9OvTR9LGtpeNg71//PM/Lyu99llkvrh8sB9g8Gz30VPf5oPjWTh/Fhye8hpvzX1d7FA8jv6/v/LUI5sO9gOAZ/a8Gz39Xx7cseng\+zsef7v9t7d6J3l2mKB\+jXN\+n4ISlwSjynZ\+6flLKsv7p3iczCcybn0Ba9sru3\+x/Jc/nOiAMtK3R3cdPL5\+0RICQM8Yu8yC4n36vfCvn955xnPjirvW1nrcbmP3x9s\+OdjrSb760DxCT7wb/vWzO88AAFTMXeAdPH2kc5vS\+f6ua/T6EKGZYGY0gMnC\+1/Zcz8A0GPbH7ktalTcu6ldrffmvn70\+Ud3Pbxl20ubH5hbv\+\+lHadgwaPPrq8tBxjbfzhLfO611x\+aR2Dw3ME/Pf\+r6Ief/P6FN2v/\+MyiCzvMXmGzKiu\+Od3ZedytuZmBc4c6u87Nmlc1eHrElUr1Y4n/WH/TqHNiJiD5IADA4OevPRxUDnftNE\+vme/Z9fvW3V9DRa2yveXR2koCQM/ue\+Hup7Z99Cfj1IplMKHBrzp3G\+euW7a\+qXzH68bOzuOPzV9SGNmKWXDug82bQ3W/q6kY3pqbHkv8x2MAQLtb7ghuOXLDmn/7j2jtJC81xm5v/\+fvvPj0k\+1HN7\+4eZVw4enk9XbtPHga\+DUb5hutH3y4s3v9ioI8j78LaPc25a2uQViwtuVV9f4lDADtPbD5mcc3HXx/00v1tZvrJpWBWR5I72hpf6i2qSCG/3fgf24OAAD0H2gONr55ZtlTrRdfeitXPf92YmWmkXa\+81\+D97x9vHP30bMrs/m8cfWLH/zzrczI37hnAKBYMRv8\+45JrLJoScjLr5Ge2LtJeXrz4R2bXq2vLajyI50/1ml8CbD02dc/eGIJAYDeA6\+8\+MZns8vprHHDVay4MkLJ0khPvPPSOJvU2/WR2Q\+z74v9\+2trKgGAHvvTC//SObgQBinARR9frvV9NJlf0WOdew99W7ny8fvOv/XmJx8YZ\+/9ga/07oDBfxwbHZlLo9d45fc7ToFn\+SOvtv223ucBgHOdLz2\+\+vX9b\+47vqYpE9kSO6h2wZhvRym21ZWly\+3gP964sK0e9\+zZ\+96opT2zywfPGLu6z62qnAP9R3d9etozdx6cGXEruWhhm0aF6Z/d98wdT\+34snPvkf5lFeOs/YX/WAUAcG7H\+rt/9fFg7dOvt9//AwAAOP/RJBrAJdZ469LM10UPxSXRY7tbXznYD3Pvir328mOLKgCAnng3/PCzOz9491DTrSu/Hv/scNeoLI2qKdl6XPT8PmWlLgmyDeDihW2Kx0kYm\+bY\+uKpgP59r2/et/KVVZO9sesB8My5rv\+zfcap0JKFHnrW3Hvk2/Kq2f2n\+gEAzp7QD50BT\+0m7bWHFnoABr/a9ZL6zjfzyLcA8NW\+37fuPAMVK55sa9nws3kEANxPN//quXfOd3cd6x9z7xshdDWYGUOgJ8AI618ILYb0tl/9\+unNaaharTw/YZeLZ86K\+zc9d2dlcFhp/AAAKoRJREFU5pbhNTbQZfbi5TfAsU7j2CBA/9GPDvbOWbSsasrnwuwPPaT36L6DvQCLH316bW1l5kRPvCs37fnkyPHNv1g4ifRpr7HzYL9H\+PkD9/78plmDn\+3ef2xEB0Pl8tVrl1939I1Xdxy7BGMUs8qXPPTsprVzsz20U07m7OH3PjoDN674xUP3ilVw/KN9R93Cr8fbBfRY597PvoWKO9c/d3\+2W4ZU3vros2uXZntXJpWBqtq1D9wweGjr5l2nL3Px9OT/3yUz2ZJA5tc/9\+yjSwFOHRwnbh5mfmUFwLHd7\+7LDMWsvPWZ1n9P/PMvxr9wmai4XiBPpXc2wNddOz74\+1kAALLw/hat9ZVn/ukHl\+Du2jW3jybxq8Hj\+3Z3Dc5a9sC9P39gkee8\+V5uUOgV5p7QO9MAc\+977jeZ1i8AzKn9zdufHzry5ydKtYgmvYOusq2umC8uve5058dHXQB6Qu8847mpesH4NzW\+8y7sUDzYe/DjrvPg\+UmTsnZR9s4Rmf\+LWPKvvX9\+ZVXlBZ8dpla/Lkr\+kuCyrG14lfn6ct3itY\+IFWfef/Gt0sOeRxuE6\+Ytr5k32L238wwF6D207yidu2x5ruPaU/5DL8Cg\+d47n35FAcDzg1X//JqmPrdmPoHeo7sOngZYvPbZ9T/L9bEzNevb//x//tz6GLZ\+EbpKzYwe4AlV1D6hPPrxI2\+e6YdZdc88UTepE7an8qb5lfBx79kT/dPRRXMZeebVLpq3b/feT06sXdivd/Z6bgot8Zx4f8Qyh9Xbb1KH/5y75k9/fOVnmX9/Y7Q8FXzT4wEYpF8fP3JmEObetXZFJf2m92w/wKx5N80u7PAh3srC2PTufOrHO4tni57qfO/QN56FteJN8z0PCOX7OvfuO7H2pkXDqXmEXzzzzf5ftr/xYudd8cmOBL5w5fOWz/VsO9N/8uspN2jOHdptnIMFq1Yurppfv3z2jp2d7x3qv3V4CNx4u2Dw/Jn\+QYCF8xcUxpGZu2ThbDjS33v2m8EiHWpFtuLW9U\+c7nzu/Rffeqj2N5f0JNy768VH7tjqAQDaf/pIuhdgwap7lnkBMo8Cfvl24w/eHl664s6X/9/Nv8huwuE35Af35kfiVVRviP92UlmdfElg5i9ZOBuO9J4\+\+w2FyqLVlCy8d8NzHx9VOt/85d1vVtyw7CeC\+LOVP1\+1csm4x4GJi\+uFqRSf\+e3aQxu27X4xuPulyqWCuLw2sOae\+2onHBU8Kdf6Ppr4V/TE/l2HBz21gRXzF9OViz0vd23rPL1m4jGQo45Inp88n2yfVE/dZA1\+3XsewDN3ia\+wQeupGPmARqkd1D9\+Jq\+2rSazb66dv3/zp/qR/mUVB41jsOAxoXLXByOWKVrYio\+Tn5Iv25\+/53A5AYDB/pPW8XPgWX7/z5eWw6lLtvZSa8y6sENx77nefoB5vhvKC3cHU5m5KT/x2WHhmBRH1JSMouf3KT8FU\+KSACDT838pCtv49cVTde/6Rw8\+3qq17rz/1VWTTdPjW7F4Tqexyzy9dtbxXYf7vSturfrayHzHCGteeFz/5etG6\+O3t85e8JNqcfnK\+odWBhaWQ/7KZ3nmymfwXOefdnx0JnP3fM5N965ZM\+WTAkLo0sEGcIZ7Qj\+UGe/3zfHO7t618yfX63Kt3tsrX7pSvLF9x0cHjy7vNU55lj1VXdk5eplRD/4tqfAAZNuDg6eso/nx0lV3boq/sLa2ktATk\+qyKHgcaNA9cfTL/LOvg6c7P\+g6DwtWrphHPJ4Vdy6r6Ny/Y/fxRxcVPkJT\+ZMn1q/c9/zO37\+x9oUfTmHLLwiZchfZaWPHwV6Ye9eqRRWkfNmaFZU7P9i/yzz3s\+GRBZPZBRepfOHK9U9p\+zdprTvu3TDNaY80eOZotvoAwA1rtrRuemhRBUDuYmvkQ3dz5hc2cXq/tIZ7JSrKe\+ngJCvVhZeEcR4tK7/5qX//c\+2\+9/eZnx\+zuj5q37K7fcvG6ke3vxYteVE4qeJ6QYhvZcuf9/x8xwf6kTPHP\+v88M2X33/z5dZ7o28nLvRJtqL5vdb30QS/Ov/Z7vcOgecnd4pVHgIr6m8C9dAHxqn7fzjh2JORDyiWL5w73Yf1yR1Giu\+gwf5xM3n1bXX5gpW1i9943dhlHq3qPA6L1q\+c\+9WuUcuMV9imwzfHj\+THLV\+3bH3ry8\+t/CED9NSlW3vxNYKb/eiCDsUe8FyysRklH\+xfMtkH\+4srfkmQu2C4JIVt/PpCypc99sRdO595/5WtxtLJvX8EwFNVXV87\+8N9\+7o\+Kz9w6OvK5SsXe7X8t3Nqf/v231Z\+uGPf34\+dOdrZua31422tL4ov/Pvr60dtzeDpjzS11cr8Ub5y0V3YAEboaoQNYACA/r\+/8vK2I7DggccXf/b6\+zt/v3ntipZJ3A3tPWb2Aniqpv38felV8PW1c7ft3Pfetv7jZNFDyys9o1tf4z0DXLcl\+fpD8\+Dk7mfveOb9Uye\+oh4CAGT2gqpygDOnP/v6/Jp5\+SP\+uc/\+cpwIt\+YuyEY8unPwpcY7Xz\+a\+SL3KpejrY1LW3M/HvP6KA8z/77nQu/se33HK7vXTFMwxug//dmZQYDKqim\+F4Tm3o207f7l2/Kf7vvg6Nl/mpPvVCy9Czxefl4FHD914vh5GG5N0TOfH/saYO483ywPAQ/AIO0dfjqU9vcPAoCnYkRRLL957dP3vfH4jle27p30XfApqHzgtT2JlXNo9zurH37\+kzPHz43sOC/\+fGnmf6qV/3f086WfMx4PwOD5weG33Lq9g4MAnlkjetAmWRLcXNyqJhiRV3HTyoduWgkAQE/v3fjrx988/P62w\+t/VuI5yckV19GIB6C/3x3essGzg4MA5flbLWTerQ89kXl3zvnP3np69Yv7d2sfHrv/hxf9tN53Yx\+V/lX/0V2dRwHgk\+gdldHcEkVfpDfaJX8GuGLuEh\+8f\+jM5yf7YfhVc/2fd3Z7ltb8kMllY9wdVCKT/cevvq32LFwpLnzrzUMfv/dZ9\+DCJ8SF141\+vfAlfwb4kT/\+\+Z9vZfr//i8PN7Zax4/1jhifdaFrn8zBdvw1AlzIodhTuXBuORzuPZnup/80J5cOPWkaZ2eLK\+ZNfHYYm2SR\+jXNzwAXvyTIueDCNuFxcsIDGoDHt3L9\+hX7ld2t22bPm\+x6K5etqq7cae3dufv42dnLVi2qHPkQFPEKP39K\+DkAwOA/3lEeefID4432o48\+XektB/j69KHMlU/5zf/zP0/9z\+zlzfgv\+0YIXTn4DDDA\+c80dfPhwarVyu9\+s\+l3oQWQ3rZp6wF3gl/Rk/s2v/hxL1y3bNWK6RmkeDmR8sWrVsw7f3DbNguWrhSrptLxQnwr1z\+zwgPpbS3a310AKF\+wqnYewNE3X92Rm3Th/MG3nl39eOMtD7ccnGiak2P73jv0LVRUr1n/\+JMbHn9ywyNrV84FsD7cOfpB3IoVofUPzO7/RNtxpMjLqy/euc63WredAeDrfjZ/SjduB3s7PzDOgWfpPY9uyGxL6K4bAU4dfK/wEazSu4BU1dQvvQ7Of7y5ZV9uHoX\+z7e9uuMIQNWK\+uWVHi9f6QE40vnekUxUB7/a126cAqiav2DUi6\+9NeufqS0/9/G2nd2X7rHpXL4X3ff86sXwbdcrr74/9adhPeVVs8sBTnd\+0HUy80lv17Z9RwHKfYtGVbRJlIT\+v297edsRgKoVP7\+pZF/u56/9\+rZ5P274l9ykPqR8nq/cAzBIB0ttxuSL6zAye15VOcA3XbsO/iOzW93uD3eag3DdvJvmlp/d99wdt/9oyYZ3c6Gr8M7N3Fk7P43PdF6r\+2iiX7nd7\+2yAOaKax95csPjT254/NG1Kyrh266dnVf\+BQ1krvgTHuDM\+y1vHcjOD9T/\+TubHr/nkTtu36SfHbXwheygq3KrPRXz61fOHzykbfvkmwUrVyy4uK7Fi1B\+81O/ua8K\+ve93rpv6s\+\+XsDBdvw1TvpQPGfpymVzYPCTt1p3ZGeHomf/0vqrhx\+58\+5HXjsBE50dxqQ3tfo1FWMuCaaWyrjHydELj1NfPEvWPr3mxm\+PvqkZ52CSKpevXFZx5sPNHxwn1fXLh\+\+A93e\+9OCSH99yd342LE\+lLzeQDSoXr1oxD\+Dotpd35K9zaO/xQycuzyPXCKEpwR5g2r1j41ZjcPZ9Lzxd5/WQ2sc3PLDv6Z2a\+ua9bz8zd8zS\+WddBns/s04Pgmf5bzasvbZeAZ3hmXPTSrGqfcep65atWjGP8RwdvcDIB/8APHNWboivHpXIkrVPr33jkTcPbW3dtfL1h\+bPqW3a8EDnszs7X7j97neWzi2H7AwHC9Y\+8dBN5YNHxsnP4PF9\+44OwoLHnt2Ue2cs/Wze8c4XjY/2HX2uZuQbpOfd9cwT4q4XjfPT\+B6f3PbmZmVY8Oizj03tFdD0jLHT7IfZ9z3/fDT7CsrBrxb2Gk9\+vH/H4XOrqnPLld4FZP59LzS9e8/rXdueuruTX\+D15CYgmXvfC0/XeYFU1D60Zq6xzXrznrv3L51bDl8fPXJmEGbflXl83S3MjeeHDzy\+9o3OLUe\+vdQvPQKAitqmDWs/fnxb5\+YXO\+9KrMyGb/gBuazy5U\+//FzJzPygNnTf0o/fPNL\+\+O3m4oXlkBkn71mx/rmVPyAw8sK\+REnIrbEwbmLJB3o982pXzGvpNFof\+fHO6rrauXDs4IeHvga44b6HVvyg\+E8mKK4l\+pfKl60NiTtfNnY/d/ctby32QuZxQVj6iLJ2EfHOCiz0bDv0wbO3dL6xsnZxxddd\+w4ePw/lP7n/59PWUQNwre6jCX51vnPf/i/Bszy0KZZ7rZT7KXz2yJuHdu8/FloybgCHHybM8ixe37Jp4gmZJq/85qd\+s3bXU9sOvd54277FvnLIZn72Xc80iV4Y1Uc0cgfVjpPJDd6rc6vLF/xsxYJW6zjw4s/mV0D36O\+LFraLm3OuOG/t\+udqP3yy8/1/2frQT/7/7d1vjCNnneDxxzpEP3nBuJBIXCjhXIQj9uwpdGUj0o7E0F4xrE3I0g5k1d5LtG0yYtpJOLWTrNQ\+XhzmDW2k49qr0zLNINIddNl27gLtW3ZphwvbzgZdG8hce4REV9BuXOFWcuUW4SIIuebe\+F7Y/XdcnulOu//V96N5M9Wuqqd\+Vc/z1K/\+PRvDIO1x7fJf921sd12/2LnG\+3f87aab4uC5p54\+V82\+\+v3Hx9a\+cfZWuXGycfefP/HwnVKK/r3Dxlv9LvXL7qyjZ/9\+8R3flt91StA9g9rjwda3nRS7rx70rC9din7h6U98//Ef3XwiOhS4L/bR9/zw5d\+d\+dj5ewJDmys7c/e5P/A/V/3xVz91x2LkQf3W365XXzb\+Rbz7Dx584B5F\+M//\+6c\+d/WZ7/70K5/onPlc\+5dfGv98TQhx\+x8/eHawVx0A7JPXE\+Br//j812d//Lsz55956sE7pBBC3vHHX/ri6Mu5V/7z1188n7\+\+5dr2rsv7Io898\+WvfPbAB408JIHh2Eff9\+Jbt0fP3SlFj9uzO178E0Lcdvvb1x7a/SNFv/ClB77/\+R\+8MnP5lU/mY4E7/3TuhTvOfT3/1aW1n/9aiPd86GMPPHHh4iMPn/WLa//YpzDO\+it/e/Wa\+ODog1tvy8i77ot99N3VH7/6N5sjWGz\+6SMPPHFhsfqN\+l43uo\+t7fUPP/wfnsk\+ObK/EzLnVz/5m5/9Ttx2/jNbF\+OHbj13PuL/0Q9f/bvqW8NbP3XfBf77/uKF/6XP/sf/9PzfGZ2BNM/c/cBTX3nmkU92j9LPFL4zdNtXZ5//0S9\+/mshxJkPn3v4yS9mL/R67lEZefTpB77/\+R8cyrNYd4w\+/YXRv8298t3/8o0L92W7e237C3JCCHHG/\+tr166/urQh8PHs0nc\+8OWvf/vFq7/4mRDi3Xd87KELX3rmkV6PFrscCVtrHPrwJ5762pce\+2S/M3v/Ry5\+6\+/vfPGviv/95doPn78qxHs\+dD756BNfeMTtPYgbHa73u1w68d938Vvfe0/\+y8\+9\+GNj7VdCDN1\+z\+eST3xl4v6AEOKOWOGF0see\+/bzL1df/cGL14S4bfhPnkpeePKzB/lBJiFO6D7qO9fb1Rdf/Sfx7nsePPehzUUoZz9zPvzsz6\+\+9PIbj32k7zXKHS8TCiGE\+NVBP1oSOD/z96U//PJXZ5//6S9\+JoT/9ns\+/YVHn5740/tuFded0O/cQcOPuhbSqr16TLfaf/f50Q9/55/EfbG7e1aEXgfbQD4kOfRvHvziI8/\+5NLPivlnP/ut8/tae9/G9rob7TvW\+J3Hdv7xZpviM//2yb9avuu5/Jcvf//nV/9ZvPvWu889/MifP3Hh451vAfTvHTaKdIP61at/v0GxbsqOU4KvdAYl2uvB1redvF6v\+tI19IEHL1549tX8z/7fzZZf3nrP5/QzL9fuefC\+W\+W2i1PKSO4H/\+0Pn738X1/86dp3l64Jcevdn3jswsQTj4z4hRBy15nP\+z700XMPf/QTn7nw6ehdJ/VLMcBp5/vN27/f0wxv/HL93nvvveHPLl\+\+HP3Uv9tvqfCOVJb/muAPmneC7J0tPXHYNUeFyB8VIn/4iPmAVJb/\+uLFi0ddCuA0uHLlyp13nd3TLF6/A4zT7P\+\+\+r0X/\+cb172TeeYD5x54\+KZuN\+EUcd546dvf\+99vXTddORt77NP7/nQzDhL76Og4b/7Di9/96f\+xd0/333Xu4YdHbqO5PFgc6oeO8wEA25AA4/S67dxnn7jZERBw2sk7Y0/\+ReyoS4F\+2EdHRwY//ujTHz/qUngGh/qh43wAwDZ8BRoAAAAA4AkkwAAAAAAATyABBgAAAAB4AgkwAAAAAMATBjgM0n6LBAAAAJxmDIMEHIjjNQwSFfuoXL58meAPmneC7J0tPXHYNUeFyB8VIn/4iPmAcKMIOEI8Ag0AAAAA8AQSYAAAAACAJ5AAAwAAAAA8gQQYAAAAAOAJJMAAAAAAAE8gAQYAAMAgObV8RI0WDEfYlXRYSxTNoy4RAM86/ATYXIgrvh60dMUWQgjHLGWiik9LlS33OZROy2kbpWxCV6VPquF4eqFqd\+ewqnPpeFiVPp8SjmfLliNEp\+2V2xci43OGs61kTq0QVXzhTLU70TaKG0vX45lizRZCWKWUuqssMjpnOEI4ZjmfjGjS51PC0VShYm1ftBDCrmYjUkYKG6u0a3OpiCZ9PqmGE/nKxsY6RjEd1RSfz6eEo5mS6WxbwFwyvH0J\+\+HUClHpu044U7GFEI5ZzsbDivT5FC2SXjA24uk23aoUEroqfT6p6snCZviPZtOOD/cjzSUyJ5ddzerbtlPV9HhmoWYfdbEghOjdggnX6uxYlblUNKz4fIoWSRUqmxXUrs4lu0tJZDZbWZfq3LPt3ZxBl9sa2O4MlXwirEqf1CLJbHHr2Lm\+IxBWKbmz9Q13Ow3Ruw1xzHJhq02e22yTb1ANd3cE\+3C8Iu/SwJ7KyLsEZ6Bd2AH1mwCAQ/Sbt3\+/p3\+vvfZa\+yZ885vfdPlLq7G\+urKysrKyPD814g/EZpZWVlZWVlZW6812u7EyEwsNx2Ihf3BiudFz/sbK1Mjw\+GK91W4sTw4HR2eW1xvNZn310lgwOL5Yb7Xb9aXxoH94cn613lhfnokFA7FL6612u7kyNRwcW6y7lWv90lhACDE8vdpqt9vtxtJEyB8an11er68vz46H/KHJ60rUXJ0ZDcUurbXazdXpkeDI1NJao9lsrM1PhIKdlW7/pV\+IodHZztTG8mTIPzy5uNZo1JenRwPB2Px6q91urk6P\+EPjl1brjfrq7FgwMDqz1mq32631\+YmR0GhsJODfWMK\+gt9urc2OBoJjs92gb1irN9vt1vrsaCAQm1mpNxpr8xMh//DUSrPtOr1VXxwLBkamltYbjfWlqeFAcGKpMehNOz76BNntSHOJzHHXZ0vbzdXp4cBId08262sr81OjAX9oYrF\+Ajbs5Ou3a9xaMLfqvDY7GgiMTi2u1uuri1Ob1bFVn9\+q5sszseHRmdWma3V2aXvbrfrS1GhoJDYa9A9PrW4dG532qFuYxanR4bHO73t3BPX5seBG\+7xd7zakuTI9HAiOzSyt1eur85MjgW5hblANd3cEJzzybg3s6Yy8S3AG2oUdUL95nPWN\+V601mZGAqOz6612c2Uy1Od0zCMOLLCA57322mt7zWcPPwHe1KrPxwKhHXluq76ytFJv1hfHgi4JcHNlaiQ0Nr/e6rSlwe65d7vdWr8UC4QmV5rtxvLEtpa1tX4pFhyZXm22m8uToZBbWt2qz4\+HQmMToxvdfGt9cXpyZqX769bazEhgc10b86zNjoZGZ9c65yqxYLffa7fbjaXxYHB8sbHtl7HQ8Pj4SLB7llBfHAsGxzf6vebq1HBgdHat1VieDG2euHROUToLba4tLa01mqvTw4EDSIBDmwXdbnsu02636/NjgdDEUsNtemt9drQT8O4mTwQDY/P11mA37fjolwD3PtJcIjPAMh6Mm02ANyfNjPi3thMD1G/XuLRgbtW8sTI7ObWZj3RasKVGu7U\+OxocnVlr7ly4S3V2a3vbrfXlpZV6c/3SaGB7AtxcnR7edamwM2fPjqBTlh6NRO82pLEyPzu/ujFzfX4sGJxYatygGl7XEbg4MZF3Cc7pjLxLcAbahR1Qv\+m\+wcdAn5g3lsZDwxOzsxOxkZFQMDQycWmt2W53zsI2T4E2/0cCvBMJMHBQ9pEAH693gKUWTUQ1Rbr93TEW8iWRyCbCsvNjzaqUa7YQwjGrFVOJxDUphBDbHqCSiqYKs2bYwrFtxzEW0hFN\+qSqJ/NbTyk7Zimbr0Vy2bi6sW4ZTubnslG18z/bNGypasr2spilfMGKZJO6FEKqkUTYqZaqVqcsJUPqUV3ZLHWuYMXz6ejG/LZZNR0tGu7\+X9GiYWlWDcsyDFvV9c5GCKnpumoZhuUIRU8kdFW6BuYg2IZhK5srF6oe0WzDMB2X6ZZRs6S\+tQ16NCyMqvnWcdy0Q9b7SHPZ6fZRlnQQFD2R0jfqAo6MSwvmVs3VaGaukAp3JjuWaTmqpkph16qWVK25RFjx\+aQWzRQNRwjHtTr3bnuFDMcTUW13JXesWs1WVCMf1TYe3O08VerSETiO41jlXEJXpU/Roulit/b0bkPUaCqTinS2366WijUZietK32rYoyPYh2MV\+d7BOZ2RdwvOW4PswlwWvsd\+8wS/\+yPtq6WimVyoVI3aXKSWyyycjjeZAJxyxysBvgGrWlgw9HSqm1kqkXQ\+LQr3v9fn891yNm3GC7m4JoUSjkdEpTBXsYRwjFI\+X37Ttm3bdhzbtmwRzc6VFvMJtZpLJOdqjhBCWOVcvqZnc3HNZb3lfL6iprPxbWdwdq1YqGqpTPc0R4ZT\+YxW\+tT7fT7fLR98qKpn891TGscoZgtmPL95QiSEcBzbkYqyed4gFVU6tv32b01bKFtptlRUKWz7oHsT\+/W//KP37nihK5KvOY5t245UNlcupKoI23Jsl\+lvdyZvboJUFOnY9m\+PdNOOBaf3keay051TFwOpamHFMa3TuXdPpK0WTLhU5x0fQzAWcgUrmk1HFMe2LfP1UkWkFmqN9VJaFtPJbMV2nN7V2aXtdT0QbNN682qppmRKRmNtIW7PJVPdNrkXx7Zs23LUZH6hOJ\+OOKVUIlO6wWUWx5iLSp/vvfcXRHpuLqnJftXwRh3BPhD5Q4y8S3B\+O8guzG3he\+w3T3JbKQN6Kh1VpRBKOBqWVs20j7pIAHBD7zrqAuyBVV2oONFCfONauVlMpwp2cn41E1etylwum0pp5XJG1xL5BSubTWm\+N6/5RyZS0ZBhCSm1VNlOdRcVj8d1GU0Uy0ZaVyu5XEXNlJOaYlevW6ldW8ikstVwoZSJKNsnF4uWnkl2yyKsciaVM6KXVrIJzakW89lsMqtVClFplnJ5Q88V4qowBhqdm6cEx7KFzMb9aSGEVMJheWyKd\+K5HGkJ/QjLdKgc4Qhxmm7pn2g7W7AbnWg7VjmXShed9EIpoXV2pQzEs9lURBNCyxSy5ehcqfZUsvfcsnfb2299Q6FkNpvUVSG0XCFd6bTJes9ZlGjBcArd/8Tj0XAykitWrERS7fXrzRIVykq1XCoWc4mEKJdSrj\+1yv06gn0g8kcVeRwqqarbMnrn9F3TBXAanaA7wFa1VJXxjSerOv8X8Vw2FdFULZLM5pKqUaoYjhBSi2aKVdNpt9t2NR8VzvYGukvRdFXahvVmJZ8rq5mN\+7W7VlnJJ\+JZIzpXXkju\+LtdK1WcSHLzlrBdK1XsSCaXioZVTU9kcumwVSkZtlXO5Wp6Np/QdixXSmXHzT/HthypqGf8miJs094\+WSjuT4Tvl9T06HYRXZVCKp1L0Zu/cixbKKqiuEw/oyjSsbaV1bYdRVH8R7tpx9DGkXatd2RO1cPfQojOg4iW1Pq8yoDDcl0L5lbNu0\+rLKSjyZLMFEvZzvsaUiqKlJt3w6SiaYpj2W3pVp1vpu3dIlVVkXJj6Yoa1qRj3uTdMKlomupYN3rQQKp6NJnOF8vFTLhWLBlu1dDp1xHsA5E//MjL3sHxD7ILc1v4HvtN2koAOFwnJwG2jXJNbL07I4TYeaFRCiGlEFIIx6wUN99AtKrFqhOORxTHKGbT\+c2BHWyzZjlS/Ve/Kld\+8uZLT91zi8/n873/z154/erX7r8lnKnYwjEW0qk5JV\+pFBK73l5zjGrV1uJbt4Sdzl2vrSvuUgghxVu1UuX111/4/Adv8fl8t5x9/KU3X3nqrBLJm1okLM3KxsATtlExHC0SVjU9rFi1WvfdZMesVi1V19/J62h7oIbDql2rdd/fcaxaxVTCuipdpqvhiOoYlY13WG2jYkgtqgXDx3DTDlfvI00J9I6MckSlHBTHLOYLRji5daUKR6RnC\+ZWzYWwK9lk1oiXKtsfdlH1iOYY1e5DjY5tmraiKopbde7d9roVUGp6WLE7b7AKIWzLMB3pfuHEqhTSWy8YOrZpWsL9CpJdyUbDia33EaUihOM4/t7VUBiuHcE\+EPkjibx0CU5wkF2Yy8L32G8qe97Y401K2X0USAjh3PhqCQAcumP1FeiuRo\+vQLfWZ0eDOz4321qfHwsGYjOrzc5/xkOBzjczm6vTw/5gbGZlfW1petQ/FBxfrLfb7cbSZHdsikZ9dX5y2B\+I7f4Gb2NxPLT5Fej5sVDIZYCC\+vzYtm8\+t9udgS8CI1PLjVa73aovTQ4Hhnd/arm1fikW3DEMUmhifq3RWF\+eHg10R3Bqrk6P\+INjl1brjfrK7LaxLDpLWBvkV6A7H9LuDtuwOj8eCnQ/I\+oyvVVfHN8YzmFtcXI40B0naqCbdnz0/TBm7yPNJTLH3c0Pg7S\+ujgzHhryd8ZrwcD1/xZx7xbMpTo3V6ZHgqOzuz863Glmg7GZ5fXG\+vJMLODv/rx3dXZpe7dWvfMr0O3m2sxoIDQ2u1JvrC9NjwQCsUvb2uRdHUFnvKCRqcWNoX52Dk23uw2pL44Hh4Jjs8vrjcba8sxYcCg0udy8qWq4rSNwccIif30Deyoj7xacgXZhB9RvHmd9O7uJbZ/MbixNhLrfML8U2wznyvSIXwT4CvT1\+Ao0cFBO\+jBIrbXZkaGd\+fnmGHnNlandY\+u2242VS5OxUGBICH9wZHxmaeOvzdXZWFAIIYYCG5/lb7fb7db60szYcGBICH9odHL\+ujOObb1vqz4f8\+\+6VuDfaK57DorUXJuf6ix8KDg8NrXY43xmWwLcbjfX5sdDna0Njs1uJgyt\+uLkSGfNgdHp5UY3XZ4I7izL0EifAXRukADvCrEQQojh6bVWu91qLE\+PBjobOzK5dXLiNr25OjvWKdhQaHwrngPctOOj7xHudqS5ROZ4u1ECvHPvhcZmV477\+dyp0a\+mu7dgvapzc2UqdH2j0DlCGyuzGwdzbHp5o/b3rM4ubW\+PpW9chWvVl6djIb8QQ4Hh8dmVRqvdryNorF6aHO3\+emymWxbXNqS5vjQ9NhLstsnTm23yDavhO0rDjlXk\+zSwpy/yfYIzwC7swPrN42vvCXC73VybnxwdDg0Ph4Zjk9Pjw8GxxToJ8C4kwMBB2UcC7PvN27/f3fv29cYv1\+\+9994b/uzy5csXL17c05JxUAj\+IfBOkL2zpScOu\+aoEPmjQuQPHzEfEAILHJQrV67cedfZPc1yct4BBgAAAADgHSABBgAAAAB4AgkwAAAAAMATSIABAAAAAJ5AAgwAAAAA8AQSYAAAAACAJwxwGKT9FgkAAAA4zRgGCTgQ\+xgG6V0DKgq1GgAAAABwrPAINAAAAADAE0iAAQAAAACeQAIMAAAAAPAEEmAAAAAAgCeQAAMAAAAAPIEEGAAAAADgCSTAAAAAAABPIAEGAAAAAHgCCTAAAAAAwBNIgAEAAAAAnkACDAAAAADwBBJgAAAAAIAnkAADAAAAADyBBBgAAAAA4AkkwAAAAAAATzjeCbBTy0fUaMFwjrogAAAAAICTbnAJsGOWi\+X\+qatjVYqlmj2wIhwkxyimdekLZ6pk4wAAAABwEg0sAXbMUiFfNOx\+v7EqhfxczT72GaVjljLxRMFUVL886rIAAAAAAPZnMAmwU8tHzz710tXnHnq/kiiaQjhGKRMPq9LnU7RIIl82HWEuxPU/\+x9XX/r8B5VowXAcs5RPRsKK9ClaJDVXtfotPKJFM5lEWNESCz0X7tTyES0\+17n/bJWSqk9Ll\+3OzIWoFi0YjlUppKK6KqWiRRKZzvoccy6uaqnSdet2ZDRXLheSGvkvAAAAAJxUg0mApZ4tLU\+EguNLDbuU1OxqLpUqyXTRaDQqed3MpzJFQ00VS1PDwdh83a5kNLOYzsw5qYWaWS/nwrVsMnt9GrqNXauYkUK1utB74aYaiShmxbCFELZRMZWQNGqGLYSwjIqlRiJKrZAtmPF8xbKMci5iFNL5ii2kEklls4mwsntzwvFElOQXAAAAAE60w/gIll1bKJl6JpeOaqqqJ3O5uKwWq\+b2J59lOFmsVBZSEU3VIslsWhe1qmn3Waaip1PxsKrI3gu3taguzIppC8esGjKaiohqzXKEZVRMqUfDwrYsR0hVVRQ1HM\+WjVohqgih6MlMOhEm1QUAAACA0\+dQEmDTchQtrHbzSkXTVWEZu179tY1yPqGr0ufz3XL28VfedJx\+rwZLNawq/Rau6NGwbVQt26pV7XA8HlftqmHbZqXmhOO6okYy2aiVi\+rRZKZQrNTMY/8eMgAAAADgnTmEBNhxdiWzPZJNq5hJZqtaplhrtNqt9UujwZu8C\+u6cFWPqla1ZlQrlhbRtXBEmtWaUa3Z4biuCKHo6aJhGeVcQq3NpSJ6PH9CvkYNAAAAANifQ0iApappim1u3vK1zZol1M17tp1JVcPR09lUNKxKYRsV07rJW7KuC5daJCLNcqlsKBFdVTQ97FTLpYqlRnVVCuFYpuVINRxNZhfK5bxulMrcBQYAAACA02xgCbCUUji2ZVm2LfVEVKkVcnMV0zKrC9l8WUSSUVV2fmKYtu34VOlYVcN2hF0r5hcsKR375oZHUlwWLhQtqjuVYsUJ65oUihbRrHKpJiMRTQrHKKaj0XTRcIQQjlGtmFLVFCnsWrEwV\+o/eDEAAAAA4EQaWAKs6Mm4\+tLj94STRVOJF0oLCXsuEX7/B\+M5M1IoLaQ0KWQ4mQwbX/sjLb4gHsomZfGh99/ie2\+ypOfmCimtnIym/\+F3N16R2nvhQqjhqGa/6WgRTRFCqHpEMV8XelRThJDhZGEu5cwlNOnz3XJPxorn8wlNOHZ1IZ8v7R682K5kwt1Xk9\+6\+pf33\+Lz\+cKZir27IAAAAACA48z3m7d/v6cZ3vjl\+r333jug0gAAAAAAcDOuXLly511n9zTLYXwFGgAAAACAI0cCDAAAAADwBBJgAAAAAIAnkAADAAAAADyBBBgAAAAA4AkkwAAAAAAATyABBgAAAAB4AgkwAAAAAMATSIABAAAAAJ5AAgwAAAAA8AQSYAAAAACAJ5AAAwAAAAA8gQQYAAAAAOAJJMAAAAAAAE8gAQYAAAAAeAIJMAAAAADAE0iAAQAAAACeQAIMAAAAAPAEEmAAAAAAgCeQAAMAAAAAPIEEGAAAAADgCSTAAAAAAABPIAEGAAAAAHgCCTAAAAAAwBNIgAEAAAAAnkACDAAAAADwBBJgAAAAAIAnkAADAAAAADzhXfuY58qVKwdeDgAAAAAABsr3m7d/f9RlAAAAAABg4HgEGgAAAADgCSTAAAAAAABPIAEGAAAAAHgCCTAAAAAAwBNIgAEAAAAAnkACDAAAAADwBBJgAAAAAIAnkAADAAAAADyBBBgAAAAA4AkkwAAAAAAATyABBgAAAAB4AgkwAAAAAMATSIABAAAAAJ5AAgwAAAAA8AQSYAAAAACAJ5AAAwAAAAA8gQQYAAAAAOAJJMAAAAAAAE8gAQYAAAAAeAIJMAAAAADAE0iAAQAAAACeQAIMAAAAAPCE/w8mCOMIedoQ2QAAAABJRU5ErkJggg==)

*圖 4\-8 CSR 交易查詢（上：交易 3 筆；下：退款 1 筆）*

### 4\.8\.1 畫面元素

__畫面元素__

__定位（id / name）__

__型態__

__預設值 / 初始狀態__

__說明__

頁面標題

h3

文字

查詢 new\-pay 交易紀錄 \(CSR Portal\)

門號

\#msisdn

文字輸入

0912345678

寬度 12

查詢

\#btnQuery

按鈕

查詢

提示

\.note

紅字

含退款紀錄與授權時間; OLS 交易可看到商品名稱\(PaymentDescription\)與商家資訊\(MerchantContact\)

結果區

\#result

區塊

請輸入門號查詢

查詢後為「交易表格 \+ <hr/> \+ Refunds: \+ 退款表格」

### 4\.8\.2 操作流程

1. 輸入門號按「查詢」：\#result 顯示 查詢中\.\.\.，$\.get\('/csr/data', \{msisdn\}\)。
2. Portal 轉呼叫 /csr/trans?msisdn=…；後端回「交易表格 HTML」\+ <hr/>Refunds: \+ 「退款表格 HTML」，一次回傳。
3. 頁面把整段插入 \#result：上方交易表格與其 total rows，一條水平線，文字 Refunds:，下方退款表格與其 total rows。

### 4\.8\.3 需求條文

__編號__

__需求描述__

P\-CSR\-01

初始狀態：門號 0912345678，\#result 顯示 請輸入門號查詢。

P\-CSR\-02

以門號與交易主檔 ACC\_ID 完全相符查詢（不做前綴、不做格式轉換）；查詢範圍涵蓋所有管道的交易，不限 OLS。

P\-CSR\-03

交易表格 8 欄，依序：TXID、AMOUNT、TX\_STATUS、TX\_DT、AUTH\_DT、MERCHANDIZE\_NAME、REFERENCE、RETURN\_CODE；依 TX\_DT 降冪（最新在最上）。

P\-CSR\-04

欄位對應：授權時間 = AUTH\_DT；PaymentDescription = MERCHANDIZE\_NAME（授權時截為 60 字）；MerchantContact = REFERENCE。

P\-CSR\-05

退款表格為 MWP\_PAY\_REFUND 全部 8 欄，依序：TXID、MERCHANT\_ID、AMOUNT、REFUND\_STATUS、REFUND\_DATE、CREATE\_TIME、RETURN\_CODE、RETURN\_MSG；條件為 TXID 屬於該門號的任一交易；無排序。

P\-CSR\-06

兩個表格各自適用 10 筆上限與各自的 total rows: N；結果區內因此有兩個 table 與兩個 total rows。

P\-CSR\-07

門號查無交易時，兩個表格皆為空表格 \+ total rows: 0，中間仍有 <hr/>Refunds:。有交易但無退款時，只有下方為空表格。

P\-CSR\-08

門號為空或格式不符（非 10 碼、含英文）時仍送出，結果為 0 筆，不提示。

P\-CSR\-09

TX\_STATUS、REFUND\_STATUS、RETURN\_CODE 以代碼原樣顯示；NULL 顯示 null（例如未取消的交易 RETURN\_CODE 為 null）。

P\-CSR\-10

錯誤處理同報表類：後端未啟動 → backend error: …；SQL 錯誤 → 第一段或第二段 query error: …（兩段 SQL 各自 try/catch，可能只有一段錯）。

### 4\.8\.4 後端介面

端點

GET /csr/trans?msisdn=<門號>

查詢語意

第一段：SELECT T\.TXID, T\.AMOUNT, T\.TX\_STATUS, T\.TX\_DT, T\.AUTH\_DT, T\.MERCHANDIZE\_NAME, T\.REFERENCE, T\.RETURN\_CODE FROM MWP\_PAY\_TRANS T WHERE T\.ACC\_ID=msisdn ORDER BY T\.TX\_DT DESC；第二段：SELECT \* FROM MWP\_PAY\_REFUND WHERE TXID IN \(SELECT TXID FROM MWP\_PAY\_TRANS WHERE ACC\_ID=msisdn\)

回應

<table …>交易</table><p>total rows: N1</p><hr/>Refunds:<table …>退款</table><p>total rows: N2</p>

# 5\. 介面規格

## 5\.1 Portal HTTP 端點總表

__Portal 端點__

__方法__

__參數__

__轉呼叫後端__

__未登入時回應__

/login

GET

—

—

（可開啟）

/doLogin

POST

username、password（必要）

—

（可呼叫）

/logout

GET

—

—

302 → /login

/

GET

—

—

302 → /login

/report

GET

type（預設 trans）

—

302 → /login

/recon、/tos、/bankacc、/csr

GET

—

—

302 → /login

/report/data

GET

type、from、to（必要）；merchantId、timeType

/sa/report/trans 或 /sa/report/refund

please login

/recon/data

GET

type、from、to（必要）

/sa/report/reconDaily 或 reconMonthly

please login

/recon/detail

GET

reconId（必要）

/sa/report/reconDailyDetail

please login

/tos/data

GET

merchantID（必要）

/sa/tos/query

\[\]

/tos/save

POST

merchantID、startDate、content（必要）；note

POST /sa/tos/save

please login

/bankacc/data

GET

merchantId（必要）

/cp/bankacc/list

\[\]

/bankacc/save

POST

merchantId、bankCode、bankAcc、currency（必要）；isDomestic（預設 Y）

POST /cp/bankacc/save

please login

/csr/data

GET

msisdn（必要）

/csr/trans

please login

所有資料端點正常與錯誤回應皆為 HTTP 200；只有缺必要參數（400）與方法不符（405）由 Spring MVC 回非 200。

## 5\.2 後端 API 總表（Portal 使用者）

__後端端點__

__方法__

__參數__

__回應型態__

__資料表__

/sa/report/trans

GET

from、to、merchantId?、timeType?

HTML 表格

MWP\_PAY\_TRANS

/sa/report/refund

GET

from、to

HTML 表格

MWP\_PAY\_REFUND ⋈ MWP\_PAY\_TRANS

/sa/report/reconDaily

GET

from、to

HTML 表格

MWP\_CP\_RECON\_DAILY\_SUMMARY

/sa/report/reconMonthly

GET

from、to

HTML 表格

MWP\_CP\_RECON\_MONTHLY\_SUMMARY

/sa/report/reconDailyDetail

GET

reconId

HTML 表格

MWP\_CP\_RECON\_DAILY\_DETAIL

/csr/trans

GET

msisdn

HTML 表格 ×2

MWP\_PAY\_TRANS、MWP\_PAY\_REFUND

/sa/tos/query

GET

merchantID

JSON 陣列

MWP\_OLS\_TOS

/sa/tos/save

POST

merchantID、startDate、content、note?

純文字 OK … / FAIL …

MWP\_OLS\_TOS

/getToS\.jsp

GET

merchantID?、version?

HTML 頁

MWP\_OLS\_TOS

/cp/bankacc/save

POST

merchantId、bankCode、bankAcc、currency、isDomestic?

純文字 OK / FAIL …

MWP\_MERCHANT\_BANK\_ACC

/cp/bankacc/list

GET

merchantId

JSON 陣列

MWP\_MERCHANT\_BANK\_ACC

__編號__

__需求描述__

P\-API\-01

HTML 表格類 API 的 Content\-Type 為 text/html;charset=UTF\-8；JSON 類為 application/json；純文字類（OK/FAIL）為 text/plain 或 text/html（Spring 依 String 回傳值決定），Portal 一律以字串轉送。

P\-API\-02

後端 API 之業務錯誤以 HTTP 200 回應：查詢錯誤回 query error: …，寫入錯誤回 FAIL …。路徑不存在（404）、缺必要參數（400）、方法不符（405）回對應狀態碼，Portal 轉為 backend error: …。

P\-API\-04

JSON 類 API 的鍵為資料表欄位名（大寫底線），數值欄（TOS\_VERSION）為 JSON 數字，其餘為字串；CLOB 欄（TOS\_CONTENT）轉為字串。

# 6\. 資料需求

以下僅列 Portal 功能使用之資料表與欄位。型態為 H2 Oracle 模式語法。

## 6\.1 資料表

### MWP\_PAY\_TRANS — 交易主檔（交易報表、CSR 查詢）

__欄位__

__型態__

__說明__

TXID

VARCHAR2\(15\) PK

交易序號 T\+毫秒

MERCHANT\_ID

VARCHAR2\(20\) NN

商家；OLS 交易為 E000001

ACC\_ID

VARCHAR2\(60\) NN

門號（CSR 查詢條件）

SERVICE\_ID

VARCHAR2\(20\)

OLS 為 SVC\_OLS\_001（報表不顯示）

CHANNEL

VARCHAR2\(10\)

OLS 為 0300（報表不顯示）

AMOUNT

NUMBER\(8,0\) NN

金額（元）

CURRENCY

VARCHAR2\(4\)

TWD

TX\_STATUS

VARCHAR2\(2\) NN

A 已授權 / D 已請款 / F 已取消（見 6\.2）

RETURN\_CODE、RETURN\_MSG

VARCHAR2\(32\) / \(128\)

取消時 RETURN\_CODE=Request Cancel；其餘 NULL

TX\_DT

VARCHAR2\(14\) NN

交易建立時間（授權當下）

AUTH\_DT

VARCHAR2\(14\)

OLS 授權時間（PurchaseTime 轉台灣時間）

BILL\_CSPTIME

VARCHAR2\(14\)

請款時間；未請款為 NULL（畫面 null）

MEMO

VARCHAR2\(64\)

OLS CorrelationId（例 C001）

MERCHANDIZE\_NAME

VARCHAR2\(60\)

PaymentDescription（截 60 字）

REFERENCE

VARCHAR2\(128\)

MerchantContact（例 dev@onlinestore）

MODIFY\_DATE

VARCHAR2\(14\)

（報表不顯示）

### MWP\_PAY\_REFUND — 退款檔（退款報表、CSR 查詢）

__欄位__

__型態__

__說明__

TXID

VARCHAR2\(15\) NN

原交易序號（無 PK，可多筆）

MERCHANT\_ID

VARCHAR2\(20\)

AMOUNT

NUMBER\(8,0\) NN

退款金額（批次退款 = 原交易金額）

REFUND\_STATUS

VARCHAR2\(2\) NN

批次退款寫入 D

REFUND\_DATE

VARCHAR2\(14\)

OLS 退款請求時間戳轉台灣時間（退款報表區間欄位）

CREATE\_TIME

VARCHAR2\(14\) NN

寫入時間

RETURN\_CODE、RETURN\_MSG

VARCHAR2\(32\) / \(128\)

批次退款寫入 00000000 / NULL

### MWP\_CP\_RECON\_DAILY\_SUMMARY — 每日對帳彙總

__欄位__

__型態__

__說明__

RECON\_ID

VARCHAR\(20\) PK

R\+yyyyMMdd

MERCHANT\_ID

VARCHAR2\(20\) NN

E000001

RECON\_RESULT\_SUMMARY

VARCHAR2\(1\)

Y 一致 / N 有差異

DIFF\_COUNT

NUMBER\(8,0\)

差異筆數

CP\_TX\_DT

VARCHAR2\(8\) NN

對帳日（查詢區間欄位）

CP\_TOTAL\_CONUT

NUMBER\(8,0\)

OLS 檔筆數（欄名依資料表定義）

NEWPAY\_TOTAL\_COUNT

NUMBER\(8,0\)

new\-pay 端筆數

CP\_FILE\_NAME

VARCHAR2\(80\)

OLS 對帳檔名

### MWP\_CP\_RECON\_MONTHLY\_SUMMARY — 每月對帳彙總

__欄位__

__型態__

__說明__

RECON\_ID

VARCHAR\(20\) PK

M\+yyyyMM

MERCHANT\_ID

VARCHAR2\(20\) NN

CP\_TX\_DT

VARCHAR2\(8\) NN

yyyyMM01

CP\_TOTAL\_CONUT、NEWPAY\_TOTAL\_COUNT

NUMBER\(8,0\)

CP\_DETAIL\_FILE\_NAME

VARCHAR2\(80\)

月對帳明細檔名

CP\_SUMMARY\_FILE\_NAME

VARCHAR2\(80\)

月拆帳總表檔名（目前批次不寫，為 NULL → 畫面 null）

### MWP\_CP\_RECON\_DAILY\_DETAIL — 每日對帳明細（差異明細查詢，20 欄）

__欄位__

__型態__

__說明__

RECON\_ID、RECON\_SEQ\_NUM、MERCHANT\_ID、BILLING\_AGREEMENT\_ID

批次識別；BILLING\_AGREEMENT\_ID = TELCO\_TW

CORRELATION\_ID、SQE\_NUM、TXID

OLS 單號、序號（排序鍵）、new\-pay 交易序號

STATUS

VARCHAR2\(128\)

OLS 狀態 Charged / Refunded，或 new\-pay 端補入的 D

ITEM\_PRICE、TAX、TOTAL\_AMOUNT、ROUND\_AMOUNT、CURRENCY

金額（micros 與四捨五入後元）

LAST\_EVENT、TIMESTAMP、EVENT\_RESPONSE、EVENT\_RESPONSE\_DESCRIPTION

OLS 事件資訊

CREATE\_TIME

VARCHAR2\(14\) NN

RECON\_RESULT、RECON\_MESSAGE

VARCHAR2\(3\) / \(80\)

比對結果代碼與訊息（6\.2）

### MWP\_OLS\_TOS — 服務條款（無 PK）

__欄位__

__型態__

__說明__

MERCHANT\_ID

VARCHAR2\(10\) NN

商家代碼（最長 10）

TOS\_VERSION

NUMBER\(8,0\) NN DEFAULT 1

版次，後端以 MAX\+1 產生

TOS\_URL

VARCHAR2\(256\) NN

系統產生 http://localhost:8099/getToS\.jsp?merchantID=&version=

TOS\_CONTENT

CLOB NN

條款內容

TOS\_NOTE

VARCHAR2\(1024\)

註記

TOS\_MODIFIED\_DATE

VARCHAR2\(14\) NN

存檔時間（系統）

TOS\_START\_DATE

VARCHAR2\(14\) NN

生效日期（使用者輸入值）

### MWP\_MERCHANT\_BANK\_ACC — 商家銀行帳戶（無 PK）

__欄位__

__型態__

__說明__

MERCHANT\_ID

VARCHAR2\(20\) NN

BANK\_CODE

VARCHAR2\(3\) NN

銀行代碼，最長 3

BANK\_ACC

VARCHAR2\(16\) NN

帳號，最長 16

CURRENCY

VARCHAR2\(4\)

NTD / USD

IS\_DOMESTIC

VARCHAR2\(1\) NN DEFAULT Y

Y 國內 / N 國外

STATUS

VARCHAR2\(2\)

W 待審 / A 已核准

## 6\.2 代碼表

__欄位__

__代碼__

__意義（產生時機）__

TX\_STATUS

A

Authorized：OLS Auth 成功時建立交易

D

Deducted：批次 Charge 成功，寫入 BILL\_CSPTIME

F

Failed/Cancelled：批次 Cancel 或 CancelOLSTX，RETURN\_CODE=Request Cancel

REFUND\_STATUS

D

批次 Refund 寫入（對帳時 I、D 皆視為有效退款）

RECON\_RESULT\_SUMMARY

Y / N

該日全部一致 / 至少一筆差異

RECON\_RESULT

000

Success

101～105

請款比對：No new\-pay mapping data / No OLS data / Status not match / Amount not match / Timestamp not match

201、202、204、205

退款比對：同上（無 203）

IS\_DOMESTIC

Y / N

國內 / 國外（畫面轉中文）

STATUS（銀行帳戶）

W / A

待 Finance 審核 / 已核准（本版次無審核功能，A 僅見於初始資料）

CURRENCY

TWD / NTD / USD

交易主檔 / 銀行帳戶新台幣 / 銀行帳戶美金

timeType（查詢參數）

tx / auth

交易時間 / 授權時間

type（查詢參數）

trans / refund；daily / monthly

報表類型；對帳類型（非指定值一律視為前者）

## 6\.3 初始資料

後端啟動時載入下列初始資料（重啟即還原）：

- MWP\_OLS\_TOS：I00000000 v1（global 預設條款）、E000001 v1。
- MWP\_MERCHANT\_BANK\_ACC：E000001 / 007 / 1234567890123456 / USD / N / A。
- MWP\_USER：0912345678（U0001 正常戶）、0922222222（預付）、0933333333（bar）、0944444444（Hybrid）。
- 交易、退款、對帳彙總表初始為空；Portal 報表查詢會得到 total rows: 0。

# 7\. 非功能需求

## 7\.1 執行環境與建置

__編號__

__需求描述__

P\-NFR\-01

Portal 以 Maven 建置，artifact com\.telco\.mwp:new\-pay\-portal，parent 為 monorepo 根目錄的 new\-pay\-parent（繼承 spring\-boot\-starter\-parent 2\.7\.18、java\.version=1\.8）。相依：spring\-boot\-starter\-web、spring\-boot\-starter\-thymeleaf。

P\-NFR\-02

執行：cd portal && mvn spring\-boot:run，監聽 server\.port=8098；spring\.thymeleaf\.cache=false（修改 template 不需重啟）。

P\-NFR\-03

Portal 啟動不依賴後端：後端未啟動時頁面仍可開啟、登入，只有查詢回 backend error:。

P\-NFR\-04

後端 server\.port=8099；Portal 與後端須部署於同一主機（後端位址為 localhost）。

P\-NFR\-05

Portal 不使用資料庫、不寫入檔案、無排程作業；唯一狀態為 HttpSession（記憶體內，重啟後需重新登入）。

## 7\.2 效能與可用性

__編號__

__需求描述__

P\-NFR\-06

本版次未訂定效能指標；查詢回應時間取決於後端。後端報表查詢不分頁（取得全部資料後輸出前 10 筆）。

P\-NFR\-07

轉呼叫不設定逾時（P\-COM\-17），不使用連線池。

P\-NFR\-08

前端以 jQuery 1\.12\.4 實作，頁面不使用 ES6 語法；以現代瀏覽器（Chromium 系）操作。

## 7\.3 已知限制

下列事項為本版次之已知限制，不屬功能需求；後續版次如需處理，應另行提出需求變更。

__項目__

__說明__

帳號管理

帳號密碼由 Portal 固定設定，未與目錄服務整合；密碼未加密儲存（P\-LGN\-01）

授權

登入後不依角色限制功能（P\-COM\-03）；後端 API 不要求認證，並允許所有來源之跨域請求

CSRF

表單與 POST 資料端點無 CSRF 防護

輸出轉義

報表欄位值與銀行帳戶清單未做 HTML 轉義（P\-COM\-25）

查詢參數

後端以字串組合查詢語句，未使用參數化查詢（P\-COM\-31）

錯誤訊息

query error:、backend error:、FAIL 回應含系統內部訊息（P\-COM\-15、P\-COM\-26）

傳輸

HTTP 明文，未使用 TLS

資料唯一性

MWP\_OLS\_TOS、MWP\_MERCHANT\_BANK\_ACC 無唯一鍵；同商家同版次條款、相同銀行帳戶可重複寫入

## 7\.4 可測試性

__編號__

__需求描述__

P\-NFR\-09

頁面元素以 HTML id 識別（見各頁面畫面元素表）；登入頁密碼欄以 name 識別。

P\-NFR\-10

Portal 僅依賴後端之 HTTP 介面（第 5\.2 節），不依賴後端內部狀態；後端可由提供相同介面之服務替代。

P\-NFR\-11

各頁面之可觀察狀態（結果區文字、區塊顯示／隱藏、按鈕可見性、訊息文字、表格列數、total rows）均可由畫面讀取，第 4 章需求無需存取資料庫即可驗證。

## 7\.5 設定項

__設定__

__值__

__說明__

server\.port（portal）

8098

有效

spring\.thymeleaf\.cache

false

有效

newpay\.backend\.url

http://localhost:8099

保留設定，本版次未使用；後端位址依 P\-COM\-14

後端位址

http://localhost:8099

程式常數（P\-COM\-14）

帳號表

sa/sa、cp/cp、csr/csr

程式常數（P\-LGN\-01）

# 8\. 本版次範圍外事項

下列事項於畫面提示或功能設計中已提及，但不在本版次提供範圍內。

__事項__

__說明__

角色授權

三個帳號可使用全部功能，不依角色限制（P\-COM\-03）

報表匯出 CSV

交易／退款報表畫面提示「其餘透過背景處理匯出CSV\(匯出功能尚未提供\)」；畫面僅顯示 10 筆（P\-COM\-22）

退款報表之商家與時間類型條件

退款報表隱藏此二欄位，查詢僅以退款時間區間為條件（P\-RFD\-01、P\-RFD\-02）

每月對帳差異明細

差異明細查詢僅支援每日對帳（P\-RCN\-08）

服務條款之商家名稱顯示

畫面僅顯示使用者輸入之商家代碼（P\-TOS\-13）

商家銀行帳戶審核

畫面提示「審核作業尚未提供，狀態先掛 W」；帳戶狀態維持 W（P\-BNK\-02）

# 附錄 A　畫面元素定位總表

各頁面畫面元素之識別碼（CSS selector）一覽。

__頁面__

__元素__

__Selector__

__備註__

login

帳號 / 密碼 / 登入 / 錯誤訊息

\#username / input\[name="password"\] / button\[type="submit"\] / form \.note:has\-text\("錯誤"\)

錯誤訊息只在失敗後存在；最後一個 \.note 是測試帳號提示

（共用）

導覽列 / 使用者 / 登出

\.topbar / \.topbar span / \.topbar a\[href="/logout"\]

首頁有兩個 span（帳號、角色）

index

三個功能區塊

\.box:nth\-of\-type\(1\.\.3\)、\.box a\[href="/tos"\] 等

以 href 定位最穩

report

標題 / 類型 / 日期起 / 時起 / 日期迄 / 時迄 / 商家 / 時間類型 / 查詢 / 結果

\#title / \#type / \#fromDate / \#fromHour / \#toDate / \#toHour / \#merchantId / \#timeType / \#btnQuery / \#result

\#transOnly 在退款報表隱藏

report / recon / csr

結果表格 / 資料列 / 總筆數

\#result table / \#result table tr:has\(td\) / \#result p

表頭列無 td；CSR 有兩個 table 與兩個 p

recon

類型 / 起 / 迄 / 查詢 / 結果 / RECON\_ID / 查明細 / 明細

\#type / \#from / \#to / \#btnQuery / \#result / \#reconId / \#btnDetail / \#detail

tos

商家 / 查詢 / 表單 / 版次 / 目前內容 / 編輯區 / 生效日 / 內容 / 註記 / 存檔 / 新版次 / 訊息

\#merchantID / \#btnQuery / \#form / \#verShow / \#curContent / \#editArea / \#startDate / \#content / \#note / \#btnSave / \#btnNewVer / \#msg

merchantID 大寫 D

bankacc

商家 / 銀行代碼 / 帳號 / 幣別 / 外國銀行 / 註冊 / 訊息 / 查詢清單 / 清單

\#merchantId / \#bankCode / \#bankAcc / \#currency / \#foreign / \#btnSave / \#msg / \#btnList / \#list

清單資料列 \#list table tr:has\(td\)

csr

門號 / 查詢 / 結果

\#msisdn / \#btnQuery / \#result

交易表 \#result table >> nth=0，退款表 nth=1

# 附錄 B　需求追溯矩陣

頁面 ↔ 後端 API ↔ 需求編號。

__頁面__

__後端 API__

__需求編號__

login

—

P\-LGN\-01 ～ 09；P\-COM\-01 ～ 06

index

—

P\-HOME\-01 ～ 05；P\-COM\-07 ～ 09

report?type=trans

/sa/report/trans

P\-RPT\-01 ～ 13；P\-COM\-20 ～ 28、33 ～ 36

report?type=refund

/sa/report/refund

P\-RFD\-01 ～ 07

recon（daily）

/sa/report/reconDaily、reconDailyDetail

P\-RCN\-01、02、04 ～ 12

recon（monthly）

/sa/report/reconMonthly

P\-RCN\-03、04、12

tos

/sa/tos/query、/sa/tos/save、/getToS\.jsp

P\-TOS\-01 ～ 18；P\-COM\-30 ～ 32

bankacc

/cp/bankacc/save、/cp/bankacc/list

P\-BNK\-01 ～ 14

csr

/csr/trans

P\-CSR\-01 ～ 10

（介接）

全部

P\-COM\-13 ～ 19；P\-API\-01 ～ 03

（非功能）

—

P\-NFR\-01 ～ 11

# 附錄 C　需求條文統計

__模組__

__名稱__

__條文數__

COM

共用

36

LGN

登入

9

HOME

首頁

5

RPT

交易報表

13

RFD

退款報表

7

RCN

對帳查詢

12

TOS

服務條款

18

BNK

銀行帳戶

14

CSR

CSR 查詢

10

API

後端介面

3

NFR

非功能

11

合計

138

