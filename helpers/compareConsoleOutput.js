const path = require('path');

/**
 * Compare two console files and calculate their similarity percentage.
 * @param {String} consoleFile1 - The first file.
 * @param {String} consoleFile2 - The second file.
 * @returns {Promise<number>} A promise that resolves to the similarity percentage.
 */
async function compareConsoleOutput(consoleFile1, consoleFile2) {
  const consoleBeforeLines = new Set(consoleFile1.split('\n'));
  const consoleAfterLines = new Set(consoleFile2.split('\n'));

  const differences = new Set([...consoleBeforeLines, ...consoleAfterLines]);
  consoleBeforeLines.forEach(line => differences.delete(line));
  consoleAfterLines.forEach(line => differences.delete(line));

  const similarityPercentage = (1 - differences.size / consoleBeforeLines.size) * 100;
  return similarityPercentage;
}

module.exports = compareConsoleOutput;
