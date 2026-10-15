import { Page, Locator, expect } from '@playwright/test';

/**
 * 所有 Portal 頁面共用：頂部導覽列、登入狀態、ajax 結果區。
 *
 * Portal 是 Thymeleaf + jQuery 1.12 的老頁面，沒有 data-testid，
 * selector 以 id（#result、#btnQuery…）與可見文字為主；新增頁面時把 id 集中寫在 Page Object，不要散在 steps 裡。
 */
export class BasePage {
  readonly topbar: Locator;
  readonly logoutLink: Locator;

  constructor(readonly page: Page) {
    this.topbar = page.locator('.topbar');
    this.logoutLink = this.topbar.getByRole('link', { name: '登出', exact: true });
  }

  async goto(path: string) {
    await this.page.goto(path);
  }

  async expectHeading(text: string) {
    await expect(this.page.locator('h3').first()).toContainText(text);
  }

  async expectBodyText(text: string) {
    await expect(this.page.locator('body')).toContainText(text);
  }

  async expectBodyNotToContain(text: string) {
    await expect(this.page.locator('body')).not.toContainText(text);
  }

  async expectMerchantValue(value: string) {
    const field = this.page.locator('#merchantId:visible, #merchantID:visible');
    await expect(field).toHaveCount(1);
    await expect(field).toHaveValue(value);
  }

  async expectMessageEmpty() {
    await expect(this.page.locator('#msg')).toBeEmpty();
  }

  async expectLogoutLinkVisible() {
    await expect(this.logoutLink).toBeVisible();
  }

  async expectResultAreaContains(areaName: string, text: string) {
    const result = areaName === '差異區' ? this.page.locator('#detail') : this.page.locator('#result');
    await expect(result).toContainText(text);
  }

  async clickQueryAndWait() {
    const result = this.page.locator('#result');
    await this.page.locator('#btnQuery').click();
    await this.waitForResult(result);
  }

  async invalidateSessionWithoutNavigation() {
    await this.page.request.get(new URL('/logout', this.page.url()).toString());
  }

  async clearSession() {
    await this.page.context().clearCookies();
    await this.goto('/login');
  }

  async goBack() {
    await this.page.goBack();
  }

  async title(): Promise<string> {
    return this.page.title();
  }

  dataRows(table: Locator): Locator {
    return table.locator('tr').filter({ has: this.page.locator('td') });
  }

  async expectDataRows(table: Locator, expectedRows: Record<string, string>[]) {
    const headers = await table.locator('tr').first().locator('th').allTextContents();
    const rows = this.dataRows(table);

    for (const expectedRow of expectedRows) {
      const identifyingValue = Object.values(expectedRow)[0];
      const matchingRow = rows.filter({ hasText: identifyingValue });
      await expect(matchingRow).toHaveCount(1);

      for (const [header, value] of Object.entries(expectedRow)) {
        const columnIndex = headers.indexOf(header);
        expect(columnIndex, `Missing table header: ${header}`).toBeGreaterThanOrEqual(0);
        await expect(matchingRow.locator('td').nth(columnIndex)).toHaveText(value);
      }
    }
  }

  async expectHeaders(table: Locator, expectedHeaders: string[]) {
    await expect(table.locator('tr').first().locator('th')).toHaveText(expectedHeaders);
  }

  async rowCount(table: Locator): Promise<number> {
    return this.dataRows(table).count();
  }

  /** 頂部導覽列連結，例如 nav('交易報表') */
  nav(text: string): Locator {
    return this.topbar.getByRole('link', { name: text, exact: true });
  }

  async gotoNav(text: string) {
    await this.nav(text).click();
  }

  async logout() {
    await this.gotoNav('登出');
  }

  /** 頂部顯示的登入者，例如 "sa" */
  async loggedInUser(): Promise<string> {
    return (await this.topbar.locator('span').first().textContent())?.trim() ?? '';
  }

  /**
   * 等 ajax 結果區把「查詢中...」換掉。
   * Portal 每個查詢頁都是先寫 '查詢中...' 再用回應覆蓋 #result / #detail / #list。
   */
  async waitForResult(container: Locator) {
    await expect(container).not.toHaveText(/查詢中/, { timeout: 10_000 });
  }
}
