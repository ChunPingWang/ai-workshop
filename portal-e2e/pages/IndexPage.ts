import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** index.html：三個 .box 功能區塊，區塊標題為 <b> */
export class IndexPage extends BasePage {
  readonly path = '/';

  /** 依區塊標題取得功能區塊，例如 block('CSR Portal') */
  block(title: string): Locator {
    return this.page.locator('.wrap .box').filter({ has: this.page.locator('b', { hasText: title }) });
  }

  blockLink(title: string, link: string): Locator {
    return this.block(title).getByRole('link', { name: link, exact: true });
  }

  get blocks(): Locator {
    return this.page.locator('.wrap .box');
  }

  get menuLinks(): Locator {
    return this.page.locator('.wrap .box a');
  }
}
