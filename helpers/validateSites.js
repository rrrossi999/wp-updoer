const axios = require('axios');
const { Client } = require('ssh2');

/**
 * Check if the domain is valid by making a request.
 * @param {String} domain - The domain to check.
 */
async function checkDomain(domain) {
  try {
    await axios.get(`http://${domain}`);
    return true;
  } catch (error) {
    console.error(error.message);
    return false;
  }
}

/**
 * Check if the SSH credentials are valid by connecting to the server.
 * @param {Object} credentials - The site credentials object.
 */
async function checkCredentials(credentials) {
  return new Promise((resolve, reject) => {
    const client = new Client();

    client
      .on('ready', () => {
        client.end();
        resolve(true);
      })
      .on('error', (err) => {
        reject(err);
      })
      .connect(credentials);
  });
}

/**
 * Validate the sites and their credentials.
 * @param {Object} sites - The sites configuration object.
 */
async function validateSites(sites) {
  for (const siteKey in sites) {
    const site = sites[siteKey];

    const isValidDomain = await checkDomain(site.domain);
    if (!isValidDomain) {
      throw new Error(`Invalid domain: ${site.domain}`);
    }

    try {
      await checkCredentials(site.credentials);
    } catch (error) {
      throw new Error(`Invalid credentials for ${site.domain}: ${error.message}`);
    }
  }
}

module.exports = validateSites;
