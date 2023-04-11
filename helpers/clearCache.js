const axios = require('axios');
const { Client } = require('ssh2');
const https = require('https');

const execAsync = require('./execAsync');

async function clearKinstaCache(siteDomain) {
  try {
    await axios.get(`https://${siteDomain}/kinsta-clear-cache-all`, {
      timeout: 5000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
  } catch (error) {
    console.error(`Failed to clear Kinsta cache for ${siteDomain}:`, error.message);
  }
}

async function clearCache(site) {
  const ssh = new Client();

  const cachePlugins = [
    {
      name: 'wp-super-cache',
      command: 'wp super-cache flush',
    },
    {
      name: 'w3-total-cache',
      command: 'wp w3-total-cache flush all',
    },
    {
      name: 'wp-fastest-cache',
      command: 'wp wp-fastest-cache empty-all',
    },
    {
      name: 'wp-rocket',
      command: 'wp rocket clean --confirm',
    },
    {
      name: 'litespeed-cache',
      command: 'wp litespeed cache_purge all',
    },
  ];

  // Clear Kinsta cache
  await clearKinstaCache(site.domain);

  ssh
    .on('ready', async () => {
      console.log(`Connected to ${site.domain}.`);

      for (const plugin of cachePlugins) {
        // Check if the plugin is active
        const isActive = await execAsync(ssh, `wp plugin is-active ${plugin.name}`);

        // If the plugin is active, run the cache-clearing command
        if (isActive.stdout.trim() === 'Active') {
          await execAsync(ssh, plugin.command);
        }
      }

      ssh.end();
    })
    .on('error', (err) => {
      console.error(`Error connecting to ${site.domain}: ${err.message}`);
    })
    .connect(site.credentials);
}


module.exports = clearCache;

