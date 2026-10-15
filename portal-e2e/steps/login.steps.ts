import { expect } from '@playwright/test';
import { Given, Then, When } from '../fixtures';

Given('我在登入頁', async ({ loginPage }) => {
  await loginPage.open();
});

Given('我開啟登入頁', async ({ loginPage }) => {
  await loginPage.open();
});

When('我送出帳號 {string} 與密碼 {string}', async ({ loginPage }, username, password) => {
  await loginPage.submitCredentials(username, password);
});

When('我只輸入密碼 {string} 並送出', async ({ loginPage }, password) => {
  await loginPage.password.fill(password);
  await loginPage.submitButton.click();
});

When('我只輸入帳號 {string} 並送出', async ({ loginPage }, username) => {
  await loginPage.username.fill(username);
  await loginPage.submitButton.click();
});

When('我輸入帳號 {string} 與密碼 {string} 並在密碼欄按 Enter', async ({ loginPage }, username, password) => {
  await loginPage.submitWithEnter(username, password);
});

Then('輸入游標應位於帳號欄位', async ({ loginPage }) => {
  await expect(loginPage.username).toBeFocused();
});