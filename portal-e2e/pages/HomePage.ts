import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** /：功能選單（三個 .box：SA / Merchant / CSR）。選單不依角色過濾（US-COM-02、US-HOME-*） */
export class HomePage extends BasePage {
  readonly heading: Locator;
  readonly menuBoxes: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: '功能選單' });
    this.menuBoxes = page.locator('.wrap .box');
  }

  async goto() {
    await this.page.goto('/');
  }

  /**
   * 選單裡的功能連結。exact 比對避免「交易報表查詢」撞到「退款交易報表查詢」；
   * SA 區與 Merchant 區各有一個「交易報表查詢」（目標相同），取第一個。
   */
  menuLink(text: string): Locator {
    return this.page.locator('.wrap').getByRole('link', { name: text, exact: true }).first();
  }
}
