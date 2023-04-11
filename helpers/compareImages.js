// helpers/compareImages.js
const resemble = require('resemblejs');

/**
 * Compare two images and calculate their similarity percentage.
 * @param {String} image1 - The the first image.
 * @param {String} image2 - The the second image.
 * @returns {Promise<number>} A promise that resolves to the similarity percentage.
 */
async function compareImages(image1, image2) {
  return new Promise((resolve, reject) => {
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

module.exports = compareImages;
