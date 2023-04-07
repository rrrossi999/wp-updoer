// helpers/takeScreenshots.js
const puppeteer = require('puppeteer');
const fs = require('fs');

async function takeScreenshots(site, siteFolder, suffix) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0); 


  for (const url of site.pages) {
    const sanitizedUrl = url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const folder = `${siteFolder}/${sanitizedUrl}`;
    fs.mkdirSync(folder, { recursive: true });

    console.log(`Capturing screenshot for ${url}`);
    await page.goto(url, { waitUntil: 'load' });

    // Wait for an additional delay after the 'load' event
    // console.log('Waiting for additional 2 seconds after page load');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: `${folder}/${suffix}.png`, fullPage: true });
  }

  await browser.close();
}

module.exports = takeScreenshots;
