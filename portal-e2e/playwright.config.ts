import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

/**
 * 受測鏈：Playwright → Portal (8098, Spring Boot + Thymeleaf) → Mockoon 假後端 (8099)
 *
 * - Mockoon 由下面 webServer 自動啟動（取代真的 backend，Portal 的 BACKEND 寫死打 localhost:8099）。
 * - Portal 預設要你自己先起：cd ../portal && mvn spring-boot:run
 *   設 START_PORTAL=1 會由 Playwright 代為啟動（需要 JAVA_HOME 指到 JDK 8，升級後為 JDK 17+）。
 * - 設 BASE_URL 可測部署在別處的 Portal；設 NO_MOCK=1 可不啟動 Mockoon（例如要打真後端）。
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
    video: 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.CHROMIUM_PATH
          ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } }
          : {}),
      },
    },
  ],
  webServer: webServers.length ? webServers : undefined,
});
