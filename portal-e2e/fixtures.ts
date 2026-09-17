import { test as base, createBdd } from 'playwright-bdd';
import { LoginPage } from './pages/LoginPage';
import { IndexPage } from './pages/IndexPage';
import { ReportPage } from './pages/ReportPage';
import { ReconPage } from './pages/ReconPage';
import { TosPage } from './pages/TosPage';
import { BankaccPage } from './pages/BankaccPage';
import { CsrPage } from './pages/CsrPage';

/**
 * 自訂 fixtures：每個 Page Object 一個，步驟定義直接解構使用。
 *
 * 新增頁面的做法（gen-test-code skill 會照這個模式）：
 *   1. pages/XxxPage.ts  extends BasePage
 *   2. 在下面 Fixtures 型別加一行、test.extend 加一個 fixture
 *   3. steps/xxx.steps.ts 從 '../fixtures' import { Given, When, Then }
 *
 * 測試帳號（帳號即角色）：sa/sa、cp/cp、csr/csr
 */
type Fixtures = {
  loginPage: LoginPage;
  indexPage: IndexPage;
  reportPage: ReportPage;
  reconPage: ReconPage;
  tosPage: TosPage;
  bankaccPage: BankaccPage;
  csrPage: CsrPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  indexPage: async ({ page }, use) => use(new IndexPage(page)),
  reportPage: async ({ page }, use) => use(new ReportPage(page)),
  reconPage: async ({ page }, use) => use(new ReconPage(page)),
  tosPage: async ({ page }, use) => use(new TosPage(page)),
  bankaccPage: async ({ page }, use) => use(new BankaccPage(page)),
  csrPage: async ({ page }, use) => use(new CsrPage(page)),
});

export const { Given, When, Then, Before, After } = createBdd(test);
