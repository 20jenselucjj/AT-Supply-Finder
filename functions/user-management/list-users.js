import { Client, Users, Databases, Query, ID } from 'node-appwrite';

// Helper function to validate user permissions
async function validateUserPermissions(userId, requiredRole, databases, databaseId, log) {
  try {
    const userRoleDoc = await databases.listDocuments(
      databaseId,
      'userRoles',
      [Query.equal('userId', userId)]
    );
    
    if (userRoleDoc.documents.length === 0) {
      return { valid: false, error: 'User role not found' };
    }
    
    const userRole = userRoleDoc.documents[0].role;
    const roleHierarchy = { 'superadmin': 3, 'admin': 2, 'user': 1 };
    
    if (roleHierarchy[userRole] >= roleHierarchy[requiredRole]) {
      return { valid: true, role: userRole };
    }
    
    return { valid: false, error: 'Insufficient permissions' };
  } catch (err) {
    log('Error validating permissions:', err);
    return { valid: false, error: 'Permission validation failed' };
  }
}

// Helper function to validate email format
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to validate password strength
function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  return { valid: true };
}

// Delete user function
async function deleteUser(requestData, users, databases, databaseId, log, error, res) {
  try {
    const { userId, requestorId } = requestData;
    
    if (!userId) {
      return res.json({ success: false, error: 'User ID is required' }, 400);
    }
    
    if (!requestorId) {
      return res.json({ success: false, error: 'Requestor ID is required for authorization' }, 400);
    }
    
    // Validate requestor permissions
    const permissionCheck = await validateUserPermissions(requestorId, 'admin', databases, databaseId, log);
    if (!permissionCheck.valid) {
      return res.json({ success: false, error: permissionCheck.error }, 403);
    }
    
    // Prevent self-deletion
    if (userId === requestorId) {
      return res.json({ success: false, error: 'Cannot delete your own account' }, 400);
    }
    
    // Check if target user exists and get their role
    const targetUser = await users.get(userId);
    const targetRoleDoc = await databases.listDocuments(
      databaseId,
      'userRoles',
      [Query.equal('userId', userId)]
    );
    
    // Prevent deletion of superadmin by non-superadmin
    if (targetRoleDoc.documents.length > 0) {
      const targetRole = targetRoleDoc.documents[0].role;
      if (targetRole === 'superadmin' && permissionCheck.role !== 'superadmin') {
        return res.json({ success: false, error: 'Cannot delete superadmin user' }, 403);
      }
      
      // Delete user role document
      await databases.deleteDocument(databaseId, 'userRoles', targetRoleDoc.documents[0].$id);
      log(`Deleted role document for user ${userId}`);
    }
    
    // Delete the user
    await users.delete(userId);
    log(`Successfully deleted user ${userId}`);
    
    return res.json({ 
      success: true, 
      message: 'User deleted successfully',
      deletedUserId: userId
    });
    
  } catch (err) {
    error('Error deleting user:', err);
    return res.json({ 
      success: false, 
      error: 'Failed to delete user', 
      message: err.message 
    }, 500);
  }
}

// Add user function
async function addUser(requestData, users, databases, databaseId, log, error, res) {
  try {
    log('Starting addUser function with data:', requestData);
    const { email, password, name, role = 'user', requestorId } = requestData;
    
    if (!email || !password || !name || !requestorId) {
      log('Missing required fields for addUser');
      return res.json({ 
        success: false, 
        error: 'Email, password, name, and requestor ID are required' 
      }, 400);
    }
    
    log('Validating requestor permissions for:', requestorId);
    // Validate requestor permissions
    const permissionCheck = await validateUserPermissions(requestorId, 'admin', databases, databaseId, log);
    log('Permission check result:', permissionCheck);
    if (!permissionCheck.valid) {
      log('Permission check failed:', permissionCheck.error);
      return res.json({ success: false, error: permissionCheck.error }, 403);
    }
    
    // Validate email format
    if (!validateEmail(email)) {
      return res.json({ success: false, error: 'Invalid email format' }, 400);
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.json({ success: false, error: passwordValidation.error }, 400);
    }
    
    // Validate role
    const validRoles = ['user', 'admin', 'superadmin'];
    if (!validRoles.includes(role)) {
      return res.json({ success: false, error: 'Invalid role specified' }, 400);
    }
    
    // Only superadmin can create superadmin users
    if (role === 'superadmin' && permissionCheck.role !== 'superadmin') {
      return res.json({ success: false, error: 'Only superadmin can create superadmin users' }, 403);
    }
    
    // Create the user
    const userId = ID.unique();
    const newUser = await users.create(userId, email, undefined, password, name);
    log(`Created user ${userId} with email ${email}`);
    
    // Create user role document
    await databases.createDocument(
      databaseId,
      'userRoles',
      ID.unique(),
      {
        userId: userId,
        role: role
      }
    );
    log(`Assigned role ${role} to user ${userId}`);
    
    return res.json({ 
      success: true, 
      message: 'User created successfully',
      user: {
        id: newUser.$id,
        email: newUser.email,
        name: newUser.name,
        role: role,
        status: newUser.status
      }
    });
    
  } catch (err) {
    error('Error creating user:', err);
    return res.json({ 
      success: false, 
      error: 'Failed to create user', 
      message: err.message 
    }, 500);
  }
}

// Update user role function
async function updateUserRole(requestData, users, databases, databaseId, log, error, res) {
  try {
    const { userId, newRole, requestorId } = requestData;
    
    if (!userId || !newRole || !requestorId) {
      return res.json({ 
        success: false, 
        error: 'User ID, new role, and requestor ID are required' 
      }, 400);
    }
    
    // Validate requestor permissions
    const permissionCheck = await validateUserPermissions(requestorId, 'admin', databases, databaseId, log);
    if (!permissionCheck.valid) {
      return res.json({ success: false, error: permissionCheck.error }, 403);
    }
    
    // Validate new role
    const validRoles = ['user', 'admin', 'superadmin'];
    if (!validRoles.includes(newRole)) {
      return res.json({ success: false, error: 'Invalid role specified' }, 400);
    }
    
    // Only superadmin can assign superadmin role
    if (newRole === 'superadmin' && permissionCheck.role !== 'superadmin') {
      return res.json({ success: false, error: 'Only superadmin can assign superadmin role' }, 403);
    }
    
    // Prevent self-role modification to lower privilege
    if (userId === requestorId) {
      const roleHierarchy = { 'superadmin': 3, 'admin': 2, 'user': 1 };
      if (roleHierarchy[newRole] < roleHierarchy[permissionCheck.role]) {
        return res.json({ success: false, error: 'Cannot downgrade your own role' }, 400);
      }
    }
    
    // Check if user exists
    await users.get(userId);
    
    // Get current role document
    const currentRoleDoc = await databases.listDocuments(
      databaseId,
      'userRoles',
      [Query.equal('userId', userId)]
    );
    
    if (currentRoleDoc.documents.length === 0) {
      // Create new role document if none exists
      await databases.createDocument(
        databaseId,
        'userRoles',
        ID.unique(),
        {
          userId: userId,
          role: newRole
        }
      );
    } else {
      // Update existing role document
      await databases.updateDocument(
        databaseId,
        'userRoles',
        currentRoleDoc.documents[0].$id,
        { role: newRole }
      );
    }
    
    log(`Updated role for user ${userId} to ${newRole}`);
    
    return res.json({ 
      success: true, 
      message: 'User role updated successfully',
      userId: userId,
      newRole: newRole
    });
    
  } catch (err) {
    error('Error updating user role:', err);
    return res.json({ 
      success: false, 
      error: 'Failed to update user role', 
      message: err.message 
    }, 500);
  }
}

// Change user password function
async function changeUserPassword(requestData, users, databases, databaseId, log, error, res) {
  try {
    const { userId, newPassword, requestorId } = requestData;
    
    if (!userId || !newPassword || !requestorId) {
      return res.json({ 
        success: false, 
        error: 'User ID, new password, and requestor ID are required' 
      }, 400);
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.json({ success: false, error: passwordValidation.error }, 400);
    }
    
    // Check if requestor is changing their own password or has admin privileges
    if (userId !== requestorId) {
      const permissionCheck = await validateUserPermissions(requestorId, 'admin', databases, databaseId, log);
      if (!permissionCheck.valid) {
        return res.json({ success: false, error: 'Insufficient permissions to change other user passwords' }, 403);
      }
    }
    
    // Check if target user exists
    await users.get(userId);
    
    // Update user password
    await users.updatePassword(userId, newPassword);
    log(`Password updated for user ${userId}`);
    
    return res.json({ 
      success: true, 
      message: 'Password updated successfully',
      userId: userId
    });
    
  } catch (err) {
    error('Error changing user password:', err);
    return res.json({ 
      success: false, 
      error: 'Failed to change user password', 
      message: err.message 
    }, 500);
  }
}

export default async function ({ req, res, log, error }) {
  // Initialize the Appwrite SDK for server-side function
  const client = new Client();
  
  // Use server-side environment variables provided by Appwrite functions
  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const databaseId = process.env.APPWRITE_FUNCTION_DATABASE_ID || 'atSupplyFinder';
  
  log('Function initialized with database:', databaseId);
  log('Using endpoint:', endpoint);
  log('Using project ID:', projectId);
  
  if (!projectId) {
    error('Missing APPWRITE_FUNCTION_PROJECT_ID');
    return res.json({ 
      success: false,
      error: 'Missing project ID configuration'
    }, 500);
  }

  const apiKey = process.env.APPWRITE_API_KEY;
  if (!apiKey) {
    error('Missing APPWRITE_API_KEY');
    return res.json({ 
      success: false,
      error: 'Missing API key configuration'
    }, 500);
  }

  // Set up the client for server-side function with API key
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
        log('Raw request body type:', typeof req.body);
        log('Raw request body content:', req.body);
        log('Raw request body length:', req.body ? req.body.length : 'null');
        
        if (typeof req.body === 'string') {
          log('Attempting to parse body as JSON string');
          
          // Try parsing as-is first
          try {
            requestData = JSON.parse(req.body);
            log('Successfully parsed JSON directly');
          } catch (firstError) {
            // If direct parsing fails, try to fix malformed JSON from Appwrite CLI
             if (req.body.startsWith('{') && !req.body.includes('"')) {
               log('Detected malformed JSON, attempting to fix...');
               // Fix unquoted property names and string values
               let fixedBody = req.body
                 // Quote property names
                 .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3')
                 // Quote string values (but not numbers, booleans, or null)
                 .replace(/(:\s*)([^,}\s][^,}]*?)(?=\s*[,}])/g, (match, colon, value) => {
                   const trimmed = value.trim();
                   // Don't quote numbers, booleans, null, or already quoted strings
                   if (/^(\d+|true|false|null|".*")$/.test(trimmed)) {
                     return colon + trimmed;
                   }
                   return colon + '"' + trimmed + '"';
                 });
               log('Fixed JSON:', fixedBody);
               requestData = JSON.parse(fixedBody);
             } else {
               throw firstError;
             }
          }
        } else if (req.body && typeof req.body === 'object') {
          log('Body is already an object');
          requestData = req.body;
        }
        
        log('Successfully parsed request data:', requestData);
      } catch (e) {
        log('Could not parse POST request body as JSON:', e.message);
        log('Error details:', e.stack);
        // Fallback to empty object if parsing fails
        requestData = {};
      }
    } 
    // For GET requests, data is in query parameters
    else if (req.method === 'GET') {
      requestData = req.query || {};
    }
    
    const action = requestData.action || 'list';
    const search = requestData.search || '';
    const page = parseInt(requestData.page) || 1;
    const limit = Math.min(parseInt(requestData.limit) || 25, 100);
    const offset = (page - 1) * limit;
    const requestorId = requestData.requestorId;

    // Handle flat user data parameters for CLI compatibility
    if (action === 'add' && !requestData.userData) {
      requestData.userData = {
        email: requestData.email,
        password: requestData.password,
        name: requestData.name,
        role: requestData.role || 'user'
      };
    }

    log('Parsed request data:', {
      method: req.method,
      action,
      search,
      page,
      limit,
      offset,
      hasUserData: !!requestData.userData
    });
    
    // Handle different actions
    switch (action) {
      case 'delete':
        return await deleteUser(requestData, users, databases, databaseId, log, error, res);
      case 'add':
        return await addUser(requestData, users, databases, databaseId, log, error, res);
      case 'updateRole':
        return await updateUserRole(requestData, users, databases, databaseId, log, error, res);
      case 'changePassword':
        return await changeUserPassword(requestData, users, databases, databaseId, log, error, res);
      case 'list':
      default:
        // Continue with existing list functionality
        break;
    }
    
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