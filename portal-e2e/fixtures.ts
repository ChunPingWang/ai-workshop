import { test as base, createBdd } from 'playwright-bdd';
import { BasePage } from './pages/BasePage';
import { BankaccPage } from './pages/BankaccPage';
import { CsrPage } from './pages/CsrPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ReconPage } from './pages/ReconPage';
import { ReportPage } from './pages/ReportPage';
import { TosPage } from './pages/TosPage';

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
	basePage: BasePage;
	loginPage: LoginPage;
	homePage: HomePage;
	reportPage: ReportPage;
	reconPage: ReconPage;
	tosPage: TosPage;
	bankaccPage: BankaccPage;
	csrPage: CsrPage;
};

export const test = base.extend<Fixtures>({
	basePage: async ({ page }, use) => use(new BasePage(page)),
	loginPage: async ({ page }, use) => use(new LoginPage(page)),
	homePage: async ({ page }, use) => use(new HomePage(page)),
	reportPage: async ({ page }, use) => use(new ReportPage(page)),
	reconPage: async ({ page }, use) => use(new ReconPage(page)),
	tosPage: async ({ page }, use) => use(new TosPage(page)),
	bankaccPage: async ({ page }, use) => use(new BankaccPage(page)),
	csrPage: async ({ page }, use) => use(new CsrPage(page)),
});

export const { Given, When, Then, Before, After } = createBdd(test);
