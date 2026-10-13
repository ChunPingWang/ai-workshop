import { Page, Locator, expect } from '@playwright/test';

/** 按鈕設定：selector 與按下後要等待的資料端點（ajax 回應） */
export type ButtonSpec = { selector: string; waitFor?: RegExp; navigation?: boolean };

/**
 * 所有 Portal 頁面共用：頂部導覽列、登入狀態、ajax 結果區。
 *
 * Portal 是 Thymeleaf + jQuery 1.12 的老頁面，沒有 data-testid，
 * selector 以 id（#result、#btnQuery…）與可見文字為主；新增頁面時把 id 集中寫在 Page Object，不要散在 steps 裡。
 *
 * 子類別以三張對照表描述畫面（key 為 feature 裡使用者看得到的標籤）：
 *   fields  欄位標籤 → selector（input／select／checkbox）
 *   buttons 按鈕文字 → ButtonSpec
 *   areas   區域名稱 → selector（結果區、明細區、訊息區、帳戶清單區）
 *   tables  表格名稱 → selector（結果表格、明細表格…），nth 用來區分同一區內的第幾個表格
 */
export class BasePage {
  readonly topbar: Locator;
  readonly heading: Locator;
  readonly notes: Locator;

  /** 進入此頁的網址 */
  readonly path: string = '/';
  protected readonly fields: Record<string, string> = {};
  protected readonly buttons: Record<string, ButtonSpec> = {};
  protected readonly areas: Record<string, string> = {};
  protected readonly tables: Record<string, { selector: string; nth?: number }> = {};

  constructor(readonly page: Page) {
    this.topbar = page.locator('.topbar');
    this.heading = page.locator('h3').first();
    this.notes = page.locator('.note');
  }

  /** 頂部導覽列連結，例如 nav('交易報表') */
  nav(text: string): Locator {
    return this.topbar.getByRole('link', { name: text, exact: true });
  }

  async gotoNav(text: string) {
    await this.nav(text).click();
    await this.page.waitForLoadState();
  }

  async logout() {
    await this.gotoNav('登出');
  }

  /** 頂部顯示的登入者，例如 "sa" */
  async loggedInUser(): Promise<string> {
    return (await this.topbar.locator('span').first().textContent())?.trim() ?? '';
  }

  /** 標題列去掉導覽連結後的文字，例如 "new-pay Portal | sa (sa)" */
  async topbarText(): Promise<string> {
    return this.topbar.evaluate((el) => {
      const clone = el.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('a').forEach((a) => a.remove());
      return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
    });
  }

  /**
   * 等 ajax 結果區把「查詢中...」換掉。
   * Portal 每個查詢頁都是先寫 '查詢中...' 再用回應覆蓋 #result / #detail / #list。
   */
  async waitForResult(container: Locator) {
    await expect(container).not.toHaveText(/查詢中/, { timeout: 10_000 });
  }

  // ---------- 依標籤取得元素 ----------

  field(label: string): Locator {
    const sel = this.fields[label];
    if (!sel) throw new Error(`${this.constructor.name} 沒有欄位「${label}」`);
    return this.page.locator(sel);
  }

  buttonSpec(label: string): ButtonSpec {
    const spec = this.buttons[label];
    if (!spec) throw new Error(`${this.constructor.name} 沒有按鈕「${label}」`);
    return spec;
  }

  button(label: string): Locator {
    return this.page.locator(this.buttonSpec(label).selector);
  }

  area(name: string): Locator {
    const sel = this.areas[name];
    if (!sel) throw new Error(`${this.constructor.name} 沒有區域「${name}」`);
    return this.page.locator(sel);
  }

  table(name: string): Locator {
    const spec = this.tables[name];
    if (!spec) throw new Error(`${this.constructor.name} 沒有表格「${name}」`);
    return this.page.locator(spec.selector).nth(spec.nth ?? 0);
  }

  /** 表格的資料列（排除表頭列；空結果是 <tr></tr>，也沒有 td） */
  dataRows(table: Locator): Locator {
    return table.locator('tr').filter({ has: this.page.locator('td') });
  }

  /** 讀出表格內容：表頭陣列與每列文字陣列 */
  async readTable(table: Locator): Promise<{ headers: string[]; rows: string[][] }> {
    return table.evaluate((t) => {
      const headers = Array.from(t.querySelectorAll('th')).map((th) => (th.textContent ?? '').trim());
      const rows = Array.from(t.querySelectorAll('tr'))
        .filter((tr) => tr.querySelector('td'))
        .map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => (td.textContent ?? '').trim()));
      return { headers, rows };
    });
  }

  /** 某一欄的全部值 */
  async columnValues(table: Locator, column: string): Promise<string[]> {
    const { headers, rows } = await this.readTable(table);
    const idx = headers.indexOf(column);
    if (idx < 0) throw new Error(`表格沒有欄位「${column}」，表頭為 ${headers.join(', ')}`);
    return rows.map((r) => r[idx]);
  }
}
