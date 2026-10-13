import { Locator, Page } from '@playwright/test';
import { BasePage, ButtonSpec } from './BasePage';

/**
 * tos.html：四個狀態 S0 初始／S1 新增／S2 檢視／S3 新版次。
 * 存檔後 callback 會寫 #msg 並自動再按一次查詢；重查成功時 #msg 被清空。
 * 後端 500 或非 JSON 時 $.get callback 內 JSON.parse 失敗，畫面不變——只能等回應，不能等畫面變化。
 */
export class TosPage extends BasePage {
  readonly path = '/tos';
  readonly form: Locator;
  readonly version: Locator;
  readonly currentContent: Locator;
  readonly editArea: Locator;
  readonly msg: Locator;

  protected readonly fields: Record<string, string> = {
    商家代碼: '#merchantID',
    生效日期: '#startDate',
    服務條款內容: '#content',
    註記: '#note',
  };
  protected readonly buttons: Record<string, ButtonSpec> = {
    '查詢/新增服務條款': { selector: '#btnQuery', waitFor: /\/tos\/data/ },
    建立新版次: { selector: '#btnNewVer' },
    存檔: { selector: '#btnSave', waitFor: /\/tos\/save/ },
  };
  protected readonly areas: Record<string, string> = { 訊息區: '#msg' };

  constructor(page: Page) {
    super(page);
    this.form = page.locator('#form');
    this.version = page.locator('#verShow');
    this.currentContent = page.locator('#curContent');
    this.editArea = page.locator('#editArea');
    this.msg = page.locator('#msg');
  }
}
