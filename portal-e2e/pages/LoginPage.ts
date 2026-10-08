import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** /login：傳統表單 POST /doLogin，成功 redirect 到 /，失敗回同頁顯示 .note 錯誤（US-LGN-*） */
export class LoginPage extends BasePage {
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    super(page);
    this.username = page.locator('#username');
    this.password = page.locator('input[name="password"]');
    this.submit = page.getByRole('button', { name: '登入' });
    // 錯誤訊息跟「測試帳號: ...」提示都是 .note，用文字鎖定錯誤那一個；th:if 不成立時元素不存在
    this.error = page.locator('form .note', { hasText: '錯誤' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }
}
