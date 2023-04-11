const { Client } = require('ssh2');
const fs = require('fs');

const execAsync = require('./execAsync');

async function updateSite(site, siteFolder) {
  const ssh = new Client();

  console.log(`Updating ${site.domain}...`);

  const updateCommands = [
    `wp core update --skip-plugins  --skip-themes --path=${site.credentials.path}`,
    `wp plugin update --all --skip-plugins  --skip-themes --path=${site.credentials.path}`,
    `wp theme update --all --skip-plugins  --skip-themes --path=${site.credentials.path}`,
  ];

  // Create a string to append the output from the remote machine to a file
  let output = '';

  ssh
    .on('ready', async () => {
      try {
        // Run the update commands
        for (const command of updateCommands) {
          console.log(`Running "${command}" on ${site.domain}...`);
          const result = await execAsync(ssh, command, site.credentials.path);
          output += `${result.stdout}\n`;
          if (result.stderr) {
            console.error(`Error running "${command}" on ${site.domain}:`, result.stderr);
            output += `${result.stderr}\n`;
          }
        }
        // Save the output from the remote machine to a file
        fs.writeFileSync(`${siteFolder}/updates.txt`, output);
      } catch (error) {
        console.error(`Error updating ${site.domain}: ${error.message}`);
      } finally {
        ssh.end();
      }
    })
    .on('error', (err) => {
      console.error(`Error connecting to ${site.domain}: ${err.message}`);
    })
    .connect(site.credentials);
}


module.exports = updateSite;
