import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

/**
 * 受測鏈：Playwright → Portal (8098, Spring Boot + Thymeleaf) → Mockoon 假後端 (8099)
 *
 * - Mockoon 由下面 webServer 自動啟動（取代真的 backend，Portal 的 BACKEND 寫死打 localhost:8099）。
 * - Portal 預設要你自己先起：cd ../portal && mvn spring-boot:run
 *   設 START_PORTAL=1 會由 Playwright 代為啟動（需要 JAVA_HOME 指到 JDK 8，升級後為 JDK 17+）。
 * - 設 BASE_URL 可測部署在別處的 Portal；設 NO_MOCK=1 可不啟動 Mockoon（例如要打真後端）。
 * - 無法安裝 Playwright 自帶 Chromium 的環境：設 BROWSER_CHANNEL=msedge（或 chrome）改用系統瀏覽器，
 *   需 Edge/Chrome 主版號 ≥ 本版 Playwright 綁定的 Chromium 主版號；或用 CHROMIUM_PATH 直接指執行檔。
 */
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8098';
const MOCK_PORT = Number(process.env.MOCK_PORT ?? 8099);

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: ['steps/**/*.ts', 'fixtures.ts'],
  // 關鍵字英文（Given/When/Then）、句子中文；要改中文關鍵字加 language: 'zh-TW'
});

const webServers: NonNullable<Parameters<typeof defineConfig>[0]['webServer']> = [];

if (!process.env.NO_MOCK) {
  webServers.push({
    command: `node mockoon/build.js && npx mockoon-cli start --data mockoon/newpay-backend.json --port ${MOCK_PORT}`,
    url: `http://localhost:${MOCK_PORT}/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stdout: 'ignore',
    stderr: 'pipe',
  });
}

if (process.env.START_PORTAL) {
  webServers.push({
    command: 'mvn -q -f ../portal/pom.xml spring-boot:run',
    url: `${BASE_URL}/login`,
    reuseExistingServer: true,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
  });
}

export default defineConfig({
  testDir,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false, // Portal 用 HTTP session、Mockoon 無狀態，序列跑最單純
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
    // Portal 沒有 data-testid，selector 以 id 為主；這行保留給之後補 testid 用
    testIdAttribute: 'data-testid',
    trace: 'on',
    screenshot: 'on',
    // 錄影需要 Playwright 自帶的 ffmpeg（playwright install 下載）；
    // 用系統瀏覽器（裝不了 Chromium 的環境）時自動關閉，trace 內的逐步截圖仍在
    video: process.env.BROWSER_CHANNEL || process.env.CHROMIUM_PATH ? 'off' : 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // BROWSER_CHANNEL=msedge|chrome → 用系統已安裝的 Edge/Chrome（公司環境裝不了 Chromium 時用）
        ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}),
        ...(process.env.CHROMIUM_PATH
          ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } }
          : {}),
      },
    },
  ],
  webServer: webServers.length ? webServers : undefined,
});
