import { expect } from '@playwright/test';
import { Given, Then, When } from '../fixtures';

Given('我在首頁', async ({ homePage }) => {
  await homePage.open();
});

When('我從 {string} 區塊點選首頁功能 {string}', async ({ homePage }, section, feature) => {
  await homePage.clickFeature(section, feature);
});

When('我從首頁開啟交易報表並查詢', async ({ homePage, reportPage }) => {
  await homePage.clickFeature('SA Portal', '交易報表查詢');
  await reportPage.query();
  await homePage.open();
});

When('我回到首頁並開啟 CSR 交易查詢', async ({ homePage, csrPage }) => {
  await homePage.open();
  await homePage.clickFeature('CSR Portal', '查詢 new-pay 交易紀錄');
  await csrPage.expectHeading('查詢 new-pay 交易紀錄');
});

Then('我應看見 {string}、{string} 與 {string} 三個區塊', async ({ homePage }, first, second, third) => {
  await expect(homePage.sections).toHaveCount(3);
  await expect(homePage.section(first)).toContainText(first);
  await expect(homePage.section(second)).toContainText(second);
  await expect(homePage.section(third)).toContainText(third);
});

Then('首頁應顯示七個功能入口', async ({ homePage }) => {
  const names = (await homePage.allFeatureNames()).flat();
  expect(names).toHaveLength(7);
});

Then('首頁不應有查詢或輸入欄位', async ({ homePage }) => {
  expect(await homePage.inputCount()).toBe(0);
});

Then('三個功能區塊與七個入口應保持相同', async ({ homePage }) => {
  const names = await homePage.allFeatureNames();
  expect(names.map((section) => section.length)).toEqual([4, 2, 1]);
});

Then('SA Portal 區塊應有交易報表、退款報表、對帳查詢與服務條款入口', async ({ homePage }) => {
  await expect(homePage.section('SA Portal')).toContainText('交易報表查詢');
  await expect(homePage.section('SA Portal')).toContainText('退款交易報表查詢');
  await expect(homePage.section('SA Portal')).toContainText('OLS 每日/每月對帳結果查詢');
  await expect(homePage.section('SA Portal')).toContainText('服務條款設定');
});

Then('Merchant Portal 區塊應有交易報表與銀行帳戶入口', async ({ homePage }) => {
  await expect(homePage.section('Merchant Portal')).toContainText('交易報表查詢');
  await expect(homePage.section('Merchant Portal')).toContainText('商家銀行帳戶註冊');
});

Then('Merchant Portal 區塊不應有退款報表入口', async ({ homePage }) => {
  await expect(homePage.section('Merchant Portal')).not.toContainText('退款交易報表查詢');
});

Then('CSR Portal 區塊應有 CSR 交易查詢入口', async ({ homePage }) => {
  await expect(homePage.section('CSR Portal')).toContainText('查詢 new-pay 交易紀錄');
});

Then('頂端導覽仍應提供退款報表入口', async ({ homePage }) => {
  await expect(homePage.nav('退款報表')).toBeVisible();
});

Then('頂端導覽列應依序顯示首頁、交易報表、退款報表、對帳查詢、服務條款、銀行帳戶、CSR查詢與登出', async ({ homePage }) => {
  await expect.poll(() => homePage.topbarLinks()).toEqual([
    '首頁', '交易報表', '退款報表', '對帳查詢', '服務條款', '銀行帳戶', 'CSR查詢', '登出',
  ]);
});

Then('共用頁面樣式符合 Portal 視覺規格', async ({ homePage }) => {
  await homePage.expectVisualStyle();
});

Then('頁面背景應為淡灰色', async ({ homePage }) => {
  await homePage.expectBackgroundStyle();
});

Then('內容區塊應為白底灰框', async ({ homePage }) => {
  await expect(homePage.sections.first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(homePage.sections.first()).toHaveCSS('border-top-color', 'rgb(204, 204, 204)');
});

Then('按鈕應為深藍底白字', async ({ homePage }) => {
  await homePage.expectButtonStyle();
});