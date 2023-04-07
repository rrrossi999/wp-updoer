const fs = require('fs');
const diff = require('diff');

/**
 * Compare the HTML output from two runs of the same site.
 * @param {Object} site - The site configuration object.
 * @param {String} outputFolder - The path to the output folder.
 * @param {Number} threshold - The threshold percentage for the comparison.
 * @returns {Promise<void>} A promise that resolves when the comparison is complete.
 */
function compareHtml(site, outputFolder, threshold) {
  for (const url of site.pages) {
    const sanitizedUrl = url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const htmlOutputPath1 = `${outputFolder}/${sanitizedUrl}/before.html`;
    const htmlOutputPath2 = `${outputFolder}/${sanitizedUrl}/after.html`;

    const html1 = fs.readFileSync(htmlOutputPath1, 'utf-8');
    const html2 = fs.readFileSync(htmlOutputPath2, 'utf-8');

    // Calculate the differences between the HTML outputs
    const differences = diff.diffLines(html1, html2);

    // Count the total number of lines and the number of lines that are the same
    let totalLines = 0;
    let sameLines = 0;
    differences.forEach((part) => {
      const lineCount = part.count;
      totalLines += lineCount;
      if (!part.added && !part.removed) {
        sameLines += lineCount;
      }
    });

    // Calculate the percentage similarity
    const similarityPercentage = (sameLines / totalLines) * 100;
    if (similarityPercentage < threshold) {
      console.warn(
        `\x1b[33mWarning: HTML output differences for ${url} exceed the expected threshold (${similarityPercentage.toFixed(2)}% similar, allowed: ${tolerance}%).\x1b[0m`
      );
    } else {
    //  console.log(`HTML output for ${url} similarity: ${similarityPercentage.toFixed(2)}%`);
    }

    // append the comparison to the comparison.txt log file
    const comparisonPath = `${outputFolder}/${sanitizedUrl}/comparison.txt`;
    const comparison = `HTML output similarity: ${similarityPercentage.toFixed(2)}%\n`;
    fs.appendFileSync(comparisonPath, comparison);
  }

}

module.exports = compareHtml;