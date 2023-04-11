const diff = require('diff');

/**
 * Compare the HTML output from two runs of the same site.
 * @param {String} html1 - The first file data.
 * @param {String} html2 - The second file data.
 * @returns {Promise<number>} A promise that resolves to the similarity percentage.
 */
function compareHtml(html1, html2) {
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
  return similarityPercentage;
}

module.exports = compareHtml;