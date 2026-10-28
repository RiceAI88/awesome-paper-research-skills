import test from "node:test";
import assert from "node:assert/strict";
import {
  isNewThisWeek,
  filterItems,
  restoreState,
  serializeState,
} from "../../src/domain.js";
import { exactTimestamp, relativeTimestamp } from "../../src/time.js";
test("weekly newcomers use first recorded date, exclude initial baseline, invalid and future dates", () => {
  const now = "2026-10-25T07:00:00Z";
  assert.equal(isNewThisWeek({ first_seen_date: "2026-10-19" }, now), true);
  assert.equal(isNewThisWeek({ first_seen_date: "2026-10-18" }, now), false);
  assert.equal(isNewThisWeek({ first_seen_date: "2026-10-26" }, now), false);
  assert.equal(
    isNewThisWeek(
      { first_seen_date: "2026-10-24", first_seen_is_baseline: true },
      now,
    ),
    false,
  );
  assert.equal(isNewThisWeek({ first_seen_date: "2026-02-30" }, now), false);
  assert.equal(isNewThisWeek({}, now), false);
  const items = [
    { repository_kind: "skill", repo: "x/new", rank: 1, new_this_week: true },
    { repository_kind: "skill", repo: "x/old", rank: 2 },
  ];
  const state = restoreState(null, "#new=1", {}, items);
  assert.equal(state.newOnly, true);
  assert.match(serializeState(state), /new=1/);
  assert.deepEqual(
    filterItems(items, state).map((i) => i.repo),
    ["x/new"],
  );
});
test("exact timestamps explicitly convert UTC to Shanghai, relative values are time-zone independent", () => {
  assert.match(exactTimestamp("2026-10-25T08:18:00Z", "zh"), /16:18.*UTC\+8/);
  assert.match(
    relativeTimestamp(
      "2026-10-25T07:00:00Z",
      "zh",
      Date.parse("2026-10-25T08:00:00Z"),
    ),
    /1.*小时/,
  );
  assert.equal(exactTimestamp("invalid", "zh"), "—");
  assert.equal(relativeTimestamp("invalid", "zh", Date.now()), "—");
});

test("weekly boundaries normalize timestamp offsets to the same UTC snapshot date", () => {
  const item = { first_seen_date: "2026-10-25" };
  assert.equal(isNewThisWeek(item, "2026-10-26T00:30:00+08:00"), true);
  assert.equal(isNewThisWeek(item, "2026-10-25T16:30:00Z"), true);
  assert.equal(isNewThisWeek(item, "2026-02-30T00:00:00Z"), false);
});
