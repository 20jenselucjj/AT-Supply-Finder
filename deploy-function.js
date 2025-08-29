const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to deploy the Appwrite function
async function deployFunction() {
  try {
    console.log('Deploying list-users function...');
    
    // Change to the function directory
    const functionDir = path.join(__dirname, 'functions', 'list-users-appwrite-function');
    process.chdir(functionDir);
    
    console.log('Installing dependencies...');
    // Install dependencies
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('Creating deployment package...');
    // Create a zip file of the function
    execSync('npm pack', { stdio: 'inherit' });
    
    console.log('Deployment package created successfully!');
    console.log('You can now deploy this function using the Appwrite dashboard or CLI.');
    
  } catch (error) {
    console.error('Error deploying function:', error);
  }
}

deployFunction();