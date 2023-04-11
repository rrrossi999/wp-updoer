const puppeteer = require('puppeteer');
const fs = require('fs/promises');

capturePage = async (page, phase) => {
    const browser = await puppeteer.launch();
    const pagePuppet = await browser.newPage();
    await pagePuppet.setDefaultNavigationTimeout(0); 
  
    // Load the page and capture output  
    const messages = [];
  
    pagePuppet.on('console', (msg) => {
      messages.push(`${msg.type().toUpperCase()} - ${msg.text()}`);
    });
  
    await pagePuppet.goto(page.url, { waitUntil: 'domcontentloaded' });
    await pagePuppet.evaluate(scrollToBottom);
    await pagePuppet.waitForTimeout(5000);
  
    await pagePuppet.screenshot({ path: page.comparisonFiles.visual[phase], fullPage: true });
  
    const html = await pagePuppet.content();
    await fs.writeFile(page.comparisonFiles.html[phase], html);
  
    const consoleOutput = messages.join('\n');
    // console.log(`Saving console output to ${consoleOutputPath}`);
    await fs.writeFile(page.comparisonFiles.console[phase], consoleOutput);
    messages.length = 0;
  
    await browser.close();
  }

  async function scrollToBottom() {
    await new Promise(resolve => {
      const distance = 100; // should be less than or equal to window.innerHeight
      const delay = 100;
      const timer = setInterval(() => {
        document.scrollingElement.scrollBy(0, distance);
        if (document.scrollingElement.scrollTop + window.innerHeight >= document.scrollingElement.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, delay);
    });
  }
  

  module.exports = capturePage;