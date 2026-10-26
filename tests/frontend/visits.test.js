import { test } from "node:test";
import assert from "node:assert/strict";
import { parseVisits } from "../../src/visits.js";

test("counter uses project totals rather than shared-host totals", () => {
  assert.deepEqual(
    parseVisits({
      success: true,
      data: { page_pv: 21, page_uv: 8, site_pv: 9999, site_uv: 999 },
    }),
    { views: 21, visitors: 8 },
  );
  assert.deepEqual(
    parseVisits({ success: true, data: { page_pv: 0, page_uv: 0 } }),
    { views: 0, visitors: 0 },
  );
});
test("missing, failed, non-integer and unsafe totals never masquerade as real counts", () => {
  for (const payload of [
    null,
    {},
    { success: false },
    ...[-1, 1.5, "12", NaN, Infinity, Number.MAX_SAFE_INTEGER + 1].map(
      (value) => ({ success: true, data: { page_pv: value, page_uv: 3 } }),
    ),
  ]) {
    assert.throws(() => parseVisits(payload));
  }
});
