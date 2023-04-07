// index.js
const fs = require('fs');
const yaml = require('js-yaml');
const { Client } = require('ssh2');
const path = require('path');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

const validateSites = require('./helpers/validateSites');
const takeScreenshots = require('./helpers/takeScreenshots');
const captureBrowserConsole = require('./helpers/captureBrowserConsole');
const grabSiteHtml = require('./helpers/grabSiteHtml');
const performBackup = require('./helpers/performBackup');
const updateSite = require('./helpers/updateSite');
const clearCache = require('./helpers/clearCache');
const compareImages = require('./helpers/compareImages');
const compareHtml = require('./helpers/compareHtml');
const compareConsoleOutput = require('./helpers/compareConsoleOutput');

// Check command line options
const dryRun = process.argv.includes('--dry-run');
const backup = process.argv.includes('--backup') || process.argv.includes('--keep-backup');
const keepBackup = process.argv.includes('--keep-backup');
const fresh = process.argv.includes('--fresh');
const config = process.argv.includes('--config');

(async () => {
  // Set the config file (default: config.yaml)
  const configFile = config ? process.argv[process.argv.indexOf('--config') + 1] : 'config.yaml';

  // Load the configuration from the YAML file
  const config = yaml.load(fs.readFileSync(configFile, 'utf8'));

  const thresholds = config.thresholds || { visual: 99, html: 98, console: 95};

  // Validate sites and credentials
  try {
    await validateSites(config.sites);
  } catch (error) {
    console.error(`Error validating sites: ${error.message}`);
    console.error('Exiting without updating any sites.');
    process.exit(1);
  }

  const progressFile = '.progress.json';
  let progress;

  // Check for existing progress and the `--fresh` flag
  if (!fresh && fs.existsSync(progressFile)) {
    progress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
    console.log('Continuing a previous run...');
  } else {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFolder = `${config.output}/${timestamp}${dryRun ? '-dry' : ''}`;
    fs.mkdirSync(outputFolder, { recursive: true });

    progress = {
      outputFolder,
      completedSites: [],
    };

    // Save the new progress to the hidden file
    await writeFile(progressFile, JSON.stringify(progress, null, 2));
  }

  // Filter out the completed sites
  const remainingSites = Object.entries(config.sites).filter(([siteKey]) => !progress.completedSites.includes(siteKey));

  // Process each site in parallel
  const processSitePromises = remainingSites.map(async ([siteKey, site]) => {
    console.log(`Processing ${site.domain}...`);

    // Create a subfolder for the site
    const siteFolder = `${progress.outputFolder}/${siteKey}`;
    fs.mkdirSync(siteFolder, { recursive: true });

    // Take screenshots, grab site HTML and capture console output before the update
    console.log(`Capturing screenshots, html and console output for ${site.domain} before the update...`);
    await takeScreenshots(site, siteFolder, 'before');
    await grabSiteHtml(site, siteFolder, 'before');
    await captureBrowserConsole(site, siteFolder, 'before');

    // Backup site if the backup option is enabled
    if (backup) {
      console.log(`Backing up ${site.domain}...`);
      await performBackup(site, siteFolder, keepBackup);
    }

    // If not in dry run mode, update the site, clear its caches and finish the comparison
    if (!dryRun) {
      console.log(`Updating ${site.domain}...`);
      await updateSite(site, siteFolder);

      // Clear the caches for the site
      console.log(`Clearing caches for ${site.domain}...`);
      await clearCache(site);

      // Take screenshots and capture console output after the update
      // console.log(`Capturing screenshots and console output for ${site.domain} after the update...`);
      await takeScreenshots(site, siteFolder, 'after');
      await grabSiteHtml(site, siteFolder, 'after');
      await captureBrowserConsole(site, siteFolder, 'after');

      // Compare the before and after screenshots
      // console.log(`Comparing screenshots for ${site.domain}...`);
      const comparisonResults = await compareImages(site, siteFolder, thresholds.visual);

      // Compare the before and after HTML
      const htmlIssues = await compareHtml(site, siteFolder, thresholds.html);

      // Compare the before and after console output
      const consoleIssues = await compareConsoleOutput(site, siteFolder, thresholds.console);
    } else {
      console.log(`Dry run: Skipping update for ${site.domain}`);
    }

    // Add the site to the completed sites
    progress.completedSites.push(siteKey);

    // Update the progress in the hidden file
    await writeFile(progressFile, JSON.stringify(progress, null, 2));

    // Say we're done with the site
    console.log('\x1b[32m%s\x1b[0m', `Done processing ${site.domain}.`);

  });

  // Wait for all sites to finish processing
  await Promise.all(processSitePromises);
  
  // Delete the progress file
  await unlink(progressFile);
  
  // Say we're done with all sites
  console.log('\x1b[32m%s\x1b[0m', "That's it! Finished processing all sites. Check it out now. Ciao!");
})();
  
  