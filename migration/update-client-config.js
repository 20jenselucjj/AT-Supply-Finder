// Script to update client configuration from Supabase to Appwrite
const fs = require('fs');
const path = require('path');

// Update the supabase.js file to appwrite.js
const libDir = path.join(__dirname, '..', 'src', 'lib');

// Create appwrite client configuration
const appwriteClientContent = `
import { Client, Account, Databases, Storage, Functions } from 'appwrite';

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export { client };
`;

// Write the new appwrite configuration file
fs.writeFileSync(path.join(libDir, 'appwrite.ts'), appwriteClientContent);
console.log('Created src/lib/appwrite.ts');

// Update environment variables in .env file
const envExamplePath = path.join(__dirname, '..', '.env.example');
let envContent = '';

if (fs.existsSync(envExamplePath)) {
  envContent = fs.readFileSync(envExamplePath, 'utf8');
} else {
  envContent = `# Environment Variables
VITE_APP_TITLE=AT Supply Finder
`;
}

// Add Appwrite environment variables
const appwriteEnvVars = `
# Appwrite Configuration
VITE_APPWRITE_ENDPOINT=http://localhost/v1
VITE_APPWRITE_PROJECT_ID=
`;

// Remove Supabase environment variables if they exist
envContent = envContent.replace(/# Supabase Configuration\\nVITE_SUPABASE_URL=.*\\nVITE_SUPABASE_ANON_KEY=.*\\n\\n/, '');

// Add Appwrite environment variables
if (!envContent.includes('VITE_APPWRITE_ENDPOINT')) {
  envContent += appwriteEnvVars;
}

fs.writeFileSync(envExamplePath, envContent);
console.log('Updated .env.example with Appwrite configuration');

console.log('\\nNext steps:');
console.log('1. Update your .env file with your Appwrite project ID');
console.log('2. Replace imports of supabase with appwrite in your components');
console.log('3. Update authentication logic to use Appwrite Auth');
console.log('4. Modify data fetching to use Appwrite Databases');