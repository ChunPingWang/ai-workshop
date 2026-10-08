import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * /bankacc：商家銀行帳戶註冊（US-BNK-*，SRS 4.7）
 * 註冊 → $.post('/bankacc/save') → #msg 顯示回應，成功與否都會接著自動查列表；
 * 查列表 → $.get('/bankacc/data') 回 JSON，前端自己拼表格塞 #list（中文表頭、無 total rows）。
 */
export class BankaccPage extends BasePage {
  readonly merchantId: Locator;
  readonly bankCode: Locator;
  readonly bankAcc: Locator;
  readonly currency: Locator;
  readonly foreign: Locator;
  readonly saveButton: Locator;
  readonly msg: Locator;
  readonly listButton: Locator;
  readonly list: Locator;
  readonly listTable: Locator;

  constructor(page: Page) {
    super(page);
    this.merchantId = page.locator('#merchantId');
    this.bankCode = page.locator('#bankCode');
    this.bankAcc = page.locator('#bankAcc');
    this.currency = page.locator('#currency');
    this.foreign = page.locator('#foreign');
    this.saveButton = page.locator('#btnSave');
    this.msg = page.locator('#msg');
    this.listButton = page.locator('#btnList');
    this.list = page.locator('#list');
    this.listTable = this.list.locator('table').first();
  }

  async goto() {
    await this.page.goto('/bankacc');
  }

  /** 查列表並等 /bankacc/data 回應（500 時 callback 不執行、#list 不變，只能等回應不能等畫面） */
  async listAccounts() {
    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/bankacc/data')),
      this.listButton.click(),
    ]);
  }
}
