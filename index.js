// index.js
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const { promisify } = require('util');
const ObjectsToCsv = require('objects-to-csv');

const validateSites = require('./helpers/validateSites');
const capturePage = require('./helpers/capturePage');
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
const customConfigPath = process.argv.includes('--config');

// main function
(async () => {
  // Set the config file (default: config.yaml)
  const configFile = customConfigPath ? process.argv[process.argv.indexOf('--config') + 1] : 'config.yaml';

  // Load the configuration from the YAML file
  const config = yaml.load(fs.readFileSync(configFile, 'utf8'));
  const outputFolder = config.output || './output';

  // Set the default similarity thresholds, beneath which we alert the user to potential issues
  const defaultVisualThreshold = 98;
  const defaultHtmlThreshold = 95;
  const defaultConsoleThreshold = 95;
  const thresholds = config.thresholds || {
    visual: defaultVisualThreshold,
    html: defaultHtmlThreshold,
    console: defaultConsoleThreshold
  };

  // Comparison functions and related data for iterating over them
  const comparisons = [
    {
      name: 'visual',
      compare: compareImages,
      threshold: thresholds.visual || defaultVisualThreshold,
      filetype: 'png'
    }, {
      name: 'html',
      compare: compareHtml,
      threshold: thresholds.html || defaultHtmlThreshold,
      filetype: 'html'
    }, {
      name: 'console',
      compare: compareConsoleOutput,
      threshold: thresholds.console || defaultConsoleThreshold,
      filetype: 'log'
    },
  ];

  // If no pages are specified to test, default to the homepage
  for (site in config.sites) {
    site.pages = site.pages || [`https://${site.domain}/`];
  }

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
    const timestampFolder = `${outputFolder}/${timestamp}${dryRun ? '-dry' : ''}`;
    fs.mkdirSync(timestampFolder, { recursive: true });

    progress = {
      timestampFolder,
      completedSites: [],
    };

    // Save the new progress to the hidden file
    fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
  }

  // Filter out the completed sites
  const remainingSites = Object.entries(config.sites).filter(([siteKey]) => !progress.completedSites.includes(siteKey));

  // Process each site in parallel
  const processSitePromises = remainingSites.map(async ([siteKey, site]) => {
    console.log(`Processing ${site.domain}...`);

    // Create a subfolder for the site
    const siteFolder = `${progress.timestampFolder}/${siteKey}`;
    await fs.promises.mkdir(siteFolder, { recursive: true });

    // Set up site paths and page paths
    const pages = []
    for (url of site.pages) {
      const sanitizedUrl = url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const pageFolder = `${siteFolder}/${sanitizedUrl}`;

      await fs.promises.mkdir(pageFolder, { recursive: true });

      const comparisonFiles = {};
      for (comparison of comparisons) {
        comparisonFiles[comparison.name] = {
          name: comparison.name,
          before: `${pageFolder}/before.${comparison.filetype}`,
          after: `${pageFolder}/after.${comparison.filetype}`,
        };
      }
      pages.push({
        url: url,
        folder: pageFolder,
        comparisonFiles: comparisonFiles,
      });
    }

    // Process each page in parallel until they are all done
    const processBeforePagePromises = pages.map(async (page) => {
      await capturePage(page, 'before');
    });
    await Promise.all(processBeforePagePromises);

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
      const processAfterPagePromises = pages.map(async (page) => {
        await capturePage(page, 'after');
      });
      await Promise.all(processAfterPagePromises);

      // Create a results object to store the results of the comparisons for csv output
      const results = [];

      console.log(`Running comparisons for ${site.domain}...`);
      for (const page of pages) {
        for (const comparison of comparisons) {
          const encoding = comparison.name === 'visual' ? null : 'utf-8';
          const before = fs.readFileSync(page.comparisonFiles[comparison.name].before, encoding);
          const after = fs.readFileSync(page.comparisonFiles[comparison.name].after, encoding);

          const rawScore = await comparison.compare(before, after);
          // round the score to 2 decimal places
          const score = Math.round(rawScore * 100) / 100;

          // if the score is below the threshold, throw a warning
          if (score < comparison.threshold) {
            console.warn(`\x1b[33m ALERT: ${comparison.name} comparison score ${score} for ${site.domain} ${page.url} is below the threshold of ${comparison.threshold}%\x1b[0m`);
          }

          // write the score to the results list
          results.push({
            site: siteKey,
            url: page.url,
            comparison: comparison.name,
            score: score,
            pass: score >= comparison.threshold ? 'YES' : 'NO',
          });
        }
      }
      // Write the results to a csv file
      const csv = new ObjectsToCsv(results);
      await csv.toDisk(`${siteFolder}/results.csv`);
      results.length = 0;

    } else {
      console.log(`Dry run: Skipping update for ${site.domain}`);
    }

    // Add the site to the completed sites
    progress.completedSites.push(siteKey);

    // Update the progress in the hidden file
    await fs.promises.writeFile(progressFile, JSON.stringify(progress, null, 2));

    // Say we're done with this site
    console.log('\x1b[32m%s\x1b[0m', `Done processing ${site.domain}.`);
  });

  // Wait for all sites to finish processing
  await Promise.all(processSitePromises);

  // Delete the progress file
  await fs.promises.unlink(progressFile);

  // Say we're done with all sites
  console.log('\x1b[32m%s\x1b[0m', "That's it! Finished processing all sites. Check it out now. Ciao!");
})();

