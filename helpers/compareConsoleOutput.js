const fs = require('fs').promises;
const path = require('path');

/**
 * Compare console output for each important page before and after the update.
 * @param {Object} site - The site configuration object.
 * @param {String} outputFolder - The path to the output folder.
 * @param {Number} threshold - The threshold percentage for the comparison.
 * @returns {Promise<void>} A promise that resolves when the comparison is complete.
 */
async function compareConsoleOutput(site, outputFolder, threshold) {
  const issues = [];

  for (const url of site.pages) {
    const sanitizedUrl = url.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    const consoleBeforePath = path.join(outputFolder, sanitizedUrl, 'before.log');
    const consoleAfterPath = path.join(outputFolder, sanitizedUrl, 'after.log');

    const consoleBefore = await fs.readFile(consoleBeforePath, 'utf-8');
    const consoleAfter = await fs.readFile(consoleAfterPath, 'utf-8');

    const consoleBeforeLines = new Set(consoleBefore.split('\n'));
    const consoleAfterLines = new Set(consoleAfter.split('\n'));

    const differences = new Set([...consoleBeforeLines, ...consoleAfterLines]);
    consoleBeforeLines.forEach(line => differences.delete(line));
    consoleAfterLines.forEach(line => differences.delete(line));

    const similarityPercentage = (1 - differences.size / consoleBeforeLines.size) * 100;

    if (similarityPercentage < threshold) {
      console.warn(
        `\x1b[33mWarning: Console output similarity does not meet the threshold! (${similarityPercentage.toFixed(2)}% similar, allowed: ${threshold}%).\x1b[0m`
      );
    } else {
    //  console.log(`Console output for ${url} similarity: ${similarityPercentage.toFixed(2)}%`);
    }

    if (differences.size > 0) {
      issues.push({
        url: url,
        consoleBeforePath,
        consoleAfterPath,
      });
    }

    // append the comparison to the comparison.txt log file
    const comparison = `Console output similarity: ${similarityPercentage.toFixed(2)}%\n`;
    const comparisonPath = path.join(outputFolder, sanitizedUrl, 'comparison.txt');
    fs.appendFile(comparisonPath, comparison);
  }

  return issues;
}

module.exports = compareConsoleOutput;
