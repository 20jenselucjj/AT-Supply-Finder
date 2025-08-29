const { exec } = require('child_process');
const path = require('path');

// Change to the deployment package directory
const deploymentDir = path.join(__dirname, 'deployment-package');
process.chdir(deploymentDir);

// Run npm install
exec('npm install', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error installing dependencies: ${error}`);
    return;
  }
  console.log('Dependencies installed successfully');
  console.log(stdout);
  if (stderr) {
    console.error(stderr);
  }
});