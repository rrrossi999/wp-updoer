// helpers/compareImages.js
const fs = require('fs');
const resemble = require('resemblejs');


/**
 * Compare two images and calculate their similarity percentage.
 * @param {String} imagePath1 - The path to the first image.
 * @param {String} imagePath2 - The path to the second image.
 * @param {Number} threshold - The threshold percentage for the comparison.
 * @returns {Promise<number>} A promise that resolves to the similarity percentage.
 */
async function doComparison(imagePath1, imagePath2, threshold) {
  return new Promise((resolve, reject) => {
    // Read the images from the file system
    const image1 = fs.readFileSync(imagePath1);
    const image2 = fs.readFileSync(imagePath2);

    // console.log(`Comparing images:\n${imagePath1}\n${imagePath2}`);

    // Set the comparison options
    const options = {
      ignore: 'antialiasing',
      output: {
        errorColor: {
          red: 255,
          green: 0,
          blue: 255,
        },
        transparency: 0.3,
      },
    };

    // Perform the comparison using resemble.js
    resemble(image1)
      .compareTo(image2)
      .ignoreColors()
      .onComplete((data) => {
        if (data.error) {
          console.error(`Error comparing images: ${data.error}`);
          reject(data.error);
        } else {
          const similarity = 100 - (data.rawMisMatchPercentage / 100);
          resolve(similarity);
        }
      });
  });
}

async function compareImages(site, siteFolder) {
  const results = [];

  for (const url of site.pages) {
    const sanitizedUrl = url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const folder = `${siteFolder}/${sanitizedUrl}`;

    // try to match the images. if the images are different sizes, handle the error gracefully
    let matchPercentage = await doComparison(`${folder}/before.png`, `${folder}/after.png`);
    results.push({ url, matchPercentage });

    // write the comparison to a log file
    fs.writeFileSync(`${folder}/comparison.txt`, `Screenshot match: ${matchPercentage}%\n`);

    // write the comparison to the console
    //console.log(`Before-after screenshot match for ${url}: ${matchPercentage}%`);
    if (matchPercentage < threshold) {
      console.warn(`\x1b[33m ALERT: Match percentage for ${url} is below ${threshold}%\x1b[0m`);
    }

  }

  return results;
}

module.exports = compareImages;
