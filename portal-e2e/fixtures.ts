import { test as base, createBdd } from 'playwright-bdd';

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
type Fixtures = Record<string, never>;

export const test = base.extend<Fixtures>({});

export const { Given, When, Then, Before, After } = createBdd(test);
