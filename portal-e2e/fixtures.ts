import { test as base, createBdd } from 'playwright-bdd';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { CsrPage } from './pages/CsrPage';
import { ReportPage } from './pages/ReportPage';
import { ReconPage } from './pages/ReconPage';
import { TosPage } from './pages/TosPage';
import { BankaccPage } from './pages/BankaccPage';

/**
 * 自訂 fixtures：每個 Page Object 一個，步驟定義直接解構使用。
 *
 * 新增頁面的做法：
 *   1. pages/XxxPage.ts  extends BasePage
 *   2. 在下面 Fixtures 型別加一行、test.extend 加一個 fixture
 *   3. steps/xxx.steps.ts 從 '../fixtures' import { Given, When, Then }
 *
 * 測試帳號（帳號即角色）：sa/sa、cp/cp、csr/csr
 */
type Fixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  csrPage: CsrPage;
  reportPage: ReportPage;
  reconPage: ReconPage;
  tosPage: TosPage;
  bankaccPage: BankaccPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  csrPage: async ({ page }, use) => {
    await use(new CsrPage(page));
  },
  reportPage: async ({ page }, use) => {
    await use(new ReportPage(page));
  },
  reconPage: async ({ page }, use) => {
    await use(new ReconPage(page));
  },
  tosPage: async ({ page }, use) => {
    await use(new TosPage(page));
  },
  bankaccPage: async ({ page }, use) => {
    await use(new BankaccPage(page));
  },
});

export const { Given, When, Then, Before, After } = createBdd(test);
