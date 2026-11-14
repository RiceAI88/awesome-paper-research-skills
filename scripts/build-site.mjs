import { cp, mkdir, copyFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const dirs = ["data", "reports"];
for (const dir of dirs) await cp(dir, `dist/${dir}`, { recursive: true });
await mkdir("dist/docs", { recursive: true });
for (const file of await readdir("docs"))
  if (file.endsWith(".md")) await copyFile(`docs/${file}`, `dist/docs/${file}`);
await mkdir("dist/assets", { recursive: true });
for (const file of [
  "styles.css",
  "og-cover.svg",
  "og-cover.png",
  "og-cover-en.svg",
  "og-cover-en.png",
  "hero.svg",
])
  await copyFile(`assets/${file}`, `dist/assets/${file}`);
for (const file of [
  "feed.xml",
  "sitemap.xml",
  "robots.txt",
  "CONTRIBUTING.md",
  "LICENSE",
])
  await copyFile(file, `dist/${file}`);
console.log("Public data, reports, SEO and supporting assets copied to dist.");

// Crawlers and no-JavaScript readers receive the current ranking at build time.
const { readFile, writeFile } = await import("node:fs/promises");
const { safeExternalUrl, filterItems, restoreState } = await import("../src/domain.js");
const ranking = JSON.parse(await readFile("data/rankings.json", "utf8"));
// Pages caches fixed data URLs for ten minutes. Version each script by content
// so a newly deployed page cannot reuse data from the previous deployment.
const dataVersions = {};
for (const script of ["rankings", "history"]) {
  dataVersions[script] = createHash("sha256")
    .update(await readFile(`dist/data/${script}.js`))
    .digest("hex")
    .slice(0, 12);
}
const escapeHtml = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const defaultItems = filterItems(ranking.items, restoreState(null, "", {}, ranking.items));
const top = defaultItems.slice(0, 20);
for (const [file, lang] of [
  ["index.html", "zh"],
  ["en/index.html", "en"],
]) {
  const path = `dist/${file}`;
  let html = await readFile(path, "utf8");
  for (const [script, version] of Object.entries(dataVersions)) {
    html = html.replace(`data/${script}.js"`, `data/${script}.js?v=${version}"`);
  }
  const url = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)[1];
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: lang === "zh" ? "科研 Skills 导航" : "Research Skills Directory",
    url,
    numberOfItems: defaultItems.length,
    itemListElement: top.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.repo,
      url: safeExternalUrl(item.url) || undefined,
    })),
  };
  const json = JSON.stringify(schema).replace(/</g, "\\u003c");
  html = html.replace(
    /(<script type="application\/ld\+json" id="ld-json">)[\s\S]*?(<\/script>)/,
    (_, open, close) => open + json + close,
  );
  const title =
    lang === "zh"
      ? "科研 Skills 导航 · 默认 Skills 榜单前 20 名"
      : "Research Skills Directory · Default Skills Top 20";
  const hint =
    lang === "zh"
      ? "按 GitHub Stars 排序，默认仅展示 Skills。启用 JavaScript 可按专业、任务和平台筛选，查看安装指引与增长趋势。"
      : "Ranked by GitHub Stars; Skills only by default. Enable JavaScript to browse by discipline, task and platform, with installation guidance and growth trends.";
  const list = top
    .map(
      (item) =>
        `<li><a href="${escapeHtml(safeExternalUrl(item.url) || "#")}">${escapeHtml(item.repo)}</a><p>${escapeHtml(item.description)}</p></li>`,
    )
    .join("");
  html = html.replace(
    /<noscript\s*>[\s\S]*?<\/noscript\s*>/,
    () =>
      `<noscript><section><h1>${title}</h1><p>${hint}</p><ol>${list}</ol></section></noscript>`,
  );
  const cover = `og-cover${lang === "en" ? "-en" : ""}.png`;
  const coverVersion = createHash("sha256").update(await readFile(`dist/assets/${cover}`)).digest("hex").slice(0, 12);
  html = html.replaceAll(`assets/${cover}"`, `assets/${cover}?v=${coverVersion}"`);
  await writeFile(path, html);
}
