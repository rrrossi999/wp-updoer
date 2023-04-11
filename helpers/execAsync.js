/**
 * Helper function to execute a command via SSH using async/await
 * @param {Object} client - The SSH client instance.
 * @param {String} command - The command to execute.
 * @param {String} cwd - The current working directory.
 */
async function execAsync(client, command, cwd = '') {
  return new Promise((resolve, reject) => {
    client.exec(command, { cwd }, (err, stream) => {
      if (err) {
        reject(err);
      } else {
        let stdout = '';
        let stderr = '';
        stream
          .on('close', (code, signal) => {
            resolve({ stdout, stderr });
          })
          .on('data', (data) => {
            stdout += data.toString();
          })
          .stderr.on('data', (data) => {
            stderr += data.toString();
          });
      }
    });
  });
}

module.exports = execAsync;