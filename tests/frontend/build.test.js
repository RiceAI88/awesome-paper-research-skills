import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
test("both language pages version data scripts by their deployed content", async () => {
  for (const script of ["rankings", "history"]) {
    const content = await readFile(`dist/data/${script}.js`);
    const version = createHash("sha256").update(content).digest("hex").slice(0, 12);
    for (const page of ["index.html", "en/index.html"]) {
      const html = await readFile(`dist/${page}`, "utf8");
      assert.ok(html.includes(`data/${script}.js?v=${version}"`), `${page}: ${script} must bypass previous data cache`);
    }
  }
});
test("production site preserves both language entries and public data resources", async () => {
  for (const name of [
    "index.html",
    "en/index.html",
    "data/rankings.json",
    "data/rankings.csv",
    "data/rankings.js",
    "data/history.js",
    "feed.xml",
    "sitemap.xml",
    "robots.txt",
    "reports/index.html",
    "assets/styles.css",
    "assets/og-cover.png",
    "LICENSE",
  ])
    await access("dist/" + name);
  for (const name of ["index.html", "en/index.html"]) {
    const html = await readFile("dist/" + name, "utf8");
    assert.match(html, /id="root"/);
    assert.match(html, /\/awesome-paper-research-skills\/assets\/[^" ]+\.js/);
    assert.match(html, /\/awesome-paper-research-skills\/data\/rankings\.js/);
    assert.doesNotMatch(html, /src="[^" ]*assets\/app\.js/);
    assert.match(html, /rel="canonical"/);
    assert.match(html, /og:image/);
  }
});
test("website build excludes development code and keeps monthly report assets", async () => {
  for (const name of [
    "scripts",
    "tests",
    "node_modules",
    "assets/app.js",
    "docs/superpowers",
  ])
    await assert.rejects(access("dist/" + name));
  const report = await readFile("dist/reports/index.html", "utf8");
  assert.match(report, /\.\.\/assets\/styles\.css/);
  const data = JSON.parse(await readFile("dist/data/rankings.json", "utf8"));
  assert(Array.isArray(data.items));
  const original = JSON.parse(await readFile("data/rankings.json", "utf8"));
  assert.deepEqual(data, original);
});
