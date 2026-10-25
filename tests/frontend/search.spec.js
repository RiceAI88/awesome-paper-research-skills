import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { filterItems, restoreState } from "../../src/domain.js";
const data = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
);
const base = restoreState(null, "", {}, data.items);
const expected = filterItems(data.items, { ...base, query: "润色" });
test("suggestions support keyboard selection, Escape and literal Enter without accidentally opening a tool", async ({
  page,
}) => {
  await page.goto("./#view=table");
  const search = page.getByRole("searchbox");
  await search.fill("润色");
  const list = page.getByRole("listbox", { name: "搜索建议" });
  await expect(list).toBeVisible();
  await expect(page.locator(".ant-table-row")).toHaveCount(expected.length);
  await expect(list.locator('[data-suggestion-kind="task"]')).toContainText(
    "写论文",
  );
  await search.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(list).not.toBeVisible();
  await search.press("ArrowDown");
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  await expect(list).toBeVisible();
  await expect(search).toHaveAttribute(
    "aria-activedescendant",
    /search-option-/,
  );
  await search.press("Escape");
  await expect(list).not.toBeVisible();
  await expect(search).toHaveValue("润色");
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(search).toHaveValue("");
  await expect(page).toHaveURL(/task=write/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await search.fill("润色");
  await search.press("ArrowUp");
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const selected = page.locator('[role="option"][aria-selected="true"]');
  const repo = await selected.getAttribute("data-suggestion-repo");
  expect(repo).toBeTruthy();
  await search.press("Enter");
  await expect(page.locator(".drawer-repo")).toHaveText(repo);
});
test("repository suggestion opens its detail without changing filters and preserves original highlighted text", async ({
  page,
}) => {
  await page.goto("./#view=table&sort=updated");
  const search = page.getByRole("searchbox");
  await search.fill("润色");
  const option = page.locator('[data-suggestion-kind="repo"]').first();
  const repo = await option.getAttribute("data-suggestion-repo");
  expect(expected.some((x) => x.repo === repo)).toBe(true);
  const actual = page.locator(`.ant-table-row[data-repo="${repo}"]`);
  await expect(actual.locator(".description-clamp")).toHaveText(
    data.items.find((x) => x.repo === repo).description,
  );
  await expect(page.locator(".ranking-table mark").first()).toBeVisible();
  await option.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".drawer-repo")).toHaveText(repo);
  await expect(page).toHaveURL(/sort=updated/);
  await expect(page).toHaveURL(/q=/);
  await page.keyboard.press("Escape");
  await expect(search).toHaveValue("润色");
  await search.fill("[no+match]");
  await expect(page.getByRole("listbox")).not.toBeVisible();
  await expect(page.getByTestId("ranking-empty")).toBeVisible();
});
test("Chinese composition does not commit a partial query or choose a suggestion on Enter", async ({
  page,
}) => {
  await page.goto("./");
  const search = page.getByRole("searchbox");
  await search.focus();
  await search.dispatchEvent("compositionstart");
  await search.fill("润");
  await search.dispatchEvent("keydown", {
    key: "Enter",
    code: "Enter",
    isComposing: true,
    keyCode: 229,
  });
  await expect(page).not.toHaveURL(/q=/);
  await expect(page.getByRole("listbox")).not.toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await search.fill("润色");
  await search.dispatchEvent("compositionend", { data: "润色" });
  await expect(page).toHaveURL(/q=/);
  await expect(page.getByRole("listbox")).toBeVisible();
  await search.press("Tab");
  await expect(page.getByRole("listbox")).not.toBeVisible();
});
test.describe("touch suggestions", () => {
  test.use({ hasTouch: true });
  for (const theme of ["light", "dark"])
    test(`mobile suggestions support tapping and warm highlighting in ${theme} mode`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`./#lang=en&view=card&theme=${theme}`);
      const search = page.getByRole("searchbox");
      await search.fill("figure");
      const list = page.getByRole("listbox", { name: "Search suggestions" });
      await expect(list).toBeVisible();
      await expect(
        list.locator('[data-suggestion-kind="repo"]'),
      ).not.toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({ path: `/tmp/aprs-search-mobile-${theme}.png` });
      await list.locator('[data-suggestion-kind="repo"]').first().tap();
      await expect(page.getByRole("dialog")).toBeVisible();
    });
});

test("suggestion code loads on focus and its failure leaves normal search working", async ({
  page,
}) => {
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("./#view=table");
  await expect(page.getByRole("searchbox")).toBeVisible();
  expect(requests.some((url) => /SearchSuggestions-/.test(url))).toBe(false);
  await page.route("**/assets/SearchSuggestions-*.js", (route) =>
    route.abort(),
  );
  await page.getByRole("searchbox").fill("润色");
  await expect(page.getByTestId("feature-unavailable")).toBeVisible();
  await expect(page.locator(".ant-table-row")).toHaveCount(expected.length);
  await page.getByRole("searchbox").fill("missing-repo-123");
  await expect(page.getByTestId("ranking-empty")).toBeVisible();
});
