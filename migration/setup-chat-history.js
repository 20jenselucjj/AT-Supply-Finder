import { Client, Databases, Permission, Role, ID } from 'node-appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function setupChatHistoryCollection() {
  const client = new Client();
  
  // Initialize the Appwrite client
  client
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.VITE_APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    console.log('Setting up chatHistory collection...');
    
    // Check if the collection already exists
    try {
      const existingCollection = await databases.getCollection(
        process.env.VITE_APPWRITE_DATABASE_ID,
        'chatHistory'
      );
      console.log('chatHistory collection already exists:', existingCollection.$id);
      return;
    } catch (error) {
      // Collection doesn't exist, we'll create it
      if (error.code !== 404) {
        throw error;
      }
    }

    // Create the chatHistory collection
    const collection = await databases.createCollection(
      process.env.VITE_APPWRITE_DATABASE_ID,
      'chatHistory',
      'Chat History',
      [
        Permission.read(Role.any()),
        Permission.write(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any())
      ]
    );

    console.log('Created chatHistory collection:', collection.$id);

    // Create attributes for the collection
    await databases.createStringAttribute(
      process.env.VITE_APPWRITE_DATABASE_ID,
      'chatHistory',
      'userId',
      255,
      true
    );
    
    await databases.createStringAttribute(
      process.env.VITE_APPWRITE_DATABASE_ID,
      'chatHistory',
      'messages',
      1000000, // Large text size for JSON messages
      true
    );

    console.log('Created attributes for chatHistory collection');

    // Create indexes
    await databases.createIndex(
      process.env.VITE_APPWRITE_DATABASE_ID,
      'chatHistory',
      'userId',
      'key',
      ['userId']
    );

    console.log('Created indexes for chatHistory collection');
    console.log('Chat history collection setup completed successfully!');
  } catch (error) {
    if (error.code === 401 && error.type === 'general_unauthorized_scope') {
      console.error('ERROR: Insufficient permissions to create collection.');
      console.error('The provided API key does not have the required "collections.write" scope.');
      console.error('');
      console.error('To fix this issue:');
      console.error('1. Go to your Appwrite Console');
      console.error('2. Navigate to Project Settings > API Keys');
      console.error('3. Edit your API key and add the "collections.write" scope');
      console.error('4. Or create a new API key with the required scopes:');
      console.error('   - collections.read');
      console.error('   - collections.write');
      console.error('   - attributes.write');
      console.error('   - indexes.write');
      console.error('5. Update your .env file with the new API key');
      console.error('6. Run this script again');
    } else if (error.code === 404) {
      console.error('ERROR: Database not found.');
      console.error('Please check that your VITE_APPWRITE_DATABASE_ID is correct.');
    } else {
      console.error('Error setting up chatHistory collection:', error.message);
    }
    process.exit(1);
  }
}

// Run the setup
console.log('Chat History Collection Setup Script');
console.log('=====================================');
console.log('');

// Check required environment variables
const requiredEnvVars = [
  'VITE_APPWRITE_ENDPOINT',
  'VITE_APPWRITE_PROJECT_ID',
  'VITE_APPWRITE_API_KEY',
  'VITE_APPWRITE_DATABASE_ID'
];

let missingVars = [];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
  }
}

if (missingVars.length > 0) {
  console.error('ERROR: Missing required environment variables:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('');
  console.error('Please set these variables in your .env file and try again.');
  process.exit(1);
}

setupChatHistoryCollection();