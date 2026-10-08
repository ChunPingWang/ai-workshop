import { Locator, expect } from '@playwright/test';

/**
 * backend html() 產的表格：第一個 <tr> 是表頭（th），資料列從第二個 <tr>（td）起；
 * 空結果是「無表頭、僅一個空 <tr>」（P-COM-23）。
 * bankacc 的 #list 表格由前端拼字串產生，同樣格式但表頭是中文。
 */

/** 資料列（排除表頭列；空結果的 <tr></tr> 沒有 td 也會被排除） */
export function dataRows(table: Locator): Locator {
  return table.locator('tr').filter({ has: table.page().locator('td') });
}

/** 斷言表頭欄數與首末欄名 */
export async function expectHeaders(table: Locator, count: number, first: string, last: string) {
  const headers = table.locator('tr').first().locator('th');
  await expect(headers).toHaveCount(count);
  await expect(headers.first()).toHaveText(first);
  await expect(headers.last()).toHaveText(last);
}

/**
 * 斷言表格包含 expected 的每一列：以表頭文字對欄，只比對 expected 有給的欄位。
 * expected 來自 Gherkin DataTable 的 hashes()。
 */
export async function expectTableContains(table: Locator, expected: Record<string, string>[]) {
  await expect(table).toBeVisible();
  const headers = (await table.locator('tr').first().locator('th').allTextContents()).map((s) => s.trim());
  const rowLoc = dataRows(table);
  const rowCount = await rowLoc.count();
  const rows: Record<string, string>[] = [];
  for (let i = 0; i < rowCount; i++) {
    const cells = (await rowLoc.nth(i).locator('td').allTextContents()).map((s) => s.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = cells[idx] ?? ''));
    rows.push(row);
  }
  for (const exp of expected) {
    const hit = rows.some((row) => Object.entries(exp).every(([k, v]) => row[k] === v));
    expect(hit, `找不到符合的資料列 ${JSON.stringify(exp)}\n實際資料 ${JSON.stringify(rows)}`).toBe(true);
  }
}
