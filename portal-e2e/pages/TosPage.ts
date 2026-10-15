import { expect, Locator, Page, Response } from '@playwright/test';
import { BasePage } from './BasePage';

export class TosPage extends BasePage {
  readonly merchantId: Locator;
  readonly queryButton: Locator;
  readonly form: Locator;
  readonly version: Locator;
  readonly currentContent: Locator;
  readonly editArea: Locator;
  readonly startDate: Locator;
  readonly content: Locator;
  readonly note: Locator;
  readonly saveButton: Locator;
  readonly newVersionButton: Locator;
  readonly message: Locator;
  private releaseRefresh?: () => void;
  private refreshStarted?: Promise<void>;

  constructor(page: Page) {
    super(page);
    this.merchantId = page.locator('#merchantID');
    this.queryButton = page.locator('#btnQuery');
    this.form = page.locator('#form');
    this.version = page.locator('#verShow');
    this.currentContent = page.locator('#curContent');
    this.editArea = page.locator('#editArea');
    this.startDate = page.locator('#startDate');
    this.content = page.locator('#content');
    this.note = page.locator('#note');
    this.saveButton = page.locator('#btnSave');
    this.newVersionButton = page.locator('#btnNewVer');
    this.message = page.locator('#msg');
  }

  async open() {
    await this.goto('/tos');
  }

  async query(merchantId?: string): Promise<Response> {
    if (merchantId !== undefined) await this.merchantId.fill(merchantId);
    const response = this.page.waitForResponse((item) => item.url().includes('/tos/data'));
    await this.queryButton.click();
    const result = await response;
    await result.finished();
    return result;
  }

  async queryAndWaitForForm(merchantId: string) {
    await this.query(merchantId);
    await expect(this.form).toBeVisible();
  }

  async createNewVersion() {
    await this.newVersionButton.click();
  }

  async fillDraft(startDate: string, content: string, note = '') {
    await this.startDate.fill(startDate);
    await this.content.fill(content);
    await this.note.fill(note);
  }

  async saveAndHoldRefresh() {
    let release!: () => void;
    let startRefresh!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    this.refreshStarted = new Promise<void>((resolve) => { startRefresh = resolve; });
    this.releaseRefresh = release;
    await this.page.route('**/tos/data**', async (route) => {
      startRefresh();
      await gate;
      await route.continue();
    }, { times: 1 });

    const saveResponse = this.page.waitForResponse((item) => item.url().includes('/tos/save'));
    await this.saveButton.click();
    await saveResponse;
    await this.refreshStarted;
  }

  async releaseHeldRefresh() {
    if (!this.releaseRefresh) throw new Error('No held ToS refresh is pending');
    const refreshResponse = this.page.waitForResponse((item) => item.url().includes('/tos/data'));
    this.releaseRefresh();
    await refreshResponse;
    this.releaseRefresh = undefined;
    this.refreshStarted = undefined;
  }

  async saveAndWaitForRefresh() {
    await this.saveAndHoldRefresh();
    await this.releaseHeldRefresh();
  }

  async openPublicTerms(merchantId?: string, version?: string) {
    const query = new URLSearchParams();
    if (merchantId !== undefined) query.set('merchantID', merchantId);
    if (version !== undefined) query.set('version', version);
    const suffix = query.size ? `?${query.toString()}` : '';
    const port = process.env.MOCK_PORT ?? '8099';
    await this.goto(`http://localhost:${port}/getToS.jsp${suffix}`);
  }
}