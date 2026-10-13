import { expect } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { When, Then } from '../fixtures';

// portal.css 的色彩（getComputedStyle 回傳 rgb 格式）
const DARK_BLUE = 'rgb(31, 78, 121)'; // #1f4e79
const PAGE_BG = 'rgb(238, 242, 245)'; // #eef2f5
const WHITE = 'rgb(255, 255, 255)';
const BOX_BORDER = 'rgb(204, 204, 204)'; // #ccc
const NOTE_RED = 'rgb(204, 0, 0)'; // #c00

Then('功能選單應該包含以下連結:', async ({ indexPage }, table: DataTable) => {
  for (const { 區塊, 連結 } of table.hashes()) {
    await expect(indexPage.blockLink(區塊, 連結)).toBeVisible();
  }
  await expect(indexPage.menuLinks).toHaveCount(table.hashes().length);
});

Then('功能選單應該有 {int} 個區塊共 {int} 個連結', async ({ indexPage }, blocks: number, links: number) => {
  await expect(indexPage.blocks).toHaveCount(blocks);
  await expect(indexPage.menuLinks).toHaveCount(links);
});

When('我點選 {string} 區塊的 {string}', async ({ indexPage }, block: string, link: string) => {
  await indexPage.blockLink(block, link).click();
  await indexPage.page.waitForLoadState();
});

Then('{string} 區塊不應該有 {string} 連結', async ({ indexPage }, block: string, link: string) => {
  await expect(indexPage.block(block)).toBeVisible();
  await expect(indexPage.blockLink(block, link)).toHaveCount(0);
});

Then('頁面上不應該有任何輸入欄位或按鈕', async ({ page }) => {
  await expect(page.locator('.wrap').locator('input, select, textarea, button')).toHaveCount(0);
});

Then('標題列應該是深藍底色', async ({ portal }) => {
  expect(await portal.style(portal.current.topbar, 'background-color')).toBe(DARK_BLUE);
});

Then('頁面背景應該是淡灰藍色', async ({ portal, page }) => {
  expect(await portal.style(page.locator('body'), 'background-color')).toBe(PAGE_BG);
});

Then('內容區塊應該是白底灰框', async ({ portal, page }) => {
  const box = page.locator('.box');
  expect(await portal.style(box, 'background-color')).toBe(WHITE);
  expect(await portal.style(box, 'border-top-color')).toBe(BOX_BORDER);
});

Then('提示文字應該是紅色小字', async ({ portal }) => {
  const note = portal.current.notes;
  expect(await portal.style(note, 'color')).toBe(NOTE_RED);
  expect(await portal.style(note, 'font-size')).toBe('12px');
});

Then('{string} 按鈕應該是深藍底白字', async ({ portal }, label: string) => {
  const btn = portal.current.button(label);
  expect(await portal.style(btn, 'background-color')).toBe(DARK_BLUE);
  expect(await portal.style(btn, 'color')).toBe(WHITE);
});

Then('中文字應該正常顯示', async ({ portal, page }) => {
  expect(await page.evaluate(() => document.characterSet)).toBe('UTF-8');
  await expect(portal.current.heading).toHaveText(/[一-鿿]/);
});

Then('頁面載入的資源都應該來自 Portal 本身', async ({ portal, page }) => {
  await page.waitForLoadState('load');
  const origin = new URL(page.url()).origin;
  const external = portal.requests.filter((u) => !u.startsWith('data:') && new URL(u).origin !== origin);
  expect(external).toEqual([]);
});
