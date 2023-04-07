# WP-Updoer

This script automates the process of updating multiple WordPress sites and quickly running before-after comparison analysis to check for potential issues. The script works with a YAML configuration file that lists the domain names, URLs of important pages, and website login credentials for each website.

## Features

1. Takes screenshots of important pages before the update.
2. Updates WordPress core, plugins, and themes using WP-CLI on the website server via SSH.
3. Takes screenshots of important pages after the update.
4. Compares before and after screenshots, calculating their similarity percentage.
5. Alerts if the similarity percentage is below 99%, indicating potential issues.
6. Organizes output files in timestamped folders for easy review.

## Prerequisites

- [Node.js](https://nodejs.org/) (version 12 or higher)

## Installation

1. Clone this repository or download the source code.
2. Navigate to the project folder using a terminal or command prompt.
3. Run the following command to install the required dependencies:

```
npm install
```

4. Copy the `config.sample.yaml` file to a new file named `config.yaml`:

```
cp config.sample.yaml config.yaml
```

5. Update the `config.yaml` file with your websites, website login credentials, and important page URLs.

## Usage

1. Ensure that your `config.yaml` file is set up with the correct information for your websites.
2. Run the following command to start the script:

```
npm start
```

3. The script will perform the bulk update process for each website listed in the `config.yaml` file and store the results in the output folder specified in the configuration.

## Command Line Options

This script supports three optional command-line arguments that provide additional functionality. We have set up npm scripts for easy usage of these options.

1. `npm run dry-run`: Perform a dry run of the update process without actually updating the WordPress core, plugins, or themes. It takes "before" screenshots, outputs a text list of changes that would be made for each website, and saves the output in a timestamped folder with "-dry" appended to its name.

2. `npm run backup`: Create a backup of the WordPress database and files for each site, zip them up, and download the zips to the local machine in the site subfolders. This option is useful for creating backups before performing updates, ensuring you have a fallback in case anything goes wrong during the update process.

3. `npm run keep-backup`: This command is like the one before, except it leaves the backup ZIP files on the server instead of removing them after downloading to the local machine. This option provides flexibility for users who want to keep a copy of the backup files on the server as well.

## Configuration

The `config.yaml` file should include the following information for each website:

- `domain`: The domain name of the website.
- `credentials`: The website login credentials, including the host, username, password, port, and path.
- `pages`: A list of URLs of the important pages to take screenshots and compare.

Here's an example `config.yaml` file:

```yaml
outputFolder: ./output

sites:
example1:
 domain: example1.com
 credentials:
   host: example1.website.cloud
   username: your_website_username
   password: your_website_password
   port: your_website_port
   path: /path/to/wordpress
 pages:
   - https://www.example1.com/
   - https://www.example1.com/about
example2:
 domain: example2.com
 credentials:
   host: example2.website.cloud
   username: your_website_username
   password: your_website_password
   port: your_website_port
   path: /path/to/wordpress
 pages:
   - https://www.example2.com/
   - https://www.example2.com/contact
```

Make sure to replace the placeholders (your_website_username, your_website_password, your_website_port, /path/to/wordpress, etc.) with your actual website login credentials and website information.

## License
This project is licensed under the ISC License.