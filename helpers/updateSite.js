const { NodeSSH } = require('node-ssh');
const fs = require('fs');

async function updateSite(site, siteFolder) {
  const ssh = new NodeSSH();

  try {
    //console.log(`Connecting to ${site.domain}...`);
    await ssh.connect(site.credentials);
  } catch (error) {
    console.error(`Error connecting to ${site.domain}: ${error.message}`);
    return;
  }

  console.log(`Updating ${site.domain}...`);

  try {
    const updateCommands = [
      'wp core update --skip-themes --skip-plugins',
      'wp plugin update --all --skip-themes',
      'wp theme update --all --skip-plugins',
    ];

    // Create a string to append the output from the remote machine to a file
    let output = '';

    // Run the update commands
    for (const command of updateCommands) {
      console.log(`Running "${command}" on ${site.domain}...`);
      const result = await ssh.execCommand(command, { cwd: site.credentials.path });
      //console.log(`Output for "${command}" on ${site.domain}:`, result.stdout);
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
    ssh.dispose();
  }
}

module.exports = updateSite;
