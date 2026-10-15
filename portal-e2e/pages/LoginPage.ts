import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly username: Locator;
  readonly password: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.username = page.locator('#username');
    this.password = page.locator('[name="password"]');
    this.submitButton = page.getByRole('button', { name: '登入', exact: true });
    this.errorMessage = page.getByText('帳號或密碼錯誤', { exact: true });
  }

  async open() {
    await this.goto('/login');
  }

  async login(username: string, password: string) {
    await this.open();
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submitButton.click();
    await expect(this.page).toHaveURL(/\/(?:;jsessionid=[^/?#]+)?$/);
    await this.goto('/');
    await expect(this.page.locator('h3')).toHaveText('功能選單');
    await expect(this.page.locator('.topbar')).toContainText(username);
  }

  async submitCredentials(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submitButton.click();
  }

  async expectEmptyCredentials() {
    await expect(this.username).toHaveValue('');
    await expect(this.password).toHaveValue('');
  }

  async submitWithEnter(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.password.press('Enter');
    await expect(this.page.locator('h3')).toHaveText('功能選單');
  }
}