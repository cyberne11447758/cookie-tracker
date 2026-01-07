import { chromium } from "playwright";
import fs from "fs";

const POST_URL =
  "https://www.erininthemorning.com/p/2026-trans-girl-scouts-to-order-cookies";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(POST_URL, { waitUntil: "networkidle" });

  // Find all Digital Cookie scout links
  const scouts = await page.$$eval("a", (links) =>
    links
      .map((a) => ({
        name: a.textContent.trim(),
        url: a.href,
      }))
      .filter(
        (l) => l.url.includes("digitalcookie") && l.name.length > 0
      )
  );

  const results = [];

  for (const scout of scouts) {
    const scoutPage = await browser.newPage();
    await scoutPage.goto(scout.url, { waitUntil: "networkidle" });

    const bodyText = (await scoutPage.textContent("body")) || "";

    let status = "Goal Met";
    let remaining = null;

    const match = bodyText.match(/(\d+)\s+Packages Left To Go/i);
    if (match) {
      status = "Still Selling";
      remaining = Number(match[1]);
    }

    results.push({
      name: scout.name,
      url: scout.url,
      status,
      remaining,
      lastChecked: new Date().toISOString(),
    });

    await scoutPage.close();
    await new Promise((r) => setTimeout(r, 500)); // polite delay
  }

  await browser.close();

  // Save results directly to docs/data for Pages
  const outputPath = "docs/data/results.json";
  fs.mkdirSync("docs/data", { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`Scraped ${results.length} scouts. Data saved to ${outputPath}`);
})();
