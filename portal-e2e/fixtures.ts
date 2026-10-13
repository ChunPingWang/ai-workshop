import { test as base, createBdd } from 'playwright-bdd';
import { LoginPage } from './pages/LoginPage';
import { IndexPage } from './pages/IndexPage';
import { ReportPage } from './pages/ReportPage';
import { ReconPage } from './pages/ReconPage';
import { TosPage } from './pages/TosPage';
import { BankaccPage } from './pages/BankaccPage';
import { CsrPage } from './pages/CsrPage';
import { Portal } from './pages/Portal';

/**
 * 自訂 fixtures：每個 Page Object 一個，步驟定義直接解構使用。
 *
 * 新增頁面的做法（gen-test-code skill 會照這個模式）：
 *   1. pages/XxxPage.ts  extends BasePage
 *   2. 在下面 Fixtures 型別加一行、test.extend 加一個 fixture；並在 pages/Portal.ts 註冊
 *   3. steps/xxx.steps.ts 從 '../fixtures' import { Given, When, Then }
 *
 * portal：跨頁協調者（依網址判斷目前頁面、記錄請求、攔截 ajax），共用步驟用它；
 * 各頁 fixture 與 portal 內的實例是同一個物件。
 *
 * 測試帳號（帳號即角色）：sa/sa、cp/cp、csr/csr
 */
type Fixtures = {
  portal: Portal;
  loginPage: LoginPage;
  indexPage: IndexPage;
  reportPage: ReportPage;
  reconPage: ReconPage;
  tosPage: TosPage;
  bankaccPage: BankaccPage;
  csrPage: CsrPage;
};

export const test = base.extend<Fixtures>({
  portal: async ({ page, browser }, use) => use(new Portal(page, browser)),
  loginPage: async ({ portal }, use) => use(portal.login),
  indexPage: async ({ portal }, use) => use(portal.index),
  reportPage: async ({ portal }, use) => use(portal.report),
  reconPage: async ({ portal }, use) => use(portal.recon),
  tosPage: async ({ portal }, use) => use(portal.tos),
  bankaccPage: async ({ portal }, use) => use(portal.bankacc),
  csrPage: async ({ portal }, use) => use(portal.csr),
});

export const { Given, When, Then, Before, After } = createBdd(test);
