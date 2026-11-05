import { test as base, expect } from "@playwright/test";

// Exercise the entry promotion in its own spec. Other UI tests start unobstructed.
export const test = base.extend({
  showEntryNotice: [false, { option: true }],
  page: async ({ page, showEntryNotice }, use) => {
    if (!showEntryNotice) {
      await page.addInitScript(() => {
        new MutationObserver(() => {
          document.querySelector(".recharge-notice[open]")?.close();
        }).observe(document, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ["open"],
        });
      });
    }
    await use(page);
  },
});
export { expect };
