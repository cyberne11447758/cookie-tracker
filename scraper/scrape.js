import { chromium } from "playwright";
import fs from "fs";

const POST_URL =
  "https://www.erininthemorning.com/p/2026-trans-girl-scouts-to-order-cookies";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto(POST_URL, { waitUntil: "networkidle" });

// Find all cookie links
const scouts = await page.$$eval("a", links =>
  links
    .map(a => ({
      name: a.textContent.trim(),
      url: a.href
    }))
    .filter(l =>
      l.url.includes("digitalcookie") &&
      l.name.length > 0
    )
);

const results = [];

for (const scout of scouts) {
  const p = await browser.newPage();
  await p.goto(scout.url, { waitUntil: "networkidle" });

  const bodyText = await p.textContent("body");

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
    lastChecked: new Date().toISOString()
  });

  await p.close();
}

await browser.close();

// Save output
fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/results.json", JSON.stringify(results, null, 2));

