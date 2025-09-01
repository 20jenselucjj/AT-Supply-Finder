const { Client, Functions } = require('node-appwrite');

// Initialize Appwrite SDK
const client = new Client();
const functions = new Functions(client);

// Set up the client with environment variables
client
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

async function testSystemSettings() {
  try {
    console.log('Testing system settings function...');
    
    // Test fetch action
    console.log('Fetching system settings...');
    const fetchResponse = await functions.createExecution(
      process.env.VITE_APPWRITE_SYSTEM_SETTINGS_FUNCTION_ID,
      JSON.stringify({ action: 'fetch' })
    );
    
    console.log('Fetch response:', fetchResponse.responseBody);
    
    // Parse the response
    const result = JSON.parse(fetchResponse.responseBody);
    if (result.success) {
      console.log('Successfully fetched system settings');
      console.log('Number of settings documents:', result.data.length);
    } else {
      console.error('Failed to fetch system settings:', result.error);
    }
    
    // Test update action with a small change to appearance settings
    console.log('Testing update action...');
    const updateResponse = await functions.createExecution(
      process.env.VITE_APPWRITE_SYSTEM_SETTINGS_FUNCTION_ID,
      JSON.stringify({ 
        action: 'update',
        settingsType: 'appearanceSettings',
        settingsData: {
          defaultTheme: 'system',
          accentColor: 'blue',
          sidebarCollapsed: false,
          densityMode: 'comfortable',
          fontFamily: 'Inter',
          fontSize: 'medium',
          borderRadius: 'medium',
          animationSpeed: 'normal'
        }
      })
    );
    
    console.log('Update response:', updateResponse.responseBody);
    
    // Parse the response
    const updateResult = JSON.parse(updateResponse.responseBody);
    if (updateResult.success) {
      console.log('Successfully updated appearance settings');
    } else {
      console.error('Failed to update appearance settings:', updateResult.error);
    }
    
  } catch (error) {
    console.error('Error testing system settings:', error);
  }
}

// Run the test
testSystemSettings();