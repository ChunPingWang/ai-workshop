import { Page, Locator, expect } from '@playwright/test';

/**
 * 所有 Portal 頁面共用：頂部導覽列、登入狀態、ajax 結果區。
 *
 * Portal 是 Thymeleaf + jQuery 1.12 的老頁面，沒有 data-testid，
 * selector 以 id（#result、#btnQuery…）與可見文字為主；新增頁面時把 id 集中寫在 Page Object，不要散在 steps 裡。
 */
export class BasePage {
  readonly topbar: Locator;

  constructor(readonly page: Page) {
    this.topbar = page.locator('.topbar');
  }

  /** 頂部導覽列連結，例如 nav('交易報表') */
  nav(text: string): Locator {
    return this.topbar.getByRole('link', { name: text, exact: true });
  }

  async gotoNav(text: string) {
    await this.nav(text).click();
  }

  /** 頂部顯示的登入者，例如 "sa" */
  async loggedInUser(): Promise<string> {
    return (await this.topbar.locator('span').first().textContent())?.trim() ?? '';
  }

  /**
   * 等 ajax 結果區把「查詢中...」換掉。
   * Portal 每個查詢頁都是先寫 '查詢中...' 再用回應覆蓋 #result / #detail。
   */
  async waitForResult(container: Locator) {
    await expect(container).not.toHaveText(/查詢中/, { timeout: 10_000 });
  }
}
