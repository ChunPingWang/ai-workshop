import { Locator, Page } from '@playwright/test';
import { BasePage, ButtonSpec } from './BasePage';

/** login.html：帳號 #username、密碼只有 name=password（無 id） */
export class LoginPage extends BasePage {
  readonly path = '/login';
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  /** th:if="${err}" 的錯誤訊息，只有登入失敗後才存在 */
  readonly error: Locator;
  /** 最後一個 .note：測試帳號提示 */
  readonly hint: Locator;

  protected readonly fields: Record<string, string> = {
    帳號: '#username',
    密碼: 'input[name="password"]',
  };
  protected readonly buttons: Record<string, ButtonSpec> = {
    登入: { selector: 'button[type="submit"]', navigation: true },
  };

  constructor(page: Page) {
    super(page);
    this.username = page.locator('#username');
    this.password = page.locator('input[name="password"]');
    this.submit = page.locator('button[type="submit"]');
    this.error = page.locator('form p.note').filter({ hasText: '帳號或密碼錯誤' });
    this.hint = page.locator('form p.note').last();
  }

  async open() {
    await this.page.goto(this.path);
  }

  async fill(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
  }

  async submitForm() {
    await this.submit.click();
    await this.page.waitForLoadState();
  }

  async login(username: string, password: string) {
    await this.open();
    await this.fill(username, password);
    await this.submitForm();
  }
}
