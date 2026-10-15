import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

const sectionIndexes: Record<string, number> = {
  'SA Portal': 0,
  'Merchant Portal': 1,
  'CSR Portal': 2,
};

export class HomePage extends BasePage {
  readonly sections: Locator;

  constructor(page: Page) {
    super(page);
    this.sections = page.locator('.wrap .box');
  }

  async open() {
    await this.goto('/');
    await expect(this.page.locator('h3')).toHaveText('功能選單');
  }

  section(name: string): Locator {
    const index = sectionIndexes[name];
    if (index === undefined) throw new Error(`Unknown home section: ${name}`);
    return this.sections.nth(index);
  }

  async clickFeature(sectionName: string, featureName: string) {
    await this.section(sectionName).getByRole('link', { name: featureName, exact: true }).click();
  }

  async featureNames(sectionName: string): Promise<string[]> {
    return this.section(sectionName).locator('li a').allTextContents();
  }

  async allFeatureNames(): Promise<string[][]> {
    const names: string[][] = [];
    for (const sectionName of Object.keys(sectionIndexes)) {
      names.push(await this.featureNames(sectionName));
    }
    return names;
  }

  async loggedInRole(): Promise<string> {
    return (await this.topbar.locator('span').nth(1).textContent())?.trim() ?? '';
  }

  async topbarLinks(): Promise<string[]> {
    return this.topbar.locator('a').allTextContents();
  }

  async inputCount(): Promise<number> {
    return this.page.locator('input, select, textarea').count();
  }

  async expectVisualStyle() {
    await expect(this.page.locator('body')).toHaveCSS('background-color', 'rgb(238, 242, 245)');
    await expect(this.sections.first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(this.page.getByRole('button').first()).toHaveCSS('background-color', 'rgb(31, 78, 121)');
    await expect(this.page.getByRole('button').first()).toHaveCSS('color', 'rgb(255, 255, 255)');
  }

  async expectBackgroundStyle() {
    await expect(this.page.locator('body')).toHaveCSS('background-color', 'rgb(238, 242, 245)');
  }

  async expectButtonStyle() {
    const button = this.page.getByRole('button').first();
    await expect(button).toHaveCSS('background-color', 'rgb(31, 78, 121)');
    await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
  }
}