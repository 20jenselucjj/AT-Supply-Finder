import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to deploy the Appwrite function
async function deployFunction() {
  try {
    console.log('Deploying list-users function...');
    
    // Change to the function directory
    const functionDir = join(__dirname, 'functions', 'list-users-appwrite-function');
    process.chdir(functionDir);
    
    console.log('Installing dependencies...');
    // Install dependencies
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('Creating deployment package...');
    // Create a tar.gz file of the function
    execSync('tar -czf function-deployment.tar.gz index.js package.json', { stdio: 'inherit' });
    
    console.log('Deployment package created successfully!');
    console.log('You can now deploy this function using the Appwrite dashboard or CLI.');
    
  } catch (error) {
    console.error('Error deploying function:', error);
  }
}

deployFunction();