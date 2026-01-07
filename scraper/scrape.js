import { chromium } from "playwright";
import fs from "fs";

// URL of the main post with scouts
const POST_URL =
  "https://www.erininthemorning.com/p/2026-trans-girl-scouts-to-order-cookies";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Go to main page
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
    // Small delay to avoid overwhelming the site
    await new Promise((r) => setTimeout(r, 500));
  }

  await browser.close();

  // Sort results: selling scouts first by remaining descending, finished scouts last
  results.sort((a, b) => {
    if (a.status === "Still Selling" && b.status === "Still Selling") {
      return b.remaining - a.remaining; // most remaining first
    } else if (a.status === "Still Selling") {
      return -1; // a before b
    } else if (b.status === "Still Selling") {
      return 1; // b before a
    } else {
      return 0; // both finished, keep order
    }
  });

  // Save results to docs/data so GitHub Pages can serve it
  const outputPath = "docs/data/results.json";
  fs.mkdirSync("docs/data", { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`Scraped ${results.length} scouts. Data saved to ${outputPath}`);
})();
