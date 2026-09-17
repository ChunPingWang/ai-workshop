import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly username = this.page.locator('#username');
  readonly password = this.page.locator('input[name="password"]');
  readonly submit = this.page.getByRole('button', { name: '登入' });

  async login(username: string, password = username) {
    await this.page.goto('/login');
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }

  async assertForm() {
    await expect(this.page).toHaveTitle('new-pay Portal 登入');
    await expect(this.username).toBeVisible();
    await expect(this.password).toBeVisible();
    await expect(this.submit).toBeVisible();
  }
}
