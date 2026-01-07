import { chromium } from "playwright";
import fs from "fs";

const POST_URL =
  "https://www.erininthemorning.com/p/2026-trans-girl-scouts-to-order-cookies";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Go to main page
  await page.goto(POST_URL, { waitUntil: "networkidle" });

  // Get all Digital Cookie scout links
  const scoutLinks = await page.$$eval("a", links =>
    links
      .map(a => a.href)
      .filter(href => href.includes("digitalcookie"))
  );

  const results = [];

  for (const url of scoutLinks) {
    const scoutPage = await browser.newPage();
    await scoutPage.goto(url, { waitUntil: "networkidle" });

    // Get scout name from h1.title
    let name = await scoutPage.$eval("h1.title", el => el.textContent.trim()).catch(() => null);

    if (name) {
      // Extract just the part before "'s Digital Cookie"
      const match = name.match(/^(.+?)('|’)?s\s+Digital Cookie/i);
      name = match ? match[1] : name;

      // Capitalize each word
      name = name
        .split(" ")
        .filter(Boolean)
        .map(w => w[0].toUpperCase() + w.slice(1))
        .join(" ");
    } else {
      name = "Unknown Scout";
    }

    // Get number of packages left
    const bodyText = (await scoutPage.textContent("body")) || "";
    let status = "Goal Met";
    let remaining = null;
    const matchPackages = bodyText.match(/(\d+)\s+Packages Left To Go/i);
    if (matchPackages) {
      status = "Still Selling";
      remaining = Number(matchPackages[1]);
    }

    results.push({
      name,
      url,
      status,
      remaining,
      lastChecked: new Date().toISOString(),
    });

    await scoutPage.close();
    // Small delay to avoid overwhelming the site
    await new Promise(r => setTimeout(r, 500));
  }

  await browser.close();

  // Sort: selling first by remaining descending, then finished
  results.sort((a, b) => {
    if (a.status === "Still Selling" && b.status === "Still Selling") return b.remaining - a.remaining;
    if (a.status === "Still Selling") return -1;
    if (b.status === "Still Selling") return 1;
    return 0;
  });

  // Save JSON
  const outputPath = "docs/data/results.json";
  fs.mkdirSync("docs/data", { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`Scraped ${results.length} scouts. Data saved to ${outputPath}`);
})();
