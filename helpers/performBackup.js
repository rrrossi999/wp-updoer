const fs = require('fs');
const { Client } = require('ssh2');
const path = require('path');

/**
 * Create a backup of the WordPress database and files for a site.
 * @param {Object} site - The site configuration object.
 * @param {String} outputFolder - The path to the output folder.
 * @param {Boolean} keepBackup - Whether to keep the backup on the server.
 */
async function performBackup(site, outputFolder, keepBackup) {
  return new Promise((resolve, reject) => {
    const client = new Client();

    client
      .on('ready', async () => {
        try {
          const wpPath = site.credentials.path;

          // Create a temporary folder for the backup
          const backupFolder = `${wpPath}/backup`;
          await execAsync(client, `mkdir -p ${backupFolder}`);

          // Backup the database
          const dbBackupFile = `${backupFolder}/database.sql`;
          await execAsync(client, `wp db export ${dbBackupFile} --path=${wpPath}`);

          // Zip the entire WordPress directory
          const siteBackupFile = `${backupFolder}/backup.zip`;
          await execAsync(client, `zip -r ${siteBackupFile} ${wpPath}`);

          // Download the backup ZIP file to the local machine
          const localBackupFile = path.join(outputFolder, 'backup.zip');
          await new Promise((resolve, reject) => {
            client.sftp(async (err, sftp) => {
              if (err) reject(err);

              sftp.fastGet(siteBackupFile, localBackupFile, (err) => {
                if (err) {
                  reject(err);
                } else {
                  console.log(`Downloaded backup of ${site.domain} to ${localBackupFile}`);
                  resolve();
                }
              });
            });
          });

          // Remove the backup from the server if the keepBackup option is false
          if (!keepBackup) {
            await execAsync(client, `rm -r ${backupFolder}`);
            console.log(`Removed backup folder from server for ${site.domain}`);
          }

          client.end();
          resolve();
        } catch (err) {
          client.end();
          reject(err);
        }
      })
      .on('error', (err) => {
        reject(err);
      })
      .connect(site.credentials);
  });
}

/**
 * Helper function to execute a command via SSH using async/await
 * @param {Object} client - The SSH client instance.
 * @param {String} command - The command to execute.
 */
function execAsync(client, command) {
  return new Promise((resolve, reject) => {
    client.exec(command, (err, stream) => {
      if (err) {
        reject(err);
      } else {
        stream
          .on('close', (code, signal) => {
            resolve();
          })
          .on('data', (data) => {
            // Do nothing with the data
          })
          .stderr.on('data', (data) => {
            // Do nothing with the data
          });
      }
    });
  });
}

module.exports = performBackup;
