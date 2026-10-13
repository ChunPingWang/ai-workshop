import { Locator, Page } from '@playwright/test';
import { BasePage, ButtonSpec } from './BasePage';

/** bankacc.html：註冊後會自動按「查詢已註冊帳戶」；清單由前端以 JSON 組成（中文表頭、無 total rows） */
export class BankaccPage extends BasePage {
  readonly path = '/bankacc';
  readonly msg: Locator;
  readonly list: Locator;

  protected readonly fields: Record<string, string> = {
    商家代碼: '#merchantId',
    銀行代碼: '#bankCode',
    銀行帳號: '#bankAcc',
    匯款幣別: '#currency',
    外國銀行: '#foreign',
  };
  protected readonly buttons: Record<string, ButtonSpec> = {
    註冊: { selector: '#btnSave', waitFor: /\/bankacc\/save/ },
    查詢已註冊帳戶: { selector: '#btnList', waitFor: /\/bankacc\/data/ },
  };
  protected readonly areas: Record<string, string> = { 訊息區: '#msg', 帳戶清單區: '#list' };
  protected readonly tables = { 帳戶清單: { selector: '#list table' } };

  constructor(page: Page) {
    super(page);
    this.msg = page.locator('#msg');
    this.list = page.locator('#list');
  }
}
