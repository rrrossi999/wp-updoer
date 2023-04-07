const puppeteer = require('puppeteer');
const fs = require('fs/promises');

/**
 * Capture the raw HTML output for a site's pages.
 * @param {Object} site - The site configuration object.
 * @param {String} outputFolder - The path to the output folder.
 * @param {String} suffix - The suffix to append to the output file name.
 */
async function grabSiteHtml(site, outputFolder, suffix) {
    // console.log(`Launching browser for ${site.domain}`);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0); 
    
    for (const url of site.pages) {
        const sanitizedUrl = url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const htmlOutputPath = `${outputFolder}/${sanitizedUrl}/${suffix}.html`;
    
        console.log(`Capturing HTML for ${url}`);
        await page.goto(url, { waitUntil: 'load' });
    
        // Wait for an additional delay after the 'load' event
        // console.log('Waiting for additional 2 seconds after page load');
        await page.waitForTimeout(2000);
    
        const html = await page.content();
        // console.log(`Saving HTML to ${htmlOutputPath}`);
        await fs.writeFile(htmlOutputPath, html);
    }
    
    // console.log(`Closing browser for ${site.domain}`);
    await browser.close();
}

module.exports = grabSiteHtml;