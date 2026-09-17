---
name: upgrade-springboot
description: 把 portal 模組從 Spring Boot 2.7.18 / JDK 8 升級到 Spring Boot 4.1.1 / JDK 17+（脫離 monorepo 共用 parent、web→webmvc starter、javax→jakarta），並用 portal-e2e 的 Playwright 測試當升級前後的安全網。用在「升級 spring boot」「portal 升到 4.x」「jakarta 遷移」。
---

# upgrade-springboot：portal → Spring Boot 4.1.1

## 目標與範圍

- **只升 `portal/`**。`backend/` 維持 Spring Boot 2.7.18 + JDK 8 不動（真實世界的逐模組升級情境）。
- 升級前後都用 `portal-e2e` 的同一套 e2e 驗證，使用者看得到的行為必須完全一致。
- 版本目標：Spring Boot **4.1.1**（Spring Framework 7.x、Jakarta EE 11、Java 17+）。

## 前置檢查（缺一不可，缺了就停下來跟使用者說）

1. `git status` 乾淨，或至少 `portal/` 沒有未提交的修改；建議開分支 `git switch -c upgrade/portal-sb4`。
2. 升級前基線：`portal-e2e` 已對「舊版 portal」跑過一次全綠。沒有就請使用者先跑（見 portal-e2e/README.md），把結果（幾個 passed）記下來。
3. 本機有 JDK 17 或 21：`ls ~/.sdkman/candidates/java/` 或 `/usr/libexec/java_home -V`。沒有就 `sdk list java` 挑一個 17/21 的 LTS（例如 zulu）`sdk install`，**不要移除 JDK 8**，backend 還要用。
4. Maven 能連到 Maven Central（公司網路若走 Nexus/Artifactory，確認 `~/.m2/settings.xml` 的 mirror 有 4.1.1）。

## 步驟

### 1. `portal/pom.xml`：脫離共用 parent、換 starter

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.1.1</version>
    <relativePath/>
</parent>

<groupId>com.telco.mwp</groupId>          <!-- 原本從 new-pay-parent 繼承，現在要自己宣告 -->
<artifactId>new-pay-portal</artifactId>
<version>0.0.1-SNAPSHOT</version>

<properties>
    <java.version>17</java.version>        <!-- 或 21 -->
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>

<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webmvc</artifactId>   <!-- 4.0 起 starter-web 拆成 webmvc -->
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-thymeleaf</artifactId>
    </dependency>
</dependencies>
```

`spring-boot-maven-plugin` 保留；若有 `<loaderImplementation>CLASSIC</loaderImplementation>` 要拿掉（這個專案沒有）。

### 2. 根目錄 `pom.xml`：把 portal 移出 modules

根 pom 的 parent 仍是 2.7.18 / JDK 8，若保留 `<module>portal</module>`，在根目錄用 JDK 8 跑 `mvn` 會因 portal 需要 17 而失敗。
把 `<module>portal</module>` 拿掉並留註解：

```xml
<modules>
    <module>backend</module>
    <!-- portal 已升級 Spring Boot 4.x / JDK 17，獨立建置：mvn -f portal/pom.xml ... -->
</modules>
```

### 3. 程式碼：javax → jakarta

```bash
grep -rn "javax\." portal/src/main/java
```

`PortalController.java` 的 `import javax.servlet.http.HttpSession;` → `import jakarta.servlet.http.HttpSession;`。
其他 import（`org.springframework.*`、`RestTemplate`）在 Framework 7 仍存在，不用動。
`@RequestParam String username` 這種靠參數名稱綁定的寫法需要編譯器 `-parameters`，Boot 4 的 starter-parent 已預設開啟，不用自己加。

### 4. 設定檔

`application.properties` 目前只有 `server.port`、`spring.thymeleaf.cache`、一個沒人讀的 `newpay.backend.url`，4.x 都還認得。
若要保險，暫時加 runtime 依賴 `spring-boot-properties-migrator`，啟動時它會列出被改名／移除的屬性，確認沒警告後再拿掉。

### 5. 編譯、啟動、冒煙

```bash
export JAVA_HOME=~/.sdkman/candidates/java/<17-or-21>
cd portal
mvn -q -DskipTests package                 # 先確定編得過
mvn spring-boot:run                        # 起在 8098
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8098/login   # 期望 200
```

啟動 log 要看到 `Spring Boot :: (v4.1.1)` 與 Tomcat 11（Jakarta Servlet 6.1）。

### 6. 用 e2e 驗證升級

Portal 跑著的狀態下：

```bash
cd portal-e2e
npm test
```

通過數要**等於升級前基線**。任何失敗先看 trace，區分是：
- 升級真的改了行為（例如 404 頁面、trailing slash、重導向格式）→ 修 portal 讓行為回到原樣，這是升級的重點產出；
- 測試本身脆弱（selector、時序）→ 才回頭調測試，並說明原因。

### 7. 收尾

- 更新 `README.md` 的技術棧表（portal 那列改成 JDK 17+ / Spring Boot 4.1.1）與啟動指令的 `JAVA_HOME`。
- `TECH_DEBT_NOTES.md` 若有列「Spring Boot 2.7 EOL」相關項目，標記已處理。
- `git add -A && git commit -m "portal: upgrade to Spring Boot 4.1.1 / JDK 17, verified by portal-e2e"`。

## 常見坑

| 症狀 | 原因／處理 |
|---|---|
| `package javax.servlet does not exist` | 步驟 3 沒改完，`grep -rn "javax\."` 再掃一次 |
| `Cannot find artifact spring-boot-starter-web:4.1.1` | 4.0 起改名 `spring-boot-starter-webmvc` |
| `Unsupported class file major version` / `invalid target release: 17` | `JAVA_HOME` 還指著 JDK 8 |
| `@RequestParam` 綁不到、報 `Name for argument not specified` | 沒用 starter-parent 又沒開 `-parameters` |
| 根目錄 `mvn` 失敗 | 步驟 2 沒把 portal 移出 modules |
| 靜態資源 404 | `src/main/resources/static` 路徑 4.x 沒變，多半是 `mvn clean` 沒做、舊 target 殘留 |
| e2e 的登入失敗情境 URL 變了 | Framework 7 對表單 POST 回 view 的行為沒變，若變成 redirect 代表有人改了 controller |

## 不要做

- 不要動 `backend/`。
- 不要為了讓測試過而改 `portal-e2e/features`；feature 是行為契約。
- 不要順手重構 PortalController（那是另一堂課的 technical debt 練習），這次只做「升級後行為不變」。
