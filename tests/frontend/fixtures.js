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

export async function openScope(page) {
 const trigger=page.getByRole('button',{name:/^(收录范围|Scope)/}).first();
 if(await trigger.getAttribute('aria-expanded')!=='true')await trigger.click();
 await expect(trigger).toHaveAttribute('aria-expanded','true');
}
