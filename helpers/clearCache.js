const axios = require('axios');
const { NodeSSH } = require('node-ssh');
const https = require('https');

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

  const ssh = new NodeSSH();

  try {
    console.log(`Connecting to ${site.domain}...`);
    await ssh.connect(site.credentials);
  } catch (error) {
    console.error(`Error connecting to ${site.domain}: ${error.message}`);
    return;
  }
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

  for (const plugin of cachePlugins) {
    // Check if the plugin is active
    const isActive = await ssh.execCommand(`wp plugin is-active ${plugin.name}`);

    // If the plugin is active, run the cache-clearing command
    if (isActive.stdout.trim() === 'Active') {
      await ssh.execCommand(plugin.command);
    }
  }

  ssh.dispose();
}

module.exports = clearCache;