const { Client, Databases } = require('node-appwrite');

module.exports = async function (context, req) {
  // Initialize Appwrite SDK
  const client = new Client();
  const databases = new Databases(client);
  
  // Set up the client with environment variables
  client
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY);
  
  // Get the database ID from environment variables
  const databaseId = process.env.APPWRITE_FUNCTION_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID || 'atSupplyFinder';
  const collectionId = 'systemSettings';
  
  try {
    // Parse the request body - in Appwrite functions, the body is in context.req.body
    const payload = typeof context.req.body === 'string' ? JSON.parse(context.req.body || '{}') : (context.req.body || {});
    const { action, settingsType, settingsData } = payload;
    
    console.log(`Processing ${action} request for ${settingsType}`);
    
    switch (action) {
      case 'fetch':
        // Fetch all system settings
        try {
          const response = await databases.listDocuments(
            databaseId,
            collectionId
          );
          
          // Return all documents in the correct format for Appwrite functions
          return context.res.json({
            success: true,
            data: response.documents
          });
        } catch (error) {
          console.error('Error fetching system settings:', error);
          return context.res.json({
            success: false,
            error: error.message
          });
        }
        break;
        
      case 'update':
        // Update a specific settings document
        if (!settingsType || !settingsData) {
          return context.res.json({
            success: false,
            error: 'Missing settingsType or settingsData'
          });
        }
        
        try {
          // Convert settings data to JSON string
          const settingsDataString = JSON.stringify(settingsData);
          
          // Map full settings type names to document IDs (keeping existing settingsType values)
          const settingsMap = {
            'securitySettings': { id: 'securitySettings' },
            'notificationSettings': { id: 'notificationSettings' },
            'appearanceSettings': { id: 'appearanceSettings' },
            'systemConfiguration': { id: 'systemConfiguration' },
            'databaseSettings': { id: 'databaseSettings' }
          };
          
          // Get the document ID
          const docInfo = settingsMap[settingsType] || { id: settingsType };
          
          // First, get the existing document to preserve its settingsType
          let existingDoc;
          try {
            existingDoc = await databases.getDocument(
              databaseId,
              collectionId,
              docInfo.id
            );
          } catch (getDocError) {
            console.error(`Error getting document ${docInfo.id}:`, getDocError);
            // If we can't get the document, use the settingsType as the settingsType value
            existingDoc = { settingsType: settingsType.replace('Settings', '').toLowerCase() };
          }
          
          // Update the document in Appwrite
          const updatedDoc = await databases.updateDocument(
            databaseId,
            collectionId,
            docInfo.id,
            {
              settingsType: existingDoc.settingsType, // Preserve existing settingsType
              settingsData: settingsDataString
            }
          );
          
          return context.res.json({
            success: true,
            data: updatedDoc
          });
        } catch (error) {
          console.error(`Error updating ${settingsType} settings:`, error);
          return context.res.json({
            success: false,
            error: error.message
          });
        }
        break;
        
      default:
        return context.res.json({
          success: false,
          error: 'Invalid action. Supported actions: fetch, update'
        });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return context.res.json({
      success: false,
      error: error.message
    });
  }
};