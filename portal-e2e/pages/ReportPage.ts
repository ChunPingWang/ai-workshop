import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ReportPage extends BasePage {
  readonly heading: Locator;
  readonly type: Locator;
  readonly fromDate: Locator;
  readonly fromHour: Locator;
  readonly toDate: Locator;
  readonly toHour: Locator;
  readonly merchantId: Locator;
  readonly timeType: Locator;
  readonly transactionFields: Locator;
  readonly queryButton: Locator;
  readonly result: Locator;
  readonly table: Locator;
  private releaseHeldResponse?: () => void;
  private heldResponseStarted?: Promise<void>;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#title');
    this.type = page.locator('#type');
    this.fromDate = page.locator('#fromDate');
    this.fromHour = page.locator('#fromHour');
    this.toDate = page.locator('#toDate');
    this.toHour = page.locator('#toHour');
    this.merchantId = page.locator('#merchantId');
    this.timeType = page.locator('#timeType');
    this.transactionFields = page.locator('#transOnly');
    this.queryButton = page.locator('#btnQuery');
    this.result = page.locator('#result');
    this.table = this.result.locator('table');
  }

  async open(type = 'trans') {
    await this.goto(`/report?type=${encodeURIComponent(type)}`);
    await expect(this.heading).toBeVisible();
  }

  async openRefundFromNavigation() {
    await this.gotoNav('退款報表');
    await expect(this.heading).toHaveText('退款交易報表查詢');
  }

  async setMerchant(value: string) {
    await this.merchantId.fill(value);
  }

  async setDateRange(from: string, to: string) {
    await this.fromDate.fill(from);
    await this.toDate.fill(to);
  }

  async setHours(from: string, to: string) {
    await this.fromHour.selectOption(from);
    await this.toHour.selectOption(to);
  }

  async setTimeType(value: string) {
    await this.timeType.selectOption(value);
  }

  async hourOptions(which: 'from' | 'to'): Promise<string[]> {
    const select = which === 'from' ? this.fromHour : this.toHour;
    return select.locator('option').allTextContents();
  }

  async clickQuery() {
    await this.queryButton.click();
  }

  async query() {
    await this.clickQuery();
    await this.waitForResult(this.result);
  }

  async setMerchantAndQuery(value: string) {
    await this.setMerchant(value);
    await this.query();
  }

  async setDatesAndQuery(from: string, to: string) {
    await this.setDateRange(from, to);
    await this.query();
  }

  async rows(): Promise<number> {
    return this.rowCount(this.table);
  }

  async expectTotalRows(total: string) {
    await expect(this.result.locator('p').last()).toContainText(total);
  }

  async expectEmptyTable(total = 'total rows: 0') {
    await expect(this.table).toHaveCount(1);
    expect(await this.rows()).toBe(0);
    await this.expectTotalRows(total);
  }

  async expectSortedByColumn(table: Locator, columnIndex: number, direction: 'ascending' | 'descending' = 'ascending') {
    const rows = this.dataRows(table);
    const values: string[] = [];
    for (let rowIndex = 0; rowIndex < await rows.count(); rowIndex++) {
      values.push((await rows.nth(rowIndex).locator('td').nth(columnIndex).textContent())?.trim() ?? '');
    }
    const expected = [...values].sort();
    if (direction === 'descending') expected.reverse();
    expect(values).toEqual(expected);
  }

  async startQueryWithHeldResponse() {
    let release!: () => void;
    let signalStarted!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    this.heldResponseStarted = new Promise<void>((resolve) => { signalStarted = resolve; });
    this.releaseHeldResponse = release;
    await this.page.route('**/report/data**', async (route) => {
      signalStarted();
      await gate;
      await route.continue();
    }, { times: 1 });
    await this.queryButton.click();
    await this.heldResponseStarted;
  }

  async releaseQueryResponse() {
    if (!this.releaseHeldResponse) throw new Error('No held report response is pending');
    const response = this.page.waitForResponse((item) => item.url().includes('/report/data'));
    this.releaseHeldResponse();
    await response;
    await this.waitForResult(this.result);
    this.releaseHeldResponse = undefined;
    this.heldResponseStarted = undefined;
  }

  async queryTwiceAndReleaseInReverse() {
    const releases: Array<() => void> = [];
    const completions: Array<Promise<void>> = [];
    let requestCount = 0;
    let resolveFirstStarted!: () => void;
    let resolveBothStarted!: () => void;
    const firstStarted = new Promise<void>((resolve) => { resolveFirstStarted = resolve; });
    const bothStarted = new Promise<void>((resolve) => { resolveBothStarted = resolve; });
    let preparedCount = 0;

    await this.page.route('**/report/data**', async (route) => {
      const requestIndex = requestCount++;
      if (requestIndex === 0) resolveFirstStarted();
      const response = await route.fetch();
      let release!: () => void;
      let resolveCompletion!: () => void;
      const gate = new Promise<void>((resolve) => { release = resolve; });
      completions[requestIndex] = new Promise<void>((resolve) => { resolveCompletion = resolve; });
      releases[requestIndex] = release;
      preparedCount++;
      if (preparedCount === 2) resolveBothStarted();
      await gate;
      await route.fulfill({ response });
      resolveCompletion();
    }, { times: 2 });

    await this.queryButton.click();
    await firstStarted;
    await this.merchantId.fill('E010000');
    await this.queryButton.click();
    await bothStarted;
    releases[1]();
    await completions[1];
    releases[0]();
    await completions[0];
    await this.waitForResult(this.result);
  }

  async cellText(rowIndex: number, columnIndex: number): Promise<string> {
    return (await this.dataRows(this.table).nth(rowIndex).locator('td').nth(columnIndex).textContent())?.trim() ?? '';
  }

  async expectRows(expectedRows: Record<string, string>[]) {
    await this.expectDataRows(this.table, expectedRows);
  }

  async expectNoDateFormatError() {
    await expect(this.result).not.toContainText('日期格式錯誤');
  }

  async expectBoldText(text: string) {
    await expect(this.table.locator('b').getByText(text, { exact: true })).toBeVisible();
  }

  async expectTableHeaderStyle() {
    const header = this.table.locator('th').first();
    await expect(header).toHaveCSS('background-color', 'rgb(217, 226, 243)');
    await expect(header).toHaveCSS('border-top-color', 'rgb(153, 153, 153)');
  }

  async expectTableCellStyle() {
    await expect(this.table).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  }
}