const puppeteer = require('puppeteer');
const fs = require('fs/promises');

/**
 * Capture the browser console output for a site.
 * @param {Object} site - The site configuration object.
 * @param {String} outputFolder - The path to the output folder.
 * @param {String} suffix - The suffix to append to the output file name.
 */
async function captureBrowserConsole(site, outputFolder, suffix) {
  // console.log(`Launching browser for ${site.domain}`);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0); 

  const messages = [];

  page.on('console', (msg) => {
    messages.push(`${msg.type().toUpperCase()} - ${msg.text()}`);
  });

  for (const url of site.pages) {
    const sanitizedUrl = url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const consoleOutputPath = `${outputFolder}/${sanitizedUrl}/${suffix}.log`;

    console.log(`Capturing console output for ${url}`);
    await page.goto(url, { waitUntil: 'load' });

    // Wait for an additional delay after the 'load' event
    // console.log('Waiting for additional 2 seconds after page load');
    await page.waitForTimeout(2000);

    const consoleOutput = messages.join('\n');
    // console.log(`Saving console output to ${consoleOutputPath}`);
    await fs.writeFile(consoleOutputPath, consoleOutput);
  }

  // console.log(`Closing browser for ${site.domain}`);
  await browser.close();
}

module.exports = captureBrowserConsole;
