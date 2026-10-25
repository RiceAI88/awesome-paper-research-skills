import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const target =
  process.argv[2] || "http://127.0.0.1:4173/awesome-paper-research-skills/";
const output = process.argv[3] || "/tmp/mobile-performance.json";
const runs = [];
const browser = await chromium.launch();
for (let run = 0; run < 3; run++) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  // Hold unrelated public status API constant so it cannot dominate timing.
  await page.route("https://api.github.com/**", (r) =>
    r.fulfill({ json: { workflow_runs: [] } }),
  );
  await page.addInitScript(() => {
    window.__mobileMetrics = { longTasks: [], lcp: 0 };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        window.__mobileMetrics.longTasks.push(e.duration);
    }).observe({ type: "longtask", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        window.__mobileMetrics.lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: 200000,
    uploadThroughput: 93750,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await cdp.send("Performance.enable");
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.getByRole("searchbox").waitFor({ timeout: 90000 });
  await page.waitForTimeout(500);
  const initial = await page.evaluate(() => ({
    ready: performance.now(),
    fcp:
      performance.getEntriesByName("first-contentful-paint")[0]?.startTime || 0,
    lcp: window.__mobileMetrics.lcp,
    tbt: window.__mobileMetrics.longTasks.reduce(
      (n, d) => n + Math.max(0, d - 50),
      0,
    ),
    scripts: performance
      .getEntriesByType("resource")
      .filter((e) => /\.js(?:$|\?)/.test(e.name))
      .map((e) => ({
        name: new URL(e.name).pathname,
        bytes: e.encodedBodySize,
        duration: e.duration,
      })),
    nodes: document.querySelectorAll("*").length,
  }));
  const before = Date.now();
  await page.getByRole("searchbox").fill("nature-skills");
  await page.waitForFunction(
    () => document.querySelectorAll('[data-testid="repo-card"]').length === 1,
    {},
    { timeout: 30000 },
  );
  const searchMs = Date.now() - before;
  const cpu = await cdp.send("Performance.getMetrics");
  const result = {
    ...initial,
    searchMs,
    scriptBytes: initial.scripts.reduce((n, s) => n + s.bytes, 0),
    cpu: Object.fromEntries(
      cpu.metrics
        .filter((m) =>
          [
            "ScriptDuration",
            "TaskDuration",
            "LayoutDuration",
            "RecalcStyleDuration",
            "JSHeapUsedSize",
          ].includes(m.name),
        )
        .map((m) => [m.name, m.value]),
    ),
  };
  runs.push(result);
  console.log(JSON.stringify({ run: run + 1, ...result }));
  await context.close();
}
await browser.close();
const median = (key) => runs.map((r) => r[key]).sort((a, b) => a - b)[1];
const report = {
  target,
  conditions: {
    viewport: "390x844",
    dpr: 2,
    cpuSlowdown: 4,
    downloadBytesPerSecond: 200000,
    latencyMs: 150,
    coldCache: true,
    transport: "Vite preview server with gzip (same server before/after)",
    statusApi: "fixed empty response",
  },
  median: Object.fromEntries(
    ["fcp", "lcp", "tbt", "ready", "searchMs", "scriptBytes"].map((k) => [
      k,
      median(k),
    ]),
  ),
  runs,
};
await writeFile(output, JSON.stringify(report, null, 2) + "\n");
console.log("MEDIAN", JSON.stringify(report.median));
