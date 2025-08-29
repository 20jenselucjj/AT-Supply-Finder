// Appwrite Function to list users with their roles
const { Client, Users, Databases, Query } = require('node-appwrite');

module.exports = async function(context) {
  // Initialize the Appwrite SDK
  const client = new Client();
  
  // Set up the client with your Appwrite project credentials
  client
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const users = new Users(client);
  const databases = new Databases(client);
  
  try {
    console.log('Starting execution of list-users function');
    
    // Parse query parameters from the request body
    let search = '';
    let page = 1;
    let limit = 25;
    
    try {
      if (context.req.body) {
        const body = typeof context.req.body === 'string' ? JSON.parse(context.req.body) : context.req.body;
        search = body.search || '';
        page = parseInt(body.page) || 1;
        limit = parseInt(body.limit) || 25;
        console.log('Parsed request body:', { search, page, limit });
      }
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      // Continue with defaults
    }
    
    const offset = (page - 1) * limit;
    
    let queries = [];
    
    // Add search functionality if search term is provided
    if (search) {
      queries.push(Query.search('email', search));
    }
    
    // Add pagination
    queries.push(Query.limit(limit));
    queries.push(Query.offset(offset));
    
    console.log('Fetching users with queries:', queries);
    
    // List users using the server SDK
    const userList = await users.list(queries);
    console.log(`Found ${userList.total} users`);
    
    // Get user roles from the userRoles collection
    const dbId = process.env.APPWRITE_FUNCTION_DATABASE_ID || 'atSupplyFinder';
    console.log(`Using database ID: ${dbId}`);
    
    const rolesResponse = await databases.listDocuments(
      dbId,
      'userRoles'
    );
    
    console.log(`Found ${rolesResponse.documents?.length || 0} user roles`);
    
    // Create a map of user roles for easy lookup
    const userRolesMap = {};
    if (rolesResponse.documents) {
      rolesResponse.documents.forEach(roleDoc => {
        userRolesMap[roleDoc.userId] = roleDoc.role;
      });
    }
    
    // Enhance user data with roles
    const usersArray = Array.isArray(userList.users) ? userList.users : [];
    const usersWithRoles = usersArray.map(user => ({
      id: user.$id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      registration: user.registration,
      status: user.status,
      emailVerification: user.emailVerification,
      phoneVerification: user.phoneVerification,
      role: userRolesMap[user.$id] || 'user', // Default to 'user' if no role found
      labels: user.labels,
      passwordUpdate: user.passwordUpdate,
      createdAt: user.$createdAt,
      updatedAt: user.$updatedAt,
      lastSignInAt: user.accessedAt
    }));
    
    // Return the enhanced user data
    const response = {
      success: true,
      data: {
        users: usersWithRoles,
        total: userList.total || usersWithRoles.length,
        page: page,
        limit: limit
      }
    };
    
    // Send the response using Appwrite's context.res object
    return context.res.json(response);
  } catch (error) {
    console.error('Error listing users:', error);
    const errorResponse = {
      success: false,
      error: 'Failed to list users',
      message: error.message
    };
    return context.res.json(errorResponse);
  }
};