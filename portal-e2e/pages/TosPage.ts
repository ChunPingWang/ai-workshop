import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * /tos：服務條款設定（US-TOS-*，SRS 4.6）
 * 查詢 → $.get('/tos/data') 回 JSON 陣列，callback 切 S1 新增／S2 檢視／S3 新版次三種狀態。
 * 注意（P-TOS-09）：存檔後會自動重查，重查 callback 會把 #msg 清空——存檔訊息只短暫可見。
 * 後端 500 或回非 JSON 時（P-TOS-15）callback 不執行，畫面不會有任何變化。
 */
export class TosPage extends BasePage {
  readonly merchantID: Locator;
  readonly queryButton: Locator;
  readonly form: Locator;
  readonly verShow: Locator;
  readonly curContent: Locator;
  readonly editArea: Locator;
  readonly startDate: Locator;
  readonly content: Locator;
  readonly note: Locator;
  readonly saveButton: Locator;
  readonly newVerButton: Locator;
  readonly msg: Locator;

  constructor(page: Page) {
    super(page);
    this.merchantID = page.locator('#merchantID');
    this.queryButton = page.locator('#btnQuery');
    this.form = page.locator('#form');
    this.verShow = page.locator('#verShow');
    this.curContent = page.locator('#curContent');
    this.editArea = page.locator('#editArea');
    this.startDate = page.locator('#startDate');
    this.content = page.locator('#content');
    this.note = page.locator('#note');
    this.saveButton = page.locator('#btnSave');
    this.newVerButton = page.locator('#btnNewVer');
    this.msg = page.locator('#msg');
  }

  async goto() {
    await this.page.goto('/tos');
  }

  /** 查詢並等 /tos/data 回應（500／非 JSON 時 callback 不執行，等回應到就好，不能等畫面變化） */
  async query(merchantID: string) {
    await this.merchantID.fill(merchantID);
    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/tos/data')),
      this.queryButton.click(),
    ]);
  }

  /**
   * 延遲下一次 /tos/data（存檔後的自動重查），讓 #msg 的存檔訊息留在畫面上可被斷言；
   * 不延遲的話 requery callback 立刻把 #msg 清空（P-TOS-09 的 legacy 行為另有專屬情境固定）。
   */
  async delayNextRequery(ms = 1500) {
    await this.page.route(
      '**/tos/data*',
      async (route) => {
        await new Promise((r) => setTimeout(r, ms));
        await route.continue();
      },
      { times: 1 },
    );
  }
}
