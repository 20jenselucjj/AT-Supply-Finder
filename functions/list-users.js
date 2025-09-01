import { Client, Users, Databases, Query } from 'node-appwrite';

export default async function ({ req, res, log, error }) {
  // Initialize the Appwrite SDK
  const client = new Client();
  
  // Validate required environment variables
  const endpoint = process.env.VITE_APPWRITE_ENDPOINT || process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const apiKey = process.env.VITE_APPWRITE_API_KEY || process.env.APPWRITE_API_KEY;
  const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || process.env.APPWRITE_FUNCTION_DATABASE_ID || 'atSupplyFinder';
  
  log('Environment configuration:', {
    endpointExists: !!endpoint,
    projectIdExists: !!projectId,
    apiKeyExists: !!apiKey,
    databaseIdExists: !!databaseId
  });
  
  if (!projectId) {
    error('Missing VITE_APPWRITE_PROJECT_ID or APPWRITE_FUNCTION_PROJECT_ID');
    return res.json({ 
      success: false,
      error: 'Missing project ID configuration'
    }, 500);
  }
  
  if (!apiKey) {
    error('Missing VITE_APPWRITE_API_KEY or APPWRITE_API_KEY');
    return res.json({ 
      success: false,
      error: 'Missing API key configuration'
    }, 500);
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
    // Handle both GET and POST requests
    let requestData = {};
    
    // For POST requests, data is in the body
    if (req.method === 'POST') {
      try {
        requestData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (e) {
        log('Could not parse POST request body as JSON');
      }
    } 
    // For GET requests, data is in query parameters
    else if (req.method === 'GET') {
      requestData = req.query || {};
    }
    
    const search = requestData.search || '';
    const page = parseInt(requestData.page) || 1;
    const limit = parseInt(requestData.limit) || 25;
    const offset = (page - 1) * limit;
    
    log('Parsed request data:', { method: req.method, search, page, limit, offset });
    
    // Build queries array - DO NOT use search query to avoid fulltext index requirement
    let queries = [];
    
    // Add pagination queries
    queries.push(Query.limit(limit));
    queries.push(Query.offset(offset));
    
    log('Appwrite queries:', queries);
    
    // List users using the server SDK - without search query
    const userList = await users.list(queries);
    
    log('User list response:', {
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
        id: user.$id,
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
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.name && user.name.toLowerCase().includes(searchLower))
      );
      log(`Filtered users by email/name containing '${search}'. Found ${usersWithRoles.length} matches.`);
    }
    
    // Return the enhanced user data
    return res.json({
      success: true,
      data: {
        users: usersWithRoles,
        total: search ? usersWithRoles.length : userList.total, // Adjust total count if we filtered
        page: page,
        limit: limit
      }
    });
  } catch (err) {
    error('Error listing users:', err);
    // Provide more detailed error information
    return res.json({ 
      success: false,
      error: 'Failed to list users',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      code: err.code,
      data: {
        users: [],
        total: 0
      }
    }, 500);
  }
};