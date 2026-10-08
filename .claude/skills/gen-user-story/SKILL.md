---
name: gen-user-story
description: 讀 docs/new-pay_Portal_SRS.docx（需求規格書，先轉成 Markdown），對照 portal 原始碼，產出 docs/user-stories.md 與 Word 交付檔 user-stories.docx——含 User Story、驗收條件（對應 SRS 需求條文編號 P-xxx-nn）、實作狀態與需求追溯矩陣。用在「產生 User Story」「從 SRS 產需求故事」「需求追溯」「列出驗收條件」「User Story 轉 Word」。
---

# gen-user-story：從 SRS 產出 User Story 與需求追溯矩陣

## 目標

把 `docs/new-pay_Portal_SRS.docx`（唯一的需求來源；舊的 `new-pay_OnlineStore_FSD.md` 已降級為背景資料，**不要讀**）轉成可追溯的 User Story 清單：

1. `docs/new-pay_Portal_SRS.md` —— SRS 的 Markdown 版（轉檔產物，入版控；之後所有 skill 都讀這份，不再碰 docx）
2. `docs/user-stories.md` —— User Story 清單 + 需求追溯矩陣（後續 skill 的輸入、diff 的依據）
3. `docs/user-stories.docx` —— 同內容的 Word 版（給主管／客戶審閱的交付檔，由 md 轉出，md 改了就重轉）

這是 workshop SDLC 流程的第一站。評量標準是**追溯完整**：SRS 第 4 章的每一條需求條文（`P-<模組>-<nn>`）都必須被某個 US 的驗收條件涵蓋，或被明確列進「不納入」清單——不能有條文憑空消失。

## 讀哪些東西（依序）

| 來源 | 看什麼 |
|---|---|
| `docs/new-pay_Portal_SRS.md`（第 1 步轉出來的） | 1.5 需求編號規則；2.3 使用者角色、2.4 功能總覽；第 3 章共用需求（P-COM-*）；第 4 章各功能的畫面元素／操作流程／需求條文；第 8 章範圍外事項 |
| SRS 第 5、6 章（介面規格、資料需求） | 不獨立成 US；寫驗收條件時當佐證（端點、欄位、代碼表） |
| `portal/src/main/resources/templates/*.html`、`PortalController.java` | 只為了填「實作狀態」欄：條文描述的東西畫面上到底有沒有、行為是否相符。**不要**因為程式沒做就刪掉條文對應的 US——標「未實作」即可 |
| `docs/user-stories.md`（若已存在） | 增量更新，沿用既有 US 編號，不要重編 |

## 流程

### 1. 轉檔（docx → md）

```bash
npx -y mammoth docs/new-pay_Portal_SRS.docx --output-format=markdown > docs/new-pay_Portal_SRS.md
```

- 用 mammoth 而不是 pandoc：學員機器一定有 Node（portal-e2e 的前提），不必額外安裝。
- mammoth 會把標點跳脫成 `4\.1` 這種形式，讀起來無礙，不必清理；grep 條文編號時用 `P\\-LGN` 這種帶跳脫的 pattern。
- SRS docx 有改版時重跑這一步即可；md 是產物但**入版控**（讓 diff 與後續 skill 都好做）。

### 2. 盤點條文

列出全部 `P-<模組>-<nn>` 條文編號。mammoth 會把連字號跳脫成 `P\-LGN\-01`，用這組指令（已驗證）：

```bash
# 全部條文（去跳脫、去重）
grep -oE 'P\\?-[A-Z]+\\?-[0-9]+' docs/new-pay_Portal_SRS.md | tr -d '\\' | sort -u
# 各模組條文數
grep -oE 'P\\?-[A-Z]+\\?-[0-9]+' docs/new-pay_Portal_SRS.md | tr -d '\\' | sed -E 's/P-([A-Z]+)-.*/\1/' | sort | uniq -c
```

這份清單就是追溯矩陣的母體。先告訴使用者總共幾條、分布在哪些模組，再往下做。

### 3. 產 User Story

分模組寫（COM／LGN／HOME／RPT／RFD／RCN／TOS／BNK／CSR），每個模組一節。切分原則：

- 一個 US = 一個使用者能獨立完成、獨立驗收的目標（「查詢交易報表」是一個 US；「小時下拉有 24 個選項」不是 US，是某個 US 的驗收條件）。
- 角色用 SRS 2.3 的定義（SA／CP／CSR／未登入訪客）；共用需求（P-COM-*）的角色多半是「任何已登入使用者」或「未登入訪客」。
- 寬度抓在「一個模組 2〜5 個 US」：查詢類頁面通常拆成「初始畫面與輸入」「執行查詢看結果」「異常與邊界」；維護類（tos／bankacc）再加「建立／存檔」。

每個 US 的格式：

```markdown
### US-RPT-01 查詢交易報表
**身為** SA／CP 人員，**我想要** 依日期區間與商家查詢交易報表，**以便** 掌握交易狀況。

| | |
|---|---|
| SRS 章節 | 4.3 |
| 涵蓋條文 | P-RPT-01, P-RPT-02, P-RPT-05〜P-RPT-08 |
| 實作狀態 | 已實作 |
| 優先級 | 高 |

**驗收條件**
- AC1（P-RPT-01, P-RPT-02）：開啟交易報表頁，日期預設今天、起訖小時 00／23、商家預設 E000001。
- AC2（P-RPT-05）：按查詢後結果區先顯示「查詢中...」，再被查詢結果覆蓋。
- AC3（P-RPT-07）：查詢結果為表格，最多顯示 10 列，底部顯示 total rows: N（N 為全部筆數）。
```

- **每條 AC 都要括號標注它涵蓋的條文編號**——這是追溯矩陣的資料來源，不能省。
- AC 寫「可從畫面觀察」的粗粒度行為（Given/When/Then 的語氣但不必嚴格三段式）；selector、SQL 等細節留給 gen-gherkin。
- 條文描述的是「現況即使像 bug」的行為（SRS 把很多技術債如實寫進條文，例如沒有前端驗證、錯誤時畫面無反應），AC 照寫並在句尾加 `（現況如此）`——這些之後會變成 `@legacy` 情境，不要「順手修正」成理想行為。

### 4. 標實作狀態

對照 template 與 controller 快掃一輪，每個 US 填一個狀態：

- **已實作**：條文描述的行為在程式裡都找得到。
- **未實作**：SRS 有寫、程式沒做（例如條文或範圍外清單提到的匯出 CSV、Finance 審核）。這種 US 照樣要列，狀態標未實作，後面的測試階段會列入「不測」清單。
- **現況與條文不符**：程式行為跟條文對不上。把差異寫成一行備註。這是學員最該停下來看的訊號——要嘛 SRS 要修，要嘛這是升級前就該知道的 bug。

### 5. 追溯矩陣與完整性自檢

`user-stories.md` 文末附兩張表：

```markdown
## 需求追溯矩陣
| 條文 | US | 備註 |
|---|---|---|
| P-LGN-01 | US-LGN-01 | |
| P-LGN-08 | —— | 不納入：條文本身即「不提供」聲明 |

## 不納入 User Story 的條文
| 條文／章節 | 原因 |
|---|---|
| P-API-*（5.2） | 後端介面規格，為 AC 之佐證，不是使用者目標 |
| P-NFR-*（第 7 章） | 非功能需求，不以 US 承載 |
| 第 8 章範圍外事項 | SRS 已明示本版次不做 |
```

自檢：步驟 2 盤點的每一條編號，必須出現在「矩陣」或「不納入」其中一張表。少一條就是漏，回頭補。

```bash
# 逐條檢查（實測過的寫法）
grep -oE 'P\\?-[A-Z]+\\?-[0-9]+' docs/new-pay_Portal_SRS.md | tr -d '\\' | sort -u | \
  while read id; do grep -q "$id" docs/user-stories.md || echo "缺: $id"; done
```

注意：**「不納入」表也要逐條列出編號，不要用範圍寫法**（`P-NFR-01～11` 會讓逐條自檢誤報缺漏）。

### 6. 產出 Word 交付檔

```bash
npx -y markdown-docx -i docs/user-stories.md -o docs/user-stories.docx
```

- 同樣 Node-only、免安裝（與 mammoth 一進一出）；表格（US 屬性表、追溯矩陣）、標題層級、粗體都會保留。
- docx 是 md 的轉出產物：**內容永遠改 md、改完重轉**，不要直接編輯 docx 再回填。
- 快速驗證：`npx -y mammoth docs/user-stories.docx --output-format=markdown | head` 能轉回文字即正常。

### 7. 回報

- US 總數（分模組）、涵蓋條文數／條文總數（要 100%，含不納入）
- 實作狀態統計：已實作幾個、未實作幾個、不符幾個（不符的逐條列差異）
- 建議下一步：執行 `/gen-gherkin`（它會以 user-stories.md 的 US／AC 為「要測什麼」的骨架，再對照程式碼補「怎麼測」）

## 不要做

- 不要讀 `new-pay_OnlineStore_FSD.md`（已被 SRS 取代；兩者矛盾時一律以 SRS 為準）。
- 不要改 `portal/`、`backend/`、`portal-e2e/`——這一站只產需求層文件。
- 不要因為程式沒實作就略過條文；也不要替 SRS「補需求」——程式有、SRS 沒有的行為，記在回報的「SRS 可能缺漏」清單給使用者，不要自己發明條文編號。
- 不要把 AC 寫到 selector／HTTP 參數那麼細——那是 gen-gherkin 的工作。
