import { Client, Users, Databases, Query } from 'node-appwrite';

export default async function (req, res) {
  // Initialize the Appwrite SDK
  const client = new Client();
  
  // Validate required environment variables
  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_FUNCTION_DATABASE_ID || 'atSupplyFinder';
  
  console.log('Environment configuration:', {
    endpointExists: !!endpoint,
    projectIdExists: !!projectId,
    apiKeyExists: !!apiKey,
    databaseIdExists: !!databaseId
  });
  
  if (!projectId) {
    console.error('Missing APPWRITE_FUNCTION_PROJECT_ID');
    return res.json({ 
      success: false,
      error: 'Missing project ID configuration'
    });
  }
  
  if (!apiKey) {
    console.error('Missing APPWRITE_API_KEY');
    return res.json({ 
      success: false,
      error: 'Missing API key configuration'
    });
  }

  // Set up the client with your Appwrite project credentials
  client
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const users = new Users(client);
  const databases = new Databases(client);
  
  try {
    // Parse query parameters
    const search = req.query?.search || '';
    const page = parseInt(req.query?.page) || 1;
    const limit = parseInt(req.query?.limit) || 25;
    const offset = (page - 1) * limit;
    
    console.log('Search parameters:', { search, page, limit, offset });
    
    let queries = [];
    
    // DO NOT add search query to avoid fulltext index requirement
    // Just add pagination
    queries.push(Query.limit(limit));
    queries.push(Query.offset(offset));
    
    console.log('Appwrite queries:', queries);
    
    // List users using the server SDK
    const userList = await users.list(queries);
    
    console.log('User list response:', {
      total: userList.total,
      usersCount: userList.users.length
    });
    
    // Get user roles from the userRoles collection
    const rolesResponse = await databases.listDocuments(
      databaseId,
      'userRoles'
    );
    
    // Create a map of user roles for easy lookup
    const userRolesMap = {};
    rolesResponse.documents.forEach(roleDoc => {
      userRolesMap[roleDoc.userId] = roleDoc.role;
    });
    
    // Enhance user data with roles
    let usersWithRoles = userList.users
      .filter(user => user.$id) // Filter out users without IDs
      .map(user => ({
        $id: user.$id,
        email: user.email || 'No email',
        phone: user.phone,
        name: user.name,
        registration: user.registration,
        status: user.status,
        emailVerification: user.emailVerification,
        phoneVerification: user.phoneVerification,
        role: userRolesMap[user.$id] || 'user', // Default to 'user' if no role found
        labels: user.labels,
        passwordUpdate: user.passwordUpdate,
        $createdAt: user.$createdAt,
        $updatedAt: user.$updatedAt,
        accessedAt: user.accessedAt
      }));
      
    // Apply search filter in memory if search term is provided
    if (search) {
      const searchLower = search.toLowerCase();
      usersWithRoles = usersWithRoles.filter(user => 
        user.email && user.email.toLowerCase().includes(searchLower)
      );
      console.log(`Filtered users by email containing '${search}'. Found ${usersWithRoles.length} matches.`);
    }
    
    // Return the enhanced user data
    res.json({
      success: true,
      data: {
        users: usersWithRoles,
        total: search ? usersWithRoles.length : userList.total, // Adjust total count if we filtered
        page: page,
        limit: limit
      }
    });
  } catch (error) {
    console.error('Error listing users:', error);
    // Provide more detailed error information
    res.json({ 
      success: false,
      error: 'Failed to list users',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      code: error.code,
      data: {
        users: [],
        total: 0
      }
    });
  }
};