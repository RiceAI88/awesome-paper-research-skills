import { cp, mkdir, copyFile, readdir } from "node:fs/promises";
const dirs = ["data", "reports"];
for (const dir of dirs) await cp(dir, `dist/${dir}`, { recursive: true });
await mkdir("dist/docs", { recursive: true });
for (const file of await readdir("docs"))
  if (file.endsWith(".md")) await copyFile(`docs/${file}`, `dist/docs/${file}`);
await mkdir("dist/assets", { recursive: true });
for (const file of ["styles.css", "og-cover.svg", "og-cover.png", "hero.svg"])
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
