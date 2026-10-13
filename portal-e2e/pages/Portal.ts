import { Browser, Locator, Page, Response, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { LoginPage } from './LoginPage';
import { IndexPage } from './IndexPage';
import { ReportPage } from './ReportPage';
import { ReconPage } from './ReconPage';
import { TosPage } from './TosPage';
import { BankaccPage } from './BankaccPage';
import { CsrPage } from './CsrPage';

/** feature 裡的頁面名稱（與導覽列連結文字相同）→ 網址 */
export const PAGE_PATHS: Record<string, string> = {
  首頁: '/',
  交易報表: '/report?type=trans',
  退款報表: '/report?type=refund',
  對帳查詢: '/recon',
  服務條款: '/tos',
  銀行帳戶: '/bankacc',
  CSR查詢: '/csr',
};

/** Portal 的 ajax 資料端點（瀏覽器 → Portal） */
const DATA_ENDPOINT = /\/(report\/data|recon\/data|recon\/detail|csr\/data|tos\/data|tos\/save|bankacc\/data|bankacc\/save)(\?|$)/;

/**
 * 跨頁協調者：依目前網址決定「現在是哪個 Page Object」，讓共用步驟（輸入欄位、按按鈕、看結果區）
 * 可以寫成一句話套用到每一頁；另外負責記錄請求、攔截 ajax（模擬延遲／不回應）。
 */
export class Portal {
  readonly login: LoginPage;
  readonly index: IndexPage;
  readonly report: ReportPage;
  readonly recon: ReconPage;
  readonly tos: TosPage;
  readonly bankacc: BankaccPage;
  readonly csr: CsrPage;

  /** 這個測試期間瀏覽器發出的所有請求網址 */
  readonly requests: string[] = [];
  /** 收到的資料端點回應（網址與時間） */
  readonly dataResponses: { url: string; at: number }[] = [];
  /** 為 true 時按鈕不等 ajax 回應（延遲／不回應情境要先看到「查詢中...」） */
  skipResponseWait = false;
  /** 最近一次按「存檔」的時間，用來判斷自動重查是否已完成 */
  lastSaveAt = 0;

  constructor(readonly page: Page, readonly browser: Browser) {
    this.login = new LoginPage(page);
    this.index = new IndexPage(page);
    this.report = new ReportPage(page);
    this.recon = new ReconPage(page);
    this.tos = new TosPage(page);
    this.bankacc = new BankaccPage(page);
    this.csr = new CsrPage(page);
    page.on('request', (r) => this.requests.push(r.url()));
    page.on('response', (r) => {
      if (DATA_ENDPOINT.test(r.url())) this.dataResponses.push({ url: r.url(), at: Date.now() });
    });
  }

  /** 依目前網址判斷所在頁面 */
  get current(): BasePage {
    const path = new URL(this.page.url()).pathname.replace(/;jsessionid=.*$/i, '');
    if (path.startsWith('/login') || path.startsWith('/doLogin')) return this.login;
    if (path.startsWith('/report')) return this.report;
    if (path.startsWith('/recon')) return this.recon;
    if (path.startsWith('/tos')) return this.tos;
    if (path.startsWith('/bankacc')) return this.bankacc;
    if (path.startsWith('/csr')) return this.csr;
    return this.index;
  }

  pathOf(name: string): string {
    const p = PAGE_PATHS[name];
    if (!p) throw new Error(`未知頁面「${name}」`);
    return p;
  }

  async open(name: string) {
    await this.page.goto(this.pathOf(name));
  }

  /** 以帳號登入（帳號即密碼即角色），登入後以乾淨網址重開首頁 */
  async loginAs(user: string) {
    await this.login.login(user, user);
    await expect(this.page).not.toHaveURL(/\/(login|doLogin)/);
    // 全新瀏覽器第一個 redirect 會帶 ;jsessionid=，由 welcome page 直接 render（無 model），見 README「已知地雷」
    await this.page.goto('/');
  }

  /** 清除登入 cookie，模擬登入失效（逾時或在別處登出） */
  async expireSession() {
    await this.page.context().clearCookies();
  }

  /** 按下目前頁面的按鈕；有對應資料端點時等回應到達 */
  async press(label: string, opts: { forceWait?: boolean } = {}) {
    const cur = this.current;
    const spec = cur.buttonSpec(label);
    const btn = cur.button(label);
    if (label === '存檔') this.lastSaveAt = Date.now();
    if (spec.navigation) {
      await btn.click();
      await this.page.waitForLoadState();
      return;
    }
    if (spec.waitFor && (!this.skipResponseWait || opts.forceWait)) {
      const re = spec.waitFor;
      await Promise.all([this.page.waitForResponse((r) => re.test(r.url())), btn.click()]);
    } else {
      await btn.click();
    }
  }

  /** 連續按兩次，等兩個回應都到達 */
  async pressTwice(label: string) {
    const cur = this.current;
    const re = cur.buttonSpec(label).waitFor ?? DATA_ENDPOINT;
    const before = this.dataResponses.filter((r) => re.test(r.url)).length;
    await cur.button(label).click();
    await cur.button(label).click();
    await expect.poll(() => this.dataResponses.filter((r) => re.test(r.url)).length).toBe(before + 2);
  }

  /** 資料端點回應延遲 ms 毫秒（只延遲符合 filter 的請求） */
  async delayData(ms: number, filter: (url: string) => boolean = () => true) {
    this.skipResponseWait = true;
    await this.page.route(DATA_ENDPOINT, async (route) => {
      if (filter(route.request().url())) await new Promise((r) => setTimeout(r, ms));
      await route.continue();
    });
  }

  /** 資料端點永遠不回應 */
  async hangData() {
    this.skipResponseWait = true;
    await this.page.route(DATA_ENDPOINT, () => {
      /* 不 continue、不 fulfill：請求一直掛著 */
    });
  }

  /** 等「存檔」之後的自動重查回應到達 */
  async waitForRequeryAfterSave(endpoint: RegExp) {
    await expect
      .poll(() => this.dataResponses.some((r) => endpoint.test(r.url) && r.at >= this.lastSaveAt), { timeout: 15_000 })
      .toBe(true);
  }

  /** 取元素計算後的樣式 */
  async style(locator: Locator, prop: string): Promise<string> {
    return locator.first().evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
  }

  /** 以另一個獨立瀏覽器（新的 context）登入 */
  async loginInAnotherBrowser(user: string, baseURL: string) {
    const ctx = await this.browser.newContext({ baseURL });
    const p = await ctx.newPage();
    await new LoginPage(p).login(user, user);
    await expect(p).not.toHaveURL(/\/(login|doLogin)/);
    await ctx.close();
  }

  /** 最後一個瀏覽器導覽的回應（直接開網址時用來看狀態碼） */
  lastNavigation: Response | null = null;
}
