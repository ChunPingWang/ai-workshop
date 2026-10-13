import { expect } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { Given, When, Then } from '../fixtures';
import { Portal } from '../pages/Portal';

/**
 * 跨頁共用步驟。欄位、按鈕、區域、表格都以畫面標籤描述，由 portal.current（依網址判斷的 Page Object）解析成 selector。
 *
 * 區域：結果區、明細區、訊息區、帳戶清單區
 * 表格：結果表格、明細表格、交易表格、退款表格、帳戶清單
 */

const LOGIN_URL = /\/(login|doLogin)(;jsessionid=[^/?#]+)?$/;
const AREA = '(結果區|明細區|訊息區|帳戶清單區)';
const TABLE = '(結果表格|明細表格|交易表格|退款表格|帳戶清單)';
const re = (s: string) => new RegExp(`^${s}$`);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 今天（Asia/Taipei，與 playwright.config 的 timezoneId 相同）的 8 碼日期 */
function today(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date()).replace(/-/g, '');
}

// ==================== 登入狀態與頁面 ====================

Given('我以 {string} 身分登入 Portal', async ({ portal }, user: string) => {
  await portal.loginAs(user);
});

Given('我尚未登入 Portal', async ({ portal }) => {
  await portal.expireSession();
});

Given('我的登入已失效', async ({ portal }) => {
  await portal.expireSession();
});

Given('我在 {string} 頁面', async ({ portal }, name: string) => {
  await portal.open(name);
});

When('我開啟 {string} 頁面', async ({ portal }, name: string) => {
  await portal.open(name);
});

When('我直接以網址開啟 {string} 頁面', async ({ portal }, name: string) => {
  await portal.open(name);
});

When('我點選導覽列的 {string}', async ({ portal }, link: string) => {
  await portal.current.gotoNav(link);
});

When('我按瀏覽器的上一頁', async ({ page }) => {
  await page.goBack();
});

Then('我應該看到登入頁', async ({ page, loginPage }) => {
  await expect(page).toHaveURL(LOGIN_URL);
  await expect(loginPage.heading).toHaveText('登入');
});

Then('我應該看到首頁功能選單', async ({ indexPage }) => {
  await expect(indexPage.heading).toHaveText('功能選單');
});

Then('我應該仍在 {string} 頁面', async ({ page, portal }, name: string) => {
  const path = portal.pathOf(name).split('?')[0];
  await expect(page).toHaveURL(new RegExp(`${escapeRe(path)}(\\?|$)`));
});

Then('頁面標題應該是 {string}', async ({ portal }, title: string) => {
  await expect(portal.current.heading).toHaveText(title);
});

Then('瀏覽器分頁標題應該是 {string}', async ({ page }, title: string) => {
  await expect(page).toHaveTitle(title);
});

Then('頁面應該顯示提示 {string}', async ({ portal }, text: string) => {
  await expect(portal.current.notes.filter({ hasText: text })).toBeVisible();
});

Then('頁面不應該顯示任何錯誤提示', async ({ page }) => {
  await expect(page.locator('.wrap')).not.toContainText(/錯誤|error/i);
});

// ==================== 標題列與導覽列 ====================

Then('標題列應該顯示帳號 {string}', async ({ page, portal }, user: string) => {
  // 登入後第一頁的網址會帶 ;jsessionid=，由 welcome page render、沒有帳號資料（README「已知地雷」），先以乾淨網址重開
  if (/;jsessionid=/i.test(page.url())) await page.goto(new URL(page.url()).pathname.replace(/;jsessionid=.*$/i, '') || '/');
  await expect(portal.current.topbar.locator('span').first()).toHaveText(user);
});

Then('標題列應該顯示 {string}', async ({ portal }, text: string) => {
  await expect.poll(() => portal.current.topbarText()).toBe(text);
});

Then('標題列不應該顯示角色', async ({ portal }) => {
  await expect(portal.current.topbar.locator('span')).toHaveCount(1);
});

Then('導覽列應該依序有以下連結:', async ({ portal }, table: DataTable) => {
  await expect(portal.current.topbar.locator('a')).toHaveText(table.raw()[0]);
});

// ==================== 欄位 ====================

When('我在 {string} 欄輸入 {string}', async ({ portal }, label: string, value: string) => {
  await portal.current.field(label).fill(value);
});

When('我清空 {string} 欄', async ({ portal }, label: string) => {
  await portal.current.field(label).fill('');
});

When('我在 {string} 選擇 {string}', async ({ portal }, label: string, option: string) => {
  await portal.current.field(label).selectOption({ label: option });
});

When('我勾選 {string}', async ({ portal }, label: string) => {
  await portal.current.field(label).check();
});

When('我在 {string} 欄按下 Enter', async ({ portal }, label: string) => {
  await portal.current.field(label).press('Enter');
  // 登入頁的密碼欄按 Enter 會送出表單並換頁；其他頁的欄位不在 form 內，Enter 沒有作用
  await portal.page.waitForLoadState();
});

Then('{string} 欄應該是 {string}', async ({ portal }, label: string, value: string) => {
  await expect(portal.current.field(label)).toHaveValue(value);
});

Then('{string} 欄應該是空的', async ({ portal }, label: string) => {
  await expect(portal.current.field(label)).toHaveValue('');
});

Then('{string} 欄應該是空的且提示 {string}', async ({ portal }, label: string, placeholder: string) => {
  const f = portal.current.field(label);
  await expect(f).toHaveValue('');
  await expect(f).toHaveAttribute('placeholder', placeholder);
});

Then('{string} 欄與 {string} 欄應該是空的', async ({ portal }, a: string, b: string) => {
  await expect(portal.current.field(a)).toHaveValue('');
  await expect(portal.current.field(b)).toHaveValue('');
});

Then('{string} 欄應該是今天的日期', async ({ portal }, label: string) => {
  await expect(portal.current.field(label)).toHaveValue(today());
});

Then('{string} 欄應該是文字輸入框且提示 {string}', async ({ portal }, label: string, placeholder: string) => {
  const f = portal.current.field(label);
  await expect(f).toHaveAttribute('type', 'text');
  await expect(f).toHaveAttribute('placeholder', placeholder);
});

Then('{string} 欄應該可見', async ({ portal }, label: string) => {
  await expect(portal.current.field(label)).toBeVisible();
});

Then('{string} 欄應該可見且提示 {string}', async ({ portal }, label: string, placeholder: string) => {
  const f = portal.current.field(label);
  await expect(f).toBeVisible();
  await expect(f).toHaveAttribute('placeholder', placeholder);
});

Then('{string} 欄應該隱藏', async ({ portal }, label: string) => {
  await expect(portal.current.field(label)).toBeHidden();
});

Then('{string} 應該選擇 {string}', async ({ portal }, label: string, option: string) => {
  await expect(portal.current.field(label).locator('option:checked')).toHaveText(option);
});

Then('{string} 應該未勾選', async ({ portal }, label: string) => {
  await expect(portal.current.field(label)).not.toBeChecked();
});

Then('{string} 的選項應該依序是:', async ({ portal }, label: string, table: DataTable) => {
  await expect(portal.current.field(label).locator('option')).toHaveText(table.raw()[0]);
});

Then(
  '{string} 的選項應該依序是 {int} 到 {int} 共 {int} 個',
  async ({ portal }, label: string, from: number, to: number, count: number) => {
    const expected = Array.from({ length: to - from + 1 }, (_, i) => String(from + i).padStart(2, '0'));
    expect(expected).toHaveLength(count);
    await expect(portal.current.field(label).locator('option')).toHaveText(expected);
  },
);

// ==================== 按鈕 ====================

When('我按下 {string}', async ({ portal }, label: string) => {
  await portal.press(label);
});

When('我按下 {string} 並等待回應', async ({ portal }, label: string) => {
  await portal.press(label, { forceWait: true });
});

When('我連續按下 {string} 兩次', async ({ portal }, label: string) => {
  await portal.pressTwice(label);
});

Then('{string} 按鈕應該可見', async ({ portal }, label: string) => {
  await expect(portal.current.button(label)).toBeVisible();
});

Then('{string} 按鈕應該不可見', async ({ portal }, label: string) => {
  await expect(portal.current.button(label)).toBeHidden();
});

Then('最後 {string} 按鈕應該可見', async ({ portal }, label: string) => {
  await expect(portal.current.button(label)).toBeVisible({ timeout: 15_000 });
});

// ==================== 後端回應的時序 ====================

Given('後端回應會延遲', async ({ portal }) => {
  await portal.delayData(1_500);
});

Given('後端不會回應', async ({ portal }) => {
  await portal.hangData();
});

// ==================== 區域（結果區／明細區／訊息區／帳戶清單區） ====================

Then(re(`${AREA}應該顯示 "([^"]*)"`), async ({ portal }, area: string, text: string) => {
  await expect(portal.current.area(area)).toContainText(text);
});

Then(re(`最後${AREA}應該顯示 "([^"]*)"`), async ({ portal }, area: string, text: string) => {
  await expect(portal.current.area(area)).toContainText(text, { timeout: 15_000 });
});

Then(re(`${AREA}應該顯示以 "([^"]*)" 開頭的訊息`), async ({ portal }, area: string, prefix: string) => {
  await expect(portal.current.area(area)).toHaveText(new RegExp(`^\\s*${escapeRe(prefix)}`));
});

Then(re(`${AREA}不應該出現文字 "([^"]*)"`), async ({ portal }, area: string, text: string) => {
  await expect(portal.current.area(area)).not.toContainText(text);
});

Then(re(`${AREA}應該是(空的|空白)`), async ({ portal }, area: string) => {
  await expect(portal.current.area(area)).toHaveText('');
});

Then(re(`最後${AREA}應該是空的`), async ({ portal }, area: string) => {
  await expect(portal.current.area(area)).toHaveText('', { timeout: 15_000 });
});

Then('結果區應該持續顯示 {string}', async ({ page, portal }, text: string) => {
  const area = portal.current.area('結果區');
  await expect(area).toHaveText(text);
  // 「持續」需要經過一段時間再確認；後端不回應，等待期間畫面不應改變
  await page.waitForTimeout(3_000);
  await expect(area).toHaveText(text);
});

Then('結果區應該顯示文字 {string} 與分隔線', async ({ portal }, text: string) => {
  const area = portal.current.area('結果區');
  await expect(area).toContainText(text);
  await expect(area.locator('hr')).toHaveCount(1);
});

Then('結果區應該只有 {int} 個結果表格', async ({ portal }, n: number) => {
  await expect(portal.current.area('結果區').locator('table')).toHaveCount(n);
});

Then(
  '結果區應該有 {int} 個 total rows，依序是 {string} 與 {string}',
  async ({ portal }, n: number, first: string, second: string) => {
    const p = portal.current.area('結果區').locator('p');
    await expect(p).toHaveCount(n);
    await expect(p).toHaveText([first, second]);
  },
);

// ==================== 表格 ====================

Then(re(`${TABLE}應該有 (\\d+) 筆資料列`), async ({ portal }, name: string, n: string) => {
  const cur = portal.current;
  await expect(cur.dataRows(cur.table(name))).toHaveCount(Number(n));
});

Then(re(`${TABLE}應該沒有表頭也沒有資料列`), async ({ portal }, name: string) => {
  const t = portal.current.table(name);
  await expect(t).toBeAttached();
  await expect(t.locator('th')).toHaveCount(0);
  await expect(t.locator('td')).toHaveCount(0);
});

Then(re(`${TABLE}應該只有表頭列`), async ({ portal }, name: string) => {
  const t = portal.current.table(name);
  await expect(t.locator('th').first()).toBeVisible();
  await expect(t.locator('td')).toHaveCount(0);
});

Then(re(`${TABLE}的表頭應該依序是:`), async ({ portal }, name: string, table: DataTable) => {
  await expect(portal.current.table(name).locator('th')).toHaveText(table.raw()[0]);
});

Then(re(`${TABLE}的表頭應該包含 "([^"]*)"`), async ({ portal }, name: string, col: string) => {
  await expect(portal.current.table(name).locator('th', { hasText: new RegExp(`^${escapeRe(col)}$`) })).toHaveCount(1);
});

Then(re(`${TABLE}的表頭不應該包含 "([^"]*)"`), async ({ portal }, name: string, col: string) => {
  const t = portal.current.table(name);
  await expect(t.locator('th').first()).toBeVisible();
  await expect(t.locator('th', { hasText: new RegExp(`^${escapeRe(col)}$`) })).toHaveCount(0);
});

Then(re(`${TABLE}應該包含以下資料:`), async ({ portal }, name: string, table: DataTable) => {
  const cur = portal.current;
  const expected = table.hashes();
  await expect(async () => {
    const { headers, rows } = await cur.readTable(cur.table(name));
    for (const exp of expected) {
      const found = rows.some((r) => Object.entries(exp).every(([col, v]) => r[headers.indexOf(col)] === v));
      expect(found, `找不到資料列 ${JSON.stringify(exp)}；表頭 ${headers.join(',')}；資料 ${JSON.stringify(rows)}`).toBe(true);
    }
  }).toPass({ timeout: 10_000 });
});

Then(re(`${TABLE}的 "([^"]*)" 欄應該包含 "([^"]*)"(?: 與 "([^"]*)")?`), async ({ portal }, name: string, col: string, a: string, b?: string) => {
  const cur = portal.current;
  await expect(async () => {
    const values = await cur.columnValues(cur.table(name), col);
    expect(values).toContain(a);
    if (b) expect(values).toContain(b);
  }).toPass({ timeout: 10_000 });
});

async function sortedCheck(portal: Portal, name: string, col: string, dir: 'asc' | 'desc', expectSorted: boolean) {
  const cur = portal.current;
  await expect(async () => {
    const values = await cur.columnValues(cur.table(name), col);
    expect(values.length).toBeGreaterThan(1);
    const sorted = [...values].sort();
    if (dir === 'desc') sorted.reverse();
    if (expectSorted) expect(values).toEqual(sorted);
    else expect(values).not.toEqual(sorted);
  }).toPass({ timeout: 10_000 });
}

Then(re(`${TABLE}的 "([^"]*)" 欄應該由小到大排列`), async ({ portal }, name: string, col: string) => {
  await sortedCheck(portal, name, col, 'asc', true);
});

Then(re(`${TABLE}的 "([^"]*)" 欄應該由大到小排列`), async ({ portal }, name: string, col: string) => {
  await sortedCheck(portal, name, col, 'desc', true);
});

Then(re(`${TABLE}的 "([^"]*)" 欄不是由小到大排列`), async ({ portal }, name: string, col: string) => {
  await sortedCheck(portal, name, col, 'asc', false);
});

/** 「結果表格中 TXID 為 "X" 的 "Y" 應該是 "Z"」與「明細表格中 "RECON_RESULT" 為 "X" 的 "Y" 應該是 "Z"」 */
Then(
  re(`${TABLE}中 "?([A-Z_]+)"? 為 "([^"]*)" 的 "([^"]*)" 應該是 "([^"]*)"`),
  async ({ portal }, name: string, keyCol: string, keyVal: string, col: string, value: string) => {
    const cur = portal.current;
    await expect(async () => {
      const { headers, rows } = await cur.readTable(cur.table(name));
      const row = rows.find((r) => r[headers.indexOf(keyCol)] === keyVal);
      expect(row, `找不到 ${keyCol}=${keyVal} 的資料列`).toBeTruthy();
      expect(row![headers.indexOf(col)]).toBe(value);
    }).toPass({ timeout: 10_000 });
  },
);
